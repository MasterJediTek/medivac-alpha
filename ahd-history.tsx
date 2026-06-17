/**
 * AHD Document History UI Screen - MediVac WACHS v9.3
 * Version tracking, comparison, and document management
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { ahdDocumentHistoryService, DocumentVersion, DocumentHistoryEntry, DocumentDiff } from "@/lib/services/ahd-document-history-service";

type TabType = 'versions' | 'history' | 'compare' | 'shares';

export default function AHDHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('versions');
  const [documentId] = useState('demo_ahd_001');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [history, setHistory] = useState<DocumentHistoryEntry[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<DocumentDiff[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // Initialize demo document
    const demoDoc = {
      personalDetails: {
        fullName: 'John Smith',
        dateOfBirth: '1950-05-15',
        address: '123 Main St, Perth WA 6000',
        phone: '0412 345 678',
        email: 'john.smith@email.com',
      },
      treatmentDecisionMakers: [
        { fullName: 'Jane Smith', relationship: 'Spouse', address: '123 Main St', phone: '0412 345 679' },
      ],
      valuesAndWishes: {
        qualityOfLife: 'I value being able to communicate with family.',
        importantActivities: 'Spending time with grandchildren.',
        fears: 'Being a burden on my family.',
      },
      status: 'draft',
    };

    ahdDocumentHistoryService.createInitialVersion(documentId, demoDoc, 'user');
    
    // Simulate some updates
    const updatedDoc = { ...demoDoc, status: 'pending-review' };
    ahdDocumentHistoryService.saveVersion(documentId, updatedDoc, 'user', 'Updated status to pending review');

    setVersions(ahdDocumentHistoryService.getVersions(documentId));
    setHistory(ahdDocumentHistoryService.getHistory(documentId));
  }, []);

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      const diffs = ahdDocumentHistoryService.compareVersions(
        documentId,
        selectedVersions[0],
        selectedVersions[1]
      );
      setComparisonResult(diffs);
    }
  };

  const handleRestore = (versionId: string) => {
    const restored = ahdDocumentHistoryService.restoreToVersion(documentId, versionId, 'user');
    if (restored) {
      setVersions(ahdDocumentHistoryService.getVersions(documentId));
      setHistory(ahdDocumentHistoryService.getHistory(documentId));
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'versions', label: 'Versions', icon: '📚' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'compare', label: 'Compare', icon: '🔍' },
    { id: 'shares', label: 'Shares', icon: '🔗' },
  ];

  const analytics = ahdDocumentHistoryService.getAnalytics();

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'create': return colors.success;
      case 'update': return colors.primary;
      case 'sign': return '#9B59B6';
      case 'witness': return '#E67E22';
      case 'archive': return colors.muted;
      case 'restore': return '#1ABC9C';
      case 'revoke': return colors.error;
      case 'share': return '#3498DB';
      default: return colors.muted;
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'create': return '✨';
      case 'update': return '✏️';
      case 'sign': return '✍️';
      case 'witness': return '👁️';
      case 'archive': return '📦';
      case 'restore': return '♻️';
      case 'revoke': return '❌';
      case 'share': return '🔗';
      default: return '📄';
    }
  };

  const renderVersionsTab = () => (
    <View className="flex-1 px-5">
      {/* Analytics Summary */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-2">Document Analytics</Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">{versions.length}</Text>
            <Text className="text-muted text-xs">Versions</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.success }}>
              {analytics.completionRate.toFixed(0)}%
            </Text>
            <Text className="text-muted text-xs">Complete</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">{analytics.totalShares}</Text>
            <Text className="text-muted text-xs">Shares</Text>
          </View>
        </View>
      </View>

      {/* Version List */}
      <Text className="text-foreground font-semibold text-lg mb-3">Version History</Text>
      {versions.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-2">📄</Text>
          <Text className="text-muted text-center">No versions yet</Text>
        </View>
      ) : (
        <View className="gap-3">
          {[...versions].reverse().map((version, index) => (
            <View key={version.id} className="bg-surface rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: getChangeTypeColor(version.changeType) + '30' }}
                  >
                    <Text>{getChangeTypeIcon(version.changeType)}</Text>
                  </View>
                  <View>
                    <Text className="text-foreground font-semibold">Version {version.version}</Text>
                    <Text className="text-muted text-xs">
                      {new Date(version.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {index > 0 && (
                  <TouchableOpacity
                    onPress={() => handleRestore(version.id)}
                    className="bg-primary/20 rounded-lg px-3 py-1"
                  >
                    <Text style={{ color: colors.primary }} className="text-sm">Restore</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-muted text-sm mb-2">{version.changeDescription}</Text>
              <View className="flex-row gap-3">
                <Text className="text-muted text-xs">
                  Fields: {version.metadata.fieldsChanged.length}
                </Text>
                <Text className="text-muted text-xs">
                  Completion: {version.metadata.completionPercentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View className="flex-1 px-5">
      <Text className="text-foreground font-semibold text-lg mb-3">Activity Log</Text>
      
      {/* Search */}
      <View className="bg-surface rounded-xl px-4 py-3 mb-4 flex-row items-center">
        <Text className="text-muted mr-2">🔍</Text>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search history..."
          placeholderTextColor={colors.muted}
          className="flex-1 text-foreground"
        />
      </View>

      {history.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-2">📜</Text>
          <Text className="text-muted text-center">No activity yet</Text>
        </View>
      ) : (
        <View className="gap-2">
          {[...history]
            .filter(entry => 
              !searchText || 
              entry.description.toLowerCase().includes(searchText.toLowerCase()) ||
              entry.action.toLowerCase().includes(searchText.toLowerCase())
            )
            .reverse()
            .map(entry => (
              <View key={entry.id} className="bg-surface rounded-xl p-3">
                <View className="flex-row items-center gap-2">
                  <Text>{getChangeTypeIcon(entry.action)}</Text>
                  <View className="flex-1">
                    <Text className="text-foreground text-sm">{entry.description}</Text>
                    <Text className="text-muted text-xs">
                      {entry.performedBy} • {new Date(entry.performedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );

  const renderCompareTab = () => (
    <View className="flex-1 px-5">
      <Text className="text-foreground font-semibold text-lg mb-3">Compare Versions</Text>
      
      {versions.length < 2 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-2">🔍</Text>
          <Text className="text-muted text-center">Need at least 2 versions to compare</Text>
        </View>
      ) : (
        <>
          <Text className="text-muted text-sm mb-3">Select two versions to compare</Text>
          <View className="gap-2 mb-4">
            {versions.map(version => (
              <TouchableOpacity
                key={version.id}
                onPress={() => {
                  if (selectedVersions.includes(version.id)) {
                    setSelectedVersions(prev => prev.filter(id => id !== version.id));
                  } else if (selectedVersions.length < 2) {
                    setSelectedVersions(prev => [...prev, version.id]);
                  }
                }}
                className="flex-row items-center bg-surface rounded-xl p-3"
                style={{
                  borderWidth: selectedVersions.includes(version.id) ? 2 : 0,
                  borderColor: colors.primary,
                }}
              >
                <View className="w-6 h-6 rounded border border-border items-center justify-center mr-3">
                  {selectedVersions.includes(version.id) && (
                    <Text style={{ color: colors.primary }}>✓</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground">Version {version.version}</Text>
                  <Text className="text-muted text-xs">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedVersions.length === 2 && (
            <TouchableOpacity
              onPress={handleCompare}
              className="bg-primary rounded-xl p-4 items-center mb-4"
            >
              <Text className="text-white font-bold">Compare Selected</Text>
            </TouchableOpacity>
          )}

          {/* Comparison Results */}
          {comparisonResult.length > 0 && (
            <View>
              <Text className="text-foreground font-semibold mb-3">Differences Found</Text>
              <View className="gap-2">
                {comparisonResult.map((diff, index) => (
                  <View key={index} className="bg-surface rounded-xl p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View 
                        className="px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: diff.changeType === 'added' 
                            ? colors.success + '30' 
                            : diff.changeType === 'removed' 
                              ? colors.error + '30' 
                              : colors.warning + '30' 
                        }}
                      >
                        <Text 
                          className="text-xs font-semibold"
                          style={{ 
                            color: diff.changeType === 'added' 
                              ? colors.success 
                              : diff.changeType === 'removed' 
                                ? colors.error 
                                : colors.warning 
                          }}
                        >
                          {diff.changeType.toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-foreground text-sm font-semibold">{diff.field}</Text>
                    </View>
                    {diff.oldValue && (
                      <Text className="text-muted text-xs">Old: {diff.oldValue}</Text>
                    )}
                    {diff.newValue && (
                      <Text className="text-foreground text-xs">New: {diff.newValue}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderSharesTab = () => {
    const shares = ahdDocumentHistoryService.getShares(documentId);
    
    return (
      <View className="flex-1 px-5">
        <Text className="text-foreground font-semibold text-lg mb-3">Shared Access</Text>
        
        {/* Share Button */}
        <TouchableOpacity
          onPress={() => {
            ahdDocumentHistoryService.shareDocument(
              documentId,
              'doctor@hospital.com',
              'user',
              ['view', 'download'],
              30
            );
            // Force re-render
            setHistory([...ahdDocumentHistoryService.getHistory(documentId)]);
          }}
          className="bg-primary rounded-xl p-4 items-center mb-4"
        >
          <Text className="text-white font-bold">Share Document</Text>
        </TouchableOpacity>

        {shares.length === 0 ? (
          <View className="bg-surface rounded-xl p-8 items-center">
            <Text className="text-4xl mb-2">🔗</Text>
            <Text className="text-muted text-center">No active shares</Text>
            <Text className="text-muted text-center text-sm mt-1">
              Share your document with healthcare providers
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {shares.map(share => (
              <View key={share.id} className="bg-surface rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-foreground font-semibold">{share.sharedWith}</Text>
                    <Text className="text-muted text-xs">
                      Shared {new Date(share.sharedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      ahdDocumentHistoryService.revokeShare(documentId, share.id);
                      setHistory([...ahdDocumentHistoryService.getHistory(documentId)]);
                    }}
                    className="bg-error/20 rounded-lg px-3 py-1"
                  >
                    <Text style={{ color: colors.error }} className="text-sm">Revoke</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2 mb-2">
                  {share.permissions.map(perm => (
                    <View key={perm} className="bg-primary/20 rounded px-2 py-0.5">
                      <Text style={{ color: colors.primary }} className="text-xs">{perm}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-muted text-xs">
                  Accessed {share.accessCount} times
                  {share.expiresAt && ` • Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-3xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-foreground text-xl font-bold">Document History</Text>
              <Text className="text-muted text-sm">Version tracking and management</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-surface rounded-xl p-1">
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
                }}
              >
                <Text className="text-lg">{tab.icon}</Text>
                <Text 
                  className="text-xs mt-1"
                  style={{ color: activeTab === tab.id ? '#FFFFFF' : colors.muted }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'versions' && renderVersionsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'compare' && renderCompareTab()}
        {activeTab === 'shares' && renderSharesTab()}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
