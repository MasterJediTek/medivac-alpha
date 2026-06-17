/**
 * MediVac WACHS Review Response Analytics Service
 * Track and analyze the effectiveness of review responses across app stores
 */

// ============================================================================
// TYPES
// ============================================================================
export type StoreType = "google_play" | "apple_app_store" | "microsoft_store";
export type SentimentType = "positive" | "neutral" | "negative" | "critical";

export interface ReviewResponse {
  id: string;
  reviewId: string;
  store: StoreType;
  responseText: string;
  templateId: string | null;
  respondedBy: string;
  respondedAt: Date;
  responseTime: number; // hours from review to response
}

export interface ReviewWithResponse {
  id: string;
  store: StoreType;
  authorName: string;
  rating: number;
  initialRating: number;
  currentRating: number;
  sentiment: SentimentType;
  initialSentiment: SentimentType;
  currentSentiment: SentimentType;
  reviewText: string;
  reviewDate: Date;
  response: ReviewResponse | null;
  ratingChanged: boolean;
  ratingDelta: number;
  sentimentShift: number; // -2 to +2
  engagementScore: number; // 0-100
  updatedAt: Date;
}

export interface ResponseEffectiveness {
  responseId: string;
  reviewId: string;
  ratingImprovement: number;
  sentimentImprovement: number;
  responseTime: number;
  engagementGenerated: boolean;
  effectivenessScore: number; // 0-100
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  category: string;
  timesUsed: number;
  averageRatingImprovement: number;
  averageSentimentImprovement: number;
  averageResponseTime: number;
  effectivenessScore: number;
}

export interface ResponseAnalytics {
  totalReviews: number;
  respondedReviews: number;
  responseRate: number;
  averageResponseTime: number;
  averageRatingImprovement: number;
  positiveOutcomes: number;
  neutralOutcomes: number;
  negativeOutcomes: number;
  byStore: Record<StoreType, {
    totalReviews: number;
    respondedReviews: number;
    responseRate: number;
    averageRatingImprovement: number;
  }>;
}

export interface TrendData {
  date: string;
  responseRate: number;
  averageRatingImprovement: number;
  averageResponseTime: number;
  reviewVolume: number;
}

export interface PredictiveRecommendation {
  reviewId: string;
  recommendedTemplateId: string;
  recommendedTemplateName: string;
  confidence: number;
  predictedImprovement: number;
  reasoning: string;
}

