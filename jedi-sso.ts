/**
 * JEDI Integrated Single Sign-On Service
 * Provides unified authentication across all JEDI systems
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// SSO Configuration
const SSO_CONFIG = {
  issuer: 'https://sso.jeditek.com.au',
  clientId: 'medivac-one-app',
  redirectUri: 'medivac://auth/callback',
  scopes: ['openid', 'profile', 'email', 'jedi.systems', 'smpo.protocol'],
};

// JEDI Ranks
export type JediRank = 'grandmaster' | 'council' | 'master' | 'knight' | 'padawan' | 'youngling';

// User Roles
export type UserRole = 'admin' | 'cmo' | 'doctor' | 'nurse' | 'receptionist' | 'security' | 'viewer' | 'guest' | 'staff';

// Hospital Roles
export type HospitalRole = 
  | 'chief_medical_officer'
  | 'attending_physician'
  | 'resident'
  | 'registered_nurse'
  | 'nurse_practitioner'
  | 'medical_assistant'
  | 'pharmacist'
  | 'lab_technician'
  | 'radiologist'
  | 'surgeon'
  | 'anesthesiologist'
  | 'physical_therapist'
  | 'social_worker'
  | 'case_manager'
  | 'billing_specialist'
  | 'receptionist'
  | 'security_officer'
  | 'maintenance'
  | 'administrator';

// Auth Provider
export type AuthProvider = 'jedi' | 'microsoft' | 'google' | 'apple' | 'local';

// User Session
export interface JediUserSession {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  jediRank: JediRank;
  userRole: UserRole;
  hospitalRoles: HospitalRole[];
  groups: string[];
  permissions: string[];
  provider: AuthProvider;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
  issuedAt: number;
  lastActivity: number;
  devices: string[];
  mfaEnabled: boolean;
  verified: boolean;
}

// Registration Data
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  hospitalRole: HospitalRole;
  department?: string;
  employeeId?: string;
  phone?: string;
  provider: AuthProvider;
}

// Auth State
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: JediUserSession | null;
  error: string | null;
}

// Storage Keys
const STORAGE_KEYS = {
  session: '@jedi_sso_session',
  tokens: '@jedi_sso_tokens',
  preferences: '@jedi_sso_preferences',
  deviceId: '@jedi_sso_device_id',
};

// Generate Device ID
const generateDeviceId = (): string => {
  return 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Get or Create Device ID
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
    }
    return deviceId;
  } catch {
    return generateDeviceId();
  }
};

// Initialize SSO
export const initializeSSO = async (): Promise<AuthState> => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.session);
    if (sessionData) {
      const session: JediUserSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session.expiresAt > Date.now()) {
        return {
          isAuthenticated: true,
          isLoading: false,
          session,
          error: null,
        };
      } else {
        // Try to refresh token
        const refreshedSession = await refreshSession(session);
        if (refreshedSession) {
          return {
            isAuthenticated: true,
            isLoading: false,
            session: refreshedSession,
            error: null,
          };
        }
      }
    }
    
    return {
      isAuthenticated: false,
      isLoading: false,
      session: null,
      error: null,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      isLoading: false,
      session: null,
      error: 'Failed to initialize SSO',
    };
  }
};

// Login with JEDI SSO
export const loginWithJediSSO = async (email: string, password: string): Promise<JediUserSession | null> => {
  try {
    // Simulate API call to JEDI SSO server
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const deviceId = await getDeviceId();
    
    // Create session
    const session: JediUserSession = {
      id: 'user_' + Math.random().toString(36).substring(2, 15),
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      jediRank: 'knight',
      userRole: 'doctor',
      hospitalRoles: ['attending_physician'],
      groups: ['medical_staff'],
      permissions: ['patient.view', 'patient.edit', 'medical.view', 'medical.prescribe'],
      provider: 'jedi',
      accessToken: 'jedi_at_' + Math.random().toString(36).substring(2, 30),
      refreshToken: 'jedi_rt_' + Math.random().toString(36).substring(2, 30),
      idToken: 'jedi_id_' + Math.random().toString(36).substring(2, 30),
      expiresAt: Date.now() + 3600000, // 1 hour
      issuedAt: Date.now(),
      lastActivity: Date.now(),
      devices: [deviceId],
      mfaEnabled: false,
      verified: true,
    };
    
    await saveSession(session);
    return session;
  } catch (error) {
    console.error('JEDI SSO login failed:', error);
    return null;
  }
};

// Login with Microsoft
export const loginWithMicrosoft = async (accessToken: string): Promise<JediUserSession | null> => {
  try {
    // Exchange Microsoft token for JEDI session
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const deviceId = await getDeviceId();
    
    const session: JediUserSession = {
      id: 'ms_user_' + Math.random().toString(36).substring(2, 15),
      email: 'user@organization.onmicrosoft.com',
      name: 'Microsoft User',
      jediRank: 'padawan',
      userRole: 'staff',
      hospitalRoles: ['registered_nurse'],
      groups: ['medical_staff'],
      permissions: ['patient.view', 'medical.view'],
      provider: 'microsoft',
      accessToken,
      refreshToken: 'ms_rt_' + Math.random().toString(36).substring(2, 30),
      idToken: 'ms_id_' + Math.random().toString(36).substring(2, 30),
      expiresAt: Date.now() + 3600000,
      issuedAt: Date.now(),
      lastActivity: Date.now(),
      devices: [deviceId],
      mfaEnabled: true,
      verified: true,
    };
    
    await saveSession(session);
    return session;
  } catch (error) {
    console.error('Microsoft login failed:', error);
    return null;
  }
};

// Login with Google
export const loginWithGoogle = async (idToken: string): Promise<JediUserSession | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const deviceId = await getDeviceId();
    
    const session: JediUserSession = {
      id: 'google_user_' + Math.random().toString(36).substring(2, 15),
      email: 'user@gmail.com',
      name: 'Google User',
      jediRank: 'padawan',
      userRole: 'viewer',
      hospitalRoles: ['receptionist'],
      groups: ['front_desk'],
      permissions: ['patient.view'],
      provider: 'google',
      accessToken: 'google_at_' + Math.random().toString(36).substring(2, 30),
      refreshToken: 'google_rt_' + Math.random().toString(36).substring(2, 30),
      idToken,
      expiresAt: Date.now() + 3600000,
      issuedAt: Date.now(),
      lastActivity: Date.now(),
      devices: [deviceId],
      mfaEnabled: false,
      verified: true,
    };
    
    await saveSession(session);
    return session;
  } catch (error) {
    console.error('Google login failed:', error);
    return null;
  }
};

// Login with Apple
export const loginWithApple = async (identityToken: string): Promise<JediUserSession | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const deviceId = await getDeviceId();
    
    const session: JediUserSession = {
      id: 'apple_user_' + Math.random().toString(36).substring(2, 15),
      email: 'user@privaterelay.appleid.com',
      name: 'Apple User',
      jediRank: 'padawan',
      userRole: 'viewer',
      hospitalRoles: ['receptionist'],
      groups: ['front_desk'],
      permissions: ['patient.view'],
      provider: 'apple',
      accessToken: 'apple_at_' + Math.random().toString(36).substring(2, 30),
      refreshToken: 'apple_rt_' + Math.random().toString(36).substring(2, 30),
      idToken: identityToken,
      expiresAt: Date.now() + 3600000,
      issuedAt: Date.now(),
      lastActivity: Date.now(),
      devices: [deviceId],
      mfaEnabled: false,
      verified: true,
    };
    
    await saveSession(session);
    return session;
  } catch (error) {
    console.error('Apple login failed:', error);
    return null;
  }
};

// Register New User
export const registerUser = async (data: RegistrationData): Promise<JediUserSession | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deviceId = await getDeviceId();
    
    // Determine JEDI rank and user role based on hospital role
    let jediRank: JediRank = 'youngling';
    let userRole: UserRole = 'guest';
    let permissions: string[] = [];
    
    switch (data.hospitalRole) {
      case 'chief_medical_officer':
        jediRank = 'council';
        userRole = 'cmo';
        permissions = ['patient.view', 'patient.edit', 'patient.delete', 'medical.view', 'medical.prescribe', 'medical.surgery', 'admin.users', 'admin.audit'];
        break;
      case 'attending_physician':
      case 'surgeon':
        jediRank = 'master';
        userRole = 'doctor';
        permissions = ['patient.view', 'patient.edit', 'medical.view', 'medical.prescribe', 'medical.surgery'];
        break;
      case 'resident':
        jediRank = 'knight';
        userRole = 'doctor';
        permissions = ['patient.view', 'patient.edit', 'medical.view', 'medical.prescribe'];
        break;
      case 'registered_nurse':
      case 'nurse_practitioner':
        jediRank = 'knight';
        userRole = 'nurse';
        permissions = ['patient.view', 'patient.edit', 'medical.view'];
        break;
      case 'administrator':
        jediRank = 'master';
        userRole = 'admin';
        permissions = ['patient.view', 'admin.users', 'admin.roles', 'admin.settings', 'admin.audit'];
        break;
      default:
        jediRank = 'padawan';
        userRole = 'staff';
        permissions = ['patient.view'];
    }
    
    const session: JediUserSession = {
      id: 'new_user_' + Math.random().toString(36).substring(2, 15),
      email: data.email,
      name: data.name,
      jediRank,
      userRole,
      hospitalRoles: [data.hospitalRole],
      groups: [],
      permissions,
      provider: data.provider,
      accessToken: 'new_at_' + Math.random().toString(36).substring(2, 30),
      refreshToken: 'new_rt_' + Math.random().toString(36).substring(2, 30),
      idToken: 'new_id_' + Math.random().toString(36).substring(2, 30),
      expiresAt: Date.now() + 3600000,
      issuedAt: Date.now(),
      lastActivity: Date.now(),
      devices: [deviceId],
      mfaEnabled: false,
      verified: false, // Needs email verification
    };
    
    await saveSession(session);
    return session;
  } catch (error) {
    console.error('Registration failed:', error);
    return null;
  }
};

// Refresh Session
export const refreshSession = async (session: JediUserSession): Promise<JediUserSession | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const refreshedSession: JediUserSession = {
      ...session,
      accessToken: 'refreshed_at_' + Math.random().toString(36).substring(2, 30),
      expiresAt: Date.now() + 3600000,
      lastActivity: Date.now(),
    };
    
    await saveSession(refreshedSession);
    return refreshedSession;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
};

// Save Session
export const saveSession = async (session: JediUserSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      idToken: session.idToken,
    }));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

// Get Current Session
export const getCurrentSession = async (): Promise<JediUserSession | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.session);
    if (sessionData) {
      const session: JediUserSession = JSON.parse(sessionData);
      if (session.expiresAt > Date.now()) {
        return session;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.session,
      STORAGE_KEYS.tokens,
    ]);
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// Check Permission
export const hasPermission = (session: JediUserSession | null, permission: string): boolean => {
  if (!session) return false;
  return session.permissions.includes(permission) || session.permissions.includes('*');
};

// Check Role
export const hasRole = (session: JediUserSession | null, role: UserRole): boolean => {
  if (!session) return false;
  return session.userRole === role || session.userRole === 'admin';
};

// Check Hospital Role
export const hasHospitalRole = (session: JediUserSession | null, role: HospitalRole): boolean => {
  if (!session) return false;
  return session.hospitalRoles.includes(role);
};

// Check JEDI Rank
export const hasJediRank = (session: JediUserSession | null, minRank: JediRank): boolean => {
  if (!session) return false;
  const rankOrder: JediRank[] = ['youngling', 'padawan', 'knight', 'master', 'council', 'grandmaster'];
  const userRankIndex = rankOrder.indexOf(session.jediRank);
  const minRankIndex = rankOrder.indexOf(minRank);
  return userRankIndex >= minRankIndex;
};

// Update Activity
export const updateActivity = async (): Promise<void> => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.session);
    if (sessionData) {
      const session: JediUserSession = JSON.parse(sessionData);
      session.lastActivity = Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    }
  } catch (error) {
    console.error('Failed to update activity:', error);
  }
};

// Get Auth URL for Provider
export const getAuthUrl = (provider: AuthProvider): string => {
  switch (provider) {
    case 'jedi':
      return `${SSO_CONFIG.issuer}/authorize?client_id=${SSO_CONFIG.clientId}&redirect_uri=${SSO_CONFIG.redirectUri}&scope=${SSO_CONFIG.scopes.join(' ')}&response_type=code`;
    case 'microsoft':
      return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
    case 'google':
      return 'https://accounts.google.com/o/oauth2/v2/auth';
    case 'apple':
      return 'https://appleid.apple.com/auth/authorize';
    default:
      return '';
  }
};

export default {
  initializeSSO,
  loginWithJediSSO,
  loginWithMicrosoft,
  loginWithGoogle,
  loginWithApple,
  registerUser,
  refreshSession,
  getCurrentSession,
  logout,
  hasPermission,
  hasRole,
  hasHospitalRole,
  hasJediRank,
  updateActivity,
  getAuthUrl,
  getDeviceId,
};
