/**
 * Vital Signs Monitoring Screen
 * Real-time vital sign tracking with trending and alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  vitalSignsService,
  VitalSignType,
  VitalSignReading,
  VitalSignAlert,
  EWSResult,
  TrendAnalysis,
} from '../services/VitalSignsService';

// Demo patient
const DEMO_PATIENT = { id: 'P-001', name: 'John Smith' };

export default function VitalSignsScreen() {
  const colors = useColors();
  const [latestReadings, setLatestReadings] = useState<Map<VitalSignType, VitalSignReading>>(new Map());
  const [alerts, setAlerts] = useState<VitalSignAlert[]>([]);
  const [ewsResult, setEwsResult] = useState<EWSResult | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedType, setSelectedType] = useState<VitalSignType | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showTrend, setShowTrend] = useState<VitalSignType | null>(null);
  const [trendData, setTrendData] = useState<TrendAnalysis | null>(null);

  // Load data
  const loadData = useCallback(() => {
    setLatestReadings(vitalSignsService.getLatestReadings(DEMO_PATIENT.id));
    setAlerts(vitalSignsService.getActiveAlerts(DEMO_PATIENT.id));
    setEwsResult(vitalSignsService.calculateEWS(DEMO_PATIENT.id));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to alerts
  useEffect(() => {
    const unsubscribe = vitalSignsService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Record vital sign
  const handleRecord = async () => {
    if (!selectedType || !inputValue) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      await vitalSignsService.recordVitalSign(
        DEMO_PATIENT.id,
        DEMO_PATIENT.name,
        selectedType,
        value,
        'Current User',
        'manual'
      );
      setShowRecordModal(false);
      setSelectedType(null);
      setInputValue('');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record vital sign');
    }
  };

  // View trend
  const handleViewTrend = (type: VitalSignType) => {
    const analysis = vitalSignsService.analyzeTrend(DEMO_PATIENT.id, type, 24);
    setTrendData(analysis);
    setShowTrend(type);
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    await vitalSignsService.acknowledgeAlert(alertId, 'Current User');
    loadData();
  };

  // Get EWS color
  const getEWSColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return colors.error;
      case 'high': return '#F97316';
      case 'medium': return colors.warning;
      default: return colors.success;
    }
  };

  // Render vital sign card
  const renderVitalCard = (type: VitalSignType) => {
    const threshold = vitalSignsService.getThreshold(type);
    const reading = latestReadings.get(type);
    const icon = vitalSignsService.getVitalSignIcon(type);

    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.vitalCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          reading && { borderColor: vitalSignsService.getSeverityColor(reading.alertSeverity) },
        ]}
        onPress={() => {
          setSelectedType(type);
          setShowRecordModal(true);
        }}
        onLongPress={() => handleViewTrend(type)}
      >
        <View style={styles.vitalHeader}>
          <Text style={styles.vitalIcon}>{icon}</Text>
          <Text style={[styles.vitalName, { color: colors.foreground }]}>{threshold?.name}</Text>
        </View>
        
        {reading ? (
          <View style={styles.vitalValue}>
            <Text style={[
              styles.valueText,
              { color: vitalSignsService.getSeverityColor(reading.alertSeverity) }
            ]}>
              {reading.value}
            </Text>
            <Text style={[styles.unitText, { color: colors.muted }]}>{reading.unit}</Text>
          </View>
        ) : (
          <Text style={[styles.noData, { color: colors.muted }]}>No data</Text>
        )}
        
        <Text style={[styles.normalRange, { color: colors.muted }]}>
          Normal: {threshold?.normalMin}-{threshold?.normalMax}
        </Text>
        
        {reading && (
          <Text style={[styles.timestamp, { color: colors.muted }]}>
            {new Date(reading.timestamp).toLocaleTimeString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render alert card
  const renderAlertCard = ({ item }: { item: VitalSignAlert }) => (
    <View style={[
      styles.alertCard,
      { backgroundColor: vitalSignsService.getSeverityColor(item.severity) + '15', borderColor: vitalSignsService.getSeverityColor(item.severity) }
    ]}>
      <View style={styles.alertHeader}>
        <View style={[styles.severityBadge, { backgroundColor: vitalSignsService.getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={[styles.alertTime, { color: colors.muted }]}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={[styles.alertMessage, { color: colors.foreground }]}>{item.message}</Text>
      {!item.acknowledgedAt && (
        <TouchableOpacity
          style={[styles.ackButton, { backgroundColor: colors.primary }]}
          onPress={() => handleAcknowledgeAlert(item.id)}
        >
          <Text style={styles.ackButtonText}>Acknowledge</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render mini trend chart
  const renderMiniTrend = () => {
    if (!trendData || trendData.dataPoints.length === 0) return null;

    const maxValue = trendData.maxValue;
    const minValue = trendData.minValue;
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.trendChart}>
        <View style={styles.trendBars}>
          {trendData.dataPoints.slice(-12).map((point, index) => {
            const height = ((point.value - minValue) / range) * 60 + 10;
            return (
              <View
                key={index}
                style={[
                  styles.trendBar,
                  {
                    height,
                    backgroundColor: vitalSignsService.getSeverityColor(point.alertSeverity),
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.trendLabels}>
          <Text style={[styles.trendLabel, { color: colors.muted }]}>{minValue}</Text>
          <Text style={[styles.trendLabel, { color: colors.muted }]}>{maxValue}</Text>
        </View>
      </View>
    );
  };

  const vitalTypes: VitalSignType[] = [
    'heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic',
    'respiratory_rate', 'temperature', 'oxygen_saturation', 'pain_level', 'blood_glucose'
  ];

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Vital Signs</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Patient: {DEMO_PATIENT.name}
          </Text>
        </View>

        {/* EWS Score */}
        {ewsResult && (
          <View style={[
            styles.ewsCard,
            { backgroundColor: getEWSColor(ewsResult.riskLevel) + '15', borderColor: getEWSColor(ewsResult.riskLevel) }
          ]}>
            <View style={styles.ewsHeader}>
              <Text style={[styles.ewsTitle, { color: colors.foreground }]}>Early Warning Score</Text>
              <View style={[styles.ewsScore, { backgroundColor: getEWSColor(ewsResult.riskLevel) }]}>
                <Text style={styles.ewsScoreText}>{ewsResult.totalScore}</Text>
              </View>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: getEWSColor(ewsResult.riskLevel) }]}>
              <Text style={styles.riskText}>{ewsResult.riskLevel.toUpperCase()} RISK</Text>
            </View>
            <Text style={[styles.ewsRecommendation, { color: colors.foreground }]}>
              {ewsResult.recommendation}
            </Text>
          </View>
        )}

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Alerts ({alerts.length})
            </Text>
            <FlatList
              data={alerts}
              keyExtractor={(item) => item.id}
              renderItem={renderAlertCard}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Vital Signs Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Readings</Text>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>
            Tap to record • Long press for trend
          </Text>
          <View style={styles.vitalsGrid}>
            {vitalTypes.map(renderVitalCard)}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Record Modal */}
      <Modal
        visible={showRecordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecordModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Record {selectedType && vitalSignsService.getThreshold(selectedType)?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowRecordModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputIcon}>
              {selectedType && vitalSignsService.getVitalSignIcon(selectedType)}
            </Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.valueInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter value"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={[styles.inputUnit, { color: colors.muted }]}>
                {selectedType && vitalSignsService.getThreshold(selectedType)?.unit}
              </Text>
            </View>

            {selectedType && (
              <View style={[styles.rangeInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.rangeTitle, { color: colors.foreground }]}>Reference Ranges</Text>
                <View style={styles.rangeRow}>
                  <View style={[styles.rangeDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.rangeText, { color: colors.muted }]}>
                    Normal: {vitalSignsService.getThreshold(selectedType)?.normalMin}-{vitalSignsService.getThreshold(selectedType)?.normalMax}
                  </Text>
                </View>
                <View style={styles.rangeRow}>
                  <View style={[styles.rangeDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.rangeText, { color: colors.muted }]}>
                    Warning: {vitalSignsService.getThreshold(selectedType)?.warningMin}-{vitalSignsService.getThreshold(selectedType)?.warningMax}
                  </Text>
                </View>
                <View style={styles.rangeRow}>
                  <View style={[styles.rangeDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.rangeText, { color: colors.muted }]}>
                    Critical: &lt;{vitalSignsService.getThreshold(selectedType)?.criticalMin} or &gt;{vitalSignsService.getThreshold(selectedType)?.criticalMax}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: colors.primary }]}
              onPress={handleRecord}
            >
              <Text style={styles.recordButtonText}>Record Vital Sign</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Trend Modal */}
      <Modal
        visible={showTrend !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTrend(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {showTrend && vitalSignsService.getThreshold(showTrend)?.name} Trend
            </Text>
            <TouchableOpacity onPress={() => setShowTrend(null)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {trendData ? (
              <>
                {renderMiniTrend()}
                
                <View style={[styles.trendStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.trendStatRow}>
                    <Text style={[styles.trendStatLabel, { color: colors.muted }]}>Direction</Text>
                    <Text style={[styles.trendStatValue, { color: colors.foreground }]}>
                      {trendData.direction.charAt(0).toUpperCase() + trendData.direction.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.trendStatRow}>
                    <Text style={[styles.trendStatLabel, { color: colors.muted }]}>Change</Text>
                    <Text style={[
                      styles.trendStatValue,
                      { color: trendData.changePercent > 0 ? colors.error : trendData.changePercent < 0 ? colors.success : colors.foreground }
                    ]}>
                      {trendData.changePercent > 0 ? '+' : ''}{trendData.changePercent}%
                    </Text>
                  </View>
                  <View style={styles.trendStatRow}>
                    <Text style={[styles.trendStatLabel, { color: colors.muted }]}>Average</Text>
                    <Text style={[styles.trendStatValue, { color: colors.foreground }]}>
                      {trendData.averageValue}
                    </Text>
                  </View>
                  <View style={styles.trendStatRow}>
                    <Text style={[styles.trendStatLabel, { color: colors.muted }]}>Range</Text>
                    <Text style={[styles.trendStatValue, { color: colors.foreground }]}>
                      {trendData.minValue} - {trendData.maxValue}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noTrendData}>
                <Text style={[styles.noTrendText, { color: colors.muted }]}>
                  Not enough data for trend analysis.
                  Record at least 2 readings to see trends.
                </Text>
              </View>
            )}
          </View>
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
  ewsCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
  },
  ewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ewsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ewsScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ewsScoreText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  ewsRecommendation: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  alertCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  alertTime: {
    fontSize: 12,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  ackButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  ackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalCard: {
    width: '47%',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  vitalName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  vitalValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 14,
    marginLeft: 4,
  },
  noData: {
    fontSize: 14,
    marginBottom: 4,
  },
  normalRange: {
    fontSize: 10,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
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
  modalContent: {
    padding: 24,
  },
  inputIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 20,
    marginLeft: 12,
  },
  rangeInfo: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  rangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  rangeText: {
    fontSize: 14,
  },
  recordButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trendChart: {
    marginBottom: 24,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 80,
    marginBottom: 8,
  },
  trendBar: {
    width: 20,
    borderRadius: 4,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendLabel: {
    fontSize: 12,
  },
  trendStats: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  trendStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendStatLabel: {
    fontSize: 14,
  },
  trendStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noTrendData: {
    alignItems: 'center',
    padding: 32,
  },
  noTrendText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
