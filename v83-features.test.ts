/**
 * Tests for MediVac WACHS v8.3 Features
 * - Theme Switching Service
 * - Pathway Animation Service
 * - A/B Test Rotation Service
 */

import { describe, it, expect, beforeEach } from "vitest";
import { themeSwitchingService } from "../theme-switching-service";
import { pathwayAnimationService } from "../pathway-animation-service";
import { abTestRotationService } from "../ab-test-rotation-service";

describe("Theme Switching Service", () => {
  it("should have default themes available", () => {
    const themes = themeSwitchingService.getAllThemes();
    expect(themes.length).toBeGreaterThan(0);
  });

  it("should return current theme", () => {
    const theme = themeSwitchingService.getCurrentTheme();
    expect(theme).toBeDefined();
    expect(theme!.id).toBeDefined();
    expect(theme!.name).toBeDefined();
    expect(theme!.colors).toBeDefined();
  });

  it("should have required color properties in themes", () => {
    const theme = themeSwitchingService.getCurrentTheme();
    expect(theme!.colors.primary).toBeDefined();
    expect(theme!.colors.background).toBeDefined();
    expect(theme!.colors.foreground).toBeDefined();
    expect(theme!.colors.surface).toBeDefined();
  });

  it("should switch themes", async () => {
    const themes = themeSwitchingService.getAllThemes();
    if (themes.length > 1) {
      const targetTheme = themes[1];
      await themeSwitchingService.switchTheme(targetTheme.id);
      const current = themeSwitchingService.getCurrentTheme();
      expect(current!.id).toBe(targetTheme.id);
    }
  });

  it("should support theme preview", () => {
    const themes = themeSwitchingService.getAllThemes();
    if (themes.length > 0) {
      themeSwitchingService.startPreview(themes[0].id);
      themeSwitchingService.endPreview(false);
      // Should not throw
    }
  });

  it("should provide theme analytics", () => {
    const analytics = themeSwitchingService.getThemeAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalThemes).toBeGreaterThan(0);
  });
});

describe("Pathway Animation Service", () => {
  it("should have pathway nodes defined", () => {
    const nodes = pathwayAnimationService.getNodes();
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("should have node properties", () => {
    const nodes = pathwayAnimationService.getNodes();
    const node = nodes[0];
    expect(node.id).toBeDefined();
    expect(node.name).toBeDefined();
    expect(node.type).toBeDefined();
    expect(node.color).toBeDefined();
    expect(node.state).toBeDefined();
  });

  it("should track active animations", () => {
    const animations = pathwayAnimationService.getActiveAnimations();
    expect(Array.isArray(animations)).toBe(true);
  });

  it("should simulate data flow", () => {
    const initialNodes = pathwayAnimationService.getNodes();
    pathwayAnimationService.simulateDataFlow();
    const updatedNodes = pathwayAnimationService.getNodes();
    // Nodes should still exist after simulation
    expect(updatedNodes.length).toBe(initialNodes.length);
  });

  it("should provide analytics", () => {
    const analytics = pathwayAnimationService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalNodes).toBeGreaterThan(0);
  });

  it("should track bottleneck alerts", () => {
    const alerts = pathwayAnimationService.getBottleneckAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should resolve alerts", () => {
    const alerts = pathwayAnimationService.getBottleneckAlerts();
    if (alerts.length > 0) {
      pathwayAnimationService.resolveAlert(alerts[0].id);
      // Should not throw
    }
  });
});

describe("A/B Test Rotation Service", () => {
  it("should have rotation schedules", () => {
    const schedules = abTestRotationService.getAllSchedules();
    expect(schedules.length).toBeGreaterThan(0);
  });

  it("should have schedule properties", () => {
    const schedules = abTestRotationService.getAllSchedules();
    const schedule = schedules[0];
    expect(schedule.id).toBeDefined();
    expect(schedule.name).toBeDefined();
    expect(schedule.strategy).toBeDefined();
    expect(schedule.isEnabled).toBeDefined();
  });

  it("should get variants for schedule", () => {
    const schedules = abTestRotationService.getAllSchedules();
    if (schedules.length > 0) {
      const variants = abTestRotationService.getVariants(schedules[0].id);
      expect(Array.isArray(variants)).toBe(true);
    }
  });

  it("should have variant properties", () => {
    const schedules = abTestRotationService.getAllSchedules();
    if (schedules.length > 0) {
      const variants = abTestRotationService.getVariants(schedules[0].id);
      if (variants.length > 0) {
        const variant = variants[0];
        expect(variant.id).toBeDefined();
        expect(variant.name).toBeDefined();
        expect(variant.weight).toBeDefined();
        expect(variant.impressions).toBeDefined();
        expect(variant.installs).toBeDefined();
      }
    }
  });

  it("should perform rotation", () => {
    const schedules = abTestRotationService.getAllSchedules();
    if (schedules.length > 0) {
      abTestRotationService.performRotation(schedules[0].id);
      // Should not throw
    }
  });

  it("should track rotation history", () => {
    const schedules = abTestRotationService.getAllSchedules();
    if (schedules.length > 0) {
      const history = abTestRotationService.getRotationHistory(schedules[0].id);
      expect(Array.isArray(history)).toBe(true);
    }
  });

  it("should provide analytics", () => {
    const schedules = abTestRotationService.getAllSchedules();
    if (schedules.length > 0) {
      const analytics = abTestRotationService.getAnalytics(schedules[0].id);
      expect(analytics).toBeDefined();
      expect(analytics!.totalRotations).toBeDefined();
    }
  });

  it("should update schedule", () => {
    const schedules = abTestRotationService.getAllSchedules();
    if (schedules.length > 0) {
      abTestRotationService.updateSchedule(schedules[0].id, { isEnabled: true });
      const updated = abTestRotationService.getAllSchedules().find(s => s.id === schedules[0].id);
      expect(updated?.isEnabled).toBe(true);
    }
  });
});
