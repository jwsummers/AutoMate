
import { useMaintenancePredictions } from '@/hooks/useMaintenancePredictions';
import { Brain, AlertTriangle, Clock, CalendarIcon, Bell, Zap } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useReminderPreferences } from '@/hooks/useReminderPreferences';

export interface PredictionStatsProps {
  className?: string;
}

const PredictionStats = ({ className = '' }: PredictionStatsProps) => {
  const { 
    urgentPredictions, 
    upcomingPredictions, 
    futurePredictions,
    criticalPredictions,
    loading 
  } = useMaintenancePredictions();
  const { preferences, loading: preferencesLoading } = useReminderPreferences();
  
  if (loading || preferencesLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-dark-card border-white/10">
            <CardContent className="h-24 animate-pulse"></CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Calculate reminder status
  const reminderEnabled = preferences?.email_reminders || preferences?.push_reminders;
  const reminderDaysCount = preferences?.reminder_days_before?.length || 0;
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
      <Card className="bg-dark-card border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm">Critical</p>
              <h3 className="text-2xl font-bold">{criticalPredictions.length}</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Needs immediate attention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-dark-card border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-orange-500/10 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm">High Priority</p>
              <h3 className="text-2xl font-bold">{urgentPredictions.length}</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Due soon or overdue
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
                Due in 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-dark-card border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-neon-purple/10 p-2 rounded-lg">
              <Bell className="h-5 w-5 text-neon-purple" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm">AI Insights</p>
              <h3 className="text-2xl font-bold">{reminderEnabled ? 'Active' : 'Off'}</h3>
              <p className="text-xs text-foreground/70 mt-1">
                {reminderEnabled 
                  ? `Smart reminders enabled`
                  : 'Enable for personalized alerts'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionStats;
