
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Wrench, AlertTriangle, Gauge, BarChart2 } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";
import { MaintenanceWithStatus } from "@/hooks/useMaintenance";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface VehicleHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
  maintenanceRecords: MaintenanceWithStatus[];
}

const VehicleHealthModal = ({ 
  isOpen, 
  onClose, 
  vehicle, 
  maintenanceRecords 
}: VehicleHealthModalProps) => {
  const [healthScore, setHealthScore] = useState(0);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  
  useEffect(() => {
    if (!vehicle) return;
    
    // Calculate vehicle health metrics based on maintenance records
    const vehicleMaintenanceRecords = maintenanceRecords.filter(
      record => record.vehicle_id === vehicle.id
    );
    
    const completedCount = vehicleMaintenanceRecords.filter(
      record => record.status === 'completed'
    ).length;
    
    const overdueCount = vehicleMaintenanceRecords.filter(
      record => record.status === 'overdue'
    ).length;
    
    const upcomingCount = vehicleMaintenanceRecords.filter(
      record => record.status === 'upcoming'
    ).length;
    
    // Calculate health score - this is a simplified model
    // You could make this more sophisticated based on your requirements
    const baseScore = 75;
    const overdueImpact = overdueCount * -10;
    const completedBonus = completedCount * 5;
    const calculatedScore = Math.min(100, Math.max(0, baseScore + overdueImpact + completedBonus));
    
    setHealthScore(calculatedScore);
    
    // Create data for the chart
    setHealthMetrics([
      {
        name: "Regular Maintenance",
        value: completedCount > 0 ? Math.min(100, completedCount * 20) : 40,
        color: "#22c55e", // green-500
      },
      {
        name: "Timely Service",
        value: overdueCount === 0 ? 100 : Math.max(0, 100 - overdueCount * 25),
        color: "#3b82f6", // blue-500
      },
      {
        name: "Service Planning",
        value: upcomingCount > 0 ? 80 : 50,
        color: "#8b5cf6", // violet-500
      },
      {
        name: "Overall Health",
        value: calculatedScore,
        color: calculatedScore >= 80 ? "#22c55e" : calculatedScore >= 50 ? "#eab308" : "#ef4444", // Conditional color based on score
      }
    ]);
    
  }, [vehicle, maintenanceRecords]);
  
  if (!vehicle) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-dark-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Vehicle Health Status: {vehicle.year} {vehicle.make} {vehicle.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Health Score Display */}
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
            <div>
              <h3 className="text-lg font-medium mb-1">Health Score</h3>
              <p className="text-sm text-foreground/70">
                Based on maintenance history and service compliance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                healthScore >= 80 
                  ? 'bg-green-500/20 text-green-500' 
                  : healthScore >= 50 
                  ? 'bg-yellow-500/20 text-yellow-500' 
                  : 'bg-red-500/20 text-red-500'
              }`}>
                <Gauge className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold">{healthScore}%</div>
            </div>
          </div>
          
          {/* Health Metrics Chart */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Health Metrics</h3>
              <div className="h-[300px] w-full">
                <ChartContainer
                  config={{
                    regularMaintenance: { color: "#22c55e" },
                    timelyService: { color: "#3b82f6" },
                    servicePlanning: { color: "#8b5cf6" },
                    overallHealth: { color: "#f59e0b" }
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={healthMetrics}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 40,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
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
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Recommendations</h3>
            
            {healthScore < 80 && (
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className="min-w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">Schedule Overdue Maintenance</p>
                  <p className="text-sm text-foreground/70">
                    Your vehicle has overdue maintenance tasks that should be addressed soon.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <div className="min-w-8 h-8 rounded-full flex items-center justify-center bg-neon-blue/20">
                <Wrench className="w-4 h-4 text-neon-blue" />
              </div>
              <div>
                <p className="font-medium">Regular Maintenance</p>
                <p className="text-sm text-foreground/70">
                  Continue with scheduled maintenance to maintain optimal vehicle health.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <div className="min-w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20">
                <BarChart2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Track Performance</p>
                <p className="text-sm text-foreground/70">
                  Monitor fuel efficiency and performance to catch issues early.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onClose} 
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="font-medium">{payload[0].payload.name}</p>
        <p className="text-lg">{`${payload[0].value}%`}</p>
        <div 
          className="w-full h-1 mt-1 rounded-full" 
          style={{ backgroundColor: payload[0].payload.color }}
        />
      </div>
    );
  }

  return null;
};

export default VehicleHealthModal;
