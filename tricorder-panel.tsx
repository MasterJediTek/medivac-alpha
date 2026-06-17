/**
 * Tricorder Control Panel Screen
 * Interactive control panel for equipped Tricorder devices
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  tricorderService,
  Tricorder,
  TricorderAbility,
  TricorderType,
} from '@/lib/services/tricorder-service';
import { avatarService, Avatar } from '@/lib/services/avatar-service';
import { petService, Pet } from '@/lib/services/pet-service';

type ScanMode = 'medical' | 'engineering' | 'science' | 'tactical' | 'environmental';

interface ScanResult {
  timestamp: string;
  mode: ScanMode;
  ability: string;
  result: string;
  success: boolean;
}

export default function TricorderPanelScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [equippedTricorder, setEquippedTricorder] = useState<Tricorder | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{ type: 'user' | 'avatar' | 'pet'; name: string } | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('medical');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [selectedAbility, setSelectedAbility] = useState<TricorderAbility | null>(null);

  useEffect(() => {
    loadTricorderData();
  }, []);

  const loadTricorderData = async () => {
    setLoading(true);
    try {
      await tricorderService.initialize();
      await avatarService.initialize();
      await petService.initialize();

      // Find any equipped tricorder
      const tricorders = tricorderService.getTricorders();
      const equipped = tricorders.find(t => t.equipped);

      if (equipped) {
        setEquippedTricorder(equipped);
        setOwnerInfo({ type: equipped.ownerType, name: equipped.ownerName });
        setScanMode(equipped.type as ScanMode);
        if (equipped.abilities.length > 0) {
          setSelectedAbility(equipped.abilities[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load tricorder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performScan = async () => {
    if (!equippedTricorder || !selectedAbility || scanning) return;

    setScanning(true);
    
    // Simulate scan duration
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await tricorderService.useTricorder(equippedTricorder.id, selectedAbility.id);

    const scanResult: ScanResult = {
      timestamp: new Date().toISOString(),
      mode: scanMode,
      ability: selectedAbility.name,
      result: result.result || result.error || 'Scan complete',
      success: result.success,
    };

    setScanResults(prev => [scanResult, ...prev.slice(0, 9)]);
    setBatteryLevel(prev => Math.max(0, prev - selectedAbility.energyCost));
    setScanning(false);

    // Reload tricorder data to get updated stats
    await loadTricorderData();
  };

  const getModeColor = (mode: ScanMode): string => {
    const modeColors: Record<ScanMode, string> = {
      medical: '#3B82F6',
      engineering: '#F97316',
      science: '#8B5CF6',
      tactical: '#EF4444',
      environmental: '#10B981',
    };
    return modeColors[mode];
  };

  const getModeIcon = (mode: ScanMode): string => {
    const icons: Record<ScanMode, string> = {
      medical: '🏥',
      engineering: '⚙️',
      science: '🔬',
      tactical: '🎯',
      environmental: '🌍',
    };
    return icons[mode];
  };

  const getRarityColor = (rarity: string): string => {
    const rarityColors: Record<string, string> = {
      common: '#9CA3AF',
      uncommon: '#22C55E',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
    };
    return rarityColors[rarity] || colors.foreground;
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Initializing Tricorder Systems...
        </Text>
      </ScreenContainer>
    );
  }

  if (!equippedTricorder) {
    return (
      <ScreenContainer className="flex-1 p-4">
        <View style={[styles.noTricorderContainer, { backgroundColor: colors.surface }]}>
          <Text style={styles.noTricorderIcon}>📡</Text>
          <Text style={[styles.noTricorderTitle, { color: colors.foreground }]}>
            No Tricorder Equipped
          </Text>
          <Text style={[styles.noTricorderText, { color: colors.muted }]}>
            Purchase or equip a Tricorder from the Shop to access the Control Panel.
            Tricorders can be equipped to yourself, your avatar, or your pet.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: getModeColor(scanMode) }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerIcon}>{getModeIcon(scanMode)}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {equippedTricorder.customName || equippedTricorder.name}
              </Text>
              <Text style={styles.headerSubtitle}>
                Level {equippedTricorder.level} • {ownerInfo?.name}
              </Text>
            </View>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(equippedTricorder.rarity) }]}>
              <Text style={styles.rarityText}>{equippedTricorder.rarity.toUpperCase()}</Text>
            </View>
          </View>
          
          {/* Battery Indicator */}
          <View style={styles.batteryContainer}>
            <View style={styles.batteryOuter}>
              <View 
                style={[
                  styles.batteryInner, 
                  { 
                    width: `${batteryLevel}%`,
                    backgroundColor: batteryLevel > 20 ? '#22C55E' : '#EF4444',
                  }
                ]} 
              />
            </View>
            <Text style={styles.batteryText}>{batteryLevel}%</Text>
          </View>
        </View>

        {/* Stats Panel */}
        <View style={[styles.statsPanel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Tricorder Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {equippedTricorder.stats.scanRange}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Range</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {equippedTricorder.stats.scanAccuracy}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {equippedTricorder.stats.processingSpeed}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Speed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {equippedTricorder.totalScans}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Total Scans</Text>
            </View>
          </View>
          
          {/* Experience Bar */}
          <View style={styles.expContainer}>
            <Text style={[styles.expLabel, { color: colors.muted }]}>
              Experience: {equippedTricorder.experience}/{equippedTricorder.experienceToNextLevel}
            </Text>
            <View style={[styles.expBarOuter, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.expBarInner, 
                  { 
                    width: `${(equippedTricorder.experience / equippedTricorder.experienceToNextLevel) * 100}%`,
                    backgroundColor: colors.primary,
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Scan Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Scan Mode
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.modeButtons}>
              {(['medical', 'engineering', 'science', 'tactical', 'environmental'] as ScanMode[]).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    { 
                      backgroundColor: scanMode === mode ? getModeColor(mode) : colors.background,
                      borderColor: getModeColor(mode),
                    }
                  ]}
                  onPress={() => setScanMode(mode)}
                  disabled={equippedTricorder.type !== mode}
                >
                  <Text style={styles.modeIcon}>{getModeIcon(mode)}</Text>
                  <Text style={[
                    styles.modeText,
                    { color: scanMode === mode ? '#FFFFFF' : getModeColor(mode) }
                  ]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Abilities */}
        <View style={[styles.abilitiesPanel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Available Abilities
          </Text>
          {equippedTricorder.abilities.map(ability => (
            <TouchableOpacity
              key={ability.id}
              style={[
                styles.abilityCard,
                { 
                  backgroundColor: selectedAbility?.id === ability.id ? colors.primary + '20' : colors.background,
                  borderColor: selectedAbility?.id === ability.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedAbility(ability)}
            >
              <View style={styles.abilityHeader}>
                <Text style={[styles.abilityName, { color: colors.foreground }]}>
                  {ability.name}
                </Text>
                <View style={styles.abilityStats}>
                  <Text style={[styles.abilityStat, { color: colors.muted }]}>
                    ⚡ {ability.energyCost}%
                  </Text>
                  <Text style={[styles.abilityStat, { color: colors.muted }]}>
                    ⏱️ {ability.cooldown}s
                  </Text>
                </View>
              </View>
              <Text style={[styles.abilityDesc, { color: colors.muted }]}>
                {ability.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            { 
              backgroundColor: scanning ? colors.muted : getModeColor(scanMode),
              opacity: !selectedAbility || batteryLevel < (selectedAbility?.energyCost || 0) ? 0.5 : 1,
            }
          ]}
          onPress={performScan}
          disabled={scanning || !selectedAbility || batteryLevel < (selectedAbility?.energyCost || 0)}
        >
          {scanning ? (
            <>
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.scanButtonText}>SCANNING...</Text>
            </>
          ) : (
            <>
              <Text style={styles.scanButtonIcon}>📡</Text>
              <Text style={styles.scanButtonText}>
                {selectedAbility ? `EXECUTE ${selectedAbility.name.toUpperCase()}` : 'SELECT ABILITY'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Scan Results */}
        {scanResults.length > 0 && (
          <View style={[styles.resultsPanel, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Scan History
            </Text>
            {scanResults.map((result, index) => (
              <View 
                key={index}
                style={[
                  styles.resultCard,
                  { 
                    backgroundColor: colors.background,
                    borderLeftColor: result.success ? '#22C55E' : '#EF4444',
                  }
                ]}
              >
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultAbility, { color: colors.foreground }]}>
                    {result.ability}
                  </Text>
                  <Text style={[styles.resultTime, { color: colors.muted }]}>
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={[styles.resultText, { color: colors.muted }]}>
                  {result.result}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Condition Warning */}
        {equippedTricorder.condition !== 'pristine' && (
          <View style={[styles.warningPanel, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { color: '#92400E' }]}>
                Maintenance Required
              </Text>
              <Text style={[styles.warningText, { color: '#B45309' }]}>
                Tricorder condition: {equippedTricorder.condition}. Visit the shop to repair.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  noTricorderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
    marginTop: 100,
  },
  noTricorderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noTricorderTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  noTricorderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  batteryOuter: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryInner: {
    height: '100%',
    borderRadius: 4,
  },
  batteryText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsPanel: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  expContainer: {
    marginTop: 12,
  },
  expLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  expBarOuter: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  expBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  modeSelector: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  abilitiesPanel: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  abilityCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  abilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  abilityName: {
    fontSize: 14,
    fontWeight: '600',
  },
  abilityStats: {
    flexDirection: 'row',
    gap: 8,
  },
  abilityStat: {
    fontSize: 11,
  },
  abilityDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsPanel: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultAbility: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultTime: {
    fontSize: 11,
  },
  resultText: {
    fontSize: 12,
    lineHeight: 18,
  },
  warningPanel: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
  },
});
