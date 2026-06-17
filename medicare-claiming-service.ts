/**
 * MediVac One - Medicare Claiming and Billing Service
 * Australian Medicare bulk billing and patient claiming workflows
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type ClaimType = 'bulk_bill' | 'patient_claim' | 'dva' | 'private' | 'workers_comp' | 'third_party';
export type ClaimStatus = 'draft' | 'pending' | 'submitted' | 'processing' | 'paid' | 'rejected' | 'cancelled';
export type PaymentMethod = 'eft' | 'cheque' | 'patient_refund';

export interface MBSItem {
  itemNumber: string;
  description: string;
  category: string;
  group: string;
  subgroup: string;
  scheduleFee: number;
  benefitAmount: number;
  extendedMedicareSafetyNet: number;
  restrictedItem: boolean;
  anaestheticItem: boolean;
  assistantItem: boolean;
  derivedFeeItem: boolean;
  effectiveDate: string;
  notes?: string;
}

export interface Provider {
  id: string;
  providerNumber: string;
  hpii: string;
  name: string;
  specialty: string;
  practiceLocation: string;
  bankDetails?: {
    bsb: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  medicareNumber: string;
  medicareIRN: string;
  medicareExpiry: string;
  dvaNumber?: string;
  dvaCardType?: 'gold' | 'white' | 'orange';
  concessionCard?: {
    type: 'pensioner' | 'healthcare' | 'commonwealth_seniors';
    number: string;
    expiry: string;
  };
  safetyNetThreshold?: {
    originalReached: boolean;
    extendedReached: boolean;
    dateReached?: string;
  };
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  phone: string;
  email?: string;
}

export interface ServiceItem {
  id: string;
  mbsItemNumber: string;
  description: string;
  scheduleFee: number;
  chargedFee: number;
  benefitAmount: number;
  gapAmount: number;
  quantity: number;
  serviceDate: string;
  referralRequired: boolean;
  referralOverride?: boolean;
}

export interface Claim {
  id: string;
  claimType: ClaimType;
  status: ClaimStatus;
  patient: Patient;
  provider: Provider;
  serviceItems: ServiceItem[];
  serviceDate: string;
  lodgementDate?: string;
  processedDate?: string;
  paidDate?: string;
  totalScheduleFee: number;
  totalChargedFee: number;
  totalBenefit: number;
  totalGap: number;
  patientContribution: number;
  referral?: {
    providerNumber: string;
    providerName: string;
    referralDate: string;
    referralPeriod: number;
    referralNumber?: string;
  };
  hospitalIndicator: boolean;
  accidentDetails?: {
    accidentDate: string;
    accidentType: string;
    claimNumber?: string;
  };
  payee: 'provider' | 'patient';
  paymentReference?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimBatch {
  id: string;
  batchNumber: string;
  transmissionDate: string;
  claims: string[];
  totalClaims: number;
  totalBenefit: number;
  status: 'pending' | 'transmitted' | 'acknowledged' | 'processed' | 'error';
  acknowledgementNumber?: string;
  errorCount?: number;
  errors?: string[];
}

export interface PaymentRemittance {
  id: string;
  remittanceNumber: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  claimCount: number;
  claims: {
    claimId: string;
    benefitPaid: number;
    status: 'paid' | 'rejected' | 'adjusted';
    adjustmentReason?: string;
  }[];
  bankReference?: string;
}

export interface ClaimingStatistics {
  totalClaims: number;
  pendingClaims: number;
  submittedClaims: number;
  paidClaims: number;
  rejectedClaims: number;
  totalBilled: number;
  totalBenefitReceived: number;
  totalGapCollected: number;
  averageProcessingDays: number;
  rejectionRate: number;
}

// ==========================================
// MBS Item Database (Sample)
// ==========================================

const MBS_ITEMS: MBSItem[] = [
  // GP Consultations
  { itemNumber: '3', description: 'Professional attendance by a GP - Level A', category: 'GP', group: 'A1', subgroup: '1', scheduleFee: 18.20, benefitAmount: 15.47, extendedMedicareSafetyNet: 18.20, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '23', description: 'Professional attendance by a GP - Level B', category: 'GP', group: 'A1', subgroup: '1', scheduleFee: 41.40, benefitAmount: 35.19, extendedMedicareSafetyNet: 41.40, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '36', description: 'Professional attendance by a GP - Level C', category: 'GP', group: 'A1', subgroup: '1', scheduleFee: 80.10, benefitAmount: 68.09, extendedMedicareSafetyNet: 80.10, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '44', description: 'Professional attendance by a GP - Level D', category: 'GP', group: 'A1', subgroup: '1', scheduleFee: 117.75, benefitAmount: 100.09, extendedMedicareSafetyNet: 117.75, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Telehealth
  { itemNumber: '91790', description: 'Telehealth GP consultation - Level A', category: 'Telehealth', group: 'A22', subgroup: '1', scheduleFee: 18.20, benefitAmount: 15.47, extendedMedicareSafetyNet: 18.20, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '91800', description: 'Telehealth GP consultation - Level B', category: 'Telehealth', group: 'A22', subgroup: '1', scheduleFee: 41.40, benefitAmount: 35.19, extendedMedicareSafetyNet: 41.40, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '91810', description: 'Telehealth GP consultation - Level C', category: 'Telehealth', group: 'A22', subgroup: '1', scheduleFee: 80.10, benefitAmount: 68.09, extendedMedicareSafetyNet: 80.10, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Specialist Consultations
  { itemNumber: '104', description: 'Specialist consultation - initial', category: 'Specialist', group: 'A3', subgroup: '1', scheduleFee: 90.75, benefitAmount: 77.15, extendedMedicareSafetyNet: 90.75, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '105', description: 'Specialist consultation - subsequent', category: 'Specialist', group: 'A3', subgroup: '1', scheduleFee: 45.40, benefitAmount: 38.59, extendedMedicareSafetyNet: 45.40, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Health Assessments
  { itemNumber: '701', description: 'Brief health assessment (45+ years)', category: 'Preventive', group: 'A14', subgroup: '1', scheduleFee: 60.50, benefitAmount: 51.45, extendedMedicareSafetyNet: 60.50, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '703', description: 'Standard health assessment (45+ years)', category: 'Preventive', group: 'A14', subgroup: '1', scheduleFee: 153.15, benefitAmount: 130.20, extendedMedicareSafetyNet: 153.15, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '705', description: 'Long health assessment (45+ years)', category: 'Preventive', group: 'A14', subgroup: '1', scheduleFee: 250.75, benefitAmount: 213.15, extendedMedicareSafetyNet: 250.75, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Mental Health
  { itemNumber: '2700', description: 'GP mental health treatment - initial', category: 'Mental Health', group: 'A20', subgroup: '1', scheduleFee: 96.80, benefitAmount: 82.30, extendedMedicareSafetyNet: 96.80, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '2701', description: 'GP mental health treatment - review', category: 'Mental Health', group: 'A20', subgroup: '1', scheduleFee: 48.40, benefitAmount: 41.15, extendedMedicareSafetyNet: 48.40, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Chronic Disease Management
  { itemNumber: '721', description: 'GP Management Plan', category: 'Chronic Disease', group: 'A15', subgroup: '1', scheduleFee: 153.15, benefitAmount: 130.20, extendedMedicareSafetyNet: 153.15, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '723', description: 'Team Care Arrangement', category: 'Chronic Disease', group: 'A15', subgroup: '1', scheduleFee: 119.50, benefitAmount: 101.60, extendedMedicareSafetyNet: 119.50, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '732', description: 'Review of GP Management Plan', category: 'Chronic Disease', group: 'A15', subgroup: '1', scheduleFee: 76.60, benefitAmount: 65.10, extendedMedicareSafetyNet: 76.60, restrictedItem: true, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Procedures
  { itemNumber: '30003', description: 'Excision of skin lesion', category: 'Procedures', group: 'T8', subgroup: '1', scheduleFee: 68.85, benefitAmount: 58.55, extendedMedicareSafetyNet: 68.85, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '30071', description: 'Wound repair', category: 'Procedures', group: 'T8', subgroup: '1', scheduleFee: 45.60, benefitAmount: 38.75, extendedMedicareSafetyNet: 45.60, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  
  // Pathology
  { itemNumber: '65070', description: 'Full blood count', category: 'Pathology', group: 'P1', subgroup: '1', scheduleFee: 17.45, benefitAmount: 14.85, extendedMedicareSafetyNet: 17.45, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '66500', description: 'Lipid studies', category: 'Pathology', group: 'P1', subgroup: '1', scheduleFee: 12.35, benefitAmount: 10.50, extendedMedicareSafetyNet: 12.35, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
  { itemNumber: '66512', description: 'HbA1c', category: 'Pathology', group: 'P1', subgroup: '1', scheduleFee: 16.95, benefitAmount: 14.40, extendedMedicareSafetyNet: 16.95, restrictedItem: false, anaestheticItem: false, assistantItem: false, derivedFeeItem: false, effectiveDate: '2024-07-01' },
];

// ==========================================
// Medicare Claiming Service
// ==========================================

class MedicareClaimingService {
  private claims: Map<string, Claim> = new Map();
  private batches: Map<string, ClaimBatch> = new Map();
  private remittances: PaymentRemittance[] = [];
  private providers: Map<string, Provider> = new Map();

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const claimsData = await AsyncStorage.getItem('medicare_claims');
      if (claimsData) {
        const parsed = JSON.parse(claimsData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.claims.set(key, value as Claim);
        });
      }

      const providersData = await AsyncStorage.getItem('medicare_providers');
      if (providersData) {
        const parsed = JSON.parse(providersData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.providers.set(key, value as Provider);
        });
      }

      const remittancesData = await AsyncStorage.getItem('medicare_remittances');
      if (remittancesData) {
        this.remittances = JSON.parse(remittancesData);
      }
    } catch (error) {
      console.error('Failed to load Medicare claiming state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const claimsObj: Record<string, Claim> = {};
      this.claims.forEach((value, key) => {
        claimsObj[key] = value;
      });
      await AsyncStorage.setItem('medicare_claims', JSON.stringify(claimsObj));

      const providersObj: Record<string, Provider> = {};
      this.providers.forEach((value, key) => {
        providersObj[key] = value;
      });
      await AsyncStorage.setItem('medicare_providers', JSON.stringify(providersObj));

      await AsyncStorage.setItem('medicare_remittances', JSON.stringify(this.remittances.slice(-200)));
    } catch (error) {
      console.error('Failed to save Medicare claiming state:', error);
    }
  }

  // ==========================================
  // MBS Item Lookup
  // ==========================================

  searchMBSItems(query: string): MBSItem[] {
    const lowerQuery = query.toLowerCase();
    return MBS_ITEMS.filter(item =>
      item.itemNumber.includes(query) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }

  getMBSItem(itemNumber: string): MBSItem | undefined {
    return MBS_ITEMS.find(item => item.itemNumber === itemNumber);
  }

  getMBSItemsByCategory(category: string): MBSItem[] {
    return MBS_ITEMS.filter(item => item.category === category);
  }

  getMBSCategories(): string[] {
    return [...new Set(MBS_ITEMS.map(item => item.category))];
  }

  // ==========================================
  // Provider Management
  // ==========================================

  async registerProvider(provider: Omit<Provider, 'id'>): Promise<Provider> {
    const newProvider: Provider = {
      ...provider,
      id: `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.providers.set(newProvider.id, newProvider);
    await this.saveState();
    return newProvider;
  }

  getProvider(providerId: string): Provider | undefined {
    return this.providers.get(providerId);
  }

  getProviderByNumber(providerNumber: string): Provider | undefined {
    return Array.from(this.providers.values()).find(p => p.providerNumber === providerNumber);
  }

  // ==========================================
  // Claim Creation
  // ==========================================

  async createBulkBillClaim(
    patient: Patient,
    provider: Provider,
    serviceItems: Omit<ServiceItem, 'id' | 'gapAmount'>[],
    serviceDate: string,
    referral?: Claim['referral']
  ): Promise<Claim> {
    const items: ServiceItem[] = serviceItems.map(item => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gapAmount: 0, // No gap for bulk billing
      chargedFee: item.benefitAmount, // Charged fee equals benefit for bulk bill
    }));

    const totalScheduleFee = items.reduce((sum, item) => sum + item.scheduleFee * item.quantity, 0);
    const totalBenefit = items.reduce((sum, item) => sum + item.benefitAmount * item.quantity, 0);

    const claim: Claim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      claimType: 'bulk_bill',
      status: 'draft',
      patient,
      provider,
      serviceItems: items,
      serviceDate,
      totalScheduleFee,
      totalChargedFee: totalBenefit,
      totalBenefit,
      totalGap: 0,
      patientContribution: 0,
      referral,
      hospitalIndicator: false,
      payee: 'provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.claims.set(claim.id, claim);
    await this.saveState();
    return claim;
  }

  async createPatientClaim(
    patient: Patient,
    provider: Provider,
    serviceItems: Omit<ServiceItem, 'id'>[],
    serviceDate: string,
    referral?: Claim['referral']
  ): Promise<Claim> {
    const items: ServiceItem[] = serviceItems.map(item => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    const totalScheduleFee = items.reduce((sum, item) => sum + item.scheduleFee * item.quantity, 0);
    const totalChargedFee = items.reduce((sum, item) => sum + item.chargedFee * item.quantity, 0);
    const totalBenefit = items.reduce((sum, item) => sum + item.benefitAmount * item.quantity, 0);
    const totalGap = items.reduce((sum, item) => sum + item.gapAmount * item.quantity, 0);

    const claim: Claim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      claimType: 'patient_claim',
      status: 'draft',
      patient,
      provider,
      serviceItems: items,
      serviceDate,
      totalScheduleFee,
      totalChargedFee,
      totalBenefit,
      totalGap,
      patientContribution: totalGap,
      referral,
      hospitalIndicator: false,
      payee: 'patient',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.claims.set(claim.id, claim);
    await this.saveState();
    return claim;
  }

  async createDVAClaim(
    patient: Patient,
    provider: Provider,
    serviceItems: Omit<ServiceItem, 'id' | 'gapAmount'>[],
    serviceDate: string,
    referral?: Claim['referral']
  ): Promise<Claim> {
    if (!patient.dvaNumber) {
      throw new Error('Patient does not have a DVA number');
    }

    const items: ServiceItem[] = serviceItems.map(item => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gapAmount: 0,
      chargedFee: item.scheduleFee, // DVA pays schedule fee
    }));

    const totalScheduleFee = items.reduce((sum, item) => sum + item.scheduleFee * item.quantity, 0);

    const claim: Claim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      claimType: 'dva',
      status: 'draft',
      patient,
      provider,
      serviceItems: items,
      serviceDate,
      totalScheduleFee,
      totalChargedFee: totalScheduleFee,
      totalBenefit: totalScheduleFee,
      totalGap: 0,
      patientContribution: 0,
      referral,
      hospitalIndicator: false,
      payee: 'provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.claims.set(claim.id, claim);
    await this.saveState();
    return claim;
  }

  // ==========================================
  // Claim Validation
  // ==========================================

  validateClaim(claim: Claim): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Medicare number validation
    if (!this.validateMedicareNumber(claim.patient.medicareNumber)) {
      errors.push('Invalid Medicare number format');
    }

    // Medicare expiry check
    if (new Date(claim.patient.medicareExpiry) < new Date()) {
      errors.push('Medicare card has expired');
    }

    // Service date validation
    const serviceDate = new Date(claim.serviceDate);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (serviceDate < twoYearsAgo) {
      errors.push('Service date is more than 2 years old');
    }
    if (serviceDate > new Date()) {
      errors.push('Service date cannot be in the future');
    }

    // Referral validation for specialist items
    const specialistItems = claim.serviceItems.filter(item => {
      const mbsItem = this.getMBSItem(item.mbsItemNumber);
      return mbsItem?.category === 'Specialist';
    });
    if (specialistItems.length > 0 && !claim.referral) {
      errors.push('Specialist consultation requires a valid referral');
    }

    // Referral expiry check
    if (claim.referral) {
      const referralDate = new Date(claim.referral.referralDate);
      const referralExpiry = new Date(referralDate);
      referralExpiry.setMonth(referralExpiry.getMonth() + claim.referral.referralPeriod);
      if (referralExpiry < serviceDate) {
        errors.push('Referral has expired');
      }
    }

    // Restricted item checks
    claim.serviceItems.forEach(item => {
      const mbsItem = this.getMBSItem(item.mbsItemNumber);
      if (mbsItem?.restrictedItem) {
        warnings.push(`Item ${item.mbsItemNumber} is a restricted item - ensure claiming rules are met`);
      }
    });

    // Provider number validation
    if (!this.validateProviderNumber(claim.provider.providerNumber)) {
      errors.push('Invalid provider number format');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateMedicareNumber(medicareNumber: string): boolean {
    // Medicare number is 10 digits
    return /^\d{10}$/.test(medicareNumber);
  }

  private validateProviderNumber(providerNumber: string): boolean {
    // Provider number is 7 digits followed by a letter
    return /^\d{7}[A-Z]$/.test(providerNumber);
  }

  // ==========================================
  // Claim Submission
  // ==========================================

  async submitClaim(claimId: string): Promise<Claim> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    const validation = this.validateClaim(claim);
    if (!validation.valid) {
      throw new Error(`Claim validation failed: ${validation.errors.join(', ')}`);
    }

    claim.status = 'submitted';
    claim.lodgementDate = new Date().toISOString();
    claim.updatedAt = new Date().toISOString();

    this.claims.set(claimId, claim);
    await this.saveState();

    // Simulate processing
    setTimeout(() => this.processClaim(claimId), 2000);

    return claim;
  }

  private async processClaim(claimId: string): Promise<void> {
    const claim = this.claims.get(claimId);
    if (!claim || claim.status !== 'submitted') return;

    claim.status = 'processing';
    claim.updatedAt = new Date().toISOString();
    this.claims.set(claimId, claim);

    // Simulate Medicare processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 95% success rate for simulation
    if (Math.random() < 0.95) {
      claim.status = 'paid';
      claim.processedDate = new Date().toISOString();
      claim.paidDate = new Date().toISOString();
      claim.paymentReference = `PAY${Date.now()}`;
    } else {
      claim.status = 'rejected';
      claim.processedDate = new Date().toISOString();
      claim.rejectionReason = 'Medicare eligibility check failed';
    }

    claim.updatedAt = new Date().toISOString();
    this.claims.set(claimId, claim);
    await this.saveState();
  }

  // ==========================================
  // Batch Processing
  // ==========================================

  async createBatch(claimIds: string[]): Promise<ClaimBatch> {
    const claims = claimIds.map(id => this.claims.get(id)).filter((c): c is Claim => c !== undefined);
    
    if (claims.length === 0) {
      throw new Error('No valid claims for batch');
    }

    const totalBenefit = claims.reduce((sum, claim) => sum + claim.totalBenefit, 0);

    const batch: ClaimBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchNumber: `B${Date.now().toString().slice(-8)}`,
      transmissionDate: new Date().toISOString(),
      claims: claimIds,
      totalClaims: claims.length,
      totalBenefit,
      status: 'pending',
    };

    this.batches.set(batch.id, batch);
    return batch;
  }

  async transmitBatch(batchId: string): Promise<ClaimBatch> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    batch.status = 'transmitted';
    batch.acknowledgementNumber = `ACK${Date.now()}`;
    this.batches.set(batchId, batch);

    // Submit all claims in batch
    for (const claimId of batch.claims) {
      await this.submitClaim(claimId);
    }

    return batch;
  }

  // ==========================================
  // Rebate Calculation
  // ==========================================

  calculateRebate(
    mbsItemNumber: string,
    chargedFee: number,
    patient: Patient
  ): { benefitAmount: number; gapAmount: number; safetyNetBenefit?: number } {
    const mbsItem = this.getMBSItem(mbsItemNumber);
    if (!mbsItem) {
      throw new Error(`MBS item ${mbsItemNumber} not found`);
    }

    let benefitAmount = mbsItem.benefitAmount;
    let safetyNetBenefit: number | undefined;

    // Check for safety net
    if (patient.safetyNetThreshold?.extendedReached) {
      safetyNetBenefit = mbsItem.extendedMedicareSafetyNet;
      benefitAmount = Math.max(benefitAmount, safetyNetBenefit);
    }

    const gapAmount = Math.max(0, chargedFee - benefitAmount);

    return {
      benefitAmount,
      gapAmount,
      safetyNetBenefit,
    };
  }

  // ==========================================
  // Reports and Statistics
  // ==========================================

  getClaimingStatistics(startDate?: string, endDate?: string): ClaimingStatistics {
    let claims = Array.from(this.claims.values());

    if (startDate) {
      claims = claims.filter(c => c.serviceDate >= startDate);
    }
    if (endDate) {
      claims = claims.filter(c => c.serviceDate <= endDate);
    }

    const paidClaims = claims.filter(c => c.status === 'paid');
    const rejectedClaims = claims.filter(c => c.status === 'rejected');

    // Calculate average processing time
    let totalProcessingDays = 0;
    let processedCount = 0;
    paidClaims.forEach(claim => {
      if (claim.lodgementDate && claim.paidDate) {
        const lodgement = new Date(claim.lodgementDate);
        const paid = new Date(claim.paidDate);
        totalProcessingDays += (paid.getTime() - lodgement.getTime()) / (1000 * 60 * 60 * 24);
        processedCount++;
      }
    });

    return {
      totalClaims: claims.length,
      pendingClaims: claims.filter(c => c.status === 'pending' || c.status === 'submitted').length,
      submittedClaims: claims.filter(c => c.status === 'submitted' || c.status === 'processing').length,
      paidClaims: paidClaims.length,
      rejectedClaims: rejectedClaims.length,
      totalBilled: claims.reduce((sum, c) => sum + c.totalChargedFee, 0),
      totalBenefitReceived: paidClaims.reduce((sum, c) => sum + c.totalBenefit, 0),
      totalGapCollected: paidClaims.reduce((sum, c) => sum + c.totalGap, 0),
      averageProcessingDays: processedCount > 0 ? Math.round(totalProcessingDays / processedCount * 10) / 10 : 0,
      rejectionRate: claims.length > 0 ? Math.round(rejectedClaims.length / claims.length * 100 * 10) / 10 : 0,
    };
  }

  generatePatientStatement(patientId: string, startDate: string, endDate: string): {
    patient: Patient;
    claims: Claim[];
    totalCharged: number;
    totalBenefit: number;
    totalGap: number;
    totalPaid: number;
  } | null {
    const claims = Array.from(this.claims.values()).filter(
      c => c.patient.id === patientId &&
           c.serviceDate >= startDate &&
           c.serviceDate <= endDate
    );

    if (claims.length === 0) return null;

    return {
      patient: claims[0].patient,
      claims,
      totalCharged: claims.reduce((sum, c) => sum + c.totalChargedFee, 0),
      totalBenefit: claims.reduce((sum, c) => sum + c.totalBenefit, 0),
      totalGap: claims.reduce((sum, c) => sum + c.totalGap, 0),
      totalPaid: claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.totalBenefit, 0),
    };
  }

  // ==========================================
  // Claim Retrieval
  // ==========================================

  getClaim(claimId: string): Claim | undefined {
    return this.claims.get(claimId);
  }

  getClaimsByPatient(patientId: string): Claim[] {
    return Array.from(this.claims.values()).filter(c => c.patient.id === patientId);
  }

  getClaimsByProvider(providerId: string): Claim[] {
    return Array.from(this.claims.values()).filter(c => c.provider.id === providerId);
  }

  getClaimsByStatus(status: ClaimStatus): Claim[] {
    return Array.from(this.claims.values()).filter(c => c.status === status);
  }

  getClaimsByDateRange(startDate: string, endDate: string): Claim[] {
    return Array.from(this.claims.values()).filter(
      c => c.serviceDate >= startDate && c.serviceDate <= endDate
    );
  }

  async cancelClaim(claimId: string, reason: string): Promise<Claim> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status === 'paid') {
      throw new Error('Cannot cancel a paid claim');
    }

    claim.status = 'cancelled';
    claim.notes = reason;
    claim.updatedAt = new Date().toISOString();

    this.claims.set(claimId, claim);
    await this.saveState();
    return claim;
  }
}

export const medicareClaiming = new MedicareClaimingService();
