/**
 * Bed Management Service
 * Real-time bed availability tracking with ADT workflow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Bed status
export type BedStatus = 
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'cleaning'
  | 'maintenance'
  | 'blocked';

// Bed type
export type BedType = 
  | 'standard'
  | 'icu'
  | 'isolation'
  | 'pediatric'
  | 'maternity'
  | 'bariatric'
  | 'psychiatric';

// Cleaning status
export type CleaningStatus = 'clean' | 'dirty' | 'in_progress' | 'terminal_clean';

// ADT event type
export type ADTEventType = 'admission' | 'discharge' | 'transfer';

// Unit/Floor
export interface Unit {
  id: string;
  name: string;
  floor: string;
  building: string;
  totalBeds: number;
  bedTypes: BedType[];
}

// Bed
export interface Bed {
  id: string;
  unitId: string;
  roomNumber: string;
  bedNumber: string;
  type: BedType;
  status: BedStatus;
  cleaningStatus: CleaningStatus;
  patientId?: string;
  patientName?: string;
  admittedAt?: number;
  expectedDischarge?: number;
  reservedFor?: string;
  reservedUntil?: number;
  notes?: string;
  lastUpdated: number;
}

// Admission request
export interface AdmissionRequest {
  id: string;
  patientId: string;
  patientName: string;
  requestedBy: string;
  requestedAt: number;
  priority: 'routine' | 'urgent' | 'emergency';
  preferredUnit?: string;
  requiredBedType?: BedType;
  isolationRequired: boolean;
  diagnosis: string;
  status: 'pending' | 'approved' | 'assigned' | 'completed' | 'cancelled';
  assignedBedId?: string;
  notes?: string;
}

// Discharge plan
export interface DischargePlan {
  id: string;
  patientId: string;
  patientName: string;
  bedId: string;
  plannedDate: number;
  actualDate?: number;
  status: 'planned' | 'pending_orders' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  dischargeType: 'home' | 'transfer' | 'ama' | 'expired';
  destination?: string;
  transportRequired: boolean;
  transportType?: string;
  createdBy: string;
  createdAt: number;
  completedBy?: string;
  notes?: string;
}

// Transfer request
export interface TransferRequest {
  id: string;
  patientId: string;
  patientName: string;
  fromBedId: string;
  toBedId?: string;
  toUnitId: string;
  requestedBy: string;
  requestedAt: number;
  reason: string;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: number;
  completedAt?: number;
}

// ADT event
export interface ADTEvent {
  id: string;
  type: ADTEventType;
  patientId: string;
  patientName: string;
  bedId: string;
  unitId: string;
  timestamp: number;
  performedBy: string;
  details?: string;
}

// Occupancy statistics
export interface OccupancyStats {
  unitId: string;
  unitName: string;
  totalBeds: number;
  occupied: number;
  available: number;
  reserved: number;
  cleaning: number;
  maintenance: number;
  occupancyRate: number;
}

class BedManagementService {
  private units: Map<string, Unit> = new Map();
  private beds: Map<string, Bed> = new Map();
  private admissions: Map<string, AdmissionRequest> = new Map();
  private discharges: Map<string, DischargePlan> = new Map();
  private transfers: Map<string, TransferRequest> = new Map();
  private events: ADTEvent[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
    this.initializeDemoData();
  }

  // Initialize demo data
  private initializeDemoData(): void {
    // Create units
    const demoUnits: Unit[] = [
      { id: 'UNIT-MED', name: 'Medical', floor: '2', building: 'Main', totalBeds: 20, bedTypes: ['standard'] },
      { id: 'UNIT-SURG', name: 'Surgical', floor: '3', building: 'Main', totalBeds: 16, bedTypes: ['standard'] },
      { id: 'UNIT-ICU', name: 'ICU', floor: '4', building: 'Main', totalBeds: 12, bedTypes: ['icu'] },
      { id: 'UNIT-ED', name: 'Emergency', floor: '1', building: 'Main', totalBeds: 24, bedTypes: ['standard', 'isolation'] },
      { id: 'UNIT-PED', name: 'Pediatrics', floor: '5', building: 'Main', totalBeds: 10, bedTypes: ['pediatric'] },
    ];

    demoUnits.forEach(unit => {
      if (!this.units.has(unit.id)) {
        this.units.set(unit.id, unit);
      }
    });

    // Create beds for each unit
    demoUnits.forEach(unit => {
      const existingBeds = Array.from(this.beds.values()).filter(b => b.unitId === unit.id);
      if (existingBeds.length === 0) {
        for (let i = 1; i <= unit.totalBeds; i++) {
          const roomNum = Math.ceil(i / 2).toString().padStart(2, '0');
          const bedLetter = i % 2 === 1 ? 'A' : 'B';
          const bedId = `${unit.id}-${roomNum}${bedLetter}`;
          
          // Randomly assign some beds as occupied
          const isOccupied = Math.random() < 0.6;
          const isCleaning = !isOccupied && Math.random() < 0.1;
          
          this.beds.set(bedId, {
            id: bedId,
            unitId: unit.id,
            roomNumber: roomNum,
            bedNumber: bedLetter,
            type: unit.bedTypes[0],
            status: isOccupied ? 'occupied' : isCleaning ? 'cleaning' : 'available',
            cleaningStatus: isOccupied ? 'clean' : isCleaning ? 'in_progress' : 'clean',
            patientId: isOccupied ? `P-${Math.floor(Math.random() * 1000)}` : undefined,
            patientName: isOccupied ? `Patient ${i}` : undefined,
            admittedAt: isOccupied ? Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 : undefined,
            expectedDischarge: isOccupied ? Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000 : undefined,
            lastUpdated: Date.now(),
          });
        }
      }
    });
  }

  // Get all units
  getUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  // Get unit by ID
  getUnit(unitId: string): Unit | undefined {
    return this.units.get(unitId);
  }

  // Get beds by unit
  getBedsByUnit(unitId: string): Bed[] {
    return Array.from(this.beds.values())
      .filter(b => b.unitId === unitId)
      .sort((a, b) => {
        const roomCompare = a.roomNumber.localeCompare(b.roomNumber);
        if (roomCompare !== 0) return roomCompare;
        return a.bedNumber.localeCompare(b.bedNumber);
      });
  }

  // Get bed by ID
  getBed(bedId: string): Bed | undefined {
    return this.beds.get(bedId);
  }

  // Get available beds
  getAvailableBeds(unitId?: string, bedType?: BedType): Bed[] {
    return Array.from(this.beds.values())
      .filter(b => 
        b.status === 'available' &&
        b.cleaningStatus === 'clean' &&
        (!unitId || b.unitId === unitId) &&
        (!bedType || b.type === bedType)
      );
  }

  // Get occupancy statistics
  getOccupancyStats(unitId?: string): OccupancyStats[] {
    const units = unitId ? [this.units.get(unitId)!] : Array.from(this.units.values());
    
    return units.filter(Boolean).map(unit => {
      const beds = this.getBedsByUnit(unit.id);
      const occupied = beds.filter(b => b.status === 'occupied').length;
      const available = beds.filter(b => b.status === 'available' && b.cleaningStatus === 'clean').length;
      const reserved = beds.filter(b => b.status === 'reserved').length;
      const cleaning = beds.filter(b => b.status === 'cleaning' || b.cleaningStatus === 'in_progress').length;
      const maintenance = beds.filter(b => b.status === 'maintenance').length;

      return {
        unitId: unit.id,
        unitName: unit.name,
        totalBeds: beds.length,
        occupied,
        available,
        reserved,
        cleaning,
        maintenance,
        occupancyRate: Math.round((occupied / beds.length) * 100),
      };
    });
  }

  // Create admission request
  async createAdmissionRequest(
    patientId: string,
    patientName: string,
    requestedBy: string,
    priority: 'routine' | 'urgent' | 'emergency',
    diagnosis: string,
    preferredUnit?: string,
    requiredBedType?: BedType,
    isolationRequired: boolean = false,
    notes?: string
  ): Promise<AdmissionRequest> {
    const request: AdmissionRequest = {
      id: `ADM-${Date.now()}`,
      patientId,
      patientName,
      requestedBy,
      requestedAt: Date.now(),
      priority,
      preferredUnit,
      requiredBedType,
      isolationRequired,
      diagnosis,
      status: 'pending',
      notes,
    };

    this.admissions.set(request.id, request);
    await this.saveState();
    this.notifyListeners();

    return request;
  }

  // Assign bed to admission
  async assignBedToAdmission(admissionId: string, bedId: string): Promise<void> {
    const admission = this.admissions.get(admissionId);
    const bed = this.beds.get(bedId);

    if (!admission || !bed) {
      throw new Error('Admission or bed not found');
    }

    if (bed.status !== 'available') {
      throw new Error('Bed is not available');
    }

    // Update bed
    bed.status = 'reserved';
    bed.reservedFor = admission.patientName;
    bed.reservedUntil = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    bed.lastUpdated = Date.now();

    // Update admission
    admission.status = 'assigned';
    admission.assignedBedId = bedId;

    await this.saveState();
    this.notifyListeners();
  }

  // Complete admission
  async completeAdmission(admissionId: string, performedBy: string): Promise<void> {
    const admission = this.admissions.get(admissionId);
    if (!admission || !admission.assignedBedId) {
      throw new Error('Admission not found or no bed assigned');
    }

    const bed = this.beds.get(admission.assignedBedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    // Update bed
    bed.status = 'occupied';
    bed.patientId = admission.patientId;
    bed.patientName = admission.patientName;
    bed.admittedAt = Date.now();
    bed.reservedFor = undefined;
    bed.reservedUntil = undefined;
    bed.lastUpdated = Date.now();

    // Update admission
    admission.status = 'completed';

    // Log event
    this.logEvent('admission', admission.patientId, admission.patientName, bed.id, bed.unitId, performedBy);

    await this.saveState();
    this.notifyListeners();
  }

  // Create discharge plan
  async createDischargePlan(
    patientId: string,
    patientName: string,
    bedId: string,
    plannedDate: number,
    dischargeType: 'home' | 'transfer' | 'ama' | 'expired',
    createdBy: string,
    destination?: string,
    transportRequired: boolean = false,
    transportType?: string,
    notes?: string
  ): Promise<DischargePlan> {
    const plan: DischargePlan = {
      id: `DC-${Date.now()}`,
      patientId,
      patientName,
      bedId,
      plannedDate,
      status: 'planned',
      dischargeType,
      destination,
      transportRequired,
      transportType,
      createdBy,
      createdAt: Date.now(),
      notes,
    };

    this.discharges.set(plan.id, plan);

    // Update bed expected discharge
    const bed = this.beds.get(bedId);
    if (bed) {
      bed.expectedDischarge = plannedDate;
      bed.lastUpdated = Date.now();
    }

    await this.saveState();
    this.notifyListeners();

    return plan;
  }

  // Complete discharge
  async completeDischarge(dischargeId: string, completedBy: string): Promise<void> {
    const discharge = this.discharges.get(dischargeId);
    if (!discharge) {
      throw new Error('Discharge plan not found');
    }

    const bed = this.beds.get(discharge.bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    // Update discharge
    discharge.status = 'completed';
    discharge.actualDate = Date.now();
    discharge.completedBy = completedBy;

    // Update bed
    bed.status = 'cleaning';
    bed.cleaningStatus = 'dirty';
    bed.patientId = undefined;
    bed.patientName = undefined;
    bed.admittedAt = undefined;
    bed.expectedDischarge = undefined;
    bed.lastUpdated = Date.now();

    // Log event
    this.logEvent('discharge', discharge.patientId, discharge.patientName, bed.id, bed.unitId, completedBy);

    await this.saveState();
    this.notifyListeners();
  }

  // Create transfer request
  async createTransferRequest(
    patientId: string,
    patientName: string,
    fromBedId: string,
    toUnitId: string,
    requestedBy: string,
    reason: string,
    priority: 'routine' | 'urgent' | 'emergency'
  ): Promise<TransferRequest> {
    const request: TransferRequest = {
      id: `TRF-${Date.now()}`,
      patientId,
      patientName,
      fromBedId,
      toUnitId,
      requestedBy,
      requestedAt: Date.now(),
      reason,
      priority,
      status: 'pending',
    };

    this.transfers.set(request.id, request);
    await this.saveState();
    this.notifyListeners();

    return request;
  }

  // Approve transfer
  async approveTransfer(transferId: string, toBedId: string, approvedBy: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      throw new Error('Transfer request not found');
    }

    const toBed = this.beds.get(toBedId);
    if (!toBed || toBed.status !== 'available') {
      throw new Error('Destination bed not available');
    }

    // Reserve destination bed
    toBed.status = 'reserved';
    toBed.reservedFor = transfer.patientName;
    toBed.reservedUntil = Date.now() + 2 * 60 * 60 * 1000;
    toBed.lastUpdated = Date.now();

    // Update transfer
    transfer.status = 'approved';
    transfer.toBedId = toBedId;
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = Date.now();

    await this.saveState();
    this.notifyListeners();
  }

  // Complete transfer
  async completeTransfer(transferId: string, performedBy: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer || !transfer.toBedId) {
      throw new Error('Transfer not found or not approved');
    }

    const fromBed = this.beds.get(transfer.fromBedId);
    const toBed = this.beds.get(transfer.toBedId);

    if (!fromBed || !toBed) {
      throw new Error('Beds not found');
    }

    // Update from bed
    fromBed.status = 'cleaning';
    fromBed.cleaningStatus = 'dirty';
    fromBed.patientId = undefined;
    fromBed.patientName = undefined;
    fromBed.admittedAt = undefined;
    fromBed.expectedDischarge = undefined;
    fromBed.lastUpdated = Date.now();

    // Update to bed
    toBed.status = 'occupied';
    toBed.patientId = transfer.patientId;
    toBed.patientName = transfer.patientName;
    toBed.admittedAt = Date.now();
    toBed.reservedFor = undefined;
    toBed.reservedUntil = undefined;
    toBed.lastUpdated = Date.now();

    // Update transfer
    transfer.status = 'completed';
    transfer.completedAt = Date.now();

    // Log event
    this.logEvent('transfer', transfer.patientId, transfer.patientName, toBed.id, toBed.unitId, performedBy, `From ${fromBed.id}`);

    await this.saveState();
    this.notifyListeners();
  }

  // Start bed cleaning
  async startBedCleaning(bedId: string): Promise<void> {
    const bed = this.beds.get(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    bed.status = 'cleaning';
    bed.cleaningStatus = 'in_progress';
    bed.lastUpdated = Date.now();

    await this.saveState();
    this.notifyListeners();
  }

  // Complete bed cleaning
  async completeBedCleaning(bedId: string): Promise<void> {
    const bed = this.beds.get(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    bed.status = 'available';
    bed.cleaningStatus = 'clean';
    bed.lastUpdated = Date.now();

    await this.saveState();
    this.notifyListeners();
  }

  // Get pending admissions
  getPendingAdmissions(): AdmissionRequest[] {
    return Array.from(this.admissions.values())
      .filter(a => a.status === 'pending' || a.status === 'approved' || a.status === 'assigned')
      .sort((a, b) => {
        const priorityOrder = { emergency: 0, urgent: 1, routine: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.requestedAt - b.requestedAt;
      });
  }

  // Get pending discharges
  getPendingDischarges(): DischargePlan[] {
    return Array.from(this.discharges.values())
      .filter(d => d.status !== 'completed' && d.status !== 'cancelled')
      .sort((a, b) => a.plannedDate - b.plannedDate);
  }

  // Get pending transfers
  getPendingTransfers(): TransferRequest[] {
    return Array.from(this.transfers.values())
      .filter(t => t.status === 'pending' || t.status === 'approved' || t.status === 'in_progress')
      .sort((a, b) => {
        const priorityOrder = { emergency: 0, urgent: 1, routine: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.requestedAt - b.requestedAt;
      });
  }

  // Get recent ADT events
  getRecentEvents(hours: number = 24): ADTEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events
      .filter(e => e.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Log ADT event
  private logEvent(
    type: ADTEventType,
    patientId: string,
    patientName: string,
    bedId: string,
    unitId: string,
    performedBy: string,
    details?: string
  ): void {
    this.events.unshift({
      id: `EVT-${Date.now()}`,
      type,
      patientId,
      patientName,
      bedId,
      unitId,
      timestamp: Date.now(),
      performedBy,
      details,
    });

    // Keep only last 1000 events
    this.events = this.events.slice(0, 1000);
  }

  // Get status color
  getStatusColor(status: BedStatus): string {
    const colors: Record<BedStatus, string> = {
      available: '#22C55E',
      occupied: '#3B82F6',
      reserved: '#F59E0B',
      cleaning: '#8B5CF6',
      maintenance: '#6B7280',
      blocked: '#EF4444',
    };
    return colors[status];
  }

  // Get priority color
  getPriorityColor(priority: 'routine' | 'urgent' | 'emergency'): string {
    const colors = {
      routine: '#22C55E',
      urgent: '#F59E0B',
      emergency: '#EF4444',
    };
    return colors[priority];
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
      await AsyncStorage.setItem('bed_units', JSON.stringify(Array.from(this.units.entries())));
      await AsyncStorage.setItem('bed_beds', JSON.stringify(Array.from(this.beds.entries())));
      await AsyncStorage.setItem('bed_admissions', JSON.stringify(Array.from(this.admissions.entries())));
      await AsyncStorage.setItem('bed_discharges', JSON.stringify(Array.from(this.discharges.entries())));
      await AsyncStorage.setItem('bed_transfers', JSON.stringify(Array.from(this.transfers.entries())));
      await AsyncStorage.setItem('bed_events', JSON.stringify(this.events.slice(0, 500)));
    } catch (error) {
      console.error('Failed to save bed management state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const unitsJson = await AsyncStorage.getItem('bed_units');
      if (unitsJson) {
        const entries = JSON.parse(unitsJson);
        entries.forEach(([key, value]: [string, Unit]) => {
          this.units.set(key, value);
        });
      }

      const bedsJson = await AsyncStorage.getItem('bed_beds');
      if (bedsJson) {
        const entries = JSON.parse(bedsJson);
        entries.forEach(([key, value]: [string, Bed]) => {
          this.beds.set(key, value);
        });
      }

      const admissionsJson = await AsyncStorage.getItem('bed_admissions');
      if (admissionsJson) {
        const entries = JSON.parse(admissionsJson);
        entries.forEach(([key, value]: [string, AdmissionRequest]) => {
          this.admissions.set(key, value);
        });
      }

      const dischargesJson = await AsyncStorage.getItem('bed_discharges');
      if (dischargesJson) {
        const entries = JSON.parse(dischargesJson);
        entries.forEach(([key, value]: [string, DischargePlan]) => {
          this.discharges.set(key, value);
        });
      }

      const transfersJson = await AsyncStorage.getItem('bed_transfers');
      if (transfersJson) {
        const entries = JSON.parse(transfersJson);
        entries.forEach(([key, value]: [string, TransferRequest]) => {
          this.transfers.set(key, value);
        });
      }

      const eventsJson = await AsyncStorage.getItem('bed_events');
      if (eventsJson) {
        this.events = JSON.parse(eventsJson);
      }
    } catch (error) {
      console.error('Failed to load bed management state:', error);
    }
  }
}

// Export singleton instance
export const bedManagementService = new BedManagementService();
export default bedManagementService;
