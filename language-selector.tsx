/**
 * Language Selector Component
 * Allows users to select their preferred language for accessibility audio
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { languageService, type Language, type LanguageCode } from '@/lib/services/language.service';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChange?: (language: Language) => void;
}

export function LanguageSelector({ visible, onClose, onLanguageChange }: LanguageSelectorProps) {
  const colors = useColors();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languageService.getCurrentLanguage());
  const [languages] = useState<Language[]>(languageService.getAvailableLanguages());

  useEffect(() => {
    const unsubscribe = languageService.subscribe((lang) => {
      setCurrentLanguage(lang);
    });
    return unsubscribe;
  }, []);

  const handleLanguageSelect = (code: LanguageCode) => {
    languageService.setLanguage(code);
    const lang = languageService.getCurrentLanguage();
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: colors.background,
      borderRadius: 20,
      width: '85%',
      maxHeight: '70%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
    },
    closeButton: {
      padding: 8,
    },
    closeText: {
      fontSize: 24,
      color: colors.muted,
    },
    list: {
      padding: 8,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginVertical: 4,
      backgroundColor: colors.surface,
    },
    languageItemSelected: {
      backgroundColor: colors.primary + '20',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    flag: {
      fontSize: 28,
      marginRight: 12,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
    },
    nativeName: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 2,
    },
    checkmark: {
      fontSize: 20,
      color: colors.primary,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🌐 Select Language</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  currentLanguage.code === lang.code && styles.languageItemSelected,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.nativeName}>{lang.nativeName}</Text>
                </View>
                {currentLanguage.code === lang.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Language affects accessibility audio announcements
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default LanguageSelector;
