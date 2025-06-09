
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicleOperations } from '@/hooks/useVehicleOperations';
import { useMaintenanceOperations } from '@/hooks/useMaintenanceOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AIAssistant from '@/components/dashboard/AIAssistant';
import PredictionStats from '@/components/dashboard/PredictionStats';
import MaintenancePredictions from '@/components/dashboard/MaintenancePredictions';
import VehicleGrid from '@/components/dashboard/VehicleGrid';
import DashboardModals from '@/components/dashboard/DashboardModals';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    vehicles,
    loading,
    showAddVehicle,
    setShowAddVehicle,
    showEditVehicle,
    setShowEditVehicle,
    vehicleToEdit,
    setVehicleToEdit,
    addVehicle,
    handleDeleteVehicle,
    handleEditVehicle,
    handleUpdateVehicle,
    fetchVehicles
  } = useVehicleOperations();

  const {
    maintenanceRecords,
    showAddMaintenance,
    setShowAddMaintenance,
    showEditMaintenance,
    setShowEditMaintenance,
    maintenanceToEdit,
    setMaintenanceToEdit,
    addMaintenanceRecord,
    handleAddMaintenance,
    handleEditMaintenance,
    handleUpdateMaintenance,
    handleDeleteMaintenance,
    fetchMaintenanceRecords
  } = useMaintenanceOperations();

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
            onAddVehicle={() => setShowAddVehicle(true)}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-dark-card border-white/10">
              <TabsTrigger value="overview" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black">
                Overview
              </TabsTrigger>
              <TabsTrigger value="predictions" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black">
                AI Predictions
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black">
                Vehicles
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-8 mt-6">
              <AIAssistant />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Prediction Stats</h2>
                  <PredictionStats />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Upcoming Maintenance</h2>
                  <MaintenancePredictions limit={3} />
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Vehicles</h2>
                <VehicleGrid
                  vehicles={vehicles.slice(0, 3)}
                  loading={loading}
                  onAddVehicle={() => setShowAddVehicle(true)}
                  onDeleteVehicle={handleDeleteVehicle}
                  onEditVehicle={handleEditVehicle}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="predictions" className="space-y-6 mt-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">AI-Powered Maintenance Predictions</h2>
                <p className="text-foreground/70 mb-6">
                  Smart recommendations based on your vehicle data, maintenance history, and usage patterns.
                </p>
              </div>
              
              <PredictionStats />
              
              <div className="grid grid-cols-1 gap-6">
                <MaintenancePredictions showAll={true} />
              </div>
            </TabsContent>
            
            <TabsContent value="vehicles" className="space-y-6 mt-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Vehicle Management</h2>
                <p className="text-foreground/70 mb-6">
                  Manage your vehicles and track their maintenance history.
                </p>
              </div>
              
              <VehicleGrid
                vehicles={vehicles}
                loading={loading}
                onAddVehicle={() => setShowAddVehicle(true)}
                onDeleteVehicle={handleDeleteVehicle}
                onEditVehicle={handleEditVehicle}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      
      <DashboardModals
        showAddVehicle={showAddVehicle}
        setShowAddVehicle={setShowAddVehicle}
        showEditVehicle={showEditVehicle}
        setShowEditVehicle={setShowEditVehicle}
        vehicleToEdit={vehicleToEdit}
        setVehicleToEdit={setVehicleToEdit}
        onAddVehicle={addVehicle}
        onUpdateVehicle={handleUpdateVehicle}
        showAddMaintenance={showAddMaintenance}
        setShowAddMaintenance={setShowAddMaintenance}
        showEditMaintenance={showEditMaintenance}
        setShowEditMaintenance={setShowEditMaintenance}
        maintenanceToEdit={maintenanceToEdit}
        setMaintenanceToEdit={setMaintenanceToEdit}
        onAddMaintenance={addMaintenanceRecord}
        onUpdateMaintenance={handleUpdateMaintenance}
        vehicles={vehicles}
      />
    </div>
  );
};

export default Dashboard;
