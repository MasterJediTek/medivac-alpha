 * Scheduled Report Delivery Service
 * Configure automatic email delivery of compliance and analytics reports
 * MediVac One v5.6
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  SCHEDULES: 'medivac_report_schedules',
  DELIVERY_HISTORY: 'medivac_delivery_history',
};

// Types
export type ReportType = 
  | 'compliance_summary'
  | 'compliance_detailed'
  | 'analytics_overview'
  | 'analytics_threat'
  | 'audit_trail'
  | 'audit_compliance'
  | 'incident_summary'
  | 'security_posture'
  | 'policy_status'
  | 'custom';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
export type ScheduleStatus = 'active' | 'paused' | 'disabled' | 'error';
export type DeliveryStatus = 'pending' | 'sending' | 'delivered' | 'failed' | 'bounced';

export interface ReportSchedule {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  frequency: ScheduleFrequency;
  cronExpression: string;
  templateId?: string;
  recipients: ReportRecipient[];
  filters: ReportFilters;
  format: 'pdf' | 'html' | 'csv' | 'excel';
  status: ScheduleStatus;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;