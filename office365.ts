 * MediVac One - Office 365 Integration Service
 * Microsoft Graph API integration for Calendar, Email, Teams, and Contacts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUser, AuthUser } from './auth-providers';

// Types
export interface CalendarEvent {
  id: string;
  subject: string;
  body?: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    type: string;
    status?: {
      response: string;
    };
  }>;
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  webLink?: string;
  categories?: string[];
  importance?: string;
  sensitivity?: string;
  showAs?: string;
  responseStatus?: {
    response: string;
    time: string;
  };
}

export interface EmailMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body?: {
    contentType: string;
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;