// ============================================================================
// REVIEW RESPONSE ANALYTICS SERVICE
// ============================================================================
class ReviewResponseAnalyticsService {
  private reviews: ReviewWithResponse[] = [];
  private responses: ReviewResponse[] = [];
  private effectiveness: ResponseEffectiveness[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Sample reviews with responses
    const sampleReviews: ReviewWithResponse[] = [
      {
        id: "rev_1",
        store: "google_play",
        authorName: "John D.",
        rating: 4,
        initialRating: 2,
        currentRating: 4,
        sentiment: "positive",
        initialSentiment: "negative",
        currentSentiment: "positive",
        reviewText: "App was crashing but support fixed it quickly!",
        reviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        response: {
          id: "resp_1",
          reviewId: "rev_1",
          store: "google_play",
          responseText: "Thank you for reporting the issue. We've released a fix in version 8.1. Please update and let us know if you experience any further issues.",
          templateId: "tpl_bug_fix",
          respondedBy: "Support Team",
          respondedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          responseTime: 24,
        },
        ratingChanged: true,
        ratingDelta: 2,
        sentimentShift: 2,
        engagementScore: 85,
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "rev_2",
        store: "apple_app_store",
        authorName: "Sarah M.",
        rating: 5,
        initialRating: 5,
        currentRating: 5,
        sentiment: "positive",
        initialSentiment: "positive",
        currentSentiment: "positive",
        reviewText: "Best medical app I've used. JEDI integration is amazing!",
        reviewDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        response: {
          id: "resp_2",
          reviewId: "rev_2",
          store: "apple_app_store",
          responseText: "Thank you so much for your kind words! We're thrilled you're enjoying the JEDI integration. May the Force be with you!",
          templateId: "tpl_positive",
          respondedBy: "Support Team",
          respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          responseTime: 18,
        },
        ratingChanged: false,
        ratingDelta: 0,
        sentimentShift: 0,
        engagementScore: 70,
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: "rev_3",
        store: "microsoft_store",
        authorName: "Mike R.",
        rating: 3,
        initialRating: 1,
        currentRating: 3,
        sentiment: "neutral",
        initialSentiment: "critical",
        currentSentiment: "neutral",
        reviewText: "Had issues but support helped. Still needs improvement.",
        reviewDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        response: {
          id: "resp_3",
          reviewId: "rev_3",
          store: "microsoft_store",
          responseText: "We appreciate your feedback and patience. Our team is continuously working on improvements. Please reach out if you need further assistance.",
          templateId: "tpl_improvement",
          respondedBy: "Support Team",
          respondedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          responseTime: 12,
        },
        ratingChanged: true,
        ratingDelta: 2,
        sentimentShift: 1,
        engagementScore: 60,
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        id: "rev_4",
        store: "google_play",
        authorName: "Emily K.",
        rating: 1,
        initialRating: 1,
        currentRating: 1,
        sentiment: "critical",
        initialSentiment: "critical",
        currentSentiment: "critical",
        reviewText: "Doesn't work at all. Waste of time.",
        reviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        response: null,
        ratingChanged: false,
        ratingDelta: 0,
        sentimentShift: 0,
        engagementScore: 0,
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    this.reviews = sampleReviews;
    this.responses = sampleReviews.filter(r => r.response).map(r => r.response!);
    
    // Calculate effectiveness for responded reviews
    this.effectiveness = sampleReviews
      .filter(r => r.response)
      .map(r => ({
        responseId: r.response!.id,
        reviewId: r.id,
        ratingImprovement: r.ratingDelta,
        sentimentImprovement: r.sentimentShift,
        responseTime: r.response!.responseTime,
        engagementGenerated: r.engagementScore > 50,
        effectivenessScore: this.calculateEffectivenessScore(r),
      }));
  }

  private calculateEffectivenessScore(review: ReviewWithResponse): number {
    let score = 50; // Base score
    
    // Rating improvement (+20 per star)
    score += review.ratingDelta * 20;
    
    // Sentiment improvement (+15 per level)
    score += review.sentimentShift * 15;
    
    // Fast response time bonus
    if (review.response && review.response.responseTime < 24) {
      score += 10;
    }
    
    // Engagement bonus
    score += (review.engagementScore / 100) * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Get all reviews
  async getAllReviews(): Promise<ReviewWithResponse[]> {
    return this.reviews;
  }

  // Get reviews by store
  async getReviewsByStore(store: StoreType): Promise<ReviewWithResponse[]> {
    return this.reviews.filter(r => r.store === store);
  }

  // Get reviews needing response
  async getReviewsNeedingResponse(): Promise<ReviewWithResponse[]> {
    return this.reviews.filter(r => !r.response && r.sentiment !== "positive");
  }

  // Record response
  async recordResponse(reviewId: string, response: Omit<ReviewResponse, "id" | "reviewId">): Promise<ReviewResponse | null> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review || review.response) return null;

    const newResponse: ReviewResponse = {
      ...response,
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reviewId,
    };

    review.response = newResponse;
    this.responses.push(newResponse);
    this.notify();
    return newResponse;
  }

  // Update review after response
  async updateReviewAfterResponse(reviewId: string, updates: {
    currentRating?: number;
    currentSentiment?: SentimentType;
    engagementScore?: number;
  }): Promise<ReviewWithResponse | null> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return null;

    if (updates.currentRating !== undefined) {
      review.currentRating = updates.currentRating;
      review.ratingDelta = review.currentRating - review.initialRating;
      review.ratingChanged = review.ratingDelta !== 0;
    }

    if (updates.currentSentiment !== undefined) {
      review.currentSentiment = updates.currentSentiment;
      const sentimentValues: Record<SentimentType, number> = {
        critical: -2, negative: -1, neutral: 0, positive: 1
      };
      review.sentimentShift = sentimentValues[review.currentSentiment] - sentimentValues[review.initialSentiment];
    }

    if (updates.engagementScore !== undefined) {
      review.engagementScore = updates.engagementScore;
    }

    review.updatedAt = new Date();

    // Update effectiveness
    if (review.response) {
      const effIndex = this.effectiveness.findIndex(e => e.reviewId === reviewId);
      const newEff: ResponseEffectiveness = {
        responseId: review.response.id,
        reviewId,
        ratingImprovement: review.ratingDelta,
        sentimentImprovement: review.sentimentShift,
        responseTime: review.response.responseTime,
        engagementGenerated: review.engagementScore > 50,
        effectivenessScore: this.calculateEffectivenessScore(review),
      };
      
      if (effIndex >= 0) {
        this.effectiveness[effIndex] = newEff;
      } else {
        this.effectiveness.push(newEff);
      }
    }

    this.notify();
    return review;
  }

