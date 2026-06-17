/**
 * Voice Dictation Screen
 * Hands-free clinical documentation with speech-to-text
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  voiceDictationService,
  DictationSession,
  DictationHistoryEntry,
  NoteType,
} from '../services/VoiceDictationService';

export default function VoiceDictationScreen() {
  const colors = useColors();
  const [session, setSession] = useState<DictationSession | null>(null);
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('progress_note');
  const [patientId, setPatientId] = useState('');
  const [history, setHistory] = useState<DictationHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showNoteTypes, setShowNoteTypes] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;

  // Load history
  useEffect(() => {
    setHistory(voiceDictationService.getHistory());
  }, []);

  // Subscribe to session updates
  useEffect(() => {
    const unsubscribe = voiceDictationService.subscribe((updatedSession) => {
      setSession(updatedSession);
      setEditedTranscript(updatedSession.transcript);
    });
    return unsubscribe;
  }, []);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (session?.status === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [session?.status, pulseAnim]);

  // Waveform animation
  useEffect(() => {
    if (session?.status === 'listening') {
      const animations = waveAnims.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 150 + index * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 150 + index * 50,
              useNativeDriver: true,
            }),
          ])
        );
      });
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    }
  }, [session?.status, waveAnims]);

  // Start dictation
  const handleStartDictation = async () => {
    try {
      await voiceDictationService.startDictation(selectedNoteType, patientId || undefined);
      
      // Simulate speech recognition for demo
      simulateSpeechRecognition();
    } catch (error) {
      Alert.alert('Error', 'Failed to start dictation. Please check microphone permissions.');
    }
  };

  // Simulate speech recognition for demo purposes
  const simulateSpeechRecognition = () => {
    const samplePhrases = [
      'Patient presents with',
      'chief complaint of',
      'shortness of breath',
      'and chest pain',
      'for the past two days',
      'period',
      'Vital signs show',
      'bp 130 over 85',
      'hr 88',
      'temp 37.2 degrees',
      'period',
    ];

    let index = 0;
    const interval = setInterval(() => {
      const currentSession = voiceDictationService.getCurrentSession();
      if (!currentSession || currentSession.status !== 'listening' || index >= samplePhrases.length) {
        clearInterval(interval);
        return;
      }

      voiceDictationService.processTranscript(
        samplePhrases[index],
        true,
        0.9 + Math.random() * 0.1
      );
      index++;
    }, 1500);
  };

  // Stop dictation
  const handleStopDictation = async () => {
    const finalSession = await voiceDictationService.stopDictation();
    if (finalSession) {
      setHistory(voiceDictationService.getHistory());
      Alert.alert('Saved', `Note saved with ${finalSession.wordCount} words.`);
    }
  };

  // Pause/Resume dictation
  const handleTogglePause = () => {
    if (session?.status === 'listening') {
      voiceDictationService.pauseDictation();
    } else if (session?.status === 'paused') {
      voiceDictationService.resumeDictation();
      simulateSpeechRecognition();
    }
  };

  // Delete history entry
  const handleDeleteHistory = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this dictation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await voiceDictationService.deleteHistoryEntry(id);
            setHistory(voiceDictationService.getHistory());
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'listening': return colors.success;
      case 'paused': return colors.warning;
      case 'processing': return colors.primary;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  // Render waveform
  const renderWaveform = () => (
    <View style={styles.waveformContainer}>
      {waveAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              backgroundColor: colors.primary,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );

  // Render history item
  const renderHistoryItem = ({ item }: { item: DictationHistoryEntry }) => (
    <TouchableOpacity
      style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        setEditedTranscript(item.transcript);
        setShowHistory(false);
      }}
    >
      <View style={styles.historyHeader}>
        <Text style={[styles.historyType, { color: colors.primary }]}>
          {voiceDictationService.getNoteTypeLabel(item.noteType)}
        </Text>
        <TouchableOpacity onPress={() => handleDeleteHistory(item.id)}>
          <Text style={[styles.deleteButton, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.historyTranscript, { color: colors.foreground }]} numberOfLines={2}>
        {item.transcript || 'Empty dictation'}
      </Text>
      <View style={styles.historyMeta}>
        <Text style={[styles.historyMetaText, { color: colors.muted }]}>
          {item.wordCount} words
        </Text>
        <Text style={[styles.historyMetaText, { color: colors.muted }]}>
          {voiceDictationService.formatDuration(item.duration)}
        </Text>
        <Text style={[styles.historyMetaText, { color: colors.muted }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Voice Dictation
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Hands-free clinical documentation
          </Text>
        </View>

        {/* Note Type Selector */}
        <TouchableOpacity
          style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowNoteTypes(true)}
        >
          <Text style={[styles.selectorLabel, { color: colors.muted }]}>Note Type</Text>
          <Text style={[styles.selectorValue, { color: colors.foreground }]}>
            {voiceDictationService.getNoteTypeLabel(selectedNoteType)}
          </Text>
        </TouchableOpacity>

        {/* Patient ID Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.muted }]}>Patient ID (Optional)</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={patientId}
            onChangeText={setPatientId}
            placeholder="Enter patient ID"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Recording Controls */}
        <View style={[styles.controlsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Status Indicator */}
          {session && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(session.status) }]} />
              <Text style={[styles.statusText, { color: colors.foreground }]}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Text>
              <Text style={[styles.durationText, { color: colors.muted }]}>
                {voiceDictationService.formatDuration(Date.now() - session.startTime)}
              </Text>
            </View>
          )}

          {/* Waveform Visualization */}
          {session?.status === 'listening' && renderWaveform()}

          {/* Main Control Button */}
          <View style={styles.mainControlContainer}>
            {!session || session.status === 'idle' ? (
              <TouchableOpacity
                style={[styles.recordButton, { backgroundColor: colors.error }]}
                onPress={handleStartDictation}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Text style={styles.recordButtonIcon}>🎤</Text>
                </Animated.View>
                <Text style={styles.recordButtonText}>Start Dictation</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeControls}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.warning }]}
                  onPress={handleTogglePause}
                >
                  <Text style={styles.controlButtonIcon}>
                    {session.status === 'paused' ? '▶️' : '⏸️'}
                  </Text>
                  <Text style={styles.controlButtonText}>
                    {session.status === 'paused' ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.success }]}
                  onPress={handleStopDictation}
                >
                  <Text style={styles.controlButtonIcon}>✓</Text>
                  <Text style={styles.controlButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Word Count */}
          {session && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {session.wordCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Words</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {Math.round(session.confidence * 100)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Confidence</Text>
              </View>
            </View>
          )}
        </View>

        {/* Transcript Display */}
        <View style={[styles.transcriptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.transcriptHeader}>
            <Text style={[styles.transcriptTitle, { color: colors.foreground }]}>
              Transcript
            </Text>
            <TouchableOpacity onPress={() => setShowHistory(true)}>
              <Text style={[styles.historyLink, { color: colors.primary }]}>
                History ({history.length})
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.transcriptInput, { color: colors.foreground, borderColor: colors.border }]}
            value={editedTranscript}
            onChangeText={setEditedTranscript}
            placeholder="Transcript will appear here..."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Voice Commands Help */}
        <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.helpTitle, { color: colors.foreground }]}>
            Voice Commands
          </Text>
          <View style={styles.commandsGrid}>
            <View style={styles.commandItem}>
              <Text style={[styles.commandText, { color: colors.primary }]}>"Period"</Text>
              <Text style={[styles.commandDesc, { color: colors.muted }]}>Add .</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={[styles.commandText, { color: colors.primary }]}>"Comma"</Text>
              <Text style={[styles.commandDesc, { color: colors.muted }]}>Add ,</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={[styles.commandText, { color: colors.primary }]}>"New line"</Text>
              <Text style={[styles.commandDesc, { color: colors.muted }]}>Line break</Text>
            </View>
            <View style={styles.commandItem}>
              <Text style={[styles.commandText, { color: colors.primary }]}>"Delete that"</Text>
              <Text style={[styles.commandDesc, { color: colors.muted }]}>Undo last</Text>
            </View>
          </View>
        </View>

        {/* Medical Abbreviations Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>
            Medical Mode Active
          </Text>
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Common medical abbreviations are automatically expanded (e.g., "BP" → "blood pressure", "HR" → "heart rate")
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Note Type Modal */}
      <Modal
        visible={showNoteTypes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNoteTypes(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Note Type
            </Text>
            <TouchableOpacity onPress={() => setShowNoteTypes(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={voiceDictationService.getNoteTypes()}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.noteTypeItem,
                  { borderBottomColor: colors.border },
                  selectedNoteType === item.value && { backgroundColor: colors.primary + '15' }
                ]}
                onPress={() => {
                  setSelectedNoteType(item.value);
                  setShowNoteTypes(false);
                }}
              >
                <Text style={[styles.noteTypeText, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                {selectedNoteType === item.value && (
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
              Dictation History
            </Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No dictations yet
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
  selector: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
  },
  controlsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  durationText: {
    fontSize: 14,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 6,
    marginBottom: 16,
  },
  waveBar: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  mainControlContainer: {
    marginBottom: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
  },
  recordButtonIcon: {
    fontSize: 24,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
  },
  controlButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  transcriptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyLink: {
    fontSize: 14,
  },
  transcriptInput: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  helpCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  commandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  commandItem: {
    width: '45%',
  },
  commandText: {
    fontSize: 13,
    fontWeight: '500',
  },
  commandDesc: {
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
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
  noteTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  noteTypeText: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    fontSize: 14,
  },
  historyTranscript: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  historyMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  historyMetaText: {
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
