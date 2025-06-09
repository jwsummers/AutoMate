
import { useState } from 'react';
import { useMaintenance, MaintenanceRecord } from '@/hooks/useMaintenance';

export function useMaintenanceOperations() {
  const { maintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, fetchMaintenanceRecords } = useMaintenance();
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [showEditMaintenance, setShowEditMaintenance] = useState(false);
  const [maintenanceToEdit, setMaintenanceToEdit] = useState<MaintenanceRecord | null>(null);

  const handleAddMaintenance = (vehicleId: string) => {
    setShowAddMaintenance(true);
  };

  const handleEditMaintenance = (id: string) => {
    const maintenance = maintenanceRecords.find(m => m.id === id);
    if (maintenance) {
      setMaintenanceToEdit(maintenance);
      setShowEditMaintenance(true);
    }
  };

  const handleUpdateMaintenance = async (id: string, updates: Partial<MaintenanceRecord>) => {
    const success = await updateMaintenanceRecord(id, updates);
    if (success) {
      setShowEditMaintenance(false);
      setMaintenanceToEdit(null);
    }
    return success;
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      await deleteMaintenanceRecord(id);
    }
  };

  return {
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
  };
}
