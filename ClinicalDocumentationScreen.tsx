/**
 * Clinical Documentation Screen
 * Extreme Disco Styled Documentation Interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  clinicalDocumentationService,
  DocumentTemplate,
  ClinicalDocument,
  TemplateSection,
} from '@/src/services/ClinicalDocumentationService';
import { DISCO_COLORS, getGlowShadow, getNeonTextStyle } from '@/src/theme/DiscoTheme';

type ScreenMode = 'templates' | 'documents' | 'editor';

export default function ClinicalDocumentationScreen() {
  const [mode, setMode] = useState<ScreenMode>('templates');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [activeDocument, setActiveDocument] = useState<ClinicalDocument | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [pulseAnim] = useState(new Animated.Value(1));
  const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);

  const loadData = useCallback(() => {
    setTemplates(clinicalDocumentationService.getTemplates());
    setDocuments(clinicalDocumentationService.getAllDocuments());
  }, []);

  useEffect(() => {
    clinicalDocumentationService.initialize();
    loadData();
    const unsubscribe = clinicalDocumentationService.subscribe(loadData);

    // Pulse animation for disco effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    return unsubscribe;
  }, [loadData, pulseAnim]);

  const handleSelectTemplate = async (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    try {
      const doc = await clinicalDocumentationService.createDocument(
        template.id,
        'PAT-001',
        'Sarah Johnson',
        'PROV-001',
        'Dr. Disco Williams',
        'ENC-001'
      );
      setActiveDocument(doc);
      setSectionContent({});
      setActiveSectionIndex(0);
      setMode('editor');
    } catch (error) {
      Alert.alert('Error', 'Could not create document');
    }
  };

  const handleOpenDocument = (doc: ClinicalDocument) => {
    const template = clinicalDocumentationService.getTemplate(doc.templateId);
    if (template) {
      setSelectedTemplate(template);
      setActiveDocument(doc);
      setSectionContent(doc.content as Record<string, string>);
      setActiveSectionIndex(0);
      setMode('editor');
    }
  };

  const handleSectionChange = async (sectionId: string, content: string) => {
    // Expand smart phrases
    const expanded = clinicalDocumentationService.expandSmartPhrase(content);
    setSectionContent(prev => ({ ...prev, [sectionId]: expanded }));

    if (activeDocument) {
      await clinicalDocumentationService.updateDocumentContent(activeDocument.id, sectionId, expanded);
      setAutoSaveIndicator(true);
      setTimeout(() => setAutoSaveIndicator(false), 1500);
    }
  };

  const handleSignDocument = async () => {
    if (!activeDocument) return;

    try {
      await clinicalDocumentationService.signDocument(activeDocument.id);
      Alert.alert('🎉 Groovy!', 'Document signed successfully!');
      setMode('documents');
      loadData();
    } catch (error) {
      Alert.alert('Missing Fields', (error as Error).message);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return DISCO_COLORS.neonCyan;
      case 'in_progress': return DISCO_COLORS.neonOrange;
      case 'pending_signature': return DISCO_COLORS.neonYellow;
      case 'signed': return DISCO_COLORS.neonGreen;
      case 'amended': return DISCO_COLORS.neonPurple;
      default: return DISCO_COLORS.neonPink;
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTemplates = () => (
    <ScrollView contentContainerStyle={styles.templatesContent}>
      <Text style={styles.sectionHeader}>🪩 Choose Your Template</Text>
      <Text style={styles.sectionSubheader}>Let's document in style!</Text>

      <View style={styles.templateGrid}>
        {templates.map((template, index) => (
          <TouchableOpacity
            key={template.id}
            style={[styles.templateCard, { borderColor: template.discoColor }, getGlowShadow(template.discoColor)]}
            onPress={() => handleSelectTemplate(template)}
          >
            <Text style={styles.templateIcon}>{template.icon}</Text>
            <Text style={[styles.templateName, { color: template.discoColor }]}>{template.name}</Text>
            <Text style={styles.templateDescription}>{template.description}</Text>
            <View style={styles.templateMeta}>
              <Text style={styles.templateTime}>⏱️ ~{template.estimatedTime} min</Text>
              <Text style={styles.templateSections}>📝 {template.sections.length} sections</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderDocuments = () => (
    <FlatList
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.documentsContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📄</Text>
          <Text style={styles.emptyText}>No documents yet</Text>
          <Text style={styles.emptySubtext}>Start documenting with disco flair!</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const completion = clinicalDocumentationService.getDocumentCompletion(item.id);
        return (
          <TouchableOpacity
            style={[styles.documentCard, { borderColor: getStatusColor(item.status) }, getGlowShadow(getStatusColor(item.status), 0.7)]}
            onPress={() => handleOpenDocument(item)}
          >
            <View style={styles.documentHeader}>
              <View>
                <Text style={styles.documentTitle}>{item.templateName}</Text>
                <Text style={styles.documentPatient}>👤 {item.patientName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '40' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Completion Bar */}
            <View style={styles.completionContainer}>
              <View style={styles.completionBar}>
                <View style={[styles.completionFill, { width: `${completion}%`, backgroundColor: getStatusColor(item.status) }]} />
              </View>
              <Text style={styles.completionText}>{completion}%</Text>
            </View>

            <View style={styles.documentFooter}>
              <Text style={styles.documentDate}>📅 {formatDate(item.updatedAt)}</Text>
              <Text style={styles.documentProvider}>👨‍⚕️ {item.providerName}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderEditor = () => {
    if (!selectedTemplate || !activeDocument) return null;

    const currentSection = selectedTemplate.sections[activeSectionIndex];
    const completion = clinicalDocumentationService.getDocumentCompletion(activeDocument.id);

    return (
      <View style={styles.editorContainer}>
        {/* Editor Header */}
        <View style={styles.editorHeader}>
          <TouchableOpacity onPress={() => setMode('templates')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.editorTitleContainer}>
            <Text style={styles.editorTitle}>{selectedTemplate.name}</Text>
            <Text style={styles.editorPatient}>{activeDocument.patientName}</Text>
          </View>
          {autoSaveIndicator && (
            <View style={styles.autoSaveIndicator}>
              <Text style={styles.autoSaveText}>✨ Saved</Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${completion}%`, transform: [{ scaleY: pulseAnim }] },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{completion}% Complete</Text>
        </View>

        {/* Section Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionNav}>
          {selectedTemplate.sections.map((section, index) => {
            const hasContent = sectionContent[section.id]?.trim().length > 0;
            return (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.sectionNavItem,
                  activeSectionIndex === index && styles.sectionNavItemActive,
                  { borderColor: section.discoGlow },
                  activeSectionIndex === index && getGlowShadow(section.discoGlow, 0.5),
                ]}
                onPress={() => setActiveSectionIndex(index)}
              >
                <Text style={styles.sectionNavIcon}>{hasContent ? '✅' : section.required ? '⭐' : '○'}</Text>
                <Text style={[styles.sectionNavText, activeSectionIndex === index && { color: section.discoGlow }]} numberOfLines={1}>
                  {section.title.replace(/^[^\s]+\s/, '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Current Section Editor */}
        <ScrollView style={styles.sectionEditor}>
          <Animated.View style={[styles.sectionCard, { borderColor: currentSection.discoGlow, transform: [{ scale: pulseAnim }] }, getGlowShadow(currentSection.discoGlow)]}>
            <Text style={[styles.sectionTitle, getNeonTextStyle(currentSection.discoGlow)]}>
              {currentSection.title}
            </Text>
            {currentSection.required && (
              <Text style={styles.requiredBadge}>⭐ Required</Text>
            )}

            {currentSection.type === 'text' || currentSection.type === 'assessment' || currentSection.type === 'plan' ? (
              <TextInput
                style={[styles.sectionInput, { borderColor: currentSection.discoGlow }]}
                placeholder={currentSection.placeholder || 'Start typing... Use .shortcuts for smart phrases!'}
                placeholderTextColor="#666"
                multiline
                value={sectionContent[currentSection.id] || ''}
                onChangeText={(text) => handleSectionChange(currentSection.id, text)}
              />
            ) : currentSection.type === 'checklist' && currentSection.options ? (
              <View style={styles.checklistContainer}>
                {currentSection.options.map((option, idx) => {
                  const selected = (sectionContent[currentSection.id] || '').includes(option);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.checklistItem, selected && { backgroundColor: currentSection.discoGlow + '30', borderColor: currentSection.discoGlow }]}
                      onPress={() => {
                        const current = sectionContent[currentSection.id] || '';
                        const newContent = selected
                          ? current.replace(option + ', ', '').replace(option, '')
                          : current + (current ? ', ' : '') + option;
                        handleSectionChange(currentSection.id, newContent);
                      }}
                    >
                      <Text style={[styles.checklistCheck, selected && { color: currentSection.discoGlow }]}>
                        {selected ? '✓' : '○'}
                      </Text>
                      <Text style={[styles.checklistText, selected && { color: currentSection.discoGlow }]}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : currentSection.type === 'vitals' ? (
              <View style={styles.vitalsGrid}>
                {['BP', 'HR', 'RR', 'Temp', 'SpO2', 'Weight'].map((vital, idx) => (
                  <View key={idx} style={styles.vitalInput}>
                    <Text style={styles.vitalLabel}>{vital}</Text>
                    <TextInput
                      style={[styles.vitalField, { borderColor: currentSection.discoGlow }]}
                      placeholder="--"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>
                ))}
              </View>
            ) : currentSection.type === 'signature' ? (
              <View style={styles.signatureContainer}>
                <Text style={styles.signatureLabel}>Electronic Signature</Text>
                <View style={[styles.signatureBox, { borderColor: DISCO_COLORS.gold }]}>
                  <Text style={styles.signatureName}>{activeDocument.providerName}</Text>
                  <Text style={styles.signatureDate}>{new Date().toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.signButton, getGlowShadow(DISCO_COLORS.neonGreen)]}
                  onPress={handleSignDocument}
                >
                  <Text style={styles.signButtonText}>✍️ Sign Document</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Smart Phrases Hint */}
            <View style={styles.smartPhrasesHint}>
              <Text style={styles.hintTitle}>💡 Smart Phrases</Text>
              <Text style={styles.hintText}>.nka → No known allergies</Text>
              <Text style={styles.hintText}>.aox3 → Alert and oriented x3</Text>
              <Text style={styles.hintText}>.disco → 🪩 Disco mode!</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, activeSectionIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
            disabled={activeSectionIndex === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeSectionIndex === selectedTemplate.sections.length - 1 && styles.navButtonDisabled]}
            onPress={() => setActiveSectionIndex(Math.min(selectedTemplate.sections.length - 1, activeSectionIndex + 1))}
            disabled={activeSectionIndex === selectedTemplate.sections.length - 1}
          >
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📝</Text>
        <Text style={styles.headerTitle}>Clinical Documentation</Text>
        <Text style={styles.headerSubtitle}>Disco Documentation Edition</Text>
      </View>

      {/* Tab Bar */}
      {mode !== 'editor' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, mode === 'templates' && styles.activeTab]}
            onPress={() => setMode('templates')}
          >
            <Text style={styles.tabIcon}>📋</Text>
            <Text style={[styles.tabLabel, mode === 'templates' && styles.activeTabLabel]}>Templates</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'documents' && styles.activeTab]}
            onPress={() => setMode('documents')}
          >
            <Text style={styles.tabIcon}>📄</Text>
            <Text style={[styles.tabLabel, mode === 'documents' && styles.activeTabLabel]}>Documents</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {mode === 'templates' && renderTemplates()}
      {mode === 'documents' && renderDocuments()}
      {mode === 'editor' && renderEditor()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, textShadowColor: DISCO_COLORS.neonCyan, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  headerSubtitle: { fontSize: 11, color: DISCO_COLORS.neonPink, letterSpacing: 3, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonCyan + '40' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: DISCO_COLORS.neonCyan },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  activeTabLabel: { color: DISCO_COLORS.neonCyan },
  templatesContent: { padding: 16, paddingBottom: 100 },
  sectionHeader: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  sectionSubheader: { fontSize: 14, color: DISCO_COLORS.neonPink, textAlign: 'center', marginBottom: 24 },
  templateGrid: { gap: 16 },
  templateCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, borderWidth: 2 },
  templateIcon: { fontSize: 40, marginBottom: 12 },
  templateName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  templateDescription: { fontSize: 13, color: '#AAA', marginBottom: 12 },
  templateMeta: { flexDirection: 'row', gap: 16 },
  templateTime: { fontSize: 12, color: '#888' },
  templateSections: { fontSize: 12, color: '#888' },
  documentsContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8 },
  documentCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  documentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  documentTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  documentPatient: { fontSize: 13, color: DISCO_COLORS.neonCyan, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  completionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  completionBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginRight: 12 },
  completionFill: { height: '100%', borderRadius: 4 },
  completionText: { fontSize: 12, color: '#888', width: 40 },
  documentFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  documentDate: { fontSize: 12, color: '#666' },
  documentProvider: { fontSize: 12, color: '#666' },
  editorContainer: { flex: 1 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: DISCO_COLORS.darkDisco, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonPink + '40' },
  backButton: { paddingRight: 12 },
  backButtonText: { color: DISCO_COLORS.neonCyan, fontSize: 14 },
  editorTitleContainer: { flex: 1 },
  editorTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  editorPatient: { fontSize: 12, color: '#888' },
  autoSaveIndicator: { backgroundColor: DISCO_COLORS.neonGreen + '40', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  autoSaveText: { color: DISCO_COLORS.neonGreen, fontSize: 11 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: DISCO_COLORS.midnightPurple },
  progressBar: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, marginRight: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: DISCO_COLORS.neonPink, borderRadius: 5 },
  progressText: { fontSize: 12, color: DISCO_COLORS.neonPink, width: 80 },
  sectionNav: { maxHeight: 60, backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, paddingHorizontal: 8 },
  sectionNavItem: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center' },
  sectionNavItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionNavIcon: { fontSize: 12, marginRight: 6 },
  sectionNavText: { fontSize: 11, color: '#888', maxWidth: 80 },
  sectionEditor: { flex: 1, padding: 16 },
  sectionCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, borderWidth: 2, marginBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  requiredBadge: { fontSize: 11, color: DISCO_COLORS.neonOrange, marginBottom: 16 },
  sectionInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 2, borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 15, minHeight: 150, textAlignVertical: 'top' },
  checklistContainer: { gap: 8 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  checklistCheck: { fontSize: 18, marginRight: 12, color: '#666' },
  checklistText: { fontSize: 14, color: '#AAA' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vitalInput: { width: '30%' },
  vitalLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  vitalField: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 2, borderRadius: 8, padding: 10, color: '#FFFFFF', textAlign: 'center' },
  signatureContainer: { alignItems: 'center', paddingVertical: 20 },
  signatureLabel: { fontSize: 14, color: '#888', marginBottom: 16 },
  signatureBox: { borderWidth: 2, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20, width: '100%' },
  signatureName: { fontSize: 24, fontWeight: 'bold', color: DISCO_COLORS.gold, fontStyle: 'italic' },
  signatureDate: { fontSize: 12, color: '#888', marginTop: 8 },
  signButton: { backgroundColor: DISCO_COLORS.neonGreen, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  signButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  smartPhrasesHint: { marginTop: 20, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  hintTitle: { fontSize: 12, color: DISCO_COLORS.neonPink, marginBottom: 8 },
  hintText: { fontSize: 11, color: '#666', marginBottom: 4 },
  navButtons: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: DISCO_COLORS.darkDisco },
  navButton: { flex: 1, backgroundColor: DISCO_COLORS.neonPink, paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  navButtonDisabled: { backgroundColor: '#333' },
  navButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});
