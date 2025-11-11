import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bluetooth, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceWidgetCardProps {
  title: string;
  icon: ReactNode;
  connected: boolean;
  deviceName?: string | null;
  status?: 'good' | 'warning' | 'critical' | 'unknown';
  statusText?: string;
  lastUpdated?: Date | string | null;
  onConnect?: () => void;
  children: ReactNode;
  className?: string;
}

export default function DeviceWidgetCard({
  title,
  icon,
  connected,
  deviceName,
  status = 'unknown',
  statusText,
  lastUpdated,
  onConnect,
  children,
  className,
}: DeviceWidgetCardProps) {
  const statusColors = {
    good: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    critical: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    unknown: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  const StatusIcon = status === 'good' ? CheckCircle2 : status === 'critical' || status === 'warning' ? AlertCircle : Clock;

  const formatLastUpdated = (date: Date | string | null | undefined) => {
    if (!date) return 'No data';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Card className={cn('relative', className)} data-testid={`widget-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {connected ? (
                  <>
                    <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                      <Bluetooth className="w-3 h-3 mr-1" />
                      {deviceName || 'Connected'}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-900">
                    Disconnected
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {!connected && onConnect && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onConnect}
              className="text-xs"
              data-testid={`button-connect-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              Connect
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {statusText && (
          <div className="flex items-center justify-between mb-3">
            <Badge className={cn('text-xs', statusColors[status])}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusText}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatLastUpdated(lastUpdated)}</span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
