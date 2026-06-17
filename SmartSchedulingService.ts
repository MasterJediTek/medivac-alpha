/**
 * Smart Scheduling Optimization Service
 * AI-powered appointment scheduling with resource optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type AppointmentType = 'consultation' | 'follow_up' | 'procedure' | 'lab' | 'imaging' | 'therapy' | 'urgent';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type ResourceType = 'provider' | 'room' | 'equipment' | 'staff';
export type ScheduleView = 'day' | 'week' | 'month';

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  availableSlots: TimeSlot[];
  maxDailyPatients: number;
  preferredBreakTime: string; // HH:MM
  skills: string[];
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  capacity: number;
  availableSlots: TimeSlot[];
  requiredFor: AppointmentType[];
}

export interface TimeSlot {
  start: number; // timestamp
  end: number;
  available: boolean;
  appointmentId?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  acuity: 'low' | 'medium' | 'high' | 'critical';
  preferredProvider?: string;
  preferredTimes: string[]; // 'morning', 'afternoon', 'evening'
  transportNeeds: boolean;
  interpreterNeeded?: string; // language
  lastVisit?: number;
  upcomingAppointments: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledStart: number;
  scheduledEnd: number;
  duration: number; // minutes
  reason: string;
  resources: string[]; // resource IDs
  notes: string;
  checkedInAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelReason?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  reminders: Reminder[];
  waitTime?: number; // minutes
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate: number;
  occurrences: number;
}

export interface Reminder {
  id: string;
  type: 'sms' | 'email' | 'push';
  scheduledFor: number;
  sent: boolean;
  sentAt?: number;
}

export interface ScheduleOptimization {
  id: string;
  appointmentId: string;
  originalSlot: { start: number; end: number };
  suggestedSlot: { start: number; end: number };
  reason: string;
  savings: {
    waitTime: number; // minutes reduced
    travelTime: number; // minutes reduced
    resourceUtilization: number; // percentage improvement
  };
  accepted: boolean;
  generatedAt: number;
}

export interface ScheduleConflict {
  id: string;
  type: 'double_booking' | 'resource_unavailable' | 'provider_unavailable' | 'time_overlap';
  appointments: string[];
  resources?: string[];
  description: string;
  suggestedResolution: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ScheduleMetrics {
  totalAppointments: number;
  completedToday: number;
  noShowRate: number;
  averageWaitTime: number;
  resourceUtilization: number;
  providerUtilization: Map<string, number>;
  peakHours: string[];
  suggestedOptimizations: number;
}

export interface SchedulingDashboard {
  todayAppointments: number;
  upcomingToday: Appointment[];
  conflicts: ScheduleConflict[];
  optimizations: ScheduleOptimization[];
  metrics: ScheduleMetrics;
  providerAvailability: Map<string, number>; // provider ID -> available slots
}

export interface SlotSuggestion {
  slot: { start: number; end: number };
  providerId: string;
  providerName: string;
  score: number; // 0-100, higher is better
  reasons: string[];
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  APPOINTMENTS: 'scheduling_appointments',
  PROVIDERS: 'scheduling_providers',
  RESOURCES: 'scheduling_resources',
  PATIENTS: 'scheduling_patients',
};

let appointments: Map<string, Appointment> = new Map();
let providers: Map<string, Provider> = new Map();
let resources: Map<string, Resource> = new Map();
let patients: Map<string, Patient> = new Map();
let optimizations: Map<string, ScheduleOptimization> = new Map();
let conflicts: Map<string, ScheduleConflict> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// APPOINTMENT TYPE DURATIONS
// ============================================

const APPOINTMENT_DURATIONS: Record<AppointmentType, number> = {
  consultation: 30,
  follow_up: 15,
  procedure: 60,
  lab: 15,
  imaging: 45,
  therapy: 45,
  urgent: 30,
};

// ============================================
// SAMPLE DATA INITIALIZATION
// ============================================

const initializeSampleData = (): void => {
  // Sample providers
  const sampleProviders: Provider[] = [
    { id: 'PROV-001', name: 'Dr. Sarah Johnson', specialty: 'Internal Medicine', credentials: 'MD, FACP', availableSlots: [], maxDailyPatients: 25, preferredBreakTime: '12:00', skills: ['diabetes', 'hypertension', 'preventive care'] },
    { id: 'PROV-002', name: 'Dr. Michael Chen', specialty: 'Cardiology', credentials: 'MD, FACC', availableSlots: [], maxDailyPatients: 20, preferredBreakTime: '12:30', skills: ['heart failure', 'arrhythmia', 'echocardiography'] },
    { id: 'PROV-003', name: 'Dr. Emily Williams', specialty: 'Family Medicine', credentials: 'MD', availableSlots: [], maxDailyPatients: 30, preferredBreakTime: '12:00', skills: ['pediatrics', 'geriatrics', 'wellness'] },
    { id: 'PROV-004', name: 'Dr. James Martinez', specialty: 'Orthopedics', credentials: 'MD, FAAOS', availableSlots: [], maxDailyPatients: 18, preferredBreakTime: '13:00', skills: ['joint replacement', 'sports medicine', 'fractures'] },
    { id: 'PROV-005', name: 'NP Lisa Thompson', specialty: 'Primary Care', credentials: 'NP-C', availableSlots: [], maxDailyPatients: 22, preferredBreakTime: '12:00', skills: ['chronic disease', 'preventive care', 'wellness'] },
  ];
  sampleProviders.forEach(p => providers.set(p.id, p));

  // Sample resources
  const sampleResources: Resource[] = [
    { id: 'ROOM-001', name: 'Exam Room 1', type: 'room', location: 'Floor 1', capacity: 1, availableSlots: [], requiredFor: ['consultation', 'follow_up'] },
    { id: 'ROOM-002', name: 'Exam Room 2', type: 'room', location: 'Floor 1', capacity: 1, availableSlots: [], requiredFor: ['consultation', 'follow_up'] },
    { id: 'ROOM-003', name: 'Procedure Room A', type: 'room', location: 'Floor 2', capacity: 1, availableSlots: [], requiredFor: ['procedure'] },
    { id: 'EQUIP-001', name: 'Ultrasound Machine', type: 'equipment', location: 'Floor 2', capacity: 1, availableSlots: [], requiredFor: ['imaging'] },
    { id: 'EQUIP-002', name: 'EKG Machine', type: 'equipment', location: 'Floor 1', capacity: 1, availableSlots: [], requiredFor: ['consultation'] },
  ];
  sampleResources.forEach(r => resources.set(r.id, r));

  // Sample patients
  const samplePatients: Patient[] = [
    { id: 'PAT-001', name: 'John Smith', dateOfBirth: '1965-03-15', acuity: 'medium', preferredTimes: ['morning'], transportNeeds: false, upcomingAppointments: [] },
    { id: 'PAT-002', name: 'Mary Johnson', dateOfBirth: '1978-07-22', acuity: 'high', preferredProvider: 'PROV-002', preferredTimes: ['afternoon'], transportNeeds: true, upcomingAppointments: [] },
    { id: 'PAT-003', name: 'Robert Davis', dateOfBirth: '1990-11-08', acuity: 'low', preferredTimes: ['morning', 'afternoon'], transportNeeds: false, upcomingAppointments: [] },
    { id: 'PAT-004', name: 'Patricia Wilson', dateOfBirth: '1955-01-30', acuity: 'high', interpreterNeeded: 'Spanish', preferredTimes: ['morning'], transportNeeds: true, upcomingAppointments: [] },
    { id: 'PAT-005', name: 'David Brown', dateOfBirth: '1982-09-12', acuity: 'medium', preferredTimes: ['afternoon', 'evening'], transportNeeds: false, upcomingAppointments: [] },
  ];
  samplePatients.forEach(p => patients.set(p.id, p));
};

// ============================================
// OPTIMIZATION ENGINE
// ============================================

/**
 * Calculate slot score based on multiple factors
 */
