import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, User, Mail, Lock, Phone, IdCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobileNumber: z.string().min(10, "Please enter a valid phone number"),
  patientId: z.string().min(3, "Patient ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onRegister: (email: string) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    setError("");

    try {
      const { confirmPassword, ...registrationData } = data;
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...registrationData, otpMethod }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      onRegister(data.email);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Create Account
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Join 24/7 Health Monitor platform
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  placeholder="John"
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  {...register("lastName")}
                />
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                placeholder="johndoe"
                className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="mobileNumber"
                  placeholder="555-0123"
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  {...register("mobileNumber")}
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-xs text-red-500">{errors.mobileNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Patient ID
              </Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="patientId"
                  placeholder="PT001"
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  {...register("patientId")}
                />
              </div>
              {errors.patientId && (
                <p className="text-xs text-red-500">{errors.patientId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* OTP Method Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Method
            </Label>
            <div className="flex gap-4">
              <div 
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  otpMethod === 'email' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setOtpMethod('email')}
                data-testid="option-email-verification"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    otpMethod === 'email' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {otpMethod === 'email' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">Email Verification</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Receive OTP via email
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  otpMethod === 'sms' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setOtpMethod('sms')}
                data-testid="option-sms-verification"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    otpMethod === 'sms' ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {otpMethod === 'sms' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">SMS Verification</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Receive OTP via SMS
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
            data-testid="button-create-account"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              `Create Account & Send ${otpMethod === 'email' ? 'Email' : 'SMS'} OTP`
            )}
          </Button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}