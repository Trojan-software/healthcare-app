import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ReminderSettings() {
  const [settings, setSettings] = useState({
    frequency: '6',
    pushNotifications: true,
    emailAlerts: true,
    smsReminders: false,
    startTime: '08:00',
    endTime: '22:00',
  });

  const { toast } = useToast();

  const handleFrequencyChange = (value: string) => {
    setSettings(prev => ({ ...prev, frequency: value }));
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [type]: checked }));
  };

  const handleTimeChange = (type: string, value: string) => {
    setSettings(prev => ({ ...prev, [type]: value }));
  };

  const handleUpdateSettings = () => {
    toast({
      title: "Settings Updated",
      description: "Your reminder preferences have been saved successfully.",
    });
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Check-up Reminders
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Reminder Frequency
          </Label>
          <Select value={settings.frequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Every 1 hour</SelectItem>
              <SelectItem value="2">Every 2 hours</SelectItem>
              <SelectItem value="4">Every 4 hours</SelectItem>
              <SelectItem value="6">Every 6 hours</SelectItem>
              <SelectItem value="8">Every 8 hours</SelectItem>
              <SelectItem value="12">Every 12 hours</SelectItem>
              <SelectItem value="24">Every 24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Notification Type
          </Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => 
                  handleNotificationChange('pushNotifications', checked as boolean)
                }
              />
              <Label htmlFor="pushNotifications" className="text-sm text-foreground">
                Push Notifications
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailAlerts"
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => 
                  handleNotificationChange('emailAlerts', checked as boolean)
                }
              />
              <Label htmlFor="emailAlerts" className="text-sm text-foreground">
                Email Alerts
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smsReminders"
                checked={settings.smsReminders}
                onCheckedChange={(checked) => 
                  handleNotificationChange('smsReminders', checked as boolean)
                }
              />
              <Label htmlFor="smsReminders" className="text-sm text-foreground">
                SMS Reminders
              </Label>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Active Hours
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Start Time
              </Label>
              <Input
                type="time"
                value={settings.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                End Time
              </Label>
              <Input
                type="time"
                value={settings.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleUpdateSettings}
          className="w-full btn-medical"
        >
          Update Settings
        </Button>
      </CardContent>
    </Card>
  );
}
