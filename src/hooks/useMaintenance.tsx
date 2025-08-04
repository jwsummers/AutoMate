import { useState, useEffect, useCallback } from 'react';
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
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceWithStatus[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const determineStatus = (record: MaintenanceRecord): MaintenanceStatus => {
    if (record.notes && record.notes.includes('COMPLETED:')) {
      return 'completed';
    }

    const today = new Date();
    const recordDate = new Date(record.date);

    return recordDate < today ? 'overdue' : 'upcoming';
  };

  const fetchMaintenanceRecords = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const recordsWithStatus = (data || []).map((record) => ({
        ...record,
        status: determineStatus(record),
      }));

      setMaintenanceRecords(recordsWithStatus);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching maintenance records:', err);
        setError(err.message);
        toast.error('Failed to load maintenance records');
      } else {
        toast.error('Unknown error loading maintenance records');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addMaintenanceRecord = async (
    newRecord: Omit<MaintenanceRecord, 'id'>
  ) => {
    if (!user) return null;

    try {
      setLoading(true);

      const recordWithUserId = {
        ...newRecord,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('maintenance_records')
        .insert([recordWithUserId])
        .select()
        .single();

      if (error) throw error;

      const recordWithStatus = {
        ...data,
        status: determineStatus(data),
      };

      setMaintenanceRecords((prev) => [recordWithStatus, ...prev]);
      toast.success('Maintenance record added successfully');
      return data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error adding maintenance record:', err);
        toast.error('Failed to add maintenance record');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceRecord = async (
    id: string,
    updates: Partial<MaintenanceRecord>
  ) => {
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

      setMaintenanceRecords((prev) =>
        prev.map((record) =>
          record.id === id
            ? {
                ...record,
                ...updates,
                status: determineStatus({ ...record, ...updates }),
              }
            : record
        )
      );

      toast.success('Maintenance record updated successfully');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating maintenance record:', err);
        toast.error('Failed to update maintenance record');
      }
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

      setMaintenanceRecords((prev) =>
        prev.filter((record) => record.id !== id)
      );
      toast.success('Maintenance record deleted successfully');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error deleting maintenance record:', err);
        toast.error('Failed to delete maintenance record');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markMaintenanceAsCompleted = async (id: string) => {
    if (!user) return false;

    try {
      const { data: record, error: fetchError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const completionMarker = `COMPLETED: ${new Date().toISOString()}`;

      const notesUpdate = record.notes
        ? record.notes.includes('COMPLETED:')
          ? record.notes
          : `${record.notes}\n${completionMarker}`
        : completionMarker;

      const { error } = await supabase
        .from('maintenance_records')
        .update({ notes: notesUpdate })
        .eq('id', id);

      if (error) throw error;

      setMaintenanceRecords((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                notes: notesUpdate,
                status: 'completed' as MaintenanceStatus,
              }
            : item
        )
      );

      toast.success('Maintenance marked as completed');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error marking maintenance as completed:', err);
        toast.error('Failed to update maintenance status');
      }
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
  }, [user, fetchMaintenanceRecords]);

  return {
    maintenanceRecords,
    loading,
    error,
    fetchMaintenanceRecords,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    markMaintenanceAsCompleted,
  };
}
