/**
 * MediVac One - MFA Enforcement Service
 * Multi-factor authentication for clinical staff compliance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==========================================
// Types
// ==========================================

export type MFAMethod = 'totp' | 'sms' | 'email' | 'biometric' | 'hardware_key' | 'push';

export type ClinicalRole = 
  | 'doctor' | 'nurse' | 'pharmacist' | 'lab_tech' | 'radiologist'
  | 'admin' | 'receptionist' | 'billing' | 'it_admin' | 'executive'
  | 'emergency' | 'surgeon' | 'anesthetist' | 'patient';

export type ComplianceStandard = 'hipaa' | 'australian_privacy' | 'iso_27001' | 'nist' | 'pci_dss';

export interface MFAPolicy {
  id: string;
  name: string;
  roles: ClinicalRole[];
  requiredMethods: number;
  allowedMethods: MFAMethod[];
  sessionTimeout: number;
  reauthenticationRequired: boolean;
  reauthenticationActions: string[];
  bypassAllowed: boolean;
  bypassApprovalRequired: boolean;
  bypassMaxDuration: number;
  complianceStandards: ComplianceStandard[];
  createdAt: string;
  updatedAt: string;
}

export interface UserMFAConfig {
  userId: string;
  role: ClinicalRole;
  enabledMethods: MFAMethod[];
  preferredMethod: MFAMethod;
  totpSecret?: string;
  totpVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  email?: string;
  emailVerified: boolean;
  biometricEnabled: boolean;
  biometricType?: 'face_id' | 'touch_id' | 'fingerprint';
  hardwareKeys: HardwareKey[];
  pushDevices: PushDevice[];
  backupCodes: string[];
  backupCodesUsed: string[];
  lastMFAAt?: string;
  mfaFailures: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HardwareKey {
  id: string;
  name: string;
  type: 'yubikey' | 'titan' | 'other';
  publicKey: string;
  registeredAt: string;
  lastUsedAt?: string;
}

export interface PushDevice {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  pushToken: string;
  registeredAt: string;
  lastUsedAt?: string;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  code?: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  createdAt: string;
}

export interface MFASession {
  id: string;
  userId: string;
  methodsUsed: MFAMethod[];
  authenticatedAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  isValid: boolean;
}

export interface MFABypassRequest {
  id: string;
  userId: string;
  reason: string;
  requestedAt: string;
  expiresAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
}

export interface MFAComplianceReport {
  generatedAt: string;
  period: { start: string; end: string };
  totalUsers: number;
  mfaEnabledUsers: number;
  mfaEnforcedRoles: ClinicalRole[];
  complianceRate: number;
  byRole: Record<ClinicalRole, { total: number; compliant: number; rate: number }>;
  byMethod: Record<MFAMethod, number>;
  violations: MFAViolation[];
  recommendations: string[];
}

export interface MFAViolation {
  id: string;
  userId: string;
  role: ClinicalRole;
  violationType: 'no_mfa' | 'weak_method' | 'expired_session' | 'bypass_abuse' | 'failed_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  resolvedAt?: string;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  POLICIES: 'mfa_policies',
  USER_CONFIGS: 'mfa_user_configs',
  SESSIONS: 'mfa_sessions',
  BYPASS_REQUESTS: 'mfa_bypass_requests',
  VIOLATIONS: 'mfa_violations',
};

const DEFAULT_POLICIES: MFAPolicy[] = [
  {
    id: 'clinical_staff',
    name: 'Clinical Staff MFA Policy',
    roles: ['doctor', 'nurse', 'pharmacist', 'surgeon', 'anesthetist', 'emergency'],
    requiredMethods: 2,
    allowedMethods: ['totp', 'biometric', 'hardware_key', 'push'],
    sessionTimeout: 28800000, // 8 hours
    reauthenticationRequired: true,
    reauthenticationActions: ['prescribe_medication', 'access_patient_records', 'order_tests', 'modify_treatment'],
    bypassAllowed: true,
    bypassApprovalRequired: true,
    bypassMaxDuration: 3600000, // 1 hour
    complianceStandards: ['hipaa', 'australian_privacy', 'iso_27001'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'admin_staff',
    name: 'Administrative Staff MFA Policy',
    roles: ['admin', 'receptionist', 'billing'],
    requiredMethods: 1,
    allowedMethods: ['totp', 'sms', 'email', 'biometric'],
    sessionTimeout: 14400000, // 4 hours
    reauthenticationRequired: true,
    reauthenticationActions: ['access_billing', 'modify_appointments', 'access_reports'],
    bypassAllowed: true,
    bypassApprovalRequired: false,
    bypassMaxDuration: 1800000, // 30 minutes
    complianceStandards: ['australian_privacy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'it_admin',
    name: 'IT Administrator MFA Policy',
    roles: ['it_admin'],
    requiredMethods: 2,
    allowedMethods: ['totp', 'hardware_key'],
    sessionTimeout: 7200000, // 2 hours
    reauthenticationRequired: true,
    reauthenticationActions: ['system_config', 'user_management', 'security_settings', 'audit_access'],
    bypassAllowed: false,
    bypassApprovalRequired: true,
    bypassMaxDuration: 0,
    complianceStandards: ['hipaa', 'australian_privacy', 'iso_27001', 'nist'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'executive',
    name: 'Executive MFA Policy',
    roles: ['executive'],
    requiredMethods: 2,
    allowedMethods: ['totp', 'biometric', 'hardware_key', 'push'],
    sessionTimeout: 14400000, // 4 hours
    reauthenticationRequired: true,
    reauthenticationActions: ['financial_reports', 'strategic_data', 'compliance_reports'],
    bypassAllowed: true,
    bypassApprovalRequired: true,
    bypassMaxDuration: 3600000, // 1 hour
    complianceStandards: ['hipaa', 'australian_privacy', 'pci_dss'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'patient',
    name: 'Patient MFA Policy',
    roles: ['patient'],
    requiredMethods: 1,
    allowedMethods: ['sms', 'email', 'biometric'],
    sessionTimeout: 86400000, // 24 hours
    reauthenticationRequired: false,
    reauthenticationActions: [],
    bypassAllowed: true,
    bypassApprovalRequired: false,
    bypassMaxDuration: 86400000, // 24 hours
    complianceStandards: ['australian_privacy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MFA_METHOD_STRENGTH: Record<MFAMethod, number> = {
  hardware_key: 5,
  biometric: 4,
  totp: 3,
  push: 3,
  sms: 2,
  email: 1,
};

// ==========================================
// MFA Enforcement Service
// ==========================================

class MFAEnforcementService {
  private policies: Map<string, MFAPolicy> = new Map();
  private userConfigs: Map<string, UserMFAConfig> = new Map();
  private sessions: Map<string, MFASession> = new Map();
  private challenges: Map<string, MFAChallenge> = new Map();
  private bypassRequests: Map<string, MFABypassRequest> = new Map();
  private violations: MFAViolation[] = [];
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadPolicies();
      await this.loadUserConfigs();
      await this.loadSessions();
      await this.loadBypassRequests();
      await this.loadViolations();
      
      // Initialize default policies if none exist
      if (this.policies.size === 0) {
        for (const policy of DEFAULT_POLICIES) {
          this.policies.set(policy.id, policy);
        }
        await this.savePolicies();
      }
    } catch (error) {
      console.error('Failed to initialize MFA Enforcement Service:', error);
    }
  }

  // ==========================================
  // Policy Management
  // ==========================================

  async setPolicy(policy: MFAPolicy): Promise<void> {
    policy.updatedAt = new Date().toISOString();
    this.policies.set(policy.id, policy);
    await this.savePolicies();
    this.emit('policy_updated', policy);
  }

  getPolicy(policyId: string): MFAPolicy | null {
    return this.policies.get(policyId) || null;
  }

  getPolicyForRole(role: ClinicalRole): MFAPolicy | null {
    for (const policy of this.policies.values()) {
      if (policy.roles.includes(role)) {
        return policy;
      }
    }
    return null;
  }

  getAllPolicies(): MFAPolicy[] {
    return Array.from(this.policies.values());
  }

  async deletePolicy(policyId: string): Promise<void> {
    this.policies.delete(policyId);
    await this.savePolicies();
    this.emit('policy_deleted', { policyId });
  }

  private async loadPolicies(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.POLICIES);
      if (stored) {
        const parsed = JSON.parse(stored) as MFAPolicy[];
        for (const policy of parsed) {
          this.policies.set(policy.id, policy);
        }
      }
    } catch (error) {
      console.error('Failed to load MFA policies:', error);
    }
  }

  private async savePolicies(): Promise<void> {
    try {
      const policies = Array.from(this.policies.values());
      await AsyncStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(policies));
    } catch (error) {
      console.error('Failed to save MFA policies:', error);
    }
  }

  // ==========================================
  // User MFA Configuration
  // ==========================================

  async setupUserMFA(userId: string, role: ClinicalRole): Promise<UserMFAConfig> {
    const config: UserMFAConfig = {
      userId,
      role,
      enabledMethods: [],
      preferredMethod: 'totp',
      totpVerified: false,
      phoneVerified: false,
      emailVerified: false,
      biometricEnabled: false,
      hardwareKeys: [],
      pushDevices: [],
      backupCodes: this.generateBackupCodes(),
      backupCodesUsed: [],
      mfaFailures: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.userConfigs.set(userId, config);
    await this.saveUserConfigs();
    this.emit('user_mfa_setup', { userId, config });
    
    return config;
  }

  async updateUserMFA(userId: string, updates: Partial<UserMFAConfig>): Promise<UserMFAConfig> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
    this.userConfigs.set(userId, updatedConfig);
    await this.saveUserConfigs();
    this.emit('user_mfa_updated', { userId, config: updatedConfig });
    
    return updatedConfig;
  }

  getUserMFA(userId: string): UserMFAConfig | null {
    return this.userConfigs.get(userId) || null;
  }

  private async loadUserConfigs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_CONFIGS);
      if (stored) {
        const parsed = JSON.parse(stored) as UserMFAConfig[];
        for (const config of parsed) {
          this.userConfigs.set(config.userId, config);
        }
      }
    } catch (error) {
      console.error('Failed to load user MFA configs:', error);
    }
  }

  private async saveUserConfigs(): Promise<void> {
    try {
      const configs = Array.from(this.userConfigs.values());
      await AsyncStorage.setItem(STORAGE_KEYS.USER_CONFIGS, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save user MFA configs:', error);
    }
  }

  // ==========================================
  // TOTP Setup
  // ==========================================

  async setupTOTP(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    const secret = this.generateTOTPSecret();
    const qrCodeUrl = `otpauth://totp/MediVac:${userId}?secret=${secret}&issuer=MediVac`;

    config.totpSecret = secret;
    config.totpVerified = false;
    config.updatedAt = new Date().toISOString();
    await this.saveUserConfigs();

    return { secret, qrCodeUrl };
  }

  async verifyTOTPSetup(userId: string, code: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config || !config.totpSecret) {
      throw new Error('TOTP not set up');
    }

    const isValid = this.verifyTOTPCode(config.totpSecret, code);
    
    if (isValid) {
      config.totpVerified = true;
      if (!config.enabledMethods.includes('totp')) {
        config.enabledMethods.push('totp');
      }
      config.updatedAt = new Date().toISOString();
      await this.saveUserConfigs();
      this.emit('totp_verified', { userId });
    }

    return isValid;
  }

  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    // Simplified TOTP verification - in production use a proper library
    const timeStep = Math.floor(Date.now() / 30000);
    const expectedCode = this.generateTOTPCode(secret, timeStep);
    return code === expectedCode || code === this.generateTOTPCode(secret, timeStep - 1);
  }

  private generateTOTPCode(secret: string, timeStep: number): string {
    // Simplified - in production use proper HMAC-SHA1
    const hash = (secret + timeStep.toString()).split('').reduce((a, b) => {
      return ((a << 5) - a + b.charCodeAt(0)) | 0;
    }, 0);
    return Math.abs(hash % 1000000).toString().padStart(6, '0');
  }

  // ==========================================
  // Challenge & Verification
  // ==========================================

  async createChallenge(userId: string, method: MFAMethod): Promise<MFAChallenge> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    if (!config.enabledMethods.includes(method)) {
      throw new Error(`MFA method ${method} not enabled for user`);
    }

    const challenge: MFAChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      method,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      verified: false,
      createdAt: new Date().toISOString(),
    };

    // Generate code for SMS/Email
    if (method === 'sms' || method === 'email') {
      challenge.code = Math.floor(100000 + Math.random() * 900000).toString();
      // In production, send the code via SMS or email
    }

    this.challenges.set(challenge.id, challenge);
    this.emit('challenge_created', challenge);

    return challenge;
  }

  async verifyChallenge(challengeId: string, code: string): Promise<boolean> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (new Date(challenge.expiresAt) < new Date()) {
      this.challenges.delete(challengeId);
      throw new Error('Challenge expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      await this.recordFailedAttempt(challenge.userId);
      throw new Error('Maximum attempts exceeded');
    }

    challenge.attempts++;
    let isValid = false;

    switch (challenge.method) {
      case 'totp': {
        const config = this.userConfigs.get(challenge.userId);
        if (config?.totpSecret) {
          isValid = this.verifyTOTPCode(config.totpSecret, code);
        }
        break;
      }
      case 'sms':
      case 'email':
        isValid = challenge.code === code;
        break;
      case 'biometric':
        isValid = code === 'biometric_verified';
        break;
      case 'hardware_key':
        isValid = code.startsWith('hw_');
        break;
      case 'push':
        isValid = code === 'push_approved';
        break;
    }

    if (isValid) {
      challenge.verified = true;
      this.challenges.delete(challengeId);
      this.emit('challenge_verified', { challengeId, userId: challenge.userId, method: challenge.method });
    } else if (challenge.attempts >= challenge.maxAttempts) {
      await this.recordFailedAttempt(challenge.userId);
    }

    return isValid;
  }

  private async recordFailedAttempt(userId: string): Promise<void> {
    const config = this.userConfigs.get(userId);
    if (config) {
      config.mfaFailures++;
      
      // Lock account after 5 failures
      if (config.mfaFailures >= 5) {
        config.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
        this.emit('account_locked', { userId, until: config.lockedUntil });
        
        await this.recordViolation({
          userId,
          role: config.role,
          violationType: 'failed_attempts',
          severity: 'high',
          description: `Account locked after ${config.mfaFailures} failed MFA attempts`,
        });
      }
      
      await this.saveUserConfigs();
    }
  }

  // ==========================================
  // Session Management
  // ==========================================

  async createSession(userId: string, methodsUsed: MFAMethod[]): Promise<MFASession> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    const policy = this.getPolicyForRole(config.role);
    const sessionTimeout = policy?.sessionTimeout || 28800000; // Default 8 hours

    const session: MFASession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      methodsUsed,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + sessionTimeout).toISOString(),
      isValid: true,
    };

    this.sessions.set(session.id, session);
    
    // Update user's last MFA time
    config.lastMFAAt = session.authenticatedAt;
    config.mfaFailures = 0; // Reset failures on successful auth
    await this.saveUserConfigs();
    await this.saveSessions();
    
    this.emit('session_created', session);
    return session;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (new Date(session.expiresAt) < new Date()) {
      session.isValid = false;
      return false;
    }
    
    return session.isValid;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isValid = false;
      await this.saveSessions();
      this.emit('session_invalidated', { sessionId });
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.isValid = false;
      }
    }
    await this.saveSessions();
    this.emit('all_sessions_invalidated', { userId });
  }

  private async loadSessions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (stored) {
        const parsed = JSON.parse(stored) as MFASession[];
        for (const session of parsed) {
          this.sessions.set(session.id, session);
        }
      }
    } catch (error) {
      console.error('Failed to load MFA sessions:', error);
    }
  }

  private async saveSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save MFA sessions:', error);
    }
  }

  // ==========================================
  // Bypass Requests
  // ==========================================

  async requestBypass(userId: string, reason: string, duration: number): Promise<MFABypassRequest> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    const policy = this.getPolicyForRole(config.role);
    if (!policy?.bypassAllowed) {
      throw new Error('MFA bypass not allowed for this role');
    }

    const maxDuration = policy.bypassMaxDuration;
    const actualDuration = Math.min(duration, maxDuration);

    const request: MFABypassRequest = {
      id: `bypass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      reason,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + actualDuration).toISOString(),
      status: policy.bypassApprovalRequired ? 'pending' : 'approved',
    };

    if (!policy.bypassApprovalRequired) {
      request.approvedAt = request.requestedAt;
    }

    this.bypassRequests.set(request.id, request);
    await this.saveBypassRequests();
    this.emit('bypass_requested', request);

    return request;
  }

  async approveBypass(requestId: string, approverId: string): Promise<void> {
    const request = this.bypassRequests.get(requestId);
    if (!request) {
      throw new Error('Bypass request not found');
    }

    request.status = 'approved';
    request.approvedBy = approverId;
    request.approvedAt = new Date().toISOString();
    
    await this.saveBypassRequests();
    this.emit('bypass_approved', request);
  }

  async denyBypass(requestId: string): Promise<void> {
    const request = this.bypassRequests.get(requestId);
    if (!request) {
      throw new Error('Bypass request not found');
    }

    request.status = 'denied';
    await this.saveBypassRequests();
    this.emit('bypass_denied', request);
  }

  hasActiveBypass(userId: string): boolean {
    for (const request of this.bypassRequests.values()) {
      if (
        request.userId === userId &&
        request.status === 'approved' &&
        new Date(request.expiresAt) > new Date()
      ) {
        return true;
      }
    }
    return false;
  }

  private async loadBypassRequests(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BYPASS_REQUESTS);
      if (stored) {
        const parsed = JSON.parse(stored) as MFABypassRequest[];
        for (const request of parsed) {
          this.bypassRequests.set(request.id, request);
        }
      }
    } catch (error) {
      console.error('Failed to load bypass requests:', error);
    }
  }

  private async saveBypassRequests(): Promise<void> {
    try {
      const requests = Array.from(this.bypassRequests.values());
      await AsyncStorage.setItem(STORAGE_KEYS.BYPASS_REQUESTS, JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to save bypass requests:', error);
    }
  }

  // ==========================================
  // Biometric Authentication
  // ==========================================

  async enableBiometric(userId: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    // Check platform support
    if (Platform.OS === 'web') {
      throw new Error('Biometric authentication not supported on web');
    }

    config.biometricEnabled = true;
    config.biometricType = Platform.OS === 'ios' ? 'face_id' : 'fingerprint';
    if (!config.enabledMethods.includes('biometric')) {
      config.enabledMethods.push('biometric');
    }
    config.updatedAt = new Date().toISOString();
    
    await this.saveUserConfigs();
    this.emit('biometric_enabled', { userId, type: config.biometricType });
    
    return true;
  }

  async disableBiometric(userId: string): Promise<void> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    config.biometricEnabled = false;
    config.biometricType = undefined;
    config.enabledMethods = config.enabledMethods.filter(m => m !== 'biometric');
    config.updatedAt = new Date().toISOString();
    
    await this.saveUserConfigs();
    this.emit('biometric_disabled', { userId });
  }

  // ==========================================
  // Backup Codes
  // ==========================================

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    config.backupCodes = this.generateBackupCodes();
    config.backupCodesUsed = [];
    config.updatedAt = new Date().toISOString();
    
    await this.saveUserConfigs();
    this.emit('backup_codes_regenerated', { userId });
    
    return config.backupCodes;
  }

  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      throw new Error('User MFA config not found');
    }

    const codeIndex = config.backupCodes.indexOf(code);
    if (codeIndex === -1 || config.backupCodesUsed.includes(code)) {
      return false;
    }

    config.backupCodesUsed.push(code);
    config.updatedAt = new Date().toISOString();
    await this.saveUserConfigs();
    
    this.emit('backup_code_used', { userId, remainingCodes: config.backupCodes.length - config.backupCodesUsed.length });
    
    return true;
  }

  // ==========================================
  // Compliance & Violations
  // ==========================================

  async recordViolation(violation: Omit<MFAViolation, 'id' | 'detectedAt'>): Promise<void> {
    const fullViolation: MFAViolation = {
      ...violation,
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detectedAt: new Date().toISOString(),
    };

    this.violations.push(fullViolation);
    await this.saveViolations();
    this.emit('violation_recorded', fullViolation);
  }

  async resolveViolation(violationId: string): Promise<void> {
    const violation = this.violations.find(v => v.id === violationId);
    if (violation) {
      violation.resolvedAt = new Date().toISOString();
      await this.saveViolations();
      this.emit('violation_resolved', violation);
    }
  }

  getViolations(options?: { userId?: string; severity?: string; unresolved?: boolean }): MFAViolation[] {
    let filtered = [...this.violations];
    
    if (options?.userId) {
      filtered = filtered.filter(v => v.userId === options.userId);
    }
    if (options?.severity) {
      filtered = filtered.filter(v => v.severity === options.severity);
    }
    if (options?.unresolved) {
      filtered = filtered.filter(v => !v.resolvedAt);
    }
    
    return filtered.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  private async loadViolations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VIOLATIONS);
      if (stored) {
        this.violations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load violations:', error);
    }
  }

  private async saveViolations(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(this.violations));
    } catch (error) {
      console.error('Failed to save violations:', error);
    }
  }

  generateComplianceReport(startDate: string, endDate: string): MFAComplianceReport {
    const allConfigs = Array.from(this.userConfigs.values());
    const totalUsers = allConfigs.length;
    const mfaEnabledUsers = allConfigs.filter(c => c.enabledMethods.length > 0).length;

    const byRole: Record<string, { total: number; compliant: number; rate: number }> = {};
    const byMethod: Record<MFAMethod, number> = {
      totp: 0, sms: 0, email: 0, biometric: 0, hardware_key: 0, push: 0,
    };

    for (const config of allConfigs) {
      const role = config.role;
      if (!byRole[role]) {
        byRole[role] = { total: 0, compliant: 0, rate: 0 };
      }
      byRole[role].total++;
      
      const policy = this.getPolicyForRole(role);
      if (policy && config.enabledMethods.length >= policy.requiredMethods) {
        byRole[role].compliant++;
      }

      for (const method of config.enabledMethods) {
        byMethod[method]++;
      }
    }

    // Calculate rates
    for (const role of Object.keys(byRole)) {
      byRole[role].rate = byRole[role].total > 0 
        ? (byRole[role].compliant / byRole[role].total) * 100 
        : 0;
    }

    const periodViolations = this.violations.filter(v => {
      const detected = new Date(v.detectedAt);
      return detected >= new Date(startDate) && detected <= new Date(endDate);
    });

    const enforcedRoles = Array.from(this.policies.values())
      .filter(p => p.requiredMethods > 0)
      .flatMap(p => p.roles);

    return {
      generatedAt: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      totalUsers,
      mfaEnabledUsers,
      mfaEnforcedRoles: [...new Set(enforcedRoles)] as ClinicalRole[],
      complianceRate: totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0,
      byRole: byRole as Record<ClinicalRole, { total: number; compliant: number; rate: number }>,
      byMethod,
      violations: periodViolations,
      recommendations: this.generateRecommendations(byRole, byMethod, periodViolations),
    };
  }

  private generateRecommendations(
    byRole: Record<string, { total: number; compliant: number; rate: number }>,
    byMethod: Record<MFAMethod, number>,
    violations: MFAViolation[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for low compliance roles
    for (const [role, stats] of Object.entries(byRole)) {
      if (stats.rate < 80 && stats.total > 0) {
        recommendations.push(`Increase MFA adoption for ${role} role (currently ${stats.rate.toFixed(1)}%)`);
      }
    }

    // Check for weak methods
    const totalMethods = Object.values(byMethod).reduce((a, b) => a + b, 0);
    if (totalMethods > 0) {
      const smsEmailPercent = ((byMethod.sms + byMethod.email) / totalMethods) * 100;
      if (smsEmailPercent > 50) {
        recommendations.push('Consider migrating users from SMS/Email to stronger MFA methods (TOTP, biometric)');
      }
    }

    // Check for critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical' && !v.resolvedAt);
    if (criticalViolations.length > 0) {
      recommendations.push(`Address ${criticalViolations.length} unresolved critical MFA violations immediately`);
    }

    if (recommendations.length === 0) {
      recommendations.push('MFA compliance is healthy. Continue monitoring and regular policy reviews.');
    }

    return recommendations;
  }

  // ==========================================
  // Event System
  // ==========================================

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const mfaEnforcement = new MFAEnforcementService();

export default MFAEnforcementService;
