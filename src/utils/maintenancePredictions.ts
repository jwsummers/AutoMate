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
  oil_change:   { months: 6,  miles: 5000  },
  brake_service:{ months: 12, miles: 12000 },
  tire_rotation:{ months: 6,  miles: 6000  },
  air_filter:   { months: 12, miles: 15000 },
};

const groupMaintenanceRecords = (records: MaintenanceWithStatus[]) => {
  const grouped = new Map<string, Map<string, MaintenanceWithStatus[]>>();
  records.forEach(record => {
    if (!grouped.has(record.vehicle_id)) grouped.set(record.vehicle_id, new Map());
    const vehicleMap = grouped.get(record.vehicle_id)!;
    const type = record.type.toLowerCase();
    if (!vehicleMap.has(type)) vehicleMap.set(type, []);
    vehicleMap.get(type)!.push(record);
  });

  grouped.forEach(vehicleMap => {
    vehicleMap.forEach((recs, type) => {
      vehicleMap.set(type, recs.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    });
  });
  return grouped;
};

const calculateServiceIntervals = (records: MaintenanceWithStatus[]) => {
  if (records.length < 2) return { averageDays: null, averageMiles: null };
  let totalDays = 0, totalMiles = 0, mileageCount = 0;

  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i], prev = sorted[i-1];
    const dayDiff = (new Date(cur.date).getTime() - new Date(prev.date).getTime()) / 86400000;
    totalDays += dayDiff;
    if (cur.mileage && prev.mileage) { totalMiles += (cur.mileage - prev.mileage); mileageCount++; }
  }
  const averageDays = totalDays / (sorted.length - 1);
  const averageMiles = mileageCount > 0 ? totalMiles / mileageCount : null;
  return { averageDays, averageMiles };
};

const mapMaintenanceType = (type: string): PredictionType => {
  const t = type.toLowerCase();
  if (t.includes('oil')) return 'oil_change';
  if (t.includes('brake')) return 'brake_service';
  if (t.includes('tire') && t.includes('rotat')) return 'tire_rotation';
  if (t.includes('air') && t.includes('filter')) return 'air_filter';
  return 'other';
};

export const generateMaintenancePredictions = (records: MaintenanceWithStatus[]): MaintenancePrediction[] => {
  const predictions: MaintenancePrediction[] = [];
  const grouped = groupMaintenanceRecords(records);

  grouped.forEach((vehicleMap, vehicleId) => {
    vehicleMap.forEach((recs, type) => {
      if (recs.length === 0) return;

      const latest = recs[0];
      const pType = mapMaintenanceType(type);
      if (pType === 'other') return;

      const { averageDays, averageMiles } = calculateServiceIntervals(recs);
      const defaults = MAINTENANCE_INTERVALS[pType];

      const daysInterval = averageDays && recs.length >= 3 ? averageDays : defaults.months * 30;
      const milesInterval = averageMiles && recs.length >= 3 ? averageMiles : defaults.miles;

      const lastServiceDate = new Date(latest.date);
      const predictedDate = new Date(lastServiceDate);
      predictedDate.setDate(predictedDate.getDate() + daysInterval);

      let predictedMileage: number | null = null;
      if (latest.mileage) predictedMileage = latest.mileage + (milesInterval || defaults.miles);

      let confidence = 70;
      if (recs.length >= 3) confidence += 20;
      if (averageDays && averageMiles) confidence += 10;

      predictions.push({
        id: `${vehicleId}-${pType}-${Date.now()}`,
        vehicleId,
        type: pType,
        title: getMaintenanceTitle(pType),
        description: getMaintenanceDescription(pType, predictedDate, predictedMileage),
        predictedDate,
        predictedMileage,
        confidence,
        basedOn: {
          lastServiceDate,
          lastServiceMileage: latest.mileage || undefined,
          averageDuration: averageDays || undefined,
          averageMileage: averageMiles || undefined
        }
      });
    });
  });

  return predictions.sort((a, b) => a.predictedDate.getTime() - b.predictedDate.getTime());
};

export const getMaintenanceTitle = (type: PredictionType): string => {
  switch (type) {
    case 'oil_change':   return 'Oil Change';
    case 'brake_service':return 'Brake Service';
    case 'tire_rotation':return 'Tire Rotation';
    case 'air_filter':   return 'Air Filter Replacement';
    default:             return 'Maintenance';
  }
};

export const getMaintenanceDescription = (type: PredictionType, date: Date, mileage: number | null): string => {
  const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const mileageStr = mileage ? ` or at ${mileage.toLocaleString()} miles` : '';
  switch (type) {
    case 'oil_change':   return `Due ${dateStr}${mileageStr}`;
    case 'brake_service':return `Brake inspection/service due ${dateStr}${mileageStr}`;
    case 'tire_rotation':return `Rotate tires by ${dateStr}${mileageStr}`;
    case 'air_filter':   return `Replace air filter by ${dateStr}${mileageStr}`;
    default:             return `Due ${dateStr}${mileageStr}`;
  }
};

// <- only change here: accept Date | string for convenience
export const getDaysUntilDue = (predictedDate: Date | string): number => {
  const date = typeof predictedDate === "string" ? new Date(predictedDate) : predictedDate;
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / 86400000);
};

export const getPredictionUrgency = (daysUntilDue: number): 'high' | 'medium' | 'low' => {
  if (daysUntilDue <= 14) return 'high';
  if (daysUntilDue <= 30) return 'medium';
  return 'low';
};
