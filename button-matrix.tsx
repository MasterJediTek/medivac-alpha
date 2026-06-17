import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Linking, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

// Portal Categories
interface Portal {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  category: string;
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
}

// All JEDI Portals
const JEDI_PORTALS: Portal[] = [
  // Main Portals
  { id: 'main', name: 'JediTek Main', url: 'https://jeditek.com.au', icon: '🏠', color: '#3B82F6', category: 'main', status: 'active', description: 'Main JediTek portal' },
  { id: 'wongi', name: 'WONGI Station', url: 'https://jeditek.net', icon: '📡', color: '#16A34A', category: 'main', status: 'active', description: 'WONGI communications hub' },
  { id: 'nexus', name: 'Nexus Beacon', url: 'https://nexus.jeditek.net', icon: '🔔', color: '#F59E0B', category: 'main', status: 'active', description: 'Nexus beacon system' },
  { id: 'alpha', name: 'AlphaPrime', url: 'https://alphaprime.jeditek.com.au', icon: '⚡', color: '#9333EA', category: 'main', status: 'active', description: 'AlphaPrime downloads' },
  { id: 'iskool', name: 'iSkoolEDU', url: 'https://iskooledu.jeditek.com.au', icon: '📚', color: '#DC2626', category: 'main', status: 'active', description: 'Education platform' },
  { id: 'medivac', name: 'MediVac One', url: 'https://wongi.com.au', icon: '🏥', color: '#0891B2', category: 'main', status: 'active', description: 'Virtual hospital system' },
  { id: 'master', name: 'Master Class', url: 'https://master.jeditek.com.au', icon: '🎓', color: '#EC4899', category: 'main', status: 'active', description: 'Training platform' },
  
  // Manus Space Portals
  { id: 'church', name: 'JEDI Church', url: 'https://jedi-church.manus.space', icon: '⛪', color: '#7C3AED', category: 'manus', status: 'active', description: 'Resource hub' },
  { id: 'vpn-bro', name: 'VPN Browser', url: 'https://jeditek-bro.manus.space', icon: '🔒', color: '#059669', category: 'manus', status: 'active', description: 'Secure browser' },
  { id: 'pokie', name: 'Jedi Pokie', url: 'https://jedipokie.com', icon: '🎰', color: '#D97706', category: 'manus', status: 'active', description: 'Jedi Knights game' },
  { id: 'xyz', name: 'JEDI Downloads', url: 'https://jeditek.xyz', icon: '⬇️', color: '#2563EB', category: 'manus', status: 'active', description: 'Download portal' },
  { id: 'wongi-comm', name: 'WONGI Comms', url: 'https://wongi.manus.space', icon: '💬', color: '#10B981', category: 'manus', status: 'active', description: 'Community communications' },
  { id: 'org', name: 'JEDI Systems', url: 'https://jeditek.org', icon: '⚙️', color: '#14B8A6', category: 'manus', status: 'active', description: 'Integrated system' },
  { id: 'kb', name: 'Knowledge Base', url: 'https://jedi.church', icon: '📖', color: '#6366F1', category: 'manus', status: 'active', description: 'KB management' },
  
  // Evidence Portals
  { id: 'evidence1', name: 'SMPO Evidence', url: 'https://smpo-evidance-port.manus.space', icon: '📋', color: '#EF4444', category: 'evidence', status: 'active', description: 'Stephen Orazi evidence' },
  { id: 'evidence2', name: 'David Evidence', url: 'https://jeditek-david.manus.space', icon: '📁', color: '#F97316', category: 'evidence', status: 'active', description: 'JEDI evidence portal' },
  { id: 'orazi', name: 'Orazi Case', url: 'https://orazi-case.manus.space', icon: '⚖️', color: '#84CC16', category: 'evidence', status: 'active', description: 'Case for justice' },
  
  // Command Portals
  { id: 'falcon', name: 'Falcon Command', url: 'https://falcon.manus.space', icon: '🦅', color: '#78350F', category: 'command', status: 'active', description: 'Project Falcon' },
  { id: 'death-star', name: 'Death Star VIP', url: 'https://death-star.vip', icon: '🌑', color: '#1F2937', category: 'command', status: 'active', description: 'JEDI integrated platform' },
  { id: 'jedi-click', name: 'JEDI Backend', url: 'https://jedi.click', icon: '🔧', color: '#4B5563', category: 'command', status: 'active', description: 'System backend' },
  { id: 'smpo-ink', name: 'SMPO.ink KB', url: 'https://smpo-ink.manus.space', icon: '🖊️', color: '#8B5CF6', category: 'command', status: 'active', description: 'Knowledge base' },
  
  // System Portals
  { id: 'camp', name: 'JEDI Camp', url: 'https://jedi-camp.manus.space', icon: '🏕️', color: '#22C55E', category: 'system', status: 'active', description: 'Training camp' },
  { id: 'nav', name: 'JEDI Nav', url: 'https://jedi-nav.manus.space', icon: '🧭', color: '#06B6D4', category: 'system', status: 'active', description: 'Navigation system' },
  { id: 'cc', name: 'JEDI CC', url: 'https://jedi-cc.manus.space', icon: '📞', color: '#F43F5E', category: 'system', status: 'active', description: 'Command center' },
  { id: 'beacon', name: 'JEDI Beacon', url: 'https://jedi-beacon.manus.space', icon: '📍', color: '#A855F7', category: 'system', status: 'active', description: 'Beacon system' },
  { id: 'opps', name: 'JEDI Opps', url: 'https://jedi-opps.manus.space', icon: '🎯', color: '#EAB308', category: 'system', status: 'active', description: 'Operations center' },
  { id: 'station', name: 'JEDI Station', url: 'https://jedi-station.manus.space', icon: '🛰️', color: '#64748B', category: 'system', status: 'active', description: 'Space station comms' },
  { id: 'control', name: 'JEDI Control', url: 'https://jedi-control.manus.space', icon: '🎛️', color: '#0EA5E9', category: 'system', status: 'active', description: 'Control panel' },
  { id: 'install', name: 'JEDI Install', url: 'https://jedi-install.manus.space', icon: '💾', color: '#10B981', category: 'system', status: 'active', description: 'Installer' },
  
  // Special Portals
  { id: 'photon', name: 'Photon V2', url: 'https://photonv2-f4bwwnhc.manus.space', icon: '💡', color: '#FBBF24', category: 'special', status: 'active', description: 'Photon system' },
  { id: 'nexusbp', name: 'Nexus BP', url: 'https://nexusbp-jrzfy3zp.manus.space', icon: '🔗', color: '#A78BFA', category: 'special', status: 'active', description: 'Nexus beacon prime' },
  { id: 'schoolzone', name: 'SchoolZone', url: 'https://schoolzone.pro', icon: '🏫', color: '#FB7185', category: 'special', status: 'active', description: 'Master class JPC' },
  { id: 'chat', name: 'JEDI Chat', url: 'https://jedi-chat.manus.space', icon: '💭', color: '#34D399', category: 'special', status: 'active', description: 'Chat interface' },
  { id: 'prime', name: 'Prime Portal', url: 'https://prime.manus.space', icon: '👑', color: '#F472B6', category: 'special', status: 'active', description: 'Prime access' },
];

