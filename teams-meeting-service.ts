/**
 * Teams Meeting Scheduler Service
 * Schedule incident response meetings from drill mode
 * MediVac One v5.8
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  MEETINGS: 'medivac_teams_meetings',
  TEMPLATES: 'medivac_meeting_templates',
  ATTENDEES: 'medivac_meeting_attendees',
};

// Types
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'incident_response' | 'drill_debrief' | 'compliance_review' | 'training' | 'general';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TeamsMeeting {
  id: string;
  title: string;
  description: string;
  type: MeetingType;
  status: MeetingStatus;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  timezone: string;
  attendees: MeetingAttendee[];
  organizer: MeetingAttendee;
  joinUrl?: string;
  teamsId?: string;
  agenda: AgendaItem[];
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  drillId?: string;
  incidentId?: string;
  notes: string;
  reminders: MeetingReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAttendee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isRequired: boolean;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number; // minutes
  presenter?: string;
  notes?: string;
  order: number;
}

export interface MeetingReminder {
  id: string;
  minutesBefore: number;
  type: 'email' | 'push' | 'teams';
  sent: boolean;
}

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  type: MeetingType;
  defaultDuration: number;
  defaultAgenda: AgendaItem[];
  defaultReminders: MeetingReminder[];
  icon: string;
  color: string;
}

// Meeting types configuration
export const MEETING_TYPES: Record<MeetingType, { label: string; color: string; icon: string }> = {
  incident_response: { label: 'Incident Response', color: '#EF4444', icon: 'exclamationmark.triangle.fill' },
  drill_debrief: { label: 'Drill Debrief', color: '#F59E0B', icon: 'person.3.fill' },
  compliance_review: { label: 'Compliance Review', color: '#3B82F6', icon: 'checkmark.shield.fill' },
  training: { label: 'Training Session', color: '#10B981', icon: 'book.fill' },
  general: { label: 'General Meeting', color: '#6B7280', icon: 'calendar' },
};

// Default templates
const DEFAULT_TEMPLATES: MeetingTemplate[] = [
  {
    id: 'template_incident',
    name: 'Incident Response Meeting',
    description: 'Immediate response coordination for active incidents',
    type: 'incident_response',
    defaultDuration: 30,
    defaultAgenda: [
      { id: 'a1', title: 'Incident Overview', duration: 5, order: 1 },
      { id: 'a2', title: 'Current Status', duration: 5, order: 2 },
      { id: 'a3', title: 'Response Actions', duration: 10, order: 3 },
      { id: 'a4', title: 'Resource Allocation', duration: 5, order: 4 },
      { id: 'a5', title: 'Next Steps', duration: 5, order: 5 },
    ],
    defaultReminders: [
      { id: 'r1', minutesBefore: 5, type: 'push', sent: false },
    ],
    icon: 'exclamationmark.triangle.fill',
    color: '#EF4444',
  },
  {
    id: 'template_drill',
    name: 'Drill Debrief Session',
    description: 'Post-drill analysis and improvement discussion',
    type: 'drill_debrief',
    defaultDuration: 60,
    defaultAgenda: [
      { id: 'a1', title: 'Drill Summary', duration: 10, order: 1 },
      { id: 'a2', title: 'Performance Review', duration: 15, order: 2 },
      { id: 'a3', title: 'What Went Well', duration: 10, order: 3 },
      { id: 'a4', title: 'Areas for Improvement', duration: 15, order: 4 },
      { id: 'a5', title: 'Action Items', duration: 10, order: 5 },
    ],
    defaultReminders: [
      { id: 'r1', minutesBefore: 15, type: 'email', sent: false },
      { id: 'r2', minutesBefore: 5, type: 'push', sent: false },
    ],
    icon: 'person.3.fill',
    color: '#F59E0B',
  },
  {
    id: 'template_compliance',
    name: 'Compliance Review',
    description: 'Regular compliance status and audit preparation',
    type: 'compliance_review',
    defaultDuration: 45,
    defaultAgenda: [
      { id: 'a1', title: 'Compliance Status Overview', duration: 10, order: 1 },
      { id: 'a2', title: 'Outstanding Items', duration: 15, order: 2 },
      { id: 'a3', title: 'Upcoming Deadlines', duration: 10, order: 3 },
      { id: 'a4', title: 'Action Planning', duration: 10, order: 4 },
    ],
    defaultReminders: [
      { id: 'r1', minutesBefore: 60, type: 'email', sent: false },
      { id: 'r2', minutesBefore: 15, type: 'push', sent: false },
    ],
    icon: 'checkmark.shield.fill',
    color: '#3B82F6',
  },
  {
    id: 'template_training',
    name: 'Training Session',
    description: 'Staff training and skill development',
    type: 'training',
    defaultDuration: 90,
    defaultAgenda: [
      { id: 'a1', title: 'Introduction', duration: 10, order: 1 },
      { id: 'a2', title: 'Training Content', duration: 50, order: 2 },
      { id: 'a3', title: 'Q&A', duration: 15, order: 3 },
      { id: 'a4', title: 'Assessment', duration: 15, order: 4 },
    ],
    defaultReminders: [
      { id: 'r1', minutesBefore: 1440, type: 'email', sent: false }, // 24 hours
      { id: 'r2', minutesBefore: 30, type: 'push', sent: false },
    ],
    icon: 'book.fill',
    color: '#10B981',
  },
];

// Sample staff for attendee selection
const SAMPLE_STAFF: MeetingAttendee[] = [
  { id: 'staff_1', name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@medivac.health', role: 'Chief Medical Officer', department: 'Clinical', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_2', name: 'James Wilson', email: 'james.wilson@medivac.health', role: 'IT Security Manager', department: 'IT', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_3', name: 'Emily Chen', email: 'emily.chen@medivac.health', role: 'Compliance Officer', department: 'Compliance', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_4', name: 'Michael Brown', email: 'michael.brown@medivac.health', role: 'Operations Director', department: 'Operations', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_5', name: 'Lisa Anderson', email: 'lisa.anderson@medivac.health', role: 'HR Manager', department: 'HR', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_6', name: 'David Lee', email: 'david.lee@medivac.health', role: 'Network Administrator', department: 'IT', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_7', name: 'Jennifer Taylor', email: 'jennifer.taylor@medivac.health', role: 'Clinical Director', department: 'Clinical', isRequired: false, responseStatus: 'pending' },
  { id: 'staff_8', name: 'Robert Garcia', email: 'robert.garcia@medivac.health', role: 'Facility Manager', department: 'Operations', isRequired: false, responseStatus: 'pending' },
];

class TeamsMeetingService {
  private meetings: TeamsMeeting[] = [];
  private templates: MeetingTemplate[] = [];
  private staff: MeetingAttendee[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [meetingsData, templatesData, staffData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MEETINGS),
        AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES),
        AsyncStorage.getItem(STORAGE_KEYS.ATTENDEES),
      ]);

      this.meetings = meetingsData ? JSON.parse(meetingsData) : [];
      this.templates = templatesData ? JSON.parse(templatesData) : DEFAULT_TEMPLATES;
      this.staff = staffData ? JSON.parse(staffData) : SAMPLE_STAFF;

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Teams meeting service:', error);
      this.templates = DEFAULT_TEMPLATES;
      this.staff = SAMPLE_STAFF;
      this.initialized = true;
    }
  }

  private async saveMeetings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(this.meetings));
    } catch (error) {
      console.error('Failed to save meetings:', error);
    }
  }

  private async saveTemplates(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  // Templates
  getTemplates(): MeetingTemplate[] {
    return [...this.templates];
  }

  getTemplate(id: string): MeetingTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  // Staff
  getStaff(): MeetingAttendee[] {
    return [...this.staff];
  }

  getStaffByDepartment(department: string): MeetingAttendee[] {
    return this.staff.filter(s => s.department === department);
  }

  getDepartments(): string[] {
    return [...new Set(this.staff.map(s => s.department))];
  }

  // Meetings
  getMeetings(): TeamsMeeting[] {
    return [...this.meetings].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  getUpcomingMeetings(): TeamsMeeting[] {
    const now = new Date();
    return this.meetings
      .filter(m => new Date(m.startTime) > now && m.status === 'scheduled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  getPastMeetings(): TeamsMeeting[] {
    const now = new Date();
    return this.meetings
      .filter(m => new Date(m.endTime) < now || m.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getMeeting(id: string): TeamsMeeting | undefined {
    return this.meetings.find(m => m.id === id);
  }

  async createMeeting(input: {
    title: string;
    description?: string;
    type: MeetingType;
    startTime: Date;
    duration: number;
    attendees: MeetingAttendee[];
    agenda?: AgendaItem[];
    recurrence?: RecurrenceType;
    drillId?: string;
    incidentId?: string;
  }): Promise<TeamsMeeting> {
    await this.initialize();

    const endTime = new Date(input.startTime.getTime() + input.duration * 60000);
    const template = this.templates.find(t => t.type === input.type);

    const meeting: TeamsMeeting = {
      id: `meeting_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: input.title,
      description: input.description || '',
      type: input.type,
      status: 'scheduled',
      startTime: input.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: input.duration,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attendees: input.attendees,
      organizer: {
        id: 'current_user',
        name: 'Current User',
        email: 'user@medivac.health',
        role: 'Organizer',
        department: 'Administration',
        isRequired: true,
        responseStatus: 'accepted',
      },
      joinUrl: `https://teams.microsoft.com/l/meetup-join/${Date.now()}`,
      teamsId: `teams_${Date.now()}`,
      agenda: input.agenda || template?.defaultAgenda || [],
      recurrence: input.recurrence || 'none',
      drillId: input.drillId,
      incidentId: input.incidentId,
      notes: '',
      reminders: template?.defaultReminders || [
        { id: 'r1', minutesBefore: 15, type: 'push', sent: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate Teams API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.meetings.push(meeting);
    await this.saveMeetings();

    return meeting;
  }

  async updateMeeting(id: string, updates: Partial<TeamsMeeting>): Promise<TeamsMeeting | null> {
    const index = this.meetings.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.meetings[index] = {
      ...this.meetings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveMeetings();
    return this.meetings[index];
  }

  async cancelMeeting(id: string): Promise<boolean> {
    const meeting = this.meetings.find(m => m.id === id);
    if (!meeting) return false;

    meeting.status = 'cancelled';
    meeting.updatedAt = new Date().toISOString();

    await this.saveMeetings();
    return true;
  }

  async deleteMeeting(id: string): Promise<boolean> {
    const index = this.meetings.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.meetings.splice(index, 1);
    await this.saveMeetings();

    return true;
  }

  // Quick schedule from drill
  async scheduleFromDrill(drillId: string, drillName: string, participants: string[]): Promise<TeamsMeeting> {
    // Schedule debrief 30 minutes after current time
    const startTime = new Date(Date.now() + 30 * 60000);
    
    const attendees = this.staff
      .filter(s => participants.includes(s.id) || participants.includes(s.email))
      .map(s => ({ ...s, isRequired: true, responseStatus: 'pending' as const }));

    return this.createMeeting({
      title: `Drill Debrief: ${drillName}`,
      description: `Post-drill analysis and improvement discussion for ${drillName}`,
      type: 'drill_debrief',
      startTime,
      duration: 60,
      attendees,
      drillId,
    });
  }

  // Quick schedule for incident
  async scheduleForIncident(incidentId: string, incidentType: string, severity: string): Promise<TeamsMeeting> {
    // Schedule immediately
    const startTime = new Date(Date.now() + 5 * 60000);
    
    // Auto-select relevant staff based on incident type
    const relevantDepartments = ['IT', 'Clinical', 'Operations'];
    const attendees = this.staff
      .filter(s => relevantDepartments.includes(s.department))
      .slice(0, 5)
      .map(s => ({ ...s, isRequired: true, responseStatus: 'pending' as const }));

    return this.createMeeting({
      title: `Incident Response: ${incidentType}`,
      description: `Immediate response coordination for ${severity} severity ${incidentType} incident`,
      type: 'incident_response',
      startTime,
      duration: 30,
      attendees,
      incidentId,
    });
  }

  // Statistics
  getStatistics(): {
    totalMeetings: number;
    upcomingMeetings: number;
    completedMeetings: number;
    cancelledMeetings: number;
    totalAttendees: number;
    averageDuration: number;
    byType: Record<MeetingType, number>;
  } {
    const byType = {} as Record<MeetingType, number>;
    Object.keys(MEETING_TYPES).forEach(type => {
      byType[type as MeetingType] = this.meetings.filter(m => m.type === type).length;
    });

    const completed = this.meetings.filter(m => m.status === 'completed');
    const avgDuration = completed.length > 0
      ? Math.round(completed.reduce((sum, m) => sum + m.duration, 0) / completed.length)
      : 0;

    return {
      totalMeetings: this.meetings.length,
      upcomingMeetings: this.getUpcomingMeetings().length,
      completedMeetings: completed.length,
      cancelledMeetings: this.meetings.filter(m => m.status === 'cancelled').length,
      totalAttendees: this.meetings.reduce((sum, m) => sum + m.attendees.length, 0),
      averageDuration: avgDuration,
      byType,
    };
  }

  // Export
  exportMeetings(): string {
    return JSON.stringify({
      meetings: this.meetings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const teamsMeetingService = new TeamsMeetingService();
