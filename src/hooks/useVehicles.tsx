import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getVehicleImageUrl } from '@/utils/storage';

// Debug toggle: visit any page with ?debugMedia=1 to enable logs
const DEBUG_MEDIA =
  new URLSearchParams(window.location.search).get('debugMedia') === '1';
const dlog = (...args: unknown[]) => {
  if (DEBUG_MEDIA) console.log('[media]', ...args);
};

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string | null;
  license_plate: string | null;
  vin: string | null;
  notes: string | null;
  image?: string | null; // UI-only (or legacy DB column fallback)
  created_at?: string;
  updated_at?: string;
}

// NOTE: no 'image' in SELECT list — types don’t include it in your schema
const VEHICLE_COLS =
  'id, user_id, make, model, year, mileage, color, license_plate, vin, notes, created_at, updated_at';

const LIST_LIMIT = 200;
const VEHICLE_BUCKET = 'vehicle-images';

// If you previously had a real 'image' column, we'll accept it at runtime:
type VehicleMaybeWithImage = Vehicle & { image?: string | null };

/** Try to produce a usable URL for a vehicle image.
 *  1) If a DB/legacy `image` URL exists, use it
 *  2) Else look in Storage: `vehicle-images/<userId>/<vehicleId>/...`
 *     - Prefer a signed URL (works for private buckets)
 *     - Fallback to public URL (if bucket is public)
 */
async function resolveVehicleImageUrl(v: Vehicle & { image?: string | null }) {
  dlog('resolveVehicleImageUrl:start', {
    id: v.id,
    user_id: v.user_id,
    legacy: v.image,
  });

  // 1) Legacy/DB column still present? use it.
  if (typeof v.image === 'string' && v.image.trim().length > 0) {
    dlog('resolveVehicleImageUrl:using-legacy', v.image);
    return v.image;
  }

  const folder = `${v.user_id}/${v.id}`;
  dlog('resolveVehicleImageUrl:list', { bucket: 'vehicle-images', folder });

  const { data: files, error: listErr } = await supabase.storage
    .from('vehicle-images')
    .list(folder, {
      limit: 1,
      sortBy: { column: 'updated_at', order: 'desc' },
    });

  if (listErr) {
    dlog('resolveVehicleImageUrl:list-error', listErr);
    return null;
  }
  dlog('resolveVehicleImageUrl:list-ok', {
    count: files?.length ?? 0,
    names: files?.map((f) => f.name),
  });

  if (!files || files.length === 0) {
    dlog('resolveVehicleImageUrl:no-files');
    return null;
  }

  const fileName = files[0].name;
  const path = `${folder}/${fileName}`;
  dlog('resolveVehicleImageUrl:path', path);

  // Try signed URL (works for private buckets)
  const { data: signed, error: signErr } = await supabase.storage
    .from('vehicle-images')
    .createSignedUrl(path, 60 * 60); // 1h

  if (!signErr && signed?.signedUrl) {
    dlog(
      'resolveVehicleImageUrl:signed-ok',
      signed.signedUrl.slice(0, 100) + '…'
    );
    return signed.signedUrl;
  }
  if (signErr) dlog('resolveVehicleImageUrl:signed-error', signErr);

  // Fallback to public URL (for public buckets)
  const { data: pub } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(path);
  dlog('resolveVehicleImageUrl:public', pub?.publicUrl ?? null);
  return pub?.publicUrl ?? null;
}

// Prefer any existing (legacy) image string on the row; otherwise resolve from Storage.
async function hydrateVehicleImages(rows: VehicleMaybeWithImage[]) {
  const mapped = await Promise.all(
    rows.map(async (v) => {
      const existing =
        typeof v.image === 'string' && v.image.trim().length > 0
          ? v.image
          : null;

      const resolved = existing ?? (await getVehicleImageUrl(v.user_id, v.id));
      return { ...v, image: resolved ?? null };
    })
  );

  // keep your existing return shape if callers expect Vehicle[]
  return mapped as Vehicle[];
}

export function useVehicles() {
  const { user, subscriptionData } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('vehicles')
        .select(VEHICLE_COLS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT);

      if (error) throw error;

      const base = (data as VehicleMaybeWithImage[]) ?? [];
      const withImages = await hydrateVehicleImages(base);
      setVehicles(withImages);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to load vehicles';
      console.error('Error fetching vehicles:', err);
      setError(msg);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addVehicle = useCallback(
    async (toInsert: Omit<Vehicle, 'id' | 'user_id'>) => {
      if (!user) return null;
      try {
        setLoading(true);

        // ---- Soft limit gate (client-side) ----
        // Negative limit means "unlimited". Default Free = 1 if not loaded.
        const limit = subscriptionData?.vehicles_limit ?? 1;
        if (limit >= 0) {
          const { count, error: countErr } = await supabase
            .from('vehicles')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (countErr) throw countErr;
          if ((count ?? 0) >= limit) {
            toast.error(
              limit === 1
                ? 'Free plan limit reached: 1 vehicle.'
                : `Plan limit reached: ${limit} vehicles.`
            );
            return null;
          }
        }
        // ---------------------------------------

        const payload = { ...toInsert, user_id: user.id };
        const { data, error } = await supabase
          .from('vehicles')
          .insert(payload)
          .select(VEHICLE_COLS)
          .single();

        if (error) throw error;

        const created = data as VehicleMaybeWithImage;
        const image = await resolveVehicleImageUrl(created);
        const createdWithImage: Vehicle = { ...created, image };

        setVehicles((prev) => [createdWithImage, ...prev]);
        toast.success('Vehicle added successfully');
        return createdWithImage;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to add vehicle';
        console.error('Error adding vehicle:', err);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, subscriptionData]
  );

  const updateVehicle = useCallback(
    async (id: string, updates: Partial<Omit<Vehicle, 'id' | 'user_id'>>) => {
      if (!user) return false;
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('vehicles')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select(VEHICLE_COLS)
          .single();

        if (error) throw error;

        const updated = data as VehicleMaybeWithImage;
        const image = await resolveVehicleImageUrl(updated);
        const updatedWithImage: Vehicle = { ...updated, image };

        setVehicles((prev) =>
          prev.map((v) => (v.id === id ? updatedWithImage : v))
        );
        toast.success('Vehicle updated successfully');
        return true;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to update vehicle';
        console.error('Error updating vehicle:', err);
        toast.error('Failed to update vehicle');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      if (!user) return false;
      try {
        setLoading(true);

        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setVehicles((prev) => prev.filter((v) => v.id !== id));
        toast.success('Vehicle deleted successfully');
        return true;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to delete vehicle';
        console.error('Error deleting vehicle:', err);
        toast.error('Failed to delete vehicle');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchVehicles();
    } else {
      setVehicles([]);
      setLoading(false);
    }
  }, [user, fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
}
