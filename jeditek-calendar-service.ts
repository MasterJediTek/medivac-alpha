/**
 * JediTek Calendar Service
 * MediVac WACHS v8.6
 * 
 * Master calendar system with vibrant color coding, rich sounds,
 * and comprehensive event management including tasks, jobs, projects,
 * clubs, classes, bookings, and medication alerts.
 */

// Event Types
export type EventType = 
  | 'todo'
  | 'event'
  | 'task'
  | 'job'
  | 'project'
  | 'club'
  | 'class'
  | 'booking'
  | 'medication'
  | 'appointment'
  | 'meeting'
  | 'reminder'
  | 'birthday'
  | 'holiday'
  | 'shift'
  | 'training';

export type EventPriority = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type EventStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'overdue' | 'snoozed';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

// Vibrant Color Palette for JediTek
export interface EventColor {
  primary: string;
  secondary: string;
  gradient: string[];
  glow: string;
  text: string;
  icon: string;
}

export const JEDITEK_COLORS: Record<EventType, EventColor> = {
  todo: {
    primary: '#FF6B6B',
    secondary: '#FF8E8E',
    gradient: ['#FF6B6B', '#FF8E8E', '#FFA5A5'],
    glow: 'rgba(255, 107, 107, 0.4)',
    text: '#FFFFFF',
    icon: '✓',
  },
  event: {
    primary: '#4ECDC4',
    secondary: '#6EE7DF',
    gradient: ['#4ECDC4', '#6EE7DF', '#95F2EB'],
    glow: 'rgba(78, 205, 196, 0.4)',
    text: '#FFFFFF',
    icon: '📅',
  },
  task: {
    primary: '#45B7D1',
    secondary: '#67C9E0',
    gradient: ['#45B7D1', '#67C9E0', '#8DDBEF'],
    glow: 'rgba(69, 183, 209, 0.4)',
    text: '#FFFFFF',
    icon: '📋',
  },
  job: {
    primary: '#96CEB4',
    secondary: '#AEDCC6',
    gradient: ['#96CEB4', '#AEDCC6', '#C6EAD8'],
    glow: 'rgba(150, 206, 180, 0.4)',
    text: '#1A1A1A',
    icon: '💼',
  },
  project: {
    primary: '#9B59B6',
    secondary: '#B07CC6',
    gradient: ['#9B59B6', '#B07CC6', '#C59FD6'],
    glow: 'rgba(155, 89, 182, 0.4)',
    text: '#FFFFFF',
    icon: '🚀',
  },
  club: {
    primary: '#F39C12',
    secondary: '#F5B041',
    gradient: ['#F39C12', '#F5B041', '#F7C470'],
    glow: 'rgba(243, 156, 18, 0.4)',
    text: '#1A1A1A',
    icon: '🏛️',
  },
  class: {
    primary: '#3498DB',
    secondary: '#5DADE2',
    gradient: ['#3498DB', '#5DADE2', '#85C1E9'],
    glow: 'rgba(52, 152, 219, 0.4)',
    text: '#FFFFFF',
    icon: '📚',
  },
  booking: {
    primary: '#E91E63',
    secondary: '#F06292',
    gradient: ['#E91E63', '#F06292', '#F48FB1'],
    glow: 'rgba(233, 30, 99, 0.4)',
    text: '#FFFFFF',
    icon: '🎫',
  },
  medication: {
    primary: '#E74C3C',
    secondary: '#EC7063',
    gradient: ['#E74C3C', '#EC7063', '#F1948A'],
    glow: 'rgba(231, 76, 60, 0.4)',
    text: '#FFFFFF',
    icon: '💊',
  },
  appointment: {
    primary: '#1ABC9C',
    secondary: '#48C9B0',
    gradient: ['#1ABC9C', '#48C9B0', '#76D7C4'],
    glow: 'rgba(26, 188, 156, 0.4)',
    text: '#FFFFFF',
    icon: '🏥',
  },
  meeting: {
    primary: '#673AB7',
    secondary: '#9575CD',
    gradient: ['#673AB7', '#9575CD', '#B39DDB'],
    glow: 'rgba(103, 58, 183, 0.4)',
    text: '#FFFFFF',
    icon: '👥',
  },
  reminder: {
    primary: '#FF9800',
    secondary: '#FFB74D',
    gradient: ['#FF9800', '#FFB74D', '#FFCC80'],
    glow: 'rgba(255, 152, 0, 0.4)',
    text: '#1A1A1A',
    icon: '🔔',
  },
  birthday: {
    primary: '#E040FB',
    secondary: '#EA80FC',
    gradient: ['#E040FB', '#EA80FC', '#F0A0FF'],
    glow: 'rgba(224, 64, 251, 0.4)',
    text: '#FFFFFF',
    icon: '🎂',
  },
  holiday: {
    primary: '#00BCD4',
    secondary: '#4DD0E1',
    gradient: ['#00BCD4', '#4DD0E1', '#80DEEA'],
    glow: 'rgba(0, 188, 212, 0.4)',
    text: '#FFFFFF',
    icon: '🌴',
  },
  shift: {
    primary: '#607D8B',
    secondary: '#90A4AE',
    gradient: ['#607D8B', '#90A4AE', '#B0BEC5'],
    glow: 'rgba(96, 125, 139, 0.4)',
    text: '#FFFFFF',
    icon: '⏰',
  },
  training: {
    primary: '#8BC34A',
    secondary: '#AED581',
    gradient: ['#8BC34A', '#AED581', '#C5E1A5'],
    glow: 'rgba(139, 195, 74, 0.4)',
    text: '#1A1A1A',
    icon: '🎓',
  },
};

