
import { useState, useEffect } from 'react';
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

export function useReminderPreferences() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('reminder_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setPreferences(data as ReminderPreferences);
      }
    } catch (error: any) {
      console.error('Error fetching reminder preferences:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<Omit<ReminderPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const preferenceData = {
        user_id: user.id,
        ...updates
      };
      
      const { error } = await supabase
        .from('reminder_preferences')
        .upsert(preferenceData)
        .select();
      
      if (error) throw error;
      
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Reminder preferences updated successfully');
      
      return true;
    } catch (error: any) {
      console.error('Error updating reminder preferences:', error);
      toast.error('Failed to update reminder preferences');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendTestReminder = async () => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('send-maintenance-reminder', {
        body: { userId: user.id, forceEmail: true },
      });
      
      if (error) throw error;
      
      toast.success('Test reminder sent successfully');
      return true;
    } catch (error: any) {
      console.error('Error sending test reminder:', error);
      toast.error('Failed to send test reminder');
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
  }, [user]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    sendTestReminder
  };
}
