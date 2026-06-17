/**
 * Incident Reporting Screen
 * MediVac One v3.2 - Safety Event Management UI
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
import { IncidentReportingService, IncidentCategory, IncidentSeverity, IncidentReport } from '../services/IncidentReportingService';

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

type TabType = 'report' | 'list' | 'analytics' | 'trends';

export default function IncidentReportingScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory>('other');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>('minor');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState('');
  const [immediateActions, setImmediateActions] = useState('');
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  const categories: { value: IncidentCategory; label: string; icon: string }[] = [
    { value: 'fall', label: 'Fall', icon: '🚶' },
    { value: 'medication_error', label: 'Medication Error', icon: '💊' },
    { value: 'near_miss', label: 'Near Miss', icon: '⚠️' },
    { value: 'adverse_event', label: 'Adverse Event', icon: '🏥' },
    { value: 'equipment_failure', label: 'Equipment Failure', icon: '🔧' },
    { value: 'security_breach', label: 'Security Breach', icon: '🔒' },
    { value: 'patient_complaint', label: 'Patient Complaint', icon: '📝' },
    { value: 'staff_injury', label: 'Staff Injury', icon: '🩹' },
    { value: 'infection', label: 'Infection', icon: '🦠' },
    { value: 'other', label: 'Other', icon: '📋' },
  ];

  const severities: { value: IncidentSeverity; label: string; color: string }[] = [
    { value: 'near_miss', label: 'Near Miss', color: DISCO.neonGreen },
    { value: 'minor', label: 'Minor', color: DISCO.neonCyan },
    { value: 'moderate', label: 'Moderate', color: DISCO.neonYellow },
    { value: 'major', label: 'Major', color: DISCO.neonOrange },
    { value: 'sentinel', label: 'Sentinel', color: DISCO.neonPink },
    { value: 'catastrophic', label: 'Catastrophic', color: '#FF0000' },
  ];

  const handleSubmitReport = () => {
    const report = IncidentReportingService.createReport({
      category: selectedCategory,
      severity: selectedSeverity,
      description,
      location,
      unit,
      immediateActions,
      isAnonymous,
      reporterId: isAnonymous ? 'anonymous' : 'user-001',
      reporterName: isAnonymous ? 'Anonymous' : 'Current User',
      reporterRole: 'Nurse',
    });
    
    IncidentReportingService.submitReport(report.id);
    
    // Reset form
    setDescription('');
    setLocation('');
    setUnit('');
    setImmediateActions('');
    setSelectedCategory('other');
    setSelectedSeverity('minor');
    
    // Refresh list
    setIncidents(IncidentReportingService.getAllReports());
    setActiveTab('list');
  };

  const loadIncidents = () => {
    setIncidents(IncidentReportingService.getAllReports());
  };

  const analytics = IncidentReportingService.getAnalytics();
  const trends = IncidentReportingService.getTrends();

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'report', label: 'New Report', icon: '📝' },
        { key: 'list', label: 'Incidents', icon: '📋' },
        { key: 'analytics', label: 'Analytics', icon: '📊' },
        { key: 'trends', label: 'Trends', icon: '📈' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => {
            setActiveTab(tab.key as TabType);
            if (tab.key === 'list') loadIncidents();
          }}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReportForm = () => (
    <ScrollView style={styles.formContainer}>
      {/* Anonymous Toggle */}
      <TouchableOpacity
        style={[styles.anonymousToggle, isAnonymous && styles.anonymousActive]}
        onPress={() => setIsAnonymous(!isAnonymous)}
      >
        <Text style={styles.anonymousIcon}>{isAnonymous ? '🎭' : '👤'}</Text>
        <Text style={styles.anonymousText}>
          {isAnonymous ? 'Reporting Anonymously' : 'Report with Identity'}
        </Text>
      </TouchableOpacity>

      {/* Category Selection */}
      <Text style={styles.sectionTitle}>Incident Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryCard,
              selectedCategory === cat.value && styles.categorySelected,
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Severity Selection */}
      <Text style={styles.sectionTitle}>Severity Level</Text>
      <View style={styles.severityContainer}>
        {severities.map((sev) => (
          <TouchableOpacity
            key={sev.value}
            style={[
              styles.severityCard,
              { borderColor: sev.color },
              selectedSeverity === sev.value && { backgroundColor: sev.color + '40' },
            ]}
            onPress={() => setSelectedSeverity(sev.value)}
          >
            <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
            <Text style={[styles.severityLabel, { color: sev.color }]}>{sev.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Location & Unit */}
      <Text style={styles.sectionTitle}>Location Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Unit (e.g., ICU, ED, 3 North)"
        placeholderTextColor="#666"
        value={unit}
        onChangeText={setUnit}
      />
      <TextInput
        style={styles.input}
        placeholder="Specific Location (e.g., Room 302, Hallway)"
        placeholderTextColor="#666"
        value={location}
        onChangeText={setLocation}
      />

      {/* Description */}
      <Text style={styles.sectionTitle}>Event Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened in detail..."
        placeholderTextColor="#666"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {/* Immediate Actions */}
      <Text style={styles.sectionTitle}>Immediate Actions Taken</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What actions were taken immediately after the incident?"
        placeholderTextColor="#666"
        value={immediateActions}
        onChangeText={setImmediateActions}
        multiline
        numberOfLines={3}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
        <Text style={styles.submitButtonText}>Submit Incident Report</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderIncidentList = () => (
    <ScrollView style={styles.listContainer}>
      {incidents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No incidents reported</Text>
          <Text style={styles.emptySubtext}>Submit a new report to get started</Text>
        </View>
      ) : (
        incidents.map((incident) => {
          const severityColor = severities.find(s => s.value === incident.severity)?.color || DISCO.neonCyan;
          return (
            <View key={incident.id} style={[styles.incidentCard, { borderLeftColor: severityColor }]}>
              <View style={styles.incidentHeader}>
                <Text style={styles.incidentNumber}>{incident.reportNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: severityColor + '40' }]}>
                  <Text style={[styles.statusText, { color: severityColor }]}>
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.incidentCategory}>
                {categories.find(c => c.value === incident.category)?.icon}{' '}
                {incident.category.replace('_', ' ')}
              </Text>
              <Text style={styles.incidentDescription} numberOfLines={2}>
                {incident.description || 'No description provided'}
              </Text>
              <View style={styles.incidentFooter}>
                <Text style={styles.incidentDate}>
                  {incident.eventDate.toLocaleDateString()}
                </Text>
                <Text style={styles.incidentUnit}>{incident.unit || 'Unknown Unit'}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.analyticsContainer}>
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { borderColor: DISCO.neonPink }]}>
          <Text style={styles.summaryValue}>{analytics.totalIncidents}</Text>
          <Text style={styles.summaryLabel}>Total Incidents</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: DISCO.neonCyan }]}>
          <Text style={styles.summaryValue}>{analytics.openIncidents}</Text>
          <Text style={styles.summaryLabel}>Open</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: DISCO.neonOrange }]}>
          <Text style={styles.summaryValue}>{analytics.overdueActions}</Text>
          <Text style={styles.summaryLabel}>Overdue Actions</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: DISCO.neonGreen }]}>
          <Text style={styles.summaryValue}>{analytics.averageResolutionDays}d</Text>
          <Text style={styles.summaryLabel}>Avg Resolution</Text>
        </View>
      </View>

      {/* By Severity */}
      <Text style={styles.analyticsTitle}>By Severity</Text>
      <View style={styles.chartContainer}>
        {severities.map((sev) => {
          const count = analytics.bySeverity[sev.value] || 0;
          const maxCount = Math.max(...Object.values(analytics.bySeverity), 1);
          const width = (count / maxCount) * 100;
          return (
            <View key={sev.value} style={styles.barRow}>
              <Text style={styles.barLabel}>{sev.label}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${width}%`, backgroundColor: sev.color }]} />
              </View>
              <Text style={[styles.barValue, { color: sev.color }]}>{count}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderTrends = () => (
    <ScrollView style={styles.trendsContainer}>
      <Text style={styles.trendsTitle}>30-Day Incident Trends</Text>
      {trends.map((trend) => {
        const trendColor = trend.trend === 'increasing' ? DISCO.neonPink : 
                          trend.trend === 'decreasing' ? DISCO.neonGreen : DISCO.neonCyan;
        const trendIcon = trend.trend === 'increasing' ? '📈' : 
                         trend.trend === 'decreasing' ? '📉' : '➡️';
        return (
          <View key={trend.category} style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendCategory}>
                {categories.find(c => c.value === trend.category)?.icon}{' '}
                {trend.category.replace('_', ' ')}
              </Text>
              <Text style={styles.trendIcon}>{trendIcon}</Text>
            </View>
            <View style={styles.trendStats}>
              <Text style={styles.trendCount}>{trend.count} incidents</Text>
              <Text style={[styles.trendChange, { color: trendColor }]}>
                {trend.percentChange > 0 ? '+' : ''}{trend.percentChange}%
              </Text>
            </View>
            <View style={[styles.trendIndicator, { backgroundColor: trendColor }]} />
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Reporting</Text>
        <Text style={styles.headerSubtitle}>Safety Event Management</Text>
      </View>
      
      {renderTabs()}
      
      {activeTab === 'report' && renderReportForm()}
      {activeTab === 'list' && renderIncidentList()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'trends' && renderTrends()}
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
    borderBottomColor: DISCO.neonPink,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DISCO.neonPink,
    textShadowColor: DISCO.glowPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DISCO.neonCyan,
    marginTop: 4,
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
    borderBottomColor: DISCO.neonPink,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: DISCO.neonPink,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  anonymousActive: {
    borderColor: DISCO.neonPurple,
    backgroundColor: DISCO.neonPurple + '20',
  },
  anonymousIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  anonymousText: {
    color: '#FFF',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    marginBottom: 12,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: DISCO.cardBg,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  categorySelected: {
    borderColor: DISCO.neonPink,
    backgroundColor: DISCO.neonPink + '20',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: '#FFF',
    textAlign: 'center',
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  severityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: DISCO.cardBg,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: DISCO.neonPink,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: DISCO.neonPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  incidentCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  incidentCategory: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  incidentDescription: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 12,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incidentDate: {
    fontSize: 12,
    color: '#666',
  },
  incidentUnit: {
    fontSize: 12,
    color: DISCO.neonPurple,
  },
  analyticsContainer: {
    flex: 1,
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: DISCO.cardBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: '#888',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#222',
    borderRadius: 10,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 10,
  },
  barValue: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  trendsContainer: {
    flex: 1,
    padding: 16,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DISCO.neonCyan,
    marginBottom: 16,
  },
  trendCard: {
    backgroundColor: DISCO.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendCategory: {
    fontSize: 16,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  trendIcon: {
    fontSize: 20,
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendCount: {
    fontSize: 14,
    color: '#888',
  },
  trendChange: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendIndicator: {
    height: 3,
    borderRadius: 2,
    marginTop: 12,
  },
});
