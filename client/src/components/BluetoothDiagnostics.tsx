import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Smartphone,
  Bluetooth,
  MapPin,
  Globe
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  icon: any;
}

export default function BluetoothDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const results: DiagnosticResult[] = [];

    // Check 1: Web Bluetooth API Support
    if (navigator.bluetooth) {
      results.push({
        name: 'Web Bluetooth API',
        status: 'pass',
        message: 'Web Bluetooth is supported in your browser ✓',
        icon: Bluetooth
      });
    } else {
      results.push({
        name: 'Web Bluetooth API',
        status: 'fail',
        message: 'Web Bluetooth is NOT supported. Please use Chrome, Edge, or Opera browser.',
        icon: Bluetooth
      });
    }

    // Check 2: Browser Detection
    const ua = navigator.userAgent.toLowerCase();
    let browserName = 'Unknown';
    let browserSupported = false;
    
    if (ua.includes('chrome') && !ua.includes('edge')) {
      browserName = 'Chrome';
      browserSupported = true;
    } else if (ua.includes('edg/')) {
      browserName = 'Edge';
      browserSupported = true;
    } else if (ua.includes('opera') || ua.includes('opr/')) {
      browserName = 'Opera';
      browserSupported = true;
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browserName = 'Safari';
      browserSupported = false;
    } else if (ua.includes('firefox')) {
      browserName = 'Firefox';
      browserSupported = false;
    }

    results.push({
      name: 'Browser',
      status: browserSupported ? 'pass' : 'fail',
      message: `You are using ${browserName}. ${browserSupported ? 'This browser supports Web Bluetooth ✓' : 'This browser does NOT support Web Bluetooth ✗'}`,
      icon: Globe
    });

    // Check 3: HTTPS (required for Web Bluetooth)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    results.push({
      name: 'Secure Connection',
      status: isSecure ? 'pass' : 'fail',
      message: isSecure ? 'Using HTTPS or localhost ✓' : 'Web Bluetooth requires HTTPS! Current: ' + window.location.protocol,
      icon: Globe
    });

    // Check 4: Bluetooth Availability
    if (navigator.bluetooth) {
      try {
        // @ts-ignore - getAvailability is not in all TypeScript definitions yet
        const available = await navigator.bluetooth.getAvailability();
        results.push({
          name: 'Bluetooth Hardware',
          status: available ? 'pass' : 'fail',
          message: available ? 'Bluetooth is available on this device ✓' : 'Bluetooth is NOT available. Enable Bluetooth in system settings.',
          icon: Bluetooth
        });
      } catch (e) {
        results.push({
          name: 'Bluetooth Hardware',
          status: 'warning',
          message: 'Could not check Bluetooth availability (API not supported in this browser version)',
          icon: Bluetooth
        });
      }
    }

    // Check 5: Platform Detection
    const isAndroid = ua.includes('android');
    const isIOS = /iphone|ipad|ipod/.test(ua);
    
    if (isAndroid) {
      results.push({
        name: 'Platform',
        status: 'warning',
        message: 'Android detected. IMPORTANT: Enable Location/GPS in system settings (required for Bluetooth scanning)',
        icon: MapPin
      });
    } else if (isIOS) {
      results.push({
        name: 'Platform',
        status: 'fail',
        message: 'iOS detected. Web Bluetooth is NOT supported on iOS. Please use Android or desktop.',
        icon: Smartphone
      });
    } else {
      results.push({
        name: 'Platform',
        status: 'pass',
        message: 'Desktop platform detected ✓',
        icon: Smartphone
      });
    }

    setDiagnostics(results);
    setIsChecking(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    if (status === 'pass') return <Badge className="bg-green-500">✓ Pass</Badge>;
    if (status === 'fail') return <Badge className="bg-red-500">✗ Fail</Badge>;
    return <Badge className="bg-yellow-500">⚠ Warning</Badge>;
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'fail') return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const allPassed = diagnostics.filter(d => d.status === 'pass').length === diagnostics.filter(d => d.status !== 'warning').length;
  const hasCriticalFailures = diagnostics.some(d => d.status === 'fail');

  return (
    <Card className="w-full" data-testid="bluetooth-diagnostics-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="w-5 h-5" />
          Bluetooth Environment Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        {diagnostics.length > 0 && (
          <Alert variant={allPassed ? 'default' : 'destructive'} data-testid="overall-status-alert">
            <AlertDescription>
              {allPassed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  All checks passed! Your environment is ready for Bluetooth connection.
                </span>
              ) : hasCriticalFailures ? (
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Some checks failed. Please fix the issues below before connecting.
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Some warnings detected. Connection may work, but check recommendations below.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Results */}
        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 border rounded-lg bg-white dark:bg-gray-800"
              data-testid={`diagnostic-${result.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{result.name}</span>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Button 
          onClick={runDiagnostics} 
          disabled={isChecking}
          variant="outline"
          className="w-full"
          data-testid="recheck-button"
        >
          {isChecking ? 'Checking...' : 'Re-check Environment'}
        </Button>

        {/* Help Text */}
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-semibold">📱 If using Android:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Enable Location/GPS in system settings</li>
            <li>Grant location permission to your browser</li>
            <li>Make sure Bluetooth is enabled</li>
          </ul>
          
          <p className="font-semibold mt-3">🔧 If device still not found:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Unpair HC02 device from system Bluetooth settings first</li>
            <li>Turn OFF HC02 device, wait 10 seconds, turn ON</li>
            <li>LED must be blinking (pairing mode)</li>
            <li>Keep device within 10 meters (33 feet)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
