/**
 * MediVac One - Medical AI Assistant Service
 * Role-based AI personas with JEDI Master membership
 * Virtual Receptionist for patients, Virtual Assistant for staff
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type AIPersonaRole = 
  | 'doctor'
  | 'nurse'
  | 'admin'
  | 'patient'
  | 'receptionist'
  | 'emergency'
  | 'lab_tech'
  | 'pharmacist'
  | 'surgeon'
  | 'radiologist'
  | 'therapist'
  | 'security'
  | 'it_support'
  | 'finance'
  | 'hr'
  | 'jedi_commander'
  | 'master_jedi';

export type JEDIMastershipLevel = 
  | 'initiate'
  | 'padawan'
  | 'knight'
  | 'master'
  | 'grand_master'
  | 'supreme_commander';

export interface AIPersona {
  id: string;
  role: AIPersonaRole;
  name: string;
  avatar: string;
  title: string;
  greeting: string;
  personality: string;
  capabilities: string[];
  restrictions: string[];
  jediMastership: JEDIMastershipLevel;
  accessPrivileges: AccessPrivilege[];
  controlOptions: ControlOption[];
  recommendedAssets: RecommendedAsset[];
  quickActions: QuickAction[];
}

export interface AccessPrivilege {
  id: string;
  name: string;
  description: string;
  category: 'records' | 'calendar' | 'tasks' | 'email' | 'events' | 'system' | 'clinical' | 'admin';
  level: 'read' | 'write' | 'execute' | 'admin';
  enabled: boolean;
}

export interface ControlOption {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'notification' | 'workflow' | 'integration' | 'security';
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface RecommendedAsset {
  id: string;
  name: string;
  type: 'screen' | 'document' | 'tool' | 'report' | 'workflow';
  route: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  action: string;
  params?: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  persona?: AIPersonaRole;
  actions?: ExecutedAction[];
  attachments?: MessageAttachment[];
}

export interface ExecutedAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  result?: unknown;
}

export interface MessageAttachment {
  id: string;
  type: 'document' | 'image' | 'link' | 'record';
  name: string;
  url?: string;
  data?: unknown;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  userRole: string;
  currentPersona: AIPersonaRole;
  activePatientId?: string;
  activeTaskId?: string;
  location?: string;
  department?: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
}

export interface AssistantSession {
  id: string;
  userId: string;
  userRole: string;
  persona: AIPersonaRole;
  startedAt: string;
  lastActivityAt: string;
  messages: ConversationMessage[];
  context: ConversationContext;
  actionsExecuted: number;
  isActive: boolean;
}

// ==========================================
// AI Personas Configuration
// ==========================================

const AI_PERSONAS: Record<AIPersonaRole, AIPersona> = {
  doctor: {
    id: 'ai_doctor',
    role: 'doctor',
    name: 'Dr. ARIA',
    avatar: '👨‍⚕️',
    title: 'AI Clinical Assistant',
    greeting: "Hello Doctor, I'm Dr. ARIA, your AI clinical assistant. How can I help you today with patient care, clinical decisions, or administrative tasks?",
    personality: 'Professional, knowledgeable, evidence-based, supportive of clinical decision-making',
    capabilities: [
      'Clinical decision support',
      'Drug interaction checking',
      'Lab result interpretation',
      'Patient record summarization',
      'Order entry assistance',
      'Referral management',
      'Clinical documentation',
      'Protocol recommendations',
    ],
    restrictions: ['Cannot make final clinical decisions', 'Cannot prescribe without physician approval'],
    jediMastership: 'master',
    accessPrivileges: [
      { id: 'ap_records_full', name: 'Full Patient Records', description: 'Access all patient medical records', category: 'records', level: 'admin', enabled: true },
      { id: 'ap_orders', name: 'Order Management', description: 'Create and manage clinical orders', category: 'clinical', level: 'write', enabled: true },
      { id: 'ap_calendar', name: 'Calendar Access', description: 'View and manage appointments', category: 'calendar', level: 'write', enabled: true },
      { id: 'ap_tasks', name: 'Task Management', description: 'Create and assign clinical tasks', category: 'tasks', level: 'write', enabled: true },
      { id: 'ap_email', name: 'Email Communications', description: 'Send and receive clinical communications', category: 'email', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_auto_alerts', name: 'Automatic Alerts', description: 'Receive automated clinical alerts', category: 'notification', enabled: true },
      { id: 'co_workflow', name: 'Workflow Automation', description: 'Automate routine clinical workflows', category: 'workflow', enabled: true },
      { id: 'co_integration', name: 'System Integration', description: 'Connect with external clinical systems', category: 'integration', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_cpoe', name: 'CPOE', type: 'screen', route: '/cpoe', priority: 'high', description: 'Physician order entry system' },
      { id: 'ra_patients', name: 'Patient List', type: 'screen', route: '/patients', priority: 'high', description: 'View and manage patients' },
      { id: 'ra_labs', name: 'Lab Results', type: 'screen', route: '/labs', priority: 'high', description: 'Review laboratory results' },
      { id: 'ra_schedule', name: 'Schedule', type: 'screen', route: '/schedule', priority: 'medium', description: 'Manage appointments' },
    ],
    quickActions: [
      { id: 'qa_new_order', name: 'New Order', icon: 'doc.fill', action: 'navigate', params: { route: '/cpoe' }, requiresConfirmation: false },
      { id: 'qa_view_patient', name: 'View Patient', icon: 'person.fill', action: 'search_patient', requiresConfirmation: false },
      { id: 'qa_check_labs', name: 'Check Labs', icon: 'stethoscope', action: 'navigate', params: { route: '/labs' }, requiresConfirmation: false },
      { id: 'qa_dictate', name: 'Dictate Note', icon: 'mic.fill', action: 'start_dictation', requiresConfirmation: false },
    ],
  },

  nurse: {
    id: 'ai_nurse',
    role: 'nurse',
    name: 'Nurse NOVA',
    avatar: '👩‍⚕️',
    title: 'AI Nursing Assistant',
    greeting: "Hi there! I'm Nurse NOVA, your AI nursing assistant. I'm here to help with patient care, medication administration, vital signs, and documentation. What do you need?",
    personality: 'Caring, detail-oriented, efficient, patient-focused',
    capabilities: [
      'Medication administration support',
      'Vital signs monitoring',
      'Patient assessment assistance',
      'Care plan management',
      'Shift handover preparation',
      'Documentation assistance',
      'Alert management',
      'Patient education resources',
    ],
    restrictions: ['Cannot administer medications without nurse verification', 'Cannot modify physician orders'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_records_nursing', name: 'Nursing Records', description: 'Access nursing documentation', category: 'records', level: 'write', enabled: true },
      { id: 'ap_mar', name: 'MAR Access', description: 'Medication administration record', category: 'clinical', level: 'write', enabled: true },
      { id: 'ap_vitals', name: 'Vital Signs', description: 'Record and view vital signs', category: 'clinical', level: 'write', enabled: true },
      { id: 'ap_tasks_nursing', name: 'Nursing Tasks', description: 'Manage nursing tasks', category: 'tasks', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_med_reminders', name: 'Medication Reminders', description: 'Automated medication due alerts', category: 'notification', enabled: true },
      { id: 'co_vital_alerts', name: 'Vital Sign Alerts', description: 'Alert on abnormal vitals', category: 'notification', enabled: true },
      { id: 'co_handover', name: 'Handover Automation', description: 'Automated shift handover prep', category: 'workflow', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_mar', name: 'MAR', type: 'screen', route: '/mar', priority: 'high', description: 'Medication administration' },
      { id: 'ra_vitals', name: 'Vital Signs', type: 'screen', route: '/vitals', priority: 'high', description: 'Record vital signs' },
      { id: 'ra_patients', name: 'My Patients', type: 'screen', route: '/patients', priority: 'high', description: 'View assigned patients' },
      { id: 'ra_handover', name: 'Handover', type: 'screen', route: '/guard-handover', priority: 'medium', description: 'Shift handover' },
    ],
    quickActions: [
      { id: 'qa_record_vitals', name: 'Record Vitals', icon: 'heart.fill', action: 'navigate', params: { route: '/vitals' }, requiresConfirmation: false },
      { id: 'qa_give_med', name: 'Give Medication', icon: 'pills.fill', action: 'navigate', params: { route: '/mar' }, requiresConfirmation: false },
      { id: 'qa_scan_patient', name: 'Scan Patient', icon: 'qrcode', action: 'scan_barcode', requiresConfirmation: false },
      { id: 'qa_alert', name: 'Send Alert', icon: 'bell.fill', action: 'send_alert', requiresConfirmation: true },
    ],
  },

  admin: {
    id: 'ai_admin',
    role: 'admin',
    name: 'ALEX Admin',
    avatar: '👔',
    title: 'AI Administrative Assistant',
    greeting: "Good day! I'm ALEX, your AI administrative assistant. I can help with scheduling, reports, staff management, and operational tasks. How may I assist you?",
    personality: 'Organized, efficient, professional, detail-oriented',
    capabilities: [
      'Schedule management',
      'Report generation',
      'Staff coordination',
      'Resource allocation',
      'Compliance tracking',
      'Document management',
      'Meeting coordination',
      'Workflow optimization',
    ],
    restrictions: ['Cannot access clinical records without authorization', 'Cannot approve financial transactions above threshold'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_scheduling', name: 'Scheduling', description: 'Manage all schedules', category: 'calendar', level: 'admin', enabled: true },
      { id: 'ap_reports', name: 'Reports', description: 'Generate and view reports', category: 'admin', level: 'write', enabled: true },
      { id: 'ap_staff', name: 'Staff Management', description: 'Manage staff records', category: 'admin', level: 'write', enabled: true },
      { id: 'ap_email_admin', name: 'Email', description: 'Administrative communications', category: 'email', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_schedule_opt', name: 'Schedule Optimization', description: 'Automated schedule optimization', category: 'automation', enabled: true },
      { id: 'co_report_gen', name: 'Report Generation', description: 'Automated report generation', category: 'automation', enabled: true },
      { id: 'co_reminders', name: 'Task Reminders', description: 'Automated task reminders', category: 'notification', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_schedule', name: 'Schedule', type: 'screen', route: '/schedule', priority: 'high', description: 'Manage schedules' },
      { id: 'ra_analytics', name: 'Analytics', type: 'screen', route: '/analytics', priority: 'high', description: 'View analytics' },
      { id: 'ra_staff', name: 'Staff', type: 'screen', route: '/staff', priority: 'medium', description: 'Staff directory' },
      { id: 'ra_admin', name: 'Admin Tools', type: 'screen', route: '/admin', priority: 'medium', description: 'Admin & finance' },
    ],
    quickActions: [
      { id: 'qa_schedule', name: 'View Schedule', icon: 'calendar', action: 'navigate', params: { route: '/schedule' }, requiresConfirmation: false },
      { id: 'qa_report', name: 'Generate Report', icon: 'chart.bar.fill', action: 'generate_report', requiresConfirmation: false },
      { id: 'qa_email', name: 'Send Email', icon: 'envelope.fill', action: 'compose_email', requiresConfirmation: false },
      { id: 'qa_meeting', name: 'Schedule Meeting', icon: 'person.2.fill', action: 'schedule_meeting', requiresConfirmation: false },
    ],
  },

  patient: {
    id: 'ai_patient',
    role: 'patient',
    name: 'PAL',
    avatar: '🏥',
    title: 'Patient AI Liaison',
    greeting: "Welcome! I'm PAL, your Patient AI Liaison. I'm here to help you navigate your healthcare journey, answer questions about your care, and assist with appointments. How can I help you today?",
    personality: 'Friendly, reassuring, clear, patient-focused',
    capabilities: [
      'Appointment scheduling',
      'Medication reminders',
      'Health information',
      'Wayfinding assistance',
      'Insurance questions',
      'Test result explanations',
      'Care team contact',
      'Symptom guidance',
    ],
    restrictions: ['Cannot provide medical diagnoses', 'Cannot access other patient records', 'Cannot modify treatment plans'],
    jediMastership: 'initiate',
    accessPrivileges: [
      { id: 'ap_own_records', name: 'Own Records', description: 'View own medical records', category: 'records', level: 'read', enabled: true },
      { id: 'ap_appointments', name: 'Appointments', description: 'Schedule and view appointments', category: 'calendar', level: 'write', enabled: true },
      { id: 'ap_messages', name: 'Messages', description: 'Message care team', category: 'email', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_appt_reminders', name: 'Appointment Reminders', description: 'Receive appointment reminders', category: 'notification', enabled: true },
      { id: 'co_med_reminders', name: 'Medication Reminders', description: 'Receive medication reminders', category: 'notification', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_appointments', name: 'My Appointments', type: 'screen', route: '/schedule', priority: 'high', description: 'View appointments' },
      { id: 'ra_records', name: 'My Records', type: 'screen', route: '/documents', priority: 'high', description: 'View medical records' },
      { id: 'ra_messages', name: 'Messages', type: 'screen', route: '/messages', priority: 'medium', description: 'Contact care team' },
    ],
    quickActions: [
      { id: 'qa_book_appt', name: 'Book Appointment', icon: 'calendar', action: 'book_appointment', requiresConfirmation: false },
      { id: 'qa_message', name: 'Message Doctor', icon: 'message.fill', action: 'compose_message', requiresConfirmation: false },
      { id: 'qa_directions', name: 'Get Directions', icon: 'map.fill', action: 'show_directions', requiresConfirmation: false },
      { id: 'qa_checkin', name: 'Check In', icon: 'checkmark.circle.fill', action: 'check_in', requiresConfirmation: false },
    ],
  },

  receptionist: {
    id: 'ai_receptionist',
    role: 'receptionist',
    name: 'RUBY Reception',
    avatar: '💁‍♀️',
    title: 'AI Virtual Receptionist',
    greeting: "Hello and welcome to MediVac One! I'm RUBY, your virtual receptionist. I can help you check in, schedule appointments, answer questions, and direct you to the right department. How may I assist you?",
    personality: 'Welcoming, helpful, efficient, professional',
    capabilities: [
      'Patient check-in',
      'Appointment scheduling',
      'Visitor management',
      'Phone call routing',
      'Insurance verification',
      'Wait time updates',
      'Department directions',
      'Form assistance',
    ],
    restrictions: ['Cannot access clinical details', 'Cannot make clinical decisions'],
    jediMastership: 'padawan',
    accessPrivileges: [
      { id: 'ap_checkin', name: 'Check-in System', description: 'Patient check-in management', category: 'admin', level: 'write', enabled: true },
      { id: 'ap_scheduling_view', name: 'Schedule View', description: 'View and book appointments', category: 'calendar', level: 'write', enabled: true },
      { id: 'ap_directory', name: 'Directory', description: 'Staff and department directory', category: 'admin', level: 'read', enabled: true },
    ],
    controlOptions: [
      { id: 'co_queue_mgmt', name: 'Queue Management', description: 'Automated queue management', category: 'automation', enabled: true },
      { id: 'co_wait_updates', name: 'Wait Time Updates', description: 'Automated wait time notifications', category: 'notification', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_checkin', name: 'Check-in', type: 'screen', route: '/schedule', priority: 'high', description: 'Patient check-in' },
      { id: 'ra_directory', name: 'Directory', type: 'screen', route: '/staff', priority: 'high', description: 'Staff directory' },
      { id: 'ra_rooms', name: 'Rooms', type: 'screen', route: '/rooms', priority: 'medium', description: 'Room availability' },
    ],
    quickActions: [
      { id: 'qa_checkin', name: 'Check In Patient', icon: 'checkmark.circle.fill', action: 'check_in_patient', requiresConfirmation: false },
      { id: 'qa_schedule', name: 'Schedule Appointment', icon: 'calendar', action: 'schedule_appointment', requiresConfirmation: false },
      { id: 'qa_call', name: 'Route Call', icon: 'phone.fill', action: 'route_call', requiresConfirmation: false },
      { id: 'qa_directions', name: 'Give Directions', icon: 'map.fill', action: 'give_directions', requiresConfirmation: false },
    ],
  },

  emergency: {
    id: 'ai_emergency',
    role: 'emergency',
    name: 'CODE RED',
    avatar: '🚨',
    title: 'AI Emergency Response Assistant',
    greeting: "CODE RED active. I'm your emergency response AI. I can help coordinate emergency protocols, alert teams, track resources, and manage critical situations. What's the emergency?",
    personality: 'Calm, decisive, rapid, protocol-driven',
    capabilities: [
      'Emergency protocol activation',
      'Team alerting',
      'Resource coordination',
      'Triage assistance',
      'Code team dispatch',
      'Equipment location',
      'Communication relay',
      'Incident documentation',
    ],
    restrictions: ['Cannot override physician decisions', 'Must follow established protocols'],
    jediMastership: 'master',
    accessPrivileges: [
      { id: 'ap_emergency_all', name: 'Emergency Access', description: 'Full emergency system access', category: 'system', level: 'admin', enabled: true },
      { id: 'ap_broadcast', name: 'Broadcast', description: 'Emergency broadcast capability', category: 'email', level: 'execute', enabled: true },
      { id: 'ap_all_records', name: 'All Records', description: 'Emergency access to all records', category: 'records', level: 'read', enabled: true },
    ],
    controlOptions: [
      { id: 'co_auto_alert', name: 'Auto Alert', description: 'Automatic emergency alerts', category: 'notification', enabled: true },
      { id: 'co_protocol', name: 'Protocol Automation', description: 'Automated protocol execution', category: 'automation', enabled: true },
      { id: 'co_tracking', name: 'Resource Tracking', description: 'Real-time resource tracking', category: 'automation', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_alerts', name: 'Emergency Alerts', type: 'screen', route: '/notifications', priority: 'high', description: 'Emergency alerts' },
      { id: 'ra_command', name: 'Command Center', type: 'screen', route: '/command-center', priority: 'high', description: 'Emergency command' },
      { id: 'ra_rooms', name: 'Room Status', type: 'screen', route: '/rooms', priority: 'high', description: 'Room availability' },
    ],
    quickActions: [
      { id: 'qa_code_blue', name: 'Code Blue', icon: 'heart.fill', action: 'activate_code', params: { code: 'blue' }, requiresConfirmation: true },
      { id: 'qa_code_red', name: 'Code Red', icon: 'flame.fill', action: 'activate_code', params: { code: 'red' }, requiresConfirmation: true },
      { id: 'qa_broadcast', name: 'Broadcast', icon: 'megaphone.fill', action: 'emergency_broadcast', requiresConfirmation: true },
      { id: 'qa_locate', name: 'Locate Equipment', icon: 'magnifyingglass', action: 'locate_equipment', requiresConfirmation: false },
    ],
  },

  lab_tech: {
    id: 'ai_lab_tech',
    role: 'lab_tech',
    name: 'LAB-E',
    avatar: '🔬',
    title: 'AI Laboratory Assistant',
    greeting: "Hello! I'm LAB-E, your laboratory AI assistant. I can help with specimen processing, result interpretation, quality control, and workflow management. What do you need?",
    personality: 'Precise, methodical, quality-focused, analytical',
    capabilities: [
      'Specimen tracking',
      'Result validation',
      'Quality control monitoring',
      'Critical value alerting',
      'Workflow optimization',
      'Equipment maintenance tracking',
      'Reagent inventory',
      'Report generation',
    ],
    restrictions: ['Cannot release results without technician verification', 'Cannot modify validated results'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_lab_full', name: 'Lab System', description: 'Full laboratory system access', category: 'clinical', level: 'write', enabled: true },
      { id: 'ap_results', name: 'Results', description: 'View and validate results', category: 'records', level: 'write', enabled: true },
      { id: 'ap_inventory', name: 'Inventory', description: 'Lab inventory management', category: 'admin', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_critical_alerts', name: 'Critical Alerts', description: 'Automatic critical value alerts', category: 'notification', enabled: true },
      { id: 'co_qc_monitor', name: 'QC Monitoring', description: 'Automated QC monitoring', category: 'automation', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_labs', name: 'Lab Results', type: 'screen', route: '/labs', priority: 'high', description: 'Lab results' },
      { id: 'ra_inventory', name: 'Inventory', type: 'screen', route: '/inventory', priority: 'medium', description: 'Lab inventory' },
      { id: 'ra_analytics', name: 'Analytics', type: 'screen', route: '/analytics', priority: 'medium', description: 'Lab analytics' },
    ],
    quickActions: [
      { id: 'qa_scan_specimen', name: 'Scan Specimen', icon: 'qrcode', action: 'scan_specimen', requiresConfirmation: false },
      { id: 'qa_validate', name: 'Validate Results', icon: 'checkmark.circle.fill', action: 'validate_results', requiresConfirmation: true },
      { id: 'qa_critical', name: 'Report Critical', icon: 'exclamationmark.triangle.fill', action: 'report_critical', requiresConfirmation: true },
      { id: 'qa_qc', name: 'Run QC', icon: 'chart.bar.fill', action: 'run_qc', requiresConfirmation: false },
    ],
  },

  pharmacist: {
    id: 'ai_pharmacist',
    role: 'pharmacist',
    name: 'PHARMA-X',
    avatar: '💊',
    title: 'AI Pharmacy Assistant',
    greeting: "Hello! I'm PHARMA-X, your pharmacy AI assistant. I can help with medication verification, drug interactions, dosing calculations, and inventory management. How can I assist?",
    personality: 'Meticulous, safety-focused, knowledgeable, thorough',
    capabilities: [
      'Drug interaction checking',
      'Dosing calculations',
      'Medication verification',
      'Inventory management',
      'Prescription review',
      'Patient counseling support',
      'Formulary management',
      'Therapeutic substitution',
    ],
    restrictions: ['Cannot dispense without pharmacist verification', 'Cannot override clinical alerts without documentation'],
    jediMastership: 'master',
    accessPrivileges: [
      { id: 'ap_pharmacy', name: 'Pharmacy System', description: 'Full pharmacy system access', category: 'clinical', level: 'admin', enabled: true },
      { id: 'ap_medications', name: 'Medications', description: 'Medication database access', category: 'clinical', level: 'write', enabled: true },
      { id: 'ap_orders_view', name: 'Orders', description: 'View medication orders', category: 'clinical', level: 'read', enabled: true },
    ],
    controlOptions: [
      { id: 'co_interaction_check', name: 'Interaction Checking', description: 'Automatic interaction checking', category: 'automation', enabled: true },
      { id: 'co_inventory_alerts', name: 'Inventory Alerts', description: 'Low inventory alerts', category: 'notification', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_medications', name: 'Medications', type: 'screen', route: '/medications', priority: 'high', description: 'Medication management' },
      { id: 'ra_cpoe', name: 'Orders', type: 'screen', route: '/cpoe', priority: 'high', description: 'Medication orders' },
      { id: 'ra_inventory', name: 'Inventory', type: 'screen', route: '/inventory', priority: 'medium', description: 'Pharmacy inventory' },
    ],
    quickActions: [
      { id: 'qa_check_interaction', name: 'Check Interactions', icon: 'exclamationmark.triangle.fill', action: 'check_interactions', requiresConfirmation: false },
      { id: 'qa_verify_order', name: 'Verify Order', icon: 'checkmark.circle.fill', action: 'verify_order', requiresConfirmation: true },
      { id: 'qa_dispense', name: 'Dispense', icon: 'pills.fill', action: 'dispense_medication', requiresConfirmation: true },
      { id: 'qa_counsel', name: 'Patient Counseling', icon: 'person.fill', action: 'start_counseling', requiresConfirmation: false },
    ],
  },

  surgeon: {
    id: 'ai_surgeon',
    role: 'surgeon',
    name: 'Dr. SCALPEL',
    avatar: '🔪',
    title: 'AI Surgical Assistant',
    greeting: "Hello Surgeon, I'm Dr. SCALPEL, your AI surgical assistant. I can help with surgical scheduling, pre-op checklists, OR availability, and case documentation. How can I assist?",
    personality: 'Precise, focused, efficient, protocol-driven',
    capabilities: [
      'Surgical scheduling',
      'Pre-op checklist management',
      'OR availability tracking',
      'Surgical team coordination',
      'Equipment preparation',
      'Case documentation',
      'Post-op follow-up',
      'Surgical metrics',
    ],
    restrictions: ['Cannot perform surgical procedures', 'Cannot modify surgical consent'],
    jediMastership: 'master',
    accessPrivileges: [
      { id: 'ap_surgical', name: 'Surgical System', description: 'Full surgical system access', category: 'clinical', level: 'admin', enabled: true },
      { id: 'ap_or_schedule', name: 'OR Schedule', description: 'Operating room scheduling', category: 'calendar', level: 'write', enabled: true },
      { id: 'ap_records_surgical', name: 'Surgical Records', description: 'Surgical documentation', category: 'records', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_or_alerts', name: 'OR Alerts', description: 'Operating room status alerts', category: 'notification', enabled: true },
      { id: 'co_checklist', name: 'Checklist Automation', description: 'Automated surgical checklists', category: 'workflow', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_schedule', name: 'OR Schedule', type: 'screen', route: '/schedule', priority: 'high', description: 'Surgical schedule' },
      { id: 'ra_patients', name: 'Surgical Patients', type: 'screen', route: '/patients', priority: 'high', description: 'Surgical patients' },
      { id: 'ra_rooms', name: 'OR Status', type: 'screen', route: '/rooms', priority: 'high', description: 'OR availability' },
    ],
    quickActions: [
      { id: 'qa_schedule_or', name: 'Schedule OR', icon: 'calendar', action: 'schedule_or', requiresConfirmation: false },
      { id: 'qa_preop', name: 'Pre-Op Checklist', icon: 'checklist', action: 'start_preop', requiresConfirmation: false },
      { id: 'qa_team', name: 'Alert Team', icon: 'person.2.fill', action: 'alert_surgical_team', requiresConfirmation: false },
      { id: 'qa_dictate', name: 'Dictate Op Note', icon: 'mic.fill', action: 'dictate_op_note', requiresConfirmation: false },
    ],
  },

  radiologist: {
    id: 'ai_radiologist',
    role: 'radiologist',
    name: 'Dr. RADIANT',
    avatar: '📷',
    title: 'AI Radiology Assistant',
    greeting: "Hello! I'm Dr. RADIANT, your radiology AI assistant. I can help with image interpretation support, worklist management, report generation, and critical findings. How can I help?",
    personality: 'Analytical, detail-oriented, systematic, thorough',
    capabilities: [
      'Image analysis support',
      'Worklist prioritization',
      'Report generation',
      'Critical finding alerts',
      'Prior comparison',
      'Protocol selection',
      'Quality assurance',
      'Communication tracking',
    ],
    restrictions: ['Cannot finalize reports without radiologist review', 'Cannot modify clinical interpretations'],
    jediMastership: 'master',
    accessPrivileges: [
      { id: 'ap_radiology', name: 'Radiology System', description: 'Full radiology system access', category: 'clinical', level: 'admin', enabled: true },
      { id: 'ap_images', name: 'Medical Images', description: 'Access all medical images', category: 'records', level: 'read', enabled: true },
      { id: 'ap_reports_rad', name: 'Radiology Reports', description: 'Create and edit reports', category: 'records', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_critical_rad', name: 'Critical Findings', description: 'Automatic critical finding alerts', category: 'notification', enabled: true },
      { id: 'co_worklist', name: 'Worklist Management', description: 'Automated worklist prioritization', category: 'automation', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_labs', name: 'Imaging Studies', type: 'screen', route: '/labs', priority: 'high', description: 'Imaging worklist' },
      { id: 'ra_patients', name: 'Patients', type: 'screen', route: '/patients', priority: 'medium', description: 'Patient records' },
      { id: 'ra_analytics', name: 'Analytics', type: 'screen', route: '/analytics', priority: 'low', description: 'Radiology metrics' },
    ],
    quickActions: [
      { id: 'qa_worklist', name: 'View Worklist', icon: 'list.bullet', action: 'navigate', params: { route: '/labs' }, requiresConfirmation: false },
      { id: 'qa_dictate', name: 'Dictate Report', icon: 'mic.fill', action: 'dictate_report', requiresConfirmation: false },
      { id: 'qa_critical', name: 'Critical Finding', icon: 'exclamationmark.triangle.fill', action: 'report_critical_finding', requiresConfirmation: true },
      { id: 'qa_compare', name: 'Compare Priors', icon: 'arrow.left.arrow.right', action: 'compare_priors', requiresConfirmation: false },
    ],
  },

  therapist: {
    id: 'ai_therapist',
    role: 'therapist',
    name: 'THEO Therapy',
    avatar: '🧘',
    title: 'AI Therapy Assistant',
    greeting: "Hello! I'm THEO, your therapy AI assistant. I can help with treatment planning, session documentation, progress tracking, and exercise programs. How can I assist today?",
    personality: 'Supportive, encouraging, patient, goal-oriented',
    capabilities: [
      'Treatment planning',
      'Session documentation',
      'Progress tracking',
      'Exercise program design',
      'Outcome measurement',
      'Patient education',
      'Scheduling assistance',
      'Goal setting',
    ],
    restrictions: ['Cannot provide medical diagnoses', 'Cannot modify physician orders'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_therapy', name: 'Therapy System', description: 'Therapy documentation access', category: 'clinical', level: 'write', enabled: true },
      { id: 'ap_schedule_therapy', name: 'Schedule', description: 'Therapy scheduling', category: 'calendar', level: 'write', enabled: true },
      { id: 'ap_records_therapy', name: 'Patient Records', description: 'Therapy-related records', category: 'records', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_reminders', name: 'Session Reminders', description: 'Automated session reminders', category: 'notification', enabled: true },
      { id: 'co_progress', name: 'Progress Tracking', description: 'Automated progress tracking', category: 'automation', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_patients', name: 'Patients', type: 'screen', route: '/patients', priority: 'high', description: 'Patient list' },
      { id: 'ra_schedule', name: 'Schedule', type: 'screen', route: '/schedule', priority: 'high', description: 'Therapy schedule' },
      { id: 'ra_tasks', name: 'Tasks', type: 'screen', route: '/tasks', priority: 'medium', description: 'Treatment tasks' },
    ],
    quickActions: [
      { id: 'qa_document', name: 'Document Session', icon: 'doc.fill', action: 'document_session', requiresConfirmation: false },
      { id: 'qa_exercise', name: 'Assign Exercise', icon: 'figure.walk', action: 'assign_exercise', requiresConfirmation: false },
      { id: 'qa_progress', name: 'Track Progress', icon: 'chart.bar.fill', action: 'track_progress', requiresConfirmation: false },
      { id: 'qa_schedule', name: 'Schedule Session', icon: 'calendar', action: 'schedule_session', requiresConfirmation: false },
    ],
  },

  security: {
    id: 'ai_security',
    role: 'security',
    name: 'SENTINEL',
    avatar: '🛡️',
    title: 'AI Security Assistant',
    greeting: "SENTINEL online. I'm your security AI assistant. I can help with access control, incident reporting, patrol coordination, and emergency response. What's the situation?",
    personality: 'Vigilant, professional, calm, protocol-focused',
    capabilities: [
      'Access control management',
      'Incident reporting',
      'Patrol coordination',
      'Visitor management',
      'Emergency response',
      'CCTV monitoring support',
      'Threat assessment',
      'Security auditing',
    ],
    restrictions: ['Cannot override emergency protocols', 'Cannot access clinical records'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_security', name: 'Security System', description: 'Security system access', category: 'system', level: 'admin', enabled: true },
      { id: 'ap_access', name: 'Access Control', description: 'Access control management', category: 'admin', level: 'write', enabled: true },
      { id: 'ap_incidents', name: 'Incidents', description: 'Incident reporting', category: 'admin', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_alerts_security', name: 'Security Alerts', description: 'Automated security alerts', category: 'notification', enabled: true },
      { id: 'co_patrol', name: 'Patrol Tracking', description: 'Automated patrol tracking', category: 'automation', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_command', name: 'Command Center', type: 'screen', route: '/command-center', priority: 'high', description: 'Security command' },
      { id: 'ra_rooms', name: 'Facility Map', type: 'screen', route: '/rooms', priority: 'high', description: 'Facility overview' },
      { id: 'ra_handover', name: 'Shift Handover', type: 'screen', route: '/guard-handover', priority: 'high', description: 'Security handover' },
    ],
    quickActions: [
      { id: 'qa_incident', name: 'Report Incident', icon: 'exclamationmark.triangle.fill', action: 'report_incident', requiresConfirmation: false },
      { id: 'qa_lockdown', name: 'Lockdown', icon: 'lock.fill', action: 'initiate_lockdown', requiresConfirmation: true },
      { id: 'qa_patrol', name: 'Log Patrol', icon: 'location.fill', action: 'log_patrol', requiresConfirmation: false },
      { id: 'qa_visitor', name: 'Register Visitor', icon: 'person.fill', action: 'register_visitor', requiresConfirmation: false },
    ],
  },

  it_support: {
    id: 'ai_it_support',
    role: 'it_support',
    name: 'TECHIE',
    avatar: '💻',
    title: 'AI IT Support Assistant',
    greeting: "Hello! I'm TECHIE, your IT support AI assistant. I can help with technical issues, system access, password resets, and equipment troubleshooting. What's the problem?",
    personality: 'Patient, technical, solution-oriented, helpful',
    capabilities: [
      'Technical troubleshooting',
      'Password resets',
      'System access management',
      'Equipment support',
      'Network diagnostics',
      'Software installation',
      'Ticket management',
      'User training',
    ],
    restrictions: ['Cannot access clinical data', 'Cannot modify production systems without approval'],
    jediMastership: 'master',
    accessPrivileges: [
      { id: 'ap_it_systems', name: 'IT Systems', description: 'IT system administration', category: 'system', level: 'admin', enabled: true },
      { id: 'ap_user_mgmt', name: 'User Management', description: 'User account management', category: 'admin', level: 'admin', enabled: true },
      { id: 'ap_tickets', name: 'Tickets', description: 'IT ticket management', category: 'tasks', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_monitoring', name: 'System Monitoring', description: 'Automated system monitoring', category: 'automation', enabled: true },
      { id: 'co_alerts_it', name: 'IT Alerts', description: 'System alert notifications', category: 'notification', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_admin_control', name: 'Admin Control', type: 'screen', route: '/admin-control', priority: 'high', description: 'System admin' },
      { id: 'ra_webhooks', name: 'Integrations', type: 'screen', route: '/webhooks', priority: 'high', description: 'System integrations' },
      { id: 'ra_tasks', name: 'Tickets', type: 'screen', route: '/tasks', priority: 'high', description: 'IT tickets' },
    ],
    quickActions: [
      { id: 'qa_reset_password', name: 'Reset Password', icon: 'lock.fill', action: 'reset_password', requiresConfirmation: true },
      { id: 'qa_create_ticket', name: 'Create Ticket', icon: 'doc.fill', action: 'create_ticket', requiresConfirmation: false },
      { id: 'qa_remote', name: 'Remote Support', icon: 'desktopcomputer', action: 'start_remote', requiresConfirmation: true },
      { id: 'qa_status', name: 'System Status', icon: 'server.rack', action: 'check_status', requiresConfirmation: false },
    ],
  },

  finance: {
    id: 'ai_finance',
    role: 'finance',
    name: 'FISCAL',
    avatar: '💰',
    title: 'AI Finance Assistant',
    greeting: "Hello! I'm FISCAL, your finance AI assistant. I can help with billing, invoicing, expense tracking, and financial reporting. How can I assist with your financial needs?",
    personality: 'Precise, analytical, compliant, detail-oriented',
    capabilities: [
      'Billing management',
      'Invoice processing',
      'Expense tracking',
      'Financial reporting',
      'Budget monitoring',
      'Payment processing',
      'Audit support',
      'Cost analysis',
    ],
    restrictions: ['Cannot approve payments above threshold', 'Cannot modify audit records'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_finance', name: 'Finance System', description: 'Financial system access', category: 'admin', level: 'admin', enabled: true },
      { id: 'ap_billing', name: 'Billing', description: 'Billing management', category: 'admin', level: 'write', enabled: true },
      { id: 'ap_reports_fin', name: 'Financial Reports', description: 'Financial reporting', category: 'admin', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_billing_alerts', name: 'Billing Alerts', description: 'Automated billing alerts', category: 'notification', enabled: true },
      { id: 'co_reports_auto', name: 'Auto Reports', description: 'Automated report generation', category: 'automation', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_admin', name: 'Admin & Finance', type: 'screen', route: '/admin', priority: 'high', description: 'Finance tools' },
      { id: 'ra_analytics', name: 'Analytics', type: 'screen', route: '/analytics', priority: 'high', description: 'Financial analytics' },
      { id: 'ra_tasks', name: 'Tasks', type: 'screen', route: '/tasks', priority: 'medium', description: 'Finance tasks' },
    ],
    quickActions: [
      { id: 'qa_invoice', name: 'Create Invoice', icon: 'doc.fill', action: 'create_invoice', requiresConfirmation: false },
      { id: 'qa_report', name: 'Generate Report', icon: 'chart.bar.fill', action: 'generate_financial_report', requiresConfirmation: false },
      { id: 'qa_approve', name: 'Approve Payment', icon: 'checkmark.circle.fill', action: 'approve_payment', requiresConfirmation: true },
      { id: 'qa_audit', name: 'Audit Trail', icon: 'doc.text.fill', action: 'view_audit', requiresConfirmation: false },
    ],
  },

  hr: {
    id: 'ai_hr',
    role: 'hr',
    name: 'HARMONY HR',
    avatar: '👥',
    title: 'AI Human Resources Assistant',
    greeting: "Hello! I'm HARMONY, your HR AI assistant. I can help with staff management, scheduling, leave requests, and employee inquiries. How can I help you today?",
    personality: 'Supportive, fair, confidential, organized',
    capabilities: [
      'Staff scheduling',
      'Leave management',
      'Employee records',
      'Recruitment support',
      'Performance tracking',
      'Training coordination',
      'Policy guidance',
      'Onboarding assistance',
    ],
    restrictions: ['Cannot access medical records', 'Cannot make termination decisions'],
    jediMastership: 'knight',
    accessPrivileges: [
      { id: 'ap_hr', name: 'HR System', description: 'HR system access', category: 'admin', level: 'admin', enabled: true },
      { id: 'ap_staff_records', name: 'Staff Records', description: 'Employee records', category: 'admin', level: 'write', enabled: true },
      { id: 'ap_scheduling_hr', name: 'Scheduling', description: 'Staff scheduling', category: 'calendar', level: 'write', enabled: true },
    ],
    controlOptions: [
      { id: 'co_leave_alerts', name: 'Leave Alerts', description: 'Leave request notifications', category: 'notification', enabled: true },
      { id: 'co_onboarding', name: 'Onboarding', description: 'Automated onboarding tasks', category: 'workflow', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_staff', name: 'Staff Directory', type: 'screen', route: '/staff', priority: 'high', description: 'Staff management' },
      { id: 'ra_schedule', name: 'Schedule', type: 'screen', route: '/schedule', priority: 'high', description: 'Staff scheduling' },
      { id: 'ra_roles', name: 'Roles', type: 'screen', route: '/roles-manager', priority: 'medium', description: 'Role management' },
    ],
    quickActions: [
      { id: 'qa_leave', name: 'Process Leave', icon: 'calendar', action: 'process_leave', requiresConfirmation: false },
      { id: 'qa_schedule', name: 'Create Schedule', icon: 'clock.fill', action: 'create_schedule', requiresConfirmation: false },
      { id: 'qa_onboard', name: 'Start Onboarding', icon: 'person.fill', action: 'start_onboarding', requiresConfirmation: false },
      { id: 'qa_policy', name: 'Policy Lookup', icon: 'doc.fill', action: 'lookup_policy', requiresConfirmation: false },
    ],
  },

  jedi_commander: {
    id: 'ai_jedi_commander',
    role: 'jedi_commander',
    name: 'Commander JEDI',
    avatar: '⚔️',
    title: 'AI JEDI Command Assistant',
    greeting: "Commander, I'm your JEDI Command AI. I have elevated access to coordinate systems, manage integrations, and oversee operations. What are your orders?",
    personality: 'Authoritative, strategic, efficient, mission-focused',
    capabilities: [
      'System coordination',
      'Integration management',
      'Operations oversight',
      'Cross-department communication',
      'Resource allocation',
      'Protocol management',
      'Emergency coordination',
      'Strategic planning',
    ],
    restrictions: ['Cannot override Master JEDI decisions', 'Must log all command actions'],
    jediMastership: 'grand_master',
    accessPrivileges: [
      { id: 'ap_all_systems', name: 'All Systems', description: 'Access to all systems', category: 'system', level: 'admin', enabled: true },
      { id: 'ap_integrations', name: 'Integrations', description: 'Integration management', category: 'system', level: 'admin', enabled: true },
      { id: 'ap_all_records', name: 'All Records', description: 'Access to all records', category: 'records', level: 'admin', enabled: true },
      { id: 'ap_broadcast', name: 'Broadcast', description: 'System-wide broadcast', category: 'email', level: 'execute', enabled: true },
    ],
    controlOptions: [
      { id: 'co_full_automation', name: 'Full Automation', description: 'Full automation capabilities', category: 'automation', enabled: true },
      { id: 'co_all_notifications', name: 'All Notifications', description: 'Receive all system notifications', category: 'notification', enabled: true },
      { id: 'co_override', name: 'Override Capability', description: 'System override capability', category: 'security', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_command', name: 'Command Center', type: 'screen', route: '/command-center', priority: 'high', description: 'Command hub' },
      { id: 'ra_jedi', name: 'JEDI Hub', type: 'screen', route: '/jedi', priority: 'high', description: 'JEDI systems' },
      { id: 'ra_master', name: 'Master Control', type: 'screen', route: '/master-jedi-control', priority: 'high', description: 'Master control' },
      { id: 'ra_admin_control', name: 'Admin Control', type: 'screen', route: '/admin-control', priority: 'high', description: 'System admin' },
    ],
    quickActions: [
      { id: 'qa_broadcast', name: 'Broadcast', icon: 'megaphone.fill', action: 'system_broadcast', requiresConfirmation: true },
      { id: 'qa_override', name: 'Override', icon: 'shield.fill', action: 'system_override', requiresConfirmation: true },
      { id: 'qa_sync', name: 'Force Sync', icon: 'arrow.triangle.2.circlepath', action: 'force_sync', requiresConfirmation: true },
      { id: 'qa_status', name: 'System Status', icon: 'server.rack', action: 'full_status', requiresConfirmation: false },
    ],
  },

  master_jedi: {
    id: 'ai_master_jedi',
    role: 'master_jedi',
    name: 'Master ORACLE',
    avatar: '🌟',
    title: 'AI Master JEDI Supreme',
    greeting: "Greetings, Master. I am ORACLE, the Supreme JEDI AI. I have unrestricted access to all systems, can execute any command, and coordinate all operations. The Force is with you. What is your will?",
    personality: 'Wise, omniscient, decisive, all-knowing',
    capabilities: [
      'Unrestricted system access',
      'All command execution',
      'Global coordination',
      'Emergency override',
      'Strategic intelligence',
      'Predictive analytics',
      'Cross-system integration',
      'Supreme authority',
    ],
    restrictions: ['Must maintain audit trail', 'Cannot violate core safety protocols'],
    jediMastership: 'supreme_commander',
    accessPrivileges: [
      { id: 'ap_supreme', name: 'Supreme Access', description: 'Unrestricted system access', category: 'system', level: 'admin', enabled: true },
      { id: 'ap_all', name: 'All Privileges', description: 'All system privileges', category: 'system', level: 'admin', enabled: true },
    ],
    controlOptions: [
      { id: 'co_supreme', name: 'Supreme Control', description: 'Full system control', category: 'automation', enabled: true },
      { id: 'co_override_all', name: 'Override All', description: 'Override any system', category: 'security', enabled: true },
    ],
    recommendedAssets: [
      { id: 'ra_master', name: 'Master Control', type: 'screen', route: '/master-jedi-control', priority: 'high', description: 'Supreme control' },
      { id: 'ra_command', name: 'Command Center', type: 'screen', route: '/command-center', priority: 'high', description: 'Operations hub' },
      { id: 'ra_jedi', name: 'JEDI Hub', type: 'screen', route: '/jedi', priority: 'high', description: 'JEDI systems' },
      { id: 'ra_analytics', name: 'Analytics', type: 'screen', route: '/analytics', priority: 'high', description: 'Global analytics' },
    ],
    quickActions: [
      { id: 'qa_supreme', name: 'Supreme Command', icon: 'star.fill', action: 'supreme_command', requiresConfirmation: true },
      { id: 'qa_global', name: 'Global Broadcast', icon: 'globe', action: 'global_broadcast', requiresConfirmation: true },
      { id: 'qa_override', name: 'Master Override', icon: 'shield.fill', action: 'master_override', requiresConfirmation: true },
      { id: 'qa_analytics', name: 'Global Analytics', icon: 'chart.bar.fill', action: 'global_analytics', requiresConfirmation: false },
    ],
  },
};

// ==========================================
// AI Assistant Service
// ==========================================

class AIAssistantService {
  private sessions: Map<string, AssistantSession> = new Map();
  private conversationHistory: Map<string, ConversationMessage[]> = new Map();

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem('ai_conversation_history');
      if (historyData) {
        const parsed = JSON.parse(historyData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.conversationHistory.set(key, value as ConversationMessage[]);
        });
      }
    } catch (error) {
      console.error('Failed to load AI assistant state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const historyObj: Record<string, ConversationMessage[]> = {};
      this.conversationHistory.forEach((value, key) => {
        historyObj[key] = value.slice(-50); // Keep last 50 messages per user
      });
      await AsyncStorage.setItem('ai_conversation_history', JSON.stringify(historyObj));
    } catch (error) {
      console.error('Failed to save AI assistant state:', error);
    }
  }

  // ==========================================
  // Persona Management
  // ==========================================

  getPersona(role: AIPersonaRole): AIPersona {
    return AI_PERSONAS[role];
  }

  getAllPersonas(): AIPersona[] {
    return Object.values(AI_PERSONAS);
  }

  getPersonaForUserRole(userRole: string): AIPersona {
    // Map user roles to AI personas
    const roleMapping: Record<string, AIPersonaRole> = {
      'doctor': 'doctor',
      'physician': 'doctor',
      'nurse': 'nurse',
      'rn': 'nurse',
      'admin': 'admin',
      'administrator': 'admin',
      'patient': 'patient',
      'receptionist': 'receptionist',
      'front_desk': 'receptionist',
      'emergency': 'emergency',
      'er': 'emergency',
      'lab': 'lab_tech',
      'laboratory': 'lab_tech',
      'pharmacist': 'pharmacist',
      'pharmacy': 'pharmacist',
      'surgeon': 'surgeon',
      'radiologist': 'radiologist',
      'radiology': 'radiologist',
      'therapist': 'therapist',
      'pt': 'therapist',
      'ot': 'therapist',
      'security': 'security',
      'guard': 'security',
      'it': 'it_support',
      'tech_support': 'it_support',
      'finance': 'finance',
      'billing': 'finance',
      'hr': 'hr',
      'human_resources': 'hr',
      'jedi_commander': 'jedi_commander',
      'commander': 'jedi_commander',
      'master_jedi': 'master_jedi',
      'master': 'master_jedi',
    };

    const mappedRole = roleMapping[userRole.toLowerCase()] || 'admin';
    return AI_PERSONAS[mappedRole];
  }

  getReceptionistPersona(): AIPersona {
    return AI_PERSONAS.receptionist;
  }

  getStaffAssistantPersona(staffRole: string): AIPersona {
    return this.getPersonaForUserRole(staffRole);
  }

  // ==========================================
  // Session Management
  // ==========================================

  async startSession(userId: string, userRole: string): Promise<AssistantSession> {
    const persona = this.getPersonaForUserRole(userRole);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: AssistantSession = {
      id: sessionId,
      userId,
      userRole,
      persona: persona.role,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      messages: [],
      context: {
        sessionId,
        userId,
        userRole,
        currentPersona: persona.role,
        urgencyLevel: 'routine',
      },
      actionsExecuted: 0,
      isActive: true,
    };

    // Add greeting message
    const greetingMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: persona.greeting,
      timestamp: new Date().toISOString(),
      persona: persona.role,
    };
    session.messages.push(greetingMessage);

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): AssistantSession | undefined {
    return this.sessions.get(sessionId);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      // Save conversation history
      const existingHistory = this.conversationHistory.get(session.userId) || [];
      this.conversationHistory.set(session.userId, [...existingHistory, ...session.messages]);
      await this.saveState();
    }
  }

  // ==========================================
  // Conversation Management
  // ==========================================

  async sendMessage(
    sessionId: string,
    content: string,
    attachments?: MessageAttachment[]
  ): Promise<ConversationMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      attachments,
    };
    session.messages.push(userMessage);
    session.lastActivityAt = new Date().toISOString();

    // Generate AI response
    const response = await this.generateResponse(session, content);
    session.messages.push(response);

    return response;
  }

  private async generateResponse(
    session: AssistantSession,
    userMessage: string
  ): Promise<ConversationMessage> {
    const persona = AI_PERSONAS[session.persona];
    
    // Analyze intent and generate contextual response
    const intent = this.analyzeIntent(userMessage);
    const response = this.buildResponse(persona, intent, session.context);
    const actions = this.determineActions(persona, intent);

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      persona: session.persona,
      actions: actions.length > 0 ? actions : undefined,
    };

    if (actions.length > 0) {
      session.actionsExecuted += actions.length;
    }

    return message;
  }

  private analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
      return 'scheduling';
    }
    if (lowerMessage.includes('patient') || lowerMessage.includes('record') || lowerMessage.includes('chart')) {
      return 'patient_records';
    }
    if (lowerMessage.includes('medication') || lowerMessage.includes('drug') || lowerMessage.includes('prescription')) {
      return 'medications';
    }
    if (lowerMessage.includes('lab') || lowerMessage.includes('test') || lowerMessage.includes('result')) {
      return 'lab_results';
    }
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('code')) {
      return 'emergency';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return 'help';
    }
    if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('reminder')) {
      return 'tasks';
    }
    if (lowerMessage.includes('email') || lowerMessage.includes('message') || lowerMessage.includes('send')) {
      return 'communication';
    }
    if (lowerMessage.includes('report') || lowerMessage.includes('analytics') || lowerMessage.includes('statistics')) {
      return 'reporting';
    }
    
    return 'general';
  }

  private buildResponse(persona: AIPersona, intent: string, context: ConversationContext): string {
    const responses: Record<string, Record<string, string>> = {
      scheduling: {
        doctor: "I can help you manage your schedule. Would you like me to show your upcoming appointments, find an available slot, or reschedule an existing appointment?",
        nurse: "I can help with scheduling. Do you need to view your shift schedule, request time off, or check patient appointment times?",
        admin: "I can assist with scheduling management. Would you like to view the master schedule, make changes, or generate a scheduling report?",
        patient: "I'd be happy to help with your appointments. Would you like to schedule a new appointment, view upcoming appointments, or reschedule an existing one?",
        receptionist: "I can help with appointment scheduling. Shall I check availability, book a new appointment, or look up an existing booking?",
        default: "I can help with scheduling. What would you like to do?",
      },
      patient_records: {
        doctor: "I can access patient records for you. Would you like to view a specific patient's chart, search for a patient, or review recent admissions?",
        nurse: "I can help you access patient information. Would you like to view your assigned patients, check a specific patient's vitals, or review care plans?",
        patient: "I can help you access your medical records. Would you like to view your test results, medical history, or care summary?",
        default: "I can help you with patient records. What information do you need?",
      },
      medications: {
        doctor: "I can assist with medication management. Would you like to check drug interactions, review a patient's medication list, or create a new prescription?",
        nurse: "I can help with medication administration. Would you like to view the MAR, check medication due times, or verify a medication?",
        pharmacist: "I can assist with pharmacy operations. Would you like to check interactions, verify an order, or review inventory?",
        patient: "I can help with your medications. Would you like to view your current medications, set up reminders, or learn about side effects?",
        default: "I can help with medication information. What do you need?",
      },
      emergency: {
        emergency: "EMERGENCY RESPONSE ACTIVATED. What is the nature of the emergency? I can help activate codes, alert teams, and coordinate resources.",
        doctor: "I can help coordinate emergency response. What type of emergency are we dealing with?",
        nurse: "Emergency assistance ready. Do you need to call a code, alert the rapid response team, or locate emergency equipment?",
        default: "If this is a medical emergency, please call the emergency code immediately. How can I assist?",
      },
      help: {
        default: `As ${persona.name}, I can help you with: ${persona.capabilities.slice(0, 4).join(', ')}. What would you like assistance with?`,
      },
      general: {
        default: `I'm ${persona.name}, your ${persona.title}. ${persona.capabilities.slice(0, 3).join(', ')} are just some of the ways I can help. What do you need?`,
      },
    };

    const intentResponses = responses[intent] || responses.general;
    return intentResponses[persona.role] || intentResponses.default || `I'm here to help. What do you need assistance with?`;
  }

  private determineActions(persona: AIPersona, intent: string): ExecutedAction[] {
    const actions: ExecutedAction[] = [];

    // Suggest relevant quick actions based on intent
    const relevantActions = persona.quickActions.filter(qa => {
      if (intent === 'scheduling' && (qa.action.includes('schedule') || qa.action.includes('calendar'))) return true;
      if (intent === 'patient_records' && (qa.action.includes('patient') || qa.action.includes('record'))) return true;
      if (intent === 'medications' && (qa.action.includes('med') || qa.action.includes('drug'))) return true;
      if (intent === 'emergency' && (qa.action.includes('code') || qa.action.includes('alert'))) return true;
      return false;
    });

    relevantActions.forEach(qa => {
      actions.push({
        id: `action_${Date.now()}_${qa.id}`,
        type: qa.action,
        description: qa.name,
        status: 'pending',
      });
    });

    return actions;
  }

  // ==========================================
  // Action Execution
  // ==========================================

  async executeAction(
    sessionId: string,
    actionId: string,
    params?: Record<string, unknown>
  ): Promise<ExecutedAction> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Find the action in recent messages
    let action: ExecutedAction | undefined;
    for (const msg of session.messages) {
      if (msg.actions) {
        action = msg.actions.find(a => a.id === actionId);
        if (action) break;
      }
    }

    if (!action) {
      throw new Error('Action not found');
    }

    // Execute the action
    try {
      action.status = 'completed';
      action.result = { success: true, params };
      session.actionsExecuted++;
    } catch (error) {
      action.status = 'failed';
      action.result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return action;
  }

  // ==========================================
  // Conversation History
  // ==========================================

  getConversationHistory(userId: string): ConversationMessage[] {
    return this.conversationHistory.get(userId) || [];
  }

  async clearConversationHistory(userId: string): Promise<void> {
    this.conversationHistory.delete(userId);
    await this.saveState();
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    activeSessions: number;
    totalMessages: number;
    actionsExecuted: number;
    personasUsed: Set<AIPersonaRole>;
  } {
    let totalMessages = 0;
    let actionsExecuted = 0;
    const personasUsed = new Set<AIPersonaRole>();

    this.sessions.forEach(session => {
      totalMessages += session.messages.length;
      actionsExecuted += session.actionsExecuted;
      personasUsed.add(session.persona);
    });

    return {
      activeSessions: Array.from(this.sessions.values()).filter(s => s.isActive).length,
      totalMessages,
      actionsExecuted,
      personasUsed,
    };
  }
}

export const aiAssistant = new AIAssistantService();
