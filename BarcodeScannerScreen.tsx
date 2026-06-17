/**
 * Barcode Scanner Screen
 * Scan and verify medications, patient wristbands, and equipment
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  barcodeScannerService,
  ScanResult,
  ScanContext,
  ScanHistoryEntry,
  BatchScanSession,
} from '../services/BarcodeScannerService';

export default function BarcodeScannerScreen() {
  const colors = useColors();
  const [selectedContext, setSelectedContext] = useState<ScanContext>('medication');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [batchSession, setBatchSession] = useState<BatchScanSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Load history
  useEffect(() => {
    setHistory(barcodeScannerService.getHistory());
  }, []);

  // Subscribe to scan results
  useEffect(() => {
    const unsubscribe = barcodeScannerService.subscribe((result) => {
      setLastScan(result);
      setHistory(barcodeScannerService.getHistory());
    });
    return unsubscribe;
  }, []);

  // Simulate scan (in production, would use camera)
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await barcodeScannerService.simulateScan(selectedContext);
      setLastScan(result);
      
      // Show appropriate feedback
      if (result.status === 'verified' || result.status === 'success') {
        // Success feedback
      } else if (result.status === 'warning') {
        Alert.alert('Warning', result.verificationResult?.warnings.join('\n') || 'Scan completed with warnings');
      } else if (result.status === 'error' || result.status === 'not_found') {
        Alert.alert('Error', result.verificationResult?.errors.join('\n') || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process scan');
    } finally {
      setIsScanning(false);
    }
  };

  // Start batch scanning
  const handleStartBatch = () => {
    const session = barcodeScannerService.startBatchSession(selectedContext);
    setBatchSession(session);
  };

  // End batch scanning
  const handleEndBatch = () => {
    const session = barcodeScannerService.endBatchSession();
    if (session) {
      Alert.alert(
        'Batch Complete',
        `Scanned: ${session.totalScans}\nSuccessful: ${session.successfulScans}\nFailed: ${session.failedScans}`
      );
    }
    setBatchSession(null);
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'verified':
      case 'success': return '✓';
      case 'warning': return '⚠️';
      case 'error':
      case 'not_found':
      case 'expired':
      case 'mismatch': return '✗';
      default: return '?';
    }
  };

  // Get context icon
  const getContextIcon = (context: ScanContext): string => {
    switch (context) {
      case 'medication': return '💊';
      case 'patient_wristband': return '🏥';
      case 'equipment': return '🔧';
      case 'specimen': return '🧪';
      case 'document': return '📄';
      case 'inventory': return '📦';
      default: return '📷';
    }
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Render scan result card
  const renderScanResult = (result: ScanResult) => (
    <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Status Header */}
      <View style={[
        styles.statusHeader,
        { backgroundColor: barcodeScannerService.getStatusColor(result.status) + '20' }
      ]}>
        <Text style={[styles.statusIcon, { color: barcodeScannerService.getStatusColor(result.status) }]}>
          {getStatusIcon(result.status)}
        </Text>
        <Text style={[styles.statusText, { color: barcodeScannerService.getStatusColor(result.status) }]}>
          {result.status.charAt(0).toUpperCase() + result.status.slice(1).replace('_', ' ')}
        </Text>
      </View>

      {/* Parsed Data */}
      {result.parsedData && (
        <View style={styles.dataSection}>
          <Text style={[styles.dataType, { color: colors.primary }]}>
            {result.parsedData.type.charAt(0).toUpperCase() + result.parsedData.type.slice(1)}
          </Text>
          
          {result.parsedData.name && (
            <Text style={[styles.dataName, { color: colors.foreground }]}>
              {result.parsedData.name}
            </Text>
          )}
          
          {result.parsedData.description && (
            <Text style={[styles.dataDescription, { color: colors.muted }]}>
              {result.parsedData.description}
            </Text>
          )}

          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={[styles.dataLabel, { color: colors.muted }]}>ID</Text>
              <Text style={[styles.dataValue, { color: colors.foreground }]}>
                {result.parsedData.identifier}
              </Text>
            </View>

            {result.parsedData.expirationDate && (
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: colors.muted }]}>Expires</Text>
                <Text style={[styles.dataValue, { color: colors.foreground }]}>
                  {result.parsedData.expirationDate}
                </Text>
              </View>
            )}

            {result.parsedData.lotNumber && (
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: colors.muted }]}>Lot #</Text>
                <Text style={[styles.dataValue, { color: colors.foreground }]}>
                  {result.parsedData.lotNumber}
                </Text>
              </View>
            )}

            {result.parsedData.manufacturer && (
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: colors.muted }]}>Manufacturer</Text>
                <Text style={[styles.dataValue, { color: colors.foreground }]}>
                  {result.parsedData.manufacturer}
                </Text>
              </View>
            )}

            {result.parsedData.patientName && (
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: colors.muted }]}>Patient</Text>
                <Text style={[styles.dataValue, { color: colors.foreground }]}>
                  {result.parsedData.patientName}
                </Text>
              </View>
            )}
          </View>

          {/* Metadata */}
          {result.parsedData.metadata && (
            <View style={styles.metadataSection}>
              {result.parsedData.metadata.allergies && result.parsedData.metadata.allergies.length > 0 && (
                <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
                  <Text style={[styles.alertTitle, { color: colors.error }]}>Allergies</Text>
                  <Text style={[styles.alertText, { color: colors.foreground }]}>
                    {result.parsedData.metadata.allergies.join(', ')}
                  </Text>
                </View>
              )}

              {result.parsedData.metadata.alerts && result.parsedData.metadata.alerts.length > 0 && (
                <View style={[styles.alertBox, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
                  <Text style={[styles.alertTitle, { color: colors.warning }]}>Alerts</Text>
                  <Text style={[styles.alertText, { color: colors.foreground }]}>
                    {result.parsedData.metadata.alerts.join(', ')}
                  </Text>
                </View>
              )}

              {result.parsedData.metadata.status && (
                <View style={styles.dataItem}>
                  <Text style={[styles.dataLabel, { color: colors.muted }]}>Status</Text>
                  <Text style={[styles.dataValue, { color: colors.foreground }]}>
                    {result.parsedData.metadata.status}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Verification Warnings/Errors */}
      {result.verificationResult && (
        <View style={styles.verificationSection}>
          {result.verificationResult.warnings.map((warning, index) => (
            <View key={`warning-${index}`} style={[styles.messageBox, { backgroundColor: colors.warning + '15' }]}>
              <Text style={[styles.messageText, { color: colors.warning }]}>⚠️ {warning}</Text>
            </View>
          ))}
          {result.verificationResult.errors.map((error, index) => (
            <View key={`error-${index}`} style={[styles.messageBox, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.messageText, { color: colors.error }]}>✗ {error}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Scan Info */}
      <View style={styles.scanInfo}>
        <Text style={[styles.scanInfoText, { color: colors.muted }]}>
          {barcodeScannerService.getBarcodeTypeLabel(result.barcodeType)} • {formatDate(result.timestamp)}
        </Text>
      </View>
    </View>
  );

  // Render history item
  const renderHistoryItem = ({ item }: { item: ScanHistoryEntry }) => (
    <TouchableOpacity
      style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        setLastScan(item.scanResult);
        setShowHistory(false);
      }}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyIcon}>{getContextIcon(item.context)}</Text>
        <View style={styles.historyInfo}>
          <Text style={[styles.historyTitle, { color: colors.foreground }]}>
            {item.scanResult.parsedData?.name || item.scanResult.rawValue}
          </Text>
          <Text style={[styles.historySubtitle, { color: colors.muted }]}>
            {barcodeScannerService.getContextLabel(item.context)}
          </Text>
        </View>
        <View style={[
          styles.historyStatus,
          { backgroundColor: barcodeScannerService.getStatusColor(item.scanResult.status) + '20' }
        ]}>
          <Text style={[styles.historyStatusText, { color: barcodeScannerService.getStatusColor(item.scanResult.status) }]}>
            {getStatusIcon(item.scanResult.status)}
          </Text>
        </View>
      </View>
      <Text style={[styles.historyDate, { color: colors.muted }]}>
        {formatDate(item.timestamp)}
      </Text>
    </TouchableOpacity>
  );

  // Context options
  const contextOptions: { value: ScanContext; label: string; icon: string }[] = [
    { value: 'medication', label: 'Medication', icon: '💊' },
    { value: 'patient_wristband', label: 'Patient Wristband', icon: '🏥' },
    { value: 'equipment', label: 'Equipment', icon: '🔧' },
    { value: 'specimen', label: 'Specimen', icon: '🧪' },
    { value: 'inventory', label: 'Inventory', icon: '📦' },
    { value: 'general', label: 'General', icon: '📷' },
  ];

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Barcode Scanner
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Verify medications, patients, and equipment
          </Text>
        </View>

        {/* Context Selector */}
        <TouchableOpacity
          style={[styles.contextSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowContextPicker(true)}
        >
          <Text style={styles.contextIcon}>{getContextIcon(selectedContext)}</Text>
          <View style={styles.contextInfo}>
            <Text style={[styles.contextLabel, { color: colors.muted }]}>Scan Mode</Text>
            <Text style={[styles.contextValue, { color: colors.foreground }]}>
              {barcodeScannerService.getContextLabel(selectedContext)}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
        </TouchableOpacity>

        {/* Scanner Area */}
        <View style={[styles.scannerArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Simulated Camera View */}
          <View style={[styles.cameraView, { backgroundColor: '#000' }]}>
            <View style={[styles.scanFrame, { borderColor: colors.primary }]}>
              <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
            </View>
            <Text style={styles.scanHint}>
              Position barcode within frame
            </Text>
          </View>

          {/* Scan Button */}
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.primary, opacity: isScanning ? 0.7 : 1 }]}
            onPress={handleScan}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Tap to Scan'}
            </Text>
          </TouchableOpacity>

          {/* Batch Mode Controls */}
          <View style={styles.batchControls}>
            {!batchSession ? (
              <TouchableOpacity
                style={[styles.batchButton, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
                onPress={handleStartBatch}
              >
                <Text style={[styles.batchButtonText, { color: colors.success }]}>
                  Start Batch Scan
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.batchActive}>
                <View style={styles.batchStats}>
                  <Text style={[styles.batchStatValue, { color: colors.foreground }]}>
                    {batchSession.totalScans}
                  </Text>
                  <Text style={[styles.batchStatLabel, { color: colors.muted }]}>Total</Text>
                </View>
                <View style={styles.batchStats}>
                  <Text style={[styles.batchStatValue, { color: colors.success }]}>
                    {batchSession.successfulScans}
                  </Text>
                  <Text style={[styles.batchStatLabel, { color: colors.muted }]}>Success</Text>
                </View>
                <View style={styles.batchStats}>
                  <Text style={[styles.batchStatValue, { color: colors.error }]}>
                    {batchSession.failedScans}
                  </Text>
                  <Text style={[styles.batchStatLabel, { color: colors.muted }]}>Failed</Text>
                </View>
                <TouchableOpacity
                  style={[styles.endBatchButton, { backgroundColor: colors.error }]}
                  onPress={handleEndBatch}
                >
                  <Text style={styles.endBatchButtonText}>End</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Last Scan Result */}
        {lastScan && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Last Scan Result
              </Text>
              <TouchableOpacity onPress={() => setShowHistory(true)}>
                <Text style={[styles.historyLink, { color: colors.primary }]}>
                  History ({history.length})
                </Text>
              </TouchableOpacity>
            </View>
            {renderScanResult(lastScan)}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Verify
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              onPress={() => {
                setSelectedContext('medication');
                handleScan();
              }}
            >
              <Text style={styles.actionIcon}>💊</Text>
              <Text style={[styles.actionText, { color: colors.foreground }]}>Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}
              onPress={() => {
                setSelectedContext('patient_wristband');
                handleScan();
              }}
            >
              <Text style={styles.actionIcon}>🏥</Text>
              <Text style={[styles.actionText, { color: colors.foreground }]}>Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}
              onPress={() => {
                setSelectedContext('equipment');
                handleScan();
              }}
            >
              <Text style={styles.actionIcon}>🔧</Text>
              <Text style={[styles.actionText, { color: colors.foreground }]}>Equipment</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Context Picker Modal */}
      <Modal
        visible={showContextPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContextPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Scan Mode
            </Text>
            <TouchableOpacity onPress={() => setShowContextPicker(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={contextOptions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.contextOption,
                  { borderBottomColor: colors.border },
                  selectedContext === item.value && { backgroundColor: colors.primary + '15' }
                ]}
                onPress={() => {
                  setSelectedContext(item.value);
                  setShowContextPicker(false);
                }}
              >
                <Text style={styles.contextOptionIcon}>{item.icon}</Text>
                <Text style={[styles.contextOptionText, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                {selectedContext === item.value && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Scan History
            </Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No scans yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              contentContainerStyle={styles.historyList}
            />
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  contextSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  contextIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  contextInfo: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 12,
  },
  contextValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
  },
  scannerArea: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cameraView: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 200,
    height: 120,
    borderWidth: 2,
    borderRadius: 8,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanHint: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
  },
  scanButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  batchControls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  batchButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  batchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  batchActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchStats: {
    alignItems: 'center',
  },
  batchStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  batchStatLabel: {
    fontSize: 12,
  },
  endBatchButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  endBatchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultSection: {
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyLink: {
    fontSize: 14,
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  statusIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataSection: {
    padding: 16,
  },
  dataType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dataName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dataItem: {
    minWidth: '40%',
  },
  dataLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  metadataSection: {
    marginTop: 16,
  },
  alertBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
  },
  verificationSection: {
    padding: 16,
    paddingTop: 0,
  },
  messageBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
  },
  scanInfo: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  scanInfoText: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  contextOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contextOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  contextOptionText: {
    flex: 1,
    fontSize: 16,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  historySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  historyStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 12,
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  bottomPadding: {
    height: 100,
  },
});
