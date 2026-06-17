/**
 * OAuth Credentials Configuration Service
 * Manages OAuth client credentials for Microsoft AD, Google, and Apple authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// OAuth Provider Types
export type OAuthProvider = 'microsoft' | 'google' | 'apple' | 'jedi';

// OAuth Credential Structure
export interface OAuthCredentials {
  clientId: string;
  clientSecret?: string;
  tenantId?: string; // Microsoft specific
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
  validated: boolean;
  lastValidated?: string;
}

// Provider Configuration
export interface OAuthProviderConfig {
  provider: OAuthProvider;
  displayName: string;
  icon: string;
  color: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  defaultScopes: string[];
  requiredFields: string[];
  helpUrl: string;
}

// Provider Configurations
export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  microsoft: {
    provider: 'microsoft',
    displayName: 'Microsoft Azure AD',
    icon: '🪟',
    color: '#0078D4',
    authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    defaultScopes: ['openid', 'profile', 'email', 'User.Read', 'Calendars.ReadWrite', 'Mail.Read'],
    requiredFields: ['clientId', 'tenantId', 'redirectUri'],
    helpUrl: 'https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app',
  },
  google: {
    provider: 'google',
    displayName: 'Google OAuth',
    icon: '🔵',
    color: '#4285F4',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    defaultScopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    requiredFields: ['clientId', 'redirectUri'],
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  apple: {
    provider: 'apple',
    displayName: 'Sign in with Apple',
    icon: '🍎',
    color: '#000000',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: '', // Apple doesn't have a userinfo endpoint
    defaultScopes: ['name', 'email'],
    requiredFields: ['clientId', 'redirectUri'],
    helpUrl: 'https://developer.apple.com/sign-in-with-apple/',
  },
  jedi: {
    provider: 'jedi',
    displayName: 'JEDI SSO',
    icon: '⚡',
    color: '#8B5CF6',
    authUrl: 'https://auth.jeditek.com.au/oauth2/authorize',
    tokenUrl: 'https://auth.jeditek.com.au/oauth2/token',
    userInfoUrl: 'https://auth.jeditek.com.au/oauth2/userinfo',
    defaultScopes: ['openid', 'profile', 'email', 'jedi.systems', 'medivac.access'],
    requiredFields: ['clientId', 'redirectUri'],
    helpUrl: 'https://docs.jeditek.com.au/sso',
  },
};

// Storage Keys
const OAUTH_STORAGE_KEY = 'medivac_oauth_credentials';
const OAUTH_SECURE_PREFIX = 'oauth_secret_';

// Default Credentials Template
const DEFAULT_CREDENTIALS: Record<OAuthProvider, OAuthCredentials> = {
  microsoft: {
    clientId: '',
    clientSecret: '',
    tenantId: 'common',
    redirectUri: 'medivac://auth/callback',
    scopes: OAUTH_PROVIDERS.microsoft.defaultScopes,
    enabled: false,
    validated: false,
  },
  google: {
    clientId: '',
    redirectUri: 'medivac://auth/callback',
    scopes: OAUTH_PROVIDERS.google.defaultScopes,
    enabled: false,
    validated: false,
  },
  apple: {
    clientId: '',
    redirectUri: 'medivac://auth/callback',
    scopes: OAUTH_PROVIDERS.apple.defaultScopes,
    enabled: false,
    validated: false,
  },
  jedi: {
    clientId: 'medivac-one-app',
    redirectUri: 'medivac://auth/callback',
    scopes: OAUTH_PROVIDERS.jedi.defaultScopes,
    enabled: true,
    validated: true,
  },
};

// Secure Storage Helper
async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  } else {
    return SecureStore.getItemAsync(key);
  }
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

/**
 * Get all OAuth credentials
 */
export async function getOAuthCredentials(): Promise<Record<OAuthProvider, OAuthCredentials>> {
  try {
    const stored = await AsyncStorage.getItem(OAUTH_STORAGE_KEY);
    if (stored) {
      const credentials = JSON.parse(stored) as Record<OAuthProvider, OAuthCredentials>;
      
      // Load secrets from secure storage
      for (const provider of Object.keys(credentials) as OAuthProvider[]) {
        const secret = await secureGet(`${OAUTH_SECURE_PREFIX}${provider}`);
        if (secret) {
          credentials[provider].clientSecret = secret;
        }
      }
      
      return { ...DEFAULT_CREDENTIALS, ...credentials };
    }
  } catch (error) {
    console.error('Error loading OAuth credentials:', error);
  }
  return DEFAULT_CREDENTIALS;
}

