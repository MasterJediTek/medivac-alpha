import { describe, it, expect, beforeEach } from 'vitest';
import { videoWitnessVerificationService } from '../video-witness-verification-service';
import { templateSharingPortalService } from '../template-sharing-portal-service';
import { signatureBiometricsService } from '../signature-biometrics-service';
import { professionalStoryboardEngineService } from '../professional-storyboard-engine-service';
import { medicalVoiceoverSoundService } from '../medical-voiceover-sound-service';
import { appStoreDistributionService } from '../app-store-distribution-service';
import { patientPortalGamingEngineService } from '../patient-portal-gaming-engine-service';

describe('Video Witness Verification Service', () => {
  beforeEach(() => {
    videoWitnessVerificationService.reset();
  });

  it('should create a recording', () => {
    const recording = videoWitnessVerificationService.createRecording(
      'session_123',
      'doc_123',
      'Test AHD'
    );
    expect(recording).toBeDefined();
    expect(recording.documentId).toBe('doc_123');
    expect(recording.documentTitle).toBe('Test AHD');
    expect(recording.status).toBe('idle');
  });

  it('should get all recordings', () => {
    videoWitnessVerificationService.createRecording('s1', 'doc_1', 'Doc 1');
    videoWitnessVerificationService.createRecording('s2', 'doc_2', 'Doc 2');
    
    const recordings = videoWitnessVerificationService.getAllRecordings();
    expect(recordings.length).toBe(2);
  });

  it('should get analytics', () => {
    const analytics = videoWitnessVerificationService.getAnalytics();
    expect(analytics).toBeDefined();
  });
});

describe('Template Sharing Portal Service', () => {
  beforeEach(() => {
    templateSharingPortalService.reset();
  });

  it('should get all templates', () => {
    const templates = templateSharingPortalService.getAllTemplates();
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get public templates', () => {
    const templates = templateSharingPortalService.getPublicTemplates();
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should create share link', () => {
    const templates = templateSharingPortalService.getAllTemplates();
    const template = templates[0];
    
    const shareLink = templateSharingPortalService.createShareLink(
      template.id,
      'provider_001'
    );
    
    expect(shareLink).toBeDefined();
    expect(shareLink?.shortUrl).toContain('https://');
  });

  it('should get analytics', () => {
    const analytics = templateSharingPortalService.getAnalytics();
    expect(analytics).toBeDefined();
  });
});

describe('Signature Biometrics Service', () => {
  beforeEach(() => {
    signatureBiometricsService.reset();
  });

  it('should create enrollment', () => {
    const enrollment = signatureBiometricsService.createEnrollment('user_123', 'John Doe');
    expect(enrollment).toBeDefined();
    expect(enrollment.userId).toBe('user_123');
    expect(enrollment.userName).toBe('John Doe');
  });

  it('should get enrollment by user', () => {
    signatureBiometricsService.createEnrollment('user_123', 'John Doe');
    
    const enrollment = signatureBiometricsService.getEnrollmentByUser('user_123');
    expect(enrollment).toBeDefined();
    expect(enrollment?.userId).toBe('user_123');
  });

  it('should get analytics', () => {
    const analytics = signatureBiometricsService.getAnalytics();
    expect(analytics).toBeDefined();
  });
});

describe('Professional Storyboard Engine Service', () => {
  beforeEach(() => {
    professionalStoryboardEngineService.reset();
  });

  it('should create a journey', () => {
    const journey = professionalStoryboardEngineService.createJourney(
      'Patient Onboarding',
      'Welcome to the patient portal',
      'onboarding',
      'patient'
    );
    expect(journey).toBeDefined();
    expect(journey.name).toBe('Patient Onboarding');
    expect(journey.category).toBe('onboarding');
  });

  it('should add scenes to journey', () => {
    const journey = professionalStoryboardEngineService.createJourney(
      'Test Journey',
      'Test description',
      'tutorial',
      'patient'
    );
    
    const scene = professionalStoryboardEngineService.addScene(journey.id, {
      title: 'Welcome Scene',
      narration: 'Welcome to WACHS',
      duration: 5000,
      type: 'intro',
      background: { type: 'solid', value: '#FFFFFF' },
      elements: [],
    });
    
    expect(scene).toBeDefined();
    expect(scene?.title).toBe('Welcome Scene');
  });

  it('should get all journeys', () => {
    const journeys = professionalStoryboardEngineService.getAllJourneys();
    expect(journeys).toBeDefined();
  });

  it('should get analytics', () => {
    const analytics = professionalStoryboardEngineService.getAnalytics();
    expect(analytics).toBeDefined();
  });
});

