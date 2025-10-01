import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarPlus,
  Car,
  Clock,
  LayoutDashboard,
  MessageSquare,
  Wrench,
  AlertTriangle,
  Check,
  Plus,
  Brain,
  Lock,
  SlashSquare,
} from 'lucide-react';

import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import VehicleCard from '@/components/common/VehicleCard';
import MaintenanceItem from '@/components/common/MaintenanceItem';

import { useAuth } from '@/contexts/AuthContext';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';
import {
  useMaintenanceLogs,
  MaintenanceLogWithItems,
  MaintenanceItem as MaintItem,
  MaintenanceStatus,
} from '@/hooks/useMaintenanceLogs';

import { useMaintenancePredictions } from '@/hooks/useMaintenancePredictions';
import MaintenancePredictions from '@/components/dashboard/MaintenancePredictions';

import AddVehicleForm from '@/components/dashboard/AddVehicleForm';
import EditVehicleForm from '@/components/dashboard/EditVehicleForm';
import AddMaintenanceForm from '@/components/dashboard/AddMaintenanceForm';
import VehicleHealthModal from '@/components/dashboard/VehicleHealthModal';
import AIAssistant from '@/components/dashboard/AIAssistant';
import { FeatureGate } from '@/components/FeatureGate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Status = 'completed' | 'upcoming' | 'overdue';

