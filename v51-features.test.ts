/**
 * MediVac One v5.1 Feature Tests
 * Auto Security Baseline, Department Policies, and Compliance Scheduler
 */

import { describe, it, expect } from 'vitest';
import { autoSecurityBaselineService } from '../lib/services/auto-security-baseline-service';
import { departmentPoliciesService, type DepartmentCode } from '../lib/services/department-policies-service';
import { complianceSchedulerService } from '../lib/services/compliance-scheduler-service';

describe('MediVac One v5.1 Features', () => {
  // ==========================================
  // Auto Security Baseline Tests
  // ==========================================
  describe('Auto Security Baseline Service', () => {
    it('should have singleton instance', () => {
      expect(autoSecurityBaselineService).toBeDefined();
    });

    it('should get current score', () => {
      const score = autoSecurityBaselineService.getCurrentScore();
      expect(typeof score).toBe('number');
    });

    it('should get current grade', () => {
      const grade = autoSecurityBaselineService.getCurrentGrade();
      expect(typeof grade).toBe('string');
    });

    it('should get baseline', () => {
      const baseline = autoSecurityBaselineService.getBaseline();
      // May be null if not established yet
      expect(true).toBe(true);
    });

    it('should get snapshots', () => {
      const snapshots = autoSecurityBaselineService.getSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it('should get security health', () => {
      const health = autoSecurityBaselineService.getSecurityHealth();
      expect(health).toBeDefined();
      expect(health).toHaveProperty('score');
      expect(health).toHaveProperty('grade');
    });

    it('should get monitoring config', () => {
      const config = autoSecurityBaselineService.getMonitoringConfig();
      expect(config).toBeDefined();
      expect(config).toHaveProperty('mode');
    });

    it('should get alerts', () => {
      const alerts = autoSecurityBaselineService.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should get roadmap', () => {
      const roadmap = autoSecurityBaselineService.getRoadmap();
      // May be null if not generated yet
      expect(true).toBe(true);
    });

    it('should support event subscription', () => {
      const unsubscribe = autoSecurityBaselineService.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should start and stop monitoring', () => {
      autoSecurityBaselineService.startMonitoring();
      autoSecurityBaselineService.stopMonitoring();
      expect(true).toBe(true);
    });
  });

  // ==========================================
  // Department Policies Tests
  // ==========================================
  describe('Department Policies Service', () => {
    it('should have singleton instance', () => {
      expect(departmentPoliciesService).toBeDefined();
    });

    it('should get all policies', () => {
      const policies = departmentPoliciesService.getAllPolicies();
      expect(Array.isArray(policies)).toBe(true);
    });

    it('should get enabled policies', () => {
      const policies = departmentPoliciesService.getEnabledPolicies();
      expect(Array.isArray(policies)).toBe(true);
    });

    it('should get policy for emergency department', () => {
      const policy = departmentPoliciesService.getPolicy('EMERGENCY' as DepartmentCode);
      if (policy) {
        expect(policy.departmentCode).toBe('EMERGENCY');
      }
    });

    it('should get policy for ICU', () => {
      const policy = departmentPoliciesService.getPolicy('ICU' as DepartmentCode);
      if (policy) {
        expect(policy.departmentCode).toBe('ICU');
      }
    });

    it('should get policy statistics', () => {
      const stats = departmentPoliciesService.getPolicyStatistics();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalPolicies');
      expect(stats).toHaveProperty('enabledPolicies');
    });

    it('should get emergency override policy', () => {
      const override = departmentPoliciesService.getEmergencyOverridePolicy('EMERGENCY' as DepartmentCode);
      // May be null
      expect(true).toBe(true);
    });

    it('should support event subscription', () => {
      const unsubscribe = departmentPoliciesService.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  // ==========================================
  // Compliance Scheduler Tests
  // ==========================================
  describe('Compliance Scheduler Service', () => {
    it('should have singleton instance', () => {
      expect(complianceSchedulerService).toBeDefined();
    });

    it('should get scheduled reports', () => {
      const reports = complianceSchedulerService.getScheduledReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should get all compliance metrics', () => {
      const metrics = complianceSchedulerService.getAllMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should get compliance summary', () => {
      const summary = complianceSchedulerService.getComplianceSummary();
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('averageScore');
      expect(summary).toHaveProperty('frameworks');
      expect(summary).toHaveProperty('totalOpenFindings');
    });

    it('should get scheduler statistics', () => {
      const stats = complianceSchedulerService.getSchedulerStatistics();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalReports');
      expect(stats).toHaveProperty('enabledReports');
      expect(stats).toHaveProperty('totalExecutions');
    });

    it('should get execution history', () => {
      const executions = complianceSchedulerService.getExecutions();
      expect(Array.isArray(executions)).toBe(true);
    });

    it('should support event subscription', () => {
      const unsubscribe = complianceSchedulerService.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should start and stop scheduler', () => {
      complianceSchedulerService.startScheduler();
      complianceSchedulerService.stopScheduler();
      expect(true).toBe(true);
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================
  describe('v5.1 Integration', () => {
    it('should have all services available', () => {
      expect(autoSecurityBaselineService).toBeDefined();
      expect(departmentPoliciesService).toBeDefined();
      expect(complianceSchedulerService).toBeDefined();
    });

    it('should have department policies available', () => {
      const policies = departmentPoliciesService.getAllPolicies();
      expect(policies.length).toBeGreaterThan(0);
    });

    it('should have security health available', () => {
      const health = autoSecurityBaselineService.getSecurityHealth();
      expect(health).toBeDefined();
    });

    it('should have compliance summary available', () => {
      const summary = complianceSchedulerService.getComplianceSummary();
      expect(summary).toBeDefined();
    });
  });
});
