/**
 * Advanced Health Directive Email Service
 * Handles email delivery of completed AHD forms to patients and healthcare providers
 */

import { AdvancedHealthDirective } from './ahd.service';

export interface EmailRecipient {
  email: string;
  name: string;
  role: 'patient' | 'healthcare_provider' | 'family_member' | 'emergency_contact';
}

export interface AHDEmailConfig {
  recipients: EmailRecipient[];
  includeAttachment: boolean;
  attachmentFormat: 'pdf' | 'html' | 'both';
  sendCopy: boolean;
  copyEmail?: string;
  customMessage?: string;
}

export interface EmailDeliveryStatus {
  id: string;
  ahdId: string;
  recipientEmail: string;
  recipientName: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
}

class AHDEmailService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  /**
   * Send AHD form via email
   */
  async sendAHDForm(
    ahd: AdvancedHealthDirective,
    config: AHDEmailConfig,
    pdfContent?: string,
    htmlContent?: string
  ): Promise<EmailDeliveryStatus[]> {
    const deliveryStatuses: EmailDeliveryStatus[] = [];

    for (const recipient of config.recipients) {
      const status: EmailDeliveryStatus = {
        id: 'email_' + Date.now() + '_' + Math.random().toString(36).substring(7),
        ahdId: ahd.id,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: 'pending',
        retryCount: 0,
        maxRetries: this.MAX_RETRIES,
      };

      try {
        // Prepare email content
        const emailContent = this.prepareEmailContent(ahd, recipient, config.customMessage);

        // Send email with attachments if requested
        if (config.includeAttachment && (pdfContent || htmlContent)) {
          await this.sendEmailWithAttachments(
            recipient.email,
            recipient.name,
            emailContent,
            pdfContent,
            htmlContent,
            config.attachmentFormat
          );
        } else {
          await this.sendEmail(recipient.email, recipient.name, emailContent);
        }

        status.status = 'sent';
        status.sentAt = new Date().toISOString();
      } catch (error) {
        status.status = 'failed';
        status.failureReason = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AHD Email] Failed to send to ${recipient.email}:`, error);

        // Attempt retry
        await this.retryEmailDelivery(status, ahd, recipient, config, pdfContent, htmlContent);
      }

      deliveryStatuses.push(status);
    }

    // Send copy to patient if requested
    if (config.sendCopy && config.copyEmail) {
      const copyStatus = await this.sendCopyEmail(ahd, config.copyEmail, pdfContent, htmlContent);
      deliveryStatuses.push(copyStatus);
    }

    return deliveryStatuses;
  }

  /**
   * Prepare email content
   */
  private prepareEmailContent(
    ahd: AdvancedHealthDirective,
    recipient: EmailRecipient,
    customMessage?: string
  ): string {
    const greeting = this.getGreeting(recipient.role);
    const timestamp = new Date(ahd.createdAt).toLocaleDateString();

    let content = `${greeting} ${recipient.name},\n\n`;

    if (customMessage) {
      content += `${customMessage}\n\n`;
    }

    content += `This email contains the Advanced Health Directive form completed by ${ahd.patientName} on ${timestamp}.\n\n`;

    content += `**Directive Summary:**\n`;
    content += `- Patient Name: ${ahd.patientName}\n`;
    content += `- Patient ID: ${ahd.patientId || 'N/A'}\n`;
    content += `- Directive Type: ${ahd.directiveType}\n`;
    content += `- Status: ${ahd.status}\n`;
    content += `- Last Updated: ${new Date(ahd.updatedAt).toLocaleDateString()}\n\n`;

    if (ahd.directives && ahd.directives.length > 0) {
      content += `**Directives:**\n`;
      ahd.directives.forEach((directive, index) => {
        content += `${index + 1}. ${directive.title}: ${directive.description}\n`;
      });
      content += '\n';
    }

    if (ahd.witnesses && ahd.witnesses.length > 0) {
      content += `**Witnesses:**\n`;
      ahd.witnesses.forEach(witness => {
        content += `- ${witness.name} (${witness.relationship})\n`;
      });
      content += '\n';
    }

    content += `This is an important legal document. Please keep it in a safe place.\n\n`;
    content += `If you have any questions, please contact the healthcare provider or patient directly.\n\n`;
    content += `Best regards,\nMediVac One Virtual Hospital\n`;

    return content;
  }

  /**
   * Get greeting based on recipient role
   */
  private getGreeting(role: EmailRecipient['role']): string {
    const greetings: Record<string, string> = {
      patient: 'Dear Patient,',
      healthcare_provider: 'Dear Healthcare Provider,',
      family_member: 'Dear Family Member,',
      emergency_contact: 'Dear Emergency Contact,',
    };
    return greetings[role] || 'Dear Recipient,';
  }

  /**
   * Send email (mock implementation)
   */
  private async sendEmail(to: string, name: string, content: string): Promise<void> {
    // In production, this would call an email service like SendGrid, AWS SES, etc.
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[AHD Email] Email sent to ${to} (${name})`);
        resolve();
      }, 500);
    });
  }

  /**
   * Send email with attachments (mock implementation)
   */
  private async sendEmailWithAttachments(
    to: string,
    name: string,
    content: string,
    pdfContent?: string,
    htmlContent?: string,
    format: 'pdf' | 'html' | 'both' = 'pdf'
  ): Promise<void> {
    // In production, this would call an email service with attachments
    return new Promise((resolve) => {
      setTimeout(() => {
        const attachments: string[] = [];
        if ((format === 'pdf' || format === 'both') && pdfContent) {
          attachments.push('AHD_Form.pdf');
        }
        if ((format === 'html' || format === 'both') && htmlContent) {
          attachments.push('AHD_Form.html');
        }

        console.log(
          `[AHD Email] Email sent to ${to} (${name}) with attachments: ${attachments.join(', ')}`
        );
        resolve();
      }, 500);
    });
  }

  /**
   * Retry email delivery
   */
  private async retryEmailDelivery(
    status: EmailDeliveryStatus,
    ahd: AdvancedHealthDirective,
    recipient: EmailRecipient,
    config: AHDEmailConfig,
    pdfContent?: string,
    htmlContent?: string
  ): Promise<void> {
    if (status.retryCount >= status.maxRetries) {
      status.status = 'failed';
      return;
    }

    status.retryCount++;

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * status.retryCount));

    try {
      const emailContent = this.prepareEmailContent(ahd, recipient, config.customMessage);

      if (config.includeAttachment && (pdfContent || htmlContent)) {
        await this.sendEmailWithAttachments(
          recipient.email,
          recipient.name,
          emailContent,
          pdfContent,
          htmlContent,
          config.attachmentFormat
        );
      } else {
        await this.sendEmail(recipient.email, recipient.name, emailContent);
      }

      status.status = 'sent';
      status.sentAt = new Date().toISOString();
    } catch (error) {
      status.failureReason = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AHD Email] Retry ${status.retryCount} failed for ${recipient.email}:`, error);
    }
  }

  /**
   * Send copy email to patient
   */
  private async sendCopyEmail(
    ahd: AdvancedHealthDirective,
    copyEmail: string,
    pdfContent?: string,
    htmlContent?: string
  ): Promise<EmailDeliveryStatus> {
    const status: EmailDeliveryStatus = {
      id: 'email_copy_' + Date.now(),
      ahdId: ahd.id,
      recipientEmail: copyEmail,
      recipientName: 'Copy Recipient',
      status: 'pending',
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    try {
      const content = `A copy of the Advanced Health Directive form has been sent to you for your records.\n\n` +
        `Patient: ${ahd.patientName}\n` +
        `Directive Type: ${ahd.directiveType}\n` +
        `Date: ${new Date(ahd.createdAt).toLocaleDateString()}\n\n` +
        `Please keep this in a safe place.`;

      if (pdfContent || htmlContent) {
        await this.sendEmailWithAttachments(
          copyEmail,
          'Copy Recipient',
          content,
          pdfContent,
          htmlContent,
          'pdf'
        );
      } else {
        await this.sendEmail(copyEmail, 'Copy Recipient', content);
      }

      status.status = 'sent';
      status.sentAt = new Date().toISOString();
    } catch (error) {
      status.status = 'failed';
      status.failureReason = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AHD Email] Failed to send copy to ${copyEmail}:`, error);
    }

    return status;
  }

  /**
   * Get email delivery history
   */
  getDeliveryHistory(ahdId: string): EmailDeliveryStatus[] {
    // In production, this would query a database
    return [];
  }

  /**
   * Resend failed emails
   */
  async resendFailedEmails(statuses: EmailDeliveryStatus[]): Promise<EmailDeliveryStatus[]> {
    const failedStatuses = statuses.filter(s => s.status === 'failed');
    const results: EmailDeliveryStatus[] = [];

    for (const status of failedStatuses) {
      if (status.retryCount < status.maxRetries) {
        status.retryCount++;
        try {
          // Simulate resend
          await new Promise(resolve => setTimeout(resolve, 500));
          status.status = 'sent';
          status.sentAt = new Date().toISOString();
        } catch (error) {
          status.failureReason = error instanceof Error ? error.message : 'Unknown error';
        }
      }
      results.push(status);
    }

    return results;
  }
}

export const ahdEmailService = new AHDEmailService();
