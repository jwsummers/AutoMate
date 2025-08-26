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

const PROFILE_COLS = 'id, full_name, avatar_url, created_at, updated_at';

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
        .select(PROFILE_COLS)
        .eq('id', user.id)
        .single();

      if (error && (error as { code?: string }).code !== 'PGRST116') {
        throw error;
      }

      setProfile((data as Profile) ?? null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to load profile data';
      console.error('Error fetching profile:', err);
      setError(msg);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select(PROFILE_COLS)
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      toast.success('Profile updated successfully');
      return true;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to update profile';
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user || !file) return null;

    try {
      setLoading(true);

      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      // path must start with the user folder to pass RLS policies
      const objectPath = `${user.id}/${fileName}`; // no leading "avatars/" here

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(objectPath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // If bucket is public: use getPublicUrl; if private, use signed URL approach
      const { data: pub } = supabase.storage
        .from('avatars')
        .getPublicUrl(objectPath);
      const avatarUrl = pub.publicUrl;

      await updateProfile({ avatar_url: avatarUrl });
      return avatarUrl;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to upload avatar';
      console.error('Error uploading avatar:', err);
      toast.error('Failed to upload avatar');
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
