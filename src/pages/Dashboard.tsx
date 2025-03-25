
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarPlus, Car, Clock, LayoutDashboard, MessageSquare, Settings, SlashSquare, BarChart2, Tool, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import VehicleCard from '@/components/common/VehicleCard';
import MaintenanceItem from '@/components/common/MaintenanceItem';

// Mock data for demonstration
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
  
  const handleAddVehicle = () => {
    setIsAddVehicleOpen(true);
  };
  
  const handleDeleteVehicle = (id: string) => {
    console.log("Delete vehicle:", id);
    // In a real app, this would call an API to delete the vehicle
  };
  
  const handleEditVehicle = (id: string) => {
    console.log("Edit vehicle:", id);
    // In a real app, this would open an edit modal
  };
  
  const handleViewMaintenance = (id: string) => {
    console.log("View maintenance:", id);
    // In a real app, this would navigate to a detailed view
  };
  
  const handleCompleteMaintenance = (id: string) => {
    console.log("Complete maintenance:", id);
    // In a real app, this would update the maintenance record
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <DashboardHeader onAddVehicle={handleAddVehicle} />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-dark-card border border-white/10 p-1 mb-8 overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                <Car className="h-4 w-4 mr-2" />
                <span>Vehicles</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                <Tool className="h-4 w-4 mr-2" />
                <span>Maintenance</span>
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
                        <h3 className="text-3xl font-bold">{mockVehicles.length}</h3>
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
                        <h3 className="text-3xl font-bold">2</h3>
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
                        <p className="text-foreground/70 text-sm mb-1">Active Alerts</p>
                        <h3 className="text-3xl font-bold">1</h3>
                      </div>
                      <div className="bg-red-500/10 p-2 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
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
                      <Button variant="ghost" size="sm" className="gap-1 hover:bg-white/5">
                        <span>View All</span>
                        <SlashSquare className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mockVehicles.slice(0, 2).map((vehicle) => (
                        <VehicleCard 
                          key={vehicle.id}
                          {...vehicle}
                          onDelete={handleDeleteVehicle}
                          onEdit={handleEditVehicle}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Maintenance Summary</h2>
                      <Button variant="ghost" size="sm" className="gap-1 hover:bg-white/5">
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
                                <h3 className="text-2xl font-bold">5</h3>
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
                                <h3 className="text-2xl font-bold">2</h3>
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
                                <h3 className="text-2xl font-bold">1</h3>
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
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span>Add</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {mockMaintenanceTasks
                      .filter(task => task.status !== 'completed')
                      .map((task) => (
                        <MaintenanceItem
                          key={task.id}
                          {...task}
                          onView={handleViewMaintenance}
                          onComplete={handleCompleteMaintenance}
                        />
                      ))}
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
                        <div className="space-y-4">
                          {mockVehicles.map((vehicle) => (
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
                                  vehicle.healthScore >= 80 ? 'bg-green-500' : 
                                  vehicle.healthScore >= 50 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}></div>
                                <span className="font-medium">{vehicle.healthScore}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
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
                  {mockVehicles.map((vehicle) => (
                    <VehicleCard 
                      key={vehicle.id}
                      {...vehicle}
                      onDelete={handleDeleteVehicle}
                      onEdit={handleEditVehicle}
                    />
                  ))}
                  
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
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>Add Service</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {mockMaintenanceTasks.map((task) => (
                    <MaintenanceItem
                      key={task.id}
                      {...task}
                      onView={handleViewMaintenance}
                      onComplete={handleCompleteMaintenance}
                    />
                  ))}
                </div>
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
        </div>
      </main>
      
      <Footer />
      
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="sm:max-w-[525px] bg-dark-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter your vehicle information below. You can add service records later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Make</label>
                  <input
                    className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <input
                    className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                    placeholder="e.g. Camry"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                    placeholder="e.g. 2020"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Mileage</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                    placeholder="e.g. 45000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">VIN (Optional)</label>
                <input
                  className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                  placeholder="Vehicle Identification Number"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle Photo (Optional)</label>
                <div className="border border-dashed border-white/20 rounded-md p-8 text-center">
                  <Car className="w-10 h-10 text-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-foreground/70">
                    Drag and drop an image or <span className="text-neon-blue cursor-pointer">browse</span>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium">
                  Add Vehicle
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
