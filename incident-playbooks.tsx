/**
 * Incident Response Playbook Editor Screen
 * Customize automated response actions for each threat type
 * MediVac One v5.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  incidentPlaybookService, 
  type Playbook, 
  type PlaybookAction, 
  type ThreatType,
  type SeverityLevel 
} from '@/lib/services/incident-playbook-service';

const THREAT_ICONS: Record<ThreatType, string> = {
  'unauthorized_access': '🚫',
  'data_breach': '💾',
  'malware_detected': '🦠',
  'ddos_attack': '🌊',
  'phishing_attempt': '🎣',
  'insider_threat': '👤',
  'ransomware': '🔒',
  'credential_compromise': '🔑',
  'policy_violation': '📋',
  'system_intrusion': '🔓',
  'data_exfiltration': '📤',
};

const THREAT_LABELS: Record<ThreatType, string> = {
  'unauthorized_access': 'Unauthorized Access',
  'data_breach': 'Data Breach',
  'malware_detected': 'Malware Detection',
  'ddos_attack': 'DDoS Attack',
  'phishing_attempt': 'Phishing Attempt',
  'insider_threat': 'Insider Threat',
  'ransomware': 'Ransomware',
  'credential_compromise': 'Credential Compromise',
  'policy_violation': 'Policy Violation',
  'system_intrusion': 'System Intrusion',
  'data_exfiltration': 'Data Exfiltration',
};

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  'critical': '#EF4444',
  'high': '#F59E0B',
  'medium': '#3B82F6',
  'low': '#10B981',
};

export default function IncidentPlaybooksScreen() {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editingAction, setEditingAction] = useState<PlaybookAction | null>(null);
  const [editingActionIndex, setEditingActionIndex] = useState<number>(-1);

  // Action editing state
  const [actionName, setActionName] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [actionAutomated, setActionAutomated] = useState(true);
  const [actionTimeout, setActionTimeout] = useState('300');
  const [actionRequiresApproval, setActionRequiresApproval] = useState(false);

  useEffect(() => {
    loadPlaybooks();
  }, []);

  const loadPlaybooks = async () => {
    setIsLoading(true);
    try {
      await incidentPlaybookService.initialize();
      const allPlaybooks = incidentPlaybookService.getPlaybooks();
      setPlaybooks(allPlaybooks);
    } catch (error) {
      console.error('Failed to load playbooks:', error);
    }
    setIsLoading(false);
  };

  const handleSelectPlaybook = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setEditModalVisible(true);
  };

  const handleTogglePlaybook = async (playbook: Playbook) => {
    try {
      const updated = await incidentPlaybookService.savePlaybook({
        id: playbook.id,
        isActive: !playbook.isActive,
      });
      setPlaybooks(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (error) {
      Alert.alert('Error', 'Failed to update playbook');
    }
  };

  const handleEditAction = (action: PlaybookAction, index: number) => {
    setEditingAction(action);
    setEditingActionIndex(index);
    setActionName(action.name);
    setActionDescription(action.description);
    setActionAutomated(action.isAutomated);
    setActionTimeout(action.timeout.toString());
    setActionRequiresApproval(action.requiresApproval);
    setActionModalVisible(true);
  };

  const handleSaveAction = async () => {
    if (!selectedPlaybook || editingActionIndex < 0) return;
    
    try {
      const updatedActions = [...selectedPlaybook.actions];
      updatedActions[editingActionIndex] = {
        ...updatedActions[editingActionIndex],
        name: actionName,
        description: actionDescription,
        isAutomated: actionAutomated,
        timeout: parseInt(actionTimeout, 10),
        requiresApproval: actionRequiresApproval,
      };
      
      const updated = await incidentPlaybookService.savePlaybook({
        id: selectedPlaybook.id,
        actions: updatedActions,
      });
      
      setSelectedPlaybook(updated);
      setPlaybooks(prev => prev.map(p => p.id === updated.id ? updated : p));
      setActionModalVisible(false);
      Alert.alert('Success', 'Action updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update action');
    }
  };

  const handleToggleActionAutomation = async (actionIndex: number) => {
    if (!selectedPlaybook) return;
    
    try {
      const updatedActions = [...selectedPlaybook.actions];
      updatedActions[actionIndex] = {
        ...updatedActions[actionIndex],
        isAutomated: !updatedActions[actionIndex].isAutomated,
      };
      
      const updated = await incidentPlaybookService.savePlaybook({
        id: selectedPlaybook.id,
        actions: updatedActions,
      });
      
      setSelectedPlaybook(updated);
      setPlaybooks(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (error) {
      Alert.alert('Error', 'Failed to update action');
    }
  };

  const handleTestPlaybook = async () => {
    if (!selectedPlaybook) return;
    
    Alert.alert(
      'Test Playbook',
      `This will simulate a ${THREAT_LABELS[selectedPlaybook.threatType]} incident and execute the playbook in test mode. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            try {
              const incident = await incidentPlaybookService.createIncident({
                threatType: selectedPlaybook.threatType,
                severity: 'medium',
                title: `Test: ${THREAT_LABELS[selectedPlaybook.threatType]}`,
                description: `Test incident for ${THREAT_LABELS[selectedPlaybook.threatType]} playbook`,
                detectedBy: 'Manual Test',
                affectedSystems: ['Test System'],
              });
              
              await incidentPlaybookService.executePlaybook(selectedPlaybook.id, incident.id);
              Alert.alert('Success', 'Playbook test executed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to test playbook');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">Loading playbooks...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            📋 Incident Response Playbooks
          </Text>
          <Text className="text-muted">
            Customize automated response actions for security threats
          </Text>
        </View>

        {/* Playbook List */}
        <View className="gap-4">
          {playbooks.map((playbook) => (
            <TouchableOpacity
              key={playbook.id}
              onPress={() => handleSelectPlaybook(playbook)}
              className="rounded-2xl p-4"
              style={{ 
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: playbook.isActive ? colors.primary : colors.border,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">{THREAT_ICONS[playbook.threatType]}</Text>
                  <View>
                    <Text className="text-lg font-semibold text-foreground">
                      {playbook.name}
                    </Text>
                    <Text className="text-sm text-muted">
                      {playbook.actions.length} actions • {playbook.actions.filter((a: PlaybookAction) => a.isAutomated).length} automated
                    </Text>
                  </View>
                </View>
                <Switch
                  value={playbook.isActive}
                  onValueChange={() => handleTogglePlaybook(playbook)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              
              <View className="flex-row items-center gap-2">
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: SEVERITY_COLORS[playbook.severity] + '20' }}
                >
                  <Text style={{ color: SEVERITY_COLORS[playbook.severity], fontSize: 12, fontWeight: '600' }}>
                    {playbook.severity.toUpperCase()}
                  </Text>
                </View>
                <Text className="text-muted text-sm">
                  {THREAT_LABELS[playbook.threatType]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Playbook Detail Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="px-4 py-4 border-b" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text className="text-primary text-lg">Close</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">
                Edit Playbook
              </Text>
              <TouchableOpacity onPress={handleTestPlaybook}>
                <Text className="text-primary text-lg">Test</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedPlaybook && (
            <ScrollView className="flex-1 px-4 py-4">
              {/* Playbook Header */}
              <View className="items-center mb-6">
                <Text className="text-5xl mb-2">{THREAT_ICONS[selectedPlaybook.threatType]}</Text>
                <Text className="text-xl font-bold text-foreground">
                  {selectedPlaybook.name}
                </Text>
                <Text className="text-muted text-center mt-2">
                  {selectedPlaybook.description}
                </Text>
              </View>

              {/* Playbook Info */}
              <View 
                className="rounded-xl p-4 mb-6"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row justify-between mb-3">
                  <Text className="text-muted">Threat Type</Text>
                  <Text className="text-foreground font-medium">
                    {THREAT_LABELS[selectedPlaybook.threatType]}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-muted">Severity</Text>
                  <View 
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[selectedPlaybook.severity] }}
                  >
                    <Text className="text-white text-sm font-semibold">
                      {selectedPlaybook.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-muted">Version</Text>
                  <Text className="text-foreground font-medium">
                    {selectedPlaybook.version}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-muted">Executions</Text>
                  <Text className="text-foreground font-medium">
                    {selectedPlaybook.executionCount}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">Status</Text>
                  <Text style={{ color: selectedPlaybook.isActive ? colors.success : colors.error, fontWeight: '600' }}>
                    {selectedPlaybook.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>

              {/* Response Actions */}
              <Text className="text-lg font-semibold text-foreground mb-3">Response Actions</Text>
              
              {selectedPlaybook.actions.map((action: PlaybookAction, index: number) => (
                <View 
                  key={action.id}
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-white font-bold">{action.order}</Text>
                      </View>
                      <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
                        {action.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEditAction(action, index)}
                      className="px-3 py-1 rounded-lg"
                      style={{ backgroundColor: colors.primary + '20' }}
                    >
                      <Text className="text-primary text-sm">Edit</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text className="text-muted text-sm mb-3">{action.description}</Text>
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-muted text-sm">Automated</Text>
                      <Switch
                        value={action.isAutomated}
                        onValueChange={() => handleToggleActionAutomation(index)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>
                    <Text className="text-muted text-sm">
                      Timeout: {action.timeout}s
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center gap-2 mt-2">
                    <View 
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: colors.primary + '20' }}
                    >
                      <Text className="text-primary text-xs">{action.type.toUpperCase()}</Text>
                    </View>
                    {action.requiresApproval && (
                      <View 
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: '#F59E0B20' }}
                      >
                        <Text style={{ color: '#F59E0B', fontSize: 10 }}>REQUIRES APPROVAL</Text>
                      </View>
                    )}
                    <View 
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <Text className="text-muted text-xs">On Fail: {action.onFailure}</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Escalation Rules */}
              {selectedPlaybook.escalationRules.length > 0 && (
                <>
                  <Text className="text-lg font-semibold text-foreground mb-3 mt-4">
                    Escalation Rules
                  </Text>
                  <View 
                    className="rounded-xl p-4 mb-6"
                    style={{ backgroundColor: colors.surface }}
                  >
                    {selectedPlaybook.escalationRules.map((rule, index) => (
                      <View 
                        key={rule.id}
                        className="py-3 border-b"
                        style={{ borderColor: colors.border }}
                      >
                        <Text className="text-foreground font-medium mb-1">
                          {rule.triggerCondition}
                        </Text>
                        <Text className="text-muted text-sm">
                          Escalate to: {rule.escalateTo.join(', ')}
                        </Text>
                        <Text className="text-muted text-sm">
                          Method: {rule.notificationMethod} • Timeout: {rule.timeoutMinutes}min
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Notification Chain */}
              {selectedPlaybook.notificationChain.length > 0 && (
                <>
                  <Text className="text-lg font-semibold text-foreground mb-3 mt-4">
                    Notification Chain
                  </Text>
                  <View 
                    className="rounded-xl p-4 mb-6"
                    style={{ backgroundColor: colors.surface }}
                  >
                    {selectedPlaybook.notificationChain.map((recipient: string, index: number) => (
                      <View 
                        key={index}
                        className="flex-row items-center gap-2 py-2 border-b"
                        style={{ borderColor: colors.border }}
                      >
                        <Text className="text-foreground">📧</Text>
                        <Text className="text-foreground flex-1">{recipient}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Action Edit Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="px-4 py-4 border-b" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <Text className="text-error text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">
                Edit Action
              </Text>
              <TouchableOpacity onPress={handleSaveAction}>
                <Text className="text-primary text-lg font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView className="flex-1 px-4 py-4">
            <View className="mb-4">
              <Text className="text-muted mb-1">Action Name</Text>
              <TextInput
                value={actionName}
                onChangeText={setActionName}
                placeholder="Enter action name"
                placeholderTextColor={colors.muted}
                className="px-4 py-3 rounded-xl text-foreground"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-muted mb-1">Description</Text>
              <TextInput
                value={actionDescription}
                onChangeText={setActionDescription}
                placeholder="Enter action description"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                className="px-4 py-3 rounded-xl text-foreground"
                style={{ 
                  backgroundColor: colors.surface, 
                  borderWidth: 1, 
                  borderColor: colors.border,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
              />
            </View>
            
            <View 
              className="flex-row items-center justify-between mb-4 p-4 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <View>
                <Text className="text-foreground font-medium">Automated Execution</Text>
                <Text className="text-muted text-sm">Run this action automatically</Text>
              </View>
              <Switch
                value={actionAutomated}
                onValueChange={setActionAutomated}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            
            <View 
              className="flex-row items-center justify-between mb-4 p-4 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <View>
                <Text className="text-foreground font-medium">Requires Approval</Text>
                <Text className="text-muted text-sm">Manual approval before execution</Text>
              </View>
              <Switch
                value={actionRequiresApproval}
                onValueChange={setActionRequiresApproval}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-muted mb-1">Timeout (seconds)</Text>
              <TextInput
                value={actionTimeout}
                onChangeText={setActionTimeout}
                placeholder="300"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                className="px-4 py-3 rounded-xl text-foreground"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
