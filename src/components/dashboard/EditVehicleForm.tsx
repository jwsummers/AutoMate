
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, Upload } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/AuthContext';
import { uploadVehicleImage, deleteVehicleImage } from '@/utils/storage';

interface EditVehicleFormProps {
  vehicle: Vehicle;
  onSubmit: (data: Partial<Vehicle>) => Promise<boolean>;
  onCancel: () => void;
}

const EditVehicleForm = ({ vehicle, onSubmit, onCancel }: EditVehicleFormProps) => {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.mileage,
    color: vehicle.color || '',
    license_plate: vehicle.license_plate || '',
    vin: vehicle.vin || '',
    notes: vehicle.notes || '',
    image: vehicle.image
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(vehicle.image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      color: vehicle.color || '',
      license_plate: vehicle.license_plate || '',
      vin: vehicle.vin || '',
      notes: vehicle.notes || '',
      image: vehicle.image
    });
    setImagePreview(vehicle.image || null);
    setImageFile(null);
    setImageChanged(false);
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' ? Number(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageChanged(true);
    setFormData(prev => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const updates: Partial<Vehicle> = { ...formData };
      
      // Handle image changes
      if (imageChanged) {
        // If there was an old image and it's being removed or replaced
        if (vehicle.image) {
          await deleteVehicleImage(vehicle.image);
        }
        
        // If there's a new image to upload
        if (imageFile) {
          const imageUrl = await uploadVehicleImage(imageFile, user.id, vehicle.id);
          if (imageUrl) {
            updates.image = imageUrl;
          }
        } else {
          // Image was removed and not replaced
          updates.image = null;
        }
      }
      
      await onSubmit(updates);
    } catch (error) {
      console.error('Error updating vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form className="space-y-4 p-1" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Make*</label>
            <Input
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
              placeholder="e.g. Toyota"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model*</label>
            <Input
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
              placeholder="e.g. Camry"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Year*</label>
            <Input
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              required
              min={1900}
              max={new Date().getFullYear() + 1}
              className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
              placeholder="e.g. 2020"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Mileage</label>
            <Input
              name="mileage"
              type="number"
              value={formData.mileage || ''}
              onChange={handleChange}
              min={0}
              className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
              placeholder="e.g. 45000"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <Input
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
              placeholder="e.g. Blue"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">License Plate</label>
            <Input
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
              placeholder="e.g. ABC123"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">VIN (Optional)</label>
          <Input
            name="vin"
            value={formData.vin}
            onChange={handleChange}
            className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
            placeholder="Vehicle Identification Number"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes (Optional)</label>
          <Textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none resize-none h-16"
            placeholder="Additional information about this vehicle..."
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle Photo (Optional)</label>
          <div 
            className="relative border border-dashed border-white/20 rounded-md p-4 text-center cursor-pointer hover:border-neon-blue/50 transition-colors"
            onClick={() => document.getElementById('vehicle-image-edit')?.click()}
          >
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Vehicle preview" 
                  className="w-full h-32 sm:h-40 object-cover rounded-md mx-auto"
                />
                <button 
                  type="button"
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <Car className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-foreground/70">
                  Drag and drop an image or <span className="text-neon-blue">browse</span>
                </p>
                <div className="mt-2 flex items-center justify-center">
                  <Upload className="w-4 h-4 mr-2 text-neon-blue" />
                  <span className="text-xs text-neon-blue">Select Image</span>
                </div>
              </>
            )}
            <input
              id="vehicle-image-edit"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10 mt-6">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
            className="border-white/10 hover:bg-white/5 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditVehicleForm;
