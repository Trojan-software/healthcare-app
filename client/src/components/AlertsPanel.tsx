import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail, Phone, Clock } from "lucide-react";

export default function AlertsPanel() {
  const criticalAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'High Blood Pressure Alert',
      description: 'Patient ID: P001234 - BP: 180/120 mmHg',
      time: '2 minutes ago',
      patientId: 'P001234',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Missed Check-up',
      description: 'Patient ID: P001188 - Overdue by 3 hours',
      time: '5 minutes ago',
      patientId: 'P001188',
    },
    {
      id: 3,
      type: 'critical',
      title: 'Irregular Heart Rate',
      description: 'Patient ID: P001156 - HR: 125 BPM',
      time: '8 minutes ago',
      patientId: 'P001156',
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-white" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-white" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return 'alert-critical';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-alert-red';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Critical Alerts
          </CardTitle>
          <Badge className="bg-alert-red/10 text-alert-red border-alert-red/20">
            {criticalAlerts.length} Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {criticalAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start space-x-3 p-3 rounded-lg ${getAlertStyles(alert.type)}`}
          >
            <div className={`w-8 h-8 ${getIconBgColor(alert.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
              {getAlertIcon(alert.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {alert.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {alert.description}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {alert.time}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className={`p-1 h-6 w-6 ${
                  alert.type === 'critical' 
                    ? 'hover:bg-red-100 dark:hover:bg-red-900' 
                    : 'hover:bg-amber-100 dark:hover:bg-amber-900'
                }`}
              >
                <Mail className={`h-3 w-3 ${
                  alert.type === 'critical' ? 'text-alert-red' : 'text-amber-500'
                }`} />
              </Button>
              
              {alert.type === 'warning' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="p-1 h-6 w-6 hover:bg-amber-100 dark:hover:bg-amber-900"
                >
                  <Phone className="h-3 w-3 text-amber-500" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-4 border-medical-blue text-medical-blue hover:bg-blue-50 dark:hover:bg-blue-950">
          View All Alerts
        </Button>
      </CardContent>
    </Card>
  );
}
