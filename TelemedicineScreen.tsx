/**
 * Telemedicine Video Consultation Screen
 * Video calling interface with controls and documentation
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
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  telemedicineService,
  ConsultationSession,
  WaitingRoomEntry,
  TelemedicineDashboard,
  VirtualExamTool,
  ConnectionStats,
} from '@/src/services/TelemedicineService';

type ViewMode = 'dashboard' | 'waiting' | 'active' | 'history';

export default function TelemedicineScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [dashboard, setDashboard] = useState<TelemedicineDashboard | null>(null);
  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomEntry[]>([]);
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [examTools, setExamTools] = useState<VirtualExamTool[]>([]);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [chatText, setChatText] = useState('');

  const loadData = useCallback(() => {
    setDashboard(telemedicineService.getDashboard());
    setWaitingRoom(telemedicineService.getWaitingRoom());
    setActiveSession(telemedicineService.getActiveSession());
    setSessions(telemedicineService.getAllSessions());
    setExamTools(telemedicineService.getVirtualExamTools());
    setConnectionStats(telemedicineService.getConnectionStats());
  }, []);

  useEffect(() => {
    telemedicineService.initialize();
    loadData();
    const unsubscribe = telemedicineService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    telemedicineService.checkConnectionQuality();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleStartConsultation = async (entry: WaitingRoomEntry) => {
    try {
      const session = await telemedicineService.startFromWaitingRoom(
        entry.id,
        'PROV-001',
        'Dr. Smith'
      );
      await telemedicineService.joinSession(session.id, 'PROV-001', 'Dr. Smith', 'provider');
      await telemedicineService.joinSession(session.id, entry.patientId, entry.patientName, 'patient');
      await telemedicineService.startConsultation(session.id);
      setViewMode('active');
    } catch (error) {
      Alert.alert('Error', 'Failed to start consultation');
    }
  };

  const handleEndConsultation = async () => {
    if (!activeSession) return;

    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            await telemedicineService.endConsultation(activeSession.id);
            setViewMode('dashboard');
          },
        },
      ]
    );
  };

  const handleAddNote = async () => {
    if (!activeSession || !noteText.trim()) return;
    await telemedicineService.addNote(activeSession.id, 'PROV-001', 'Dr. Smith', noteText, 'general');
    setNoteText('');
  };

  const handleSendChat = async () => {
    if (!activeSession || !chatText.trim()) return;
    await telemedicineService.sendChatMessage(activeSession.id, 'PROV-001', 'Dr. Smith', chatText);
    setChatText('');
  };

  const handleToggleMedia = async (type: 'video' | 'audio') => {
    if (!activeSession) return;
    const provider = activeSession.participants.find(p => p.role === 'provider');
    if (!provider) return;
    await telemedicineService.toggleMedia(activeSession.id, provider.id, type, !provider.mediaState[type]);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return '#22C55E';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderDashboard = () => {
    if (!dashboard) return null;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.dashboardContent}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{dashboard.activeConsultations}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{dashboard.waitingPatients}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Waiting</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{dashboard.todayCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{dashboard.averageWaitTime}m</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Wait</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => setViewMode('waiting')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Waiting Room</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => {
                telemedicineService.addToWaitingRoom(
                  `PAT-${Date.now()}`,
                  'New Patient',
                  'General consultation',
                  undefined,
                  undefined,
                  'normal'
                );
              }}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Add Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setViewMode('history')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming */}
        {dashboard.upcomingScheduled.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming</Text>
            {dashboard.upcomingScheduled.map((session) => (
              <View key={session.id} style={styles.upcomingItem}>
                <View>
                  <Text style={[styles.upcomingPatient, { color: colors.foreground }]}>{session.patientName}</Text>
                  <Text style={[styles.upcomingTime, { color: colors.muted }]}>
                    {session.scheduledStart ? formatTime(session.scheduledStart) : 'Not scheduled'}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.typeText, { color: colors.primary }]}>{session.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent */}
        {dashboard.recentCompleted.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Completed</Text>
            {dashboard.recentCompleted.map((session) => (
              <View key={session.id} style={styles.recentItem}>
                <View>
                  <Text style={[styles.recentPatient, { color: colors.foreground }]}>{session.patientName}</Text>
                  <Text style={[styles.recentDuration, { color: colors.muted }]}>
                    Duration: {formatDuration(session.duration)}
                  </Text>
                </View>
                <Text style={[styles.recentTime, { color: colors.muted }]}>
                  {session.actualEnd ? formatTime(session.actualEnd) : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderWaitingRoom = () => (
    <FlatList
      data={waitingRoom}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.muted }]}>👥</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No patients waiting</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.waitingCard, { backgroundColor: colors.surface }]}>
          <View style={styles.waitingHeader}>
            <View>
              <Text style={[styles.waitingName, { color: colors.foreground }]}>{item.patientName}</Text>
              <Text style={[styles.waitingReason, { color: colors.muted }]}>{item.reason}</Text>
            </View>
            {item.priority === 'urgent' && (
              <View style={[styles.urgentBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          <View style={styles.waitingMeta}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Waiting</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {Math.round((Date.now() - item.joinedWaitingRoom) / 60000)} min
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Est. Wait</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{item.estimatedWait} min</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: '#22C55E' }]}
            onPress={() => handleStartConsultation(item)}
          >
            <Text style={styles.startBtnText}>Start Consultation</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  const renderActiveConsultation = () => {
    if (!activeSession) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.muted }]}>📹</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No active consultation</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('waiting')}
          >
            <Text style={styles.backBtnText}>Go to Waiting Room</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const provider = activeSession.participants.find(p => p.role === 'provider');

    return (
      <ScrollView contentContainerStyle={styles.activeContent}>
        {/* Video Area */}
        <View style={[styles.videoArea, { backgroundColor: '#1a1a1a' }]}>
          <View style={styles.mainVideo}>
            <Text style={styles.videoPlaceholder}>📹 {activeSession.patientName}</Text>
          </View>
          <View style={styles.selfVideo}>
            <Text style={styles.selfVideoText}>You</Text>
          </View>

          {/* Connection Quality */}
          {connectionStats && (
            <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(connectionStats.quality) + '20' }]}>
              <View style={[styles.qualityDot, { backgroundColor: getQualityColor(connectionStats.quality) }]} />
              <Text style={[styles.qualityText, { color: getQualityColor(connectionStats.quality) }]}>
                {connectionStats.quality.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Duration */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(Math.round((Date.now() - (activeSession.actualStart || Date.now())) / 1000))}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, provider?.mediaState.audio ? { backgroundColor: colors.surface } : { backgroundColor: '#EF4444' }]}
            onPress={() => handleToggleMedia('audio')}
          >
            <Text style={styles.controlIcon}>{provider?.mediaState.audio ? '🎤' : '🔇'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, provider?.mediaState.video ? { backgroundColor: colors.surface } : { backgroundColor: '#EF4444' }]}
            onPress={() => handleToggleMedia('video')}
          >
            <Text style={styles.controlIcon}>{provider?.mediaState.video ? '📹' : '📵'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.surface }]}
            onPress={() => telemedicineService.startScreenShare(activeSession.id, 'PROV-001')}
          >
            <Text style={styles.controlIcon}>🖥️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.surface }]}
            onPress={() => telemedicineService.startRecording(activeSession.id)}
          >
            <Text style={styles.controlIcon}>{activeSession.recordingEnabled ? '⏹️' : '⏺️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: '#EF4444' }]}
            onPress={handleEndConsultation}
          >
            <Text style={styles.controlIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        {/* Virtual Exam Tools */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Virtual Exam Tools</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {examTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[styles.examTool, { backgroundColor: colors.background }]}
                onPress={() => Alert.alert(tool.name, tool.instructions.join('\n\n'))}
              >
                <Text style={styles.examIcon}>{tool.icon}</Text>
                <Text style={[styles.examName, { color: colors.foreground }]}>{tool.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clinical Notes</Text>
          <View style={styles.noteInput}>
            <TextInput
              style={[styles.noteTextInput, { color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="Add note..."
              placeholderTextColor={colors.muted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />
            <TouchableOpacity
              style={[styles.addNoteBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddNote}
            >
              <Text style={styles.addNoteBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {activeSession.notes.map((note) => (
            <View key={note.id} style={styles.noteItem}>
              <Text style={[styles.noteContent, { color: colors.foreground }]}>{note.content}</Text>
              <Text style={[styles.noteTime, { color: colors.muted }]}>{formatTime(note.timestamp)}</Text>
            </View>
          ))}
        </View>

        {/* Chat */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chat</Text>
          <View style={styles.chatInput}>
            <TextInput
              style={[styles.chatTextInput, { color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="Type message..."
              placeholderTextColor={colors.muted}
              value={chatText}
              onChangeText={setChatText}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              onPress={handleSendChat}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
          {activeSession.chatMessages.slice(-5).map((msg) => (
            <View key={msg.id} style={styles.chatMessage}>
              <Text style={[styles.chatSender, { color: colors.primary }]}>{msg.senderName}</Text>
              <Text style={[styles.chatContent, { color: colors.foreground }]}>{msg.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderHistory = () => {
    const completedSessions = sessions.filter(s => s.status === 'ended');

    return (
      <FlatList
        data={completedSessions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.muted }]}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No consultation history</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyPatient, { color: colors.foreground }]}>{item.patientName}</Text>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.typeText, { color: colors.primary }]}>{item.type}</Text>
              </View>
            </View>

            <View style={styles.historyMeta}>
              <Text style={[styles.historyDate, { color: colors.muted }]}>
                {item.actualEnd ? new Date(item.actualEnd).toLocaleDateString() : ''}
              </Text>
              <Text style={[styles.historyDuration, { color: colors.muted }]}>
                Duration: {formatDuration(item.duration)}
              </Text>
            </View>

            <View style={styles.historyStats}>
              <View style={styles.historyStat}>
                <Text style={[styles.historyStatValue, { color: colors.foreground }]}>{item.notes.length}</Text>
                <Text style={[styles.historyStatLabel, { color: colors.muted }]}>Notes</Text>
              </View>
              <View style={styles.historyStat}>
                <Text style={[styles.historyStatValue, { color: colors.foreground }]}>{item.prescriptions.length}</Text>
                <Text style={[styles.historyStatLabel, { color: colors.muted }]}>Rx</Text>
              </View>
              <View style={styles.historyStat}>
                <Text style={[styles.historyStatValue, { color: colors.foreground }]}>{item.sharedFiles.length}</Text>
                <Text style={[styles.historyStatLabel, { color: colors.muted }]}>Files</Text>
              </View>
            </View>

            {item.recordingUrl && (
              <TouchableOpacity style={[styles.recordingBtn, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.recordingBtnText, { color: colors.primary }]}>📹 View Recording</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Telemedicine</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Video Consultations</Text>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
        {(['dashboard', 'waiting', 'active', 'history'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.toggleBtn, viewMode === mode && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, { color: viewMode === mode ? '#FFFFFF' : colors.foreground }]}>
              {mode === 'dashboard' ? '📊' : mode === 'waiting' ? '👥' : mode === 'active' ? '📹' : '📋'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'waiting' && renderWaitingRoom()}
      {viewMode === 'active' && renderActiveConsultation()}
      {viewMode === 'history' && renderHistory()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 8, padding: 4, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleText: { fontSize: 18 },
  dashboardContent: { padding: 16, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { padding: 16, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  upcomingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  upcomingPatient: { fontSize: 14, fontWeight: '500' },
  upcomingTime: { fontSize: 12, marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 11, fontWeight: '600' },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  recentPatient: { fontSize: 14, fontWeight: '500' },
  recentDuration: { fontSize: 12, marginTop: 2 },
  recentTime: { fontSize: 12 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16 },
  waitingCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  waitingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  waitingName: { fontSize: 18, fontWeight: '600' },
  waitingReason: { fontSize: 14, marginTop: 4 },
  urgentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  urgentText: { fontSize: 11, fontWeight: '600', color: '#EF4444' },
  waitingMeta: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  metaItem: { gap: 4 },
  metaLabel: { fontSize: 11 },
  metaValue: { fontSize: 14, fontWeight: '500' },
  startBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  activeContent: { padding: 16, paddingBottom: 100 },
  videoArea: { height: 300, borderRadius: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' },
  mainVideo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoPlaceholder: { color: '#FFFFFF', fontSize: 24 },
  selfVideo: { position: 'absolute', top: 16, right: 16, width: 80, height: 100, backgroundColor: '#333', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  selfVideoText: { color: '#FFFFFF', fontSize: 12 },
  qualityBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  qualityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  qualityText: { fontSize: 11, fontWeight: '600' },
  durationBadge: { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  durationText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  controlIcon: { fontSize: 24 },
  examTool: { width: 100, padding: 12, borderRadius: 12, alignItems: 'center', marginRight: 12 },
  examIcon: { fontSize: 28, marginBottom: 8 },
  examName: { fontSize: 11, textAlign: 'center' },
  noteInput: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  noteTextInput: { flex: 1, padding: 12, borderRadius: 8, minHeight: 60 },
  addNoteBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  addNoteBtnText: { color: '#FFFFFF', fontWeight: '600' },
  noteItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  noteContent: { fontSize: 14 },
  noteTime: { fontSize: 11, marginTop: 4 },
  chatInput: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chatTextInput: { flex: 1, padding: 12, borderRadius: 8 },
  sendBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '600' },
  chatMessage: { paddingVertical: 8 },
  chatSender: { fontSize: 12, fontWeight: '600' },
  chatContent: { fontSize: 14, marginTop: 2 },
  historyCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyPatient: { fontSize: 16, fontWeight: '600' },
  historyMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  historyDate: { fontSize: 13 },
  historyDuration: { fontSize: 13 },
  historyStats: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  historyStat: { alignItems: 'center' },
  historyStatValue: { fontSize: 18, fontWeight: '600' },
  historyStatLabel: { fontSize: 11 },
  recordingBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  recordingBtnText: { fontSize: 13, fontWeight: '600' },
});
