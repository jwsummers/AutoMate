import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  created_at: string; // ISO
  link?: string;
};

type Props = {
  userId?: string | null;
  notifications: NotificationItem[];
  onViewAll?: () => void; // optional
  onMarkAllRead?: () => Promise<void> | void; // optional server sync
  className?: string;
};

const keyFor = (userId?: string | null) => `notif:lastSeen:${userId ?? 'anon'}`;

export function NotificationBell({
  userId,
  notifications,
  onViewAll,
  onMarkAllRead,
  className,
}: Props) {
  const storageKey = keyFor(userId);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const raw =
      typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    return raw ? Number(raw) : 0;
  });

  // Keep lastSeen in sync if user switches
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    setLastSeen(raw ? Number(raw) : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const hasUnseen = useMemo(() => {
    if (!notifications.length) return false;
    const newest = Math.max(
      ...notifications.map((n) => new Date(n.created_at).getTime() || 0)
    );
    return newest > lastSeen;
  }, [notifications, lastSeen]);

  const markAllRead = async () => {
    const now = Date.now();
    localStorage.setItem(storageKey, String(now));
    setLastSeen(now);
    try {
      await onMarkAllRead?.();
    } catch (e) {
      // Best effort: if server fails, keep client state—dot stays cleared until next refresh
      console.error('onMarkAllRead failed:', e);
    }
  };

  const top5 = notifications
    .slice()
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={`relative ${className ?? ''}`}
          aria-label={hasUnseen ? 'Notifications (new)' : 'Notifications'}
        >
          <Bell className='h-5 w-5' />
          {hasUnseen && (
            <span
              className='absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pink-500'
              aria-hidden
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-80 bg-dark-card border-white/10 text-foreground'>
        <DropdownMenuLabel className='flex items-center justify-between'>
          <span>Notifications</span>
          {notifications.length > 0 && (
            <span className='text-xs text-muted-foreground'>
              {notifications.length}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className='p-4 text-sm text-muted-foreground'>
            You’re all caught up.
          </div>
        ) : (
          <>
            {top5.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className='flex items-start gap-2 py-3 focus:bg-white/5'
                onSelect={(e) => {
                  // prevent menu close if needed; navigate if link is present
                  if (n.link) {
                    e.preventDefault();
                    window.location.assign(n.link);
                  }
                }}
              >
                <div className='flex-1'>
                  <div className='text-sm font-medium'>{n.title}</div>
                  {n.body && (
                    <div className='text-xs text-muted-foreground line-clamp-2'>
                      {n.body}
                    </div>
                  )}
                  <div className='mt-1 text-[11px] text-muted-foreground/80'>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                {n.link && <ChevronRight className='h-3.5 w-3.5 opacity-70' />}
              </DropdownMenuItem>
            ))}
            {notifications.length > 5 && (
              <div className='px-2 pt-1 text-xs text-muted-foreground'>
                +{notifications.length - 5} more
              </div>
            )}
          </>
        )}

        <DropdownMenuSeparator />
        <div className='px-2 py-2 flex gap-2'>
          <Button
            size='sm'
            variant='secondary'
            className='w-full'
            onClick={markAllRead}
          >
            Mark all as read
          </Button>
          {onViewAll && (
            <Button
              size='sm'
              variant='ghost'
              className='w-full'
              onClick={onViewAll}
            >
              View all
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
