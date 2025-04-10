
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  date: string;
  mileage?: number | null;
  cost?: number | null;
  performed_by?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export type MaintenanceStatus = 'completed' | 'upcoming' | 'overdue';

export interface MaintenanceWithStatus extends MaintenanceRecord {
  status: MaintenanceStatus;
}

export function useMaintenance() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const determineStatus = (record: MaintenanceRecord): MaintenanceStatus => {
    // Check if the record is marked as completed in the notes
    if (record.notes && record.notes.includes('COMPLETED:')) {
      return 'completed';
    }
    
    const today = new Date();
    const recordDate = new Date(record.date);
    
    // If the date is in the past and not marked as completed, consider it overdue
    if (recordDate < today) {
      return 'overdue';
    } else {
      return 'upcoming';
    }
  };

  const fetchMaintenanceRecords = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Add status to each record
      const recordsWithStatus = (data || []).map(record => ({
        ...record,
        status: determineStatus(record)
      }));
      
      setMaintenanceRecords(recordsWithStatus);
    } catch (error: any) {
      console.error('Error fetching maintenance records:', error);
      setError(error.message);
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const addMaintenanceRecord = async (newRecord: Omit<MaintenanceRecord, 'id'>) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      // Make sure user_id is set
      const recordWithUserId = {
        ...newRecord,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert([recordWithUserId])
        .select()
        .single();
      
      if (error) throw error;
      
      const recordWithStatus = {
        ...data,
        status: determineStatus(data)
      };
      
      setMaintenanceRecords(prev => [recordWithStatus, ...prev]);
      toast.success('Maintenance record added successfully');
      return data;
    } catch (error: any) {
      console.error('Error adding maintenance record:', error);
      toast.error('Failed to add maintenance record');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceRecord = async (id: string, updates: Partial<MaintenanceRecord>) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setMaintenanceRecords(prev => prev.map(record => 
        record.id === id ? { 
          ...record, 
          ...updates,
          status: determineStatus({ ...record, ...updates })
        } : record
      ));
      
      toast.success('Maintenance record updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating maintenance record:', error);
      toast.error('Failed to update maintenance record');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMaintenanceRecord = async (id: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
      toast.success('Maintenance record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting maintenance record:', error);
      toast.error('Failed to delete maintenance record');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markMaintenanceAsCompleted = async (id: string) => {
    if (!user) return false;
    
    try {
      // Fetch the current record to get its data
      const { data: record, error: fetchError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Create a completion marker with timestamp
      const completionMarker = `COMPLETED: ${new Date().toISOString()}`;
      
      // Prepare the notes update
      const notesUpdate = record.notes 
        ? (record.notes.includes('COMPLETED:') ? record.notes : `${record.notes}\n${completionMarker}`)
        : completionMarker;
      
      // Update the record with the completion marker
      const { error } = await supabase
        .from('maintenance_records')
        .update({ notes: notesUpdate })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update in the local state
      setMaintenanceRecords(prev => prev.map(item => 
        item.id === id ? { ...item, notes: notesUpdate, status: 'completed' as MaintenanceStatus } : item
      ));
      
      toast.success('Maintenance marked as completed');
      return true;
    } catch (error: any) {
      console.error('Error marking maintenance as completed:', error);
      toast.error('Failed to update maintenance status');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMaintenanceRecords();
    } else {
      setMaintenanceRecords([]);
      setLoading(false);
    }
  }, [user]);

  return {
    maintenanceRecords,
    loading,
    error,
    fetchMaintenanceRecords,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    markMaintenanceAsCompleted
  };
}
