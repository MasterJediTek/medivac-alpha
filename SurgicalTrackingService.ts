/**
 * Surgical Procedure Tracking Service
 * MediVac One v3.0 - Operating Room Management
 * 
 * Real-time surgical case tracking with OR status boards
 */

// Types
export type ORStatus = 'available' | 'in_use' | 'turnover' | 'blocked' | 'emergency';
export type CaseStatus = 'scheduled' | 'pre_op' | 'in_or' | 'in_progress' | 'closing' | 'post_op' | 'recovery' | 'completed' | 'cancelled';
export type CasePriority = 'elective' | 'urgent' | 'emergent' | 'trauma';
export type MilestoneType = 'pre_op' | 'induction' | 'incision' | 'procedure' | 'closing' | 'emergence' | 'pacu';

export interface OperatingRoom {
  id: string;
  name: string;
  floor: string;
  status: ORStatus;
  currentCase?: string;
  capabilities: string[];
  equipment: string[];
  lastCleaned?: Date;
  nextScheduledCase?: string;
}

export interface SurgicalCase {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  procedureName: string;
  procedureCode: string;
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration: number;
  actualDuration?: number;
  orId?: string;
  priority: CasePriority;
  status: CaseStatus;
  surgeonId: string;
  surgeonName: string;
  anesthesiologistId?: string;
  anesthesiologistName?: string;
  nursingTeam: TeamMember[];
  preOpChecklist: ChecklistItem[];
  milestones: CaseMilestone[];
  equipment: EquipmentItem[];
  supplies: SupplyItem[];
  notes: CaseNote[];
  familyNotifications: FamilyNotification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'circulating_nurse' | 'scrub_nurse' | 'surgical_tech' | 'anesthesia_tech' | 'resident' | 'fellow';
}

export interface ChecklistItem {
  id: string;
  category: 'consent' | 'labs' | 'imaging' | 'blood' | 'equipment' | 'patient_prep' | 'documentation';
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

export interface CaseMilestone {
  id: string;
  type: MilestoneType;
  name: string;
  scheduledTime?: Date;
  actualTime?: Date;
  duration?: number;
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  serialNumber?: string;
  isAvailable: boolean;
  isVerified: boolean;
  verifiedBy?: string;
}

export interface SupplyItem {
  id: string;
  name: string;
  quantity: number;
  lotNumber?: string;
  expirationDate?: Date;
  isOpened: boolean;
}

export interface CaseNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: Date;
  isPrivate: boolean;
}

export interface FamilyNotification {
  id: string;
  type: 'status_update' | 'milestone' | 'delay' | 'completion';
  message: string;
  sentAt: Date;
  deliveredTo: string[];
}

export interface ORStatusBoard {
  rooms: ORRoomStatus[];
  totalRooms: number;
  availableRooms: number;
  inUseRooms: number;
  turnoverRooms: number;
  emergencyRooms: number;
  upcomingCases: SurgicalCase[];
  delayedCases: SurgicalCase[];
  lastUpdated: Date;
}

export interface ORRoomStatus {
  room: OperatingRoom;
  currentCase?: SurgicalCase;
  nextCase?: SurgicalCase;
  estimatedAvailability?: Date;
  turnoverProgress?: number;
}

export interface SurgeonSchedule {
  surgeonId: string;
  surgeonName: string;
  cases: SurgicalCase[];
  totalCases: number;
  totalMinutes: number;
  utilizationRate: number;
}

// Service Implementation
class SurgicalTrackingServiceImpl {
  private operatingRooms: Map<string, OperatingRoom> = new Map();
  private cases: Map<string, SurgicalCase> = new Map();
  private listeners: Set<(event: SurgicalEvent) => void> = new Set();

  constructor() {
    this.initializeORs();
    this.initializeSampleCases();
  }