// Sound Configuration
export interface EventSound {
  soundId: string;
  soundName: string;
  duration: number;
  vibrationPattern: number[];
}

export const JEDITEK_SOUNDS: Record<EventType, EventSound> = {
  todo: { soundId: 'jedi-todo', soundName: 'Task Chime', duration: 500, vibrationPattern: [100] },
  event: { soundId: 'jedi-event', soundName: 'Event Bell', duration: 800, vibrationPattern: [200, 100, 200] },
  task: { soundId: 'jedi-task', soundName: 'Task Alert', duration: 600, vibrationPattern: [150, 50, 150] },
  job: { soundId: 'jedi-job', soundName: 'Work Tone', duration: 700, vibrationPattern: [200, 100, 100] },
  project: { soundId: 'jedi-project', soundName: 'Project Fanfare', duration: 1000, vibrationPattern: [100, 50, 100, 50, 200] },
  club: { soundId: 'jedi-club', soundName: 'Community Chime', duration: 600, vibrationPattern: [150, 100, 150] },
  class: { soundId: 'jedi-class', soundName: 'School Bell', duration: 900, vibrationPattern: [300, 100, 300] },
  booking: { soundId: 'jedi-booking', soundName: 'Booking Confirm', duration: 500, vibrationPattern: [100, 50, 100] },
  medication: { soundId: 'jedi-medication', soundName: 'Med Alert', duration: 1500, vibrationPattern: [200, 100, 200, 100, 200, 100, 500] },
  appointment: { soundId: 'jedi-appointment', soundName: 'Appointment Reminder', duration: 800, vibrationPattern: [200, 100, 200] },
  meeting: { soundId: 'jedi-meeting', soundName: 'Meeting Call', duration: 700, vibrationPattern: [150, 75, 150, 75, 150] },
  reminder: { soundId: 'jedi-reminder', soundName: 'Gentle Reminder', duration: 400, vibrationPattern: [100, 100] },
  birthday: { soundId: 'jedi-birthday', soundName: 'Birthday Jingle', duration: 1200, vibrationPattern: [100, 50, 100, 50, 100, 50, 300] },
  holiday: { soundId: 'jedi-holiday', soundName: 'Holiday Cheer', duration: 1000, vibrationPattern: [200, 100, 200, 100, 200] },
  shift: { soundId: 'jedi-shift', soundName: 'Shift Change', duration: 600, vibrationPattern: [300, 150, 300] },
  training: { soundId: 'jedi-training', soundName: 'Training Start', duration: 800, vibrationPattern: [200, 100, 200, 100] },
};

// Subtask Interface
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: number;
}

// Medication Details
export interface MedicationDetails {
  medicationName: string;
  dosage: string;
  unit: string;
  frequency: string;
  instructions?: string;
  taken: boolean;
  takenAt?: number;
  prescribedBy?: string;
  refillDate?: number;
}

// Event Reminder
export interface EventReminder {
  id: string;
  minutesBefore: number;
  type: 'notification' | 'sound' | 'vibration' | 'all';
  sent: boolean;
}

