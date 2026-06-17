import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  deploymentApprovalService, 
  ApprovalRequest, 
  ApprovalStats,
  APPROVER_ROLES,
  ENVIRONMENT_CONFIG,
} from '@/lib/services/deployment-approval-service';

type TabType = 'pending' | 'history' | 'approvers' | 'chains';

export default function DeploymentApprovalsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comments, setComments] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      await deploymentApprovalService.initialize();
      setRequests(deploymentApprovalService.getRequests());
      setStats(deploymentApprovalService.getStats());
    } catch (error) {
      console.error('Failed to load approval data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleApprove = async (requestId: string, approverId: string) => {
    if (!comments.trim()) {
      Alert.alert('Comments Required', 'Please provide comments for your approval.');
      return;
    }

    try {
      await deploymentApprovalService.approveStep(requestId, approverId, comments);
      setComments('');
      setSelectedRequest(null);
      await loadData();
      Alert.alert('Success', 'Approval recorded successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record approval.');
    }
  };

  const handleReject = async (requestId: string, approverId: string) => {
    if (!comments.trim()) {
      Alert.alert('Comments Required', 'Please provide a reason for rejection.');
      return;
    }

    try {
      await deploymentApprovalService.rejectStep(requestId, approverId, comments);
      setComments('');
      setSelectedRequest(null);
      await loadData();
      Alert.alert('Rejected', 'Request has been rejected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request.');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'bypassed': return '#8B5CF6';
      case 'expired': return '#6B7280';
      default: return colors.muted;
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return colors.muted;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#F59E0B' }}>{stats.pendingRequests}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Pending</Text>
        </View>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#10B981' }}>{stats.approvedRequests}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Approved</Text>
        </View>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>{stats.approvalRate}%</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Rate</Text>
        </View>
        <View style={{ 
          flex: 1, 
          minWidth: 100, 
          backgroundColor: colors.surface, 
          borderRadius: 12, 
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>{stats.averageApprovalTime}h</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Avg Time</Text>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
      {(['pending', 'history', 'approvers', 'chains'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: activeTab === tab ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: activeTab === tab ? colors.primary : colors.border,
          }}
        >
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 13, 
            fontWeight: '600',
            color: activeTab === tab ? '#FFFFFF' : colors.foreground,
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRequestCard = (request: ApprovalRequest) => {
    const isSelected = selectedRequest?.id === request.id;
    const pendingStep = request.approvals.find(a => a.status === 'pending');

    return (
      <TouchableOpacity
        key={request.id}
        onPress={() => setSelectedRequest(isSelected ? null : request)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{request.deploymentName}</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{request.packageName} v{request.packageVersion}</Text>
          </View>
          <View style={{ 
            paddingHorizontal: 10, 
            paddingVertical: 4, 
            borderRadius: 12,
            backgroundColor: getStatusColor(request.status) + '20',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: getStatusColor(request.status) }}>
              {request.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info Row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>Environment:</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
              {ENVIRONMENT_CONFIG[request.targetEnvironment].label}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>Urgency:</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: getUrgencyColor(request.urgency) }}>
              {request.urgency.toUpperCase()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>Sites:</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
              {request.targetSites.length}
            </Text>
          </View>
        </View>

        {/* Justification */}
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }} numberOfLines={2}>
          {request.justification}
        </Text>

        {/* Approval Progress */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Approval Progress:</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {request.approvals.map((step, index) => (
              <View 
                key={index}
                style={{ 
                  flex: 1, 
                  height: 4, 
                  borderRadius: 2,
                  backgroundColor: step.status === 'approved' ? '#10B981' : 
                                   step.status === 'rejected' ? '#EF4444' : 
                                   step.status === 'pending' ? '#F59E0B' : colors.border,
                }}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            Requested by {request.requestedBy} • {formatDate(request.requestedAt)}
          </Text>
          {pendingStep && (
            <Text style={{ fontSize: 11, color: '#F59E0B' }}>
              Awaiting: {APPROVER_ROLES[pendingStep.approverRole].label}
            </Text>
          )}
        </View>

        {/* Expanded Details */}
        {isSelected && (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            {/* Risk Assessment */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
              Risk Assessment
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 8,
                backgroundColor: getUrgencyColor(request.riskAssessment.overallRisk) + '20',
              }}>
                <Text style={{ fontSize: 12, color: getUrgencyColor(request.riskAssessment.overallRisk) }}>
                  Risk: {request.riskAssessment.overallRisk.toUpperCase()}
                </Text>
              </View>
              <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 8,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  Impact: {request.riskAssessment.impactScore}/10
                </Text>
              </View>
              <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 8,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  Users: {request.riskAssessment.affectedUsers}
                </Text>
              </View>
              <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 8,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  Downtime: {request.riskAssessment.downtime}min
                </Text>
              </View>
            </View>

            {/* Approval Steps */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
              Approval Steps
            </Text>
            {request.approvals.map((step, index) => (
              <View 
                key={index}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 12,
                  paddingVertical: 8,
                  borderBottomWidth: index < request.approvals.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 14, 
                  backgroundColor: step.status === 'approved' ? '#10B981' : 
                                   step.status === 'rejected' ? '#EF4444' : 
                                   step.status === 'pending' ? '#F59E0B' : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>{step.stepNumber}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground }}>
                    {step.approverName}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {APPROVER_ROLES[step.approverRole].label}
                  </Text>
                  {step.comments && (
                    <Text style={{ fontSize: 12, color: colors.muted, fontStyle: 'italic', marginTop: 4 }}>
                      "{step.comments}"
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: getStatusColor(step.status) }}>
                  {step.status.toUpperCase()}
                </Text>
              </View>
            ))}

            {/* Action Buttons for Pending */}
            {request.status === 'pending' && pendingStep && (
              <View style={{ marginTop: 16 }}>
                <TextInput
                  value={comments}
                  onChangeText={setComments}
                  placeholder="Enter your comments..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 12,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleApprove(request.id, pendingStep.approverId)}
                    style={{
                      flex: 1,
                      backgroundColor: '#10B981',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(request.id, pendingStep.approverId)}
                    style={{
                      flex: 1,
                      backgroundColor: '#EF4444',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPendingTab = () => {
    const pendingRequests = requests.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✓</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>All Caught Up</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
            No pending approval requests
          </Text>
        </View>
      );
    }

    return pendingRequests.map(renderRequestCard);
  };

  const renderHistoryTab = () => {
    const completedRequests = requests.filter(r => r.status !== 'pending');

    if (completedRequests.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>No History</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
            Completed requests will appear here
          </Text>
        </View>
      );
    }

    return completedRequests.map(renderRequestCard);
  };

  const renderApproversTab = () => {
    const approvers = deploymentApprovalService.getApprovers();

    return (
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          Configured Approvers
        </Text>
        {approvers.map((approver) => (
          <View
            key={approver.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{approver.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{approver.email}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{approver.department}</Text>
              </View>
              <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 4, 
                borderRadius: 12,
                backgroundColor: APPROVER_ROLES[approver.role].color + '20',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: APPROVER_ROLES[approver.role].color }}>
                  {APPROVER_ROLES[approver.role].label}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 6,
                backgroundColor: approver.isActive ? '#10B98120' : '#EF444420',
              }}>
                <Text style={{ fontSize: 11, color: approver.isActive ? '#10B981' : '#EF4444' }}>
                  {approver.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {approver.canDelegate && (
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 6,
                  backgroundColor: colors.background,
                }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Can Delegate</Text>
                </View>
              )}
              <View style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 6,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Level {approver.maxApprovalLevel}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderChainsTab = () => {
    const chains = deploymentApprovalService.getChains();

    return (
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          Approval Chains
        </Text>
        {chains.map((chain) => (
          <View
            key={chain.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{chain.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{chain.description}</Text>
              </View>
              <View style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 4, 
                borderRadius: 12,
                backgroundColor: chain.isActive ? '#10B98120' : '#EF444420',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: chain.isActive ? '#10B981' : '#EF4444' }}>
                  {chain.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <View style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 6,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 11, color: colors.foreground }}>
                  {ENVIRONMENT_CONFIG[chain.environment].label}
                </Text>
              </View>
              <View style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 6,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {chain.minApprovers} min approvers
                </Text>
              </View>
              <View style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 6,
                backgroundColor: colors.background,
              }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  Expires in {chain.expiryHours}h
                </Text>
              </View>
              {chain.allowBypass && (
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 6,
                  backgroundColor: '#F59E0B20',
                }}>
                  <Text style={{ fontSize: 11, color: '#F59E0B' }}>Bypass Allowed</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Steps:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {chain.steps.map((step, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    paddingHorizontal: 10, 
                    paddingVertical: 6, 
                    borderRadius: 8,
                    backgroundColor: APPROVER_ROLES[step.requiredRole].color + '20',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: APPROVER_ROLES[step.requiredRole].color }}>
                      {APPROVER_ROLES[step.requiredRole].label}
                    </Text>
                  </View>
                  {index < chain.steps.length - 1 && (
                    <Text style={{ fontSize: 16, color: colors.muted, marginLeft: 8 }}>→</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: colors.muted }}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.foreground }}>
            Deployment Approvals
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            Review and approve deployment requests
          </Text>
        </View>

        {/* Stats */}
        {renderStats()}

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'approvers' && renderApproversTab()}
        {activeTab === 'chains' && renderChainsTab()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
