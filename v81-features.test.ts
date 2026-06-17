import { describe, it, expect, beforeEach } from "vitest";
import { appStoreScreenshotsService, DEVICE_FRAMES, STORE_REQUIREMENTS } from "../app-store-screenshots-service";
import { appStoreReviewService } from "../app-store-review-service";

describe("MediVac WACHS v8.1 Features", () => {
  describe("App Store Screenshots Service", () => {
    beforeEach(async () => {
      await appStoreScreenshotsService.initialize();
    });

    it("should get all device frames", () => {
      const frames = appStoreScreenshotsService.getAllDeviceFrames();
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.some(f => f.platform === "ios")).toBe(true);
      expect(frames.some(f => f.platform === "android")).toBe(true);
      expect(frames.some(f => f.platform === "windows")).toBe(true);
    });

    it("should have correct device frame configurations", () => {
      expect(DEVICE_FRAMES.iphone_15_pro_max.width).toBe(1290);
      expect(DEVICE_FRAMES.iphone_15_pro_max.height).toBe(2796);
      expect(DEVICE_FRAMES.pixel_8_pro.platform).toBe("android");
      expect(DEVICE_FRAMES.surface_pro.platform).toBe("windows");
    });

    it("should get device frames by platform", () => {
      const iosFrames = appStoreScreenshotsService.getDeviceFramesByPlatform("ios");
      expect(iosFrames.every(f => f.platform === "ios")).toBe(true);
      
      const androidFrames = appStoreScreenshotsService.getDeviceFramesByPlatform("android");
      expect(androidFrames.every(f => f.platform === "android")).toBe(true);
    });

    it("should have store requirements configured", () => {
      expect(STORE_REQUIREMENTS.google_play.minScreenshots).toBe(2);
      expect(STORE_REQUIREMENTS.google_play.maxScreenshots).toBe(8);
      expect(STORE_REQUIREMENTS.apple_app_store.maxScreenshots).toBe(10);
      expect(STORE_REQUIREMENTS.microsoft_store.aspectRatio).toBe("16:9");
    });

    it("should get store requirements", () => {
      const googleReqs = appStoreScreenshotsService.getStoreRequirements("google_play");
      expect(googleReqs.store).toBe("google_play");
      expect(googleReqs.requiredSizes.length).toBeGreaterThan(0);
    });

    it("should get all screenshots", async () => {
      const screenshots = await appStoreScreenshotsService.getAllScreenshots();
      expect(Array.isArray(screenshots)).toBe(true);
    });

    it("should get analytics", async () => {
      const analytics = await appStoreScreenshotsService.getAnalytics();
      expect(analytics).toHaveProperty("totalScreenshots");
      expect(analytics).toHaveProperty("screenshotSets");
      expect(analytics).toHaveProperty("readySets");
    });

    it("should create screenshot", async () => {
      const screenshot = await appStoreScreenshotsService.createScreenshot({
        name: "Test Screenshot",
        category: "dashboard",
        description: "Test description",
        sourceUrl: "https://example.com/test.png",
        annotations: [],
      });
      
      expect(screenshot.id).toBeDefined();
      expect(screenshot.name).toBe("Test Screenshot");
      expect(screenshot.category).toBe("dashboard");
    });

    it("should validate screenshot set", async () => {
      const set = await appStoreScreenshotsService.createScreenshotSet({
        name: "Test Set",
        store: "google_play",
        screenshots: [],
        deviceType: "pixel_8_pro",
        language: "en-AU",
        status: "draft",
      });

      const validation = appStoreScreenshotsService.validateScreenshotSet(set);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe("App Store Review Service", () => {
    beforeEach(async () => {
      await appStoreReviewService.initialize();
    });

    it("should get all reviews", async () => {
      const reviews = await appStoreReviewService.getAllReviews();
      expect(Array.isArray(reviews)).toBe(true);
    });

    it("should get reviews by store", async () => {
      const googleReviews = await appStoreReviewService.getReviewsByStore("google_play");
      expect(googleReviews.every(r => r.store === "google_play")).toBe(true);
    });

    it("should get reviews by sentiment", async () => {
      const positiveReviews = await appStoreReviewService.getReviewsBySentiment("positive");
      expect(positiveReviews.every(r => r.sentiment === "positive")).toBe(true);
    });

    it("should get all templates", async () => {
      const templates = await appStoreReviewService.getAllTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it("should get templates by category", async () => {
      const bugTemplates = await appStoreReviewService.getTemplatesByCategory("bug_report");
      expect(bugTemplates.every(t => t.category === "bug_report")).toBe(true);
    });

    it("should apply template with variables", async () => {
      const templates = await appStoreReviewService.getAllTemplates();
      const positiveTemplate = templates.find(t => t.category === "positive");
      
      if (positiveTemplate) {
        const result = appStoreReviewService.applyTemplate(positiveTemplate, {
          userName: "Dr. Smith",
        });
        expect(result).toContain("Dr. Smith");
        expect(result).not.toContain("{{userName}}");
      }
    });

    it("should suggest template based on review", async () => {
      const reviews = await appStoreReviewService.getAllReviews();
      const negativeReview = reviews.find(r => r.sentiment === "negative" || r.sentiment === "critical");
      
      if (negativeReview) {
        const suggested = appStoreReviewService.suggestTemplate(negativeReview);
        expect(suggested).toBeDefined();
        expect(["negative", "bug_report"].includes(suggested!.category)).toBe(true);
      }
    });

    it("should get summary stats", async () => {
      const stats = await appStoreReviewService.getSummaryStats();
      expect(stats).toHaveProperty("totalReviews");
      expect(stats).toHaveProperty("averageRating");
      expect(stats).toHaveProperty("pendingResponses");
      expect(stats).toHaveProperty("responseRate");
      expect(stats).toHaveProperty("byStore");
    });

    it("should get analytics", async () => {
      const analytics = await appStoreReviewService.getAnalytics();
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBe(3); // All 3 stores
    });

    it("should get analytics for specific store", async () => {
      const analytics = await appStoreReviewService.getAnalytics("google_play");
      expect(analytics.length).toBe(1);
      expect(analytics[0].store).toBe("google_play");
    });

    it("should create response template", async () => {
      const template = await appStoreReviewService.createTemplate({
        name: "Test Template",
        category: "support",
        content: "Hello {{userName}}, this is a test.",
        variables: ["userName"],
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe("Test Template");
      expect(template.usageCount).toBe(0);
    });

    it("should update review status", async () => {
      const reviews = await appStoreReviewService.getAllReviews();
      if (reviews.length > 0) {
        const updated = await appStoreReviewService.updateReviewStatus(reviews[0].id, "read");
        expect(updated?.status).toBe("read");
      }
    });

    it("should get alerts", async () => {
      const alerts = await appStoreReviewService.getAllAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should get unacknowledged alerts", async () => {
      const alerts = await appStoreReviewService.getUnacknowledgedAlerts();
      expect(alerts.every(a => !a.acknowledged)).toBe(true);
    });
  });
});