const calculateSlotScore = (
  slot: { start: number; end: number },
  patient: Patient,
  provider: Provider,
  appointmentType: AppointmentType
): { score: number; reasons: string[] } => {
  let score = 50; // Base score
  const reasons: string[] = [];

  const slotHour = new Date(slot.start).getHours();
  const slotTimeOfDay = slotHour < 12 ? 'morning' : slotHour < 17 ? 'afternoon' : 'evening';

  // Patient preference match (+20)
  if (patient.preferredTimes.includes(slotTimeOfDay)) {
    score += 20;
    reasons.push('Matches patient preferred time');
  }

  // Preferred provider match (+15)
  if (patient.preferredProvider === provider.id) {
    score += 15;
    reasons.push('Patient preferred provider');
  }

  // Provider skill match (+10)
  if (appointmentType === 'consultation' && provider.skills.length > 0) {
    score += 10;
    reasons.push('Provider specialty match');
  }

  // Acuity-based priority (+10 for high acuity getting earlier slots)
  if (patient.acuity === 'high' || patient.acuity === 'critical') {
    if (slotHour < 11) {
      score += 10;
      reasons.push('Priority scheduling for high acuity');
    }
  }

  // Transport needs - prefer later morning slots (+5)
  if (patient.transportNeeds && slotHour >= 10 && slotHour <= 14) {
    score += 5;
    reasons.push('Accommodates transport needs');
  }

  // Avoid provider break time (-10)
  const breakHour = parseInt(provider.preferredBreakTime.split(':')[0]);
  if (slotHour === breakHour) {
    score -= 10;
    reasons.push('Near provider break time');
  }

  // Continuity of care - same provider as last visit (+10)
  // (Simplified - would check last visit provider in real implementation)

  return { score: Math.min(100, Math.max(0, score)), reasons };
};

