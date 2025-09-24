import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenance } from './useMaintenance';
import { useVehicles } from './useVehicles';
import {
  generateMaintenancePredictions,
  MaintenancePrediction,
  getDaysUntilDue,
  getPredictionUrgency,
} from '@/utils/maintenancePredictions';

export interface PredictionWithUrgency extends MaintenancePrediction {
  daysUntilDue: number;
  urgency: 'high' | 'medium' | 'low';
  vehicleName: string;
}

/** Row shape for the `maintenance_predictions` table */
export interface PredictionRow {
  id: string;
  user_id: string;
  vehicle_id: string;
  title: string;
  description: string;
  predicted_date: string | null;
  predicted_mileage: number | null;
  confidence: number | null;
  urgency: 'high' | 'medium' | 'low' | null;
  basis: {
    source: 'ai' | 'local';
    features?: Record<string, unknown>;
    rag_refs?: string[];
  } | null;
  inputs_hash?: string | null;
  updated_at?: string | null;
}

export function useMaintenancePredictions() {
  const { maintenanceRecords, loading: maintenanceLoading } = useMaintenance();
  const { vehicles, loading: vehiclesLoading } = useVehicles();

  /** Use an untyped client for tables not present in your generated Database types */
  const untyped = supabase as unknown as SupabaseClient;

  const [dbPredictions, setDbPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDbPredictions = useCallback(async () => {
    setLoading(true);

    const { data, error } = await untyped
      .from<'maintenance_predictions', PredictionRow>('maintenance_predictions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('fetch predictions error', error);
      setDbPredictions([]);
    } else {
      setDbPredictions(data ?? []);
    }

    setLoading(false);
  }, [untyped]);

  const refreshWithAI = useCallback(
    async (vehicleId?: string) => {
      try {
        setLoading(true);
        const { error } = await supabase.functions.invoke(
          'refresh-predictions',
          {
            body: vehicleId ? { vehicleId } : {},
          }
        );
        if (error) throw error;

        await fetchDbPredictions();
        toast.success('Predictions refreshed');
        return true;
      } catch (e) {
        console.error(e);
        toast.error('Could not refresh predictions');
        setLoading(false);
        return false;
      }
    },
    [fetchDbPredictions]
  );

  useEffect(() => {
    fetchDbPredictions();
  }, [fetchDbPredictions]);

  const predictions: PredictionWithUrgency[] = useMemo(() => {
    if (maintenanceLoading || vehiclesLoading) return [];

    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    // Prefer DB predictions; fallback to local heuristic
    if (dbPredictions.length > 0) {
      return dbPredictions.map((p) => {
        const v = vehicleMap.get(p.vehicle_id);
        const predictedDate = p.predicted_date
          ? new Date(p.predicted_date)
          : undefined;
        const daysUntilDue = predictedDate
          ? getDaysUntilDue(predictedDate)
          : 9999;
        const urgency: 'high' | 'medium' | 'low' =
          p.urgency && ['high', 'medium', 'low'].includes(p.urgency)
            ? (p.urgency as 'high' | 'medium' | 'low')
            : getPredictionUrgency(daysUntilDue);
        const vehicleName = v
          ? `${v.year} ${v.make} ${v.model}`
          : 'Unknown Vehicle';

        const base: MaintenancePrediction = {
          id: p.id,
          vehicleId: p.vehicle_id,
          type: 'other',
          title: p.title,
          description: p.description,
          predictedDate: predictedDate ?? new Date(),
          predictedMileage: p.predicted_mileage ?? null,
          confidence: p.confidence ?? 60,
          basedOn: { averageDuration: undefined },
        };

        return {
          ...base,
          daysUntilDue,
          urgency,
          vehicleName,
        };
      });
    }

    // Fallback if no DB predictions yet
    const raw = generateMaintenancePredictions(maintenanceRecords);
    return raw.map((r) => {
      const v = vehicles.find((vv) => vv.id === r.vehicleId);
      const daysUntilDue = getDaysUntilDue(r.predictedDate);
      const urgency = getPredictionUrgency(daysUntilDue);
      return {
        ...r,
        daysUntilDue,
        urgency,
        vehicleName: v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle',
      };
    });
  }, [
    dbPredictions,
    maintenanceRecords,
    vehicles,
    maintenanceLoading,
    vehiclesLoading,
  ]);

  return {
    predictions,
    loading,
    urgentPredictions: predictions.filter((p) => p.urgency === 'high'),
    upcomingPredictions: predictions.filter((p) => p.urgency === 'medium'),
    futurePredictions: predictions.filter((p) => p.urgency === 'low'),
    refreshWithAI,
  };
}
