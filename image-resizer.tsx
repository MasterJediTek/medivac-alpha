/**
 * Image Resizer Screen
 * MediVac WACHS v8.8
 * Image processing for watch faces, wallpapers, screensavers, and animations
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  imageResizerService,
  ProcessedImage,
  ImagePreset,
  StartupAnimation,
  ScreensaverConfig,
  IMAGE_PRESETS,
  DEFAULT_FILTERS,
  JEDI_EFFECTS,
  ImageTargetType,
} from '@/lib/services/image-resizer-service';

type TabType = 'presets' | 'processed' | 'animations' | 'screensavers';

const TARGET_ICONS: Record<ImageTargetType, string> = {
  'watch-face': '⌚',
  'wallpaper': '🖼️',
  'screensaver': '🌙',
  'startup-animation': '🚀',
  'app-icon': '📱',
  'profile-avatar': '👤',
  'custom': '⚙️',
};

const TARGET_COLORS: Record<ImageTargetType, string> = {
  'watch-face': '#9B59B6',
  'wallpaper': '#3498DB',
  'screensaver': '#1ABC9C',
  'startup-animation': '#E74C3C',
  'app-icon': '#F39C12',
  'profile-avatar': '#2ECC71',
  'custom': '#7F8C8D',
};

export default function ImageResizerScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [selectedTarget, setSelectedTarget] = useState<ImageTargetType>('watch-face');
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [animations, setAnimations] = useState<StartupAnimation[]>([]);
  const [screensavers, setScreensavers] = useState<ScreensaverConfig[]>([]);

  useEffect(() => {
    loadData();
    const unsubscribe = imageResizerService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const loadData = () => {
    setProcessedImages(imageResizerService.getAllProcessedImages());
    setAnimations(imageResizerService.getAllStartupAnimations());
    setScreensavers(imageResizerService.getAllScreensavers());
  };

  const processImage = (presetId: string) => {
    // Simulate image selection and processing
    imageResizerService.processImage('assets/sample-image.jpg', selectedTarget, { presetId });
  };

  const setActiveAnimation = (id: string) => {
    imageResizerService.setActiveStartupAnimation(id);
  };

  const setActiveScreensaver = (id: string) => {
    imageResizerService.setActiveScreensaver(id);
  };

  const renderPresetsTab = () => {
    const presets = IMAGE_PRESETS[selectedTarget] || [];

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Target selector */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 12 }}>Select Target</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(Object.keys(IMAGE_PRESETS) as ImageTargetType[]).map((target) => (
              <Pressable
                key={target}
                onPress={() => setSelectedTarget(target)}
                style={{
                  backgroundColor: selectedTarget === target ? TARGET_COLORS[target] : colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  minWidth: 80,
                }}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{TARGET_ICONS[target]}</Text>
                <Text style={{
                  fontSize: 10,
                  color: selectedTarget === target ? '#FFFFFF' : colors.muted,
                  fontWeight: '600',
                }}>
                  {target.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Presets for selected target */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          {TARGET_ICONS[selectedTarget]} {selectedTarget.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Presets
        </Text>
        {presets.map((preset) => (
          <Pressable
            key={preset.id}
            onPress={() => processImage(preset.id)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: TARGET_COLORS[selectedTarget],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: preset.isCircular ? 30 : 8,
                backgroundColor: TARGET_COLORS[selectedTarget] + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: TARGET_COLORS[selectedTarget] }}>
                  {preset.dimensions.width}×{preset.dimensions.height}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{preset.name}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{preset.description}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                  <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, color: colors.muted }}>{preset.aspectRatio}</Text>
                  </View>
                  <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, color: colors.muted }}>{preset.format.toUpperCase()}</Text>
                  </View>
                  <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, color: colors.muted }}>{preset.quality}% quality</Text>
                  </View>
                  {preset.isCircular && (
                    <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.muted }}>⭕ Circular</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{
                backgroundColor: TARGET_COLORS[selectedTarget],
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
              }}>
                <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '600' }}>Use</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {/* Filters section */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 24, marginBottom: 12 }}>
          🎨 Available Filters
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DEFAULT_FILTERS.map((filter) => (
            <View
              key={filter.id}
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>{filter.icon}</Text>
              <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>{filter.name}</Text>
            </View>
          ))}
        </View>

        {/* Effects section */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 24, marginBottom: 12 }}>
          ✨ JEDI Effects
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {JEDI_EFFECTS.map((effect) => (
            <View
              key={effect.id}
              style={{
                backgroundColor: effect.color + '20',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: effect.color,
              }}
            >
              <Text style={{ fontSize: 12, color: effect.color, fontWeight: '600' }}>{effect.name}</Text>
              {effect.animated && <Text style={{ fontSize: 9, color: colors.muted }}>Animated</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderProcessedTab = () => (
    <FlatList
      data={processedImages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', padding: 48 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No processed images yet</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Select a preset to process an image</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: TARGET_COLORS[item.target] + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>{TARGET_ICONS[item.target]}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {item.target.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {item.targetDimensions.width}×{item.targetDimensions.height} • {item.format.toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
                <Text style={{ fontSize: 10, color: colors.muted }}>
                  📦 {Math.round(item.fileSize / 1024)}KB
                </Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>
                  ⏱️ {Math.round(item.processingTime)}ms
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => imageResizerService.deleteProcessedImage(item.id)}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 18 }}>🗑️</Text>
            </Pressable>
          </View>

          {/* Filters and effects applied */}
          {(item.filters.length > 0 || item.effects.length > 0) && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {item.filters.map((f) => (
                  <View key={f.id} style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, color: colors.muted }}>{f.icon} {f.name}</Text>
                  </View>
                ))}
                {item.effects.map((e) => (
                  <View key={e.id} style={{ backgroundColor: e.color + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, color: e.color }}>{e.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    />
  );

  const renderAnimationsTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        🚀 Startup Animations ({animations.length})
      </Text>

      {animations.map((anim) => (
        <Pressable
          key={anim.id}
          onPress={() => setActiveAnimation(anim.id)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: anim.isActive ? '#2ECC71' : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              backgroundColor: anim.backgroundColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>🚀</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{anim.name}</Text>
                {anim.isActive && (
                  <View style={{ backgroundColor: '#2ECC71', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '600' }}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                {anim.frames.length} frames • {anim.totalDuration}ms total
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                <Text style={{ fontSize: 10, color: colors.muted }}>🔁 {anim.loopCount === 0 ? '∞' : anim.loopCount}x</Text>
                {anim.soundEffect && <Text style={{ fontSize: 10, color: colors.muted }}>🔊 Sound</Text>}
              </View>
            </View>
          </View>

          {/* Frame preview */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 4 }}>
            {anim.frames.map((frame, idx) => (
              <View
                key={frame.id}
                style={{
                  flex: 1,
                  height: 40,
                  backgroundColor: colors.background,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 8, color: colors.muted }}>{idx + 1}</Text>
                <Text style={{ fontSize: 7, color: colors.muted }}>{frame.duration}ms</Text>
              </View>
            ))}
          </View>
        </Pressable>
      ))}

      {animations.length === 0 && (
        <View style={{ alignItems: 'center', padding: 48 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🚀</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No startup animations</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderScreensaversTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        🌙 Screensavers ({screensavers.length})
      </Text>

      {screensavers.map((ss) => (
        <Pressable
          key={ss.id}
          onPress={() => setActiveScreensaver(ss.id)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: ss.isActive ? '#1ABC9C' : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              backgroundColor: ss.backgroundColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>🌙</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{ss.name}</Text>
                {ss.isActive && (
                  <View style={{ backgroundColor: '#1ABC9C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '600' }}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                {ss.images.length} images • {ss.displayMode}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                <Text style={{ fontSize: 10, color: colors.muted }}>⏱️ {ss.displayDuration / 1000}s per image</Text>
                {ss.showClock && <Text style={{ fontSize: 10, color: colors.muted }}>🕐 Clock: {ss.clockStyle}</Text>}
              </View>
            </View>
          </View>

          {/* Settings preview */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 4 }}>
            <View style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>Mode: {ss.displayMode}</Text>
            </View>
            <View style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>Transition: {ss.transitionType}</Text>
            </View>
            <View style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>{ss.transitionDuration}ms fade</Text>
            </View>
          </View>
        </Pressable>
      ))}

      {screensavers.length === 0 && (
        <View style={{ alignItems: 'center', padding: 48 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🌙</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No screensavers</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#3498DB', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Image Resizer</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {processedImages.length} processed • {animations.length} animations • {screensavers.length} screensavers
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['presets', 'processed', 'animations', 'screensavers'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? '#3498DB' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 10 }}>
              {tab === 'presets' ? '📐 Presets' : tab === 'processed' ? '🖼️ Images' : tab === 'animations' ? '🚀 Startup' : '🌙 Saver'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'presets' && renderPresetsTab()}
        {activeTab === 'processed' && renderProcessedTab()}
        {activeTab === 'animations' && renderAnimationsTab()}
        {activeTab === 'screensavers' && renderScreensaversTab()}
      </View>
    </ScreenContainer>
  );
}
