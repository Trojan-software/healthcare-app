import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Droplets } from 'lucide-react';

interface BloodGlucoseMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeasurementStart: (period: string, checkCode: string) => void;
  isLoading?: boolean;
  result?: number | null;
}

type Step = 'period' | 'code' | 'strips' | 'blood' | 'result';

export default function BloodGlucoseMeasurementDialog({
  open,
  onOpenChange,
  onMeasurementStart,
  isLoading = false,
  result = null
}: BloodGlucoseMeasurementDialogProps) {
  const [step, setStep] = useState<Step>('period');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedCode, setSelectedCode] = useState<string>('C16');

  const periods = [
    'Before Breakfast',
    'After Breakfast',
    'Before Lunch',
    'After Lunch',
    'Before Dinner',
    'After Dinner'
  ];

  const checkCodes = ['C15', 'C16', 'C17'];

  useEffect(() => {
    if (open) {
      setStep('period');
      setSelectedPeriod('');
      setSelectedCode('C16');
    }
  }, [open]);

  const handleNext = () => {
    if (step === 'period' && selectedPeriod) {
      setStep('code');
    } else if (step === 'code') {
      setStep('strips');
    } else if (step === 'strips') {
      setStep('blood');
    } else if (step === 'blood') {
      onMeasurementStart(selectedPeriod, selectedCode);
      setStep('result');
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
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Check code</p>
                <Badge variant="secondary" className="text-xl py-2 px-4">
                  {selectedCode}
                </Badge>
                <div className="space-y-2">
                  {checkCodes.map((code) => (
                    <Button
                      key={code}
                      variant={selectedCode === code ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setSelectedCode(code)}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Test Strips */}
          {step === 'strips' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Blood Glucose</h3>
              <div className="flex justify-center my-8">
                <svg width="120" height="80" viewBox="0 0 120 80" className="text-blue-400">
                  {/* Test strips illustration */}
                  <rect x="10" y="10" width="15" height="60" fill="currentColor" opacity="0.8" />
                  <rect x="32" y="10" width="15" height="60" fill="currentColor" opacity="0.8" />
                  <rect x="54" y="10" width="15" height="60" fill="currentColor" opacity="0.8" />
                  <rect x="76" y="10" width="15" height="60" fill="currentColor" opacity="0.8" />
                  <rect x="10" y="65" width="81" height="8" fill="currentColor" opacity="0.6" />
                </svg>
              </div>
              <p className="text-center text-sm">Please put the Blood Glucose Test Strips into the Health Monitor.</p>
            </div>
          )}

          {/* Step 4: Waiting for Blood */}
          {step === 'blood' && !isLoading && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Blood Glucose</h3>
              <div className="flex justify-center my-8">
                <svg width="100" height="120" viewBox="0 0 100 120" className="text-red-400">
                  {/* Hand with lancet illustration */}
                  <path d="M 30 80 Q 30 60 40 50 Q 50 45 60 50 Q 70 45 80 55" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="30" cy="80" r="8" fill="currentColor" opacity="0.7" />
                  <circle cx="48" cy="65" r="6" fill="currentColor" opacity="0.7" />
                  <circle cx="62" cy="60" r="6" fill="currentColor" opacity="0.7" />
                  <circle cx="75" cy="65" r="6" fill="currentColor" opacity="0.7" />
                  {/* Lancet - red dot on finger */}
                  <circle cx="62" cy="55" r="4" fill="currentColor" />
                </svg>
              </div>
              <p className="text-center font-semibold">Waiting blood specimen collection.</p>
              <Button onClick={handleNext} className="w-full" disabled={isLoading}>
                {isLoading ? 'Measuring...' : 'Next'}
              </Button>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 'result' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-center font-semibold">Analyzing sample...</p>
                </div>
              ) : result !== null ? (
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
                  <Button onClick={handleClose} className="w-full" variant="default">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>No measurement result received</span>
                  </div>
                  <Button onClick={handleClose} className="w-full" variant="outline">
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation - Show Next button for steps before result */}
          {step !== 'result' && (
            <div className="flex gap-2">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
                disabled={step === 'period' && !selectedPeriod}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
