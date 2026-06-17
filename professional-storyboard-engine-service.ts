  // Journey Management
  createJourney(
    name: string,
    description: string,
    category: StoryboardJourney['category'],
    userRole: StoryboardJourney['userRole'],
    options: {
      theme?: StoryboardTheme;
      voiceoverEnabled?: boolean;
      musicEnabled?: boolean;
      userId?: string;
    } = {}
  ): StoryboardJourney {
    const id = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const journey: StoryboardJourney = {
      id,
      name,
      description,
      category,
      scenes: [],
      currentSceneIndex: 0,
      theme: options.theme || 'professional',
      totalScenes: 0,
      completedScenes: 0,
      progressPercentage: 0,
      globalVoiceoverEnabled: options.voiceoverEnabled !== false,
      globalMusicEnabled: options.musicEnabled || false,
      voiceoverLanguage: 'en-AU',
      userId: options.userId,
      userRole,
      totalDuration: 0,
      sceneViewTimes: {},
      interactions: [],
    };

    this.journeys.set(id, journey);
    return journey;
  }

  addScene(
    journeyId: string,
    sceneData: Omit<StoryboardScene, 'id' | 'nextSceneId' | 'previousSceneId'>
  ): StoryboardScene | null {
    const journey = this.journeys.get(journeyId);
    if (!journey) return null;

    const id = `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scene: StoryboardScene = {