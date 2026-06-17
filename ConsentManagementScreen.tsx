/**
 * Consent Management Screen
 * MediVac One v3.2 - Digital Consent with E-Signatures UI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { ConsentManagementService, ConsentType, ConsentForm, ConsentTemplate } from '../services/ConsentManagementService';

// Disco theme colors
const DISCO = {
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  neonPurple: '#9D00FF',
  neonGreen: '#39FF14',
  neonOrange: '#FF6600',
  neonYellow: '#FFFF00',
  darkBg: '#0D0221',
  cardBg: '#1A0A2E',
  glowPink: 'rgba(255, 20, 147, 0.3)',
  glowCyan: 'rgba(0, 255, 255, 0.3)',
};

type TabType = 'new' | 'pending' | 'completed' | 'templates';

export default function ConsentManagementScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientMRN, setPatientMRN] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [consents, setConsents] = useState<ConsentForm[]>([]);
  const [selectedConsent, setSelectedConsent] = useState<ConsentForm | null>(null);
  const [signatureMode, setSignatureMode] = useState(false);

  const templates = ConsentManagementService.getTemplates();
  const stats = ConsentManagementService.getStatistics();

  const consentTypeIcons: Record<ConsentType, string> = {
    general_treatment: '🏥',
    surgical_procedure: '🔪',
    anesthesia: '💉',
    blood_transfusion: '🩸',
    research_study: '🔬',
    photography: '📷',
    data_sharing: '📤',
    hipaa_authorization: '📋',
    advance_directive: '📜',
    against_medical_advice: '⚠️',
  };

  const statusColors: Record<string, string> = {
    pending: DISCO.neonYellow,
    signed: DISCO.neonCyan,
    witnessed: DISCO.neonPurple,
    completed: DISCO.neonGreen,
    expired: '#888',
    withdrawn: DISCO.neonOrange,
    refused: DISCO.neonPink,
  };

  const handleCreateConsent = () => {
    if (!selectedTemplate || !patientName || !patientMRN) return;
    
    const consent = ConsentManagementService.createFromTemplate(selectedTemplate.id, {
      patientId: `PAT-${Date.now()}`,
      patientName,
      patientMRN,
      patientDOB: new Date(1980, 0, 1),
      providerId: 'PROV-001',
      providerName: 'Dr. Smith',
      procedureName: procedureName || undefined,
      language: 'English',
    });
    
    if (consent) {
      setSelectedConsent(consent);
      setSignatureMode(true);
      setPatientName('');
      setPatientMRN('');
      setProcedureName('');
      setSelectedTemplate(null);
    }
  };

  const handleSign = (type: 'patient' | 'witness' | 'provider') => {
    if (!selectedConsent) return;
    
    const signerNames: Record<string, string> = {
      patient: selectedConsent.patientName,
      witness: 'Nurse Johnson',
      provider: selectedConsent.providerName,
    };
    
    ConsentManagementService.addSignature(selectedConsent.id, {
      type,
      signerId: `${type}-001`,
      signerName: signerNames[type],
      signatureData: 'base64-signature-data',
    });
    
    const updated = ConsentManagementService.getConsent(selectedConsent.id);
    if (updated) {
      setSelectedConsent(updated);
      if (updated.status === 'completed') {
        setSignatureMode(false);
        loadConsents();
      }
    }
  };

  const loadConsents = () => {
    const pending = ConsentManagementService.getPendingConsents();
    const all = Array.from(pending);
    setConsents(all);
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'new', label: 'New Consent', icon: '➕' },
        { key: 'pending', label: 'Pending', icon: '⏳', badge: stats.pendingCount },
        { key: 'completed', label: 'Completed', icon: '✅' },
        { key: 'templates', label: 'Templates', icon: '📄' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => {
            setActiveTab(tab.key as TabType);
            if (tab.key === 'pending') loadConsents();
          }}
        >
          <View style={styles.tabContent}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNewConsent = () => (
    <ScrollView style={styles.formContainer}>
      {signatureMode && selectedConsent ? (
        // Signature Collection Mode
        <View>
          <View style={styles.consentHeader}>
            <Text style={styles.consentTitle}>{selectedConsent.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[selectedConsent.status] + '40' }]}>
              <Text style={[styles.statusText, { color: statusColors[selectedConsent.status] }]}>
                {selectedConsent.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.patientInfoCard}>
            <Text style={styles.patientName}>{selectedConsent.patientName}</Text>
            <Text style={styles.patientMRN}>MRN: {selectedConsent.patientMRN}</Text>
          </View>
          
          <View style={styles.consentContent}>
            <Text style={styles.contentText}>{selectedConsent.content}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Risks</Text>
          {selectedConsent.risks.map((risk, i) => (
            <Text key={i} style={styles.listItem}>• {risk}</Text>
          ))}
          
          <Text style={styles.sectionTitle}>Benefits</Text>
          {selectedConsent.benefits.map((benefit, i) => (
            <Text key={i} style={styles.listItem}>• {benefit}</Text>
          ))}
          
          <Text style={styles.sectionTitle}>Signatures Required</Text>
          <View style={styles.signatureSection}>
            {/* Patient Signature */}
            <TouchableOpacity
              style={[
                styles.signatureButton,
                selectedConsent.signatures.some(s => s.type === 'patient') && styles.signatureComplete,
              ]}
              onPress={() => handleSign('patient')}
              disabled={selectedConsent.signatures.some(s => s.type === 'patient')}
            >
              <Text style={styles.signatureIcon}>
                {selectedConsent.signatures.some(s => s.type === 'patient') ? '✅' : '✍️'}
              </Text>
              <Text style={styles.signatureLabel}>Patient Signature</Text>
              {selectedConsent.signatures.some(s => s.type === 'patient') && (
                <Text style={styles.signedText}>Signed</Text>
              )}
            </TouchableOpacity>
            
            {/* Witness Signature */}
            <TouchableOpacity
              style={[
                styles.signatureButton,
                selectedConsent.signatures.some(s => s.type === 'witness') && styles.signatureComplete,
              ]}
              onPress={() => handleSign('witness')}
              disabled={selectedConsent.signatures.some(s => s.type === 'witness')}
            >
              <Text style={styles.signatureIcon}>
                {selectedConsent.signatures.some(s => s.type === 'witness') ? '✅' : '👁️'}
              </Text>
              <Text style={styles.signatureLabel}>Witness Signature</Text>
              {selectedConsent.signatures.some(s => s.type === 'witness') && (
                <Text style={styles.signedText}>Signed</Text>
              )}
            </TouchableOpacity>
            
            {/* Provider Signature */}
            <TouchableOpacity
              style={[
                styles.signatureButton,
                selectedConsent.signatures.some(s => s.type === 'provider') && styles.signatureComplete,
              ]}
              onPress={() => handleSign('provider')}
              disabled={selectedConsent.signatures.some(s => s.type === 'provider')}
            >
              <Text style={styles.signatureIcon}>
                {selectedConsent.signatures.some(s => s.type === 'provider') ? '✅' : '👨‍⚕️'}
              </Text>
              <Text style={styles.signatureLabel}>Provider Signature</Text>
              {selectedConsent.signatures.some(s => s.type === 'provider') && (
                <Text style={styles.signedText}>Signed</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSignatureMode(false);
              setSelectedConsent(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Template Selection Mode
        <View>
          <Text style={styles.sectionTitle}>Select Consent Type</Text>
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate?.id === template.id && styles.templateSelected,
                ]}
                onPress={() => setSelectedTemplate(template)}
              >
                <Text style={styles.templateIcon}>{consentTypeIcons[template.type]}</Text>
                <Text style={styles.templateName}>{template.name}</Text>
                {template.requiresWitness && (
                  <Text style={styles.requiresWitness}>Requires Witness</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {selectedTemplate && (
            <>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Patient Name"
                placeholderTextColor="#666"
                value={patientName}
                onChangeText={setPatientName}
              />
              <TextInput
                style={styles.input}
                placeholder="Medical Record Number (MRN)"
                placeholderTextColor="#666"
                value={patientMRN}
                onChangeText={setPatientMRN}
              />
              {selectedTemplate.type === 'surgical_procedure' && (
                <TextInput
                  style={styles.input}
                  placeholder="Procedure Name"
                  placeholderTextColor="#666"
                  value={procedureName}
                  onChangeText={setProcedureName}
                />
              )}
              
              <TouchableOpacity
                style={[styles.createButton, (!patientName || !patientMRN) && styles.buttonDisabled]}
                onPress={handleCreateConsent}
                disabled={!patientName || !patientMRN}
              >
                <Text style={styles.createButtonText}>Create Consent Form</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderPendingConsents = () => (
    <ScrollView style={styles.listContainer}>
      {consents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No pending consents</Text>
        </View>
      ) : (
        consents.map((consent) => (
          <TouchableOpacity
            key={consent.id}
            style={styles.consentCard}
            onPress={() => {
              setSelectedConsent(consent);
              setSignatureMode(true);
              setActiveTab('new');
            }}
          >
            <View style={styles.consentCardHeader}>
              <Text style={styles.consentCardIcon}>{consentTypeIcons[consent.type]}</Text>
              <View style={styles.consentCardInfo}>
                <Text style={styles.consentCardTitle}>{consent.title}</Text>
                <Text style={styles.consentCardPatient}>{consent.patientName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[consent.status] + '40' }]}>
                <Text style={[styles.statusText, { color: statusColors[consent.status] }]}>
                  {consent.status}
                </Text>
              </View>
            </View>
            <View style={styles.signatureProgress}>
              <Text style={styles.signatureProgressText}>
                {consent.signatures.length} of 3 signatures
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(consent.signatures.length / 3) * 100}%` }]} />
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderTemplates = () => (
    <ScrollView style={styles.listContainer}>
      {templates.map((template) => (
        <View key={template.id} style={styles.templateDetailCard}>
          <View style={styles.templateDetailHeader}>
            <Text style={styles.templateDetailIcon}>{consentTypeIcons[template.type]}</Text>
            <View>
              <Text style={styles.templateDetailName}>{template.name}</Text>
              <Text style={styles.templateDetailType}>{template.type.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.templateDetailTitle}>{template.title}</Text>
          <View style={styles.templateTags}>
            {template.requiresWitness && (
              <View style={[styles.tag, { backgroundColor: DISCO.neonPurple + '40' }]}>
                <Text style={[styles.tagText, { color: DISCO.neonPurple }]}>Witness Required</Text>
              </View>
            )}
            {template.expirationDays && (
              <View style={[styles.tag, { backgroundColor: DISCO.neonOrange + '40' }]}>
                <Text style={[styles.tagText, { color: DISCO.neonOrange }]}>Expires in {template.expirationDays} days</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: DISCO.neonCyan + '40' }]}>
              <Text style={[styles.tagText, { color: DISCO.neonCyan }]}>{template.languages.length} languages</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consent Management</Text>
        <Text style={styles.headerSubtitle}>Digital Consent with E-Signatures</Text>
      </View>
      
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: DISCO.neonYellow }]}>{stats.pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: DISCO.neonOrange }]}>{stats.expiringCount}</Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
      </View>
      
      {renderTabs()}
      
      {activeTab === 'new' && renderNewConsent()}
      {activeTab === 'pending' && renderPendingConsents()}
      {activeTab === 'completed' && renderPendingConsents()}
      {activeTab === 'templates' && renderTemplates()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISCO.darkBg,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: DISCO.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: DISCO.neonCyan,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    textShadowColor: DISCO.glowCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DISCO.neonPink,
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: DISCO.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: DISCO.cardBg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: DISCO.neonCyan,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
  },
  badge: {
    backgroundColor: DISCO.neonPink,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: DISCO.neonCyan,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    marginBottom: 12,
    marginTop: 16,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  templateCard: {
    width: '47%',
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  templateSelected: {
    borderColor: DISCO.neonCyan,
    backgroundColor: DISCO.neonCyan + '20',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 12,
    color: '#FFF',
    textAlign: 'center',
  },
  requiresWitness: {
    fontSize: 10,
    color: DISCO.neonPurple,
    marginTop: 4,
  },
  input: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 10,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  createButton: {
    backgroundColor: DISCO.neonCyan,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: DISCO.darkBg,
    fontSize: 18,
    fontWeight: 'bold',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  patientInfoCard: {
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: DISCO.neonPink,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  patientMRN: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  consentContent: {
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
  },
  listItem: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 8,
    paddingLeft: 8,
  },
  signatureSection: {
    gap: 12,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  signatureComplete: {
    borderColor: DISCO.neonGreen,
    backgroundColor: DISCO.neonGreen + '20',
  },
  signatureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  signatureLabel: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
  },
  signedText: {
    fontSize: 14,
    color: DISCO.neonGreen,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 100,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFF',
  },
  consentCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  consentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  consentCardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  consentCardInfo: {
    flex: 1,
  },
  consentCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  consentCardPatient: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  signatureProgress: {
    marginTop: 8,
  },
  signatureProgressText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DISCO.neonGreen,
    borderRadius: 3,
  },
  templateDetailCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateDetailIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  templateDetailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  templateDetailType: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  templateDetailTitle: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 12,
  },
  templateTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
