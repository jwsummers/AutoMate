import { useEffect, useState } from 'react';
import ShareWithShop from '@/components/vehicles/ShareWithShop';
import { useParams, Link } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { useMaintenance } from '@/hooks/useMaintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Car,
  Wrench,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Edit,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import MaintenanceItem from '@/components/common/MaintenanceItem';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { QrCode, FileDown } from 'lucide-react';

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const {
    maintenanceRecords,
    loading: maintenanceLoading,
    markMaintenanceAsCompleted,
  } = useMaintenance();
  const [vehicle, setVehicle] = useState<any>(null);
  const [vehicleMaintenance, setVehicleMaintenance] = useState<any[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!id || vehiclesLoading) return;

    const foundVehicle = vehicles.find((v) => v.id === id);
    setVehicle(foundVehicle || null);
  }, [id, vehicles, vehiclesLoading]);

  useEffect(() => {
    if (!id || maintenanceLoading) return;

    const records = maintenanceRecords.filter(
      (record) => record.vehicle_id === id
    );
    setVehicleMaintenance(records);
  }, [id, maintenanceRecords, maintenanceLoading]);

  const handleCompleteMaintenance = (maintenanceId: string) => {
    markMaintenanceAsCompleted(maintenanceId);
  };

  if (vehiclesLoading || maintenanceLoading) {
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
              <span>Loading vehicle details...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className='min-h-screen flex flex-col bg-dark-bg'>
        <Navbar />
        <main className='flex-1 pt-28 pb-16'>
          <div className='container mx-auto px-4'>
            <div className='text-center py-12'>
              <h2 className='text-xl font-medium mb-4'>Vehicle Not Found</h2>
              <p className='text-foreground/70 mb-6'>
                The vehicle you're looking for doesn't exist or you don't have
                permission to view it.
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

  // Count upcoming and overdue maintenance
  const upcomingCount = vehicleMaintenance.filter(
    (m) => m.status === 'upcoming'
  ).length;
  const overdueCount = vehicleMaintenance.filter(
    (m) => m.status === 'overdue'
  ).length;
  const completedCount = vehicleMaintenance.filter(
    (m) => m.status === 'completed'
  ).length;
  const healthScore = Math.round(80 - overdueCount * 10 + completedCount * 2);

  return (
    <div className='min-h-screen flex flex-col bg-dark-bg'>
      <Navbar />
      <main className='flex-1 pt-28 pb-16'>
        <div className='container mx-auto px-4'>
          <div className='mb-6'>
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

            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8'>
              {/* Title + meta */}
              <div className='min-w-0'>
                <h1 className='text-3xl font-bold truncate'>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className='text-foreground/70 mt-1'>
                  {vehicle.mileage
                    ? `${vehicle.mileage.toLocaleString()} miles`
                    : 'Mileage not specified'}
                </p>
              </div>

              {/* Actions */}
              <div className='w-full md:w-auto'>
                <div className='flex flex-col sm:flex-row flex-wrap gap-2 md:justify-end'>
                  {/* Share with Shop */}
                  <Button
                    variant='outline'
                    className='gap-2 border-white/10 hover:bg-white/5 w-full sm:w-auto'
                    onClick={() => setIsShareOpen(true)}
                  >
                    <QrCode className='w-4 h-4' />
                    Share with Shop
                  </Button>

                  {/* Vehicle Report */}
                  <Button
                    asChild
                    className='gap-2 bg-neon-blue hover:bg-neon-blue/90 text-black font-medium w-full sm:w-auto'
                  >
                    <Link to={`/vehicles/${vehicle.id}/report`}>
                      <FileDown className='w-4 h-4' />
                      Vehicle Report
                    </Link>
                  </Button>

                  {/* Edit Vehicle */}
                  <Button
                    asChild
                    variant='outline'
                    className='gap-2 border-white/10 hover:bg-white/5 w-full sm:w-auto'
                  >
                    <Link to={`/dashboard?editVehicle=${vehicle.id}`}>
                      <Edit className='h-4 w-4' />
                      Edit Vehicle
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
              <DialogContent className='w-[95vw] sm:max-w-[560px] p-0 overflow-hidden bg-dark-card border-white/10 text-foreground'>
                <div className='flex max-h-[calc(100vh-4rem)] flex-col'>
                  <DialogHeader className='shrink-0 p-6 pb-3'>
                    <DialogTitle>Share with Shop</DialogTitle>
                    <DialogDescription>
                      Generate a short-lived link & QR code the shop can scan to
                      submit services for this vehicle.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='flex-1 min-h-0 p-6 pt-3'>
                    <ShareWithShop vehicle={vehicle} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
              <Card className='bg-dark-card border-white/10'>
                <CardContent className='pt-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-foreground/70 text-sm mb-1'>
                        Health Score
                      </p>
                      <h3 className='text-3xl font-bold'>{healthScore}%</h3>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        healthScore >= 80
                          ? 'bg-green-500/10'
                          : healthScore >= 50
                          ? 'bg-yellow-500/10'
                          : 'bg-red-500/10'
                      }`}
                    >
                      <Car
                        className={`h-5 w-5 ${
                          healthScore >= 80
                            ? 'text-green-500'
                            : healthScore >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-dark-card border-white/10'>
                <CardContent className='pt-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-foreground/70 text-sm mb-1'>
                        Upcoming Services
                      </p>
                      <h3 className='text-3xl font-bold'>{upcomingCount}</h3>
                    </div>
                    <div className='bg-neon-blue/10 p-2 rounded-lg'>
                      <Clock className='h-5 w-5 text-neon-blue' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-dark-card border-white/10'>
                <CardContent className='pt-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-foreground/70 text-sm mb-1'>
                        Overdue Services
                      </p>
                      <h3 className='text-3xl font-bold'>{overdueCount}</h3>
                    </div>
                    <div className='bg-red-500/10 p-2 rounded-lg'>
                      <AlertTriangle className='h-5 w-5 text-red-500' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              <div className='lg:col-span-2'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-semibold'>Vehicle Information</h2>
                </div>

                <Card className='bg-dark-card border-white/10 mb-8'>
                  <CardContent className='p-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <h3 className='text-lg font-medium mb-4'>
                          Basic Information
                        </h3>
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>Make:</span>
                            <span className='font-medium'>{vehicle.make}</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>Model:</span>
                            <span className='font-medium'>{vehicle.model}</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>Year:</span>
                            <span className='font-medium'>{vehicle.year}</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>Color:</span>
                            <span className='font-medium'>
                              {vehicle.color || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>Mileage:</span>
                            <span className='font-medium'>
                              {vehicle.mileage
                                ? `${vehicle.mileage.toLocaleString()} miles`
                                : 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-medium mb-4'>
                          Additional Details
                        </h3>
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>VIN:</span>
                            <span className='font-medium'>
                              {vehicle.vin || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>
                              License Plate:
                            </span>
                            <span className='font-medium'>
                              {vehicle.license_plate || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-foreground/70'>
                              Purchase Date:
                            </span>
                            <span className='font-medium'>
                              {vehicle.purchase_date
                                ? new Date(
                                    vehicle.purchase_date
                                  ).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {vehicle.notes && (
                      <div className='mt-6 pt-6 border-t border-white/10'>
                        <h3 className='text-lg font-medium mb-2'>Notes</h3>
                        <p className='text-foreground/70'>{vehicle.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-semibold'>Maintenance History</h2>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-1 border-white/10 hover:bg-white/5'
                    asChild
                  >
                    <Link to={`/dashboard?addMaintenance=${vehicle.id}`}>
                      <Wrench className='h-4 w-4' />
                      <span>Add Service</span>
                    </Link>
                  </Button>
                </div>

                <div className='space-y-4'>
                  {vehicleMaintenance.length === 0 ? (
                    <Card className='bg-dark-card border-white/10'>
                      <CardContent className='p-6 text-center'>
                        <Wrench className='h-16 w-16 mx-auto text-foreground/20 mb-3' />
                        <h3 className='text-lg font-medium mb-1'>
                          No Maintenance Records
                        </h3>
                        <p className='text-foreground/70 mb-4'>
                          You haven't added any maintenance records for this
                          vehicle yet.
                        </p>
                        <Button asChild>
                          <Link to={`/dashboard?addMaintenance=${vehicle.id}`}>
                            Add First Maintenance Record
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    vehicleMaintenance.map((record) => (
                      <MaintenanceItem
                        key={record.id}
                        id={record.id}
                        title={record.type}
                        description={record.description}
                        date={record.date}
                        status={record.status}
                        mileage={record.mileage || undefined}
                        cost={record.cost || undefined}
                        vehicleId={record.vehicle_id}
                        onComplete={handleCompleteMaintenance}
                      />
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-semibold'>Vehicle Image</h2>
                </div>

                <Card className='bg-dark-card border-white/10 overflow-hidden mb-8'>
                  {vehicle.image ? (
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className='w-full aspect-video object-cover'
                    />
                  ) : (
                    <div className='w-full aspect-video bg-gradient-to-br from-dark-card to-dark-card/50 flex items-center justify-center'>
                      <Car className='w-20 h-20 text-foreground/20' />
                    </div>
                  )}
                </Card>

                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-semibold'>Quick Actions</h2>
                </div>

                <Card className='bg-dark-card border-white/10'>
                  <CardContent className='p-4'>
                    <div className='space-y-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-start gap-2 border-white/10 hover:bg-white/5'
                        asChild
                      >
                        <Link to={`/dashboard?addMaintenance=${vehicle.id}`}>
                          <Wrench className='h-4 w-4' />
                          <span>Add Maintenance Record</span>
                        </Link>
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-start gap-2 border-white/10 hover:bg-white/5'
                        asChild
                      >
                        <Link to={`/dashboard?editVehicle=${vehicle.id}`}>
                          <Edit className='h-4 w-4' />
                          <span>Edit Vehicle Details</span>
                        </Link>
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-start gap-2 border-white/10 hover:bg-white/5'
                        asChild
                      >
                        <Link to='/dashboard'>
                          <ArrowRight className='h-4 w-4' />
                          <span>View All Vehicles</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VehicleDetails;
