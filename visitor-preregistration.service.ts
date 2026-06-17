/**
 * Visitor Appointment Pre-Registration Service
 * Allows visitors to pre-register appointments and get QR codes for express check-in
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as QRCode from 'qrcode';

export interface VisitorAppointment {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  patientName: string;
  patientId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  purpose: string;
  relationship: 'family' | 'friend' | 'colleague' | 'other';
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  qrCode?: string;
  qrCodeData?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface PreRegistrationForm {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  patientName: string;
  patientId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  purpose: string;
  relationship: 'family' | 'friend' | 'colleague' | 'other';
  notes?: string;
}

export interface AppointmentConfirmation {
  appointmentId: string;
  qrCode: string;
  confirmationNumber: string;
  estimatedCheckInTime: number; // in seconds
  instructions: string[];
}

class VisitorPreRegistrationService {
  private readonly APPOINTMENTS_KEY = 'visitor_appointments';
  private appointments: Map<string, VisitorAppointment> = new Map();

  async initialize(): Promise<void> {
    await this.loadAppointments();
  }

  /**
   * Register a new visitor appointment
   */
  async registerAppointment(form: PreRegistrationForm): Promise<AppointmentConfirmation> {
    const appointment: VisitorAppointment = {
      id: 'apt_' + Date.now(),
      visitorName: form.visitorName,
      visitorEmail: form.visitorEmail,
      visitorPhone: form.visitorPhone,
      patientName: form.patientName,
      patientId: form.patientId,
      department: form.department,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      purpose: form.purpose,
      relationship: form.relationship,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: form.notes,
    };

    // Generate QR code data
    const qrData = JSON.stringify({
      appointmentId: appointment.id,
      visitorName: appointment.visitorName,
      patientId: appointment.patientId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      timestamp: Date.now(),
    });

    appointment.qrCodeData = qrData;

    // Generate QR code image
    try {
      appointment.qrCode = await QRCode.toDataURL(qrData);
    } catch (error) {
      console.error('[Visitor Pre-Registration] Failed to generate QR code:', error);
      appointment.qrCode = '';
    }

    this.appointments.set(appointment.id, appointment);
    await this.saveAppointments();

    // Send confirmation email
    await this.sendConfirmationEmail(appointment);

    // Generate confirmation number
    const confirmationNumber = this.generateConfirmationNumber(appointment.id);

    // Estimate check-in time (typically 2-3 minutes for pre-registered visitors)
    const estimatedCheckInTime = 120 + Math.random() * 60;

    return {
      appointmentId: appointment.id,
      qrCode: appointment.qrCode || '',
      confirmationNumber,
      estimatedCheckInTime: Math.round(estimatedCheckInTime),
      instructions: [
        'Save your QR code or confirmation number',
        'Arrive 10 minutes before your appointment time',
        'Show your QR code at the visitor kiosk for express check-in',
        'Proceed to the ' + appointment.department,
        'Check in with the department receptionist',
      ],
    };
  }

  /**
   * Get appointment by ID
   */
  getAppointment(appointmentId: string): VisitorAppointment | null {
    return this.appointments.get(appointmentId) || null;
  }

  /**
   * Get all appointments for a visitor
   */
  getVisitorAppointments(visitorEmail: string): VisitorAppointment[] {
    return Array.from(this.appointments.values()).filter(
      apt => apt.visitorEmail.toLowerCase() === visitorEmail.toLowerCase()
    );
  }

  /**
   * Get upcoming appointments
   */
  getUpcomingAppointments(days: number = 7): VisitorAppointment[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.appointments.values()).filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= now && aptDate <= futureDate && apt.status !== 'cancelled';
    });
  }

  /**
   * Check in a visitor using QR code
   */
  async checkInVisitor(appointmentId: string): Promise<VisitorAppointment | null> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return null;

    appointment.status = 'checked_in';
    appointment.updatedAt = new Date().toISOString();

    await this.saveAppointments();

    // Send check-in notification
    await this.sendCheckInNotification(appointment);

    return appointment;
  }

  /**
   * Verify QR code data
   */
  verifyQRCode(qrData: string): { valid: boolean; appointmentId?: string; message: string } {
    try {
      const data = JSON.parse(qrData);
      const appointment = this.appointments.get(data.appointmentId);

      if (!appointment) {
        return { valid: false, message: 'Appointment not found' };
      }

      if (appointment.status === 'cancelled') {
        return { valid: false, message: 'Appointment has been cancelled' };
      }

      if (appointment.status === 'completed') {
        return { valid: false, message: 'Appointment already completed' };
      }

      // Check if appointment is within 24 hours
      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      const now = new Date();
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

      if (hoursUntilAppointment < -1) {
        return { valid: false, message: 'Appointment time has passed' };
      }

      if (hoursUntilAppointment > 24) {
        return { valid: false, message: 'Appointment is too far in the future' };
      }

      return { valid: true, appointmentId: data.appointmentId, message: 'QR code is valid' };
    } catch (error) {
      return { valid: false, message: 'Invalid QR code format' };
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<boolean> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return false;

    appointment.status = 'cancelled';
    appointment.updatedAt = new Date().toISOString();
    if (reason) {
      appointment.notes = (appointment.notes || '') + `\nCancellation reason: ${reason}`;
    }

    await this.saveAppointments();

    // Send cancellation notification
    await this.sendCancellationNotification(appointment);

    return true;
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId: string, updates: Partial<VisitorAppointment>): Promise<VisitorAppointment | null> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return null;

    Object.assign(appointment, updates);
    appointment.updatedAt = new Date().toISOString();

    await this.saveAppointments();
    return appointment;
  }

  /**
   * Get appointment statistics
   */
  getAppointmentStats() {
    const appointments = Array.from(this.appointments.values());
    const today = new Date().toDateString();

    return {
      totalAppointments: appointments.length,
      todayAppointments: appointments.filter(a => new Date(a.appointmentDate).toDateString() === today).length,
      checkedIn: appointments.filter(a => a.status === 'checked_in').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  }

  /**
   * Generate confirmation number
   */
  private generateConfirmationNumber(appointmentId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VIS-${timestamp}-${random}`;
  }

  /**
   * Send confirmation email (mock)
   */
  private async sendConfirmationEmail(appointment: VisitorAppointment): Promise<void> {
    try {
      // In production, this would call an email service
      console.log(`[Visitor Pre-Registration] Confirmation email sent to ${appointment.visitorEmail}`);
    } catch (error) {
      console.error('[Visitor Pre-Registration] Failed to send confirmation email:', error);
    }
  }

  /**
   * Send check-in notification (mock)
   */
  private async sendCheckInNotification(appointment: VisitorAppointment): Promise<void> {
    try {
      // In production, this would send a push notification
      console.log(`[Visitor Pre-Registration] Check-in notification sent to ${appointment.visitorName}`);
    } catch (error) {
      console.error('[Visitor Pre-Registration] Failed to send check-in notification:', error);
    }
  }

  /**
   * Send cancellation notification (mock)
   */
  private async sendCancellationNotification(appointment: VisitorAppointment): Promise<void> {
    try {
      // In production, this would send a notification
      console.log(`[Visitor Pre-Registration] Cancellation notification sent to ${appointment.visitorEmail}`);
    } catch (error) {
      console.error('[Visitor Pre-Registration] Failed to send cancellation notification:', error);
    }
  }

  private async loadAppointments(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.APPOINTMENTS_KEY);
      if (data) {
        const appointments = JSON.parse(data);
        this.appointments = new Map(appointments.map((a: VisitorAppointment) => [a.id, a]));
      }
    } catch (error) {
      console.error('[Visitor Pre-Registration] Failed to load appointments:', error);
    }
  }

  private async saveAppointments(): Promise<void> {
    try {
      const appointments = Array.from(this.appointments.values());
      await AsyncStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch (error) {
      console.error('[Visitor Pre-Registration] Failed to save appointments:', error);
    }
  }
}

export const visitorPreRegistrationService = new VisitorPreRegistrationService();
