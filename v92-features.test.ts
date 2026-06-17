/**
 * Tests for MediVac WACHS v9.2 Features
 * - Advanced Health Directive (AHD) Service
 * - Browser Installation Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { advancedHealthDirectiveService } from '../advanced-health-directive-service';
import { browserInstallationService } from '../browser-installation-service';

describe('Advanced Health Directive Service', () => {
  beforeEach(() => {
    advancedHealthDirectiveService.reset();
  });

  describe('Document Management', () => {
    it('should create a new AHD document', () => {
      const doc = advancedHealthDirectiveService.createDocument(true);
      
      expect(doc).toBeDefined();
      expect(doc.id).toContain('ahd_');
      expect(doc.status).toBe('draft');
      expect(doc.isGuestSubmission).toBe(true);
    });

    it('should create document with guest email', () => {
      const doc = advancedHealthDirectiveService.createDocument(true, 'test@example.com');
      
      expect(doc.guestEmail).toBe('test@example.com');
    });

    it('should get current document', () => {
      advancedHealthDirectiveService.createDocument(false);
      const doc = advancedHealthDirectiveService.getCurrentDocument();
      
      expect(doc).toBeDefined();
      expect(doc?.isGuestSubmission).toBe(false);
    });

    it('should get all documents', () => {
      advancedHealthDirectiveService.createDocument(true);
      advancedHealthDirectiveService.createDocument(false);
      
      const docs = advancedHealthDirectiveService.getAllDocuments();
      expect(docs.length).toBe(2);
    });
  });

  describe('Wizard Navigation', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should start at welcome step', () => {
      const step = advancedHealthDirectiveService.getCurrentStep();
      expect(step).toBe('welcome');
    });

    it('should navigate to next step', () => {
      const nextStep = advancedHealthDirectiveService.nextStep();
      expect(nextStep).toBe('personal-details');
    });

    it('should navigate to previous step', () => {
      advancedHealthDirectiveService.nextStep(); // go to personal-details
      const prevStep = advancedHealthDirectiveService.previousStep();
      expect(prevStep).toBe('welcome');
    });

    it('should go to specific step', () => {
      advancedHealthDirectiveService.goToStep('values-wishes');
      const step = advancedHealthDirectiveService.getCurrentStep();
      expect(step).toBe('values-wishes');
    });

    it('should get step info', () => {
      const info = advancedHealthDirectiveService.getStepInfo('welcome');
      
      expect(info.title).toBe('Welcome to the AHD Wizard');
      expect(info.index).toBe(1);
      expect(info.total).toBe(12);
    });

    it('should get all steps', () => {
      const steps = advancedHealthDirectiveService.getAllSteps();
      expect(steps.length).toBe(12);
      expect(steps[0].step).toBe('welcome');
      expect(steps[steps.length - 1].step).toBe('complete');
    });
  });

  describe('Personal Details', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should update personal details', () => {
      const doc = advancedHealthDirectiveService.updatePersonalDetails({
        fullName: 'John Smith',
        dateOfBirth: '01/01/1970',
      });
      
      expect(doc?.personalDetails.fullName).toBe('John Smith');
      expect(doc?.personalDetails.dateOfBirth).toBe('01/01/1970');
    });

    it('should default state to WA', () => {
      const doc = advancedHealthDirectiveService.getCurrentDocument();
      expect(doc?.personalDetails.state).toBe('WA');
    });
  });

  describe('Treatment Decision Makers', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should add treatment decision maker', () => {
      const tdm = advancedHealthDirectiveService.addTreatmentDecisionMaker({
        fullName: 'Jane Doe',
        relationship: 'Spouse',
        address: '123 Main St',
        phone: '0400000000',
        email: 'jane@example.com',
        isPrimary: true,
        acceptedAppointment: true,
      });
      
      expect(tdm.id).toContain('tdm_');
      expect(tdm.fullName).toBe('Jane Doe');
      expect(tdm.isPrimary).toBe(true);
    });

    it('should remove treatment decision maker', () => {
      const tdm = advancedHealthDirectiveService.addTreatmentDecisionMaker({
        fullName: 'Jane Doe',
        relationship: 'Spouse',
        address: '',
        phone: '',
        email: '',
        isPrimary: true,
        acceptedAppointment: false,
      });
      
      const result = advancedHealthDirectiveService.removeTreatmentDecisionMaker(tdm.id);
      expect(result).toBe(true);
      
      const doc = advancedHealthDirectiveService.getCurrentDocument();
      expect(doc?.treatmentDecisionMakers.length).toBe(0);
    });
  });

  describe('Values and Wishes', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should update values and wishes', () => {
      const doc = advancedHealthDirectiveService.updateValuesAndWishes({
        qualityOfLife: 'Being able to communicate with family',
        importantActivities: 'Reading, gardening',
      });
      
      expect(doc?.valuesAndWishes.qualityOfLife).toBe('Being able to communicate with family');
      expect(doc?.valuesAndWishes.importantActivities).toBe('Reading, gardening');
    });
  });

  describe('Treatment Decisions', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should get life sustaining treatments list', () => {
      const treatments = advancedHealthDirectiveService.getLifeSustainingTreatments();
      
      expect(treatments.length).toBe(8);
      expect(treatments.some(t => t.id === 'cardiopulmonary-resuscitation')).toBe(true);
      expect(treatments.some(t => t.id === 'palliative-care')).toBe(true);
    });

    it('should update treatment decision', () => {
      const decision = advancedHealthDirectiveService.updateTreatmentDecision(
        'cardiopulmonary-resuscitation',
        'do-not-want',
        'Unless reversible cause',
        'Discussed with family'
      );
      
      expect(decision?.preference).toBe('do-not-want');
      expect(decision?.conditions).toBe('Unless reversible cause');
    });

    it('should get treatment decision', () => {
      advancedHealthDirectiveService.updateTreatmentDecision('dialysis', 'want');
      
      const decision = advancedHealthDirectiveService.getTreatmentDecision('dialysis');
      expect(decision?.preference).toBe('want');
    });
  });

  describe('Organ Donation', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should update organ donation preferences', () => {
      const doc = advancedHealthDirectiveService.updateOrganDonation({
        wantsToDonate: true,
        registeredWithDonateLife: true,
        notes: 'Happy to donate all organs',
      });
      
      expect(doc?.organDonation.wantsToDonate).toBe(true);
      expect(doc?.organDonation.registeredWithDonateLife).toBe(true);
    });
  });

  describe('Signatures', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should add maker signature', () => {
      const signature = advancedHealthDirectiveService.addMakerSignature(
        'base64signaturedata',
        'John Smith'
      );
      
      expect(signature.signedBy).toBe('maker');
      expect(signature.fullName).toBe('John Smith');
    });
  });

  describe('Witnesses', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should add witness', () => {
      const witness = advancedHealthDirectiveService.addWitness({
        fullName: 'Witness One',
        address: '456 Other St',
        occupation: 'Teacher',
        phone: '0411111111',
        email: 'witness@example.com',
        isQualified: true,
      });
      
      expect(witness.id).toContain('witness_');
      expect(witness.fullName).toBe('Witness One');
    });

    it('should add witness signature', () => {
      const witness = advancedHealthDirectiveService.addWitness({
        fullName: 'Witness One',
        address: '',
        occupation: '',
        phone: '',
        email: '',
        isQualified: true,
      });
      
      const updated = advancedHealthDirectiveService.addWitnessSignature(
        witness.id,
        'witnessSignatureData'
      );
      
      expect(updated?.signature).toBe('witnessSignatureData');
      expect(updated?.signedAt).toBeDefined();
    });

    it('should limit to 2 witnesses', () => {
      advancedHealthDirectiveService.addWitness({
        fullName: 'Witness 1',
        address: '',
        occupation: '',
        phone: '',
        email: '',
        isQualified: true,
      });
      advancedHealthDirectiveService.addWitness({
        fullName: 'Witness 2',
        address: '',
        occupation: '',
        phone: '',
        email: '',
        isQualified: true,
      });
      
      expect(() => {
        advancedHealthDirectiveService.addWitness({
          fullName: 'Witness 3',
          address: '',
          occupation: '',
          phone: '',
          email: '',
          isQualified: true,
        });
      }).toThrow('Maximum 2 witnesses allowed');
    });
  });

  describe('PDF Generation', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
      advancedHealthDirectiveService.updatePersonalDetails({
        fullName: 'Test User',
        dateOfBirth: '01/01/1980',
        address: '123 Test St',
      });
    });

    it('should generate PDF', () => {
      const result = advancedHealthDirectiveService.generatePDF();
      
      expect(result.success).toBe(true);
      expect(result.filename).toContain('AHD_Test_User');
      expect(result.filename).toContain('.pdf');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      advancedHealthDirectiveService.createDocument(true);
    });

    it('should validate incomplete document', () => {
      const validation = advancedHealthDirectiveService.validateDocument();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Full name is required');
    });
  });

  describe('Analytics', () => {
    it('should track analytics', () => {
      advancedHealthDirectiveService.createDocument(true);
      advancedHealthDirectiveService.createDocument(false);
      
      const analytics = advancedHealthDirectiveService.getAnalytics();
      
      expect(analytics.totalDocuments).toBe(2);
      expect(analytics.guestSubmissions).toBe(1);
    });
  });

  describe('Export/Import', () => {
    it('should export document', () => {
      advancedHealthDirectiveService.createDocument(true);
      advancedHealthDirectiveService.updatePersonalDetails({ fullName: 'Export Test' });
      
      const json = advancedHealthDirectiveService.exportDocument();
      const parsed = JSON.parse(json);
      
      expect(parsed.personalDetails.fullName).toBe('Export Test');
    });

    it('should import document', () => {
      const originalDoc = advancedHealthDirectiveService.createDocument(true);
      advancedHealthDirectiveService.updatePersonalDetails({ fullName: 'Import Test' });
      const json = advancedHealthDirectiveService.exportDocument();
      
      advancedHealthDirectiveService.reset();
      const imported = advancedHealthDirectiveService.importDocument(json);
      
      expect(imported.personalDetails.fullName).toBe('Import Test');
      expect(imported.id).toContain('ahd_imported_');
    });
  });
});

describe('Browser Installation Service', () => {
  beforeEach(() => {
    browserInstallationService.reset();
  });

  describe('Browser Info', () => {
    it('should get JediTek browser info', () => {
      const info = browserInstallationService.getBrowserInfo('jeditek');
      
      expect(info.name).toBe('JediTek');
      expect(info.fullName).toBe('JediTek Browser');
      expect(info.features).toContain('Built-in VPN protection');
    });

    it('should get WONGI browser info', () => {
      const info = browserInstallationService.getBrowserInfo('wongi');
      
      expect(info.name).toBe('WONGI');
      expect(info.fullName).toBe('WONGI Browser');
      expect(info.features).toContain('Low-bandwidth optimization');
    });

    it('should get all browsers', () => {
      const browsers = browserInstallationService.getAllBrowsers();
      
      expect(browsers.length).toBe(2);
      expect(browsers.some(b => b.id === 'jeditek')).toBe(true);
      expect(browsers.some(b => b.id === 'wongi')).toBe(true);
    });
  });

  describe('Feature Comparison', () => {
    it('should get feature comparison', () => {
      const comparison = browserInstallationService.getFeatureComparison();
      
      expect(comparison.length).toBeGreaterThan(0);
      expect(comparison.some(f => f.feature === 'Built-in VPN')).toBe(true);
    });

    it('should get features by category', () => {
      const byCategory = browserInstallationService.getFeaturesByCategory();
      
      expect(byCategory['Security']).toBeDefined();
      expect(byCategory['Performance']).toBeDefined();
      expect(byCategory['Health']).toBeDefined();
    });
  });

  describe('Installation', () => {
    it('should start installation', () => {
      const installation = browserInstallationService.startInstallation('jeditek', 'ios');
      
      expect(installation.id).toContain('install_jeditek_');
      expect(installation.browser).toBe('jeditek');
      expect(installation.platform).toBe('ios');
      expect(installation.status).toBe('downloading');
    });

    it('should get installation', () => {
      const installation = browserInstallationService.startInstallation('wongi', 'android');
      const retrieved = browserInstallationService.getInstallation(installation.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.browser).toBe('wongi');
    });

    it('should get all installations', () => {
      browserInstallationService.startInstallation('jeditek', 'ios');
      browserInstallationService.startInstallation('wongi', 'android');
      
      const installations = browserInstallationService.getAllInstallations();
      expect(installations.length).toBe(2);
    });

    it('should cancel installation', () => {
      const installation = browserInstallationService.startInstallation('jeditek', 'web');
      const result = browserInstallationService.cancelInstallation(installation.id);
      
      expect(result).toBe(true);
      const updated = browserInstallationService.getInstallation(installation.id);
      expect(updated?.status).toBe('error');
    });
  });

  describe('Shared Tasks', () => {
    it('should create shared task', () => {
      const task = browserInstallationService.createSharedTask(
        'Test Task',
        'A test shared task',
        'jeditek',
        'open-url',
        'https://example.com'
      );
      
      expect(task.id).toContain('task_');
      expect(task.name).toBe('Test Task');
      expect(task.browser).toBe('jeditek');
      expect(task.status).toBe('pending');
    });

    it('should execute shared task', () => {
      const task = browserInstallationService.createSharedTask(
        'Execute Test',
        'Test execution',
        'wongi',
        'test-action'
      );
      
      const executed = browserInstallationService.executeSharedTask(task.id);
      expect(executed?.status).toBe('in-progress');
    });

    it('should get tasks by browser', () => {
      browserInstallationService.createSharedTask('Task 1', '', 'jeditek', 'action1');
      browserInstallationService.createSharedTask('Task 2', '', 'wongi', 'action2');
      browserInstallationService.createSharedTask('Task 3', '', 'jeditek', 'action3');
      
      const jeditechTasks = browserInstallationService.getSharedTasksByBrowser('jeditek');
      expect(jeditechTasks.length).toBe(2);
    });
  });

  describe('Quick Actions', () => {
    it('should open AHD wizard', () => {
      const task = browserInstallationService.openAHDWizard('wongi');
      
      expect(task.action).toBe('open-ahd-wizard');
      expect(task.url).toContain('wongi.com.au');
    });

    it('should open health portal', () => {
      const task = browserInstallationService.openHealthPortal('jeditek');
      
      expect(task.action).toBe('open-health-portal');
      expect(task.url).toContain('jeditek.com.au');
    });
  });

  describe('Deep Links', () => {
    it('should generate JediTek deep link', () => {
      const link = browserInstallationService.getDeepLink('jeditek', 'open', { url: 'https://test.com' });
      
      expect(link).toBe('jeditek://open?url=https%3A%2F%2Ftest.com');
    });

    it('should generate WONGI deep link', () => {
      const link = browserInstallationService.getDeepLink('wongi', 'health');
      
      expect(link).toBe('wongi://health');
    });
  });

  describe('Install Links', () => {
    it('should get iOS install link', () => {
      const link = browserInstallationService.getInstallLink('jeditek', 'ios');
      expect(link).toContain('apps.apple.com');
    });

    it('should get Android install link', () => {
      const link = browserInstallationService.getInstallLink('wongi', 'android');
      expect(link).toContain('play.google.com');
    });

    it('should get web link', () => {
      const link = browserInstallationService.getInstallLink('jeditek', 'web');
      expect(link).toBe('https://jeditek-bro.manus.space');
    });
  });

  describe('Analytics', () => {
    it('should track installation analytics', () => {
      browserInstallationService.startInstallation('jeditek', 'ios');
      browserInstallationService.startInstallation('wongi', 'android');
      
      const analytics = browserInstallationService.getAnalytics();
      
      expect(analytics.totalInstallations).toBe(2);
      expect(analytics.jeditechInstalls).toBe(1);
      expect(analytics.wongiInstalls).toBe(1);
      expect(analytics.platformBreakdown.ios).toBe(1);
      expect(analytics.platformBreakdown.android).toBe(1);
    });

    it('should track shared task analytics', () => {
      browserInstallationService.createSharedTask('Task 1', '', 'jeditek', 'action');
      browserInstallationService.createSharedTask('Task 2', '', 'wongi', 'action');
      
      const analytics = browserInstallationService.getAnalytics();
      expect(analytics.sharedTasksCreated).toBe(2);
    });
  });
});
