
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Wrench, Car, Calendar, DollarSign, Clock, Check, AlertTriangle, Edit, Trash } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const MaintenanceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { maintenanceRecords, loading: maintenanceLoading, deleteMaintenanceRecord, markMaintenanceAsCompleted } = useMaintenance();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [maintenance, setMaintenance] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  
  useEffect(() => {
    if (!id || maintenanceLoading) return;
    
    const foundMaintenance = maintenanceRecords.find(m => m.id === id);
    setMaintenance(foundMaintenance || null);
    
    if (foundMaintenance && !vehiclesLoading) {
      const relatedVehicle = vehicles.find(v => v.id === foundMaintenance.vehicle_id);
      setVehicle(relatedVehicle || null);
    }
  }, [id, maintenanceRecords, vehicles, maintenanceLoading, vehiclesLoading]);
  
  const handleComplete = () => {
    if (!maintenance) return;
    markMaintenanceAsCompleted(maintenance.id);
  };
  
  const handleDelete = () => {
    if (!maintenance) return;
    if (window.confirm('Are you sure you want to delete this maintenance record? This action cannot be undone.')) {
      deleteMaintenanceRecord(maintenance.id);
      window.location.href = '/dashboard';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusIcon = () => {
    if (!maintenance) return null;
    
    switch (maintenance.status) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'upcoming':
        return <Clock className="h-5 w-5 text-neon-blue" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = () => {
    if (!maintenance) return '';
    
    switch (maintenance.status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'upcoming':
        return 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };
  
  if (maintenanceLoading || vehiclesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-bg">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
  
  if (!maintenance) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-bg">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-4">Maintenance Record Not Found</h2>
              <p className="text-foreground/70 mb-6">The maintenance record you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button asChild>
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 hover:bg-white/5"
              asChild
            >
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{maintenance.type}</h1>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass()}`}>
                    {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}
                  </div>
                </div>
                {vehicle && (
                  <Link 
                    to={`/dashboard/vehicles/${vehicle.id}`} 
                    className="text-foreground/70 hover:text-neon-blue flex items-center gap-1"
                  >
                    <Car className="h-4 w-4" />
                    <span>{vehicle.year} {vehicle.make} {vehicle.model}</span>
                  </Link>
                )}
              </div>
              
              <div className="flex gap-2">
                {maintenance.status !== 'completed' && (
                  <Button onClick={handleComplete} className="bg-green-500 hover:bg-green-600 text-white">
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="border-white/10 hover:bg-white/5"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4 mr-2 text-red-400" />
                  Delete
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-dark-card border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-foreground/70 text-sm mb-1">Date</p>
                      <h3 className="text-xl font-bold">{formatDate(maintenance.date)}</h3>
                    </div>
                    <div className="bg-neon-blue/10 p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-neon-blue" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-card border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-foreground/70 text-sm mb-1">Mileage</p>
                      <h3 className="text-xl font-bold">{maintenance.mileage ? `${maintenance.mileage.toLocaleString()} miles` : 'Not specified'}</h3>
                    </div>
                    <div className="bg-yellow-500/10 p-2 rounded-lg">
                      <Car className="h-5 w-5 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-card border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-foreground/70 text-sm mb-1">Cost</p>
                      <h3 className="text-xl font-bold">{maintenance.cost ? `$${maintenance.cost.toFixed(2)}` : 'Not specified'}</h3>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-dark-card border-white/10 mb-8">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Maintenance Details</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Description</h3>
                        <p className="text-foreground/70">{maintenance.description || 'No description provided.'}</p>
                      </div>
                      
                      {maintenance.notes && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Notes</h3>
                          <p className="text-foreground/70">{maintenance.notes}</p>
                        </div>
                      )}
                      
                      {maintenance.performed_by && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Performed By</h3>
                          <p className="text-foreground/70">{maintenance.performed_by}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Quick Actions</h2>
                </div>
                
                <Card className="bg-dark-card border-white/10">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {vehicle && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2 border-white/10 hover:bg-white/5"
                          asChild
                        >
                          <Link to={`/dashboard/vehicles/${vehicle.id}`}>
                            <Car className="h-4 w-4" />
                            <span>View Vehicle Details</span>
                          </Link>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2 border-white/10 hover:bg-white/5"
                        asChild
                      >
                        <Link to={`/dashboard?addMaintenance=${maintenance.vehicle_id}`}>
                          <Wrench className="h-4 w-4" />
                          <span>Add New Maintenance</span>
                        </Link>
                      </Button>
                      
                      {maintenance.status !== 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2 border-white/10 hover:bg-green-500/10 text-green-500"
                          onClick={handleComplete}
                        >
                          <Check className="h-4 w-4" />
                          <span>Mark as Completed</span>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2 border-white/10 hover:bg-red-500/10 text-red-400"
                        onClick={handleDelete}
                      >
                        <Trash className="h-4 w-4" />
                        <span>Delete Record</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {vehicle && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Vehicle Information</h2>
                    </div>
                    
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {vehicle.image ? (
                            <img 
                              src={vehicle.image} 
                              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                              <Car className="w-8 h-8 text-foreground/20" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                            <p className="text-sm text-foreground/70">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Mileage not specified'}</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-center gap-2 border-white/10 hover:bg-white/5 mt-2"
                          asChild
                        >
                          <Link to={`/dashboard/vehicles/${vehicle.id}`}>
                            <Car className="h-4 w-4" />
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MaintenanceDetails;
