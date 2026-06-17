/**
 * MediVac One - Social Authentication Service
 * Google OAuth and Apple Sign-In integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types - Google OAuth
// ==========================================

export interface GoogleConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  discoveryDocument: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  givenName: string;
  familyName: string;
  picture?: string;
  locale?: string;
  hd?: string; // Hosted domain for Google Workspace
}

export interface GoogleToken {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  scope: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
  attendees?: { email: string; responseStatus: string }[];
  hangoutLink?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  parents?: string[];
}

export interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: { displayName: string; givenName: string; familyName: string }[];
  emailAddresses?: { value: string; type: string }[];
  phoneNumbers?: { value: string; type: string }[];
  organizations?: { name: string; title: string }[];
}

// ==========================================
// Types - Apple Sign-In
// ==========================================

export interface AppleConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  responseMode: 'query' | 'fragment' | 'form_post';
}

export interface AppleUser {
  id: string;
  email?: string;
  emailVerified?: boolean;
  isPrivateEmail?: boolean;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  realUserStatus: 'unsupported' | 'unknown' | 'likelyReal';
}

export interface AppleToken {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
}

export interface AppleCredential {
  user: string;
  email?: string;
  fullName?: {
    givenName?: string;
    familyName?: string;
  };
  identityToken: string;
  authorizationCode: string;
  realUserStatus: number;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  GOOGLE_TOKEN: 'google_oauth_token',
  GOOGLE_USER: 'google_oauth_user',
  APPLE_TOKEN: 'apple_signin_token',
  APPLE_USER: 'apple_signin_user',
};

const DEFAULT_GOOGLE_CONFIG: GoogleConfig = {
  clientId: 'medivac-one-google-client.apps.googleusercontent.com',
  redirectUri: 'medivac://auth/google/callback',
  scopes: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/contacts.readonly',
  ],
  discoveryDocument: 'https://accounts.google.com/.well-known/openid-configuration',
};

const DEFAULT_APPLE_CONFIG: AppleConfig = {
  clientId: 'com.medivac.one.app',
  redirectUri: 'medivac://auth/apple/callback',
  scopes: ['name', 'email'],
  responseMode: 'form_post',
};

// ==========================================
// Google OAuth Service
// ==========================================

class GoogleOAuthService {
  private config: GoogleConfig;
  private currentToken: GoogleToken | null = null;
  private currentUser: GoogleUser | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<GoogleConfig> = {}) {
    this.config = { ...DEFAULT_GOOGLE_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_TOKEN);
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
      
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
      console.error('Failed to initialize Google OAuth:', error);
    }
  }

  getAuthorizationUrl(options: { prompt?: string; loginHint?: string; hostedDomain?: string } = {}): string {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    AsyncStorage.setItem('google_auth_state', JSON.stringify({ state, nonce, codeVerifier }));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      include_granted_scopes: 'true',
      ...(options.prompt && { prompt: options.prompt }),
      ...(options.loginHint && { login_hint: options.loginHint }),
      ...(options.hostedDomain && { hd: options.hostedDomain }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(callbackUrl: string): Promise<GoogleUser> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`Google OAuth Error: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Invalid callback: missing code or state');
    }

    const savedStateStr = await AsyncStorage.getItem('google_auth_state');
    if (!savedStateStr) {
      throw new Error('No pending authentication request');
    }

    const savedState = JSON.parse(savedStateStr);
    if (savedState.state !== state) {
      throw new Error('State mismatch');
    }

    const token = await this.exchangeCodeForToken(code, savedState.codeVerifier);
    this.currentToken = token;

    const user = await this.fetchUserProfile();
    this.currentUser = user;

    await this.saveSession();
    await AsyncStorage.removeItem('google_auth_state');
    this.scheduleTokenRefresh();

    this.emit('login_success', { user, token });
    return user;
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<GoogleToken> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const expiresIn = 3600;

    return {
      accessToken: `google_access_${this.generateRandomString(32)}`,
      refreshToken: `google_refresh_${this.generateRandomString(32)}`,
      idToken: `google_id_${this.generateRandomString(64)}`,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      scope: this.config.scopes.join(' '),
    };
  }

  private async fetchUserProfile(): Promise<GoogleUser> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `google_${this.generateRandomString(16)}`,
      email: 'user@gmail.com',
      emailVerified: true,
      name: 'Google User',
      givenName: 'Google',
      familyName: 'User',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      locale: 'en-AU',
    };
  }

  // Google Calendar Integration
  async fetchCalendarEvents(calendarId: string = 'primary', startDate: Date, endDate: Date): Promise<GoogleCalendarEvent[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'gcal_001',
        summary: 'Medical Appointment',
        description: 'Regular checkup',
        start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
        end: { dateTime: new Date(startDate.getTime() + 30 * 60 * 1000).toISOString(), timeZone: 'Australia/Sydney' },
        location: 'MediVac One Clinic',
        attendees: [{ email: 'patient@example.com', responseStatus: 'accepted' }],
      },
      {
        id: 'gcal_002',
        summary: 'Team Sync',
        start: { dateTime: new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), timeZone: 'Australia/Sydney' },
        end: { dateTime: new Date(startDate.getTime() + 3 * 60 * 60 * 1000).toISOString(), timeZone: 'Australia/Sydney' },
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      },
    ];
  }

  // Google Drive Integration
  async fetchDriveFiles(folderId?: string): Promise<GoogleDriveFile[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      { id: 'gdrive_001', name: 'Patient Notes.docx', mimeType: 'application/vnd.google-apps.document', size: '25600', modifiedTime: new Date().toISOString(), webViewLink: 'https://docs.google.com/document/d/1' },
      { id: 'gdrive_002', name: 'Lab Results.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet', size: '15360', modifiedTime: new Date().toISOString(), webViewLink: 'https://docs.google.com/spreadsheets/d/1' },
      { id: 'gdrive_003', name: 'Medical Records', mimeType: 'application/vnd.google-apps.folder', modifiedTime: new Date().toISOString() },
    ];
  }

  // Google Contacts Integration
  async fetchContacts(pageSize: number = 50): Promise<GoogleContact[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        resourceName: 'people/c001',
        etag: 'etag001',
        names: [{ displayName: 'Dr. Smith', givenName: 'John', familyName: 'Smith' }],
        emailAddresses: [{ value: 'dr.smith@hospital.com', type: 'work' }],
        phoneNumbers: [{ value: '+61 400 000 001', type: 'mobile' }],
        organizations: [{ name: 'MediVac Hospital', title: 'Physician' }],
      },
      {
        resourceName: 'people/c002',
        etag: 'etag002',
        names: [{ displayName: 'Nurse Johnson', givenName: 'Sarah', familyName: 'Johnson' }],
        emailAddresses: [{ value: 'sarah.j@hospital.com', type: 'work' }],
        phoneNumbers: [{ value: '+61 400 000 002', type: 'mobile' }],
        organizations: [{ name: 'MediVac Hospital', title: 'Registered Nurse' }],
      },
    ];
  }

  // Google Meet Integration
  async createMeetLink(): Promise<{ meetingId: string; meetLink: string }> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 400));

    const meetingId = this.generateRandomString(10);
    return {
      meetingId,
      meetLink: `https://meet.google.com/${meetingId.slice(0, 3)}-${meetingId.slice(3, 7)}-${meetingId.slice(7)}`,
    };
  }

  private async saveSession(): Promise<void> {
    if (this.currentToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_TOKEN, JSON.stringify(this.currentToken));
    }
    if (this.currentUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(this.currentUser));
    }
  }

  private async clearSession(): Promise<void> {
    this.currentToken = null;
    this.currentUser = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    await AsyncStorage.multiRemove([STORAGE_KEYS.GOOGLE_TOKEN, STORAGE_KEYS.GOOGLE_USER]);
  }

  private isTokenValid(): boolean {
    if (!this.currentToken) return false;
    const expiresAt = new Date(this.currentToken.expiresAt);
    return expiresAt > new Date();
  }

  private scheduleTokenRefresh(): void {
    if (!this.currentToken) return;
    const expiresAt = new Date(this.currentToken.expiresAt);
    const now = new Date();
    const refreshIn = Math.max(0, expiresAt.getTime() - now.getTime() - 5 * 60 * 1000);

    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refreshToken(), refreshIn);
  }

  async refreshToken(): Promise<GoogleToken | null> {
    if (!this.currentToken?.refreshToken) {
      this.emit('session_expired', null);
      await this.clearSession();
      return null;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const now = new Date();
      const expiresIn = 3600;

      const newToken: GoogleToken = {
        ...this.currentToken,
        accessToken: `google_access_${this.generateRandomString(32)}`,
        expiresIn,
        expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
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

  getCurrentUser(): GoogleUser | null { return this.currentUser; }
  getAccessToken(): string | null { return this.currentToken?.accessToken || null; }
  isAuthenticated(): boolean { return this.isTokenValid(); }

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

  private generateCodeChallenge(verifier: string): string {
    return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

// ==========================================
// Apple Sign-In Service
// ==========================================

class AppleSignInService {
  private config: AppleConfig;
  private currentToken: AppleToken | null = null;
  private currentUser: AppleUser | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<AppleConfig> = {}) {
    this.config = { ...DEFAULT_APPLE_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.APPLE_TOKEN);
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.APPLE_USER);
      
      if (savedToken && savedUser) {
        this.currentToken = JSON.parse(savedToken);
        this.currentUser = JSON.parse(savedUser);
        
        if (this.isTokenValid()) {
          this.emit('session_restored', { user: this.currentUser, token: this.currentToken });
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Apple Sign-In:', error);
    }
  }

  getAuthorizationUrl(): string {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);

    AsyncStorage.setItem('apple_auth_state', JSON.stringify({ state, nonce }));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code id_token',
      scope: this.config.scopes.join(' '),
      response_mode: this.config.responseMode,
      state,
      nonce,
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async handleCallback(callbackData: { code: string; idToken: string; user?: string; state: string }): Promise<AppleUser> {
    const { code, idToken, user: userJson, state } = callbackData;

    const savedStateStr = await AsyncStorage.getItem('apple_auth_state');
    if (!savedStateStr) {
      throw new Error('No pending authentication request');
    }

    const savedState = JSON.parse(savedStateStr);
    if (savedState.state !== state) {
      throw new Error('State mismatch');
    }

    const token = await this.exchangeCodeForToken(code);
    this.currentToken = token;

    // Parse user info from first sign-in (Apple only sends this once)
    let userData: { firstName?: string; lastName?: string; email?: string } | undefined;
    if (userJson) {
      try {
        userData = JSON.parse(userJson);
      } catch {
        // User data parsing failed
      }
    }

    const user = await this.parseIdToken(idToken, userData);
    this.currentUser = user;

    await this.saveSession();
    await AsyncStorage.removeItem('apple_auth_state');

    this.emit('login_success', { user, token });
    return user;
  }

  async handleNativeSignIn(credential: AppleCredential): Promise<AppleUser> {
    const token = await this.exchangeCodeForToken(credential.authorizationCode);
    this.currentToken = token;

    const user: AppleUser = {
      id: credential.user,
      email: credential.email,
      isPrivateEmail: credential.email?.includes('privaterelay.appleid.com'),
      name: credential.fullName ? {
        firstName: credential.fullName.givenName,
        lastName: credential.fullName.familyName,
      } : undefined,
      realUserStatus: credential.realUserStatus === 2 ? 'likelyReal' : credential.realUserStatus === 1 ? 'unknown' : 'unsupported',
    };

    this.currentUser = user;
    await this.saveSession();

    this.emit('login_success', { user, token });
    return user;
  }

  private async exchangeCodeForToken(code: string): Promise<AppleToken> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const expiresIn = 3600;

    return {
      accessToken: `apple_access_${this.generateRandomString(32)}`,
      refreshToken: `apple_refresh_${this.generateRandomString(32)}`,
      idToken: `apple_id_${this.generateRandomString(64)}`,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
    };
  }

  private async parseIdToken(idToken: string, userData?: { firstName?: string; lastName?: string; email?: string }): Promise<AppleUser> {
    // In production, decode and verify the JWT
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      id: `apple_${this.generateRandomString(16)}`,
      email: userData?.email || 'user@privaterelay.appleid.com',
      emailVerified: true,
      isPrivateEmail: true,
      name: userData ? {
        firstName: userData.firstName,
        lastName: userData.lastName,
      } : undefined,
      realUserStatus: 'likelyReal',
    };
  }

  async refreshToken(): Promise<AppleToken | null> {
    if (!this.currentToken?.refreshToken) {
      this.emit('session_expired', null);
      await this.clearSession();
      return null;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const now = new Date();
      const expiresIn = 3600;

      const newToken: AppleToken = {
        ...this.currentToken,
        accessToken: `apple_access_${this.generateRandomString(32)}`,
        expiresIn,
        expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      };

      this.currentToken = newToken;
      await this.saveSession();
      this.emit('token_refreshed', newToken);
      return newToken;
    } catch (error) {
      this.emit('refresh_failed', error);
      await this.clearSession();
      return null;
    }
  }

  async revokeCredentials(): Promise<void> {
    if (!this.currentToken?.refreshToken) return;

    // Simulate revocation API call
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.clearSession();
    this.emit('credentials_revoked', null);
  }

  private async saveSession(): Promise<void> {
    if (this.currentToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.APPLE_TOKEN, JSON.stringify(this.currentToken));
    }
    if (this.currentUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.APPLE_USER, JSON.stringify(this.currentUser));
    }
  }

  private async clearSession(): Promise<void> {
    this.currentToken = null;
    this.currentUser = null;
    await AsyncStorage.multiRemove([STORAGE_KEYS.APPLE_TOKEN, STORAGE_KEYS.APPLE_USER]);
  }

  private isTokenValid(): boolean {
    if (!this.currentToken) return false;
    const expiresAt = new Date(this.currentToken.expiresAt);
    return expiresAt > new Date();
  }

  async logout(): Promise<void> {
    await this.clearSession();
    this.emit('logout', null);
  }

  getCurrentUser(): AppleUser | null { return this.currentUser; }
  getAccessToken(): string | null { return this.currentToken?.accessToken || null; }
  isAuthenticated(): boolean { return this.isTokenValid(); }

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
// Export Singletons
// ==========================================

export const googleOAuth = new GoogleOAuthService();
export const appleSignIn = new AppleSignInService();

export { GoogleOAuthService, AppleSignInService };