// Calendar Event Interface
export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  location?: string;
  startDate: number;
  endDate: number;
  allDay: boolean;
  priority: EventPriority;
  status: EventStatus;
  color: EventColor;
  sound: EventSound;
  recurrence: RecurrenceType;
  recurrenceEndDate?: number;
  reminders: EventReminder[];
  medication?: MedicationDetails;
  progress?: number;
  subtasks?: SubTask[];
  groupId?: string;
  syncToWatch: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Calendar Day
export interface CalendarDay {
  date: number;
  dayOfWeek: number;
  isToday: boolean;
  isWeekend: boolean;
  eventCount: number;
  hasMedication: boolean;
  events: CalendarEvent[];
}

// Calendar Week
export interface CalendarWeek {
  weekNumber: number;
  startDate: number;
  endDate: number;
  days: CalendarDay[];
}

// Analytics
export interface CalendarAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  completedToday: number;
  eventsByType: Record<EventType, number>;
  eventsByStatus: Record<EventStatus, number>;
  busiestDay: string;
  busiestHour: number;
  avgEventsPerDay: number;
  medicationAdherence: number;
}

type Listener = (events: CalendarEvent[]) => void;

class JediTekCalendarService {
  private events: Map<string, CalendarEvent> = new Map();
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const sampleEvents: Array<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'color' | 'sound'>> = [
      {
        type: 'medication',
        title: 'Take Morning Medication',
        description: 'Daily blood pressure medication',
        startDate: todayStart + 8 * 60 * 60 * 1000,
        endDate: todayStart + 8 * 60 * 60 * 1000 + 15 * 60 * 1000,
        allDay: false,
        priority: 'critical',
        status: 'pending',
        recurrence: 'daily',
        reminders: [{ id: 'rem-1', minutesBefore: 15, type: 'all', sent: false }],
        medication: {
          medicationName: 'Lisinopril',
          dosage: '10',
          unit: 'mg',
          frequency: 'Once daily',
          instructions: 'Take with water',
          taken: false,
        },
        syncToWatch: true,
        tags: ['health', 'daily'],
      },
      {
        type: 'meeting',
        title: 'JEDI Council Meeting',
        description: 'Weekly sync with the Master JEDI Council',
        location: 'Conference Room A',
        startDate: todayStart + 10 * 60 * 60 * 1000,
        endDate: todayStart + 11 * 60 * 60 * 1000,
        allDay: false,
        priority: 'high',
        status: 'pending',
        recurrence: 'weekly',
        reminders: [{ id: 'rem-2', minutesBefore: 30, type: 'notification', sent: false }],
        syncToWatch: true,
        tags: ['work', 'jedi'],
      },
      {
        type: 'task',
        title: 'Review Patient Reports',
        description: 'Complete review of pending patient reports',
        startDate: todayStart + 14 * 60 * 60 * 1000,
        endDate: todayStart + 16 * 60 * 60 * 1000,
        allDay: false,
        priority: 'medium',
        status: 'in-progress',
        recurrence: 'none',
        reminders: [],
        progress: 45,
        subtasks: [
          { id: 'sub-1', title: 'Review Lab Results', completed: true, completedAt: now - 3600000 },
          { id: 'sub-2', title: 'Check Vital Signs', completed: false },
          { id: 'sub-3', title: 'Update Patient Notes', completed: false },
        ],
        syncToWatch: true,
        tags: ['work', 'medical'],
      },
      {
        type: 'class',
        title: 'Advanced JEDI Training',
        description: 'Force mastery techniques',
        location: 'Training Hall B',
        startDate: todayStart + 86400000 + 9 * 60 * 60 * 1000, // Tomorrow
        endDate: todayStart + 86400000 + 12 * 60 * 60 * 1000,
        allDay: false,
        priority: 'medium',
        status: 'pending',
        recurrence: 'weekly',
        reminders: [{ id: 'rem-3', minutesBefore: 60, type: 'notification', sent: false }],
        syncToWatch: true,
        tags: ['training', 'jedi'],
      },
      {
        type: 'project',
        title: 'MediVac System Upgrade',
        description: 'Implement v8.6 features',
        startDate: todayStart,
        endDate: todayStart + 7 * 86400000,
        allDay: false,
        priority: 'high',
        status: 'in-progress',
        recurrence: 'none',
        reminders: [],
        progress: 65,
        subtasks: [
          { id: 'proj-1', title: 'JediTek Calendar', completed: true },
          { id: 'proj-2', title: 'Smartwatch Integration', completed: false },
          { id: 'proj-3', title: 'Dashboard Templates', completed: false },
        ],
        syncToWatch: true,
        tags: ['development', 'priority'],
      },
      {
        type: 'booking',
        title: 'Dental Appointment',
        description: 'Regular checkup',
        location: 'City Dental Clinic',
        startDate: todayStart + 2 * 86400000 + 15 * 60 * 60 * 1000,
        endDate: todayStart + 2 * 86400000 + 16 * 60 * 60 * 1000,
        allDay: false,
        priority: 'low',
        status: 'pending',
        recurrence: 'none',
        reminders: [{ id: 'rem-4', minutesBefore: 1440, type: 'notification', sent: false }],
        syncToWatch: true,
        tags: ['health', 'personal'],
      },
    ];

