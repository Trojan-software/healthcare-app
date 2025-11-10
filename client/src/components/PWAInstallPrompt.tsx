import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
      return;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if user has dismissed before
  if (localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null;
  }

  if (!showInstallPrompt && !isIOS) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg border-2 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Install 24/7 Tele H App
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {isIOS 
                ? "Tap the share button and select 'Add to Home Screen' to install this app."
                : "Add this health monitoring app to your home screen for quick access."
              }
            </p>
            
            <div className="flex items-center space-x-2 mt-3">
              {!isIOS && deferredPrompt && (
                <Button 
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
              )}
              
              <Button 
                onClick={handleDismiss}
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1"
              >
                Not now
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}