import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Integration Systems
const INTEGRATION_SYSTEMS = [
  { 
    id: 'jedi-systems', 
    name: 'JEDI Systems', 
    icon: '⚔️', 
    color: '#4A90D9',
    description: 'JEDItek core systems integration',
    endpoints: ['jeditek.com.au', 'jeditek.net', 'jeditek.org'],
    status: 'connected'
  },
  { 
    id: 'smpo-ink', 
    name: 'SMPO.ink Protocol', 
    icon: '🔐', 
    color: '#9B59B6',
    description: 'Secure Medical Protocol Operations',
    endpoints: ['smpo-ink.manus.space', 'smpo.ink'],
    status: 'connected'
  },
  { 
    id: 'wongi', 
    name: 'WONGI Integration', 
    icon: '🌐', 
    color: '#27AE60',
    description: 'WONGI community communications',
    endpoints: ['wongi.manus.space', 'wongi.com.au'],
    status: 'connected'
  },
  { 
    id: 'python-hitch', 
    name: 'Python Hitch', 
    icon: '🐍', 
    color: '#F39C12',
    description: 'Automation and task scheduling',
    endpoints: ['Internal Service'],
    status: 'active'
  },
  { 
    id: 'l3-cache', 
    name: 'L3 Cache Repository', 
    icon: '💾', 
    color: '#E74C3C',
    description: 'Level 3 persistent cache storage',
    endpoints: ['AsyncStorage', 'Local DB'],
    status: 'active'
  },
  { 
    id: 's3-sync', 
    name: 'S3 Cloud Sync', 
    icon: '☁️', 
    color: '#3498DB',
    description: 'AWS S3 compatible cloud storage',
    endpoints: ['JEDI S3 Bucket', 'Backup Storage'],
    status: 'syncing'
  },
  { 
    id: 'office365', 
    name: 'Office 365', 
    icon: '📧', 
    color: '#D35400',
    description: 'Microsoft Office 365 integration',
    endpoints: ['Graph API', 'Outlook', 'Teams'],
    status: 'connected'
  },
  { 
    id: 'nexus-beacon', 
    name: 'Nexus Beacon', 
    icon: '📡', 
    color: '#8E44AD',
    description: 'Nexus Beacon Prime communications',
    endpoints: ['nexus.jeditek.net'],
    status: 'standby'
  },
];

// Webhook Events
const WEBHOOK_EVENTS = [
  { id: 'patient-created', name: 'Patient Created', category: 'Patients' },
  { id: 'patient-updated', name: 'Patient Updated', category: 'Patients' },
  { id: 'patient-discharged', name: 'Patient Discharged', category: 'Patients' },
  { id: 'appointment-scheduled', name: 'Appointment Scheduled', category: 'Schedule' },
  { id: 'appointment-cancelled', name: 'Appointment Cancelled', category: 'Schedule' },
  { id: 'task-created', name: 'Task Created', category: 'Tasks' },
  { id: 'task-completed', name: 'Task Completed', category: 'Tasks' },
  { id: 'alert-triggered', name: 'Alert Triggered', category: 'Alerts' },
  { id: 'medication-administered', name: 'Medication Administered', category: 'Medical' },
  { id: 'lab-result-received', name: 'Lab Result Received', category: 'Medical' },
  { id: 'sync-completed', name: 'Sync Completed', category: 'System' },
  { id: 'backup-completed', name: 'Backup Completed', category: 'System' },
];

// Sample Webhooks
const SAMPLE_WEBHOOKS = [
  { 
    id: 1, 
    name: 'JEDI Patient Sync', 
    url: 'https://jeditek.org/api/webhooks/patient',
    events: ['patient-created', 'patient-updated'],
    active: true,
    lastTriggered: '2 mins ago'
  },
  { 
    id: 2, 
    name: 'SMPO Alert Handler', 
    url: 'https://smpo-ink.manus.space/api/alerts',
    events: ['alert-triggered'],
    active: true,
    lastTriggered: '15 mins ago'
  },
  { 
    id: 3, 
    name: 'WONGI Task Notifier', 
    url: 'https://wongi.manus.space/api/tasks',
    events: ['task-created', 'task-completed'],
    active: false,
    lastTriggered: '1 hour ago'
  },
];

type ViewMode = 'integrations' | 'webhooks' | 'add-webhook' | 'sync-status';

