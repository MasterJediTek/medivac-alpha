/**
 * MediVac One v5.3 Feature Tests
 * Password-Protected Import/Export, SMTP, Incident Playbooks, Policy Notifications
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import { secureImportExportService } from '../lib/services/secure-import-export-service';
import { smtpConfigurationService } from '../lib/services/smtp-configuration-service';
import { incidentPlaybookService } from '../lib/services/incident-playbook-service';
import { policyNotificationService } from '../lib/services/policy-notification-service';

describe('MediVac One v5.3 Features', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('Secure Import/Export Service', () => {
    it('should verify correct password "obewon"', async () => {
      const result = await secureImportExportService.verifyPassword('obewon');
      expect(result.success).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const result = await secureImportExportService.verifyPassword('wrongpassword');
      expect(result.success).toBe(false);
    });

    it('should reject empty password', async () => {
      const result = await secureImportExportService.verifyPassword('');
      expect(result.success).toBe(false);
    });

    it('should export data with password verification', async () => {
      // First verify password to create session
      await secureImportExportService.verifyPassword('obewon');
      const result = await secureImportExportService.exportData({ 
        categories: ['patients'],
        format: 'json',
        includeMetadata: true
      });
      expect(result.success).toBe(true);
    });

    it('should import data with password verification', async () => {
      await secureImportExportService.verifyPassword('obewon');
      const testData = JSON.stringify({ type: 'medivac_export', version: '5.3', data: {} });
      const result = await secureImportExportService.importData(testData, { 
        overwriteExisting: false,
        validateBeforeImport: true,
        skipInvalid: false,
        dryRun: false
      });
      expect(result).toBeDefined();
    });

    it('should check session validity', async () => {
      await secureImportExportService.verifyPassword('obewon');
      const isValid = await secureImportExportService.isSessionValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get remaining session time', async () => {
      await secureImportExportService.verifyPassword('obewon');
      const remaining = secureImportExportService.getRemainingSessionTime();
      expect(typeof remaining).toBe('number');
    });

    it('should end session', async () => {
      await secureImportExportService.verifyPassword('obewon');
      await secureImportExportService.endSession();
      const isValid = await secureImportExportService.isSessionValid();
      expect(isValid).toBe(false);
    });
  });

  describe('SMTP Configuration Service', () => {
    it('should initialize service', async () => {
      await smtpConfigurationService.initialize();
      const configs = smtpConfigurationService.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('should save SMTP configuration', async () => {
      await smtpConfigurationService.initialize();
      const config = await smtpConfigurationService.saveConfig({
        name: 'Test SMTP',
        host: 'smtp.example.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'login',
        username: 'user@example.com',
        password: 'password123',
        fromAddress: 'noreply@example.com',
        fromName: 'MediVac One',
      });
      expect(config.id).toBeDefined();
      expect(config.host).toBe('smtp.example.com');
      expect(config.port).toBe(587);
    });

    it('should get default configuration', async () => {
      await smtpConfigurationService.initialize();
      await smtpConfigurationService.saveConfig({
        name: 'Default SMTP',
        host: 'smtp.default.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'login',
        fromAddress: 'default@example.com',
        fromName: 'MediVac',
        isDefault: true,
      });
      const defaultConfig = smtpConfigurationService.getDefaultConfig();
      expect(defaultConfig).toBeDefined();
    });

    it('should test SMTP connection', async () => {
      await smtpConfigurationService.initialize();
      const config = await smtpConfigurationService.saveConfig({
        name: 'Test Connection',
        host: 'smtp.test.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'login',
        username: 'test@test.com',
        password: 'test123',
        fromAddress: 'test@test.com',
        fromName: 'Test',
      });
      const result = await smtpConfigurationService.testConnection(config.id);
      expect(result).toHaveProperty('success');
    });

    it('should queue email for sending', async () => {
      await smtpConfigurationService.initialize();
      const email = await smtpConfigurationService.queueEmail({
        to: ['recipient@example.com'],
        subject: 'Test Email',
        body: 'This is a test email',
        priority: 'normal',
      });
      expect(email.id).toBeDefined();
      expect(['pending', 'sending']).toContain(email.status);
    });

    it('should get queue statistics', async () => {
      await smtpConfigurationService.initialize();
      const stats = await smtpConfigurationService.getQueueStats();
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('Incident Playbook Service', () => {
    it('should initialize with default playbooks', async () => {
      await incidentPlaybookService.initialize();
      const playbooks = incidentPlaybookService.getPlaybooks();
      expect(playbooks.length).toBeGreaterThan(0);
    });

    it('should get playbook by ID', async () => {
      await incidentPlaybookService.initialize();
      const playbooks = incidentPlaybookService.getPlaybooks();
      if (playbooks.length > 0) {
        const playbook = incidentPlaybookService.getPlaybook(playbooks[0].id);
        expect(playbook).toBeDefined();
        expect(playbook?.id).toBe(playbooks[0].id);
      }
    });

    it('should get playbook for threat type', async () => {
      await incidentPlaybookService.initialize();
      const playbook = incidentPlaybookService.getPlaybookForThreat('unauthorized_access');
      expect(playbook).toBeDefined();
      expect(playbook?.threatType).toBe('unauthorized_access');
    });

    it('should create new playbook', async () => {
      const newPlaybook = await incidentPlaybookService.savePlaybook({
        name: 'Test Playbook',
        description: 'Test description',
        threatType: 'phishing_attempt',
        severity: 'medium',
      });
      expect(newPlaybook.id).toBeDefined();
      expect(newPlaybook.name).toBe('Test Playbook');
    });

    it('should create incident', async () => {
      await incidentPlaybookService.initialize();
      const incident = await incidentPlaybookService.createIncident({
        threatType: 'unauthorized_access',
        severity: 'high',
        title: 'Test Incident',
        description: 'Test description',
      });
      expect(incident.id).toBeDefined();
      expect(incident.status).toBe('detected');
    });

    it('should update incident status', async () => {
      await incidentPlaybookService.initialize();
      const incident = await incidentPlaybookService.createIncident({
        threatType: 'data_breach',
        title: 'Test Breach',
      });
      const updated = await incidentPlaybookService.updateIncidentStatus(
        incident.id,
        'investigating',
        'Starting investigation'
      );
      expect(updated?.status).toBe('investigating');
    });

    it('should add evidence to incident', async () => {
      await incidentPlaybookService.initialize();
      const incident = await incidentPlaybookService.createIncident({
        threatType: 'malware_detected',
        title: 'Malware Test',
      });
      const evidence = await incidentPlaybookService.addEvidence(incident.id, {
        type: 'log',
        name: 'System Log',
        description: 'Captured system log',
        collectedBy: 'Security Team',
        location: '/var/log/system.log',
      });
      expect(evidence.id).toBeDefined();
    });
  });

  describe('Policy Notification Service', () => {
    it('should initialize with default subscribers', async () => {
      await policyNotificationService.initialize();
      const subscribers = policyNotificationService.getSubscribers();
      expect(subscribers.length).toBeGreaterThan(0);
    });

    it('should add new subscriber', async () => {
      await policyNotificationService.initialize();
      const subscriber = await policyNotificationService.saveSubscriber({
        userId: 'user_test',
        name: 'Test User',
        email: 'test@example.com',
        role: 'manager',
        department: 'Emergency',
        channels: ['email', 'push'],
      });
      expect(subscriber.id).toBeDefined();
      expect(subscriber.email).toBe('test@example.com');
    });

    it('should remove subscriber', async () => {
      await policyNotificationService.initialize();
      const subscriber = await policyNotificationService.saveSubscriber({
        userId: 'user_remove',
        name: 'Remove User',
        email: 'remove@example.com',
        role: 'staff',
        department: 'ICU',
      });
      const result = await policyNotificationService.removeSubscriber(subscriber.id);
      expect(result).toBe(true);
    });

    it('should notify policy change', async () => {
      await policyNotificationService.initialize();
      const notifications = await policyNotificationService.notifyPolicyChange({
        id: 'event_1',
        policyId: 'policy_1',
        policyName: 'Test Policy',
        department: 'IT',
        changeType: 'modified',
        changedBy: 'Admin',
        changedAt: new Date().toISOString(),
        changeSummary: 'Updated access levels',
        affectedRoles: ['staff'],
        requiresApproval: false,
      });
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should get notification history', async () => {
      await policyNotificationService.initialize();
      const history = policyNotificationService.getNotificationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should get notification statistics', async () => {
      await policyNotificationService.initialize();
      const stats = await policyNotificationService.getStats();
      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('deliveryRate');
      expect(stats).toHaveProperty('byChannel');
    });

    it('should notify entire department', async () => {
      await policyNotificationService.initialize();
      const count = await policyNotificationService.notifyDepartment('IT', {
        title: 'Department Alert',
        body: 'This is a test notification',
      });
      expect(typeof count).toBe('number');
    });
  });
});
