
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onAddVehicle?: () => void;
}

const DashboardHeader = ({ onAddVehicle }: DashboardHeaderProps) => {
  const [searchValue, setSearchValue] = useState('');
  const hasNotifications = true; // This would be dynamic in a real app
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-foreground/70 mt-1">Manage your vehicles and maintenance schedule</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="relative flex-1 sm:max-w-[260px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 bg-dark-card border-white/10 focus-visible:ring-neon-blue"
          />
        </div>
        
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative border-white/10 hover:bg-white/5">
                <Bell className="h-4 w-4" />
                {hasNotifications && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-neon-pink rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-dark-card border-white/10 w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="flex flex-col items-start cursor-pointer hover:bg-white/5">
                <div className="font-medium">Oil change reminder</div>
                <div className="text-sm text-foreground/70">Your Toyota Camry is due for an oil change</div>
                <div className="text-xs text-foreground/50 mt-1">2 hours ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start cursor-pointer hover:bg-white/5">
                <div className="font-medium">Tire rotation</div>
                <div className="text-sm text-foreground/70">Scheduled maintenance coming up next week</div>
                <div className="text-xs text-foreground/50 mt-1">1 day ago</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-center text-neon-blue hover:bg-white/5 cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            className="gap-2 bg-neon-blue hover:bg-neon-blue/90 text-black font-medium"
            onClick={onAddVehicle}
          >
            <Plus className="h-4 w-4" />
            <span>Add Vehicle</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
