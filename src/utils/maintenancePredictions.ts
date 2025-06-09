
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

const MAINTENANCE_INTERVALS = {
  oil_change: { 
    months: 6, 
    miles: 5000, 
    criticalOverdue: 1000, // miles past due to be critical
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

/**
 * Calculate vehicle age in years
 */
const calculateVehicleAge = (year: number): number => {
  return new Date().getFullYear() - year;
};

/**
 * Determine maintenance priority based on various factors
 */
const calculatePriority = (
  type: PredictionType,
  daysOverdue: number,
  milesOverdue: number,
  vehicleAge: number,
  currentMileage: number
): 'critical' | 'high' | 'medium' | 'low' => {
  const interval = MAINTENANCE_INTERVALS[type];
  
  // Critical if significantly overdue
  if (milesOverdue > interval.criticalOverdue || daysOverdue > 30) {
    return 'critical';
  }
  
  // High priority for safety-critical items or if moderately overdue
  if ((['brake_service', 'timing_belt'].includes(type) && daysOverdue > 0) || 
      (milesOverdue > interval.criticalOverdue / 2) || 
      (daysOverdue > 14)) {
    return 'high';
  }
  
  // Medium priority if due soon or for older vehicles
  if (daysOverdue > -7 || vehicleAge > 10) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Groups maintenance records by type and vehicle
 */
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
  
  // Sort each group by date (newest first)
  grouped.forEach(vehicleMap => {
    vehicleMap.forEach((records, type) => {
      vehicleMap.set(
        type, 
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    });
  });
  
  return grouped;
};

/**
 * Calculate average time and mileage between maintenance of the same type
 */
const calculateServiceIntervals = (records: MaintenanceWithStatus[]) => {
  if (records.length < 2) return { averageDays: null, averageMiles: null };
  
  let totalDays = 0;
  let totalMiles = 0;
  let mileageCount = 0;
  
  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  for (let i = 1; i < sortedRecords.length; i++) {
    const currentRecord = sortedRecords[i];
    const previousRecord = sortedRecords[i-1];
    
    const currentDate = new Date(currentRecord.date);
    const previousDate = new Date(previousRecord.date);
    
    const dayDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
    totalDays += dayDiff;
    
    if (currentRecord.mileage && previousRecord.mileage) {
      totalMiles += (currentRecord.mileage - previousRecord.mileage);
      mileageCount++;
    }
  }
  
  const averageDays = totalDays / (sortedRecords.length - 1);
  const averageMiles = mileageCount > 0 ? totalMiles / mileageCount : null;
  
  return { averageDays, averageMiles };
};

/**
 * Maps maintenance type from record to standardized prediction type
 */
const mapMaintenanceType = (type: string): PredictionType => {
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('oil')) return 'oil_change';
  if (lowerType.includes('brake')) return 'brake_service';
  if (lowerType.includes('tire') && lowerType.includes('rotat')) return 'tire_rotation';
  if (lowerType.includes('air') && lowerType.includes('filter')) return 'air_filter';
  if (lowerType.includes('transmission')) return 'transmission_service';
  if (lowerType.includes('coolant') || lowerType.includes('radiator')) return 'coolant_flush';
  if (lowerType.includes('spark') && lowerType.includes('plug')) return 'spark_plugs';
  if (lowerType.includes('timing') && lowerType.includes('belt')) return 'timing_belt';
  
  return 'other';
};

/**
 * Generate baseline maintenance predictions for vehicles without history
 */
const generateBaselinePredictions = (
  vehicleId: string,
  vehicleYear: number,
  currentMileage: number | null,
  existingTypes: Set<string>
): MaintenancePrediction[] => {
  const predictions: MaintenancePrediction[] = [];
  const vehicleAge = calculateVehicleAge(vehicleYear);
  const mileage = currentMileage || 0;
  
  // Generate predictions for common maintenance types not in history
  Object.entries(MAINTENANCE_INTERVALS).forEach(([type, interval]) => {
    if (type === 'other' || existingTypes.has(type)) return;
    
    const predictionType = type as PredictionType;
    
    // Calculate when service is due based on mileage and time
    const mileageBasedDate = new Date();
    const remainingMiles = interval.miles - (mileage % interval.miles);
    const estimatedDaysToMiles = remainingMiles / 15; // Assume 15 miles per day average
    mileageBasedDate.setDate(mileageBasedDate.getDate() + estimatedDaysToMiles);
    
    const timeBasedDate = new Date();
    timeBasedDate.setMonth(timeBasedDate.getMonth() + interval.months);
    
    // Use the sooner of the two dates
    const predictedDate = mileageBasedDate < timeBasedDate ? mileageBasedDate : timeBasedDate;
    const predictedMileage = currentMileage ? currentMileage + remainingMiles : null;
    
    // Calculate overdue amounts
    const daysOverdue = getDaysUntilDue(predictedDate) * -1;
    const milesOverdue = currentMileage ? Math.max(0, currentMileage - (Math.floor(currentMileage / interval.miles) * interval.miles + interval.miles)) : 0;
    
    const priority = calculatePriority(predictionType, daysOverdue, milesOverdue, vehicleAge, mileage);
    
    const prediction: MaintenancePrediction = {
      id: `${vehicleId}-${predictionType}-baseline`,
      vehicleId,
      type: predictionType,
      title: getMaintenanceTitle(predictionType),
      description: getMaintenanceDescription(predictionType, predictedDate, predictedMileage),
      predictedDate,
      predictedMileage,
      confidence: vehicleAge > 5 ? 75 : 60, // Higher confidence for older vehicles
      priority,
      basedOn: {
        currentMileage,
        vehicleAge
      }
    };
    
    predictions.push(prediction);
  });
  
  return predictions;
};

/**
 * Generate maintenance predictions based on historical data and vehicle information
 */
export const generateMaintenancePredictions = (
  records: MaintenanceWithStatus[],
  vehicles?: Array<{ id: string; year: number; mileage: number | null }>
): MaintenancePrediction[] => {
  const predictions: MaintenancePrediction[] = [];
  const groupedRecords = groupMaintenanceRecords(records);
  
  // Create a map of vehicles for easy lookup
  const vehicleMap = new Map(vehicles?.map(v => [v.id, v]) || []);
  
  // Process vehicles with maintenance history
  groupedRecords.forEach((vehicleMap, vehicleId) => {
    const vehicle = vehicleMap.get(vehicleId);
    const vehicleYear = vehicle?.year || new Date().getFullYear();
    const currentMileage = vehicle?.mileage || null;
    const vehicleAge = calculateVehicleAge(vehicleYear);
    
    const processedTypes = new Set<string>();
    
    vehicleMap.forEach((records, type) => {
      if (records.length === 0 || type === 'other') return;
      
      processedTypes.add(type);
      const latestRecord = records[0];
      const predictionType = type as PredictionType;
      
      const { averageDays, averageMiles } = calculateServiceIntervals(records);
      const defaultInterval = MAINTENANCE_INTERVALS[predictionType];
      
      // Use historical data if available, otherwise use defaults
      const daysInterval = averageDays && records.length >= 2
        ? averageDays
        : defaultInterval.months * 30;
        
      const milesInterval = averageMiles && records.length >= 2
        ? averageMiles
        : defaultInterval.miles;
      
      // Calculate predicted date
      const lastServiceDate = new Date(latestRecord.date);
      const predictedDate = new Date(lastServiceDate);
      predictedDate.setDate(predictedDate.getDate() + daysInterval);
      
      // Calculate predicted mileage
      let predictedMileage = null;
      if (latestRecord.mileage && milesInterval) {
        predictedMileage = latestRecord.mileage + milesInterval;
      } else if (currentMileage) {
        predictedMileage = currentMileage + defaultInterval.miles;
      }
      
      // Calculate if overdue
      const daysOverdue = getDaysUntilDue(predictedDate) * -1;
      const milesOverdue = currentMileage && latestRecord.mileage 
        ? Math.max(0, currentMileage - (latestRecord.mileage + milesInterval))
        : 0;
      
      // Calculate priority
      const priority = calculatePriority(predictionType, daysOverdue, milesOverdue, vehicleAge, currentMileage || 0);
      
      // Calculate confidence
      let confidence = 70;
      if (records.length >= 3) confidence += 20;
      if (averageDays && averageMiles) confidence += 10;
      if (records.length >= 5) confidence += 5;
      
      const prediction: MaintenancePrediction = {
        id: `${vehicleId}-${predictionType}-${Date.now()}`,
        vehicleId,
        type: predictionType,
        title: getMaintenanceTitle(predictionType),
        description: getMaintenanceDescription(predictionType, predictedDate, predictedMileage),
        predictedDate,
        predictedMileage,
        confidence: Math.min(confidence, 95),
        priority,
        basedOn: {
          lastServiceDate,
          lastServiceMileage: latestRecord.mileage || undefined,
          averageDuration: averageDays || undefined,
          averageMileage: averageMiles || undefined,
          currentMileage,
          vehicleAge
        }
      };
      
      predictions.push(prediction);
    });
    
    // Generate baseline predictions for maintenance types not in history
    const baselinePredictions = generateBaselinePredictions(
      vehicleId, 
      vehicleYear, 
      currentMileage, 
      processedTypes
    );
    predictions.push(...baselinePredictions);
  });
  
  // Generate predictions for vehicles with no maintenance history
  vehicles?.forEach(vehicle => {
    if (!groupedRecords.has(vehicle.id)) {
      const baselinePredictions = generateBaselinePredictions(
        vehicle.id, 
        vehicle.year, 
        vehicle.mileage, 
        new Set()
      );
      predictions.push(...baselinePredictions);
    }
  });
  
  // Sort by priority and date
  return predictions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.predictedDate.getTime() - b.predictedDate.getTime();
  });
};

