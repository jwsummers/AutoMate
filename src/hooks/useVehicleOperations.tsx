
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
    fetchVehicles
  };
}