  // Get response effectiveness
  async getResponseEffectiveness(responseId: string): Promise<ResponseEffectiveness | null> {
    return this.effectiveness.find(e => e.responseId === responseId) || null;
  }

  // Get all effectiveness data
  async getAllEffectiveness(): Promise<ResponseEffectiveness[]> {
    return this.effectiveness;
  }

  // Get template performance
  async getTemplatePerformance(): Promise<TemplatePerformance[]> {
    const templateStats = new Map<string, {
      name: string;
      category: string;
      count: number;
      totalRatingImprovement: number;
      totalSentimentImprovement: number;
      totalResponseTime: number;
      totalEffectiveness: number;
    }>();

    this.reviews.filter(r => r.response?.templateId).forEach(review => {
      const templateId = review.response!.templateId!;
      const existing = templateStats.get(templateId) || {
        name: `Template ${templateId}`,
        category: "general",
        count: 0,
        totalRatingImprovement: 0,
        totalSentimentImprovement: 0,
        totalResponseTime: 0,
        totalEffectiveness: 0,
      };

      existing.count++;
      existing.totalRatingImprovement += review.ratingDelta;
      existing.totalSentimentImprovement += review.sentimentShift;
      existing.totalResponseTime += review.response!.responseTime;
      existing.totalEffectiveness += this.calculateEffectivenessScore(review);

      templateStats.set(templateId, existing);
    });

    return Array.from(templateStats.entries()).map(([id, stats]) => ({
      templateId: id,
      templateName: stats.name,
      category: stats.category,
      timesUsed: stats.count,
      averageRatingImprovement: stats.count > 0 ? stats.totalRatingImprovement / stats.count : 0,
      averageSentimentImprovement: stats.count > 0 ? stats.totalSentimentImprovement / stats.count : 0,
      averageResponseTime: stats.count > 0 ? stats.totalResponseTime / stats.count : 0,
      effectivenessScore: stats.count > 0 ? stats.totalEffectiveness / stats.count : 0,
    }));
  }

  // Get overall analytics
  async getAnalytics(): Promise<ResponseAnalytics> {
    const totalReviews = this.reviews.length;
    const respondedReviews = this.reviews.filter(r => r.response).length;
    const respondedWithImprovement = this.reviews.filter(r => r.response && r.ratingDelta > 0);

    const byStore: ResponseAnalytics["byStore"] = {
      google_play: { totalReviews: 0, respondedReviews: 0, responseRate: 0, averageRatingImprovement: 0 },
      apple_app_store: { totalReviews: 0, respondedReviews: 0, responseRate: 0, averageRatingImprovement: 0 },
      microsoft_store: { totalReviews: 0, respondedReviews: 0, responseRate: 0, averageRatingImprovement: 0 },
    };

    (["google_play", "apple_app_store", "microsoft_store"] as StoreType[]).forEach(store => {
      const storeReviews = this.reviews.filter(r => r.store === store);
      const storeResponded = storeReviews.filter(r => r.response);
      byStore[store] = {
        totalReviews: storeReviews.length,
        respondedReviews: storeResponded.length,
        responseRate: storeReviews.length > 0 ? (storeResponded.length / storeReviews.length) * 100 : 0,
        averageRatingImprovement: storeResponded.length > 0
          ? storeResponded.reduce((sum, r) => sum + r.ratingDelta, 0) / storeResponded.length
          : 0,
      };
    });

    return {
      totalReviews,
      respondedReviews,
      responseRate: totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0,
      averageResponseTime: respondedReviews > 0
        ? this.reviews.filter(r => r.response).reduce((sum, r) => sum + r.response!.responseTime, 0) / respondedReviews
        : 0,
      averageRatingImprovement: respondedWithImprovement.length > 0
        ? respondedWithImprovement.reduce((sum, r) => sum + r.ratingDelta, 0) / respondedWithImprovement.length
        : 0,
      positiveOutcomes: this.reviews.filter(r => r.response && r.ratingDelta > 0).length,
      neutralOutcomes: this.reviews.filter(r => r.response && r.ratingDelta === 0).length,
      negativeOutcomes: this.reviews.filter(r => r.response && r.ratingDelta < 0).length,
      byStore,
    };
  }

