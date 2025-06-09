
import { Card, CardContent } from "@/components/ui/card";
import { useMaintenancePredictions, PredictionWithUrgency } from "@/hooks/useMaintenancePredictions";
import { Clock, AlertTriangle, Calendar, Activity, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PredictionItemProps {
  prediction: PredictionWithUrgency;
}

const PredictionItem = ({ prediction }: PredictionItemProps) => {
  const getUrgencyColor = () => {
    switch (prediction.urgency) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };
  
  const getPriorityColor = () => {
    switch (prediction.priority) {
      case 'critical': return 'text-red-600 bg-red-600/20 border-red-600/30';
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-blue-500 bg-blue-500/20 border-blue-500/30';
    }
  };
  
  const getUrgencyIcon = () => {
    switch (prediction.urgency) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };
  
  const getPriorityIcon = () => {
    switch (prediction.priority) {
      case 'critical': return <Zap className="h-3 w-3" />;
      case 'high': return <TrendingUp className="h-3 w-3" />;
      default: return null;
    }
  };
  
  return (
    <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getUrgencyColor()}`}>
          {getUrgencyIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{prediction.title}</h4>
                {(prediction.priority === 'critical' || prediction.priority === 'high') && (
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getPriorityColor()}`}>
                    {getPriorityIcon()}
                    <span className="capitalize">{prediction.priority}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground/70">{prediction.vehicleName}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyColor()}`}>
                    {prediction.daysUntilDue <= 0 
                      ? `${Math.abs(prediction.daysUntilDue)} days overdue`
                      : `Due in ${prediction.daysUntilDue} days`}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p>Confidence: {prediction.confidence}%</p>
                    {prediction.predictedMileage && (
                      <p>Predicted at: {prediction.predictedMileage.toLocaleString()} miles</p>
                    )}
                    {prediction.basedOn.currentMileage && (
                      <p>Current: {prediction.basedOn.currentMileage.toLocaleString()} miles</p>
                    )}
                    {prediction.basedOn.vehicleAge && (
                      <p>Vehicle age: {prediction.basedOn.vehicleAge} years</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm mt-1">{prediction.description}</p>
          
          <div className="mt-2 flex items-center text-xs text-foreground/60 gap-1">
            <Activity className="h-3 w-3" />
            <span>
              {prediction.basedOn.averageDuration 
                ? `Based on your ${Math.round(prediction.basedOn.averageDuration)} day average` 
                : prediction.basedOn.lastServiceDate
                ? 'Based on your service history'
                : 'Based on manufacturer recommendations'}
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
  className = ""
}: MaintenancePredictionsProps) => {
  const { 
    predictions, 
    urgentPredictions, 
    upcomingPredictions, 
    criticalPredictions,
    loading 
  } = useMaintenancePredictions();
  
  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array(limit).fill(0).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse"></div>
        ))}
      </div>
    );
  }
  
  if (predictions.length === 0) {
    return (
      <Card className={`bg-dark-card border-white/10 ${className}`}>
        <CardContent className="p-4 text-center">
          <Calendar className="w-12 h-12 mx-auto text-foreground/20 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Predictions Available</h3>
          <p className="text-sm text-foreground/70">
            Add vehicles and maintenance records to get personalized AI-powered maintenance predictions.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Prioritize critical and urgent predictions
  const displayPredictions = showAll 
    ? predictions 
    : [
        ...criticalPredictions.slice(0, Math.min(2, limit)),
        ...urgentPredictions.slice(0, Math.min(2, limit - criticalPredictions.length)),
        ...upcomingPredictions.slice(0, Math.max(0, limit - criticalPredictions.length - urgentPredictions.length))
      ].slice(0, limit);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {displayPredictions.map(prediction => (
        <PredictionItem key={prediction.id} prediction={prediction} />
      ))}
      
      {!showAll && predictions.length > limit && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" className="text-neon-blue hover:bg-white/5">
            View all {predictions.length} predictions
          </Button>
        </div>
      )}
    </div>
  );
};

export default MaintenancePredictions;
