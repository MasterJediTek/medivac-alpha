/**
 * Drill Certificates Screen
 * Generate and manage PDF certificates for completed drills
 * MediVac One v5.7
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Share, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  drillCertificateService, 
  DrillCertificate, 
  CertificateTemplate,
  CertificateSettings,
  CERTIFICATE_LEVELS,
  CertificateLevel
} from "@/lib/services/drill-certificate-service";

type TabType = 'certificates' | 'templates' | 'verify' | 'settings';

export default function DrillCertificatesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('certificates');
  const [certificates, setCertificates] = useState<DrillCertificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [settings, setSettings] = useState<CertificateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<DrillCertificate | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; certificate?: DrillCertificate; reason?: string } | null>(null);
  const [filterLevel, setFilterLevel] = useState<CertificateLevel | 'all'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await drillCertificateService.initialize();
      setCertificates(drillCertificateService.getCertificates());
      setTemplates(drillCertificateService.getTemplates());
      setSettings(drillCertificateService.getSettings());
    } catch (error) {
      console.error('Failed to load certificate data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerify = () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter a verification code');
      return;
    }
    const result = drillCertificateService.verifyCertificate(verificationCode.trim());
    setVerificationResult(result);
  };

  const handleShare = async (certificate: DrillCertificate) => {
    try {
      const content = drillCertificateService.exportCertificate(certificate.id);
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(content);
        Alert.alert('Success', 'Certificate data copied to clipboard');
      } else {
        await Share.share({
          message: `Certificate: ${certificate.certificateNumber}\nVerification: ${certificate.verificationCode}`,
          title: 'Drill Certificate',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share certificate');
    }
  };

  const handleRevoke = async (certificate: DrillCertificate) => {
    Alert.alert(
      'Revoke Certificate',
      `Are you sure you want to revoke certificate ${certificate.certificateNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await drillCertificateService.revokeCertificate(certificate.id, 'Manual revocation');
            loadData();
          },
        },
      ]
    );
  };

  const handleUpdateSettings = async (updates: Partial<CertificateSettings>) => {
    if (!settings) return;
    const updated = await drillCertificateService.updateSettings(updates);
    setSettings(updated);
  };

  const stats = drillCertificateService.getStatistics();

  const filteredCertificates = filterLevel === 'all' 
    ? certificates 
    : certificates.filter(c => c.level === filterLevel);

  const getLevelColor = (level: CertificateLevel): string => {
    return CERTIFICATE_LEVELS[level].color;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'generated':
      case 'verified': return colors.success;
      case 'expired': return colors.warning;
      case 'revoked': return colors.error;
      default: return colors.muted;
    }
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['certificates', 'templates', 'verify', 'settings'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStats = () => (
    <View className="flex-row flex-wrap gap-2 mb-4">
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Total</Text>
        <Text className="text-foreground text-xl font-bold">{stats.totalCertificates}</Text>
      </View>
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Active</Text>
        <Text style={{ color: colors.success }} className="text-xl font-bold">{stats.activeCertificates}</Text>
      </View>
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Pass Rate</Text>
        <Text className="text-foreground text-xl font-bold">{stats.passRate}%</Text>
      </View>
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Avg Score</Text>
        <Text className="text-foreground text-xl font-bold">{stats.averageScore}%</Text>
      </View>
    </View>
  );

  const renderLevelFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => setFilterLevel('all')}
          className={`px-4 py-2 rounded-full ${filterLevel === 'all' ? 'bg-primary' : 'bg-surface'}`}
        >
          <Text className={filterLevel === 'all' ? 'text-white font-medium' : 'text-muted'}>All</Text>
        </TouchableOpacity>
        {(Object.keys(CERTIFICATE_LEVELS) as CertificateLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => setFilterLevel(level)}
            style={filterLevel === level ? { backgroundColor: getLevelColor(level) } : undefined}
            className={`px-4 py-2 rounded-full ${filterLevel !== level ? 'bg-surface' : ''}`}
          >
            <Text className={filterLevel === level ? 'text-white font-medium' : 'text-muted'}>
              {CERTIFICATE_LEVELS[level].label} ({stats.byLevel[level]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderCertificateCard = (certificate: DrillCertificate) => (
    <TouchableOpacity
      key={certificate.id}
      onPress={() => setSelectedCertificate(certificate)}
      className="bg-surface rounded-xl p-4 mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{certificate.userName}</Text>
          <Text className="text-muted text-sm">{certificate.certificateNumber}</Text>
        </View>
        <View 
          style={{ backgroundColor: getLevelColor(certificate.level) }}
          className="px-3 py-1 rounded-full"
        >
          <Text className="text-white text-xs font-bold">{CERTIFICATE_LEVELS[certificate.level].label}</Text>
        </View>
      </View>

      <Text className="text-foreground mb-1">{certificate.scenarioName}</Text>
      <Text className="text-muted text-sm mb-2">{certificate.threatType} • {certificate.difficulty}</Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View>
            <Text className="text-muted text-xs">Score</Text>
            <Text className="text-foreground font-bold">{certificate.percentage}%</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Status</Text>
            <Text style={{ color: getStatusColor(certificate.status) }} className="font-medium capitalize">
              {certificate.status}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleShare(certificate)}
            className="p-2 bg-background rounded-lg"
          >
            <IconSymbol name="paperplane.fill" size={16} color={colors.primary} />
          </TouchableOpacity>
          {certificate.status !== 'revoked' && (
            <TouchableOpacity
              onPress={() => handleRevoke(certificate)}
              className="p-2 bg-background rounded-lg"
            >
              <IconSymbol name="chevron.right" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCertificateDetail = () => {
    if (!selectedCertificate) return null;

    return (
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-foreground text-lg font-bold">Certificate Details</Text>
          <TouchableOpacity onPress={() => setSelectedCertificate(null)}>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View 
          style={{ backgroundColor: getLevelColor(selectedCertificate.level) }}
          className="rounded-xl p-4 mb-4 items-center"
        >
          <Text className="text-white text-2xl font-bold mb-1">
            {CERTIFICATE_LEVELS[selectedCertificate.level].label}
          </Text>
          <Text className="text-white/80">{selectedCertificate.percentage}% Score</Text>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-muted">Certificate #</Text>
            <Text className="text-foreground font-medium">{selectedCertificate.certificateNumber}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Recipient</Text>
            <Text className="text-foreground font-medium">{selectedCertificate.userName}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Role</Text>
            <Text className="text-foreground font-medium">{selectedCertificate.userRole}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Scenario</Text>
            <Text className="text-foreground font-medium">{selectedCertificate.scenarioName}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Threat Type</Text>
            <Text className="text-foreground font-medium">{selectedCertificate.threatType}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Difficulty</Text>
            <Text className="text-foreground font-medium capitalize">{selectedCertificate.difficulty}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Duration</Text>
            <Text className="text-foreground font-medium">
              {Math.floor(selectedCertificate.metadata.duration / 60)}m {selectedCertificate.metadata.duration % 60}s
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Steps Completed</Text>
            <Text className="text-foreground font-medium">
              {selectedCertificate.metadata.stepsCompleted}/{selectedCertificate.metadata.totalSteps}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Issued</Text>
            <Text className="text-foreground font-medium">
              {new Date(selectedCertificate.issuedAt).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Expires</Text>
            <Text className="text-foreground font-medium">
              {new Date(selectedCertificate.expiresAt).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Verification Code</Text>
            <Text className="text-foreground font-mono text-xs">{selectedCertificate.verificationCode}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleShare(selectedCertificate)}
          className="bg-primary rounded-xl py-3 mt-4"
        >
          <Text className="text-white text-center font-semibold">Share Certificate</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCertificatesTab = () => (
    <View>
      {renderStats()}
      {renderLevelFilter()}
      {selectedCertificate && renderCertificateDetail()}
      
      {filteredCertificates.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="doc.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No certificates found</Text>
          <Text className="text-muted text-sm text-center mt-1">
            Complete drills to earn certificates
          </Text>
        </View>
      ) : (
        filteredCertificates.map(renderCertificateCard)
      )}
    </View>
  );

  const renderTemplatesTab = () => (
    <View>
      <Text className="text-foreground text-lg font-bold mb-4">Certificate Templates</Text>
      
      {templates.map((template) => (
        <View key={template.id} className="bg-surface rounded-xl p-4 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-foreground font-semibold">{template.name}</Text>
              {template.isDefault && (
                <View className="bg-primary/20 px-2 py-0.5 rounded">
                  <Text style={{ color: colors.primary }} className="text-xs">Default</Text>
                </View>
              )}
            </View>
            <Text className="text-muted text-sm capitalize">{template.layout}</Text>
          </View>
          <Text className="text-muted text-sm mb-3">{template.description}</Text>
          
          <View className="flex-row gap-2">
            {Object.entries(template.colorScheme).slice(0, 4).map(([key, color]) => (
              <View 
                key={key}
                style={{ backgroundColor: color }}
                className="w-6 h-6 rounded-full border border-border"
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderVerifyTab = () => (
    <View>
      <Text className="text-foreground text-lg font-bold mb-4">Verify Certificate</Text>
      
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-muted text-sm mb-2">Enter Verification Code</Text>
        <TextInput
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="e.g., ABC123XYZ789"
          placeholderTextColor={colors.muted}
          className="bg-background text-foreground p-3 rounded-lg mb-3 font-mono"
          autoCapitalize="characters"
        />
        <TouchableOpacity
          onPress={handleVerify}
          className="bg-primary rounded-xl py-3"
        >
          <Text className="text-white text-center font-semibold">Verify</Text>
        </TouchableOpacity>
      </View>

      {verificationResult && (
        <View 
          style={{ backgroundColor: verificationResult.valid ? colors.success + '20' : colors.error + '20' }}
          className="rounded-xl p-4"
        >
          <View className="flex-row items-center gap-2 mb-2">
            <IconSymbol 
              name={verificationResult.valid ? "checkmark.circle.fill" : "chevron.right"} 
              size={24} 
              color={verificationResult.valid ? colors.success : colors.error} 
            />
            <Text 
              style={{ color: verificationResult.valid ? colors.success : colors.error }}
              className="text-lg font-bold"
            >
              {verificationResult.valid ? 'Valid Certificate' : 'Invalid Certificate'}
            </Text>
          </View>
          
          {verificationResult.reason && (
            <Text className="text-muted">{verificationResult.reason}</Text>
          )}
          
          {verificationResult.certificate && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-foreground font-medium">{verificationResult.certificate.userName}</Text>
              <Text className="text-muted text-sm">{verificationResult.certificate.scenarioName}</Text>
              <Text className="text-muted text-sm">
                Issued: {new Date(verificationResult.certificate.issuedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderSettingsTab = () => {
    if (!settings) return null;

    return (
      <View>
        <Text className="text-foreground text-lg font-bold mb-4">Certificate Settings</Text>
        
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-foreground font-medium mb-3">Organization</Text>
          
          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Organization Name</Text>
            <TextInput
              value={settings.organizationName}
              onChangeText={(text) => handleUpdateSettings({ organizationName: text })}
              className="bg-background text-foreground p-3 rounded-lg"
              placeholderTextColor={colors.muted}
            />
          </View>
          
          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Issuer Name</Text>
            <TextInput
              value={settings.issuerName}
              onChangeText={(text) => handleUpdateSettings({ issuerName: text })}
              className="bg-background text-foreground p-3 rounded-lg"
              placeholderTextColor={colors.muted}
            />
          </View>
          
          <View>
            <Text className="text-muted text-sm mb-1">Issuer Title</Text>
            <TextInput
              value={settings.issuerTitle}
              onChangeText={(text) => handleUpdateSettings({ issuerTitle: text })}
              className="bg-background text-foreground p-3 rounded-lg"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-foreground font-medium mb-3">Certificate Options</Text>
          
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-foreground">Expiry Period</Text>
              <Text className="text-muted text-sm">{settings.expiryMonths} months</Text>
            </View>
            <View className="flex-row gap-2">
              {[6, 12, 24].map((months) => (
                <TouchableOpacity
                  key={months}
                  onPress={() => handleUpdateSettings({ expiryMonths: months })}
                  className={`px-3 py-1 rounded-lg ${settings.expiryMonths === months ? 'bg-primary' : 'bg-background'}`}
                >
                  <Text className={settings.expiryMonths === months ? 'text-white' : 'text-muted'}>
                    {months}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-foreground">Passing Threshold</Text>
              <Text className="text-muted text-sm">{settings.passingThreshold}% minimum</Text>
            </View>
            <View className="flex-row gap-2">
              {[50, 60, 70, 80].map((threshold) => (
                <TouchableOpacity
                  key={threshold}
                  onPress={() => handleUpdateSettings({ passingThreshold: threshold })}
                  className={`px-3 py-1 rounded-lg ${settings.passingThreshold === threshold ? 'bg-primary' : 'bg-background'}`}
                >
                  <Text className={settings.passingThreshold === threshold ? 'text-white' : 'text-muted'}>
                    {threshold}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => handleUpdateSettings({ autoGenerate: !settings.autoGenerate })}
            className="flex-row items-center justify-between"
          >
            <View>
              <Text className="text-foreground">Auto-Generate Certificates</Text>
              <Text className="text-muted text-sm">Generate on drill completion</Text>
            </View>
            <View 
              style={{ backgroundColor: settings.autoGenerate ? colors.success : colors.muted }}
              className="w-12 h-6 rounded-full justify-center"
            >
              <View 
                className={`w-5 h-5 bg-white rounded-full ${settings.autoGenerate ? 'self-end mr-0.5' : 'self-start ml-0.5'}`}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View className="bg-surface rounded-xl p-4">
          <Text className="text-foreground font-medium mb-3">Verification</Text>
          
          <TouchableOpacity
            onPress={() => handleUpdateSettings({ enableVerification: !settings.enableVerification })}
            className="flex-row items-center justify-between mb-3"
          >
            <View>
              <Text className="text-foreground">Enable Verification</Text>
              <Text className="text-muted text-sm">Allow external verification</Text>
            </View>
            <View 
              style={{ backgroundColor: settings.enableVerification ? colors.success : colors.muted }}
              className="w-12 h-6 rounded-full justify-center"
            >
              <View 
                className={`w-5 h-5 bg-white rounded-full ${settings.enableVerification ? 'self-end mr-0.5' : 'self-start ml-0.5'}`}
              />
            </View>
          </TouchableOpacity>
          
          <View>
            <Text className="text-muted text-sm mb-1">Verification URL</Text>
            <TextInput
              value={settings.verificationUrl}
              onChangeText={(text) => handleUpdateSettings({ verificationUrl: text })}
              className="bg-background text-foreground p-3 rounded-lg"
              placeholderTextColor={colors.muted}
              editable={settings.enableVerification}
            />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading certificates...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Drill Certificates</Text>
            <Text className="text-muted">Generate and verify completion certificates</Text>
          </View>
          <View className="bg-primary/20 p-3 rounded-full">
            <IconSymbol name="doc.fill" size={24} color={colors.primary} />
          </View>
        </View>

        {renderTabs()}

        {activeTab === 'certificates' && renderCertificatesTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'verify' && renderVerifyTab()}
        {activeTab === 'settings' && renderSettingsTab()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
