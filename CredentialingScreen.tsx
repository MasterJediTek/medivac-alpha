/**
 * Staff Credentialing Management Screen
 * MediVac One v3.1 - Certification & License Tracking
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { CredentialingService, StaffMember, Credential, ExpirationAlert, ComplianceReport } from '../services/CredentialingService';

type TabType = 'dashboard' | 'staff' | 'alerts' | 'compliance';

export default function CredentialingScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [dashboardStats, setDashboardStats] = useState<Awaited<ReturnType<typeof CredentialingService.getDashboardStats>> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staffData, alertsData, reportData, statsData] = await Promise.all([
        CredentialingService.getAllStaff(),
        CredentialingService.getExpirationAlerts(),
        CredentialingService.generateComplianceReport(),
        CredentialingService.getDashboardStats(),
      ]);
      setStaff(staffData);
      setAlerts(alertsData);
      setReport(reportData);
      setDashboardStats(statsData);
    } catch (error) {
      console.error('Failed to load credentialing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10B981',
      expiring_soon: '#F59E0B',
      expired: '#EF4444',
      pending: '#6B7280',
      suspended: '#EF4444',
      revoked: '#7F1D1D',
    };
    return colors[status] || '#6B7280';
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    return '#EF4444';
  };

  const getAlertColor = (level: string) => {
    if (level === 'critical') return '#EF4444';
    if (level === 'warning') return '#F59E0B';
    return '#3B82F6';
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await CredentialingService.acknowledgeAlert(alertId, 'Current User');
    const updatedAlerts = await CredentialingService.getExpirationAlerts();
    setAlerts(updatedAlerts);
  };

  const renderDashboard = () => {
    if (!dashboardStats || !report) return null;

    return (
      <View style={styles.tabContent}>
        {/* Overview Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{dashboardStats.totalStaff}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statValue, { color: getComplianceColor(dashboardStats.overallCompliance) }]}>
              {dashboardStats.overallCompliance}%
            </Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚨</Text>
            <Text style={[styles.statValue, dashboardStats.criticalAlerts > 0 && { color: '#EF4444' }]}>
              {dashboardStats.criticalAlerts}
            </Text>
            <Text style={styles.statLabel}>Critical Alerts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚠️</Text>
            <Text style={[styles.statValue, dashboardStats.warningAlerts > 0 && { color: '#F59E0B' }]}>
              {dashboardStats.warningAlerts}
            </Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statValue}>{dashboardStats.expiringThisMonth}</Text>
            <Text style={styles.statLabel}>Expiring This Month</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔍</Text>
            <Text style={styles.statValue}>{dashboardStats.pendingVerifications}</Text>
            <Text style={styles.statLabel}>Pending Verification</Text>
          </View>
        </View>

        {/* Compliance by Department */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Compliance by Department</Text>
          {report.byDepartment.map((dept, index) => (
            <View key={index} style={styles.deptRow}>
              <Text style={styles.deptName}>{dept.department}</Text>
              <View style={styles.deptProgress}>
                <View style={[styles.progressBar, { flex: 1 }]}>
                  <View style={[styles.progressFill, { width: `${dept.compliance}%`, backgroundColor: getComplianceColor(dept.compliance) }]} />
                </View>
              </View>
              <Text style={[styles.deptScore, { color: getComplianceColor(dept.compliance) }]}>
                {dept.compliance}%
              </Text>
              <Text style={styles.deptCount}>({dept.staffCount})</Text>
            </View>
          ))}
        </View>

        {/* Compliance by Role */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Compliance by Role</Text>
          {report.byRole.map((role, index) => (
            <View key={index} style={styles.roleRow}>
              <Text style={styles.roleName}>{role.role.charAt(0).toUpperCase() + role.role.slice(1)}</Text>
              <Text style={[styles.roleScore, { color: getComplianceColor(role.compliance) }]}>
                {role.compliance}%
              </Text>
              <Text style={styles.roleCount}>{role.staffCount} staff</Text>
            </View>
          ))}
        </View>

        {/* Expiration Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming Expirations</Text>
          <View style={styles.expirationSummary}>
            <View style={styles.expirationItem}>
              <Text style={[styles.expirationValue, { color: '#EF4444' }]}>{report.expiringIn30Days}</Text>
              <Text style={styles.expirationLabel}>Next 30 Days</Text>
            </View>
            <View style={styles.expirationItem}>
              <Text style={[styles.expirationValue, { color: '#F59E0B' }]}>{report.expiringIn60Days}</Text>
              <Text style={styles.expirationLabel}>31-60 Days</Text>
            </View>
            <View style={styles.expirationItem}>
              <Text style={[styles.expirationValue, { color: '#3B82F6' }]}>{report.expiringIn90Days}</Text>
              <Text style={styles.expirationLabel}>61-90 Days</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderStaffList = () => {
    if (selectedStaff) {
      return renderStaffDetail();
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Staff Directory</Text>
        {staff.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.staffCard}
            onPress={() => setSelectedStaff(member)}
          >
            <View style={styles.staffHeader}>
              <View>
                <Text style={styles.staffName}>{member.firstName} {member.lastName}</Text>
                <Text style={styles.staffRole}>{member.role.charAt(0).toUpperCase() + member.role.slice(1)} • {member.department}</Text>
              </View>
              <View style={[styles.complianceBadge, { backgroundColor: getComplianceColor(member.complianceScore) }]}>
                <Text style={styles.complianceText}>{member.complianceScore}%</Text>
              </View>
            </View>
            <View style={styles.staffMeta}>
              <Text style={styles.staffMetaText}>ID: {member.employeeId}</Text>
              <Text style={styles.staffMetaText}>{member.credentials.length} credentials</Text>
            </View>
            <View style={styles.credentialSummary}>
              {member.credentials.slice(0, 3).map((cred) => (
                <View key={cred.id} style={[styles.credentialChip, { backgroundColor: getStatusColor(cred.status) + '20', borderColor: getStatusColor(cred.status) }]}>
                  <Text style={[styles.credentialChipText, { color: getStatusColor(cred.status) }]}>{cred.name}</Text>
                </View>
              ))}
              {member.credentials.length > 3 && (
                <Text style={styles.moreCredentials}>+{member.credentials.length - 3} more</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStaffDetail = () => {
    if (!selectedStaff) return null;

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedStaff(null)}>
          <Text style={styles.backButtonText}>← Back to Staff List</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.detailName}>{selectedStaff.firstName} {selectedStaff.lastName}</Text>
            <Text style={styles.detailRole}>{selectedStaff.role.charAt(0).toUpperCase() + selectedStaff.role.slice(1)}</Text>
            <Text style={styles.detailDept}>{selectedStaff.department}</Text>
          </View>
          <View style={[styles.complianceCircle, { borderColor: getComplianceColor(selectedStaff.complianceScore) }]}>
            <Text style={[styles.complianceCircleText, { color: getComplianceColor(selectedStaff.complianceScore) }]}>
              {selectedStaff.complianceScore}%
            </Text>
          </View>
        </View>

        <View style={styles.detailInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>{selectedStaff.employeeId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{selectedStaff.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hire Date</Text>
            <Text style={styles.infoValue}>{selectedStaff.hireDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Review</Text>
            <Text style={styles.infoValue}>{selectedStaff.nextReviewDate.toLocaleDateString()}</Text>
          </View>
        </View>

        <Text style={styles.credentialsTitle}>Credentials ({selectedStaff.credentials.length})</Text>
        {selectedStaff.credentials.map((cred) => (
          <View key={cred.id} style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <View style={[styles.credentialStatus, { backgroundColor: getStatusColor(cred.status) }]}>
                <Text style={styles.credentialStatusText}>{cred.status.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.credentialType}>{cred.type}</Text>
            </View>
            <Text style={styles.credentialName}>{cred.name}</Text>
            <Text style={styles.credentialIssuer}>{cred.issuingAuthority}</Text>
            {cred.licenseNumber && <Text style={styles.credentialLicense}>License: {cred.licenseNumber}</Text>}
            <View style={styles.credentialDates}>
              <Text style={styles.credentialDate}>Issued: {cred.issueDate.toLocaleDateString()}</Text>
              <Text style={[styles.credentialDate, cred.status === 'expired' && { color: '#EF4444' }]}>
                Expires: {cred.expirationDate.toLocaleDateString()}
              </Text>
            </View>
            {cred.ceuRequired && (
              <View style={styles.ceuProgress}>
                <Text style={styles.ceuText}>CEU Progress: {cred.ceuCompleted || 0}/{cred.ceuRequired}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${((cred.ceuCompleted || 0) / cred.ceuRequired) * 100}%`, backgroundColor: '#3B82F6' }]} />
                </View>
              </View>
            )}
            {cred.verificationDate && (
              <Text style={styles.verificationInfo}>
                ✓ Verified by {cred.verifiedBy} on {cred.verificationDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderAlerts = () => {
    const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical');
    const warningAlerts = alerts.filter(a => a.alertLevel === 'warning');
    const infoAlerts = alerts.filter(a => a.alertLevel === 'info');

    return (
      <View style={styles.tabContent}>
        {criticalAlerts.length > 0 && (
          <>
            <Text style={[styles.alertSectionTitle, { color: '#EF4444' }]}>🚨 Critical ({criticalAlerts.length})</Text>
            {criticalAlerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: '#EF4444' }]}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertStaff}>{alert.staffName}</Text>
                  {!alert.acknowledged && (
                    <TouchableOpacity 
                      style={styles.acknowledgeButton}
                      onPress={() => handleAcknowledgeAlert(alert.id)}
                    >
                      <Text style={styles.acknowledgeText}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.alertCredential}>{alert.credentialName}</Text>
                <Text style={[styles.alertDays, { color: '#EF4444' }]}>
                  {alert.daysUntilExpiration <= 0 
                    ? `Expired ${Math.abs(alert.daysUntilExpiration)} days ago`
                    : `Expires in ${alert.daysUntilExpiration} days`}
                </Text>
                <Text style={styles.alertDate}>Expiration: {alert.expirationDate.toLocaleDateString()}</Text>
                {alert.acknowledged && (
                  <Text style={styles.acknowledgedInfo}>
                    ✓ Acknowledged by {alert.acknowledgedBy}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {warningAlerts.length > 0 && (
          <>
            <Text style={[styles.alertSectionTitle, { color: '#F59E0B', marginTop: 20 }]}>⚠️ Warning ({warningAlerts.length})</Text>
            {warningAlerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: '#F59E0B' }]}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertStaff}>{alert.staffName}</Text>
                  {!alert.acknowledged && (
                    <TouchableOpacity 
                      style={[styles.acknowledgeButton, { backgroundColor: '#F59E0B20' }]}
                      onPress={() => handleAcknowledgeAlert(alert.id)}
                    >
                      <Text style={[styles.acknowledgeText, { color: '#F59E0B' }]}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.alertCredential}>{alert.credentialName}</Text>
                <Text style={[styles.alertDays, { color: '#F59E0B' }]}>Expires in {alert.daysUntilExpiration} days</Text>
              </View>
            ))}
          </>
        )}

        {infoAlerts.length > 0 && (
          <>
            <Text style={[styles.alertSectionTitle, { color: '#3B82F6', marginTop: 20 }]}>ℹ️ Info ({infoAlerts.length})</Text>
            {infoAlerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: '#3B82F6' }]}>
                <Text style={styles.alertStaff}>{alert.staffName}</Text>
                <Text style={styles.alertCredential}>{alert.credentialName}</Text>
                <Text style={[styles.alertDays, { color: '#3B82F6' }]}>Expires in {alert.daysUntilExpiration} days</Text>
              </View>
            ))}
          </>
        )}

        {alerts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No expiration alerts</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCompliance = () => {
    if (!report) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.complianceOverview}>
          <Text style={styles.complianceOverviewLabel}>Overall Compliance</Text>
          <Text style={[styles.complianceOverviewValue, { color: getComplianceColor(report.overallCompliance) }]}>
            {report.overallCompliance}%
          </Text>
        </View>

        <View style={styles.complianceBreakdown}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.breakdownLabel}>Fully Compliant</Text>
            <Text style={styles.breakdownValue}>{report.fullyCompliant}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.breakdownLabel}>Partially Compliant</Text>
            <Text style={styles.breakdownValue}>{report.partiallyCompliant}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.breakdownLabel}>Non-Compliant</Text>
            <Text style={styles.breakdownValue}>{report.nonCompliant}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Staff Compliance Status</Text>
        {staff.sort((a, b) => a.complianceScore - b.complianceScore).map((member) => (
          <View key={member.id} style={styles.complianceStaffRow}>
            <View style={styles.complianceStaffInfo}>
              <Text style={styles.complianceStaffName}>{member.firstName} {member.lastName}</Text>
              <Text style={styles.complianceStaffDept}>{member.department}</Text>
            </View>
            <View style={styles.complianceStaffScore}>
              <View style={[styles.progressBar, { width: 100 }]}>
                <View style={[styles.progressFill, { width: `${member.complianceScore}%`, backgroundColor: getComplianceColor(member.complianceScore) }]} />
              </View>
              <Text style={[styles.complianceScoreText, { color: getComplianceColor(member.complianceScore) }]}>
                {member.complianceScore}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading credentialing data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Staff Credentialing</Text>
        <Text style={styles.headerSubtitle}>Certifications, Licenses & Training</Text>
      </View>

      <View style={styles.tabs}>
        {(['dashboard', 'staff', 'alerts', 'compliance'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { setActiveTab(tab); setSelectedStaff(null); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'staff' && renderStaffList()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'compliance' && renderCompliance()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#94A3B8' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, width: '48%', alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  sectionCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 16 },
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deptName: { width: 100, fontSize: 14, color: '#F8FAFC' },
  deptProgress: { flex: 1, marginHorizontal: 12 },
  progressBar: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  deptScore: { width: 45, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  deptCount: { width: 35, fontSize: 12, color: '#64748B', textAlign: 'right' },
  roleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  roleName: { flex: 1, fontSize: 14, color: '#F8FAFC' },
  roleScore: { fontSize: 16, fontWeight: '600', marginRight: 12 },
  roleCount: { fontSize: 12, color: '#64748B' },
  expirationSummary: { flexDirection: 'row', justifyContent: 'space-around' },
  expirationItem: { alignItems: 'center' },
  expirationValue: { fontSize: 32, fontWeight: 'bold' },
  expirationLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  staffCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  staffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  staffName: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  staffRole: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  complianceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  complianceText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  staffMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  staffMetaText: { fontSize: 12, color: '#64748B' },
  credentialSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  credentialChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  credentialChipText: { fontSize: 10, fontWeight: '500' },
  moreCredentials: { fontSize: 12, color: '#64748B', alignSelf: 'center' },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 14, color: '#3B82F6' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailName: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  detailRole: { fontSize: 16, color: '#94A3B8', marginTop: 4 },
  detailDept: { fontSize: 14, color: '#64748B', marginTop: 2 },
  complianceCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  complianceCircleText: { fontSize: 20, fontWeight: 'bold' },
  detailInfo: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { fontSize: 14, color: '#94A3B8' },
  infoValue: { fontSize: 14, color: '#F8FAFC' },
  credentialsTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  credentialCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  credentialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  credentialStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  credentialStatusText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', textTransform: 'uppercase' },
  credentialType: { fontSize: 12, color: '#64748B', textTransform: 'capitalize' },
  credentialName: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  credentialIssuer: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  credentialLicense: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  credentialDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  credentialDate: { fontSize: 12, color: '#64748B' },
  ceuProgress: { marginTop: 12 },
  ceuText: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  verificationInfo: { fontSize: 12, color: '#10B981', marginTop: 8 },
  alertSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  alertCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertStaff: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  acknowledgeButton: { backgroundColor: '#EF444420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  acknowledgeText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  alertCredential: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  alertDays: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  alertDate: { fontSize: 12, color: '#64748B', marginTop: 4 },
  acknowledgedInfo: { fontSize: 12, color: '#10B981', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#64748B' },
  complianceOverview: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  complianceOverviewLabel: { fontSize: 14, color: '#94A3B8' },
  complianceOverviewValue: { fontSize: 56, fontWeight: 'bold', marginTop: 8 },
  complianceBreakdown: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  breakdownDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  breakdownLabel: { flex: 1, fontSize: 14, color: '#F8FAFC' },
  breakdownValue: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  complianceStaffRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 8, padding: 12, marginBottom: 8 },
  complianceStaffInfo: { flex: 1 },
  complianceStaffName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  complianceStaffDept: { fontSize: 12, color: '#64748B' },
  complianceStaffScore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  complianceScoreText: { fontSize: 14, fontWeight: '600', width: 40, textAlign: 'right' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { fontSize: 16, color: '#94A3B8' },
});
