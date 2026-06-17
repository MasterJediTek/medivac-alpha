import { describe, it, expect, beforeEach } from 'vitest';
import { themeSchedulingService } from '../theme-scheduling-service';
import { pathwayAlertNotificationService } from '../pathway-alert-notification-service';
import { abTestReportingService } from '../ab-test-reporting-service';

describe('v8.4 Features', () => {
  describe('Theme Scheduling Service', () => {
    beforeEach(() => {
      themeSchedulingService.stopScheduler();
    });

    it('should have default shift profiles', () => {
      const profiles = themeSchedulingService.getAllProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should get current theme', () => {
      const theme = themeSchedulingService.getCurrentTheme();
      expect(['light', 'dark', 'high-contrast', 'jedi', 'medical-blue']).toContain(theme);
    });

    it('should activate a profile', () => {
      const profiles = themeSchedulingService.getAllProfiles();
      if (profiles.length > 0) {
        themeSchedulingService.activateProfile(profiles[0].id);
        const active = themeSchedulingService.getActiveProfile();
        expect(active?.id).toBe(profiles[0].id);
      }
    });

    it('should start and stop scheduler', () => {
      themeSchedulingService.startScheduler();
      expect(themeSchedulingService.isSchedulerRunning()).toBe(true);
      
      themeSchedulingService.stopScheduler();
      expect(themeSchedulingService.isSchedulerRunning()).toBe(false);
    });

    it('should get analytics', () => {
      const analytics = themeSchedulingService.getAnalytics();
      expect(analytics).toHaveProperty('totalRules');
      expect(analytics).toHaveProperty('activeRules');
      expect(analytics).toHaveProperty('transitionsToday');
    });
  });

  describe('Pathway Alert Notification Service', () => {
    beforeEach(() => {
      pathwayAlertNotificationService.stopMonitoring();
    });

    it('should start and stop monitoring', () => {
      pathwayAlertNotificationService.startMonitoring();
      expect(pathwayAlertNotificationService.isMonitoringActive()).toBe(true);
      
      pathwayAlertNotificationService.stopMonitoring();
      expect(pathwayAlertNotificationService.isMonitoringActive()).toBe(false);
    });

    it('should create alerts', () => {
      const alert = pathwayAlertNotificationService.createAlert({
        pathwayType: 'l1_cache',
        severity: 'warning',
        title: 'Test Alert',
        message: 'Test alert message',
        type: 'latency',
        details: 'Test details',
        threshold: 100,
        currentValue: 150,
      } as any);
      
      expect(alert).toHaveProperty('id');
      expect(alert.title).toBe('Test Alert');
      expect(alert.severity).toBe('warning');
    });

    it('should get active alerts', () => {
      const alerts = pathwayAlertNotificationService.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should acknowledge alerts', () => {
      const alert = pathwayAlertNotificationService.createAlert({
        pathwayType: 'api',
        severity: 'info',
        title: 'Ack Test',
        message: 'Testing acknowledgment',
        type: 'throughput',
        details: 'Test details',
        threshold: 50,
        currentValue: 30,
      } as any);
      
      pathwayAlertNotificationService.acknowledgeAlert(alert.id, 'test-user');
      const updated = pathwayAlertNotificationService.getAlert(alert.id);
      expect(updated?.acknowledgedAt).toBeDefined();
    });

    it('should resolve alerts', () => {
      const alert = pathwayAlertNotificationService.createAlert({
        pathwayType: 'websocket',
        severity: 'critical',
        title: 'Resolve Test',
        message: 'Testing resolution',
        type: 'error',
        details: 'Test details',
        threshold: 0,
        currentValue: 5,
      } as any);
      
      pathwayAlertNotificationService.resolveAlert(alert.id, 'test-user');
      const updated = pathwayAlertNotificationService.getAlert(alert.id);
      expect(updated?.resolvedAt).toBeDefined();
    });

    it('should get analytics', () => {
      const analytics = pathwayAlertNotificationService.getAnalytics();
      expect(analytics).toHaveProperty('totalAlerts');
      expect(analytics).toHaveProperty('alertsBySeverity');
      expect(analytics).toHaveProperty('topPathwayIssues');
    });
  });

  describe('A/B Test Reporting Service', () => {
    it('should have default templates', () => {
      const templates = abTestReportingService.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should get all reports', () => {
      const reports = abTestReportingService.getAllReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should generate a report', async () => {
      const report = await abTestReportingService.generateReport(
        'test-experiment',
        'executive-summary',
        { title: 'Test Report', recipients: ['test@example.com'] }
      );
      
      expect(report).toHaveProperty('id');
      expect(report.title).toBe('Test Report');
    });

    it('should get report by id', async () => {
      const report = await abTestReportingService.generateReport(
        'test-exp-2',
        'executive-summary',
        { title: 'Get By ID Test' }
      );
      
      const retrieved = abTestReportingService.getReport(report.id);
      expect(retrieved?.id).toBe(report.id);
    });

    it('should get analytics', () => {
      const analytics = abTestReportingService.getAnalytics();
      expect(analytics).toHaveProperty('totalReports');
      expect(analytics).toHaveProperty('reportsByStatus');
      expect(analytics).toHaveProperty('reportsByFormat');
    });

    it('should have report templates with sections', () => {
      const templates = abTestReportingService.getAllTemplates();
      const template = templates[0];
      expect(template).toHaveProperty('sections');
      expect(template.sections.length).toBeGreaterThan(0);
    });
  });
});
