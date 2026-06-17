/**
 * Smartwatch Face Designer Screen
 * MediVac WACHS v8.7
 * Visual editor with drag-and-drop, animated previews, and JEDI themes
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  smartwatchFaceDesignerService,
  WatchFace,
  FaceTemplate,
  JEDI_COLOR_THEMES,
  FACE_EFFECTS,
  FACE_SOUNDS,
} from '@/lib/services/smartwatch-face-designer-service';

type TabType = 'faces' | 'templates' | 'editor' | 'themes';

const STYLE_ICONS: Record<string, string> = {
  'analog': '⏰',
  'digital': '🔢',
  'hybrid': '⚡',
  'infograph': '📊',
  'modular': '🧩',
  'jedi-classic': '⚔️',
  'jedi-hologram': '🌐',
};

const CATEGORY_ICONS: Record<string, string> = {
  'classic': '🕰️',
  'modern': '✨',
  'sport': '🏃',
  'medical': '🏥',
  'jedi': '⚔️',
  'minimal': '◯',
  'luxury': '💎',
};

export default function WatchFaceDesignerScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('faces');
  const [faces, setFaces] = useState<WatchFace[]>([]);
  const [templates, setTemplates] = useState<FaceTemplate[]>([]);
  const [selectedFace, setSelectedFace] = useState<WatchFace | null>(null);
  const [previewMode, setPreviewMode] = useState<'design' | 'live' | 'ambient'>('design');

  useEffect(() => {
    loadData();
    const unsubscribe = smartwatchFaceDesignerService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const loadData = () => {
    setFaces(smartwatchFaceDesignerService.getAllFaces());
    setTemplates(smartwatchFaceDesignerService.getAllTemplates());
    const state = smartwatchFaceDesignerService.getState();
    if (state.selectedFace) {
      setSelectedFace(smartwatchFaceDesignerService.getFace(state.selectedFace) || null);
    }
  };

  const selectFace = (face: WatchFace) => {
    smartwatchFaceDesignerService.selectFace(face.id);
    setSelectedFace(face);
    setActiveTab('editor');
  };

  const duplicateFace = (face: WatchFace) => {
    smartwatchFaceDesignerService.duplicateFace(face.id, `${face.name} Copy`);
    loadData();
  };

  const applyTemplate = (template: FaceTemplate) => {
    const newFace = smartwatchFaceDesignerService.applyTemplate(template.id);
    if (newFace) {
      setSelectedFace(newFace);
      setActiveTab('editor');
    }
  };

  const applyTheme = (themeName: string) => {
    if (selectedFace) {
      smartwatchFaceDesignerService.applyColorTheme(selectedFace.id, themeName);
      loadData();
    }
  };

  const renderFacesTab = () => (
    <FlatList
      data={faces}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => selectFace(item)}
          style={{
            backgroundColor: item.colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: item.colors.primary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Watch Preview */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: item.backgroundColor,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: item.colors.primary,
              shadowColor: item.colors.glow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
            }}>
              <Text style={{ fontSize: 32 }}>{STYLE_ICONS[item.style] || '⌚'}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: item.colors.text }}>{item.name}</Text>
                {item.isDefault && (
                  <View style={{ backgroundColor: item.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '600' }}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: item.colors.textSecondary, marginTop: 2 }}>{item.style}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                <View style={{ backgroundColor: item.colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: item.colors.textSecondary }}>{item.complications.length} complications</Text>
                </View>
                <View style={{ backgroundColor: item.colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: item.colors.textSecondary }}>{item.colors.name}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <Pressable
              onPress={() => selectFace(item)}
              style={{ flex: 1, backgroundColor: item.colors.primary, padding: 10, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => duplicateFace(item)}
              style={{ flex: 1, backgroundColor: item.colors.background, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: item.colors.primary }}
            >
              <Text style={{ color: item.colors.primary, fontWeight: '600', fontSize: 12 }}>Duplicate</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    />
  );

  const renderTemplatesTab = () => (
    <FlatList
      data={templates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => applyTemplate(item)}
          style={{
            backgroundColor: item.colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: item.colors.primary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: item.colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>{item.thumbnail}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: item.colors.text }}>{item.name}</Text>
                {item.isPremium && (
                  <View style={{ backgroundColor: '#F39C12', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '600' }}>PREMIUM</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: item.colors.textSecondary, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: item.colors.textSecondary }}>{CATEGORY_ICONS[item.category]} {item.category}</Text>
                <Text style={{ fontSize: 10, color: item.colors.textSecondary }}>⬇️ {item.downloadCount.toLocaleString()}</Text>
                <Text style={{ fontSize: 10, color: '#F39C12' }}>⭐ {item.rating}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      )}
    />
  );

  const renderEditorTab = () => {
    if (!selectedFace) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⌚</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>Select a face to edit</Text>
        </View>
      );
    }

    const preview = smartwatchFaceDesignerService.generatePreview(selectedFace.id);

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Preview Mode Selector */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, borderRadius: 12, marginBottom: 16 }}>
          {(['design', 'live', 'ambient'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setPreviewMode(mode)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: previewMode === mode ? selectedFace.colors.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: previewMode === mode ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Watch Face Preview */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: selectedFace.backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: selectedFace.colors.primary,
            shadowColor: selectedFace.colors.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: previewMode === 'ambient' ? 0.3 : 0.8,
            shadowRadius: 20,
          }}>
            <Text style={{ fontSize: 64 }}>{STYLE_ICONS[selectedFace.style] || '⌚'}</Text>
            <Text style={{ fontSize: 12, color: selectedFace.colors.text, marginTop: 8 }}>{selectedFace.name}</Text>
          </View>
        </View>

        {/* ASCII Preview */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>Layout Preview</Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.foreground, lineHeight: 16 }}>{preview}</Text>
        </View>

        {/* Complications */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Complications ({selectedFace.complications.length})</Text>
          {selectedFace.complications.map((comp, idx) => (
            <View key={comp.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: idx < selectedFace.complications.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: comp.style.accentColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 14 }}>{comp.data?.icon || '📊'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.foreground }}>{comp.type.replace(/-/g, ' ')}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{comp.position.zone} • {comp.size}</Text>
              </View>
              {comp.animation && (
                <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: colors.muted }}>{comp.animation.type}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Animations */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Animations</Text>
          {[
            { label: 'On Wake', value: selectedFace.animations.onWake },
            { label: 'On Sleep', value: selectedFace.animations.onSleep },
            { label: 'Ambient', value: selectedFace.animations.ambient },
            { label: 'On Notification', value: selectedFace.animations.onNotification },
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.muted }}>{item.label}</Text>
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Color Theme */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Color Theme: {selectedFace.colors.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Primary', color: selectedFace.colors.primary },
              { label: 'Secondary', color: selectedFace.colors.secondary },
              { label: 'Accent', color: selectedFace.colors.accent },
              { label: 'Background', color: selectedFace.colors.background },
              { label: 'Glow', color: selectedFace.colors.glow },
            ].map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: item.color, borderWidth: 1, borderColor: colors.border }} />
                <Text style={{ fontSize: 10, color: colors.muted }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderThemesTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>JEDI Color Themes</Text>
      {Object.entries(JEDI_COLOR_THEMES).map(([key, theme]) => (
        <Pressable
          key={key}
          onPress={() => applyTheme(key)}
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: theme.primary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.background,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: theme.glow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
            }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primary }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>{theme.name}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
                {[theme.primary, theme.secondary, theme.accent, theme.success, theme.warning, theme.error].map((c, idx) => (
                  <View key={idx} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c }} />
                ))}
              </View>
            </View>
            {selectedFace && (
              <Pressable
                onPress={() => applyTheme(key)}
                style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}>Apply</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      ))}

      {/* Effects Info */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>✨ Face Effects</Text>
        <View style={{ gap: 8 }}>
          {Object.entries(FACE_EFFECTS).map(([key, effect]) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: effect.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, color: '#FFFFFF' }}>✨</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>{effect.duration}ms</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sounds Info */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>🔊 Face Sounds</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(FACE_SOUNDS).map(([key, value]) => (
            <View key={key} style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#9B59B6', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Watch Face Designer</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {faces.length} faces • {templates.length} templates
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['faces', 'templates', 'editor', 'themes'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? '#9B59B6' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 11 }}>
              {tab === 'faces' ? '⌚ Faces' : tab === 'templates' ? '📋 Templates' : tab === 'editor' ? '✏️ Editor' : '🎨 Themes'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'faces' && renderFacesTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'editor' && renderEditorTab()}
        {activeTab === 'themes' && renderThemesTab()}
      </View>
    </ScreenContainer>
  );
}
