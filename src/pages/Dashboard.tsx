import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarPlus, Car, Clock, LayoutDashboard, MessageSquare, Settings, SlashSquare, BarChart2, Wrench, AlertTriangle, Check, Plus, Brain, CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import VehicleCard from '@/components/common/VehicleCard';
import MaintenanceItem from '@/components/common/MaintenanceItem';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';
import { useMaintenance, MaintenanceWithStatus } from '@/hooks/useMaintenance';
import { useMaintenancePredictions } from '@/hooks/useMaintenancePredictions';
import MaintenancePredictions from '@/components/dashboard/MaintenancePredictions';
import AddVehicleForm from '@/components/dashboard/AddVehicleForm';
import AddMaintenanceForm from '@/components/dashboard/AddMaintenanceForm';
import EditVehicleForm from '@/components/dashboard/EditVehicleForm';
import { toast } from 'sonner';

const mockVehicles = [
  {
    id: "v1",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3",
    mileage: 15000,
    nextService: "Oil Change in 2,000 miles",
    healthScore: 92,
    alerts: 0
  },
  {
    id: "v2",
    make: "Toyota",
    model: "Camry",
    year: 2019,
    image: "https://images.unsplash.com/photo-1679678691006-0ad24fecb769?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3",
    mileage: 45000,
    nextService: "Tire Rotation in 500 miles",
    healthScore: 78,
    alerts: 1
  },
  {
    id: "v3",
    make: "Ford",
    model: "F-150",
    year: 2020,
    image: "https://images.unsplash.com/photo-1605893477799-b99a3bc31408?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3",
    mileage: 32000,
    nextService: "Brake Check & Fluid Change",
    healthScore: 84,
    alerts: 0
  }
];

