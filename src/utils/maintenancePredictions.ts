
import { MaintenanceWithStatus } from "@/hooks/useMaintenance";

export type PredictionType = 'oil_change' | 'brake_service' | 'tire_rotation' | 'air_filter' | 'transmission_service' | 'coolant_flush' | 'spark_plugs' | 'timing_belt' | 'other';

export interface MaintenancePrediction {
  id: string;
  vehicleId: string;
  type: PredictionType;
  title: string;
  description: string;
  predictedDate: Date;
  predictedMileage: number | null;
  confidence: number; // 0-100%
  priority: 'critical' | 'high' | 'medium' | 'low';
  basedOn: {
    lastServiceDate?: Date;
    lastServiceMileage?: number;
    averageDuration?: number; // in days
    averageMileage?: number;
    currentMileage?: number;
    vehicleAge?: number;
  };
}

interface VehicleData {
  id: string;
  year: number;
  mileage: number | null;
}

const MAINTENANCE_INTERVALS = {
  oil_change: { 
    months: 6, 
    miles: 5000, 
    criticalOverdue: 1000,
    description: "Regular oil changes prevent engine damage"
  },
  brake_service: { 
    months: 12, 
    miles: 12000, 
    criticalOverdue: 2000,
    description: "Brake maintenance ensures safe stopping"
  },
  tire_rotation: { 
    months: 6, 
    miles: 6000, 
    criticalOverdue: 3000,
    description: "Tire rotation promotes even wear"
  },
  air_filter: { 
    months: 12, 
    miles: 15000, 
    criticalOverdue: 5000,
    description: "Clean air filter improves engine performance"
  },
  transmission_service: { 
    months: 24, 
    miles: 30000, 
    criticalOverdue: 10000,
    description: "Transmission service prevents costly repairs"
  },
  coolant_flush: { 
    months: 24, 
    miles: 30000, 
    criticalOverdue: 15000,
    description: "Coolant flush prevents overheating"
  },
  spark_plugs: { 
    months: 36, 
    miles: 30000, 
    criticalOverdue: 10000,
    description: "New spark plugs improve fuel efficiency"
  },
  timing_belt: { 
    months: 60, 
    miles: 60000, 
    criticalOverdue: 5000,
    description: "Timing belt replacement prevents engine damage"
  }
};

const mapMaintenanceType = (type: string): PredictionType => {
  const typeMap: Record<string, PredictionType> = {
    'oil change': 'oil_change',
    'brake service': 'brake_service',
    'tire rotation': 'tire_rotation',
    'air filter': 'air_filter',
    'transmission service': 'transmission_service',
    'coolant flush': 'coolant_flush',
    'spark plugs': 'spark_plugs',
    'timing belt': 'timing_belt'
  };
  
  return typeMap[type.toLowerCase()] || 'other';
};

const calculateVehicleAge = (year: number): number => {
  return new Date().getFullYear() - year;
};

const calculatePriority = (
  type: PredictionType,
  daysOverdue: number,
  milesOverdue: number,
  vehicleAge: number
): 'critical' | 'high' | 'medium' | 'low' => {
  const interval = MAINTENANCE_INTERVALS[type];
  if (!interval) return 'low';
  
  if (milesOverdue > interval.criticalOverdue || daysOverdue > 30) {
    return 'critical';
  }
  
  if ((['brake_service', 'timing_belt'].includes(type) && daysOverdue > 0) || 
      (milesOverdue > interval.criticalOverdue / 2) || 
      (daysOverdue > 14)) {
    return 'high';
  }
  
  if (daysOverdue > -7 || vehicleAge > 10) {
    return 'medium';
  }
  
  return 'low';
};

const groupMaintenanceRecords = (records: MaintenanceWithStatus[]) => {
  const grouped = new Map<string, Map<string, MaintenanceWithStatus[]>>();
  
  records.forEach(record => {
    if (!grouped.has(record.vehicle_id)) {
      grouped.set(record.vehicle_id, new Map());
    }
    
    const vehicleMap = grouped.get(record.vehicle_id)!;
    const type = mapMaintenanceType(record.type);
    
    if (!vehicleMap.has(type)) {
      vehicleMap.set(type, []);
    }
    
    vehicleMap.get(type)!.push(record);
  });
  
  return grouped;
};

