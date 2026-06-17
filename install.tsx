import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Linking, Platform, Share } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

// Device/OS Detection
type DeviceOS = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';

interface InstallOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  os: DeviceOS[];
  action: 'store' | 'download' | 'pwa' | 'qr' | 'link';
  url?: string;
  color: string;
}

const INSTALL_OPTIONS: InstallOption[] = [
  {
    id: 'ios-store',
    title: 'App Store',
    subtitle: 'Download for iPhone & iPad',
    icon: '🍎',
    os: ['ios'],
    action: 'store',
    url: 'https://apps.apple.com/app/medivac-one',
    color: '#000000',
  },
  {
    id: 'android-store',
    title: 'Google Play',
    subtitle: 'Download for Android',
    icon: '🤖',
    os: ['android'],
    action: 'store',
    url: 'https://play.google.com/store/apps/details?id=com.medivacone',
    color: '#3DDC84',
  },
  {
    id: 'expo-go',
    title: 'Expo Go',
    subtitle: 'Test with Expo Go app',
    icon: '📱',
    os: ['ios', 'android'],
    action: 'qr',
    url: 'exp://8081-i84oyg7x4bbvnqao5ruq3-7e25c3c0.sg1.manus.computer',
    color: '#000020',
  },
  {
    id: 'windows',
    title: 'Windows App',
    subtitle: 'Download for Windows 10/11',
    icon: '🪟',
    os: ['windows'],
    action: 'download',
    url: 'https://jeditek.xyz/downloads/medivac-one-win.exe',
    color: '#0078D4',
  },
  {
    id: 'macos',
    title: 'macOS App',
    subtitle: 'Download for Mac',
    icon: '🍏',
    os: ['macos'],
    action: 'download',
    url: 'https://jeditek.xyz/downloads/medivac-one-mac.dmg',
    color: '#A2AAAD',
  },
  {
    id: 'linux',
    title: 'Linux App',
    subtitle: 'Download AppImage',
    icon: '🐧',
    os: ['linux'],
    action: 'download',
    url: 'https://jeditek.xyz/downloads/medivac-one-linux.AppImage',
    color: '#FCC624',
  },
  {
    id: 'pwa',
    title: 'Install Web App',
    subtitle: 'Add to Home Screen',
    icon: '🌐',
    os: ['web', 'ios', 'android', 'windows', 'macos', 'linux'],
    action: 'pwa',
    color: '#4285F4',
  },
  {
    id: 'web',
    title: 'Open in Browser',
    subtitle: 'Use web version',
    icon: '🖥️',
    os: ['web', 'windows', 'macos', 'linux'],
    action: 'link',
    url: 'https://medivac.manus.space',
    color: '#34A853',
  },
];

// JEDI System Links
const JEDI_LINKS = [
  { id: 'main', name: 'JediTek Main', url: 'https://jeditek.com.au', icon: '🏠' },
  { id: 'wongi', name: 'WONGI Station', url: 'https://jeditek.net', icon: '📡' },
  { id: 'nexus', name: 'Nexus Beacon', url: 'https://nexus.jeditek.net', icon: '🔔' },
  { id: 'alpha', name: 'AlphaPrime', url: 'https://alphaprime.jeditek.com.au', icon: '⚡' },
  { id: 'iskool', name: 'iSkoolEDU', url: 'https://iskooledu.jeditek.com.au', icon: '📚' },
  { id: 'master', name: 'Master Class', url: 'https://master.jeditek.com.au', icon: '🎓' },
  { id: 'smpo', name: 'SMPO.ink', url: 'https://smpo-ink.manus.space', icon: '🖊️' },
  { id: 'jedi-hub', name: 'JEDI Hub', url: 'https://jeditek.org', icon: '⚙️' },
];

