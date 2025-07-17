import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobileNumber: z.string().regex(/^(\+971|971|0)?[0-9]{9}$/, 'Please enter a valid UAE mobile number'),
  patientId: z.string().min(6, 'Patient ID must be at least 6 characters'),
  hospitalId: z.string().min(1, 'Please select a hospital'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits')
});

type SignupForm = z.infer<typeof signupSchema>;
type OtpForm = z.infer<typeof otpSchema>;

interface Hospital {
  id: string;
  name: string;
  nameArabic: string;
  location: string;
  type: 'government' | 'private';
  departments: string[];
}

export default function EnhancedPatientSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationData, setRegistrationData] = useState<SignupForm | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Fetch Abu Dhabi hospitals
  const { data: hospitals, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['/api/hospitals/abudhabi'],
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      patientId: '',
      hospitalId: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false
    }
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      return await apiRequest('/api/auth/register', 'POST', data);
    },
    onSuccess: (data) => {
      setRegistrationData(signupForm.getValues());
      setOtpSent(true);
      setCurrentStep(2);
    },
    onError: (error) => {
      console.error('Registration error:', error);
    }
  });

  // OTP verification mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      return await apiRequest('/api/auth/verify-otp', 'POST', {
        email: registrationData?.email,
        otp: data.otp
      });
    },
    onSuccess: () => {
      setCurrentStep(3); // Success step
    },
    onError: (error) => {
      console.error('OTP verification error:', error);
    }
  });

  // Resend OTP mutation
  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/resend-otp', 'POST', {
        email: registrationData?.email
      });
    },
    onSuccess: () => {
      setOtpSent(true);
    }
  });

  const abuDhabiHospitals: Hospital[] = Array.isArray(hospitals) ? hospitals : [
    {
      id: 'sheikh-khalifa',
      name: 'Sheikh Khalifa Medical City',
      nameArabic: 'مدينة الشيخ خليفة الطبية',
      location: 'Al Karamah, Abu Dhabi',
      type: 'government',
      departments: ['Emergency', 'Cardiology', 'Neurology', 'Oncology']
    },
    {
      id: 'cleveland-clinic',
      name: 'Cleveland Clinic Abu Dhabi',
      nameArabic: 'كليفلاند كلينك أبوظبي',
      location: 'Al Maryah Island, Abu Dhabi',
      type: 'private',
      departments: ['Heart & Vascular', 'Brain & Spine', 'Cancer']
    },
    {
      id: 'zayed-military',
      name: 'Zayed Military Hospital',
      nameArabic: 'مستشفى زايد العسكري',
      location: 'Al Wathba, Abu Dhabi',
      type: 'government',
      departments: ['Emergency', 'Surgery', 'Internal Medicine']
    },
    {
      id: 'corniche-hospital',
      name: 'Corniche Hospital',
      nameArabic: 'مستشفى الكورنيش',
      location: 'Corniche Road, Abu Dhabi',
      type: 'government',
      departments: ['Maternity', 'Pediatrics', 'Emergency']
    },
    {
      id: 'mafraq-hospital',
      name: 'Mafraq Hospital',
      nameArabic: 'مستشفى المفرق',
      location: 'Mafraq, Abu Dhabi',
      type: 'government',
      departments: ['Emergency', 'Trauma', 'Surgery']
    },
    {
      id: 'nmc-hospital',
      name: 'NMC Royal Hospital',
      nameArabic: 'مستشفى إن إم سي الملكي',
      location: 'Khalifa City, Abu Dhabi',
      type: 'private',
      departments: ['General Medicine', 'Surgery', 'Pediatrics']
    },
    {
      id: 'mediclinic-airport',
      name: 'Mediclinic Airport Road Hospital',
      nameArabic: 'مستشفى ميديكلينك طريق المطار',
      location: 'Airport Road, Abu Dhabi',
      type: 'private',
      departments: ['Emergency', 'Surgery', 'Maternity']
    },
    {
      id: 'al-ain-hospital',
      name: 'Al Ain Hospital',
      nameArabic: 'مستشفى العين',
      location: 'Al Ain, Abu Dhabi Emirate',
      type: 'government',
      departments: ['Emergency', 'Surgery', 'Internal Medicine']
    },
    {
      id: 'tawam-hospital',
      name: 'Tawam Hospital',
      nameArabic: 'مستشفى توام',
      location: 'Al Ain, Abu Dhabi Emirate',
      type: 'government',
      departments: ['Emergency', 'Cardiology', 'Nephrology']
    },
    {
      id: 'danat-al-emarat',
      name: 'Danat Al Emarat Hospital',
      nameArabic: 'مستشفى دانة الإمارات',
      location: 'Al Reem Island, Abu Dhabi',
      type: 'private',
      departments: ['Maternity', 'Pediatrics', 'Surgery']
    }
  ];

  const onSignupSubmit = (data: SignupForm) => {
    registerMutation.mutate(data);
  };

  const onOtpSubmit = (data: OtpForm) => {
    verifyOtpMutation.mutate(data);
  };

  const generatePatientId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const patientId = `PAT${timestamp}${random}`;
    signupForm.setValue('patientId', patientId);
  };

  if (hospitalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              24/7 Tele H Technology Services
            </h1>
            <p className="text-gray-600">Healthcare Monitoring Registration</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Registration Form */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          {...signupForm.register('firstName')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter first name"
                        />
                        {signupForm.formState.errors.firstName && (
                          <p className="text-red-600 text-sm mt-1">
                            {signupForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Middle Name
                        </label>
                        <input
                          {...signupForm.register('middleName')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter middle name (optional)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        {...signupForm.register('lastName')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter last name"
                      />
                      {signupForm.formState.errors.lastName && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          {...signupForm.register('email')}
                          type="email"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          {...signupForm.register('mobileNumber')}
                          type="tel"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+971 50 123 4567"
                        />
                      </div>
                      {signupForm.formState.errors.mobileNumber && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.mobileNumber.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patient ID *
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...signupForm.register('patientId')}
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter patient ID or generate one"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePatientId}
                        >
                          Generate
                        </Button>
                      </div>
                      {signupForm.formState.errors.patientId && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.patientId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hospital Affiliation *
                      </label>
                      <select
                        {...signupForm.register('hospitalId')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a hospital in Abu Dhabi</option>
                        {abuDhabiHospitals.map((hospital) => (
                          <option key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.location}
                          </option>
                        ))}
                      </select>
                      {signupForm.formState.errors.hospitalId && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.hospitalId.message}
                        </p>
                      )}
                    </div>

                    {/* Hospital Info Display */}
                    {signupForm.watch('hospitalId') && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        {(() => {
                          const selectedHospital = abuDhabiHospitals.find(h => h.id === signupForm.watch('hospitalId'));
                          return selectedHospital ? (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">{selectedHospital.name}</span>
                                <Badge variant={selectedHospital.type === 'government' ? 'default' : 'secondary'}>
                                  {selectedHospital.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-blue-700 mb-2">{selectedHospital.nameArabic}</p>
                              <div className="flex items-center gap-1 text-sm text-blue-600">
                                <MapPin className="w-3 h-3" />
                                {selectedHospital.location}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Security */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          {...signupForm.register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter password (minimum 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          {...signupForm.register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupForm.formState.errors.confirmPassword && (
                        <p className="text-red-600 text-sm mt-1">
                          {signupForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        {...signupForm.register('termsAccepted')}
                        type="checkbox"
                        className="mt-1"
                      />
                      <div className="text-sm text-gray-600">
                        <p>
                          I agree to the{' '}
                          <a href="#" className="text-blue-600 hover:underline">
                            Terms and Conditions
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </a>{' '}
                          of 24/7 Tele H Technology Services.
                        </p>
                      </div>
                    </div>
                    {signupForm.formState.errors.termsAccepted && (
                      <p className="text-red-600 text-sm">
                        {signupForm.formState.errors.termsAccepted.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      'Creating Account...'
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Email Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Verify Your Email
                  </h3>
                  <p className="text-gray-600">
                    We've sent a 6-digit verification code to{' '}
                    <span className="font-medium">{registrationData?.email}</span>
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      {...otpForm.register('otp')}
                      type="text"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                      placeholder="000000"
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-red-600 text-sm mt-1">
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={verifyOtpMutation.isPending}
                    >
                      {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify & Complete'}
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Didn't receive the code?{' '}
                      <button
                        type="button"
                        onClick={() => resendOtpMutation.mutate()}
                        disabled={resendOtpMutation.isPending}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {resendOtpMutation.isPending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Registration Successful!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your account has been created successfully. You can now log in to access the 24/7 Tele H healthcare monitoring system.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">Your Registration Details:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Name:</strong> {registrationData?.firstName} {registrationData?.middleName} {registrationData?.lastName}</p>
                      <p><strong>Patient ID:</strong> {registrationData?.patientId}</p>
                      <p><strong>Email:</strong> {registrationData?.email}</p>
                      <p><strong>Mobile:</strong> {registrationData?.mobileNumber}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => window.location.href = '/login'}
                    className="w-full"
                  >
                    Proceed to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}