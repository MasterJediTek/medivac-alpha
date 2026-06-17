/**
 * Multi-Language Support UI Screen - MediVac WACHS v9.4
 * Language selection and translation preview for AHD forms
 */

import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { multiLanguageSupportService, SupportedLanguage, LanguageInfo } from '@/lib/services/multi-language-support-service';

type TabType = 'languages' | 'preview' | 'translations' | 'settings';

export default function LanguageSettingsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('languages');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en-AU');
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);

  useEffect(() => {
    setLanguages(multiLanguageSupportService.getSupportedLanguages());
    setCurrentLanguage(multiLanguageSupportService.getLanguage());
  }, []);

  const selectLanguage = (code: SupportedLanguage) => {
    multiLanguageSupportService.setLanguage(code);
    setCurrentLanguage(code);
  };

  const t = (key: string) => multiLanguageSupportService.translate(key);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'languages', label: 'Languages', icon: '🌐' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'translations', label: 'Translations', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderLanguagesTab = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <Text className="text-lg font-bold text-foreground mb-4">Select Language</Text>
        <Text className="text-sm text-muted mb-4">
          Choose your preferred language for the Advanced Health Directive forms.
        </Text>

        {languages.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => selectLanguage(lang.code)}
            style={({ pressed }) => [
              { opacity: pressed ? 0.8 : 1 },
              { padding: 16, borderRadius: 12, marginBottom: 8 },
              { backgroundColor: currentLanguage === lang.code ? `${colors.primary}20` : colors.background },
              { borderWidth: 2, borderColor: currentLanguage === lang.code ? colors.primary : colors.border }
            ]}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{lang.flag}</Text>
                <View>
                  <Text className="text-foreground font-bold">{lang.name}</Text>
                  <Text className="text-sm text-muted">{lang.nativeName}</Text>
                </View>
              </View>
              <View className="items-end">
                {currentLanguage === lang.code && (
                  <Text className="text-primary font-bold mb-1">✓ Selected</Text>
                )}
                <View className="flex-row items-center gap-1">
                  <View className="w-16 h-2 bg-background rounded-full overflow-hidden">
                    <View 
                      style={{ width: `${lang.completeness}%`, backgroundColor: lang.completeness === 100 ? '#10B981' : lang.completeness >= 80 ? '#F59E0B' : '#EF4444' }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <Text className="text-xs text-muted">{lang.completeness}%</Text>
                </View>
              </View>
            </View>
            {lang.direction === 'rtl' && (
              <View className="mt-2 bg-yellow-500/10 px-2 py-1 rounded self-start">
                <Text className="text-xs text-yellow-400">Right-to-Left</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
        <Text className="text-blue-400 font-bold mb-2">💡 Translation Coverage</Text>
        <Text className="text-sm text-muted">
          Translations are provided for common WA community languages. 
          English (Australian) is always available as a fallback.
        </Text>
      </View>
    </View>
  );

  const renderPreviewTab = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <View className="flex-row items-center gap-2 mb-4">
          <Text className="text-2xl">{languages.find(l => l.code === currentLanguage)?.flag}</Text>
          <Text className="text-lg font-bold text-foreground">
            {languages.find(l => l.code === currentLanguage)?.name}
          </Text>
        </View>

        <Text className="text-xl font-bold text-primary mb-4">{t('ahd.title')}</Text>
        <Text className="text-sm text-muted mb-6">{t('ahd.subtitle')}</Text>

        {/* Personal Details Section */}
        <View className="bg-background rounded-xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground mb-3">{t('personal.title')}</Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('personal.fullName')}:</Text>
              <Text className="text-sm text-foreground">John Smith</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('personal.dateOfBirth')}:</Text>
              <Text className="text-sm text-foreground">15/03/1955</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('personal.address')}:</Text>
              <Text className="text-sm text-foreground">Perth, WA</Text>
            </View>
          </View>
        </View>

        {/* Treatment Decision Maker Section */}
        <View className="bg-background rounded-xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground mb-2">{t('tdm.title')}</Text>
          <Text className="text-xs text-muted mb-3">{t('tdm.description')}</Text>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">{t('tdm.relationship')}:</Text>
            <Text className="text-sm text-foreground">Spouse</Text>
          </View>
        </View>

        {/* Values Section */}
        <View className="bg-background rounded-xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground mb-3">{t('values.title')}</Text>
          <Text className="text-xs text-muted">{t('values.qualityOfLife')}</Text>
        </View>

        {/* Treatment Decisions */}
        <View className="bg-background rounded-xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground mb-3">{t('treatment.title')}</Text>
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">{t('treatment.cpr')}</Text>
              <Text className="text-xs text-green-400">{t('preference.want')}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">{t('treatment.ventilation')}</Text>
              <Text className="text-xs text-red-400">{t('preference.doNotWant')}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">{t('treatment.palliative')}</Text>
              <Text className="text-xs text-green-400">{t('preference.want')}</Text>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        <View className="bg-background rounded-xl p-4">
          <Text className="text-base font-bold text-foreground mb-3">{t('signature.title')}</Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('signature.date')}:</Text>
              <Text className="text-sm text-foreground">05/02/2026</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('signature.location')}:</Text>
              <Text className="text-sm text-foreground">Perth, WA</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <Pressable
          style={({ pressed }) => [
            { opacity: pressed ? 0.8 : 1, backgroundColor: colors.primary },
            { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }
          ]}
        >
          <Text className="text-background font-bold">{t('action.save')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            { opacity: pressed ? 0.8 : 1, backgroundColor: colors.surface },
            { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border }
          ]}
        >
          <Text className="text-foreground font-bold">{t('action.print')}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderTranslationsTab = () => {
    const categories = ['AHD Form', 'Personal Details', 'Treatment Decision Maker', 'Values and Wishes', 'Treatment Decisions', 'Preferences', 'Witness', 'Signature', 'Actions', 'Instructions'];
    
    return (
      <View className="gap-4">
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Translation Categories</Text>
          
          {categories.map((category) => {
            const translations = multiLanguageSupportService.getTranslationsByCategory(category);
            return (
              <View key={category} className="mb-4 last:mb-0">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-foreground font-medium">{category}</Text>
                  <Text className="text-xs text-muted">{translations.length} items</Text>
                </View>
                <View className="bg-background rounded-lg p-3">
                  {translations.slice(0, 3).map((t) => (
                    <View key={t.key} className="flex-row justify-between py-1 border-b border-border last:border-b-0">
                      <Text className="text-xs text-muted flex-1">{t.englishText}</Text>
                      <Text className="text-xs text-primary flex-1 text-right">
                        {t.translations[currentLanguage] || '—'}
                      </Text>
                    </View>
                  ))}
                  {translations.length > 3 && (
                    <Text className="text-xs text-muted text-center mt-2">
                      +{translations.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSettingsTab = () => {
    const analytics = multiLanguageSupportService.getAnalytics();

    return (
      <View className="gap-4">
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">📊 Translation Statistics</Text>
          
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-primary">{analytics.totalLanguages}</Text>
              <Text className="text-xs text-muted">Languages</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-blue-400">{analytics.totalTranslations}</Text>
              <Text className="text-xs text-muted">Translations</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-green-400">{analytics.averageCompleteness.toFixed(0)}%</Text>
              <Text className="text-xs text-muted">Avg Coverage</Text>
            </View>
          </View>

          <Text className="text-sm font-medium text-foreground mb-2">Coverage by Language</Text>
          {analytics.byLanguage.map((lang) => (
            <View key={lang.language} className="flex-row items-center gap-2 mb-2">
              <Text className="text-sm text-muted w-32">{lang.language}</Text>
              <View className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                <View 
                  style={{ width: `${lang.completeness}%`, backgroundColor: lang.completeness === 100 ? '#10B981' : lang.completeness >= 80 ? '#F59E0B' : '#EF4444' }}
                  className="h-full rounded-full"
                />
              </View>
              <Text className="text-xs text-muted w-10 text-right">{lang.completeness}%</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">⚙️ Language Settings</Text>
          
          <View className="gap-3">
            <View className="flex-row justify-between items-center py-2 border-b border-border">
              <Text className="text-foreground">Auto-detect language</Text>
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs">Enabled</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-border">
              <Text className="text-foreground">Fallback to English</Text>
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs">Enabled</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-border">
              <Text className="text-foreground">Show translation keys</Text>
              <View className="bg-muted/20 px-3 py-1 rounded-full">
                <Text className="text-muted text-xs">Disabled</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-foreground">RTL support</Text>
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs">Enabled</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-yellow-500/10 rounded-2xl p-4 border border-yellow-500/30">
          <Text className="text-yellow-400 font-bold mb-2">⚠️ Important Notice</Text>
          <Text className="text-sm text-muted">
            Translations are provided for convenience. For legal purposes, 
            the English version of the Advanced Health Directive is the 
            authoritative document under Western Australian law.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="items-center mb-2">
            <Text className="text-3xl mb-1">🌐</Text>
            <Text className="text-2xl font-bold text-foreground">Language Settings</Text>
            <Text className="text-sm text-muted text-center">
              Multi-language support for AHD forms
            </Text>
          </View>

          {/* Tab Bar */}
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 },
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
                  activeTab === tab.id && { backgroundColor: colors.primary }
                ]}
              >
                <Text className="text-lg">{tab.icon}</Text>
                <Text className={`text-xs font-medium ${activeTab === tab.id ? 'text-background' : 'text-muted'}`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'languages' && renderLanguagesTab()}
          {activeTab === 'preview' && renderPreviewTab()}
          {activeTab === 'translations' && renderTranslationsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
