
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VEHICLE_IMAGES_BUCKET = 'vehicle-images';

export async function uploadVehicleImage(file: File, userId: string, vehicleId: string): Promise<string | null> {
  try {
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${vehicleId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error('Failed to upload image');
    return null;
  }
}

export async function deleteVehicleImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    
    // Find the path after the bucket name in the URL
    // URL structure: /storage/v1/object/public/vehicle-images/path/to/file
    const bucketIndex = pathSegments.indexOf('vehicle-images');
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL format');
    }
    
    const filePath = pathSegments.slice(bucketIndex + 1).join('/');

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
