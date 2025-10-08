import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { addDays, formatISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Vehicle } from '@/hooks/useVehicles';
import type { SupabaseClient } from '@supabase/supabase-js';

const untyped = supabase as unknown as SupabaseClient<Record<string, unknown>>;

type Props = { vehicle: Vehicle };

export default function ShareWithShop({ vehicle }: Props) {
  const [expiresDays, setExpiresDays] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [requirePin, setRequirePin] = useState(false);
  const [pin, setPin] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function sha256Hex(input: string) {
    const enc = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const createLink = async () => {
    try {
      setCreating(true);
      const slug = nanoid(12);
      const expires_at = addDays(new Date(), Math.max(1, expiresDays));
      const base = window.location.origin;

      let pin_hash: string | null = null;
      if (requirePin) {
        if (pin.trim().length < 4) {
          toast.error('PIN must be at least 4 digits');
          setCreating(false);
          return;
        }
        pin_hash = await sha256Hex(pin.trim());
      }

      const { error } = await untyped.from('intake_links').insert([
        {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          vehicle_id: vehicle.id,
          slug,
          expires_at: formatISO(expires_at),
          max_uses: Math.max(1, maxUses),
          used_count: 0,
          require_pin: requirePin,
          pin_hash,
          notes: `Shared with shop for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);
      if (error) throw error;

      setLink(`${base}/s/${slug}`);
      toast.success('Intake link created');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='text-sm'>Expires (days)</label>
          <Input
            type='number'
            min={1}
            value={expiresDays}
            onChange={(e) =>
              setExpiresDays(parseInt(e.target.value || '1', 10))
            }
          />
        </div>
        <div>
          <label className='text-sm'>Max uses</label>
          <Input
            type='number'
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(parseInt(e.target.value || '1', 10))}
          />
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Switch checked={requirePin} onCheckedChange={setRequirePin} />
        <span className='text-sm'>Require PIN</span>
        {requirePin && (
          <Input
            className='ml-2 w-32'
            placeholder='123456'
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        )}
      </div>

      <Button onClick={createLink} disabled={creating}>
        {creating ? 'Creating…' : 'Create Intake Link'}
      </Button>

      {link && (
        <div className='mt-4 flex items-center gap-4'>
          <QRCodeCanvas value={link} size={148} />
          <div className='space-y-2'>
            <div className='text-sm break-all'>{link}</div>
            <Button
              onClick={() => navigator.clipboard.writeText(link)}
              variant='outline'
              size='sm'
            >
              Copy Link
            </Button>
            {requirePin && (
              <div className='text-xs text-foreground/70'>PIN: {pin}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
