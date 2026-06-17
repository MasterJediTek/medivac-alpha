import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  appStoreReviewService,
  AppReview,
  StoreType,
  ReviewSentiment,
  ResponseTemplate,
} from "@/lib/services/app-store-review-service";

export default function StoreReviewsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreType | "all">("all");
  const [selectedReview, setSelectedReview] = useState<AppReview | null>(null);
  const [responseText, setResponseText] = useState("");
  const [stats, setStats] = useState<{
    totalReviews: number;
    averageRating: number;
    pendingResponses: number;
    criticalAlerts: number;
    responseRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const unsubscribe = appStoreReviewService.subscribe(loadData);
    return unsubscribe;
  }, [selectedStore]);

  const loadData = async () => {
    try {
      const [reviewData, templateData, statsData] = await Promise.all([
        selectedStore === "all"
          ? appStoreReviewService.getAllReviews()
          : appStoreReviewService.getReviewsByStore(selectedStore),
        appStoreReviewService.getAllTemplates(),
        appStoreReviewService.getSummaryStats(),
      ]);
      setReviews(reviewData);
      setTemplates(templateData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = (review: AppReview) => {
    setSelectedReview(review);
    const suggestedTemplate = appStoreReviewService.suggestTemplate(review);
    if (suggestedTemplate) {
      const response = appStoreReviewService.applyTemplate(suggestedTemplate, {
        userName: review.authorName,
        issueType: review.tags[0] || "the issue",
        appVersion: review.version,
        featureName: "the requested feature",
      });
      setResponseText(response);
    } else {
      setResponseText("");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      await appStoreReviewService.createResponse(
        selectedReview.id,
        responseText,
        "admin_user",
        "MediVac WACHS Team"
      );
      setSelectedReview(null);
      setResponseText("");
      await loadData();
    } catch (error) {
      console.error("Failed to send response:", error);
    }
  };

  const getSentimentColor = (sentiment: ReviewSentiment) => {
    switch (sentiment) {
      case "positive":
        return colors.success;
      case "neutral":
        return colors.warning;
      case "negative":
        return colors.error;
      case "critical":
        return "#DC2626";
      default:
        return colors.muted;
    }
  };

  const getStoreIcon = (store: StoreType) => {
    switch (store) {
      case "google_play":
        return "🤖";
      case "apple_app_store":
        return "🍎";
      case "microsoft_store":
        return "🪟";
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const stores: { key: StoreType | "all"; label: string }[] = [
    { key: "all", label: "All Stores" },
    { key: "google_play", label: "Google Play" },
    { key: "apple_app_store", label: "App Store" },
    { key: "microsoft_store", label: "Microsoft" },
  ];

  const renderReview = ({ item }: { item: AppReview }) => (
    <TouchableOpacity
      onPress={() => handleSelectReview(item)}
      style={{
        backgroundColor: selectedReview?.id === item.id ? colors.primary + "10" : colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: selectedReview?.id === item.id ? colors.primary : colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16 }}>{getStoreIcon(item.store)}</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              {item.authorName}
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: colors.warning, marginTop: 4 }}>
            {renderStars(item.rating)}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: getSentimentColor(item.sentiment) + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 10, color: getSentimentColor(item.sentiment), fontWeight: "600" }}>
            {item.sentiment.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.title && (
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 8 }}>
          {item.title}
        </Text>
      )}
      <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {item.tags.map((tag) => (
          <View
            key={tag}
            style={{
              backgroundColor: colors.border,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: colors.muted }}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: colors.muted }}>
          v{item.version} • {item.device || "Unknown device"}
        </Text>
        <Text style={{ fontSize: 10, color: colors.muted }}>
          {item.response ? "✓ Responded" : item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Loading reviews...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
              Store Reviews
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Monitor and respond to user reviews
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
            <View
              style={{
                width: "47%",
                backgroundColor: colors.primary + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Avg Rating</Text>
            </View>
            <View
              style={{
                width: "47%",
                backgroundColor: colors.success + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.success }}>
                {stats.responseRate.toFixed(0)}%
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Response Rate</Text>
            </View>
            <View
              style={{
                width: "47%",
                backgroundColor: colors.warning + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.warning }}>
                {stats.pendingResponses}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Pending</Text>
            </View>
            <View
              style={{
                width: "47%",
                backgroundColor: colors.error + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.error }}>
                {stats.criticalAlerts}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Critical</Text>
            </View>
          </View>
        )}

        {/* Store Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {stores.map((store) => (
            <TouchableOpacity
              key={store.key}
              onPress={() => setSelectedStore(store.key)}
              style={{
                backgroundColor: selectedStore === store.key ? colors.primary : colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                marginRight: 8,
                borderWidth: 1,
                borderColor: selectedStore === store.key ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  color: selectedStore === store.key ? "#FFFFFF" : colors.foreground,
                  fontWeight: "600",
                }}
              >
                {store.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Response Panel */}
        {selectedReview && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Respond to {selectedReview.authorName}
            </Text>
            <TextInput
              value={responseText}
              onChangeText={setResponseText}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                minHeight: 100,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Type your response..."
              placeholderTextColor={colors.muted}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setSelectedReview(null)}
                style={{
                  flex: 1,
                  backgroundColor: colors.border,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendResponse}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Send Response</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reviews List */}
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Reviews ({reviews.length})
        </Text>
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />

        {/* Templates Section */}
        <Text
          style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginTop: 24, marginBottom: 12 }}
        >
          Response Templates ({templates.length})
        </Text>
        {templates.slice(0, 3).map((template) => (
          <View
            key={template.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                {template.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Used {template.usageCount}x</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} numberOfLines={2}>
              {template.content}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
