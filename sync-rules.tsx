/**
 * OneDrive Selective Sync Rules Screen
 * Configure automatic sync rules based on file type, folder, or date
 * MediVac One v6.0
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  syncRulesService, 
  SyncRule, 
  RuleType,
  RuleAction,
  RULE_TYPES,
  COMMON_FILE_TYPES
} from "@/lib/services/sync-rules-service";

type TabType = 'rules' | 'create' | 'analytics';

export default function SyncRulesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  const [rules, setRules] = useState<SyncRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<SyncRule | null>(null);
  
  // Create rule state
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'file_type' as RuleType,
    action: 'include' as RuleAction,
    fileTypes: [] as string[],
    folders: '',
    includeSubfolders: true,
    sizeValue: '',
    sizeOperator: 'larger_than',
    namePattern: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await syncRulesService.initialize();
    setRules(syncRulesService.getRules());
    setLoading(false);
  };

  const handleToggleRule = async (id: string) => {
    await syncRulesService.toggleRuleStatus(id);
    loadData();
  };

  const handleDeleteRule = async (id: string) => {
    Alert.alert('Delete Rule', 'Are you sure you want to delete this rule?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await syncRulesService.deleteRule(id);
          setSelectedRule(null);
          loadData();
        }
      },
    ]);
  };

  const handleTestRule = (id: string) => {
    const result = syncRulesService.testRule(id);
    Alert.alert(
      'Test Results',
      `Matched ${result.totalMatched} files\nEstimated size: ${formatSize(result.estimatedSize)}`
    );
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      Alert.alert('Error', 'Please enter a rule name');
      return;
    }

    let conditions: any = {};
    
    switch (newRule.type) {
      case 'file_type':
        if (newRule.fileTypes.length === 0) {
          Alert.alert('Error', 'Please select at least one file type');
          return;
        }
        conditions.fileTypes = newRule.fileTypes;
        break;
      case 'folder':
        if (!newRule.folders.trim()) {
          Alert.alert('Error', 'Please enter folder paths');
          return;
        }
        conditions.folders = newRule.folders.split(',').map(f => f.trim());
        conditions.includeSubfolders = newRule.includeSubfolders;
        break;
      case 'size':
        if (!newRule.sizeValue) {
          Alert.alert('Error', 'Please enter a size value');
          return;
        }
        conditions.sizeOperator = newRule.sizeOperator;
        conditions.sizeValue = parseInt(newRule.sizeValue) * 1024 * 1024; // MB to bytes
        break;
      case 'name_pattern':
        if (!newRule.namePattern.trim()) {
          Alert.alert('Error', 'Please enter a name pattern');
          return;
        }
        conditions.namePattern = newRule.namePattern;
        conditions.caseSensitive = false;
        break;
    }

    await syncRulesService.createRule({
      name: newRule.name,
      description: newRule.description,
      type: newRule.type,
      action: newRule.action,
      conditions,
    });

    setNewRule({
      name: '',
      description: '',
      type: 'file_type',
      action: 'include',
      fileTypes: [],
      folders: '',
      includeSubfolders: true,
      sizeValue: '',
      sizeOperator: 'larger_than',
      namePattern: '',
    });
    setActiveTab('rules');
    loadData();
    Alert.alert('Success', 'Rule created successfully');
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const toggleFileType = (ext: string) => {
    setNewRule(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(ext)
        ? prev.fileTypes.filter(t => t !== ext)
        : [...prev.fileTypes, ext]
    }));
  };

  const renderRules = () => (
    <View className="gap-4">
      {selectedRule ? (
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => setSelectedRule(null)}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text className="text-primary">Back to Rules</Text>
          </TouchableOpacity>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">{selectedRule.name}</Text>
                {selectedRule.description && (
                  <Text className="text-muted mt-1">{selectedRule.description}</Text>
                )}
              </View>
              <View 
                className="px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: selectedRule.status === 'active' ? '#10B98120' : '#F59E0B20'
                }}
              >
                <Text style={{ 
                  color: selectedRule.status === 'active' ? '#10B981' : '#F59E0B'
                }}>
                  {selectedRule.status.charAt(0).toUpperCase() + selectedRule.status.slice(1)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 mb-4">
              <View 
                className="px-2 py-1 rounded"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-muted text-sm">{RULE_TYPES[selectedRule.type].label}</Text>
              </View>
              <View 
                className="px-2 py-1 rounded"
                style={{ 
                  backgroundColor: selectedRule.action === 'include' ? '#10B98120' : '#EF444420'
                }}
              >
                <Text style={{ 
                  color: selectedRule.action === 'include' ? '#10B981' : '#EF4444',
                  fontSize: 12
                }}>
                  {selectedRule.action.toUpperCase()}
                </Text>
              </View>
              <View className="px-2 py-1 rounded bg-background">
                <Text className="text-muted text-sm">Priority: {selectedRule.priority}</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Statistics</Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{selectedRule.stats.matchedFiles}</Text>
                <Text className="text-muted text-sm">Matched</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{selectedRule.stats.syncedFiles}</Text>
                <Text className="text-muted text-sm">Synced</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: '#EF4444' }}>{selectedRule.stats.excludedFiles}</Text>
                <Text className="text-muted text-sm">Excluded</Text>
              </View>
            </View>
            <View className="items-center mt-4 pt-4 border-t border-border">
              <Text className="text-lg font-semibold text-foreground">{formatSize(selectedRule.stats.totalSize)}</Text>
              <Text className="text-muted text-sm">Total Size</Text>
            </View>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Conditions</Text>
            {selectedRule.conditions.fileTypes && (
              <View className="mb-2">
                <Text className="text-muted text-sm">File Types</Text>
                <Text className="text-foreground">{selectedRule.conditions.fileTypes.join(', ')}</Text>
              </View>
            )}
            {selectedRule.conditions.folders && (
              <View className="mb-2">
                <Text className="text-muted text-sm">Folders</Text>
                <Text className="text-foreground">{selectedRule.conditions.folders.join(', ')}</Text>
                <Text className="text-muted text-xs">
                  {selectedRule.conditions.includeSubfolders ? 'Including subfolders' : 'Top level only'}
                </Text>
              </View>
            )}
            {selectedRule.conditions.sizeOperator && (
              <View className="mb-2">
                <Text className="text-muted text-sm">Size Filter</Text>
                <Text className="text-foreground">
                  {selectedRule.conditions.sizeOperator.replace('_', ' ')} {formatSize(selectedRule.conditions.sizeValue || 0)}
                </Text>
              </View>
            )}
            {selectedRule.conditions.namePattern && (
              <View className="mb-2">
                <Text className="text-muted text-sm">Name Pattern</Text>
                <Text className="text-foreground font-mono">{selectedRule.conditions.namePattern}</Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleTestRule(selectedRule.id)}
              className="flex-1 bg-background py-3 rounded-lg border border-border"
            >
              <Text className="text-center text-foreground">Test Rule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleToggleRule(selectedRule.id)}
              className="flex-1 bg-primary py-3 rounded-lg"
            >
              <Text className="text-center text-white font-medium">
                {selectedRule.status === 'active' ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleDeleteRule(selectedRule.id)}
            className="py-3 rounded-lg border border-error"
          >
            <Text className="text-center text-error">Delete Rule</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-foreground">Sync Rules</Text>
            <TouchableOpacity
              onPress={() => setActiveTab('create')}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">+ Add Rule</Text>
            </TouchableOpacity>
          </View>

          {rules.map(rule => (
            <TouchableOpacity
              key={rule.id}
              onPress={() => setSelectedRule(rule)}
              className="bg-surface rounded-xl p-4 border border-border"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-semibold text-foreground">{rule.name}</Text>
                    <View 
                      className="px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: rule.action === 'include' ? '#10B98120' : '#EF444420'
                      }}
                    >
                      <Text style={{ 
                        color: rule.action === 'include' ? '#10B981' : '#EF4444',
                        fontSize: 10
                      }}>
                        {rule.action.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted text-sm mt-1">{RULE_TYPES[rule.type].label}</Text>
                </View>
                <Switch
                  value={rule.status === 'active'}
                  onValueChange={() => handleToggleRule(rule.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
                <Text className="text-muted text-sm">{rule.stats.matchedFiles} files</Text>
                <Text className="text-muted text-sm">{formatSize(rule.stats.totalSize)}</Text>
                <Text className="text-muted text-sm">Priority: {rule.priority}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  const renderCreate = () => (
    <View className="gap-4">
      <Text className="text-lg font-semibold text-foreground">Create New Rule</Text>

      <View className="bg-surface rounded-xl p-4 border border-border gap-4">
        <View>
          <Text className="text-muted text-sm mb-1">Rule Name</Text>
          <TextInput
            value={newRule.name}
            onChangeText={(text) => setNewRule(prev => ({ ...prev, name: text }))}
            placeholder="Enter rule name"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
          />
        </View>

        <View>
          <Text className="text-muted text-sm mb-1">Description (optional)</Text>
          <TextInput
            value={newRule.description}
            onChangeText={(text) => setNewRule(prev => ({ ...prev, description: text }))}
            placeholder="Describe what this rule does"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
            multiline
          />
        </View>

        <View>
          <Text className="text-muted text-sm mb-2">Rule Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(RULE_TYPES) as RuleType[]).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setNewRule(prev => ({ ...prev, type }))}
                className={`px-3 py-2 rounded-lg border ${newRule.type === type ? 'border-primary bg-primary' : 'border-border bg-background'}`}
              >
                <Text className={newRule.type === type ? 'text-white' : 'text-foreground'}>
                  {RULE_TYPES[type].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-muted text-sm mb-2">Action</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setNewRule(prev => ({ ...prev, action: 'include' }))}
              className={`flex-1 py-3 rounded-lg border ${newRule.action === 'include' ? 'border-success bg-success' : 'border-border bg-background'}`}
            >
              <Text className={`text-center ${newRule.action === 'include' ? 'text-white font-medium' : 'text-foreground'}`}>
                Include
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setNewRule(prev => ({ ...prev, action: 'exclude' }))}
              className={`flex-1 py-3 rounded-lg border ${newRule.action === 'exclude' ? 'border-error bg-error' : 'border-border bg-background'}`}
            >
              <Text className={`text-center ${newRule.action === 'exclude' ? 'text-white font-medium' : 'text-foreground'}`}>
                Exclude
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="font-semibold text-foreground mb-3">Conditions</Text>

        {newRule.type === 'file_type' && (
          <View>
            <Text className="text-muted text-sm mb-2">Select File Types</Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_FILE_TYPES.map(ft => (
                <TouchableOpacity
                  key={ft.ext}
                  onPress={() => toggleFileType(ft.ext)}
                  className={`px-3 py-2 rounded-lg border ${newRule.fileTypes.includes(ft.ext) ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                >
                  <Text className={newRule.fileTypes.includes(ft.ext) ? 'text-white' : 'text-foreground'}>
                    .{ft.ext}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {newRule.type === 'folder' && (
          <View className="gap-3">
            <View>
              <Text className="text-muted text-sm mb-1">Folder Paths (comma separated)</Text>
              <TextInput
                value={newRule.folders}
                onChangeText={(text) => setNewRule(prev => ({ ...prev, folders: text }))}
                placeholder="/Compliance, /Policies"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Include Subfolders</Text>
              <Switch
                value={newRule.includeSubfolders}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, includeSubfolders: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        )}

        {newRule.type === 'size' && (
          <View className="gap-3">
            <View>
              <Text className="text-muted text-sm mb-1">Size (MB)</Text>
              <TextInput
                value={newRule.sizeValue}
                onChangeText={(text) => setNewRule(prev => ({ ...prev, sizeValue: text }))}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
            <View className="flex-row gap-2">
              {['larger_than', 'smaller_than'].map(op => (
                <TouchableOpacity
                  key={op}
                  onPress={() => setNewRule(prev => ({ ...prev, sizeOperator: op }))}
                  className={`flex-1 py-2 rounded-lg border ${newRule.sizeOperator === op ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                >
                  <Text className={`text-center ${newRule.sizeOperator === op ? 'text-white' : 'text-foreground'}`}>
                    {op.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {newRule.type === 'name_pattern' && (
          <View>
            <Text className="text-muted text-sm mb-1">Regex Pattern</Text>
            <TextInput
              value={newRule.namePattern}
              onChangeText={(text) => setNewRule(prev => ({ ...prev, namePattern: text }))}
              placeholder="^~|\.tmp$"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-lg px-4 py-3 text-foreground border border-border font-mono"
            />
            <Text className="text-muted text-xs mt-1">Use regex to match file names</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => setActiveTab('rules')}
          className="flex-1 bg-background py-3 rounded-lg border border-border"
        >
          <Text className="text-center text-foreground">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCreateRule}
          className="flex-1 bg-primary py-3 rounded-lg"
        >
          <Text className="text-center text-white font-medium">Create Rule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAnalytics = () => {
    const analytics = syncRulesService.getAnalytics();

    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-foreground">Analytics</Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Total Rules</Text>
            <Text className="text-2xl font-bold text-foreground">{analytics.totalRules}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Active</Text>
            <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{analytics.activeRules}</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Files Synced</Text>
            <Text className="text-2xl font-bold text-foreground">{analytics.totalSynced}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-sm">Files Excluded</Text>
            <Text className="text-2xl font-bold" style={{ color: '#EF4444' }}>{analytics.totalExcluded}</Text>
          </View>
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">Total Storage</Text>
          <Text className="text-3xl font-bold text-primary">{formatSize(analytics.totalSize)}</Text>
          <Text className="text-muted text-sm">managed by sync rules</Text>
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">Rules by Type</Text>
          {(Object.keys(RULE_TYPES) as RuleType[]).map(type => (
            <View key={type} className="flex-row items-center justify-between py-2">
              <Text className="text-foreground">{RULE_TYPES[type].label}</Text>
              <Text className="text-muted">{analytics.byType[type]}</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="font-semibold text-foreground mb-3">Rules by Action</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: '#10B981' }}>{analytics.byAction.include}</Text>
              <Text className="text-muted text-sm">Include</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: '#EF4444' }}>{analytics.byAction.exclude}</Text>
              <Text className="text-muted text-sm">Exclude</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          <View>
            <Text className="text-2xl font-bold text-foreground">Sync Rules</Text>
            <Text className="text-muted mt-1">Configure automatic OneDrive sync rules</Text>
          </View>

          <View className="flex-row bg-surface rounded-xl p-1">
            {(['rules', 'create', 'analytics'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); setSelectedRule(null); }}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`text-center font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                  {tab === 'create' ? 'Create' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'rules' && renderRules()}
          {activeTab === 'create' && renderCreate()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