function aggregateStatus(items: MaintItem[]): Status {
  if (items.some((i) => i.status === 'overdue')) return 'overdue';
  if (items.some((i) => i.status === 'upcoming')) return 'upcoming';
  return 'completed';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { isPro, subscriptionData } = useAuth();

  const {
    vehicles,
    loading: vehiclesLoading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  } = useVehicles();

  const {
    logs,
    loading: logsLoading,
    fetchLogs,
    deleteLog,
  } = useMaintenanceLogs();

  const { urgentPredictions } = useMaintenancePredictions();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const isLoading = vehiclesLoading || logsLoading;

  const overdueCount = useMemo(
    () => logs.filter((l) => aggregateStatus(l.items) === 'overdue').length,
    [logs]
  );
  const upcomingCount = useMemo(
    () => logs.filter((l) => aggregateStatus(l.items) === 'upcoming').length,
    [logs]
  );
  const completedCount = useMemo(
    () => logs.filter((l) => aggregateStatus(l.items) === 'completed').length,
    [logs]
  );

  const vehicleLimit = subscriptionData?.vehicles_limit ?? 1;
  const maintLimit = subscriptionData?.maintenance_limit ?? 25;

  const canAddVehicle = vehicleLimit < 0 || vehicles.length < vehicleLimit;
  const canAddMaintenance = maintLimit < 0 || logs.length < maintLimit;

  const handleAddVehicle = () => {
    if (!canAddVehicle) {
      toast.error(
        vehicleLimit === 1
          ? 'You’ve reached your plan limit of 1 vehicle.'
          : `You’ve reached your plan limit of ${vehicleLimit} vehicles.`
      );
      return;
    }
    setIsAddVehicleOpen(true);
  };

  const handleEditVehicle = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    if (v) {
      setSelectedVehicle(v);
      setIsEditVehicleOpen(true);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this vehicle? This will also delete all maintenance logs associated with this vehicle.'
      )
    ) {
      deleteVehicle(id);
    }
  };

  const handleAddMaintenance = () => {
    if (!canAddMaintenance) {
      toast.error(
        maintLimit === 1
          ? 'You’ve reached your plan limit of 1 maintenance log.'
          : `You’ve reached your plan limit of ${maintLimit} maintenance logs.`
      );
      return;
    }
    setIsAddMaintenanceOpen(true);
  };

  const handleViewMaintenance = (logId: string) => {
    navigate(`/dashboard/maintenance/${logId}`);
  };

  // Helpers to display logs using your existing <MaintenanceItem /> card
  const toMaintenanceItemProps = (log: MaintenanceLogWithItems) => {
    const status = aggregateStatus(log.items);
    const title =
      log.items.length > 0
        ? log.items.map((i) => i.type).join(', ')
        : 'Maintenance';
    const description =
      log.notes ||
      (log.items.length > 0 ? log.items[0].description ?? '' : '') ||
      'Maintenance log';
    return {
      id: log.id,
      title,
      description,
      date: log.date,
      status,
      mileage: log.mileage ?? undefined,
      cost: log.totals.grand_total ?? undefined,
    };
  };

  return (
    <div className='min-h-screen flex flex-col bg-dark-bg'>
      <Navbar />

      <main className='flex-1 pt-28 pb-16'>
        <div className='container mx-auto px-4'>
          <DashboardHeader onAddVehicle={handleAddVehicle} />

          {vehicles.length === 0 && logs.length === 0 && (
            <Card className='bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border-white/10 mb-8'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='bg-neon-blue/20 p-3 rounded-full'>
                    <Car className='h-6 w-6 text-neon-blue' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold mb-2'>
                      Welcome to AutoMate!
                    </h3>
                    <p className='text-foreground/70 mb-4'>
                      Add your first vehicle to start tracking maintenance and
                      get AI-powered insights.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <Button
                        onClick={handleAddVehicle}
                        className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Add Your First Vehicle
                      </Button>
                      <Button
                        variant='outline'
                        className='border-white/10 hover:bg-white/5'
                      >
                        <Link to='/pricing' className='flex items-center gap-2'>
                          <Lock className='h-4 w-4' />
                          View Pro Features
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
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
              <span>Loading your dashboard...</span>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid grid-cols-2 md:grid-cols-5 gap-2 bg-dark-card border border-white/10 p-1 mb-8 overflow-x-auto'>
                <TabsTrigger
                  value='overview'
                  className='data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                >
                  <LayoutDashboard className='h-4 w-4 mr-2' />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value='vehicles'
                  className='data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                >
                  <Car className='h-4 w-4 mr-2' />
                  <span>Vehicles</span>
                </TabsTrigger>
                <TabsTrigger
                  value='maintenance'
                  className='data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                >
                  <Wrench className='h-4 w-4 mr-2' />
                  <span>Maintenance</span>
                </TabsTrigger>
                <TabsTrigger
                  value='predictions'
                  className='data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                >
                  <Brain className='h-4 w-4 mr-2' />
                  <span>AI Predictions</span>
                  {!isPro && (
                    <span className='ml-2 inline-flex items-center text-xs text-foreground/60'>
                      <Lock className='h-3 w-3 mr-1' />
                      Pro
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='ai-assistant'
                  className='data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                >
                  <MessageSquare className='h-4 w-4 mr-2' />
                  <span>AI Assistant</span>
                  {!isPro && (
                    <span className='ml-2 inline-flex items-center text-xs text-foreground/60'>
                      <Lock className='h-3 w-3 mr-1' />
                      Pro
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value='overview' className='mt-0 animate-fade-in'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                  <Card className='bg-dark-card border-white/10'>
                    <CardContent className='pt-6'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='text-foreground/70 text-sm mb-1'>
                            Total Vehicles
                          </p>
                          <h3 className='text-3xl font-bold'>
                            {vehicles.length}
                          </h3>
                          <p className='text-xs text-foreground/50 mt-1'>
                            {vehicles.length === 0
                              ? 'Add your first vehicle to get started'
                              : "Click 'Add Vehicle' to add more"}
                          </p>
                        </div>
                        <div className='bg-neon-blue/10 p-2 rounded-lg'>
                          <Car className='h-5 w-5 text-neon-blue' />
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
                          <h3 className='text-3xl font-bold'>
                            {upcomingCount}
                          </h3>
                          <p className='text-xs text-foreground/50 mt-1'>
                            {upcomingCount === 0
                              ? 'No upcoming services scheduled'
                              : 'Services requiring attention'}
                          </p>
                        </div>
                        <div className='bg-neon-purple/10 p-2 rounded-lg'>
                          <Clock className='h-5 w-5 text-neon-purple' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-dark-card border-white/10'>
                    <CardContent className='pt-6'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='text-foreground/70 text-sm mb-1'>
                            AI Alerts
                          </p>
                          <h3 className='text-3xl font-bold'>
                            {isPro ? urgentPredictions.length : 0}
                          </h3>
                          <p className='text-xs text-foreground/50 mt-1'>
                            {isPro
                              ? 'Predictive maintenance insights'
                              : 'Upgrade to Pro for AI alerts'}
                          </p>
                        </div>
                        <div className='bg-red-500/10 p-2 rounded-lg'>
                          <Brain className='h-5 w-5 text-red-500' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                  {/* Vehicles quick view */}
                  <div className='lg:col-span-2 space-y-6'>
                    <div>
                      <div className='flex items-center justify-between mb-4'>
                        <div>
                          <h2 className='text-xl font-semibold'>
                            Your Vehicles
                          </h2>
                          <p className='text-foreground/60'>
                            Add vehicles to track maintenance and get reminders
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='gap-1 hover:bg-white/5'
                          onClick={() => setActiveTab('vehicles')}
                        >
                          <span>View All</span>
                          <SlashSquare className='h-4 w-4' />
                        </Button>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {vehicles.length === 0 ? (
                          <Card className='col-span-2 bg-dark-card border-white/10 border-dashed'>
                            <CardContent className='p-8 text-center'>
                              <Car className='w-12 h-12 text-foreground/20 mx-auto mb-4' />
                              <h3 className='text-lg font-medium mb-2'>
                                No Vehicles Added
                              </h3>
                              <p className='text-foreground/70 mb-4'>
                                Start by adding your first vehicle to track
                                maintenance and get reminders.
                              </p>
                              <Button
                                className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                                onClick={handleAddVehicle}
                              >
                                <Plus className='h-4 w-4 mr-2' />
                                Add Your First Vehicle
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          vehicles.slice(0, 2).map((vehicle) => {
                            const nextLog = logs.find(
                              (l) => l.vehicle_id === vehicle.id
                            );
                            const nextService = nextLog
                              ? nextLog.items.map((i) => i.type).join(', ')
                              : 'No recent logs';
                            return (
                              <VehicleCard
                                key={vehicle.id}
                                id={vehicle.id}
                                make={vehicle.make}
                                model={vehicle.model}
                                year={vehicle.year}
                                image={vehicle.image}
                                mileage={vehicle.mileage || 0}
                                nextService={nextService}
                                healthScore={
                                  Math.floor(Math.random() * 30) + 70
                                }
                                alerts={overdueCount}
                                onDelete={handleDeleteVehicle}
                                onEdit={handleEditVehicle}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Maintenance summary */}
                    <div>
                      <div className='flex items-center justify-between mb-4'>
                        <h2 className='text-xl font-semibold'>
                          Maintenance Summary
                        </h2>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='gap-1 hover:bg-white/5'
                          onClick={() => setActiveTab('maintenance')}
                        >
                          <span>View History</span>
                          <SlashSquare className='h-4 w-4' />
                        </Button>
                      </div>

                      <Card className='bg-dark-card border-white/10'>
                        <CardContent className='p-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='p-4 rounded-lg bg-white/5'>
                              <div className='flex items-start gap-3'>
                                <div className='bg-green-500/10 p-2 rounded-lg'>
                                  <Check className='h-5 w-5 text-green-500' />
                                </div>
                                <div>
                                  <p className='text-foreground/70 text-sm'>
                                    Completed
                                  </p>
                                  <h3 className='text-2xl font-bold'>
                                    {completedCount}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            <div className='p-4 rounded-lg bg-white/5'>
                              <div className='flex items-start gap-3'>
                                <div className='bg-neon-blue/10 p-2 rounded-lg'>
                                  <Clock className='h-5 w-5 text-neon-blue' />
                                </div>
                                <div>
                                  <p className='text-foreground/70 text-sm'>
                                    Upcoming
                                  </p>
                                  <h3 className='text-2xl font-bold'>
                                    {upcomingCount}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            <div className='p-4 rounded-lg bg-white/5'>
                              <div className='flex items-start gap-3'>
                                <div className='bg-red-500/10 p-2 rounded-lg'>
                                  <AlertTriangle className='h-5 w-5 text-red-500' />
                                </div>
                                <div>
                                  <p className='text-foreground/70 text-sm'>
                                    Overdue
                                  </p>
                                  <h3 className='text-2xl font-bold'>
                                    {overdueCount}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Upcoming services */}
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <h2 className='text-xl font-semibold'>
                          Upcoming Services
                        </h2>
                        <p className='text-foreground/60'>
                          Schedule and track vehicle maintenance
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-1 border-white/10 hover:bg-white/5'
                        onClick={handleAddMaintenance}
                        disabled={!canAddMaintenance}
                        title={
                          !canAddMaintenance
                            ? `Limit reached${
                                Number.isFinite(maintLimit)
                                  ? ` (${maintLimit})`
                                  : ''
                              }`
                            : undefined
                        }
                      >
                        <CalendarPlus className='h-4 w-4' />
                        <span>
                          {canAddMaintenance ? 'Add' : 'Limit reached'}
                        </span>
                      </Button>
                    </div>

                    <div className='space-y-4'>
                      {logs
                        .filter((l) => {
                          const s = aggregateStatus(l.items);
                          return s === 'upcoming' || s === 'overdue';
                        })
                        .slice(0, 3)
                        .map((log) => {
                          const card = toMaintenanceItemProps(log);
                          return (
                            <MaintenanceItem
                              key={log.id}
                              id={card.id}
                              title={card.title}
                              description={card.description}
                              date={card.date}
                              status={card.status}
                              mileage={card.mileage}
                              cost={card.cost}
                              onView={handleViewMaintenance}
                            />
                          );
                        })}

                      {logs.length === 0 && (
                        <Card className='bg-dark-card border-white/10 border-dashed'>
                          <CardContent className='p-6 text-center'>
                            <Wrench className='w-8 h-8 text-foreground/20 mx-auto mb-3' />
                            <h3 className='font-medium mb-1'>
                              No Services Scheduled
                            </h3>
                            <p className='text-sm text-foreground/70 mb-4'>
                              Add maintenance logs to track your vehicle&apos;s
                              service history.
                            </p>
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-white/10 hover:bg-white/5'
                              onClick={handleAddMaintenance}
                              disabled={!canAddMaintenance}
                              title={
                                !canAddMaintenance
                                  ? `Limit reached${
                                      Number.isFinite(maintLimit)
                                        ? ` (${maintLimit})`
                                        : ''
                                    }`
                                  : undefined
                              }
                            >
                              <CalendarPlus className='h-4 w-4 mr-2' />
                              {canAddMaintenance
                                ? 'Schedule Service'
                                : 'Limit reached'}
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Vehicles */}
              <TabsContent value='vehicles' className='mt-0 animate-fade-in'>
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h2 className='text-xl font-semibold'>Your Vehicles</h2>
                      <p className='text-foreground/60'>
                        Manage your vehicles and track maintenance
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-1 border-white/10 hover:bg-white/5'
                      onClick={handleAddVehicle}
                    >
                      <Car className='h-4 w-4' />
                      <span>Add Vehicle</span>
                    </Button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {vehicles.length === 0 ? (
                      <div className='col-span-full text-center py-12'>
                        <Car className='w-16 h-16 text-foreground/20 mx-auto mb-4' />
                        <h3 className='text-xl font-medium mb-2'>
                          No Vehicles Found
                        </h3>
                        <p className='text-foreground/70 mb-6 max-w-md mx-auto'>
                          Add your first vehicle to start tracking maintenance
                          and get reminders.
                        </p>
                        <Button
                          className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                          onClick={handleAddVehicle}
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Add Your First Vehicle
                        </Button>
                      </div>
                    ) : (
                      vehicles.map((vehicle) => {
                        const nextLog = logs.find(
                          (l) => l.vehicle_id === vehicle.id
                        );
                        const nextService = nextLog
                          ? nextLog.items.map((i) => i.type).join(', ')
                          : 'No recent logs';
                        return (
                          <VehicleCard
                            key={vehicle.id}
                            id={vehicle.id}
                            make={vehicle.make}
                            model={vehicle.model}
                            year={vehicle.year}
                            image={vehicle.image}
                            mileage={vehicle.mileage || 0}
                            nextService={nextService}
                            healthScore={Math.floor(Math.random() * 30) + 70}
                            alerts={overdueCount}
                            onDelete={handleDeleteVehicle}
                            onEdit={handleEditVehicle}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Maintenance (full list) */}
              <TabsContent value='maintenance' className='mt-0 animate-fade-in'>
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h2 className='text-xl font-semibold'>
                        Maintenance Logs
                      </h2>
                      <p className='text-foreground/60'>
                        Track completed services and schedule upcoming
                        maintenance
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-1 border-white/10 hover:bg-white/5'
                      onClick={handleAddMaintenance}
                      disabled={!canAddMaintenance}
                      title={
                        !canAddMaintenance
                          ? `Limit reached${
                              Number.isFinite(maintLimit)
                                ? ` (${maintLimit})`
                                : ''
                            }`
                          : undefined
                      }
                    >
                      <CalendarPlus className='h-4 w-4' />
                      <span>
                        {canAddMaintenance ? 'Add Service' : 'Limit reached'}
                      </span>
                    </Button>
                  </div>

                  {logs.length === 0 ? (
                    <div className='text-center py-12'>
                      <Wrench className='w-16 h-16 text-foreground/20 mx-auto mb-4' />
                      <h3 className='text-xl font-medium mb-2'>
                        No Maintenance Logs
                      </h3>
                      <p className='text-foreground/70 mb-6 max-w-md mx-auto'>
                        Start tracking your vehicle&apos;s maintenance history.
                        Add both completed services and schedule upcoming
                        maintenance.
                      </p>
                      <Button
                        className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                        onClick={handleAddMaintenance}
                      >
                        <CalendarPlus className='h-4 w-4 mr-2' />
                        Schedule Your First Maintenance
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {logs.map((log) => {
                        const card = toMaintenanceItemProps(log);
                        return (
                          <MaintenanceItem
                            key={log.id}
                            id={card.id}
                            title={card.title}
                            description={card.description}
                            date={card.date}
                            status={card.status}
                            mileage={card.mileage}
                            cost={card.cost}
                            onView={handleViewMaintenance}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Predictions */}
              <TabsContent value='predictions' className='mt-0 animate-fade-in'>
                <FeatureGate
                  enabled={isPro}
                  fallback={
                    <Card className='bg-dark-card border-white/10'>
                      <CardContent className='p-6 text-center'>
                        <Brain className='w-16 h-16 mx-auto text-foreground/20 mb-3' />
                        <h3 className='text-lg font-semibold mb-2'>
                          Pro Feature
                        </h3>
                        <p className='text-foreground/70 mb-6'>
                          AI Maintenance Predictions are available on the Pro
                          plan.
                        </p>
                        <Link to='/pricing'>
                          <Button className='bg-neon-blue hover:bg-neon-blue/90 text-black'>
                            See Plans
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  }
                >
                  <div className='mb-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-xl font-semibold'>
                        AI Maintenance Predictions
                      </h2>
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-1 border-white/10 hover:bg-white/5'
                        onClick={handleAddMaintenance}
                        disabled={!canAddMaintenance}
                        title={
                          !canAddMaintenance
                            ? `Limit reached${
                                Number.isFinite(maintLimit)
                                  ? ` (${maintLimit})`
                                  : ''
                              }`
                            : undefined
                        }
                      >
                        <CalendarPlus className='h-4 w-4' />
                        <span>
                          {canAddMaintenance
                            ? 'Add Maintenance'
                            : 'Limit reached'}
                        </span>
                      </Button>
                    </div>
                    <MaintenancePredictions showAll />
                  </div>
                </FeatureGate>
              </TabsContent>

              {/* AI Assistant */}
              <TabsContent
                value='ai-assistant'
                className='mt-0 animate-fade-in'
              >
                <FeatureGate
                  enabled={isPro}
                  fallback={
                    <Card className='bg-dark-card border-white/10 min-h-[360px] flex items-center justify-center'>
                      <div className='text-center px-6'>
                        <MessageSquare className='w-12 h-12 mx-auto text-foreground/30 mb-3' />
                        <h3 className='text-lg font-semibold mb-1'>
                          AI Assistant (Pro)
                        </h3>
                        <p className='text-foreground/70 mb-4'>
                          Unlock AI maintenance tips and troubleshooting by
                          upgrading to Pro.
                        </p>
                        <Link to='/pricing'>
                          <Button className='bg-neon-blue hover:bg-neon-blue/90 text-black'>
                            Upgrade to Pro
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  }
                >
                  <Card className='bg-dark-card border-white/10 min-h-[600px] flex flex-col'>
                    <AIAssistant />
                  </Card>
                </FeatureGate>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />

      {/* Add Vehicle */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className='w-[95vw] sm:max-w-[560px] p-0 overflow-hidden bg-dark-card border-white/10 text-foreground'>
          <div className='flex max-h-[calc(100vh-4rem)] flex-col'>
            <DialogHeader className='shrink-0 p-6 pb-3'>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Enter your vehicle information below. You can add service
                records later.
              </DialogDescription>
            </DialogHeader>

            <div className='flex-1 min-h-0 p-6 pt-3'>
              <AddVehicleForm
                onSubmit={async (data) => {
                  const vehicle = await addVehicle(data);
                  if (vehicle) setIsAddVehicleOpen(false);
                  return vehicle;
                }}
                onCancel={() => setIsAddVehicleOpen(false)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle */}
      <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
        <DialogContent className='w-[95vw] sm:max-w-[560px] p-0 overflow-hidden bg-dark-card border-white/10 text-foreground'>
          <div className='flex max-h-[calc(100vh-4rem)] flex-col'>
            <DialogHeader className='shrink-0 p-6 pb-3'>
              <DialogTitle>Edit Vehicle</DialogTitle>
              <DialogDescription>
                Update your vehicle information below.
              </DialogDescription>
            </DialogHeader>

            <div className='flex-1 min-h-0 p-6 pt-3'>
              {selectedVehicle && (
                <EditVehicleForm
                  vehicle={selectedVehicle}
                  onSubmit={async (data) => {
                    const ok = await updateVehicle(selectedVehicle.id, data);
                    if (ok) {
                      setIsEditVehicleOpen(false);
                      setSelectedVehicle(null);
                    }
                    return ok;
                  }}
                  onCancel={() => {
                    setIsEditVehicleOpen(false);
                    setSelectedVehicle(null);
                  }}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance (uses new AddMaintenanceForm API with onCreated) */}
      <Dialog
        open={isAddMaintenanceOpen}
        onOpenChange={setIsAddMaintenanceOpen}
      >
        <DialogContent className='w-[95vw] sm:max-w-[560px] p-0 overflow-hidden bg-dark-card border-white/10 text-foreground'>
          <div className='flex max-h-[calc(100vh-4rem)] flex-col'>
            <DialogHeader className='shrink-0 p-6 pb-3'>
              <DialogTitle>Add Maintenance Log</DialogTitle>
              <DialogDescription>
                Enter maintenance details below.
              </DialogDescription>
            </DialogHeader>

            <div className='flex-1 min-h-0 p-6 pt-3'>
              <AddMaintenanceForm
                vehicles={vehicles}
                onCancel={() => setIsAddMaintenanceOpen(false)}
                onCreated={() => {
                  setIsAddMaintenanceOpen(false);
                  fetchLogs();
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keep health modal scaffold (hook up open/state when you re-enable this feature) */}
      <VehicleHealthModal
        isOpen={false}
        onClose={() => void 0}
        vehicle={undefined}
        maintenanceRecords={[]}
      />
    </div>
  );
}
