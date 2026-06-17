/**
 * MediVac One - Claris Connect Integration Service
 * FileMaker Data API and Claris Platform integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface ClarisConfig {
  host: string;
  database: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  version: string;
}

export interface ClarisToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
}

export interface ClarisUser {
  id: string;
  accountName: string;
  privilegeSet: string;
  extendedPrivileges: string[];
  lastLogin?: string;
}

export interface FileMakerRecord {
  recordId: string;
  modId: string;
  fieldData: Record<string, unknown>;
  portalData?: Record<string, FileMakerPortalRow[]>;
}

export interface FileMakerPortalRow {
  recordId: string;
  modId: string;
  [key: string]: unknown;
}

export interface FileMakerLayout {
  name: string;
  table: string;
  fields: FileMakerField[];
  portals: FileMakerPortal[];
}

export interface FileMakerField {
  name: string;
  type: 'text' | 'number' | 'date' | 'time' | 'timestamp' | 'container';
  displayType: string;
  result: string;
  global: boolean;
  autoEnter: boolean;
  fourDigitYear: boolean;
  maxRepeat: number;
  maxCharacters: number;
  notEmpty: boolean;
  numeric: boolean;
  timeOfDay: boolean;
  repetitionStart: number;
  repetitionEnd: number;
}

export interface FileMakerPortal {
  name: string;
  table: string;
  fields: FileMakerField[];
}

export interface FileMakerScript {
  name: string;
  isFolder: boolean;
  folderScriptNames?: string[];
}

export interface FileMakerFindRequest {
  [fieldName: string]: string | number | { omit: boolean; [fieldName: string]: string | number | boolean };
}

export interface FileMakerSortOrder {
  fieldName: string;
  sortOrder: 'ascend' | 'descend';
}

export interface ClarisWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  createdAt: string;
}

export interface ClarisFlow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  trigger: {
    type: 'webhook' | 'schedule' | 'manual';
    config: Record<string, unknown>;
  };
  actions: ClarisFlowAction[];
  lastRun?: string;
  runCount: number;
}

export interface ClarisFlowAction {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  order: number;
}

export interface ContainerData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  data?: string; // Base64 encoded
  url?: string;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  CLARIS_TOKEN: 'claris_connect_token',
  CLARIS_USER: 'claris_connect_user',
  CLARIS_SESSION: 'claris_session_token',
};

const DEFAULT_CONFIG: ClarisConfig = {
  host: 'https://fms.jeditek.com.au',
  database: 'MediVacOne',
  clientId: 'medivac-one-claris-client',
  redirectUri: 'medivac://auth/claris/callback',
  version: 'vLatest',
};

// ==========================================
// Claris Connect Service
// ==========================================

class ClarisConnectService {
  private config: ClarisConfig;
  private currentToken: ClarisToken | null = null;
  private currentUser: ClarisUser | null = null;
  private sessionToken: string | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<ClarisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.CLARIS_TOKEN);
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.CLARIS_USER);
      const savedSession = await AsyncStorage.getItem(STORAGE_KEYS.CLARIS_SESSION);
      
      if (savedToken && savedUser) {
        this.currentToken = JSON.parse(savedToken);
        this.currentUser = JSON.parse(savedUser);
        this.sessionToken = savedSession;
        
        if (this.isTokenValid()) {
          this.scheduleTokenRefresh();
          this.emit('session_restored', { user: this.currentUser, token: this.currentToken });
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Claris Connect:', error);
    }
  }

  // ==========================================
  // Authentication
  // ==========================================

  getClarisIdAuthUrl(): string {
    const state = this.generateRandomString(32);
    AsyncStorage.setItem('claris_auth_state', state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email fmrest',
      state,
    });

    return `https://www.claris.com/oauth/authorize?${params.toString()}`;
  }

  async handleClarisIdCallback(callbackUrl: string): Promise<ClarisUser> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const savedState = await AsyncStorage.getItem('claris_auth_state');
    if (savedState !== state) {
      throw new Error('State mismatch');
    }

    const token = await this.exchangeCodeForToken(code!);
    this.currentToken = token;

    const user = await this.fetchUserInfo();
    this.currentUser = user;

    // Get FileMaker Data API session
    await this.createDataAPISession();

    await this.saveSession();
    await AsyncStorage.removeItem('claris_auth_state');
    this.scheduleTokenRefresh();

    this.emit('login_success', { user, token });
    return user;
  }

  async loginWithCredentials(username: string, password: string): Promise<ClarisUser> {
    // FileMaker Data API basic auth
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const expiresIn = 900; // 15 minutes for Data API

    this.sessionToken = `fms_session_${this.generateRandomString(32)}`;
    
    this.currentToken = {
      accessToken: this.sessionToken,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
    };

    this.currentUser = {
      id: `claris_${this.generateRandomString(16)}`,
      accountName: username,
      privilegeSet: '[Full Access]',
      extendedPrivileges: ['fmrest', 'fmwebdirect', 'fmapp'],
      lastLogin: now.toISOString(),
    };

    await this.saveSession();
    this.scheduleTokenRefresh();

    this.emit('login_success', { user: this.currentUser, token: this.currentToken });
    return this.currentUser;
  }

  private async exchangeCodeForToken(code: string): Promise<ClarisToken> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const expiresIn = 3600;

    return {
      accessToken: `claris_access_${this.generateRandomString(32)}`,
      refreshToken: `claris_refresh_${this.generateRandomString(32)}`,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
    };
  }

  private async fetchUserInfo(): Promise<ClarisUser> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `claris_${this.generateRandomString(16)}`,
      accountName: 'claris_user',
      privilegeSet: '[Full Access]',
      extendedPrivileges: ['fmrest', 'fmwebdirect', 'fmapp'],
      lastLogin: new Date().toISOString(),
    };
  }

  private async createDataAPISession(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.sessionToken = `fms_session_${this.generateRandomString(32)}`;
    await AsyncStorage.setItem(STORAGE_KEYS.CLARIS_SESSION, this.sessionToken);
  }

  // ==========================================
  // FileMaker Data API Operations
  // ==========================================

  async getLayouts(): Promise<FileMakerLayout[]> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        name: 'Patients',
        table: 'Patients',
        fields: [
          { name: 'PatientID', type: 'text', displayType: 'editText', result: 'text', global: false, autoEnter: true, fourDigitYear: false, maxRepeat: 1, maxCharacters: 0, notEmpty: true, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
          { name: 'FirstName', type: 'text', displayType: 'editText', result: 'text', global: false, autoEnter: false, fourDigitYear: false, maxRepeat: 1, maxCharacters: 100, notEmpty: true, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
          { name: 'LastName', type: 'text', displayType: 'editText', result: 'text', global: false, autoEnter: false, fourDigitYear: false, maxRepeat: 1, maxCharacters: 100, notEmpty: true, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
          { name: 'DateOfBirth', type: 'date', displayType: 'editText', result: 'date', global: false, autoEnter: false, fourDigitYear: true, maxRepeat: 1, maxCharacters: 0, notEmpty: false, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
        ],
        portals: [
          { name: 'Appointments', table: 'Appointments', fields: [] },
          { name: 'MedicalHistory', table: 'MedicalHistory', fields: [] },
        ],
      },
      {
        name: 'Appointments',
        table: 'Appointments',
        fields: [
          { name: 'AppointmentID', type: 'text', displayType: 'editText', result: 'text', global: false, autoEnter: true, fourDigitYear: false, maxRepeat: 1, maxCharacters: 0, notEmpty: true, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
          { name: 'PatientID', type: 'text', displayType: 'editText', result: 'text', global: false, autoEnter: false, fourDigitYear: false, maxRepeat: 1, maxCharacters: 0, notEmpty: true, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
          { name: 'DateTime', type: 'timestamp', displayType: 'editText', result: 'timestamp', global: false, autoEnter: false, fourDigitYear: true, maxRepeat: 1, maxCharacters: 0, notEmpty: true, numeric: false, timeOfDay: false, repetitionStart: 1, repetitionEnd: 1 },
        ],
        portals: [],
      },
    ];
  }

  async getScripts(): Promise<FileMakerScript[]> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      { name: 'CreatePatient', isFolder: false },
      { name: 'UpdatePatient', isFolder: false },
      { name: 'DeletePatient', isFolder: false },
      { name: 'SyncWithMediVac', isFolder: false },
      { name: 'GenerateReport', isFolder: false },
      { name: 'Patient Scripts', isFolder: true, folderScriptNames: ['CreatePatient', 'UpdatePatient', 'DeletePatient'] },
      { name: 'Integration Scripts', isFolder: true, folderScriptNames: ['SyncWithMediVac'] },
    ];
  }

  async findRecords(layout: string, query: FileMakerFindRequest[], options?: { sort?: FileMakerSortOrder[]; limit?: number; offset?: number }): Promise<FileMakerRecord[]> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    // Simulate found records
    return [
      {
        recordId: '1',
        modId: '1',
        fieldData: {
          PatientID: 'PAT001',
          FirstName: 'John',
          LastName: 'Smith',
          DateOfBirth: '1985-03-15',
        },
      },
      {
        recordId: '2',
        modId: '1',
        fieldData: {
          PatientID: 'PAT002',
          FirstName: 'Mary',
          LastName: 'Johnson',
          DateOfBirth: '1990-07-22',
        },
      },
    ];
  }

  async getRecord(layout: string, recordId: string): Promise<FileMakerRecord> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      recordId,
      modId: '1',
      fieldData: {
        PatientID: 'PAT001',
        FirstName: 'John',
        LastName: 'Smith',
        DateOfBirth: '1985-03-15',
        Email: 'john.smith@email.com',
        Phone: '+61 400 000 001',
      },
      portalData: {
        Appointments: [
          { recordId: '101', modId: '1', DateTime: new Date().toISOString(), Type: 'Checkup' },
        ],
      },
    };
  }

  async createRecord(layout: string, fieldData: Record<string, unknown>): Promise<{ recordId: string; modId: string }> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    const recordId = Math.floor(Math.random() * 10000).toString();
    this.emit('record_created', { layout, recordId, fieldData });

    return { recordId, modId: '1' };
  }

  async updateRecord(layout: string, recordId: string, fieldData: Record<string, unknown>, modId?: string): Promise<{ modId: string }> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    const newModId = ((parseInt(modId || '1') || 1) + 1).toString();
    this.emit('record_updated', { layout, recordId, fieldData, modId: newModId });

    return { modId: newModId };
  }

  async deleteRecord(layout: string, recordId: string): Promise<void> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 200));
    this.emit('record_deleted', { layout, recordId });
  }

  async executeScript(scriptName: string, parameter?: string): Promise<{ scriptResult?: string; scriptError?: string }> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 400));

    this.emit('script_executed', { scriptName, parameter });

    return {
      scriptResult: JSON.stringify({ success: true, message: `Script ${scriptName} executed successfully` }),
    };
  }

  // ==========================================
  // Container Field Operations
  // ==========================================

  async uploadContainer(layout: string, recordId: string, fieldName: string, file: { name: string; data: string; mimeType: string }): Promise<void> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 500));
    this.emit('container_uploaded', { layout, recordId, fieldName, fileName: file.name });
  }

  async downloadContainer(layout: string, recordId: string, fieldName: string): Promise<ContainerData> {
    if (!this.sessionToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      fileName: 'document.pdf',
      fileSize: 25600,
      mimeType: 'application/pdf',
      url: `${this.config.host}/Streaming_SSL/MainDB/${layout}/${recordId}/${fieldName}`,
    };
  }

  // ==========================================
  // Claris Connect Flows
  // ==========================================

  async getFlows(): Promise<ClarisFlow[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'flow_001',
        name: 'Patient Sync to MediVac',
        description: 'Syncs patient records from FileMaker to MediVac One',
        status: 'active',
        trigger: { type: 'webhook', config: { path: '/patient-created' } },
        actions: [
          { id: 'action_001', type: 'transform', name: 'Map Fields', config: {}, order: 1 },
          { id: 'action_002', type: 'http', name: 'POST to MediVac API', config: { method: 'POST', url: '/api/patients' }, order: 2 },
        ],
        lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        runCount: 156,
      },
      {
        id: 'flow_002',
        name: 'Appointment Notification',
        description: 'Sends notifications for upcoming appointments',
        status: 'active',
        trigger: { type: 'schedule', config: { cron: '0 8 * * *' } },
        actions: [
          { id: 'action_003', type: 'filemaker', name: 'Find Appointments', config: { layout: 'Appointments' }, order: 1 },
          { id: 'action_004', type: 'email', name: 'Send Reminders', config: {}, order: 2 },
        ],
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        runCount: 45,
      },
    ];
  }

  async triggerFlow(flowId: string, data?: Record<string, unknown>): Promise<{ runId: string }> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 400));

    const runId = `run_${this.generateRandomString(16)}`;
    this.emit('flow_triggered', { flowId, runId, data });

    return { runId };
  }

  // ==========================================
  // Webhooks
  // ==========================================

  async getWebhooks(): Promise<ClarisWebhook[]> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        id: 'webhook_001',
        name: 'Patient Created',
        url: 'https://api.medivac.one/webhooks/patient-created',
        events: ['record.create'],
        active: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'webhook_002',
        name: 'Appointment Updated',
        url: 'https://api.medivac.one/webhooks/appointment-updated',
        events: ['record.update'],
        active: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async createWebhook(webhook: Omit<ClarisWebhook, 'id' | 'createdAt'>): Promise<ClarisWebhook> {
    if (!this.currentToken) throw new Error('Not authenticated');

    await new Promise(resolve => setTimeout(resolve, 300));

    const newWebhook: ClarisWebhook = {
      ...webhook,
      id: `webhook_${this.generateRandomString(8)}`,
      createdAt: new Date().toISOString(),
    };

    this.emit('webhook_created', newWebhook);
    return newWebhook;
  }

  // ==========================================
  // Session Management
  // ==========================================

  private async saveSession(): Promise<void> {
    if (this.currentToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.CLARIS_TOKEN, JSON.stringify(this.currentToken));
    }
    if (this.currentUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.CLARIS_USER, JSON.stringify(this.currentUser));
    }
    if (this.sessionToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.CLARIS_SESSION, this.sessionToken);
    }
  }

  private async clearSession(): Promise<void> {
    this.currentToken = null;
    this.currentUser = null;
    this.sessionToken = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CLARIS_TOKEN,
      STORAGE_KEYS.CLARIS_USER,
      STORAGE_KEYS.CLARIS_SESSION,
    ]);
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
    const refreshIn = Math.max(0, expiresAt.getTime() - now.getTime() - 2 * 60 * 1000); // 2 minutes before expiry

    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refreshSession(), refreshIn);
  }

  async refreshSession(): Promise<void> {
    try {
      await this.createDataAPISession();
      
      const now = new Date();
      const expiresIn = 900;

      if (this.currentToken) {
        this.currentToken = {
          ...this.currentToken,
          accessToken: this.sessionToken!,
          expiresIn,
          expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
        };
      }

      await this.saveSession();
      this.scheduleTokenRefresh();
      this.emit('session_refreshed', this.currentToken);
    } catch (error) {
      this.emit('session_expired', error);
      await this.clearSession();
    }
  }

  async logout(): Promise<void> {
    // Release Data API session
    if (this.sessionToken) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    await this.clearSession();
    this.emit('logout', null);
  }

  // ==========================================
  // Getters
  // ==========================================

  getCurrentUser(): ClarisUser | null { return this.currentUser; }
  getAccessToken(): string | null { return this.currentToken?.accessToken || null; }
  getSessionToken(): string | null { return this.sessionToken; }
  isAuthenticated(): boolean { return this.isTokenValid() && !!this.sessionToken; }
  getConfig(): ClarisConfig { return { ...this.config }; }

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

export const clarisConnect = new ClarisConnectService();

export default ClarisConnectService;