  private initializeORs(): void {
    const rooms: OperatingRoom[] = [
      { id: 'OR-1', name: 'OR 1 - General', floor: '3rd Floor', status: 'in_use', capabilities: ['general', 'laparoscopic'], equipment: ['da Vinci Robot', 'C-Arm'] },
      { id: 'OR-2', name: 'OR 2 - Cardiac', floor: '3rd Floor', status: 'in_use', capabilities: ['cardiac', 'vascular'], equipment: ['Heart-Lung Machine', 'TEE'] },
      { id: 'OR-3', name: 'OR 3 - Ortho', floor: '3rd Floor', status: 'turnover', capabilities: ['orthopedic', 'spine'], equipment: ['Fluoroscopy', 'Navigation System'] },
      { id: 'OR-4', name: 'OR 4 - Neuro', floor: '3rd Floor', status: 'available', capabilities: ['neurosurgery', 'spine'], equipment: ['Microscope', 'Neuro Navigation'] },
      { id: 'OR-5', name: 'OR 5 - General', floor: '3rd Floor', status: 'in_use', capabilities: ['general', 'bariatric'], equipment: ['Laparoscopic Tower'] },
      { id: 'OR-6', name: 'OR 6 - Trauma', floor: '3rd Floor', status: 'available', capabilities: ['trauma', 'general'], equipment: ['Rapid Infuser', 'Cell Saver'] },
      { id: 'OR-7', name: 'OR 7 - Peds', floor: '4th Floor', status: 'in_use', capabilities: ['pediatric', 'general'], equipment: ['Pediatric Equipment Set'] },
      { id: 'OR-8', name: 'OR 8 - OB/GYN', floor: '4th Floor', status: 'available', capabilities: ['obstetric', 'gynecologic'], equipment: ['Hysteroscopy Tower'] },
    ];

    rooms.forEach(room => this.operatingRooms.set(room.id, room));
  }

  private initializeSampleCases(): void {
    const sampleCases: SurgicalCase[] = [
      {
        id: 'CASE-001',
        patientId: 'PAT-101',
        patientName: 'John Smith',
        mrn: 'MRN-12345',
        procedureName: 'Laparoscopic Cholecystectomy',
        procedureCode: '47562',
        scheduledDate: new Date(),
        scheduledTime: '07:30',
        estimatedDuration: 90,
        orId: 'OR-1',
        priority: 'elective',
        status: 'in_progress',
        surgeonId: 'DR-001',
        surgeonName: 'Dr. Sarah Chen',
        anesthesiologistId: 'DR-010',
        anesthesiologistName: 'Dr. James Wilson',
        nursingTeam: [
          { id: 'RN-001', name: 'Maria Garcia', role: 'circulating_nurse' },
          { id: 'RN-002', name: 'David Kim', role: 'scrub_nurse' },
        ],
        preOpChecklist: this.generatePreOpChecklist(),
        milestones: [
          { id: 'M1', type: 'pre_op', name: 'Patient in Pre-Op', actualTime: new Date(Date.now() - 120 * 60000) },
          { id: 'M2', type: 'induction', name: 'Anesthesia Induction', actualTime: new Date(Date.now() - 90 * 60000) },
          { id: 'M3', type: 'incision', name: 'First Incision', actualTime: new Date(Date.now() - 75 * 60000) },
          { id: 'M4', type: 'procedure', name: 'Procedure in Progress' },
        ],
        equipment: [],
        supplies: [],
        notes: [],
        familyNotifications: [
          { id: 'FN-1', type: 'status_update', message: 'Surgery has begun', sentAt: new Date(Date.now() - 75 * 60000), deliveredTo: ['family@email.com'] },
        ],
        createdAt: new Date(Date.now() - 24 * 60 * 60000),
        updatedAt: new Date(),
      },
      {
        id: 'CASE-002',
        patientId: 'PAT-102',
        patientName: 'Mary Johnson',
        mrn: 'MRN-12346',
        procedureName: 'CABG x3',
        procedureCode: '33533',
        scheduledDate: new Date(),
        scheduledTime: '07:00',
        estimatedDuration: 300,
        orId: 'OR-2',
        priority: 'urgent',
        status: 'in_progress',
        surgeonId: 'DR-002',
        surgeonName: 'Dr. Michael Torres',
        anesthesiologistId: 'DR-011',
        anesthesiologistName: 'Dr. Emily Brown',
        nursingTeam: [
          { id: 'RN-003', name: 'Jennifer Lee', role: 'circulating_nurse' },
          { id: 'RN-004', name: 'Robert Chen', role: 'scrub_nurse' },
          { id: 'RN-005', name: 'Lisa Wang', role: 'surgical_tech' },
        ],
        preOpChecklist: this.generatePreOpChecklist(),
        milestones: [
          { id: 'M1', type: 'pre_op', name: 'Patient in Pre-Op', actualTime: new Date(Date.now() - 240 * 60000) },
          { id: 'M2', type: 'induction', name: 'Anesthesia Induction', actualTime: new Date(Date.now() - 210 * 60000) },
          { id: 'M3', type: 'incision', name: 'Sternotomy', actualTime: new Date(Date.now() - 180 * 60000) },
          { id: 'M4', type: 'procedure', name: 'On Bypass', actualTime: new Date(Date.now() - 150 * 60000) },
        ],
        equipment: [],
        supplies: [],
        notes: [],
        familyNotifications: [],
        createdAt: new Date(Date.now() - 48 * 60 * 60000),
        updatedAt: new Date(),
      },
    ];

    sampleCases.forEach(c => this.cases.set(c.id, c));
  }

