/**
 * MediVac One - OAuth Credential Management Service
 * Secure storage and management of authentication credentials
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ==========================================
// Types
// ==========================================

export type CredentialProvider = 'jeditek' | 'azure' | 'google' | 'apple' | 'claris';

export interface OAuthCredential {
  provider: CredentialProvider;
  clientId: string;
  clientSecret?: string;
  tenantId?: string;
  redirectUri: string;
  scopes: string[];
  environment: 'development' | 'staging' | 'production';
  isValid: boolean;
  lastValidated?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JEDITekCredential extends OAuthCredential {
  provider: 'jeditek';
  ssoEndpoint: string;
  apiEndpoint: string;
  smpoComplianceKey?: string;
  jediMasterKey?: string;
}

export interface AzureADCredential extends OAuthCredential {
  provider: 'azure';
  tenantId: string;
  authority: string;
  graphEndpoint: string;
  b2cEnabled: boolean;
  b2cPolicies?: {
    signUpSignIn: string;
    resetPassword: string;
    editProfile: string;
  };
}

export interface GoogleCredential extends OAuthCredential {
  provider: 'google';
  iosClientId?: string;
  androidClientId?: string;
  webClientId: string;
  hostedDomain?: string;
}

export interface AppleCredential extends OAuthCredential {
  provider: 'apple';
  teamId: string;
  keyId: string;
  privateKey: string;
  servicesId: string;
}

export interface ClarisCredential extends OAuthCredential {
  provider: 'claris';
  serverHost: string;
  database: string;
  clarisIdEnabled: boolean;
  dataApiVersion: string;
  sslEnabled: boolean;
}

export type ProviderCredential = JEDITekCredential | AzureADCredential | GoogleCredential | AppleCredential | ClarisCredential;

export interface CredentialValidationResult {
  provider: CredentialProvider;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  testedAt: string;
  responseTime?: number;
}

export interface CredentialAuditEntry {
  id: string;
  provider: CredentialProvider;
  action: 'created' | 'updated' | 'deleted' | 'validated' | 'rotated' | 'accessed';
  userId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface CredentialRotationPolicy {
  provider: CredentialProvider;
  rotationIntervalDays: number;
  lastRotated?: string;
  nextRotation?: string;
  autoRotate: boolean;
  notifyBeforeDays: number;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  CREDENTIALS: 'oauth_credentials',
  AUDIT_LOG: 'credential_audit_log',
  ROTATION_POLICIES: 'credential_rotation_policies',
};

const SECURE_KEY_PREFIX = 'medivac_cred_';

const DEFAULT_SCOPES: Record<CredentialProvider, string[]> = {
  jeditek: ['openid', 'profile', 'email', 'jedi_rank', 'smpo_compliance', 'permissions'],
  azure: ['openid', 'profile', 'email', 'User.Read', 'Calendars.ReadWrite', 'Mail.Read'],
  google: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
  apple: ['name', 'email'],
  claris: ['fmrest', 'fmdata'],
};

const PROVIDER_ENDPOINTS: Record<CredentialProvider, { auth: string; token: string; api: string }> = {
  jeditek: {
    auth: 'https://sso.jeditek.com.au/oauth/authorize',
    token: 'https://sso.jeditek.com.au/oauth/token',
    api: 'https://api.jeditek.com.au/v1',
  },
  azure: {
    auth: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    api: 'https://graph.microsoft.com/v1.0',
  },
  google: {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    api: 'https://www.googleapis.com',
  },
  apple: {
    auth: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    api: 'https://appleid.apple.com',
  },
  claris: {
    auth: 'https://www.claris.com/oauth/authorize',
    token: 'https://www.claris.com/oauth/token',
    api: '{host}/fmi/data/v1/databases/{database}',
  },
};

// ==========================================
// Credential Management Service
// ==========================================

class CredentialManagementService {
  private credentials: Map<CredentialProvider, ProviderCredential> = new Map();
  private auditLog: CredentialAuditEntry[] = [];
  private rotationPolicies: Map<CredentialProvider, CredentialRotationPolicy> = new Map();
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadCredentials();
      await this.loadAuditLog();
      await this.loadRotationPolicies();
      this.checkRotationSchedule();
    } catch (error) {
      console.error('Failed to initialize Credential Management Service:', error);
    }
  }

  // ==========================================
  // Credential Storage
  // ==========================================

  private async loadCredentials(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (stored) {
        const parsed = JSON.parse(stored) as ProviderCredential[];
        for (const cred of parsed) {
          // Load secrets from secure storage
          const secrets = await this.loadSecrets(cred.provider);
          const mergedCred = { ...cred, ...secrets } as ProviderCredential;
          this.credentials.set(cred.provider, mergedCred);
        }
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }

  private async saveCredentials(): Promise<void> {
    try {
      const credArray = Array.from(this.credentials.values()).map(cred => {
        // Remove secrets before saving to regular storage
        const { clientSecret, privateKey, ...safeCred } = cred as ProviderCredential & { privateKey?: string };
        return safeCred;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credArray));
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  }

  private async loadSecrets(provider: CredentialProvider): Promise<Partial<ProviderCredential>> {
    const secrets: Partial<ProviderCredential> = {};
    
    if (Platform.OS === 'web') {
      // Web fallback - use localStorage with encryption marker
      const secretKey = `${SECURE_KEY_PREFIX}${provider}_secret`;
      const stored = localStorage.getItem(secretKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return {};
        }
      }
    } else {
      try {
        const secretKey = `${SECURE_KEY_PREFIX}${provider}_secret`;
        const stored = await SecureStore.getItemAsync(secretKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error(`Failed to load secrets for ${provider}:`, error);
      }
    }
    
    return secrets;
  }

  private async saveSecrets(provider: CredentialProvider, secrets: Record<string, string>): Promise<void> {
    const secretKey = `${SECURE_KEY_PREFIX}${provider}_secret`;
    const secretData = JSON.stringify(secrets);
    
    if (Platform.OS === 'web') {
      localStorage.setItem(secretKey, secretData);
    } else {
      try {
        await SecureStore.setItemAsync(secretKey, secretData);
      } catch (error) {
        console.error(`Failed to save secrets for ${provider}:`, error);
      }
    }
  }

  // ==========================================
  // Credential CRUD Operations
  // ==========================================

  async setCredential(credential: ProviderCredential): Promise<void> {
    const now = new Date().toISOString();
    const existingCred = this.credentials.get(credential.provider);
    
    const updatedCred: ProviderCredential = {
      ...credential,
      createdAt: existingCred?.createdAt || now,
      updatedAt: now,
      isValid: false, // Will be validated separately
    };

    // Extract and store secrets separately
    const secrets: Record<string, string> = {};
    if ('clientSecret' in updatedCred && updatedCred.clientSecret) {
      secrets.clientSecret = updatedCred.clientSecret;
    }
    if ('privateKey' in updatedCred && (updatedCred as AppleCredential).privateKey) {
      secrets.privateKey = (updatedCred as AppleCredential).privateKey;
    }
    
    if (Object.keys(secrets).length > 0) {
      await this.saveSecrets(credential.provider, secrets);
    }

    this.credentials.set(credential.provider, updatedCred);
    await this.saveCredentials();
    
    await this.addAuditEntry({
      provider: credential.provider,
      action: existingCred ? 'updated' : 'created',
      details: { scopes: credential.scopes, environment: credential.environment },
    });

    this.emit('credential_updated', { provider: credential.provider, credential: updatedCred });
  }

  async getCredential(provider: CredentialProvider): Promise<ProviderCredential | null> {
    const credential = this.credentials.get(provider);
    
    if (credential) {
      await this.addAuditEntry({
        provider,
        action: 'accessed',
      });
    }
    
    return credential || null;
  }

  async deleteCredential(provider: CredentialProvider): Promise<void> {
    const credential = this.credentials.get(provider);
    
    if (credential) {
      this.credentials.delete(provider);
      await this.saveCredentials();
      
      // Delete secrets
      const secretKey = `${SECURE_KEY_PREFIX}${provider}_secret`;
      if (Platform.OS === 'web') {
        localStorage.removeItem(secretKey);
      } else {
        try {
          await SecureStore.deleteItemAsync(secretKey);
        } catch (error) {
          console.error(`Failed to delete secrets for ${provider}:`, error);
        }
      }
      
      await this.addAuditEntry({
        provider,
        action: 'deleted',
      });

      this.emit('credential_deleted', { provider });
    }
  }

  getAllCredentials(): ProviderCredential[] {
    return Array.from(this.credentials.values());
  }

  hasCredential(provider: CredentialProvider): boolean {
    return this.credentials.has(provider);
  }

  // ==========================================
  // Credential Validation
  // ==========================================

  async validateCredential(provider: CredentialProvider): Promise<CredentialValidationResult> {
    const credential = this.credentials.get(provider);
    const startTime = Date.now();
    
    const result: CredentialValidationResult = {
      provider,
      isValid: false,
      errors: [],
      warnings: [],
      testedAt: new Date().toISOString(),
    };

    if (!credential) {
      result.errors.push('Credential not found');
      return result;
    }

    // Basic validation
    if (!credential.clientId) {
      result.errors.push('Client ID is required');
    }
    if (!credential.redirectUri) {
      result.errors.push('Redirect URI is required');
    }
    if (credential.scopes.length === 0) {
      result.warnings.push('No scopes configured');
    }

    // Provider-specific validation
    switch (provider) {
      case 'jeditek':
        await this.validateJEDITekCredential(credential as JEDITekCredential, result);
        break;
      case 'azure':
        await this.validateAzureCredential(credential as AzureADCredential, result);
        break;
      case 'google':
        await this.validateGoogleCredential(credential as GoogleCredential, result);
        break;
      case 'apple':
        await this.validateAppleCredential(credential as AppleCredential, result);
        break;
      case 'claris':
        await this.validateClarisCredential(credential as ClarisCredential, result);
        break;
    }

    result.isValid = result.errors.length === 0;
    result.responseTime = Date.now() - startTime;

    // Update credential validity
    if (result.isValid) {
      credential.isValid = true;
      credential.lastValidated = result.testedAt;
      await this.saveCredentials();
    }

    await this.addAuditEntry({
      provider,
      action: 'validated',
      details: { isValid: result.isValid, errors: result.errors },
    });

    this.emit('credential_validated', result);
    return result;
  }

  private async validateJEDITekCredential(credential: JEDITekCredential, result: CredentialValidationResult): Promise<void> {
    if (!credential.ssoEndpoint) {
      result.errors.push('SSO endpoint is required');
    }
    if (!credential.apiEndpoint) {
      result.errors.push('API endpoint is required');
    }
    if (!credential.smpoComplianceKey) {
      result.warnings.push('SMPO compliance key not configured');
    }
    
    // Test endpoint connectivity (simulated)
    try {
      // In production, this would make an actual request
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch {
      result.errors.push('Failed to connect to JEDITek SSO endpoint');
    }
  }

  private async validateAzureCredential(credential: AzureADCredential, result: CredentialValidationResult): Promise<void> {
    if (!credential.tenantId) {
      result.errors.push('Tenant ID is required');
    }
    if (!credential.authority) {
      result.warnings.push('Authority not configured, using default');
    }
    if (credential.b2cEnabled && !credential.b2cPolicies) {
      result.errors.push('B2C policies required when B2C is enabled');
    }
    
    // Validate tenant format
    const tenantPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (credential.tenantId && !tenantPattern.test(credential.tenantId) && credential.tenantId !== 'common' && credential.tenantId !== 'organizations') {
      result.warnings.push('Tenant ID format may be invalid');
    }
  }

  private async validateGoogleCredential(credential: GoogleCredential, result: CredentialValidationResult): Promise<void> {
    if (!credential.webClientId) {
      result.errors.push('Web Client ID is required');
    }
    if (Platform.OS === 'ios' && !credential.iosClientId) {
      result.warnings.push('iOS Client ID not configured');
    }
    if (Platform.OS === 'android' && !credential.androidClientId) {
      result.warnings.push('Android Client ID not configured');
    }
    
    // Validate client ID format
    if (credential.webClientId && !credential.webClientId.endsWith('.apps.googleusercontent.com')) {
      result.warnings.push('Web Client ID format may be invalid');
    }
  }

  private async validateAppleCredential(credential: AppleCredential, result: CredentialValidationResult): Promise<void> {
    if (!credential.teamId) {
      result.errors.push('Team ID is required');
    }
    if (!credential.keyId) {
      result.errors.push('Key ID is required');
    }
    if (!credential.privateKey) {
      result.errors.push('Private key is required');
    }
    if (!credential.servicesId) {
      result.errors.push('Services ID is required');
    }
    
    // Validate team ID format (10 characters)
    if (credential.teamId && credential.teamId.length !== 10) {
      result.warnings.push('Team ID should be 10 characters');
    }
  }

  private async validateClarisCredential(credential: ClarisCredential, result: CredentialValidationResult): Promise<void> {
    if (!credential.serverHost) {
      result.errors.push('Server host is required');
    }
    if (!credential.database) {
      result.errors.push('Database name is required');
    }
    if (!credential.sslEnabled) {
      result.warnings.push('SSL is not enabled - not recommended for production');
    }
    
    // Validate server host format
    if (credential.serverHost && !credential.serverHost.match(/^https?:\/\//)) {
      result.warnings.push('Server host should include protocol (https://)');
    }
  }

  async validateAllCredentials(): Promise<CredentialValidationResult[]> {
    const results: CredentialValidationResult[] = [];
    
    for (const provider of this.credentials.keys()) {
      const result = await this.validateCredential(provider);
      results.push(result);
    }
    
    return results;
  }

  // ==========================================
  // Credential Rotation
  // ==========================================

  async setRotationPolicy(policy: CredentialRotationPolicy): Promise<void> {
    this.rotationPolicies.set(policy.provider, policy);
    await this.saveRotationPolicies();
    this.emit('rotation_policy_updated', policy);
  }

  getRotationPolicy(provider: CredentialProvider): CredentialRotationPolicy | null {
    return this.rotationPolicies.get(provider) || null;
  }

  async rotateCredential(provider: CredentialProvider): Promise<void> {
    const credential = this.credentials.get(provider);
    const policy = this.rotationPolicies.get(provider);
    
    if (!credential) {
      throw new Error(`No credential found for ${provider}`);
    }

    // In production, this would generate new secrets
    // For now, we just update the rotation timestamp
    const now = new Date();
    
    if (policy) {
      policy.lastRotated = now.toISOString();
      policy.nextRotation = new Date(now.getTime() + policy.rotationIntervalDays * 24 * 60 * 60 * 1000).toISOString();
      await this.saveRotationPolicies();
    }

    await this.addAuditEntry({
      provider,
      action: 'rotated',
      details: { rotatedAt: now.toISOString() },
    });

    this.emit('credential_rotated', { provider });
  }

  private checkRotationSchedule(): void {
    const now = new Date();
    
    for (const [provider, policy] of this.rotationPolicies) {
      if (policy.nextRotation && new Date(policy.nextRotation) <= now) {
        if (policy.autoRotate) {
          this.rotateCredential(provider).catch(console.error);
        } else {
          this.emit('rotation_due', { provider, policy });
        }
      } else if (policy.nextRotation && policy.notifyBeforeDays > 0) {
        const notifyDate = new Date(new Date(policy.nextRotation).getTime() - policy.notifyBeforeDays * 24 * 60 * 60 * 1000);
        if (notifyDate <= now) {
          this.emit('rotation_upcoming', { provider, policy, daysUntil: Math.ceil((new Date(policy.nextRotation).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) });
        }
      }
    }
  }

  private async loadRotationPolicies(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ROTATION_POLICIES);
      if (stored) {
        const parsed = JSON.parse(stored) as CredentialRotationPolicy[];
        for (const policy of parsed) {
          this.rotationPolicies.set(policy.provider, policy);
        }
      }
    } catch (error) {
      console.error('Failed to load rotation policies:', error);
    }
  }

  private async saveRotationPolicies(): Promise<void> {
    try {
      const policies = Array.from(this.rotationPolicies.values());
      await AsyncStorage.setItem(STORAGE_KEYS.ROTATION_POLICIES, JSON.stringify(policies));
    } catch (error) {
      console.error('Failed to save rotation policies:', error);
    }
  }

  // ==========================================
  // Audit Logging
  // ==========================================

  private async addAuditEntry(entry: Omit<CredentialAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: CredentialAuditEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.auditLog.push(auditEntry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    await this.saveAuditLog();
  }

  private async loadAuditLog(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
      if (stored) {
        this.auditLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
    }
  }

  private async saveAuditLog(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(this.auditLog));
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  getAuditLog(options?: { provider?: CredentialProvider; action?: string; limit?: number }): CredentialAuditEntry[] {
    let entries = [...this.auditLog];
    
    if (options?.provider) {
      entries = entries.filter(e => e.provider === options.provider);
    }
    if (options?.action) {
      entries = entries.filter(e => e.action === options.action);
    }
    
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }
    
    return entries;
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  getDefaultScopes(provider: CredentialProvider): string[] {
    return [...DEFAULT_SCOPES[provider]];
  }

  getProviderEndpoints(provider: CredentialProvider): { auth: string; token: string; api: string } {
    return { ...PROVIDER_ENDPOINTS[provider] };
  }

  createDefaultCredential(provider: CredentialProvider): Partial<ProviderCredential> {
    const now = new Date().toISOString();
    const baseFields = {
      clientId: '',
      redirectUri: 'medivac://oauth/callback',
      scopes: this.getDefaultScopes(provider),
      environment: 'development' as const,
      isValid: false,
      createdAt: now,
      updatedAt: now,
    };

    switch (provider) {
      case 'jeditek':
        return {
          ...baseFields,
          provider: 'jeditek',
          ssoEndpoint: PROVIDER_ENDPOINTS.jeditek.auth,
          apiEndpoint: PROVIDER_ENDPOINTS.jeditek.api,
        } as Partial<JEDITekCredential>;
      case 'azure':
        return {
          ...baseFields,
          provider: 'azure',
          tenantId: 'common',
          authority: 'https://login.microsoftonline.com/common',
          graphEndpoint: PROVIDER_ENDPOINTS.azure.api,
          b2cEnabled: false,
        } as Partial<AzureADCredential>;
      case 'google':
        return {
          ...baseFields,
          provider: 'google',
          webClientId: '',
        } as Partial<GoogleCredential>;
      case 'apple':
        return {
          ...baseFields,
          provider: 'apple',
          teamId: '',
          keyId: '',
          privateKey: '',
          servicesId: '',
        } as Partial<AppleCredential>;
      case 'claris':
        return {
          ...baseFields,
          provider: 'claris',
          serverHost: '',
          database: '',
          clarisIdEnabled: false,
          dataApiVersion: 'v1',
          sslEnabled: true,
        } as Partial<ClarisCredential>;
      default:
        return { ...baseFields, provider } as Partial<ProviderCredential>;
    }
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

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const credentialManager = new CredentialManagementService();

export default CredentialManagementService;
