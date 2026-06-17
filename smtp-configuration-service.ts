 * SMTP Configuration Service
 * Email server configuration and delivery management
 * MediVac One v5.3
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  SMTP_CONFIG: 'medivac_smtp_config',
  EMAIL_QUEUE: 'medivac_email_queue',
  DELIVERY_HISTORY: 'medivac_delivery_history',
  EMAIL_TEMPLATES: 'medivac_email_templates',
};

// Types
export type EncryptionType = 'none' | 'tls' | 'ssl';
export type AuthMethod = 'none' | 'plain' | 'login' | 'oauth2';
export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'retrying';

export interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  encryption: EncryptionType;
  authMethod: AuthMethod;
  username?: string;
  password?: string;
  oauth2Config?: OAuth2Config;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  maxRetries: number;
  retryDelaySeconds: number;
  timeout: number;
  isDefault: boolean;
  isActive: boolean;
  lastTested?: string;
  testResult?: 'success' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  tokenExpiry?: string;
}

export interface EmailMessage {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
  priority: 'low' | 'normal' | 'high';
  templateId?: string;
  templateData?: Record<string, string>;
  smtpConfigId?: string;
  status: DeliveryStatus;
  attempts: number;
  lastAttempt?: string;
  sentAt?: string;
  error?: string;
  createdAt: string;
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  encoding: 'base64' | 'utf8';
}

export interface DeliveryRecord {
  id: string;
  messageId: string;
  to: string;
  subject: string;
  status: DeliveryStatus;
  smtpConfigId: string;
  attempts: number;
  sentAt?: string;
  error?: string;
  responseCode?: number;
  responseMessage?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyText: string;