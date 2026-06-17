 * Biometric Unlock Service
 * Provides Face ID/Touch ID authentication for staff after initial PIN verification
 */

export type BiometricType = 'face_id' | 'touch_id' | 'fingerprint' | 'none';

export interface BiometricStatus {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
  hasHardware: boolean;
}

export interface BiometricEnrollment {
  staffId: string;
  enrolledAt: number;
  biometricType: BiometricType;
  lastUsed?: number;
}

export interface BiometricAuthResult {
  success: boolean;
  staffId?: string;
  error?: string;
}

type BiometricListener = (status: BiometricStatus) => void;

class BiometricUnlockService {
  private static instance: BiometricUnlockService;
  private enrollments: Map<string, BiometricEnrollment> = new Map();
  private listeners: Set<BiometricListener> = new Set();
  private isEnabled: boolean = true;
  
  // Simulated device capabilities
  private deviceBiometricType: BiometricType = 'face_id';
  private hasHardwareSupport: boolean = true;

  private constructor() {
    this.loadEnrollments();
  }

  static getInstance(): BiometricUnlockService {
    if (!BiometricUnlockService.instance) {
      BiometricUnlockService.instance = new BiometricUnlockService();
    }
    return BiometricUnlockService.instance;
  }
