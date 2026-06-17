/**
 * MediVac One Production API Service
 * Comprehensive API client for all production endpoints
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export interface APIConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
}

const DEFAULT_CONFIG: APIConfig = {
  baseUrl: 'https://api.medivac.one',
  version: 'v1',
  timeout: 30000,
  retryAttempts: 3,
  rateLimitPerMinute: 100,
};

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface APIUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'staff' | 'patient';
  permissions: string[];
  hospitalId: string;
  departmentId?: string;
  lastLogin: string;
  mfaEnabled: boolean;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

export interface APIMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  requestId: string;
  processingTime: number;
}

// Rate Limiting
interface RateLimitState {
  requests: number;
  windowStart: number;
  blocked: boolean;
  retryAfter?: number;
}

// Request Queue for Offline Support
interface QueuedRequest {
  id: string;
  method: string;
  endpoint: string;
  body?: unknown;
  timestamp: number;
  retries: number;
  priority: 'high' | 'normal' | 'low';
}

class ProductionAPIService {
  private config: APIConfig;
  private tokens: AuthTokens | null = null;
  private rateLimitState: RateLimitState = {
    requests: 0,
    windowStart: Date.now(),
    blocked: false,
  };
  private requestQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<APIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadTokens();
    this.startQueueProcessor();
  }

  // ==========================================
  // Authentication
  // ==========================================

  async login(email: string, password: string, mfaCode?: string): Promise<APIResponse<{ user: APIUser; tokens: AuthTokens }>> {
    const response = await this.request<{ user: APIUser; tokens: AuthTokens }>('POST', '/auth/login', {
      email,
      password,
      mfaCode,
    });

    if (response.success && response.data) {
      this.tokens = response.data.tokens;
      await this.saveTokens();
    }

    return response;
  }

  async logout(): Promise<void> {
    if (this.tokens) {
      await this.request('POST', '/auth/logout', { refreshToken: this.tokens.refreshToken });
    }
    this.tokens = null;
    await AsyncStorage.removeItem('medivac_auth_tokens');
  }

  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;

    const response = await this.request<AuthTokens>('POST', '/auth/refresh', {
      refreshToken: this.tokens.refreshToken,
    });

    if (response.success && response.data) {
      this.tokens = response.data;
      await this.saveTokens();
      return true;
    }

    return false;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    hospitalId: string;
    role: string;
  }): Promise<APIResponse<{ user: APIUser; tokens: AuthTokens }>> {
    return this.request('POST', '/auth/register', data);
  }

  async forgotPassword(email: string): Promise<APIResponse<{ message: string }>> {
    return this.request('POST', '/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<APIResponse<{ message: string }>> {
    return this.request('POST', '/auth/reset-password', { token, newPassword });
  }

  async enableMFA(): Promise<APIResponse<{ secret: string; qrCode: string }>> {
    return this.request('POST', '/auth/mfa/enable');
  }

  async verifyMFA(code: string): Promise<APIResponse<{ verified: boolean }>> {
    return this.request('POST', '/auth/mfa/verify', { code });
  }

  // ==========================================
  // Patient Management
  // ==========================================

  async getPatients(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
    departmentId?: string;
  }): Promise<APIResponse<Patient[]>> {
    return this.request('GET', '/patients', undefined, params);
  }

  async getPatient(id: string): Promise<APIResponse<Patient>> {
    return this.request('GET', `/patients/${id}`);
  }

  async createPatient(data: CreatePatientData): Promise<APIResponse<Patient>> {
    return this.request('POST', '/patients', data);
  }

  async updatePatient(id: string, data: Partial<Patient>): Promise<APIResponse<Patient>> {
    return this.request('PATCH', `/patients/${id}`, data);
  }

  async deletePatient(id: string): Promise<APIResponse<void>> {
    return this.request('DELETE', `/patients/${id}`);
  }

  async getPatientVitals(patientId: string): Promise<APIResponse<Vital[]>> {
    return this.request('GET', `/patients/${patientId}/vitals`);
  }

  async recordVitals(patientId: string, vitals: RecordVitalsData): Promise<APIResponse<Vital>> {
    return this.request('POST', `/patients/${patientId}/vitals`, vitals);
  }

  // ==========================================
  // Clinical Orders (CPOE)
  // ==========================================

  async getOrders(params?: {
    patientId?: string;
    status?: string;
    orderType?: string;
    page?: number;
  }): Promise<APIResponse<ClinicalOrder[]>> {
    return this.request('GET', '/orders', undefined, params);
  }

  async createOrder(data: CreateOrderData): Promise<APIResponse<ClinicalOrder>> {
    return this.request('POST', '/orders', data);
  }

  async updateOrder(id: string, data: Partial<ClinicalOrder>): Promise<APIResponse<ClinicalOrder>> {
    return this.request('PATCH', `/orders/${id}`, data);
  }

  async verifyOrder(id: string, verificationData: OrderVerificationData): Promise<APIResponse<ClinicalOrder>> {
    return this.request('POST', `/orders/${id}/verify`, verificationData);
  }

  async discontinueOrder(id: string, reason: string): Promise<APIResponse<ClinicalOrder>> {
    return this.request('POST', `/orders/${id}/discontinue`, { reason });
  }

  async checkDrugInteractions(medications: string[]): Promise<APIResponse<DrugInteraction[]>> {
    return this.request('POST', '/orders/check-interactions', { medications });
  }

  // ==========================================
  // Infection Control
  // ==========================================

  async getInfectionCases(params?: {
    status?: string;
    haiType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<APIResponse<InfectionCase[]>> {
    return this.request('GET', '/infection-control/cases', undefined, params);
  }

  async createInfectionCase(data: CreateInfectionCaseData): Promise<APIResponse<InfectionCase>> {
    return this.request('POST', '/infection-control/cases', data);
  }

  async updateInfectionCase(id: string, data: Partial<InfectionCase>): Promise<APIResponse<InfectionCase>> {
    return this.request('PATCH', `/infection-control/cases/${id}`, data);
  }

  async getOutbreaks(): Promise<APIResponse<Outbreak[]>> {
    return this.request('GET', '/infection-control/outbreaks');
  }

  async createOutbreak(data: CreateOutbreakData): Promise<APIResponse<Outbreak>> {
    return this.request('POST', '/infection-control/outbreaks', data);
  }

  async getInfectionRates(params?: { period?: string }): Promise<APIResponse<InfectionRates>> {
    return this.request('GET', '/infection-control/rates', undefined, params);
  }

  async submitNHSNReport(data: NHSNReportData): Promise<APIResponse<{ reportId: string }>> {
    return this.request('POST', '/infection-control/nhsn-report', data);
  }

  // ==========================================
  // Patient Satisfaction
  // ==========================================

  async getSurveyTemplates(): Promise<APIResponse<SurveyTemplate[]>> {
    return this.request('GET', '/satisfaction/templates');
  }

  async createSurveyTemplate(data: CreateSurveyTemplateData): Promise<APIResponse<SurveyTemplate>> {
    return this.request('POST', '/satisfaction/templates', data);
  }

  async getSurveyResponses(params?: {
    templateId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<APIResponse<SurveyResponse[]>> {
    return this.request('GET', '/satisfaction/responses', undefined, params);
  }

  async submitSurveyResponse(data: SubmitSurveyData): Promise<APIResponse<SurveyResponse>> {
    return this.request('POST', '/satisfaction/responses', data);
  }

  async getSatisfactionMetrics(params?: { period?: string }): Promise<APIResponse<SatisfactionMetrics>> {
    return this.request('GET', '/satisfaction/metrics', undefined, params);
  }

  // ==========================================
  // Staff Management
  // ==========================================

  async getStaff(params?: {
    departmentId?: string;
    role?: string;
    status?: string;
  }): Promise<APIResponse<StaffMember[]>> {
    return this.request('GET', '/staff', undefined, params);
  }

  async getStaffMember(id: string): Promise<APIResponse<StaffMember>> {
    return this.request('GET', `/staff/${id}`);
  }

  async updateStaffMember(id: string, data: Partial<StaffMember>): Promise<APIResponse<StaffMember>> {
    return this.request('PATCH', `/staff/${id}`, data);
  }

  async getStaffSchedule(staffId: string, params?: { weekOf?: string }): Promise<APIResponse<Schedule[]>> {
    return this.request('GET', `/staff/${staffId}/schedule`, undefined, params);
  }

  // ==========================================
  // Inventory Management
  // ==========================================

  async getInventory(params?: {
    category?: string;
    lowStock?: boolean;
    search?: string;
  }): Promise<APIResponse<InventoryItem[]>> {
    return this.request('GET', '/inventory', undefined, params);
  }

  async updateInventory(id: string, data: Partial<InventoryItem>): Promise<APIResponse<InventoryItem>> {
    return this.request('PATCH', `/inventory/${id}`, data);
  }

  async recordInventoryTransaction(data: InventoryTransactionData): Promise<APIResponse<InventoryTransaction>> {
    return this.request('POST', '/inventory/transactions', data);
  }

  // ==========================================
  // Analytics & Reporting
  // ==========================================

  async getDashboardMetrics(): Promise<APIResponse<DashboardMetrics>> {
    return this.request('GET', '/analytics/dashboard');
  }

  async generateReport(reportType: string, params: ReportParams): Promise<APIResponse<Report>> {
    return this.request('POST', '/analytics/reports', { reportType, params });
  }

  async getReportStatus(reportId: string): Promise<APIResponse<ReportStatus>> {
    return this.request('GET', `/analytics/reports/${reportId}/status`);
  }

  async downloadReport(reportId: string): Promise<APIResponse<{ downloadUrl: string }>> {
    return this.request('GET', `/analytics/reports/${reportId}/download`);
  }

  // ==========================================
  // Notifications
  // ==========================================

  async getNotifications(params?: { unreadOnly?: boolean }): Promise<APIResponse<Notification[]>> {
    return this.request('GET', '/notifications', undefined, params);
  }

  async markNotificationRead(id: string): Promise<APIResponse<void>> {
    return this.request('POST', `/notifications/${id}/read`);
  }

  async markAllNotificationsRead(): Promise<APIResponse<void>> {
    return this.request('POST', '/notifications/read-all');
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<APIResponse<void>> {
    return this.request('PUT', '/notifications/preferences', preferences);
  }

  // ==========================================
  // Webhooks
  // ==========================================

  async getWebhooks(): Promise<APIResponse<Webhook[]>> {
    return this.request('GET', '/webhooks');
  }

  async createWebhook(data: CreateWebhookData): Promise<APIResponse<Webhook>> {
    return this.request('POST', '/webhooks', data);
  }

  async updateWebhook(id: string, data: Partial<Webhook>): Promise<APIResponse<Webhook>> {
    return this.request('PATCH', `/webhooks/${id}`, data);
  }

  async deleteWebhook(id: string): Promise<APIResponse<void>> {
    return this.request('DELETE', `/webhooks/${id}`);
  }

  async testWebhook(id: string): Promise<APIResponse<WebhookTestResult>> {
    return this.request('POST', `/webhooks/${id}/test`);
  }

  // ==========================================
  // System Health & Admin
  // ==========================================

  async getSystemHealth(): Promise<APIResponse<SystemHealth>> {
    return this.request('GET', '/system/health');
  }

  async getSystemMetrics(): Promise<APIResponse<SystemMetrics>> {
    return this.request('GET', '/system/metrics');
  }

  async getAuditLogs(params?: {
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<APIResponse<AuditLog[]>> {
    return this.request('GET', '/system/audit-logs', undefined, params);
  }

  // ==========================================
  // Core Request Handler
  // ==========================================

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, unknown>
  ): Promise<APIResponse<T>> {
    // Check rate limiting
    if (this.isRateLimited()) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
        },
      };
    }

    // Check if offline and queue request
    if (!this.isOnline && method !== 'GET') {
      this.queueRequest(method, endpoint, body);
      return {
        success: true,
        meta: {
          requestId: this.generateRequestId(),
          processingTime: 0,
        },
      };
    }

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders();
    const requestId = this.generateRequestId();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.updateRateLimit();

      // Handle token refresh
      if (response.status === 401 && this.tokens) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          return this.request(method, endpoint, body, params);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'API_ERROR',
            message: data.message || 'An error occurred',
            details: data.details,
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
        meta: {
          ...data.meta,
          requestId,
          processingTime: data.processingTime || 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.config.baseUrl}/${this.config.version}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': this.config.version,
      'X-Client': 'MediVac-One-Mobile',
      'X-Client-Version': '4.0.0',
    };

    if (this.tokens?.accessToken) {
      headers['Authorization'] = `${this.tokens.tokenType} ${this.tokens.accessToken}`;
    }

    return headers;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==========================================
  // Rate Limiting
  // ==========================================

  private isRateLimited(): boolean {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    if (now - this.rateLimitState.windowStart > windowDuration) {
      this.rateLimitState = {
        requests: 0,
        windowStart: now,
        blocked: false,
      };
    }

    return this.rateLimitState.requests >= this.config.rateLimitPerMinute;
  }

  private updateRateLimit(): void {
    this.rateLimitState.requests++;
  }

  // ==========================================
  // Token Management
  // ==========================================

  private async loadTokens(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('medivac_auth_tokens');
      if (stored) {
        this.tokens = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async saveTokens(): Promise<void> {
    try {
      if (this.tokens) {
        await AsyncStorage.setItem('medivac_auth_tokens', JSON.stringify(this.tokens));
      }
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  // ==========================================
  // Offline Queue
  // ==========================================

  private queueRequest(method: string, endpoint: string, body?: unknown): void {
    const request: QueuedRequest = {
      id: this.generateRequestId(),
      method,
      endpoint,
      body,
      timestamp: Date.now(),
      retries: 0,
      priority: 'normal',
    };

    this.requestQueue.push(request);
    this.saveQueue();
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) return;

    const request = this.requestQueue.shift();
    if (!request) return;

    try {
      await this.request(request.method, request.endpoint, request.body);
      this.saveQueue();
    } catch (error) {
      if (request.retries < this.config.retryAttempts) {
        request.retries++;
        this.requestQueue.unshift(request);
      }
    }
  }

  private startQueueProcessor(): void {
    setInterval(() => this.processQueue(), 5000);
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('medivac_request_queue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  // ==========================================
  // Network State
  // ==========================================

  setOnlineState(online: boolean): void {
    this.isOnline = online;
    if (online) {
      this.processQueue();
    }
  }

  // ==========================================
  // Event Subscriptions
  // ==========================================

  subscribe(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// Type Definitions
export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: 'active' | 'discharged' | 'deceased';
  admissionDate?: string;
  dischargeDate?: string;
  roomNumber?: string;
  attendingPhysicianId?: string;
  diagnoses: string[];
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mrn?: string;
}

export interface Vital {
  id: string;
  patientId: string;
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  recordedBy: string;
  recordedAt: string;
}

export interface RecordVitalsData {
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface ClinicalOrder {
  id: string;
  patientId: string;
  orderType: string;
  status: string;
  priority: string;
  orderedBy: string;
  orderedAt: string;
  details: Record<string, unknown>;
}

export interface CreateOrderData {
  patientId: string;
  orderType: string;
  priority: string;
  details: Record<string, unknown>;
}

export interface OrderVerificationData {
  verifiedBy: string;
  notes?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: string;
  description: string;
}

export interface InfectionCase {
  id: string;
  patientId: string;
  haiType: string;
  status: string;
  onsetDate: string;
  resolvedDate?: string;
}

export interface CreateInfectionCaseData {
  patientId: string;
  haiType: string;
  onsetDate: string;
}

export interface Outbreak {
  id: string;
  pathogen: string;
  status: string;
  startDate: string;
  affectedCount: number;
}

export interface CreateOutbreakData {
  pathogen: string;
  startDate: string;
  description: string;
}

export interface InfectionRates {
  clabsi: number;
  cauti: number;
  ssi: number;
  vap: number;
}

export interface NHSNReportData {
  reportType: string;
  period: string;
  data: Record<string, unknown>;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  questions: unknown[];
  active: boolean;
}

export interface CreateSurveyTemplateData {
  name: string;
  questions: unknown[];
}

export interface SurveyResponse {
  id: string;
  templateId: string;
  patientId: string;
  responses: Record<string, unknown>;
  submittedAt: string;
}

export interface SubmitSurveyData {
  templateId: string;
  patientId: string;
  responses: Record<string, unknown>;
}

export interface SatisfactionMetrics {
  overallScore: number;
  nps: number;
  responseRate: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  status: string;
}

export interface Schedule {
  id: string;
  staffId: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
}

export interface InventoryTransactionData {
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  timestamp: string;
}

export interface DashboardMetrics {
  totalPatients: number;
  admissionsToday: number;
  dischargesToday: number;
  occupancyRate: number;
}

export interface ReportParams {
  dateFrom: string;
  dateTo: string;
  filters?: Record<string, unknown>;
}

export interface Report {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface ReportStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: Record<string, boolean>;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
}

export interface CreateWebhookData {
  url: string;
  events: string[];
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, { status: string; latency: number }>;
  uptime: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  activeConnections: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
}

// Export singleton instance
export const productionAPI = new ProductionAPIService();

// Export class for custom instances
export { ProductionAPIService };
