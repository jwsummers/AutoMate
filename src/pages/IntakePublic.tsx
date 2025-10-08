import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type VehicleMeta = {
  id: string;
  year: number;
  make: string;
  model: string;
} | null;
type Status = 'idle' | 'loading' | 'ready' | 'submitting' | 'success';

type NewItemInput = {
  type: string;
  description?: string | null;
  status?: 'completed' | 'upcoming' | 'overdue';
  cost?: number | null;
};
type NewLogInput = {
  vehicle_id: string;
  date: string;
  mileage: number | null;
  vendor_name: string | null;
  location: string | null;
  invoice_number: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  taxes: number | null;
  notes: string | null;
};

export default function IntakePublic() {
  const { slug = '' } = useParams();
  const [status, setStatus] = useState<Status>('loading');
  const [vehicle, setVehicle] = useState<VehicleMeta>(null);
  const [requirePin, setRequirePin] = useState(false);
  const [pin, setPin] = useState('');
  const [log, setLog] = useState<NewLogInput | null>(null);
  const [items, setItems] = useState<NewItemInput[]>([]);

  const fnBase = import.meta.env.VITE_FUNCTIONS_URL ?? '/functions/v1'; // configure in env

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${fnBase}/intake/${slug}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || 'Link invalid');
        setVehicle(data.vehicle);
        setRequirePin(Boolean(data.require_pin));
        const today = new Date().toISOString().slice(0, 10);
        setLog({
          vehicle_id: data.vehicle?.id ?? '',
          date: today,
          mileage: null,
          vendor_name: null,
          location: null,
          invoice_number: null,
          labor_cost: null,
          parts_cost: null,
          taxes: null,
          notes: null,
        });
        setStatus('ready');
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Link invalid/expired';
        toast.error(message);
        setStatus('idle');
      }
    })();
  }, [slug, fnBase]);

  async function verifyPinIfNeeded(): Promise<boolean> {
    if (!requirePin) return true;
    const r = await fetch(`${fnBase}/intake/${slug}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await r.json();
    if (!data.ok) toast.error('Invalid PIN');
    return !!data.ok;
  }

  async function submit() {
    if (!log) return;
    if (requirePin) {
      const ok = await verifyPinIfNeeded();
      if (!ok) return;
    }
    setStatus('submitting');
    const r = await fetch(`${fnBase}/intake/${slug}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ log, items, pin: requirePin ? pin : undefined }),
    });
    const data = await r.json();
    if (!r.ok) {
      toast.error(data?.error || 'Submission failed');
      setStatus('ready');
      return;
    }
    setStatus('success');
    toast.success('Submitted to owner');
  }

  if (status === 'loading') {
    return (
      <div className='min-h-[50vh] grid place-content-center'>Loading…</div>
    );
  }
  if (status === 'idle') {
    return (
      <div className='min-h-[50vh] grid place-content-center'>
        This link is invalid or expired.
      </div>
    );
  }
  if (!log) return null;

  return (
    <div className='max-w-xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-1'>Service Intake</h1>
      {vehicle && (
        <p className='text-foreground/70 mb-4'>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
      )}

      {requirePin && (
        <div className='mb-4'>
          <label className='text-sm'>Owner PIN</label>
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder='Enter PIN shared by owner'
          />
        </div>
      )}

      {/* Basic log fields */}
      <div className='grid grid-cols-2 gap-3 mb-3'>
        <div>
          <label className='text-sm'>Date</label>
          <Input
            type='date'
            value={log.date}
            onChange={(e) => setLog({ ...log, date: e.target.value })}
          />
        </div>
        <div>
          <label className='text-sm'>Mileage</label>
          <Input
            type='number'
            min={0}
            value={log.mileage ?? ''}
            onChange={(e) =>
              setLog({
                ...log,
                mileage: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3 mb-3'>
        <div>
          <label className='text-sm'>Vendor / Shop</label>
          <Input
            value={log.vendor_name ?? ''}
            onChange={(e) =>
              setLog({ ...log, vendor_name: e.target.value || null })
            }
          />
        </div>
        <div>
          <label className='text-sm'>Invoice #</label>
          <Input
            value={log.invoice_number ?? ''}
            onChange={(e) =>
              setLog({ ...log, invoice_number: e.target.value || null })
            }
          />
        </div>
      </div>

      {/* Items (very simple list; you can swap your richer component here) */}
      <div className='mb-3'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-medium'>Service Items</label>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              setItems([
                ...items,
                { type: '', status: 'completed', cost: null },
              ])
            }
          >
            + Add Item
          </Button>
        </div>
        <div className='space-y-3 mt-2'>
          {items.map((it, idx) => (
            <div key={idx} className='p-3 rounded-lg border border-white/10'>
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  placeholder='Type (e.g., Oil Change)'
                  value={it.type}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx] = { ...it, type: e.target.value };
                    setItems(copy);
                  }}
                />
                <Input
                  placeholder='Cost'
                  type='number'
                  value={it.cost ?? ''}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx] = {
                      ...it,
                      cost: e.target.value ? Number(e.target.value) : null,
                    };
                    setItems(copy);
                  }}
                />
              </div>
              <Textarea
                className='mt-2'
                placeholder='Description (optional)'
                value={it.description ?? ''}
                onChange={(e) => {
                  const copy = [...items];
                  copy[idx] = { ...it, description: e.target.value || null };
                  setItems(copy);
                }}
              />
              <div className='mt-2 text-right'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    const copy = [...items];
                    copy.splice(idx, 1);
                    setItems(copy);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mb-3'>
        <label className='text-sm'>Notes (optional)</label>
        <Textarea
          value={log.notes ?? ''}
          onChange={(e) => setLog({ ...log, notes: e.target.value || null })}
        />
      </div>

      <div className='flex justify-end gap-3'>
        <Button onClick={submit} disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting…' : 'Submit to Owner'}
        </Button>
      </div>

      <p className='mt-4 text-xs text-foreground/60'>
        By submitting, you confirm this service information is accurate. This
        app is not a manufacturer-authoritative record.
      </p>
    </div>
  );
}