  private generatePreOpChecklist(): ChecklistItem[] {
    return [
      { id: 'CL-1', category: 'consent', description: 'Surgical consent signed', isRequired: true, isCompleted: true, completedAt: new Date(Date.now() - 24 * 60 * 60000) },
      { id: 'CL-2', category: 'consent', description: 'Anesthesia consent signed', isRequired: true, isCompleted: true, completedAt: new Date(Date.now() - 24 * 60 * 60000) },
      { id: 'CL-3', category: 'labs', description: 'CBC within 30 days', isRequired: true, isCompleted: true },
      { id: 'CL-4', category: 'labs', description: 'BMP within 30 days', isRequired: true, isCompleted: true },
      { id: 'CL-5', category: 'labs', description: 'Type and Screen', isRequired: true, isCompleted: true },
      { id: 'CL-6', category: 'imaging', description: 'Pre-op imaging reviewed', isRequired: false, isCompleted: true },
      { id: 'CL-7', category: 'patient_prep', description: 'NPO status verified', isRequired: true, isCompleted: true },
      { id: 'CL-8', category: 'patient_prep', description: 'Site marked', isRequired: true, isCompleted: true },
      { id: 'CL-9', category: 'documentation', description: 'H&P within 30 days', isRequired: true, isCompleted: true },
      { id: 'CL-10', category: 'equipment', description: 'Special equipment confirmed', isRequired: false, isCompleted: true },
    ];
  }

  // OR Management
  async getOperatingRooms(): Promise<OperatingRoom[]> {
    return Array.from(this.operatingRooms.values());
  }

  async getORStatus(orId: string): Promise<OperatingRoom | null> {
    return this.operatingRooms.get(orId) || null;
  }

  async updateORStatus(orId: string, status: ORStatus): Promise<OperatingRoom | null> {
    const room = this.operatingRooms.get(orId);
    if (!room) return null;

    room.status = status;
    if (status === 'available') {
      room.lastCleaned = new Date();
    }

    this.operatingRooms.set(orId, room);
    this.emit({ type: 'or_status_changed', data: room });

    return room;
  }