export default function InstallScreen() {
  const colors = useColors();
  const router = useRouter();
  const [detectedOS, setDetectedOS] = useState<DeviceOS>('web');
  const [showAllOptions, setShowAllOptions] = useState(false);

  useEffect(() => {
    detectOS();
  }, []);

  const detectOS = () => {
    if (Platform.OS === 'ios') {
      setDetectedOS('ios');
    } else if (Platform.OS === 'android') {
      setDetectedOS('android');
    } else if (Platform.OS === 'web') {
      // Detect desktop OS from user agent
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      if (ua.includes('win')) {
        setDetectedOS('windows');
      } else if (ua.includes('mac')) {
        setDetectedOS('macos');
      } else if (ua.includes('linux')) {
        setDetectedOS('linux');
      } else {
        setDetectedOS('web');
      }
    }
  };

  const handleInstall = async (option: InstallOption) => {
    switch (option.action) {
      case 'store':
      case 'download':
      case 'link':
        if (option.url) {
          await Linking.openURL(option.url);
        }
        break;
      case 'pwa':
        // PWA install prompt would be triggered here
        alert('To install: Click the browser menu and select "Add to Home Screen" or "Install App"');
        break;
      case 'qr':
        router.push('/module-scanner');
        break;
    }
  };

  const shareApp = async () => {
    try {
      await Share.share({
        title: 'MediVac One',
        message: 'Download MediVac One Virtual Hospital: https://medivac.manus.space',
        url: 'https://medivac.manus.space',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Filter options for current OS
  const recommendedOptions = INSTALL_OPTIONS.filter(opt => opt.os.includes(detectedOS));
  const otherOptions = INSTALL_OPTIONS.filter(opt => !opt.os.includes(detectedOS));

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-6 pb-4 items-center">
          <View 
            className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-6xl">🏥</Text>
          </View>
          <Text className="text-foreground text-3xl font-bold text-center">MediVac One</Text>
          <Text className="text-muted text-center mt-1">Virtual Hospital System</Text>
          <Text className="text-primary text-sm mt-2">Powered by JEDI Systems • SMPO.ink</Text>
        </View>

        {/* Detected OS */}
        <View className="px-5 mb-4">
          <View 
            className="p-4 rounded-xl flex-row items-center"
            style={{ backgroundColor: colors.success + '15' }}
          >
            <Text className="text-2xl mr-3">
              {detectedOS === 'ios' ? '🍎' : 
               detectedOS === 'android' ? '🤖' :
               detectedOS === 'windows' ? '🪟' :
               detectedOS === 'macos' ? '🍏' :
               detectedOS === 'linux' ? '🐧' : '🌐'}
            </Text>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">
                {detectedOS === 'ios' ? 'iOS Detected' :
                 detectedOS === 'android' ? 'Android Detected' :
                 detectedOS === 'windows' ? 'Windows Detected' :
                 detectedOS === 'macos' ? 'macOS Detected' :
                 detectedOS === 'linux' ? 'Linux Detected' : 'Web Browser'}
              </Text>
              <Text className="text-muted text-sm">Showing recommended install options</Text>
            </View>
          </View>
        </View>

        {/* Recommended Install Options */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Recommended</Text>
          {recommendedOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              className="mb-3"
              onPress={() => handleInstall(option)}
            >
              <View 
                className="p-4 rounded-xl flex-row items-center"
                style={{ backgroundColor: option.color + '15', borderWidth: 1, borderColor: option.color + '30' }}
              >
                <View 
                  className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: option.color + '20' }}
                >
                  <Text className="text-3xl">{option.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-lg">{option.title}</Text>
                  <Text className="text-muted">{option.subtitle}</Text>
                </View>
                <View 
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: option.color }}
                >
                  <Text className="text-white font-semibold">
                    {option.action === 'store' ? 'Get' :
                     option.action === 'download' ? 'Download' :
                     option.action === 'pwa' ? 'Install' :
                     option.action === 'qr' ? 'Scan' : 'Open'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Options */}
        {otherOptions.length > 0 && (
          <View className="px-5 mb-4">
            <TouchableOpacity
              className="flex-row items-center justify-between mb-3"
              onPress={() => setShowAllOptions(!showAllOptions)}
            >
              <Text className="text-foreground font-bold text-lg">Other Platforms</Text>
              <Text className="text-primary">{showAllOptions ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            
            {showAllOptions && otherOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                className="mb-2"
                onPress={() => handleInstall(option)}
              >
                <View 
                  className="p-3 rounded-xl flex-row items-center bg-surface border border-border"
                >
                  <Text className="text-2xl mr-3">{option.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{option.title}</Text>
                    <Text className="text-muted text-sm">{option.subtitle}</Text>
                  </View>
                  <Text className="text-muted">›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* JEDI System Links */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">JEDI Systems</Text>
          <View className="flex-row flex-wrap">
            {JEDI_LINKS.map(link => (
              <TouchableOpacity
                key={link.id}
                className="w-1/4 p-1"
                onPress={() => Linking.openURL(link.url)}
              >
                <View className="items-center p-2 rounded-xl bg-surface border border-border">
                  <Text className="text-2xl mb-1">{link.icon}</Text>
                  <Text className="text-muted text-xs text-center" numberOfLines={1}>
                    {link.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Share */}
        <View className="px-5 mb-4">
          <TouchableOpacity
            className="p-4 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={shareApp}
          >
            <Text className="text-2xl mr-2">📤</Text>
            <Text className="text-white font-bold text-lg">Share MediVac One</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Navigation */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Quick Navigation</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 p-4 rounded-xl bg-surface border border-border mr-2 items-center"
              onPress={() => router.push('/role-dashboard')}
            >
              <Text className="text-2xl mb-1">👤</Text>
              <Text className="text-foreground font-medium">Role Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 p-4 rounded-xl bg-surface border border-border items-center"
              onPress={() => router.push('/button-matrix')}
            >
              <Text className="text-2xl mb-1">🔲</Text>
              <Text className="text-foreground font-medium">Portal Matrix</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <View className="px-5 pb-8 items-center">
          <Text className="text-muted text-sm">MediVac One v2.0 Production</Text>
          <Text className="text-muted text-xs mt-1">© 2024 SMPO.INK • JediTek.net</Text>
          <Text className="text-muted text-xs mt-1">JEDI Integrated Healthcare Platform</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
