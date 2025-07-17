import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  Edit3, 
  Save, 
  X, 
  LogOut,
  Shield,
  Activity,
  Calendar
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  mobileNumber: z.string().min(10, "Please enter a valid phone number"),
});

type ProfileData = z.infer<typeof profileSchema>;

interface User {
  id: number;
  patientId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  mobileNumber: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
}

interface UserProfileProps {
  onLogout: () => void;
}

export default function UserProfile({ onLogout }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    staleTime: 300000, // 5 minutes
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await apiRequest('/api/user', 'PUT', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to update profile');
      setTimeout(() => setError(""), 5000);
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        mobileNumber: user.mobileNumber,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: ProfileData) => {
    setError("");
    updateProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    onLogout();
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Failed to load user profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            User Profile
          </CardTitle>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  reset();
                  setError("");
                }}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-blue-500 text-white text-xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                user.isVerified 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}>
                <Shield className="h-3 w-3" />
                <span>{user.isVerified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  disabled={!isEditing}
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 disabled:opacity-50"
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
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
                  disabled={!isEditing}
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 disabled:opacity-50"
                  {...register("lastName")}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
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
                disabled={!isEditing}
                className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 disabled:opacity-50"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
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
                value={user.email}
                disabled
                className="pl-10 h-12 bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-600 opacity-50"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email cannot be changed after registration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mobile Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="mobileNumber"
                disabled={!isEditing}
                className="pl-10 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 disabled:opacity-50"
                {...register("mobileNumber")}
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-sm text-red-500">{errors.mobileNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Patient ID
            </Label>
            <div className="relative">
              <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="patientId"
                value={user.patientId}
                disabled
                className="pl-10 h-12 bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-600 opacity-50"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Patient ID is assigned automatically and cannot be changed
            </p>
          </div>

          {isEditing && (
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Profile...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </form>

        <Separator />

        {/* Logout Section */}
        <div className="pt-4">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}