const mockMaintenanceTasks = [
  {
    id: "m1",
    title: "Oil Change",
    description: "Regular maintenance - synthetic oil change at certified dealership",
    date: "2023-12-15",
    status: "upcoming" as const,
    mileage: 17500,
    vehicleId: "v1"
  },
  {
    id: "m2",
    title: "Tire Rotation",
    description: "Front to back tire rotation and pressure check",
    date: "2023-12-05",
    status: "overdue" as const,
    mileage: 45500,
    vehicleId: "v2"
  },
  {
    id: "m3",
    title: "Brake Fluid Replacement",
    description: "Replacement of brake fluid and brake system inspection",
    date: "2023-11-20",
    status: "completed" as const,
    mileage: 31000,
    cost: 120.00,
    vehicleId: "v3"
  },
  {
    id: "m4",
    title: "Air Filter Replacement",
    description: "Replace cabin and engine air filters",
    date: "2023-12-28",
    status: "upcoming" as const,
    mileage: 17800,
    vehicleId: "v1"
  }
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { user } = useAuth();
  const { 
    vehicles, 
    loading: vehiclesLoading, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle 
  } = useVehicles();
  
  const { 
    maintenanceRecords, 
    loading: maintenanceLoading,
    addMaintenanceRecord,
    markMaintenanceAsCompleted,
    deleteMaintenanceRecord
  } = useMaintenance();
  
  const {
    predictions,
    urgentPredictions,
    loading: predictionsLoading
  } = useMaintenancePredictions();
  
  useEffect(() => {
    const demoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
    setIsDemoMode(demoMode);
  }, []);
  
  const displayVehicles = isDemoMode ? mockVehicles : vehicles;
  
  const normalizedMockTasks = mockMaintenanceTasks.map(task => ({
    ...task,
    type: task.title,
    vehicle_id: task.vehicleId
  }));
  
  const displayMaintenance = isDemoMode ? normalizedMockTasks : maintenanceRecords;
  
  const upcomingMaintenance = displayMaintenance.filter(task => 
    task.status === 'upcoming' || task.status === 'overdue'
  );
  
  const completedMaintenance = displayMaintenance.filter(task => 
    task.status === 'completed'
  );
  
  const overdueCount = displayMaintenance.filter(task => task.status === 'overdue').length;
  const upcomingCount = displayMaintenance.filter(task => task.status === 'upcoming').length;
  
  const handleAddVehicle = () => {
    if (isDemoMode) {
      toast.info('Feature disabled in demo mode');
      return;
    }
    setIsAddVehicleOpen(true);
  };
  
  const handleAddMaintenance = () => {
    if (isDemoMode) {
      toast.info('Feature disabled in demo mode');
      return;
    }
    setIsAddMaintenanceOpen(true);
  };
  
  const handleDeleteVehicle = (id: string) => {
    if (isDemoMode) {
      toast.info('Feature disabled in demo mode');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this vehicle? This will also delete all maintenance records associated with this vehicle.')) {
      deleteVehicle(id);
    }
  };
  
  const handleEditVehicle = (id: string) => {
    if (isDemoMode) {
      toast.info('Feature disabled in demo mode');
      return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setIsEditVehicleOpen(true);
    }
  };
  
  const handleViewMaintenance = (id: string) => {
    console.log("View maintenance:", id);
  };
  
  const handleCompleteMaintenance = (id: string) => {
    if (isDemoMode) {
      toast.info('Feature disabled in demo mode');
      return;
    }
    
    markMaintenanceAsCompleted(id);
  };
  
  const isLoading = vehiclesLoading || maintenanceLoading;
  
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <DashboardHeader onAddVehicle={handleAddVehicle} />
          
          {isDemoMode && (
            <div className="mb-6 p-4 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <p className="text-sm font-medium">
                You are viewing the demo mode with sample data. 
                <Link to="/dashboard" className="ml-2 underline">
                  Click here
                </Link> to view your actual data.
              </p>
            </div>
          )}
          
          {isLoading && !isDemoMode ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
              <span>Loading your dashboard...</span>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-dark-card border border-white/10 p-1 mb-8 overflow-x-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Car className="h-4 w-4 mr-2" />
                  <span>Vehicles</span>
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Wrench className="h-4 w-4 mr-2" />
                  <span>Maintenance</span>
                </TabsTrigger>
                <TabsTrigger value="predictions" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <Brain className="h-4 w-4 mr-2" />
                  <span>AI Predictions</span>
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span>AI Assistant</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-0 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-dark-card border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-foreground/70 text-sm mb-1">Total Vehicles</p>
                          <h3 className="text-3xl font-bold">{displayVehicles.length}</h3>
                        </div>
                        <div className="bg-neon-blue/10 p-2 rounded-lg">
                          <Car className="h-5 w-5 text-neon-blue" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-dark-card border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-foreground/70 text-sm mb-1">Upcoming Services</p>
                          <h3 className="text-3xl font-bold">{upcomingCount}</h3>
                        </div>
                        <div className="bg-neon-purple/10 p-2 rounded-lg">
                          <Clock className="h-5 w-5 text-neon-purple" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-dark-card border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-foreground/70 text-sm mb-1">AI Alerts</p>
                          <h3 className="text-3xl font-bold">{!isDemoMode ? urgentPredictions.length : 2}</h3>
                        </div>
                        <div className="bg-red-500/10 p-2 rounded-lg">
                          <Brain className="h-5 w-5 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Your Vehicles</h2>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1 hover:bg-white/5"
                          onClick={() => setActiveTab("vehicles")}
                        >
                          <span>View All</span>
                          <SlashSquare className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayVehicles.length === 0 ? (
                          <p className="text-foreground/70 col-span-2 text-center py-10">
                            You don't have any vehicles yet. 
                            <Button 
                              variant="link" 
                              className="text-neon-blue p-0 h-auto" 
                              onClick={handleAddVehicle}
                            >
                              Add your first vehicle
                            </Button>
                          </p>
                        ) : (
                          displayVehicles.slice(0, 2).map((vehicle) => (
                            <VehicleCard 
                              key={vehicle.id}
                              id={vehicle.id}
                              make={vehicle.make}
                              model={vehicle.model}
                              year={vehicle.year}
                              image={vehicle.image}
                              mileage={vehicle.mileage || 0}
                              nextService={upcomingMaintenance.find(m => m.vehicle_id === vehicle.id)?.description || "No upcoming services"}
                              healthScore={Math.floor(Math.random() * 30) + 70}
                              alerts={overdueCount}
                              onDelete={handleDeleteVehicle}
                              onEdit={handleEditVehicle}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Maintenance Summary</h2>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1 hover:bg-white/5"
                          onClick={() => setActiveTab("maintenance")}
                        >
                          <span>View History</span>
                          <SlashSquare className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Card className="bg-dark-card border-white/10">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-white/5">
                              <div className="flex items-start gap-3">
                                <div className="bg-green-500/10 p-2 rounded-lg">
                                  <Check className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <p className="text-foreground/70 text-sm">Completed</p>
                                  <h3 className="text-2xl font-bold">{completedMaintenance.length}</h3>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-white/5">
                              <div className="flex items-start gap-3">
                                <div className="bg-neon-blue/10 p-2 rounded-lg">
                                  <Clock className="h-5 w-5 text-neon-blue" />
                                </div>
                                <div>
                                  <p className="text-foreground/70 text-sm">Upcoming</p>
                                  <h3 className="text-2xl font-bold">{upcomingCount}</h3>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-white/5">
                              <div className="flex items-start gap-3">
                                <div className="bg-red-500/10 p-2 rounded-lg">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                  <p className="text-foreground/70 text-sm">Overdue</p>
                                  <h3 className="text-2xl font-bold">{overdueCount}</h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Upcoming Services</h2>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 border-white/10 hover:bg-white/5"
                        onClick={handleAddMaintenance}
                      >
                        <CalendarPlus className="h-4 w-4" />
                        <span>Add</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {upcomingMaintenance.length === 0 ? (
                        <p className="text-foreground/70 text-center py-10">
                          No upcoming maintenance scheduled.
                        </p>
                      ) : (
                        upcomingMaintenance.slice(0, 3).map((task) => (
                          <MaintenanceItem
                            key={task.id}
                            id={task.id}
                            title={task.type}
                            description={task.description}
                            date={task.date}
                            status={task.status}
                            mileage={task.mileage || undefined}
                            cost={task.cost || undefined}
                            onView={handleViewMaintenance}
                            onComplete={handleCompleteMaintenance}
                          />
                        ))
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Vehicle Health</h2>
                        <Button variant="ghost" size="sm" className="gap-1 hover:bg-white/5">
                          <BarChart2 className="h-4 w-4" />
                          <span>Details</span>
                        </Button>
                      </div>
                      
                      <Card className="bg-dark-card border-white/10">
                        <CardContent className="p-4">
                          {displayVehicles.length === 0 ? (
                            <p className="text-foreground/70 text-center py-6">
                              Add vehicles to see health status.
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {displayVehicles.map((vehicle) => {
                                const healthScore = Math.floor(Math.random() * 30) + 70;
                                
                                return (
                                  <div key={vehicle.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                        <Car className="w-5 h-5 text-foreground/70" />
                                      </div>
                                      <div>
                                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                                        <p className="text-sm text-foreground/70">{vehicle.year}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${
                                        healthScore >= 80 ? 'bg-green-500' : 
                                        healthScore >= 50 ? 'bg-yellow-500' : 
                                        'bg-red-500'
                                      }`}></div>
                                      <span className="font-medium">{healthScore}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="vehicles" className="mt-0 animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Your Vehicles</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 border-white/10 hover:bg-white/5"
                      onClick={handleAddVehicle}
                    >
                      <Car className="h-4 w-4" />
                      <span>Add Vehicle</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayVehicles.length === 0 && !isDemoMode ? (
                      <div className="col-span-full text-center py-12">
                        <Car className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Vehicles Found</h3>
                        <p className="text-foreground/70 mb-6">You haven't added any vehicles yet.</p>
                        <Button 
                          className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium"
                          onClick={handleAddVehicle}
                        >
                          Add Your First Vehicle
                        </Button>
                      </div>
                    ) : (
                      <>
                        {displayVehicles.map((vehicle) => (
                          <VehicleCard 
                            key={vehicle.id}
                            id={vehicle.id}
                            make={vehicle.make}
                            model={vehicle.model}
                            year={vehicle.year}
                            image={vehicle.image}
                            mileage={vehicle.mileage || 0}
                            nextService={upcomingMaintenance.find(m => m.vehicle_id === vehicle.id)?.description || "No upcoming services"}
                            healthScore={Math.floor(Math.random() * 30) + 70}
                            alerts={overdueCount}
                            onDelete={handleDeleteVehicle}
                            onEdit={handleEditVehicle}
                          />
                        ))}
                        
                        {!isDemoMode && (
                          <div 
                            className="glass-card rounded-xl flex flex-col items-center justify-center p-8 border border-dashed border-white/20 hover:border-neon-blue/50 transition-colors cursor-pointer min-h-[300px]"
                            onClick={handleAddVehicle}
                          >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                              <Plus className="w-8 h-8 text-neon-blue" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Add New Vehicle</h3>
                            <p className="text-foreground/70 text-center">Track maintenance and get personalized service reminders</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="maintenance" className="mt-0 animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Maintenance Schedule</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 border-white/10 hover:bg-white/5"
                      onClick={handleAddMaintenance}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span>Add Service</span>
                    </Button>
                  </div>
                  
                  {displayMaintenance.length === 0 && !isDemoMode ? (
                    <div className="text-center py-12">
                      <Wrench className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Maintenance Records</h3>
                      <p className="text-foreground/70 mb-6">You haven't added any maintenance records yet.</p>
                      <Button 
                        className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium"
                        onClick={handleAddMaintenance}
                      >
                        Schedule Your First Maintenance
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayMaintenance.map((task) => (
                        <MaintenanceItem
                          key={task.id}
                          id={task.id}
                          title={task.type}
                          description={task.description}
                          date={task.date}
                          status={task.status}
                          mileage={task.mileage || undefined}
                          cost={task.cost || undefined}
                          onView={handleViewMaintenance}
                          onComplete={handleCompleteMaintenance}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="predictions" className="mt-0 animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">AI Maintenance Predictions</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 border-white/10 hover:bg-white/5"
                      onClick={handleAddMaintenance}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span>Add Maintenance</span>
                    </Button>
                  </div>
                  
                  {isDemoMode ? (
                    <div className="space-y-4">
                      <Card className="bg-dark-card border-white/10 p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">How It Works</h3>
                            <p className="text-foreground/70">The AI analyzes your vehicle maintenance history to predict future service needs</p>
                          </div>
                          <div className="bg-neon-blue/10 p-2 rounded-lg">
                            <Brain className="h-5 w-5 text-neon-blue" />
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium mb-2">1. Data Collection</h4>
                            <p className="text-sm text-foreground/70">Records your maintenance history and vehicle details</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium mb-2">2. Pattern Analysis</h4>
                            <p className="text-sm text-foreground/70">Identifies intervals between similar maintenance tasks</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium mb-2">3. Smart Predictions</h4>
                            <p className="text-sm text-foreground/70">Uses your patterns and industry standards to predict future needs</p>
                          </div>
                        </div>
                      </Card>
                      
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-start gap-3">
                            <div className="bg-red-500/10 p-2 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <h4 className="font-medium">Oil Change Due</h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 font-medium">
                                  Overdue by 2 days
                                </span>
                              </div>
                              <p className="text-sm text-foreground/70">2022 Tesla Model 3</p>
                              <p className="text-sm mt-1">Based on your average of 182 days between oil changes</p>
                              <div className="mt-2 flex items-center text-xs text-foreground/60">
                                <span>Last service: March 15, 2023 at 12,500 miles • Confidence: 85%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-start gap-3">
                            <div className="bg-yellow-500/10 p-2 rounded-lg">
                              <Clock className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <h4 className="font-medium">Tire Rotation</h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-medium">
                                  Due in 14 days
                                </span>
                              </div>
                              <p className="text-sm text-foreground/70">2019 Toyota Camry</p>
                              <p className="text-sm mt-1">Predicted at 46,000 miles</p>
                              <div className="mt-2 flex items-center text-xs text-foreground/60">
                                <span>Last service: May 3, 2023 at 40,000 miles • Confidence: 78%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                              <CalendarIcon className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <h4 className="font-medium">Brake Inspection</h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                                  Due in 45 days
                                </span>
                              </div>
                              <p className="text-sm text-foreground/70">2020 Ford F-150</p>
                              <p className="text-sm mt-1">Scheduled for October 15, 2023</p>
                              <div className="mt-2 flex items-center text-xs text-foreground/60">
                                <span>Based on manufacturer recommendations • Confidence: 70%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (!predictionsLoading && predictions.length === 0 && maintenanceRecords.length < 2) ? (
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6 text-center">
                        <Brain className="w-16 h-16 mx-auto text-foreground/20 mb-4" />
                        <h3 className="text-xl font-medium mb-2">Not Enough Data</h3>
                        <p className="text-foreground/70 max-w-md mx-auto mb-6">
                          Add at least 2 maintenance records of the same type for a vehicle to enable AI predictions. 
                          More history means more accurate predictions!
                        </p>
                        <Button 
                          className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium"
                          onClick={handleAddMaintenance}
                        >
                          Add Maintenance Records
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <Card className="bg-dark-card border-white/10 p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">How It Works</h3>
                            <p className="text-foreground/70">The AI analyzes your vehicle maintenance history to predict future service needs</p>
                          </div>
                          <div className="bg-neon-blue/10 p-2 rounded-lg">
                            <Brain className="h-5 w-5 text-neon-blue" />
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium mb-2">1. Data Collection</h4>
                            <p className="text-sm text-foreground/70">Records your maintenance history and vehicle details</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium mb-2">2. Pattern Analysis</h4>
                            <p className="text-sm text-foreground/70">Identifies intervals between similar maintenance tasks</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium mb-2">3. Smart Predictions</h4>
                            <p className="text-sm text-foreground/70">Uses your patterns and industry standards to predict future needs</p>
                          </div>
                        </div>
                      </Card>
                      
                      <MaintenancePredictions showAll={true} />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ai-assistant" className="mt-0 animate-fade-in">
                <div className="mb-6">
                  <Card className="bg-dark-card border-white/10">
                    <CardContent className="p-6">
                      <div className="text-center max-w-2xl mx-auto py-8">
                        <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center mx-auto mb-6">
                          <MessageSquare className="w-8 h-8 text-neon-purple" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">
                          AI Repair Assistant
                        </h2>
                        <p className="text-foreground/70 mb-6">
                          Get expert advice on vehicle repairs, maintenance tips, and DIY guidance. 
                          Our AI assistant can help diagnose issues and provide step-by-step 
                          instructions for common repairs.
                        </p>
                        <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                          Start Conversation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <Footer />
      
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="sm:max-w-[525px] bg-dark-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter your vehicle information below. You can add service records later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <AddVehicleForm 
              onSubmit={async (data) => {
                const success = await addVehicle(data);
                if (success) {
                  setIsAddVehicleOpen(false);
                  return success;
                }
                return null;
              }}
              onCancel={() => setIsAddVehicleOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
        <DialogContent className="sm:max-w-[525px] bg-dark-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update your vehicle information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedVehicle && (
              <EditVehicleForm 
                vehicle={selectedVehicle}
                onSubmit={async (data) => {
                  const success = await updateVehicle(selectedVehicle.id, data);
                  if (success) {
                    setIsEditVehicleOpen(false);
                    setSelectedVehicle(null);
                    return success;
                  }
                  return false;
                }}
                onCancel={() => {
                  setIsEditVehicleOpen(false);
                  setSelectedVehicle(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddMaintenanceOpen} onOpenChange={setIsAddMaintenanceOpen}>
        <DialogContent className="sm:max-w-[525px] bg-dark-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            <DialogDescription>
              Enter maintenance details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <AddMaintenanceForm 
              vehicles={vehicles}
              onSubmit={async (data) => {
                const success = await addMaintenanceRecord(data);
                if (success) {
                  setIsAddMaintenanceOpen(false);
                  return true;
                }
                return false;
              }}
              onCancel={() => setIsAddMaintenanceOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
