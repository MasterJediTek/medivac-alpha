/**
 * Visitor Check-In Kiosk Service - v9.19
 * Manages visitor registration, pass generation, and kiosk mode.
 * Designed for lobby tablet deployment with auto-reset.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VisitorPass {
  id: string;
  visitorName: string;
  purpose: string;
  destinationDepartment: string;
  destinationFloor: string;
  patientName?: string;
  checkInTime: number;
  expiresAt: number;
  qrCode: string;
  passNumber: string;
  directions: string[];
  isActive: boolean;
}

export interface CheckInFormData {
  visitorName: string;
  purpose: 'visit_patient' | 'appointment' | 'delivery' | 'contractor' | 'other';
  destinationDepartment: string;
  patientName?: string;
  notes?: string;
}

export type KioskState = 'idle' | 'form' | 'confirming' | 'pass_generated' | 'printing';

const STORAGE_KEY = 'medivac_visitor_log';
const PASS_EXPIRY_HOURS = 8;
const INACTIVITY_TIMEOUT_MS = 60000; // 60 seconds

const PURPOSE_LABELS: Record<string, string> = {
  visit_patient: 'Visiting a Patient',
  appointment: 'Medical Appointment',
  delivery: 'Delivery / Courier',
  contractor: 'Contractor / Maintenance',
  other: 'Other',
};

const DEPARTMENT_DIRECTIONS: Record<string, string[]> = {
  'emergency': [
    'Exit lobby through the left corridor',
    'Follow red emergency signs',
    'Emergency Department is at the end of the corridor',
  ],
  'maternity': [
    'Take the main elevator to Level 1',
    'Turn right from the elevator',
    'Maternity Ward is the second door on the left',
  ],
  'icu': [
    'Take the main elevator to Level 1',
    'Turn left from the elevator',
    'ICU is through the double doors — ring bell for entry',
  ],
  'surgical': [
    'Take the main elevator to Level 2',
    'Follow signs to Surgical Ward',
    'Check in at the nursing station',
  ],
  'paediatrics': [
    'Take the main elevator to Level 1',
    'Turn right and follow the colourful signs',
    'Paediatrics is at the end of the corridor',
  ],
  'radiology': [
    'Walk straight through the lobby',
    'Turn left at the T-junction',
    'Radiology is on your left',
  ],
  'pathology': [
    'Walk straight through the lobby',
    'Turn right at the T-junction',
    'Pathology Lab is the second door',
  ],
  'pharmacy': [
    'Walk through the lobby',
    'Pharmacy is on the right side near the cafeteria',
  ],
  'mental-health': [
    'Exit lobby through the left corridor',
    'Pass Emergency Department',
    'Mental Health Unit is in the separate wing on the left',
  ],
  'physiotherapy': [
    'Walk through the lobby',
    'Turn right at the main corridor',
    'Physiotherapy is at the far end',
  ],
  'cafeteria': [
    'Walk straight through the lobby',
    'Cafeteria is on the right side',
  ],
  'main-hospital': [
    'You are already in the Main Hospital building',
    'Administration is on the ground floor',
  ],
};

export class VisitorCheckInService {
  private static instance: VisitorCheckInService | null = null;
  private visitorLog: VisitorPass[] = [];
  private kioskState: KioskState = 'idle';
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(state: KioskState) => void> = new Set();
  private passCounter: number = 1000;

  static getInstance(): VisitorCheckInService {
    if (!VisitorCheckInService.instance) {
      VisitorCheckInService.instance = new VisitorCheckInService();
    }
    return VisitorCheckInService.instance;
  }

  static resetInstance(): void {
    if (VisitorCheckInService.instance) {
      VisitorCheckInService.instance.clearInactivityTimer();
      VisitorCheckInService.instance = null;
    }
  }

  /**
   * Generate a unique pass number.
   */
  private generatePassNumber(): string {
    this.passCounter++;
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `MV-${dateStr}-${String(this.passCounter).padStart(4, '0')}`;
  }

  /**
   * Generate a QR code data string for the visitor pass.
   */
  private generateQRData(pass: VisitorPass): string {
    return JSON.stringify({
      type: 'medivac_visitor_pass',
      id: pass.id,
      passNumber: pass.passNumber,
      visitor: pass.visitorName,
      destination: pass.destinationDepartment,
      checkIn: pass.checkInTime,
      expires: pass.expiresAt,
    });
  }

  /**
   * Get directions for a department.
   */
  getDirections(departmentId: string): string[] {
    return DEPARTMENT_DIRECTIONS[departmentId] || [
      'Please ask at the information desk for directions',
    ];
  }

  /**
   * Get purpose label.
   */
  getPurposeLabel(purpose: string): string {
    return PURPOSE_LABELS[purpose] || purpose;
  }

  /**
   * Get all available purposes.
   */
  getAvailablePurposes(): { value: string; label: string }[] {
    return Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ value, label }));
  }

  /**
   * Create a visitor pass from check-in form data.
   */
  checkIn(formData: CheckInFormData): VisitorPass {
    const now = Date.now();
    const passNumber = this.generatePassNumber();
    const directions = this.getDirections(formData.destinationDepartment);

    const pass: VisitorPass = {
      id: `vp_${now}_${Math.random().toString(36).slice(2, 8)}`,
      visitorName: formData.visitorName,
      purpose: this.getPurposeLabel(formData.purpose),
      destinationDepartment: formData.destinationDepartment,
      destinationFloor: this.getDepartmentFloor(formData.destinationDepartment),
      patientName: formData.patientName,
      checkInTime: now,
      expiresAt: now + PASS_EXPIRY_HOURS * 60 * 60 * 1000,
      qrCode: '',
      passNumber,
      directions,
      isActive: true,
    };

    pass.qrCode = this.generateQRData(pass);
    this.visitorLog.push(pass);
    this.saveLog();

    return pass;
  }

  /**
   * Get department floor.
   */
  private getDepartmentFloor(departmentId: string): string {
    const floors: Record<string, string> = {
      'emergency': 'Ground',
      'main-hospital': 'Ground-3',
      'maternity': 'Level 1',
      'paediatrics': 'Level 1',
      'icu': 'Level 1',
      'surgical': 'Level 2',
      'radiology': 'Ground',
      'pathology': 'Ground',
      'pharmacy': 'Ground',
      'mental-health': 'Ground',
      'physiotherapy': 'Ground',
      'cafeteria': 'Ground',
    };
    return floors[departmentId] || 'Ground';
  }

  /**
   * Check out a visitor (deactivate pass).
   */
  checkOut(passId: string): boolean {
    const pass = this.visitorLog.find(p => p.id === passId);
    if (pass) {
      pass.isActive = false;
      this.saveLog();
      return true;
    }
    return false;
  }

  /**
   * Get today's visitor log.
   */
  getTodayVisitors(): VisitorPass[] {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return this.visitorLog.filter(p => p.checkInTime >= todayStart.getTime());
  }

  /**
   * Get active visitors count.
   */
  getActiveVisitorCount(): number {
    return this.visitorLog.filter(p => p.isActive && p.expiresAt > Date.now()).length;
  }

  /**
   * Get kiosk state.
   */
  getKioskState(): KioskState {
    return this.kioskState;
  }

  /**
   * Set kiosk state.
   */
  setKioskState(state: KioskState): void {
    this.kioskState = state;
    this.resetInactivityTimer();
    this.notifyListeners();
  }

  /**
   * Reset to idle state (for kiosk auto-reset).
   */
  resetToIdle(): void {
    this.kioskState = 'idle';
    this.clearInactivityTimer();
    this.notifyListeners();
  }

  /**
   * Start inactivity timer.
   */
  resetInactivityTimer(): void {
    this.clearInactivityTimer();
    if (this.kioskState !== 'idle') {
      this.inactivityTimer = setTimeout(() => {
        this.resetToIdle();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }

  /**
   * Clear inactivity timer.
   */
  clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Subscribe to kiosk state changes.
   */
  subscribe(listener: (state: KioskState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.kioskState));
  }

  /**
   * Validate check-in form data.
   */
  validateForm(data: Partial<CheckInFormData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.visitorName || data.visitorName.trim().length < 2) {
      errors.push('Please enter your full name');
    }
    if (!data.purpose) {
      errors.push('Please select a purpose of visit');
    }
    if (!data.destinationDepartment) {
      errors.push('Please select a destination department');
    }
    if (data.purpose === 'visit_patient' && (!data.patientName || data.patientName.trim().length < 2)) {
      errors.push('Please enter the patient name');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Save visitor log to storage.
   */
  private async saveLog(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.visitorLog));
    } catch (e) {
      // silent
    }
  }

  /**
   * Load visitor log from storage.
   */
  async loadLog(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.visitorLog = JSON.parse(raw);
        // Update pass counter
        const maxNum = this.visitorLog.reduce((max, p) => {
          const num = parseInt(p.passNumber.split('-').pop() || '0', 10);
          return Math.max(max, num);
        }, 1000);
        this.passCounter = maxNum;
      }
    } catch (e) {
      // silent
    }
  }
}
