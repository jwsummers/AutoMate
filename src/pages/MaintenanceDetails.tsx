import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';
import {
  useMaintenanceLogs,
  MaintenanceLogWithItems,
  MaintenanceItem as MaintItem,
  MaintenanceStatus,
  NewLogInput,
} from '@/hooks/useMaintenanceLogs';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  Wrench,
  Car,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  MapPin,
  Receipt,
  Check,
  AlertTriangle,
  Clock,
  Edit,
  Trash,
} from 'lucide-react';
import EditMaintenanceLogForm from '@/components/dashboard/EditMaintenanceLogForm';

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function aggregateStatus(items: MaintItem[]): MaintenanceStatus {
  if (items.some((i) => i.status === 'overdue')) return 'overdue';
  if (items.some((i) => i.status === 'upcoming')) return 'upcoming';
  return 'completed';
}

export default function MaintenanceDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const {
    logs,
    loading: logsLoading,
    fetchLogs,
    updateLog,
    deleteLog,
  } = useMaintenanceLogs();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user, fetchLogs]);

  const log: MaintenanceLogWithItems | undefined = useMemo(
    () => logs.find((l) => l.id === id),
    [logs, id]
  );

  const vehicle: Vehicle | undefined = useMemo(
    () => (log ? vehicles.find((v) => v.id === log.vehicle_id) : undefined),
    [vehicles, log]
  );

  const status: MaintenanceStatus | null = log
    ? aggregateStatus(log.items)
    : null;

  const isLoading = logsLoading || vehiclesLoading;

  const handleDeleteLog = async () => {
    if (!log) return;
    if (
      !window.confirm(
        'Are you sure you want to delete this maintenance log and all its items?'
      )
    )
      return;
    const ok = await deleteLog(log.id);
    if (ok) {
      toast.success('Maintenance log deleted');
      navigate('/dashboard?tab=maintenance');
    }
  };

  const handleUpdateLog = async (
    logId: string,
    patch: Partial<NewLogInput>
  ) => {
    const ok = await updateLog(logId, patch);
    if (ok) toast.success('Log updated');
    return ok;
  };

  // Loading UI
  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col bg-dark-bg'>
        <Navbar />
        <main className='flex-1 pt-28 pb-16'>
          <div className='container mx-auto px-4'>
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin mr-2'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M21 12a9 9 0 1 1-6.219-8.56' />
                </svg>
              </div>
              <span>Loading maintenance details...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!log) {
    return (
      <div className='min-h-screen flex flex-col bg-dark-bg'>
        <Navbar />
        <main className='flex-1 pt-28 pb-16'>
          <div className='container mx-auto px-4'>
            <div className='text-center py-12'>
              <h2 className='text-xl font-medium mb-4'>
                Maintenance Log Not Found
              </h2>
              <p className='text-foreground/70 mb-6'>
                The maintenance log you&apos;re looking for doesn&apos;t exist
                or you don&apos;t have permission to view it.
              </p>
              <Button asChild>
                <Link to='/dashboard'>Return to Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-dark-bg'>
      <Navbar />
      <main className='flex-1 pt-28 pb-16'>
        <div className='container mx-auto px-4'>
          <Button
            variant='ghost'
            size='sm'
            className='mb-4 hover:bg-white/5'
            asChild
          >
            <Link to='/dashboard'>
              <ChevronLeft className='h-4 w-4 mr-1' />
              Back to Dashboard
            </Link>
          </Button>

          <div className='flex flex-col md:flex-row justify-between items-start gap-4 mb-8'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <h1 className='text-3xl font-bold'>
                  {vehicle
                    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                    : 'Maintenance Log'}
                </h1>
                {status && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      status === 'completed'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : status === 'overdue'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
                    }`}
                  >
                    {status[0].toUpperCase() + status.slice(1)}
                  </div>
                )}
              </div>
              {vehicle && (
                <Link
                  to={`/dashboard/vehicles/${vehicle.id}`}
                  className='text-foreground/70 hover:text-neon-blue flex items-center gap-1'
                >
                  <Car className='h-4 w-4' />
                  <span>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </span>
                </Link>
              )}
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='border-white/10 hover:bg-white/5'
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className='h-4 w-4 mr-2 text-neon-blue' />
                Edit
              </Button>
              <Button
                variant='outline'
                className='border-white/10 hover:bg-white/5'
                onClick={handleDeleteLog}
              >
                <Trash className='h-4 w-4 mr-2 text-red-400' />
                Delete
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Card className='bg-dark-card border-white/10'>
              <CardContent className='pt-6'>
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='text-foreground/70 text-sm mb-1'>Date</p>
                    <h3 className='text-xl font-bold'>
                      {formatDate(log.date)}
                    </h3>
                  </div>
                  <div className='bg-neon-blue/10 p-2 rounded-lg'>
                    <CalendarIcon className='h-5 w-5 text-neon-blue' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-dark-card border-white/10'>
              <CardContent className='pt-6'>
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='text-foreground/70 text-sm mb-1'>Mileage</p>
                    <h3 className='text-xl font-bold'>
                      {log.mileage != null
                        ? `${log.mileage.toLocaleString()} miles`
                        : 'Not specified'}
                    </h3>
                  </div>
                  <div className='bg-yellow-500/10 p-2 rounded-lg'>
                    <Car className='h-5 w-5 text-yellow-500' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-dark-card border-white/10'>
              <CardContent className='pt-6'>
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='text-foreground/70 text-sm mb-1'>
                      Grand Total
                    </p>
                    <h3 className='text-xl font-bold'>
                      {formatUSD(log.totals.grand_total)}
                    </h3>
                  </div>
                  <div className='bg-green-500/10 p-2 rounded-lg'>
                    <DollarSign className='h-5 w-5 text-green-500' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Details + Items */}
            <div className='lg:col-span-2'>
              <Card className='bg-dark-card border-white/10 mb-8'>
                <CardContent className='p-6'>
                  <h2 className='text-xl font-semibold mb-4'>Log Details</h2>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
                    {log.vendor_name && (
                      <div className='inline-flex items-center gap-2 text-foreground/80'>
                        <MapPin className='w-4 h-4' />
                        <span className='text-sm'>Vendor:</span>
                        <span className='font-medium'>{log.vendor_name}</span>
                      </div>
                    )}
                    {log.location && (
                      <div className='inline-flex items-center gap-2 text-foreground/80'>
                        <MapPin className='w-4 h-4' />
                        <span className='text-sm'>Location:</span>
                        <span className='font-medium'>{log.location}</span>
                      </div>
                    )}
                    {log.invoice_number && (
                      <div className='inline-flex items-center gap-2 text-foreground/80'>
                        <Receipt className='w-4 h-4' />
                        <span className='text-sm'>Invoice:</span>
                        <span className='font-medium'>
                          {log.invoice_number}
                        </span>
                      </div>
                    )}
                    <div className='inline-flex items-center gap-2 text-foreground/80'>
                      <FileText className='w-4 h-4' />
                      <span className='text-sm'>Items:</span>
                      <span className='font-medium'>
                        {log.totals.items_count}
                      </span>
                    </div>
                  </div>

                  {log.notes && (
                    <div className='mb-6'>
                      <h3 className='text-lg font-medium mb-2'>Notes</h3>
                      <p className='text-foreground/70'>{log.notes}</p>
                    </div>
                  )}

                  <h3 className='text-lg font-medium mb-3'>Service Items</h3>
                  <div className='space-y-2'>
                    {log.items.length === 0 ? (
                      <div className='text-sm text-foreground/60'>
                        No service items added.
                      </div>
                    ) : (
                      log.items.map((it) => (
                        <div
                          key={it.id}
                          className='grid grid-cols-1 md:grid-cols-12 gap-3 items-start rounded-xl p-3 border border-white/10 bg-dark-bg/40'
                        >
                          <div className='md:col-span-7'>
                            <div className='font-medium'>{it.type}</div>
                            {it.description && (
                              <div className='text-sm text-foreground/70'>
                                {it.description}
                              </div>
                            )}
                          </div>
                          <div className='md:col-span-3'>
                            <div className='text-xs text-white/70 mb-1'>
                              Status
                            </div>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                                it.status === 'completed'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : it.status === 'overdue'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
                              }`}
                            >
                              {it.status === 'completed' ? (
                                <Check className='w-3.5 h-3.5' />
                              ) : it.status === 'overdue' ? (
                                <AlertTriangle className='w-3.5 h-3.5' />
                              ) : (
                                <Clock className='w-3.5 h-3.5' />
                              )}
                              {it.status[0].toUpperCase() + it.status.slice(1)}
                            </div>
                          </div>
                          <div className='md:col-span-2 flex items-end justify-end'>
                            {/* Future: add per-item edit/remove actions */}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions + Vehicle */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold'>Quick Actions</h2>
              </div>

              <Card className='bg-dark-card border-white/10'>
                <CardContent className='p-4'>
                  <div className='space-y-2'>
                    {vehicle && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-start gap-2 border-white/10 hover:bg-white/5'
                        asChild
                      >
                        <Link to={`/dashboard/vehicles/${vehicle.id}`}>
                          <Car className='h-4 w-4' />
                          <span>View Vehicle Details</span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start gap-2 border-white/10 hover:bg-white/5'
                      asChild
                    >
                      <Link to={`/dashboard?addMaintenance=${log.vehicle_id}`}>
                        <Wrench className='h-4 w-4' />
                        <span>Add New Maintenance</span>
                      </Link>
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start gap-2 border-white/10 hover:bg-neon-blue/10 text-neon-blue'
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit className='h-4 w-4' />
                      <span>Edit Log</span>
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start gap-2 border-white/10 hover:bg-red-500/10 text-red-400'
                      onClick={handleDeleteLog}
                    >
                      <Trash className='h-4 w-4' />
                      <span>Delete Log</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {vehicle && (
                <div className='mt-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-xl font-semibold'>
                      Vehicle Information
                    </h2>
                  </div>

                  <Card className='bg-dark-card border-white/10'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3 mb-3'>
                        {vehicle.image ? (
                          <img
                            src={vehicle.image}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className='w-16 h-16 object-cover rounded-lg'
                          />
                        ) : (
                          <div className='w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center'>
                            <Car className='w-8 h-8 text-foreground/20' />
                          </div>
                        )}
                        <div>
                          <h3 className='font-medium'>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className='text-sm text-foreground/70'>
                            {vehicle.mileage != null
                              ? `${vehicle.mileage.toLocaleString()} miles`
                              : 'Mileage not specified'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-center gap-2 border-white/10 hover:bg-white/5 mt-2'
                        asChild
                      >
                        <Link to={`/dashboard/vehicles/${vehicle.id}`}>
                          <Car className='h-4 w-4' />
                          <span>View Full Vehicle Details</span>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Edit Log Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='bg-dark-card border border-white/10 sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Edit Maintenance Log</DialogTitle>
          </DialogHeader>
          {log && (
            <EditMaintenanceLogForm
              log={log}
              vehicles={vehicles}
              onSubmit={handleUpdateLog}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
