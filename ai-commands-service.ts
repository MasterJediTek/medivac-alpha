  }

  getTemplatesByType(type: CommandType): CommandTemplate[] {
    return this.templates.filter(t => t.type === type);
  }

  async executeCommand(prompt: string, type: CommandType): Promise<AICommand> {
    const command: AICommand = {
      id: `cmd_${Date.now()}`,
      type,
      prompt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    this.commands.unshift(command);
    await this.save();
    
    // Simulate execution
    setTimeout(async () => {
      command.status = 'running';
      await this.save();
      
      // Simulate completion
      setTimeout(async () => {
        command.status = 'success';
        command.executionTime = Math.floor(Math.random() * 3000) + 500;
        command.completedAt = new Date().toISOString();
        command.response = this.generateMockResponse(type, prompt);
        await this.save();
      }, Math.random() * 2000 + 1000);
    }, 500);
    
    return command;
  }

  private generateMockResponse(type: CommandType, prompt: string): string {
    const responses: Record<CommandType, string[]> = {
      query: [
        'Query completed successfully. All requested data retrieved.',
        'System status: Operational. No issues detected.',
        'Data retrieved from 7 WACHS sites. Summary available.',
      ],
      action: [
        'Action completed successfully.',
        'Operation executed. Changes applied to the system.',
        'Task completed. Confirmation sent to relevant parties.',
      ],
      analysis: [
        'Analysis complete. Report generated with findings.',
        'Pattern analysis finished. 3 anomalies detected.',
        'Data analysis successful. Insights available for review.',
      ],
      generation: [
        'Document generated successfully. Ready for download.',
        'Report created. 15 pages with detailed findings.',
        'Content generated. Review and approval pending.',
      ],
      automation: [
        'Automation configured. Schedule set as requested.',
        'Workflow created. Will execute at specified intervals.',
        'Automated task scheduled. Monitoring enabled.',
      ],
      security: [
        'Security scan complete. 0 critical vulnerabilities found.',
        'Threat assessment finished. 2 medium-risk items identified.',
        'Security audit complete. Recommendations generated.',
      ],
    };
    
    const typeResponses = responses[type];
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  }

  async cancelCommand(commandId: string): Promise<boolean> {
    const command = this.commands.find(c => c.id === commandId);
    if (!command || !['pending', 'running'].includes(command.status)) return false;
    
    command.status = 'cancelled';
    command.completedAt = new Date().toISOString();