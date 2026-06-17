/**
 * Institution Billing & Auto-Approval Service
 * Manages institution payments and automatic approval on $30k threshold
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Institution {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'research' | 'government' | 'private';
  contactEmail: string;
  contactPhone: string;
  address: string;
  registrationNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approvalDate?: number;
  approvedBy?: string;
  metadata: Record<string, unknown>;
}

export interface InstitutionPayment {
  id: string;
  institutionId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'bank_transfer' | 'invoice';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  paidAt?: number;
  expiresAt?: number;
  metadata: Record<string, unknown>;
}

export interface InstitutionAccount {
  id: string;
  institutionId: string;
  totalPaid: number;
  approvalThreshold: number;
  isApproved: boolean;
  approvalDate?: number;
  tier: 'basic' | 'premium' | 'enterprise';
  userCount: number;
  maxUsers: number;
  features: string[];
  expiresAt?: number;
}

const APPROVAL_THRESHOLD = 30000; // AUD
const INSTITUTION_TIERS = {
  basic: {
    price: 5000,
    users: 10,
    features: ['basic_access', 'patient_management', 'scheduling'],
  },
  premium: {
    price: 15000,
    users: 50,
    features: ['full_access', 'advanced_analytics', 'custom_integration', 'api_access'],
  },
  enterprise: {
    price: 30000,
    users: 500,
    features: ['unlimited_access', 'dedicated_support', 'custom_features', 'sso_integration'],
    autoApprove: true,
  },
};

class InstitutionBillingService {
  private institutions: Map<string, Institution> = new Map();
  private payments: Map<string, InstitutionPayment> = new Map();
  private accounts: Map<string, InstitutionAccount> = new Map();
  private auditLog: Array<{
    timestamp: number;
    action: string;
    institutionId: string;
    details: Record<string, unknown>;
  }> = [];

  async initialize(): Promise<void> {
    await this.loadData();
  }

  /**
   * Register institution
   */
  async registerInstitution(
    name: string,
    type: Institution['type'],
    contactEmail: string,
    contactPhone: string,
    address: string,
    registrationNumber: string
  ): Promise<Institution> {
    const institution: Institution = {
      id: `inst_${Date.now()}`,
      name,
      type,
      contactEmail,
      contactPhone,
      address,
      registrationNumber,
      status: 'pending',
      metadata: {},
    };

    this.institutions.set(institution.id, institution);

    // Create account
    const account: InstitutionAccount = {
      id: `acc_${Date.now()}`,
      institutionId: institution.id,
      totalPaid: 0,
      approvalThreshold: APPROVAL_THRESHOLD,
      isApproved: false,
      tier: 'basic',
      userCount: 0,
      maxUsers: INSTITUTION_TIERS.basic.users,
      features: INSTITUTION_TIERS.basic.features,
    };

    this.accounts.set(account.id, account);

    this.logAction('INSTITUTION_REGISTERED', institution.id, {
      name,
      type,
      email: contactEmail,
    });

    await this.saveData();
    return institution;
  }

  /**
   * Process institution payment
   */
  async processPayment(
    institutionId: string,
    amount: number,
    paymentMethod: InstitutionPayment['paymentMethod'],
    transactionId: string
  ): Promise<InstitutionPayment | null> {
    const institution = this.institutions.get(institutionId);
    if (!institution) return null;

    const payment: InstitutionPayment = {
      id: `pay_${Date.now()}`,
      institutionId,
      amount,
      currency: 'AUD',
      paymentMethod,
      status: 'processing',
      transactionId,
      metadata: {},
    };

    this.payments.set(payment.id, payment);

    // Simulate payment processing
    await this.delay(2000);

    // Mark as completed
    payment.status = 'completed';
    payment.paidAt = Date.now();

    // Update account
    const account = Array.from(this.accounts.values()).find(
      a => a.institutionId === institutionId
    );

    if (account) {
      account.totalPaid += amount;

      // Check for auto-approval
      if (account.totalPaid >= APPROVAL_THRESHOLD && !account.isApproved) {
        await this.autoApproveInstitution(institutionId, account.id);
      }

      // Update tier based on payment
      this.updateAccountTier(account, amount);
    }

    this.logAction('PAYMENT_PROCESSED', institutionId, {
      amount,
      paymentMethod,
      transactionId,
      totalPaid: account?.totalPaid,
    });

    await this.saveData();
    return payment;
  }

  /**
   * Auto-approve institution on threshold
   */
  private async autoApproveInstitution(institutionId: string, accountId: string): Promise<void> {
    const institution = this.institutions.get(institutionId);
    const account = this.accounts.get(accountId);

    if (institution && account) {
      institution.status = 'approved';
      institution.approvalDate = Date.now();
      institution.approvedBy = 'system_auto_approval';

      account.isApproved = true;
      account.approvalDate = Date.now();
      account.tier = 'enterprise';
      account.maxUsers = INSTITUTION_TIERS.enterprise.users;
      account.features = INSTITUTION_TIERS.enterprise.features;

      this.logAction('INSTITUTION_AUTO_APPROVED', institutionId, {
        threshold: APPROVAL_THRESHOLD,
        totalPaid: account.totalPaid,
      });

      await this.sendApprovalNotification(institution);
    }
  }

  /**
   * Send approval notification
   */
  private async sendApprovalNotification(institution: Institution): Promise<void> {
    // In production, this would send an email
    console.log(`[Institution Billing] Sending approval notification to ${institution.contactEmail}`);
    console.log(`Institution ${institution.name} has been auto-approved!`);
  }

  /**
   * Update account tier based on payment
   */
  private updateAccountTier(
    account: InstitutionAccount,
    paymentAmount: number
  ): void {
    if (account.totalPaid >= INSTITUTION_TIERS.enterprise.price) {
      account.tier = 'enterprise';
      account.maxUsers = INSTITUTION_TIERS.enterprise.users;
      account.features = INSTITUTION_TIERS.enterprise.features;
    } else if (account.totalPaid >= INSTITUTION_TIERS.premium.price) {
      account.tier = 'premium';
      account.maxUsers = INSTITUTION_TIERS.premium.users;
      account.features = INSTITUTION_TIERS.premium.features;
    } else {
      account.tier = 'basic';
      account.maxUsers = INSTITUTION_TIERS.basic.users;
      account.features = INSTITUTION_TIERS.basic.features;
    }
  }

  /**
   * Get institution
   */
  getInstitution(institutionId: string): Institution | undefined {
    return this.institutions.get(institutionId);
  }

  /**
   * Get institution account
   */
  getInstitutionAccount(institutionId: string): InstitutionAccount | undefined {
    return Array.from(this.accounts.values()).find(a => a.institutionId === institutionId);
  }

  /**
   * Get institution payments
   */
  getInstitutionPayments(institutionId: string): InstitutionPayment[] {
    return Array.from(this.payments.values()).filter(p => p.institutionId === institutionId);
  }

  /**
   * Get all institutions
   */
  getAllInstitutions(): Institution[] {
    return Array.from(this.institutions.values());
  }

  /**
   * Get approved institutions
   */
  getApprovedInstitutions(): Institution[] {
    return Array.from(this.institutions.values()).filter(i => i.status === 'approved');
  }

  /**
   * Get pending institutions
   */
  getPendingInstitutions(): Institution[] {
    return Array.from(this.institutions.values()).filter(i => i.status === 'pending');
  }

  /**
   * Get billing stats
   */
  getBillingStats() {
    const allPayments = Array.from(this.payments.values());
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalInstitutions: this.institutions.size,
      approvedInstitutions: this.getApprovedInstitutions().length,
      pendingInstitutions: this.getPendingInstitutions().length,
      totalPayments: this.payments.size,
      completedPayments: completedPayments.length,
      totalRevenue,
      averagePayment: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
      autoApprovedCount: Array.from(this.institutions.values()).filter(
        i => i.approvedBy === 'system_auto_approval'
      ).length,
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): typeof this.auditLog {
    return this.auditLog.slice(-limit);
  }

  // Private methods

  private logAction(
    action: string,
    institutionId: string,
    details: Record<string, unknown>
  ): void {
    this.auditLog.push({
      timestamp: Date.now(),
      action,
      institutionId,
      details,
    });
  }

  private async saveData(): Promise<void> {
    try {
      const data = {
        institutions: Array.from(this.institutions.values()),
        payments: Array.from(this.payments.values()),
        accounts: Array.from(this.accounts.values()),
        auditLog: this.auditLog,
      };
      await AsyncStorage.setItem('institution_billing_data', JSON.stringify(data));
    } catch (error) {
      console.error('[Institution Billing] Error saving data:', error);
    }
  }

  private async loadData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('institution_billing_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.institutions?.forEach((inst: Institution) => this.institutions.set(inst.id, inst));
        data.payments?.forEach((pay: InstitutionPayment) => this.payments.set(pay.id, pay));
        data.accounts?.forEach((acc: InstitutionAccount) => this.accounts.set(acc.id, acc));
        this.auditLog = data.auditLog || [];
      }
    } catch (error) {
      console.error('[Institution Billing] Error loading data:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const institutionBillingService = new InstitutionBillingService();
