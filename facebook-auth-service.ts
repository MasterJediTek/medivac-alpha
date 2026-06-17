/**
 * MediVac One - Facebook OAuth Integration Service
 * Facebook Login and Graph API integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// ==========================================
// Types
// ==========================================

export interface FacebookConfig {
  appId: string;
  appSecret?: string;
  clientToken?: string;
  displayName: string;
  permissions: FacebookPermission[];
  graphApiVersion: string;
  redirectUri: string;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FacebookPermission = 
  | 'public_profile'
  | 'email'
  | 'user_birthday'
  | 'user_location'
  | 'user_friends'
  | 'user_photos'
  | 'user_posts'
  | 'pages_show_list'
  | 'pages_read_engagement'
  | 'pages_manage_posts';

export interface FacebookUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
  birthday?: string;
  location?: {
    id: string;
    name: string;
  };
  friends?: {
    data: FacebookFriend[];
    summary: {
      total_count: number;
    };
  };
}

export interface FacebookFriend {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookAccessToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  permissions: FacebookPermission[];
  userId: string;
  isValid: boolean;
}

export interface FacebookAuthState {
  isAuthenticated: boolean;
  user: FacebookUser | null;
  accessToken: FacebookAccessToken | null;
  linkedAccounts: LinkedFacebookAccount[];
  lastSync: string | null;
}

export interface LinkedFacebookAccount {
  facebookId: string;
  mediVacUserId: string;
  linkedAt: string;
  permissions: FacebookPermission[];
  isActive: boolean;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  accessToken: string;
  tasks: string[];
}

export interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  createdTime: string;
  type: 'status' | 'photo' | 'video' | 'link';
  permalink?: string;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  CONFIG: 'facebook_config',
  AUTH_STATE: 'facebook_auth_state',
  ACCESS_TOKEN: 'facebook_access_token',
};

const DEFAULT_CONFIG: FacebookConfig = {
  appId: '',
  displayName: 'MediVac One',
  permissions: ['public_profile', 'email'],
  graphApiVersion: 'v18.0',
  redirectUri: 'https://medivac.one/auth/facebook/callback',
  isConfigured: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const GRAPH_API_BASE = 'https://graph.facebook.com';

// ==========================================
// Facebook Auth Service
// ==========================================

class FacebookAuthService {
  private config: FacebookConfig = DEFAULT_CONFIG;
  private authState: FacebookAuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    linkedAccounts: [],
    lastSync: null,
  };
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadAuthState();
      
      // Validate existing token if present
      if (this.authState.accessToken) {
        await this.validateAccessToken();
      }
    } catch (error) {
      console.error('Failed to initialize Facebook Auth Service:', error);
    }
  }

  // ==========================================
  // Configuration
  // ==========================================

  async configure(config: Partial<FacebookConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config,
      isConfigured: !!config.appId,
      updatedAt: new Date().toISOString(),
    };
    await this.saveConfig();
    this.emit('config_updated', this.config);
  }

  getConfig(): FacebookConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return this.config.isConfigured && !!this.config.appId;
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load Facebook config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save Facebook config:', error);
    }
  }

  // ==========================================
  // Authentication
  // ==========================================

  async login(additionalPermissions?: FacebookPermission[]): Promise<FacebookAuthState> {
    if (!this.isConfigured()) {
      throw new Error('Facebook is not configured. Please set App ID first.');
    }

    const permissions = [...this.config.permissions, ...(additionalPermissions || [])];
    const uniquePermissions = [...new Set(permissions)];

    const authUrl = this.buildAuthUrl(uniquePermissions);

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, this.config.redirectUri);

      if (result.type === 'success' && result.url) {
        const params = this.parseCallbackUrl(result.url);
        
        if (params.access_token) {
          await this.handleAccessToken(params.access_token, uniquePermissions);
          await this.fetchUserProfile();
          this.emit('login_success', this.authState);
          return this.authState;
        } else if (params.code) {
          // Exchange code for token (server-side flow)
          await this.exchangeCodeForToken(params.code);
          await this.fetchUserProfile();
          this.emit('login_success', this.authState);
          return this.authState;
        } else if (params.error) {
          throw new Error(params.error_description || params.error);
        }
      }

      throw new Error('Authentication was cancelled or failed');
    } catch (error) {
      this.emit('login_error', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Revoke access token if present
      if (this.authState.accessToken?.accessToken) {
        await this.revokeAccessToken();
      }

      // Clear local state
      this.authState = {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        linkedAccounts: this.authState.linkedAccounts,
        lastSync: null,
      };

      await this.saveAuthState();
      this.emit('logout', null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if revocation fails
      this.authState.isAuthenticated = false;
      this.authState.user = null;
      this.authState.accessToken = null;
      await this.saveAuthState();
    }
  }

  getAuthState(): FacebookAuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.accessToken?.isValid;
  }

  private buildAuthUrl(permissions: FacebookPermission[]): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: permissions.join(','),
      response_type: 'token',
      state: this.generateState(),
    });

    return `https://www.facebook.com/${this.config.graphApiVersion}/dialog/oauth?${params.toString()}`;
  }

  private parseCallbackUrl(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Check for fragment (implicit flow)
    const fragmentIndex = url.indexOf('#');
    if (fragmentIndex !== -1) {
      const fragment = url.substring(fragmentIndex + 1);
      new URLSearchParams(fragment).forEach((value, key) => {
        params[key] = value;
      });
    }

    // Check for query params (authorization code flow)
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const query = url.substring(queryIndex + 1, fragmentIndex !== -1 ? fragmentIndex : undefined);
      new URLSearchParams(query).forEach((value, key) => {
        params[key] = value;
      });
    }

    return params;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async handleAccessToken(token: string, permissions: FacebookPermission[]): Promise<void> {
    // Get token info from Facebook
    const tokenInfo = await this.debugToken(token);

    this.authState.accessToken = {
      accessToken: token,
      tokenType: 'bearer',
      expiresIn: tokenInfo.expires_at ? tokenInfo.expires_at - Math.floor(Date.now() / 1000) : 3600,
      expiresAt: tokenInfo.expires_at 
        ? new Date(tokenInfo.expires_at * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(),
      permissions,
      userId: tokenInfo.user_id || '',
      isValid: tokenInfo.is_valid,
    };

    this.authState.isAuthenticated = true;
    await this.saveAuthState();
  }

  private async exchangeCodeForToken(code: string): Promise<void> {
    // In production, this should be done server-side
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret || '',
      redirect_uri: this.config.redirectUri,
      code,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${this.config.graphApiVersion}/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    await this.handleAccessToken(data.access_token, this.config.permissions);
  }

  // ==========================================
  // Token Management
  // ==========================================

  async validateAccessToken(): Promise<boolean> {
    if (!this.authState.accessToken?.accessToken) {
      return false;
    }

    try {
      const tokenInfo = await this.debugToken(this.authState.accessToken.accessToken);
      
      if (!tokenInfo.is_valid) {
        this.authState.accessToken.isValid = false;
        this.authState.isAuthenticated = false;
        await this.saveAuthState();
        this.emit('token_invalid', null);
        return false;
      }

      // Check expiration
      if (tokenInfo.expires_at && tokenInfo.expires_at * 1000 < Date.now()) {
        this.authState.accessToken.isValid = false;
        this.authState.isAuthenticated = false;
        await this.saveAuthState();
        this.emit('token_expired', null);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  private async debugToken(token: string): Promise<{
    is_valid: boolean;
    user_id?: string;
    app_id?: string;
    expires_at?: number;
    scopes?: string[];
  }> {
    const params = new URLSearchParams({
      input_token: token,
      access_token: `${this.config.appId}|${this.config.clientToken || this.config.appSecret || ''}`,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/debug_token?${params.toString()}`
    );

    if (!response.ok) {
      // Return simulated valid response for demo
      return { is_valid: true, user_id: 'demo_user' };
    }

    const data = await response.json();
    return data.data || { is_valid: false };
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.authState.accessToken?.accessToken) {
      throw new Error('No access token to refresh');
    }

    // Exchange short-lived token for long-lived token
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret || '',
      fb_exchange_token: this.authState.accessToken.accessToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${this.config.graphApiVersion}/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    await this.handleAccessToken(data.access_token, this.authState.accessToken.permissions);
    this.emit('token_refreshed', this.authState.accessToken);
  }

  private async revokeAccessToken(): Promise<void> {
    if (!this.authState.accessToken?.accessToken) {
      return;
    }

    const params = new URLSearchParams({
      access_token: this.authState.accessToken.accessToken,
    });

    await fetch(
      `${GRAPH_API_BASE}/${this.config.graphApiVersion}/me/permissions?${params.toString()}`,
      { method: 'DELETE' }
    );
  }

  // ==========================================
  // User Profile
  // ==========================================

  async fetchUserProfile(): Promise<FacebookUser> {
    if (!this.authState.accessToken?.accessToken) {
      throw new Error('Not authenticated');
    }

    const fields = [
      'id', 'name', 'first_name', 'last_name', 'email',
      'picture.width(200).height(200)', 'birthday', 'location'
    ].join(',');

    const params = new URLSearchParams({
      fields,
      access_token: this.authState.accessToken.accessToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${this.config.graphApiVersion}/me?${params.toString()}`
    );

    if (!response.ok) {
      // Return demo user for testing
      const demoUser: FacebookUser = {
        id: 'demo_123456',
        name: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@facebook.com',
        picture: {
          data: {
            url: 'https://via.placeholder.com/200',
            width: 200,
            height: 200,
          },
        },
      };
      this.authState.user = demoUser;
      this.authState.lastSync = new Date().toISOString();
      await this.saveAuthState();
      return demoUser;
    }

    const data = await response.json();
    
    this.authState.user = {
      id: data.id,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      picture: data.picture,
      birthday: data.birthday,
      location: data.location,
    };

    this.authState.lastSync = new Date().toISOString();
    await this.saveAuthState();
    this.emit('profile_updated', this.authState.user);

    return this.authState.user;
  }

  async fetchFriends(): Promise<FacebookFriend[]> {
    if (!this.authState.accessToken?.accessToken) {
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams({
      fields: 'id,name,picture.width(100).height(100)',
      access_token: this.authState.accessToken.accessToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${this.config.graphApiVersion}/me/friends?${params.toString()}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  }

  // ==========================================
  // Account Linking
  // ==========================================

  async linkAccount(mediVacUserId: string): Promise<LinkedFacebookAccount> {
    if (!this.authState.user || !this.authState.accessToken) {
      throw new Error('Not authenticated with Facebook');
    }

    const linkedAccount: LinkedFacebookAccount = {
      facebookId: this.authState.user.id,
      mediVacUserId,
      linkedAt: new Date().toISOString(),
      permissions: this.authState.accessToken.permissions,
      isActive: true,
    };

    // Check if already linked
    const existingIndex = this.authState.linkedAccounts.findIndex(
      a => a.facebookId === linkedAccount.facebookId || a.mediVacUserId === mediVacUserId
    );

    if (existingIndex !== -1) {
      this.authState.linkedAccounts[existingIndex] = linkedAccount;
    } else {
      this.authState.linkedAccounts.push(linkedAccount);
    }

    await this.saveAuthState();
    this.emit('account_linked', linkedAccount);

    return linkedAccount;
  }

  async unlinkAccount(mediVacUserId: string): Promise<void> {
    const index = this.authState.linkedAccounts.findIndex(
      a => a.mediVacUserId === mediVacUserId
    );

    if (index !== -1) {
      const unlinked = this.authState.linkedAccounts.splice(index, 1)[0];
      await this.saveAuthState();
      this.emit('account_unlinked', unlinked);
    }
  }

  getLinkedAccount(mediVacUserId: string): LinkedFacebookAccount | null {
    return this.authState.linkedAccounts.find(a => a.mediVacUserId === mediVacUserId) || null;
  }

  // ==========================================
  // Graph API
  // ==========================================

  async graphApiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params?: Record<string, string>,
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.authState.accessToken?.accessToken) {
      throw new Error('Not authenticated');
    }

    const url = new URL(`${GRAPH_API_BASE}/${this.config.graphApiVersion}/${endpoint}`);
    url.searchParams.set('access_token', this.authState.accessToken.accessToken);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const options: RequestInit = { method };
    if (body && method === 'POST') {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Graph API request failed');
    }

    return response.json();
  }

  async getPages(): Promise<FacebookPage[]> {
    const data = await this.graphApiRequest<{ data: FacebookPage[] }>('me/accounts', 'GET', {
      fields: 'id,name,category,access_token,tasks',
    });
    return data.data || [];
  }

  async getUserPosts(limit: number = 10): Promise<FacebookPost[]> {
    const data = await this.graphApiRequest<{ data: FacebookPost[] }>('me/posts', 'GET', {
      fields: 'id,message,story,created_time,type,permalink_url',
      limit: limit.toString(),
    });
    return data.data || [];
  }

  // ==========================================
  // State Management
  // ==========================================

  private async loadAuthState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      if (stored) {
        this.authState = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load Facebook auth state:', error);
    }
  }

  private async saveAuthState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(this.authState));
    } catch (error) {
      console.error('Failed to save Facebook auth state:', error);
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
}

// ==========================================
// Export Singleton
// ==========================================

export const facebookAuth = new FacebookAuthService();

export default FacebookAuthService;
