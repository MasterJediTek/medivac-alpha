/**
 * Tests for MediVac WACHS v8.7 Features
 * Voice Commands, Calendar Widget Sync, and Smartwatch Face Designer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { voiceCommandsService } from '../voice-commands-service';
import { calendarWidgetSyncService } from '../calendar-widget-sync-service';
import { smartwatchFaceDesignerService } from '../smartwatch-face-designer-service';

describe('Voice Commands Service', () => {
  beforeEach(() => {
    voiceCommandsService.reset();
  });

  describe('State Management', () => {
    it('should start in idle state', () => {
      expect(voiceCommandsService.getState()).toBe('idle');
    });

    it('should transition to listening state', () => {
      voiceCommandsService.startListening();
      expect(voiceCommandsService.getState()).toBe('listening');
    });

    it('should stop listening and return to idle', () => {
      voiceCommandsService.startListening();
      voiceCommandsService.stopListening();
      expect(voiceCommandsService.getState()).toBe('idle');
    });
  });

  describe('Command Processing', () => {
    it('should process calendar commands', () => {
      const result = voiceCommandsService.processCommand('create event meeting tomorrow at 3pm');
      expect(result.type).toBe('create-event');
      expect(result.result?.success).toBe(true);
    });

    it('should process medication commands', () => {
      const result = voiceCommandsService.processCommand('I took my medication');
      expect(result.type).toBe('mark-medication');
      expect(result.result?.success).toBe(true);
    });

    it('should process SOS commands', () => {
      const result = voiceCommandsService.processCommand('help');
      expect(result.type).toBe('trigger-sos');
      expect(result.result?.success).toBe(true);
    });

    it('should process timer commands', () => {
      const result = voiceCommandsService.processCommand('set timer for 5 minutes');
      expect(result.type).toBe('set-timer');
      expect(result.result?.success).toBe(true);
    });

    it('should handle unknown commands', () => {
      const result = voiceCommandsService.processCommand('random gibberish xyz');
      expect(result.type).toBe('custom');
      expect(result.result?.success).toBe(false);
    });
  });

  describe('Command History', () => {
    it('should record command history', () => {
      voiceCommandsService.processCommand('create event test');
      const history = voiceCommandsService.getCommandHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].transcript).toBe('create event test');
    });

    it('should clear history', () => {
      voiceCommandsService.processCommand('test command');
      voiceCommandsService.clearHistory();
      expect(voiceCommandsService.getCommandHistory().length).toBe(0);
    });
  });

  describe('Training Phrases', () => {
    it('should have training phrases', () => {
      const phrases = voiceCommandsService.getTrainingPhrases();
      expect(phrases.length).toBeGreaterThan(0);
    });

    it('should train a phrase', () => {
      const phrases = voiceCommandsService.getTrainingPhrases();
      const phraseId = phrases[0].id;
      voiceCommandsService.trainPhrase(phraseId);
      const updated = voiceCommandsService.getTrainingPhrases().find(p => p.id === phraseId);
      expect(updated?.trained).toBe(true);
    });
  });

  describe('Waveform Generation', () => {
    it('should generate mock waveform', () => {
      const waveform = voiceCommandsService.generateMockWaveform();
      expect(waveform.length).toBeGreaterThan(0);
      waveform.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Analytics', () => {
    it('should track analytics', () => {
      voiceCommandsService.processCommand('test command');
      const analytics = voiceCommandsService.getAnalytics();
      expect(analytics.totalCommands).toBeGreaterThan(0);
    });
  });
});

describe('Calendar Widget Sync Service', () => {
  beforeEach(() => {
    calendarWidgetSyncService.reset();
  });

  describe('Widget Management', () => {
    it('should have default widgets', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should get widget by id', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const widget = calendarWidgetSyncService.getWidget(widgets[0].id);
      expect(widget).toBeDefined();
      expect(widget?.id).toBe(widgets[0].id);
    });

    it('should add a new widget', () => {
      const initialCount = calendarWidgetSyncService.getAllWidgets().length;
      calendarWidgetSyncService.addWidget({
        type: 'upcoming-events',
        title: 'Test Widget',
        position: { row: 0, col: 0 },
        size: 'medium',
        events: [],
        refreshInterval: 60000,
        animations: {
          onSync: 'pulse',
          onNewEvent: 'glow',
          onEventStart: 'bounce',
          onEventEnd: 'fade',
          onCountdown: 'pulse',
          pulseInterval: 2000,
          glowColor: '#1ABC9C',
          particleEffects: true,
        },
        style: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
          borderWidth: 1,
          borderRadius: 16,
          shadowColor: '#000000',
          shadowBlur: 10,
          shadowOffset: { x: 0, y: 4 },
          opacity: 1,
          blur: 0,
        },
      });
      expect(calendarWidgetSyncService.getAllWidgets().length).toBe(initialCount + 1);
    });

    it('should remove a widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const initialCount = widgets.length;
      calendarWidgetSyncService.removeWidget(widgets[0].id);
      expect(calendarWidgetSyncService.getAllWidgets().length).toBe(initialCount - 1);
    });

    it('should move a widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const result = calendarWidgetSyncService.moveWidget(widgets[0].id, { row: 5, col: 5 });
      expect(result).toBe(true);
      const updated = calendarWidgetSyncService.getWidget(widgets[0].id);
      expect(updated?.position.row).toBe(5);
      expect(updated?.position.col).toBe(5);
    });

    it('should resize a widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const result = calendarWidgetSyncService.resizeWidget(widgets[0].id, 'large');
      expect(result).toBe(true);
      const updated = calendarWidgetSyncService.getWidget(widgets[0].id);
      expect(updated?.size).toBe('large');
    });
  });

  describe('Widget Sync', () => {
    it('should sync a widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const result = calendarWidgetSyncService.syncWidget(widgets[0].id);
      expect(result.success).toBe(true);
      expect(result.effect).toBeDefined();
      expect(result.sound).toBeDefined();
    });

    it('should sync all widgets', () => {
      const result = calendarWidgetSyncService.syncAllWidgets();
      expect(result.synced).toBeGreaterThan(0);
    });
  });

  describe('Event Management', () => {
    it('should add event to widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const result = calendarWidgetSyncService.addEventToWidget(widgets[0].id, {
        calendarEventId: 'cal-123',
        title: 'Test Event',
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 7200000,
        type: 'meeting',
        color: '#3498DB',
        icon: '📅',
        priority: 'medium',
        isAllDay: false,
        reminders: [15],
      });
      expect(result).not.toBeNull();
      expect(result?.event.title).toBe('Test Event');
    });

    it('should remove event from widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const widget = widgets.find(w => w.events.length > 0);
      if (widget && widget.events.length > 0) {
        const result = calendarWidgetSyncService.removeEventFromWidget(widget.id, widget.events[0].id);
        expect(result).toBe(true);
      }
    });
  });

  describe('Mini Calendar', () => {
    it('should generate mini calendar', () => {
      const days = calendarWidgetSyncService.generateMiniCalendar(2026, 1);
      expect(days.length).toBe(42); // 6 weeks * 7 days
      expect(days.some(d => d.isToday)).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('should add notification to widget', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      const notification = calendarWidgetSyncService.addNotification(widgets[0].id, {
        eventId: 'event-123',
        type: 'badge',
        message: 'Test notification',
        animation: 'pulse',
      });
      expect(notification).not.toBeNull();
      expect(notification?.message).toBe('Test notification');
    });

    it('should count unread notifications', () => {
      const widgets = calendarWidgetSyncService.getAllWidgets();
      calendarWidgetSyncService.addNotification(widgets[0].id, {
        eventId: 'event-123',
        type: 'badge',
        message: 'Test',
        animation: 'pulse',
      });
      const count = calendarWidgetSyncService.getUnreadNotificationCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Export/Import', () => {
    it('should export widget layout', () => {
      const json = calendarWidgetSyncService.exportWidgetLayout();
      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed.widgets).toBeDefined();
    });

    it('should import widget layout', () => {
      const json = calendarWidgetSyncService.exportWidgetLayout();
      const result = calendarWidgetSyncService.importWidgetLayout(json);
      expect(result.success).toBe(true);
      expect(result.widgetsImported).toBeGreaterThan(0);
    });
  });
});

describe('Smartwatch Face Designer Service', () => {
  beforeEach(() => {
    smartwatchFaceDesignerService.reset();
  });

  describe('Face Management', () => {
    it('should have default faces', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      expect(faces.length).toBeGreaterThan(0);
    });

    it('should get face by id', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const face = smartwatchFaceDesignerService.getFace(faces[0].id);
      expect(face).toBeDefined();
      expect(face?.id).toBe(faces[0].id);
    });

    it('should create a new face', () => {
      const initialCount = smartwatchFaceDesignerService.getAllFaces().length;
      smartwatchFaceDesignerService.createFace({
        name: 'Test Face',
        style: 'digital',
        backgroundColor: '#000000',
        complications: [],
        animations: {
          onWake: 'fade',
          onSleep: 'fade',
          ambient: 'none',
          onNotification: 'pulse',
          transitionDuration: 200,
        },
        colors: {
          name: 'Test',
          primary: '#0066FF',
          secondary: '#00BFFF',
          accent: '#00FFFF',
          background: '#0A1628',
          surface: '#1A2F4A',
          text: '#FFFFFF',
          textSecondary: '#8BA3C7',
          success: '#00FF88',
          warning: '#FFB800',
          error: '#FF3366',
          glow: '#00BFFF',
        },
        isDefault: false,
        isCustom: true,
      });
      expect(smartwatchFaceDesignerService.getAllFaces().length).toBe(initialCount + 1);
    });

    it('should duplicate a face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const duplicate = smartwatchFaceDesignerService.duplicateFace(faces[0].id, 'Duplicate Face');
      expect(duplicate).toBeDefined();
      expect(duplicate?.name).toBe('Duplicate Face');
      expect(duplicate?.isCustom).toBe(true);
    });

    it('should delete a face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const initialCount = faces.length;
      smartwatchFaceDesignerService.deleteFace(faces[0].id);
      expect(smartwatchFaceDesignerService.getAllFaces().length).toBe(initialCount - 1);
    });
  });

  describe('Complication Management', () => {
    it('should add complication to face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const comp = smartwatchFaceDesignerService.addComplication(faces[0].id, {
        type: 'heart-rate',
        position: { zone: 'top-left', x: 20, y: 20, rotation: 0 },
        size: 'medium',
        shape: 'circular',
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          foregroundColor: '#FFFFFF',
          accentColor: '#FF3366',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          opacity: 1,
          blur: 0,
          glow: true,
          glowColor: '#FF3366',
          glowIntensity: 0.5,
          shadow: true,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          shadowBlur: 4,
          font: 'SF Pro',
          fontSize: 14,
          fontWeight: 'normal',
        },
      });
      expect(comp).not.toBeNull();
      expect(comp?.type).toBe('heart-rate');
    });

    it('should remove complication from face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const face = faces.find(f => f.complications.length > 0);
      if (face && face.complications.length > 0) {
        const result = smartwatchFaceDesignerService.removeComplication(face.id, face.complications[0].id);
        expect(result).toBe(true);
      }
    });

    it('should move complication', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const face = faces.find(f => f.complications.length > 0);
      if (face && face.complications.length > 0) {
        const result = smartwatchFaceDesignerService.moveComplication(face.id, face.complications[0].id, { x: 50, y: 50 });
        expect(result).toBe(true);
      }
    });
  });

  describe('Templates', () => {
    it('should have templates', () => {
      const templates = smartwatchFaceDesignerService.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should filter templates by category', () => {
      const jediTemplates = smartwatchFaceDesignerService.getTemplatesByCategory('jedi');
      expect(jediTemplates.length).toBeGreaterThan(0);
      jediTemplates.forEach(t => expect(t.category).toBe('jedi'));
    });

    it('should apply template', () => {
      const templates = smartwatchFaceDesignerService.getAllTemplates();
      const newFace = smartwatchFaceDesignerService.applyTemplate(templates[0].id);
      expect(newFace).toBeDefined();
      expect(newFace?.isCustom).toBe(true);
    });
  });

  describe('Color Themes', () => {
    it('should have JEDI color themes', () => {
      const themes = smartwatchFaceDesignerService.getColorThemes();
      expect(Object.keys(themes).length).toBeGreaterThan(0);
      expect(themes['jedi-blue']).toBeDefined();
    });

    it('should apply color theme', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const result = smartwatchFaceDesignerService.applyColorTheme(faces[0].id, 'sith-red');
      expect(result).toBe(true);
      const updated = smartwatchFaceDesignerService.getFace(faces[0].id);
      expect(updated?.colors.name).toBe('Sith Red');
    });
  });

  describe('Designer State', () => {
    it('should manage designer state', () => {
      const state = smartwatchFaceDesignerService.getState();
      expect(state.zoom).toBe(1);
      expect(state.showGrid).toBe(true);
    });

    it('should select face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      smartwatchFaceDesignerService.selectFace(faces[0].id);
      const state = smartwatchFaceDesignerService.getState();
      expect(state.selectedFace).toBe(faces[0].id);
    });

    it('should set preview mode', () => {
      smartwatchFaceDesignerService.setPreviewMode('live');
      const state = smartwatchFaceDesignerService.getState();
      expect(state.previewMode).toBe('live');
    });
  });

  describe('Preview Generation', () => {
    it('should generate ASCII preview', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const preview = smartwatchFaceDesignerService.generatePreview(faces[0].id);
      expect(preview).toBeDefined();
      expect(preview.length).toBeGreaterThan(0);
      expect(preview).toContain('┌');
      expect(preview).toContain('┘');
    });
  });

  describe('Export/Import', () => {
    it('should export face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const json = smartwatchFaceDesignerService.exportFace(faces[0].id);
      expect(json).not.toBeNull();
      const parsed = JSON.parse(json!);
      expect(parsed.name).toBe(faces[0].name);
    });

    it('should import face', () => {
      const faces = smartwatchFaceDesignerService.getAllFaces();
      const json = smartwatchFaceDesignerService.exportFace(faces[0].id);
      const imported = smartwatchFaceDesignerService.importFace(json!);
      expect(imported).not.toBeNull();
      expect(imported?.isCustom).toBe(true);
    });
  });
});