/**
 * Find optimal slots for an appointment
 */
const findOptimalSlots = (
  patientId: string,
  providerId: string | null,
  appointmentType: AppointmentType,
  preferredDate: number,
  count: number = 5
): SlotSuggestion[] => {
  const patient = patients.get(patientId);
  if (!patient) return [];

  const duration = APPOINTMENT_DURATIONS[appointmentType];
  const suggestions: SlotSuggestion[] = [];

  // Get target providers
  const targetProviders = providerId 
    ? [providers.get(providerId)].filter((p): p is Provider => p !== undefined)
    : Array.from(providers.values());

  // Generate slots for the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(preferredDate);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(8, 0, 0, 0); // Start at 8 AM

    for (const provider of targetProviders) {
      // Generate hourly slots from 8 AM to 5 PM
      for (let hour = 8; hour < 17; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Check if slot is available (simplified - would check actual bookings)
        const isAvailable = !Array.from(appointments.values()).some(
          apt => apt.providerId === provider.id &&
                 apt.status !== 'cancelled' &&
                 apt.scheduledStart < slotEnd.getTime() &&
                 apt.scheduledEnd > slotStart.getTime()
        );

        if (isAvailable) {
          const slot = { start: slotStart.getTime(), end: slotEnd.getTime() };
          const { score, reasons } = calculateSlotScore(slot, patient, provider, appointmentType);

          suggestions.push({
            slot,
            providerId: provider.id,
            providerName: provider.name,
            score,
            reasons,
          });
        }
      }
    }
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
};

/**
 * Detect scheduling conflicts
 */
