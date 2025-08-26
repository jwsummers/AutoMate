import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Car, Upload } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/AuthContext';
import { uploadVehicleImage } from '@/utils/storage';

type FormState = {
  make: string;
  model: string;
  year: number | '';
  mileage: number | '';
  color: string;
  license_plate: string;
  vin: string;
  notes: string;
};

interface AddVehicleFormProps {
  onSubmit: (data: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  onCancel: () => void;
}

const currentYear = new Date().getFullYear();

const AddVehicleForm = ({ onSubmit, onCancel }: AddVehicleFormProps) => {
  const [formData, setFormData] = useState<FormState>({
    make: '',
    model: '',
    year: currentYear,
    mileage: 0,
    color: '',
    license_plate: '',
    vin: '',
    notes: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // use a ref instead of document.getElementById
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // revoke object URL when preview changes
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'year') {
      const num: number | '' = value === '' ? '' : Number(value);
      setFormData((prev) => ({ ...prev, year: num }));
      return;
    }
    if (name === 'mileage') {
      const num: number | '' = value === '' ? '' : Number(value);
      setFormData((prev) => ({ ...prev, mileage: num }));
      return;
    }

    // other string fields
    const field = name as Exclude<keyof FormState, 'year' | 'mileage'>;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    // Use object URL for perf
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Normalize numbers in case user clears then refocuses
      const payload = {
        ...formData,
        year:
          typeof formData.year === 'number'
            ? formData.year
            : Number(formData.year || currentYear),
        mileage:
          typeof formData.mileage === 'number'
            ? formData.mileage
            : Number(formData.mileage || 0),
      } as Omit<Vehicle, 'id'>;

      const newVehicle = await onSubmit(payload);

      if (imageFile && newVehicle?.id) {
        const imageUrl = await uploadVehicleImage(
          imageFile,
          user.id,
          newVehicle.id
        );
        // If you need to persist imageUrl on vehicle, call your update mutation here.
        // await updateVehicleImage(newVehicle.id, imageUrl)
      }
      // (Optional) reset form or close the dialog from parent
    } catch (error) {
      console.error('Error adding vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex h-full min-h-0 w-full max-w-2xl flex-col bg-transparent'
      role='form'
      aria-label='Add new vehicle'
    >
      {/* Scrollable fields */}
      <div className='flex-1 min-h-0 overflow-y-auto pr-1 space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Make*</label>
            <Input
              name='make'
              value={formData.make}
              onChange={handleChange}
              required
              autoComplete='organization'
              className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
              placeholder='e.g. Toyota'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Model*</label>
            <Input
              name='model'
              value={formData.model}
              onChange={handleChange}
              required
              autoComplete='off'
              className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
              placeholder='e.g. Camry'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Year*</label>
            <Input
              name='year'
              type='number'
              inputMode='numeric'
              min={1900}
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={handleChange}
              required
              className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
              placeholder='e.g. 2020'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Current Mileage</label>
            <Input
              name='mileage'
              type='number'
              inputMode='numeric'
              min={0}
              value={formData.mileage}
              onChange={handleChange}
              className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
              placeholder='e.g. 45000'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Color</label>
            <Input
              name='color'
              value={formData.color}
              onChange={handleChange}
              autoComplete='off'
              className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
              placeholder='e.g. Blue'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>License Plate</label>
            <Input
              name='license_plate'
              value={formData.license_plate}
              onChange={handleChange}
              autoComplete='off'
              className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
              placeholder='e.g. ABC123'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>VIN (Optional)</label>
          <Input
            name='vin'
            value={formData.vin}
            onChange={handleChange}
            autoComplete='off'
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='Vehicle Identification Number'
          />
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Notes (Optional)</label>
          <Textarea
            name='notes'
            value={formData.notes}
            onChange={handleChange}
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none resize-y min-h-24'
            placeholder='Additional information about this vehicle...'
          />
        </div>

        {/* Image Upload / Preview */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            Vehicle Photo (Optional)
          </label>
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            className='w-full relative border border-dashed border-white/20 rounded-md p-4 text-center hover:border-neon-blue/50 transition-colors bg-transparent'
          >
            {imagePreview ? (
              <div className='relative'>
                <img
                  src={imagePreview}
                  alt='Vehicle preview'
                  className='w-full h-40 object-cover rounded-md mx-auto'
                />
                <span
                  className='absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imagePreview?.startsWith('blob:'))
                      URL.revokeObjectURL(imagePreview);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  aria-label='Remove image'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M18 6L6 18M6 6l12 12' />
                  </svg>
                </span>
              </div>
            ) : (
              <div className='pointer-events-none'>
                <Car className='w-10 h-10 text-foreground/30 mx-auto mb-2' />
                <p className='text-sm text-foreground/70'>
                  Drag and drop an image or{' '}
                  <span className='text-neon-blue'>browse</span>
                </p>
                <div className='mt-4 flex items-center justify-center'>
                  <Upload className='w-4 h-4 mr-2 text-neon-blue' />
                  <span className='text-xs text-neon-blue'>Select Image</span>
                </div>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            id='vehicle-image'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleImageChange}
          />
        </div>
      </div>

      {/* Sticky action bar */}
      <div className='sticky bottom-0 mt-4 pt-3 bg-dark-card/80 backdrop-blur supports-[backdrop-filter]:bg-dark-card/60 border-t border-white/10'>
        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            className='border-white/10 hover:bg-white/5'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
            disabled={
              isSubmitting ||
              !formData.make ||
              !formData.model ||
              formData.year === ''
            }
          >
            {isSubmitting ? 'Adding...' : 'Add Vehicle'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AddVehicleForm;
