
import { MaintenanceWithStatus } from "@/hooks/useMaintenance";

export type PredictionType = 'oil_change' | 'brake_service' | 'tire_rotation' | 'air_filter' | 'other';

export interface MaintenancePrediction {
  id: string;
  vehicleId: string;
  type: PredictionType;
  title: string;
  description: string;
  predictedDate: Date;
  predictedMileage: number | null;
  confidence: number; // 0-100%
  basedOn: {
    lastServiceDate?: Date;
    lastServiceMileage?: number;
    averageDuration?: number; // in days
    averageMileage?: number;
  };
}

const MAINTENANCE_INTERVALS = {
  oil_change: { months: 6, miles: 5000 },
  brake_service: { months: 12, miles: 12000 },
  tire_rotation: { months: 6, miles: 6000 },
  air_filter: { months: 12, miles: 15000 },
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
    const type = record.type.toLowerCase();
    
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
  
  // Sort by date (oldest first for calculations)
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
    
    // Calculate mileage difference if both records have mileage
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
  
  return 'other';
};

/**
 * Generate maintenance predictions based on historical data
 */
export const generateMaintenancePredictions = (
  records: MaintenanceWithStatus[]
): MaintenancePrediction[] => {
  const predictions: MaintenancePrediction[] = [];
  const groupedRecords = groupMaintenanceRecords(records);
  
  groupedRecords.forEach((vehicleMap, vehicleId) => {
    vehicleMap.forEach((records, type) => {
      // Need at least one record to make a prediction
      if (records.length === 0) return;
      
      const latestRecord = records[0]; // Records are sorted newest first
      const predictionType = mapMaintenanceType(type);
      
      // Skip if we can't categorize the maintenance type
      if (predictionType === 'other') return;
      
      // Calculate custom intervals based on user's history
      const { averageDays, averageMiles } = calculateServiceIntervals(records);
      
      // Get default intervals for this maintenance type
      const defaultInterval = MAINTENANCE_INTERVALS[predictionType];
      
      // Prefer user's historical average if we have enough data, otherwise use defaults
      const daysInterval = averageDays && records.length >= 3
        ? averageDays
        : defaultInterval.months * 30;
        
      const milesInterval = averageMiles && records.length >= 3
        ? averageMiles
        : defaultInterval.miles;
      
      // Calculate predicted date
      const lastServiceDate = new Date(latestRecord.date);
      const predictedDate = new Date(lastServiceDate);
      predictedDate.setDate(predictedDate.getDate() + daysInterval);
      
      // Calculate predicted mileage if we have the latest mileage
      let predictedMileage = null;
      if (latestRecord.mileage) {
        predictedMileage = latestRecord.mileage + (milesInterval || defaultInterval.miles);
      }
      
      // Calculate confidence level (simplified)
      let confidence = 70; // Base confidence
      
      // Adjust confidence based on data quality
      if (records.length >= 3) confidence += 20; // More history = higher confidence
      if (averageDays && averageMiles) confidence += 10; // Complete data = higher confidence
      
      const prediction: MaintenancePrediction = {
        id: `${vehicleId}-${predictionType}-${Date.now()}`,
        vehicleId,
        type: predictionType,
        title: getMaintenanceTitle(predictionType),
        description: getMaintenanceDescription(predictionType, predictedDate, predictedMileage),
        predictedDate,
        predictedMileage,
        confidence,
        basedOn: {
          lastServiceDate,
          lastServiceMileage: latestRecord.mileage || undefined,
          averageDuration: averageDays || undefined,
          averageMileage: averageMiles || undefined
        }
      };
      
      predictions.push(prediction);
    });
  });
  
  return predictions.sort((a, b) => a.predictedDate.getTime() - b.predictedDate.getTime());
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
  
  switch (type) {
    case 'oil_change':
      return `Due ${dateStr}${mileageStr}`;
    case 'brake_service':
      return `Brake inspection/service due ${dateStr}${mileageStr}`;
    case 'tire_rotation':
      return `Rotate tires by ${dateStr}${mileageStr}`;
    case 'air_filter':
      return `Replace air filter by ${dateStr}${mileageStr}`;
    default:
      return `Due ${dateStr}${mileageStr}`;
  }
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
 * Get urgency level based on days until due
 */
export const getPredictionUrgency = (
  daysUntilDue: number
): 'high' | 'medium' | 'low' => {
  if (daysUntilDue <= 14) return 'high';
  if (daysUntilDue <= 30) return 'medium';
  return 'low';
};
