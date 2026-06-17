/**
 * MediVac One - Microsoft 365 Azure AD Authentication Service
 * Enterprise authentication with Azure Active Directory
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface AzureADConfig {
  tenantId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authority: string;
  graphEndpoint: string;
}

export interface AzureADUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones: string[];
  preferredLanguage?: string;
  photo?: string;
  groups: AzureADGroup[];
  roles: AzureADRole[];
}

export interface AzureADGroup {
  id: string;
  displayName: string;
  description?: string;
  groupTypes: string[];
  securityEnabled: boolean;
  mailEnabled: boolean;
}

export interface AzureADRole {
  id: string;
  displayName: string;
  description?: string;
  roleTemplateId: string;
}

export interface AzureADToken {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
  expiresOn: string;
  scope: string;
  extExpiresIn?: number;
}

export interface ConditionalAccessPolicy {
  id: string;
  displayName: string;
  state: 'enabled' | 'disabled' | 'enabledForReportingButNotEnforced';
  conditions: {
    users: { includeUsers: string[]; excludeUsers: string[] };
    applications: { includeApplications: string[] };
    locations?: { includeLocations: string[] };
    platforms?: { includePlatforms: string[] };
  };
  grantControls?: {
    operator: 'AND' | 'OR';
    builtInControls: string[];
  };
}

export interface GraphAPIResponse<T> {
  value: T[];
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
}

export interface TeamsIntegration {
  enabled: boolean;
  chatEnabled: boolean;
  meetingsEnabled: boolean;
  channelId?: string;
  teamId?: string;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  AZURE_TOKEN: 'azure_ad_token',
  AZURE_USER: 'azure_ad_user',
  AZURE_GROUPS: 'azure_ad_groups',
};

const DEFAULT_CONFIG: AzureADConfig = {
  tenantId: 'common',
  clientId: 'medivac-one-azure-client',
  redirectUri: 'medivac://auth/azure/callback',
  scopes: [
    'openid',
    'profile',
    'email',
    'User.Read',
    'User.ReadBasic.All',
    'Group.Read.All',
    'Calendars.ReadWrite',
    'Mail.Read',
    'Files.Read',
    'Team.ReadBasic.All',
  ],
  authority: 'https://login.microsoftonline.com',
  graphEndpoint: 'https://graph.microsoft.com/v1.0',
};

// ==========================================
// Azure AD Service
// ==========================================

class AzureADService {
  private config: AzureADConfig;
  private currentToken: AzureADToken | null = null;
  private currentUser: AzureADUser | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<AzureADConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.AZURE_TOKEN);
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.AZURE_USER);
      
      if (savedToken && savedUser) {
        this.currentToken = JSON.parse(savedToken);
        this.currentUser = JSON.parse(savedUser);
        
        if (this.isTokenValid()) {
          this.scheduleTokenRefresh();
          this.emit('session_restored', { user: this.currentUser, token: this.currentToken });
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Azure AD:', error);
    }
  }

  // ==========================================
  // Authentication Flow
  // ==========================================

  getAuthorizationUrl(options: { prompt?: string; loginHint?: string; domainHint?: string } = {}): string {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // Store for callback validation
    AsyncStorage.setItem('azure_auth_state', JSON.stringify({ state, nonce, codeVerifier }));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_mode: 'query',
      ...(options.prompt && { prompt: options.prompt }),
      ...(options.loginHint && { login_hint: options.loginHint }),
      ...(options.domainHint && { domain_hint: options.domainHint }),
    });

    return `${this.config.authority}/${this.config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async handleCallback(callbackUrl: string): Promise<AzureADUser> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      const errorDescription = url.searchParams.get('error_description') || 'Authentication failed';
      throw new Error(`Azure AD Error: ${error} - ${errorDescription}`);
    }

    if (!code || !state) {
      throw new Error('Invalid callback: missing code or state');
    }

    // Validate state
    const savedStateStr = await AsyncStorage.getItem('azure_auth_state');
    if (!savedStateStr) {
      throw new Error('No pending authentication request');
    }

    const savedState = JSON.parse(savedStateStr);
    if (savedState.state !== state) {
      throw new Error('State mismatch: possible CSRF attack');
    }

    // Exchange code for token
    const token = await this.exchangeCodeForToken(code, savedState.codeVerifier);
    this.currentToken = token;

    // Fetch user profile
    const user = await this.fetchUserProfile();
    this.currentUser = user;

    // Save session
    await this.saveSession();
    await AsyncStorage.removeItem('azure_auth_state');
    this.scheduleTokenRefresh();

    this.emit('login_success', { user, token });
    return user;
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<AzureADToken> {
    // Simulate token exchange
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const expiresIn = 3600;

    return {
      accessToken: `azure_access_${this.generateRandomString(32)}`,
      refreshToken: `azure_refresh_${this.generateRandomString(32)}`,
      idToken: `azure_id_${this.generateRandomString(64)}`,
      tokenType: 'Bearer',
      expiresIn,
      expiresOn: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      scope: this.config.scopes.join(' '),
      extExpiresIn: expiresIn + 3600,
    };
  }

  // ==========================================
  // Microsoft Graph API
  // ==========================================

  private async fetchUserProfile(): Promise<AzureADUser> {
    // Simulate Graph API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const groups = await this.fetchUserGroups();
    const roles = await this.fetchUserRoles();

    return {
      id: `azure_${this.generateRandomString(16)}`,
      userPrincipalName: 'user@organization.onmicrosoft.com',
      displayName: 'Azure User',
      givenName: 'Azure',
      surname: 'User',
      mail: 'user@organization.com',
      jobTitle: 'Clinical Staff',
      department: 'Healthcare',
      officeLocation: 'Main Hospital',
      mobilePhone: '+61 400 000 000',
      businessPhones: ['+61 2 0000 0000'],
      preferredLanguage: 'en-AU',
      groups,
      roles,
    };
  }

  private async fetchUserGroups(): Promise<AzureADGroup[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        id: 'group_001',
        displayName: 'MediVac Clinical Staff',
        description: 'Clinical staff with patient access',
        groupTypes: ['Unified'],
        securityEnabled: true,
        mailEnabled: true,
      },
      {
        id: 'group_002',
        displayName: 'Healthcare Professionals',
        description: 'All healthcare professionals',
        groupTypes: ['Unified'],
        securityEnabled: true,
        mailEnabled: true,
      },
      {
        id: 'group_003',
        displayName: 'MediVac App Users',
        description: 'Users with MediVac One access',
        groupTypes: [],
        securityEnabled: true,
        mailEnabled: false,
      },
    ];
  }

  private async fetchUserRoles(): Promise<AzureADRole[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        id: 'role_001',
        displayName: 'Application User',
        description: 'Standard application user role',
        roleTemplateId: 'app_user_template',
      },
      {
        id: 'role_002',
        displayName: 'Clinical Data Reader',
        description: 'Can read clinical data',
        roleTemplateId: 'clinical_reader_template',
      },
    ];
  }

  async fetchCalendarEvents(startDate: Date, endDate: Date): Promise<unknown[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'event_001',
        subject: 'Patient Consultation',
        start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
        end: { dateTime: new Date(startDate.getTime() + 30 * 60 * 1000).toISOString(), timeZone: 'Australia/Sydney' },
        location: { displayName: 'Room 101' },
        attendees: [{ emailAddress: { address: 'patient@example.com' } }],
      },
      {
        id: 'event_002',
        subject: 'Team Meeting',
        start: { dateTime: new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), timeZone: 'Australia/Sydney' },
        end: { dateTime: new Date(startDate.getTime() + 3 * 60 * 60 * 1000).toISOString(), timeZone: 'Australia/Sydney' },
        location: { displayName: 'Conference Room A' },
        isOnlineMeeting: true,
      },
    ];
  }

  async fetchEmails(count: number = 10): Promise<unknown[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return Array.from({ length: count }, (_, i) => ({
      id: `mail_${i}`,
      subject: `Email Subject ${i + 1}`,
      from: { emailAddress: { address: `sender${i}@example.com`, name: `Sender ${i}` } },
      receivedDateTime: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      isRead: i > 2,
      importance: i === 0 ? 'high' : 'normal',
      bodyPreview: `This is the preview of email ${i + 1}...`,
    }));
  }

  async fetchOneDriveFiles(folderId?: string): Promise<unknown[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      { id: 'file_001', name: 'Patient Report.docx', size: 25600, lastModifiedDateTime: new Date().toISOString(), webUrl: 'https://onedrive.com/file1' },
      { id: 'file_002', name: 'Lab Results.xlsx', size: 15360, lastModifiedDateTime: new Date().toISOString(), webUrl: 'https://onedrive.com/file2' },
      { id: 'folder_001', name: 'Medical Records', folder: { childCount: 5 }, lastModifiedDateTime: new Date().toISOString() },
    ];
  }

  // ==========================================
  // Teams Integration
  // ==========================================

  async getTeamsIntegration(): Promise<TeamsIntegration> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      enabled: true,
      chatEnabled: true,
      meetingsEnabled: true,
      teamId: 'team_medivac_001',
      channelId: 'channel_general_001',
    };
  }

  async createTeamsMeeting(subject: string, startTime: Date, duration: number): Promise<{ joinUrl: string; meetingId: string }> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      meetingId: `meeting_${this.generateRandomString(16)}`,
      joinUrl: `https://teams.microsoft.com/l/meetup-join/${this.generateRandomString(32)}`,
    };
  }

  async sendTeamsMessage(channelId: string, message: string): Promise<{ messageId: string }> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      messageId: `msg_${this.generateRandomString(16)}`,
    };
  }

  // ==========================================
  // Conditional Access
  // ==========================================

  async getConditionalAccessPolicies(): Promise<ConditionalAccessPolicy[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'policy_001',
        displayName: 'Require MFA for MediVac',
        state: 'enabled',
        conditions: {
          users: { includeUsers: ['All'], excludeUsers: [] },
          applications: { includeApplications: ['medivac-one-app'] },
        },
        grantControls: {
          operator: 'OR',
          builtInControls: ['mfa'],
        },
      },
      {
        id: 'policy_002',
        displayName: 'Block legacy authentication',
        state: 'enabled',
        conditions: {
          users: { includeUsers: ['All'], excludeUsers: [] },
          applications: { includeApplications: ['All'] },
        },
        grantControls: {
          operator: 'AND',
          builtInControls: ['block'],
        },
      },
    ];
  }

  // ==========================================
  // Session Management
  // ==========================================

  private async saveSession(): Promise<void> {
    if (this.currentToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.AZURE_TOKEN, JSON.stringify(this.currentToken));
    }
    if (this.currentUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.AZURE_USER, JSON.stringify(this.currentUser));
      await AsyncStorage.setItem(STORAGE_KEYS.AZURE_GROUPS, JSON.stringify(this.currentUser.groups));
    }
  }

  private async clearSession(): Promise<void> {
    this.currentToken = null;
    this.currentUser = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AZURE_TOKEN,
      STORAGE_KEYS.AZURE_USER,
      STORAGE_KEYS.AZURE_GROUPS,
    ]);
  }

  private isTokenValid(): boolean {
    if (!this.currentToken) return false;
    const expiresOn = new Date(this.currentToken.expiresOn);
    return expiresOn > new Date();
  }

  private scheduleTokenRefresh(): void {
    if (!this.currentToken) return;

    const expiresOn = new Date(this.currentToken.expiresOn);
    const now = new Date();
    const refreshIn = Math.max(0, expiresOn.getTime() - now.getTime() - 5 * 60 * 1000);

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshIn);
  }

  async refreshToken(): Promise<AzureADToken | null> {
    if (!this.currentToken?.refreshToken) {
      this.emit('session_expired', null);
      await this.clearSession();
      return null;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const now = new Date();
      const expiresIn = 3600;

      const newToken: AzureADToken = {
        ...this.currentToken,
        accessToken: `azure_access_${this.generateRandomString(32)}`,
        expiresIn,
        expiresOn: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      };

      this.currentToken = newToken;
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

  async logout(): Promise<void> {
    await this.clearSession();
    this.emit('logout', null);
  }

  getLogoutUrl(postLogoutRedirectUri?: string): string {
    const params = new URLSearchParams({
      ...(postLogoutRedirectUri && { post_logout_redirect_uri: postLogoutRedirectUri }),
    });
    return `${this.config.authority}/${this.config.tenantId}/oauth2/v2.0/logout?${params.toString()}`;
  }

  // ==========================================
  // Group-Based Access Control
  // ==========================================

  isInGroup(groupName: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.groups.some(g => g.displayName === groupName);
  }

  hasRole(roleName: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.roles.some(r => r.displayName === roleName);
  }

  // ==========================================
  // Getters
  // ==========================================

  getCurrentUser(): AzureADUser | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.currentToken?.accessToken || null;
  }

  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  getConfig(): AzureADConfig {
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

  private generateCodeChallenge(verifier: string): string {
    return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const azureAD = new AzureADService();

export default AzureADService;
