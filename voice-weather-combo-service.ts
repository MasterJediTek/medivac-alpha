
    // Find matching command
    let matchedCommand: VoiceWeatherCommand | null = null;
    for (const cmd of this.commands.values()) {
      if (!cmd.isEnabled) continue;
      
      if (cmd.phrase.toLowerCase() === normalizedInput ||
          cmd.aliases.some(alias => alias.toLowerCase() === normalizedInput)) {
        matchedCommand = cmd;
        break;
      }
    }

    if (!matchedCommand) {
      this.analytics.totalCommands++;
      this.analytics.failedCommands++;
      this.notifyListeners();
      return {
        success: false,
        command: null,
        override: null,
        voiceResponse: 'Sorry, I didn\'t understand that weather command',
        transitionEffect: 'none',
      };
    }

    // Update command stats
    matchedCommand.usageCount++;
    matchedCommand.lastUsed = Date.now();
    this.analytics.commandCounts[matchedCommand.phrase] = 