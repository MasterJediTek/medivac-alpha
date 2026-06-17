 * MediVac One - Multi-Provider Authentication Service
 * Supports Microsoft Entra ID (Azure AD), Google, and Apple Sign-In
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Types
export type AuthProvider = 'microsoft' | 'google' | 'apple' | 'local';

export type UserRole = 'doctor' | 'nurse' | 'admin' | 'staff' | 'patient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: AuthProvider;
  role: UserRole;
  permissions: string[];
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  microsoftId?: string;
  googleId?: string;
  appleId?: string;
  department?: string;
  title?: string;
  phone?: string;
  officeLocation?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

// Storage Keys
const STORAGE_KEYS = {
  AUTH_USER: 'medivac_auth_user',
  AUTH_TOKENS: 'medivac_auth_tokens',
  AUTH_PROVIDER: 'medivac_auth_provider',
};

// OAuth Configuration
const OAUTH_CONFIG = {
  microsoft: {
    clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
    tenantId: process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID || 'common',
    scopes: [
      'openid',
      'profile',
      'email',
      'offline_access',
      'User.Read',
      'Calendars.ReadWrite',
      'Mail.Read',
      'Mail.Send',
      'Contacts.Read',
      'Presence.Read',
      'Team.ReadBasic.All',
    ],
  },
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'your-google-ios-client-id',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'your-google-android-client-id',
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  },
};

// Microsoft Entra ID (Azure AD) Discovery Document
const microsoftDiscovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/token`,
  revocationEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/logout`,
};

// Google Discovery Document
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Get redirect URI for OAuth
 */
function getRedirectUri(provider: AuthProvider): string {
  const scheme = 'medivac-one';
  return AuthSession.makeRedirectUri({
    scheme,
    path: `oauth/${provider}`,
  });
}

/**
 * Microsoft Authentication
 */
export async function signInWithMicrosoft(): Promise<AuthUser | null> {
  try {
    const redirectUri = getRedirectUri('microsoft');
    
    const request = new AuthSession.AuthRequest({
      clientId: OAUTH_CONFIG.microsoft.clientId,
      scopes: OAUTH_CONFIG.microsoft.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: {
        prompt: 'select_account',
      },
    });

    const result = await request.promptAsync(microsoftDiscovery);

    if (result.type === 'success' && result.params.code) {
      // Exchange code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: OAUTH_CONFIG.microsoft.clientId,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier!,