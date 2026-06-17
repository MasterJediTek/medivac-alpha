/**
 * Patient Onboarding Service with WACHS Staffing Integration
 * All new users default to patient role awaiting WACHS staffing approval
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { homingBeaconService, DEFAULT_BEACON_CODE } from './homing-beacon-service';

const STORAGE_KEY = 'medivac_patient_onboarding';

export type OnboardingStatus = 'pending' | 'in_progress' | 'awaiting_staffing' | 'approved' | 'rejected';
export type UserType = 'patient' | 'staff_pending' | 'staff_approved' | 'admin';
export type WACHSRegion = 'Perth' | 'Kimberley' | 'Pilbara' | 'Midwest' | 'Goldfields' | 'Southwest' | 'Great_Southern';

export interface PatientOnboarding {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  userType: UserType;
  status: OnboardingStatus;
  wachsRegion?: WACHSRegion;
  wachsSite?: string;
  beaconId?: string;
  beaconCode?: string;
  createdAt: string;
  updatedAt: string;
  staffingRequestId?: string;
  staffingApprovedBy?: string;
  staffingApprovedAt?: string;
  notes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
  };
}

export interface StaffingRequest {
  id: string;
  onboardingId: string;
  userId: string;
  userName: string;
  requestedRole: 'nurse' | 'doctor' | 'admin' | 'technician' | 'support';
  wachsRegion: WACHSRegion;
  wachsSite: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  credentials?: string[];
  notes?: string;
}

export const STATUS_COLORS: Record<OnboardingStatus, { primary: string; background: string; text: string }> = {
  pending: { primary: '#6B7280', background: '#F3F4F6', text: '#374151' },
  in_progress: { primary: '#3B82F6', background: '#EFF6FF', text: '#1E40AF' },
  awaiting_staffing: { primary: '#F59E0B', background: '#FFFBEB', text: '#B45309' },
  approved: { primary: '#22C55E', background: '#F0FDF4', text: '#166534' },
  rejected: { primary: '#EF4444', background: '#FEF2F2', text: '#991B1B' },
};

export const WACHS_REGIONS: { region: WACHSRegion; sites: string[] }[] = [
  { region: 'Perth', sites: ['Royal Perth Hospital', 'Fiona Stanley Hospital', 'Sir Charles Gairdner Hospital'] },
  { region: 'Kimberley', sites: ['Broome Hospital', 'Kununurra Hospital', 'Derby Hospital'] },
  { region: 'Pilbara', sites: ['Hedland Health Campus', 'Karratha Health Campus', 'Newman Hospital'] },
  { region: 'Midwest', sites: ['Geraldton Hospital', 'Carnarvon Hospital', 'Meekatharra Hospital'] },
  { region: 'Goldfields', sites: ['Kalgoorlie Hospital', 'Esperance Hospital', 'Laverton Hospital'] },
  { region: 'Southwest', sites: ['Bunbury Hospital', 'Busselton Hospital', 'Margaret River Hospital'] },
  { region: 'Great_Southern', sites: ['Albany Hospital', 'Katanning Hospital', 'Mount Barker Hospital'] },
];

class PatientOnboardingService {
  private onboardings: PatientOnboarding[] = [];
  private staffingRequests: StaffingRequest[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.onboardings = data.onboardings || [];
        this.staffingRequests = data.staffingRequests || [];
      } else {
        this.generateSampleData();
        await this.save();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize patient onboarding:', error);
      this.generateSampleData();
      this.initialized = true;
    }
  }

  private generateSampleData(): void {
    const now = new Date();
    
    this.onboardings = [
      {
        id: 'onb_1',
        userId: 'P-2024-0900',
        fullName: 'Alice Thompson',
        email: 'alice.t@email.com',
        phone: '+61 400 123 456',
        dateOfBirth: '1985-03-15',
        userType: 'patient',
        status: 'approved',
        wachsRegion: 'Perth',
        wachsSite: 'Royal Perth Hospital',
        beaconId: 'BCN-G-0003',
        beaconCode: 'green',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        emergencyContact: { name: 'Bob Thompson', phone: '+61 400 789 012', relationship: 'Spouse' },
      },
      {
        id: 'onb_2',
        userId: 'P-2024-0901',
        fullName: 'James Wilson',
        email: 'james.w@email.com',
        phone: '+61 400 234 567',
        userType: 'patient',
        status: 'in_progress',
        wachsRegion: 'Kimberley',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'onb_3',
        userId: 'U-2024-0050',
        fullName: 'Dr. Sarah Chen',
        email: 'sarah.chen@wachs.health.wa.gov.au',
        phone: '+61 400 345 678',
        userType: 'staff_pending',
        status: 'awaiting_staffing',
        wachsRegion: 'Pilbara',
        wachsSite: 'Hedland Health Campus',
        staffingRequestId: 'sr_1',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        notes: 'Awaiting WACHS staffing approval for doctor role',
      },
      {
        id: 'onb_4',
        userId: 'U-2024-0051',
        fullName: 'Nurse Michael Brown',
        email: 'michael.brown@wachs.health.wa.gov.au',
        userType: 'staff_approved',
        status: 'approved',
        wachsRegion: 'Southwest',
        wachsSite: 'Bunbury Hospital',
        staffingRequestId: 'sr_2',
        staffingApprovedBy: 'HR Manager',
        staffingApprovedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'onb_5',
        userId: 'P-2024-0902',
        fullName: 'Emily Davis',
        userType: 'patient',
        status: 'pending',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    this.staffingRequests = [
      {
        id: 'sr_1',
        onboardingId: 'onb_3',
        userId: 'U-2024-0050',
        userName: 'Dr. Sarah Chen',
        requestedRole: 'doctor',
        wachsRegion: 'Pilbara',
        wachsSite: 'Hedland Health Campus',
        status: 'under_review',
        requestedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        credentials: ['MBBS', 'FRACGP', 'Emergency Medicine Certificate'],
        notes: 'Experienced GP seeking rural placement',
      },
      {
        id: 'sr_2',
        onboardingId: 'onb_4',
        userId: 'U-2024-0051',
        userName: 'Nurse Michael Brown',
        requestedRole: 'nurse',
        wachsRegion: 'Southwest',
        wachsSite: 'Bunbury Hospital',
        status: 'approved',
        requestedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'HR Manager',
        reviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        credentials: ['RN', 'Critical Care Certificate'],
      },
      {
        id: 'sr_3',
        onboardingId: 'onb_6',
        userId: 'U-2024-0052',
        userName: 'Tech Support John',
        requestedRole: 'technician',
        wachsRegion: 'Goldfields',
        wachsSite: 'Kalgoorlie Hospital',
        status: 'pending',
        requestedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        credentials: ['IT Certification', 'Medical Equipment Training'],
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        onboardings: this.onboardings,
        staffingRequests: this.staffingRequests,
      }));
    } catch (error) {
      console.error('Failed to save patient onboarding:', error);
    }
  }

  getOnboardings(filter?: { status?: OnboardingStatus[]; userType?: UserType[] }): PatientOnboarding[] {
    let filtered = [...this.onboardings];
    
    if (filter?.status?.length) {
      filtered = filtered.filter(o => filter.status!.includes(o.status));
    }
    if (filter?.userType?.length) {
      filtered = filtered.filter(o => filter.userType!.includes(o.userType));
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getStaffingRequests(filter?: { status?: StaffingRequest['status'][] }): StaffingRequest[] {
    let filtered = [...this.staffingRequests];
    
    if (filter?.status?.length) {
      filtered = filtered.filter(r => filter.status!.includes(r.status));
    }
    
    return filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async createNewUser(
    fullName: string,
    email?: string,
    phone?: string,
    wachsRegion?: WACHSRegion,
    wachsSite?: string
  ): Promise<PatientOnboarding> {
    const now = new Date().toISOString();
    const userId = `P-${new Date().getFullYear()}-${String(this.onboardings.length + 900).padStart(4, '0')}`;
    
    // All new users default to patient role
    const onboarding: PatientOnboarding = {
      id: `onb_${Date.now()}`,
      userId,
      fullName,
      email,
      phone,
      userType: 'patient', // DEFAULT: All new users are patients
      status: 'pending',
      wachsRegion,
      wachsSite,
      createdAt: now,
      updatedAt: now,
    };
    
    this.onboardings.unshift(onboarding);
    await this.save();
    
    return onboarding;
  }

  async assignBeaconAndApprove(onboardingId: string): Promise<PatientOnboarding | null> {
    const onboarding = this.onboardings.find(o => o.id === onboardingId);
    if (!onboarding) return null;
    
    // Initialize beacon service and assign green beacon
    await homingBeaconService.initialize();
    const beacon = await homingBeaconService.assignBeaconToNewUser(
      onboarding.userId,
      onboarding.fullName,
      'patient',
      'System',
      DEFAULT_BEACON_CODE, // Always green for new patients
      onboarding.wachsSite,
      'New patient onboarding'
    );
    
    if (beacon) {
      onboarding.beaconId = beacon.id;
      onboarding.beaconCode = beacon.code;
    }
    
    onboarding.status = 'approved';
    onboarding.updatedAt = new Date().toISOString();
    
    await this.save();
    return onboarding;
  }

  async requestStaffRole(
    onboardingId: string,
    requestedRole: StaffingRequest['requestedRole'],
    wachsRegion: WACHSRegion,
    wachsSite: string,
    credentials?: string[],
    notes?: string
  ): Promise<StaffingRequest | null> {
    const onboarding = this.onboardings.find(o => o.id === onboardingId);
    if (!onboarding) return null;
    
    const request: StaffingRequest = {
      id: `sr_${Date.now()}`,
      onboardingId,
      userId: onboarding.userId,
      userName: onboarding.fullName,
      requestedRole,
      wachsRegion,
      wachsSite,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      credentials,
      notes,
    };
    
    // Update onboarding to awaiting staffing
    onboarding.userType = 'staff_pending';
    onboarding.status = 'awaiting_staffing';
    onboarding.staffingRequestId = request.id;
    onboarding.wachsRegion = wachsRegion;
    onboarding.wachsSite = wachsSite;
    onboarding.updatedAt = new Date().toISOString();
    
    this.staffingRequests.unshift(request);
    await this.save();
    
    return request;
  }

  async approveStaffingRequest(requestId: string, approvedBy: string): Promise<boolean> {
    const request = this.staffingRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending' && request.status !== 'under_review') return false;
    
    request.status = 'approved';
    request.reviewedBy = approvedBy;
    request.reviewedAt = new Date().toISOString();
    
    // Update onboarding
    const onboarding = this.onboardings.find(o => o.id === request.onboardingId);
    if (onboarding) {
      onboarding.userType = 'staff_approved';
      onboarding.status = 'approved';
      onboarding.staffingApprovedBy = approvedBy;
      onboarding.staffingApprovedAt = request.reviewedAt;
      onboarding.updatedAt = request.reviewedAt;
    }
    
    await this.save();
    return true;
  }

  async rejectStaffingRequest(requestId: string, rejectedBy: string, reason: string): Promise<boolean> {
    const request = this.staffingRequests.find(r => r.id === requestId);
    if (!request) return false;
    
    request.status = 'rejected';
    request.reviewedBy = rejectedBy;
    request.reviewedAt = new Date().toISOString();
    request.rejectionReason = reason;
    
    // Update onboarding - revert to patient
    const onboarding = this.onboardings.find(o => o.id === request.onboardingId);
    if (onboarding) {
      onboarding.userType = 'patient';
      onboarding.status = 'pending';
      onboarding.notes = `Staff request rejected: ${reason}`;
      onboarding.updatedAt = request.reviewedAt;
    }
    
    await this.save();
    return true;
  }

  getStats(): {
    totalOnboardings: number;
    byStatus: Record<OnboardingStatus, number>;
    byUserType: Record<UserType, number>;
    pendingStaffing: number;
  } {
    const byStatus: Record<OnboardingStatus, number> = {
      pending: 0, in_progress: 0, awaiting_staffing: 0, approved: 0, rejected: 0
    };
    const byUserType: Record<UserType, number> = {
      patient: 0, staff_pending: 0, staff_approved: 0, admin: 0
    };
    
    this.onboardings.forEach(o => {
      byStatus[o.status]++;
      byUserType[o.userType]++;
    });
    
    const pendingStaffing = this.staffingRequests.filter(r => 
      r.status === 'pending' || r.status === 'under_review'
    ).length;
    
    return {
      totalOnboardings: this.onboardings.length,
      byStatus,
      byUserType,
      pendingStaffing,
    };
  }
}

export const patientOnboardingService = new PatientOnboardingService();
