
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Bell, Mail, Calendar, Clock } from 'lucide-react';
import { useReminderPreferences } from '@/hooks/useReminderPreferences';

interface ReminderSettingsProps {
  className?: string;
}

const ReminderSettings = ({ className = '' }: ReminderSettingsProps) => {
  const { preferences, loading, updatePreferences, sendTestReminder } = useReminderPreferences();
  
  const [emailReminders, setEmailReminders] = useState<boolean>(
    preferences?.email_reminders ?? true
  );
  
  const [pushReminders, setPushReminders] = useState<boolean>(
    preferences?.push_reminders ?? false
  );
  
  const [reminderDays, setReminderDays] = useState<{[key: number]: boolean}>({
    1: (preferences?.reminder_days_before || [14, 7, 1]).includes(1),
    3: (preferences?.reminder_days_before || [14, 7, 1]).includes(3),
    7: (preferences?.reminder_days_before || [14, 7, 1]).includes(7),
    14: (preferences?.reminder_days_before || [14, 7, 1]).includes(14),
    30: (preferences?.reminder_days_before || [14, 7, 1]).includes(30),
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Convert reminderDays object to array of days
    const reminderDaysArray = Object.entries(reminderDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day, _]) => parseInt(day))
      .sort((a, b) => b - a); // Sort in descending order
    
    const success = await updatePreferences({
      email_reminders: emailReminders,
      push_reminders: pushReminders,
      reminder_days_before: reminderDaysArray,
    });
    
    if (success) {
      toast.success('Reminder settings saved successfully');
    }
    
    setIsSaving(false);
  };

  const handleSendTestReminder = async () => {
    setIsSendingTest(true);
    await sendTestReminder();
    setIsSendingTest(false);
  };

  // Update local state when preferences change
  useState(() => {
    if (preferences) {
      setEmailReminders(preferences.email_reminders);
      setPushReminders(preferences.push_reminders);
      
      const days = {
        1: preferences.reminder_days_before.includes(1),
        3: preferences.reminder_days_before.includes(3),
        7: preferences.reminder_days_before.includes(7),
        14: preferences.reminder_days_before.includes(14),
        30: preferences.reminder_days_before.includes(30),
      };
      
      setReminderDays(days);
    }
  });

  return (
    <Card className={`bg-dark-card border-white/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-neon-blue" />
          <CardTitle>Maintenance Reminders</CardTitle>
        </div>
        <CardDescription>
          Configure how and when you want to be notified about upcoming maintenance.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Methods</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-foreground/70" />
              <Label htmlFor="email-reminders">Email Notifications</Label>
            </div>
            <Switch 
              id="email-reminders" 
              checked={emailReminders}
              onCheckedChange={setEmailReminders}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-foreground/70" />
              <Label htmlFor="push-reminders">Push Notifications</Label>
              <span className="text-xs text-foreground/50">(Coming Soon)</span>
            </div>
            <Switch 
              id="push-reminders" 
              checked={pushReminders}
              onCheckedChange={setPushReminders}
              disabled={true}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Reminder Schedule</h3>
          <p className="text-xs text-foreground/70">
            Select when you want to receive maintenance reminders before the due date.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[1, 3, 7, 14, 30].map((days) => (
              <div key={days} className="flex items-center space-x-2">
                <Checkbox 
                  id={`days-${days}`} 
                  checked={reminderDays[days] || false}
                  onCheckedChange={(checked) => {
                    setReminderDays(prev => ({
                      ...prev,
                      [days]: !!checked,
                    }));
                  }}
                  disabled={loading}
                />
                <Label htmlFor={`days-${days}`}>{days} {days === 1 ? 'day' : 'days'}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Last Reminded</h3>
            <p className="text-xs text-foreground/70">
              {preferences?.last_reminded_at 
                ? new Date(preferences.last_reminded_at).toLocaleDateString() 
                : 'Never'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSendTestReminder}
            disabled={isSendingTest || !emailReminders}
          >
            {isSendingTest ? 'Sending...' : 'Send Test Reminder'}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-white/10 pt-4">
        <Button 
          className="w-full bg-neon-blue hover:bg-neon-blue/90 text-black"
          onClick={handleSaveSettings}
          disabled={isSaving || loading}
        >
          {isSaving ? 'Saving...' : 'Save Reminder Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReminderSettings;