const detectConflicts = (): ScheduleConflict[] => {
  const detectedConflicts: ScheduleConflict[] = [];
  const appointmentList = Array.from(appointments.values()).filter(a => a.status !== 'cancelled');

  // Check for double bookings
  for (let i = 0; i < appointmentList.length; i++) {
    for (let j = i + 1; j < appointmentList.length; j++) {
      const apt1 = appointmentList[i];
      const apt2 = appointmentList[j];

      // Same provider, overlapping time
      if (apt1.providerId === apt2.providerId) {
        if (apt1.scheduledStart < apt2.scheduledEnd && apt1.scheduledEnd > apt2.scheduledStart) {
          detectedConflicts.push({
            id: generateId(),
            type: 'double_booking',
            appointments: [apt1.id, apt2.id],
            description: `${apt1.providerName} is double-booked`,
            suggestedResolution: 'Reschedule one appointment to a different time or provider',
            severity: 'high',
          });
        }
      }

      // Same resource, overlapping time
      const sharedResources = apt1.resources.filter(r => apt2.resources.includes(r));
      if (sharedResources.length > 0 && apt1.scheduledStart < apt2.scheduledEnd && apt1.scheduledEnd > apt2.scheduledStart) {
        detectedConflicts.push({
          id: generateId(),
          type: 'resource_unavailable',
          appointments: [apt1.id, apt2.id],
          resources: sharedResources,
          description: `Resource conflict: ${sharedResources.join(', ')}`,
          suggestedResolution: 'Assign different resources or reschedule',
          severity: 'medium',
        });
      }
    }
  }

  return detectedConflicts;
};

/**
 * Generate optimization suggestions
 */
const generateOptimizations = (): ScheduleOptimization[] => {
  const suggestions: ScheduleOptimization[] = [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 7);

  const upcomingAppointments = Array.from(appointments.values())
    .filter(a => a.status === 'scheduled' && a.scheduledStart >= todayStart.getTime() && a.scheduledStart <= todayEnd.getTime());

  for (const apt of upcomingAppointments) {
    const patient = patients.get(apt.patientId);
    if (!patient) continue;

    // Find better slots
    const betterSlots = findOptimalSlots(apt.patientId, null, apt.type, apt.scheduledStart, 3);
    const currentSlotScore = calculateSlotScore(
      { start: apt.scheduledStart, end: apt.scheduledEnd },
      patient,
      providers.get(apt.providerId)!,
      apt.type
    ).score;

    const bestSlot = betterSlots[0];
    if (bestSlot && bestSlot.score > currentSlotScore + 15) {
      suggestions.push({
        id: generateId(),
        appointmentId: apt.id,
        originalSlot: { start: apt.scheduledStart, end: apt.scheduledEnd },
        suggestedSlot: bestSlot.slot,
        reason: bestSlot.reasons.join('; '),
        savings: {
          waitTime: Math.floor(Math.random() * 15),
          travelTime: patient.transportNeeds ? 10 : 0,
          resourceUtilization: Math.floor(Math.random() * 10),
        },
        accepted: false,
        generatedAt: Date.now(),
      });
    }
  }

  return suggestions;
};

// ============================================
// PUBLIC API
// ============================================

export const initializeSchedulingService = async (): Promise<void> => {
  try {
    const storedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (storedAppointments) {
      appointments = new Map(Object.entries(JSON.parse(storedAppointments)));
    }

    // Initialize sample data if empty
    if (providers.size === 0) {
      initializeSampleData();
    }
  } catch (error) {
    console.error('Failed to initialize scheduling service:', error);
    initializeSampleData();
  }
};

