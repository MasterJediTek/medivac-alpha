/**
 * Real-Time Bed Board Screen
 * Interactive bed management with drag-and-drop transfers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  bedBoardService,
  Bed,
  Unit,
  TransferRequest,
  BedBoardSummary,
  BedStatus,
} from '@/src/services/BedBoardService';

type ViewMode = 'grid' | 'list' | 'transfers';

export default function BedBoardScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [summary, setSummary] = useState<BedBoardSummary | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [transferMode, setTransferMode] = useState<{ fromBed: Bed } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setSummary(bedBoardService.getSummary());
    setUnits(bedBoardService.getUnits());
    setBeds(selectedUnit ? bedBoardService.getBedsByUnit(selectedUnit) : bedBoardService.getBeds());
    setTransfers(bedBoardService.getPendingTransfers());
  }, [selectedUnit]);

  useEffect(() => {
    loadData();
    const unsubscribe = bedBoardService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleBedPress = (bed: Bed) => {
    if (transferMode) {
      // In transfer mode - initiate transfer
      if (bed.status === 'available' || bed.status === 'reserved') {
        Alert.alert(
          'Confirm Transfer',
          `Transfer ${transferMode.fromBed.patient?.name} from ${transferMode.fromBed.roomNumber}${transferMode.fromBed.bedLetter} to ${bed.roomNumber}${bed.bedLetter}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: () => {
                const result = bedBoardService.initiateTransfer(
                  transferMode.fromBed.patient?.id || '',
                  transferMode.fromBed.id,
                  bed.id,
                  'Bed transfer requested via bed board',
                  'routine',
                  'Current User'
                );
                Alert.alert(result.success ? 'Success' : 'Error', result.message);
                setTransferMode(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Cannot Transfer', `Bed ${bed.roomNumber}${bed.bedLetter} is ${bed.status}`);
      }
    } else {
      setSelectedBed(bed);
    }
  };

  const handleStartTransfer = (bed: Bed) => {
    if (bed.patient) {
      setTransferMode({ fromBed: bed });
      setSelectedBed(null);
      Alert.alert('Transfer Mode', 'Tap on an available bed to transfer the patient');
    }
  };

  const handleDischarge = (bed: Bed) => {
    Alert.alert(
      'Confirm Discharge',
      `Discharge ${bed.patient?.name} from ${bed.roomNumber}${bed.bedLetter}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discharge',
          style: 'destructive',
          onPress: () => {
            bedBoardService.dischargePatient(bed.id);
            setSelectedBed(null);
          },
        },
      ]
    );
  };

  const handleMarkClean = (bed: Bed) => {
    bedBoardService.markBedClean(bed.id);
    setSelectedBed(null);
  };

  const renderSummaryBar = () => {
    if (!summary) return null;

    return (
      <View style={[styles.summaryBar, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{summary.occupiedBeds}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Occupied</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{summary.availableBeds}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Available</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{summary.cleaningBeds}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Cleaning</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{summary.pendingTransfers}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Transfers</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{summary.occupancyRate}%</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Occupancy</Text>
        </View>
      </View>
    );
  };

  const renderUnitSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitSelector}>
      <TouchableOpacity
        style={[
          styles.unitChip,
          { backgroundColor: !selectedUnit ? colors.primary : colors.surface },
        ]}
        onPress={() => setSelectedUnit(null)}
      >
        <Text style={[styles.unitChipText, { color: !selectedUnit ? '#FFFFFF' : colors.foreground }]}>
          All Units
        </Text>
      </TouchableOpacity>
      {units.map((unit) => {
        const unitSummary = summary?.unitSummaries.find(u => u.unitId === unit.id);
        return (
          <TouchableOpacity
            key={unit.id}
            style={[
              styles.unitChip,
              {
                backgroundColor: selectedUnit === unit.id ? unit.color : colors.surface,
                borderColor: unit.color,
                borderWidth: 1,
              },
            ]}
            onPress={() => setSelectedUnit(unit.id)}
          >
            <Text
              style={[
                styles.unitChipText,
                { color: selectedUnit === unit.id ? '#FFFFFF' : colors.foreground },
              ]}
            >
              {unit.shortName}
            </Text>
            {unitSummary && (
              <Text
                style={[
                  styles.unitChipCount,
                  { color: selectedUnit === unit.id ? '#FFFFFF' : colors.muted },
                ]}
              >
                {unitSummary.available}/{unitSummary.totalBeds}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderBedCell = (bed: Bed) => {
    const isTransferSource = transferMode?.fromBed.id === bed.id;
    const isTransferTarget = transferMode && (bed.status === 'available' || bed.status === 'reserved');

    return (
      <TouchableOpacity
        key={bed.id}
        style={[
          styles.bedCell,
          {
            backgroundColor: bedBoardService.getStatusColor(bed.status),
            borderColor: isTransferSource ? '#EF4444' : isTransferTarget ? '#22C55E' : 'transparent',
            borderWidth: isTransferSource || isTransferTarget ? 3 : 0,
          },
        ]}
        onPress={() => handleBedPress(bed)}
      >
        <Text style={styles.bedNumber}>{bed.roomNumber}{bed.bedLetter}</Text>
        {bed.patient && (
          <>
            <Text style={styles.bedPatientName} numberOfLines={1}>
              {bed.patient.name.split(' ')[1]}
            </Text>
            <View style={styles.bedIndicators}>
              {bed.patient.alerts.length > 0 && (
                <View style={[styles.alertDot, { backgroundColor: '#EF4444' }]} />
              )}
              {bed.isolationType !== 'none' && (
                <View
                  style={[
                    styles.alertDot,
                    { backgroundColor: bedBoardService.getIsolationColor(bed.isolationType) },
                  ]}
                />
              )}
            </View>
          </>
        )}
        {bed.status === 'cleaning' && (
          <Text style={styles.bedStatusText}>🧹</Text>
        )}
        {bed.status === 'reserved' && (
          <Text style={styles.bedStatusText}>📋</Text>
        )}
        {bed.status === 'blocked' && (
          <Text style={styles.bedStatusText}>🚫</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderBedGrid = () => {
    const displayBeds = selectedUnit ? beds : beds.slice(0, 60);
    const groupedByRoom: Record<string, Bed[]> = {};

    displayBeds.forEach((bed) => {
      const key = `${bed.unitId}-${bed.roomNumber}`;
      if (!groupedByRoom[key]) groupedByRoom[key] = [];
      groupedByRoom[key].push(bed);
    });

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.gridContainer}
      >
        {transferMode && (
          <View style={[styles.transferBanner, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.transferBannerText}>
              🔄 Transferring {transferMode.fromBed.patient?.name} - Tap destination bed
            </Text>
            <TouchableOpacity onPress={() => setTransferMode(null)}>
              <Text style={styles.cancelTransferText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.legend}>
          {(['occupied', 'available', 'cleaning', 'reserved', 'blocked'] as BedStatus[]).map((status) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bedBoardService.getStatusColor(status) }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>
                {bedBoardService.getStatusLabel(status)}
              </Text>
            </View>
          ))}
        </View>

        {Object.entries(groupedByRoom).map(([key, roomBeds]) => (
          <View key={key} style={styles.roomRow}>
            {roomBeds.map((bed) => renderBedCell(bed))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderTransfersList = () => (
    <FlatList
      data={transfers}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No pending transfers</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.transferCard, { backgroundColor: colors.surface }]}>
          <View style={styles.transferHeader}>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    item.priority === 'stat'
                      ? '#FEE2E2'
                      : item.priority === 'urgent'
                      ? '#FEF3C7'
                      : '#DCFCE7',
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  {
                    color:
                      item.priority === 'stat'
                        ? '#EF4444'
                        : item.priority === 'urgent'
                        ? '#F59E0B'
                        : '#22C55E',
                  },
                ]}
              >
                {item.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.transferStatus, { color: colors.muted }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.transferPatient, { color: colors.foreground }]}>
            {item.patientName}
          </Text>

          <View style={styles.transferRoute}>
            <View style={styles.transferLocation}>
              <Text style={[styles.transferUnit, { color: colors.muted }]}>{item.fromUnitId}</Text>
              <Text style={[styles.transferBed, { color: colors.foreground }]}>
                {item.fromBedId.split('-').pop()}
              </Text>
            </View>
            <Text style={[styles.transferArrow, { color: colors.primary }]}>→</Text>
            <View style={styles.transferLocation}>
              <Text style={[styles.transferUnit, { color: colors.muted }]}>{item.toUnitId}</Text>
              <Text style={[styles.transferBed, { color: colors.foreground }]}>
                {item.toBedId.split('-').pop()}
              </Text>
            </View>
          </View>

          <Text style={[styles.transferReason, { color: colors.muted }]} numberOfLines={2}>
            {item.reason}
          </Text>

          {item.status === 'pending' && (
            <View style={styles.transferActions}>
              <TouchableOpacity
                style={[styles.approveButton, { backgroundColor: '#22C55E' }]}
                onPress={() => {
                  const result = bedBoardService.approveTransfer(item.id, 'Current User');
                  Alert.alert(result.success ? 'Approved' : 'Error', result.message);
                }}
              >
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  bedBoardService.cancelTransfer(item.id, 'Cancelled by user');
                }}
              >
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'approved' && (
            <TouchableOpacity
              style={[styles.executeButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const result = bedBoardService.executeTransfer(item.id);
                Alert.alert(result.success ? 'Completed' : 'Error', result.message);
              }}
            >
              <Text style={styles.buttonText}>Execute Transfer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );

  const renderBedDetail = () => {
    if (!selectedBed) return null;

    return (
      <View style={[styles.detailOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={[styles.detailBedNumber, { color: colors.foreground }]}>
                {selectedBed.roomNumber}{selectedBed.bedLetter}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.muted }]}>
                {bedBoardService.getUnit(selectedBed.unitId)?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedBed(null)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: bedBoardService.getStatusColor(selectedBed.status) },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {bedBoardService.getStatusLabel(selectedBed.status)}
            </Text>
          </View>

          {selectedBed.patient && (
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.foreground }]}>
                {selectedBed.patient.name}
              </Text>
              <Text style={[styles.patientMrn, { color: colors.muted }]}>
                MRN: {selectedBed.patient.mrn}
              </Text>
              <Text style={[styles.patientDiagnosis, { color: colors.foreground }]}>
                {selectedBed.patient.diagnosis}
              </Text>
              <View style={styles.patientMeta}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.muted }]}>Acuity</Text>
                  <View
                    style={[
                      styles.acuityBadge,
                      { backgroundColor: bedBoardService.getAcuityColor(selectedBed.patient.acuity) },
                    ]}
                  >
                    <Text style={styles.acuityText}>{selectedBed.patient.acuity}</Text>
                  </View>
                </View>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.muted }]}>Attending</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {selectedBed.patient.attendingPhysician}
                  </Text>
                </View>
              </View>

              {selectedBed.patient.alerts.length > 0 && (
                <View style={styles.alertsSection}>
                  <Text style={[styles.alertsTitle, { color: colors.foreground }]}>Alerts</Text>
                  {selectedBed.patient.alerts.map((alert, idx) => (
                    <View
                      key={idx}
                      style={[styles.alertItem, { backgroundColor: alert.color + '20' }]}
                    >
                      <Text style={[styles.alertText, { color: alert.color }]}>
                        {alert.description}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleStartTransfer(selectedBed)}
                >
                  <Text style={styles.actionBtnText}>Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleDischarge(selectedBed)}
                >
                  <Text style={styles.actionBtnText}>Discharge</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedBed.status === 'cleaning' && (
            <TouchableOpacity
              style={[styles.fullWidthBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => handleMarkClean(selectedBed)}
            >
              <Text style={styles.actionBtnText}>Mark as Clean</Text>
            </TouchableOpacity>
          )}

          {selectedBed.status === 'available' && (
            <View style={styles.availableInfo}>
              <Text style={[styles.availableText, { color: colors.muted }]}>
                Bed is available for admission
              </Text>
              {selectedBed.features.length > 0 && (
                <View style={styles.featuresRow}>
                  {selectedBed.features.map((f, idx) => (
                    <View key={idx} style={[styles.featureBadge, { backgroundColor: colors.surface }]}>
                      <Text>{f.icon} {f.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Bed Board</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Real-Time Management</Text>
      </View>

      {renderSummaryBar()}
      {renderUnitSelector()}

      <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
        {(['grid', 'transfers'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.toggleBtn,
              viewMode === mode && { backgroundColor: colors.primary },
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: viewMode === mode ? '#FFFFFF' : colors.foreground },
              ]}
            >
              {mode === 'grid' ? 'Bed Grid' : 'Transfers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'grid' && renderBedGrid()}
      {viewMode === 'transfers' && renderTransfersList()}

      {selectedBed && renderBedDetail()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  unitSelector: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  unitChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitChipCount: {
    fontSize: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  transferBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  transferBannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  cancelTransferText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
  },
  roomRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bedCell: {
    width: 70,
    height: 70,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bedNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bedPatientName: {
    fontSize: 9,
    color: '#FFFFFF',
    marginTop: 2,
  },
  bedIndicators: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bedStatusText: {
    fontSize: 16,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  transferCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transferStatus: {
    fontSize: 10,
    fontWeight: '500',
  },
  transferPatient: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  transferLocation: {
    alignItems: 'center',
  },
  transferUnit: {
    fontSize: 12,
  },
  transferBed: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  transferArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  transferReason: {
    fontSize: 14,
    marginBottom: 12,
  },
  transferActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  executeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  detailCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailBedNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailUnit: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  patientInfo: {
    gap: 8,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '600',
  },
  patientMrn: {
    fontSize: 14,
  },
  patientDiagnosis: {
    fontSize: 16,
    marginTop: 8,
  },
  patientMeta: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
  },
  metaItem: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  acuityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acuityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertsSection: {
    marginTop: 16,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  alertItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fullWidthBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  availableInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  availableText: {
    fontSize: 16,
    marginBottom: 12,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