  // Case Management
  async createCase(caseData: Omit<SurgicalCase, 'id' | 'createdAt' | 'updatedAt' | 'preOpChecklist' | 'milestones' | 'familyNotifications'>): Promise<SurgicalCase> {
    const newCase: SurgicalCase = {
      ...caseData,
      id: `CASE-${Date.now()}`,
      preOpChecklist: this.generatePreOpChecklist(),
      milestones: this.generateMilestones(),
      familyNotifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cases.set(newCase.id, newCase);
    this.emit({ type: 'case_created', data: newCase });

    return newCase;
  }

  private generateMilestones(): CaseMilestone[] {
    return [
      { id: 'M1', type: 'pre_op', name: 'Patient in Pre-Op' },
      { id: 'M2', type: 'induction', name: 'Anesthesia Induction' },
      { id: 'M3', type: 'incision', name: 'First Incision' },
      { id: 'M4', type: 'procedure', name: 'Procedure' },
      { id: 'M5', type: 'closing', name: 'Closing' },
      { id: 'M6', type: 'emergence', name: 'Emergence from Anesthesia' },
      { id: 'M7', type: 'pacu', name: 'Arrived in PACU' },
    ];
  }

  async getCase(caseId: string): Promise<SurgicalCase | null> {
    return this.cases.get(caseId) || null;
  }

  async getCases(filters?: { date?: Date; orId?: string; surgeonId?: string; status?: CaseStatus }): Promise<SurgicalCase[]> {
    let cases = Array.from(this.cases.values());

    if (filters?.date) {
      const filterDate = filters.date.toDateString();
      cases = cases.filter(c => new Date(c.scheduledDate).toDateString() === filterDate);
    }
    if (filters?.orId) {
      cases = cases.filter(c => c.orId === filters.orId);
    }
    if (filters?.surgeonId) {
      cases = cases.filter(c => c.surgeonId === filters.surgeonId);
    }
    if (filters?.status) {
      cases = cases.filter(c => c.status === filters.status);
    }

    return cases.sort((a, b) => {
      const timeA = a.scheduledTime.split(':').map(Number);
      const timeB = b.scheduledTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  }

  async updateCaseStatus(caseId: string, status: CaseStatus): Promise<SurgicalCase | null> {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) return null;

    surgicalCase.status = status;
    surgicalCase.updatedAt = new Date();

    // Update OR status based on case status
    if (surgicalCase.orId) {
      const room = this.operatingRooms.get(surgicalCase.orId);
      if (room) {
        if (status === 'in_or' || status === 'in_progress') {
          room.status = 'in_use';
          room.currentCase = caseId;
        } else if (status === 'completed' || status === 'cancelled') {
          room.status = 'turnover';
          room.currentCase = undefined;
        }
        this.operatingRooms.set(room.id, room);
      }
    }

    this.cases.set(caseId, surgicalCase);
    this.emit({ type: 'case_status_changed', data: surgicalCase });

    return surgicalCase;
  }

  // Milestone Tracking
  async recordMilestone(caseId: string, milestoneType: MilestoneType, notes?: string): Promise<SurgicalCase | null> {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) return null;

    const milestone = surgicalCase.milestones.find(m => m.type === milestoneType);
    if (milestone) {
      milestone.actualTime = new Date();
      milestone.notes = notes;

      // Calculate duration from previous milestone
      const milestoneIndex = surgicalCase.milestones.indexOf(milestone);
      if (milestoneIndex > 0) {
        const prevMilestone = surgicalCase.milestones[milestoneIndex - 1];
        if (prevMilestone.actualTime) {
          milestone.duration = Math.round((milestone.actualTime.getTime() - prevMilestone.actualTime.getTime()) / 60000);
        }
      }
    }

    surgicalCase.updatedAt = new Date();
    this.cases.set(caseId, surgicalCase);
    this.emit({ type: 'milestone_recorded', data: { caseId, milestone } });

    // Auto-notify family
    await this.notifyFamily(caseId, 'milestone', `${milestone?.name} completed`);

    return surgicalCase;
  }

  // Pre-Op Checklist
  async completeChecklistItem(caseId: string, itemId: string, completedBy: string, notes?: string): Promise<SurgicalCase | null> {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) return null;

    const item = surgicalCase.preOpChecklist.find(i => i.id === itemId);
    if (item) {
      item.isCompleted = true;
      item.completedBy = completedBy;
      item.completedAt = new Date();
      item.notes = notes;
    }

    surgicalCase.updatedAt = new Date();
    this.cases.set(caseId, surgicalCase);
    this.emit({ type: 'checklist_updated', data: { caseId, item } });

    return surgicalCase;
  }

  async getChecklistCompletion(caseId: string): Promise<{ total: number; completed: number; required: number; requiredCompleted: number }> {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) return { total: 0, completed: 0, required: 0, requiredCompleted: 0 };

    const total = surgicalCase.preOpChecklist.length;
    const completed = surgicalCase.preOpChecklist.filter(i => i.isCompleted).length;
    const required = surgicalCase.preOpChecklist.filter(i => i.isRequired).length;
    const requiredCompleted = surgicalCase.preOpChecklist.filter(i => i.isRequired && i.isCompleted).length;

