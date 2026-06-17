/**
 * Patient Portal Service
 * Patient-facing interface with disco styling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type PortalSection = 'dashboard' | 'appointments' | 'results' | 'messages' | 'medications' | 'profile';

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  preferences: {
    notifications: boolean;
    emailReminders: boolean;
    smsReminders: boolean;
    discoMode: boolean;
  };
  avatarUrl?: string;
  lastLogin: number;
}

export interface PortalAppointment {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  scheduledDate: number;
  duration: number;
  type: 'in_person' | 'telemedicine' | 'phone';
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  location?: string;
  reason: string;
  notes?: string;
  canCancel: boolean;
  canReschedule: boolean;
  reminderSent: boolean;
}

export interface LabResult {
  id: string;
  testName: string;
  testCode: string;
  orderedDate: number;
  resultDate: number;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'normal' | 'low' | 'high' | 'critical';
  interpretation?: string;
  orderingProvider: string;
  reviewed: boolean;
  category: 'chemistry' | 'hematology' | 'urinalysis' | 'microbiology' | 'imaging';
}

export interface PortalMessage {
  id: string;
  threadId: string;
  subject: string;
  body: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'provider' | 'staff';
  recipientId: string;
  recipientName: string;
  sentAt: number;
  readAt?: number;
  isRead: boolean;
  hasAttachment: boolean;
  attachments: MessageAttachment[];
  priority: 'normal' | 'urgent';
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedDate: number;
  prescribedBy: string;
  pharmacy: string;
  refillsRemaining: number;
  lastFilled?: number;
  nextRefillDate?: number;
  instructions: string;
  warnings: string[];
  isActive: boolean;
  canRequestRefill: boolean;
}

export interface RefillRequest {
  id: string;
  medicationId: string;
  medicationName: string;
  requestedDate: number;
  status: 'pending' | 'approved' | 'denied' | 'filled';
  pharmacyNotes?: string;
  estimatedReadyDate?: number;
}

export interface HealthSummary {
  allergies: string[];
  conditions: string[];
  immunizations: { name: string; date: number }[];
  vitalsTrend: {
    bloodPressure: { date: number; systolic: number; diastolic: number }[];
    weight: { date: number; value: number }[];
    heartRate: { date: number; value: number }[];
  };
  upcomingAppointments: number;
  unreadMessages: number;
  pendingRefills: number;
  newResults: number;
}

export interface VisitSummary {
  id: string;
  date: number;
  provider: string;
  type: string;
  diagnosis: string[];
  procedures: string[];
  followUp?: string;
  notes: string;
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  PROFILE: 'portal_profile',
  APPOINTMENTS: 'portal_appointments',
  MESSAGES: 'portal_messages',
  MEDICATIONS: 'portal_medications',
};

let currentProfile: PatientProfile | null = null;
let appointments: Map<string, PortalAppointment> = new Map();
let labResults: Map<string, LabResult> = new Map();
let messages: Map<string, PortalMessage> = new Map();
let medications: Map<string, Medication> = new Map();
let refillRequests: Map<string, RefillRequest> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `PTL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// SAMPLE DATA INITIALIZATION
// ============================================

const initializeSampleData = (): void => {
  // Sample patient profile
  currentProfile = {
    id: 'PAT-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: '1985-06-15',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    address: '123 Disco Lane, Funkytown, CA 90210',
    emergencyContact: {
      name: 'Michael Johnson',
      phone: '(555) 987-6543',
      relationship: 'Spouse',
    },
    insuranceInfo: {
      provider: 'Disco Health Insurance',
      policyNumber: 'DHI-123456789',
      groupNumber: 'GRP-FUNK-001',
    },
    preferences: {
      notifications: true,
      emailReminders: true,
      smsReminders: true,
      discoMode: true,
    },
    lastLogin: Date.now(),
  };

  // Sample appointments
  const now = Date.now();
  const sampleAppointments: PortalAppointment[] = [
    { id: 'APT-001', providerId: 'PROV-001', providerName: 'Dr. Groovy Williams', providerSpecialty: 'Internal Medicine', scheduledDate: now + 2 * 24 * 60 * 60 * 1000, duration: 30, type: 'in_person', status: 'confirmed', location: 'Disco Medical Center, Room 101', reason: 'Annual checkup', canCancel: true, canReschedule: true, reminderSent: true },
    { id: 'APT-002', providerId: 'PROV-002', providerName: 'Dr. Funky Martinez', providerSpecialty: 'Cardiology', scheduledDate: now + 7 * 24 * 60 * 60 * 1000, duration: 45, type: 'telemedicine', status: 'scheduled', reason: 'Follow-up consultation', canCancel: true, canReschedule: true, reminderSent: false },
    { id: 'APT-003', providerId: 'PROV-003', providerName: 'Dr. Boogie Brown', providerSpecialty: 'Dermatology', scheduledDate: now - 14 * 24 * 60 * 60 * 1000, duration: 20, type: 'in_person', status: 'completed', location: 'Disco Medical Center, Room 205', reason: 'Skin check', canCancel: false, canReschedule: false, reminderSent: true },
  ];
  sampleAppointments.forEach(a => appointments.set(a.id, a));

  // Sample lab results
  const sampleResults: LabResult[] = [
    { id: 'LAB-001', testName: 'Complete Blood Count', testCode: 'CBC', orderedDate: now - 3 * 24 * 60 * 60 * 1000, resultDate: now - 2 * 24 * 60 * 60 * 1000, value: '14.2', unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'normal', interpretation: 'Hemoglobin within normal limits', orderingProvider: 'Dr. Groovy Williams', reviewed: false, category: 'hematology' },
    { id: 'LAB-002', testName: 'Glucose, Fasting', testCode: 'GLU', orderedDate: now - 3 * 24 * 60 * 60 * 1000, resultDate: now - 2 * 24 * 60 * 60 * 1000, value: '95', unit: 'mg/dL', referenceRange: '70-100', flag: 'normal', interpretation: 'Normal fasting glucose', orderingProvider: 'Dr. Groovy Williams', reviewed: true, category: 'chemistry' },
    { id: 'LAB-003', testName: 'Cholesterol, Total', testCode: 'CHOL', orderedDate: now - 3 * 24 * 60 * 60 * 1000, resultDate: now - 2 * 24 * 60 * 60 * 1000, value: '215', unit: 'mg/dL', referenceRange: '<200', flag: 'high', interpretation: 'Slightly elevated - discuss lifestyle modifications', orderingProvider: 'Dr. Groovy Williams', reviewed: false, category: 'chemistry' },
  ];
  sampleResults.forEach(r => labResults.set(r.id, r));

  // Sample messages
  const sampleMessages: PortalMessage[] = [
    { id: 'MSG-001', threadId: 'THR-001', subject: 'Your Lab Results Are Ready 🎉', body: 'Hi Sarah! Your recent lab results are now available in your patient portal. Everything looks groovy! Please review and let us know if you have any questions.', senderId: 'PROV-001', senderName: 'Dr. Groovy Williams', senderType: 'provider', recipientId: 'PAT-001', recipientName: 'Sarah Johnson', sentAt: now - 2 * 24 * 60 * 60 * 1000, isRead: false, hasAttachment: false, attachments: [], priority: 'normal' },
    { id: 'MSG-002', threadId: 'THR-002', subject: 'Appointment Reminder 💃', body: 'Just a friendly reminder about your upcoming appointment on the dance floor... I mean, at the clinic! See you soon!', senderId: 'STAFF-001', senderName: 'Disco Reception Team', senderType: 'staff', recipientId: 'PAT-001', recipientName: 'Sarah Johnson', sentAt: now - 1 * 24 * 60 * 60 * 1000, isRead: true, hasAttachment: false, attachments: [], priority: 'normal' },
  ];
  sampleMessages.forEach(m => messages.set(m.id, m));

  // Sample medications
  const sampleMedications: Medication[] = [
    { id: 'MED-001', name: 'Lisinopril', genericName: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', route: 'Oral', prescribedDate: now - 90 * 24 * 60 * 60 * 1000, prescribedBy: 'Dr. Funky Martinez', pharmacy: 'Disco Pharmacy', refillsRemaining: 3, lastFilled: now - 30 * 24 * 60 * 60 * 1000, nextRefillDate: now + 5 * 24 * 60 * 60 * 1000, instructions: 'Take in the morning with water', warnings: ['Avoid potassium supplements'], isActive: true, canRequestRefill: true },
    { id: 'MED-002', name: 'Atorvastatin', genericName: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', route: 'Oral', prescribedDate: now - 60 * 24 * 60 * 60 * 1000, prescribedBy: 'Dr. Funky Martinez', pharmacy: 'Disco Pharmacy', refillsRemaining: 5, lastFilled: now - 25 * 24 * 60 * 60 * 1000, instructions: 'Take at bedtime', warnings: ['Report muscle pain immediately'], isActive: true, canRequestRefill: true },
    { id: 'MED-003', name: 'Vitamin D3', genericName: 'Cholecalciferol', dosage: '2000 IU', frequency: 'Once daily', route: 'Oral', prescribedDate: now - 180 * 24 * 60 * 60 * 1000, prescribedBy: 'Dr. Groovy Williams', pharmacy: 'Disco Pharmacy', refillsRemaining: 11, instructions: 'Take with food', warnings: [], isActive: true, canRequestRefill: true },
  ];
  sampleMedications.forEach(m => medications.set(m.id, m));
};

// ============================================
// PUBLIC API
// ============================================

export const initializePatientPortal = async (): Promise<void> => {
  try {
    const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (storedProfile) {
      currentProfile = JSON.parse(storedProfile);
    } else {
      initializeSampleData();
    }
  } catch (error) {
    console.error('Failed to initialize patient portal:', error);
    initializeSampleData();
  }
};

const saveState = async (): Promise<void> => {
  try {
    if (currentProfile) {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(currentProfile));
    }
  } catch (error) {
    console.error('Failed to save portal state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Get patient profile
 */