export default function WebhooksScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('integrations');
  const [webhooks, setWebhooks] = useState(SAMPLE_WEBHOOKS);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const toggleWebhook = (id: number) => {
    setWebhooks(prev => prev.map(wh => 
      wh.id === id ? { ...wh, active: !wh.active } : wh
    ));
  };

  const toggleEvent = (eventId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const renderIntegrationsView = () => (
    <View className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-4">System Integrations</Text>
      <Text className="text-muted mb-6">Manage connections to JEDI systems, SMPO.ink protocols, and external services.</Text>

      {INTEGRATION_SYSTEMS.map(system => (
        <TouchableOpacity
          key={system.id}
          className="bg-surface p-4 rounded-xl mb-3 flex-row items-center"
        >
          <View 
            style={{ backgroundColor: system.color }}
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          >
            <Text className="text-2xl">{system.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{system.name}</Text>
            <Text className="text-muted text-sm">{system.description}</Text>
            <Text className="text-xs text-muted mt-1">{system.endpoints.join(' • ')}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${
            system.status === 'connected' ? 'bg-green-100' :
            system.status === 'active' ? 'bg-blue-100' :
            system.status === 'syncing' ? 'bg-yellow-100' : 'bg-gray-100'
          }`}>
            <Text className={`text-xs font-medium ${
              system.status === 'connected' ? 'text-green-700' :
              system.status === 'active' ? 'text-blue-700' :
              system.status === 'syncing' ? 'text-yellow-700' : 'text-gray-700'
            }`}>{system.status}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Quick Actions */}
      <View className="flex-row gap-3 mt-6">
        <TouchableOpacity 
          className="flex-1 bg-primary p-4 rounded-xl"
          onPress={() => setViewMode('sync-status')}
        >
          <Text className="text-white font-semibold text-center">Sync Status</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 bg-surface border border-border p-4 rounded-xl"
          onPress={() => setViewMode('webhooks')}
        >
          <Text className="text-foreground font-semibold text-center">Webhooks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWebhooksView = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('integrations')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Webhooks</Text>
        <TouchableOpacity onPress={() => setViewMode('add-webhook')}>
          <Text className="text-primary font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-muted mb-4">Configure webhook endpoints to receive real-time notifications.</Text>

      {webhooks.map(webhook => (
        <View key={webhook.id} className="bg-surface p-4 rounded-xl mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground font-semibold">{webhook.name}</Text>
            <Switch
              value={webhook.active}
              onValueChange={() => toggleWebhook(webhook.id)}
              trackColor={{ false: '#E5E7EB', true: '#4A90D9' }}
            />
          </View>
          <Text className="text-muted text-sm mb-2">{webhook.url}</Text>
          <View className="flex-row flex-wrap gap-1 mb-2">
            {webhook.events.map(event => (
              <View key={event} className="bg-primary/10 px-2 py-1 rounded">
                <Text className="text-primary text-xs">{event}</Text>
              </View>
            ))}
          </View>
          <Text className="text-xs text-muted">Last triggered: {webhook.lastTriggered}</Text>
        </View>
      ))}
    </View>
  );

  const renderAddWebhookView = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('webhooks')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Add Webhook</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="bg-surface p-4 rounded-xl">
        <Text className="text-foreground font-semibold mb-2">Webhook Name</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter webhook name"
          placeholderTextColor="#9BA1A6"
          value={newWebhook.name}
          onChangeText={(text) => setNewWebhook(prev => ({ ...prev, name: text }))}
        />

        <Text className="text-foreground font-semibold mb-2">Endpoint URL</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="https://example.com/webhook"
          placeholderTextColor="#9BA1A6"
          value={newWebhook.url}
          onChangeText={(text) => setNewWebhook(prev => ({ ...prev, url: text }))}
          keyboardType="url"
        />

        <Text className="text-foreground font-semibold mb-2">Events to Subscribe</Text>
        <View className="gap-2">
          {Object.entries(
            WEBHOOK_EVENTS.reduce((acc, event) => {
              if (!acc[event.category]) acc[event.category] = [];
              acc[event.category].push(event);
              return acc;
            }, {} as Record<string, typeof WEBHOOK_EVENTS>)
          ).map(([category, events]) => (
            <View key={category}>
              <Text className="text-muted text-sm font-medium mb-1">{category}</Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {events.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    className={`px-3 py-2 rounded-lg ${
                      newWebhook.events.includes(event.id) ? 'bg-primary' : 'bg-background border border-border'
                    }`}
                    onPress={() => toggleEvent(event.id)}
                  >
                    <Text className={`text-sm ${
                      newWebhook.events.includes(event.id) ? 'text-white' : 'text-foreground'
                    }`}>{event.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity className="bg-primary p-4 rounded-xl mt-4">
          <Text className="text-white font-semibold text-center">Create Webhook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSyncStatusView = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('integrations')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Sync Status</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* L3 Cache Status */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-2xl">💾</Text>
          <Text className="text-lg font-bold text-foreground">L3 Cache Repository</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Cache Size</Text>
          <Text className="text-foreground font-medium">24.5 MB</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Items Cached</Text>
          <Text className="text-foreground font-medium">1,247</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Hit Rate</Text>
          <Text className="text-green-600 font-medium">98.2%</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted">Last Cleanup</Text>
          <Text className="text-foreground font-medium">2 hours ago</Text>
        </View>
      </View>

      {/* S3 Sync Status */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-2xl">☁️</Text>
          <Text className="text-lg font-bold text-foreground">S3 Cloud Sync</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Sync Status</Text>
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-green-600 font-medium">Active</Text>
          </View>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Last Sync</Text>
          <Text className="text-foreground font-medium">5 mins ago</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Pending Uploads</Text>
          <Text className="text-foreground font-medium">3 files</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Total Synced</Text>
          <Text className="text-foreground font-medium">156.8 MB</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted">JEDI Root Folder</Text>
          <Text className="text-primary font-medium">/JEDI/Systems/MediVac</Text>
        </View>
      </View>

      {/* Knowledge Base Sync */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-2xl">📚</Text>
          <Text className="text-lg font-bold text-foreground">Knowledge Base Sync</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Documents</Text>
          <Text className="text-foreground font-medium">342</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Categories</Text>
          <Text className="text-foreground font-medium">28</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted">Last Updated</Text>
          <Text className="text-foreground font-medium">Just now</Text>
        </View>
      </View>

      {/* Sync Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 bg-primary p-4 rounded-xl">
          <Text className="text-white font-semibold text-center">Force Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-surface border border-border p-4 rounded-xl">
          <Text className="text-foreground font-semibold text-center">Clear Cache</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'integrations' && renderIntegrationsView()}
        {viewMode === 'webhooks' && renderWebhooksView()}
        {viewMode === 'add-webhook' && renderAddWebhookView()}
        {viewMode === 'sync-status' && renderSyncStatusView()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
