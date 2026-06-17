import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

/**
 * Cloud Authentication Service
 * Handles OAuth and cloud-based user authentication
 */

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  hospitalId: string;
}

export interface AuthSession {
  user: User;
  token: AuthToken;
  isAuthenticated: boolean;
  expiresAt: number;
}

export class CloudAuthService {
  private static instance: CloudAuthService;
  private currentSession: AuthSession | null = null;
  private sessionListeners: Set<(session: AuthSession | null) => void> = new Set();

  // OAuth Configuration
  private readonly OAUTH_CONFIG = {
    microsoft: {
      clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_SECRET || '',
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      revokeEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
      scopes: ['openid', 'profile', 'email'],
    },
    apple: {
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '',
      clientSecret: process.env.EXPO_PUBLIC_APPLE_CLIENT_SECRET || '',
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      revokeEndpoint: 'https://appleid.apple.com/auth/revoke',
      scopes: ['openid', 'profile', 'email'],
    },
  };

  private constructor() {
    this.initializeSession();
  }

  static getInstance(): CloudAuthService {
    if (!CloudAuthService.instance) {
      CloudAuthService.instance = new CloudAuthService();
    }
    return CloudAuthService.instance;
  }

  /**
   * Initialize session from secure storage
   */
  private async initializeSession(): Promise<void> {
    try {
      const sessionData = await SecureStore.getItemAsync('cloud_auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData) as AuthSession;
        
        // Check if token is expired
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
          this.notifyListeners();
        } else {
          // Try to refresh token
          if (session.token.refreshToken) {
            await this.refreshToken(session.token.refreshToken);
          } else {
            await this.logout();
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'microsoft' | 'google' | 'apple'): Promise<AuthSession> {
    try {
      const config = this.OAUTH_CONFIG[provider];
      
      if (!config.clientId) {
        throw new Error(`${provider} OAuth not configured`);
      }

      // Create redirect URL
      const redirectUrl = AuthSession.getRedirectUrl();
      
      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUrl,
        prompt: AuthSession.PromptValue.Login,
      });

      // Prompt user to authenticate
      const result = await request.promptAsync({
        authorizationEndpoint: config.authorizationEndpoint,
        tokenEndpoint: config.tokenEndpoint,
      });

      if (result.type !== 'success') {
        throw new Error('OAuth authentication cancelled');
      }

      // Exchange code for token
      const token = await this.exchangeCodeForToken(
        provider,
        result.params.code,
        redirectUrl
      );

      // Get user info
      const user = await this.getUserInfo(provider, token.accessToken);

      // Create session
      const session: AuthSession = {
        user,
        token,
        isAuthenticated: true,
        expiresAt: Date.now() + token.expiresIn * 1000,
      };

      // Save session
      await this.saveSession(session);
      this.currentSession = session;
      this.notifyListeners();

      return session;
    } catch (error) {
      console.error(`OAuth sign in failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    try {
      // TODO: Implement email/password authentication with backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Email sign in failed');
      }

      const data = await response.json();
      
      const session: AuthSession = {
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        expiresAt: Date.now() + data.token.expiresIn * 1000,
      };

      await this.saveSession(session);
      this.currentSession = session;
      this.notifyListeners();

      return session;
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: string
  ): Promise<AuthSession> {
    try {
      // TODO: Implement registration with backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      
      const session: AuthSession = {
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        expiresAt: Date.now() + data.token.expiresIn * 1000,
      };

      await this.saveSession(session);
      this.currentSession = session;
      this.notifyListeners();

      return session;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const token = await response.json() as AuthToken;
      
      if (this.currentSession) {
        this.currentSession.token = token;
        this.currentSession.expiresAt = Date.now() + token.expiresIn * 1000;
        await this.saveSession(this.currentSession);
        this.notifyListeners();
      }

      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      throw error;
    }
  }

  /**
   * Exchange OAuth code for token
   */
  private async exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUrl: string
  ): Promise<AuthToken> {
    try {
      const config = this.OAUTH_CONFIG[provider as keyof typeof this.OAUTH_CONFIG];
      
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUrl,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Get user info from OAuth provider
   */
  private async getUserInfo(provider: string, accessToken: string): Promise<User> {
    try {
      // TODO: Implement user info retrieval from backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async logout(): Promise<void> {
    try {
      if (this.currentSession?.token.refreshToken) {
        // Revoke token on backend
        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.currentSession.token.accessToken}`,
          },
        }).catch(console.error);
      }

      await SecureStore.deleteItemAsync('cloud_auth_session');
      this.currentSession = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Save session to secure storage
   */
  private async saveSession(session: AuthSession): Promise<void> {
    try {
      await SecureStore.setItemAsync('cloud_auth_session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Get current session
   */
  getSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.currentSession?.token.accessToken || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession?.isAuthenticated ?? false;
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.sessionListeners.add(listener);
    return () => this.sessionListeners.delete(listener);
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(): void {
    this.sessionListeners.forEach(listener => listener(this.currentSession));
  }
}
