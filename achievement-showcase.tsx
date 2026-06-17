/**
 * Achievement Showcase - Trophy Room UI Screen
 * MediVac WACHS v9.1
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  achievementShowcaseService, 
  Achievement, 
  AchievementCategory,
  AchievementRarity,
  Trophy 
} from '@/lib/services/achievement-showcase-service';

type TabType = 'trophies' | 'achievements' | 'progress' | 'stats';

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
  mythic: '#f44336',
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  combo: '👊',
  voice: '🎤',
  weather: '🌤️',
  streak: '🔥',
  exploration: '🗺️',
  mastery: '🏅',
  special: '⭐',
  jedi: '⚔️',
};

export default function AchievementShowcaseScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('trophies');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);
  const [analytics, setAnalytics] = useState(achievementShowcaseService.getAnalytics());

  useEffect(() => {
    const unsubscribe = achievementShowcaseService.subscribe(() => {
      setAchievements(achievementShowcaseService.getAllAchievements());
      setAnalytics(achievementShowcaseService.getAnalytics());
    });

    setAchievements(achievementShowcaseService.getAllAchievements());

    return unsubscribe;
  }, []);

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const handleSelectTrophy = (achievement: Achievement) => {
    if (achievement.isUnlocked) {
      setSelectedTrophy(achievement.trophy);
      achievementShowcaseService.startInspection(achievement.trophy.id);
    }
  };

  const handleCloseTrophy = () => {
    setSelectedTrophy(null);
    achievementShowcaseService.endInspection();
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'trophies', label: 'Trophies', icon: '🏆' },
    { id: 'achievements', label: 'All', icon: '📜' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'stats', label: 'Stats', icon: '📊' },
  ];

  const categories: (AchievementCategory | 'all')[] = ['all', 'combo', 'voice', 'weather', 'streak', 'exploration', 'mastery', 'special', 'jedi'];

  const renderTrophyRoom = () => (
    <View className="gap-4">
      {/* Trophy Count */}
      <View className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-6 border border-primary/30">
        <View className="items-center">
          <Text className="text-5xl mb-2">🏆</Text>
          <Text className="text-4xl font-bold text-primary">{unlockedAchievements.length}</Text>
          <Text className="text-sm text-muted">Trophies Collected</Text>
        </View>
      </View>

      {/* Trophy Grid */}
      {unlockedAchievements.length > 0 ? (
        <View className="flex-row flex-wrap gap-3">
          {unlockedAchievements.map((achievement) => (
            <Pressable
              key={achievement.id}
              onPress={() => handleSelectTrophy(achievement)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View 
                className="rounded-xl p-4 border-2 items-center"
                style={{ 
                  width: 100,
                  backgroundColor: RARITY_COLORS[achievement.rarity] + '20',
                  borderColor: RARITY_COLORS[achievement.rarity],
                }}
              >
                <Text className="text-3xl mb-1">{achievement.icon}</Text>
                <Text 
                  className="text-xs font-medium text-center"
                  style={{ color: RARITY_COLORS[achievement.rarity] }}
                  numberOfLines={2}
                >
                  {achievement.name}
                </Text>
                <View 
                  className="mt-1 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: RARITY_COLORS[achievement.rarity] }}
                >
                  <Text className="text-[10px] text-white font-medium">
                    {achievement.rarity.toUpperCase()}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="bg-surface rounded-xl p-8 border border-border items-center">
          <Text className="text-4xl mb-3">🔒</Text>
          <Text className="text-lg font-semibold text-foreground">No Trophies Yet</Text>
          <Text className="text-sm text-muted text-center mt-1">
            Complete achievements to unlock trophies for your collection
          </Text>
        </View>
      )}

      {/* Trophy Inspection Modal */}
      {selectedTrophy && (
        <Pressable 
          onPress={handleCloseTrophy}
          className="absolute inset-0 bg-black/50 items-center justify-center"
        >
          <View 
            className="bg-surface rounded-2xl p-6 m-4 border-2"
            style={{ borderColor: selectedTrophy.primaryColor }}
          >
            <View className="items-center mb-4">
              <View 
                className="w-24 h-24 rounded-full items-center justify-center mb-3"
                style={{ 
                  backgroundColor: selectedTrophy.glowColor + '40',
                  shadowColor: selectedTrophy.glowColor,
                  shadowRadius: 20,
                  shadowOpacity: selectedTrophy.glowIntensity,
                }}
              >
                <Text className="text-5xl">🏆</Text>
              </View>
              <Text className="text-xl font-bold text-foreground">Trophy Details</Text>
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Style</Text>
                <Text className="text-sm font-medium text-foreground">{selectedTrophy.style}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Material</Text>
                <Text className="text-sm font-medium text-foreground">{selectedTrophy.material}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Pedestal</Text>
                <Text className="text-sm font-medium text-foreground">{selectedTrophy.pedestal}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Particle Effect</Text>
                <Text className="text-sm font-medium text-foreground">{selectedTrophy.particleEffect}</Text>
              </View>
            </View>

            <Pressable
              onPress={handleCloseTrophy}
              className="mt-4 bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Close</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );

  const renderAchievements = () => (
    <View className="gap-4">
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pb-2">
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View 
                className="px-4 py-2 rounded-full border"
                style={{ 
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                  borderColor: selectedCategory === cat ? colors.primary : colors.border,
                }}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ color: selectedCategory === cat ? '#fff' : colors.foreground }}
                >
                  {cat === 'all' ? '📋 All' : `${CATEGORY_ICONS[cat]} ${cat}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Achievement List */}
      {filteredAchievements.map((achievement) => (
        <Pressable
          key={achievement.id}
          onPress={() => handleSelectTrophy(achievement)}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View 
            className="rounded-xl p-4 border"
            style={{ 
              backgroundColor: achievement.isUnlocked ? RARITY_COLORS[achievement.rarity] + '10' : colors.surface,
              borderColor: achievement.isUnlocked ? RARITY_COLORS[achievement.rarity] : colors.border,
              opacity: achievement.isUnlocked ? 1 : 0.6,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: RARITY_COLORS[achievement.rarity] + '30' }}
              >
                <Text className="text-2xl">
                  {achievement.isSecret && !achievement.isUnlocked ? '❓' : achievement.icon}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {achievement.isSecret && !achievement.isUnlocked ? '???' : achievement.name}
                </Text>
                <Text className="text-sm text-muted" numberOfLines={1}>
                  {achievement.isSecret && !achievement.isUnlocked 
                    ? achievement.secretHint || 'Secret achievement' 
                    : achievement.description}
                </Text>
              </View>
              <View className="items-end">
                <View 
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: RARITY_COLORS[achievement.rarity] }}
                >
                  <Text className="text-[10px] text-white font-bold">
                    {achievement.rarity.toUpperCase()}
                  </Text>
                </View>
                <Text className="text-xs text-muted mt-1">{achievement.points} pts</Text>
              </View>
            </View>

            {/* Progress Bar */}
            {!achievement.isUnlocked && (
              <View className="mt-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted">{achievement.requirement}</Text>
                  <Text className="text-xs text-muted">
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
                <View className="h-2 bg-border rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                      backgroundColor: RARITY_COLORS[achievement.rarity],
                    }}
                  />
                </View>
              </View>
            )}

            {achievement.isUnlocked && (
              <View className="flex-row items-center gap-1 mt-2">
                <Text className="text-success">✓</Text>
                <Text className="text-xs text-success">
                  Unlocked {achievement.unlockedAt 
                    ? new Date(achievement.unlockedAt).toLocaleDateString() 
                    : ''}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderProgress = () => {
    const categoryProgress = achievementShowcaseService.getAllCategoryProgress();
    
    return (
      <View className="gap-4">
        {/* Overall Progress */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">Overall Progress</Text>
          <View className="items-center mb-3">
            <Text className="text-4xl font-bold text-primary">
              {analytics.completionPercentage.toFixed(1)}%
            </Text>
            <Text className="text-sm text-muted">
              {analytics.unlockedAchievements} / {analytics.totalAchievements} achievements
            </Text>
          </View>
          <View className="h-3 bg-border rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full"
              style={{ width: `${analytics.completionPercentage}%` }}
            />
          </View>
        </View>

        {/* Category Progress */}
        {categoryProgress.map((progress) => (
          <View key={progress.category} className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{CATEGORY_ICONS[progress.category]}</Text>
                <Text className="text-base font-semibold text-foreground capitalize">
                  {progress.category}
                </Text>
              </View>
              <Text className="text-sm text-muted">
                {progress.unlocked}/{progress.total}
              </Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </View>
            {progress.nextAchievement && (
              <Text className="text-xs text-muted mt-2">
                Next: {progress.nextAchievement.name}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStats = () => (
    <View className="gap-4">
      {/* Points */}
      <View className="bg-gradient-to-r from-warning/20 to-warning/10 rounded-xl p-6 border border-warning/30">
        <View className="items-center">
          <Text className="text-4xl mb-2">⭐</Text>
          <Text className="text-4xl font-bold text-warning">{analytics.totalPoints}</Text>
          <Text className="text-sm text-muted">Total Points</Text>
        </View>
      </View>

      {/* Rarity Breakdown */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Rarity Breakdown</Text>
        {Object.entries(analytics.rarityCounts).map(([rarity, counts]) => (
          <View key={rarity} className="flex-row items-center justify-between py-2 border-b border-border">
            <View className="flex-row items-center gap-2">
              <View 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: RARITY_COLORS[rarity as AchievementRarity] }}
              />
              <Text className="text-sm text-foreground capitalize">{rarity}</Text>
            </View>
            <Text className="text-sm font-medium text-foreground">
              {counts.unlocked} / {counts.total}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent Unlocks */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Recent Unlocks</Text>
        {analytics.recentUnlocks.length > 0 ? (
          analytics.recentUnlocks.slice(0, 5).map((id) => {
            const achievement = achievements.find(a => a.id === id);
            if (!achievement) return null;
            return (
              <View key={id} className="flex-row items-center gap-2 py-2 border-b border-border">
                <Text className="text-xl">{achievement.icon}</Text>
                <Text className="text-sm text-foreground flex-1">{achievement.name}</Text>
                <View 
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: RARITY_COLORS[achievement.rarity] }}
                >
                  <Text className="text-[10px] text-white font-bold">
                    {achievement.rarity.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text className="text-sm text-muted text-center py-4">No recent unlocks</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="items-center mb-2">
            <Text className="text-2xl font-bold text-foreground">Trophy Room</Text>
            <Text className="text-sm text-muted">Your achievement collection</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
              >
                <View 
                  className="py-2 rounded-lg items-center"
                  style={{ backgroundColor: activeTab === tab.id ? colors.primary : 'transparent' }}
                >
                  <Text className="text-lg">{tab.icon}</Text>
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: activeTab === tab.id ? '#fff' : colors.muted }}
                  >
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Content */}
          {activeTab === 'trophies' && renderTrophyRoom()}
          {activeTab === 'achievements' && renderAchievements()}
          {activeTab === 'progress' && renderProgress()}
          {activeTab === 'stats' && renderStats()}

          <View className="h-20" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
