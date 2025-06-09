
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Plus } from 'lucide-react';
import VehicleCard from '@/components/common/VehicleCard';
import { Vehicle } from '@/hooks/useVehicles';

interface VehicleGridProps {
  vehicles: Vehicle[];
  loading: boolean;
  onAddVehicle: () => void;
  onDeleteVehicle: (id: string) => void;
  onEditVehicle: (id: string) => void;
}

const VehicleGrid = ({ vehicles, loading, onAddVehicle, onDeleteVehicle, onEditVehicle }: VehicleGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-dark-card border-white/10 animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-full bg-dark-card border-white/10">
          <CardContent className="p-8 text-center">
            <Car className="w-16 h-16 mx-auto text-foreground/20 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Vehicles Yet</h3>
            <p className="text-foreground/70 mb-6">
              Add your first vehicle to start tracking maintenance and get AI-powered insights.
            </p>
            <Button onClick={onAddVehicle} className="bg-neon-blue hover:bg-neon-blue/90 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.id}
          id={vehicle.id}
          make={vehicle.make}
          model={vehicle.model}
          year={vehicle.year}
          image={vehicle.image}
          mileage={vehicle.mileage || 0}
          nextService="Oil Change"
          healthScore={85}
          alerts={0}
          onDelete={onDeleteVehicle}
          onEdit={onEditVehicle}
        />
      ))}
    </div>
  );
};

export default VehicleGrid;
