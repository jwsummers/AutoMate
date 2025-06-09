
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useMaintenance } from '@/hooks/useMaintenance';
import VehicleCard from '@/components/common/VehicleCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AIAssistant from '@/components/dashboard/AIAssistant';
import PredictionStats from '@/components/dashboard/PredictionStats';
import MaintenancePredictions from '@/components/dashboard/MaintenancePredictions';
import AddVehicleForm from '@/components/dashboard/AddVehicleForm';
import EditVehicleForm from '@/components/dashboard/EditVehicleForm';
import AddMaintenanceForm from '@/components/dashboard/AddMaintenanceForm';
import EditMaintenanceForm from '@/components/dashboard/EditMaintenanceForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Car, Plus, Wrench } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const Dashboard = () => {
  const { user } = useAuth();
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle, fetchVehicles } = useVehicles();
  const { maintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, fetchMaintenanceRecords } = useMaintenance();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<any>(null);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [showEditMaintenance, setShowEditMaintenance] = useState(false);
  const [maintenanceToEdit, setMaintenanceToEdit] = useState<any>(null);

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      await deleteVehicle(id);
    }
  };

  const handleEditVehicle = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    setVehicleToEdit(vehicle);
    setShowEditVehicle(true);
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<any>) => {
    const success = await updateVehicle(id, updates);
    if (success) {
      setShowEditVehicle(false);
      setVehicleToEdit(null);
    }
  };

  const handleAddMaintenance = (vehicleId: string) => {
    setShowAddMaintenance(true);
  };

  const handleEditMaintenance = (id: string) => {
    const maintenance = maintenanceRecords.find(m => m.id === id);
    setMaintenanceToEdit(maintenance);
    setShowEditMaintenance(true);
  };

  const handleUpdateMaintenance = async (id: string, updates: Partial<any>) => {
    const success = await updateMaintenanceRecord(id, updates);
    if (success) {
      setShowEditMaintenance(false);
      setMaintenanceToEdit(null);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      await deleteMaintenanceRecord(id);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVehicles();
      fetchMaintenanceRecords();
    }
  }, [user, fetchVehicles, fetchMaintenanceRecords]);

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <DashboardHeader 
            userName={user?.email?.split('@')[0] || 'User'} 
            onAddVehicle={() => setShowAddVehicle(true)}
            onAddMaintenance={() => setShowAddMaintenance(true)}
          />
          
          <AIAssistant />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <PredictionStats />
            <MaintenancePredictions />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="bg-dark-card border-white/10 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : vehicles.length === 0 ? (
              <Card className="col-span-full bg-dark-card border-white/10">
                <CardContent className="p-8 text-center">
                  <Car className="w-16 h-16 mx-auto text-foreground/20 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Vehicles Yet</h3>
                  <p className="text-foreground/70 mb-6">
                    Add your first vehicle to start tracking maintenance and get AI-powered insights.
                  </p>
                  <Button onClick={() => setShowAddVehicle(true)} className="bg-neon-blue hover:bg-neon-blue/90 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Vehicle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              vehicles.map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  id={vehicle.id}
                  make={vehicle.make}
                  model={vehicle.model}
                  year={vehicle.year}
                  image={vehicle.image}
                  mileage={vehicle.mileage || 0}
                  nextService="Oil Change"
                  healthScore={85}
                  alerts={0}
                  onDelete={handleDeleteVehicle}
                  onEdit={handleEditVehicle}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Add Vehicle Modal */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent className="bg-dark-card border-white/10 max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Add New Vehicle
            </DialogTitle>
            <DialogDescription>
              Add a new vehicle to your garage to start tracking maintenance.
            </DialogDescription>
          </DialogHeader>
          <AddVehicleForm
            onSubmit={addVehicle}
            onUpdateVehicle={updateVehicle}
            onCancel={() => setShowAddVehicle(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Vehicle Modal */}
      <Dialog open={showEditVehicle} onOpenChange={setShowEditVehicle}>
        <DialogContent className="bg-dark-card border-white/10 max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Edit Vehicle
            </DialogTitle>
            <DialogDescription>
              Edit your vehicle details.
            </DialogDescription>
          </DialogHeader>
          {vehicleToEdit && (
            <EditVehicleForm
              vehicle={vehicleToEdit}
              onSubmit={handleUpdateVehicle}
              onCancel={() => {
                setShowEditVehicle(false);
                setVehicleToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Maintenance Modal */}
      <Dialog open={showAddMaintenance} onOpenChange={setShowAddMaintenance}>
        <DialogContent className="bg-dark-card border-white/10 max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Add New Maintenance Record
            </DialogTitle>
            <DialogDescription>
              Add a new maintenance record to your vehicle.
            </DialogDescription>
          </DialogHeader>
          <AddMaintenanceForm
            vehicles={vehicles}
            onSubmit={addMaintenanceRecord}
            onCancel={() => setShowAddMaintenance(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Maintenance Modal */}
      <Dialog open={showEditMaintenance} onOpenChange={setShowEditMaintenance}>
        <DialogContent className="bg-dark-card border-white/10 max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Edit Maintenance Record
            </DialogTitle>
            <DialogDescription>
              Edit your maintenance record details.
            </DialogDescription>
          </DialogHeader>
          {maintenanceToEdit && (
            <EditMaintenanceForm
              maintenance={maintenanceToEdit}
              vehicles={vehicles}
              onSubmit={handleUpdateMaintenance}
              onCancel={() => {
                setShowEditMaintenance(false);
                setMaintenanceToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
