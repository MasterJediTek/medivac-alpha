/**
 * Biometric Authentication Service
 * Provides Face ID, Touch ID, and fingerprint authentication for secure data access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Biometric types
export type BiometricType = 'face_id' | 'touch_id' | 'fingerprint' | 'iris' | 'none';

// Authentication result
export interface AuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
  timestamp: number;
}

// Biometric capability
export interface BiometricCapability {
  available: boolean;
  biometricType: BiometricType;
  enrolled: boolean;
  securityLevel: 'weak' | 'strong';
  errorMessage?: string;
}

// Biometric settings
export interface BiometricSettings {
  enabled: boolean;
  requireForLogin: boolean;
  requireForSensitiveData: boolean;
  requireForTransactions: boolean;
  fallbackToPIN: boolean;
  pinCode?: string;
  lockoutDuration: number;
  maxAttempts: number;
  autoLockTimeout: number;
}

// Authentication attempt
export interface AuthAttempt {
  id: string;
  timestamp: number;
  success: boolean;
  biometricType: BiometricType;
  reason: string;
  deviceInfo: string;
}

// Protected data category
export type ProtectedCategory = 
  | 'patient_records'
  | 'medications'
  | 'lab_results'
  | 'financial_data'
  | 'admin_settings'
  | 'jedi_commands'
  | 'master_controls';

// Biometric event listener
type BiometricListener = (event: BiometricEvent) => void;

// Biometric event
export interface BiometricEvent {
  type: 'auth_success' | 'auth_failure' | 'lockout' | 'settings_changed' | 'enrollment_changed';
  timestamp: number;
  data?: any;
}

class BiometricAuthService {
  private settings: BiometricSettings;
  private capability: BiometricCapability | null = null;
  private authAttempts: AuthAttempt[] = [];
  private listeners: Set<BiometricListener> = new Set();
  private failedAttempts: number = 0;
  private lockoutUntil: number = 0;
  private lastAuthTime: number = 0;
  private isAuthenticated: boolean = false;

  constructor() {
    this.settings = {
      enabled: false,
      requireForLogin: true,
      requireForSensitiveData: true,
      requireForTransactions: true,
      fallbackToPIN: true,
      lockoutDuration: 300000, // 5 minutes
      maxAttempts: 5,
      autoLockTimeout: 300000, // 5 minutes
    };

    this.loadSettings();
    this.checkCapability();
  }

  // Check biometric capability
  async checkCapability(): Promise<BiometricCapability> {
    // Simulate biometric capability check
    // In production, this would use expo-local-authentication
    const capability: BiometricCapability = {
      available: true,
      biometricType: Platform.OS === 'ios' ? 'face_id' : 'fingerprint',
      enrolled: true,
      securityLevel: 'strong',
    };

    this.capability = capability;
    return capability;
  }

  // Get current capability
  getCapability(): BiometricCapability | null {
    return this.capability;
  }

  // Authenticate with biometrics
  async authenticate(reason: string = 'Verify your identity'): Promise<AuthResult> {
    // Check if locked out
    if (this.isLockedOut()) {
      const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Too many failed attempts. Try again in ${remainingTime} seconds.`,
        timestamp: Date.now(),
      };
    }

    // Check capability
    if (!this.capability?.available) {
      return {
        success: false,
        error: 'Biometric authentication not available on this device',
        timestamp: Date.now(),
      };
    }

    if (!this.capability.enrolled) {
      return {
        success: false,
        error: 'No biometric data enrolled. Please set up Face ID or Touch ID in device settings.',
        timestamp: Date.now(),
      };
    }

    try {
      // Simulate biometric authentication
      // In production, this would use expo-local-authentication
      const success = await this.simulateBiometricAuth();

      const attempt: AuthAttempt = {
        id: `auth-${Date.now()}`,
        timestamp: Date.now(),
        success,
        biometricType: this.capability.biometricType,
        reason,
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
      };

      this.authAttempts.push(attempt);
      await this.saveAuthHistory();

      if (success) {
        this.failedAttempts = 0;
        this.lastAuthTime = Date.now();
        this.isAuthenticated = true;
        
        this.emitEvent({
          type: 'auth_success',
          timestamp: Date.now(),
          data: { biometricType: this.capability.biometricType },
        });

        return {
          success: true,
          biometricType: this.capability.biometricType,
          timestamp: Date.now(),
        };
      } else {
        this.failedAttempts++;
        
        if (this.failedAttempts >= this.settings.maxAttempts) {
          this.lockoutUntil = Date.now() + this.settings.lockoutDuration;
          this.emitEvent({
            type: 'lockout',
            timestamp: Date.now(),
            data: { duration: this.settings.lockoutDuration },
          });
        }

        this.emitEvent({
          type: 'auth_failure',
          timestamp: Date.now(),
          data: { remainingAttempts: this.settings.maxAttempts - this.failedAttempts },
        });

        return {
          success: false,
          error: 'Biometric authentication failed',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
        timestamp: Date.now(),
      };
    }
  }

  // Simulate biometric authentication (for demo)
  private async simulateBiometricAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate authentication delay
      setTimeout(() => {
        // Simulate 95% success rate
        resolve(Math.random() > 0.05);
      }, 500);
    });
  }

  // Authenticate with PIN fallback
  async authenticateWithPIN(pin: string): Promise<AuthResult> {
    if (!this.settings.fallbackToPIN) {
      return {
        success: false,
        error: 'PIN authentication is not enabled',
        timestamp: Date.now(),
      };
    }

    if (!this.settings.pinCode) {
      return {
        success: false,
        error: 'No PIN has been set up',
        timestamp: Date.now(),
      };
    }

    const success = pin === this.settings.pinCode;

    if (success) {
      this.failedAttempts = 0;
      this.lastAuthTime = Date.now();
      this.isAuthenticated = true;
    } else {
      this.failedAttempts++;
    }

    return {
      success,
      error: success ? undefined : 'Incorrect PIN',
      timestamp: Date.now(),
    };
  }

  // Check if locked out
  isLockedOut(): boolean {
    if (this.lockoutUntil > Date.now()) {
      return true;
    }
    this.lockoutUntil = 0;
    return false;
  }

  // Get lockout remaining time
  getLockoutRemaining(): number {
    if (!this.isLockedOut()) return 0;
    return Math.max(0, this.lockoutUntil - Date.now());
  }

  // Check if authentication is required
  isAuthRequired(category?: ProtectedCategory): boolean {
    if (!this.settings.enabled) return false;

    // Check auto-lock timeout
    if (this.lastAuthTime > 0 && 
        Date.now() - this.lastAuthTime > this.settings.autoLockTimeout) {
      this.isAuthenticated = false;
    }

    if (this.isAuthenticated) return false;

    // Check category-specific requirements
    if (category) {
      switch (category) {
        case 'patient_records':
        case 'medications':
        case 'lab_results':
          return this.settings.requireForSensitiveData;
        case 'financial_data':
          return this.settings.requireForTransactions;
        case 'admin_settings':
        case 'jedi_commands':
        case 'master_controls':
          return true; // Always require for admin
        default:
          return this.settings.requireForLogin;
      }
    }

    return this.settings.requireForLogin;
  }

  // Set up PIN
  async setupPIN(pin: string): Promise<boolean> {
    if (pin.length < 4 || pin.length > 8) {
      return false;
    }

    this.settings.pinCode = pin;
    await this.saveSettings();
    return true;
  }

  // Change PIN
  async changePIN(currentPIN: string, newPIN: string): Promise<boolean> {
    if (this.settings.pinCode !== currentPIN) {
      return false;
    }

    return this.setupPIN(newPIN);
  }

  // Enable biometric authentication
  async enable(): Promise<boolean> {
    if (!this.capability?.available || !this.capability.enrolled) {
      return false;
    }

    this.settings.enabled = true;
    await this.saveSettings();
    
    this.emitEvent({
      type: 'settings_changed',
      timestamp: Date.now(),
      data: { enabled: true },
    });

    return true;
  }

  // Disable biometric authentication
  async disable(): Promise<void> {
    this.settings.enabled = false;
    await this.saveSettings();
    
    this.emitEvent({
      type: 'settings_changed',
      timestamp: Date.now(),
      data: { enabled: false },
    });
  }

  // Get settings
  getSettings(): BiometricSettings {
    return { ...this.settings, pinCode: undefined }; // Don't expose PIN
  }

  // Update settings
  async updateSettings(updates: Partial<BiometricSettings>): Promise<void> {
    // Don't allow direct PIN updates through this method
    const { pinCode, ...safeUpdates } = updates;
    this.settings = { ...this.settings, ...safeUpdates };
    await this.saveSettings();
    
    this.emitEvent({
      type: 'settings_changed',
      timestamp: Date.now(),
      data: safeUpdates,
    });
  }

  // Get authentication history
  getAuthHistory(limit: number = 50): AuthAttempt[] {
    return this.authAttempts.slice(-limit);
  }

  // Clear authentication history
  async clearAuthHistory(): Promise<void> {
    this.authAttempts = [];
    await AsyncStorage.removeItem('biometric_auth_history');
  }

  // Reset lockout
  resetLockout(): void {
    this.failedAttempts = 0;
    this.lockoutUntil = 0;
  }

  // Sign out (require re-authentication)
  signOut(): void {
    this.isAuthenticated = false;
    this.lastAuthTime = 0;
  }

  // Check if currently authenticated
  isCurrentlyAuthenticated(): boolean {
    if (!this.settings.enabled) return true;
    
    // Check auto-lock timeout
    if (this.lastAuthTime > 0 && 
        Date.now() - this.lastAuthTime > this.settings.autoLockTimeout) {
      this.isAuthenticated = false;
    }

    return this.isAuthenticated;
  }

  // Add event listener
  addListener(listener: BiometricListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Emit event
  private emitEvent(event: BiometricEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Biometric listener error:', error);
      }
    });
  }

  // Save settings
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save biometric settings:', error);
    }
  }

  // Load settings
  private async loadSettings(): Promise<void> {
    try {
      const json = await AsyncStorage.getItem('biometric_settings');
      if (json) {
        this.settings = { ...this.settings, ...JSON.parse(json) };
      }
    } catch (error) {
      console.error('Failed to load biometric settings:', error);
    }
  }

  // Save auth history
  private async saveAuthHistory(): Promise<void> {
    try {
      // Keep only last 100 attempts
      const recentAttempts = this.authAttempts.slice(-100);
      await AsyncStorage.setItem('biometric_auth_history', JSON.stringify(recentAttempts));
    } catch (error) {
      console.error('Failed to save auth history:', error);
    }
  }

  // Get biometric type display name
  getBiometricTypeName(): string {
    if (!this.capability) return 'Biometric';
    
    switch (this.capability.biometricType) {
      case 'face_id': return 'Face ID';
      case 'touch_id': return 'Touch ID';
      case 'fingerprint': return 'Fingerprint';
      case 'iris': return 'Iris Scan';
      default: return 'Biometric';
    }
  }

  // Get security recommendations
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.settings.enabled) {
      recommendations.push('Enable biometric authentication for enhanced security');
    }

    if (!this.settings.fallbackToPIN) {
      recommendations.push('Set up a PIN as a backup authentication method');
    }

    if (this.settings.autoLockTimeout > 600000) {
      recommendations.push('Consider reducing auto-lock timeout for better security');
    }

    if (!this.settings.requireForSensitiveData) {
      recommendations.push('Enable biometric verification for sensitive medical data');
    }

    return recommendations;
  }
}

// Export singleton instance
export const biometricAuthService = new BiometricAuthService();
export default biometricAuthService;
