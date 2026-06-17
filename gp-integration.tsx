import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gpIntegration, type GPPractice, type TransferRecord } from '@/lib/services/gp-integration-service';

type TabType = 'practices' | 'transfers' | 'import' | 'export' | 'settings';

export default function GPIntegrationScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('practices');
  const [refreshing, setRefreshing] = useState(false);
  const [practices, setPractices] = useState<GPPractice[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [stats, setStats] = useState(gpIntegration.getStatistics());
  const [config, setConfig] = useState(gpIntegration.getConfig());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<GPPractice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setPractices(gpIntegration.getPractices());
    setTransfers(gpIntegration.getTransfers());
    setStats(gpIntegration.getStatistics());
    setConfig(gpIntegration.getConfig());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleConnect = async (practiceId: string) => {
    const success = await gpIntegration.connectPractice(practiceId);
    if (success) {
      Alert.alert('Success', 'Connected to GP practice');
      loadData();
    }
  };

  const handleDisconnect = async (practiceId: string) => {
    Alert.alert(
      'Disconnect Practice',
      'Are you sure you want to disconnect from this practice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await gpIntegration.disconnectPractice(practiceId);
            loadData();
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    if (!selectedPractice) return;

    try {
      const transfer = await gpIntegration.importPatientRecords(
        selectedPractice.id,
        ['patient_001', 'patient_002'], // Demo patient IDs
        ['Patient', 'Condition', 'MedicationStatement', 'Immunization', 'Observation']
      );
      Alert.alert('Import Started', `Transfer ID: ${transfer.id}\nStatus: ${transfer.status}`);
      setShowImportModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start import');
    }
  };

  const handleExport = async () => {
    if (!selectedPractice) return;

    try {
      const patient = gpIntegration.createFHIRPatient({
        id: 'patient_001',
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1975-03-15',
        gender: 'male',
        medicareNumber: '2123456789',
        phone: '0412345678',
      });

      const transfer = await gpIntegration.exportPatientRecords(
        selectedPractice.id,
        'patient_001',
        'John Smith',
        [patient]
      );

      Alert.alert(
        'Export Initiated',
        config.requireApprovalForExport
          ? `Transfer requires approval.\nID: ${transfer.id}`
          : `Transfer started.\nID: ${transfer.id}`
      );
      setShowExportModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start export');
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await gpIntegration.approveExport(transferId, 'Current User');
      Alert.alert('Success', 'Transfer approved and processing');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve transfer');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#22C55E';
      case 'pending': return '#F59E0B';
      case 'disconnected': return '#6B7280';
      case 'error': return '#EF4444';
      default: return colors.muted;
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22C55E';
      case 'in-progress': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return colors.muted;
    }
  };

  const filteredPractices = practices.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPracticesTab = () => (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search practices..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Integration Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.connectedPractices}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Connected</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalPractices}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.completedTransfers}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Transfers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalResourcesTransferred}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Resources</Text>
          </View>
        </View>
      </View>

      {/* Practices List */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>GP Practices ({filteredPractices.length})</Text>
        {filteredPractices.map((practice, index) => (
          <View
            key={practice.id}
            style={[
              styles.practiceItem,
              index < filteredPractices.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.practiceInfo}>
              <View style={styles.practiceHeader}>
                <Text style={[styles.practiceName, { color: colors.foreground }]}>{practice.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(practice.integrationStatus) }]}>
                  <Text style={styles.statusBadgeText}>{practice.integrationStatus}</Text>
                </View>
              </View>
              <Text style={[styles.practiceAddress, { color: colors.muted }]}>
                {practice.address.line.join(', ')}, {practice.address.city} {practice.address.state} {practice.address.postalCode}
              </Text>
              <Text style={[styles.practiceContact, { color: colors.muted }]}>
                {practice.phone} {practice.secureMessaging ? `• ${practice.secureMessaging.provider}` : ''}
              </Text>
              {practice.practitioners && practice.practitioners.length > 0 && (
                <Text style={[styles.practiceDoctors, { color: colors.muted }]}>
                  {practice.practitioners.length} practitioner{practice.practitioners.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View style={styles.practiceActions}>
              {practice.integrationStatus === 'connected' ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setSelectedPractice(practice);
                      setShowImportModal(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Import</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
                    onPress={() => {
                      setSelectedPractice(practice);
                      setShowExportModal(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Export</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => handleDisconnect(practice.id)}
                  >
                    <Text style={styles.actionButtonText}>Disconnect</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleConnect(practice.id)}
                >
                  <Text style={styles.actionButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTransfersTab = () => {
    const pendingApprovals = transfers.filter(t => t.status === 'pending');
    const recentTransfers = transfers.slice(0, 10);

    return (
      <View style={styles.tabContent}>
        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <View style={[styles.card, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Text style={[styles.cardTitle, { color: '#92400E' }]}>Pending Approvals ({pendingApprovals.length})</Text>
            {pendingApprovals.map((transfer) => (
              <View key={transfer.id} style={[styles.transferItem, { borderBottomColor: '#F59E0B' }]}>
                <View style={styles.transferInfo}>
                  <Text style={[styles.transferType, { color: '#92400E' }]}>
                    {transfer.type.toUpperCase()} - {transfer.resourceType}
                  </Text>
                  <Text style={[styles.transferMeta, { color: '#B45309' }]}>
                    {transfer.patientName} → {transfer.destinationGP}
                  </Text>
                  <Text style={[styles.transferMeta, { color: '#B45309' }]}>
                    {transfer.resourceCount} resources • {new Date(transfer.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.transferActions}>
                  <TouchableOpacity
                    style={[styles.approveButton, { backgroundColor: '#22C55E' }]}
                    onPress={() => handleApproveTransfer(transfer.id)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transfers */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Recent Transfers</Text>
          {recentTransfers.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No transfers yet</Text>
          ) : (
            recentTransfers.map((transfer, index) => (
              <View
                key={transfer.id}
                style={[
                  styles.transferItem,
                  index < recentTransfers.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.transferInfo}>
                  <View style={styles.transferHeader}>
                    <Text style={[styles.transferType, { color: colors.foreground }]}>
                      {transfer.type.toUpperCase()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getTransferStatusColor(transfer.status) }]}>
                      <Text style={styles.statusBadgeText}>{transfer.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transferMeta, { color: colors.muted }]}>
                    {transfer.resourceType}
                  </Text>
                  <Text style={[styles.transferMeta, { color: colors.muted }]}>
                    {transfer.type === 'import' ? `From: ${transfer.sourceGP}` : `To: ${transfer.destinationGP}`}
                  </Text>
                  <Text style={[styles.transferMeta, { color: colors.muted }]}>
                    {transfer.resourceCount} resources • {new Date(transfer.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Integration Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>My Health Record</Text>
            <Text style={[styles.settingDesc, { color: colors.muted }]}>Enable My Health Record integration</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, config.myHealthRecordEnabled && { backgroundColor: colors.primary }]}
            onPress={async () => {
              await gpIntegration.updateConfig({ myHealthRecordEnabled: !config.myHealthRecordEnabled });
              setConfig(gpIntegration.getConfig());
            }}
          >
            <View style={[styles.toggleKnob, config.myHealthRecordEnabled && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Auto-Import Pathology</Text>
            <Text style={[styles.settingDesc, { color: colors.muted }]}>Automatically import pathology results</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, config.autoImportPathology && { backgroundColor: colors.primary }]}
            onPress={async () => {
              await gpIntegration.updateConfig({ autoImportPathology: !config.autoImportPathology });
              setConfig(gpIntegration.getConfig());
            }}
          >
            <View style={[styles.toggleKnob, config.autoImportPathology && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Auto-Export Discharges</Text>
            <Text style={[styles.settingDesc, { color: colors.muted }]}>Automatically export discharge summaries</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, config.autoExportDischarges && { backgroundColor: colors.primary }]}
            onPress={async () => {
              await gpIntegration.updateConfig({ autoExportDischarges: !config.autoExportDischarges });
              setConfig(gpIntegration.getConfig());
            }}
          >
            <View style={[styles.toggleKnob, config.autoExportDischarges && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Require Export Approval</Text>
            <Text style={[styles.settingDesc, { color: colors.muted }]}>Require approval before exporting records</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, config.requireApprovalForExport && { backgroundColor: colors.primary }]}
            onPress={async () => {
              await gpIntegration.updateConfig({ requireApprovalForExport: !config.requireApprovalForExport });
              setConfig(gpIntegration.getConfig());
            }}
          >
            <View style={[styles.toggleKnob, config.requireApprovalForExport && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Encryption</Text>
            <Text style={[styles.settingDesc, { color: colors.muted }]}>Encrypt all transfers</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, config.encryptionEnabled && { backgroundColor: colors.primary }]}
            onPress={async () => {
              await gpIntegration.updateConfig({ encryptionEnabled: !config.encryptionEnabled });
              setConfig(gpIntegration.getConfig());
            }}
          >
            <View style={[styles.toggleKnob, config.encryptionEnabled && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Secure Messaging Provider</Text>
        <Text style={[styles.settingDesc, { color: colors.muted, marginBottom: 12 }]}>
          Current: {config.secureMessagingProvider || 'Not configured'}
        </Text>
        <View style={styles.providerGrid}>
          {['healthlink', 'argus', 'medical-objects', 'referralnet'].map((provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerButton,
                { borderColor: colors.border },
                config.secureMessagingProvider === provider && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
              ]}
              onPress={async () => {
                await gpIntegration.updateConfig({ secureMessagingProvider: provider as typeof config.secureMessagingProvider });
                setConfig(gpIntegration.getConfig());
              }}
            >
              <Text
                style={[
                  styles.providerText,
                  { color: config.secureMessagingProvider === provider ? colors.primary : colors.foreground },
                ]}
              >
                {provider.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Export Format</Text>
        <View style={styles.formatGrid}>
          {[
            { id: 'fhir-r4', label: 'FHIR R4' },
            { id: 'hl7-v2', label: 'HL7 v2' },
            { id: 'cda', label: 'CDA' },
          ].map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatButton,
                { borderColor: colors.border },
                config.defaultExportFormat === format.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
              ]}
              onPress={async () => {
                await gpIntegration.updateConfig({ defaultExportFormat: format.id as typeof config.defaultExportFormat });
                setConfig(gpIntegration.getConfig());
              }}
            >
              <Text
                style={[
                  styles.formatText,
                  { color: config.defaultExportFormat === format.id ? colors.primary : colors.foreground },
                ]}
              >
                {format.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const tabs: { id: TabType; label: string }[] = [
    { id: 'practices', label: 'Practices' },
    { id: 'transfers', label: 'Transfers' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>GP Integration</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>HL7 FHIR Record Exchange</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.id ? colors.primary : colors.muted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'practices' && renderPracticesTab()}
        {activeTab === 'transfers' && renderTransfersTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Import Records</Text>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              From: {selectedPractice?.name}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              This will import patient records including conditions, medications, immunizations, and observations.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleImport}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Export Records</Text>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              To: {selectedPractice?.name}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              Export patient records in {config.defaultExportFormat.toUpperCase()} format.
              {config.requireApprovalForExport && '\n\nNote: This transfer will require approval before processing.'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#22C55E' }]}
                onPress={handleExport}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    gap: 16,
  },
  searchContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 44,
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  practiceItem: {
    paddingVertical: 12,
  },
  practiceInfo: {
    marginBottom: 8,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  practiceName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  practiceAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  practiceContact: {
    fontSize: 12,
    marginTop: 2,
  },
  practiceDoctors: {
    fontSize: 12,
    marginTop: 2,
  },
  practiceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  transferItem: {
    paddingVertical: 12,
  },
  transferInfo: {
    flex: 1,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transferType: {
    fontSize: 14,
    fontWeight: '600',
  },
  transferMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  transferActions: {
    marginTop: 8,
  },
  approveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  providerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  formatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