// Module Installation Options
const MODULE_INSTALLS = [
  { id: 'homing-beacon', name: 'Homing Beacon', icon: '📍', installed: true },
  { id: 'comm-station', name: 'Comm Station', icon: '📡', installed: true },
  { id: 'friend-hatching', name: 'Friend Hatching', icon: '🐣', installed: false },
  { id: 'club-builder', name: 'Club Builder', icon: '🏗️', installed: false },
  { id: 'web-share', name: 'Web Share', icon: '🌐', installed: true },
  { id: 'vpn-browser', name: 'VPN Browser', icon: '🔒', installed: true },
  { id: 'patient-records', name: 'Patient Records', icon: '📋', installed: true },
  { id: 'lab-integration', name: 'Lab Integration', icon: '🔬', installed: true },
  { id: 'pharmacy-link', name: 'Pharmacy Link', icon: '💊', installed: false },
  { id: 'imaging-suite', name: 'Imaging Suite', icon: '🩻', installed: false },
  { id: 'billing-module', name: 'Billing Module', icon: '💰', installed: true },
  { id: 'analytics-pro', name: 'Analytics Pro', icon: '📊', installed: true },
];

// Categories
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌐' },
  { id: 'main', name: 'Main', icon: '🏠' },
  { id: 'manus', name: 'Manus', icon: '🚀' },
  { id: 'evidence', name: 'Evidence', icon: '📋' },
  { id: 'command', name: 'Command', icon: '🎯' },
  { id: 'system', name: 'System', icon: '⚙️' },
  { id: 'special', name: 'Special', icon: '⭐' },
];