/**
 * Save OAuth credentials for a provider
 */
export async function saveOAuthCredentials(
  provider: OAuthProvider,
  credentials: Partial<OAuthCredentials>
): Promise<void> {
  try {
    const allCredentials = await getOAuthCredentials();
    
    // Handle client secret separately in secure storage
    if (credentials.clientSecret) {
      await secureSet(`${OAUTH_SECURE_PREFIX}${provider}`, credentials.clientSecret);
      delete credentials.clientSecret; // Don't store in regular storage
    }
    
    allCredentials[provider] = {
      ...allCredentials[provider],
      ...credentials,
      validated: false, // Reset validation on change
    };
    
    await AsyncStorage.setItem(OAUTH_STORAGE_KEY, JSON.stringify(allCredentials));
  } catch (error) {
    console.error('Error saving OAuth credentials:', error);
    throw error;
  }
}

/**
 * Validate OAuth credentials for a provider
 */
export async function validateOAuthCredentials(provider: OAuthProvider): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const credentials = await getOAuthCredentials();
    const creds = credentials[provider];
    const config = OAUTH_PROVIDERS[provider];
    
    // Check required fields
    for (const field of config.requiredFields) {
      if (!creds[field as keyof OAuthCredentials]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
    
    // Validate client ID format
    if (creds.clientId.length < 10) {
      return { valid: false, error: 'Client ID appears to be invalid' };
    }
    
    // Provider-specific validation
    if (provider === 'microsoft' && creds.tenantId) {
      // Validate tenant ID format (GUID or 'common'/'organizations'/'consumers')
      const validTenants = ['common', 'organizations', 'consumers'];
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!validTenants.includes(creds.tenantId) && !guidRegex.test(creds.tenantId)) {
        return { valid: false, error: 'Invalid tenant ID format' };
      }
    }
    
    // Mark as validated
    await saveOAuthCredentials(provider, { validated: true, lastValidated: new Date().toISOString() });
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

/**
 * Enable/disable OAuth provider
 */
export async function setOAuthProviderEnabled(provider: OAuthProvider, enabled: boolean): Promise<void> {
  await saveOAuthCredentials(provider, { enabled });
}

/**
 * Get OAuth authorization URL
 */
export function getAuthorizationUrl(provider: OAuthProvider, state: string): string {
  const config = OAUTH_PROVIDERS[provider];
  
  // This would be called after credentials are loaded
  // For now, return a placeholder URL structure
  const params = new URLSearchParams({
    response_type: 'code',
    state,
    scope: config.defaultScopes.join(' '),
  });
  
  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Test OAuth connection
 */
export async function testOAuthConnection(provider: OAuthProvider): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const config = OAUTH_PROVIDERS[provider];
    
    // Test connectivity to auth endpoint
    const response = await fetch(config.authUrl.replace('{tenantId}', 'common'), {
      method: 'HEAD',
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok || response.status === 400) {
      // 400 is expected without proper params
      return { success: true, latency };
    }
    
    return { success: false, latency, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, latency: Date.now() - startTime, error: String(error) };
  }
}

/**
 * Clear all OAuth credentials
 */
export async function clearAllOAuthCredentials(): Promise<void> {
  await AsyncStorage.removeItem(OAUTH_STORAGE_KEY);
  for (const provider of Object.keys(OAUTH_PROVIDERS) as OAuthProvider[]) {
    await secureDelete(`${OAUTH_SECURE_PREFIX}${provider}`);
  }
}

/**
 * Export credentials for backup (without secrets)
 */
export async function exportOAuthConfig(): Promise<string> {
  const credentials = await getOAuthCredentials();
  
  // Remove secrets before export
  const exportData: Record<string, Partial<OAuthCredentials>> = {};
  for (const [provider, creds] of Object.entries(credentials)) {
    const { clientSecret, ...safe } = creds;
    exportData[provider] = safe;
  }
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import credentials from backup
 */
export async function importOAuthConfig(configJson: string): Promise<void> {
  try {
    const imported = JSON.parse(configJson) as Record<OAuthProvider, Partial<OAuthCredentials>>;
    
    for (const [provider, creds] of Object.entries(imported)) {
      await saveOAuthCredentials(provider as OAuthProvider, creds);
    }
  } catch (error) {
    throw new Error('Invalid OAuth configuration format');
  }
}
