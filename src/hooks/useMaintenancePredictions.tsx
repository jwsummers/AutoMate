
import { useMemo } from 'react';
import { useMaintenance } from './useMaintenance';
import { useVehicles } from './useVehicles';
import { generateMaintenancePredictions, MaintenancePrediction, getDaysUntilDue, getPredictionUrgency } from '@/utils/maintenancePredictions';

export interface PredictionWithUrgency extends MaintenancePrediction {
  daysUntilDue: number;
  urgency: 'high' | 'medium' | 'low';
  vehicleName: string;
}

export function useMaintenancePredictions() {
  const { maintenanceRecords, loading: maintenanceLoading } = useMaintenance();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  
  const { predictions, loading } = useMemo(() => {
    // Only generate predictions when we have both maintenance data and vehicles data
    if (maintenanceLoading || vehiclesLoading) {
      return { predictions: [], loading: true };
    }
    
    const rawPredictions = generateMaintenancePredictions(maintenanceRecords);
    
    // Enhance predictions with additional information
    const enhancedPredictions: PredictionWithUrgency[] = rawPredictions.map(prediction => {
      const daysUntilDue = getDaysUntilDue(prediction.predictedDate);
      const urgency = getPredictionUrgency(daysUntilDue);
      const vehicle = vehicles.find(v => v.id === prediction.vehicleId);
      const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
      
      return {
        ...prediction,
        daysUntilDue,
        urgency,
        vehicleName
      };
    });
    
    return {
      predictions: enhancedPredictions,
      loading: false
    };
  }, [maintenanceRecords, vehicles, maintenanceLoading, vehiclesLoading]);
  
  return {
    predictions,
    loading,
    urgentPredictions: predictions.filter(p => p.urgency === 'high'),
    upcomingPredictions: predictions.filter(p => p.urgency === 'medium'),
    futurePredictions: predictions.filter(p => p.urgency === 'low'),
  };
}
