/**
 * Animated Bottom Sheet Menu Component
 * Sliding menu with departments, actions, navigation, and shortcuts
 * Includes haptic feedback, animations, sounds, and graphics
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-audio';
import { IconSymbol } from './ui/icon-symbol';

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  badge?: number;
  tier?: 'free' | 'premium' | 'enterprise';
}

interface BottomSheetMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: MenuItem) => void;
  sections: MenuSection[];
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const SNAP_POINTS = [0, SHEET_HEIGHT];

export function BottomSheetMenu({
  isOpen,
  onClose,
  onSelectItem,
  sections,
}: BottomSheetMenuProps) {
  const colors = useColors();
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium' | 'enterprise'>('free');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isOpen) {
      playOpenSound();
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [isOpen]);

  const playOpenSound = async () => {
    if (!soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/menu-open.mp3')
      );
      setSoundObject(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('[Bottom Sheet] Error playing sound:', error);
    }
  };

  const playSelectSound = async () => {
    if (!soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/menu-select.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.error('[Bottom Sheet] Error playing sound:', error);
    }
  };

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleItemPress = async (item: MenuItem) => {
    await playSelectSound();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectItem(item);
    handleClose();
  };

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.tier) return true;
      if (item.tier === 'free') return true;
      if (item.tier === 'premium' && selectedTier !== 'free') return true;
      if (item.tier === 'enterprise' && selectedTier === 'enterprise') return true;
      return false;
    }),
  }));

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Pressable
          className="absolute inset-0 bg-black/50 z-40"
          onPress={handleClose}
        />
      )}

      {/* Bottom Sheet */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          height: SHEET_HEIGHT,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
        {...panResponder.panHandlers}
      >
        <View className="flex-1 bg-background rounded-t-3xl border-t border-border shadow-lg">
          {/* Handle Bar */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1 bg-muted rounded-full opacity-50" />
          </View>

          {/* Header */}
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
            <View>
              <Text className="text-foreground text-2xl font-bold">Menu</Text>
              <Text className="text-muted text-xs">Tier: {selectedTier.toUpperCase()}</Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <IconSymbol name="xmark" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Tier Selector */}
          <View className="px-6 py-3 flex-row gap-2">
            {(['free', 'premium', 'enterprise'] as const).map(tier => (
              <Pressable
                key={tier}
                onPress={() => {
                  setSelectedTier(tier);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                className={cn(
                  'flex-1 py-2 rounded-lg items-center',
                  selectedTier === tier ? 'bg-primary' : 'bg-surface border border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-xs',
                    selectedTier === tier ? 'text-white' : 'text-foreground'
                  )}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Menu Sections */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredSections.map((section, sectionIdx) => (
              <View key={section.id} className="mb-6">
                {/* Section Header */}
                <View className="flex-row items-center gap-2 mb-3">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: section.color + '20' }}
                  >
                    <IconSymbol name={section.icon} size={18} color={section.color} />
                  </View>
                  <Text className="text-foreground font-bold text-lg">{section.title}</Text>
                </View>

                {/* Section Items Grid */}
                <View className="flex-row flex-wrap gap-2">
                  {section.items.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleItemPress(item)}
                      className="flex-1 min-w-[45%] bg-surface rounded-xl p-3 border border-border active:opacity-80"
                      style={{ minHeight: 100 }}
                    >
                      <View
                        className="w-10 h-10 rounded-lg items-center justify-center mb-2"
                        style={{ backgroundColor: item.color + '20' }}
                      >
                        <IconSymbol name={item.icon} size={20} color={item.color} />
                      </View>
                      <Text className="text-foreground font-semibold text-xs mb-1 flex-wrap">
                        {item.title}
                      </Text>
                      {item.tier && item.tier !== 'free' && (
                        <View className="bg-primary/20 rounded px-1 py-0.5">
                          <Text className="text-primary text-xs font-bold">
                            {item.tier.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {item.badge && (
                        <View
                          className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.error }}
                        >
                          <Text className="text-white text-xs font-bold">{item.badge}</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 border-t border-border flex-row items-center justify-between">
            <Pressable
              onPress={() => setSoundEnabled(!soundEnabled)}
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              <IconSymbol
                name={soundEnabled ? 'bolt.fill' : 'bolt'}
                size={16}
                color={colors.primary}
              />
              <Text className="text-primary text-xs font-semibold">
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleClose}
              className="flex-1 ml-3 bg-primary py-2 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Close Menu</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
