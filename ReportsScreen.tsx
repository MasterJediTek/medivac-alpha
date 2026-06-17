/**
 * Reports Screen
 * Generate, preview, and export custom reports
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  reportService,
  ReportTemplate,
  GeneratedReport,
  ReportType,
  PatientSummaryData,
  ShiftHandoverData,
  ComplianceAuditData,
} from '../services/ReportService';

export default function ReportsScreen() {
  const colors = useColors();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'reports'>('templates');

  // Load data
  const loadData = useCallback(() => {
    setTemplates(reportService.getTemplates());
    setReports(reportService.getReports());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  // Generate sample data for demo
  const generateSampleData = (type: ReportType): any => {
    switch (type) {
      case 'patient_summary':
        return {
          patient: {
            id: 'P-001',
            name: 'John Smith',
            dob: '1985-03-15',
            mrn: 'MRN-2024-001',
            gender: 'Male',
            bloodType: 'O+',
            allergies: ['Penicillin', 'Sulfa drugs'],
          },
          admissionInfo: {
            admitDate: '2024-01-20',
            ward: 'Medical Ward A',
            room: '101-A',
            attendingPhysician: 'Dr. Sarah Johnson',
            diagnosis: ['Type 2 Diabetes', 'Hypertension', 'Pneumonia'],
          },
          vitals: [
            { date: '2024-01-22 08:00', bloodPressure: '130/85', heartRate: 78, temperature: 37.2, respiratoryRate: 18, oxygenSaturation: 96 },
            { date: '2024-01-22 12:00', bloodPressure: '128/82', heartRate: 75, temperature: 37.0, respiratoryRate: 16, oxygenSaturation: 97 },
            { date: '2024-01-22 18:00', bloodPressure: '125/80', heartRate: 72, temperature: 36.8, respiratoryRate: 16, oxygenSaturation: 98 },
          ],
          medications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'BID', route: 'PO', startDate: '2024-01-20' },
            { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily', route: 'PO', startDate: '2024-01-20' },
            { name: 'Azithromycin', dosage: '500mg', frequency: 'Daily', route: 'IV', startDate: '2024-01-20' },
          ],
          labResults: [
            { test: 'Blood Glucose', result: '145', unit: 'mg/dL', reference: '70-100', date: '2024-01-22', status: 'abnormal' as const },
            { test: 'HbA1c', result: '7.2', unit: '%', reference: '<5.7', date: '2024-01-22', status: 'abnormal' as const },
            { test: 'WBC', result: '12.5', unit: 'K/uL', reference: '4.5-11.0', date: '2024-01-22', status: 'abnormal' as const },
            { test: 'Creatinine', result: '1.0', unit: 'mg/dL', reference: '0.7-1.3', date: '2024-01-22', status: 'normal' as const },
          ],
          notes: [
            { date: '2024-01-22 09:00', author: 'Dr. Johnson', content: 'Patient responding well to antibiotic therapy. Fever resolved.' },
            { date: '2024-01-22 14:00', author: 'RN Williams', content: 'Patient ambulated in hallway. No shortness of breath noted.' },
          ],
        } as PatientSummaryData;

      case 'shift_handover':
        return {
          shift: {
            date: new Date().toLocaleDateString(),
            shiftType: 'day' as const,
            ward: 'Medical Ward A',
            outgoingStaff: 'RN Mary Williams',
            incomingStaff: 'RN James Brown',
          },
          patients: [
            { room: '101-A', name: 'John Smith', diagnosis: 'Pneumonia', status: 'improving' as const, keyUpdates: 'Fever resolved, continue antibiotics', pendingTasks: ['Blood glucose check at 18:00', 'PT evaluation'] },
            { room: '101-B', name: 'Jane Doe', diagnosis: 'CHF Exacerbation', status: 'stable' as const, keyUpdates: 'Diuresis ongoing, weight down 2kg', pendingTasks: ['Daily weight', 'I/O monitoring'] },
            { room: '102-A', name: 'Robert Johnson', diagnosis: 'Post-op Hip Replacement', status: 'stable' as const, keyUpdates: 'Pain controlled, ambulated with PT', pendingTasks: ['PT session at 14:00', 'DVT prophylaxis'] },
            { room: '102-B', name: 'Emily Davis', diagnosis: 'COPD Exacerbation', status: 'declining' as const, keyUpdates: 'Increased O2 requirement, MD notified', pendingTasks: ['ABG at 16:00', 'Respiratory therapy'] },
          ],
          incidents: [
            { time: '10:30', description: 'Patient in 102-B had desaturation episode', actionTaken: 'Increased O2 to 4L NC, MD notified, ABG ordered' },
          ],
          equipmentIssues: ['Bed alarm in 101-B intermittently malfunctioning'],
          generalNotes: 'Pharmacy delayed on afternoon medication delivery. All critical meds administered on time.',
        } as ShiftHandoverData;

      case 'compliance_audit':
        return {
          audit: {
            id: 'AUD-2024-001',
            date: new Date().toLocaleDateString(),
            auditor: 'Quality Assurance Team',
            department: 'Medical Ward A',
            auditType: 'Quarterly Compliance Review',
          },
          categories: [
            {
              name: 'Hand Hygiene',
              items: [
                { requirement: 'Hand sanitizer available at all entry points', status: 'compliant' as const },
                { requirement: 'Staff observed performing hand hygiene before patient contact', status: 'partial' as const, notes: '85% compliance observed' },
                { requirement: 'Hand hygiene signage visible', status: 'compliant' as const },
              ],
              score: 90,
            },
            {
              name: 'Medication Safety',
              items: [
                { requirement: 'Two-patient identifier verification', status: 'compliant' as const },
                { requirement: 'High-alert medications properly labeled', status: 'compliant' as const },
                { requirement: 'Medication reconciliation completed', status: 'partial' as const, notes: '2 patients missing reconciliation' },
              ],
              score: 85,
            },
            {
              name: 'Documentation',
              items: [
                { requirement: 'Nursing assessments completed within 24 hours', status: 'compliant' as const },
                { requirement: 'Care plans updated', status: 'non_compliant' as const, notes: '3 care plans outdated' },
                { requirement: 'Discharge planning documented', status: 'compliant' as const },
              ],
              score: 75,
            },
          ],
          overallScore: 83,
          findings: [
            { severity: 'major' as const, description: 'Care plans not updated for 3 patients', recommendation: 'Implement daily care plan review process', dueDate: '2024-02-15' },
            { severity: 'minor' as const, description: 'Hand hygiene compliance below 90% target', recommendation: 'Conduct hand hygiene awareness campaign', dueDate: '2024-02-28' },
            { severity: 'observation' as const, description: 'Medication reconciliation timing could be improved', recommendation: 'Consider pharmacy-led reconciliation pilot' },
          ],
          signatures: [
            { role: 'Auditor', name: 'Sarah Thompson, RN', date: new Date().toLocaleDateString(), signed: true },
            { role: 'Unit Manager', name: 'Michael Chen, RN', date: new Date().toLocaleDateString(), signed: false },
            { role: 'Quality Director', name: 'Dr. Lisa Wong', date: '', signed: false },
          ],
        } as ComplianceAuditData;

      default:
        return {};
    }
  };

  // Generate report
  const handleGenerateReport = async (template: ReportTemplate) => {
    setGenerating(true);
    try {
      const data = generateSampleData(template.type);
      const report = await reportService.generateReport(template.id, data, 'Current User');
      loadData();
      setPreviewReport(report);
      Alert.alert('Success', 'Report generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // Export report
  const handleExportReport = async (report: GeneratedReport) => {
    try {
      await reportService.exportReport(report.id, 'pdf', 'Current User');
      Alert.alert('Exported', 'Report has been exported successfully');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  // Delete report
  const handleDeleteReport = (report: GeneratedReport) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            reportService.deleteReport(report.id);
            loadData();
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get report type icon
  const getReportIcon = (type: ReportType): string => {
    switch (type) {
      case 'patient_summary': return '👤';
      case 'shift_handover': return '🔄';
      case 'compliance_audit': return '✅';
      case 'medication_report': return '💊';
      case 'lab_results': return '🔬';
      case 'incident_report': return '⚠️';
      case 'financial_summary': return '💰';
      case 'staff_roster': return '👥';
      case 'inventory_report': return '📦';
      case 'jedi_status': return '🌟';
      default: return '📄';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ready': return colors.success;
      case 'generating': return colors.warning;
      case 'exported': return colors.primary;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Reports
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Generate and export custom reports
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'templates' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('templates')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'templates' ? '#fff' : colors.foreground }
            ]}>
              Templates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'reports' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'reports' ? '#fff' : colors.foreground }
            ]}>
              Generated ({reports.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Available Templates
            </Text>
            
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setSelectedTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateIcon}>{getReportIcon(template.type)}</Text>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.foreground }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateType, { color: colors.muted }]}>
                      {template.type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.templateDescription, { color: colors.muted }]}>
                  {template.description}
                </Text>
                <View style={styles.templateMeta}>
                  <Text style={[styles.templateMetaText, { color: colors.muted }]}>
                    {template.sections.filter(s => s.visible).length} sections
                  </Text>
                  <Text style={[styles.templateMetaText, { color: colors.muted }]}>
                    {template.styling.pageSize} • {template.styling.orientation}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.generateButton, { backgroundColor: colors.primary, opacity: generating ? 0.7 : 1 }]}
                  onPress={() => handleGenerateReport(template)}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.generateButtonText}>Generate Report</Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Generated Reports
            </Text>
            
            {reports.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No reports generated yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                  Select a template to generate your first report
                </Text>
              </View>
            ) : (
              reports.map((report) => (
                <View
                  key={report.id}
                  style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportIcon}>{getReportIcon(report.type)}</Text>
                    <View style={styles.reportInfo}>
                      <Text style={[styles.reportTitle, { color: colors.foreground }]}>
                        {report.title}
                      </Text>
                      <Text style={[styles.reportDate, { color: colors.muted }]}>
                        {formatDate(report.generatedAt)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                        {report.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reportMeta}>
                    <Text style={[styles.reportMetaText, { color: colors.muted }]}>
                      {report.pageCount || 1} page{(report.pageCount || 1) > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.reportMetaText, { color: colors.muted }]}>
                      {report.exportHistory.length} export{report.exportHistory.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => setPreviewReport(report)}
                    >
                      <Text style={styles.actionButtonText}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.success }]}
                      onPress={() => handleExportReport(report)}
                    >
                      <Text style={styles.actionButtonText}>Export PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.error }]}
                      onPress={() => handleDeleteReport(report)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={!!previewReport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewReport(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Report Preview
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={() => setPreviewReport(null)}
            >
              <Text style={[styles.closeButtonText, { color: colors.foreground }]}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.previewContent}>
            {previewReport?.htmlContent && (
              <View style={[styles.htmlPreview, { backgroundColor: '#fff' }]}>
                <Text style={styles.previewNote}>
                  HTML Preview (PDF export available)
                </Text>
                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>{previewReport.title}</Text>
                  <Text style={styles.previewMeta}>
                    Generated: {formatDate(previewReport.generatedAt)}
                  </Text>
                  <Text style={styles.previewMeta}>
                    Type: {previewReport.type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.previewMeta}>
                    Pages: {previewReport.pageCount || 1}
                  </Text>
                  
                  <View style={styles.previewDivider} />
                  
                  <Text style={styles.previewSectionTitle}>Report Sections:</Text>
                  {reportService.getTemplate(previewReport.templateId)?.sections
                    .filter(s => s.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                      <Text key={section.id} style={styles.previewSection}>
                        {index + 1}. {section.title}
                      </Text>
                    ))
                  }
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (previewReport) {
                  handleExportReport(previewReport);
                }
              }}
            >
              <Text style={styles.footerButtonText}>Export as PDF</Text>
            </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  templateCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateType: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateMetaText: {
    fontSize: 12,
  },
  generateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  reportCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  reportMetaText: {
    fontSize: 12,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontWeight: '500',
  },
  previewContent: {
    flex: 1,
    padding: 16,
  },
  htmlPreview: {
    borderRadius: 8,
    padding: 16,
    minHeight: 400,
  },
  previewNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewBox: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8,
  },
  previewMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
  previewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewSection: {
    fontSize: 13,
    color: '#333',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomPadding: {
    height: 100,
  },
});
