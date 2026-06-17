/**
 * Recording Alerts Screen
 * Manage notifications and consent for voice recordings
 */

import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, Switch, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  recordingAlertsService, 
  RecordingAlert, 
  UserAlertPreferences,
  RecordingConsent,
  AlertAnalytics 
} from '@/lib/services/recording-alerts-service';

type TabType = 'alerts' | 'preferences' | 'consents' | 'analytics';

export default function RecordingAlertsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<RecordingAlert[]>([]);
  const [preferences, setPreferences] = useState<UserAlertPreferences | null>(null);
  const [consents, setConsents] = useState<RecordingConsent[]>([]);
  const [analytics, setAnalytics] = useState<AlertAnalytics | null>(null);
  const [optOutReason, setOptOutReason] = useState('');

  const loadData = useCallback(async () => {
    await recordingAlertsService.initialize();
    setAlerts(recordingAlertsService.getAlerts({ limit: 50 }));
    setPreferences(await recordingAlertsService.getUserPreferences('current_user'));
    setConsents(recordingAlertsService.getConsents());
    setAnalytics(recordingAlertsService.getAnalytics());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkRead = async (alertId: string) => {
    await recordingAlertsService.markAlertRead(alertId, 'current_user');
    await loadData();
  };

  const handleAcknowledge = async (alertId: string) => {
    await recordingAlertsService.acknowledgeAlert(alertId, 'current_user');
    await loadData();
  };

  const handleUpdatePreference = async (key: keyof UserAlertPreferences, value: boolean | string) => {
    if (!preferences) return;
    await recordingAlertsService.updateUserPreferences('current_user', { [key]: value });
    await loadData();
  };

  const handleOptOut = async () => {
    await recordingAlertsService.optOutOfRecording('current_user', 'Current User', optOutReason);
    setOptOutReason('');
    await loadData();
  };

  const handleOptIn = async () => {
    await recordingAlertsService.optInToRecording('current_user');
    await loadData();
  };

  const handleRespondConsent = async (consentId: string, status: 'granted' | 'denied') => {
    await recordingAlertsService.respondToConsent(consentId, status);
    await loadData();
  };

  const renderTabs = () => (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {(['alerts', 'preferences', 'consents', 'analytics'] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
          }}
        >
          <Text style={{
            color: activeTab === tab ? colors.primary : colors.muted,
            fontWeight: activeTab === tab ? '600' : '400',
            fontSize: 13,
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderAlerts = () => (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Recording Alerts
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
        Notifications when JEDI Masters start recording voice channels
      </Text>

      {alerts.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No recording alerts yet</Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <View
            key={alert.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: alert.type === 'recording_started' ? colors.warning : colors.success,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, flex: 1 }}>
                {alert.message}
              </Text>
              <View style={{
                backgroundColor: alert.priority === 'high' ? colors.error : colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                  {alert.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              Channel: {alert.channelName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
              By: {alert.requestedByName} ({alert.requestedByRank})
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
              {new Date(alert.timestamp).toLocaleString()}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!alert.readBy.includes('current_user') && (
                <Pressable
                  onPress={() => handleMarkRead(alert.id)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Mark Read</Text>
                </Pressable>
              )}
              {!alert.acknowledgedBy.includes('current_user') && (
                <Pressable
                  onPress={() => handleAcknowledge(alert.id)}
                  style={{
                    backgroundColor: colors.success,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Acknowledge</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderPreferences = () => (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Alert Preferences
      </Text>

      {preferences && (
        <>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
              Notification Settings
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Enable Recording Alerts</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Receive notifications when recordings start</Text>
              </View>
              <Switch
                value={preferences.enableRecordingAlerts}
                onValueChange={(v) => handleUpdatePreference('enableRecordingAlerts', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Sound</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Play sound for alerts</Text>
              </View>
              <Switch
                value={preferences.soundEnabled}
                onValueChange={(v) => handleUpdatePreference('soundEnabled', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Vibration</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Vibrate for alerts</Text>
              </View>
              <Switch
                value={preferences.vibrationEnabled}
                onValueChange={(v) => handleUpdatePreference('vibrationEnabled', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Lock Screen</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Show on lock screen</Text>
              </View>
              <Switch
                value={preferences.showInLockScreen}
                onValueChange={(v) => handleUpdatePreference('showInLockScreen', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
              Recording Opt-Out
            </Text>

            {preferences.optOutOfRecording ? (
              <View>
                <View style={{
                  backgroundColor: colors.warning + '20',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}>
                  <Text style={{ color: colors.warning, fontWeight: '600' }}>
                    You have opted out of recordings
                  </Text>
                  {preferences.optOutReason && (
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                      Reason: {preferences.optOutReason}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={handleOptIn}
                  style={{
                    backgroundColor: colors.success,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Opt Back In</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 12 }}>
                  Opt out to exclude yourself from voice recordings. JEDI Masters will be notified of your preference.
                </Text>
                <TextInput
                  value={optOutReason}
                  onChangeText={setOptOutReason}
                  placeholder="Reason for opting out (optional)"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.foreground,
                    marginBottom: 12,
                  }}
                />
                <Pressable
                  onPress={handleOptOut}
                  style={{
                    backgroundColor: colors.error,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Opt Out of Recordings</Text>
                </Pressable>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderConsents = () => (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Recording Consents
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
        Manage your consent for specific recordings
      </Text>

      {consents.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No pending consent requests</Text>
        </View>
      ) : (
        consents.map((consent) => (
          <View
            key={consent.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                Recording: {consent.recordingId.slice(0, 12)}...
              </Text>
              <View style={{
                backgroundColor: consent.status === 'granted' ? colors.success :
                  consent.status === 'denied' ? colors.error :
                  consent.status === 'pending' ? colors.warning : colors.muted,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                  {consent.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
              Requested: {new Date(consent.requestedAt).toLocaleString()}
            </Text>

            {consent.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => handleRespondConsent(consent.id, 'granted')}
                  style={{
                    flex: 1,
                    backgroundColor: colors.success,
                    padding: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Grant</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRespondConsent(consent.id, 'denied')}
                  style={{
                    flex: 1,
                    backgroundColor: colors.error,
                    padding: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Deny</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
        Alert Analytics
      </Text>

      {analytics && (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{analytics.totalAlerts}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total Alerts</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.success }}>{analytics.deliveryRate.toFixed(0)}%</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Delivery Rate</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.warning }}>{analytics.readRate.toFixed(0)}%</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Read Rate</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.error }}>{analytics.optOutCount}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Opt-Outs</Text>
            </View>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
              Consent Statistics
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Granted</Text>
                <Text style={{ color: colors.success, fontWeight: '600' }}>{analytics.consentStats.granted}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Denied</Text>
                <Text style={{ color: colors.error, fontWeight: '600' }}>{analytics.consentStats.denied}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Pending</Text>
                <Text style={{ color: colors.warning, fontWeight: '600' }}>{analytics.consentStats.pending}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Withdrawn</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{analytics.consentStats.withdrawn}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
            Recording Alerts
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Notifications & Consent Management
          </Text>
        </View>
      </View>

      {renderTabs()}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'preferences' && renderPreferences()}
        {activeTab === 'consents' && renderConsents()}
        {activeTab === 'analytics' && renderAnalytics()}
      </ScrollView>
    </ScreenContainer>
  );
}
