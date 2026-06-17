/**
 * Smartwatch Companion Screen
 * MediVac WACHS v8.6
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  smartwatchCompanionService, 
  WatchDevice,
  VitalReading,
  EmergencyContact,
  WatchSettings,
} from '@/lib/services/smartwatch-companion-service';

type TabType = 'device' | 'vitals' | 'emergency' | 'settings';

export default function SmartwatchCompanionScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('device');
  const [device, setDevice] = useState<WatchDevice | null>(null);
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] = useState<WatchSettings>(smartwatchCompanionService.getSettings());

  useEffect(() => {
    loadData();
    const unsubscribe = smartwatchCompanionService.subscribe((d) => {
      setDevice(d);
      loadData();
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    setDevice(smartwatchCompanionService.getConnectedDevice());
    setVitals(smartwatchCompanionService.getAllVitals());
    setContacts(smartwatchCompanionService.getAllEmergencyContacts());
    setSettings(smartwatchCompanionService.getSettings());
  };

  const handleSync = async () => {
    await smartwatchCompanionService.syncWithPhone();
    loadData();
  };

  const handleSOS = () => {
    smartwatchCompanionService.triggerSOS('Manual SOS triggered from app');
  };

  const toggleSetting = (key: keyof WatchSettings) => {
    const updated = smartwatchCompanionService.updateSettings({ [key]: !settings[key] });
    setSettings(updated);
  };

  const analytics = smartwatchCompanionService.getAnalytics();

  const renderDeviceTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {device ? (
        <>
          <View style={{ backgroundColor: '#1ABC9C', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{device.name}</Text>
                <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>{device.model}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 24 }}>⌚</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: device.connectionStatus === 'connected' ? '#27AE60' : '#E74C3C', marginRight: 4 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{device.connectionStatus}</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 16 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12 }}>
                <Text style={{ color: '#FFFFFF', opacity: 0.8, fontSize: 12 }}>Battery</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>{device.batteryLevel}%</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12 }}>
                <Text style={{ color: '#FFFFFF', opacity: 0.8, fontSize: 12 }}>OS Version</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{device.osVersion}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Pressable onPress={handleSync} style={{ flex: 1, backgroundColor: '#3498DB', padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>🔄 Sync Now</Text>
            </Pressable>
            <Pressable onPress={handleSOS} style={{ flex: 1, backgroundColor: '#E74C3C', padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>🆘 SOS</Text>
            </Pressable>
          </View>

          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Statistics</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: colors.muted }}>Avg Heart Rate</Text>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{analytics.avgHeartRate} bpm</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: colors.muted }}>Avg Daily Steps</Text>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{analytics.avgDailySteps.toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.muted }}>Sync Success Rate</Text>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{analytics.syncSuccessRate}%</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>⌚</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>No Watch Connected</Text>
          <Pressable 
            onPress={() => smartwatchCompanionService.pairDevice('apple-watch')}
            style={{ backgroundColor: '#1ABC9C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Pair Watch</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );

  const renderVitalsTab = () => (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {[
          { type: 'heart-rate', icon: '❤️', value: vitals.find(v => v.type === 'heart-rate')?.value || '--', unit: 'bpm', color: '#E74C3C' },
          { type: 'blood-oxygen', icon: '🫁', value: vitals.find(v => v.type === 'blood-oxygen')?.value || '--', unit: '%', color: '#3498DB' },
          { type: 'steps', icon: '👟', value: vitals.find(v => v.type === 'steps')?.value || '--', unit: 'steps', color: '#27AE60' },
        ].map((vital) => (
          <View key={vital.type} style={{ flex: 1, backgroundColor: vital.color + '20', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>{vital.icon}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>{vital.value}</Text>
            <Text style={{ fontSize: 10, color: colors.muted }}>{vital.unit}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Recent Readings</Text>
      <FlatList
        data={vitals.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: item.isAbnormal ? '#E74C3C20' : colors.surface,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {item.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: item.isAbnormal ? '#E74C3C' : colors.foreground }}>
              {item.value} {item.unit}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>No vital readings yet</Text>
          </View>
        }
      />
    </View>
  );

  const renderEmergencyTab = () => (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ backgroundColor: '#E74C3C', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>🆘</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Emergency SOS</Text>
        <Pressable onPress={handleSOS} style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}>
          <Text style={{ color: '#E74C3C', fontWeight: '700' }}>ACTIVATE SOS</Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Emergency Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{item.name}</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>{item.phone}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{item.relationship}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>No emergency contacts</Text>
          </View>
        }
      />
    </View>
  );

  const renderSettingsTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Notifications</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, marginBottom: 16 }}>
        {[
          { key: 'notificationsEnabled', label: 'Enable Notifications', icon: '🔔' },
          { key: 'hapticsEnabled', label: 'Haptic Feedback', icon: '📳' },
          { key: 'soundEnabled', label: 'Sound Alerts', icon: '🔊' },
        ].map((item) => (
          <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text style={{ color: colors.foreground }}>{item.label}</Text>
            </View>
            <Switch
              value={settings[item.key as keyof WatchSettings] as boolean}
              onValueChange={() => toggleSetting(item.key as keyof WatchSettings)}
              trackColor={{ false: colors.border, true: '#1ABC9C' }}
            />
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Health Monitoring</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 12 }}>
        {[
          { key: 'heartRateMonitoring', label: 'Heart Rate Monitoring', icon: '❤️' },
          { key: 'fallDetection', label: 'Fall Detection', icon: '⚠️' },
          { key: 'medicationReminders', label: 'Medication Reminders', icon: '💊' },
        ].map((item) => (
          <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text style={{ color: colors.foreground }}>{item.label}</Text>
            </View>
            <Switch
              value={settings[item.key as keyof WatchSettings] as boolean}
              onValueChange={() => toggleSetting(item.key as keyof WatchSettings)}
              trackColor={{ false: colors.border, true: '#1ABC9C' }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#9B59B6', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Smartwatch Companion</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {device ? `${device.name} • ${device.connectionStatus}` : 'No watch connected'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['device', 'vitals', 'emergency', 'settings'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? '#9B59B6' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 11 }}>
              {tab === 'device' ? '⌚ Device' : tab === 'vitals' ? '❤️ Vitals' : tab === 'emergency' ? '🆘 SOS' : '⚙️ Settings'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'device' && renderDeviceTab()}
        {activeTab === 'vitals' && renderVitalsTab()}
        {activeTab === 'emergency' && renderEmergencyTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>
    </ScreenContainer>
  );
}