export default function ButtonMatrixScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modules, setModules] = useState(MODULE_INSTALLS);

  // Filter portals
  const filteredPortals = selectedCategory === 'all' 
    ? JEDI_PORTALS 
    : JEDI_PORTALS.filter(p => p.category === selectedCategory);

  // Open portal
  const openPortal = async (portal: Portal) => {
    try {
      await Linking.openURL(portal.url);
    } catch (error) {
      Alert.alert('Error', `Failed to open ${portal.name}`);
    }
  };

  // Toggle module
  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, installed: !m.installed } : m
    ));
  };

  // Install all modules
  const installAllModules = () => {
    const moduleList = modules.filter(m => !m.installed).map(m => m.id).join(',');
    const installUrl = `jedi://install?modules=${moduleList}`;
    Alert.alert(
      'Install Modules',
      `Install URL: ${installUrl}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Install', onPress: () => Linking.openURL(installUrl) }
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-foreground text-2xl font-bold">Button Matrix Portal</Text>
          <Text className="text-muted text-sm mt-1">Access all JEDI portals and install modules</Text>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-4"
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              className="mr-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
              }}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text 
                style={{ 
                  color: selectedCategory === cat.id ? '#FFFFFF' : colors.foreground,
                  fontWeight: '600',
                }}
              >
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Portal Grid */}
        <View className="px-5 mb-6">
          <Text className="text-foreground font-bold text-lg mb-3">
            JEDI Portals ({filteredPortals.length})
          </Text>
          <View className="flex-row flex-wrap">
            {filteredPortals.map(portal => (
              <TouchableOpacity
                key={portal.id}
                className="w-1/3 p-1"
                onPress={() => openPortal(portal)}
              >
                <View 
                  className="rounded-xl p-3 items-center"
                  style={{ backgroundColor: portal.color + '15' }}
                >
                  <Text className="text-3xl mb-1">{portal.icon}</Text>
                  <Text 
                    className="text-xs font-medium text-center"
                    style={{ color: portal.color }}
                    numberOfLines={1}
                  >
                    {portal.name}
                  </Text>
                  <View 
                    className="w-2 h-2 rounded-full mt-1"
                    style={{ 
                      backgroundColor: portal.status === 'active' ? colors.success : colors.warning 
                    }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Module Installation */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-bold text-lg">Module Installation</Text>
            <TouchableOpacity
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: colors.primary }}
              onPress={installAllModules}
            >
              <Text className="text-white text-sm font-medium">Install All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row flex-wrap">
              {modules.map(module => (
                <TouchableOpacity
                  key={module.id}
                  className="w-1/2 p-2"
                  onPress={() => toggleModule(module.id)}
                >
                  <View 
                    className="flex-row items-center p-3 rounded-xl"
                    style={{ 
                      backgroundColor: module.installed ? colors.success + '15' : colors.surface,
                      borderWidth: 1,
                      borderColor: module.installed ? colors.success : colors.border,
                    }}
                  >
                    <Text className="text-xl mr-2">{module.icon}</Text>
                    <View className="flex-1">
                      <Text 
                        className="text-sm font-medium"
                        style={{ color: colors.foreground }}
                        numberOfLines={1}
                      >
                        {module.name}
                      </Text>
                      <Text 
                        className="text-xs"
                        style={{ color: module.installed ? colors.success : colors.muted }}
                      >
                        {module.installed ? '✓ Installed' : 'Not installed'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Text className="text-foreground font-bold text-lg mb-3">Quick Actions</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl p-4 mr-2 items-center"
              onPress={() => router.push('/module-scanner')}
            >
              <Text className="text-3xl mb-1">🔍</Text>
              <Text className="text-white font-medium">Scan Modules</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              onPress={() => router.push('/integration-control-arm')}
            >
              <Text className="text-3xl mb-1">🔗</Text>
              <Text className="text-foreground font-medium">Integrations</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Install URL */}
        <View className="px-5 mb-8">
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-xs mb-2">JEDI Install Protocol</Text>
            <Text className="text-foreground text-sm font-mono">
              jedi://install?modules=homing-beacon,comm-station,friend-hatching,club-builder,web-share,vpn-browser
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
