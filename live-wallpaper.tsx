/**
 * Live Wallpaper Generator Screen
 * MediVac WACHS v8.9
 * 
 * Convert static images to animated live wallpapers with
 * particle effects, parallax scrolling, and touch interactions.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  liveWallpaperGeneratorService,
  LiveWallpaper,
  ParticleType,
  PARTICLE_PRESETS,
  JEDI_PARTICLE_PRESETS,
  TOUCH_PRESETS,
} from '@/lib/services/live-wallpaper-generator-service';

type TabType = 'gallery' | 'create' | 'particles' | 'settings';

export default function LiveWallpaperScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [wallpapers, setWallpapers] = useState<LiveWallpaper[]>([]);
  const [activeWallpaper, setActiveWallpaper] = useState<LiveWallpaper | undefined>();
  const [selectedParticles, setSelectedParticles] = useState<ParticleType[]>(['stars']);
  const [previewAnimation, setPreviewAnimation] = useState<number[]>([]);

  useEffect(() => {
    loadData();
    const unsubscribe = liveWallpaperGeneratorService.subscribe(loadData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Animate preview particles
    const interval = setInterval(() => {
      setPreviewAnimation(Array.from({ length: 30 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        opacity: Math.random() * 0.5 + 0.5,
      })) as any);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(() => {
    setWallpapers(liveWallpaperGeneratorService.getAllWallpapers());
    setActiveWallpaper(liveWallpaperGeneratorService.getActiveWallpaper());
  }, []);

  const haptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const setActive = (id: string) => {
    haptic();
    liveWallpaperGeneratorService.setActiveWallpaper(id);
  };

  const toggleFavorite = (id: string) => {
    haptic();
    liveWallpaperGeneratorService.toggleFavorite(id);
  };

  const toggleParticle = (type: ParticleType) => {
    haptic();
    setSelectedParticles(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const createWallpaper = () => {
    haptic();
    const wallpaper = liveWallpaperGeneratorService.convertToLiveWallpaper(
      'custom_image.png',
      `Custom Wallpaper ${Date.now()}`,
      selectedParticles
    );
    liveWallpaperGeneratorService.setActiveWallpaper(wallpaper.id);
    setActiveTab('gallery');
  };

  const getParticleColor = (type: ParticleType): string => {
    const preset = PARTICLE_PRESETS[type] || JEDI_PARTICLE_PRESETS[type];
    if (!preset) return colors.primary;
    const color = preset.color;
    return Array.isArray(color) ? color[0] : color;
  };

  const renderGallery = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Active Wallpaper Banner */}
      {activeWallpaper && (
        <View style={[styles.activeBanner, { backgroundColor: activeWallpaper.backgroundColor }]}>
          <View style={styles.activePreview}>
            {/* Animated particles preview */}
            {(previewAnimation as any[]).map((particle: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.previewParticle,
                  {
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    width: particle.size,
                    height: particle.size,
                    opacity: particle.opacity,
                    backgroundColor: activeWallpaper.particles[0]?.color 
                      ? (Array.isArray(activeWallpaper.particles[0].color) 
                          ? activeWallpaper.particles[0].color[0] 
                          : activeWallpaper.particles[0].color)
                      : '#FFFFFF',
                  }
                ]}
              />
            ))}
          </View>
          <View style={styles.activeInfo}>
            <Text style={styles.activeLabel}>Now Active</Text>
            <Text style={styles.activeName}>{activeWallpaper.name}</Text>
            <Text style={styles.activeDescription}>{activeWallpaper.description}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live Wallpapers</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Animated backgrounds with particle effects
        </Text>
      </View>

      {/* JEDI Section */}
      <Text style={[styles.categoryTitle, { color: colors.primary }]}>⚔️ JEDI Collection</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {wallpapers.filter(w => w.tags.includes('jedi')).map((wallpaper) => (
          <TouchableOpacity
            key={wallpaper.id}
            style={[
              styles.wallpaperCard, 
              { 
                backgroundColor: wallpaper.backgroundColor,
                borderColor: wallpaper.isActive ? colors.primary : 'transparent',
                borderWidth: wallpaper.isActive ? 3 : 0,
              }
            ]}
            onPress={() => setActive(wallpaper.id)}
          >
            <View style={styles.wallpaperPreview}>
              {/* Mini particle animation */}
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniParticle,
                    {
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                      backgroundColor: wallpaper.particles[0]?.color 
                        ? (Array.isArray(wallpaper.particles[0].color) 
                            ? wallpaper.particles[0].color[0] 
                            : wallpaper.particles[0].color)
                        : '#FFFFFF',
                    }
                  ]}
                />
              ))}
            </View>
            <View style={styles.wallpaperInfo}>
              <Text style={styles.wallpaperName}>{wallpaper.name}</Text>
              <View style={styles.wallpaperMeta}>
                <Text style={styles.wallpaperFps}>{wallpaper.fps} FPS</Text>
                {wallpaper.isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
              </View>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(wallpaper.id)}
            >
              <Text style={styles.favoriteButtonText}>{wallpaper.isFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Nature Section */}
      <Text style={[styles.categoryTitle, { color: '#2ECC71' }]}>🌿 Nature Collection</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {wallpapers.filter(w => w.tags.includes('nature')).map((wallpaper) => (
          <TouchableOpacity
            key={wallpaper.id}
            style={[
              styles.wallpaperCard, 
              { 
                backgroundColor: wallpaper.backgroundColor,
                borderColor: wallpaper.isActive ? colors.primary : 'transparent',
                borderWidth: wallpaper.isActive ? 3 : 0,
              }
            ]}
            onPress={() => setActive(wallpaper.id)}
          >
            <View style={styles.wallpaperPreview}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniParticle,
                    {
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                      backgroundColor: wallpaper.particles[0]?.color 
                        ? (Array.isArray(wallpaper.particles[0].color) 
                            ? wallpaper.particles[0].color[0] 
                            : wallpaper.particles[0].color)
                        : '#FFFFFF',
                    }
                  ]}
                />
              ))}
            </View>
            <View style={styles.wallpaperInfo}>
              <Text style={styles.wallpaperName}>{wallpaper.name}</Text>
              <View style={styles.wallpaperMeta}>
                <Text style={styles.wallpaperFps}>{wallpaper.fps} FPS</Text>
                {wallpaper.isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tech Section */}
      <Text style={[styles.categoryTitle, { color: '#00FF00' }]}>💻 Tech Collection</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {wallpapers.filter(w => w.tags.includes('tech')).map((wallpaper) => (
          <TouchableOpacity
            key={wallpaper.id}
            style={[
              styles.wallpaperCard, 
              { 
                backgroundColor: wallpaper.backgroundColor,
                borderColor: wallpaper.isActive ? colors.primary : 'transparent',
                borderWidth: wallpaper.isActive ? 3 : 0,
              }
            ]}
            onPress={() => setActive(wallpaper.id)}
          >
            <View style={styles.wallpaperPreview}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniParticle,
                    {
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                      backgroundColor: '#00FF00',
                    }
                  ]}
                />
              ))}
            </View>
            <View style={styles.wallpaperInfo}>
              <Text style={styles.wallpaperName}>{wallpaper.name}</Text>
              <View style={styles.wallpaperMeta}>
                <Text style={styles.wallpaperFps}>{wallpaper.fps} FPS</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );

  const renderCreate = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Create Wallpaper</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Convert your images to live wallpapers
        </Text>
      </View>

      {/* Preview */}
      <View style={[styles.createPreview, { backgroundColor: '#0A0A1A' }]}>
        {(previewAnimation as any[]).map((particle: any, index: number) => (
          <View
            key={index}
            style={[
              styles.previewParticle,
              {
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                backgroundColor: selectedParticles.length > 0 
                  ? getParticleColor(selectedParticles[0])
                  : '#FFFFFF',
              }
            ]}
          />
        ))}
        <View style={styles.previewOverlay}>
          <Text style={styles.previewText}>Live Preview</Text>
        </View>
      </View>

      {/* Particle Selection */}
      <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>Select Particles</Text>
      <View style={styles.particleGrid}>
        {Object.keys({ ...PARTICLE_PRESETS, ...JEDI_PARTICLE_PRESETS }).map((type) => {
          const isSelected = selectedParticles.includes(type as ParticleType);
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.particleOption,
                {
                  backgroundColor: isSelected ? getParticleColor(type as ParticleType) + '30' : colors.surface,
                  borderColor: isSelected ? getParticleColor(type as ParticleType) : colors.border,
                }
              ]}
              onPress={() => toggleParticle(type as ParticleType)}
            >
              <View style={[styles.particleDot, { backgroundColor: getParticleColor(type as ParticleType) }]} />
              <Text style={[styles.particleLabel, { color: isSelected ? colors.foreground : colors.muted }]}>
                {type.replace(/-/g, ' ')}
              </Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={createWallpaper}
      >
        <Text style={styles.createButtonText}>✨ Create Live Wallpaper</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderParticles = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Particle Library</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Available particle effects
        </Text>
      </View>

      {/* Standard Particles */}
      <Text style={[styles.categoryTitle, { color: colors.foreground }]}>Standard Effects</Text>
      {Object.entries(PARTICLE_PRESETS).map(([type, config]) => (
        <View 
          key={type}
          style={[styles.particleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.particlePreview, { backgroundColor: '#0A0A1A' }]}>
            {Array.from({ length: 15 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.miniParticle,
                  {
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    width: config.size.min + Math.random() * (config.size.max - config.size.min),
                    height: config.size.min + Math.random() * (config.size.max - config.size.min),
                    backgroundColor: Array.isArray(config.color) ? config.color[0] : config.color,
                    opacity: config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min),
                  }
                ]}
              />
            ))}
          </View>
          <View style={styles.particleInfo}>
            <Text style={[styles.particleName, { color: colors.foreground }]}>{type}</Text>
            <Text style={[styles.particleDetails, { color: colors.muted }]}>
              {config.count} particles • {config.motion} motion
            </Text>
            <View style={styles.particleTags}>
              {config.glow > 0 && <View style={[styles.tag, { backgroundColor: '#FFD700' }]}><Text style={styles.tagText}>Glow</Text></View>}
              {config.trail.enabled && <View style={[styles.tag, { backgroundColor: '#9B59B6' }]}><Text style={styles.tagText}>Trail</Text></View>}
              {config.interactive && <View style={[styles.tag, { backgroundColor: '#3498DB' }]}><Text style={styles.tagText}>Interactive</Text></View>}
            </View>
          </View>
        </View>
      ))}

      {/* JEDI Particles */}
      <Text style={[styles.categoryTitle, { color: colors.primary }]}>⚔️ JEDI Effects</Text>
      {Object.entries(JEDI_PARTICLE_PRESETS).map(([type, config]) => (
        <View 
          key={type}
          style={[styles.particleCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
        >
          <View style={[styles.particlePreview, { backgroundColor: '#0A0A1A' }]}>
            {Array.from({ length: 15 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.miniParticle,
                  {
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    width: config.size.min + Math.random() * (config.size.max - config.size.min),
                    height: config.size.min + Math.random() * (config.size.max - config.size.min),
                    backgroundColor: Array.isArray(config.color) ? config.color[0] : config.color,
                    opacity: config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min),
                  }
                ]}
              />
            ))}
          </View>
          <View style={styles.particleInfo}>
            <Text style={[styles.particleName, { color: colors.foreground }]}>{type}</Text>
            <Text style={[styles.particleDetails, { color: colors.muted }]}>
              {config.count} particles • {config.motion} motion
            </Text>
            <View style={styles.particleTags}>
              <View style={[styles.tag, { backgroundColor: colors.primary }]}><Text style={styles.tagText}>JEDI</Text></View>
              {config.glow > 0 && <View style={[styles.tag, { backgroundColor: '#FFD700' }]}><Text style={styles.tagText}>Glow</Text></View>}
              {config.trail.enabled && <View style={[styles.tag, { backgroundColor: '#9B59B6' }]}><Text style={styles.tagText}>Trail</Text></View>}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSettings = () => {
    const analytics = liveWallpaperGeneratorService.getAnalytics();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Wallpaper Settings</Text>
        </View>

        {/* Analytics */}
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.analyticsTitle, { color: colors.foreground }]}>Usage Analytics</Text>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.primary }]}>{analytics.totalWallpapers}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Wallpapers</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#2ECC71' }]}>{analytics.avgFps}</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Avg FPS</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#F39C12' }]}>{analytics.batteryImpact}%</Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Battery/hr</Text>
            </View>
          </View>
        </View>

        {/* Touch Interactions */}
        <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>Touch Interactions</Text>
        <View style={styles.touchGrid}>
          {Object.entries(TOUCH_PRESETS).map(([type, config]) => (
            <View 
              key={type}
              style={[styles.touchOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.touchIcon, { backgroundColor: config.color }]}>
                <Text style={styles.touchIconText}>
                  {type === 'ripple' ? '💧' :
                   type === 'attract' ? '🧲' :
                   type === 'repel' ? '💨' :
                   type === 'explode' ? '💥' :
                   type === 'trail' ? '✨' :
                   type === 'glow' ? '💡' : '🌀'}
                </Text>
              </View>
              <Text style={[styles.touchLabel, { color: colors.foreground }]}>{type}</Text>
              <Text style={[styles.touchRadius, { color: colors.muted }]}>{config.radius}px</Text>
            </View>
          ))}
        </View>

        {/* Battery Mode */}
        <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
          <View style={styles.settingHeader}>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>🔋 Battery Saver</Text>
            <View style={[styles.settingBadge, { backgroundColor: '#2ECC71' }]}>
              <Text style={styles.settingBadgeText}>ON</Text>
            </View>
          </View>
          <Text style={[styles.settingDescription, { color: colors.muted }]}>
            Automatically reduces FPS and particles when battery is low
          </Text>
        </View>

        {/* Export/Import */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionButtonText}>📤 Export All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.muted }]}>
            <Text style={styles.actionButtonText}>📥 Import</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Live Wallpapers</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['gallery', 'create', 'particles', 'settings'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { haptic(); setActiveTab(tab); }}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === 'gallery' ? '🖼️ Gallery' :
               tab === 'create' ? '✨ Create' :
               tab === 'particles' ? '⭐ Particles' : '⚙️ Settings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'gallery' && renderGallery()}
      {activeTab === 'create' && renderCreate()}
      {activeTab === 'particles' && renderParticles()}
      {activeTab === 'settings' && renderSettings()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerRight: { width: 60 },
  tabs: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: '500' },
  tabContent: { flex: 1, padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14 },
  activeBanner: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  activePreview: { height: 150, position: 'relative' },
  previewParticle: { position: 'absolute', borderRadius: 50 },
  activeInfo: { padding: 16 },
  activeLabel: { color: '#FFFFFF', fontSize: 12, opacity: 0.8 },
  activeName: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 4 },
  activeDescription: { color: '#FFFFFF', fontSize: 14, opacity: 0.8, marginTop: 4 },
  categoryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  horizontalScroll: { marginBottom: 16 },
  wallpaperCard: { width: 160, borderRadius: 12, marginRight: 12, overflow: 'hidden' },
  wallpaperPreview: { height: 100, position: 'relative' },
  miniParticle: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  wallpaperInfo: { padding: 12 },
  wallpaperName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  wallpaperMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  wallpaperFps: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  favoriteIcon: { marginLeft: 6 },
  favoriteButton: { position: 'absolute', top: 8, right: 8, padding: 4 },
  favoriteButtonText: { fontSize: 20 },
  createPreview: { height: 200, borderRadius: 16, marginBottom: 20, position: 'relative', overflow: 'hidden' },
  previewOverlay: { position: 'absolute', bottom: 16, left: 16 },
  previewText: { color: '#FFFFFF', fontSize: 14, opacity: 0.8 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  particleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  particleOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 2, flexDirection: 'row', alignItems: 'center' },
  particleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  particleLabel: { fontSize: 12, textTransform: 'capitalize' },
  checkmark: { marginLeft: 6, color: '#2ECC71' },
  createButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  particleCard: { flexDirection: 'row', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  particlePreview: { width: 80, height: 80, position: 'relative' },
  particleInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  particleName: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  particleDetails: { fontSize: 12, marginTop: 4 },
  particleTags: { flexDirection: 'row', gap: 4, marginTop: 8 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  analyticsCard: { borderRadius: 12, padding: 16, marginBottom: 20 },
  analyticsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  analyticsItem: { alignItems: 'center' },
  analyticsValue: { fontSize: 24, fontWeight: '700' },
  analyticsLabel: { fontSize: 10, marginTop: 4 },
  touchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  touchOption: { width: '30%', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  touchIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  touchIconText: { fontSize: 20 },
  touchLabel: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  touchRadius: { fontSize: 10, marginTop: 2 },
  settingCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  settingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  settingBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  settingDescription: { fontSize: 14 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