  // Get trend data
  async getTrendData(days: number = 30): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayReviews = this.reviews.filter(r => {
        const reviewDate = r.reviewDate.toISOString().split("T")[0];
        return reviewDate === dateStr;
      });

      const dayResponded = dayReviews.filter(r => r.response);

      trends.push({
        date: dateStr,
        responseRate: dayReviews.length > 0 ? (dayResponded.length / dayReviews.length) * 100 : 0,
        averageRatingImprovement: dayResponded.length > 0
          ? dayResponded.reduce((sum, r) => sum + r.ratingDelta, 0) / dayResponded.length
          : 0,
        averageResponseTime: dayResponded.length > 0
          ? dayResponded.reduce((sum, r) => sum + r.response!.responseTime, 0) / dayResponded.length
          : 0,
        reviewVolume: dayReviews.length,
      });
    }

    return trends;
  }

  // Get predictive recommendations
  async getPredictiveRecommendations(): Promise<PredictiveRecommendation[]> {
    const needingResponse = await this.getReviewsNeedingResponse();
    
    return needingResponse.map(review => {
      let templateId = "tpl_general";
      let templateName = "General Response";
      let confidence = 70;
      let predictedImprovement = 0.5;
      let reasoning = "Standard response template recommended";

      if (review.sentiment === "critical") {
        templateId = "tpl_critical_issue";
        templateName = "Critical Issue Response";
        confidence = 85;
        predictedImprovement = 1.5;
        reasoning = "Critical sentiment detected - escalation template recommended for maximum impact";
      } else if (review.sentiment === "negative") {
        templateId = "tpl_bug_fix";
        templateName = "Bug Fix Response";
        confidence = 80;
        predictedImprovement = 1.2;
        reasoning = "Negative sentiment suggests technical issue - bug fix template recommended";
      }

      return {
        reviewId: review.id,
        recommendedTemplateId: templateId,
        recommendedTemplateName: templateName,
        confidence,
        predictedImprovement,
        reasoning,
      };
    });
  }

  // Calculate ROI
  async calculateROI(): Promise<{
    totalResponsesInvested: number;
    averageTimePerResponse: number;
    totalRatingPointsGained: number;
    estimatedRetentionValue: number;
    roi: number;
  }> {
    const responded = this.reviews.filter(r => r.response);
    const totalRatingGain = responded.reduce((sum, r) => sum + Math.max(0, r.ratingDelta), 0);
    
    // Estimate $50 value per rating point gained (simplified)
    const valuePerRatingPoint = 50;
    const estimatedValue = totalRatingGain * valuePerRatingPoint;
    
    // Estimate 15 minutes per response
    const timePerResponse = 0.25; // hours
    const totalTimeInvested = responded.length * timePerResponse;
    
    // Estimate $30/hour cost
    const costPerHour = 30;
    const totalCost = totalTimeInvested * costPerHour;

    return {
      totalResponsesInvested: responded.length,
      averageTimePerResponse: timePerResponse * 60, // minutes
      totalRatingPointsGained: totalRatingGain,
      estimatedRetentionValue: estimatedValue,
      roi: totalCost > 0 ? ((estimatedValue - totalCost) / totalCost) * 100 : 0,
    };
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notify(): void {
    this.listeners.forEach(callback => callback());
  }
}

export const reviewResponseAnalyticsService = new ReviewResponseAnalyticsService();
