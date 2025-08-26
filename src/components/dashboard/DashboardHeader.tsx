import { Button } from '@/components/ui/button';
import { Bell, Plus } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  onAddVehicle?: () => void;
}

const DashboardHeader = ({ onAddVehicle }: DashboardHeaderProps) => {
  const hasNotifications = true; // This would be dynamic in a real app

  return (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8'>
      <div className='flex-1'>
        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
          Dashboard
        </h1>
        <p className='text-foreground/70 mt-1'>
          Manage your vehicles and maintenance schedule
        </p>
      </div>

      <div className='flex gap-3'>
        <NotificationBell notifications={[]} />

        <Button
          className='gap-2 bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
          onClick={onAddVehicle}
        >
          <Plus className='h-4 w-4' />
          <span>Add Vehicle</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
