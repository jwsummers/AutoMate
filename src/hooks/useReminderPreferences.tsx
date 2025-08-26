import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ReminderPreferences {
  id: string;
  user_id: string;
  email_reminders: boolean;
  push_reminders: boolean;
  reminder_days_before: number[];
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

const PREF_COLUMNS =
  'id, user_id, email_reminders, push_reminders, reminder_days_before, last_reminded_at, created_at, updated_at';

export function useReminderPreferences() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reminder_preferences')
        .select(PREF_COLUMNS)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setPreferences(data as ReminderPreferences);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching reminder preferences:', err);
        setError(err.message);
      } else {
        console.error('Unknown error fetching preferences');
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreferences = async (
    updates: Partial<
      Omit<ReminderPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    >
  ) => {
    if (!user) return false;

    try {
      setLoading(true);

      const preferenceData = {
        user_id: user.id,
        ...updates,
      };

      // No need to .select(); let RLS return nothing and refresh via fetchPreferences()
      const { error } = await supabase
        .from('reminder_preferences')
        .upsert(preferenceData, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Reminder preferences updated successfully');
      // Refresh from source of truth
      await fetchPreferences();
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating reminder preferences:', err);
        toast.error('Failed to update reminder preferences');
      } else {
        toast.error('Unknown error updating preferences');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendTestReminder = async () => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase.functions.invoke(
        'send-maintenance-reminder',
        {
          body: { userId: user.id, forceEmail: true },
        }
      );

      if (error) throw error;

      toast.success('Test reminder sent successfully');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error sending test reminder:', err);
        toast.error('Failed to send test reminder');
      } else {
        toast.error('Unknown error sending reminder');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user, fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    sendTestReminder,
  };
}
