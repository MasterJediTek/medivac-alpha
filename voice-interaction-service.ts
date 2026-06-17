/**
 * MediVac One - Voice Interaction Service
 * Speech-to-text and text-to-speech for hands-free AI assistant operation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==========================================
// Types and Interfaces
// ==========================================

export type VoiceLanguage = 'en-AU' | 'en-US' | 'en-GB' | 'zh-CN' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'ko-KR' | 'vi-VN';

export interface VoiceConfig {
  language: VoiceLanguage;
  speechRate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  voiceId?: string;
  enableWakeWord: boolean;
  wakeWord: string;
  enableNoiseCancellation: boolean;
  enableContinuousListening: boolean;
  feedbackSounds: boolean;
  autoStopAfterSilence: number; // seconds
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  lastTranscription: string;
  confidence: number;
  error?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: { text: string; confidence: number }[];
  language: VoiceLanguage;
  duration: number;
}

export interface SpeechSynthesisOptions {
  text: string;
  language?: VoiceLanguage;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceId?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  onBoundary?: (event: { charIndex: number; word: string }) => void;
}

export interface VoiceCommand {
  pattern: RegExp;
  action: string;
  description: string;
  requiresConfirmation: boolean;
  parameters?: string[];
}

export interface WakeWordDetection {
  detected: boolean;
  wakeWord: string;
  confidence: number;
  timestamp: string;
}

export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number;
  transcription?: string;
  createdAt: string;
  type: 'clinical_note' | 'dictation' | 'command' | 'message';
}

// ==========================================
// Voice Commands Configuration
// ==========================================

const VOICE_COMMANDS: VoiceCommand[] = [
  // Navigation commands
  { pattern: /^(go to|open|show|navigate to) (.+)$/i, action: 'navigate', description: 'Navigate to a screen', requiresConfirmation: false, parameters: ['destination'] },
  { pattern: /^(back|go back|previous)$/i, action: 'go_back', description: 'Go to previous screen', requiresConfirmation: false },
  { pattern: /^(home|main menu|dashboard)$/i, action: 'go_home', description: 'Go to home screen', requiresConfirmation: false },
  
  // Patient commands
  { pattern: /^(find|search|look up) patient (.+)$/i, action: 'search_patient', description: 'Search for a patient', requiresConfirmation: false, parameters: ['query'] },
  { pattern: /^(view|show|open) patient (.+)$/i, action: 'view_patient', description: 'View patient record', requiresConfirmation: false, parameters: ['patientId'] },
  { pattern: /^(check in|checkin) (.+)$/i, action: 'check_in', description: 'Check in a patient', requiresConfirmation: true, parameters: ['patientName'] },
  
  // Clinical commands
  { pattern: /^record vitals?$/i, action: 'record_vitals', description: 'Start vital signs recording', requiresConfirmation: false },
  { pattern: /^(give|administer) medication$/i, action: 'give_medication', description: 'Start medication administration', requiresConfirmation: true },
  { pattern: /^(new|create) order$/i, action: 'new_order', description: 'Create new order', requiresConfirmation: false },
  { pattern: /^check (labs?|results?)$/i, action: 'check_labs', description: 'View laboratory results', requiresConfirmation: false },
  
  // Communication commands
  { pattern: /^(call|page|contact) (.+)$/i, action: 'contact', description: 'Contact a person or department', requiresConfirmation: false, parameters: ['target'] },
  { pattern: /^send message to (.+)$/i, action: 'send_message', description: 'Send a message', requiresConfirmation: true, parameters: ['recipient'] },
  { pattern: /^(read|check) messages$/i, action: 'read_messages', description: 'Read messages', requiresConfirmation: false },
  
  // Emergency commands
  { pattern: /^code blue$/i, action: 'code_blue', description: 'Activate Code Blue', requiresConfirmation: true },
  { pattern: /^code red$/i, action: 'code_red', description: 'Activate Code Red', requiresConfirmation: true },
  { pattern: /^rapid response$/i, action: 'rapid_response', description: 'Call rapid response team', requiresConfirmation: true },
  { pattern: /^emergency$/i, action: 'emergency', description: 'Emergency mode', requiresConfirmation: true },
  
  // Dictation commands
  { pattern: /^(start|begin) dictation$/i, action: 'start_dictation', description: 'Start clinical dictation', requiresConfirmation: false },
  { pattern: /^(stop|end) dictation$/i, action: 'stop_dictation', description: 'Stop dictation', requiresConfirmation: false },
  { pattern: /^save note$/i, action: 'save_note', description: 'Save clinical note', requiresConfirmation: true },
  
  // System commands
  { pattern: /^(help|what can you do)$/i, action: 'help', description: 'Show available commands', requiresConfirmation: false },
  { pattern: /^(stop|cancel|never mind)$/i, action: 'cancel', description: 'Cancel current action', requiresConfirmation: false },
  { pattern: /^(yes|confirm|proceed)$/i, action: 'confirm', description: 'Confirm action', requiresConfirmation: false },
  { pattern: /^(no|deny|cancel)$/i, action: 'deny', description: 'Deny action', requiresConfirmation: false },
];

// ==========================================
// Wake Words Configuration
// ==========================================

const WAKE_WORDS: Record<string, string[]> = {
  'doctor': ['Hey ARIA', 'Doctor ARIA', 'ARIA'],
  'nurse': ['Hey NOVA', 'Nurse NOVA', 'NOVA'],
  'receptionist': ['Hey RUBY', 'RUBY'],
  'emergency': ['Code Red', 'Emergency'],
  'jedi': ['Commander', 'JEDI Command'],
  'default': ['Hey MediVac', 'MediVac'],
};

// ==========================================
// Available Voices
// ==========================================

interface VoiceOption {
  id: string;
  name: string;
  language: VoiceLanguage;
  gender: 'male' | 'female' | 'neutral';
  quality: 'standard' | 'enhanced' | 'neural';
}

const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'en-AU-female-neural', name: 'Olivia (Australian)', language: 'en-AU', gender: 'female', quality: 'neural' },
  { id: 'en-AU-male-neural', name: 'James (Australian)', language: 'en-AU', gender: 'male', quality: 'neural' },
  { id: 'en-US-female-neural', name: 'Samantha (US)', language: 'en-US', gender: 'female', quality: 'neural' },
  { id: 'en-US-male-neural', name: 'Alex (US)', language: 'en-US', gender: 'male', quality: 'neural' },
  { id: 'en-GB-female-neural', name: 'Kate (British)', language: 'en-GB', gender: 'female', quality: 'neural' },
  { id: 'en-GB-male-neural', name: 'Daniel (British)', language: 'en-GB', gender: 'male', quality: 'neural' },
];

// ==========================================
// Feedback Sounds
// ==========================================

interface FeedbackSound {
  type: 'start_listening' | 'stop_listening' | 'command_recognized' | 'error' | 'confirmation' | 'alert';
  frequency: number;
  duration: number;
  volume: number;
}

const FEEDBACK_SOUNDS: FeedbackSound[] = [
  { type: 'start_listening', frequency: 880, duration: 100, volume: 0.3 },
  { type: 'stop_listening', frequency: 440, duration: 100, volume: 0.3 },
  { type: 'command_recognized', frequency: 660, duration: 150, volume: 0.4 },
  { type: 'error', frequency: 220, duration: 200, volume: 0.5 },
  { type: 'confirmation', frequency: 880, duration: 200, volume: 0.4 },
  { type: 'alert', frequency: 1000, duration: 300, volume: 0.6 },
];

// ==========================================
// Voice Interaction Service
// ==========================================

class VoiceInteractionService {
  private config: VoiceConfig;
  private state: VoiceState;
  private recordings: VoiceRecording[] = [];
  private commandHistory: { command: string; action: string; timestamp: string }[] = [];
  private listeners: Map<string, (event: any) => void> = new Map();

  constructor() {
    this.config = {
      language: 'en-AU',
      speechRate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      enableWakeWord: true,
      wakeWord: 'Hey MediVac',
      enableNoiseCancellation: true,
      enableContinuousListening: false,
      feedbackSounds: true,
      autoStopAfterSilence: 3,
    };

    this.state = {
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      lastTranscription: '',
      confidence: 0,
    };

    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem('voice_config');
      if (configData) {
        this.config = { ...this.config, ...JSON.parse(configData) };
      }

      const recordingsData = await AsyncStorage.getItem('voice_recordings');
      if (recordingsData) {
        this.recordings = JSON.parse(recordingsData);
      }
    } catch (error) {
      console.error('Failed to load voice state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('voice_config', JSON.stringify(this.config));
      await AsyncStorage.setItem('voice_recordings', JSON.stringify(this.recordings));
    } catch (error) {
      console.error('Failed to save voice state:', error);
    }
  }

  // ==========================================
  // Speech-to-Text (STT)
  // ==========================================

  async startListening(options?: {
    language?: VoiceLanguage;
    continuous?: boolean;
    interimResults?: boolean;
    onResult?: (result: TranscriptionResult) => void;
    onError?: (error: Error) => void;
  }): Promise<void> {
    if (this.state.isListening) {
      return;
    }

    this.state.isListening = true;
    this.state.isProcessing = true;
    this.state.error = undefined;

    // Play start listening sound
    if (this.config.feedbackSounds) {
      this.playFeedbackSound('start_listening');
    }

    this.emit('listening_started', { timestamp: new Date().toISOString() });

    // Simulate speech recognition (in production, use expo-speech or native APIs)
    // This would integrate with the device's speech recognition service
    console.log('Speech recognition started');
  }

  async stopListening(): Promise<TranscriptionResult | null> {
    if (!this.state.isListening) {
      return null;
    }

    this.state.isListening = false;
    this.state.isProcessing = false;

    // Play stop listening sound
    if (this.config.feedbackSounds) {
      this.playFeedbackSound('stop_listening');
    }

    this.emit('listening_stopped', { timestamp: new Date().toISOString() });

    // Return the last transcription result
    if (this.state.lastTranscription) {
      return {
        text: this.state.lastTranscription,
        confidence: this.state.confidence,
        isFinal: true,
        language: this.config.language,
        duration: 0,
      };
    }

    return null;
  }

  async transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
    this.state.isProcessing = true;

    // Simulate transcription (in production, send to speech-to-text API)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result: TranscriptionResult = {
      text: 'Transcribed audio content would appear here',
      confidence: 0.92,
      isFinal: true,
      language: this.config.language,
      duration: 5.0,
    };

    this.state.isProcessing = false;
    this.state.lastTranscription = result.text;
    this.state.confidence = result.confidence;

    return result;
  }

  // ==========================================
  // Text-to-Speech (TTS)
  // ==========================================

  async speak(options: SpeechSynthesisOptions): Promise<void> {
    if (this.state.isSpeaking) {
      await this.stopSpeaking();
    }

    this.state.isSpeaking = true;

    const speechOptions = {
      text: options.text,
      language: options.language || this.config.language,
      rate: options.rate || this.config.speechRate,
      pitch: options.pitch || this.config.pitch,
      volume: options.volume || this.config.volume,
      voiceId: options.voiceId || this.config.voiceId,
    };

    options.onStart?.();
    this.emit('speech_started', { text: options.text, timestamp: new Date().toISOString() });

    // Simulate speech synthesis (in production, use expo-speech)
    // Speech.speak(speechOptions.text, {
    //   language: speechOptions.language,
    //   rate: speechOptions.rate,
    //   pitch: speechOptions.pitch,
    //   volume: speechOptions.volume,
    //   onDone: () => {
    //     this.state.isSpeaking = false;
    //     options.onDone?.();
    //   },
    //   onError: (error) => {
    //     this.state.isSpeaking = false;
    //     options.onError?.(error);
    //   },
    // });

    // Simulate speech duration
    const wordCount = options.text.split(' ').length;
    const duration = (wordCount / 150) * 60 * 1000 / speechOptions.rate; // ~150 words per minute

    setTimeout(() => {
      this.state.isSpeaking = false;
      options.onDone?.();
      this.emit('speech_ended', { timestamp: new Date().toISOString() });
    }, duration);
  }

  async stopSpeaking(): Promise<void> {
    if (!this.state.isSpeaking) {
      return;
    }

    // Speech.stop();
    this.state.isSpeaking = false;
    this.emit('speech_stopped', { timestamp: new Date().toISOString() });
  }

  async speakWithHighlight(
    text: string,
    onWordSpoken: (word: string, index: number) => void
  ): Promise<void> {
    const words = text.split(' ');
    const rate = this.config.speechRate;
    const msPerWord = (60 * 1000) / (150 * rate); // ~150 words per minute

    this.state.isSpeaking = true;

    for (let i = 0; i < words.length; i++) {
      if (!this.state.isSpeaking) break;
      onWordSpoken(words[i], i);
      await new Promise(resolve => setTimeout(resolve, msPerWord));
    }

    this.state.isSpeaking = false;
  }

  // ==========================================
  // Wake Word Detection
  // ==========================================

  async startWakeWordDetection(
    personaRole: string,
    onWakeWordDetected: (detection: WakeWordDetection) => void
  ): Promise<void> {
    const wakeWords = WAKE_WORDS[personaRole] || WAKE_WORDS['default'];
    
    // In production, this would use a wake word detection library
    // like Porcupine or Snowboy
    console.log(`Wake word detection started for: ${wakeWords.join(', ')}`);

    // Simulate wake word detection
    this.emit('wake_word_detection_started', { wakeWords, timestamp: new Date().toISOString() });
  }

  async stopWakeWordDetection(): Promise<void> {
    console.log('Wake word detection stopped');
    this.emit('wake_word_detection_stopped', { timestamp: new Date().toISOString() });
  }

  // ==========================================
  // Voice Command Processing
  // ==========================================

  processVoiceCommand(transcription: string): {
    recognized: boolean;
    command?: VoiceCommand;
    action?: string;
    parameters?: Record<string, string>;
  } {
    const normalizedText = transcription.trim().toLowerCase();

    for (const command of VOICE_COMMANDS) {
      const match = normalizedText.match(command.pattern);
      if (match) {
        const parameters: Record<string, string> = {};
        
        if (command.parameters) {
          command.parameters.forEach((param, index) => {
            if (match[index + 2]) {
              parameters[param] = match[index + 2];
            }
          });
        }

        // Play command recognized sound
        if (this.config.feedbackSounds) {
          this.playFeedbackSound('command_recognized');
        }

        // Log command
        this.commandHistory.push({
          command: transcription,
          action: command.action,
          timestamp: new Date().toISOString(),
        });

        return {
          recognized: true,
          command,
          action: command.action,
          parameters,
        };
      }
    }

    return { recognized: false };
  }

  getAvailableCommands(): VoiceCommand[] {
    return VOICE_COMMANDS;
  }

  getCommandHistory(): { command: string; action: string; timestamp: string }[] {
    return this.commandHistory.slice(-50); // Last 50 commands
  }

  // ==========================================
  // Clinical Dictation
  // ==========================================

  async startDictation(type: VoiceRecording['type']): Promise<string> {
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const recording: VoiceRecording = {
      id: recordingId,
      uri: '', // Would be set by actual recording
      duration: 0,
      createdAt: new Date().toISOString(),
      type,
    };

    this.recordings.push(recording);
    await this.saveState();

    // Start listening for dictation
    await this.startListening({
      continuous: true,
      interimResults: true,
    });

    this.emit('dictation_started', { recordingId, type, timestamp: new Date().toISOString() });

    return recordingId;
  }

  async stopDictation(recordingId: string): Promise<VoiceRecording | null> {
    const result = await this.stopListening();
    
    const recording = this.recordings.find(r => r.id === recordingId);
    if (recording && result) {
      recording.transcription = result.text;
      recording.duration = result.duration;
      await this.saveState();

      this.emit('dictation_stopped', { recordingId, transcription: result.text, timestamp: new Date().toISOString() });

      return recording;
    }

    return null;
  }

  getRecordings(type?: VoiceRecording['type']): VoiceRecording[] {
    if (type) {
      return this.recordings.filter(r => r.type === type);
    }
    return this.recordings;
  }

  async deleteRecording(recordingId: string): Promise<void> {
    this.recordings = this.recordings.filter(r => r.id !== recordingId);
    await this.saveState();
  }

  // ==========================================
  // Feedback Sounds
  // ==========================================

  private playFeedbackSound(type: FeedbackSound['type']): void {
    const sound = FEEDBACK_SOUNDS.find(s => s.type === type);
    if (!sound) return;

    // In production, use expo-av to play audio
    // For now, we'll use Web Audio API on web or native haptics on mobile
    if (Platform.OS === 'web') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = sound.frequency;
        gainNode.gain.value = sound.volume;

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, sound.duration);
      } catch (error) {
        console.log('Audio feedback not available');
      }
    }
  }

  // ==========================================
  // Configuration
  // ==========================================

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<VoiceConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveState();
    this.emit('config_updated', { config: this.config, timestamp: new Date().toISOString() });
  }

  getState(): VoiceState {
    return { ...this.state };
  }

  getAvailableVoices(): VoiceOption[] {
    return AVAILABLE_VOICES;
  }

  getAvailableLanguages(): VoiceLanguage[] {
    return ['en-AU', 'en-US', 'en-GB', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'vi-VN'];
  }

  // ==========================================
  // Event Handling
  // ==========================================

  on(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  off(event: string): void {
    this.listeners.delete(event);
  }

  private emit(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  // ==========================================
  // Hands-Free Mode
  // ==========================================

  async enableHandsFreeMode(): Promise<void> {
    this.config.enableContinuousListening = true;
    this.config.enableWakeWord = true;
    await this.saveState();

    // Start wake word detection
    await this.startWakeWordDetection('default', (detection) => {
      if (detection.detected) {
        this.startListening();
      }
    });

    this.emit('hands_free_enabled', { timestamp: new Date().toISOString() });
  }

  async disableHandsFreeMode(): Promise<void> {
    this.config.enableContinuousListening = false;
    await this.stopWakeWordDetection();
    await this.stopListening();
    await this.saveState();

    this.emit('hands_free_disabled', { timestamp: new Date().toISOString() });
  }

  isHandsFreeEnabled(): boolean {
    return this.config.enableContinuousListening && this.config.enableWakeWord;
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    totalRecordings: number;
    totalDuration: number;
    commandsProcessed: number;
    averageConfidence: number;
  } {
    const totalDuration = this.recordings.reduce((sum, r) => sum + r.duration, 0);
    const avgConfidence = this.commandHistory.length > 0 ? 0.85 : 0;

    return {
      totalRecordings: this.recordings.length,
      totalDuration,
      commandsProcessed: this.commandHistory.length,
      averageConfidence: avgConfidence,
    };
  }
}

export const voiceInteraction = new VoiceInteractionService();
