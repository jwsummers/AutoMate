
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceRecord } from '@/hooks/useMaintenance';
import { Vehicle } from '@/hooks/useVehicles';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const maintenanceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Air Filter Replacement",
  "Fluid Change",
  "Battery Replacement",
  "Wiper Blade Replacement",
  "Spark Plug Replacement",
  "Major Service",
  "Other"
];

interface EditMaintenanceFormProps {
  maintenance: MaintenanceRecord;
  vehicles: Vehicle[];
  onSubmit: (id: string, data: Partial<MaintenanceRecord>) => Promise<boolean>;
  onCancel: () => void;
}

const EditMaintenanceForm = ({ maintenance, vehicles, onSubmit, onCancel }: EditMaintenanceFormProps) => {
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    vehicle_id: maintenance.vehicle_id,
    type: maintenance.type,
    description: maintenance.description,
    date: maintenance.date,
    mileage: maintenance.mileage,
    cost: maintenance.cost,
    performed_by: maintenance.performed_by || '',
    notes: maintenance.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date(maintenance.date));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'mileage' || name === 'cost') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDate(date);
      setFormData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await onSubmit(maintenance.id, formData);
    } catch (error) {
      console.error('Error updating maintenance record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Vehicle*</label>
        <Select
          value={formData.vehicle_id}
          onValueChange={(value) => handleSelectChange('vehicle_id', value)}
          required
        >
          <SelectTrigger className="bg-dark-bg border border-white/10 focus:border-neon-blue">
            <SelectValue placeholder="Select a vehicle" />
          </SelectTrigger>
          <SelectContent className="bg-dark-card border-white/10">
            {vehicles.length === 0 ? (
              <SelectItem value="no-vehicles" disabled>
                No vehicles found
              </SelectItem>
            ) : (
              vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Maintenance Type*</label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleSelectChange('type', value)}
          required
        >
          <SelectTrigger className="bg-dark-bg border border-white/10 focus:border-neon-blue">
            <SelectValue placeholder="Select maintenance type" />
          </SelectTrigger>
          <SelectContent className="bg-dark-card border-white/10">
            {maintenanceTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Description*</label>
        <Input
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
          placeholder="e.g. Regular synthetic oil change"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date*</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-dark-bg border border-white/10 hover:bg-dark-bg/80",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-dark-card border-white/10">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mileage</label>
          <Input
            name="mileage"
            type="number"
            value={formData.mileage === null ? '' : formData.mileage}
            onChange={handleChange}
            min={0}
            className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
            placeholder="e.g. 45000"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cost</label>
          <Input
            name="cost"
            type="number"
            step="0.01"
            value={formData.cost === null ? '' : formData.cost}
            onChange={handleChange}
            min={0}
            className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
            placeholder="e.g. 49.99"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Performed By</label>
          <Input
            name="performed_by"
            value={formData.performed_by || ''}
            onChange={handleChange}
            className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
            placeholder="e.g. Downtown Mechanic"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (Optional)</label>
        <Textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          className="bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none resize-none h-20"
          placeholder="Additional notes about this service..."
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel}
          className="border-white/10 hover:bg-white/5"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium"
          disabled={isSubmitting || !formData.vehicle_id || !formData.type || !formData.description}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default EditMaintenanceForm;
