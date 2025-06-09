
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AddVehicleForm from '@/components/dashboard/AddVehicleForm';
import EditVehicleForm from '@/components/dashboard/EditVehicleForm';
import AddMaintenanceForm from '@/components/dashboard/AddMaintenanceForm';
import EditMaintenanceForm from '@/components/dashboard/EditMaintenanceForm';
import { Car, Wrench } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { MaintenanceRecord } from '@/hooks/useMaintenance';

interface DashboardModalsProps {
  // Vehicle modals
  showAddVehicle: boolean;
  setShowAddVehicle: (show: boolean) => void;
  showEditVehicle: boolean;
  setShowEditVehicle: (show: boolean) => void;
  vehicleToEdit: Vehicle | null;
  setVehicleToEdit: (vehicle: Vehicle | null) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle | null>;
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<boolean>;
  
  // Maintenance modals
  showAddMaintenance: boolean;
  setShowAddMaintenance: (show: boolean) => void;
  showEditMaintenance: boolean;
  setShowEditMaintenance: (show: boolean) => void;
  maintenanceToEdit: MaintenanceRecord | null;
  setMaintenanceToEdit: (maintenance: MaintenanceRecord | null) => void;
  onAddMaintenance: (maintenance: Omit<MaintenanceRecord, 'id'>) => Promise<MaintenanceRecord | null>;
  onUpdateMaintenance: (id: string, updates: Partial<MaintenanceRecord>) => Promise<boolean>;
  
  vehicles: Vehicle[];
}

const DashboardModals = ({
  showAddVehicle,
  setShowAddVehicle,
  showEditVehicle,
  setShowEditVehicle,
  vehicleToEdit,
  setVehicleToEdit,
  onAddVehicle,
  onUpdateVehicle,
  showAddMaintenance,
  setShowAddMaintenance,
  showEditMaintenance,
  setShowEditMaintenance,
  maintenanceToEdit,
  setMaintenanceToEdit,
  onAddMaintenance,
  onUpdateMaintenance,
  vehicles
}: DashboardModalsProps) => {
  // Create wrapper function for AddVehicleForm that matches expected signature
  const handleVehicleUpdate = async (data: Partial<Vehicle>) => {
    // AddVehicleForm doesn't need an update function since it creates new vehicles
    // This is just a placeholder to satisfy the prop requirements
    return true;
  };

  return (
    <>
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
            onSubmit={onAddVehicle}
            onUpdateVehicle={handleVehicleUpdate}
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
              onSubmit={onUpdateVehicle}
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
            onSubmit={onAddMaintenance}
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
              onSubmit={onUpdateMaintenance}
              onCancel={() => {
                setShowEditMaintenance(false);
                setMaintenanceToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardModals;
