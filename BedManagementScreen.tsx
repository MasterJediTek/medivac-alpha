/**
 * Bed Management Dashboard Screen
 * Real-time bed availability and ADT workflow
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  bedManagementService,
  Unit,
  Bed,
  OccupancyStats,
  AdmissionRequest,
  DischargePlan,
  TransferRequest,
} from '../services/BedManagementService';

export default function BedManagementScreen() {
  const colors = useColors();
  const [units, setUnits] = useState<Unit[]>([]);
  const [stats, setStats] = useState<OccupancyStats[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [pendingAdmissions, setPendingAdmissions] = useState<AdmissionRequest[]>([]);
  const [pendingDischarges, setPendingDischarges] = useState<DischargePlan[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>([]);
  const [showUnitDetail, setShowUnitDetail] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState<'admissions' | 'discharges' | 'transfers' | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // Load data
  const loadData = useCallback(() => {
    setUnits(bedManagementService.getUnits());
    setStats(bedManagementService.getOccupancyStats());
    setPendingAdmissions(bedManagementService.getPendingAdmissions());
    setPendingDischarges(bedManagementService.getPendingDischarges());
    setPendingTransfers(bedManagementService.getPendingTransfers());
    
    if (selectedUnit) {
      setBeds(bedManagementService.getBedsByUnit(selectedUnit.id));
    }
  }, [selectedUnit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = bedManagementService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Handle unit selection
  const handleSelectUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setBeds(bedManagementService.getBedsByUnit(unit.id));
    setShowUnitDetail(true);
  };

  // Handle bed cleaning
  const handleBedCleaning = async (bed: Bed) => {
    if (bed.cleaningStatus === 'dirty' || bed.status === 'cleaning') {
      Alert.alert(
        'Bed Cleaning',
        bed.cleaningStatus === 'in_progress' ? 'Mark cleaning as complete?' : 'Start cleaning this bed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: bed.cleaningStatus === 'in_progress' ? 'Complete' : 'Start',
            onPress: async () => {
              try {
                if (bed.cleaningStatus === 'in_progress') {
                  await bedManagementService.completeBedCleaning(bed.id);
                } else {
                  await bedManagementService.startBedCleaning(bed.id);
                }
                loadData();
              } catch (error) {
                Alert.alert('Error', 'Failed to update bed cleaning status');
              }
            },
          },
        ]
      );
    }
  };

  // Complete admission
  const handleCompleteAdmission = async (admission: AdmissionRequest) => {
    if (admission.status === 'assigned') {
      try {
        await bedManagementService.completeAdmission(admission.id, 'Current User');
        loadData();
      } catch (error) {
        Alert.alert('Error', 'Failed to complete admission');
      }
    }
  };

  // Complete discharge
  const handleCompleteDischarge = async (discharge: DischargePlan) => {
    if (discharge.status === 'ready' || discharge.status === 'in_progress') {
      try {
        await bedManagementService.completeDischarge(discharge.id, 'Current User');
        loadData();
      } catch (error) {
        Alert.alert('Error', 'Failed to complete discharge');
      }
    }
  };

  // Complete transfer
  const handleCompleteTransfer = async (transfer: TransferRequest) => {
    if (transfer.status === 'approved') {
      try {
        await bedManagementService.completeTransfer(transfer.id, 'Current User');
        loadData();
      } catch (error) {
        Alert.alert('Error', 'Failed to complete transfer');
      }
    }
  };

  // Calculate total stats
  const totalStats = stats.reduce(
    (acc, s) => ({
      total: acc.total + s.totalBeds,
      occupied: acc.occupied + s.occupied,
      available: acc.available + s.available,
      cleaning: acc.cleaning + s.cleaning,
    }),
    { total: 0, occupied: 0, available: 0, cleaning: 0 }
  );

  // Render unit card
  const renderUnitCard = (unitStats: OccupancyStats) => (
    <TouchableOpacity
      key={unitStats.unitId}
      style={[styles.unitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleSelectUnit(units.find(u => u.id === unitStats.unitId)!)}
    >
      <View style={styles.unitHeader}>
        <Text style={[styles.unitName, { color: colors.foreground }]}>{unitStats.unitName}</Text>
        <View style={[styles.occupancyBadge, { backgroundColor: unitStats.occupancyRate > 90 ? colors.error : unitStats.occupancyRate > 75 ? colors.warning : colors.success }]}>
          <Text style={styles.occupancyText}>{unitStats.occupancyRate}%</Text>
        </View>
      </View>
      
      <View style={styles.unitStats}>
        <View style={styles.unitStat}>
          <Text style={[styles.unitStatValue, { color: colors.success }]}>{unitStats.available}</Text>
          <Text style={[styles.unitStatLabel, { color: colors.muted }]}>Available</Text>
        </View>
        <View style={styles.unitStat}>
          <Text style={[styles.unitStatValue, { color: colors.primary }]}>{unitStats.occupied}</Text>
          <Text style={[styles.unitStatLabel, { color: colors.muted }]}>Occupied</Text>
        </View>
        <View style={styles.unitStat}>
          <Text style={[styles.unitStatValue, { color: '#8B5CF6' }]}>{unitStats.cleaning}</Text>
          <Text style={[styles.unitStatLabel, { color: colors.muted }]}>Cleaning</Text>
        </View>
      </View>

      <View style={[styles.occupancyBar, { backgroundColor: colors.border }]}>
        <View style={[styles.occupancyFill, { width: `${unitStats.occupancyRate}%`, backgroundColor: unitStats.occupancyRate > 90 ? colors.error : unitStats.occupancyRate > 75 ? colors.warning : colors.success }]} />
      </View>
    </TouchableOpacity>
  );

  // Render bed grid
  const renderBedGrid = () => {
    const rooms = new Map<string, Bed[]>();
    beds.forEach(bed => {
      const existing = rooms.get(bed.roomNumber) || [];
      existing.push(bed);
      rooms.set(bed.roomNumber, existing);
    });

    return (
      <View style={styles.bedGrid}>
        {Array.from(rooms.entries()).map(([roomNum, roomBeds]) => (
          <View key={roomNum} style={[styles.roomCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.roomNumber, { color: colors.muted }]}>Room {roomNum}</Text>
            <View style={styles.roomBeds}>
              {roomBeds.map(bed => (
                <TouchableOpacity
                  key={bed.id}
                  style={[
                    styles.bedCell,
                    { backgroundColor: bedManagementService.getStatusColor(bed.status) },
                  ]}
                  onPress={() => {
                    setSelectedBed(bed);
                    if (bed.status === 'cleaning') {
                      handleBedCleaning(bed);
                    }
                  }}
                >
                  <Text style={styles.bedLetter}>{bed.bedNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render admission card
  const renderAdmissionCard = ({ item }: { item: AdmissionRequest }) => (
    <View style={[styles.workflowCard, { backgroundColor: colors.surface, borderColor: bedManagementService.getPriorityColor(item.priority) }]}>
      <View style={styles.workflowHeader}>
        <Text style={[styles.workflowPatient, { color: colors.foreground }]}>{item.patientName}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: bedManagementService.getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.workflowDiagnosis, { color: colors.muted }]}>{item.diagnosis}</Text>
      <Text style={[styles.workflowMeta, { color: colors.muted }]}>
        Status: {item.status} {item.assignedBedId && `• Bed: ${item.assignedBedId}`}
      </Text>
      {item.status === 'assigned' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={() => handleCompleteAdmission(item)}
        >
          <Text style={styles.actionButtonText}>Complete Admission</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render discharge card
  const renderDischargeCard = ({ item }: { item: DischargePlan }) => (
    <View style={[styles.workflowCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
      <View style={styles.workflowHeader}>
        <Text style={[styles.workflowPatient, { color: colors.foreground }]}>{item.patientName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.workflowMeta, { color: colors.muted }]}>
        Bed: {item.bedId} • {item.dischargeType}
      </Text>
      <Text style={[styles.workflowMeta, { color: colors.muted }]}>
        Planned: {new Date(item.plannedDate).toLocaleDateString()}
      </Text>
      {(item.status === 'ready' || item.status === 'in_progress') && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={() => handleCompleteDischarge(item)}
        >
          <Text style={styles.actionButtonText}>Complete Discharge</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render transfer card
  const renderTransferCard = ({ item }: { item: TransferRequest }) => (
    <View style={[styles.workflowCard, { backgroundColor: colors.surface, borderColor: bedManagementService.getPriorityColor(item.priority) }]}>
      <View style={styles.workflowHeader}>
        <Text style={[styles.workflowPatient, { color: colors.foreground }]}>{item.patientName}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: bedManagementService.getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.workflowMeta, { color: colors.muted }]}>
        From: {item.fromBedId} → To: {item.toUnitId}
      </Text>
      <Text style={[styles.workflowMeta, { color: colors.muted }]}>Reason: {item.reason}</Text>
      {item.status === 'approved' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={() => handleCompleteTransfer(item)}
        >
          <Text style={styles.actionButtonText}>Complete Transfer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Bed Management</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Real-time availability dashboard
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totalStats.total}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Beds</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{totalStats.available}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Available</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalStats.occupied}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Occupied</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{totalStats.cleaning}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Cleaning</Text>
            </View>
          </View>
        </View>

        {/* Workflow Buttons */}
        <View style={styles.workflowButtons}>
          <TouchableOpacity
            style={[styles.workflowButton, { backgroundColor: colors.success }]}
            onPress={() => setShowWorkflow('admissions')}
          >
            <Text style={styles.workflowButtonText}>Admissions</Text>
            {pendingAdmissions.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingAdmissions.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.workflowButton, { backgroundColor: colors.warning }]}
            onPress={() => setShowWorkflow('discharges')}
          >
            <Text style={styles.workflowButtonText}>Discharges</Text>
            {pendingDischarges.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingDischarges.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.workflowButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowWorkflow('transfers')}
          >
            <Text style={styles.workflowButtonText}>Transfers</Text>
            {pendingTransfers.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingTransfers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Reserved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Cleaning</Text>
          </View>
        </View>

        {/* Units */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Units</Text>
          {stats.map(renderUnitCard)}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal
        visible={showUnitDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUnitDetail(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {selectedUnit?.name} - Floor {selectedUnit?.floor}
            </Text>
            <TouchableOpacity onPress={() => setShowUnitDetail(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {renderBedGrid()}
          </ScrollView>
        </View>
      </Modal>

      {/* Workflow Modal */}
      <Modal
        visible={showWorkflow !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkflow(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {showWorkflow === 'admissions' && 'Pending Admissions'}
              {showWorkflow === 'discharges' && 'Pending Discharges'}
              {showWorkflow === 'transfers' && 'Pending Transfers'}
            </Text>
            <TouchableOpacity onPress={() => setShowWorkflow(null)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {showWorkflow === 'admissions' && (
              <FlatList
                data={pendingAdmissions}
                keyExtractor={(item) => item.id}
                renderItem={renderAdmissionCard}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No pending admissions</Text>
                }
              />
            )}
            {showWorkflow === 'discharges' && (
              <FlatList
                data={pendingDischarges}
                keyExtractor={(item) => item.id}
                renderItem={renderDischargeCard}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No pending discharges</Text>
                }
              />
            )}
            {showWorkflow === 'transfers' && (
              <FlatList
                data={pendingTransfers}
                keyExtractor={(item) => item.id}
                renderItem={renderTransferCard}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.muted }]}>No pending transfers</Text>
                }
              />
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
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  workflowButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  workflowButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  workflowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  unitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unitName: {
    fontSize: 18,
    fontWeight: '600',
  },
  occupancyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  occupancyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  unitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  unitStat: {
    alignItems: 'center',
  },
  unitStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  unitStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  occupancyBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
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
    flex: 1,
    padding: 16,
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    width: '47%',
  },
  roomNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  roomBeds: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  bedCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bedLetter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workflowCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workflowPatient: {
    fontSize: 16,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  workflowDiagnosis: {
    fontSize: 14,
    marginBottom: 4,
  },
  workflowMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  bottomPadding: {
    height: 100,
  },
});
