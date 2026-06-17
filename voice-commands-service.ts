      mostUsedCommands: [],
      commandsByHour: new Array(24).fill(0),
      languageUsage: { 'en-AU': 0, 'en-US': 0, 'en-GB': 0, 'es-ES': 0, 'fr-FR': 0, 'de-DE': 0, 'ja-JP': 0, 'zh-CN': 0 },
      sosTriggered: 0,
      medicationsConfirmed: 0,
      eventsCreated: 0,
    };
  }

  private initializeTrainingPhrases(): void {
    const defaultPhrases: Omit<VoiceTrainingPhrase, 'id'>[] = [
      { phrase: 'Create an event', commandType: 'create-event', variations: ['Add event', 'New event', 'Schedule event'], trained: true, accuracy: 95 },
      { phrase: 'I took my medication', commandType: 'mark-medication', variations: ['Medication taken', 'Had my meds', 'Took my pills'], trained: true, accuracy: 98 },
      { phrase: 'Help', commandType: 'trigger-sos', variations: ['Emergency', 'SOS', 'Call for help', '000'], trained: true, accuracy: 99 },
      { phrase: "What's my schedule", commandType: 'check-schedule', variations: ['Show schedule', 'My agenda', 'Calendar today'], trained: true, accuracy: 94 },
      { phrase: 'Set a timer', commandType: 'set-timer', variations: ['Start timer', 'Timer for', 'Count down'], trained: true, accuracy: 96 },
    ];

    defaultPhrases.forEach((phrase, idx) => {
      const id = `phrase-${idx}`;
      this.trainingPhrases.set(id, { ...phrase, id });
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): VoiceState {
    return this.state;
  }

  setState(state: VoiceState): void {
    this.state = state;
    this.notifyListeners();
  }

  startListening(): { success: boolean; soundEffect: string; hapticPattern: number[] } {
    if (this.state === 'listening') {
      return { success: false, soundEffect: '', hapticPattern: [] };
    }

    this.state = 'listening';
    this.currentWaveform = {
      amplitude: [],
      frequency: [],
      timestamp: Date.now(),
      duration: 0,
    };

    this.notifyListeners();

    return {
      success: true,
      soundEffect: VOICE_SOUND_EFFECTS.listeningStart,
      hapticPattern: [...VOICE_HAPTIC_PATTERNS.listening],
    };
  }

  stopListening(): { success: boolean; soundEffect: string } {
    if (this.state !== 'listening') {
      return { success: false, soundEffect: '' };
    }

    this.state = 'idle';
    if (this.currentWaveform) {
      this.currentWaveform.duration = Date.now() - this.currentWaveform.timestamp;
    }

    this.notifyListeners();

    return {
      success: true,
      soundEffect: VOICE_SOUND_EFFECTS.listeningEnd,
    };
  }

  updateWaveform(amplitude: number, frequency: number): void {
    if (this.currentWaveform && this.state === 'listening') {
      this.currentWaveform.amplitude.push(amplitude);
      this.currentWaveform.frequency.push(frequency);
      this.notifyListeners();
    }
  }

  getCurrentWaveform(): VoiceWaveformData | null {
    return this.currentWaveform ? { ...this.currentWaveform } : null;
  }

  generateMockWaveform(): number[] {
    const frames = 50;
    const waveform: number[] = [];
    for (let i = 0; i < frames; i++) {
      const base = Math.sin(i * 0.3) * 0.3 + 0.5;
      const noise = Math.random() * 0.3;
      waveform.push(Math.min(1, Math.max(0, base + noise)));
    }
    return waveform;
  }

  processCommand(transcript: string, confidence: number = 0.9): VoiceCommand {
    const startTime = Date.now();
    this.state = 'processing';
    this.notifyListeners();

    const id = `cmd-${Date.now()}`;
    const command: VoiceCommand = {
      id,
      type: 'custom',
      transcript,
      confidence,
      timestamp: Date.now(),
      processed: false,
      duration: 0,
      language: this.settings.language,
    };

    // Parse command using patterns
    for (const { pattern, type, extract } of COMMAND_PATTERNS) {
      const match = transcript.match(pattern);
      if (match) {
        command.type = type;
        command.result = this.executeCommand(type, extract(match));
        command.processed = true;
        break;
      }
    }

    if (!command.processed) {
      command.result = {
        success: false,
        action: 'unknown',
        message: "I didn't understand that command. Try saying 'Help' for available commands.",
        soundEffect: VOICE_SOUND_EFFECTS.commandError,
        hapticPattern: [...VOICE_HAPTIC_PATTERNS.error],
      };
      command.processed = true;
    }

    command.duration = Date.now() - startTime;
    this.commands.set(id, command);

    // Update analytics
    this.analytics.totalCommands++;
    if (command.result?.success) {