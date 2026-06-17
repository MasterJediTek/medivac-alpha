/**
 * Combo-Triggered Animations Screen
 * MediVac WACHS v9.0
 */

import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { comboTriggeredAnimationsService, ComboAnimation, ComboAchievement, StreakMilestone } from '@/lib/services/combo-triggered-animations-service';

const ANIMATION_ICONS: Record<string, string> = {
  'particle-burst': '💥',
  'force-lightning': '⚡',
  'lightsaber-clash': '⚔️',
  'hyperspace-flash': '🚀',
  'confetti-explosion': '🎊',
  'fireworks': '🎆',
  'shockwave': '💫',
  'rainbow-wave': '🌈',
  'star-burst': '⭐',
  'flame-burst': '🔥',
  'ice-shatter': '❄️',
  'electric-surge': '⚡',
  'gravity-well': '🌀',
  'time-warp': '⏱️',
  'hologram-glitch': '📺',
  'force-push-wave': '🌊',
};

const CELEBRATION_COLORS: Record<string, string> = {
  minor: '#4caf50',
  moderate: '#2196f3',
  major: '#9c27b0',
  epic: '#ff9800',
  legendary: '#f44336',
};

export default function ComboAnimationsScreen() {
  const [activeTab, setActiveTab] = useState<'animations' | 'achievements' | 'streaks' | 'preview'>('animations');
  const [animations, setAnimations] = useState<ComboAnimation[]>([]);
  const [achievements, setAchievements] = useState<ComboAchievement[]>([]);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<ComboAnimation | null>(null);
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = comboTriggeredAnimationsService.subscribe(() => {
      setAnimations(comboTriggeredAnimationsService.getAllAnimations());
      setAchievements(comboTriggeredAnimationsService.getAllAchievements());
      setMilestones(comboTriggeredAnimationsService.getMilestones());
      setUpdateTrigger(prev => prev + 1);
    });

    setAnimations(comboTriggeredAnimationsService.getAllAnimations());
    setAchievements(comboTriggeredAnimationsService.getAllAchievements());
    setMilestones(comboTriggeredAnimationsService.getMilestones());

    return unsubscribe;
  }, []);

  const handlePlayAnimation = (animation: ComboAnimation) => {
    if (!animation.isUnlocked) return;
    
    setCurrentAnimation(animation);
    setIsPlaying(true);
    comboTriggeredAnimationsService.playAnimationManually(animation.id);
    
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentAnimation(null);
    }, animation.duration);
  };

  const handleSimulateCombo = () => {
    const isPerfect = Math.random() > 0.7;
    comboTriggeredAnimationsService.triggerComboAnimation(`combo-${Date.now()}`, isPerfect);
  };

  const streak = comboTriggeredAnimationsService.getStreak();
  const analytics = comboTriggeredAnimationsService.getAnalytics();
  const nextMilestone = comboTriggeredAnimationsService.getNextMilestone();

  const renderAnimations = () => (
    <View className="gap-4">
      {/* Streak Display */}
      <View className="bg-gradient-to-r from-primary to-success p-4 rounded-xl" style={{ backgroundColor: '#00bcd4' }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white/70 text-sm">Current Streak</Text>
            <Text className="text-white text-4xl font-bold">{streak.current}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white/70 text-sm">Multiplier</Text>
            <Text className="text-white text-2xl font-bold">{streak.multiplier.toFixed(1)}x</Text>
          </View>
        </View>
        {nextMilestone && (
          <View className="mt-3 bg-white/20 p-2 rounded-lg">
            <Text className="text-white text-sm">
              Next milestone at {nextMilestone.streak} streak (+{nextMilestone.multiplierBonus}x bonus)
            </Text>
          </View>
        )}
      </View>

      {/* Simulate Combo Button */}
      <Pressable
        onPress={handleSimulateCombo}
        style={({ pressed }) => [
          {
            backgroundColor: '#4caf50',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Text className="text-white font-bold text-lg">🎮 Simulate Combo</Text>
        <Text className="text-white/70 text-sm">Trigger a random animation</Text>
      </Pressable>

      {/* Animations Grid */}
      <Text className="text-foreground text-lg font-bold mt-2">Available Animations</Text>
      <View className="flex-row flex-wrap gap-3">
        {animations.map((animation) => (
          <Pressable
            key={animation.id}
            onPress={() => handlePlayAnimation(animation)}
            style={({ pressed }) => [
              {
                width: '47%',
                backgroundColor: animation.isUnlocked ? '#1e2022' : '#121415',
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: animation.isUnlocked ? '#334155' : '#1e2022',
                opacity: animation.isUnlocked ? 1 : 0.5,
                transform: [{ scale: pressed && animation.isUnlocked ? 0.95 : 1 }],
              },
            ]}
          >
            <Text style={{ fontSize: 32 }}>
              {ANIMATION_ICONS[animation.type] || '✨'}
            </Text>
            <Text className="text-foreground font-semibold mt-2">{animation.name}</Text>
            <Text className="text-muted text-xs mt-1" numberOfLines={2}>
              {animation.description}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <Text className="text-muted text-xs">
                🎬 {animation.playCount} plays
              </Text>
            </View>
            {!animation.isUnlocked && (
              <View className="bg-warning/20 px-2 py-1 rounded mt-2">
                <Text className="text-warning text-xs">🔒 {animation.unlockCondition}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderAchievements = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Achievements</Text>
      <Text className="text-muted text-sm">
        {achievements.filter(a => a.isUnlocked).length} / {achievements.length} unlocked
      </Text>

      {achievements.map((achievement) => (
        <View 
          key={achievement.id} 
          className="bg-surface p-4 rounded-xl border border-border"
          style={{ opacity: achievement.isUnlocked ? 1 : 0.7 }}
        >
          <View className="flex-row items-center gap-3">
            <View 
              style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: achievement.isUnlocked ? '#4caf50' : '#424242',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{achievement.name}</Text>
              <Text className="text-muted text-sm">{achievement.description}</Text>
              {!achievement.isUnlocked && (
                <View className="mt-2">
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View 
                      style={{ 
                        width: `${achievement.progress}%`, 
                        height: '100%', 
                        backgroundColor: '#00bcd4',
                        borderRadius: 4,
                      }} 
                    />
                  </View>
                  <Text className="text-muted text-xs mt-1">{achievement.progress.toFixed(0)}% complete</Text>
                </View>
              )}
              {achievement.isUnlocked && (
                <View className="bg-success/20 px-2 py-1 rounded mt-2 self-start">
                  <Text className="text-success text-xs">✓ Unlocked</Text>
                </View>
              )}
            </View>
          </View>
          <View className="mt-3 bg-primary/10 p-2 rounded-lg">
            <Text className="text-primary text-xs">
              Reward: {achievement.reward.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderStreaks = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Streak Milestones</Text>
      
      {/* Stats */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface p-4 rounded-xl border border-border items-center">
          <Text className="text-muted text-sm">Best Streak</Text>
          <Text className="text-foreground text-3xl font-bold">{streak.longest}</Text>
        </View>
        <View className="flex-1 bg-surface p-4 rounded-xl border border-border items-center">
          <Text className="text-muted text-sm">Perfect Combos</Text>
          <Text className="text-foreground text-3xl font-bold">{analytics.perfectCombos}</Text>
        </View>
      </View>

      {/* Milestones */}
      {milestones.map((milestone, index) => {
        const isReached = streak.longest >= milestone.streak;
        return (
          <View 
            key={index}
            className="bg-surface p-4 rounded-xl border border-border"
            style={{ 
              borderColor: isReached ? CELEBRATION_COLORS[milestone.celebrationLevel] : '#334155',
              borderWidth: isReached ? 2 : 1,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View 
                  style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: CELEBRATION_COLORS[milestone.celebrationLevel],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white font-bold text-lg">{milestone.streak}</Text>
                </View>
                <View>
                  <Text className="text-foreground font-semibold capitalize">
                    {milestone.celebrationLevel} Milestone
                  </Text>
                  <Text className="text-muted text-sm">
                    +{milestone.multiplierBonus}x multiplier bonus
                  </Text>
                </View>
              </View>
              {isReached ? (
                <Text style={{ fontSize: 24 }}>✅</Text>
              ) : (
                <Text className="text-muted">🔒</Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Reset Button */}
      <Pressable
        onPress={() => comboTriggeredAnimationsService.resetStreak()}
        style={({ pressed }) => [
          {
            backgroundColor: '#f44336',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Text className="text-white font-semibold">Reset Streak</Text>
      </Pressable>
    </View>
  );

  const renderPreview = () => (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-bold">Animation Preview</Text>
      
      {/* Preview Area */}
      <View 
        className="bg-surface rounded-xl border border-border items-center justify-center"
        style={{ height: 300 }}
      >
        {isPlaying && currentAnimation ? (
          <View className="items-center">
            <Text style={{ fontSize: 80 }}>
              {ANIMATION_ICONS[currentAnimation.type] || '✨'}
            </Text>
            <Text className="text-foreground font-bold text-xl mt-4">
              {currentAnimation.name}
            </Text>
            <Text className="text-primary mt-2">Playing...</Text>
            <View className="flex-row gap-2 mt-4">
              {currentAnimation.particles.colors.slice(0, 5).map((color, i) => (
                <View 
                  key={i}
                  style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: 10, 
                    backgroundColor: color,
                  }} 
                />
              ))}
            </View>
          </View>
        ) : (
          <View className="items-center">
            <Text style={{ fontSize: 48 }}>🎬</Text>
            <Text className="text-muted mt-4">Tap an animation to preview</Text>
          </View>
        )}
      </View>

      {/* Quick Play Buttons */}
      <Text className="text-foreground font-semibold mt-2">Quick Play</Text>
      <View className="flex-row flex-wrap gap-2">
        {animations.filter(a => a.isUnlocked).slice(0, 6).map((animation) => (
          <Pressable
            key={animation.id}
            onPress={() => handlePlayAnimation(animation)}
            style={({ pressed }) => [
              {
                backgroundColor: '#00bcd4',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Text>{ANIMATION_ICONS[animation.type] || '✨'}</Text>
            <Text className="text-white font-semibold">{animation.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Analytics */}
      <View className="bg-surface p-4 rounded-xl border border-border mt-4">
        <Text className="text-foreground font-semibold mb-3">Statistics</Text>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-muted">Total Animations Played</Text>
            <Text className="text-foreground font-semibold">{analytics.totalAnimationsPlayed}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Particles Emitted</Text>
            <Text className="text-foreground font-semibold">{analytics.totalParticlesEmitted.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Favorite Animation</Text>
            <Text className="text-foreground font-semibold">{analytics.favoriteAnimation || 'N/A'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Achievements Unlocked</Text>
            <Text className="text-foreground font-semibold">{analytics.achievementsUnlocked}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4">
        <Text className="text-foreground text-2xl font-bold mt-4">Combo Animations</Text>
        <Text className="text-muted mb-4">Spectacular visual rewards for your combos</Text>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-4">
          {(['animations', 'achievements', 'streaks', 'preview'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: activeTab === tab ? '#00bcd4' : '#1e2022',
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Text style={{ color: activeTab === tab ? '#fff' : '#9BA1A6', fontWeight: '600', textTransform: 'capitalize', fontSize: 12 }}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'animations' && renderAnimations()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'streaks' && renderStreaks()}
        {activeTab === 'preview' && renderPreview()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
