import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { patientPortalGamingEngineService, type MapLocation, type Quest, type VirtualPet, type PlayerProfile } from '@/lib/services/patient-portal-gaming-engine-service';

// WACHS Professional Colors
const COLORS = {
  primary: '#005A9C',
  secondary: '#00838F',
  accent: '#FF6B35',
  success: '#2E7D32',
  warning: '#F57C00',
  danger: '#D32F2F',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#6B7280',
  gold: '#FFD700',
};

export default function PatientPortalScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'quests' | 'pet' | 'ai'>('map');
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [pet, setPet] = useState<VirtualPet | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const currentPlayer = patientPortalGamingEngineService.getCurrentPlayer();
    if (currentPlayer) {
      setPlayer(currentPlayer);
      setShowWelcome(false);
      setPet(currentPlayer.pet || null);
    }
    setMapLocations(patientPortalGamingEngineService.getMap());
    setQuests([
      ...patientPortalGamingEngineService.getActiveQuests(),
      ...patientPortalGamingEngineService.getAvailableQuests(),
    ]);
    setCurrentLocation(patientPortalGamingEngineService.getCurrentLocation());
  };

  const handleCreatePlayer = () => {
    if (!playerName.trim()) return;
    const newPlayer = patientPortalGamingEngineService.createPlayer(playerName, 'patient');
    setPlayer(newPlayer);
    setShowWelcome(false);
    loadData();
  };

  const handleMoveToLocation = (locationId: string) => {
    const location = patientPortalGamingEngineService.moveToLocation(locationId);
    if (location) {
      setCurrentLocation(location);
      setMapLocations(patientPortalGamingEngineService.getMap());
      loadData();
    }
  };

  const handleStartQuest = (questId: string) => {
    patientPortalGamingEngineService.startQuest(questId);
    loadData();
  };

  const handleAdoptPet = (name: string, type: 'dog' | 'cat' | 'robot') => {
    const newPet = patientPortalGamingEngineService.adoptPet(name, type);
    setPet(newPet);
    loadData();
  };

  const handlePetAction = (action: 'feed' | 'play' | 'pet') => {
    if (!pet) return;
    if (action === 'feed') patientPortalGamingEngineService.feedPet(pet.id);
    else if (action === 'play') patientPortalGamingEngineService.playWithPet(pet.id);
    else patientPortalGamingEngineService.petThePet(pet.id);
    
    const updatedPlayer = patientPortalGamingEngineService.getCurrentPlayer();
    if (updatedPlayer?.pet) setPet(updatedPlayer.pet);
  };

  const handleAskAI = async () => {
    if (!aiMessage.trim()) return;
    const response = await patientPortalGamingEngineService.askAI(aiMessage);
    setAiResponse(response);
    setAiMessage('');
  };

  // Welcome Screen
  if (showWelcome) {
    return (
      <ScreenContainer className="bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-6">
            {/* Header */}
            <View className="items-center mb-8 pt-8">
              <View className="w-24 h-24 rounded-full items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                <Text className="text-4xl">🏥</Text>
              </View>
              <Text className="text-3xl font-bold text-center" style={{ color: COLORS.primary }}>
                WACHS Patient Portal
              </Text>
              <Text className="text-lg text-center mt-2" style={{ color: COLORS.muted }}>
                Western Australia Country Health Service
              </Text>
            </View>

            {/* Welcome Message */}
            <View className="rounded-2xl p-6 mb-6" style={{ backgroundColor: COLORS.background }}>
              <Text className="text-xl font-semibold mb-3" style={{ color: COLORS.text }}>
                Welcome to Your Health Journey
              </Text>
              <Text className="text-base leading-6" style={{ color: COLORS.muted }}>
                Navigate the virtual hospital, complete health quests, care for your companion pet, 
                and get help from our AI assistant. Your health adventure starts here!
              </Text>
            </View>

            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-base font-medium mb-2" style={{ color: COLORS.text }}>
                Enter Your Name
              </Text>
              <TextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Your name..."
                className="border rounded-xl px-4 py-3 text-base"
                style={{ borderColor: COLORS.primary, color: COLORS.text }}
                placeholderTextColor={COLORS.muted}
              />
            </View>

            {/* Start Button */}
            <Pressable
              onPress={handleCreatePlayer}
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: COLORS.primary, opacity: playerName.trim() ? 1 : 0.5 }}
            >
              <Text className="text-white text-lg font-semibold">Begin Your Journey</Text>
            </Pressable>

            {/* Features */}
            <View className="mt-8">
              <Text className="text-lg font-semibold mb-4" style={{ color: COLORS.text }}>
                What You Can Do
              </Text>
              {[
                { icon: '🗺️', title: 'Explore', desc: 'Navigate the virtual hospital' },
                { icon: '📋', title: 'Quests', desc: 'Complete health missions' },
                { icon: '🐾', title: 'Pet', desc: 'Care for your companion' },
                { icon: '🤖', title: 'AI Help', desc: 'Get instant assistance' },
              ].map((feature, index) => (
                <View key={index} className="flex-row items-center p-3 rounded-xl mb-2" style={{ backgroundColor: COLORS.background }}>
                  <Text className="text-2xl mr-3">{feature.icon}</Text>
                  <View>
                    <Text className="font-semibold" style={{ color: COLORS.text }}>{feature.title}</Text>
                    <Text className="text-sm" style={{ color: COLORS.muted }}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: COLORS.primary }}>
              <Text className="text-lg">🏥</Text>
            </View>
            <View>
              <Text className="font-bold" style={{ color: COLORS.text }}>
                {player?.name || 'Patient'}
              </Text>
              <Text className="text-xs" style={{ color: COLORS.muted }}>
                Level {player?.level || 1} • {player?.experience || 0} XP
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="px-3 py-1 rounded-full mr-2" style={{ backgroundColor: COLORS.success + '20' }}>
              <Text className="text-sm font-medium" style={{ color: COLORS.success }}>
                ❤️ {player?.healthPoints || 100}
              </Text>
            </View>
            {pet && (
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: COLORS.gold + '30' }}>
                <Text className="text-sm">🐾</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View className="flex-row border-b" style={{ borderColor: '#E5E7EB' }}>
        {[
          { id: 'map', label: 'Map', icon: '🗺️' },
          { id: 'quests', label: 'Quests', icon: '📋' },
          { id: 'pet', label: 'Pet', icon: '🐾' },
          { id: 'ai', label: 'AI Help', icon: '🤖' },
        ].map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex-1 py-3 items-center"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.id ? COLORS.primary : 'transparent',
            }}
          >
            <Text className="text-lg">{tab.icon}</Text>
            <Text
              className="text-xs mt-1"
              style={{ color: activeTab === tab.id ? COLORS.primary : COLORS.muted }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1">
        {/* Map Tab */}
        {activeTab === 'map' && (
          <View className="p-4">
            {currentLocation && (
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: currentLocation.color + '20' }}>
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-2">{currentLocation.icon === 'desk' ? '🏢' : currentLocation.icon === 'chair' ? '🪑' : currentLocation.icon === 'stethoscope' ? '🩺' : currentLocation.icon === 'pill' ? '💊' : currentLocation.icon === 'flask' ? '🧪' : currentLocation.icon === 'scan' ? '📷' : currentLocation.icon === 'emergency' ? '🚨' : currentLocation.icon === 'coffee' ? '☕' : '🌸'}</Text>
                  <Text className="text-lg font-bold" style={{ color: COLORS.text }}>
                    {currentLocation.name}
                  </Text>
                </View>
                <Text style={{ color: COLORS.muted }}>{currentLocation.description}</Text>
              </View>
            )}

            <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.text }}>
              Hospital Map
            </Text>

            <View className="flex-row flex-wrap">
              {mapLocations.map((location) => (
                <Pressable
                  key={location.id}
                  onPress={() => handleMoveToLocation(location.id)}
                  className="w-1/3 p-2"
                >
                  <View
                    className="rounded-xl p-3 items-center"
                    style={{
                      backgroundColor: location.isUnlocked ? location.color + '20' : '#E5E7EB',
                      opacity: location.isUnlocked ? 1 : 0.5,
                      borderWidth: currentLocation?.id === location.id ? 2 : 0,
                      borderColor: COLORS.primary,
                    }}
                  >
                    <Text className="text-2xl mb-1">
                      {location.icon === 'desk' ? '🏢' : location.icon === 'chair' ? '🪑' : location.icon === 'stethoscope' ? '🩺' : location.icon === 'pill' ? '💊' : location.icon === 'flask' ? '🧪' : location.icon === 'scan' ? '📷' : location.icon === 'emergency' ? '🚨' : location.icon === 'coffee' ? '☕' : '🌸'}
                    </Text>
                    <Text className="text-xs text-center font-medium" style={{ color: COLORS.text }}>
                      {location.name}
                    </Text>
                    {location.isVisited && (
                      <Text className="text-xs" style={{ color: COLORS.success }}>✓</Text>
                    )}
                    {!location.isUnlocked && (
                      <Text className="text-xs">🔒</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Quests Tab */}
        {activeTab === 'quests' && (
          <View className="p-4">
            <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.text }}>
              Health Quests
            </Text>

            {quests.map((quest) => (
              <View
                key={quest.id}
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: COLORS.background }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold" style={{ color: COLORS.text }}>
                    {quest.title}
                  </Text>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: quest.status === 'active' ? COLORS.primary + '20' : quest.status === 'completed' ? COLORS.success + '20' : COLORS.warning + '20',
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color: quest.status === 'active' ? COLORS.primary : quest.status === 'completed' ? COLORS.success : COLORS.warning,
                      }}
                    >
                      {quest.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm mb-2" style={{ color: COLORS.muted }}>
                  {quest.description}
                </Text>

                {/* Progress Bar */}
                <View className="h-2 rounded-full mb-2" style={{ backgroundColor: '#E5E7EB' }}>
                  <View
                    className="h-2 rounded-full"
                    style={{ backgroundColor: COLORS.primary, width: `${quest.progress}%` }}
                  />
                </View>

                {/* Objectives */}
                {quest.objectives.map((obj) => (
                  <View key={obj.id} className="flex-row items-center mb-1">
                    <Text className="mr-2">{obj.isCompleted ? '✅' : '⬜'}</Text>
                    <Text className="text-sm" style={{ color: obj.isCompleted ? COLORS.success : COLORS.muted }}>
                      {obj.description}
                    </Text>
                  </View>
                ))}

                {/* Rewards */}
                <View className="flex-row items-center mt-2">
                  <Text className="text-xs mr-2" style={{ color: COLORS.gold }}>
                    🏆 +{quest.experienceReward} XP
                  </Text>
                  <Text className="text-xs" style={{ color: COLORS.success }}>
                    ❤️ +{quest.healthReward} HP
                  </Text>
                </View>

                {quest.status === 'available' && (
                  <Pressable
                    onPress={() => handleStartQuest(quest.id)}
                    className="mt-3 py-2 rounded-lg items-center"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Text className="text-white font-medium">Start Quest</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Pet Tab */}
        {activeTab === 'pet' && (
          <View className="p-4">
            {pet ? (
              <>
                <View className="items-center mb-6">
                  <View className="w-32 h-32 rounded-full items-center justify-center mb-4" style={{ backgroundColor: COLORS.gold + '30' }}>
                    <Text className="text-6xl">
                      {pet.type === 'dog' ? '🐕' : pet.type === 'cat' ? '🐱' : pet.type === 'robot' ? '🤖' : pet.type === 'dragon' ? '🐉' : pet.type === 'unicorn' ? '🦄' : '🐾'}
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold" style={{ color: COLORS.text }}>
                    {pet.name}
                  </Text>
                  <Text className="text-sm" style={{ color: COLORS.muted }}>
                    Bond Level: {pet.bondLevel}%
                  </Text>
                </View>

                {/* Pet Stats */}
                <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.background }}>
                  {[
                    { label: 'Happiness', value: pet.happiness, color: COLORS.gold },
                    { label: 'Energy', value: pet.energy, color: COLORS.primary },
                    { label: 'Health', value: pet.health, color: COLORS.success },
                  ].map((stat) => (
                    <View key={stat.label} className="mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-sm font-medium" style={{ color: COLORS.text }}>
                          {stat.label}
                        </Text>
                        <Text className="text-sm" style={{ color: COLORS.muted }}>
                          {stat.value}%
                        </Text>
                      </View>
                      <View className="h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                        <View
                          className="h-2 rounded-full"
                          style={{ backgroundColor: stat.color, width: `${stat.value}%` }}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                {/* Pet Actions */}
                <View className="flex-row">
                  {[
                    { action: 'feed', label: 'Feed', icon: '🍖' },
                    { action: 'play', label: 'Play', icon: '🎾' },
                    { action: 'pet', label: 'Pet', icon: '🤗' },
                  ].map((item) => (
                    <Pressable
                      key={item.action}
                      onPress={() => handlePetAction(item.action as 'feed' | 'play' | 'pet')}
                      className="flex-1 mx-1 py-4 rounded-xl items-center"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <Text className="text-2xl mb-1">{item.icon}</Text>
                      <Text className="text-white font-medium">{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View className="items-center py-8">
                <Text className="text-6xl mb-4">🐾</Text>
                <Text className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>
                  Adopt a Companion
                </Text>
                <Text className="text-center mb-6" style={{ color: COLORS.muted }}>
                  Choose a pet to accompany you on your health journey!
                </Text>

                <View className="flex-row">
                  {[
                    { type: 'dog', icon: '🐕', name: 'Buddy' },
                    { type: 'cat', icon: '🐱', name: 'Whiskers' },
                    { type: 'robot', icon: '🤖', name: 'Beep' },
                  ].map((petOption) => (
                    <Pressable
                      key={petOption.type}
                      onPress={() => handleAdoptPet(petOption.name, petOption.type as 'dog' | 'cat' | 'robot')}
                      className="flex-1 mx-2 py-4 rounded-xl items-center"
                      style={{ backgroundColor: COLORS.background }}
                    >
                      <Text className="text-4xl mb-2">{petOption.icon}</Text>
                      <Text className="font-medium" style={{ color: COLORS.text }}>
                        {petOption.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* AI Help Tab */}
        {activeTab === 'ai' && (
          <View className="p-4">
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: COLORS.primary + '20' }}>
                <Text className="text-4xl">🤖</Text>
              </View>
              <Text className="text-xl font-bold" style={{ color: COLORS.text }}>
                WACHS AI Assistant
              </Text>
              <Text className="text-sm" style={{ color: COLORS.muted }}>
                I'm here to help with your health journey
              </Text>
            </View>

            {aiResponse && (
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.primary + '10' }}>
                <Text className="text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                  AI Response
                </Text>
                <Text style={{ color: COLORS.text }}>{aiResponse}</Text>
              </View>
            )}

            <View className="flex-row mb-4">
              <TextInput
                value={aiMessage}
                onChangeText={setAiMessage}
                placeholder="Ask me anything..."
                className="flex-1 border rounded-l-xl px-4 py-3"
                style={{ borderColor: COLORS.primary, color: COLORS.text }}
                placeholderTextColor={COLORS.muted}
              />
              <Pressable
                onPress={handleAskAI}
                className="px-4 rounded-r-xl items-center justify-center"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Text className="text-white text-lg">➤</Text>
              </Pressable>
            </View>

            {/* Quick Questions */}
            <Text className="text-sm font-medium mb-2" style={{ color: COLORS.text }}>
              Quick Questions
            </Text>
            {[
              'How do I book an appointment?',
              'Where is the pharmacy?',
              'What medications am I taking?',
              'I need help!',
            ].map((question, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  setAiMessage(question);
                  handleAskAI();
                }}
                className="rounded-lg px-4 py-3 mb-2"
                style={{ backgroundColor: COLORS.background }}
              >
                <Text style={{ color: COLORS.text }}>{question}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row border-t px-4 py-2" style={{ borderColor: '#E5E7EB' }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-1 py-2 items-center"
        >
          <Text style={{ color: COLORS.muted }}>← Back</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/ahd-wizard')}
          className="flex-1 py-2 items-center rounded-lg"
          style={{ backgroundColor: COLORS.accent }}
        >
          <Text className="text-white font-medium">📋 Health Directive</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
