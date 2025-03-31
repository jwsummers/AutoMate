
import { useMaintenancePredictions } from '@/hooks/useMaintenancePredictions';
import { Brain, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export interface PredictionStatsProps {
  className?: string;
}

const PredictionStats = ({ className = '' }: PredictionStatsProps) => {
  const { urgentPredictions, upcomingPredictions, futurePredictions, loading } = useMaintenancePredictions();
  
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-dark-card border-white/10">
            <CardContent className="h-24 animate-pulse"></CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Card className="bg-dark-card border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm">Urgent</p>
              <h3 className="text-2xl font-bold">{urgentPredictions.length}</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Due within 14 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-dark-card border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm">Upcoming</p>
              <h3 className="text-2xl font-bold">{upcomingPredictions.length}</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Due in 15-30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-dark-card border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm">Future</p>
              <h3 className="text-2xl font-bold">{futurePredictions.length}</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Due after 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionStats;
