
import { useState, useEffect } from 'react';
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

  const fetchVehicles = async () => {
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
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      setError(error.message);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (newVehicle: Omit<Vehicle, 'id'>) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      // Make sure user_id is set
      const vehicleWithUserId = {
        ...newVehicle,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleWithUserId])
        .select()
        .single();
      
      if (error) throw error;
      
      setVehicles(prev => [data, ...prev]);
      toast.success('Vehicle added successfully');
      return data;
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
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
      
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      ));
      
      toast.success('Vehicle updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast.error('Failed to update vehicle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      toast.success('Vehicle deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
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
  }, [user]);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };
}
