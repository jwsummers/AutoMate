import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching profile:', err);
        setError(err.message);
        toast.error('Failed to load profile data');
      } else {
        toast.error('Unknown error fetching profile');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success('Profile updated successfully');
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating profile:', err);
        toast.error('Failed to update profile');
      } else {
        toast.error('Unknown error updating profile');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user || !file) return null;

    try {
      setLoading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;
      await updateProfile({ avatar_url: avatarUrl });

      return avatarUrl;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error uploading avatar:', err);
        toast.error('Failed to upload avatar');
      } else {
        toast.error('Unknown error uploading avatar');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
  };
}
