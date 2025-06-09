
import { useState } from 'react';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';

export function useVehicleOperations() {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle, fetchVehicles } = useVehicles();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      await deleteVehicle(id);
    }
  };

  const handleEditVehicle = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      setVehicleToEdit(vehicle);
      setShowEditVehicle(true);
    }
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const success = await updateVehicle(id, updates);
    if (success) {
      setShowEditVehicle(false);
      setVehicleToEdit(null);
    }
    return success;
  };

  const handleVehicleUpdateForAddForm = async (data: Partial<Vehicle>) => {
    // This function is used by AddVehicleForm when it needs to update a vehicle after creation
    // Since AddVehicleForm creates new vehicles, it doesn't have an id yet, so this is mainly
    // for image upload scenarios where the vehicle is created first then updated
    return true; // Return true as AddVehicleForm handles its own creation flow
  };

  return {
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
  };
}
