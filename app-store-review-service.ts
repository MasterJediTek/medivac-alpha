/**
 * App Store Review Response Service
 * Monitors and manages reviews across Google Play, Apple App Store, and Microsoft Store
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Review types
export type StoreType = "google_play" | "apple_app_store" | "microsoft_store";
export type ReviewSentiment = "positive" | "neutral" | "negative" | "critical";
export type ReviewStatus = "new" | "read" | "responded" | "escalated" | "resolved";
export type ResponseStatus = "draft" | "pending_approval" | "approved" | "published" | "rejected";

export interface AppReview {
  id: string;
  store: StoreType;
  authorName: string;
  authorId: string;
  rating: number; // 1-5 stars
  title?: string;
  content: string;
  version: string;
  device?: string;
  language: string;
  sentiment: ReviewSentiment;
  status: ReviewStatus;
  response?: ReviewResponse;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  content: string;
  authorId: string;
  authorName: string;
  status: ResponseStatus;
  templateId?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: "positive" | "neutral" | "negative" | "bug_report" | "feature_request" | "support";
  content: string;
  variables: string[]; // e.g., ["userName", "appVersion", "issueType"]
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

export interface ReviewAlert {
  id: string;
  type: "negative_review" | "rating_drop" | "review_spike" | "escalation";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  reviewId?: string;
  store?: StoreType;
  acknowledged: boolean;
  createdAt: string;
}

export interface ReviewAnalytics {
  store: StoreType;
  period: "day" | "week" | "month" | "year";
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentBreakdown: Record<ReviewSentiment, number>;
  responseRate: number;
  averageResponseTime: number; // hours
  topTags: { tag: string; count: number }[];
}

// Default response templates
const DEFAULT_TEMPLATES: Omit<ResponseTemplate, "id" | "usageCount" | "createdAt">[] = [
  {
    name: "Thank You - Positive Review",
    category: "positive",
    content: "Thank you so much for your wonderful review, {{userName}}! We're thrilled to hear that MediVac WACHS is helping with your healthcare management. Your feedback motivates our team at JediTek to keep improving. If you have any suggestions, we'd love to hear them!",
    variables: ["userName"],
  },
  {
    name: "Acknowledgment - Neutral Review",
    category: "neutral",
    content: "Hi {{userName}}, thank you for taking the time to share your experience with MediVac WACHS. We appreciate your honest feedback and are always looking for ways to improve. If there's anything specific we can do to enhance your experience, please let us know at support@jeditek.com.au",
    variables: ["userName"],
  },
  {
    name: "Apology - Negative Experience",
    category: "negative",
    content: "Hi {{userName}}, we're truly sorry to hear about your experience. This isn't the standard we strive for at JediTek. We'd like to make this right. Could you please contact our support team at support@jeditek.com.au with details about {{issueType}}? We're committed to resolving this for you.",
    variables: ["userName", "issueType"],
  },
  {
    name: "Bug Report Response",
    category: "bug_report",
    content: "Hi {{userName}}, thank you for reporting this issue. Our development team is aware of the {{issueType}} problem in version {{appVersion}} and is working on a fix. We expect to release an update soon. We appreciate your patience and will notify you when the fix is available.",
    variables: ["userName", "issueType", "appVersion"],
  },
  {
    name: "Feature Request Acknowledgment",
    category: "feature_request",
    content: "Hi {{userName}}, thank you for your feature suggestion! We love hearing ideas from our users. Your request for {{featureName}} has been added to our product roadmap for consideration. Keep an eye on our updates - you might see it in a future release!",
    variables: ["userName", "featureName"],
  },
  {
    name: "Support Redirect",
    category: "support",
    content: "Hi {{userName}}, we're sorry you're experiencing difficulties. For personalized assistance, please contact our support team directly at support@jeditek.com.au or visit our help center at https://jedi.church. We're here to help you get the most out of MediVac WACHS.",
    variables: ["userName"],
  },
];

// Sample reviews for demonstration
const SAMPLE_REVIEWS: Omit<AppReview, "id" | "createdAt" | "updatedAt">[] = [
  {
    store: "google_play",
    authorName: "Dr. Sarah Mitchell",
    authorId: "user_gp_001",
    rating: 5,
    title: "Essential for rural healthcare",
    content: "MediVac WACHS has transformed how we manage patients in remote WA. The JEDI integration is seamless and the offline mode is a lifesaver when connectivity is limited. Highly recommend for any WACHS facility!",
    version: "8.0.0",
    device: "Samsung Galaxy S24",
    language: "en-AU",
    sentiment: "positive",
    status: "new",
    tags: ["rural", "jedi", "offline"],
  },
  {
    store: "apple_app_store",
    authorName: "NurseJohn_Perth",
    authorId: "user_ios_002",
    rating: 4,
    title: "Great app, needs calendar sync",
    content: "Really useful for patient management. Would love to see Apple Calendar integration for shift scheduling. Otherwise, excellent app for healthcare professionals.",
    version: "8.0.0",
    device: "iPhone 15 Pro",
    language: "en-AU",
    sentiment: "positive",
    status: "new",
    tags: ["feature_request", "calendar"],
  },
  {
    store: "microsoft_store",
    authorName: "AdminUser_Geraldton",
    authorId: "user_ms_003",
    rating: 3,
    title: "Good but slow on older hardware",
    content: "The app works well but can be sluggish on our older Surface devices. Would appreciate performance optimizations for legacy hardware that's common in regional hospitals.",
    version: "8.0.0",
    device: "Surface Pro 7",
    language: "en-AU",
    sentiment: "neutral",
    status: "new",
    tags: ["performance", "hardware"],
  },
  {
    store: "google_play",
    authorName: "FrustratedUser42",
    authorId: "user_gp_004",
    rating: 2,
    title: "Crashes frequently",
    content: "App crashes every time I try to access patient records. Very frustrating when you need information quickly. Please fix this ASAP!",
    version: "7.9.0",
    device: "Pixel 7",
    language: "en-AU",
    sentiment: "negative",
    status: "new",
    tags: ["bug", "crash", "urgent"],
  },
  {
    store: "apple_app_store",
    authorName: "HealthcareIT_WA",
    authorId: "user_ios_005",
    rating: 5,
    title: "Best healthcare app in Australia",
    content: "After evaluating dozens of healthcare management apps, MediVac WACHS stands out. The JEDI integration, comprehensive features, and excellent support from JediTek make this the gold standard. Our entire network has adopted it.",
    version: "8.0.0",
    device: "iPad Pro 12.9",
    language: "en-AU",
    sentiment: "positive",
    status: "new",
    tags: ["enterprise", "recommendation"],
  },
];

interface ReviewServiceState {
  reviews: AppReview[];
  templates: ResponseTemplate[];
  alerts: ReviewAlert[];
  initialized: boolean;
}

class AppStoreReviewService {
  private state: ReviewServiceState = {
    reviews: [],
    templates: [],
    alerts: [],
    initialized: false,
  };

  private listeners: Set<() => void> = new Set();

  async initialize(): Promise<void> {
    if (this.state.initialized) return;

    try {
      const saved = await AsyncStorage.getItem("@medivac_reviews_state");
      if (saved) {
        this.state = { ...JSON.parse(saved), initialized: true };
      } else {
        // Initialize with defaults
        this.state.templates = DEFAULT_TEMPLATES.map((t, index) => ({
          ...t,
          id: `template_${index + 1}`,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        }));
        
        this.state.reviews = SAMPLE_REVIEWS.map((r, index) => ({
          ...r,
          id: `review_${index + 1}`,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        this.state.initialized = true;
        await this.saveState();
        
        // Generate initial alerts for negative reviews
        await this.checkForAlerts();
      }
    } catch (error) {
      console.error("Failed to initialize review service:", error);
      this.state.initialized = true;
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem("@medivac_reviews_state", JSON.stringify(this.state));
    } catch (error) {
      console.error("Failed to save review state:", error);
    }
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Sentiment analysis (simplified)
  private analyzeSentiment(rating: number, content: string): ReviewSentiment {
    const negativeWords = ["crash", "bug", "broken", "terrible", "awful", "hate", "worst", "useless", "frustrating"];
    const positiveWords = ["love", "great", "excellent", "amazing", "perfect", "best", "fantastic", "wonderful"];
    
    const lowerContent = content.toLowerCase();
    const hasNegative = negativeWords.some(word => lowerContent.includes(word));
    const hasPositive = positiveWords.some(word => lowerContent.includes(word));
    
    if (rating <= 2 || (rating === 3 && hasNegative)) {
      return hasNegative ? "critical" : "negative";
    } else if (rating >= 4 || hasPositive) {
      return "positive";
    }
    return "neutral";
  }

  // Review management
  async getAllReviews(): Promise<AppReview[]> {
    await this.initialize();
    return [...this.state.reviews].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReviewsByStore(store: StoreType): Promise<AppReview[]> {
    await this.initialize();
    return this.state.reviews
      .filter((r) => r.store === store)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReviewsByStatus(status: ReviewStatus): Promise<AppReview[]> {
    await this.initialize();
    return this.state.reviews.filter((r) => r.status === status);
  }

  async getReviewsBySentiment(sentiment: ReviewSentiment): Promise<AppReview[]> {
    await this.initialize();
    return this.state.reviews.filter((r) => r.sentiment === sentiment);
  }

  async getReview(id: string): Promise<AppReview | undefined> {
    await this.initialize();
    return this.state.reviews.find((r) => r.id === id);
  }

  async updateReviewStatus(id: string, status: ReviewStatus): Promise<AppReview | undefined> {
    await this.initialize();

    const index = this.state.reviews.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    this.state.reviews[index].status = status;
    this.state.reviews[index].updatedAt = new Date().toISOString();
    await this.saveState();
    this.emit();

    return this.state.reviews[index];
  }

  async addReviewTag(id: string, tag: string): Promise<AppReview | undefined> {
    await this.initialize();

    const index = this.state.reviews.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    if (!this.state.reviews[index].tags.includes(tag)) {
      this.state.reviews[index].tags.push(tag);
      this.state.reviews[index].updatedAt = new Date().toISOString();
      await this.saveState();
      this.emit();
    }

    return this.state.reviews[index];
  }

  async removeReviewTag(id: string, tag: string): Promise<AppReview | undefined> {
    await this.initialize();

    const index = this.state.reviews.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    this.state.reviews[index].tags = this.state.reviews[index].tags.filter((t) => t !== tag);
    this.state.reviews[index].updatedAt = new Date().toISOString();
    await this.saveState();
    this.emit();

    return this.state.reviews[index];
  }

  // Response management
  async createResponse(
    reviewId: string,
    content: string,
    authorId: string,
    authorName: string,
    templateId?: string
  ): Promise<ReviewResponse> {
    await this.initialize();

    const response: ReviewResponse = {
      id: `response_${Date.now()}`,
      reviewId,
      content,
      authorId,
      authorName,
      status: "draft",
      templateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reviewIndex = this.state.reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex !== -1) {
      this.state.reviews[reviewIndex].response = response;
      this.state.reviews[reviewIndex].status = "responded";
      this.state.reviews[reviewIndex].updatedAt = new Date().toISOString();
    }

    // Update template usage
    if (templateId) {
      const templateIndex = this.state.templates.findIndex((t) => t.id === templateId);
      if (templateIndex !== -1) {
        this.state.templates[templateIndex].usageCount++;
        this.state.templates[templateIndex].lastUsed = new Date().toISOString();
      }
    }

    await this.saveState();
    this.emit();

    return response;
  }

  async updateResponseStatus(reviewId: string, status: ResponseStatus, approvedBy?: string): Promise<ReviewResponse | undefined> {
    await this.initialize();

    const reviewIndex = this.state.reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1 || !this.state.reviews[reviewIndex].response) return undefined;

    const response = this.state.reviews[reviewIndex].response!;
    response.status = status;
    response.updatedAt = new Date().toISOString();

    if (status === "approved" && approvedBy) {
      response.approvedBy = approvedBy;
      response.approvedAt = new Date().toISOString();
    } else if (status === "published") {
      response.publishedAt = new Date().toISOString();
    }

    await this.saveState();
    this.emit();

    return response;
  }

  // Template management
  async getAllTemplates(): Promise<ResponseTemplate[]> {
    await this.initialize();
    return [...this.state.templates];
  }

  async getTemplatesByCategory(category: ResponseTemplate["category"]): Promise<ResponseTemplate[]> {
    await this.initialize();
    return this.state.templates.filter((t) => t.category === category);
  }

  async createTemplate(data: Omit<ResponseTemplate, "id" | "usageCount" | "createdAt">): Promise<ResponseTemplate> {
    await this.initialize();

    const template: ResponseTemplate = {
      ...data,
      id: `template_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.state.templates.push(template);
    await this.saveState();
    this.emit();

    return template;
  }

  async updateTemplate(id: string, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined> {
    await this.initialize();

    const index = this.state.templates.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    this.state.templates[index] = { ...this.state.templates[index], ...updates };
    await this.saveState();
    this.emit();

    return this.state.templates[index];
  }

  async deleteTemplate(id: string): Promise<boolean> {
    await this.initialize();

    const index = this.state.templates.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.state.templates.splice(index, 1);
    await this.saveState();
    this.emit();

    return true;
  }

  // Apply template with variables
  applyTemplate(template: ResponseTemplate, variables: Record<string, string>): string {
    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return content;
  }

  // Suggest template based on review
  suggestTemplate(review: AppReview): ResponseTemplate | undefined {
    const templates = this.state.templates;
    
    // Check for bug reports
    if (review.tags.includes("bug") || review.tags.includes("crash")) {
      return templates.find((t) => t.category === "bug_report");
    }
    
    // Check for feature requests
    if (review.tags.includes("feature_request")) {
      return templates.find((t) => t.category === "feature_request");
    }
    
    // Based on sentiment
    switch (review.sentiment) {
      case "positive":
        return templates.find((t) => t.category === "positive");
      case "negative":
      case "critical":
        return templates.find((t) => t.category === "negative");
      default:
        return templates.find((t) => t.category === "neutral");
    }
  }

  // Alert management
  async getAllAlerts(): Promise<ReviewAlert[]> {
    await this.initialize();
    return [...this.state.alerts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getUnacknowledgedAlerts(): Promise<ReviewAlert[]> {
    await this.initialize();
    return this.state.alerts.filter((a) => !a.acknowledged);
  }

  async acknowledgeAlert(id: string): Promise<boolean> {
    await this.initialize();

    const index = this.state.alerts.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.state.alerts[index].acknowledged = true;
    await this.saveState();
    this.emit();

    return true;
  }

  private async checkForAlerts(): Promise<void> {
    // Check for negative reviews
    const negativeReviews = this.state.reviews.filter(
      (r) => (r.sentiment === "negative" || r.sentiment === "critical") && r.status === "new"
    );

    for (const review of negativeReviews) {
      const existingAlert = this.state.alerts.find(
        (a) => a.reviewId === review.id && a.type === "negative_review"
      );

      if (!existingAlert) {
        this.state.alerts.push({
          id: `alert_${Date.now()}_${review.id}`,
          type: "negative_review",
          severity: review.sentiment === "critical" ? "critical" : "high",
          message: `New ${review.sentiment} review (${review.rating} stars) on ${review.store.replace("_", " ")} from ${review.authorName}`,
          reviewId: review.id,
          store: review.store,
          acknowledged: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await this.saveState();
  }

  // Analytics
  async getAnalytics(store?: StoreType, period: "day" | "week" | "month" | "year" = "month"): Promise<ReviewAnalytics[]> {
    await this.initialize();

    const stores: StoreType[] = store ? [store] : ["google_play", "apple_app_store", "microsoft_store"];
    const analytics: ReviewAnalytics[] = [];

    const now = new Date();
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };

    for (const s of stores) {
      const storeReviews = this.state.reviews.filter(
        (r) => r.store === s && new Date(r.createdAt).getTime() > now.getTime() - periodMs[period]
      );

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const sentimentBreakdown: Record<ReviewSentiment, number> = {
        positive: 0,
        neutral: 0,
        negative: 0,
        critical: 0,
      };
      const tagCounts: Record<string, number> = {};

      let totalRating = 0;
      let respondedCount = 0;

      for (const review of storeReviews) {
        totalRating += review.rating;
        ratingDistribution[review.rating]++;
        sentimentBreakdown[review.sentiment]++;
        
        if (review.response) respondedCount++;
        
        for (const tag of review.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      analytics.push({
        store: s,
        period,
        totalReviews: storeReviews.length,
        averageRating: storeReviews.length > 0 ? totalRating / storeReviews.length : 0,
        ratingDistribution,
        sentimentBreakdown,
        responseRate: storeReviews.length > 0 ? (respondedCount / storeReviews.length) * 100 : 0,
        averageResponseTime: 4.5, // Simulated average
        topTags,
      });
    }

    return analytics;
  }

  // Summary stats
  async getSummaryStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    pendingResponses: number;
    criticalAlerts: number;
    responseRate: number;
    byStore: Record<StoreType, { count: number; avgRating: number }>;
  }> {
    await this.initialize();

    const byStore: Record<StoreType, { count: number; avgRating: number }> = {
      google_play: { count: 0, avgRating: 0 },
      apple_app_store: { count: 0, avgRating: 0 },
      microsoft_store: { count: 0, avgRating: 0 },
    };

    let totalRating = 0;
    let respondedCount = 0;

    for (const review of this.state.reviews) {
      totalRating += review.rating;
      byStore[review.store].count++;
      byStore[review.store].avgRating += review.rating;
      if (review.response) respondedCount++;
    }

    // Calculate averages
    for (const store of Object.keys(byStore) as StoreType[]) {
      if (byStore[store].count > 0) {
        byStore[store].avgRating /= byStore[store].count;
      }
    }

    const pendingResponses = this.state.reviews.filter(
      (r) => r.status === "new" && (r.sentiment === "negative" || r.sentiment === "critical")
    ).length;

    const criticalAlerts = this.state.alerts.filter(
      (a) => !a.acknowledged && a.severity === "critical"
    ).length;

    return {
      totalReviews: this.state.reviews.length,
      averageRating: this.state.reviews.length > 0 ? totalRating / this.state.reviews.length : 0,
      pendingResponses,
      criticalAlerts,
      responseRate: this.state.reviews.length > 0 ? (respondedCount / this.state.reviews.length) * 100 : 0,
      byStore,
    };
  }

  // Escalate review
  async escalateReview(id: string, reason: string): Promise<AppReview | undefined> {
    await this.initialize();

    const reviewIndex = this.state.reviews.findIndex((r) => r.id === id);
    if (reviewIndex === -1) return undefined;

    this.state.reviews[reviewIndex].status = "escalated";
    this.state.reviews[reviewIndex].updatedAt = new Date().toISOString();

    // Create escalation alert
    this.state.alerts.push({
      id: `alert_escalation_${Date.now()}`,
      type: "escalation",
      severity: "high",
      message: `Review escalated: ${reason}`,
      reviewId: id,
      store: this.state.reviews[reviewIndex].store,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    });

    await this.saveState();
    this.emit();

    return this.state.reviews[reviewIndex];
  }
}

export const appStoreReviewService = new AppStoreReviewService();
