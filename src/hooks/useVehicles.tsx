import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  image?: string;
  mileage: number | null;
  color?: string | null;
  license_plate?: string | null;
  vin?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVehicles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching vehicles:', err);
        setError(err.message);
        toast.error('Failed to load vehicles');
      } else {
        toast.error('Unknown error loading vehicles');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addVehicle = async (newVehicle: Omit<Vehicle, 'id'>) => {
    if (!user) return null;

    try {
      setLoading(true);

      const vehicleWithUserId = {
        ...newVehicle,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleWithUserId])
        .select()
        .single();

      if (error) throw error;

      setVehicles((prev) => [data, ...prev]);
      toast.success('Vehicle added successfully');
      return data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error adding vehicle:', err);
        toast.error('Failed to add vehicle');
      } else {
        toast.error('Unknown error adding vehicle');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === id ? { ...vehicle, ...updates } : vehicle
        )
      );

      toast.success('Vehicle updated successfully');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating vehicle:', err);
        toast.error('Failed to update vehicle');
      } else {
        toast.error('Unknown error updating vehicle');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase.from('vehicles').delete().eq('id', id);

      if (error) throw error;

      setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
      toast.success('Vehicle deleted successfully');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error deleting vehicle:', err);
        toast.error('Failed to delete vehicle');
      } else {
        toast.error('Unknown error deleting vehicle');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

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
