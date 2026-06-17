/**
 * MediVac One - Medicare Online Eclipse API Service
 * Services Australia Eclipse API integration for real-time Medicare claiming
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type EclipseEnvironment = 'test' | 'production';
export type TransactionType = 'eligibility' | 'claim' | 'status' | 'payment' | 'verification' | 'bulk';
export type ClaimChannel = 'eclipse_online' | 'eclipse_proda' | 'hpos';

export interface EclipseCredentials {
  providerId: string;
  locationId: string;
  deviceId: string;
  certificateId: string;
  privateKey: string;
  environment: EclipseEnvironment;
  expiresAt: string;
}

export interface EligibilityRequest {
  medicareNumber: string;
  medicareIRN: string;
  dateOfBirth: string;
  dateOfService: string;
  providerNumber: string;
}

export interface EligibilityResponse {
  transactionId: string;
  timestamp: string;
  eligible: boolean;
  medicareNumber: string;
  patientName: string;
  dateOfBirth: string;
  gender: string;
  cardStatus: 'current' | 'expired' | 'invalid';
  cardExpiryDate: string;
  concessionCard?: {
    type: 'pensioner' | 'healthcare' | 'commonwealth_seniors';
    number: string;
    expiryDate: string;
  };
  safetyNet: {
    originalThresholdReached: boolean;
    extendedThresholdReached: boolean;
    originalThresholdDate?: string;
    extendedThresholdDate?: string;
  };
  fundDetails?: {
    fundCode: string;
    fundName: string;
    memberNumber: string;
  };
  errors?: EclipseError[];
}

export interface OnlineClaimRequest {
  claimId: string;
  providerNumber: string;
  payeeProvider: string;
  patientDetails: {
    medicareNumber: string;
    medicareIRN: string;
    dateOfBirth: string;
    patientName: string;
  };
  serviceDetails: {
    dateOfService: string;
    itemNumber: string;
    chargeAmount: number;
    benefitAssigned: boolean;
    referralDetails?: {
      providerNumber: string;
      referralDate: string;
      referralPeriod: number;
    };
    hospitalIndicator: boolean;
    duplicateServiceOverride: boolean;
    accountReferenceNumber?: string;
  }[];
  claimantDetails?: {
    name: string;
    address: string;
    bankDetails?: {
      bsb: string;
      accountNumber: string;
      accountName: string;
    };
  };
}

export interface OnlineClaimResponse {
  transactionId: string;
  timestamp: string;
  claimId: string;
  status: 'accepted' | 'rejected' | 'pending' | 'partial';
  assessmentCode: string;
  assessmentMessage: string;
  benefitPaid: number;
  gapAmount: number;
  paymentMethod: 'eft' | 'cheque' | 'patient';
  paymentReference?: string;
  expectedPaymentDate?: string;
  serviceResults: {
    itemNumber: string;
    chargeAmount: number;
    benefitAmount: number;
    status: 'paid' | 'rejected' | 'adjusted';
    reasonCode?: string;
    reasonMessage?: string;
  }[];
  errors?: EclipseError[];
  warnings?: EclipseWarning[];
}

export interface ClaimStatusRequest {
  claimId?: string;
  transactionId?: string;
  dateRange?: { from: string; to: string };
  providerNumber: string;
}

export interface ClaimStatusResponse {
  transactionId: string;
  timestamp: string;
  claims: {
    claimId: string;
    originalTransactionId: string;
    status: 'processing' | 'paid' | 'rejected' | 'adjusted' | 'cancelled';
    lodgementDate: string;
    processedDate?: string;
    paidDate?: string;
    benefitAmount: number;
    paymentReference?: string;
    adjustmentReason?: string;
  }[];
}

export interface PaymentAdviceRequest {
  providerNumber: string;
  dateRange: { from: string; to: string };
  paymentReference?: string;
}

export interface PaymentAdvice {
  paymentReference: string;
  paymentDate: string;
  paymentMethod: 'eft' | 'cheque';
  totalAmount: number;
  bankDetails?: {
    bsb: string;
    accountNumber: string;
  };
  claims: {
    claimId: string;
    patientName: string;
    dateOfService: string;
    benefitPaid: number;
    adjustments?: number;
  }[];
}

export interface BulkBillClaimRequest {
  batchId: string;
  providerNumber: string;
  claims: {
    patientDetails: {
      medicareNumber: string;
      medicareIRN: string;
      dateOfBirth: string;
    };
    serviceDetails: {
      dateOfService: string;
      itemNumber: string;
    }[];
  }[];
}

export interface BulkBillResponse {
  transactionId: string;
  timestamp: string;
  batchId: string;
  totalClaims: number;
  acceptedClaims: number;
  rejectedClaims: number;
  totalBenefit: number;
  claimResults: {
    index: number;
    status: 'accepted' | 'rejected';
    benefitAmount?: number;
    errors?: EclipseError[];
  }[];
}

export interface EclipseError {
  code: string;
  severity: 'error' | 'fatal';
  field?: string;
  message: string;
}

export interface EclipseWarning {
  code: string;
  field?: string;
  message: string;
}

export interface TransactionLog {
  id: string;
  transactionId: string;
  type: TransactionType;
  channel: ClaimChannel;
  timestamp: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  status: 'success' | 'error';
  duration: number;
  providerNumber: string;
}

// ==========================================
// Eclipse Error Codes
// ==========================================

const ECLIPSE_ERROR_CODES: Record<string, string> = {
  '0000': 'Transaction successful',
  '0001': 'Invalid Medicare number',
  '0002': 'Medicare card expired',
  '0003': 'Patient not eligible for Medicare',
  '0004': 'Invalid provider number',
  '0005': 'Provider not registered for online claiming',
  '0006': 'Invalid item number',
  '0007': 'Item not claimable for this patient',
  '0008': 'Duplicate claim detected',
  '0009': 'Service date in future',
  '0010': 'Service date too old',
  '0011': 'Referral required',
  '0012': 'Referral expired',
  '0013': 'Invalid referral provider',
  '0014': 'Benefit already paid',
  '0015': 'Claim exceeds fee cap',
  '0016': 'Hospital indicator required',
  '0017': 'Multiple operation rule breach',
  '0018': 'Time-based item restriction',
  '0019': 'Age restriction for item',
  '0020': 'Gender restriction for item',
  '9001': 'System temporarily unavailable',
  '9002': 'Certificate validation failed',
  '9003': 'Request timeout',
  '9004': 'Rate limit exceeded',
  '9999': 'Unknown error',
};

// ==========================================
// Eclipse API Service
// ==========================================

class EclipseAPIService {
  private credentials: EclipseCredentials | null = null;
  private transactionLogs: TransactionLog[] = [];
  private isConnected: boolean = false;
  private environment: EclipseEnvironment = 'test';

  // API endpoints
  private readonly endpoints = {
    test: {
      eligibility: 'https://test.api.servicesaustralia.gov.au/eclipse/v1/eligibility',
      claim: 'https://test.api.servicesaustralia.gov.au/eclipse/v1/claim',
      status: 'https://test.api.servicesaustralia.gov.au/eclipse/v1/claim/status',
      payment: 'https://test.api.servicesaustralia.gov.au/eclipse/v1/payment',
      bulk: 'https://test.api.servicesaustralia.gov.au/eclipse/v1/bulk',
    },
    production: {
      eligibility: 'https://api.servicesaustralia.gov.au/eclipse/v1/eligibility',
      claim: 'https://api.servicesaustralia.gov.au/eclipse/v1/claim',
      status: 'https://api.servicesaustralia.gov.au/eclipse/v1/claim/status',
      payment: 'https://api.servicesaustralia.gov.au/eclipse/v1/payment',
      bulk: 'https://api.servicesaustralia.gov.au/eclipse/v1/bulk',
    },
  };

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const credentialsData = await AsyncStorage.getItem('eclipse_credentials');
      if (credentialsData) {
        this.credentials = JSON.parse(credentialsData);
        this.environment = this.credentials?.environment || 'test';
      }

      const logsData = await AsyncStorage.getItem('eclipse_transaction_logs');
      if (logsData) {
        this.transactionLogs = JSON.parse(logsData);
      }
    } catch (error) {
      console.error('Failed to load Eclipse API state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      if (this.credentials) {
        await AsyncStorage.setItem('eclipse_credentials', JSON.stringify(this.credentials));
      }
      await AsyncStorage.setItem('eclipse_transaction_logs', JSON.stringify(this.transactionLogs.slice(-1000)));
    } catch (error) {
      console.error('Failed to save Eclipse API state:', error);
    }
  }

  // ==========================================
  // Connection Management
  // ==========================================

  async connect(credentials: Omit<EclipseCredentials, 'expiresAt'>): Promise<boolean> {
    try {
      // Validate credentials with Services Australia
      const validationResult = await this.validateCredentials(credentials);
      
      if (validationResult.valid) {
        this.credentials = {
          ...credentials,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        this.environment = credentials.environment;
        this.isConnected = true;
        await this.saveState();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Eclipse connection failed:', error);
      return false;
    }
  }

  private async validateCredentials(credentials: Omit<EclipseCredentials, 'expiresAt'>): Promise<{ valid: boolean; message: string }> {
    // Simulate credential validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!credentials.providerId || !credentials.certificateId) {
      return { valid: false, message: 'Missing required credentials' };
    }
    
    return { valid: true, message: 'Credentials validated successfully' };
  }

  disconnect(): void {
    this.credentials = null;
    this.isConnected = false;
  }

  getConnectionStatus(): { connected: boolean; environment: EclipseEnvironment; expiresAt?: string } {
    return {
      connected: this.isConnected && !!this.credentials,
      environment: this.environment,
      expiresAt: this.credentials?.expiresAt,
    };
  }

  // ==========================================
  // Eligibility Checking
  // ==========================================

  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Validate Medicare number
      if (!this.validateMedicareNumber(request.medicareNumber)) {
        return this.createEligibilityError(transactionId, '0001');
      }

      // Simulate successful response
      const response: EligibilityResponse = {
        transactionId,
        timestamp: new Date().toISOString(),
        eligible: true,
        medicareNumber: request.medicareNumber,
        patientName: 'SMITH, John',
        dateOfBirth: request.dateOfBirth,
        gender: 'M',
        cardStatus: 'current',
        cardExpiryDate: '2026-12-31',
        safetyNet: {
          originalThresholdReached: false,
          extendedThresholdReached: false,
        },
      };

      // Add concession card randomly
      if (Math.random() > 0.7) {
        response.concessionCard = {
          type: 'pensioner',
          number: 'PEN' + Math.floor(Math.random() * 1000000),
          expiryDate: '2026-06-30',
        };
      }

      this.logTransaction('eligibility', transactionId, request as unknown as Record<string, unknown>, response as unknown as Record<string, unknown>, startTime);
      return response;
    } catch (error) {
      const errorResponse = this.createEligibilityError(transactionId, '9999');
      this.logTransaction('eligibility', transactionId, request as unknown as Record<string, unknown>, errorResponse as unknown as Record<string, unknown>, startTime, true);
      return errorResponse;
    }
  }

  private createEligibilityError(transactionId: string, errorCode: string): EligibilityResponse {
    return {
      transactionId,
      timestamp: new Date().toISOString(),
      eligible: false,
      medicareNumber: '',
      patientName: '',
      dateOfBirth: '',
      gender: '',
      cardStatus: 'invalid',
      cardExpiryDate: '',
      safetyNet: {
        originalThresholdReached: false,
        extendedThresholdReached: false,
      },
      errors: [{
        code: errorCode,
        severity: 'error',
        message: ECLIPSE_ERROR_CODES[errorCode] || 'Unknown error',
      }],
    };
  }

  // ==========================================
  // Online Claim Submission
  // ==========================================

  async submitClaim(request: OnlineClaimRequest): Promise<OnlineClaimResponse> {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    try {
      // Validate request
      const validationErrors = this.validateClaimRequest(request);
      if (validationErrors.length > 0) {
        return {
          transactionId,
          timestamp: new Date().toISOString(),
          claimId: request.claimId,
          status: 'rejected',
          assessmentCode: validationErrors[0].code,
          assessmentMessage: validationErrors[0].message,
          benefitPaid: 0,
          gapAmount: 0,
          paymentMethod: 'eft',
          serviceResults: [],
          errors: validationErrors,
        };
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Calculate benefits
      let totalBenefit = 0;
      const serviceResults = request.serviceDetails.map(service => {
        const benefitAmount = this.calculateBenefit(service.itemNumber, service.chargeAmount);
        totalBenefit += benefitAmount;
        
        return {
          itemNumber: service.itemNumber,
          chargeAmount: service.chargeAmount,
          benefitAmount,
          status: 'paid' as const,
        };
      });

      const response: OnlineClaimResponse = {
        transactionId,
        timestamp: new Date().toISOString(),
        claimId: request.claimId,
        status: 'accepted',
        assessmentCode: '0000',
        assessmentMessage: 'Claim processed successfully',
        benefitPaid: totalBenefit,
        gapAmount: request.serviceDetails.reduce((sum, s) => sum + s.chargeAmount, 0) - totalBenefit,
        paymentMethod: request.serviceDetails[0].benefitAssigned ? 'eft' : 'patient',
        paymentReference: `PAY${Date.now()}`,
        expectedPaymentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        serviceResults,
      };

      this.logTransaction('claim', transactionId, request as unknown as Record<string, unknown>, response as unknown as Record<string, unknown>, startTime);
      return response;
    } catch (error) {
      const errorResponse: OnlineClaimResponse = {
        transactionId,
        timestamp: new Date().toISOString(),
        claimId: request.claimId,
        status: 'rejected',
        assessmentCode: '9999',
        assessmentMessage: 'System error',
        benefitPaid: 0,
        gapAmount: 0,
        paymentMethod: 'eft',
        serviceResults: [],
        errors: [{ code: '9999', severity: 'fatal', message: 'System error occurred' }],
      };
      this.logTransaction('claim', transactionId, request as unknown as Record<string, unknown>, errorResponse as unknown as Record<string, unknown>, startTime, true);
      return errorResponse;
    }
  }

  private validateClaimRequest(request: OnlineClaimRequest): EclipseError[] {
    const errors: EclipseError[] = [];

    if (!this.validateMedicareNumber(request.patientDetails.medicareNumber)) {
      errors.push({ code: '0001', severity: 'error', field: 'medicareNumber', message: ECLIPSE_ERROR_CODES['0001'] });
    }

    if (!this.validateProviderNumber(request.providerNumber)) {
      errors.push({ code: '0004', severity: 'error', field: 'providerNumber', message: ECLIPSE_ERROR_CODES['0004'] });
    }

    const serviceDate = new Date(request.serviceDetails[0]?.dateOfService);
    if (serviceDate > new Date()) {
      errors.push({ code: '0009', severity: 'error', field: 'dateOfService', message: ECLIPSE_ERROR_CODES['0009'] });
    }

    return errors;
  }

  private calculateBenefit(itemNumber: string, chargeAmount: number): number {
    // Simplified benefit calculation (85% of schedule fee or charge, whichever is less)
    const scheduleFees: Record<string, number> = {
      '3': 18.20,
      '23': 41.40,
      '36': 80.10,
      '44': 117.75,
      '104': 90.75,
      '105': 45.40,
    };

    const scheduleFee = scheduleFees[itemNumber] || chargeAmount * 0.85;
    const benefit = Math.min(scheduleFee * 0.85, chargeAmount);
    return Math.round(benefit * 100) / 100;
  }

  // ==========================================
  // Claim Status Inquiry
  // ==========================================

  async getClaimStatus(request: ClaimStatusRequest): Promise<ClaimStatusResponse> {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      // Simulate claim status results
      const claims = [];
      const numClaims = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < numClaims; i++) {
        const statuses: Array<'processing' | 'paid' | 'rejected' | 'adjusted'> = ['processing', 'paid', 'paid', 'paid', 'rejected'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        claims.push({
          claimId: request.claimId || `CLM${Date.now()}_${i}`,
          originalTransactionId: `TXN${Date.now() - i * 100000}`,
          status,
          lodgementDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          processedDate: status !== 'processing' ? new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
          paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
          benefitAmount: status === 'paid' ? 35.19 + Math.random() * 50 : 0,
          paymentReference: status === 'paid' ? `PAY${Date.now() - i * 50000}` : undefined,
        });
      }

      const response: ClaimStatusResponse = {
        transactionId,
        timestamp: new Date().toISOString(),
        claims,
      };

      this.logTransaction('status', transactionId, request as unknown as Record<string, unknown>, response as unknown as Record<string, unknown>, startTime);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==========================================
  // Payment Advice
  // ==========================================

  async getPaymentAdvice(request: PaymentAdviceRequest): Promise<PaymentAdvice[]> {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      const payments: PaymentAdvice[] = [];
      const numPayments = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numPayments; i++) {
        const numClaims = Math.floor(Math.random() * 10) + 1;
        const claims = [];
        let totalAmount = 0;

        for (let j = 0; j < numClaims; j++) {
          const benefitPaid = 30 + Math.random() * 70;
          totalAmount += benefitPaid;
          claims.push({
            claimId: `CLM${Date.now()}_${i}_${j}`,
            patientName: `PATIENT ${j + 1}`,
            dateOfService: new Date(Date.now() - (j + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            benefitPaid: Math.round(benefitPaid * 100) / 100,
          });
        }

        payments.push({
          paymentReference: request.paymentReference || `PAY${Date.now()}_${i}`,
          paymentDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentMethod: 'eft',
          totalAmount: Math.round(totalAmount * 100) / 100,
          bankDetails: {
            bsb: '123-456',
            accountNumber: '****7890',
          },
          claims,
        });
      }

      this.logTransaction('payment', transactionId, request as unknown as Record<string, unknown>, { payments }, startTime);
      return payments;
    } catch (error) {
      throw error;
    }
  }

  // ==========================================
  // Bulk Billing
  // ==========================================

  async submitBulkBillClaims(request: BulkBillClaimRequest): Promise<BulkBillResponse> {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      let acceptedCount = 0;
      let rejectedCount = 0;
      let totalBenefit = 0;

      const claimResults = request.claims.map((claim, index) => {
        // 95% success rate
        const accepted = Math.random() > 0.05;
        
        if (accepted) {
          acceptedCount++;
          const benefit = claim.serviceDetails.reduce((sum, s) => {
            return sum + this.calculateBenefit(s.itemNumber, 50);
          }, 0);
          totalBenefit += benefit;
          
          return {
            index,
            status: 'accepted' as const,
            benefitAmount: benefit,
          };
        } else {
          rejectedCount++;
          return {
            index,
            status: 'rejected' as const,
            errors: [{ code: '0008', severity: 'error' as const, message: 'Duplicate claim detected' }],
          };
        }
      });

      const response: BulkBillResponse = {
        transactionId,
        timestamp: new Date().toISOString(),
        batchId: request.batchId,
        totalClaims: request.claims.length,
        acceptedClaims: acceptedCount,
        rejectedClaims: rejectedCount,
        totalBenefit: Math.round(totalBenefit * 100) / 100,
        claimResults,
      };

      this.logTransaction('bulk', transactionId, request as unknown as Record<string, unknown>, response as unknown as Record<string, unknown>, startTime);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==========================================
  // Patient Verification
  // ==========================================

  async verifyPatient(medicareNumber: string, dateOfBirth: string): Promise<{
    verified: boolean;
    patientName?: string;
    gender?: string;
    errors?: EclipseError[];
  }> {
    const transactionId = this.generateTransactionId();

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!this.validateMedicareNumber(medicareNumber)) {
        return {
          verified: false,
          errors: [{ code: '0001', severity: 'error', message: ECLIPSE_ERROR_CODES['0001'] }],
        };
      }

      return {
        verified: true,
        patientName: 'SMITH, John',
        gender: 'M',
      };
    } catch (error) {
      return {
        verified: false,
        errors: [{ code: '9999', severity: 'fatal', message: 'Verification failed' }],
      };
    }
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  private generateTransactionId(): string {
    return `TXN${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private validateMedicareNumber(medicareNumber: string): boolean {
    return /^\d{10}$/.test(medicareNumber);
  }

  private validateProviderNumber(providerNumber: string): boolean {
    return /^\d{7}[A-Z]$/.test(providerNumber);
  }

  private logTransaction(
    type: TransactionType,
    transactionId: string,
    request: Record<string, unknown>,
    response: Record<string, unknown>,
    startTime: number,
    isError: boolean = false
  ): void {
    const log: TransactionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId,
      type,
      channel: 'eclipse_online',
      timestamp: new Date().toISOString(),
      request,
      response,
      status: isError ? 'error' : 'success',
      duration: Date.now() - startTime,
      providerNumber: this.credentials?.providerId || 'unknown',
    };

    this.transactionLogs.push(log);
    this.saveState();
  }

  // ==========================================
  // Transaction History
  // ==========================================

  getTransactionLogs(filter?: {
    type?: TransactionType;
    status?: 'success' | 'error';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): TransactionLog[] {
    let logs = [...this.transactionLogs];

    if (filter?.type) {
      logs = logs.filter(l => l.type === filter.type);
    }
    if (filter?.status) {
      logs = logs.filter(l => l.status === filter.status);
    }
    if (filter?.startDate) {
      logs = logs.filter(l => l.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      logs = logs.filter(l => l.timestamp <= filter.endDate!);
    }

    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    totalTransactions: number;
    successRate: number;
    averageResponseTime: number;
    transactionsByType: Record<string, number>;
    errorsByCode: Record<string, number>;
  } {
    const total = this.transactionLogs.length;
    const successful = this.transactionLogs.filter(l => l.status === 'success').length;
    const avgTime = total > 0
      ? this.transactionLogs.reduce((sum, l) => sum + l.duration, 0) / total
      : 0;

    const byType: Record<string, number> = {};
    const errorCodes: Record<string, number> = {};

    this.transactionLogs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      
      if (log.status === 'error') {
        const response = log.response as { errors?: EclipseError[] };
        response.errors?.forEach(err => {
          errorCodes[err.code] = (errorCodes[err.code] || 0) + 1;
        });
      }
    });

    return {
      totalTransactions: total,
      successRate: total > 0 ? Math.round(successful / total * 100 * 10) / 10 : 0,
      averageResponseTime: Math.round(avgTime),
      transactionsByType: byType,
      errorsByCode: errorCodes,
    };
  }

  getErrorDescription(code: string): string {
    return ECLIPSE_ERROR_CODES[code] || 'Unknown error';
  }
}

export const eclipseAPI = new EclipseAPIService();
