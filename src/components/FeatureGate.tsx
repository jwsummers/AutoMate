import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function FeatureGate({
  enabled,
  children,
  fallback,
  onUpgrade,
}: {
  enabled: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  onUpgrade?: () => void;
}) {
  if (enabled) return <>{children}</>;
  return (
    <div className='rounded-lg border border-white/10 p-4 bg-white/5'>
      {fallback ?? (
        <div className='flex items-center justify-between gap-4'>
          <div>
            <div className='font-medium'>Pro feature</div>
            <div className='text-sm text-foreground/70'>
              Upgrade to unlock this.
            </div>
          </div>
          {onUpgrade && (
            <Button
              size='sm'
              onClick={onUpgrade}
              className='bg-neon-blue text-black'
            >
              Upgrade
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
