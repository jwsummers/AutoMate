
import { useState } from 'react';
import { Car, Calendar, MoreVertical, Edit, Trash2, AlertTriangle, Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  image?: string;
  mileage: number;
  nextService: string;
  healthScore: number;
  alerts: number;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const VehicleCard = ({
  id,
  make,
  model,
  year,
  image,
  mileage,
  nextService,
  healthScore,
  alerts,
  onDelete,
  onEdit
}: VehicleCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine health score color
  const getHealthColor = () => {
    if (healthScore >= 80) return 'bg-green-500';
    if (healthScore >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div 
      className="glass-card rounded-xl overflow-hidden tilt-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={`${year} ${make} ${model}`}
            className="w-full h-full object-cover transition-transform duration-700 ease-out"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-card to-dark-card/50 flex items-center justify-center">
            <Car className="w-20 h-20 text-foreground/20" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-dark-card border-white/10">
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer hover:bg-white/5"
                onClick={() => onEdit && onEdit(id)}
              >
                <Edit className="h-4 w-4" />
                <span>Edit Vehicle</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => onDelete && onDelete(id)}
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove Vehicle</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{make} {model}</h3>
            <div className="flex items-center gap-1 text-sm text-foreground/70">
              <Calendar className="w-3.5 h-3.5" />
              <span>{year}</span>
              <span className="mx-1">•</span>
              <span>{mileage.toLocaleString()} miles</span>
            </div>
          </div>
          {alerts > 0 && (
            <div className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{alerts} {alerts === 1 ? 'Alert' : 'Alerts'}</span>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm text-foreground/70">Health Score</div>
            <div className="text-sm font-medium">{healthScore}%</div>
          </div>
          <Progress 
            value={healthScore} 
            className="h-2 bg-foreground/10" 
            indicatorClassName={getHealthColor()}
          />
        </div>
        
        <div className="border-t border-white/5 pt-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="w-4 h-4 text-neon-blue" />
            <span>Next service: <span className="text-foreground/70">{nextService}</span></span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/10 hover:bg-white/5"
            asChild
          >
            <Link to={`/dashboard/vehicles/${id}`}>Details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
