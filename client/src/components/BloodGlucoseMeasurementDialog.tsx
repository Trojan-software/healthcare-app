import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Droplets } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEST_PAPER_MANUFACTURERS, TEST_PAPER_CODES_BY_MANUFACTURER } from '@/lib/hc03-sdk';

interface BloodGlucoseMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeasurementStart: (period: string, checkCode: string, manufacturer?: string) => void;
  isLoading?: boolean;
  result?: number | null;
  deviceStatus?: 'idle' | 'waiting_strip' | 'strip_inserted' | 'waiting_blood' | 'blood_detected' | 'analyzing';
}

type Step = 'period' | 'code' | 'waiting_strip' | 'waiting_blood' | 'analyzing' | 'result';

export default function BloodGlucoseMeasurementDialog({
  open,
  onOpenChange,
  onMeasurementStart,
  isLoading = false,
  result = null,
  deviceStatus = 'idle'
}: BloodGlucoseMeasurementDialogProps) {
  const [step, setStep] = useState<Step>('period');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>(TEST_PAPER_MANUFACTURERS.BENE_CHECK);
  const [selectedCode, setSelectedCode] = useState<string>('C16');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const periods = [
    'Before Breakfast',
    'After Breakfast',
    'Before Lunch',
    'After Lunch',
    'Before Dinner',
    'After Dinner'
  ];

  // Get available codes for selected manufacturer (from official Linktop SDK)
  const availableCodes = TEST_PAPER_CODES_BY_MANUFACTURER[selectedManufacturer] || [];
  
  // Default codes for quick selection (most common)
  const quickCodes = ['C15', 'C16', 'C17', 'C18', 'C19', 'C20'];

  useEffect(() => {
    if (open) {
      setStep('period');
      setSelectedPeriod('');
      setSelectedCode('C16');
      setStatusMessage('');
    }
  }, [open]);

  // Listen for device paper state events
  useEffect(() => {
    const handlePaperState = (event: CustomEvent) => {
      const { message, statusCode } = event.detail;
      console.log('📋 Blood Glucose PaperState:', message, statusCode);
      setStatusMessage(message);
      
      // Automatically transition based on device status
      if (statusCode === 0x03) {
        // Device asking for strip insertion
        if (step === 'waiting_strip') {
          // Stay on waiting_strip, update message
        }
      } else if (statusCode === 0x04) {
        // Strip detected, waiting for blood
        if (step === 'waiting_strip') {
          setStep('waiting_blood');
        }
      } else if (statusCode === 0x05 || statusCode === 0x06) {
        // Blood detected or testing in progress
        if (step === 'waiting_blood' || step === 'waiting_strip') {
          setStep('analyzing');
        }
      }
    };

    window.addEventListener('hc03:bloodglucose:paperstate', handlePaperState as EventListener);
    return () => {
      window.removeEventListener('hc03:bloodglucose:paperstate', handlePaperState as EventListener);
    };
  }, [step]);

  // Update step based on external device status prop
  useEffect(() => {
    if (deviceStatus === 'strip_inserted' && step === 'waiting_strip') {
      setStep('waiting_blood');
    } else if (deviceStatus === 'blood_detected' && (step === 'waiting_strip' || step === 'waiting_blood')) {
      setStep('analyzing');
    } else if (deviceStatus === 'analyzing' && step !== 'analyzing' && step !== 'result') {
      setStep('analyzing');
    }
  }, [deviceStatus, step]);

  // Show result when available
  useEffect(() => {
    if (result !== null && step === 'analyzing') {
      setStep('result');
    }
  }, [result, step]);

  const handleNext = () => {
    if (step === 'period' && selectedPeriod) {
      setStep('code');
    } else if (step === 'code') {
      // Start measurement and wait for strip (includes manufacturer for SDK)
      onMeasurementStart(selectedPeriod, selectedCode, selectedManufacturer);
      setStep('waiting_strip');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Blood Glucose Measurement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Choose Period */}
          {step === 'period' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Please choose measure period:</h3>
              <div className="space-y-2">
                {periods.map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedPeriod(period)}
                    data-testid={`button-period-${period.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Check Code */}
          {step === 'code' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Blood Glucose Test Strip</h3>
              <div className="space-y-4">
                {/* Manufacturer Selection */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Test Strip Manufacturer</p>
                  <Select value={selectedManufacturer} onValueChange={(v) => {
                    setSelectedManufacturer(v);
                    const codes = TEST_PAPER_CODES_BY_MANUFACTURER[v] || [];
                    if (codes.length > 0 && !codes.includes(selectedCode)) {
                      setSelectedCode(codes[0]);
                    }
                  }}>
                    <SelectTrigger data-testid="select-manufacturer">
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TEST_PAPER_MANUFACTURERS.BENE_CHECK}>Bene Check</SelectItem>
                      <SelectItem value={TEST_PAPER_MANUFACTURERS.YI_CHENG}>Yi Cheng</SelectItem>
                      <SelectItem value={TEST_PAPER_MANUFACTURERS.HMD}>HMD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Current Code Display */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Selected Code</p>
                  <Badge variant="secondary" className="text-xl py-2 px-4 mt-1">
                    {selectedCode}
                  </Badge>
                </div>

                {/* Quick Code Selection */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Quick Select</p>
                  <div className="grid grid-cols-3 gap-2">
                    {quickCodes.filter(code => availableCodes.includes(code)).map((code) => (
                      <Button
                        key={code}
                        variant={selectedCode === code ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCode(code)}
                        data-testid={`button-code-${code.toLowerCase()}`}
                      >
                        {code}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* All Codes Selection */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">All Codes ({availableCodes.length})</p>
                  <Select value={selectedCode} onValueChange={setSelectedCode}>
                    <SelectTrigger data-testid="select-code">
                      <SelectValue placeholder="Select code" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {availableCodes.map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Waiting for Strip Insertion */}
          {step === 'waiting_strip' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center">Blood Glucose</h3>
              <div className="flex justify-center my-8">
                <svg width="120" height="100" viewBox="0 0 120 100" className="text-blue-400">
                  {/* Test strip illustration with animation */}
                  <rect x="40" y="10" width="40" height="60" fill="currentColor" opacity="0.8" rx="4">
                    <animate attributeName="y" values="10;20;10" dur="1.5s" repeatCount="indefinite" />
                  </rect>
                  {/* Device slot */}
                  <rect x="20" y="70" width="80" height="20" fill="currentColor" opacity="0.4" rx="4" />
                  <rect x="35" y="75" width="50" height="10" fill="white" opacity="0.3" rx="2" />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <div className="animate-pulse">
                  <p className="font-semibold text-lg text-blue-600">Waiting for test strip...</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please insert the blood glucose test strip into the device
                </p>
                {statusMessage && (
                  <p className="text-xs text-amber-600 mt-2">{statusMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Waiting for Blood Sample */}
          {step === 'waiting_blood' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center">Blood Glucose</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 font-medium">Test strip detected</span>
              </div>
              <div className="flex justify-center my-6">
                <svg width="100" height="120" viewBox="0 0 100 120" className="text-red-400">
                  {/* Hand with blood drop illustration */}
                  <path d="M 30 80 Q 30 60 40 50 Q 50 45 60 50 Q 70 45 80 55" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="30" cy="80" r="8" fill="currentColor" opacity="0.7" />
                  <circle cx="48" cy="65" r="6" fill="currentColor" opacity="0.7" />
                  <circle cx="62" cy="60" r="6" fill="currentColor" opacity="0.7" />
                  <circle cx="75" cy="65" r="6" fill="currentColor" opacity="0.7" />
                  {/* Blood drop animation */}
                  <circle cx="62" cy="55" r="5" fill="#dc2626">
                    <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
              <div className="text-center space-y-2">
                <div className="animate-pulse">
                  <p className="font-semibold text-lg text-red-600">Waiting for blood sample...</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please apply a drop of blood to the test strip
                </p>
                {statusMessage && (
                  <p className="text-xs text-amber-600 mt-2">{statusMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Analyzing */}
          {step === 'analyzing' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center">Blood Glucose</h3>
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 text-sm">Test strip detected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 text-sm">Blood sample detected</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-center font-semibold text-blue-600">Analyzing sample...</p>
                <p className="text-xs text-muted-foreground">Please wait while measuring</p>
              </div>
            </div>
          )}

          {/* Step 6: Result */}
          {step === 'result' && (
            <div className="space-y-4">
              {result !== null ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-center">Blood Glucose</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-2">
                    <p className="text-sm text-gray-600">mmol/L</p>
                    <p className="text-4xl font-bold text-green-600">{result.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Measurement Complete</span>
                    </div>
                  </div>
                  <Button onClick={handleClose} className="w-full" variant="default" data-testid="button-done">
                    Done
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-center font-semibold">Analyzing sample...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>No measurement result received</span>
                  </div>
                  <Button onClick={handleClose} className="w-full" variant="outline" data-testid="button-close">
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation - Show Next button for initial steps */}
          {(step === 'period' || step === 'code') && (
            <div className="flex gap-2">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
                disabled={step === 'period' && !selectedPeriod}
                data-testid="button-next"
              >
                {step === 'code' ? 'Start Measurement' : 'Next'}
              </Button>
            </div>
          )}

          {/* Cancel button for waiting steps */}
          {(step === 'waiting_strip' || step === 'waiting_blood' || step === 'analyzing') && (
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full"
              data-testid="button-cancel-measurement"
            >
              Cancel Measurement
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
