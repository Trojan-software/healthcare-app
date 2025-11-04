import { WebPlugin } from '@capacitor/core';
import type { SecurityPlugin } from '../SecurityPlugin';

export class SecurityPluginWeb extends WebPlugin implements SecurityPlugin {
  async checkRootStatus(): Promise<{
    isRooted: boolean;
    severity: string;
    score: number;
  }> {
    // Web platform - not applicable
    return {
      isRooted: false,
      severity: 'HIGH',
      score: 6.8,
    };
  }

  async checkDeveloperOptions(): Promise<{
    isEnabled: boolean;
    severity: string;
    score: number;
  }> {
    // Web platform - not applicable
    return {
      isEnabled: false,
      severity: 'LOW',
      score: 3.4,
    };
  }

  async checkAdbStatus(): Promise<{
    isEnabled: boolean;
    severity: string;
    score: number;
  }> {
    // Web platform - not applicable
    return {
      isEnabled: false,
      severity: 'LOW',
      score: 3.4,
    };
  }

  async checkHookingStatus(): Promise<{
    isDetected: boolean;
    severity: string;
    score: number;
  }> {
    // Web platform - not applicable
    return {
      isDetected: false,
      severity: 'MEDIUM',
      score: 5.7,
    };
  }

  async getComprehensiveSecurityStatus(): Promise<{
    isRooted: boolean;
    isDeveloperOptionsEnabled: boolean;
    isAdbEnabled: boolean;
    isHookingDetected: boolean;
    isSecure: boolean;
    recommendations: object;
  }> {
    // Web platform - security checks not applicable
    return {
      isRooted: false,
      isDeveloperOptionsEnabled: false,
      isAdbEnabled: false,
      isHookingDetected: false,
      isSecure: true,
      recommendations: {},
    };
  }
}
