import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  date: string; // yyyy-MM-dd
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

const MAINT_COLUMNS =
  'id, vehicle_id, type, description, date, mileage, cost, performed_by, notes, created_at, updated_at, user_id';

const LIST_LIMIT = 500;

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
        .select(MAINT_COLUMNS)
        .eq('user_id', user.id) // keep payload scoped even if RLS already enforces it
        .order('date', { ascending: false })
        .limit(LIST_LIMIT);

      if (error) throw error;

      const recordsWithStatus: MaintenanceWithStatus[] = (data ?? []).map(
        (r) => ({
          ...(r as MaintenanceRecord),
          status: determineStatus(r as MaintenanceRecord),
        })
      );

      setMaintenanceRecords(recordsWithStatus);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to load maintenance records';
      console.error('Error fetching maintenance records:', err);
      setError(msg);
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addMaintenanceRecord = useCallback(
    async (newRecord: Omit<MaintenanceRecord, 'id'>) => {
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
          .select(MAINT_COLUMNS)
          .single();

        if (error) throw error;

        const created = data as MaintenanceRecord;

        const recordWithStatus: MaintenanceWithStatus = {
          ...created,
          status: determineStatus(created),
        };

        setMaintenanceRecords((prev) => [recordWithStatus, ...prev]);
        toast.success('Maintenance record added successfully');
        return created;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to add maintenance record';
        console.error('Error adding maintenance record:', err);
        toast.error('Failed to add maintenance record');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateMaintenanceRecord = useCallback(
    async (id: string, updates: Partial<MaintenanceRecord>) => {
      if (!user) return false;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('maintenance_records')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select(MAINT_COLUMNS)
          .single();

        if (error) throw error;

        const updated = data as MaintenanceRecord;

        setMaintenanceRecords((prev) =>
          prev.map((record) =>
            record.id === id
              ? { ...updated, status: determineStatus(updated) }
              : record
          )
        );

        toast.success('Maintenance record updated successfully');
        return true;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to update maintenance record';
        console.error('Error updating maintenance record:', err);
        toast.error('Failed to update maintenance record');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const deleteMaintenanceRecord = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        setLoading(true);

        const { error } = await supabase
          .from('maintenance_records')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setMaintenanceRecords((prev) =>
          prev.filter((record) => record.id !== id)
        );
        toast.success('Maintenance record deleted successfully');
        return true;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to delete maintenance record';
        console.error('Error deleting maintenance record:', err);
        toast.error('Failed to delete maintenance record');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const markMaintenanceAsCompleted = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        // Light fetch to read existing notes (no * payload)
        const { data: existing, error: fetchError } = await supabase
          .from('maintenance_records')
          .select('id, notes')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const completionMarker = `COMPLETED: ${new Date().toISOString()}`;

        const notesUpdate = existing?.notes
          ? existing.notes.includes('COMPLETED:')
            ? existing.notes
            : `${existing.notes}\n${completionMarker}`
          : completionMarker;

        const { data, error } = await supabase
          .from('maintenance_records')
          .update({ notes: notesUpdate })
          .eq('id', id)
          .eq('user_id', user.id)
          .select(MAINT_COLUMNS)
          .single();

        if (error) throw error;

        const updated = data as MaintenanceRecord;

        setMaintenanceRecords((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...updated, status: 'completed' as MaintenanceStatus }
              : item
          )
        );

        toast.success('Maintenance marked as completed');
        return true;
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to update maintenance status';
        console.error('Error marking maintenance as completed:', err);
        toast.error('Failed to update maintenance status');
        return false;
      }
    },
    [user]
  );

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