/**
 * Get friendly title for maintenance type
 */
export const getMaintenanceTitle = (type: PredictionType): string => {
  switch (type) {
    case 'oil_change': return 'Oil Change';
    case 'brake_service': return 'Brake Service';
    case 'tire_rotation': return 'Tire Rotation';
    case 'air_filter': return 'Air Filter Replacement';
    case 'transmission_service': return 'Transmission Service';
    case 'coolant_flush': return 'Coolant Flush';
    case 'spark_plugs': return 'Spark Plug Replacement';
    case 'timing_belt': return 'Timing Belt Replacement';
    default: return 'Maintenance';
  }
};

/**
 * Get friendly description for maintenance predictions
 */
export const getMaintenanceDescription = (
  type: PredictionType, 
  date: Date, 
  mileage: number | null
): string => {
  const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const mileageStr = mileage ? ` or at ${mileage.toLocaleString()} miles` : '';
  const interval = MAINTENANCE_INTERVALS[type];
  
  return `${interval?.description || 'Recommended maintenance'} - Due ${dateStr}${mileageStr}`;
};

/**
 * Calculate days until a prediction is due
 */
export const getDaysUntilDue = (predictedDate: Date): number => {
  const today = new Date();
  const diffTime = predictedDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get urgency level based on days until due and priority
 */
export const getPredictionUrgency = (
  daysUntilDue: number,
  priority?: 'critical' | 'high' | 'medium' | 'low'
): 'high' | 'medium' | 'low' => {
  if (priority === 'critical' || daysUntilDue <= 7) return 'high';
  if (priority === 'high' || daysUntilDue <= 30) return 'medium';
  return 'low';
};
