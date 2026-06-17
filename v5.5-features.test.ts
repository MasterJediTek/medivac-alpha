/**
 * MediVac One v5.5 Feature Tests
 * Tests for Email Template Editor, Playbook Analytics Dashboard, and Bulk SMTP Import
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage before imports
vi.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => store[key] || null),
      setItem: vi.fn(async (key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn(async (key: string) => { delete store[key]; }),
      clear: vi.fn(async () => { Object.keys(store).forEach(k => delete store[k]); }),
    },
  };
});

// Import services after mocking
import { emailTemplateService, type EmailTemplate, type TemplateCategory } from '../lib/services/email-template-service';
import { playbookAnalyticsService, type ThreatType, type Severity, type ExecutionStatus } from '../lib/services/playbook-analytics-service';
import { bulkSMTPImportService, type ImportFormat, type ConflictResolution } from '../lib/services/bulk-smtp-import-service';

describe('Email Template Service', () => {
  describe('Template Management', () => {
    it('should initialize with default templates', async () => {
      await emailTemplateService.initialize();
      const templates = emailTemplateService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should create a new template', async () => {
      await emailTemplateService.initialize();
      const initialCount = emailTemplateService.getTemplates().length;
      
      const newTemplate = await emailTemplateService.createTemplate({
        name: 'Test Template',
        description: 'A test email template',
        category: 'general',
        subject: 'Test Subject {{name}}',
        bodyHtml: '<p>Hello {{name}}</p>',
        bodyText: 'Hello {{name}}',
        variables: [
          { name: 'name', description: 'Recipient name', defaultValue: 'User', required: true, type: 'text' }
        ],
        tags: ['test', 'demo'],
        status: 'active',
      });

      expect(newTemplate.id).toBeDefined();
      expect(newTemplate.name).toBe('Test Template');
      expect(newTemplate.version).toBe(1);
      expect(emailTemplateService.getTemplates().length).toBe(initialCount + 1);
    });

    it('should update an existing template', async () => {
      await emailTemplateService.initialize();
      const templates = emailTemplateService.getTemplates();
      const template = templates[0];
      
      const updated = await emailTemplateService.updateTemplate(template.id, {
        name: 'Updated Template Name',
        description: 'Updated description',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Template Name');
      expect(updated!.version).toBeGreaterThanOrEqual(template.version);
    });

    it('should delete a template', async () => {
      await emailTemplateService.initialize();
      const templates = emailTemplateService.getTemplates();
      const initialCount = templates.length;
      const templateId = templates[0].id;
      
      await emailTemplateService.deleteTemplate(templateId);
      
      expect(emailTemplateService.getTemplates().length).toBe(initialCount - 1);
      expect(emailTemplateService.getTemplate(templateId)).toBeNull();
    });

    it('should duplicate a template', async () => {
      await emailTemplateService.initialize();
      const templates = emailTemplateService.getTemplates();
      const template = templates[0];
      const initialCount = templates.length;
      
      const duplicated = await emailTemplateService.duplicateTemplate(template.id);
      
      expect(duplicated.name).toContain('Copy');
      expect(duplicated.id).not.toBe(template.id);
      expect(emailTemplateService.getTemplates().length).toBe(initialCount + 1);
    });
  });

  describe('Template Categories', () => {
    it('should filter templates by category', async () => {
      await emailTemplateService.initialize();
      
      const complianceTemplates = emailTemplateService.getTemplatesByCategory('compliance');
      const incidentTemplates = emailTemplateService.getTemplatesByCategory('incident');
      
      complianceTemplates.forEach(t => expect(t.category).toBe('compliance'));
      incidentTemplates.forEach(t => expect(t.category).toBe('incident'));
    });

    it('should search templates', async () => {
      await emailTemplateService.initialize();
      
      const results = emailTemplateService.searchTemplates('compliance');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Template Preview', () => {
    it('should preview template with variables', async () => {
      await emailTemplateService.initialize();
      const templates = emailTemplateService.getTemplates();
      const template = templates.find(t => t.variables.length > 0);
      
      if (template) {
        const variables: Record<string, string> = {};
        template.variables.forEach(v => {
          variables[v.name] = 'TestValue';
        });
        
        const preview = emailTemplateService.previewTemplate(template.id, variables);
        
        expect(preview).not.toBeNull();
        expect(preview!.subject).toBeDefined();
        expect(preview!.bodyHtml).toBeDefined();
        expect(preview!.bodyText).toBeDefined();
      }
    });

    it('should identify missing required variables', async () => {
      await emailTemplateService.initialize();
      
      // Create template with required variable
      const template = await emailTemplateService.createTemplate({
        name: 'Required Var Template',
        description: 'Test',
        category: 'general',
        subject: 'Hello {{requiredName}}',
        bodyHtml: '<p>{{requiredName}}</p>',
        bodyText: '{{requiredName}}',
        variables: [
          { name: 'requiredName', description: 'Required', defaultValue: '', required: true, type: 'text' }
        ],
        tags: [],
        status: 'active',
      });

      const preview = emailTemplateService.previewTemplate(template.id, {});
      
      expect(preview!.missingVariables).toContain('requiredName');
    });
  });
});

describe('Playbook Analytics Service', () => {
  beforeEach(async () => {
    await playbookAnalyticsService.clearData();
  });

  describe('Execution Recording', () => {
    it('should record a new execution', async () => {
      await playbookAnalyticsService.initialize();
      
      const execution = await playbookAnalyticsService.recordExecution({
        playbookId: 'test_playbook',
        playbookName: 'Test Playbook',
        threatType: 'unauthorized_access',
        severity: 'high',
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        duration: 30000,
        actionsTotal: 5,
        actionsCompleted: 5,
        actionsFailed: 0,
        triggeredBy: 'manual',
      });

      expect(execution.id).toBeDefined();
      expect(execution.playbookName).toBe('Test Playbook');
    });

    it('should update execution status', async () => {
      await playbookAnalyticsService.initialize();
      
      const execution = await playbookAnalyticsService.recordExecution({
        playbookId: 'test_playbook',
        playbookName: 'Test Playbook',
        threatType: 'data_breach',
        severity: 'critical',
        status: 'running',
        startedAt: new Date().toISOString(),
        actionsTotal: 5,
        actionsCompleted: 0,
        actionsFailed: 0,
        triggeredBy: 'automated',
      });

      const updated = await playbookAnalyticsService.updateExecution(execution.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        actionsCompleted: 5,
      });

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('completed');
      expect(updated!.actionsCompleted).toBe(5);
    });
  });

  describe('Analytics Summary', () => {
    it('should generate analytics summary', async () => {
      await playbookAnalyticsService.initialize();
      
      // Record some executions
      await playbookAnalyticsService.recordExecution({
        playbookId: 'playbook_1',
        playbookName: 'Playbook 1',
        threatType: 'malware_detected',
        severity: 'high',
        status: 'completed',
        startedAt: new Date().toISOString(),
        duration: 45000,
        actionsTotal: 3,
        actionsCompleted: 3,
        actionsFailed: 0,
        triggeredBy: 'automated',
      });

      await playbookAnalyticsService.recordExecution({
        playbookId: 'playbook_2',
        playbookName: 'Playbook 2',
        threatType: 'phishing_attempt',
        severity: 'medium',
        status: 'failed',
        startedAt: new Date().toISOString(),
        duration: 60000,
        actionsTotal: 4,
        actionsCompleted: 2,
        actionsFailed: 2,
        triggeredBy: 'manual',
      });

      const summary = playbookAnalyticsService.getAnalyticsSummary();

      expect(summary.totalExecutions).toBeGreaterThanOrEqual(2);
      expect(summary.executionsByThreatType).toBeDefined();
      expect(summary.executionsBySeverity).toBeDefined();
      expect(summary.executionsByStatus).toBeDefined();
    });

    it('should filter executions by threat type', async () => {
      await playbookAnalyticsService.initialize();
      
      await playbookAnalyticsService.recordExecution({
        playbookId: 'playbook_1',
        playbookName: 'Ransomware Response',
        threatType: 'ransomware',
        severity: 'critical',
        status: 'completed',
        startedAt: new Date().toISOString(),
        duration: 120000,
        actionsTotal: 8,
        actionsCompleted: 8,
        actionsFailed: 0,
        triggeredBy: 'automated',
      });

      const filtered = playbookAnalyticsService.getExecutions({ threatType: 'ransomware' });
      
      filtered.forEach(e => expect(e.threatType).toBe('ransomware'));
    });
  });

  describe('Export', () => {
    it('should export analytics as JSON', async () => {
      await playbookAnalyticsService.initialize();
      
      const json = playbookAnalyticsService.exportAnalytics('json');
      const parsed = JSON.parse(json);
      
      expect(parsed.totalExecutions).toBeDefined();
      expect(parsed.successRate).toBeDefined();
    });

    it('should export analytics as CSV', async () => {
      await playbookAnalyticsService.initialize();
      
      const csv = playbookAnalyticsService.exportAnalytics('csv');
      const lines = csv.split('\n');
      
      expect(lines[0]).toContain('ID');
      expect(lines[0]).toContain('Playbook');
      expect(lines[0]).toContain('Threat Type');
    });
  });
});

describe('Bulk SMTP Import Service', () => {
  beforeEach(async () => {
    await bulkSMTPImportService.clearHistory();
  });

  describe('JSON Parsing', () => {
    it('should parse valid JSON array', () => {
      const json = JSON.stringify([
        {
          name: 'Test SMTP',
          host: 'smtp.test.com',
          port: 587,
          encryption: 'tls',
          authMethod: 'plain',
          fromAddress: 'test@test.com',
        }
      ]);

      const configs = bulkSMTPImportService.parseJSON(json);
      
      expect(configs.length).toBe(1);
      expect(configs[0].name).toBe('Test SMTP');
      expect(configs[0].host).toBe('smtp.test.com');
    });

    it('should parse single JSON object', () => {
      const json = JSON.stringify({
        name: 'Single SMTP',
        host: 'smtp.single.com',
        port: 465,
        encryption: 'ssl',
        authMethod: 'login',
        fromAddress: 'single@test.com',
      });

      const configs = bulkSMTPImportService.parseJSON(json);
      
      expect(configs.length).toBe(1);
      expect(configs[0].name).toBe('Single SMTP');
    });

    it('should throw on invalid JSON', () => {
      expect(() => bulkSMTPImportService.parseJSON('not valid json')).toThrow();
    });
  });

  describe('CSV Parsing', () => {
    it('should parse valid CSV', () => {
      const csv = `name,host,port,encryption,authMethod,username,password,fromAddress,fromName,isDefault,isActive
Test SMTP,smtp.test.com,587,tls,plain,user@test.com,pass123,noreply@test.com,Test Sender,true,true`;

      const configs = bulkSMTPImportService.parseCSV(csv);
      
      expect(configs.length).toBe(1);
      expect(configs[0].name).toBe('Test SMTP');
      expect(configs[0].port).toBe(587);
      expect(configs[0].isDefault).toBe(true);
    });

    it('should throw on CSV with wrong column count', () => {
      const csv = `name,host,port
Test,smtp.test.com`;

      expect(() => bulkSMTPImportService.parseCSV(csv)).toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      const result = bulkSMTPImportService.validateConfig({
        name: '',
        host: '',
        port: 0,
        encryption: 'tls',
        authMethod: 'plain',
        fromAddress: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Host is required');
    });

    it('should validate port range', () => {
      const result = bulkSMTPImportService.validateConfig({
        name: 'Test',
        host: 'smtp.test.com',
        port: 99999,
        encryption: 'tls',
        authMethod: 'plain',
        fromAddress: 'test@test.com',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Port'))).toBe(true);
    });

    it('should warn on port/encryption mismatch', () => {
      const result = bulkSMTPImportService.validateConfig({
        name: 'Test',
        host: 'smtp.test.com',
        port: 465,
        encryption: 'tls', // Should be ssl for port 465
        authMethod: 'plain',
        fromAddress: 'test@test.com',
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('SSL'))).toBe(true);
    });

    it('should pass validation for valid config', () => {
      const result = bulkSMTPImportService.validateConfig({
        name: 'Valid SMTP',
        host: 'smtp.valid.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'plain',
        username: 'user@valid.com',
        password: 'securepass',
        fromAddress: 'noreply@valid.com',
        fromName: 'Valid Sender',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Import Preview', () => {
    it('should preview import without making changes', async () => {
      await bulkSMTPImportService.initialize();
      
      const json = JSON.stringify([
        {
          name: 'Preview SMTP 1',
          host: 'smtp.preview1.com',
          port: 587,
          encryption: 'tls',
          authMethod: 'plain',
          fromAddress: 'test1@preview.com',
        },
        {
          name: 'Preview SMTP 2',
          host: 'smtp.preview2.com',
          port: 465,
          encryption: 'ssl',
          authMethod: 'login',
          fromAddress: 'test2@preview.com',
        },
        {
          name: '', // Invalid - missing name
          host: 'smtp.invalid.com',
          port: 587,
          encryption: 'tls',
          authMethod: 'plain',
          fromAddress: 'invalid@preview.com',
        }
      ]);

      const preview = await bulkSMTPImportService.previewImport(json, 'json');

      expect(preview.totalConfigs).toBe(3);
      expect(preview.validConfigs).toBe(2);
      expect(preview.invalidConfigs).toBe(1);
    });
  });

  describe('Templates', () => {
    it('should provide CSV template', () => {
      const template = bulkSMTPImportService.getCSVTemplate();
      
      expect(template).toContain('name');
      expect(template).toContain('host');
      expect(template).toContain('port');
      expect(template).toContain('encryption');
    });

    it('should provide JSON template', () => {
      const template = bulkSMTPImportService.getJSONTemplate();
      const parsed = JSON.parse(template);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].name).toBeDefined();
      expect(parsed[0].host).toBeDefined();
    });
  });

  describe('History', () => {
    it('should track import history', async () => {
      await bulkSMTPImportService.initialize();
      
      const initialHistory = bulkSMTPImportService.getHistory();
      expect(Array.isArray(initialHistory)).toBe(true);
    });

    it('should clear history', async () => {
      await bulkSMTPImportService.initialize();
      await bulkSMTPImportService.clearHistory();
      
      const history = bulkSMTPImportService.getHistory();
      expect(history.length).toBe(0);
    });
  });
});

describe('Integration Tests', () => {
  describe('Email Template with Playbook Analytics', () => {
    it('should have incident templates for playbook notifications', async () => {
      await emailTemplateService.initialize();
      
      const incidentTemplates = emailTemplateService.getTemplatesByCategory('incident');
      
      expect(incidentTemplates.length).toBeGreaterThan(0);
      expect(incidentTemplates.some(t => t.name.toLowerCase().includes('alert') || t.name.toLowerCase().includes('incident'))).toBe(true);
    });
  });

  describe('SMTP Import with Email Templates', () => {
    it('should support importing SMTP configs for template delivery', async () => {
      await bulkSMTPImportService.initialize();
      
      const json = JSON.stringify([{
        name: 'Template Delivery SMTP',
        host: 'smtp.templates.com',
        port: 587,
        encryption: 'tls',
        authMethod: 'plain',
        fromAddress: 'templates@medivac.com',
        fromName: 'MediVac Templates',
        environment: 'production',
        tags: ['templates', 'notifications'],
      }]);

      const preview = await bulkSMTPImportService.previewImport(json, 'json');
      
      expect(preview.validConfigs).toBe(1);
      expect(preview.validationResults[0].config.tags).toContain('templates');
    });
  });
});