describe('Medical Voiceover Sound Service', () => {
  beforeEach(() => {
    medicalVoiceoverSoundService.reset();
  });

  it('should get all voice profiles', () => {
    const voices = medicalVoiceoverSoundService.getAllVoiceProfiles();
    expect(voices.length).toBeGreaterThan(0);
  });

  it('should get all sounds', () => {
    const sounds = medicalVoiceoverSoundService.getAllSounds();
    expect(sounds.length).toBeGreaterThan(0);
  });

  it('should get all scripts', () => {
    const scripts = medicalVoiceoverSoundService.getAllScripts();
    expect(scripts.length).toBeGreaterThan(0);
  });

  it('should get analytics', () => {
    const analytics = medicalVoiceoverSoundService.getAnalytics();
    expect(analytics).toBeDefined();
  });
});

describe('App Store Distribution Service', () => {
  it('should get store requirements', () => {
    const requirements = appStoreDistributionService.getStoreRequirements('google_play');
    expect(requirements).toBeDefined();
    expect(requirements.iconSize).toBe('512x512');
  });

  it('should validate metadata', () => {
    const validation = appStoreDistributionService.validateMetadata('apple_app_store');
    expect(validation).toBeDefined();
    expect(validation.valid).toBeDefined();
  });

  it('should get analytics', async () => {
    const analytics = await appStoreDistributionService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalSubmissions).toBeDefined();
  });
});

describe('Patient Portal Gaming Engine Service', () => {
  beforeEach(() => {
    patientPortalGamingEngineService.reset();
  });

  it('should create a player', () => {
    const player = patientPortalGamingEngineService.createPlayer('John', 'patient');
    expect(player).toBeDefined();
    expect(player.name).toBe('John');
    expect(player.role).toBe('patient');
    expect(player.level).toBe(1);
  });

  it('should get map locations', () => {
    const map = patientPortalGamingEngineService.getMap();
    expect(map.length).toBeGreaterThan(0);
  });

  it('should move to location', () => {
    patientPortalGamingEngineService.createPlayer('John', 'patient');
    const location = patientPortalGamingEngineService.moveToLocation('loc_reception');
    expect(location).toBeDefined();
    expect(location?.zone).toBe('reception');
  });

  it('should adopt a pet', () => {
    patientPortalGamingEngineService.createPlayer('John', 'patient');
    const pet = patientPortalGamingEngineService.adoptPet('Buddy', 'dog');
    expect(pet).toBeDefined();
    expect(pet.name).toBe('Buddy');
    expect(pet.type).toBe('dog');
  });

  it('should get available quests', () => {
    const quests = patientPortalGamingEngineService.getAvailableQuests();
    expect(quests.length).toBeGreaterThan(0);
  });

  it('should start a quest', () => {
    patientPortalGamingEngineService.createPlayer('John', 'patient');
    const quest = patientPortalGamingEngineService.startQuest('quest_welcome');
    expect(quest).toBeDefined();
    expect(quest?.status).toBe('active');
  });

  it('should get achievements', () => {
    const achievements = patientPortalGamingEngineService.getAchievements();
    expect(achievements.length).toBeGreaterThan(0);
  });

  it('should interact with pet', () => {
    patientPortalGamingEngineService.createPlayer('John', 'patient');
    const pet = patientPortalGamingEngineService.adoptPet('Buddy', 'dog');
    
    const fed = patientPortalGamingEngineService.feedPet(pet.id);
    expect(fed).toBe(true);
    
    const played = patientPortalGamingEngineService.playWithPet(pet.id);
    expect(played).toBe(true);
    
    const petted = patientPortalGamingEngineService.petThePet(pet.id);
    expect(petted).toBe(true);
  });

  it('should get analytics', () => {
    patientPortalGamingEngineService.createPlayer('John', 'patient');
    const analytics = patientPortalGamingEngineService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalPlayers).toBe(1);
  });
});
