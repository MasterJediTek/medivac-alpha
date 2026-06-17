/**
 * Tests for MediVac WACHS v9.4 Features
 * - Live Witness Verification with GPS logging
 * - Document Templates Library
 * - Multi-Language Support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { liveWitnessVerificationService } from '../live-witness-verification-service';
import { documentTemplatesLibraryService } from '../document-templates-library-service';
import { multiLanguageSupportService } from '../multi-language-support-service';

describe('Live Witness Verification Service', () => {
  beforeEach(() => {
    liveWitnessVerificationService.reset();
  });

  it('should start a signing session', async () => {
    const session = liveWitnessVerificationService.createSession(
      'DOC-001',
      'ahd',
      'Test AHD Document',
      'John Smith'
    );

    expect(session).toBeDefined();
    expect(session.documentId).toBe('DOC-001');
    expect(session.documentTitle).toBe('Test AHD Document');
    expect(session.status).toBe('pending');
    expect(session.maker).toBeNull();
    expect(session.witnesses).toHaveLength(0);
  });

  it('should capture signature with GPS coordinates', async () => {
    const session = liveWitnessVerificationService.createSession(
      'DOC-002',
      'ahd',
      'Test Document',
      'Test Maker'
    );

    const signature = await liveWitnessVerificationService.recordSignature(
      session.id,
      'maker',
      'Test Maker',
      'data:image/png;base64,test'
    );

    expect(signature).toBeDefined();
    expect(signature!.role).toBe('maker');
    expect(signature!.gps).toBeDefined();
    expect(signature!.signedAt).toBeDefined();
  });

  it('should complete session when all signatures captured', async () => {
    const session = liveWitnessVerificationService.createSession(
      'DOC-003',
      'ahd',
      'Test Document',
      'Maker Name'
    );

    await liveWitnessVerificationService.recordSignature(session.id, 'maker', 'Maker', 'sig1');
    await liveWitnessVerificationService.recordSignature(session.id, 'witness1', 'W1', 'sig2', { relationship: 'Friend', occupation: 'Teacher' });
    await liveWitnessVerificationService.recordSignature(session.id, 'witness2', 'W2', 'sig3', { relationship: 'Neighbor', occupation: 'Nurse' });

    const updatedSession = liveWitnessVerificationService.getSession(session.id);
    expect(updatedSession?.status).toBe('completed');
    expect(updatedSession?.maker).not.toBeNull();
    expect(updatedSession?.witnesses.length).toBe(2);
  });

  it('should generate document footer with GPS coordinates', async () => {
    const session = liveWitnessVerificationService.createSession(
      'DOC-004',
      'ahd',
      'Test Document',
      'Footer Test'
    );

    await liveWitnessVerificationService.recordSignature(session.id, 'maker', 'Test', 'sig');

    const footer = liveWitnessVerificationService.generateDocumentFooter(session.id);
    expect(footer).toBeDefined();
  });

  it('should track analytics', async () => {
    liveWitnessVerificationService.createSession('DOC-005', 'ahd', 'Test', 'Analytics Test');

    const analytics = liveWitnessVerificationService.getAnalytics();
    expect(analytics.totalSessions).toBeGreaterThan(0);
    expect(analytics).toHaveProperty('completedSessions');
    expect(analytics).toHaveProperty('totalSignatures');
  });
});

describe('Document Templates Library Service', () => {
  beforeEach(() => {
    documentTemplatesLibraryService.reset();
  });

  it('should get all templates', () => {
    const templates = documentTemplatesLibraryService.getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get templates by category', () => {
    const palliativeTemplates = documentTemplatesLibraryService.getTemplatesByCategory('palliative_care');
    expect(palliativeTemplates.length).toBeGreaterThan(0);
    palliativeTemplates.forEach(t => {
      expect(t.metadata.category).toBe('palliative_care');
    });
  });

  it('should search templates', () => {
    const results = documentTemplatesLibraryService.searchTemplates('dementia');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get popular templates', () => {
    const popular = documentTemplatesLibraryService.getPopularTemplates(3);
    expect(popular.length).toBeLessThanOrEqual(3);
    
    // Should be sorted by usage count
    for (let i = 1; i < popular.length; i++) {
      expect(popular[i - 1].metadata.usageCount).toBeGreaterThanOrEqual(popular[i].metadata.usageCount);
    }
  });

  it('should manage favorites', () => {
    const templates = documentTemplatesLibraryService.getAllTemplates();
    const templateId = templates[0].metadata.id;

    documentTemplatesLibraryService.addToFavorites(templateId);
    expect(documentTemplatesLibraryService.isFavorite(templateId)).toBe(true);

    const favorites = documentTemplatesLibraryService.getFavorites();
    expect(favorites.length).toBe(1);

    documentTemplatesLibraryService.removeFromFavorites(templateId);
    expect(documentTemplatesLibraryService.isFavorite(templateId)).toBe(false);
  });

  it('should use template and track usage', () => {
    const templates = documentTemplatesLibraryService.getAllTemplates();
    const template = templates[0];
    const initialUsage = template.metadata.usageCount;

    documentTemplatesLibraryService.useTemplate(template.metadata.id);

    const updatedTemplate = documentTemplatesLibraryService.getTemplate(template.metadata.id);
    expect(updatedTemplate?.metadata.usageCount).toBe(initialUsage + 1);
  });

  it('should get categories with counts', () => {
    const categories = documentTemplatesLibraryService.getCategories();
    expect(categories.length).toBeGreaterThan(0);
    
    categories.forEach(cat => {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('count');
    });
  });

  it('should export and import templates', () => {
    const templates = documentTemplatesLibraryService.getAllTemplates();
    const exported = documentTemplatesLibraryService.exportTemplate(templates[0].metadata.id);
    
    expect(exported).toBeTruthy();
    expect(exported.length).toBeGreaterThan(0);

    const imported = documentTemplatesLibraryService.importTemplate(exported);
    expect(imported).toBeDefined();
    expect(imported?.metadata.isOfficial).toBe(false);
  });

  it('should track analytics', () => {
    const analytics = documentTemplatesLibraryService.getAnalytics();
    
    expect(analytics.totalTemplates).toBeGreaterThan(0);
    expect(analytics).toHaveProperty('officialTemplates');
    expect(analytics).toHaveProperty('userTemplates');
    expect(analytics).toHaveProperty('averageRating');
    expect(analytics.byCategory.length).toBeGreaterThan(0);
  });
});

describe('Multi-Language Support Service', () => {
  beforeEach(() => {
    multiLanguageSupportService.reset();
  });

  it('should get supported languages', () => {
    const languages = multiLanguageSupportService.getSupportedLanguages();
    expect(languages.length).toBe(8);
    
    const englishAU = languages.find(l => l.code === 'en-AU');
    expect(englishAU).toBeDefined();
    expect(englishAU?.completeness).toBe(100);
  });

  it('should set and get current language', () => {
    expect(multiLanguageSupportService.getLanguage()).toBe('en-AU');

    multiLanguageSupportService.setLanguage('zh-CN');
    expect(multiLanguageSupportService.getLanguage()).toBe('zh-CN');
  });

  it('should translate keys', () => {
    const englishTitle = multiLanguageSupportService.translate('ahd.title');
    expect(englishTitle).toBe('Advanced Health Directive');

    multiLanguageSupportService.setLanguage('zh-CN');
    const chineseTitle = multiLanguageSupportService.translate('ahd.title');
    expect(chineseTitle).toBe('预先医疗指示');
  });

  it('should fallback to English for missing translations', () => {
    multiLanguageSupportService.setLanguage('hi-IN');
    const translation = multiLanguageSupportService.translate('nonexistent.key', 'Fallback Text');
    expect(translation).toBe('Fallback Text');
  });

  it('should get text direction for RTL languages', () => {
    multiLanguageSupportService.setLanguage('en-AU');
    expect(multiLanguageSupportService.getDirection()).toBe('ltr');

    multiLanguageSupportService.setLanguage('ar-SA');
    expect(multiLanguageSupportService.getDirection()).toBe('rtl');
  });

  it('should translate with variables', () => {
    // Using a key that might have variables
    const text = multiLanguageSupportService.translateWithVars(
      'ahd.title',
      { name: 'Test' },
      'Hello {{name}}'
    );
    expect(text).toBeDefined();
  });

  it('should get translations by category', () => {
    const personalTranslations = multiLanguageSupportService.getTranslationsByCategory('Personal Details');
    expect(personalTranslations.length).toBeGreaterThan(0);
    
    personalTranslations.forEach(t => {
      expect(t.category).toBe('Personal Details');
    });
  });

  it('should manage user language preferences', () => {
    multiLanguageSupportService.setUserLanguagePreference('user-123', 'vi-VN');
    const pref = multiLanguageSupportService.getUserLanguagePreference('user-123');
    expect(pref).toBe('vi-VN');

    const defaultPref = multiLanguageSupportService.getUserLanguagePreference('unknown-user');
    expect(defaultPref).toBe('en-AU');
  });

  it('should get language info', () => {
    const info = multiLanguageSupportService.getLanguageInfo('zh-CN');
    expect(info).toBeDefined();
    expect(info?.name).toBe('Mandarin Chinese');
    expect(info?.nativeName).toBe('简体中文');
    expect(info?.flag).toBe('🇨🇳');
  });

  it('should track analytics', () => {
    const analytics = multiLanguageSupportService.getAnalytics();
    
    expect(analytics.totalLanguages).toBe(8);
    expect(analytics.totalTranslations).toBeGreaterThan(0);
    expect(analytics.averageCompleteness).toBeGreaterThan(0);
    expect(analytics.byLanguage.length).toBe(8);
    expect(analytics.byCategory.length).toBeGreaterThan(0);
  });

  it('should use shorthand t() method', () => {
    const text = multiLanguageSupportService.t('action.save');
    expect(text).toBe('Save');
  });
});
