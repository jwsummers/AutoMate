// src/components/maintenance/AddMaintenanceForm.tsx
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Vehicle } from '@/hooks/useVehicles';
import { useMaintenanceLogs } from '@/hooks/useMaintenanceLogs';
import type {
  MaintenanceLogWithItems,
  NewItemInput,
  NewLogInput,
  MaintenanceStatus,
} from '@/hooks/useMaintenanceLogs';

// ---------- helpers (typed) ----------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const getErrorMessage = (err: unknown): string | undefined => {
  if (typeof err === 'string') return err;
  if (isRecord(err)) {
    const direct = err['message'];
    if (typeof direct === 'string') return direct;
    const root = err['root'];
    if (isRecord(root)) {
      const rm = root['message'];
      if (typeof rm === 'string') return rm;
    }
  }
  return undefined;
};

// ---------- constants ----------
const maintenanceTypes = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Air Filter Replacement',
  'Fluid Change',
  'Battery Replacement',
  'Wiper Blade Replacement',
  'Spark Plug Replacement',
  'Major Service',
  'Other',
] as const;

const statusOptions: MaintenanceStatus[] = ['completed', 'upcoming', 'overdue'];

// ---------- schemas ----------
const ItemSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['completed', 'upcoming', 'overdue']).default('completed'),
  // cost removed for simpler UX (use the Costs section below)
});

const LogSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  date: z.string().min(1, 'Date is required'), // 'YYYY-MM-DD'
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
  items: z.array(ItemSchema).min(1, 'Add at least one service item'),
});

type FormValues = z.infer<typeof LogSchema>;

// ---------- props ----------
interface AddMaintenanceFormProps {
  vehicles: Vehicle[];
  onCancel: () => void;
  defaultVehicleId?: string;
  onCreated?: (log: MaintenanceLogWithItems) => void;
}

