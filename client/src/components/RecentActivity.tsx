import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, UserPlus, Mail, Clock } from "lucide-react";

export default function RecentActivity() {
  const recentActivities = [
    {
      id: 1,
      type: 'checkup_completed',
      title: 'Check-up completed',
      description: 'Patient P001234 - All vitals normal',
      time: '2 hours ago',
      icon: CheckCircle,
      iconColor: 'text-healthcare-green',
      bgColor: 'bg-healthcare-green/10',
    },
    {
      id: 2,
      type: 'patient_registered',
      title: 'New patient registered',
      description: 'Maria Rodriguez - P001289',
      time: '4 hours ago',
      icon: UserPlus,
      iconColor: 'text-medical-blue',
      bgColor: 'bg-medical-blue/10',
    },
    {
      id: 3,
      type: 'alert_sent',
      title: 'Alert email sent',
      description: 'Dr. Johnson notified about P001156',
      time: '6 hours ago',
      icon: Mail,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 4,
      type: 'checkup_completed',
      title: 'Routine check-up',
      description: 'Patient P001198 - Blood pressure elevated',
      time: '8 hours ago',
      icon: CheckCircle,
      iconColor: 'text-healthcare-green',
      bgColor: 'bg-healthcare-green/10',
    },
    {
      id: 5,
      type: 'patient_registered',
      title: 'Patient verified',
      description: 'John Smith - P001290 email confirmed',
      time: '10 hours ago',
      icon: UserPlus,
      iconColor: 'text-medical-blue',
      bgColor: 'bg-medical-blue/10',
    },
  ];

  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {recentActivities.map((activity) => {
          const IconComponent = activity.icon;
          
          return (
            <div
              key={activity.id}
              className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
            >
              <div className={`w-8 h-8 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`${activity.iconColor} h-4 w-4`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <Button 
          variant="outline" 
          className="w-full mt-4 border-muted-foreground/20 text-muted-foreground hover:bg-muted/50"
        >
          View Full History
        </Button>
      </CardContent>
    </Card>
  );
}
