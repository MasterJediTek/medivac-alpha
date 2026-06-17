/**
 * MediVac One - JEDITek SSO Service
 * Single Sign-On integration with SMPO.ink compliance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface JEDITekUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  jediRank: JEDIRank;
  membershipLevel: JEDIMembershipLevel;
  permissions: JEDIPermission[];
  roles: string[];
  organization?: string;
  department?: string;
  smpoCompliance: SMPOComplianceStatus;
  mfaEnabled: boolean;
  lastLogin: string;
  createdAt: string;
}

export type JEDIRank = 
  | 'youngling'
  | 'padawan'
  | 'knight'
  | 'master'
  | 'council_member'
  | 'grand_master'
  | 'supreme_commander';

export type JEDIMembershipLevel =
  | 'initiate'
  | 'apprentice'
  | 'knight'
  | 'master'
  | 'council'
  | 'supreme';

export interface JEDIPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
  scope: 'own' | 'department' | 'organization' | 'global';
}

export interface SMPOComplianceStatus {
  compliant: boolean;
  certificationDate?: string;
  expiryDate?: string;
  complianceLevel: 'basic' | 'standard' | 'advanced' | 'enterprise';
  auditStatus: 'pending' | 'passed' | 'failed' | 'exempt';
  requirements: SMPORequirement[];
}

export interface SMPORequirement {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  lastChecked: string;
}

export interface SSOConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  logoutEndpoint: string;
  scopes: string[];
  responseType: 'code' | 'token';
  pkceEnabled: boolean;
}

export interface SSOToken {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  scope: string;
}

export interface SSOSession {
  user: JEDITekUser;
  token: SSOToken;
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web' | 'desktop';
  deviceId: string;
  deviceName: string;
  osVersion: string;
  appVersion: string;
}

export interface MFAChallenge {
  challengeId: string;
  method: 'totp' | 'sms' | 'email' | 'push' | 'biometric';
  destination?: string;
  expiresAt: string;
}

export interface AuthorizationRequest {
  state: string;
  codeVerifier?: string;
  codeChallenge?: string;
  nonce: string;
  redirectUri: string;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  SESSION: 'jeditek_sso_session',
  TOKEN: 'jeditek_sso_token',
  USER: 'jeditek_sso_user',
  PENDING_AUTH: 'jeditek_pending_auth',
  DEVICE_ID: 'jeditek_device_id',
};

const DEFAULT_CONFIG: SSOConfig = {
  clientId: 'medivac-one-app',
  redirectUri: 'medivac://auth/callback',
  authorizationEndpoint: 'https://sso.jeditek.com.au/oauth/authorize',
  tokenEndpoint: 'https://sso.jeditek.com.au/oauth/token',
  userInfoEndpoint: 'https://sso.jeditek.com.au/api/userinfo',
  logoutEndpoint: 'https://sso.jeditek.com.au/oauth/logout',
  scopes: ['openid', 'profile', 'email', 'jedi_rank', 'smpo_compliance', 'permissions'],
  responseType: 'code',
  pkceEnabled: true,
};

const SMPO_REQUIREMENTS: SMPORequirement[] = [
  { id: 'smpo_001', name: 'Data Encryption', description: 'All data must be encrypted at rest and in transit', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_002', name: 'Access Control', description: 'Role-based access control must be implemented', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_003', name: 'Audit Logging', description: 'All access must be logged and auditable', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_004', name: 'Session Management', description: 'Sessions must timeout after inactivity', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_005', name: 'MFA Support', description: 'Multi-factor authentication must be available', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_006', name: 'Password Policy', description: 'Strong password requirements must be enforced', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_007', name: 'Data Retention', description: 'Data retention policies must be implemented', status: 'met', lastChecked: new Date().toISOString() },
  { id: 'smpo_008', name: 'Privacy Compliance', description: 'Australian Privacy Act compliance required', status: 'met', lastChecked: new Date().toISOString() },
];

// ==========================================
// JEDITek SSO Service
// ==========================================

class JEDITekSSOService {
  private config: SSOConfig;
  private currentSession: SSOSession | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<SSOConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const savedSession = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        if (this.currentSession && this.isSessionValid()) {
          this.scheduleTokenRefresh();
          this.emit('session_restored', this.currentSession);
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize JEDITek SSO:', error);
    }
  }

  // ==========================================
  // Authentication Flow
  // ==========================================

  async initiateLogin(options: { prompt?: 'login' | 'consent' | 'none'; loginHint?: string } = {}): Promise<string> {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);
    
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (this.config.pkceEnabled) {
      codeVerifier = this.generateRandomString(64);
      codeChallenge = await this.generateCodeChallenge(codeVerifier);
    }

    const authRequest: AuthorizationRequest = {
      state,
      codeVerifier,
      codeChallenge,
      nonce,
      redirectUri: this.config.redirectUri,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_AUTH, JSON.stringify(authRequest));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: this.config.responseType,
      scope: this.config.scopes.join(' '),
      state,
      nonce,
      ...(codeChallenge && { code_challenge: codeChallenge, code_challenge_method: 'S256' }),
      ...(options.prompt && { prompt: options.prompt }),
      ...(options.loginHint && { login_hint: options.loginHint }),
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  async handleCallback(callbackUrl: string): Promise<SSOSession> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      const errorDescription = url.searchParams.get('error_description') || 'Authentication failed';
      throw new Error(`SSO Error: ${error} - ${errorDescription}`);
    }

    if (!code || !state) {
      throw new Error('Invalid callback: missing code or state');
    }

    const pendingAuthStr = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_AUTH);
    if (!pendingAuthStr) {
      throw new Error('No pending authentication request');
    }

    const pendingAuth: AuthorizationRequest = JSON.parse(pendingAuthStr);
    if (pendingAuth.state !== state) {
      throw new Error('State mismatch: possible CSRF attack');
    }

    const token = await this.exchangeCodeForToken(code, pendingAuth.codeVerifier);
    const user = await this.fetchUserInfo(token.accessToken);
    
    const session = await this.createSession(user, token);
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_AUTH);

    this.emit('login_success', session);
    return session;
  }

  private async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<SSOToken> {
    // Simulate token exchange
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const expiresIn = 3600; // 1 hour

    return {
      accessToken: `jedi_access_${this.generateRandomString(32)}`,
      refreshToken: `jedi_refresh_${this.generateRandomString(32)}`,
      idToken: `jedi_id_${this.generateRandomString(64)}`,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      scope: this.config.scopes.join(' '),
    };
  }

  private async fetchUserInfo(accessToken: string): Promise<JEDITekUser> {
    // Simulate user info fetch
    await new Promise(resolve => setTimeout(resolve, 300));

    const ranks: JEDIRank[] = ['youngling', 'padawan', 'knight', 'master', 'council_member', 'grand_master'];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];

    return {
      id: `jedi_${this.generateRandomString(16)}`,
      username: 'jedi_user',
      email: 'user@jeditek.com.au',
      displayName: 'JEDI User',
      firstName: 'JEDI',
      lastName: 'User',
      jediRank: randomRank,
      membershipLevel: this.getMembershipFromRank(randomRank),
      permissions: this.getDefaultPermissions(randomRank),
      roles: ['medivac_user', 'clinical_staff'],
      organization: 'JEDITek Healthcare',
      department: 'Clinical Operations',
      smpoCompliance: {
        compliant: true,
        certificationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
        complianceLevel: 'enterprise',
        auditStatus: 'passed',
        requirements: SMPO_REQUIREMENTS,
      },
      mfaEnabled: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private getMembershipFromRank(rank: JEDIRank): JEDIMembershipLevel {
    const mapping: Record<JEDIRank, JEDIMembershipLevel> = {
      youngling: 'initiate',
      padawan: 'apprentice',
      knight: 'knight',
      master: 'master',
      council_member: 'council',
      grand_master: 'supreme',
      supreme_commander: 'supreme',
    };
    return mapping[rank];
  }

  private getDefaultPermissions(rank: JEDIRank): JEDIPermission[] {
    const basePermissions: JEDIPermission[] = [
      { resource: 'patients', actions: ['read'], scope: 'own' },
      { resource: 'appointments', actions: ['read', 'write'], scope: 'own' },
      { resource: 'messages', actions: ['read', 'write'], scope: 'own' },
    ];

    if (['knight', 'master', 'council_member', 'grand_master', 'supreme_commander'].includes(rank)) {
      basePermissions.push(
        { resource: 'patients', actions: ['read', 'write'], scope: 'department' },
        { resource: 'clinical_records', actions: ['read', 'write'], scope: 'department' },
        { resource: 'medications', actions: ['read', 'write'], scope: 'department' },
      );
    }

    if (['master', 'council_member', 'grand_master', 'supreme_commander'].includes(rank)) {
      basePermissions.push(
        { resource: 'staff', actions: ['read', 'write'], scope: 'department' },
        { resource: 'reports', actions: ['read', 'write', 'delete'], scope: 'organization' },
        { resource: 'audit_logs', actions: ['read'], scope: 'organization' },
      );
    }

    if (['council_member', 'grand_master', 'supreme_commander'].includes(rank)) {
      basePermissions.push(
        { resource: 'users', actions: ['read', 'write', 'admin'], scope: 'organization' },
        { resource: 'settings', actions: ['read', 'write', 'admin'], scope: 'organization' },
        { resource: 'integrations', actions: ['read', 'write', 'admin'], scope: 'global' },
      );
    }

    if (['grand_master', 'supreme_commander'].includes(rank)) {
      basePermissions.push(
        { resource: '*', actions: ['read', 'write', 'delete', 'admin'], scope: 'global' },
      );
    }

    return basePermissions;
  }

  // ==========================================
  // Session Management
  // ==========================================

  private async createSession(user: JEDITekUser, token: SSOToken): Promise<SSOSession> {
    const deviceId = await this.getOrCreateDeviceId();
    
    const session: SSOSession = {
      user,
      token,
      sessionId: this.generateRandomString(32),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      deviceInfo: {
        platform: 'web',
        deviceId,
        deviceName: 'MediVac One App',
        osVersion: '1.0.0',
        appVersion: '4.6.0',
      },
    };

    this.currentSession = session;
    await this.saveSession();
    this.scheduleTokenRefresh();

    return session;
  }

  private async saveSession(): Promise<void> {
    if (this.currentSession) {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.currentSession));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(this.currentSession.token));
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentSession.user));
    }
  }

  private async clearSession(): Promise<void> {
    this.currentSession = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
    ]);
  }

  private isSessionValid(): boolean {
    if (!this.currentSession) return false;
    const expiresAt = new Date(this.currentSession.token.expiresAt);
    return expiresAt > new Date();
  }

  private scheduleTokenRefresh(): void {
    if (!this.currentSession) return;

    const expiresAt = new Date(this.currentSession.token.expiresAt);
    const now = new Date();
    const refreshIn = Math.max(0, expiresAt.getTime() - now.getTime() - 5 * 60 * 1000); // 5 minutes before expiry

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshIn);
  }

  async refreshToken(): Promise<SSOToken | null> {
    if (!this.currentSession?.token.refreshToken) {
      this.emit('session_expired', null);
      await this.clearSession();
      return null;
    }

    try {
      // Simulate token refresh
      await new Promise(resolve => setTimeout(resolve, 300));

      const now = new Date();
      const expiresIn = 3600;

      const newToken: SSOToken = {
        ...this.currentSession.token,
        accessToken: `jedi_access_${this.generateRandomString(32)}`,
        expiresIn,
        expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      };

      this.currentSession.token = newToken;
      this.currentSession.lastActivity = now.toISOString();
      await this.saveSession();
      this.scheduleTokenRefresh();

      this.emit('token_refreshed', newToken);
      return newToken;
    } catch (error) {
      this.emit('refresh_failed', error);
      await this.clearSession();
      return null;
    }
  }

  // ==========================================
  // MFA Support
  // ==========================================

  async initiateMFA(method: MFAChallenge['method']): Promise<MFAChallenge> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const challenge: MFAChallenge = {
      challengeId: this.generateRandomString(32),
      method,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    if (method === 'sms' || method === 'email') {
      challenge.destination = method === 'sms' ? '****1234' : 'u***@jeditek.com.au';
    }

    this.emit('mfa_challenge', challenge);
    return challenge;
  }

  async verifyMFA(challengeId: string, code: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate MFA verification (accept any 6-digit code)
    const isValid = /^\d{6}$/.test(code);
    
    if (isValid) {
      this.emit('mfa_verified', { challengeId });
    } else {
      this.emit('mfa_failed', { challengeId, reason: 'Invalid code' });
    }

    return isValid;
  }

  // ==========================================
  // Logout
  // ==========================================

  async logout(options: { revokeTokens?: boolean; globalLogout?: boolean } = {}): Promise<void> {
    const session = this.currentSession;
    
    if (options.revokeTokens && session?.token.accessToken) {
      // Simulate token revocation
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await this.clearSession();
    this.emit('logout', { globalLogout: options.globalLogout });
  }

  getLogoutUrl(postLogoutRedirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      ...(postLogoutRedirectUri && { post_logout_redirect_uri: postLogoutRedirectUri }),
    });
    return `${this.config.logoutEndpoint}?${params.toString()}`;
  }

  // ==========================================
  // SMPO Compliance
  // ==========================================

  async checkSMPOCompliance(): Promise<SMPOComplianceStatus> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    // Simulate compliance check
    await new Promise(resolve => setTimeout(resolve, 500));

    const compliance = this.currentSession.user.smpoCompliance;
    
    // Update last checked timestamps
    compliance.requirements = compliance.requirements.map(req => ({
      ...req,
      lastChecked: new Date().toISOString(),
    }));

    this.emit('compliance_checked', compliance);
    return compliance;
  }

  async requestComplianceAudit(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    
    const auditId = `audit_${this.generateRandomString(16)}`;
    this.emit('audit_requested', { auditId });
    
    return auditId;
  }

  // ==========================================
  // Permission Checking
  // ==========================================

  hasPermission(resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean {
    if (!this.currentSession) return false;

    const permissions = this.currentSession.user.permissions;
    
    return permissions.some(perm => {
      const resourceMatch = perm.resource === '*' || perm.resource === resource;
      const actionMatch = perm.actions.includes(action) || perm.actions.includes('admin');
      return resourceMatch && actionMatch;
    });
  }

  hasRole(role: string): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.user.roles.includes(role);
  }

  hasMinimumRank(minimumRank: JEDIRank): boolean {
    if (!this.currentSession) return false;

    const rankOrder: JEDIRank[] = [
      'youngling', 'padawan', 'knight', 'master', 
      'council_member', 'grand_master', 'supreme_commander'
    ];

    const userRankIndex = rankOrder.indexOf(this.currentSession.user.jediRank);
    const minimumRankIndex = rankOrder.indexOf(minimumRank);

    return userRankIndex >= minimumRankIndex;
  }

  // ==========================================
  // Getters
  // ==========================================

  getCurrentUser(): JEDITekUser | null {
    return this.currentSession?.user || null;
  }

  getCurrentSession(): SSOSession | null {
    return this.currentSession;
  }

  getAccessToken(): string | null {
    return this.currentSession?.token.accessToken || null;
  }

  isAuthenticated(): boolean {
    return this.isSessionValid();
  }

  getConfig(): SSOConfig {
    return { ...this.config };
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

  // ==========================================
  // Utilities
  // ==========================================

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    // Simple base64url encoding for demo (in production, use SHA-256)
    return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `device_${this.generateRandomString(32)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const jediTekSSO = new JEDITekSSOService();

export default JEDITekSSOService;