// ---------- component ----------
const AddMaintenanceForm = ({
  vehicles,
  onCancel,
  defaultVehicleId,
  onCreated,
}: AddMaintenanceFormProps) => {
  const { addLogWithItems, loading } = useMaintenanceLogs();
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [useTotalOnly, setUseTotalOnly] = useState<boolean>(false);
  const [manualTotal, setManualTotal] = useState<string>(''); // controlled input

  const defaultValues = useMemo<FormValues>(
    () => ({
      vehicle_id: defaultVehicleId ?? '',
      date: format(new Date(), 'yyyy-MM-dd'),
      mileage: undefined,
      vendor_name: '',
      location: '',
      invoice_number: '',
      labor_cost: undefined,
      parts_cost: undefined,
      taxes: undefined,
      notes: '',
      items: [{ type: '', description: '', status: 'completed' }],
    }),
    [defaultVehicleId]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(LogSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, register, handleSubmit, setValue, formState, watch, reset } =
    form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (defaultVehicleId) setValue('vehicle_id', defaultVehicleId);
  }, [defaultVehicleId, setValue]);

  const handleCalendarSelect = (d?: Date) => {
    if (!d) return;
    setDateObj(d);
    setValue('date', format(d, 'yyyy-MM-dd'), { shouldValidate: true });
  };

  // ----- totals (live) -----
  const labor = watch('labor_cost') ?? 0;
  const parts = watch('parts_cost') ?? 0;
  const taxes = watch('taxes') ?? 0;

  const logCostsSubtotal = useTotalOnly
    ? manualTotal === ''
      ? 0
      : Number(manualTotal) || 0
    : (labor || 0) + (parts || 0) + (taxes || 0);

  const grandTotal = logCostsSubtotal; // items no longer carry cost

  // ----- submit -----
  const onSubmit = async (values: FormValues) => {
    // If "total only" mode is on, persist total into labor_cost, null parts/taxes
    const normalizedLabor = useTotalOnly
      ? manualTotal === ''
        ? null
        : Number(manualTotal)
      : values.labor_cost ?? null;
    const normalizedParts = useTotalOnly ? null : values.parts_cost ?? null;
    const normalizedTaxes = useTotalOnly ? null : values.taxes ?? null;

    const payloadLog: NewLogInput = {
      vehicle_id: values.vehicle_id,
      date: values.date,
      mileage: values.mileage ?? null,
      vendor_name: values.vendor_name ?? null,
      location: values.location ?? null,
      invoice_number: values.invoice_number ?? null,
      labor_cost: normalizedLabor,
      parts_cost: normalizedParts,
      taxes: normalizedTaxes,
      notes: values.notes ?? null,
    };

    // Items have no cost now; send null so backend stays consistent
    const payloadItems: NewItemInput[] = values.items.map((i) => ({
      type: i.type,
      description: i.description ?? null,
      status: i.status,
      cost: null,
    }));

    const created = await addLogWithItems(payloadLog, payloadItems);
    if (created) {
      onCreated?.(created);
      reset({
        ...defaultValues,
        vehicle_id: values.vehicle_id,
        date: values.date,
      });
      setDateObj(new Date(values.date));
      setManualTotal('');
      onCancel();
    }
  };

  const isSubmitting = loading;

  return (
    // Make the whole form a flex column with a scrollable body and a sticky footer
    <form className='flex flex-col max-h-[80vh]'>
      {/* Scrollable body; bottom padding so content doesn't hide under the sticky footer */}
      <div className='flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pb-28'>
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

        {/* ---- Service Items (above notes; no per-item cost) ---- */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium'>Service Items</h3>
            <Button
              type='button'
              variant='secondary'
              className='border-white/10 hover:bg-white/5'
              onClick={() =>
                append({ type: '', description: '', status: 'completed' })
              }
            >
              Add Item
            </Button>
          </div>

          {fields.map((field, idx) => {
            const typeMsg = getErrorMessage(
              formState.errors.items?.[idx]?.type
            );
            return (
              <div
                key={field.id}
                className='grid grid-cols-1 md:grid-cols-12 gap-3 items-start rounded-xl p-3 border border-white/10 bg-dark-bg/40'
              >
                {/* Type */}
                <div className='md:col-span-3 space-y-1'>
                  <label className='text-xs text-white/70'>Type*</label>
                  <Controller
                    control={control}
                    name={`items.${idx}.type`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className='bg-dark-bg border border-white/10 focus:border-neon-blue'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent className='bg-dark-card border-white/10'>
                          {maintenanceTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {typeMsg && <p className='text-xs text-red-500'>{typeMsg}</p>}
                </div>

                {/* Description */}
                <div className='md:col-span-7 space-y-1'>
                  <label className='text-xs text-white/70'>Description</label>
                  <Input
                    className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
                    placeholder='Details of this item'
                    {...register(`items.${idx}.description` as const)}
                  />
                </div>

                {/* Status */}
                <div className='md:col-span-2 space-y-1'>
                  <label className='text-xs text-white/70'>Status</label>
                  <Controller
                    control={control}
                    name={`items.${idx}.status` as const}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className='bg-dark-bg border border-white/10 focus:border-neon-blue'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                        <SelectContent className='bg-dark-card border-white/10'>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s[0].toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Remove (force full row on md+) */}
                <div className='col-span-1 md:col-span-12 md:col-start-1 flex items-end justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    className='border-white/10 hover:bg-white/5'
                    onClick={() => remove(idx)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Items array error */}
          {(() => {
            const msg = getErrorMessage(formState.errors.items);
            return msg ? <p className='text-sm text-red-500'>{msg}</p> : null;
          })()}
        </div>

        {/* ---- Costs panel (single source of truth) ---- */}
        <div className='space-y-3 rounded-xl p-3 border border-white/10 bg-dark-bg/40'>
          <div className='flex items-center justify-between gap-4'>
            <h3 className='text-sm font-medium'>Costs</h3>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={useTotalOnly}
                onChange={(e) => {
                  setUseTotalOnly(e.target.checked);
                  if (!e.target.checked) setManualTotal('');
                }}
              />
              Enter total only
            </label>
          </div>

          {!useTotalOnly ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs text-white/70'>Labor</label>
                <Input
                  type='number'
                  step='0.01'
                  min={0}
                  className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
                  placeholder='e.g. 120.00'
                  {...register('labor_cost')}
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-white/70'>Parts</label>
                <Input
                  type='number'
                  step='0.01'
                  min={0}
                  className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
                  placeholder='e.g. 85.50'
                  {...register('parts_cost')}
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-white/70'>Taxes</label>
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
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <div className='space-y-1 md:col-span-1'>
                <label className='text-xs text-white/70'>
                  Total (labor + parts + taxes)
                </label>
                <Input
                  type='number'
                  step='0.01'
                  min={0}
                  value={manualTotal}
                  onChange={(e) => setManualTotal(e.target.value)}
                  className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none'
                  placeholder='e.g. 217.84'
                />
              </div>
              <div className='md:col-span-2 flex items-end text-xs text-white/60'>
                This total will be saved as{' '}
                <span className='mx-1 font-medium'>labor</span> with parts/taxes
                set to null for simplicity.
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3 pt-1'>
            <div className='text-sm md:col-span-2'>
              <span className='text-white/70'>Entered amount: </span>
              <span className='font-semibold'>
                ${logCostsSubtotal.toFixed(2)}
              </span>
            </div>
            <div className='text-sm'>
              <span className='text-white/70'>Grand total: </span>
              <span className='font-semibold'>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ---- Notes (below items) ---- */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Notes (Optional)</label>
          <Textarea
            className='bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none resize-none h-20'
            placeholder='Additional notes about this visit...'
            {...register('notes')}
          />
        </div>
      </div>

      {/* Sticky footer actions (always visible) */}
      <div className='sticky bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur border-t border-white/10 mt-2 py-3 flex justify-end gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          className='border-white/10 hover:bg-white/5'
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          onClick={handleSubmit(onSubmit)}
          className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
          disabled={
            isSubmitting ||
            !watch('vehicle_id') ||
            !watch('date') ||
            !!formState.errors.items
          }
        >
          {isSubmitting ? 'Adding...' : 'Add Maintenance Log'}
        </Button>
      </div>
    </form>
  );
};

export default AddMaintenanceForm;
