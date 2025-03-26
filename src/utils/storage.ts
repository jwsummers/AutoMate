
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VEHICLE_IMAGES_BUCKET = 'vehicle-images';

export async function uploadVehicleImage(file: File, userId: string, vehicleId: string): Promise<string | null> {
  try {
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${vehicleId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Check if bucket exists, if not, this will be handled by RLS policies
    const { error: uploadError } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error('Failed to upload image');
    return null;
  }
}

export async function deleteVehicleImage(imagePath: string): Promise<boolean> {
  try {
    // Extract the path from the URL
    const url = new URL(imagePath);
    const pathWithBucket = url.pathname;
    // Remove the /storage/v1/object/public/ prefix and the bucket name
    const pathParts = pathWithBucket.split('/');
    const filePath = pathParts.slice(5).join('/'); // Adjust this index based on your URL structure

    const { error } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting image:', error);
    toast.error('Failed to delete image');
    return false;
  }
}
