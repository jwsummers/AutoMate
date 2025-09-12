import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, AlertTriangle, Gauge, Clock, CheckCircle } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { MaintenanceWithStatus } from '@/hooks/useMaintenance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface VehicleHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
  maintenanceRecords: MaintenanceWithStatus[];
}

interface HealthMetric {
  name: string;
  value: number; // 0..100
  color: string;
}

/* ----------------------- Helpers & Scoring ----------------------- */

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function parseISODate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  try {
    return d instanceof Date ? d : new Date(d);
  } catch {
    return null;
  }
}

function daysBetween(a: Date, b: Date) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

type ScoreParts = {
  overduePenalty: number; // max 45
  upcomingPenalty: number; // max 10
  sinceServicePenalty: number; // 0/5/10/15
  agePenalty: number; // 0/5/10
};

type HealthCalc = {
  score: number; // 0..100
  parts: ScoreParts;
  overdueCount: number;
  upcomingCount: number;
  lastCompletedDate: Date | null;
};

/**
 * Deterministic health score:
 *   Start 100
 *   - Overdue:   15 each, capped 45
 *   - Upcoming:  5 each,  capped 10
 *   - Recency:   >365d => 15, >180d => 10, >90d => 5, else 0; no completions => 5
 *   - Age:       >=15y => 10, >=10y => 5, else 0
 */
function computeHealth(
  vehicleYear: number | undefined,
  vehicleRecords: MaintenanceWithStatus[],
  today = new Date()
): HealthCalc {
  const overdueCount = vehicleRecords.filter(
    (r) => r.status === 'overdue'
  ).length;
  const upcomingCount = vehicleRecords.filter(
    (r) => r.status === 'upcoming'
  ).length;

  const overduePenalty = Math.min(45, overdueCount * 15);
  const upcomingPenalty = Math.min(10, upcomingCount * 5);

  const completedDates = vehicleRecords
    .filter((r) => r.status === 'completed')
    .map((r) => parseISODate(r.date))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime());
  const lastCompletedDate = completedDates[0] ?? null;

  let sinceServicePenalty = 0;
  if (lastCompletedDate) {
    const days = daysBetween(today, lastCompletedDate);
    if (days > 365) sinceServicePenalty = 15;
    else if (days > 180) sinceServicePenalty = 10;
    else if (days > 90) sinceServicePenalty = 5;
  } else {
    // encourage logging at least one completion
    sinceServicePenalty = 5;
  }

  let agePenalty = 0;
  if (typeof vehicleYear === 'number' && vehicleYear > 0) {
    const age = today.getFullYear() - vehicleYear;
    if (age >= 15) agePenalty = 10;
    else if (age >= 10) agePenalty = 5;
  }

  const score = clamp(
    100 - overduePenalty - upcomingPenalty - sinceServicePenalty - agePenalty
  );

  return {
    score,
    parts: { overduePenalty, upcomingPenalty, sinceServicePenalty, agePenalty },
    overdueCount,
    upcomingCount,
    lastCompletedDate,
  };
}

/* ----------------------- Component ----------------------- */

