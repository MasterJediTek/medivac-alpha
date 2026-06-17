import { describe, it, expect, beforeEach } from 'vitest';
import { languageService } from '../language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    // Reset to default language
    languageService.setLanguage('en-AU');
  });

  describe('getAvailableLanguages', () => {
    it('should return list of available languages', () => {
      const languages = languageService.getAvailableLanguages();
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.some(l => l.code === 'en-AU')).toBe(true);
    });

    it('should include 8 languages', () => {
      const languages = languageService.getAvailableLanguages();
      expect(languages.length).toBe(8);
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return current language', () => {
      const lang = languageService.getCurrentLanguage();
      expect(lang).toBeDefined();
      expect(lang.code).toBe('en-AU');
    });
  });

  describe('setLanguage', () => {
    it('should change current language', () => {
      languageService.setLanguage('es-ES');
      expect(languageService.getCurrentLanguageCode()).toBe('es-ES');
    });

    it('should return false for invalid language', () => {
      const result = languageService.setLanguage('invalid' as any);
      expect(result).toBe(false);
    });
  });

  describe('translate', () => {
    it('should translate elevator in English AU', () => {
      languageService.setLanguage('en-AU');
      expect(languageService.translate('elevator')).toBe('Elevator');
    });

    it('should translate elevator in Spanish', () => {
      languageService.setLanguage('es-ES');
      expect(languageService.translate('elevator')).toBe('Ascensor');
    });

    it('should translate elevator in Chinese', () => {
      languageService.setLanguage('zh-CN');
      expect(languageService.translate('elevator')).toBe('电梯');
    });

    it('should translate elevator in Japanese', () => {
      languageService.setLanguage('ja-JP');
      expect(languageService.translate('elevator')).toBe('エレベーター');
    });

    it('should use UK English lift instead of elevator', () => {
      languageService.setLanguage('en-GB');
      expect(languageService.translate('elevator')).toBe('Lift');
    });
  });

  describe('getTranslations', () => {
    it('should return all translations for current language', () => {
      const translations = languageService.getTranslations();
      expect(translations).toBeDefined();
      expect(translations.elevator).toBeDefined();
      expect(translations.arrived).toBeDefined();
    });
  });

  describe('getVoiceId', () => {
    it('should return voice ID for current language', () => {
      languageService.setLanguage('en-AU');
      expect(languageService.getVoiceId()).toBe('en-AU');
    });

    it('should return Spanish voice ID', () => {
      languageService.setLanguage('es-ES');
      expect(languageService.getVoiceId()).toBe('es-ES');
    });
  });

  describe('formatDistance', () => {
    it('should format distance with AU units', () => {
      languageService.setLanguage('en-AU');
      expect(languageService.formatDistance(50)).toBe('50 metres');
    });

    it('should format distance with US units', () => {
      languageService.setLanguage('en-US');
      expect(languageService.formatDistance(50)).toBe('50 meters');
    });

    it('should format distance in Chinese', () => {
      languageService.setLanguage('zh-CN');
      expect(languageService.formatDistance(50)).toBe('50 米');
    });
  });

  describe('formatTime', () => {
    it('should format seconds', () => {
      languageService.setLanguage('en-AU');
      expect(languageService.formatTime(30)).toBe('30 seconds');
    });

    it('should format minutes', () => {
      languageService.setLanguage('en-AU');
      expect(languageService.formatTime(120)).toBe('2 minutes');
    });

    it('should format time in Spanish', () => {
      languageService.setLanguage('es-ES');
      expect(languageService.formatTime(60)).toBe('1 minutos');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners of language changes', () => {
      let notified = false;
      const unsubscribe = languageService.subscribe(() => {
        notified = true;
      });
      
      languageService.setLanguage('es-ES');
      expect(notified).toBe(true);
      unsubscribe();
    });
  });
});
