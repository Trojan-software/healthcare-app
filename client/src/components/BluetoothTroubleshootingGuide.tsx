import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bluetooth, 
  MapPin, 
  Chrome, 
  Power, 
  RotateCcw,
  AlertCircle,
  Info
} from 'lucide-react';

interface TroubleshootingStep {
  icon: any;
  title: string;
  description: string;
  steps: string[];
  platform?: 'android' | 'ios' | 'all';
}

export default function BluetoothTroubleshootingGuide() {
  const troubleshootingSteps: TroubleshootingStep[] = [
    {
      icon: Bluetooth,
      title: "Enable Bluetooth",
      description: "Bluetooth must be enabled on your device",
      steps: [
        "Open your phone settings",
        "Tap on Bluetooth",
        "Toggle Bluetooth ON",
        "Refresh this page and try again"
      ],
      platform: 'all'
    },
    {
      icon: MapPin,
      title: "Enable Location (Android)",
      description: "Android requires Location/GPS for Bluetooth scanning",
      steps: [
        "Open your phone settings",
        "Tap on Location or GPS",
        "Enable Location services",
        "Grant location permission to your browser",
        "Refresh and try again"
      ],
      platform: 'android'
    },
    {
      icon: Power,
      title: "Check HC03 Device",
      description: "HC03 must be turned on and in pairing mode",
      steps: [
        "Turn ON your HC03 device",
        "LED should blink fast (ready to pair)",
        "If connected elsewhere, disconnect first",
        "Keep device within 10 meters (33 feet)"
      ],
      platform: 'all'
    },
    {
      icon: Chrome,
      title: "Use Compatible Browser",
      description: "Web Bluetooth requires Chrome, Edge, or Opera",
      steps: [
        "✅ Google Chrome (recommended)",
        "✅ Microsoft Edge",
        "✅ Opera Browser",
        "❌ Safari (not supported)"
      ],
      platform: 'all'
    },
    {
      icon: RotateCcw,
      title: "Reset Connection",
      description: "If still not working, try resetting the connection",
      steps: [
        "Go to phone Bluetooth settings",
        "Forget/Remove HC03 device",
        "Turn OFF your HC03 device",
        "Wait 10 seconds",
        "Turn ON HC03 device",
        "Try connecting again from this page"
      ],
      platform: 'all'
    }
  ];

  const checkBrowserCompatibility = (): { supported: boolean; browserName: string } => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
      return { supported: true, browserName: 'Chrome' };
    } else if (userAgent.includes('edg/')) {
      return { supported: true, browserName: 'Edge' };
    } else if (userAgent.includes('opera') || userAgent.includes('opr/')) {
      return { supported: true, browserName: 'Opera' };
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return { supported: false, browserName: 'Safari' };
    } else if (userAgent.includes('firefox')) {
      return { supported: false, browserName: 'Firefox' };
    }
    
    return { supported: false, browserName: 'Unknown' };
  };

  const browserCheck = checkBrowserCompatibility();
  const isAndroid = navigator.userAgent.toLowerCase().includes('android');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Bluetooth className="w-6 h-6 text-blue-600" />
          Bluetooth Troubleshooting
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Having trouble connecting to your HC03 device? Follow these steps:
        </p>
      </div>

      {/* Browser Compatibility Check */}
      <Alert variant={browserCheck.supported ? 'default' : 'destructive'} data-testid="browser-compatibility-alert">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <strong>Browser Check:</strong> {browserCheck.browserName}
          </div>
          <Badge variant={browserCheck.supported ? 'default' : 'destructive'}>
            {browserCheck.supported ? 'Supported ✓' : 'Not Supported ✗'}
          </Badge>
        </AlertDescription>
      </Alert>

      {!browserCheck.supported && (
        <Alert variant="destructive" data-testid="incompatible-browser-warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Incompatible Browser</strong>
            <p className="mt-2">Please use Google Chrome, Microsoft Edge, or Opera browser for HC03 Bluetooth connectivity.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Troubleshooting Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {troubleshootingSteps
          .filter(step => step.platform === 'all' || (isAndroid && step.platform === 'android') || (!isAndroid && step.platform === 'ios'))
          .map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`troubleshooting-card-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 pl-4 text-sm">
                    {step.steps.map((stepText, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-2">
                        <span className="text-blue-600 font-semibold min-w-[20px]">
                          {stepIndex + 1}.
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{stepText}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Quick Reference: LED Indicators */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="w-5 h-5" />
            HC03 LED Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3" data-testid="led-fast-blink">
              <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Fast Blinking:</strong>
                <p className="text-sm text-blue-700 dark:text-blue-300">Device is ready to pair (not connected)</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="led-slow-blink">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Slow Blinking:</strong>
                <p className="text-sm text-blue-700 dark:text-blue-300">Successfully connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="led-solid">
              <div className="w-3 h-3 rounded-full bg-yellow-600" />
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Solid ON:</strong>
                <p className="text-sm text-blue-700 dark:text-blue-300">Data transmission active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Still Need Help? */}
      <Alert data-testid="still-need-help-alert">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Still Need Help?</strong>
          <p className="mt-2">
            If you're still having issues after following these steps, please contact support with:
            • Your browser and version
            • Your phone model and OS version
            • HC03 device LED pattern
            • Any error messages you see
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