    sampleEvents.forEach((event) => {
      this.addEvent(event);
    });
  }

  // Event Management
  addEvent(eventData: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'color' | 'sound'>> & { type: EventType; title: string; startDate: number; endDate: number }): CalendarEvent {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const event: CalendarEvent = {
      description: '',
      allDay: false,
      priority: 'medium',
      status: 'pending',
      recurrence: 'none',
      reminders: [],
      syncToWatch: true,
      tags: [],
      ...eventData,
      id,
      color: JEDITEK_COLORS[eventData.type],
      sound: JEDITEK_SOUNDS[eventData.type],
      createdAt: now,
      updatedAt: now,
    };

    this.events.set(id, event);
    this.notifyListeners();
    return event;
  }

  updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): CalendarEvent | undefined {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updated: CalendarEvent = {
      ...event,
      ...updates,
      updatedAt: Date.now(),
    };

    if (updates.type && updates.type !== event.type) {
      updated.color = JEDITEK_COLORS[updates.type];
      updated.sound = JEDITEK_SOUNDS[updates.type];
    }

    this.events.set(id, updated);
    this.notifyListeners();
    return updated;
  }

  deleteEvent(id: string): boolean {
    const deleted = this.events.delete(id);
    if (deleted) {
      this.notifyListeners();
    }
    return deleted;
  }

  getEvent(id: string): CalendarEvent | undefined {
    return this.events.get(id);
  }

  getAllEvents(): CalendarEvent[] {
    return Array.from(this.events.values()).sort((a, b) => a.startDate - b.startDate);
  }

  getEventsByType(type: EventType): CalendarEvent[] {
    return this.getAllEvents().filter(e => e.type === type);
  }

  getEventsByStatus(status: EventStatus): CalendarEvent[] {
    return this.getAllEvents().filter(e => e.status === status);
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.getAllEvents().filter(e => 
      (e.startDate >= dayStart.getTime() && e.startDate <= dayEnd.getTime()) ||
      (e.endDate >= dayStart.getTime() && e.endDate <= dayEnd.getTime()) ||
      (e.startDate <= dayStart.getTime() && e.endDate >= dayEnd.getTime())
    );
  }

  getUpcomingEvents(days: number = 7): CalendarEvent[] {
    const now = Date.now();
    const future = now + days * 24 * 60 * 60 * 1000;
    return this.getAllEvents().filter(e => e.startDate >= now && e.startDate <= future);
  }

  getMedicationEvents(): CalendarEvent[] {
    return this.getEventsByType('medication');
  }

  getTodayMedications(): CalendarEvent[] {
    const today = new Date();
    return this.getEventsForDay(today).filter(e => e.type === 'medication');
  }

  // Subtask Management
  addSubtask(eventId: string, title: string): SubTask | undefined {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    const subtask: SubTask = {
      id: `sub-${Date.now()}`,
      title,
      completed: false,
    };

    const subtasks = event.subtasks || [];
    subtasks.push(subtask);
    
    this.updateEvent(eventId, { subtasks });
    return subtask;
  }

  completeSubtask(eventId: string, subtaskId: string): boolean {
    const event = this.events.get(eventId);
    if (!event || !event.subtasks) return false;

    const subtask = event.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return false;

    subtask.completed = true;
    subtask.completedAt = Date.now();

    const completedCount = event.subtasks.filter(s => s.completed).length;
    const progress = Math.round((completedCount / event.subtasks.length) * 100);

    this.updateEvent(eventId, { subtasks: event.subtasks, progress });
    return true;
  }

  // Medication Management
  markMedicationTaken(eventId: string): boolean {
    const event = this.events.get(eventId);
    if (!event || !event.medication) return false;

    event.medication.taken = true;
    event.medication.takenAt = Date.now();
    
    this.updateEvent(eventId, { 
      medication: event.medication, 
      status: 'completed' 
    });
    return true;
  }

  getMedicationAdherence(): number {
    const meds = this.getMedicationEvents();
    if (meds.length === 0) return 100;

    const pastMeds = meds.filter(m => m.startDate < Date.now());
    if (pastMeds.length === 0) return 100;

    const takenCount = pastMeds.filter(m => m.medication?.taken).length;
    return Math.round((takenCount / pastMeds.length) * 100);
  }

  // Calendar Views
  generateWeekView(date: Date): CalendarWeek {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = this.getEventsForDay(dayDate);
      
      days.push({
        date: dayDate.getTime(),
        dayOfWeek: dayDate.getDay(),
        isToday: dayDate.getTime() === today.getTime(),
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
        eventCount: dayEvents.length,
        hasMedication: dayEvents.some(e => e.type === 'medication'),
        events: dayEvents,
      });
    }

    const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);

    return {
      weekNumber,
      startDate: startOfWeek.getTime(),
      endDate: startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000,
      days,
    };
  }

  // Quick Add Methods
  quickAddTodo(title: string, priority: EventPriority = 'medium'): CalendarEvent {
    const now = Date.now();
    return this.addEvent({
      type: 'todo',
      title,
      startDate: now,
      endDate: now + 24 * 60 * 60 * 1000,
      priority,
    });
  }

  quickAddMedication(name: string, dosage: string, time: number): CalendarEvent {
    return this.addEvent({
      type: 'medication',
      title: `Take ${name}`,
      startDate: time,
      endDate: time + 15 * 60 * 1000,
      priority: 'critical',
      medication: {
        medicationName: name,
        dosage: dosage.replace(/[^0-9.]/g, ''),
        unit: dosage.replace(/[0-9.]/g, '').trim() || 'mg',
        frequency: 'As scheduled',
        taken: false,
      },
    });
  }

  // Analytics
  getAnalytics(): CalendarAnalytics {
    const events = this.getAllEvents();
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const eventsByType: Record<EventType, number> = {} as Record<EventType, number>;
    const eventsByStatus: Record<EventStatus, number> = {} as Record<EventStatus, number>;
    const eventsByDay: Record<string, number> = {};
    const eventsByHour: Record<number, number> = {};

    const types: EventType[] = ['todo', 'event', 'task', 'job', 'project', 'club', 'class', 'booking', 'medication', 'appointment', 'meeting', 'reminder', 'birthday', 'holiday', 'shift', 'training'];
    const statuses: EventStatus[] = ['pending', 'in-progress', 'completed', 'cancelled', 'overdue', 'snoozed'];

    types.forEach(t => eventsByType[t] = 0);
    statuses.forEach(s => eventsByStatus[s] = 0);

    events.forEach(e => {
      eventsByType[e.type]++;
      eventsByStatus[e.status]++;

      const day = new Date(e.startDate).toLocaleDateString('en-US', { weekday: 'long' });
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;

      const hour = new Date(e.startDate).getHours();
      eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
    });

    const busiestDay = Object.entries(eventsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    const busiestHour = Object.entries(eventsByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '9';

    return {
      totalEvents: events.length,
      upcomingEvents: events.filter(e => e.startDate > now && e.startDate <= now + 7 * 86400000).length,
      overdueEvents: events.filter(e => e.status === 'overdue' || (e.endDate < now && e.status === 'pending')).length,
      completedToday: events.filter(e => e.status === 'completed' && e.updatedAt >= today.getTime() && e.updatedAt <= todayEnd.getTime()).length,
      eventsByType,
      eventsByStatus,
      busiestDay,
      busiestHour: parseInt(busiestHour),
      avgEventsPerDay: Math.round(events.length / 7),
      medicationAdherence: this.getMedicationAdherence(),
    };
  }

  // Subscription
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const events = this.getAllEvents();
    this.listeners.forEach(listener => listener(events));
  }

  // Reset
  reset(): void {
    this.events.clear();
    this.initializeSampleData();
    this.notifyListeners();
  }
}

export const jediTekCalendarService = new JediTekCalendarService();
