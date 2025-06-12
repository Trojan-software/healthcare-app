import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bluetooth, 
  User, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Heart
} from "lucide-react";

const deviceRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  patientId: z.string().min(4, "Patient ID must be at least 4 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
  deviceConsent: z.boolean().refine(val => val === true, "You must consent to device data collection"),
  healthDataConsent: z.boolean().refine(val => val === true, "You must consent to health data processing"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type DeviceRegistrationData = z.infer<typeof deviceRegistrationSchema>;

interface DeviceRegistrationFlowProps {
  isDeviceConnected: boolean;
  deviceName?: string;
  deviceId?: string;
  onRegistrationComplete: (patientId: string) => void;
  onSkip?: () => void;
}

export default function DeviceRegistrationFlow({ 
  isDeviceConnected, 
  deviceName = "HC03 Health Monitor",
  deviceId,
  onRegistrationComplete,
  onSkip 
}: DeviceRegistrationFlowProps) {
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'welcome' | 'register' | 'verify' | 'complete'>('welcome');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });
  const { toast } = useToast();

  const form = useForm<DeviceRegistrationData>({
    resolver: zodResolver(deviceRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      patientId: '',
      password: '',
      confirmPassword: '',
      deviceConsent: false,
      healthDataConsent: false,
    },
  });

  // Show registration dialog when device first connects
  useEffect(() => {
    if (isDeviceConnected && !localStorage.getItem('hc03_patient_registered')) {
      setShowRegistration(true);
      setRegistrationStep('welcome');
    }
  }, [isDeviceConnected]);

  const registerMutation = useMutation({
    mutationFn: async (data: DeviceRegistrationData) => {
      const { confirmPassword, deviceConsent, healthDataConsent, ...registrationData } = data;
      return apiRequest('POST', '/api/register', {
        ...registrationData,
        username: data.email,
      });
    },
    onSuccess: (response) => {
      setRegistrationStep('verify');
      // Send OTP automatically
      sendOtpMutation.mutate(form.getValues('email'));
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong during registration",
        variant: "destructive",
      });
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/send-otp', { email });
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      return apiRequest('POST', '/api/verify-otp', {
        email: form.getValues('email'),
        code: otpCode,
      });
    },
    onSuccess: () => {
      const patientId = form.getValues('patientId');
      localStorage.setItem('hc03_patient_registered', 'true');
      localStorage.setItem('hc03_patient_id', patientId);
      setRegistrationStep('complete');
      
      setTimeout(() => {
        setShowRegistration(false);
        onRegistrationComplete(patientId);
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/login', loginCredentials);
    },
    onSuccess: async (response) => {
      const userData = await response.json();
      localStorage.setItem('hc03_patient_registered', 'true');
      localStorage.setItem('hc03_patient_id', userData.user.patientId);
      localStorage.setItem('auth_token', userData.token);
      
      setShowRegistration(false);
      onRegistrationComplete(userData.user.patientId);
      
      toast({
        title: "Welcome Back",
        description: `Connected device to patient ${userData.user.patientId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DeviceRegistrationData) => {
    registerMutation.mutate(data);
  };

  const handleOtpVerification = (otpCode: string) => {
    verifyOtpMutation.mutate(otpCode);
  };

  const handleSkipRegistration = () => {
    // Allow temporary device use without full registration
    const tempPatientId = `TEMP_${Date.now()}`;
    localStorage.setItem('hc03_temp_user', 'true');
    localStorage.setItem('hc03_patient_id', tempPatientId);
    
    setShowRegistration(false);
    onSkip?.();
    
    toast({
      title: "Guest Mode",
      description: "Using device in guest mode. Register later for full features.",
      variant: "destructive",
    });
  };

  if (!showRegistration) return null;

  return (
    <Dialog open={showRegistration} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bluetooth className="h-5 w-5 text-medical-blue" />
            <span>Device Registration Required</span>
          </DialogTitle>
          <DialogDescription>
            Set up your patient profile to start monitoring your health with {deviceName}
          </DialogDescription>
        </DialogHeader>

        {registrationStep === 'welcome' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Device Connected</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{deviceName}</p>
                </div>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your HC03 device is ready to monitor your vital signs. To ensure accurate tracking and personalized care, please register as a patient.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Choose an option:</h4>
              
              <Button 
                onClick={() => {
                  setIsExistingUser(false);
                  setRegistrationStep('register');
                }}
                className="w-full btn-medical justify-start h-auto p-4"
              >
                <User className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">New Patient Registration</p>
                  <p className="text-xs opacity-90">Create a new patient profile</p>
                </div>
              </Button>

              <Button 
                onClick={() => setIsExistingUser(true)}
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                <Shield className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Existing Patient Login</p>
                  <p className="text-xs text-muted-foreground">Connect device to existing account</p>
                </div>
              </Button>

              <Button 
                onClick={handleSkipRegistration}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Use in Guest Mode (Limited Features)
              </Button>
            </div>

            {isExistingUser && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Login to Your Account</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={loginCredentials.email}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button 
                    onClick={() => loginMutation.mutate()}
                    disabled={loginMutation.isPending || !loginCredentials.email || !loginCredentials.password}
                    className="w-full btn-medical"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Device to Account'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {registrationStep === 'register' && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...form.register('firstName')}
                  placeholder="John"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...form.register('lastName')}
                  placeholder="Doe"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="john.doe@email.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                {...form.register('mobileNumber')}
                placeholder="+1 (555) 123-4567"
              />
              {form.formState.errors.mobileNumber && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.mobileNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="patientId">Create Patient ID</Label>
              <Input
                id="patientId"
                {...form.register('patientId')}
                placeholder="P001234"
              />
              {form.formState.errors.patientId && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.patientId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register('confirmPassword')}
                  placeholder="••••••••"
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="deviceConsent"
                        {...form.register('deviceConsent')}
                        className="mt-1"
                      />
                      <label htmlFor="deviceConsent" className="text-sm">
                        I consent to data collection from my HC03 device for health monitoring purposes
                      </label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="healthDataConsent"
                        {...form.register('healthDataConsent')}
                        className="mt-1"
                      />
                      <label htmlFor="healthDataConsent" className="text-sm">
                        I consent to processing of my health data for medical analysis and alerts
                      </label>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              {(form.formState.errors.deviceConsent || form.formState.errors.healthDataConsent) && (
                <p className="text-sm text-destructive">
                  Please accept both consent agreements to continue
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setRegistrationStep('welcome')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={registerMutation.isPending}
                className="flex-1 btn-medical"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>
        )}

        {registrationStep === 'verify' && (
          <EmailVerificationStep 
            email={form.getValues('email')}
            onVerify={handleOtpVerification}
            onResend={() => sendOtpMutation.mutate(form.getValues('email'))}
            isVerifying={verifyOtpMutation.isPending}
            isResending={sendOtpMutation.isPending}
          />
        )}

        {registrationStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">Registration Complete!</h3>
              <p className="text-muted-foreground mt-2">
                Your HC03 device is now connected and ready to monitor your health.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                Patient ID: <strong>{form.getValues('patientId')}</strong>
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Starting health monitoring session...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EmailVerificationStepProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  isVerifying: boolean;
  isResending: boolean;
}

function EmailVerificationStep({ email, onVerify, onResend, isVerifying, isResending }: EmailVerificationStepProps) {
  const [otpCode, setOtpCode] = useState('');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We've sent a verification code to {email}
        </p>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="otpCode">Verification Code</Label>
          <Input
            id="otpCode"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="text-center font-mono text-lg"
          />
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={onResend}
            disabled={isResending}
            variant="outline"
            className="flex-1"
          >
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Resend Code'
            )}
          </Button>
          <Button
            onClick={() => onVerify(otpCode)}
            disabled={isVerifying || otpCode.length !== 6}
            className="flex-1 btn-medical"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Connect'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}