const VehicleHealthModal = ({
  isOpen,
  onClose,
  vehicle,
  maintenanceRecords,
}: VehicleHealthModalProps) => {
  const { score, parts, overdueCount, upcomingCount, lastCompletedDate } =
    useMemo(() => {
      if (!vehicle) {
        return {
          score: 0,
          parts: {
            overduePenalty: 0,
            upcomingPenalty: 0,
            sinceServicePenalty: 0,
            agePenalty: 0,
          },
          overdueCount: 0,
          upcomingCount: 0,
          lastCompletedDate: null as Date | null,
        };
      }

      const vehicleMaintenanceRecords = maintenanceRecords.filter(
        (r) => r.vehicle_id === vehicle.id
      );

      return computeHealth(vehicle.year, vehicleMaintenanceRecords);
    }, [vehicle, maintenanceRecords]);

  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    if (!vehicle) return;

    // Convert penalties to 0..100 "factors" (higher=better)
    const overdueFactor = 100 - Math.round((parts.overduePenalty / 45) * 100);
    const upcomingFactor = 100 - Math.round((parts.upcomingPenalty / 10) * 100);
    const recencyFactor =
      100 - Math.round((parts.sinceServicePenalty / 15) * 100);
    const ageFactor = 100 - Math.round((parts.agePenalty / 10) * 100);

    setHealthMetrics([
      { name: 'Overdue Impact', value: clamp(overdueFactor), color: '#ef4444' }, // red
      {
        name: 'Upcoming Impact',
        value: clamp(upcomingFactor),
        color: '#f59e0b',
      }, // amber
      {
        name: 'Service Recency',
        value: clamp(recencyFactor),
        color: '#3b82f6',
      }, // blue
      { name: 'Age Factor', value: clamp(ageFactor), color: '#8b5cf6' }, // violet
      {
        name: 'Overall Health',
        value: score,
        color: score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444',
      },
    ]);
  }, [vehicle, parts, score]);

  if (!vehicle) return null;

  const healthClass =
    score >= 80
      ? 'bg-green-500/20 text-green-500'
      : score >= 50
      ? 'bg-yellow-500/20 text-yellow-500'
      : 'bg-red-500/20 text-red-500';

  /* Recommendations */
  const recs: Array<{ icon: JSX.Element; title: string; body: string }> = [];
  if (overdueCount > 0) {
    recs.push({
      icon: <AlertTriangle className='w-4 h-4 text-yellow-500' />,
      title: 'Resolve Overdue Tasks',
      body: 'Your vehicle has overdue maintenance items that should be addressed promptly.',
    });
  }
  if (!lastCompletedDate || daysBetween(new Date(), lastCompletedDate) > 180) {
    recs.push({
      icon: <Clock className='w-4 h-4 text-neon-blue' />,
      title: 'Service Recency',
      body: 'It has been a while since the last completed service. Consider scheduling routine maintenance.',
    });
  }
  if (upcomingCount > 0) {
    recs.push({
      icon: <Wrench className='w-4 h-4 text-neon-blue' />,
      title: 'Plan Upcoming Maintenance',
      body: 'You have upcoming tasks. Planning them now helps avoid last-minute issues.',
    });
  }
  if (vehicle.year && new Date().getFullYear() - vehicle.year >= 15) {
    recs.push({
      icon: <CheckCircle className='w-4 h-4 text-green-500' />,
      title: 'Older Vehicle Care',
      body: 'For vehicles 15+ years old, increase inspection frequency to catch wear early.',
    });
  }
  if (recs.length === 0) {
    recs.push({
      icon: <CheckCircle className='w-4 h-4 text-green-500' />,
      title: 'Looking Good',
      body: 'No pressing issues detected based on maintenance history. Keep up with routine service!',
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[650px] bg-dark-card border-white/10 text-foreground'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            Vehicle Health: {vehicle.year} {vehicle.make} {vehicle.model}
          </DialogTitle>
        </DialogHeader>

        <div className='py-4 space-y-6'>
          {/* Health Score Display */}
          <div className='flex items-center justify-between bg-white/5 p-4 rounded-lg'>
            <div>
              <h3 className='text-lg font-medium mb-1'>Health Score</h3>
              <p className='text-sm text-foreground/70'>
                Based on overdue items, time since last service, age, and
                upcoming tasks
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${healthClass}`}
              >
                <Gauge className='w-8 h-8' />
              </div>
              <div className='text-3xl font-bold'>{score}%</div>
            </div>
          </div>

          {/* Health Metrics Chart */}
          <Card className='bg-white/5 border-white/10'>
            <CardContent className='p-6'>
              <h3 className='text-lg font-medium mb-4'>Health Factors</h3>
              <div className='h-[300px] w-full'>
                <ChartContainer
                  config={{
                    overdueImpact: { color: '#ef4444' },
                    upcomingImpact: { color: '#f59e0b' },
                    serviceRecency: { color: '#3b82f6' },
                    ageFactor: { color: '#8b5cf6' },
                    overallHealth: { color: '#22c55e' },
                  }}
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={healthMetrics}
                      margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid
                        strokeDasharray='3 3'
                        stroke='#3f3f46'
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey='name'
                        tick={{ fill: '#a1a1aa' }}
                        tickMargin={10}
                        axisLine={{ stroke: '#3f3f46' }}
                      />
                      <YAxis
                        tick={{ fill: '#a1a1aa' }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        axisLine={{ stroke: '#3f3f46' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                        {healthMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div className='space-y-3'>
            <h3 className='text-lg font-medium'>Recommendations</h3>
            {recs.map((r, idx) => (
              <div
                key={idx}
                className='flex items-start gap-3 p-3 bg-white/5 rounded-lg'
              >
                <div className='min-w-8 h-8 rounded-full flex items-center justify-center bg-white/10'>
                  {r.icon}
                </div>
                <div>
                  <p className='font-medium'>{r.title}</p>
                  <p className='text-sm text-foreground/70'>{r.body}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={onClose} className='w-full'>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import type { TooltipProps } from 'recharts';
import type {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-dark-card border border-white/10 p-3 rounded-lg shadow-xl'>
        <p className='font-medium'>
          {(payload[0].payload as HealthMetric).name}
        </p>
        <p className='text-lg'>{`${payload[0].value as number}%`}</p>
        <div
          className='w-full h-1 mt-1 rounded-full'
          style={{
            backgroundColor: (payload[0].payload as HealthMetric).color,
          }}
        />
      </div>
    );
  }
  return null;
};

export default VehicleHealthModal;
