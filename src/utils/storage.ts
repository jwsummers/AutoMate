// src/utils/storage.ts
import { supabase } from '@/integrations/supabase/client';

const VEHICLE_BUCKET = 'vehicle-images';

// Enable verbose logs with ?debugMedia=1
const DEBUG_MEDIA =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debugMedia') === '1';

const dlog = (...args: unknown[]) => {
  if (DEBUG_MEDIA) console.log('[media]', ...args);
};

/** What we care about from Storage list() */
interface ListedObject {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

/** Prefer a signed URL (private bucket); fallback to public URL (public bucket) */
async function toUrl(path: string): Promise<string | null> {
  const bucket = supabase.storage.from(VEHICLE_BUCKET);

  const { data: signed, error: sErr } = await bucket.createSignedUrl(path, 60 * 60);
  if (!sErr && signed?.signedUrl) return signed.signedUrl;

  if (sErr && DEBUG_MEDIA) dlog('toUrl:signed-error', sErr);
  const { data: pub } = bucket.getPublicUrl(path);
  return pub.publicUrl || null;
}

/**
 * Upload a vehicle image to:
 *   vehicle-images/<user_id>/<vehicle_id>/vehicle-<timestamp>.<ext>
 * Returns { path, url } where url is signed (if private) or public URL.
 */
export async function uploadVehicleImage(
  file: File,
  userId: string,
  vehicleId: string
): Promise<{ path: string; url: string } | null> {
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `vehicle-${Date.now()}.${ext}`;
    const objectPath = `${userId}/${vehicleId}/${fileName}`;

    dlog('uploadVehicleImage:put', { bucket: VEHICLE_BUCKET, objectPath });

    const { error: uploadErr } = await supabase
      .storage
      .from(VEHICLE_BUCKET)
      .upload(objectPath, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: file.type || 'image/jpeg',
      });

    if (uploadErr) {
      dlog('uploadVehicleImage:error', uploadErr);
      throw uploadErr;
    }

    const url = await toUrl(objectPath);
    dlog('uploadVehicleImage:done', { objectPath, urlPreview: url?.slice(0, 100) + '…' });
    return url ? { path: objectPath, url } : { path: objectPath, url: '' };
  } catch (e) {
    dlog('uploadVehicleImage:exception', e);
    return null;
  }
}

/**
 * Find the latest image for a vehicle by listing the folder
 *   vehicle-images/<user_id>/<vehicle_id>/
 */
export async function getVehicleImageUrl(
  userId: string,
  vehicleId: string
): Promise<string | null> {
  const prefix = `${userId}/${vehicleId}`;

  dlog('getVehicleImageUrl:list', { bucket: VEHICLE_BUCKET, prefix });

  // list() is non-recursive; we upload directly into this folder, so this is sufficient.
  const { data: files, error } = await supabase.storage.from(VEHICLE_BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: 'updated_at', order: 'desc' }, // safest available sort
  });

  if (error) {
    dlog('getVehicleImageUrl:list-error', error);
    return null;
  }

  if (!files || files.length === 0) {
    dlog('getVehicleImageUrl:no-files');
    return null;
  }

  // Prefer common image extensions and newest first (as listed)
  const isImage = (n: string) => /\.(png|jpe?g|webp|gif|heic|bmp)$/i.test(n);
  const firstImage = (files as ListedObject[]).find((f) => isImage(f.name)) || files[0];

  const fullPath = `${prefix}/${firstImage.name}`;
  dlog('getVehicleImageUrl:hit', fullPath);

  return toUrl(fullPath);
}

/**
 * Delete ALL images under:
 *   vehicle-images/<user_id>/<vehicle_id>/...
 * Returns the number of files removed.
 */
export async function deleteVehicleImage(
  userId: string,
  vehicleId: string
): Promise<number> {
  const prefix = `${userId}/${vehicleId}`;
  dlog('deleteVehicleImage:list', { prefix });

  const { data: files, error } = await supabase.storage.from(VEHICLE_BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    dlog('deleteVehicleImage:list-error', error);
    return 0;
  }

  if (!files || files.length === 0) {
    dlog('deleteVehicleImage:nothing-to-delete');
    return 0;
  }

  const paths = (files as ListedObject[]).map((f) => `${prefix}/${f.name}`);
  dlog('deleteVehicleImage:remove', { count: paths.length });

  const { error: removeErr } = await supabase.storage.from(VEHICLE_BUCKET).remove(paths);
  if (removeErr) {
    dlog('deleteVehicleImage:remove-error', removeErr);
    throw removeErr;
  }

  dlog('deleteVehicleImage:done', { removed: paths.length });
  return paths.length;
}
