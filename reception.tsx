/**
 * Reception Storyboard Screen
 * MediVac WACHS v9.2
 * 
 * Entry point with AHD action button, guest access, and quick links
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { advancedHealthDirectiveService } from '@/lib/services/advanced-health-directive-service';
import { browserInstallationService, BrowserType } from '@/lib/services/browser-installation-service';

interface QuickLink {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
  url?: string;
  isExternal?: boolean;
}

const QUICK_LINKS: QuickLink[] = [
  {
    id: 'ahd',
    title: 'Advanced Health Directive',
    description: 'Create your WA Advance Health Directive online',
    icon: '📋',
    color: '#10B981',
    route: '/ahd-wizard',
  },
  {
    id: 'telehealth',
    title: 'Telehealth Consultation',
    description: 'Book a video consultation with a healthcare provider',
    icon: '📹',
    color: '#3B82F6',
    route: '/telehealth',
  },
  {
    id: 'medications',
    title: 'Medication Management',
    description: 'Track and manage your medications',
    icon: '💊',
    color: '#8B5CF6',
    route: '/medications',
  },
  {
    id: 'emergency',
    title: 'Emergency Services',
    description: 'Quick access to emergency contacts and SOS',
    icon: '🚨',
    color: '#EF4444',
    route: '/emergency',
  },
  {
    id: 'health-records',
    title: 'Health Records',
    description: 'View and manage your health information',
    icon: '📁',
    color: '#F59E0B',
    route: '/health-records',
  },
  {
    id: 'wachs-portal',
    title: 'WACHS Portal',
    description: 'Access WA Country Health Service resources',
    icon: '🏥',
    color: '#06B6D4',
    url: 'https://wachs.health.wa.gov.au',
    isExternal: true,
  },
];

export default function ReceptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Auto-hide welcome after 3 seconds
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartAHD = (asGuest: boolean = false) => {
    // Create new AHD document
    advancedHealthDirectiveService.createDocument(asGuest);
    router.push('/ahd-wizard');
  };

  const handleQuickLink = (link: QuickLink) => {
    if (link.isExternal && link.url) {
      Linking.openURL(link.url);
    } else if (link.route) {
      router.push(link.route as any);
    }
  };

  const handleInstallBrowser = (browser: BrowserType) => {
    const info = browserInstallationService.getBrowserInfo(browser);
    Linking.openURL(info.webUrl);
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-6">
          {/* Welcome Banner */}
          {showWelcome && (
            <View className="bg-primary/10 rounded-2xl p-6 border border-primary/30">
              <View className="items-center">
                <Text className="text-4xl mb-2">👋</Text>
                <Text className="text-2xl font-bold text-foreground text-center">
                  Welcome to MediVac WACHS
                </Text>
                <Text className="text-sm text-muted text-center mt-2">
                  Your virtual hospital reception desk
                </Text>
              </View>
            </View>
          )}

          {/* Main AHD Action Button */}
          <View className="bg-gradient-to-br from-success/20 to-success/5 rounded-2xl p-6 border-2 border-success">
            <View className="items-center mb-4">
              <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center mb-3">
                <Text className="text-4xl">📋</Text>
              </View>
              <Text className="text-xl font-bold text-foreground text-center">
                Advanced Health Directive
              </Text>
              <Text className="text-sm text-muted text-center mt-1">
                Western Australia - Online Form Wizard
              </Text>
            </View>

            <Text className="text-sm text-foreground text-center mb-4">
              Create your legally binding Advance Health Directive. Document your treatment preferences 
              and appoint a Treatment Decision Maker. No login required.
            </Text>

            <View className="gap-3">
              <Pressable
                onPress={() => handleStartAHD(true)}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-success rounded-xl py-4 items-center">
                  <Text className="text-white font-bold text-lg">Start AHD Wizard</Text>
                  <Text className="text-white/80 text-xs mt-1">No login required • Guest access</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => handleStartAHD(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-success/20 rounded-xl py-3 items-center border border-success">
                  <Text className="text-success font-semibold">Sign in to save progress</Text>
                </View>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-center gap-4 mt-4">
              <View className="flex-row items-center gap-1">
                <Text className="text-success">✓</Text>
                <Text className="text-xs text-muted">Free</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-success">✓</Text>
                <Text className="text-xs text-muted">PDF Export</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-success">✓</Text>
                <Text className="text-xs text-muted">Email</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-success">✓</Text>
                <Text className="text-xs text-muted">Print</Text>
              </View>
            </View>
          </View>

          {/* Browser Installation Options */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Install Our Browsers</Text>
            
            <View className="flex-row gap-3">
              {/* JediTek Browser */}
              <Pressable
                onPress={() => handleInstallBrowser('jeditek')}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="items-center">
                    <Text className="text-3xl mb-2">🌐</Text>
                    <Text className="text-base font-semibold text-foreground">JediTek</Text>
                    <Text className="text-xs text-muted text-center mt-1">
                      Secure VPN Browser
                    </Text>
                  </View>
                  <View className="bg-[#00A8E8]/20 rounded-lg py-2 mt-3 items-center">
                    <Text className="text-xs font-medium" style={{ color: '#00A8E8' }}>Install</Text>
                  </View>
                </View>
              </Pressable>

              {/* WONGI Browser */}
              <Pressable
                onPress={() => handleInstallBrowser('wongi')}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="items-center">
                    <Text className="text-3xl mb-2">🦘</Text>
                    <Text className="text-base font-semibold text-foreground">WONGI</Text>
                    <Text className="text-xs text-muted text-center mt-1">
                      Community Browser
                    </Text>
                  </View>
                  <View className="bg-[#E85D04]/20 rounded-lg py-2 mt-3 items-center">
                    <Text className="text-xs font-medium" style={{ color: '#E85D04' }}>Install</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Quick Links */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Services</Text>
            
            {QUICK_LINKS.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => handleQuickLink(link)}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-4">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: link.color + '20' }}
                  >
                    <Text className="text-2xl">{link.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{link.title}</Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>{link.description}</Text>
                  </View>
                  <Text className="text-muted">{link.isExternal ? '↗' : '→'}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Guest Notice */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">ℹ️</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">Guest Access Available</Text>
                <Text className="text-xs text-muted">
                  You can use most services without logging in. Sign in to save your progress and access all features.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="items-center py-4">
            <Text className="text-xs text-muted text-center">
              MediVac WACHS Virtual Hospital
            </Text>
            <Text className="text-xs text-muted text-center mt-1">
              Serving Western Australia's Country Health Service
            </Text>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
