 * Macro Voice Recording Service
 * MediVac WACHS v8.9
 * 
 * Provides personalized voice phrase recording for macro triggers
 * with voice recognition training, speaker verification, and waveform visualization.
 */

export type RecordingState = 'idle' | 'preparing' | 'recording' | 'processing' | 'analyzing' | 'complete' | 'error';
export type VoiceQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface VoiceProfile {
  id: string;
  name: string;
  userId: string;
  voicePrint: VoicePrint;
  samples: VoiceSample[];
  trainingProgress: number; // 0-100
  isActive: boolean;
  isVerified: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  settings: VoiceProfileSettings;
}

export interface VoicePrint {
  id: string;
  features: number[]; // Voice feature vector
  frequency: { min: number; max: number; avg: number };
  pitch: { min: number; max: number; avg: number };
  tempo: number;
  uniquePatterns: string[];
  confidence: number;
  generatedAt: number;
}

export interface VoiceSample {
  id: string;
  phrase: string;
  audioUri: string;
  duration: number;
  waveform: number[]; // Amplitude values for visualization
  spectrogram: number[][]; // Frequency data
  quality: VoiceQuality;
  noiseLevel: number;
  recordedAt: number;
  isTrainingSample: boolean;
}

export interface VoiceProfileSettings {
  sensitivity: number; // 1-10
  noiseGate: number; // 0-100
  requireVerification: boolean;
  allowBackgroundNoise: boolean;
  minConfidence: number; // 0-1
  maxResponseTime: number; // ms
  feedbackMode: 'silent' | 'beep' | 'voice' | 'haptic' | 'full';
}

export interface VoiceTrigger {
  id: string;
  profileId: string;
  phrase: string;
  macroId: string;
  samples: VoiceSample[];
  confidence: number;
  isEnabled: boolean;
  activationCount: number;
  lastActivatedAt?: number;
  createdAt: number;
}

export interface RecordingSession {
  id: string;
  profileId: string;
  state: RecordingState;
  targetPhrase?: string;
  currentSample?: VoiceSample;
  samples: VoiceSample[];
  startedAt: number;
  completedAt?: number;
  error?: string;
  feedback: RecordingFeedback;
}

export interface RecordingFeedback {
  visualizer: WaveformData;
  quality: VoiceQuality;
  volume: number;
  noiseLevel: number;
  isClipping: boolean;
  isTooQuiet: boolean;
  suggestions: string[];
}

export interface WaveformData {
  amplitudes: number[];
  frequencies: number[];