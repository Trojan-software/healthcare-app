import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  patientId: z.string().min(4, "Patient ID must be at least 4 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RegistrationModal({ open, onOpenChange }: RegistrationModalProps) {
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otpCode, setOtpCode] = useState('');
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      patientId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const { confirmPassword, ...registrationData } = data;
      return apiRequest('POST', '/api/register', {
        ...registrationData,
        username: data.email, // Use email as username
      });
    },
    onSuccess: () => {
      setStep('otp');
      sendOtpMutation.mutate(form.getValues('email'));
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
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
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/verify-otp', {
        email: form.getValues('email'),
        code: otpCode,
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Complete",
        description: "Your account has been verified successfully",
      });
      onOpenChange(false);
      setStep('register');
      setOtpCode('');
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationData) => {
    registerMutation.mutate(data);
  };

  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate();
  };

  const handleResendOtp = () => {
    sendOtpMutation.mutate(form.getValues('email'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            {step === 'register' ? 'Patient Registration' : 'Email Verification'}
          </DialogTitle>
        </DialogHeader>

        {step === 'register' ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="patientId">Patient ID</Label>
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

            <Button 
              type="submit" 
              className="w-full btn-medical"
              disabled={registerMutation.isPending}
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
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-5 w-5 text-medical-blue" />
                <h3 className="font-medium text-foreground">Email Verification</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                We've sent a verification code to {form.getValues('email')}
              </p>
              <div className="flex space-x-2">
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="text-center font-mono text-lg"
                />
                <Button
                  onClick={handleResendOtp}
                  variant="outline"
                  disabled={sendOtpMutation.isPending}
                  className="text-sm font-medium"
                >
                  {sendOtpMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Resend'
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleVerifyOtp}
              className="w-full btn-medical"
              disabled={verifyOtpMutation.isPending || !otpCode}
            >
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
