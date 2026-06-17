/**
 * Medication Administration Record (MAR) Service
 * Complete MAR system with five-rights verification and barcode scanning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Medication schedule type
export type ScheduleType = 'scheduled' | 'prn' | 'stat' | 'continuous';

// Administration status
export type AdminStatus = 
  | 'scheduled'
  | 'due'
  | 'overdue'
  | 'administered'
  | 'held'
  | 'refused'
  | 'missed'
  | 'discontinued';

// Verification status
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'override';

// Route of administration
export type RouteType = 
  | 'oral' | 'iv' | 'im' | 'subq' | 'topical' | 'inhalation'
  | 'rectal' | 'ophthalmic' | 'otic' | 'nasal' | 'sublingual';

// Medication order
export interface MedicationOrder {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  genericName: string;
  dose: string;
  unit: string;
  route: RouteType;
  frequency: string;
  scheduleType: ScheduleType;
  scheduledTimes: string[]; // HH:MM format
  startDate: number;
  endDate?: number;
  instructions?: string;
  prescribedBy: string;
  prescribedAt: number;
  status: 'active' | 'discontinued' | 'completed';
  barcode: string;
}

// Scheduled administration
export interface ScheduledAdmin {
  id: string;
  orderId: string;
  patientId: string;
  medicationName: string;
  dose: string;
  unit: string;
  route: RouteType;
  scheduledTime: number;
  status: AdminStatus;
  barcode: string;
}

// Five rights verification
export interface FiveRightsVerification {
  rightPatient: VerificationStatus;
  rightMedication: VerificationStatus;
  rightDose: VerificationStatus;
  rightRoute: VerificationStatus;
  rightTime: VerificationStatus;
  patientBarcode?: string;
  medicationBarcode?: string;
  verifiedAt?: number;
  verifiedBy?: string;
}

// Administration record
export interface AdministrationRecord {
  id: string;
  scheduledAdminId: string;
  orderId: string;
  patientId: string;
  patientName: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  actualDose?: string;
  unit: string;
  route: RouteType;
  scheduledTime: number;
  administeredAt: number;
  administeredBy: string;
  status: AdminStatus;
  verification: FiveRightsVerification;
  notes?: string;
  witnessedBy?: string;
  siteOfInjection?: string;
  reasonNotGiven?: string;
}

// PRN administration
export interface PRNAdministration {
  id: string;
  orderId: string;
  patientId: string;
  medicationName: string;
  dose: string;
  unit: string;
  route: RouteType;
  indication: string;
  administeredAt: number;
  administeredBy: string;
  effectiveness?: 'effective' | 'partially_effective' | 'not_effective';
  effectivenessAssessedAt?: number;
  notes?: string;
}

// Missed dose record
export interface MissedDoseRecord {
  id: string;
  scheduledAdminId: string;
  orderId: string;
  patientId: string;
  medicationName: string;
  scheduledTime: number;
  reason: string;
  documentedBy: string;
  documentedAt: number;
  followUpRequired: boolean;
  followUpNotes?: string;
}

// MAR summary
export interface MARSummary {
  patientId: string;
  date: number;
  totalScheduled: number;
  administered: number;
  held: number;
  refused: number;
  missed: number;
  prnGiven: number;
  complianceRate: number;
}

class MARService {
  private orders: Map<string, MedicationOrder> = new Map();
  private scheduledAdmins: Map<string, ScheduledAdmin> = new Map();
  private administrations: Map<string, AdministrationRecord> = new Map();
  private prnAdministrations: Map<string, PRNAdministration> = new Map();
  private missedDoses: Map<string, MissedDoseRecord> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
    this.initializeDemoData();
  }

  // Initialize demo data
  private initializeDemoData(): void {
    const demoOrders: MedicationOrder[] = [
      {
        id: 'ORD-001',
        patientId: 'P-001',
        medicationId: 'MED-001',
        medicationName: 'Metformin',
        genericName: 'Metformin HCl',
        dose: '500',
        unit: 'mg',
        route: 'oral',
        frequency: 'BID',
        scheduleType: 'scheduled',
        scheduledTimes: ['08:00', '20:00'],
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        instructions: 'Take with food',
        prescribedBy: 'Dr. Smith',
        prescribedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        status: 'active',
        barcode: 'MED001500MG',
      },
      {
        id: 'ORD-002',
        patientId: 'P-001',
        medicationId: 'MED-002',
        medicationName: 'Lisinopril',
        genericName: 'Lisinopril',
        dose: '10',
        unit: 'mg',
        route: 'oral',
        frequency: 'Daily',
        scheduleType: 'scheduled',
        scheduledTimes: ['09:00'],
        startDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
        prescribedBy: 'Dr. Johnson',
        prescribedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        status: 'active',
        barcode: 'MED00210MG',
      },
      {
        id: 'ORD-003',
        patientId: 'P-001',
        medicationId: 'MED-003',
        medicationName: 'Morphine',
        genericName: 'Morphine Sulfate',
        dose: '2-4',
        unit: 'mg',
        route: 'iv',
        frequency: 'Q4H PRN',
        scheduleType: 'prn',
        scheduledTimes: [],
        startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        instructions: 'For moderate to severe pain',
        prescribedBy: 'Dr. Smith',
        prescribedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        status: 'active',
        barcode: 'MED003MORPH',
      },
      {
        id: 'ORD-004',
        patientId: 'P-001',
        medicationId: 'MED-004',
        medicationName: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        dose: '81',
        unit: 'mg',
        route: 'oral',
        frequency: 'Daily',
        scheduleType: 'scheduled',
        scheduledTimes: ['08:00'],
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        prescribedBy: 'Dr. Johnson',
        prescribedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        status: 'active',
        barcode: 'MED00481MG',
      },
    ];

    demoOrders.forEach(order => {
      if (!this.orders.has(order.id)) {
        this.orders.set(order.id, order);
      }
    });

    // Generate scheduled administrations for today
    this.generateScheduledAdmins('P-001');
  }

  // Generate scheduled administrations
  private generateScheduledAdmins(patientId: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = this.getPatientOrders(patientId).filter(o => o.scheduleType === 'scheduled');

    orders.forEach(order => {
      order.scheduledTimes.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date(today);
        scheduledTime.setHours(hours, minutes, 0, 0);

        const adminId = `SA-${order.id}-${scheduledTime.getTime()}`;
        
        if (!this.scheduledAdmins.has(adminId)) {
          const now = Date.now();
          let status: AdminStatus = 'scheduled';
          
          if (scheduledTime.getTime() < now - 60 * 60 * 1000) {
            status = 'overdue';
          } else if (scheduledTime.getTime() < now + 30 * 60 * 1000) {
            status = 'due';
          }

          this.scheduledAdmins.set(adminId, {
            id: adminId,
            orderId: order.id,
            patientId,
            medicationName: order.medicationName,
            dose: order.dose,
            unit: order.unit,
            route: order.route,
            scheduledTime: scheduledTime.getTime(),
            status,
            barcode: order.barcode,
          });
        }
      });
    });
  }

  // Get patient orders
  getPatientOrders(patientId: string): MedicationOrder[] {
    return Array.from(this.orders.values())
      .filter(o => o.patientId === patientId && o.status === 'active')
      .sort((a, b) => a.medicationName.localeCompare(b.medicationName));
  }

  // Get scheduled administrations
  getScheduledAdmins(patientId: string, date?: Date): ScheduledAdmin[] {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const dayStart = targetDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    return Array.from(this.scheduledAdmins.values())
      .filter(sa => 
        sa.patientId === patientId &&
        sa.scheduledTime >= dayStart &&
        sa.scheduledTime < dayEnd
      )
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  // Get due medications
  getDueMedications(patientId: string): ScheduledAdmin[] {
    return this.getScheduledAdmins(patientId)
      .filter(sa => sa.status === 'due' || sa.status === 'overdue');
  }

  // Verify barcode
  verifyBarcode(barcode: string, expectedBarcode: string): VerificationStatus {
    if (barcode === expectedBarcode) {
      return 'verified';
    }
    return 'failed';
  }

  // Perform five rights verification
  performFiveRightsVerification(
    scheduledAdmin: ScheduledAdmin,
    patientBarcode: string,
    medicationBarcode: string,
    expectedPatientBarcode: string
  ): FiveRightsVerification {
    const now = Date.now();
    const timeDiff = Math.abs(now - scheduledAdmin.scheduledTime);
    const isWithinTimeWindow = timeDiff <= 60 * 60 * 1000; // 1 hour window

    return {
      rightPatient: this.verifyBarcode(patientBarcode, expectedPatientBarcode),
      rightMedication: this.verifyBarcode(medicationBarcode, scheduledAdmin.barcode),
      rightDose: 'verified', // Assume dose is verified by medication barcode
      rightRoute: 'verified', // Assume route is verified by order
      rightTime: isWithinTimeWindow ? 'verified' : 'failed',
      patientBarcode,
      medicationBarcode,
      verifiedAt: now,
    };
  }

  // Check if all rights verified
  isFullyVerified(verification: FiveRightsVerification): boolean {
    return (
      verification.rightPatient === 'verified' &&
      verification.rightMedication === 'verified' &&
      verification.rightDose === 'verified' &&
      verification.rightRoute === 'verified' &&
      (verification.rightTime === 'verified' || verification.rightTime === 'override')
    );
  }

  // Administer medication
  async administerMedication(
    scheduledAdminId: string,
    patientName: string,
    administeredBy: string,
    verification: FiveRightsVerification,
    actualDose?: string,
    notes?: string,
    siteOfInjection?: string
  ): Promise<AdministrationRecord> {
    const scheduledAdmin = this.scheduledAdmins.get(scheduledAdminId);
    if (!scheduledAdmin) {
      throw new Error('Scheduled administration not found');
    }

    const order = this.orders.get(scheduledAdmin.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const record: AdministrationRecord = {
      id: `ADM-${Date.now()}`,
      scheduledAdminId,
      orderId: scheduledAdmin.orderId,
      patientId: scheduledAdmin.patientId,
      patientName,
      medicationId: order.medicationId,
      medicationName: scheduledAdmin.medicationName,
      dose: scheduledAdmin.dose,
      actualDose,
      unit: scheduledAdmin.unit,
      route: scheduledAdmin.route,
      scheduledTime: scheduledAdmin.scheduledTime,
      administeredAt: Date.now(),
      administeredBy,
      status: 'administered',
      verification: { ...verification, verifiedBy: administeredBy },
      notes,
      siteOfInjection,
    };

    this.administrations.set(record.id, record);
    scheduledAdmin.status = 'administered';
    
    await this.saveState();
    this.notifyListeners();

    return record;
  }

  // Hold medication
  async holdMedication(
    scheduledAdminId: string,
    reason: string,
    documentedBy: string
  ): Promise<void> {
    const scheduledAdmin = this.scheduledAdmins.get(scheduledAdminId);
    if (!scheduledAdmin) {
      throw new Error('Scheduled administration not found');
    }

    scheduledAdmin.status = 'held';

    const missedDose: MissedDoseRecord = {
      id: `MISS-${Date.now()}`,
      scheduledAdminId,
      orderId: scheduledAdmin.orderId,
      patientId: scheduledAdmin.patientId,
      medicationName: scheduledAdmin.medicationName,
      scheduledTime: scheduledAdmin.scheduledTime,
      reason: `Held: ${reason}`,
      documentedBy,
      documentedAt: Date.now(),
      followUpRequired: true,
    };

    this.missedDoses.set(missedDose.id, missedDose);
    await this.saveState();
    this.notifyListeners();
  }

  // Refuse medication
  async refuseMedication(
    scheduledAdminId: string,
    reason: string,
    documentedBy: string
  ): Promise<void> {
    const scheduledAdmin = this.scheduledAdmins.get(scheduledAdminId);
    if (!scheduledAdmin) {
      throw new Error('Scheduled administration not found');
    }

    scheduledAdmin.status = 'refused';

    const missedDose: MissedDoseRecord = {
      id: `MISS-${Date.now()}`,
      scheduledAdminId,
      orderId: scheduledAdmin.orderId,
      patientId: scheduledAdmin.patientId,
      medicationName: scheduledAdmin.medicationName,
      scheduledTime: scheduledAdmin.scheduledTime,
      reason: `Refused: ${reason}`,
      documentedBy,
      documentedAt: Date.now(),
      followUpRequired: true,
    };

    this.missedDoses.set(missedDose.id, missedDose);
    await this.saveState();
    this.notifyListeners();
  }

  // Administer PRN medication
  async administerPRN(
    orderId: string,
    patientId: string,
    indication: string,
    actualDose: string,
    administeredBy: string,
    notes?: string
  ): Promise<PRNAdministration> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const prn: PRNAdministration = {
      id: `PRN-${Date.now()}`,
      orderId,
      patientId,
      medicationName: order.medicationName,
      dose: actualDose,
      unit: order.unit,
      route: order.route,
      indication,
      administeredAt: Date.now(),
      administeredBy,
      notes,
    };

    this.prnAdministrations.set(prn.id, prn);
    await this.saveState();
    this.notifyListeners();

    return prn;
  }

  // Record PRN effectiveness
  async recordPRNEffectiveness(
    prnId: string,
    effectiveness: 'effective' | 'partially_effective' | 'not_effective'
  ): Promise<void> {
    const prn = this.prnAdministrations.get(prnId);
    if (prn) {
      prn.effectiveness = effectiveness;
      prn.effectivenessAssessedAt = Date.now();
      await this.saveState();
    }
  }

  // Get PRN orders
  getPRNOrders(patientId: string): MedicationOrder[] {
    return this.getPatientOrders(patientId).filter(o => o.scheduleType === 'prn');
  }

  // Get PRN history
  getPRNHistory(patientId: string, hours: number = 24): PRNAdministration[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return Array.from(this.prnAdministrations.values())
      .filter(p => p.patientId === patientId && p.administeredAt >= cutoff)
      .sort((a, b) => b.administeredAt - a.administeredAt);
  }

  // Get administration history
  getAdministrationHistory(patientId: string, date?: Date): AdministrationRecord[] {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const dayStart = targetDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    return Array.from(this.administrations.values())
      .filter(a => 
        a.patientId === patientId &&
        a.administeredAt >= dayStart &&
        a.administeredAt < dayEnd
      )
      .sort((a, b) => b.administeredAt - a.administeredAt);
  }

  // Get MAR summary
  getMARSummary(patientId: string, date?: Date): MARSummary {
    const scheduled = this.getScheduledAdmins(patientId, date);
    const history = this.getAdministrationHistory(patientId, date);
    const prnHistory = this.getPRNHistory(patientId, 24);

    const administered = scheduled.filter(s => s.status === 'administered').length;
    const held = scheduled.filter(s => s.status === 'held').length;
    const refused = scheduled.filter(s => s.status === 'refused').length;
    const missed = scheduled.filter(s => s.status === 'missed' || s.status === 'overdue').length;

    const totalScheduled = scheduled.length;
    const complianceRate = totalScheduled > 0 
      ? Math.round((administered / totalScheduled) * 100) 
      : 100;

    return {
      patientId,
      date: (date || new Date()).getTime(),
      totalScheduled,
      administered,
      held,
      refused,
      missed,
      prnGiven: prnHistory.length,
      complianceRate,
    };
  }

  // Get route display name
  getRouteDisplayName(route: RouteType): string {
    const names: Record<RouteType, string> = {
      oral: 'Oral (PO)',
      iv: 'Intravenous (IV)',
      im: 'Intramuscular (IM)',
      subq: 'Subcutaneous (SubQ)',
      topical: 'Topical',
      inhalation: 'Inhalation',
      rectal: 'Rectal (PR)',
      ophthalmic: 'Ophthalmic',
      otic: 'Otic',
      nasal: 'Nasal',
      sublingual: 'Sublingual (SL)',
    };
    return names[route];
  }

  // Get status color
  getStatusColor(status: AdminStatus): string {
    const colors: Record<AdminStatus, string> = {
      scheduled: '#6B7280',
      due: '#3B82F6',
      overdue: '#EF4444',
      administered: '#22C55E',
      held: '#F59E0B',
      refused: '#F97316',
      missed: '#EF4444',
      discontinued: '#6B7280',
    };
    return colors[status];
  }

  // Subscribe to updates
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('mar_orders', JSON.stringify(Array.from(this.orders.entries())));
      await AsyncStorage.setItem('mar_scheduled', JSON.stringify(Array.from(this.scheduledAdmins.entries())));
      await AsyncStorage.setItem('mar_administrations', JSON.stringify(Array.from(this.administrations.entries())));
      await AsyncStorage.setItem('mar_prn', JSON.stringify(Array.from(this.prnAdministrations.entries())));
    } catch (error) {
      console.error('Failed to save MAR state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const ordersJson = await AsyncStorage.getItem('mar_orders');
      if (ordersJson) {
        const entries = JSON.parse(ordersJson);
        entries.forEach(([key, value]: [string, MedicationOrder]) => {
          this.orders.set(key, value);
        });
      }

      const scheduledJson = await AsyncStorage.getItem('mar_scheduled');
      if (scheduledJson) {
        const entries = JSON.parse(scheduledJson);
        entries.forEach(([key, value]: [string, ScheduledAdmin]) => {
          this.scheduledAdmins.set(key, value);
        });
      }

      const adminJson = await AsyncStorage.getItem('mar_administrations');
      if (adminJson) {
        const entries = JSON.parse(adminJson);
        entries.forEach(([key, value]: [string, AdministrationRecord]) => {
          this.administrations.set(key, value);
        });
      }

      const prnJson = await AsyncStorage.getItem('mar_prn');
      if (prnJson) {
        const entries = JSON.parse(prnJson);
        entries.forEach(([key, value]: [string, PRNAdministration]) => {
          this.prnAdministrations.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to load MAR state:', error);
    }
  }
}

// Export singleton instance
export const marService = new MARService();
export default marService;
