import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertCircle, LogIn, User, Lock, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, LanguageSwitcher } from "@/lib/i18n";
import PrivacyPolicyFooter from "./PrivacyPolicyFooter";

interface LoginFormProps {
  onLoginSuccess: (token: string, role: string) => void;
}

export default function BilingualLoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      }) as any;

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      toast({
        title: t('success'),
        description: t('connectionEstablished'),
      });

      onLoginSuccess(response.token, response.user.role);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || t('connectionFailed'));
      toast({
        title: t('error'),
        description: error.message || t('connectionFailed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                24/7 Tele H
              </CardTitle>
            </div>
            <LanguageSwitcher />
          </div>
          <CardDescription className={`${isRTL ? 'text-right' : 'text-left'}`}>
            {t('login')} - {isRTL ? 'نظام الرعاية الصحية الذكي' : 'Smart Healthcare System'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className={`${isRTL ? 'text-right' : 'text-left'} block`}>
                {t('email')}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder={isRTL ? "admin@24x7teleh.com" : "admin@24x7teleh.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${isRTL ? 'text-right pr-10' : 'pl-10'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <User className={`absolute top-3 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className={`${isRTL ? 'text-right' : 'text-left'} block`}>
                {t('password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder={isRTL ? "كلمة المرور" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${isRTL ? 'text-right pr-10' : 'pl-10'}`}
                />
                <Lock className={`absolute top-3 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className={`w-full flex items-center justify-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isLoading ? t('loading') : t('signIn')}</span>
            </Button>
          </form>
          
          <div className={`mt-6 text-center space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="text-sm text-gray-600">
              <strong>{isRTL ? 'بيانات تجريبية:' : 'Demo Credentials:'}</strong>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>{isRTL ? 'إداري:' : 'Admin:'} admin@24x7teleh.com / admin123</div>
              <div>{isRTL ? 'مريض:' : 'Patient:'} patient.demo@example.com / patient123</div>
            </div>
          </div>
          
          <div className={`mt-4 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
            <a 
              href="#" 
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {t('forgotPassword')}
            </a>
          </div>
        </CardContent>
      </Card>
      
      {/* Privacy Policy Footer */}
      <PrivacyPolicyFooter />
    </div>
  );
}