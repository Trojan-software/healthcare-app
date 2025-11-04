import { registerPlugin } from '@capacitor/core';

export interface SecurityPlugin {
  /**
   * Check if device is rooted
   * Severity: HIGH (6.8)
   */
  checkRootStatus(): Promise<{
    isRooted: boolean;
    severity: string;
    score: number;
  }>;

  /**
   * Check if developer options are enabled
   * Severity: LOW (3.4)
   */
  checkDeveloperOptions(): Promise<{
    isEnabled: boolean;
    severity: string;
    score: number;
  }>;

  /**
   * Check if ADB is enabled
   * Severity: LOW (3.4)
   */
  checkAdbStatus(): Promise<{
    isEnabled: boolean;
    severity: string;
    score: number;
  }>;

  /**
   * Check if hooking frameworks are detected (Frida, Xposed, Substrate)
   * Severity: MEDIUM (5.7)
   */
  checkHookingStatus(): Promise<{
    isDetected: boolean;
    severity: string;
    score: number;
  }>;

  /**
   * Get comprehensive security status of the device
   * Returns all security checks in one call
   */
  getComprehensiveSecurityStatus(): Promise<{
    isRooted: boolean;
    isDeveloperOptionsEnabled: boolean;
    isAdbEnabled: boolean;
    isHookingDetected: boolean;
    isSecure: boolean;
    recommendations: {
      root?: string;
      devOptions?: string;
      adb?: string;
      hooking?: string;
    };
  }>;
}

const Security = registerPlugin<SecurityPlugin>('Security', {
  web: () => import('./web/SecurityPluginWeb').then(m => new m.SecurityPluginWeb()),
});

export default Security;
