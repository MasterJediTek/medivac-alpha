/**
 * Real-Time Bed Board Service
 * Interactive bed management with drag-and-drop transfers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type BedStatus = 'occupied' | 'available' | 'cleaning' | 'blocked' | 'reserved';
export type IsolationType = 'none' | 'contact' | 'droplet' | 'airborne' | 'protective';
export type TransferStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface Bed {
  id: string;
  unitId: string;
  roomNumber: string;
  bedLetter: string;
  status: BedStatus;
  isolationType: IsolationType;
  patient?: BedPatient;
  features: BedFeature[];
  lastStatusChange: number;
  cleaningStarted?: number;
  reservedFor?: string;
  reservedUntil?: number;
}

export interface BedPatient {
  id: string;
  name: string;
  mrn: string;
  admissionDate: number;
  expectedDischarge?: number;
  diagnosis: string;
  acuity: 1 | 2 | 3 | 4 | 5;
  attendingPhysician: string;
  primaryNurse?: string;
  alerts: PatientAlert[];
  isolationRequired: IsolationType;
}

export interface PatientAlert {
  type: 'fall_risk' | 'allergy' | 'isolation' | 'npo' | 'restraints' | 'code_status' | 'elopement';
  description: string;
  color: string;
}

export interface BedFeature {
  name: string;
  icon: string;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  floor: number;
  type: 'icu' | 'medsurg' | 'ed' | 'surgical' | 'pediatric' | 'maternity' | 'psych' | 'rehab';
  totalBeds: number;
  targetRatio: number;
  color: string;
}

export interface TransferRequest {
  id: string;
  patientId: string;
  patientName: string;
  fromBedId: string;
  fromUnitId: string;
  toBedId: string;
  toUnitId: string;
  reason: string;
  priority: 'routine' | 'urgent' | 'stat';
  requestedBy: string;
  requestedAt: number;
  status: TransferStatus;
  approvedBy?: string;
  approvedAt?: number;
  completedAt?: number;
  notes?: string;
}

export interface BedBoardSummary {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  cleaningBeds: number;
  blockedBeds: number;
  reservedBeds: number;
  occupancyRate: number;
  pendingAdmissions: number;
  pendingDischarges: number;
  pendingTransfers: number;
  avgTurnoverTime: number;
  unitSummaries: UnitSummary[];
}

export interface UnitSummary {
  unitId: string;
  unitName: string;
  totalBeds: number;
  occupied: number;
  available: number;
  cleaning: number;
  occupancyRate: number;
  color: string;
}

export interface DragDropResult {
  success: boolean;
  message: string;
  transferRequest?: TransferRequest;
}

// ============================================
// BED BOARD SERVICE
// ============================================

class BedBoardService {
  private units: Map<string, Unit> = new Map();
  private beds: Map<string, Bed> = new Map();
  private transfers: Map<string, TransferRequest> = new Map();
  private listeners: Set<() => void> = new Set();
  private readonly STORAGE_KEY = '@medivac_bed_board';

  constructor() {
    this.initializeUnits();
    this.initializeBeds();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeUnits(): void {
    const unitData: Unit[] = [
      { id: 'ICU', name: 'Intensive Care Unit', shortName: 'ICU', floor: 3, type: 'icu', totalBeds: 12, targetRatio: 2, color: '#EF4444' },
      { id: 'CCU', name: 'Cardiac Care Unit', shortName: 'CCU', floor: 3, type: 'icu', totalBeds: 8, targetRatio: 2, color: '#F97316' },
      { id: 'MS1', name: 'Medical-Surgical 1', shortName: 'MS1', floor: 4, type: 'medsurg', totalBeds: 24, targetRatio: 5, color: '#3B82F6' },
      { id: 'MS2', name: 'Medical-Surgical 2', shortName: 'MS2', floor: 4, type: 'medsurg', totalBeds: 24, targetRatio: 5, color: '#6366F1' },
      { id: 'SURG', name: 'Surgical Unit', shortName: 'SURG', floor: 5, type: 'surgical', totalBeds: 20, targetRatio: 4, color: '#8B5CF6' },
      { id: 'ED', name: 'Emergency Department', shortName: 'ED', floor: 1, type: 'ed', totalBeds: 30, targetRatio: 4, color: '#EC4899' },
      { id: 'PEDS', name: 'Pediatrics', shortName: 'PEDS', floor: 6, type: 'pediatric', totalBeds: 16, targetRatio: 4, color: '#14B8A6' },
      { id: 'OB', name: 'Obstetrics', shortName: 'OB', floor: 7, type: 'maternity', totalBeds: 18, targetRatio: 4, color: '#F472B6' },
    ];

    unitData.forEach(u => this.units.set(u.id, u));
  }

  private initializeBeds(): void {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Generate beds for each unit
    this.units.forEach((unit) => {
      const roomsPerUnit = Math.ceil(unit.totalBeds / 2);
      let bedCount = 0;

      for (let room = 1; room <= roomsPerUnit && bedCount < unit.totalBeds; room++) {
        const roomNum = `${unit.floor}${room.toString().padStart(2, '0')}`;
        
        ['A', 'B'].forEach((letter) => {
          if (bedCount >= unit.totalBeds) return;
          
          const bedId = `${unit.id}-${roomNum}${letter}`;
          const status = this.generateRandomStatus();
          
          const bed: Bed = {
            id: bedId,
            unitId: unit.id,
            roomNumber: roomNum,
            bedLetter: letter,
            status,
            isolationType: Math.random() > 0.85 ? this.randomIsolation() : 'none',
            features: this.generateBedFeatures(unit.type),
            lastStatusChange: now - Math.floor(Math.random() * 48 * 60 * 60 * 1000),
          };

          if (status === 'occupied') {
            bed.patient = this.generateRandomPatient(bedId, now, day);
          } else if (status === 'cleaning') {
            bed.cleaningStarted = now - Math.floor(Math.random() * 60 * 60 * 1000);
          } else if (status === 'reserved') {
            bed.reservedFor = `Incoming from ED - ${Math.random().toString(36).substring(7)}`;
            bed.reservedUntil = now + 2 * 60 * 60 * 1000;
          }

          this.beds.set(bedId, bed);
          bedCount++;
        });
      }
    });

    // Add some pending transfers
    this.generateSampleTransfers(now);
  }

  private generateRandomStatus(): BedStatus {
    const rand = Math.random();
    if (rand < 0.70) return 'occupied';
    if (rand < 0.82) return 'available';
    if (rand < 0.90) return 'cleaning';
    if (rand < 0.95) return 'reserved';
    return 'blocked';
  }

  private randomIsolation(): IsolationType {
    const types: IsolationType[] = ['contact', 'droplet', 'airborne', 'protective'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateBedFeatures(unitType: Unit['type']): BedFeature[] {
    const features: BedFeature[] = [];
    
    if (unitType === 'icu') {
      features.push({ name: 'Ventilator', icon: '🫁' });
      features.push({ name: 'Cardiac Monitor', icon: '💓' });
      if (Math.random() > 0.5) features.push({ name: 'CRRT', icon: '🩸' });
    } else if (unitType === 'surgical') {
      features.push({ name: 'PCA Pump', icon: '💉' });
    }
    
    if (Math.random() > 0.7) features.push({ name: 'Telemetry', icon: '📡' });
    
    return features;
  }

  private generateRandomPatient(bedId: string, now: number, day: number): BedPatient {
    const names = [
      'John Smith', 'Mary Johnson', 'Robert Williams', 'Patricia Brown',
      'Michael Davis', 'Linda Miller', 'William Wilson', 'Elizabeth Moore',
      'David Taylor', 'Barbara Anderson', 'Richard Thomas', 'Susan Jackson',
    ];

    const diagnoses = [
      'CHF Exacerbation', 'Community Acquired Pneumonia', 'COPD Exacerbation',
      'Acute MI', 'CVA', 'Hip Fracture', 'Diabetic Ketoacidosis',
      'Sepsis', 'GI Bleed', 'Acute Kidney Injury', 'Post-op Recovery',
    ];

    const physicians = [
      'Dr. Johnson', 'Dr. Smith', 'Dr. Williams', 'Dr. Brown',
      'Dr. Davis', 'Dr. Miller', 'Dr. Wilson', 'Dr. Moore',
    ];

    const alerts: PatientAlert[] = [];
    if (Math.random() > 0.7) alerts.push({ type: 'fall_risk', description: 'High Fall Risk', color: '#F59E0B' });
    if (Math.random() > 0.8) alerts.push({ type: 'allergy', description: 'Penicillin Allergy', color: '#EF4444' });
    if (Math.random() > 0.9) alerts.push({ type: 'npo', description: 'NPO', color: '#8B5CF6' });

    return {
      id: `PAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name: names[Math.floor(Math.random() * names.length)],
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      admissionDate: now - Math.floor(Math.random() * 7 * day),
      expectedDischarge: Math.random() > 0.3 ? now + Math.floor(Math.random() * 5 * day) : undefined,
      diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
      acuity: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
      attendingPhysician: physicians[Math.floor(Math.random() * physicians.length)],
      alerts,
      isolationRequired: Math.random() > 0.85 ? this.randomIsolation() : 'none',
    };
  }

  private generateSampleTransfers(now: number): void {
    const sampleTransfers: TransferRequest[] = [
      {
        id: 'TRF-001',
        patientId: 'PAT-001',
        patientName: 'John Smith',
        fromBedId: 'ED-101A',
        fromUnitId: 'ED',
        toBedId: 'ICU-301A',
        toUnitId: 'ICU',
        reason: 'Requires ICU level care - respiratory failure',
        priority: 'stat',
        requestedBy: 'Dr. Johnson',
        requestedAt: now - 30 * 60 * 1000,
        status: 'pending',
      },
      {
        id: 'TRF-002',
        patientId: 'PAT-002',
        patientName: 'Mary Johnson',
        fromBedId: 'ICU-302B',
        fromUnitId: 'ICU',
        toBedId: 'MS1-401A',
        toUnitId: 'MS1',
        reason: 'Step-down from ICU - stable for floor',
        priority: 'routine',
        requestedBy: 'Dr. Smith',
        requestedAt: now - 2 * 60 * 60 * 1000,
        status: 'approved',
        approvedBy: 'Charge Nurse Williams',
        approvedAt: now - 60 * 60 * 1000,
      },
    ];

    sampleTransfers.forEach(t => this.transfers.set(t.id, t));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.transfers) {
          parsed.transfers.forEach((t: TransferRequest) => this.transfers.set(t.id, t));
        }
      }
    } catch (error) {
      console.error('Failed to load bed board data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        transfers: Array.from(this.transfers.values()),
      }));
    } catch (error) {
      console.error('Failed to save bed board data:', error);
    }
  }

  // ============================================
  // DRAG AND DROP
  // ============================================

  initiateTransfer(
    patientId: string,
    fromBedId: string,
    toBedId: string,
    reason: string,
    priority: TransferRequest['priority'],
    requestedBy: string
  ): DragDropResult {
    const fromBed = this.beds.get(fromBedId);
    const toBed = this.beds.get(toBedId);

    if (!fromBed || !fromBed.patient) {
      return { success: false, message: 'Source bed has no patient' };
    }

    if (!toBed) {
      return { success: false, message: 'Destination bed not found' };
    }

    if (toBed.status !== 'available' && toBed.status !== 'reserved') {
      return { success: false, message: `Destination bed is ${toBed.status}` };
    }

    // Check isolation compatibility
    if (fromBed.patient.isolationRequired !== 'none' && toBed.isolationType === 'none') {
      // Allow but warn
    }

    const transfer: TransferRequest = {
      id: `TRF-${Date.now()}`,
      patientId,
      patientName: fromBed.patient.name,
      fromBedId,
      fromUnitId: fromBed.unitId,
      toBedId,
      toUnitId: toBed.unitId,
      reason,
      priority,
      requestedBy,
      requestedAt: Date.now(),
      status: 'pending',
    };

    this.transfers.set(transfer.id, transfer);

    // Reserve the destination bed
    toBed.status = 'reserved';
    toBed.reservedFor = `Transfer: ${fromBed.patient.name}`;
    toBed.reservedUntil = Date.now() + 4 * 60 * 60 * 1000;

    this.saveToStorage();
    this.notifyListeners();

    return {
      success: true,
      message: 'Transfer request created',
      transferRequest: transfer,
    };
  }

  approveTransfer(transferId: string, approvedBy: string): DragDropResult {
    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      return { success: false, message: 'Transfer not found' };
    }

    transfer.status = 'approved';
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = Date.now();

    this.saveToStorage();
    this.notifyListeners();

    return { success: true, message: 'Transfer approved', transferRequest: transfer };
  }

  executeTransfer(transferId: string): DragDropResult {
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.status !== 'approved') {
      return { success: false, message: 'Transfer not approved or not found' };
    }

    const fromBed = this.beds.get(transfer.fromBedId);
    const toBed = this.beds.get(transfer.toBedId);

    if (!fromBed || !toBed || !fromBed.patient) {
      return { success: false, message: 'Bed or patient not found' };
    }

    // Move patient
    toBed.patient = { ...fromBed.patient };
    toBed.status = 'occupied';
    toBed.reservedFor = undefined;
    toBed.reservedUntil = undefined;
    toBed.lastStatusChange = Date.now();

    // Mark source bed for cleaning
    fromBed.patient = undefined;
    fromBed.status = 'cleaning';
    fromBed.cleaningStarted = Date.now();
    fromBed.lastStatusChange = Date.now();

    // Update transfer
    transfer.status = 'completed';
    transfer.completedAt = Date.now();

    this.saveToStorage();
    this.notifyListeners();

    return { success: true, message: 'Transfer completed', transferRequest: transfer };
  }

  cancelTransfer(transferId: string, reason: string): DragDropResult {
    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      return { success: false, message: 'Transfer not found' };
    }

    // Release reserved bed
    const toBed = this.beds.get(transfer.toBedId);
    if (toBed && toBed.status === 'reserved') {
      toBed.status = 'available';
      toBed.reservedFor = undefined;
      toBed.reservedUntil = undefined;
    }

    transfer.status = 'cancelled';
    transfer.notes = reason;

    this.saveToStorage();
    this.notifyListeners();

    return { success: true, message: 'Transfer cancelled', transferRequest: transfer };
  }

  // ============================================
  // BED OPERATIONS
  // ============================================

  markBedClean(bedId: string): void {
    const bed = this.beds.get(bedId);
    if (bed && bed.status === 'cleaning') {
      bed.status = 'available';
      bed.cleaningStarted = undefined;
      bed.lastStatusChange = Date.now();
      this.notifyListeners();
    }
  }

  blockBed(bedId: string, reason: string): void {
    const bed = this.beds.get(bedId);
    if (bed && bed.status === 'available') {
      bed.status = 'blocked';
      bed.reservedFor = reason;
      bed.lastStatusChange = Date.now();
      this.notifyListeners();
    }
  }

  unblockBed(bedId: string): void {
    const bed = this.beds.get(bedId);
    if (bed && bed.status === 'blocked') {
      bed.status = 'available';
      bed.reservedFor = undefined;
      bed.lastStatusChange = Date.now();
      this.notifyListeners();
    }
  }

  dischargePatient(bedId: string): void {
    const bed = this.beds.get(bedId);
    if (bed && bed.patient) {
      bed.patient = undefined;
      bed.status = 'cleaning';
      bed.cleaningStarted = Date.now();
      bed.lastStatusChange = Date.now();
      this.notifyListeners();
    }
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  getUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  getUnit(unitId: string): Unit | undefined {
    return this.units.get(unitId);
  }

  getBeds(): Bed[] {
    return Array.from(this.beds.values());
  }

  getBedsByUnit(unitId: string): Bed[] {
    return Array.from(this.beds.values())
      .filter(b => b.unitId === unitId)
      .sort((a, b) => {
        if (a.roomNumber !== b.roomNumber) {
          return a.roomNumber.localeCompare(b.roomNumber);
        }
        return a.bedLetter.localeCompare(b.bedLetter);
      });
  }

  getBed(bedId: string): Bed | undefined {
    return this.beds.get(bedId);
  }

  getAvailableBeds(unitId?: string): Bed[] {
    return Array.from(this.beds.values())
      .filter(b => b.status === 'available' && (!unitId || b.unitId === unitId));
  }

  getPendingTransfers(): TransferRequest[] {
    return Array.from(this.transfers.values())
      .filter(t => t.status === 'pending' || t.status === 'approved')
      .sort((a, b) => {
        const priorityOrder = { stat: 0, urgent: 1, routine: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  getTransferHistory(): TransferRequest[] {
    return Array.from(this.transfers.values())
      .filter(t => t.status === 'completed' || t.status === 'cancelled')
      .sort((a, b) => (b.completedAt || b.requestedAt) - (a.completedAt || a.requestedAt));
  }

  // ============================================
  // SUMMARY AND ANALYTICS
  // ============================================

  getSummary(): BedBoardSummary {
    const beds = Array.from(this.beds.values());
    const transfers = Array.from(this.transfers.values());

    const statusCounts = {
      occupied: beds.filter(b => b.status === 'occupied').length,
      available: beds.filter(b => b.status === 'available').length,
      cleaning: beds.filter(b => b.status === 'cleaning').length,
      blocked: beds.filter(b => b.status === 'blocked').length,
      reserved: beds.filter(b => b.status === 'reserved').length,
    };

    const pendingDischarges = beds.filter(b => 
      b.patient?.expectedDischarge && b.patient.expectedDischarge <= Date.now() + 24 * 60 * 60 * 1000
    ).length;

    const pendingTransfers = transfers.filter(t => 
      t.status === 'pending' || t.status === 'approved'
    ).length;

    // Calculate average turnover time (cleaning beds)
    const cleaningBeds = beds.filter(b => b.status === 'cleaning' && b.cleaningStarted);
    const avgTurnover = cleaningBeds.length > 0
      ? cleaningBeds.reduce((sum, b) => sum + (Date.now() - (b.cleaningStarted || 0)), 0) / cleaningBeds.length / 60000
      : 0;

    const unitSummaries: UnitSummary[] = Array.from(this.units.values()).map(unit => {
      const unitBeds = beds.filter(b => b.unitId === unit.id);
      const occupied = unitBeds.filter(b => b.status === 'occupied').length;
      const available = unitBeds.filter(b => b.status === 'available').length;
      const cleaning = unitBeds.filter(b => b.status === 'cleaning').length;

      return {
        unitId: unit.id,
        unitName: unit.shortName,
        totalBeds: unitBeds.length,
        occupied,
        available,
        cleaning,
        occupancyRate: Math.round((occupied / unitBeds.length) * 100),
        color: unit.color,
      };
    });

    return {
      totalBeds: beds.length,
      occupiedBeds: statusCounts.occupied,
      availableBeds: statusCounts.available,
      cleaningBeds: statusCounts.cleaning,
      blockedBeds: statusCounts.blocked,
      reservedBeds: statusCounts.reserved,
      occupancyRate: Math.round((statusCounts.occupied / beds.length) * 100),
      pendingAdmissions: statusCounts.reserved,
      pendingDischarges,
      pendingTransfers,
      avgTurnoverTime: Math.round(avgTurnover),
      unitSummaries,
    };
  }

  // ============================================
  // STATUS HELPERS
  // ============================================

  getStatusColor(status: BedStatus): string {
    const colors: Record<BedStatus, string> = {
      occupied: '#3B82F6',
      available: '#22C55E',
      cleaning: '#F59E0B',
      blocked: '#6B7280',
      reserved: '#8B5CF6',
    };
    return colors[status];
  }

  getStatusLabel(status: BedStatus): string {
    const labels: Record<BedStatus, string> = {
      occupied: 'Occupied',
      available: 'Available',
      cleaning: 'Cleaning',
      blocked: 'Blocked',
      reserved: 'Reserved',
    };
    return labels[status];
  }

  getIsolationColor(type: IsolationType): string {
    const colors: Record<IsolationType, string> = {
      none: 'transparent',
      contact: '#F59E0B',
      droplet: '#3B82F6',
      airborne: '#EF4444',
      protective: '#8B5CF6',
    };
    return colors[type];
  }

  getAcuityColor(acuity: number): string {
    const colors: Record<number, string> = {
      1: '#22C55E',
      2: '#84CC16',
      3: '#F59E0B',
      4: '#F97316',
      5: '#EF4444',
    };
    return colors[acuity] || '#6B7280';
  }

  // ============================================
  // SUBSCRIPTION
  // ============================================

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const bedBoardService = new BedBoardService();
