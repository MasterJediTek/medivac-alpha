/**
 * Voice Dictation Service
 * Speech-to-text for hands-free clinical documentation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dictation status
export type DictationStatus = 
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'paused'
  | 'error';

// Voice command types
export type VoiceCommand = 
  | 'period'
  | 'comma'
  | 'new_line'
  | 'new_paragraph'
  | 'delete_last'
  | 'clear_all'
  | 'save'
  | 'cancel';

// Dictation session
export interface DictationSession {
  id: string;
  patientId?: string;
  noteType: NoteType;
  transcript: string;
  segments: TranscriptSegment[];
  startTime: number;
  endTime?: number;
  duration: number;
  status: DictationStatus;
  audioLevel: number;
  wordCount: number;
  confidence: number;
}

// Transcript segment
export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
  speaker?: string;
}

// Note types
export type NoteType = 
  | 'progress_note'
  | 'admission_note'
  | 'discharge_summary'
  | 'consultation'
  | 'procedure_note'
  | 'nursing_note'
  | 'medication_note'
  | 'lab_interpretation'
  | 'radiology_report'
  | 'general';

// Medical terminology categories
export interface MedicalTerminology {
  abbreviations: Map<string, string>;
  medications: string[];
  diagnoses: string[];
  procedures: string[];
  anatomicalTerms: string[];
}

// Dictation settings
export interface DictationSettings {
  language: string;
  autoCapitalize: boolean;
  autoPunctuation: boolean;
  medicalMode: boolean;
  continuousListening: boolean;
  audioFeedback: boolean;
  saveAudioRecording: boolean;
  maxSessionDuration: number;
  silenceTimeout: number;
}

// Dictation history entry
export interface DictationHistoryEntry {
  id: string;
  sessionId: string;
  noteType: NoteType;
  patientId?: string;
  patientName?: string;
  transcript: string;
  wordCount: number;
  duration: number;
  createdAt: number;
  savedToNotes: boolean;
}

// Voice command mapping
const VOICE_COMMANDS: Record<string, VoiceCommand> = {
  'period': 'period',
  'full stop': 'period',
  'comma': 'comma',
  'new line': 'new_line',
  'next line': 'new_line',
  'new paragraph': 'new_paragraph',
  'delete that': 'delete_last',
  'undo': 'delete_last',
  'clear all': 'clear_all',
  'save note': 'save',
  'cancel': 'cancel',
  'stop dictation': 'cancel',
};

// Medical abbreviation expansions
const MEDICAL_ABBREVIATIONS: Record<string, string> = {
  'bp': 'blood pressure',
  'hr': 'heart rate',
  'rr': 'respiratory rate',
  'temp': 'temperature',
  'spo2': 'oxygen saturation',
  'sob': 'shortness of breath',
  'cp': 'chest pain',
  'abd': 'abdominal',
  'hx': 'history',
  'dx': 'diagnosis',
  'rx': 'prescription',
  'tx': 'treatment',
  'sx': 'symptoms',
  'pt': 'patient',
  'prn': 'as needed',
  'bid': 'twice daily',
  'tid': 'three times daily',
  'qid': 'four times daily',
  'qd': 'once daily',
  'po': 'by mouth',
  'iv': 'intravenous',
  'im': 'intramuscular',
  'sc': 'subcutaneous',
  'npo': 'nothing by mouth',
  'wbc': 'white blood cell count',
  'rbc': 'red blood cell count',
  'hgb': 'hemoglobin',
  'hct': 'hematocrit',
  'bmp': 'basic metabolic panel',
  'cmp': 'comprehensive metabolic panel',
  'cbc': 'complete blood count',
  'ekg': 'electrocardiogram',
  'ecg': 'electrocardiogram',
  'ct': 'computed tomography',
  'mri': 'magnetic resonance imaging',
  'cxr': 'chest x-ray',
  'ua': 'urinalysis',
  'uti': 'urinary tract infection',
  'copd': 'chronic obstructive pulmonary disease',
  'chf': 'congestive heart failure',
  'cad': 'coronary artery disease',
  'dm': 'diabetes mellitus',
  'htn': 'hypertension',
  'afib': 'atrial fibrillation',
  'mi': 'myocardial infarction',
  'cva': 'cerebrovascular accident',
  'dvt': 'deep vein thrombosis',
  'pe': 'pulmonary embolism',
  'gi': 'gastrointestinal',
  'gu': 'genitourinary',
  'neuro': 'neurological',
  'psych': 'psychiatric',
  'wnl': 'within normal limits',
  'nad': 'no acute distress',
  'a&o': 'alert and oriented',
  'rom': 'range of motion',
  'nkda': 'no known drug allergies',
};

class VoiceDictationService {
  private currentSession: DictationSession | null = null;
  private settings: DictationSettings;
  private history: DictationHistoryEntry[] = [];
  private listeners: Set<(session: DictationSession) => void> = new Set();
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadHistory();
  }

  // Get default settings
  private getDefaultSettings(): DictationSettings {
    return {
      language: 'en-US',
      autoCapitalize: true,
      autoPunctuation: true,
      medicalMode: true,
      continuousListening: true,
      audioFeedback: true,
      saveAudioRecording: false,
      maxSessionDuration: 600000, // 10 minutes
      silenceTimeout: 5000, // 5 seconds
    };
  }

  // Get settings
  getSettings(): DictationSettings {
    return { ...this.settings };
  }

  // Update settings
  async updateSettings(updates: Partial<DictationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  // Save settings
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('dictation_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save dictation settings:', error);
    }
  }

  // Load settings
  private async loadSettings(): Promise<void> {
    try {
      const json = await AsyncStorage.getItem('dictation_settings');
      if (json) {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(json) };
      }
    } catch (error) {
      console.error('Failed to load dictation settings:', error);
    }
  }

  // Check microphone permission
  async checkPermission(): Promise<boolean> {
    // In production, would use expo-av or react-native-permissions
    // For now, simulate permission check
    return true;
  }

  // Request microphone permission
  async requestPermission(): Promise<boolean> {
    // In production, would request actual permission
    return true;
  }

  // Start dictation session
  async startDictation(noteType: NoteType, patientId?: string): Promise<DictationSession> {
    // Check permission first
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }
    }

    // Create new session
    const session: DictationSession = {
      id: `dictation-${Date.now()}`,
      patientId,
      noteType,
      transcript: '',
      segments: [],
      startTime: Date.now(),
      duration: 0,
      status: 'listening',
      audioLevel: 0,
      wordCount: 0,
      confidence: 1.0,
    };

    this.currentSession = session;
    this.notifyListeners();

    // Start session timer
    this.startSessionTimer();

    return session;
  }

  // Stop dictation
  async stopDictation(): Promise<DictationSession | null> {
    if (!this.currentSession) return null;

    this.currentSession.status = 'idle';
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    // Clear timers
    this.clearTimers();

    // Save to history
    await this.saveToHistory(this.currentSession);

    const session = { ...this.currentSession };
    this.notifyListeners();

    return session;
  }

  // Pause dictation
  pauseDictation(): void {
    if (this.currentSession && this.currentSession.status === 'listening') {
      this.currentSession.status = 'paused';
      this.clearTimers();
      this.notifyListeners();
    }
  }

  // Resume dictation
  resumeDictation(): void {
    if (this.currentSession && this.currentSession.status === 'paused') {
      this.currentSession.status = 'listening';
      this.startSessionTimer();
      this.notifyListeners();
    }
  }

  // Process speech input (simulated - in production would use actual speech recognition)
  processTranscript(text: string, isFinal: boolean, confidence: number = 0.95): void {
    if (!this.currentSession || this.currentSession.status !== 'listening') return;

    // Reset silence timer
    this.resetSilenceTimer();

    // Process voice commands
    const command = this.detectVoiceCommand(text.toLowerCase());
    if (command) {
      this.executeVoiceCommand(command);
      return;
    }

    // Process medical terminology
    let processedText = text;
    if (this.settings.medicalMode) {
      processedText = this.expandMedicalAbbreviations(text);
    }

    // Apply auto-capitalization
    if (this.settings.autoCapitalize) {
      processedText = this.autoCapitalize(processedText);
    }

    // Create segment
    const segment: TranscriptSegment = {
      id: `segment-${Date.now()}`,
      text: processedText,
      timestamp: Date.now(),
      confidence,
      isFinal,
    };

    // Update session
    if (isFinal) {
      // Remove any interim segments and add final
      this.currentSession.segments = this.currentSession.segments.filter(s => s.isFinal);
      this.currentSession.segments.push(segment);
      
      // Update full transcript
      this.currentSession.transcript = this.currentSession.segments
        .map(s => s.text)
        .join(' ')
        .trim();
      
      // Update word count
      this.currentSession.wordCount = this.currentSession.transcript.split(/\s+/).filter(w => w).length;
    } else {
      // Update interim segment
      const interimIndex = this.currentSession.segments.findIndex(s => !s.isFinal);
      if (interimIndex >= 0) {
        this.currentSession.segments[interimIndex] = segment;
      } else {
        this.currentSession.segments.push(segment);
      }
    }

    // Update confidence
    this.currentSession.confidence = confidence;

    this.notifyListeners();
  }

  // Detect voice command
  private detectVoiceCommand(text: string): VoiceCommand | null {
    for (const [phrase, command] of Object.entries(VOICE_COMMANDS)) {
      if (text.includes(phrase)) {
        return command;
      }
    }
    return null;
  }

  // Execute voice command
  private executeVoiceCommand(command: VoiceCommand): void {
    if (!this.currentSession) return;

    switch (command) {
      case 'period':
        this.insertPunctuation('.');
        break;
      case 'comma':
        this.insertPunctuation(',');
        break;
      case 'new_line':
        this.insertText('\n');
        break;
      case 'new_paragraph':
        this.insertText('\n\n');
        break;
      case 'delete_last':
        this.deleteLastWord();
        break;
      case 'clear_all':
        this.clearTranscript();
        break;
      case 'save':
        this.stopDictation();
        break;
      case 'cancel':
        this.cancelDictation();
        break;
    }

    this.notifyListeners();
  }

  // Insert punctuation
  private insertPunctuation(punct: string): void {
    if (!this.currentSession) return;
    this.currentSession.transcript = this.currentSession.transcript.trimEnd() + punct + ' ';
  }

  // Insert text
  private insertText(text: string): void {
    if (!this.currentSession) return;
    this.currentSession.transcript += text;
  }

  // Delete last word
  private deleteLastWord(): void {
    if (!this.currentSession) return;
    const words = this.currentSession.transcript.trim().split(/\s+/);
    words.pop();
    this.currentSession.transcript = words.join(' ') + ' ';
    this.currentSession.wordCount = words.length;
  }

  // Clear transcript
  private clearTranscript(): void {
    if (!this.currentSession) return;
    this.currentSession.transcript = '';
    this.currentSession.segments = [];
    this.currentSession.wordCount = 0;
  }

  // Cancel dictation
  private cancelDictation(): void {
    this.clearTimers();
    this.currentSession = null;
    this.notifyListeners();
  }

  // Expand medical abbreviations
  private expandMedicalAbbreviations(text: string): string {
    let result = text;
    for (const [abbr, expansion] of Object.entries(MEDICAL_ABBREVIATIONS)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      result = result.replace(regex, expansion);
    }
    return result;
  }

  // Auto-capitalize
  private autoCapitalize(text: string): string {
    if (!this.currentSession) return text;
    
    // Capitalize first letter of sentence
    const transcript = this.currentSession.transcript;
    if (!transcript || transcript.endsWith('. ') || transcript.endsWith('.\n') || transcript.endsWith('\n\n')) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
    return text;
  }

  // Update audio level
  updateAudioLevel(level: number): void {
    if (this.currentSession) {
      this.currentSession.audioLevel = Math.min(1, Math.max(0, level));
      this.notifyListeners();
    }
  }

  // Start session timer
  private startSessionTimer(): void {
    this.sessionTimer = setTimeout(() => {
      this.stopDictation();
    }, this.settings.maxSessionDuration);
  }

  // Reset silence timer
  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    if (this.settings.continuousListening) {
      this.silenceTimer = setTimeout(() => {
        // Auto-pause on silence
        this.pauseDictation();
      }, this.settings.silenceTimeout);
    }
  }

  // Clear timers
  private clearTimers(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  // Get current session
  getCurrentSession(): DictationSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  // Subscribe to session updates
  subscribe(listener: (session: DictationSession) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(): void {
    if (this.currentSession) {
      const session = { ...this.currentSession };
      this.listeners.forEach(listener => listener(session));
    }
  }

  // Save to history
  private async saveToHistory(session: DictationSession): Promise<void> {
    const entry: DictationHistoryEntry = {
      id: `history-${Date.now()}`,
      sessionId: session.id,
      noteType: session.noteType,
      patientId: session.patientId,
      transcript: session.transcript,
      wordCount: session.wordCount,
      duration: session.duration,
      createdAt: Date.now(),
      savedToNotes: false,
    };

    this.history.unshift(entry);
    
    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    await this.saveHistory();
  }

  // Get history
  getHistory(): DictationHistoryEntry[] {
    return [...this.history];
  }

  // Delete history entry
  async deleteHistoryEntry(id: string): Promise<void> {
    this.history = this.history.filter(h => h.id !== id);
    await this.saveHistory();
  }

  // Clear history
  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
  }

  // Save history
  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('dictation_history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save dictation history:', error);
    }
  }

  // Load history
  private async loadHistory(): Promise<void> {
    try {
      const json = await AsyncStorage.getItem('dictation_history');
      if (json) {
        this.history = JSON.parse(json);
      }
    } catch (error) {
      console.error('Failed to load dictation history:', error);
    }
  }

  // Get note type label
  getNoteTypeLabel(type: NoteType): string {
    const labels: Record<NoteType, string> = {
      progress_note: 'Progress Note',
      admission_note: 'Admission Note',
      discharge_summary: 'Discharge Summary',
      consultation: 'Consultation',
      procedure_note: 'Procedure Note',
      nursing_note: 'Nursing Note',
      medication_note: 'Medication Note',
      lab_interpretation: 'Lab Interpretation',
      radiology_report: 'Radiology Report',
      general: 'General Note',
    };
    return labels[type] || type;
  }

  // Get all note types
  getNoteTypes(): { value: NoteType; label: string }[] {
    return [
      { value: 'progress_note', label: 'Progress Note' },
      { value: 'admission_note', label: 'Admission Note' },
      { value: 'discharge_summary', label: 'Discharge Summary' },
      { value: 'consultation', label: 'Consultation' },
      { value: 'procedure_note', label: 'Procedure Note' },
      { value: 'nursing_note', label: 'Nursing Note' },
      { value: 'medication_note', label: 'Medication Note' },
      { value: 'lab_interpretation', label: 'Lab Interpretation' },
      { value: 'radiology_report', label: 'Radiology Report' },
      { value: 'general', label: 'General Note' },
    ];
  }

  // Format duration
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const voiceDictationService = new VoiceDictationService();
export default voiceDictationService;
