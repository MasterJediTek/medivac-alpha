/**
 * Shift Handover Workflow Service
 * Guided handover process with acknowledgment tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Handover status
export type HandoverStatus = 
  | 'draft'
  | 'pending'
  | 'in_progress'
  | 'awaiting_acknowledgment'
  | 'completed'
  | 'rejected';

// Priority level
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

// Checklist item status
export type ChecklistItemStatus = 'pending' | 'completed' | 'skipped' | 'na';

// Handover checklist item
export interface HandoverChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  status: ChecklistItemStatus;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
}

// Patient handover info
export interface PatientHandoverInfo {
  patientId: string;
  patientName: string;
  roomNumber: string;
  diagnosis: string;
  priority: PriorityLevel;
  keyUpdates: string[];
  pendingTasks: HandoverTask[];
  medications: MedicationUpdate[];
  vitalsStatus: string;
  alerts: string[];
  specialInstructions: string;
}

// Handover task
export interface HandoverTask {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  dueTime?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'transferred';
  assignedTo?: string;
  patientId?: string;
}

// Medication update
export interface MedicationUpdate {
  medication: string;
  change: 'new' | 'modified' | 'discontinued' | 'held';
  details: string;
  time: string;
}

// Shift handover
export interface ShiftHandover {
  id: string;
  shiftType: 'day' | 'evening' | 'night';
  department: string;
  outgoingStaff: StaffInfo;
  incomingStaff: StaffInfo;
  status: HandoverStatus;
  checklist: HandoverChecklistItem[];
  patients: PatientHandoverInfo[];
  generalNotes: string;
  safetyAlerts: string[];
  equipmentIssues: string[];
  pendingOrders: string[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  acknowledgment?: HandoverAcknowledgment;
}

// Staff info
export interface StaffInfo {
  id: string;
  name: string;
  role: string;
  department: string;
  contactNumber?: string;
}

// Handover acknowledgment
export interface HandoverAcknowledgment {
  acknowledgedAt: number;
  acknowledgedBy: string;
  signature?: string;
  comments?: string;
  questionsRaised: string[];
  clarificationsProvided: string[];
}

// Handover template
export interface HandoverTemplate {
  id: string;
  name: string;
  department: string;
  checklist: Omit<HandoverChecklistItem, 'status' | 'completedAt' | 'completedBy' | 'notes'>[];
  requiredSections: string[];
}

// Handover history entry
export interface HandoverHistoryEntry {
  id: string;
  handoverId: string;
  action: string;
  performedBy: string;
  timestamp: number;
  details?: string;
}

class ShiftHandoverService {
  private handovers: Map<string, ShiftHandover> = new Map();
  private templates: Map<string, HandoverTemplate> = new Map();
  private history: HandoverHistoryEntry[] = [];
  private listeners: Set<(handover: ShiftHandover) => void> = new Set();

  constructor() {
    this.initializeTemplates();
    this.loadState();
  }

  // Initialize default templates
  private initializeTemplates(): void {
    const defaultTemplates: HandoverTemplate[] = [
      {
        id: 'TEMPLATE-NURSING',
        name: 'Nursing Shift Handover',
        department: 'Nursing',
        checklist: [
          { id: 'CHK-001', category: 'Patient Status', title: 'Review all patient statuses', description: 'Go through each patient\'s current condition and any changes', required: true },
          { id: 'CHK-002', category: 'Patient Status', title: 'Identify high-risk patients', description: 'Highlight patients requiring close monitoring', required: true },
          { id: 'CHK-003', category: 'Medications', title: 'Review medication changes', description: 'Discuss any new, modified, or discontinued medications', required: true },
          { id: 'CHK-004', category: 'Medications', title: 'Confirm PRN medications given', description: 'Review as-needed medications administered during shift', required: true },
          { id: 'CHK-005', category: 'Tasks', title: 'Review pending tasks', description: 'Go through tasks that need to be completed', required: true },
          { id: 'CHK-006', category: 'Tasks', title: 'Confirm scheduled procedures', description: 'Review any upcoming procedures or tests', required: true },
          { id: 'CHK-007', category: 'Safety', title: 'Review safety alerts', description: 'Discuss any fall risks, isolation precautions, etc.', required: true },
          { id: 'CHK-008', category: 'Safety', title: 'Check equipment status', description: 'Confirm all equipment is functioning properly', required: false },
          { id: 'CHK-009', category: 'Communication', title: 'Review family communications', description: 'Discuss any family concerns or requests', required: false },
          { id: 'CHK-010', category: 'Communication', title: 'Confirm physician orders', description: 'Review any new or pending physician orders', required: true },
        ],
        requiredSections: ['Patient Status', 'Medications', 'Tasks', 'Safety'],
      },
      {
        id: 'TEMPLATE-ICU',
        name: 'ICU Shift Handover',
        department: 'ICU',
        checklist: [
          { id: 'CHK-101', category: 'Critical Status', title: 'Review ventilator settings', description: 'Confirm current ventilator parameters for each patient', required: true },
          { id: 'CHK-102', category: 'Critical Status', title: 'Review vasoactive drips', description: 'Confirm all continuous infusions and rates', required: true },
          { id: 'CHK-103', category: 'Critical Status', title: 'Review hemodynamic status', description: 'Discuss vital signs trends and interventions', required: true },
          { id: 'CHK-104', category: 'Labs', title: 'Review critical lab values', description: 'Discuss any abnormal or pending lab results', required: true },
          { id: 'CHK-105', category: 'Labs', title: 'Confirm blood product needs', description: 'Review any transfusion requirements', required: true },
          { id: 'CHK-106', category: 'Procedures', title: 'Review recent procedures', description: 'Discuss any procedures performed during shift', required: true },
          { id: 'CHK-107', category: 'Procedures', title: 'Confirm upcoming procedures', description: 'Review scheduled procedures for next shift', required: true },
          { id: 'CHK-108', category: 'Family', title: 'Review family status', description: 'Discuss family presence and communication needs', required: false },
          { id: 'CHK-109', category: 'Goals', title: 'Review goals of care', description: 'Confirm code status and care goals for each patient', required: true },
          { id: 'CHK-110', category: 'Equipment', title: 'Check all monitoring equipment', description: 'Verify all monitors and alarms are functioning', required: true },
        ],
        requiredSections: ['Critical Status', 'Labs', 'Procedures', 'Goals'],
      },
      {
        id: 'TEMPLATE-ED',
        name: 'Emergency Department Handover',
        department: 'Emergency',
        checklist: [
          { id: 'CHK-201', category: 'Census', title: 'Review current census', description: 'Discuss all patients currently in ED', required: true },
          { id: 'CHK-202', category: 'Census', title: 'Review waiting room', description: 'Discuss patients waiting to be seen', required: true },
          { id: 'CHK-203', category: 'Critical', title: 'Identify critical patients', description: 'Highlight patients requiring immediate attention', required: true },
          { id: 'CHK-204', category: 'Admissions', title: 'Review pending admissions', description: 'Discuss patients waiting for bed assignments', required: true },
          { id: 'CHK-205', category: 'Admissions', title: 'Review pending discharges', description: 'Discuss patients ready for discharge', required: true },
          { id: 'CHK-206', category: 'Resources', title: 'Review resource status', description: 'Confirm bed availability and staffing', required: true },
          { id: 'CHK-207', category: 'Pending', title: 'Review pending results', description: 'Discuss labs, imaging, and consults pending', required: true },
          { id: 'CHK-208', category: 'Safety', title: 'Review safety concerns', description: 'Discuss any security or safety issues', required: true },
        ],
        requiredSections: ['Census', 'Critical', 'Admissions', 'Pending'],
      },
    ];

    defaultTemplates.forEach(template => this.templates.set(template.id, template));
  }

  // Get all templates
  getTemplates(): HandoverTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get template by ID
  getTemplate(templateId: string): HandoverTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Create new handover
  async createHandover(
    templateId: string,
    shiftType: 'day' | 'evening' | 'night',
    department: string,
    outgoingStaff: StaffInfo
  ): Promise<ShiftHandover> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const handover: ShiftHandover = {
      id: `HANDOVER-${Date.now()}`,
      shiftType,
      department,
      outgoingStaff,
      incomingStaff: {
        id: '',
        name: '',
        role: '',
        department,
      },
      status: 'draft',
      checklist: template.checklist.map(item => ({
        ...item,
        status: 'pending' as ChecklistItemStatus,
      })),
      patients: [],
      generalNotes: '',
      safetyAlerts: [],
      equipmentIssues: [],
      pendingOrders: [],
      createdAt: Date.now(),
    };

    this.handovers.set(handover.id, handover);
    this.addHistoryEntry(handover.id, 'Created', outgoingStaff.name);
    await this.saveState();

    return handover;
  }

  // Add patient to handover
  async addPatient(handoverId: string, patient: PatientHandoverInfo): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    handover.patients.push(patient);
    this.addHistoryEntry(handoverId, 'Added patient', handover.outgoingStaff.name, patient.patientName);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Update checklist item
  async updateChecklistItem(
    handoverId: string,
    itemId: string,
    status: ChecklistItemStatus,
    completedBy: string,
    notes?: string
  ): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    const item = handover.checklist.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Checklist item not found');
    }

    item.status = status;
    item.completedAt = Date.now();
    item.completedBy = completedBy;
    if (notes) item.notes = notes;

    this.addHistoryEntry(handoverId, `Checklist item ${status}`, completedBy, item.title);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Start handover session
  async startHandover(handoverId: string, incomingStaff: StaffInfo): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    handover.incomingStaff = incomingStaff;
    handover.status = 'in_progress';
    handover.startedAt = Date.now();

    this.addHistoryEntry(handoverId, 'Started handover', incomingStaff.name);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Submit for acknowledgment
  async submitForAcknowledgment(handoverId: string): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    // Check required items are completed
    const requiredIncomplete = handover.checklist.filter(
      item => item.required && item.status !== 'completed' && item.status !== 'na'
    );

    if (requiredIncomplete.length > 0) {
      throw new Error(`${requiredIncomplete.length} required items are incomplete`);
    }

    handover.status = 'awaiting_acknowledgment';
    this.addHistoryEntry(handoverId, 'Submitted for acknowledgment', handover.outgoingStaff.name);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Acknowledge handover
  async acknowledgeHandover(
    handoverId: string,
    acknowledgedBy: string,
    comments?: string,
    questionsRaised?: string[]
  ): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    handover.acknowledgment = {
      acknowledgedAt: Date.now(),
      acknowledgedBy,
      comments,
      questionsRaised: questionsRaised || [],
      clarificationsProvided: [],
    };
    handover.status = 'completed';
    handover.completedAt = Date.now();

    this.addHistoryEntry(handoverId, 'Acknowledged and completed', acknowledgedBy);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Reject handover
  async rejectHandover(handoverId: string, rejectedBy: string, reason: string): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    handover.status = 'rejected';
    this.addHistoryEntry(handoverId, 'Rejected', rejectedBy, reason);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Add general notes
  async updateGeneralNotes(handoverId: string, notes: string): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    handover.generalNotes = notes;
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Add safety alert
  async addSafetyAlert(handoverId: string, alert: string): Promise<void> {
    const handover = this.handovers.get(handoverId);
    if (!handover) {
      throw new Error('Handover not found');
    }

    handover.safetyAlerts.push(alert);
    this.addHistoryEntry(handoverId, 'Added safety alert', handover.outgoingStaff.name, alert);
    await this.saveState();
    this.notifyListeners(handover);
  }

  // Get handover by ID
  getHandover(handoverId: string): ShiftHandover | undefined {
    return this.handovers.get(handoverId);
  }

  // Get all handovers
  getAllHandovers(): ShiftHandover[] {
    return Array.from(this.handovers.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get pending handovers
  getPendingHandovers(): ShiftHandover[] {
    return this.getAllHandovers().filter(
      h => h.status === 'pending' || h.status === 'in_progress' || h.status === 'awaiting_acknowledgment'
    );
  }

  // Get handover history
  getHandoverHistory(handoverId: string): HandoverHistoryEntry[] {
    return this.history.filter(h => h.handoverId === handoverId);
  }

  // Calculate completion percentage
  getCompletionPercentage(handover: ShiftHandover): number {
    const total = handover.checklist.length;
    if (total === 0) return 0;

    const completed = handover.checklist.filter(
      item => item.status === 'completed' || item.status === 'na'
    ).length;

    return Math.round((completed / total) * 100);
  }

  // Get required items remaining
  getRequiredItemsRemaining(handover: ShiftHandover): HandoverChecklistItem[] {
    return handover.checklist.filter(
      item => item.required && item.status !== 'completed' && item.status !== 'na'
    );
  }

  // Add history entry
  private addHistoryEntry(handoverId: string, action: string, performedBy: string, details?: string): void {
    this.history.unshift({
      id: `HISTORY-${Date.now()}`,
      handoverId,
      action,
      performedBy,
      timestamp: Date.now(),
      details,
    });
  }

  // Subscribe to updates
  subscribe(listener: (handover: ShiftHandover) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(handover: ShiftHandover): void {
    this.listeners.forEach(listener => listener(handover));
  }

  // Get status color
  getStatusColor(status: HandoverStatus): string {
    const colors: Record<HandoverStatus, string> = {
      draft: '#6B7280',
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      awaiting_acknowledgment: '#8B5CF6',
      completed: '#22C55E',
      rejected: '#EF4444',
    };
    return colors[status];
  }

  // Get status label
  getStatusLabel(status: HandoverStatus): string {
    const labels: Record<HandoverStatus, string> = {
      draft: 'Draft',
      pending: 'Pending',
      in_progress: 'In Progress',
      awaiting_acknowledgment: 'Awaiting Acknowledgment',
      completed: 'Completed',
      rejected: 'Rejected',
    };
    return labels[status];
  }

  // Get priority color
  getPriorityColor(priority: PriorityLevel): string {
    const colors: Record<PriorityLevel, string> = {
      low: '#22C55E',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#7C3AED',
    };
    return colors[priority];
  }

  // Format date
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('shift_handovers', JSON.stringify(Array.from(this.handovers.entries())));
      await AsyncStorage.setItem('handover_history', JSON.stringify(this.history.slice(0, 500)));
    } catch (error) {
      console.error('Failed to save handover state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const handoversJson = await AsyncStorage.getItem('shift_handovers');
      if (handoversJson) {
        const entries = JSON.parse(handoversJson);
        entries.forEach(([key, value]: [string, ShiftHandover]) => {
          this.handovers.set(key, value);
        });
      }

      const historyJson = await AsyncStorage.getItem('handover_history');
      if (historyJson) {
        this.history = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('Failed to load handover state:', error);
    }
  }
}

// Export singleton instance
export const shiftHandoverService = new ShiftHandoverService();
export default shiftHandoverService;
