/**
 * AI Clinical Notes Summarization Screen
 * SOAP note generation with disco styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  aiSummarizationService,
  ClinicalNote,
  NoteSummary,
  SummaryFormat,
} from '@/src/services/AISummarizationService';
import { DISCO_COLORS, getGlowShadow } from '@/src/theme/DiscoTheme';

type ScreenMode = 'input' | 'processing' | 'result';

export default function AISummarizationScreen() {
  const [mode, setMode] = useState<ScreenMode>('input');
  const [noteText, setNoteText] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<SummaryFormat>('soap');
  const [currentSummary, setCurrentSummary] = useState<NoteSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    aiSummarizationService.initialize();
  }, []);

  const handleGenerateSummary = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter clinical notes to summarize');
      return;
    }

    setMode('processing');
    setIsProcessing(true);

    try {
      // Create note first
      const note = await aiSummarizationService.createNote(
        'PAT-001',
        'DOC-001',
        'Dr. JEDI Master',
        'progress',
        noteText
      );

      // Generate summary
      const summary = await aiSummarizationService.generateSummary({
        noteId: note.id,
        rawText: noteText,
        format: selectedFormat,
      });

      setCurrentSummary(summary);
      setMode('result');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate summary');
      setMode('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setNoteText('');
    setCurrentSummary(null);
    setMode('input');
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return DISCO_COLORS.neonGreen;
    if (confidence >= 0.6) return DISCO_COLORS.neonYellow;
    return DISCO_COLORS.neonOrange;
  };

  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case 'critical': return DISCO_COLORS.neonRed;
      case 'severe': return DISCO_COLORS.neonOrange;
      case 'moderate': return DISCO_COLORS.neonYellow;
      default: return DISCO_COLORS.neonGreen;
    }
  };

  const renderInput = () => (
    <ScrollView contentContainerStyle={styles.inputContent}>
      <View style={[styles.inputCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
        <Text style={styles.inputLabel}>📝 Clinical Notes</Text>
        <Text style={styles.inputHint}>Enter or paste clinical documentation, dictation transcript, or progress notes</Text>
        <TextInput
          style={styles.textInput}
          value={noteText}
          onChangeText={setNoteText}
          placeholder="Patient presents with chest pain radiating to left arm, onset 2 hours ago. BP 145/92, HR 88, SpO2 98%. History of hypertension and diabetes. Currently on Lisinopril 10mg daily..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={12}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formatSection}>
        <Text style={styles.sectionTitle}>📋 Output Format</Text>
        <View style={styles.formatGrid}>
          {(['soap', 'narrative', 'bullet', 'structured'] as SummaryFormat[]).map((format) => (
            <TouchableOpacity
              key={format}
              style={[
                styles.formatButton,
                selectedFormat === format && styles.formatButtonActive,
                selectedFormat === format && getGlowShadow(DISCO_COLORS.neonPink),
              ]}
              onPress={() => setSelectedFormat(format)}
            >
              <Text style={styles.formatIcon}>
                {format === 'soap' ? '🩺' : format === 'narrative' ? '📖' : format === 'bullet' ? '📌' : '📊'}
              </Text>
              <Text style={[styles.formatLabel, selectedFormat === format && styles.formatLabelActive]}>
                {format.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.generateButton, getGlowShadow(DISCO_COLORS.neonGreen)]}
        onPress={handleGenerateSummary}
      >
        <Text style={styles.generateButtonText}>🤖 Generate AI Summary</Text>
      </TouchableOpacity>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>✨ AI Capabilities</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}><Text style={styles.featureIcon}>🔍</Text><Text style={styles.featureText}>Key Findings Extraction</Text></View>
          <View style={styles.featureItem}><Text style={styles.featureIcon}>💊</Text><Text style={styles.featureText}>Medication Detection</Text></View>
          <View style={styles.featureItem}><Text style={styles.featureIcon}>🏥</Text><Text style={styles.featureText}>Diagnosis Suggestions</Text></View>
          <View style={styles.featureItem}><Text style={styles.featureIcon}>📋</Text><Text style={styles.featureText}>SOAP Note Generation</Text></View>
          <View style={styles.featureItem}><Text style={styles.featureIcon}>🌐</Text><Text style={styles.featureText}>Multi-Language Support</Text></View>
          <View style={styles.featureItem}><Text style={styles.featureIcon}>✅</Text><Text style={styles.featureText}>Review Workflow</Text></View>
        </View>
      </View>
    </ScrollView>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={[styles.processingCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
        <ActivityIndicator size="large" color={DISCO_COLORS.neonCyan} />
        <Text style={styles.processingTitle}>🤖 AI Processing</Text>
        <Text style={styles.processingText}>Analyzing clinical notes...</Text>
        <View style={styles.processingSteps}>
          <Text style={styles.stepText}>✓ Extracting key findings</Text>
          <Text style={styles.stepText}>✓ Identifying medications</Text>
          <Text style={styles.stepText}>✓ Generating diagnoses</Text>
          <Text style={[styles.stepText, { color: DISCO_COLORS.neonCyan }]}>⟳ Creating SOAP note...</Text>
        </View>
      </View>
    </View>
  );

  const renderResult = () => {
    if (!currentSummary) return null;

    return (
      <ScrollView contentContainerStyle={styles.resultContent}>
        {/* Confidence Score */}
        <View style={[styles.confidenceCard, getGlowShadow(getConfidenceColor(currentSummary.confidence))]}>
          <Text style={styles.confidenceLabel}>AI Confidence Score</Text>
          <Text style={[styles.confidenceValue, { color: getConfidenceColor(currentSummary.confidence) }]}>
            {Math.round(currentSummary.confidence * 100)}%
          </Text>
        </View>

        {/* SOAP Note */}
        {currentSummary.soapNote && (
          <View style={[styles.soapCard, getGlowShadow(DISCO_COLORS.neonPink)]}>
            <Text style={styles.cardTitle}>🩺 SOAP Note</Text>
            
            <View style={styles.soapSection}>
              <View style={[styles.soapLabel, { backgroundColor: DISCO_COLORS.neonBlue + '40' }]}>
                <Text style={[styles.soapLabelText, { color: DISCO_COLORS.neonBlue }]}>S</Text>
              </View>
              <View style={styles.soapContent}>
                <Text style={styles.soapHeading}>Subjective</Text>
                <Text style={styles.soapText}>{currentSummary.soapNote.subjective}</Text>
              </View>
            </View>

            <View style={styles.soapSection}>
              <View style={[styles.soapLabel, { backgroundColor: DISCO_COLORS.neonGreen + '40' }]}>
                <Text style={[styles.soapLabelText, { color: DISCO_COLORS.neonGreen }]}>O</Text>
              </View>
              <View style={styles.soapContent}>
                <Text style={styles.soapHeading}>Objective</Text>
                <Text style={styles.soapText}>{currentSummary.soapNote.objective}</Text>
              </View>
            </View>

            <View style={styles.soapSection}>
              <View style={[styles.soapLabel, { backgroundColor: DISCO_COLORS.neonYellow + '40' }]}>
                <Text style={[styles.soapLabelText, { color: DISCO_COLORS.neonYellow }]}>A</Text>
              </View>
              <View style={styles.soapContent}>
                <Text style={styles.soapHeading}>Assessment</Text>
                <Text style={styles.soapText}>{currentSummary.soapNote.assessment}</Text>
              </View>
            </View>

            <View style={styles.soapSection}>
              <View style={[styles.soapLabel, { backgroundColor: DISCO_COLORS.neonPurple + '40' }]}>
                <Text style={[styles.soapLabelText, { color: DISCO_COLORS.neonPurple }]}>P</Text>
              </View>
              <View style={styles.soapContent}>
                <Text style={styles.soapHeading}>Plan</Text>
                <Text style={styles.soapText}>{currentSummary.soapNote.plan}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Key Findings */}
        {currentSummary.keyFindings.length > 0 && (
          <View style={[styles.findingsCard, getGlowShadow(DISCO_COLORS.neonCyan)]}>
            <Text style={styles.cardTitle}>🔍 Key Findings ({currentSummary.keyFindings.length})</Text>
            {currentSummary.keyFindings.map((finding) => (
              <View key={finding.id} style={styles.findingItem}>
                <View style={[styles.findingBadge, { backgroundColor: getSeverityColor(finding.severity) + '40' }]}>
                  <Text style={[styles.findingCategory, { color: getSeverityColor(finding.severity) }]}>
                    {finding.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.findingText}>{finding.text}</Text>
                {finding.value && <Text style={styles.findingValue}>{finding.value}{finding.unit}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Diagnosis Suggestions */}
        {currentSummary.diagnosisSuggestions.length > 0 && (
          <View style={[styles.diagnosisCard, getGlowShadow(DISCO_COLORS.neonOrange)]}>
            <Text style={styles.cardTitle}>🏥 Diagnosis Suggestions</Text>
            {currentSummary.diagnosisSuggestions.map((dx) => (
              <View key={dx.id} style={styles.diagnosisItem}>
                <View style={styles.diagnosisHeader}>
                  <Text style={styles.icdCode}>{dx.icdCode}</Text>
                  <Text style={styles.diagnosisName}>{dx.name}</Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(dx.confidence) + '40' }]}>
                    <Text style={[styles.confidenceBadgeText, { color: getConfidenceColor(dx.confidence) }]}>
                      {Math.round(dx.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                {dx.differentials.length > 0 && (
                  <Text style={styles.differentials}>Differentials: {dx.differentials.slice(0, 3).join(', ')}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Medications */}
        {currentSummary.medications.length > 0 && (
          <View style={[styles.medsCard, getGlowShadow(DISCO_COLORS.neonGreen)]}>
            <Text style={styles.cardTitle}>💊 Medications Detected</Text>
            {currentSummary.medications.map((med) => (
              <View key={med.id} style={styles.medItem}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDetails}>{med.dosage} {med.route} {med.frequency}</Text>
                {!med.verified && <Text style={styles.medUnverified}>⚠️ Needs verification</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Follow-up Recommendations */}
        {currentSummary.followUpRecommendations.length > 0 && (
          <View style={[styles.followUpCard, getGlowShadow(DISCO_COLORS.neonPurple)]}>
            <Text style={styles.cardTitle}>📋 Follow-up Recommendations</Text>
            {currentSummary.followUpRecommendations.map((rec, idx) => (
              <View key={idx} style={styles.recItem}>
                <Text style={styles.recBullet}>•</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: DISCO_COLORS.neonGreen }]} onPress={() => Alert.alert('Approved!', 'Summary has been approved and saved.')}>
            <Text style={styles.actionButtonText}>✓ Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: DISCO_COLORS.neonCyan }]} onPress={handleReset}>
            <Text style={styles.actionButtonText}>🔄 New Summary</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🤖</Text>
        <Text style={styles.headerTitle}>AI Clinical Summarization</Text>
        <Text style={styles.headerSubtitle}>SOAP Notes • Key Findings • Diagnosis</Text>
      </View>

      {/* Content */}
      {mode === 'input' && renderInput()}
      {mode === 'processing' && renderProcessing()}
      {mode === 'result' && renderResult()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  headerSubtitle: { fontSize: 11, color: DISCO_COLORS.neonCyan, letterSpacing: 2, marginTop: 4 },
  inputContent: { padding: 16, paddingBottom: 100 },
  inputCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  inputLabel: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  inputHint: { fontSize: 12, color: '#888', marginBottom: 12 },
  textInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 14, minHeight: 200, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  formatSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  formatGrid: { flexDirection: 'row', gap: 10 },
  formatButton: { flex: 1, backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  formatButtonActive: { borderColor: DISCO_COLORS.neonPink, borderWidth: 2 },
  formatIcon: { fontSize: 24, marginBottom: 4 },
  formatLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  formatLabelActive: { color: DISCO_COLORS.neonPink },
  generateButton: { backgroundColor: DISCO_COLORS.neonGreen, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 24 },
  generateButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  featuresSection: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16 },
  featuresTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  featuresList: { gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 18 },
  featureText: { fontSize: 14, color: '#CCC' },
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  processingCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  processingTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 20 },
  processingText: { fontSize: 14, color: '#888', marginTop: 8 },
  processingSteps: { marginTop: 24, gap: 8 },
  stepText: { fontSize: 14, color: DISCO_COLORS.neonGreen },
  resultContent: { padding: 16, paddingBottom: 100 },
  confidenceCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  confidenceLabel: { fontSize: 12, color: '#888' },
  confidenceValue: { fontSize: 48, fontWeight: '900' },
  soapCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  soapSection: { flexDirection: 'row', marginBottom: 16 },
  soapLabel: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  soapLabelText: { fontSize: 18, fontWeight: 'bold' },
  soapContent: { flex: 1 },
  soapHeading: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  soapText: { fontSize: 13, color: '#CCC', lineHeight: 20 },
  findingsCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  findingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  findingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  findingCategory: { fontSize: 9, fontWeight: 'bold' },
  findingText: { flex: 1, fontSize: 14, color: '#FFFFFF' },
  findingValue: { fontSize: 14, color: DISCO_COLORS.neonCyan, fontWeight: 'bold' },
  diagnosisCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonOrange },
  diagnosisItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  diagnosisHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icdCode: { fontSize: 12, color: DISCO_COLORS.neonOrange, fontWeight: 'bold', backgroundColor: DISCO_COLORS.neonOrange + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diagnosisName: { flex: 1, fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  confidenceBadgeText: { fontSize: 11, fontWeight: 'bold' },
  differentials: { fontSize: 11, color: '#888', marginTop: 6 },
  medsCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonGreen },
  medItem: { marginBottom: 10 },
  medName: { fontSize: 15, color: '#FFFFFF', fontWeight: 'bold' },
  medDetails: { fontSize: 13, color: DISCO_COLORS.neonGreen },
  medUnverified: { fontSize: 11, color: DISCO_COLORS.neonOrange, marginTop: 2 },
  followUpCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonPurple },
  recItem: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  recBullet: { fontSize: 14, color: DISCO_COLORS.neonPurple },
  recText: { flex: 1, fontSize: 14, color: '#CCC' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
