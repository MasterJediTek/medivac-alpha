/**
 * Tests for MediVac WACHS v8.6 Features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { jediTekCalendarService } from '../jeditek-calendar-service';
import { smartwatchCompanionService } from '../smartwatch-companion-service';
import { dashboardWidgetTemplatesService } from '../dashboard-widget-templates-service';

describe('JediTek Calendar Service', () => {
  beforeEach(() => {
    jediTekCalendarService.reset();
  });

  it('should add events to the calendar', () => {
    const event = jediTekCalendarService.addEvent({
      type: 'event',
      title: 'Test Event',
      startDate: Date.now(),
      endDate: Date.now() + 3600000,
    });
    expect(event).toBeDefined();
    expect(event.title).toBe('Test Event');
  });

  it('should generate week view', () => {
    const weekView = jediTekCalendarService.generateWeekView(new Date());
    expect(weekView).toBeDefined();
    expect(weekView.days).toHaveLength(7);
  });

  it('should track medication adherence', () => {
    const medEvent = jediTekCalendarService.addEvent({
      type: 'medication',
      title: 'Take Medicine',
      startDate: Date.now(),
      endDate: Date.now() + 3600000,
      medication: { medicationName: 'Aspirin', dosage: 100, unit: 'mg', taken: false },
    });
    jediTekCalendarService.markMedicationTaken(medEvent.id);
    const updated = jediTekCalendarService.getEvent(medEvent.id);
    expect(updated?.medication?.taken).toBe(true);
  });

  it('should provide analytics', () => {
    const analytics = jediTekCalendarService.getAnalytics();
    expect(analytics).toHaveProperty('totalEvents');
    expect(analytics).toHaveProperty('upcomingEvents');
  });
});

describe('Smartwatch Companion Service', () => {
  beforeEach(() => {
    smartwatchCompanionService.reset();
  });

  it('should pair a device', async () => {
    const device = await smartwatchCompanionService.pairDevice('apple-watch');
    expect(device).toBeDefined();
    expect(device.connectionStatus).toBe('connected');
  });

  it('should record vital readings', () => {
    smartwatchCompanionService.pairDevice('apple-watch');
    const reading = smartwatchCompanionService.recordVital({ type: 'heart-rate', value: 72, unit: 'bpm' });
    expect(reading).toBeDefined();
    expect(reading.value).toBe(72);
  });

  it('should detect abnormal vitals', () => {
    smartwatchCompanionService.pairDevice('apple-watch');
    const highHR = smartwatchCompanionService.recordVital({ type: 'heart-rate', value: 150, unit: 'bpm' });
    expect(highHR.isAbnormal).toBe(true);
  });

  it('should manage emergency contacts', () => {
    const contact = smartwatchCompanionService.addEmergencyContact({ name: 'John Doe', phone: '0400000000', relationship: 'Spouse' });
    expect(contact).toBeDefined();
    expect(contact.name).toBe('John Doe');
  });

  it('should trigger SOS', () => {
    smartwatchCompanionService.pairDevice('apple-watch');
    const result = smartwatchCompanionService.triggerSOS('Test emergency');
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe('triggered');
  });

  it('should update settings', () => {
    const settings = smartwatchCompanionService.updateSettings({ heartRateMonitoring: true });
    expect(settings.heartRateMonitoring).toBe(true);
  });
});

describe('Dashboard Widget Templates Service', () => {
  beforeEach(() => {
    dashboardWidgetTemplatesService.reset();
  });

  it('should have default templates', () => {
    const templates = dashboardWidgetTemplatesService.getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get templates by role', () => {
    const doctorTemplates = dashboardWidgetTemplatesService.getTemplatesByRole('doctor');
    expect(doctorTemplates.length).toBeGreaterThan(0);
  });

  it('should apply a template', () => {
    const templates = dashboardWidgetTemplatesService.getAllTemplates();
    const result = dashboardWidgetTemplatesService.applyTemplate(templates[0].id);
    expect(result.success).toBe(true);
  });

  it('should duplicate a template', () => {
    const templates = dashboardWidgetTemplatesService.getAllTemplates();
    const duplicate = dashboardWidgetTemplatesService.duplicateTemplate(templates[0].id, 'My Custom');
    expect(duplicate).toBeDefined();
    expect(duplicate?.isCustom).toBe(true);
  });

  it('should add widgets', () => {
    const widget = dashboardWidgetTemplatesService.addWidget({
      type: 'calendar',
      title: 'My Calendar',
      size: 'medium',
      position: { row: 0, col: 0 },
      color: '#3498DB',
      icon: '📅',
      refreshInterval: 300,
      visible: true,
      settings: {},
    });
    expect(widget).toBeDefined();
    expect(widget.title).toBe('My Calendar');
  });

  it('should provide role colors', () => {
    const colors = dashboardWidgetTemplatesService.getRoleColors();
    expect(colors).toHaveProperty('doctor');
    expect(colors).toHaveProperty('jedi-commander');
  });
});
