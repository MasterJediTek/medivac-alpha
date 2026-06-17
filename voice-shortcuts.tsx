/**
 * Voice Command Shortcuts Screen
 * MediVac WACHS v8.8
 * Macro chains for voice commands with visual effects
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  voiceCommandShortcutsService,
  Macro,
  MacroExecution,
  MACRO_CATEGORIES,
  MACRO_EFFECTS,
} from '@/lib/services/voice-command-shortcuts-service';

type TabType = 'macros' | 'favorites' | 'running' | 'history';

export default function VoiceShortcutsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('macros');
  const [macros, setMacros] = useState<Macro[]>([]);
  const [currentExecution, setCurrentExecution] = useState<MacroExecution | null>(null);
  const [executionHistory, setExecutionHistory] = useState<MacroExecution[]>([]);

  useEffect(() => {
    loadData();
    const unsubscribe = voiceCommandShortcutsService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const loadData = () => {
    setMacros(voiceCommandShortcutsService.getAllMacros());
    setCurrentExecution(voiceCommandShortcutsService.getCurrentExecution());
    setExecutionHistory(voiceCommandShortcutsService.getExecutionHistory());
  };

  const executeMacro = (macroId: string) => {
    voiceCommandShortcutsService.executeMacro(macroId, 'manual');
    setActiveTab('running');
  };

  const toggleFavorite = (macroId: string) => {
    voiceCommandShortcutsService.toggleFavorite(macroId);
  };

  const toggleEnabled = (macroId: string) => {
    voiceCommandShortcutsService.toggleEnabled(macroId);
  };

  const renderMacroCard = (macro: Macro) => {
    const category = MACRO_CATEGORIES[macro.category];
    const effect = macro.status === 'running' ? MACRO_EFFECTS.running : 
                   macro.status === 'paused' ? MACRO_EFFECTS.paused : null;

    return (
      <Pressable
        key={macro.id}
        onPress={() => executeMacro(macro.id)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: macro.color,
          opacity: macro.isEnabled ? 1 : 0.5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: macro.color + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 24 }}>{macro.icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{macro.name}</Text>
              {macro.isFavorite && <Text style={{ fontSize: 12 }}>⭐</Text>}
              {macro.isBuiltIn && (
                <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 8, color: colors.primary, fontWeight: '600' }}>BUILT-IN</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={2}>{macro.description}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              <View style={{ backgroundColor: category.color + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: category.color }}>{category.icon} {category.label}</Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.muted }}>{macro.commands.length} commands</Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <Pressable onPress={() => toggleFavorite(macro.id)}>
              <Text style={{ fontSize: 20 }}>{macro.isFavorite ? '⭐' : '☆'}</Text>
            </Pressable>
            <Pressable onPress={() => toggleEnabled(macro.id)}>
              <View style={{
                width: 40,
                height: 24,
                borderRadius: 12,
                backgroundColor: macro.isEnabled ? '#2ECC71' : colors.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  alignSelf: macro.isEnabled ? 'flex-end' : 'flex-start',
                }} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Voice triggers */}
        {macro.triggers.filter(t => t.type === 'voice' && t.isEnabled).length > 0 && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4 }}>Voice triggers:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {macro.triggers
                .filter(t => t.type === 'voice' && t.isEnabled)
                .flatMap(t => (t.config.phrases as string[]) || [])
                .slice(0, 3)
                .map((phrase, idx) => (
                  <View key={idx} style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.foreground }}>"{phrase}"</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Status indicator */}
        {effect && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: effect.color,
          }} />
        )}
      </Pressable>
    );
  };

  const renderMacrosTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {Object.entries(MACRO_CATEGORIES).map(([key, category]) => {
        const categoryMacros = macros.filter(m => m.category === key);
        if (categoryMacros.length === 0) return null;

        return (
          <View key={key} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 20 }}>{category.icon}</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{category.label}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>({categoryMacros.length})</Text>
            </View>
            {categoryMacros.map(renderMacroCard)}
          </View>
        );
      })}
    </ScrollView>
  );

  const renderFavoritesTab = () => {
    const favorites = macros.filter(m => m.isFavorite);

    if (favorites.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No favorite macros yet</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Tap the star on any macro to add it</Text>
        </View>
      );
    }

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {favorites.map(renderMacroCard)}
      </ScrollView>
    );
  };

  const renderRunningTab = () => {
    if (!currentExecution) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⏸️</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No macro running</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Select a macro to execute</Text>
        </View>
      );
    }

    const macro = voiceCommandShortcutsService.getMacro(currentExecution.macroId);
    if (!macro) return null;

    const progress = (currentExecution.currentCommandIndex / macro.commands.length) * 100;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Execution header */}
        <View style={{
          backgroundColor: macro.color + '20',
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>{macro.icon}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>{macro.name}</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            {currentExecution.status === 'running' ? 'Running...' : currentExecution.status}
          </Text>

          {/* Progress bar */}
          <View style={{ width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 16 }}>
            <View style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: macro.color,
              borderRadius: 4,
            }} />
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
            {currentExecution.currentCommandIndex} / {macro.commands.length} commands
          </Text>
        </View>

        {/* Commands list */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Commands</Text>
        {macro.commands.map((cmd, idx) => {
          const result = currentExecution.commandResults[idx];
          const isComplete = result !== undefined;
          const isCurrent = idx === currentExecution.currentCommandIndex;

          return (
            <View
              key={cmd.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: isCurrent ? macro.color + '20' : colors.surface,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: isCurrent ? 2 : 0,
                borderColor: macro.color,
              }}
            >
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isComplete ? (result.success ? '#2ECC71' : '#E74C3C') : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {isComplete ? (result.success ? '✓' : '✗') : idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.foreground }}>{cmd.label}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{cmd.action}</Text>
              </View>
              {isCurrent && (
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: macro.color }} />
              )}
            </View>
          );
        })}

        {/* Control buttons */}
        {currentExecution.status === 'running' && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={() => voiceCommandShortcutsService.pauseExecution(currentExecution.id)}
              style={{ flex: 1, backgroundColor: '#F39C12', padding: 16, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>⏸️ Pause</Text>
            </Pressable>
            <Pressable
              onPress={() => voiceCommandShortcutsService.cancelExecution(currentExecution.id)}
              style={{ flex: 1, backgroundColor: '#E74C3C', padding: 16, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>⏹️ Cancel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderHistoryTab = () => {
    if (executionHistory.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📜</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No execution history</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={executionHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const macro = voiceCommandShortcutsService.getMacro(item.macroId);
          if (!macro) return null;

          const duration = item.completedAt ? item.completedAt - item.startedAt : 0;
          const successCount = item.commandResults.filter(r => r.success).length;

          return (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: item.status === 'completed' ? '#2ECC71' : item.status === 'failed' ? '#E74C3C' : '#F39C12',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 24 }}>{macro.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{macro.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {new Date(item.startedAt).toLocaleString()}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: item.status === 'completed' ? '#2ECC71' : item.status === 'failed' ? '#E74C3C' : '#F39C12',
                }}>
                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>⏱️ {duration}ms</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>✓ {successCount}/{item.commandResults.length}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>📍 {item.triggeredBy}</Text>
              </View>
            </View>
          );
        }}
      />
    );
  };

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#9B59B6', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Voice Shortcuts</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {macros.length} macros • {macros.filter(m => m.isFavorite).length} favorites
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['macros', 'favorites', 'running', 'history'] as TabType[]).map((tab) => (
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
              {tab === 'macros' ? '📋 All' : tab === 'favorites' ? '⭐ Favs' : tab === 'running' ? '▶️ Running' : '📜 History'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'macros' && renderMacrosTab()}
        {activeTab === 'favorites' && renderFavoritesTab()}
        {activeTab === 'running' && renderRunningTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </View>
    </ScreenContainer>
  );
}
