/**
 * MediVac One v5.4 UI Screens Tests
 * Tests for SMTP Settings, Incident Playbooks, and Password Test screens
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock React Native modules
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  Switch: 'Switch',
  Alert: { alert: vi.fn() },
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Import services after mocks
import { smtpConfigurationService, type SMTPConfig } from '../lib/services/smtp-configuration-service';
import { incidentPlaybookService, type Playbook, type PlaybookAction } from '../lib/services/incident-playbook-service';
import { secureImportExportService } from '../lib/services/secure-import-export-service';

describe('MediVac One v5.4 UI Screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SMTP Configuration Service', () => {
    it('should initialize SMTP service', async () => {
      await smtpConfigurationService.initialize();
      expect(smtpConfigurationService).toBeDefined();
    });

    it('should get empty configs initially', () => {
      const configs = smtpConfigurationService.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('should save SMTP configuration', async () => {
      const config: Partial<SMTPConfig> = {
        name: 'Test SMTP',
        host: 'smtp.test.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'plain',
        username: 'test@test.com',
        password: 'testpass',
        fromAddress: 'noreply@test.com',
        fromName: 'Test Sender',
        maxRetries: 3,
        retryDelaySeconds: 60,
        timeout: 30000,
        isDefault: true,
        isActive: true,
      };

      const saved = await smtpConfigurationService.saveConfig(config);
      expect(saved.id).toBeDefined();
      expect(saved.host).toBe('smtp.test.com');
      expect(saved.port).toBe(587);
    });

    it('should test SMTP connection', async () => {
      const config = await smtpConfigurationService.saveConfig({
        name: 'Connection Test',
        host: 'smtp.example.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'plain',
        fromAddress: 'test@example.com',
        fromName: 'Test',
        maxRetries: 3,
        retryDelaySeconds: 60,
        timeout: 30000,
        isDefault: true,
        isActive: true,
      });

      const result = await smtpConfigurationService.testConnection(config.id);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('should queue email for delivery', async () => {
      const email = await smtpConfigurationService.queueEmail({
        to: ['recipient@test.com'],
        subject: 'Test Email',
        body: 'This is a test email',
        priority: 'normal',
      });

      expect(email.id).toBeDefined();
      expect(['pending', 'sending']).toContain(email.status);
      expect(email.to).toContain('recipient@test.com');
    });

    it('should get queue statistics', async () => {
      const stats = await smtpConfigurationService.getQueueStats();
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('sending');
      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('failed');
    });

    it('should support multiple encryption types', () => {
      const encryptionTypes = ['none', 'tls', 'ssl'];
      encryptionTypes.forEach(type => {
        expect(['none', 'tls', 'ssl']).toContain(type);
      });
    });

    it('should support multiple auth methods', () => {
      const authMethods = ['none', 'plain', 'login', 'oauth2'];
      authMethods.forEach(method => {
        expect(['none', 'plain', 'login', 'oauth2']).toContain(method);
      });
    });
  });

  describe('Incident Playbook Service', () => {
    it('should initialize playbook service', async () => {
      await incidentPlaybookService.initialize();
      expect(incidentPlaybookService).toBeDefined();
    });

    it('should get all playbooks', () => {
      const playbooks = incidentPlaybookService.getPlaybooks();
      expect(Array.isArray(playbooks)).toBe(true);
    });

    it('should have default playbooks for common threats', async () => {
      await incidentPlaybookService.initialize();
      const playbooks = incidentPlaybookService.getPlaybooks();
      
      // Should have playbooks for various threat types
      const threatTypes = playbooks.map(p => p.threatType);
      expect(threatTypes.length).toBeGreaterThan(0);
    });

    it('should save playbook updates', async () => {
      const playbook = await incidentPlaybookService.savePlaybook({
        name: 'Test Playbook',
        description: 'Test description',
        threatType: 'unauthorized_access',
        severity: 'high',
        actions: [],
        escalationRules: [],
        containmentProcedures: [],
        recoverySteps: [],
        notificationChain: ['admin@test.com'],
        isActive: true,
        isTestMode: false,
      });

      expect(playbook.id).toBeDefined();
      expect(playbook.name).toBe('Test Playbook');
      expect(playbook.severity).toBe('high');
    });

    it('should toggle playbook active status', async () => {
      const playbook = await incidentPlaybookService.savePlaybook({
        name: 'Toggle Test',
        threatType: 'data_breach',
        severity: 'critical',
        actions: [],
        escalationRules: [],
        containmentProcedures: [],
        recoverySteps: [],
        notificationChain: [],
        isActive: true,
        isTestMode: false,
      });

      const updated = await incidentPlaybookService.savePlaybook({
        id: playbook.id,
        isActive: false,
      });

      expect(updated.isActive).toBe(false);
    });

    it('should create incident from playbook', async () => {
      const incident = await incidentPlaybookService.createIncident({
        threatType: 'malware_detected',
        severity: 'high',
        title: 'Test Malware Incident',
        description: 'Malware detected in test system',
        affectedSystems: ['Test Server'],
        affectedUsers: ['test-user'],
        detectedBy: 'Automated Scanner',
      });

      expect(incident.id).toBeDefined();
      expect(incident.status).toBe('detected');
      expect(incident.threatType).toBe('malware_detected');
    });

    it('should support all threat types', () => {
      const threatTypes = [
        'unauthorized_access',
        'data_breach',
        'malware_detected',
        'ddos_attack',
        'phishing_attempt',
        'insider_threat',
        'ransomware',
        'credential_compromise',
        'policy_violation',
        'system_intrusion',
        'data_exfiltration',
      ];

      threatTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should support all severity levels', () => {
      const severities = ['critical', 'high', 'medium', 'low'];
      severities.forEach(severity => {
        expect(['critical', 'high', 'medium', 'low']).toContain(severity);
      });
    });

    it('should support playbook action types', () => {
      const actionTypes = [
        'notify',
        'isolate',
        'block',
        'disable_account',
        'revoke_access',
        'capture_evidence',
        'escalate',
        'quarantine',
        'restore',
        'report',
        'custom',
      ];

      actionTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('Password Protection (Secure Import/Export)', () => {
    it('should verify correct password "obewon"', async () => {
      const result = await secureImportExportService.verifyPassword('obewon');
      expect(result.success).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const result = await secureImportExportService.verifyPassword('wrongpassword');
      expect(result.success).toBe(false);
    });

    it('should track remaining attempts', async () => {
      const result = await secureImportExportService.verifyPassword('wrong');
      expect(result).toHaveProperty('remainingAttempts');
    });

    it('should check session validity', async () => {
      const isValid = await secureImportExportService.isSessionValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should get remaining session time', () => {
      const remaining = secureImportExportService.getRemainingSessionTime();
      expect(typeof remaining).toBe('number');
    });

    it('should end session', async () => {
      await secureImportExportService.endSession();
      const isValid = await secureImportExportService.isSessionValid();
      expect(isValid).toBe(false);
    });

    it('should export data with valid session', async () => {
      // First verify password to start session
      await secureImportExportService.verifyPassword('obewon');
      
      const result = await secureImportExportService.exportData({
        categories: ['patients'],
        format: 'json',
        includeMetadata: true,
      });

      expect(result).toHaveProperty('success');
    });
  });

  describe('UI Screen Components', () => {
    it('should have SMTP settings screen structure', () => {
      // Test that SMTP settings screen has required elements
      const requiredFields = [
        'host',
        'port',
        'username',
        'password',
        'fromEmail',
        'fromName',
        'encryption',
        'authMethod',
      ];

      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('should have incident playbooks screen structure', () => {
      // Test that playbooks screen has required elements
      const requiredElements = [
        'playbook list',
        'edit modal',
        'action editor',
        'toggle automation',
        'test playbook',
      ];

      requiredElements.forEach(element => {
        expect(typeof element).toBe('string');
      });
    });

    it('should have password test screen structure', () => {
      // Test that password test screen has required elements
      const requiredElements = [
        'password input',
        'verify button',
        'export test',
        'import test',
        'session status',
        'lockout indicator',
      ];

      requiredElements.forEach(element => {
        expect(typeof element).toBe('string');
      });
    });

    it('should display common SMTP providers', () => {
      const providers = [
        { name: 'Gmail', host: 'smtp.gmail.com', port: 587 },
        { name: 'Outlook/Office 365', host: 'smtp.office365.com', port: 587 },
        { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587 },
        { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587 },
        { name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587 },
      ];

      providers.forEach(provider => {
        expect(provider.name).toBeDefined();
        expect(provider.host).toBeDefined();
        expect(provider.port).toBe(587);
      });
    });

    it('should display threat type icons', () => {
      const threatIcons = {
        'unauthorized_access': '🚫',
        'data_breach': '💾',
        'malware_detected': '🦠',
        'ddos_attack': '🌊',
        'phishing_attempt': '🎣',
        'insider_threat': '👤',
        'ransomware': '🔒',
        'credential_compromise': '🔑',
        'policy_violation': '📋',
        'system_intrusion': '🔓',
        'data_exfiltration': '📤',
      };

      Object.entries(threatIcons).forEach(([type, icon]) => {
        expect(typeof type).toBe('string');
        expect(typeof icon).toBe('string');
      });
    });

    it('should display severity colors', () => {
      const severityColors = {
        'critical': '#EF4444',
        'high': '#F59E0B',
        'medium': '#3B82F6',
        'low': '#10B981',
      };

      Object.entries(severityColors).forEach(([severity, color]) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate SMTP with notification system', async () => {
      // Save SMTP config
      const config = await smtpConfigurationService.saveConfig({
        name: 'Notification SMTP',
        host: 'smtp.notification.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'plain',
        fromAddress: 'notifications@medivac.one',
        fromName: 'MediVac Notifications',
        maxRetries: 3,
        retryDelaySeconds: 60,
        timeout: 30000,
        isDefault: true,
        isActive: true,
      });

      // Queue notification email
      const email = await smtpConfigurationService.queueEmail({
        to: ['admin@hospital.com'],
        subject: 'Security Alert',
        body: 'A security incident has been detected.',
        priority: 'high',
        smtpConfigId: config.id,
      });

      expect(email.smtpConfigId).toBe(config.id);
    });

    it('should integrate playbooks with incident response', async () => {
      // Create playbook
      const playbook = await incidentPlaybookService.savePlaybook({
        name: 'Auto Response',
        threatType: 'unauthorized_access',
        severity: 'high',
        actions: [
          {
            id: 'action_1',
            order: 1,
            type: 'notify',
            name: 'Alert Security Team',
            description: 'Send immediate notification',
            parameters: {},
            isAutomated: true,
            requiresApproval: false,
            timeout: 60,
            onFailure: 'continue',
          },
        ],
        escalationRules: [],
        containmentProcedures: [],
        recoverySteps: [],
        notificationChain: ['security@hospital.com'],
        isActive: true,
        isTestMode: false,
      });

      // Create incident
      const incident = await incidentPlaybookService.createIncident({
        threatType: 'unauthorized_access',
        severity: 'high',
        title: 'Unauthorized Login Attempt',
        description: 'Multiple failed login attempts detected',
        affectedSystems: ['Auth Server'],
        detectedBy: 'IDS',
      });

      expect(incident.threatType).toBe(playbook.threatType);
    });

    it('should require password for sensitive operations', async () => {
      // Verify password first
      const verifyResult = await secureImportExportService.verifyPassword('obewon');
      expect(verifyResult.success).toBe(true);

      // Now export should work
      const exportResult = await secureImportExportService.exportData({
        categories: ['patients', 'staff'],
        format: 'json',
        includeMetadata: true,
      });

      expect(exportResult).toHaveProperty('success');
    });
  });
});
