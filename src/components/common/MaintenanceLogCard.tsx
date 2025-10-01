// src/components/common/MaintenanceLogCard.tsx
import { useState } from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMaintenanceLogs } from '@/hooks/useMaintenanceLogs';
import type {
  MaintenanceLogWithItems,
  MaintenanceItem,
  MaintenanceStatus,
} from '@/hooks/useMaintenanceLogs';
import { Link } from 'react-router-dom';

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return isNaN(d.valueOf())
    ? dateString
    : d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

function statusIcon(s: MaintenanceStatus) {
  if (s === 'completed') return <Check className='w-4 h-4 text-green-500' />;
  if (s === 'upcoming') return <Clock className='w-4 h-4 text-neon-blue' />;
  return <AlertCircle className='w-4 h-4 text-red-500' />;
}

function statusClasses(s: MaintenanceStatus) {
  if (s === 'completed')
    return 'bg-green-500/10 text-green-500 border-green-500/20';
  if (s === 'upcoming')
    return 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
  return 'bg-red-500/10 text-red-500 border-red-500/20';
}

export interface MaintenanceLogCardProps {
  log: MaintenanceLogWithItems;
  vehicleLabel?: string; // e.g. "2019 Toyota Camry"
  onOpenEditLog?: (log: MaintenanceLogWithItems) => void;
  onOpenEditItem?: (
    item: MaintenanceItem,
    log: MaintenanceLogWithItems
  ) => void;
  onOpenAddItem?: (log: MaintenanceLogWithItems) => void;
  onViewDetailsHref?: string; // optional deep-link to a details page
}

export default function MaintenanceLogCard({
  log,
  vehicleLabel,
  onOpenEditLog,
  onOpenEditItem,
  onOpenAddItem,
  onViewDetailsHref,
}: MaintenanceLogCardProps) {
  const { updateItem, deleteItem, deleteLog } = useMaintenanceLogs();
  const [busy, setBusy] = useState<string | null>(null);

  const derivedLogStatus: MaintenanceStatus = log.items.some(
    (i) => i.status === 'overdue'
  )
    ? 'overdue'
    : log.items.some((i) => i.status === 'upcoming')
    ? 'upcoming'
    : 'completed';

  const handleMarkItemComplete = async (id: string) => {
    setBusy(id);
    try {
      await updateItem(id, { status: 'completed' } as Partial<MaintenanceItem>);
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setBusy(id);
    try {
      await deleteItem(id);
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteLog = async () => {
    setBusy('log');
    try {
      await deleteLog(log.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className='bg-dark-card border-white/10 p-4'>
      {/* Header */}
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <div
            className={`min-w-10 h-10 rounded-full flex items-center justify-center ${
              derivedLogStatus === 'completed'
                ? 'bg-green-500/10'
                : derivedLogStatus === 'upcoming'
                ? 'bg-neon-blue/10'
                : 'bg-red-500/10'
            }`}
          >
            {statusIcon(derivedLogStatus)}
          </div>
          <div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              <h3 className='font-medium text-foreground'>
                {vehicleLabel ? `${vehicleLabel} • ` : ''}
                {formatDate(log.date)}
              </h3>
              {log.vendor_name && (
                <Badge
                  variant='outline'
                  className='border-white/10 text-foreground/80'
                >
                  {log.vendor_name}
                </Badge>
              )}
              {log.invoice_number && (
                <Badge
                  variant='outline'
                  className='border-white/10 text-foreground/80'
                >
                  Inv #{log.invoice_number}
                </Badge>
              )}
              {typeof log.mileage === 'number' && (
                <Badge
                  variant='outline'
                  className='border-white/10 text-foreground/80'
                >
                  {log.mileage.toLocaleString()} mi
                </Badge>
              )}
            </div>
            {log.location && (
              <p className='text-xs text-foreground/60 mt-1'>{log.location}</p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='text-sm text-foreground/70 text-right'>
            <div>
              Items:{' '}
              <span className='font-semibold text-foreground'>
                {log.totals.items_count}
              </span>
            </div>
            <div>
              Total:{' '}
              <span className='font-semibold text-foreground'>
                ${log.totals.grand_total.toFixed(2)}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='hover:bg-white/5'>
                <MoreVertical className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='bg-dark-card border-white/10'>
              <DropdownMenuItem
                onClick={() => onOpenEditLog?.(log)}
                className='cursor-pointer'
              >
                <Pencil className='w-4 h-4 mr-2' /> Edit log
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteLog}
                className='cursor-pointer text-red-400'
              >
                <Trash2 className='w-4 h-4 mr-2' /> Delete log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Items */}
      <div className='mt-4 space-y-2'>
        {log.items.length === 0 ? (
          <div className='text-sm text-foreground/60'>
            No items recorded for this visit.
          </div>
        ) : (
          log.items.map((it) => (
            <div
              key={it.id}
              className='rounded-lg border border-white/10 p-3 bg-white/5'
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='border-white/10'>
                      {it.type}
                    </Badge>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${statusClasses(
                        it.status
                      )}`}
                    >
                      {it.status[0].toUpperCase() + it.status.slice(1)}
                    </span>
                  </div>
                  {it.description && (
                    <p className='text-sm text-foreground/80 mt-1 line-clamp-2'>
                      {it.description}
                    </p>
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  {it.status !== 'completed' && (
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={busy === it.id}
                      onClick={() => handleMarkItemComplete(it.id)}
                      className='border-green-500/30 text-green-500 hover:bg-green-500/10'
                    >
                      {busy === it.id ? 'Saving...' : 'Mark complete'}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='hover:bg-white/5'
                      >
                        <MoreVertical className='w-4 h-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='bg-dark-card border-white/10'>
                      <DropdownMenuItem
                        onClick={() => onOpenEditItem?.(it, log)}
                        className='cursor-pointer'
                      >
                        <Pencil className='w-4 h-4 mr-2' /> Edit item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteItem(it.id)}
                        className='cursor-pointer text-red-400'
                      >
                        <Trash2 className='w-4 h-4 mr-2' /> Delete item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer actions */}
      <div className='flex justify-between items-center mt-4'>
        <Button
          variant='ghost'
          className='hover:bg-white/5 gap-2'
          onClick={() => onOpenAddItem?.(log)}
        >
          <PlusCircle className='w-4 h-4' />
          Add item
        </Button>

        {onViewDetailsHref ? (
          <Button asChild variant='ghost' className='hover:bg-white/5 gap-1'>
            <Link to={onViewDetailsHref}>
              View details
              <ArrowRight className='w-3.5 h-3.5 ml-1' />
            </Link>
          </Button>
        ) : null}
      </div>

      {busy === 'log' && (
        <div className='mt-2 text-xs text-foreground/60'>Processing...</div>
      )}
    </Card>
  );
}
