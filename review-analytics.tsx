import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { reviewResponseAnalyticsService } from "@/lib/services/review-response-analytics-service";

export default function ReviewAnalyticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof reviewResponseAnalyticsService.getAnalytics>> | null>(null);
  const [roi, setRoi] = useState<Awaited<ReturnType<typeof reviewResponseAnalyticsService.calculateROI>> | null>(null);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof reviewResponseAnalyticsService.getAllReviews>>>([]);

  useEffect(() => {
    loadData();
    const unsubscribe = reviewResponseAnalyticsService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    const [stats, roiData, reviewList] = await Promise.all([
      reviewResponseAnalyticsService.getAnalytics(),
      reviewResponseAnalyticsService.calculateROI(),
      reviewResponseAnalyticsService.getAllReviews(),
    ]);
    setAnalytics(stats);
    setRoi(roiData);
    setReviews(reviewList);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "#22C55E";
      case "neutral": return "#F59E0B";
      case "negative": return "#EF4444";
      case "critical": return "#DC2626";
      default: return "#6B7280";
    }
  };

  const getStoreIcon = (store: string) => {
    switch (store) {
      case "google_play": return "🤖";
      case "apple_app_store": return "🍎";
      case "microsoft_store": return "🪟";
      default: return "📱";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">Review Analytics</Text>
          <Text className="text-muted mt-1">Response effectiveness tracking</Text>
        </View>

        {/* Analytics Overview */}
        {analytics && (
          <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Response Performance</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{analytics.responseRate.toFixed(0)}%</Text>
                <Text className="text-xs text-muted">Response Rate</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>+{analytics.averageRatingImprovement.toFixed(1)}</Text>
                <Text className="text-xs text-muted">Avg Rating Δ</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{analytics.averageResponseTime.toFixed(0)}h</Text>
                <Text className="text-xs text-muted">Avg Response</Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-4 pt-3 border-t border-border">
              <View className="items-center">
                <Text className="text-lg font-bold" style={{ color: "#22C55E" }}>{analytics.positiveOutcomes}</Text>
                <Text className="text-xs text-muted">Positive</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold" style={{ color: "#F59E0B" }}>{analytics.neutralOutcomes}</Text>
                <Text className="text-xs text-muted">Neutral</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold" style={{ color: "#EF4444" }}>{analytics.negativeOutcomes}</Text>
                <Text className="text-xs text-muted">Negative</Text>
              </View>
            </View>
          </View>
        )}

        {/* ROI Summary */}
        {roi && (
          <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">ROI Analysis</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{roi.totalResponsesInvested}</Text>
                <Text className="text-xs text-muted">Responses</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>+{roi.totalRatingPointsGained}</Text>
                <Text className="text-xs text-muted">Stars Gained</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">${roi.estimatedRetentionValue}</Text>
                <Text className="text-xs text-muted">Est. Value</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>{roi.roi.toFixed(0)}%</Text>
                <Text className="text-xs text-muted">ROI</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Reviews */}
        <View className="px-4 mt-4 pb-8">
          <Text className="text-lg font-semibold text-foreground mb-3">Recent Reviews</Text>
          {reviews.slice(0, 5).map((review) => (
            <View key={review.id} className="mb-3 bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">{getStoreIcon(review.store)}</Text>
                  <Text className="text-foreground font-semibold">{review.authorName}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-foreground mr-2">{"⭐".repeat(review.currentRating)}</Text>
                  {review.ratingDelta !== 0 && (
                    <Text style={{ color: review.ratingDelta > 0 ? "#22C55E" : "#EF4444" }} className="text-sm font-medium">
                      {review.ratingDelta > 0 ? "+" : ""}{review.ratingDelta}
                    </Text>
                  )}
                </View>
              </View>
              <Text className="text-muted text-sm mb-2">{review.reviewText}</Text>
              <View className="flex-row items-center justify-between">
                <View 
                  style={{ backgroundColor: getSentimentColor(review.currentSentiment) }}
                  className="px-2 py-1 rounded-full"
                >
                  <Text className="text-white text-xs font-medium capitalize">{review.currentSentiment}</Text>
                </View>
                {review.response ? (
                  <Text className="text-success text-xs">✓ Responded</Text>
                ) : (
                  <Text className="text-warning text-xs">Needs Response</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
