import { Card, CardContent } from '@/components/ui/card';
import {
  useMaintenancePredictions,
  PredictionWithUrgency,
} from '@/hooks/useMaintenancePredictions';
import {
  Clock,
  AlertTriangle,
  Calendar,
  Activity,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PredictionItemProps {
  prediction: PredictionWithUrgency;
}

const PredictionItem = ({ prediction }: PredictionItemProps) => {
  const urgencyClass = {
    high: 'text-red-500 bg-red-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    low: 'text-blue-500 bg-blue-500/10',
  }[prediction.urgency];

  const Icon = {
    high: AlertTriangle,
    medium: Clock,
    low: Calendar,
  }[prediction.urgency];

  return (
    <div className='p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors'>
      <div className='flex items-start gap-3'>
        <div className={`p-2 rounded-lg ${urgencyClass}`}>
          <Icon className='h-4 w-4' />
        </div>
        <div className='flex-1'>
          <div className='flex justify-between items-start'>
            <div>
              <h4 className='font-medium'>{prediction.title}</h4>
              <p className='text-sm text-foreground/70'>
                {prediction.vehicleName}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyClass}`}
                  >
                    {prediction.daysUntilDue <= 0
                      ? 'Overdue'
                      : `Due in ${prediction.daysUntilDue} days`}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confidence: {prediction.confidence}%</p>
                  {prediction.predictedMileage && (
                    <p>
                      Predicted at:{' '}
                      {prediction.predictedMileage.toLocaleString()} miles
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className='text-sm mt-1'>{prediction.description}</p>

          <div className='mt-2 flex items-center text-xs text-foreground/60 gap-1'>
            <Activity className='h-3 w-3' />
            <span>
              Suggestions are informational and not manufacturer-authoritative.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface MaintenancePredictionsProps {
  limit?: number;
  showAll?: boolean;
  className?: string;
}

const MaintenancePredictions = ({
  limit = 3,
  showAll = false,
  className = '',
}: MaintenancePredictionsProps) => {
  const {
    predictions,
    urgentPredictions,
    upcomingPredictions,
    loading,
    refreshWithAI,
  } = useMaintenancePredictions();

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array(limit)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className='h-20 rounded-lg bg-white/5 animate-pulse'
            ></div>
          ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className={`bg-dark-card border-white/10 ${className}`}>
        <CardContent className='p-4 text-center'>
          <Calendar className='w-12 h-12 mx-auto text-foreground/20 mb-3' />
          <h3 className='text-lg font-medium mb-1'>No Predictions Available</h3>
          <p className='text-sm text-foreground/70'>
            Add more maintenance records to generate predictions based on your
            service history.
          </p>
          <div className='mt-3'>
            <Button
              variant='outline'
              className='border-white/10 hover:bg-white/5'
              onClick={() => refreshWithAI()}
            >
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayPredictions = showAll
    ? predictions
    : [
        ...urgentPredictions,
        ...upcomingPredictions.slice(0, limit - urgentPredictions.length),
      ];

  if (!showAll && displayPredictions.length < limit) {
    displayPredictions.push(
      ...predictions
        .filter((p) => p.urgency === 'low')
        .slice(0, limit - displayPredictions.length)
    );
  }
  const finalPredictions = showAll
    ? predictions
    : displayPredictions.slice(0, limit);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className='flex items-center justify-between mb-1'>
        <div className='text-xs text-foreground/60 flex items-center gap-2'>
          <ShieldAlert className='w-3.5 h-3.5' />
          <span>Informational only. Verify before servicing.</span>
        </div>
        <Button
          size='sm'
          variant='outline'
          className='border-white/10 hover:bg-white/5 gap-1'
          onClick={() => refreshWithAI()}
        >
          <RefreshCw className='h-4 w-4' />
          Refresh
        </Button>
      </div>

      {finalPredictions.map((prediction) => (
        <PredictionItem key={prediction.id} prediction={prediction} />
      ))}
    </div>
  );
};

export default MaintenancePredictions;
