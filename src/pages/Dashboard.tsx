
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicleOperations } from '@/hooks/useVehicleOperations';
import { useMaintenanceOperations } from '@/hooks/useMaintenanceOperations';
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
    handleVehicleUpdateForAddForm,
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
          
          <AIAssistant />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <PredictionStats />
            <MaintenancePredictions />
          </div>
          
          <VehicleGrid
            vehicles={vehicles}
            loading={loading}
            onAddVehicle={() => setShowAddVehicle(true)}
            onDeleteVehicle={handleDeleteVehicle}
            onEditVehicle={handleEditVehicle}
          />
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
        onVehicleUpdateForAddForm={handleVehicleUpdateForAddForm}
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
