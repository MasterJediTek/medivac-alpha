/**
 * Staff Credentialing Management Service
 * MediVac One v3.1 - Certification, License & Training Tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type CredentialType = 'license' | 'certification' | 'training' | 'education' | 'privilege' | 'competency';
export type CredentialStatus = 'active' | 'expiring_soon' | 'expired' | 'pending' | 'suspended' | 'revoked';
export type StaffRole = 'physician' | 'nurse' | 'technician' | 'therapist' | 'pharmacist' | 'administrator' | 'support';

export interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  hireDate: Date;
  supervisorId?: string;
  credentials: Credential[];
  complianceScore: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export interface Credential {
  id: string;
  staffId: string;
  type: CredentialType;
  name: string;
  issuingAuthority: string;
  licenseNumber?: string;
  issueDate: Date;
  expirationDate: Date;
  status: CredentialStatus;
  verificationDate?: Date;
  verifiedBy?: string;
  documentUrl?: string;
  notes?: string;
  isRequired: boolean;
  reminderDays: number;
  renewalRequirements?: string;
  ceuRequired?: number;
  ceuCompleted?: number;
}

export interface CredentialRequirement {
  id: string;
  name: string;
  type: CredentialType;
  applicableRoles: StaffRole[];
  applicableDepartments: string[];
  isRequired: boolean;
  renewalPeriodMonths: number;
  ceuRequired?: number;
  description: string;
  issuingAuthorities: string[];
}

export interface ExpirationAlert {
  id: string;
  credentialId: string;
  staffId: string;
  staffName: string;
  credentialName: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  alertLevel: 'info' | 'warning' | 'critical';
  notificationsSent: number;
  lastNotificationDate?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface ComplianceReport {
  generatedAt: Date;
  period: string;
  overallCompliance: number;
  totalStaff: number;
  fullyCompliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  byDepartment: { department: string; compliance: number; staffCount: number }[];
  byRole: { role: StaffRole; compliance: number; staffCount: number }[];
  criticalAlerts: ExpirationAlert[];
}

export interface TrainingRecord {
  id: string;
  staffId: string;
  trainingName: string;
  category: string;
  completedDate: Date;
  expirationDate?: Date;
  score?: number;
  passingScore?: number;
  ceuEarned?: number;
  instructor?: string;
  certificateUrl?: string;
}

// Storage key
const STORAGE_KEY = 'medivac_credentialing';

class CredentialingServiceClass {
  private staff: Map<string, StaffMember> = new Map();
  private requirements: Map<string, CredentialRequirement> = new Map();
  private alerts: Map<string, ExpirationAlert> = new Map();
  private training: Map<string, TrainingRecord> = new Map();
  private initialized = false;
  private listeners: (() => void)[] = [];

  // Mock data
  private mockStaff: StaffMember[] = [
    {
      id: 'STF-001',
      employeeId: 'E10045',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@medivac.com',
      phone: '555-0101',
      role: 'nurse',
      department: 'ICU',
      hireDate: new Date('2019-03-15'),
      complianceScore: 95,
      lastReviewDate: new Date('2025-10-01'),
      nextReviewDate: new Date('2026-04-01'),
      credentials: [
        { id: 'CRD-001', staffId: 'STF-001', type: 'license', name: 'RN License', issuingAuthority: 'State Board of Nursing', licenseNumber: 'RN-123456', issueDate: new Date('2019-01-01'), expirationDate: new Date('2026-03-15'), status: 'expiring_soon', isRequired: true, reminderDays: 90, verificationDate: new Date('2025-01-15'), verifiedBy: 'HR Admin' },
        { id: 'CRD-002', staffId: 'STF-001', type: 'certification', name: 'BLS Certification', issuingAuthority: 'American Heart Association', issueDate: new Date('2024-06-01'), expirationDate: new Date('2026-06-01'), status: 'active', isRequired: true, reminderDays: 60 },
        { id: 'CRD-003', staffId: 'STF-001', type: 'certification', name: 'ACLS Certification', issuingAuthority: 'American Heart Association', issueDate: new Date('2024-06-01'), expirationDate: new Date('2026-06-01'), status: 'active', isRequired: true, reminderDays: 60 },
        { id: 'CRD-004', staffId: 'STF-001', type: 'certification', name: 'CCRN', issuingAuthority: 'AACN', issueDate: new Date('2023-09-01'), expirationDate: new Date('2026-09-01'), status: 'active', isRequired: false, reminderDays: 90, ceuRequired: 100, ceuCompleted: 75 },
      ],
    },
    {
      id: 'STF-002',
      employeeId: 'E10089',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@medivac.com',
      phone: '555-0102',
      role: 'physician',
      department: 'Emergency',
      hireDate: new Date('2018-07-01'),
      complianceScore: 100,
      lastReviewDate: new Date('2025-11-01'),
      nextReviewDate: new Date('2026-05-01'),
      credentials: [
        { id: 'CRD-005', staffId: 'STF-002', type: 'license', name: 'Medical License', issuingAuthority: 'State Medical Board', licenseNumber: 'MD-789012', issueDate: new Date('2018-06-01'), expirationDate: new Date('2027-06-01'), status: 'active', isRequired: true, reminderDays: 180 },
        { id: 'CRD-006', staffId: 'STF-002', type: 'certification', name: 'Board Certification - EM', issuingAuthority: 'ABEM', issueDate: new Date('2020-01-01'), expirationDate: new Date('2030-01-01'), status: 'active', isRequired: true, reminderDays: 365 },
        { id: 'CRD-007', staffId: 'STF-002', type: 'certification', name: 'DEA Registration', issuingAuthority: 'DEA', licenseNumber: 'DEA-345678', issueDate: new Date('2024-01-01'), expirationDate: new Date('2027-01-01'), status: 'active', isRequired: true, reminderDays: 180 },
        { id: 'CRD-008', staffId: 'STF-002', type: 'privilege', name: 'Procedural Sedation', issuingAuthority: 'Hospital Credentialing', issueDate: new Date('2023-01-01'), expirationDate: new Date('2026-01-01'), status: 'active', isRequired: true, reminderDays: 90 },
      ],
    },
    {
      id: 'STF-003',
      employeeId: 'E10156',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@medivac.com',
      phone: '555-0103',
      role: 'technician',
      department: 'Radiology',
      hireDate: new Date('2021-02-01'),
      complianceScore: 78,
      lastReviewDate: new Date('2025-08-01'),
      nextReviewDate: new Date('2026-02-01'),
      credentials: [
        { id: 'CRD-009', staffId: 'STF-003', type: 'certification', name: 'ARRT Certification', issuingAuthority: 'ARRT', licenseNumber: 'ARRT-567890', issueDate: new Date('2021-01-01'), expirationDate: new Date('2026-01-15'), status: 'expired', isRequired: true, reminderDays: 90 },
        { id: 'CRD-010', staffId: 'STF-003', type: 'certification', name: 'BLS Certification', issuingAuthority: 'American Heart Association', issueDate: new Date('2023-03-01'), expirationDate: new Date('2025-03-01'), status: 'expired', isRequired: true, reminderDays: 60 },
        { id: 'CRD-011', staffId: 'STF-003', type: 'training', name: 'Radiation Safety', issuingAuthority: 'Hospital Safety', issueDate: new Date('2024-01-01'), expirationDate: new Date('2026-01-01'), status: 'active', isRequired: true, reminderDays: 30 },
      ],
    },
    {
      id: 'STF-004',
      employeeId: 'E10201',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@medivac.com',
      phone: '555-0104',
      role: 'pharmacist',
      department: 'Pharmacy',
      hireDate: new Date('2020-05-15'),
      complianceScore: 92,
      lastReviewDate: new Date('2025-09-01'),
      nextReviewDate: new Date('2026-03-01'),
      credentials: [
        { id: 'CRD-012', staffId: 'STF-004', type: 'license', name: 'Pharmacist License', issuingAuthority: 'State Board of Pharmacy', licenseNumber: 'RPH-234567', issueDate: new Date('2020-04-01'), expirationDate: new Date('2026-04-01'), status: 'expiring_soon', isRequired: true, reminderDays: 90 },
        { id: 'CRD-013', staffId: 'STF-004', type: 'certification', name: 'BCPS', issuingAuthority: 'BPS', issueDate: new Date('2022-01-01'), expirationDate: new Date('2029-01-01'), status: 'active', isRequired: false, reminderDays: 180, ceuRequired: 100, ceuCompleted: 45 },
        { id: 'CRD-014', staffId: 'STF-004', type: 'certification', name: 'Immunization Certified', issuingAuthority: 'APhA', issueDate: new Date('2023-06-01'), expirationDate: new Date('2026-06-01'), status: 'active', isRequired: true, reminderDays: 60 },
      ],
    },
    {
      id: 'STF-005',
      employeeId: 'E10267',
      firstName: 'Lisa',
      lastName: 'Thompson',
      email: 'lisa.thompson@medivac.com',
      phone: '555-0105',
      role: 'therapist',
      department: 'Physical Therapy',
      hireDate: new Date('2022-01-10'),
      complianceScore: 88,
      lastReviewDate: new Date('2025-07-01'),
      nextReviewDate: new Date('2026-01-01'),
      credentials: [
        { id: 'CRD-015', staffId: 'STF-005', type: 'license', name: 'PT License', issuingAuthority: 'State PT Board', licenseNumber: 'PT-890123', issueDate: new Date('2022-01-01'), expirationDate: new Date('2026-12-31'), status: 'active', isRequired: true, reminderDays: 90 },
        { id: 'CRD-016', staffId: 'STF-005', type: 'certification', name: 'BLS Certification', issuingAuthority: 'American Heart Association', issueDate: new Date('2024-02-01'), expirationDate: new Date('2026-02-01'), status: 'expiring_soon', isRequired: true, reminderDays: 60 },
        { id: 'CRD-017', staffId: 'STF-005', type: 'certification', name: 'OCS', issuingAuthority: 'ABPTS', issueDate: new Date('2023-06-01'), expirationDate: new Date('2033-06-01'), status: 'active', isRequired: false, reminderDays: 365 },
      ],
    },
  ];

  private mockRequirements: CredentialRequirement[] = [
    { id: 'REQ-001', name: 'BLS Certification', type: 'certification', applicableRoles: ['nurse', 'physician', 'technician', 'therapist', 'pharmacist'], applicableDepartments: [], isRequired: true, renewalPeriodMonths: 24, description: 'Basic Life Support certification required for all clinical staff' , issuingAuthorities: ['American Heart Association', 'American Red Cross'] },
    { id: 'REQ-002', name: 'ACLS Certification', type: 'certification', applicableRoles: ['nurse', 'physician'], applicableDepartments: ['ICU', 'Emergency', 'Cardiac'], isRequired: true, renewalPeriodMonths: 24, description: 'Advanced Cardiac Life Support for critical care areas', issuingAuthorities: ['American Heart Association'] },
    { id: 'REQ-003', name: 'State License', type: 'license', applicableRoles: ['nurse', 'physician', 'pharmacist', 'therapist'], applicableDepartments: [], isRequired: true, renewalPeriodMonths: 24, description: 'Valid state professional license', issuingAuthorities: ['State Board'] },
    { id: 'REQ-004', name: 'Annual Competency', type: 'competency', applicableRoles: ['nurse', 'technician', 'therapist'], applicableDepartments: [], isRequired: true, renewalPeriodMonths: 12, description: 'Annual skills competency assessment', issuingAuthorities: ['Hospital Education'] },
    { id: 'REQ-005', name: 'HIPAA Training', type: 'training', applicableRoles: ['nurse', 'physician', 'technician', 'therapist', 'pharmacist', 'administrator', 'support'], applicableDepartments: [], isRequired: true, renewalPeriodMonths: 12, description: 'Annual HIPAA privacy and security training', issuingAuthorities: ['Hospital Compliance'] },
  ];

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load mock data
      this.mockStaff.forEach(s => this.staff.set(s.id, s));
      this.mockRequirements.forEach(r => this.requirements.set(r.id, r));
      
      // Generate alerts for expiring credentials
      this.generateExpirationAlerts();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize credentialing service:', error);
      this.initialized = true;
    }
  }

  private async save(): Promise<void> {
    try {
      const data = {
        staff: Array.from(this.staff.values()),
        requirements: Array.from(this.requirements.values()),
        alerts: Array.from(this.alerts.values()),
        training: Array.from(this.training.values()),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save credentialing data:', error);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }

  private generateExpirationAlerts(): void {
    const now = new Date();
    
    this.staff.forEach(member => {
      member.credentials.forEach(cred => {
        const daysUntil = Math.ceil((cred.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= cred.reminderDays) {
          let alertLevel: 'info' | 'warning' | 'critical' = 'info';
          if (daysUntil <= 0) alertLevel = 'critical';
          else if (daysUntil <= 30) alertLevel = 'warning';
          
          const alert: ExpirationAlert = {
            id: `ALT-${cred.id}`,
            credentialId: cred.id,
            staffId: member.id,
            staffName: `${member.firstName} ${member.lastName}`,
            credentialName: cred.name,
            expirationDate: cred.expirationDate,
            daysUntilExpiration: daysUntil,
            alertLevel,
            notificationsSent: 0,
            acknowledged: false,
          };
          this.alerts.set(alert.id, alert);
        }
      });
    });
  }

  // Get all staff members
  async getAllStaff(): Promise<StaffMember[]> {
    await this.initialize();
    return Array.from(this.staff.values());
  }

  // Get staff by ID
  async getStaffById(id: string): Promise<StaffMember | null> {
    await this.initialize();
    return this.staff.get(id) || null;
  }

  // Get staff by department
  async getStaffByDepartment(department: string): Promise<StaffMember[]> {
    await this.initialize();
    return Array.from(this.staff.values()).filter(s => s.department === department);
  }

  // Get staff by role
  async getStaffByRole(role: StaffRole): Promise<StaffMember[]> {
    await this.initialize();
    return Array.from(this.staff.values()).filter(s => s.role === role);
  }

  // Get expiration alerts
  async getExpirationAlerts(level?: 'info' | 'warning' | 'critical'): Promise<ExpirationAlert[]> {
    await this.initialize();
    let alerts = Array.from(this.alerts.values());
    if (level) {
      alerts = alerts.filter(a => a.alertLevel === level);
    }
    return alerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<ExpirationAlert | null> {
    await this.initialize();
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    await this.save();
    return alert;
  }

  // Update credential
  async updateCredential(staffId: string, credentialId: string, updates: Partial<Credential>): Promise<Credential | null> {
    await this.initialize();
    const member = this.staff.get(staffId);
    if (!member) return null;

    const credIndex = member.credentials.findIndex(c => c.id === credentialId);
    if (credIndex === -1) return null;

    member.credentials[credIndex] = { ...member.credentials[credIndex], ...updates };
    
    // Update status based on expiration
    const cred = member.credentials[credIndex];
    const now = new Date();
    const daysUntil = Math.ceil((cred.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) cred.status = 'expired';
    else if (daysUntil <= cred.reminderDays) cred.status = 'expiring_soon';
    else cred.status = 'active';

    // Recalculate compliance score
    this.calculateComplianceScore(member);
    
    await this.save();
    return cred;
  }

  // Add credential
  async addCredential(staffId: string, credential: Omit<Credential, 'id' | 'staffId'>): Promise<Credential | null> {
    await this.initialize();
    const member = this.staff.get(staffId);
    if (!member) return null;

    const newCred: Credential = {
      ...credential,
      id: `CRD-${Date.now()}`,
      staffId,
    };
    member.credentials.push(newCred);
    this.calculateComplianceScore(member);
    await this.save();
    return newCred;
  }

  // Verify credential
  async verifyCredential(staffId: string, credentialId: string, verifiedBy: string): Promise<Credential | null> {
    await this.initialize();
    return this.updateCredential(staffId, credentialId, {
      verificationDate: new Date(),
      verifiedBy,
    });
  }

  // Calculate compliance score
  private calculateComplianceScore(member: StaffMember): void {
    const requiredCreds = member.credentials.filter(c => c.isRequired);
    if (requiredCreds.length === 0) {
      member.complianceScore = 100;
      return;
    }

    const activeCreds = requiredCreds.filter(c => c.status === 'active' || c.status === 'expiring_soon');
    member.complianceScore = Math.round((activeCreds.length / requiredCreds.length) * 100);
  }

  // Generate compliance report
  async generateComplianceReport(): Promise<ComplianceReport> {
    await this.initialize();
    
    const allStaff = Array.from(this.staff.values());
    const now = new Date();
    
    const fullyCompliant = allStaff.filter(s => s.complianceScore === 100).length;
    const partiallyCompliant = allStaff.filter(s => s.complianceScore >= 80 && s.complianceScore < 100).length;
    const nonCompliant = allStaff.filter(s => s.complianceScore < 80).length;

    // Count expiring credentials
    let expiring30 = 0, expiring60 = 0, expiring90 = 0;
    allStaff.forEach(s => {
      s.credentials.forEach(c => {
        const daysUntil = Math.ceil((c.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 30) expiring30++;
        else if (daysUntil > 30 && daysUntil <= 60) expiring60++;
        else if (daysUntil > 60 && daysUntil <= 90) expiring90++;
      });
    });

    // By department
    const departments = [...new Set(allStaff.map(s => s.department))];
    const byDepartment = departments.map(dept => {
      const deptStaff = allStaff.filter(s => s.department === dept);
      const avgCompliance = deptStaff.reduce((sum, s) => sum + s.complianceScore, 0) / deptStaff.length;
      return { department: dept, compliance: Math.round(avgCompliance), staffCount: deptStaff.length };
    });

    // By role
    const roles: StaffRole[] = ['physician', 'nurse', 'technician', 'therapist', 'pharmacist'];
    const byRole = roles.map(role => {
      const roleStaff = allStaff.filter(s => s.role === role);
      if (roleStaff.length === 0) return { role, compliance: 100, staffCount: 0 };
      const avgCompliance = roleStaff.reduce((sum, s) => sum + s.complianceScore, 0) / roleStaff.length;
      return { role, compliance: Math.round(avgCompliance), staffCount: roleStaff.length };
    }).filter(r => r.staffCount > 0);

    const criticalAlerts = Array.from(this.alerts.values()).filter(a => a.alertLevel === 'critical');

    return {
      generatedAt: new Date(),
      period: 'Current',
      overallCompliance: Math.round(allStaff.reduce((sum, s) => sum + s.complianceScore, 0) / allStaff.length),
      totalStaff: allStaff.length,
      fullyCompliant,
      partiallyCompliant,
      nonCompliant,
      expiringIn30Days: expiring30,
      expiringIn60Days: expiring60,
      expiringIn90Days: expiring90,
      byDepartment,
      byRole,
      criticalAlerts,
    };
  }

  // Get credential requirements
  async getRequirements(): Promise<CredentialRequirement[]> {
    await this.initialize();
    return Array.from(this.requirements.values());
  }

  // Check staff compliance against requirements
  async checkStaffCompliance(staffId: string): Promise<{
    compliant: CredentialRequirement[];
    missing: CredentialRequirement[];
    expiring: { requirement: CredentialRequirement; credential: Credential; daysLeft: number }[];
  }> {
    await this.initialize();
    const member = this.staff.get(staffId);
    if (!member) return { compliant: [], missing: [], expiring: [] };

    const applicableReqs = Array.from(this.requirements.values()).filter(req => 
      req.applicableRoles.includes(member.role) &&
      (req.applicableDepartments.length === 0 || req.applicableDepartments.includes(member.department))
    );

    const compliant: CredentialRequirement[] = [];
    const missing: CredentialRequirement[] = [];
    const expiring: { requirement: CredentialRequirement; credential: Credential; daysLeft: number }[] = [];

    const now = new Date();

    applicableReqs.forEach(req => {
      const matchingCred = member.credentials.find(c => 
        c.name.toLowerCase().includes(req.name.toLowerCase()) ||
        req.name.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!matchingCred) {
        missing.push(req);
      } else if (matchingCred.status === 'expired') {
        missing.push(req);
      } else {
        compliant.push(req);
        const daysLeft = Math.ceil((matchingCred.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 90) {
          expiring.push({ requirement: req, credential: matchingCred, daysLeft });
        }
      }
    });

    return { compliant, missing, expiring };
  }

  // Get dashboard stats
  async getDashboardStats(): Promise<{
    totalStaff: number;
    overallCompliance: number;
    criticalAlerts: number;
    warningAlerts: number;
    expiringThisMonth: number;
    pendingVerifications: number;
  }> {
    await this.initialize();
    
    const allStaff = Array.from(this.staff.values());
    const alerts = Array.from(this.alerts.values());
    
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    let expiringThisMonth = 0;
    let pendingVerifications = 0;
    
    allStaff.forEach(s => {
      s.credentials.forEach(c => {
        if (c.expirationDate <= endOfMonth && c.expirationDate > now) expiringThisMonth++;
        if (!c.verificationDate) pendingVerifications++;
      });
    });

    return {
      totalStaff: allStaff.length,
      overallCompliance: Math.round(allStaff.reduce((sum, s) => sum + s.complianceScore, 0) / allStaff.length),
      criticalAlerts: alerts.filter(a => a.alertLevel === 'critical' && !a.acknowledged).length,
      warningAlerts: alerts.filter(a => a.alertLevel === 'warning' && !a.acknowledged).length,
      expiringThisMonth,
      pendingVerifications,
    };
  }
}

export const CredentialingService = new CredentialingServiceClass();