export const getProfile = (): PatientProfile | null => currentProfile;

/**
 * Update patient profile
 */
export const updateProfile = async (updates: Partial<PatientProfile>): Promise<void> => {
  if (!currentProfile) return;
  currentProfile = { ...currentProfile, ...updates };
  await saveState();
  notifyListeners();
};

/**
 * Get upcoming appointments
 */
export const getUpcomingAppointments = (): PortalAppointment[] => {
  const now = Date.now();
  return Array.from(appointments.values())
    .filter(a => a.scheduledDate > now && a.status !== 'cancelled')
    .sort((a, b) => a.scheduledDate - b.scheduledDate);
};

/**
 * Get past appointments
 */
export const getPastAppointments = (): PortalAppointment[] => {
  const now = Date.now();
  return Array.from(appointments.values())
    .filter(a => a.scheduledDate <= now || a.status === 'completed')
    .sort((a, b) => b.scheduledDate - a.scheduledDate);
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (appointmentId: string, reason: string): Promise<boolean> => {
  const appointment = appointments.get(appointmentId);
  if (!appointment || !appointment.canCancel) return false;

  appointment.status = 'cancelled';
  appointment.notes = `Cancelled by patient: ${reason}`;
  appointments.set(appointmentId, appointment);
  notifyListeners();
  return true;
};

/**
 * Get lab results
 */
export const getLabResults = (category?: string): LabResult[] => {
  let results = Array.from(labResults.values());
  if (category) {
    results = results.filter(r => r.category === category);
  }
  return results.sort((a, b) => b.resultDate - a.resultDate);
};

/**
 * Get unreviewed results count
 */
export const getUnreviewedResultsCount = (): number => {
  return Array.from(labResults.values()).filter(r => !r.reviewed).length;
};

/**
 * Mark result as reviewed
 */
export const markResultReviewed = async (resultId: string): Promise<void> => {
  const result = labResults.get(resultId);
  if (result) {
    result.reviewed = true;
    labResults.set(resultId, result);
    notifyListeners();
  }
};

/**
 * Get messages
 */
export const getMessages = (unreadOnly: boolean = false): PortalMessage[] => {
  let msgs = Array.from(messages.values());
  if (unreadOnly) {
    msgs = msgs.filter(m => !m.isRead);
  }
  return msgs.sort((a, b) => b.sentAt - a.sentAt);
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = (): number => {
  return Array.from(messages.values()).filter(m => !m.isRead).length;
};

/**
 * Mark message as read
 */
export const markMessageRead = async (messageId: string): Promise<void> => {
  const message = messages.get(messageId);
  if (message) {
    message.isRead = true;
    message.readAt = Date.now();
    messages.set(messageId, message);
    notifyListeners();
  }
};

/**
 * Send message
 */
export const sendMessage = async (
  recipientId: string,
  recipientName: string,
  subject: string,
  body: string
): Promise<PortalMessage> => {
  if (!currentProfile) throw new Error('Not logged in');

  const message: PortalMessage = {
    id: generateId(),
    threadId: generateId(),
    subject,
    body,
    senderId: currentProfile.id,
    senderName: `${currentProfile.firstName} ${currentProfile.lastName}`,
    senderType: 'patient',
    recipientId,
    recipientName,
    sentAt: Date.now(),
    isRead: false,
    hasAttachment: false,
    attachments: [],
    priority: 'normal',
  };

  messages.set(message.id, message);
  notifyListeners();
  return message;
};

/**
 * Get medications
 */
export const getMedications = (activeOnly: boolean = true): Medication[] => {
  let meds = Array.from(medications.values());
  if (activeOnly) {
    meds = meds.filter(m => m.isActive);
  }
  return meds.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Request medication refill
 */
export const requestRefill = async (medicationId: string): Promise<RefillRequest> => {
  const medication = medications.get(medicationId);
  if (!medication || !medication.canRequestRefill) {
    throw new Error('Cannot request refill for this medication');
  }

  const request: RefillRequest = {
    id: generateId(),
    medicationId,
    medicationName: medication.name,
    requestedDate: Date.now(),
    status: 'pending',
    estimatedReadyDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
  };

  refillRequests.set(request.id, request);
  notifyListeners();
  return request;
};

/**
 * Get refill requests
 */
export const getRefillRequests = (): RefillRequest[] => {
  return Array.from(refillRequests.values())
    .sort((a, b) => b.requestedDate - a.requestedDate);
};

/**
 * Get health summary
 */
export const getHealthSummary = (): HealthSummary => {
  return {
    allergies: ['Penicillin', 'Shellfish'],
    conditions: ['Hypertension', 'Hyperlipidemia'],
    immunizations: [
      { name: 'COVID-19 Booster', date: Date.now() - 90 * 24 * 60 * 60 * 1000 },
      { name: 'Flu Shot', date: Date.now() - 60 * 24 * 60 * 60 * 1000 },
      { name: 'Tdap', date: Date.now() - 365 * 24 * 60 * 60 * 1000 },
    ],
    vitalsTrend: {
      bloodPressure: [
        { date: Date.now() - 90 * 24 * 60 * 60 * 1000, systolic: 138, diastolic: 88 },
        { date: Date.now() - 60 * 24 * 60 * 60 * 1000, systolic: 132, diastolic: 84 },
        { date: Date.now() - 30 * 24 * 60 * 60 * 1000, systolic: 128, diastolic: 82 },
        { date: Date.now(), systolic: 124, diastolic: 78 },
      ],
      weight: [
        { date: Date.now() - 90 * 24 * 60 * 60 * 1000, value: 175 },
        { date: Date.now() - 60 * 24 * 60 * 60 * 1000, value: 173 },
        { date: Date.now() - 30 * 24 * 60 * 60 * 1000, value: 171 },
        { date: Date.now(), value: 169 },
      ],
      heartRate: [
        { date: Date.now() - 90 * 24 * 60 * 60 * 1000, value: 78 },
        { date: Date.now() - 60 * 24 * 60 * 60 * 1000, value: 74 },
        { date: Date.now() - 30 * 24 * 60 * 60 * 1000, value: 72 },
        { date: Date.now(), value: 70 },
      ],
    },
    upcomingAppointments: getUpcomingAppointments().length,
    unreadMessages: getUnreadMessageCount(),
    pendingRefills: Array.from(refillRequests.values()).filter(r => r.status === 'pending').length,
    newResults: getUnreviewedResultsCount(),
  };
};

/**
 * Get visit history
 */
export const getVisitHistory = (): VisitSummary[] => {
  return [
    { id: 'VIS-001', date: Date.now() - 14 * 24 * 60 * 60 * 1000, provider: 'Dr. Boogie Brown', type: 'Dermatology Visit', diagnosis: ['Benign skin lesion'], procedures: ['Skin examination'], notes: 'No concerning findings. Continue sun protection.' },
    { id: 'VIS-002', date: Date.now() - 90 * 24 * 60 * 60 * 1000, provider: 'Dr. Funky Martinez', type: 'Cardiology Follow-up', diagnosis: ['Essential hypertension'], procedures: ['ECG', 'Blood pressure check'], followUp: '3 months', notes: 'BP improving with medication. Continue current regimen.' },
    { id: 'VIS-003', date: Date.now() - 180 * 24 * 60 * 60 * 1000, provider: 'Dr. Groovy Williams', type: 'Annual Physical', diagnosis: ['Hyperlipidemia', 'Essential hypertension'], procedures: ['Comprehensive exam', 'Lab work'], followUp: '1 year', notes: 'Overall health improving. Lifestyle modifications showing results.' },
  ];
};

export const patientPortalService = {
  initialize: initializePatientPortal,
  subscribe,
  getProfile,
  updateProfile,
  getUpcomingAppointments,
  getPastAppointments,
  cancelAppointment,
  getLabResults,
  getUnreviewedResultsCount,
  markResultReviewed,
  getMessages,
  getUnreadMessageCount,
  markMessageRead,
  sendMessage,
  getMedications,
  requestRefill,
  getRefillRequests,
  getHealthSummary,
  getVisitHistory,
};

export default patientPortalService;
