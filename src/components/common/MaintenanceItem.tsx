
import { Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export type MaintenanceStatus = 'completed' | 'upcoming' | 'overdue';

interface MaintenanceItemProps {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string or formatted date
  status: MaintenanceStatus;
  mileage?: number;
  cost?: number;
  onView?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const MaintenanceItem = ({
  id,
  title,
  description,
  date,
  status,
  mileage,
  cost,
  onView,
  onComplete
}: MaintenanceItemProps) => {
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'upcoming':
        return <Clock className="w-5 h-5 text-neon-blue" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };
  
  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'upcoming':
        return 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="glass-card rounded-lg p-5 transition-all">
      <div className="flex items-start gap-3">
        <div className={`min-w-10 h-10 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500/10' : status === 'upcoming' ? 'bg-neon-blue/10' : 'bg-red-500/10'}`}>
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">{title}</h3>
              <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass()}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-foreground/70">
            <div>
              <span className="inline-block w-20">Date:</span>
              <span className="font-medium text-foreground">{formatDate(date)}</span>
            </div>
            {mileage && (
              <div>
                <span className="inline-block w-20">Mileage:</span>
                <span className="font-medium text-foreground">{mileage.toLocaleString()}</span>
              </div>
            )}
            {cost !== undefined && (
              <div>
                <span className="inline-block w-20">Cost:</span>
                <span className="font-medium text-foreground">${cost.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4 gap-3">
            {status === 'upcoming' || status === 'overdue' ? (
              <Button 
                size="sm" 
                onClick={() => onComplete && onComplete(id)}
                variant="outline" 
                className="border-green-500/30 text-green-500 hover:bg-green-500/10"
              >
                Mark as Complete
              </Button>
            ) : null}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-white/5 flex items-center gap-1"
              onClick={() => onView && onView(id)}
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceItem;
