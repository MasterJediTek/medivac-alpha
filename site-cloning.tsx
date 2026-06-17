/**
 * WACHS Site Cloning Screen
 * Duplicate existing site configurations for new site provisioning
 * MediVac One v5.9
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  siteCloningService,
  SiteConfiguration,
  CloneRequest,
  CloneOption,
  CloneComparison,
  CLONE_OPTIONS,
} from "@/lib/services/site-cloning-service";

type ViewMode = 'list' | 'select' | 'configure' | 'preview' | 'progress' | 'history';

export default function SiteCloningScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sites, setSites] = useState<SiteConfiguration[]>([]);
  const [history, setHistory] = useState<CloneRequest[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteConfiguration | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<CloneOption[]>(['network', 'services', 'authentication', 'policies', 'integrations']);
  const [targetName, setTargetName] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [targetRegion, setTargetRegion] = useState('');
  const [comparison, setComparison] = useState<CloneComparison[]>([]);
  const [activeClone, setActiveClone] = useState<CloneRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await siteCloningService.initialize();
      setSites(siteCloningService.getAvailableSites());
      setHistory(siteCloningService.getCloneHistory());
    } catch (error) {
      console.error('Failed to load cloning data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectSite = (site: SiteConfiguration) => {
    setSelectedSite(site);
    setTargetName('');
    setTargetCode('');
    setTargetRegion(site.region);
    setSelectedOptions(['network', 'services', 'authentication', 'policies', 'integrations']);
    setViewMode('configure');
  };

  const handleToggleOption = (option: CloneOption) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handlePreview = () => {
    if (!selectedSite) return;
    if (!targetName.trim() || !targetCode.trim()) {
      Alert.alert('Error', 'Please enter target site name and code');
      return;
    }

    const comp = siteCloningService.generateComparison(selectedSite.id, {});
    setComparison(comp.filter(c => selectedOptions.includes(c.option)));
    setViewMode('preview');
  };

  const handleStartClone = async () => {
    if (!selectedSite) return;

    try {
      const request = await siteCloningService.createCloneRequest({
        sourceSiteId: selectedSite.id,
        targetSiteName: targetName,
        targetSiteCode: targetCode,
        targetRegion: targetRegion,
        selectedOptions,
      });

      setActiveClone(request);
      setViewMode('progress');

      // Execute the clone
      const result = await siteCloningService.executeClone(request.id);
      setActiveClone(result);

      if (result.status === 'completed') {
        Alert.alert('Success', `Site "${targetName}" has been created successfully`);
      }

      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to clone site');
    }
  };

  const stats = siteCloningService.getStatistics();
  const regions = siteCloningService.getRegions();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return colors.success;
      case 'in_progress': return colors.primary;
      case 'pending': return colors.warning;
      case 'failed': return colors.error;
      case 'cancelled': return colors.muted;
      default: return colors.muted;
    }
  };

  const getSiteTypeColor = (type: string): string => {
    switch (type) {
      case 'hospital': return '#3B82F6';
      case 'clinic': return '#10B981';
      case 'health_center': return '#8B5CF6';
      case 'nursing_post': return '#F59E0B';
      case 'remote_clinic': return '#EC4899';
      default: return colors.muted;
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderList = () => (
    <View>
      {/* Stats */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Available Sites</Text>
          <Text className="text-foreground text-xl font-bold">{stats.totalSites}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Clones Created</Text>
          <Text className="text-foreground text-xl font-bold">{stats.successfulClones}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Regions</Text>
          <Text className="text-foreground text-xl font-bold">{regions.length}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={() => setViewMode('select')}
          className="flex-1 bg-[#1E40AF] py-3 rounded-xl"
        >
          <Text className="text-white text-center font-semibold">Clone a Site</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('history')}
          className="flex-1 bg-surface py-3 rounded-xl"
        >
          <Text className="text-foreground text-center font-medium">View History</Text>
        </TouchableOpacity>
      </View>

      {/* Available Sites */}
      <Text className="text-foreground text-lg font-bold mb-3">Available Sites</Text>
      {sites.map((site) => (
        <TouchableOpacity
          key={site.id}
          onPress={() => handleSelectSite(site)}
          className="bg-surface rounded-xl p-4 mb-3"
        >
          <View className="flex-row items-center gap-3">
            <View style={{ backgroundColor: getSiteTypeColor(site.type) }} className="p-3 rounded-xl">
              <IconSymbol name="building.2.fill" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{site.name}</Text>
              <Text className="text-muted text-sm">{site.code} • {site.region.charAt(0).toUpperCase() + site.region.slice(1)}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </View>
          <View className="flex-row items-center gap-3 mt-2">
            <Text className="text-muted text-sm">{site.services.filter(s => s.enabled).length} services</Text>
            <Text className="text-muted text-sm">{site.contacts.length} contacts</Text>
            <View 
              style={{ backgroundColor: getSiteTypeColor(site.type) + '20' }}
              className="px-2 py-1 rounded"
            >
              <Text style={{ color: getSiteTypeColor(site.type) }} className="text-xs capitalize">
                {site.type.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSelect = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Select Source Site</Text>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          className="px-3 py-1 rounded-lg"
          style={{ backgroundColor: colors.error + '20' }}
        >
          <Text style={{ color: colors.error }} className="text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>

      {regions.map((region) => (
        <View key={region} className="mb-4">
          <Text className="text-muted text-sm font-medium mb-2 capitalize">{region} Region</Text>
          {sites.filter(s => s.region === region).map((site) => (
            <TouchableOpacity
              key={site.id}
              onPress={() => handleSelectSite(site)}
              className="bg-surface rounded-xl p-4 mb-2"
            >
              <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: getSiteTypeColor(site.type) }} className="p-2 rounded-lg">
                  <IconSymbol name="building.2.fill" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{site.name}</Text>
                  <Text className="text-muted text-sm">{site.services.filter(s => s.enabled).length} services • {site.network.bandwidth}</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  const renderConfigure = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Configure Clone</Text>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          className="px-3 py-1 rounded-lg"
          style={{ backgroundColor: colors.error + '20' }}
        >
          <Text style={{ color: colors.error }} className="text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Source Site */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-muted text-sm mb-2">Cloning From</Text>
        <View className="flex-row items-center gap-3">
          <View className="bg-[#1E40AF] p-2 rounded-lg">
            <IconSymbol name="building.2.fill" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-foreground font-semibold">{selectedSite?.name}</Text>
            <Text className="text-muted text-sm">{selectedSite?.code} • {selectedSite?.region}</Text>
          </View>
        </View>
      </View>

      {/* Target Site Info */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">New Site Details</Text>
        
        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Site Name *</Text>
          <TextInput
            value={targetName}
            onChangeText={setTargetName}
            placeholder="e.g., Newman Hospital"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Site Code *</Text>
          <TextInput
            value={targetCode}
            onChangeText={setTargetCode}
            placeholder="e.g., NWH"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="characters"
            maxLength={5}
          />
        </View>

        <View>
          <Text className="text-muted text-sm mb-2">Region</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {regions.map((region) => (
                <TouchableOpacity
                  key={region}
                  onPress={() => setTargetRegion(region)}
                  className={`px-4 py-2 rounded-lg ${targetRegion === region ? 'bg-[#1E40AF]' : 'bg-background'}`}
                >
                  <Text className={targetRegion === region ? 'text-white font-medium capitalize' : 'text-muted capitalize'}>
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Clone Options */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">What to Clone</Text>
        
        {CLONE_OPTIONS.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleToggleOption(option.id)}
              className={`flex-row items-center gap-3 p-3 rounded-lg mb-2 ${isSelected ? 'bg-[#1E40AF]/10' : 'bg-background'}`}
            >
              <View className={`w-6 h-6 rounded-md items-center justify-center ${isSelected ? 'bg-[#1E40AF]' : 'bg-border'}`}>
                {isSelected && <Text className="text-white text-xs">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className={isSelected ? 'text-foreground font-medium' : 'text-muted'}>{option.label}</Text>
                <Text className="text-muted text-xs">{option.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handlePreview}
        className="bg-[#1E40AF] py-4 rounded-xl"
      >
        <Text className="text-white text-center font-semibold">Preview Clone</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Clone Preview</Text>
        <TouchableOpacity
          onPress={() => setViewMode('configure')}
          className="px-3 py-1 rounded-lg bg-surface"
        >
          <Text className="text-muted text-sm">Back</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center gap-4 mb-3">
          <View className="flex-1 items-center">
            <Text className="text-muted text-xs mb-1">Source</Text>
            <Text className="text-foreground font-semibold text-center">{selectedSite?.name}</Text>
          </View>
          <IconSymbol name="arrow.right" size={24} color={colors.primary} />
          <View className="flex-1 items-center">
            <Text className="text-muted text-xs mb-1">Target</Text>
            <Text className="text-foreground font-semibold text-center">{targetName}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-muted text-sm">{targetCode}</Text>
          <Text className="text-muted text-sm">•</Text>
          <Text className="text-muted text-sm capitalize">{targetRegion}</Text>
        </View>
      </View>

      {/* Comparison */}
      <Text className="text-foreground font-semibold mb-3">Configuration Comparison</Text>
      {comparison.map((comp) => (
        <View key={comp.option} className="bg-surface rounded-xl p-4 mb-2">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground font-medium capitalize">{comp.option}</Text>
            {comp.willChange ? (
              <View className="bg-warning/20 px-2 py-1 rounded">
                <Text style={{ color: colors.warning }} className="text-xs">Modified</Text>
              </View>
            ) : (
              <View className="bg-success/20 px-2 py-1 rounded">
                <Text style={{ color: colors.success }} className="text-xs">Copied</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-muted text-sm flex-1">{comp.sourceValue}</Text>
            <IconSymbol name="arrow.right" size={16} color={colors.muted} />
            <Text className="text-foreground text-sm flex-1 text-right">{comp.targetValue}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={handleStartClone}
        className="bg-[#1E40AF] py-4 rounded-xl mt-4"
      >
        <Text className="text-white text-center font-semibold">Start Cloning</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgress = () => (
    <View className="flex-1 items-center justify-center py-8">
      <View className="bg-[#1E40AF]/20 p-6 rounded-full mb-6">
        <IconSymbol name="arrow.triangle.2.circlepath" size={48} color="#1E40AF" />
      </View>
      
      <Text className="text-foreground text-xl font-bold mb-2">
        {activeClone?.status === 'completed' ? 'Clone Complete!' : 'Cloning in Progress...'}
      </Text>
      <Text className="text-muted text-center mb-6">
        {activeClone?.status === 'completed' 
          ? `${targetName} has been created successfully`
          : `Creating ${targetName} from ${selectedSite?.name}`
        }
      </Text>

      {/* Progress Bar */}
      <View className="w-full bg-surface rounded-full h-4 mb-4">
        <View 
          className="bg-[#1E40AF] h-4 rounded-full"
          style={{ width: `${activeClone?.progress || 0}%` }}
        />
      </View>
      <Text className="text-foreground font-bold text-lg mb-6">{activeClone?.progress || 0}%</Text>

      {activeClone?.status === 'completed' && (
        <TouchableOpacity
          onPress={() => {
            setViewMode('list');
            setSelectedSite(null);
            setActiveClone(null);
          }}
          className="bg-[#1E40AF] px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHistory = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Clone History</Text>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          className="px-3 py-1 rounded-lg bg-surface"
        >
          <Text className="text-muted text-sm">Back</Text>
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="clock.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No clone history</Text>
        </View>
      ) : (
        history.map((request) => (
          <View key={request.id} className="bg-surface rounded-xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground font-semibold">{request.targetSiteName}</Text>
              <View 
                style={{ backgroundColor: getStatusColor(request.status) + '20' }}
                className="px-2 py-1 rounded"
              >
                <Text style={{ color: getStatusColor(request.status) }} className="text-xs capitalize">
                  {request.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text className="text-muted text-sm mb-1">
              Cloned from: {request.sourceSiteName}
            </Text>
            <Text className="text-muted text-xs">
              {formatDate(request.createdAt)}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Site Cloning</Text>
            <Text className="text-muted">WACHS Configuration Duplication</Text>
          </View>
          <View className="bg-[#1E40AF] p-3 rounded-full">
            <IconSymbol name="doc.on.doc.fill" size={24} color="#FFFFFF" />
          </View>
        </View>

        {viewMode === 'list' && renderList()}
        {viewMode === 'select' && renderSelect()}
        {viewMode === 'configure' && renderConfigure()}
        {viewMode === 'preview' && renderPreview()}
        {viewMode === 'progress' && renderProgress()}
        {viewMode === 'history' && renderHistory()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
