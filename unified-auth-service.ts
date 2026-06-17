/**
 * MediVac One - Unified Authentication Manager
 * Centralized authentication across all providers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { jediTekSSO, type JEDITekUser, type SSOSession } from './jeditek-sso-service';
import { azureAD, type AzureADUser } from './azure-ad-service';
import { googleOAuth, appleSignIn, type GoogleUser, type AppleUser } from './social-auth-service';
import { clarisConnect, type ClarisUser } from './claris-connect-service';

// ==========================================
// Types
// ==========================================

export type AuthProvider = 'jeditek' | 'azure' | 'google' | 'apple' | 'claris';

export interface UnifiedUser {
  id: string;
  provider: AuthProvider;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  linkedAccounts: LinkedAccount[];
  metadata: Record<string, unknown>;
  lastLogin: string;
  createdAt: string;
}

export interface LinkedAccount {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  linkedAt: string;
}

export interface AuthSession {
  user: UnifiedUser;
  provider: AuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  sessionId: string;
}

export interface ProviderStatus {
  provider: AuthProvider;
  available: boolean;
  authenticated: boolean;
  user?: UnifiedUser;
  lastChecked: string;
}

export interface AuthConfig {
  defaultProvider: AuthProvider;
  allowedProviders: AuthProvider[];
  autoRefresh: boolean;
  sessionTimeout: number;
  requireMFA: boolean;
  allowAccountLinking: boolean;
}

export interface AuthAnalytics {
  totalLogins: number;
  loginsByProvider: Record<AuthProvider, number>;
  failedAttempts: number;
  lastLoginTime?: string;
  averageSessionDuration: number;
  deviceCount: number;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  UNIFIED_SESSION: 'unified_auth_session',
  UNIFIED_USER: 'unified_auth_user',
  LINKED_ACCOUNTS: 'unified_linked_accounts',
  AUTH_CONFIG: 'unified_auth_config',
  AUTH_ANALYTICS: 'unified_auth_analytics',
};

const DEFAULT_CONFIG: AuthConfig = {
  defaultProvider: 'jeditek',
  allowedProviders: ['jeditek', 'azure', 'google', 'apple', 'claris'],
  autoRefresh: true,
  sessionTimeout: 3600,
  requireMFA: false,
  allowAccountLinking: true,
};

const PROVIDER_NAMES: Record<AuthProvider, string> = {
  jeditek: 'JEDITek SSO',
  azure: 'Microsoft 365',
  google: 'Google',
  apple: 'Apple',
  claris: 'Claris Connect',
};

// ==========================================
// Unified Auth Manager
// ==========================================

class UnifiedAuthManager {
  private config: AuthConfig;
  private currentSession: AuthSession | null = null;
  private linkedAccounts: LinkedAccount[] = [];
  private analytics: AuthAnalytics;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.analytics = {
      totalLogins: 0,
      loginsByProvider: { jeditek: 0, azure: 0, google: 0, apple: 0, claris: 0 },
      failedAttempts: 0,
      averageSessionDuration: 0,
      deviceCount: 1,
    };
    this.initializeManager();
  }

  private async initializeManager(): Promise<void> {
    try {
      const [savedSession, savedConfig, savedAnalytics, savedLinked] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.UNIFIED_SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_ANALYTICS),
        AsyncStorage.getItem(STORAGE_KEYS.LINKED_ACCOUNTS),
      ]);

      if (savedConfig) this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      if (savedAnalytics) this.analytics = JSON.parse(savedAnalytics);
      if (savedLinked) this.linkedAccounts = JSON.parse(savedLinked);

      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        if (this.isSessionValid()) {
          this.setupProviderListeners();
          if (this.config.autoRefresh) this.scheduleTokenRefresh();
          this.emit('session_restored', this.currentSession);
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Unified Auth Manager:', error);
    }
  }

  // ==========================================
  // Authentication Methods
  // ==========================================

  async loginWithProvider(provider: AuthProvider, options?: Record<string, unknown>): Promise<AuthSession> {
    if (!this.config.allowedProviders.includes(provider)) {
      throw new Error(`Provider ${provider} is not allowed`);
    }

    try {
      let providerUser: JEDITekUser | AzureADUser | GoogleUser | AppleUser | ClarisUser;
      let accessToken: string;
      let refreshToken: string | undefined;
      let expiresAt: string;

      switch (provider) {
        case 'jeditek': {
          const authUrl = await jediTekSSO.initiateLogin(options as { prompt?: 'login' | 'consent' | 'none'; loginHint?: string });
          // In real app, this would open browser and handle callback
          // For now, simulate successful login
          await new Promise(resolve => setTimeout(resolve, 500));
          providerUser = jediTekSSO.getCurrentUser()!;
          accessToken = jediTekSSO.getAccessToken()!;
          const session = jediTekSSO.getCurrentSession();
          refreshToken = session?.token.refreshToken;
          expiresAt = session?.token.expiresAt || new Date(Date.now() + 3600000).toISOString();
          break;
        }
        case 'azure': {
          await new Promise(resolve => setTimeout(resolve, 500));
          providerUser = azureAD.getCurrentUser()!;
          accessToken = azureAD.getAccessToken()!;
          expiresAt = new Date(Date.now() + 3600000).toISOString();
          break;
        }
        case 'google': {
          await new Promise(resolve => setTimeout(resolve, 500));
          providerUser = googleOAuth.getCurrentUser()!;
          accessToken = googleOAuth.getAccessToken()!;
          expiresAt = new Date(Date.now() + 3600000).toISOString();
          break;
        }
        case 'apple': {
          await new Promise(resolve => setTimeout(resolve, 500));
          providerUser = appleSignIn.getCurrentUser()!;
          accessToken = appleSignIn.getAccessToken()!;
          expiresAt = new Date(Date.now() + 3600000).toISOString();
          break;
        }
        case 'claris': {
          await new Promise(resolve => setTimeout(resolve, 500));
          providerUser = clarisConnect.getCurrentUser()!;
          accessToken = clarisConnect.getAccessToken()!;
          expiresAt = new Date(Date.now() + 900000).toISOString(); // 15 min for FileMaker
          break;
        }
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // Create mock user if provider didn't return one (for demo)
      if (!providerUser) {
        providerUser = this.createMockProviderUser(provider);
        accessToken = `mock_token_${this.generateRandomString(32)}`;
        expiresAt = new Date(Date.now() + 3600000).toISOString();
      }

      const unifiedUser = this.mapToUnifiedUser(provider, providerUser);
      const session = await this.createSession(unifiedUser, provider, accessToken, refreshToken, expiresAt);

      this.updateAnalytics(provider, true);
      this.emit('login_success', { provider, user: unifiedUser });

      return session;
    } catch (error) {
      this.updateAnalytics(provider, false);
      this.emit('login_failed', { provider, error });
      throw error;
    }
  }

  private createMockProviderUser(provider: AuthProvider): JEDITekUser | AzureADUser | GoogleUser | AppleUser | ClarisUser {
    const baseUser = {
      id: `${provider}_${this.generateRandomString(16)}`,
      email: `user@${provider}.example.com`,
    };

    switch (provider) {
      case 'jeditek':
        return {
          ...baseUser,
          username: 'jedi_user',
          displayName: 'JEDI User',
          firstName: 'JEDI',
          lastName: 'User',
          jediRank: 'knight' as const,
          membershipLevel: 'knight' as const,
          permissions: [],
          roles: ['medivac_user'],
          smpoCompliance: { compliant: true, complianceLevel: 'standard' as const, auditStatus: 'passed' as const, requirements: [] },
          mfaEnabled: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        } as JEDITekUser;
      case 'azure':
        return {
          ...baseUser,
          userPrincipalName: 'user@org.onmicrosoft.com',
          displayName: 'Azure User',
          givenName: 'Azure',
          surname: 'User',
          mail: baseUser.email,
          businessPhones: [],
          groups: [],
          roles: [],
        } as AzureADUser;
      case 'google':
        return {
          ...baseUser,
          emailVerified: true,
          name: 'Google User',
          givenName: 'Google',
          familyName: 'User',
        } as GoogleUser;
      case 'apple':
        return {
          ...baseUser,
          realUserStatus: 'likelyReal' as const,
        } as AppleUser;
      case 'claris':
        return {
          ...baseUser,
          accountName: 'claris_user',
          privilegeSet: '[Full Access]',
          extendedPrivileges: ['fmrest'],
        } as ClarisUser;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private mapToUnifiedUser(provider: AuthProvider, providerUser: JEDITekUser | AzureADUser | GoogleUser | AppleUser | ClarisUser): UnifiedUser {
    const now = new Date().toISOString();
    let email = '';
    let displayName = '';
    let firstName: string | undefined;
    let lastName: string | undefined;
    let avatar: string | undefined;
    let roles: string[] = [];
    let permissions: string[] = [];
    const metadata: Record<string, unknown> = { provider };

    switch (provider) {
      case 'jeditek': {
        const user = providerUser as JEDITekUser;
        email = user.email;
        displayName = user.displayName;
        firstName = user.firstName;
        lastName = user.lastName;
        avatar = user.avatar;
        roles = user.roles;
        permissions = user.permissions.map(p => `${p.resource}:${p.actions.join(',')}`);
        metadata.jediRank = user.jediRank;
        metadata.membershipLevel = user.membershipLevel;
        metadata.smpoCompliance = user.smpoCompliance;
        break;
      }
      case 'azure': {
        const user = providerUser as AzureADUser;
        email = user.mail;
        displayName = user.displayName;
        firstName = user.givenName;
        lastName = user.surname;
        avatar = user.photo;
        roles = user.roles.map(r => r.displayName);
        metadata.groups = user.groups.map(g => g.displayName);
        metadata.jobTitle = user.jobTitle;
        metadata.department = user.department;
        break;
      }
      case 'google': {
        const user = providerUser as GoogleUser;
        email = user.email;
        displayName = user.name;
        firstName = user.givenName;
        lastName = user.familyName;
        avatar = user.picture;
        metadata.emailVerified = user.emailVerified;
        metadata.locale = user.locale;
        break;
      }
      case 'apple': {
        const user = providerUser as AppleUser;
        email = user.email || '';
        displayName = user.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : 'Apple User';
        firstName = user.name?.firstName;
        lastName = user.name?.lastName;
        metadata.isPrivateEmail = user.isPrivateEmail;
        metadata.realUserStatus = user.realUserStatus;
        break;
      }
      case 'claris': {
        const user = providerUser as ClarisUser;
        email = `${user.accountName}@claris.local`;
        displayName = user.accountName;
        roles = [user.privilegeSet];
        permissions = user.extendedPrivileges;
        metadata.privilegeSet = user.privilegeSet;
        break;
      }
    }

    return {
      id: `unified_${provider}_${providerUser.id}`,
      provider,
      email,
      displayName,
      firstName,
      lastName,
      avatar,
      roles,
      permissions,
      linkedAccounts: this.linkedAccounts,
      metadata,
      lastLogin: now,
      createdAt: now,
    };
  }

  // ==========================================
  // Session Management
  // ==========================================

  private async createSession(user: UnifiedUser, provider: AuthProvider, accessToken: string, refreshToken: string | undefined, expiresAt: string): Promise<AuthSession> {
    const session: AuthSession = {
      user,
      provider,
      accessToken,
      refreshToken,
      expiresAt,
      sessionId: this.generateRandomString(32),
    };

    this.currentSession = session;
    await this.saveSession();
    this.setupProviderListeners();
    if (this.config.autoRefresh) this.scheduleTokenRefresh();

    return session;
  }

  private async saveSession(): Promise<void> {
    if (this.currentSession) {
      await AsyncStorage.setItem(STORAGE_KEYS.UNIFIED_SESSION, JSON.stringify(this.currentSession));
      await AsyncStorage.setItem(STORAGE_KEYS.UNIFIED_USER, JSON.stringify(this.currentSession.user));
    }
    await AsyncStorage.setItem(STORAGE_KEYS.LINKED_ACCOUNTS, JSON.stringify(this.linkedAccounts));
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_ANALYTICS, JSON.stringify(this.analytics));
  }

  private async clearSession(): Promise<void> {
    this.currentSession = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    await AsyncStorage.multiRemove([STORAGE_KEYS.UNIFIED_SESSION, STORAGE_KEYS.UNIFIED_USER]);
  }

  private isSessionValid(): boolean {
    if (!this.currentSession) return false;
    const expiresAt = new Date(this.currentSession.expiresAt);
    return expiresAt > new Date();
  }

  private scheduleTokenRefresh(): void {
    if (!this.currentSession) return;
    const expiresAt = new Date(this.currentSession.expiresAt);
    const now = new Date();
    const refreshIn = Math.max(0, expiresAt.getTime() - now.getTime() - 5 * 60 * 1000);

    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refreshSession(), refreshIn);
  }

  async refreshSession(): Promise<AuthSession | null> {
    if (!this.currentSession) return null;

    try {
      const provider = this.currentSession.provider;
      let newAccessToken: string | null = null;
      let newExpiresAt: string;

      switch (provider) {
        case 'jeditek':
          await jediTekSSO.refreshToken();
          newAccessToken = jediTekSSO.getAccessToken();
          break;
        case 'azure':
          await azureAD.refreshToken();
          newAccessToken = azureAD.getAccessToken();
          break;
        case 'google':
          await googleOAuth.refreshToken();
          newAccessToken = googleOAuth.getAccessToken();
          break;
        case 'apple':
          await appleSignIn.refreshToken();
          newAccessToken = appleSignIn.getAccessToken();
          break;
        case 'claris':
          await clarisConnect.refreshSession();
          newAccessToken = clarisConnect.getAccessToken();
          break;
      }

      if (!newAccessToken) {
        throw new Error('Failed to refresh token');
      }

      newExpiresAt = new Date(Date.now() + (provider === 'claris' ? 900000 : 3600000)).toISOString();

      this.currentSession = {
        ...this.currentSession,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      };

      await this.saveSession();
      this.scheduleTokenRefresh();
      this.emit('session_refreshed', this.currentSession);

      return this.currentSession;
    } catch (error) {
      this.emit('session_expired', error);
      await this.logout();
      return null;
    }
  }

  // ==========================================
  // Account Linking
  // ==========================================

  async linkAccount(provider: AuthProvider): Promise<LinkedAccount> {
    if (!this.config.allowAccountLinking) {
      throw new Error('Account linking is disabled');
    }

    if (!this.currentSession) {
      throw new Error('Must be logged in to link accounts');
    }

    if (this.linkedAccounts.some(a => a.provider === provider)) {
      throw new Error(`Account already linked with ${PROVIDER_NAMES[provider]}`);
    }

    // Simulate linking process
    await new Promise(resolve => setTimeout(resolve, 500));

    const linkedAccount: LinkedAccount = {
      provider,
      providerId: `${provider}_${this.generateRandomString(16)}`,
      email: `linked@${provider}.example.com`,
      linkedAt: new Date().toISOString(),
    };

    this.linkedAccounts.push(linkedAccount);
    this.currentSession.user.linkedAccounts = this.linkedAccounts;
    await this.saveSession();

    this.emit('account_linked', linkedAccount);
    return linkedAccount;
  }

  async unlinkAccount(provider: AuthProvider): Promise<void> {
    if (provider === this.currentSession?.provider) {
      throw new Error('Cannot unlink the primary authentication provider');
    }

    const index = this.linkedAccounts.findIndex(a => a.provider === provider);
    if (index === -1) {
      throw new Error(`No linked account found for ${PROVIDER_NAMES[provider]}`);
    }

    const unlinked = this.linkedAccounts.splice(index, 1)[0];
    if (this.currentSession) {
      this.currentSession.user.linkedAccounts = this.linkedAccounts;
    }
    await this.saveSession();

    this.emit('account_unlinked', unlinked);
  }

  // ==========================================
  // Logout
  // ==========================================

  async logout(options?: { globalLogout?: boolean; revokeTokens?: boolean }): Promise<void> {
    const provider = this.currentSession?.provider;

    if (provider) {
      try {
        switch (provider) {
          case 'jeditek':
            await jediTekSSO.logout({ globalLogout: options?.globalLogout, revokeTokens: options?.revokeTokens });
            break;
          case 'azure':
            await azureAD.logout();
            break;
          case 'google':
            await googleOAuth.logout();
            break;
          case 'apple':
            await appleSignIn.logout();
            break;
          case 'claris':
            await clarisConnect.logout();
            break;
        }
      } catch (error) {
        console.error('Error during provider logout:', error);
      }
    }

    await this.clearSession();
    this.emit('logout', { provider, globalLogout: options?.globalLogout });
  }

  // ==========================================
  // Provider Status
  // ==========================================

  async getProviderStatus(): Promise<ProviderStatus[]> {
    const now = new Date().toISOString();

    return this.config.allowedProviders.map(provider => ({
      provider,
      available: true,
      authenticated: this.isProviderAuthenticated(provider),
      user: this.currentSession?.provider === provider ? this.currentSession.user : undefined,
      lastChecked: now,
    }));
  }

  private isProviderAuthenticated(provider: AuthProvider): boolean {
    switch (provider) {
      case 'jeditek': return jediTekSSO.isAuthenticated();
      case 'azure': return azureAD.isAuthenticated();
      case 'google': return googleOAuth.isAuthenticated();
      case 'apple': return appleSignIn.isAuthenticated();
      case 'claris': return clarisConnect.isAuthenticated();
      default: return false;
    }
  }

  // ==========================================
  // Analytics
  // ==========================================

  private updateAnalytics(provider: AuthProvider, success: boolean): void {
    if (success) {
      this.analytics.totalLogins++;
      this.analytics.loginsByProvider[provider]++;
      this.analytics.lastLoginTime = new Date().toISOString();
    } else {
      this.analytics.failedAttempts++;
    }
  }

  getAnalytics(): AuthAnalytics {
    return { ...this.analytics };
  }

  // ==========================================
  // Configuration
  // ==========================================

  async updateConfig(newConfig: Partial<AuthConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_CONFIG, JSON.stringify(this.config));
    this.emit('config_updated', this.config);
  }

  getConfig(): AuthConfig {
    return { ...this.config };
  }

  // ==========================================
  // Provider Listeners
  // ==========================================

  private setupProviderListeners(): void {
    const handleSessionExpired = () => {
      this.emit('provider_session_expired', this.currentSession?.provider);
    };

    jediTekSSO.on('session_expired', handleSessionExpired);
    azureAD.on('session_expired', handleSessionExpired);
    googleOAuth.on('session_expired', handleSessionExpired);
    appleSignIn.on('session_expired', handleSessionExpired);
    clarisConnect.on('session_expired', handleSessionExpired);
  }

  // ==========================================
  // Getters
  // ==========================================

  getCurrentUser(): UnifiedUser | null {
    return this.currentSession?.user || null;
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  getAccessToken(): string | null {
    return this.currentSession?.accessToken || null;
  }

  isAuthenticated(): boolean {
    return this.isSessionValid();
  }

  getLinkedAccounts(): LinkedAccount[] {
    return [...this.linkedAccounts];
  }

  getProviderName(provider: AuthProvider): string {
    return PROVIDER_NAMES[provider];
  }

  // ==========================================
  // Event System
  // ==========================================

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const unifiedAuth = new UnifiedAuthManager();

export default UnifiedAuthManager;
