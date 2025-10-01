import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import type { Vehicle } from '@/hooks/useVehicles';
import type {
  MaintenanceLog,
  MaintenanceLogWithItems,
  NewLogInput,
} from '@/hooks/useMaintenanceLogs';

const LogSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  date: z.string().min(1, 'Date is required'),
  mileage: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().nonnegative().optional().nullable()
  ),
  vendor_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  labor_cost: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional().nullable()
  ),
  parts_cost: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional().nullable()
  ),
  taxes: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional().nullable()
  ),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof LogSchema>;

type Props = {
  log: MaintenanceLogWithItems | MaintenanceLog;
  vehicles: Vehicle[];
  onSubmit: (logId: string, patch: Partial<NewLogInput>) => Promise<boolean>;
  onCancel: () => void;
};

export default function EditMaintenanceLogForm({
  log,
  vehicles,
  onSubmit,
  onCancel,
}: Props) {
  const [dateObj, setDateObj] = useState<Date>(new Date(log.date));

  const defaultValues = useMemo<FormValues>(
    () => ({
      vehicle_id: log.vehicle_id,
      date: log.date,
      mileage: log.mileage ?? undefined,
      vendor_name: log.vendor_name ?? '',
      location: log.location ?? '',
      invoice_number: log.invoice_number ?? '',
      labor_cost: log.labor_cost ?? undefined,
      parts_cost: log.parts_cost ?? undefined,
      taxes: log.taxes ?? undefined,
      notes: 'notes' in log && log.notes ? log.notes : '',
    }),
    [log]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(LogSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, register, handleSubmit, setValue, formState, watch } = form;

  const handleCalendarSelect = (d?: Date) => {
    if (!d) return;
    setDateObj(d);
    setValue('date', format(d, 'yyyy-MM-dd'), { shouldValidate: true });
  };

  const submit = async (values: FormValues) => {
    const patch: Partial<NewLogInput> = {
      vehicle_id: values.vehicle_id,
      date: values.date,
      mileage: values.mileage ?? null,
      vendor_name: values.vendor_name ?? null,
      location: values.location ?? null,
      invoice_number: values.invoice_number ?? null,
      labor_cost: values.labor_cost ?? null,
      parts_cost: values.parts_cost ?? null,
      taxes: values.taxes ?? null,
      notes: values.notes ?? null,
    };
    const ok = await onSubmit(log.id, patch);
    if (ok) onCancel();
  };

  return (
    <form className='space-y-4' onSubmit={handleSubmit(submit)}>
      {/* Vehicle */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Vehicle*</label>
        <Controller
          control={control}
          name='vehicle_id'
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='bg-dark-bg border border-white/10 focus:border-neon-blue'>
                <SelectValue placeholder='Select a vehicle' />
              </SelectTrigger>
              <SelectContent className='bg-dark-card border-white/10'>
                {vehicles.length === 0 ? (
                  <SelectItem value='no-vehicles' disabled>
                    No vehicles found
                  </SelectItem>
                ) : (
                  vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {formState.errors.vehicle_id?.message && (
          <p className='text-xs text-red-500'>
            {formState.errors.vehicle_id.message}
          </p>
        )}
      </div>

      {/* Date + Mileage */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Date*</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type='button'
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal bg-dark-bg border border-white/10 hover:bg-dark-bg/80',
                  !watch('date') && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {watch('date') ? (
                  format(dateObj, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0 bg-dark-card border-white/10 z-50 pointer-events-auto'>
              <Calendar
                mode='single'
                selected={dateObj}
                onSelect={handleCalendarSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {formState.errors.date?.message && (
            <p className='text-xs text-red-500'>
              {formState.errors.date.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Mileage</label>
          <Input
            type='number'
            min={0}
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='e.g. 45000'
            {...register('mileage')}
          />
        </div>
      </div>

      {/* Vendor / Location / Invoice */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Performed By / Vendor</label>
          <Input
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='e.g. Downtown Mechanic'
            {...register('vendor_name')}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Location</label>
          <Input
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='City, State or address'
            {...register('location')}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Invoice #</label>
          <Input
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='e.g. INV-1029'
            {...register('invoice_number')}
          />
        </div>
      </div>

      {/* Costs */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Labor Cost</label>
          <Input
            type='number'
            step='0.01'
            min={0}
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='e.g. 120.00'
            {...register('labor_cost')}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Parts Cost</label>
          <Input
            type='number'
            step='0.01'
            min={0}
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='e.g. 85.50'
            {...register('parts_cost')}
          />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Taxes</label>
          <Input
            type='number'
            step='0.01'
            min={0}
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
            placeholder='e.g. 12.34'
            {...register('taxes')}
          />
        </div>
      </div>

      {/* Notes */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Notes</label>
        <Textarea
          className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none resize-none h-20'
          placeholder='Additional notes about this visit...'
          {...register('notes')}
        />
      </div>

      {/* Actions */}
      <div className='flex justify-end gap-3 pt-4'>
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
          disabled={!watch('vehicle_id') || !watch('date')}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
