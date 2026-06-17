/**
 * Retention Policies Screen
 * Manage automatic archival and deletion of recordings
 */

import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, Switch, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  retentionPoliciesService, 
  RetentionPolicy, 
  RetentionRecord,
  StorageQuota,
  RetentionAnalytics,
  ComplianceReport
} from '@/lib/services/retention-policies-service';

type TabType = 'policies' | 'pending' | 'storage' | 'compliance';

export default function RetentionPoliciesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('policies');
  const [refreshing, setRefreshing] = useState(false);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [pendingRecords, setPendingRecords] = useState<RetentionRecord[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [analytics, setAnalytics] = useState<RetentionAnalytics | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);

  const loadData = useCallback(async () => {
    await retentionPoliciesService.initialize();
    setPolicies(retentionPoliciesService.getPolicies());
    setPendingRecords(retentionPoliciesService.getPendingRecords());
    setQuota(retentionPoliciesService.getStorageQuota());
    setAnalytics(retentionPoliciesService.getAnalytics());
    setReports(retentionPoliciesService.getReports(5));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTogglePolicy = async (policyId: string) => {
    await retentionPoliciesService.togglePolicy(policyId);
    await loadData();
  };

  const handleApproveRecord = async (recordId: string) => {
    await retentionPoliciesService.approveRetention(recordId, 'current_user');
    await loadData();
  };

  const handleExecuteRecord = async (recordId: string) => {
    await retentionPoliciesService.executeRetention(recordId, 'current_user');
    await loadData();
  };

  const handleOverrideRecord = async (recordId: string) => {
    await retentionPoliciesService.overrideRetention(recordId, 'current_user', 'Manual override by admin');
    await loadData();
  };

  const handleGenerateReport = async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await retentionPoliciesService.generateComplianceReport(startDate, endDate);
    await loadData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'critical': return colors.error;
      case 'important': return colors.warning;
      case 'permanent': return colors.primary;
      default: return colors.muted;
    }
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {(['policies', 'pending', 'storage', 'compliance'] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
          }}
        >
          <Text style={{
            color: activeTab === tab ? colors.primary : colors.muted,
            fontWeight: activeTab === tab ? '600' : '400',
            fontSize: 13,
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderPolicies = () => (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Retention Policies
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
        Configure automatic archival and deletion rules
      </Text>

      {policies.map((policy) => (
        <View
          key={policy.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: getTierColor(policy.tier),
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                {policy.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <View style={{
                  backgroundColor: getTierColor(policy.tier) + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                  <Text style={{ color: getTierColor(policy.tier), fontSize: 10, fontWeight: '600' }}>
                    {policy.tier.toUpperCase()}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: colors.primary + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                    Priority: {policy.priority}
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={policy.isActive}
              onValueChange={() => handleTogglePolicy(policy.id)}
              trackColor={{ false: colors.border, true: colors.success }}
            />
          </View>

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
            {policy.description}
          </Text>

          <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
              Actions
            </Text>
            {policy.actions.map((action, i) => (
              <View key={action.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 12, flex: 1 }}>
                  {i + 1}. {action.action.replace('_', ' ')} after {action.delayDays} days
                </Text>
                {action.requireApproval && (
                  <View style={{
                    backgroundColor: colors.warning + '20',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}>
                    <Text style={{ color: colors.warning, fontSize: 9 }}>Requires Approval</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Executed: {policy.executionCount} times
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Affected: {policy.recordingsAffected} recordings
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPending = () => (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Pending Actions
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
        Retention actions awaiting approval
      </Text>

      {pendingRecords.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No pending retention actions</Text>
        </View>
      ) : (
        pendingRecords.map((record) => (
          <View
            key={record.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, flex: 1 }}>
                {record.recordingName}
              </Text>
              <View style={{
                backgroundColor: record.action === 'delete' ? colors.error :
                  record.action === 'archive' ? colors.warning : colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                  {record.action.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              Policy: {record.policyName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              Age: {record.metadata.ageDays} days • Size: {formatBytes(record.metadata.originalSize)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
              Scheduled: {new Date(record.scheduledAt).toLocaleString()}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => handleApproveRecord(record.id)}
                style={{
                  flex: 1,
                  backgroundColor: colors.success,
                  padding: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => handleOverrideRecord(record.id)}
                style={{
                  flex: 1,
                  backgroundColor: colors.warning,
                  padding: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Override</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderStorage = () => (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Storage Management
      </Text>

      {quota && (
        <>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Storage Quota</Text>
              <View style={{
                backgroundColor: quota.status === 'exceeded' ? colors.error :
                  quota.status === 'critical' ? colors.error :
                  quota.status === 'warning' ? colors.warning : colors.success,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                  {quota.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              height: 24,
              overflow: 'hidden',
              marginBottom: 12,
            }}>
              <View style={{
                backgroundColor: quota.status === 'exceeded' ? colors.error :
                  quota.status === 'critical' ? colors.error :
                  quota.status === 'warning' ? colors.warning : colors.primary,
                height: '100%',
                width: `${Math.min((quota.used / quota.totalLimit) * 100, 100)}%`,
              }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                Used: {formatBytes(quota.used)}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                Available: {formatBytes(quota.available)}
              </Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 }}>
              Total: {formatBytes(quota.totalLimit)}
            </Text>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Storage by Tier
            </Text>
            {(['standard', 'important', 'critical', 'permanent'] as const).map((tier) => (
              <View key={tier} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: colors.foreground, textTransform: 'capitalize' }}>{tier}</Text>
                  <Text style={{ color: colors.muted }}>{formatBytes(quota.byTier[tier])}</Text>
                </View>
                <View style={{
                  backgroundColor: colors.background,
                  borderRadius: 4,
                  height: 8,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    backgroundColor: getTierColor(tier),
                    height: '100%',
                    width: `${quota.totalLimit > 0 ? (quota.byTier[tier] / quota.totalLimit) * 100 : 0}%`,
                  }} />
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {analytics && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.success }}>
              {formatBytes(analytics.storageReclaimed)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Reclaimed</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
              {analytics.averageRetentionDays.toFixed(0)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Avg Days</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderCompliance = () => (
    <View style={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
          Compliance Reports
        </Text>
        <Pressable
          onPress={handleGenerateReport}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Generate Report</Text>
        </Pressable>
      </View>

      {analytics && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.success }}>
              {analytics.complianceRate.toFixed(0)}%
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Compliance</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.warning }}>
              {analytics.pendingActions}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Pending</Text>
          </View>
        </View>
      )}

      {reports.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No compliance reports yet</Text>
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            Generate a report to view compliance status
          </Text>
        </View>
      ) : (
        reports.map((report) => (
          <View
            key={report.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: report.status === 'compliant' ? colors.success :
                report.status === 'warning' ? colors.warning : colors.error,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {new Date(report.generatedAt).toLocaleDateString()}
              </Text>
              <View style={{
                backgroundColor: report.status === 'compliant' ? colors.success :
                  report.status === 'warning' ? colors.warning : colors.error,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                  {report.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Recordings: {report.totalRecordings}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Policies: {report.policiesExecuted}
              </Text>
            </View>

            {report.issues.length > 0 && (
              <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 12, marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
                  Issues ({report.issues.length})
                </Text>
                {report.issues.slice(0, 3).map((issue) => (
                  <View key={issue.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: issue.severity === 'critical' ? colors.error :
                        issue.severity === 'high' ? colors.warning : colors.muted,
                      marginRight: 8,
                    }} />
                    <Text style={{ color: colors.muted, fontSize: 11, flex: 1 }} numberOfLines={1}>
                      {issue.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {report.recommendations.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                  Recommendations
                </Text>
                {report.recommendations.slice(0, 2).map((rec, i) => (
                  <Text key={i} style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
            Retention Policies
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Archival & Deletion Management
          </Text>
        </View>
      </View>

      {renderTabs()}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'policies' && renderPolicies()}
        {activeTab === 'pending' && renderPending()}
        {activeTab === 'storage' && renderStorage()}
        {activeTab === 'compliance' && renderCompliance()}
      </ScrollView>
    </ScreenContainer>
  );
}
