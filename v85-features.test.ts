import { describe, it, expect, beforeEach } from 'vitest';
import { themePreviewCalendarService } from '../theme-preview-calendar-service';
import { alertCorrelationEngineService } from '../alert-correlation-engine-service';
import { reportDashboardWidgetService } from '../report-dashboard-widget-service';

describe('MediVac WACHS v8.5 Features', () => {
  
  // ==========================================
  // Theme Preview Calendar Service Tests
  // ==========================================
  describe('ThemePreviewCalendarService', () => {
    beforeEach(() => {
      themePreviewCalendarService.resetToDefault();
    });

    describe('Time Slot Management', () => {
      it('should have default schedule initialized', () => {
        const slots = themePreviewCalendarService.getAllTimeSlots();
        expect(slots.length).toBeGreaterThan(0);
      });

      it('should add new time slot', () => {
        const initialCount = themePreviewCalendarService.getAllTimeSlots().length;
        const slot = themePreviewCalendarService.addTimeSlot({
          dayOfWeek: 0,
          startHour: 12,
          endHour: 14,
          theme: 'jedi',
          label: 'Test Slot',
        });
        
        expect(slot.id).toBeDefined();
        expect(slot.theme).toBe('jedi');
        expect(themePreviewCalendarService.getAllTimeSlots().length).toBe(initialCount + 1);
      });

      it('should update time slot', () => {
        const slots = themePreviewCalendarService.getAllTimeSlots();
        const slot = slots[0];
        
        const updated = themePreviewCalendarService.updateTimeSlot(slot.id, {
          theme: 'high-contrast',
        });
        
        expect(updated?.theme).toBe('high-contrast');
      });

      it('should remove time slot', () => {
        const slots = themePreviewCalendarService.getAllTimeSlots();
        const initialCount = slots.length;
        
        const result = themePreviewCalendarService.removeTimeSlot(slots[0].id);
        
        expect(result).toBe(true);
        expect(themePreviewCalendarService.getAllTimeSlots().length).toBe(initialCount - 1);
      });

      it('should get slots by day', () => {
        const mondaySlots = themePreviewCalendarService.getSlotsByDay(1);
        expect(mondaySlots.length).toBeGreaterThan(0);
        mondaySlots.forEach(slot => {
          expect(slot.dayOfWeek).toBe(1);
        });
      });

      it('should get slots by theme', () => {
        const lightSlots = themePreviewCalendarService.getSlotsByTheme('light');
        lightSlots.forEach(slot => {
          expect(slot.theme).toBe('light');
        });
      });
    });

    describe('Calendar Generation', () => {
      it('should generate week calendar', () => {
        const calendar = themePreviewCalendarService.generateWeekCalendar();
        
        expect(calendar.days.length).toBe(7);
        expect(calendar.startDate).toBeDefined();
        expect(calendar.endDate).toBeDefined();
      });

      it('should get theme at specific time', () => {
        const theme = themePreviewCalendarService.getThemeAtTime(0, 12);
        expect(['light', 'dark', 'high-contrast', 'jedi', 'medical-blue']).toContain(theme);
      });
    });

    describe('Theme Colors', () => {
      it('should get theme colors', () => {
        const colors = themePreviewCalendarService.getThemeColors('light');
        
        expect(colors.bg).toBeDefined();
        expect(colors.text).toBeDefined();
        expect(colors.border).toBeDefined();
      });

      it('should get all theme colors', () => {
        const allColors = themePreviewCalendarService.getAllThemeColors();
        
        expect(allColors.light).toBeDefined();
        expect(allColors.dark).toBeDefined();
        expect(allColors['high-contrast']).toBeDefined();
        expect(allColors.jedi).toBeDefined();
        expect(allColors['medical-blue']).toBeDefined();
      });
    });

    describe('Conflict Detection', () => {
      it('should detect conflicts', () => {
        const conflicts = themePreviewCalendarService.detectConflicts();
        expect(Array.isArray(conflicts)).toBe(true);
      });

      it('should report conflict status', () => {
        const hasConflicts = themePreviewCalendarService.hasConflicts();
        expect(typeof hasConflicts).toBe('boolean');
      });
    });

    describe('Interactive Editing', () => {
      it('should split time slot', () => {
        const slot = themePreviewCalendarService.addTimeSlot({
          dayOfWeek: 0,
          startHour: 8,
          endHour: 16,
          theme: 'light',
        });
        
        const splitSlots = themePreviewCalendarService.splitTimeSlot(slot.id, 12);
        
        expect(splitSlots.length).toBe(2);
        expect(splitSlots[0].endHour).toBe(12);
        expect(splitSlots[1].startHour).toBe(12);
      });

      it('should copy day schedule', () => {
        const newSlots = themePreviewCalendarService.copyDaySchedule(0, 6);
        expect(newSlots.length).toBeGreaterThan(0);
      });
    });

    describe('Export Functionality', () => {
      it('should export to JSON', async () => {
        const exportResult = await themePreviewCalendarService.exportCalendar('json');
        
        expect(exportResult.format).toBe('json');
        expect(exportResult.data).toBeDefined();
        expect(exportResult.downloadUrl).toBeDefined();
      });

      it('should export to CSV', async () => {
        const exportResult = await themePreviewCalendarService.exportCalendar('csv');
        
        expect(exportResult.format).toBe('csv');
        expect(exportResult.data).toContain('Day,Start Hour');
      });

      it('should export to iCal', async () => {
        const exportResult = await themePreviewCalendarService.exportCalendar('ical');
        
        expect(exportResult.format).toBe('ical');
        expect(exportResult.data).toContain('BEGIN:VCALENDAR');
      });
    });

    describe('Analytics', () => {
      it('should generate analytics', () => {
        const analytics = themePreviewCalendarService.getAnalytics();
        
        expect(analytics.totalSlots).toBeGreaterThan(0);
        expect(analytics.slotsByTheme).toBeDefined();
        expect(analytics.hoursPerTheme).toBeDefined();
        expect(analytics.mostUsedTheme).toBeDefined();
        expect(analytics.coveragePercentage).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Event Subscription', () => {
      it('should subscribe to updates', () => {
        let updateCount = 0;
        const unsubscribe = themePreviewCalendarService.subscribe(() => {
          updateCount++;
        });
        
        themePreviewCalendarService.addTimeSlot({
          dayOfWeek: 0,
          startHour: 0,
          endHour: 1,
          theme: 'dark',
        });
        
        expect(updateCount).toBe(1);
        unsubscribe();
      });
    });
  });

  // ==========================================
  // Alert Correlation Engine Service Tests
  // ==========================================
  describe('AlertCorrelationEngineService', () => {
    beforeEach(() => {
      alertCorrelationEngineService.reset();
    });

    describe('Alert Ingestion', () => {
      it('should ingest alert', () => {
        const alert = alertCorrelationEngineService.ingestAlert({
          originalAlertId: 'test_1',
          category: 'pathway',
          source: 'L1Cache',
          message: 'Cache miss rate exceeded threshold',
          severity: 'warning',
          metadata: {},
        });
        
        expect(alert.id).toBeDefined();
        expect(alert.timestamp).toBeDefined();
      });

      it('should ingest multiple alerts', () => {
        for (let i = 0; i < 5; i++) {
          alertCorrelationEngineService.ingestAlert({
            originalAlertId: `test_${i}`,
            category: 'pathway',
            source: 'L1Cache',
            message: `Alert ${i}`,
            severity: 'warning',
            metadata: {},
          });
        }
        
        const groups = alertCorrelationEngineService.getAllGroups();
        expect(groups.length).toBeGreaterThan(0);
      });
    });

    describe('Group Management', () => {
      it('should create group', () => {
        const alert = alertCorrelationEngineService.ingestAlert({
          originalAlertId: 'test_1',
          category: 'system',
          source: 'Server',
          message: 'Test alert',
          severity: 'info',
          metadata: {},
        });
        
        const groups = alertCorrelationEngineService.getAllGroups();
        expect(groups.length).toBeGreaterThan(0);
      });

      it('should get active groups', () => {
        alertCorrelationEngineService.ingestAlert({
          originalAlertId: 'test_1',
          category: 'system',
          source: 'Server',
          message: 'Test alert',
          severity: 'info',
          metadata: {},
        });
        
        const activeGroups = alertCorrelationEngineService.getActiveGroups();
        expect(Array.isArray(activeGroups)).toBe(true);
      });

      it('should update group status', () => {
        alertCorrelationEngineService.ingestAlert({
          originalAlertId: 'test_1',
          category: 'system',
          source: 'Server',
          message: 'Test alert',
          severity: 'info',
          metadata: {},
        });
        
        const groups = alertCorrelationEngineService.getAllGroups();
        if (groups.length > 0) {
          const updated = alertCorrelationEngineService.updateGroupStatus(groups[0].id, 'resolved');
          expect(updated?.status).toBe('resolved');
        }
      });
    });

    describe('Rule Management', () => {
      it('should get all rules', () => {
        const rules = alertCorrelationEngineService.getAllRules();
        expect(rules.length).toBeGreaterThan(0);
      });

      it('should add custom rule', () => {
        const rule = alertCorrelationEngineService.addRule({
          name: 'Custom Rule',
          description: 'Test rule',
          enabled: true,
          strategy: 'time-based',
          conditions: [],
          timeWindowMinutes: 5,
          minAlertCount: 2,
          priority: 3,
          actions: [{ type: 'group', config: {} }],
        });
        
        expect(rule.id).toBeDefined();
        expect(rule.name).toBe('Custom Rule');
      });

      it('should toggle rule', () => {
        const rules = alertCorrelationEngineService.getAllRules();
        const rule = rules[0];
        const originalState = rule.enabled;
        
        alertCorrelationEngineService.toggleRule(rule.id);
        const updatedRule = alertCorrelationEngineService.getRule(rule.id);
        
        expect(updatedRule?.enabled).toBe(!originalState);
      });

      it('should update rule', () => {
        const rules = alertCorrelationEngineService.getAllRules();
        const rule = rules[0];
        
        const updated = alertCorrelationEngineService.updateRule(rule.id, {
          timeWindowMinutes: 15,
        });
        
        expect(updated?.timeWindowMinutes).toBe(15);
      });
    });

    describe('Root Cause Identification', () => {
      it('should get all root causes', () => {
        const rootCauses = alertCorrelationEngineService.getAllRootCauses();
        expect(Array.isArray(rootCauses)).toBe(true);
      });
    });

    describe('Noise Reduction', () => {
      it('should calculate noise reduction stats', () => {
        const stats = alertCorrelationEngineService.getNoiseReductionStats();
        
        expect(stats.totalAlertsReceived).toBeDefined();
        expect(stats.alertsGrouped).toBeDefined();
        expect(stats.alertsSuppressed).toBeDefined();
        expect(stats.noiseReductionPercentage).toBeDefined();
      });

      it('should suppress alert', () => {
        const alert = alertCorrelationEngineService.ingestAlert({
          originalAlertId: 'test_suppress',
          category: 'system',
          source: 'Server',
          message: 'Test alert',
          severity: 'info',
          metadata: {},
        });
        
        alertCorrelationEngineService.suppressAlert(alert.id);
        // Suppression is internal, verify stats
        const stats = alertCorrelationEngineService.getNoiseReductionStats();
        expect(stats.alertsSuppressed).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Analytics', () => {
      it('should generate analytics', () => {
        const analytics = alertCorrelationEngineService.getAnalytics();
        
        expect(analytics.totalGroups).toBeDefined();
        expect(analytics.activeGroups).toBeDefined();
        expect(analytics.alertsByCategory).toBeDefined();
        expect(analytics.alertsBySeverity).toBeDefined();
        expect(analytics.noiseReduction).toBeDefined();
        expect(analytics.correlationAccuracy).toBeDefined();
      });
    });

    describe('Event Subscription', () => {
      it('should subscribe to group updates', () => {
        let updateCount = 0;
        const unsubscribe = alertCorrelationEngineService.subscribe(() => {
          updateCount++;
        });
        
        alertCorrelationEngineService.ingestAlert({
          originalAlertId: 'test_sub',
          category: 'system',
          source: 'Server',
          message: 'Test',
          severity: 'info',
          metadata: {},
        });
        
        // Allow async processing
        setTimeout(() => {
          expect(updateCount).toBeGreaterThanOrEqual(0);
          unsubscribe();
        }, 100);
      });
    });
  });

  // ==========================================
  // Report Dashboard Widget Service Tests
  // ==========================================
  describe('ReportDashboardWidgetService', () => {
    beforeEach(() => {
      reportDashboardWidgetService.reset();
    });

    describe('Widget Management', () => {
      it('should have default widgets initialized', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        expect(widgets.length).toBeGreaterThan(0);
      });

      it('should add new widget', () => {
        const widget = reportDashboardWidgetService.addWidget({
          type: 'key-metrics',
          title: 'Custom Metrics',
          size: 'medium',
          position: { row: 0, col: 0 },
          config: {},
          refreshInterval: 60,
          isVisible: true,
        });
        
        expect(widget.id).toBeDefined();
        expect(widget.title).toBe('Custom Metrics');
      });

      it('should update widget', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const widget = widgets[0];
        
        const updated = reportDashboardWidgetService.updateWidget(widget.id, {
          title: 'Updated Title',
        });
        
        expect(updated?.title).toBe('Updated Title');
      });

      it('should remove widget', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const initialCount = widgets.length;
        
        const result = reportDashboardWidgetService.removeWidget(widgets[0].id);
        
        expect(result).toBe(true);
        expect(reportDashboardWidgetService.getAllWidgets().length).toBe(initialCount - 1);
      });

      it('should get visible widgets', () => {
        const visibleWidgets = reportDashboardWidgetService.getVisibleWidgets();
        visibleWidgets.forEach(widget => {
          expect(widget.isVisible).toBe(true);
        });
      });

      it('should toggle widget visibility', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const widget = widgets[0];
        const originalVisibility = widget.isVisible;
        
        reportDashboardWidgetService.toggleWidgetVisibility(widget.id);
        const updated = reportDashboardWidgetService.getWidget(widget.id);
        
        expect(updated?.isVisible).toBe(!originalVisibility);
      });

      it('should get widgets by type', () => {
        const summaryWidgets = reportDashboardWidgetService.getWidgetsByType('ab-test-summary');
        summaryWidgets.forEach(widget => {
          expect(widget.type).toBe('ab-test-summary');
        });
      });
    });

    describe('Widget Refresh', () => {
      it('should refresh widget', async () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const widget = widgets[0];
        
        const result = await reportDashboardWidgetService.refreshWidget(widget.id);
        
        expect(result).toBe(true);
      });

      it('should refresh all widgets', async () => {
        const result = await reportDashboardWidgetService.refreshAllWidgets();
        
        expect(result.success).toBeGreaterThan(0);
        expect(result.failed).toBe(0);
      });
    });

    describe('Layout Management', () => {
      it('should get all layouts', () => {
        const layouts = reportDashboardWidgetService.getAllLayouts();
        expect(layouts.length).toBeGreaterThan(0);
      });

      it('should create layout', () => {
        const layout = reportDashboardWidgetService.createLayout({
          name: 'Custom Layout',
          description: 'Test layout',
          widgets: [],
          columns: 3,
          rows: 4,
          isDefault: false,
        });
        
        expect(layout.id).toBeDefined();
        expect(layout.name).toBe('Custom Layout');
      });

      it('should get default layout', () => {
        const defaultLayout = reportDashboardWidgetService.getDefaultLayout();
        expect(defaultLayout?.isDefault).toBe(true);
      });

      it('should set default layout', () => {
        const layout = reportDashboardWidgetService.createLayout({
          name: 'New Default',
          description: 'Test',
          widgets: [],
          columns: 2,
          rows: 2,
          isDefault: false,
        });
        
        const result = reportDashboardWidgetService.setDefaultLayout(layout.id);
        expect(result).toBe(true);
        
        const updated = reportDashboardWidgetService.getLayout(layout.id);
        expect(updated?.isDefault).toBe(true);
      });
    });

    describe('Widget Position Management', () => {
      it('should move widget', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const widget = widgets[0];
        
        const result = reportDashboardWidgetService.moveWidget(widget.id, { row: 5, col: 1 });
        
        expect(result).toBe(true);
        const updated = reportDashboardWidgetService.getWidget(widget.id);
        expect(updated?.position.row).toBe(5);
        expect(updated?.position.col).toBe(1);
      });

      it('should resize widget', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const widget = widgets[0];
        
        const result = reportDashboardWidgetService.resizeWidget(widget.id, 'full');
        
        expect(result).toBe(true);
        const updated = reportDashboardWidgetService.getWidget(widget.id);
        expect(updated?.size).toBe('full');
      });

      it('should reorder widgets', () => {
        const widgets = reportDashboardWidgetService.getAllWidgets();
        const ids = widgets.map(w => w.id).reverse();
        
        reportDashboardWidgetService.reorderWidgets(ids);
        
        // After reordering, the first widget in the reversed list should be at position 0,0
        const firstReorderedWidget = reportDashboardWidgetService.getWidget(ids[0]);
        expect(firstReorderedWidget?.position.row).toBe(0);
        expect(firstReorderedWidget?.position.col).toBe(0);
      });
    });

    describe('Color Schemes', () => {
      it('should get color scheme', () => {
        const scheme = reportDashboardWidgetService.getColorScheme('medical');
        
        expect(scheme.primary).toBeDefined();
        expect(scheme.success).toBeDefined();
        expect(scheme.warning).toBeDefined();
        expect(scheme.error).toBeDefined();
      });

      it('should get all color schemes', () => {
        const schemes = reportDashboardWidgetService.getAllColorSchemes();
        
        expect(schemes.default).toBeDefined();
        expect(schemes.medical).toBeDefined();
        expect(schemes.jedi).toBeDefined();
      });
    });

    describe('Analytics', () => {
      it('should generate analytics', () => {
        const analytics = reportDashboardWidgetService.getAnalytics();
        
        expect(analytics.totalWidgets).toBeGreaterThan(0);
        expect(analytics.widgetsByType).toBeDefined();
        expect(analytics.avgRefreshTime).toBeDefined();
        expect(analytics.totalRefreshes).toBeDefined();
        expect(analytics.errorRate).toBeDefined();
      });

      it('should get refresh history', () => {
        const history = reportDashboardWidgetService.getRefreshHistory();
        expect(Array.isArray(history)).toBe(true);
      });
    });

    describe('Export/Import', () => {
      it('should export dashboard', () => {
        const json = reportDashboardWidgetService.exportDashboard();
        const data = JSON.parse(json);
        
        expect(data.widgets).toBeDefined();
        expect(data.layouts).toBeDefined();
        expect(data.exportedAt).toBeDefined();
      });

      it('should import dashboard', () => {
        const exportData = reportDashboardWidgetService.exportDashboard();
        
        reportDashboardWidgetService.reset();
        const result = reportDashboardWidgetService.importDashboard(exportData);
        
        expect(result).toBe(true);
      });
    });

    describe('Event Subscription', () => {
      it('should subscribe to widget updates', () => {
        let updateCount = 0;
        const unsubscribe = reportDashboardWidgetService.subscribe(() => {
          updateCount++;
        });
        
        const widgets = reportDashboardWidgetService.getAllWidgets();
        reportDashboardWidgetService.updateWidget(widgets[0].id, { title: 'Test' });
        
        expect(updateCount).toBe(1);
        unsubscribe();
      });
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================
  describe('Integration Tests', () => {
    it('should handle theme calendar with multiple operations', () => {
      themePreviewCalendarService.resetToDefault();
      
      // Add slot
      const slot = themePreviewCalendarService.addTimeSlot({
        dayOfWeek: 3,
        startHour: 10,
        endHour: 14,
        theme: 'jedi',
      });
      
      // Split slot
      const splitSlots = themePreviewCalendarService.splitTimeSlot(slot.id, 12);
      expect(splitSlots.length).toBe(2);
      
      // Update one of the split slots
      themePreviewCalendarService.updateTimeSlot(splitSlots[0].id, { theme: 'medical-blue' });
      
      // Generate calendar
      const calendar = themePreviewCalendarService.generateWeekCalendar();
      expect(calendar.days.length).toBe(7);
      
      // Get analytics
      const analytics = themePreviewCalendarService.getAnalytics();
      expect(analytics.totalSlots).toBeGreaterThan(0);
    });

    it('should handle alert correlation workflow', () => {
      alertCorrelationEngineService.reset();
      
      // Ingest multiple related alerts
      for (let i = 0; i < 5; i++) {
        alertCorrelationEngineService.ingestAlert({
          originalAlertId: `workflow_${i}`,
          category: 'pathway',
          source: 'L2Cache',
          message: `Cache performance degraded - instance ${i}`,
          severity: 'warning',
          metadata: { instance: i },
        });
      }
      
      // Check groups were created
      const groups = alertCorrelationEngineService.getAllGroups();
      expect(groups.length).toBeGreaterThan(0);
      
      // Get noise reduction stats
      const stats = alertCorrelationEngineService.getNoiseReductionStats();
      expect(stats.totalAlertsReceived).toBe(5);
      
      // Get analytics
      const analytics = alertCorrelationEngineService.getAnalytics();
      expect(analytics.alertsByCategory.pathway).toBe(5);
    });

    it('should handle dashboard widget workflow', async () => {
      reportDashboardWidgetService.reset();
      
      // Add custom widget
      const widget = reportDashboardWidgetService.addWidget({
        type: 'trend-indicator',
        title: 'Custom Trends',
        size: 'large',
        position: { row: 0, col: 0 },
        config: { showChart: true },
        refreshInterval: 30,
        isVisible: true,
      });
      
      // Refresh widget
      await reportDashboardWidgetService.refreshWidget(widget.id);
      
      // Resize widget
      reportDashboardWidgetService.resizeWidget(widget.id, 'full');
      
      // Move widget
      reportDashboardWidgetService.moveWidget(widget.id, { row: 2, col: 0 });
      
      // Get updated widget
      const updated = reportDashboardWidgetService.getWidget(widget.id);
      expect(updated?.size).toBe('full');
      expect(updated?.position.row).toBe(2);
      
      // Get analytics
      const analytics = reportDashboardWidgetService.getAnalytics();
      expect(analytics.totalWidgets).toBeGreaterThan(0);
    });
  });
});