    return { total, completed, required, requiredCompleted };
  }

  // Family Notifications
  async notifyFamily(caseId: string, type: FamilyNotification['type'], message: string): Promise<void> {
    const surgicalCase = this.cases.get(caseId);
    if (!surgicalCase) return;

    const notification: FamilyNotification = {
      id: `FN-${Date.now()}`,
      type,
      message,
      sentAt: new Date(),
      deliveredTo: ['family@email.com'], // In production, get from patient record
    };

    surgicalCase.familyNotifications.push(notification);
    this.cases.set(caseId, surgicalCase);
    this.emit({ type: 'family_notified', data: notification });

    console.log(`[SurgicalTracking] Family notification sent: ${message}`);
  }

  // OR Status Board
  async getORStatusBoard(): Promise<ORStatusBoard> {
    const rooms = Array.from(this.operatingRooms.values());
    const allCases = Array.from(this.cases.values());
    const today = new Date().toDateString();

    const roomStatuses: ORRoomStatus[] = rooms.map(room => {
      const currentCase = room.currentCase ? this.cases.get(room.currentCase) : undefined;
      const nextCase = allCases.find(c => 
        c.orId === room.id && 
        new Date(c.scheduledDate).toDateString() === today &&
        c.status === 'scheduled'
      );

      return {
        room,
        currentCase,
        nextCase,
        estimatedAvailability: currentCase ? this.estimateCompletion(currentCase) : undefined,
        turnoverProgress: room.status === 'turnover' ? Math.random() * 100 : undefined,
      };
    });

    const upcomingCases = allCases.filter(c => 
      new Date(c.scheduledDate).toDateString() === today &&
      ['scheduled', 'pre_op'].includes(c.status)
    );

    const delayedCases = allCases.filter(c => {
      if (c.status !== 'scheduled') return false;
      const scheduledTime = c.scheduledTime.split(':').map(Number);
      const scheduledDate = new Date(c.scheduledDate);
      scheduledDate.setHours(scheduledTime[0], scheduledTime[1]);
      return scheduledDate < new Date();
    });

    return {
      rooms: roomStatuses,
      totalRooms: rooms.length,
      availableRooms: rooms.filter(r => r.status === 'available').length,
      inUseRooms: rooms.filter(r => r.status === 'in_use').length,
      turnoverRooms: rooms.filter(r => r.status === 'turnover').length,
      emergencyRooms: rooms.filter(r => r.status === 'emergency').length,
      upcomingCases,
      delayedCases,
      lastUpdated: new Date(),
    };
  }

  private estimateCompletion(surgicalCase: SurgicalCase): Date {
    const incisionMilestone = surgicalCase.milestones.find(m => m.type === 'incision');
    if (incisionMilestone?.actualTime) {
      const elapsed = Date.now() - incisionMilestone.actualTime.getTime();
      const remaining = (surgicalCase.estimatedDuration * 60000) - elapsed;
      return new Date(Date.now() + Math.max(remaining, 0));
    }
    return new Date(Date.now() + surgicalCase.estimatedDuration * 60000);
  }

  // Surgeon Schedule
  async getSurgeonSchedule(surgeonId: string, date?: Date): Promise<SurgeonSchedule> {
    const targetDate = date || new Date();
    const cases = Array.from(this.cases.values()).filter(c => 
      c.surgeonId === surgeonId &&
      new Date(c.scheduledDate).toDateString() === targetDate.toDateString()
    );

    const totalMinutes = cases.reduce((sum, c) => sum + c.estimatedDuration, 0);
    const availableMinutes = 10 * 60; // 10 hour day

    return {
      surgeonId,
      surgeonName: cases[0]?.surgeonName || 'Unknown',
      cases,
      totalCases: cases.length,
      totalMinutes,
      utilizationRate: (totalMinutes / availableMinutes) * 100,
    };
  }

  // Analytics
  async getCaseAnalytics(startDate: Date, endDate: Date): Promise<CaseAnalytics> {
    const cases = Array.from(this.cases.values()).filter(c => {
      const caseDate = new Date(c.scheduledDate);
      return caseDate >= startDate && caseDate <= endDate;
    });

    const completedCases = cases.filter(c => c.status === 'completed');
    const cancelledCases = cases.filter(c => c.status === 'cancelled');

    const avgDuration = completedCases.length > 0
      ? completedCases.reduce((sum, c) => sum + (c.actualDuration || c.estimatedDuration), 0) / completedCases.length
      : 0;

    const onTimeStarts = completedCases.filter(c => {
      const incision = c.milestones.find(m => m.type === 'incision');
      if (!incision?.actualTime) return false;
      const scheduled = new Date(c.scheduledDate);
      const [hours, mins] = c.scheduledTime.split(':').map(Number);
      scheduled.setHours(hours, mins + 30); // 30 min grace
      return incision.actualTime <= scheduled;
    }).length;

    return {
      totalCases: cases.length,
      completedCases: completedCases.length,
      cancelledCases: cancelledCases.length,
      cancellationRate: cases.length > 0 ? (cancelledCases.length / cases.length) * 100 : 0,
      averageDuration: avgDuration,
      onTimeStartRate: completedCases.length > 0 ? (onTimeStarts / completedCases.length) * 100 : 0,
      casesByPriority: {
        elective: cases.filter(c => c.priority === 'elective').length,
        urgent: cases.filter(c => c.priority === 'urgent').length,
        emergent: cases.filter(c => c.priority === 'emergent').length,
        trauma: cases.filter(c => c.priority === 'trauma').length,
      },
    };
  }

  // Event System
  private emit(event: SurgicalEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  subscribe(listener: (event: SurgicalEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Additional Types
export interface CaseAnalytics {
  totalCases: number;
  completedCases: number;
  cancelledCases: number;
  cancellationRate: number;
  averageDuration: number;
  onTimeStartRate: number;
  casesByPriority: Record<CasePriority, number>;
}

export interface SurgicalEvent {
  type: 'or_status_changed' | 'case_created' | 'case_status_changed' | 'milestone_recorded' | 
        'checklist_updated' | 'family_notified';
  data: unknown;
}

// Export singleton
export const SurgicalTrackingService = new SurgicalTrackingServiceImpl();
export default SurgicalTrackingService;