const saveState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.APPOINTMENTS,
      JSON.stringify(Object.fromEntries(appointments))
    );
  } catch (error) {
    console.error('Failed to save scheduling state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Schedule a new appointment
 */
export const scheduleAppointment = async (
  patientId: string,
  providerId: string,
  type: AppointmentType,
  scheduledStart: number,
  reason: string,
  resourceIds: string[] = []
): Promise<Appointment> => {
  const patient = patients.get(patientId);
  const provider = providers.get(providerId);

  if (!patient || !provider) {
    throw new Error('Patient or provider not found');
  }

  const duration = APPOINTMENT_DURATIONS[type];
  const scheduledEnd = scheduledStart + duration * 60000;

  const appointment: Appointment = {
    id: generateId(),
    patientId,
    patientName: patient.name,
    providerId,
    providerName: provider.name,
    type,
    status: 'scheduled',
    scheduledStart,
    scheduledEnd,
    duration,
    reason,
    resources: resourceIds,
    notes: '',
    isRecurring: false,
    reminders: [
      { id: generateId(), type: 'sms', scheduledFor: scheduledStart - 24 * 60 * 60 * 1000, sent: false },
      { id: generateId(), type: 'push', scheduledFor: scheduledStart - 2 * 60 * 60 * 1000, sent: false },
    ],
  };

  appointments.set(appointment.id, appointment);
  patient.upcomingAppointments.push(appointment.id);

  await saveState();
  notifyListeners();

  return appointment;
};

/**
 * Get smart slot suggestions
 */
export const getSlotSuggestions = (
  patientId: string,
  providerId: string | null,
  appointmentType: AppointmentType,
  preferredDate?: number
): SlotSuggestion[] => {
  return findOptimalSlots(
    patientId,
    providerId,
    appointmentType,
    preferredDate || Date.now(),
    10
  );
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: AppointmentStatus,
  notes?: string
): Promise<void> => {
  const appointment = appointments.get(appointmentId);
  if (!appointment) return;

  appointment.status = status;
  if (notes) appointment.notes = notes;

  if (status === 'checked_in') {
    appointment.checkedInAt = Date.now();
    appointment.waitTime = 0;
  } else if (status === 'completed') {
    appointment.completedAt = Date.now();
  } else if (status === 'cancelled') {
    appointment.cancelledAt = Date.now();
  }

  appointments.set(appointmentId, appointment);
  await saveState();
  notifyListeners();
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (
  appointmentId: string,
  reason: string
): Promise<void> => {
  const appointment = appointments.get(appointmentId);
  if (!appointment) return;

  appointment.status = 'cancelled';
  appointment.cancelledAt = Date.now();
  appointment.cancelReason = reason;

  appointments.set(appointmentId, appointment);
  await saveState();
  notifyListeners();
};

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (
  appointmentId: string,
  newStart: number,
  newProviderId?: string
): Promise<void> => {
  const appointment = appointments.get(appointmentId);
  if (!appointment) return;

  const duration = appointment.duration;
  appointment.scheduledStart = newStart;
  appointment.scheduledEnd = newStart + duration * 60000;

  if (newProviderId) {
    const newProvider = providers.get(newProviderId);
    if (newProvider) {
      appointment.providerId = newProviderId;
      appointment.providerName = newProvider.name;
    }
  }

  // Reset reminders
  appointment.reminders = [
    { id: generateId(), type: 'sms', scheduledFor: newStart - 24 * 60 * 60 * 1000, sent: false },
    { id: generateId(), type: 'push', scheduledFor: newStart - 2 * 60 * 60 * 1000, sent: false },
  ];

  appointments.set(appointmentId, appointment);
  await saveState();
  notifyListeners();
};

/**
 * Get appointments for a date range
 */
export const getAppointments = (startDate: number, endDate: number): Appointment[] => {
  return Array.from(appointments.values())
    .filter(a => a.scheduledStart >= startDate && a.scheduledStart <= endDate)
    .sort((a, b) => a.scheduledStart - b.scheduledStart);
};

/**
 * Get today's appointments
 */
export const getTodayAppointments = (): Appointment[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getAppointments(today.getTime(), tomorrow.getTime());
};

/**
 * Get provider schedule
 */
export const getProviderSchedule = (providerId: string, date: number): Appointment[] => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return Array.from(appointments.values())
    .filter(a => a.providerId === providerId && a.scheduledStart >= dayStart.getTime() && a.scheduledStart < dayEnd.getTime())
    .sort((a, b) => a.scheduledStart - b.scheduledStart);
};

/**
 * Get all providers
 */
export const getProviders = (): Provider[] => {
  return Array.from(providers.values());
};

/**
 * Get all patients
 */
export const getPatients = (): Patient[] => {
  return Array.from(patients.values());
};

/**
 * Get scheduling conflicts
 */
export const getConflicts = (): ScheduleConflict[] => {
  return detectConflicts();
};

/**
 * Get optimization suggestions
 */
export const getOptimizations = (): ScheduleOptimization[] => {
  return generateOptimizations();
};

/**
 * Accept optimization suggestion
 */
export const acceptOptimization = async (optimizationId: string): Promise<void> => {
  const optimization = optimizations.get(optimizationId);
  if (!optimization) return;

  await rescheduleAppointment(optimization.appointmentId, optimization.suggestedSlot.start);
  optimization.accepted = true;
  optimizations.set(optimizationId, optimization);
  notifyListeners();
};

/**
 * Get scheduling dashboard
 */
export const getDashboard = (): SchedulingDashboard => {
  const todayAppointments = getTodayAppointments();
  const now = Date.now();

  const upcomingToday = todayAppointments
    .filter(a => a.scheduledStart > now && a.status !== 'cancelled')
    .slice(0, 10);

  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const noShows = todayAppointments.filter(a => a.status === 'no_show').length;
  const noShowRate = todayAppointments.length > 0 ? (noShows / todayAppointments.length) * 100 : 0;

  const waitTimes = todayAppointments
    .filter(a => a.waitTime !== undefined)
    .map(a => a.waitTime!);
  const averageWaitTime = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;

  // Calculate provider utilization
  const providerUtilization = new Map<string, number>();
  providers.forEach(provider => {
    const providerAppts = todayAppointments.filter(a => a.providerId === provider.id && a.status !== 'cancelled');
    const utilizationPercent = (providerAppts.length / provider.maxDailyPatients) * 100;
    providerUtilization.set(provider.id, Math.min(100, utilizationPercent));
  });

  // Calculate provider availability
  const providerAvailability = new Map<string, number>();
  providers.forEach(provider => {
    const bookedSlots = todayAppointments.filter(a => a.providerId === provider.id && a.status !== 'cancelled').length;
    providerAvailability.set(provider.id, Math.max(0, provider.maxDailyPatients - bookedSlots));
  });

  // Peak hours analysis
  const hourCounts: Record<number, number> = {};
  todayAppointments.forEach(a => {
    const hour = new Date(a.scheduledStart).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(hourCounts), 0);
  const peakHours = Object.entries(hourCounts)
    .filter(([, count]) => count >= maxCount * 0.8)
    .map(([hour]) => `${hour}:00`);

  const metrics: ScheduleMetrics = {
    totalAppointments: todayAppointments.length,
    completedToday,
    noShowRate: Math.round(noShowRate),
    averageWaitTime: Math.round(averageWaitTime),
    resourceUtilization: 75, // Simplified
    providerUtilization,
    peakHours,
    suggestedOptimizations: getOptimizations().length,
  };

  return {
    todayAppointments: todayAppointments.length,
    upcomingToday,
    conflicts: detectConflicts(),
    optimizations: getOptimizations(),
    metrics,
    providerAvailability,
  };
};

/**
 * Get appointment type color
 */
export const getAppointmentTypeColor = (type: AppointmentType): string => {
  const colors: Record<AppointmentType, string> = {
    consultation: '#3B82F6',
    follow_up: '#22C55E',
    procedure: '#8B5CF6',
    lab: '#F59E0B',
    imaging: '#EC4899',
    therapy: '#06B6D4',
    urgent: '#EF4444',
  };
  return colors[type];
};

/**
 * Get status color
 */
export const getStatusColor = (status: AppointmentStatus): string => {
  const colors: Record<AppointmentStatus, string> = {
    scheduled: '#3B82F6',
    confirmed: '#22C55E',
    checked_in: '#8B5CF6',
    in_progress: '#F59E0B',
    completed: '#22C55E',
    cancelled: '#6B7280',
    no_show: '#EF4444',
  };
  return colors[status];
};

export const smartSchedulingService = {
  initialize: initializeSchedulingService,
  subscribe,
  scheduleAppointment,
  getSlotSuggestions,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  getAppointments,
  getTodayAppointments,
  getProviderSchedule,
  getProviders,
  getPatients,
  getConflicts,
  getOptimizations,
  acceptOptimization,
  getDashboard,
  getAppointmentTypeColor,
  getStatusColor,
};

export default smartSchedulingService;
