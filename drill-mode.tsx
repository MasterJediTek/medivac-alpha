/**
 * Playbook Drill Mode Screen
 * Simulate incident responses with separate drill performance tracking
 * MediVac One v5.6
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  drillModeService,
  type DrillScenario,
  type DrillSession,
  type DrillScore,
  type DrillAnalytics,
  type DrillStep,
  THREAT_TYPE_CONFIG,
  DIFFICULTY_CONFIG,
} from "@/lib/services/drill-mode-service";

export default function DrillModeScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<DrillScenario[]>([]);
  const [sessions, setSessions] = useState<DrillSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<DrillScore[]>([]);
  const [analytics, setAnalytics] = useState<DrillAnalytics | null>(null);
  const [activeSession, setActiveSession] = useState<DrillSession | null>(null);
  const [activeScenario, setActiveScenario] = useState<DrillScenario | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDrill, setShowDrill] = useState(false);
  const [currentStep, setCurrentStep] = useState<DrillStep | null>(null);
  const [stepStartTime, setStepStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await drillModeService.initialize();
      setScenarios(drillModeService.getScenarios());
      setSessions(drillModeService.getSessions());
      setLeaderboard(drillModeService.getLeaderboard());
      setAnalytics(drillModeService.getAnalytics());
    } catch (error) {
      console.error("Failed to load drill data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startDrill = async (scenario: DrillScenario) => {
    try {
      const session = await drillModeService.startDrill(
        scenario.id,
        "user_default",
        "Current User"
      );
      setActiveSession(session);
      setActiveScenario(scenario);
      setCurrentStep(scenario.steps[0]);
      setStepStartTime(Date.now());
      setHintsUsed(0);
      setShowScenarios(false);
      setShowDrill(true);
    } catch (error) {
      Alert.alert("Error", `Failed to start drill: ${error}`);
    }
  };

  const completeStep = async (correct: boolean) => {
    if (!activeSession || !currentStep || !activeScenario) return;

    const timeTaken = Math.round((Date.now() - stepStartTime) / 1000);
    
    const updatedSession = await drillModeService.completeStep(
      activeSession.id,
      currentStep.id,
      correct,
      timeTaken,
      hintsUsed
    );

    if (!updatedSession) return;

    setActiveSession(updatedSession);

    if (updatedSession.status === "completed") {
      // Drill complete
      Alert.alert(
        updatedSession.passed ? "Drill Passed!" : "Drill Failed",
        `Score: ${updatedSession.score}/${updatedSession.maxScore}\n${
          updatedSession.passed ? "Congratulations!" : "Keep practicing!"
        }`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowDrill(false);
              loadData();
            },
          },
        ]
      );
    } else {
      // Move to next step
      const nextStep = activeScenario.steps[updatedSession.currentStep];
      if (nextStep) {
        setCurrentStep(nextStep);
        setStepStartTime(Date.now());
        setHintsUsed(0);
        setShowHints(false);
      }
    }
  };

  const cancelDrill = async () => {
    if (!activeSession) return;

    Alert.alert(
      "Cancel Drill",
      "Are you sure you want to cancel this drill?",
      [
        { text: "Continue", style: "cancel" },
        {
          text: "Cancel Drill",
          style: "destructive",
          onPress: async () => {
            await drillModeService.cancelDrill(activeSession.id);
            setShowDrill(false);
            loadData();
          },
        },
      ]
    );
  };

  const useHint = () => {
    if (!currentStep) return;
    if (hintsUsed >= currentStep.hints.length) {
      Alert.alert("No More Hints", "You've used all available hints for this step.");
      return;
    }
    setHintsUsed(hintsUsed + 1);
    setShowHints(true);
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const renderScenarioCard = (scenario: DrillScenario) => {
    const threatConfig = THREAT_TYPE_CONFIG[scenario.threatType];
    const diffConfig = DIFFICULTY_CONFIG[scenario.difficulty];

    return (
      <TouchableOpacity
        key={scenario.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
        onPress={() => startDrill(scenario)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <Text style={{ fontSize: 20 }}>{threatConfig.icon}</Text>
          <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
            {scenario.name}
          </Text>
        </View>
        <Text className="text-muted text-sm mb-3" numberOfLines={2}>
          {scenario.description}
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: threatConfig.color + "20" }}
          >
            <Text style={{ color: threatConfig.color, fontSize: 10, fontWeight: "600" }}>
              {threatConfig.label}
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: diffConfig.color + "20" }}
          >
            <Text style={{ color: diffConfig.color, fontSize: 10, fontWeight: "600" }}>
              {diffConfig.label}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-background">
            <Text className="text-muted text-[10px]">
              {scenario.estimatedDuration} min
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-background">
            <Text className="text-muted text-[10px]">
              {scenario.steps.length} steps
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs">
            Pass: {scenario.passingScore}/{scenario.maxScore} points
          </Text>
          <View
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 12 }}>
              Start Drill
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLeaderboardItem = (score: DrillScore, index: number) => {
    const medals = ["🥇", "🥈", "🥉"];
    const medal = index < 3 ? medals[index] : `#${index + 1}`;

    return (
      <View
        key={score.participantId}
        className="flex-row items-center bg-surface rounded-xl p-4 mb-2 border border-border"
      >
        <Text style={{ fontSize: 20, marginRight: 12 }}>{medal}</Text>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{score.participantName}</Text>
          <Text className="text-muted text-xs">
            {score.completedDrills} drills | {score.passedDrills} passed
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-foreground font-bold">{score.averageScore}</Text>
          <Text className="text-muted text-xs">avg score</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-foreground text-2xl font-bold">Drill Mode</Text>
          <Text className="text-muted text-sm mt-1">
            Practice incident response scenarios
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="px-5 mb-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold text-foreground">
                {analytics?.completedDrills || 0}
              </Text>
              <Text className="text-muted text-xs">Completed</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                {analytics?.passRate || 0}%
              </Text>
              <Text className="text-muted text-xs">Pass Rate</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                {analytics?.averageScore || 0}
              </Text>
              <Text className="text-muted text-xs">Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => setShowScenarios(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🎯</Text>
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Start Drill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.warning + "20" }}
              onPress={() => setShowLeaderboard(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🏆</Text>
              <Text style={{ color: colors.warning, fontWeight: "600" }}>Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Drills */}
        <View className="px-5 pb-8">
          <Text className="text-foreground font-semibold text-lg mb-3">Recent Drills</Text>
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : sessions.length === 0 ? (
            <View className="py-8 items-center bg-surface rounded-xl border border-border">
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🎮</Text>
              <Text className="text-foreground font-semibold">No Drills Yet</Text>
              <Text className="text-muted text-center mt-2 px-4">
                Start your first drill to practice incident response
              </Text>
            </View>
          ) : (
            sessions.slice(0, 5).map(session => {
              const threatConfig = THREAT_TYPE_CONFIG[session.threatType];
              const statusColors: Record<string, string> = {
                completed: session.passed ? colors.success : colors.error,
                in_progress: colors.warning,
                cancelled: colors.muted,
                failed: colors.error,
                scheduled: colors.primary,
              };

              return (
                <View
                  key={session.id}
                  className="bg-surface rounded-xl p-4 mb-2 border border-border"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text style={{ fontSize: 16 }}>{threatConfig.icon}</Text>
                      <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
                        {session.scenarioName}
                      </Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: statusColors[session.status] + "20" }}
                    >
                      <Text
                        style={{
                          color: statusColors[session.status],
                          fontSize: 10,
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        {session.status === "completed" ? (session.passed ? "PASSED" : "FAILED") : session.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <Text className="text-muted text-xs">
                      Score: {session.score}/{session.maxScore}
                    </Text>
                    {session.duration && (
                      <Text className="text-muted text-xs">
                        Time: {formatDuration(session.duration)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Scenarios Modal */}
      <Modal visible={showScenarios} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowScenarios(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">Select Scenario</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {scenarios.map(renderScenarioCard)}
          </ScrollView>
        </View>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal visible={showLeaderboard} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">Leaderboard</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {leaderboard.length === 0 ? (
              <View className="py-12 items-center">
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🏆</Text>
                <Text className="text-foreground font-semibold">No Rankings Yet</Text>
                <Text className="text-muted text-center mt-2">
                  Complete drills to appear on the leaderboard
                </Text>
              </View>
            ) : (
              leaderboard.map((score, index) => renderLeaderboardItem(score, index))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Active Drill Modal */}
      <Modal visible={showDrill} animationType="slide" presentationStyle="fullScreen">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={cancelDrill}>
              <Text style={{ color: colors.error, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-foreground font-semibold">
                Step {activeSession?.currentStep || 0 + 1} of {activeSession?.totalSteps || 0}
              </Text>
              <Text className="text-muted text-xs">
                Score: {activeSession?.score || 0}/{activeSession?.maxScore || 0}
              </Text>
            </View>
            <TouchableOpacity onPress={useHint}>
              <Text style={{ color: colors.warning, fontSize: 16 }}>Hint</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {currentStep && (
              <>
                <View className="bg-surface rounded-xl p-5 mb-4 border border-border">
                  <Text className="text-foreground text-xl font-bold mb-2">
                    {currentStep.title}
                  </Text>
                  <Text className="text-muted mb-4">{currentStep.description}</Text>
                  
                  <View className="flex-row items-center gap-4 mb-4">
                    <View className="flex-row items-center gap-1">
                      <Text className="text-muted text-sm">Points:</Text>
                      <Text className="text-foreground font-semibold">{currentStep.points}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-muted text-sm">Time Limit:</Text>
                      <Text className="text-foreground font-semibold">{currentStep.timeLimit}s</Text>
                    </View>
                  </View>

                  <View className="bg-background rounded-lg p-4">
                    <Text className="text-muted text-sm mb-1">Expected Action:</Text>
                    <Text className="text-foreground font-medium">{currentStep.expectedAction}</Text>
                  </View>
                </View>

                {showHints && hintsUsed > 0 && (
                  <View className="bg-warning/10 rounded-xl p-4 mb-4 border border-warning/30">
                    <Text style={{ color: colors.warning, fontWeight: "600", marginBottom: 8 }}>
                      Hints Used ({hintsUsed}/{currentStep.hints.length}):
                    </Text>
                    {currentStep.hints.slice(0, hintsUsed).map((hint, index) => (
                      <Text key={index} className="text-foreground text-sm mb-1">
                        {index + 1}. {hint}
                      </Text>
                    ))}
                  </View>
                )}

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 py-4 rounded-xl items-center"
                    style={{ backgroundColor: colors.success }}
                    onPress={() => completeStep(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
                      Completed Correctly
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  className="mt-3 py-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.error + "20" }}
                  onPress={() => completeStep(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.error, fontWeight: "600" }}>
                    Skip / Failed
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