const generatePredictionsForVehicle = (
  vehicleId: string,
  vehicleData: VehicleData,
  maintenanceHistory: Map<string, MaintenanceWithStatus[]>
): MaintenancePrediction[] => {
  const predictions: MaintenancePrediction[] = [];
  const vehicleAge = calculateVehicleAge(vehicleData.year);
  const currentMileage = vehicleData.mileage || 0;
  
  Object.entries(MAINTENANCE_INTERVALS).forEach(([type, interval]) => {
    const predictionType = type as PredictionType;
    const history = maintenanceHistory.get(type) || [];
    
    let predictedDate: Date;
    let predictedMileage: number | null = null;
    let confidence: number;
    let basedOn: MaintenancePrediction['basedOn'] = {
      currentMileage,
      vehicleAge
    };
    
    if (history.length > 0) {
      // Calculate based on historical data
      const lastService = history[0]; // Most recent
      const lastServiceDate = new Date(lastService.date);
      const lastServiceMileage = lastService.mileage || 0;
      
      basedOn.lastServiceDate = lastServiceDate;
      basedOn.lastServiceMileage = lastServiceMileage;
      
      if (history.length > 1) {
        // Calculate average intervals
        const intervals = [];
        const mileageIntervals = [];
        
        for (let i = 0; i < history.length - 1; i++) {
          const current = new Date(history[i].date);
          const previous = new Date(history[i + 1].date);
          const daysDiff = Math.abs((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
          intervals.push(daysDiff);
          
          if (history[i].mileage && history[i + 1].mileage) {
            const mileageDiff = Math.abs(history[i].mileage! - history[i + 1].mileage!);
            mileageIntervals.push(mileageDiff);
          }
        }
        
        const avgDuration = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const avgMileage = mileageIntervals.length > 0 
          ? mileageIntervals.reduce((a, b) => a + b, 0) / mileageIntervals.length 
          : interval.miles;
        
        basedOn.averageDuration = Math.round(avgDuration);
        basedOn.averageMileage = Math.round(avgMileage);
        
        predictedDate = new Date(lastServiceDate.getTime() + avgDuration * 24 * 60 * 60 * 1000);
        predictedMileage = lastServiceMileage + avgMileage;
        confidence = 85; // High confidence with historical data
      } else {
        // Only one record, use standard intervals
        predictedDate = new Date(lastServiceDate.getTime() + interval.months * 30 * 24 * 60 * 60 * 1000);
        predictedMileage = lastServiceMileage + interval.miles;
        confidence = 65; // Medium confidence
      }
    } else {
      // No history, use baseline recommendations
      const today = new Date();
      predictedDate = new Date(today.getTime() + interval.months * 30 * 24 * 60 * 60 * 1000);
      
      if (currentMileage > 0) {
        predictedMileage = currentMileage + interval.miles;
        confidence = 50; // Lower confidence without history
      } else {
        confidence = 30; // Very low confidence without mileage data
      }
    }
    
    // Calculate if overdue
    const today = new Date();
    const daysUntilDue = Math.round((predictedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const milesUntilDue = predictedMileage ? predictedMileage - currentMileage : 0;
    
    const priority = calculatePriority(
      predictionType,
      -daysUntilDue, // negative means overdue
      -milesUntilDue, // negative means overdue
      vehicleAge
    );
    
    predictions.push({
      id: `${vehicleId}-${type}-${Date.now()}`,
      vehicleId,
      type: predictionType,
      title: interval.description.split(' ')[0] + ' ' + interval.description.split(' ')[1],
      description: interval.description,
      predictedDate,
      predictedMileage,
      confidence,
      priority,
      basedOn
    });
  });
  
  return predictions;
};

export const generateMaintenancePredictions = (
  maintenanceRecords: MaintenanceWithStatus[],
  vehicleData: VehicleData[]
): MaintenancePrediction[] => {
  const groupedRecords = groupMaintenanceRecords(maintenanceRecords);
  const predictions: MaintenancePrediction[] = [];
  
  vehicleData.forEach(vehicle => {
    const vehicleHistory = groupedRecords.get(vehicle.id) || new Map();
    const vehiclePredictions = generatePredictionsForVehicle(vehicle.id, vehicle, vehicleHistory);
    predictions.push(...vehiclePredictions);
  });
  
  // Sort by priority and date
  return predictions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return a.predictedDate.getTime() - b.predictedDate.getTime();
  });
};

export const getDaysUntilDue = (predictedDate: Date): number => {
  const today = new Date();
  return Math.round((predictedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getPredictionUrgency = (daysUntilDue: number, priority: string): 'high' | 'medium' | 'low' => {
  if (daysUntilDue <= 0 || priority === 'critical') return 'high';
  if (daysUntilDue <= 30 || priority === 'high') return 'medium';
  return 'low';
};
