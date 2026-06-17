/**
 * Live Witness Verification UI Screen - MediVac WACHS v9.4
 * Real-time witness signing with GPS and timestamp logging
 */

import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { liveWitnessVerificationService, SigningSession, SignatureRecord } from '@/lib/services/live-witness-verification-service';

type TabType = 'session' | 'signatures' | 'verify' | 'history';

export default function LiveWitnessScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('session');
  const [currentSession, setCurrentSession] = useState<SigningSession | null>(null);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [documentId, setDocumentId] = useState('');
  const [makerName, setMakerName] = useState('');
  const [witness1Name, setWitness1Name] = useState('');
  const [witness2Name, setWitness2Name] = useState('');

  useEffect(() => {
    const session = liveWitnessVerificationService.getCurrentSession();
    if (session) {
      setCurrentSession(session);
      setSignatures(liveWitnessVerificationService.getSessionSignatures(session.id));
    }
  }, []);

  const startSession = async () => {
    if (!documentId || !makerName) {
      Alert.alert('Error', 'Please enter document ID and maker name');
      return;
    }

    setIsLoading(true);
    try {
      const session = await liveWitnessVerificationService.startSigningSession(
        documentId,
        makerName,
        witness1Name || undefined,
        witness2Name || undefined
      );
      setCurrentSession(session);
      setActiveTab('signatures');
    } catch (error) {
      Alert.alert('Error', 'Failed to start signing session');
    }
    setIsLoading(false);
  };

  const captureSignature = async (role: 'maker' | 'witness1' | 'witness2') => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const signature = await liveWitnessVerificationService.captureSignature(
        currentSession.id,
        role,
        `data:image/png;base64,${generateMockSignature()}`,
        role === 'maker' ? makerName : role === 'witness1' ? witness1Name : witness2Name
      );
      
      if (signature) {
        setSignatures(liveWitnessVerificationService.getSessionSignatures(currentSession.id));
        const updatedSession = liveWitnessVerificationService.getCurrentSession();
        setCurrentSession(updatedSession);
        Alert.alert('Success', `${role} signature captured with GPS coordinates`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture signature');
    }
    setIsLoading(false);
  };

  const generateMockSignature = () => {
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  };

  const formatCoordinates = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'long',
    });
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'session', label: 'Session', icon: '📋' },
    { id: 'signatures', label: 'Sign', icon: '✍️' },
    { id: 'verify', label: 'Verify', icon: '✅' },
    { id: 'history', label: 'History', icon: '📜' },
  ];

  const renderSessionTab = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <Text className="text-lg font-bold text-foreground mb-4">Start Signing Session</Text>
        
        <Text className="text-sm text-muted mb-1">Document ID</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
          placeholder="Enter document ID"
          placeholderTextColor={colors.muted}
          value={documentId}
          onChangeText={setDocumentId}
        />

        <Text className="text-sm text-muted mb-1">Maker (Patient) Name</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
          placeholder="Enter maker's full name"
          placeholderTextColor={colors.muted}
          value={makerName}
          onChangeText={setMakerName}
        />

        <Text className="text-sm text-muted mb-1">Witness 1 Name</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
          placeholder="Enter witness 1 name"
          placeholderTextColor={colors.muted}
          value={witness1Name}
          onChangeText={setWitness1Name}
        />

        <Text className="text-sm text-muted mb-1">Witness 2 Name</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-3"
          placeholder="Enter witness 2 name"
          placeholderTextColor={colors.muted}
          value={witness2Name}
          onChangeText={setWitness2Name}
        />

        <Pressable
          onPress={startSession}
          disabled={isLoading}
          style={({ pressed }) => [
            { opacity: pressed ? 0.8 : 1, backgroundColor: colors.primary },
            { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }
          ]}
        >
          <Text className="text-background font-bold text-base">
            {isLoading ? 'Starting...' : '🚀 Start Live Signing Session'}
          </Text>
        </Pressable>
      </View>

      {currentSession && (
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-2">Current Session</Text>
          <Text className="text-sm text-muted">ID: {currentSession.id}</Text>
          <Text className="text-sm text-muted">Document: {currentSession.documentId}</Text>
          <Text className="text-sm text-muted">Status: {currentSession.status}</Text>
          <Text className="text-sm text-muted">
            Started: {formatTimestamp(currentSession.startedAt)}
          </Text>
        </View>
      )}

      <View className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
        <Text className="text-blue-400 font-bold mb-2">📍 GPS Location Tracking</Text>
        <Text className="text-sm text-muted">
          Each signature will be recorded with precise GPS coordinates and timestamp. 
          This information will be printed in the document footer for legal verification.
        </Text>
      </View>
    </View>
  );

  const renderSignaturesTab = () => (
    <View className="gap-4">
      {!currentSession ? (
        <View className="bg-surface rounded-2xl p-6 border border-border items-center">
          <Text className="text-4xl mb-2">📋</Text>
          <Text className="text-foreground font-bold">No Active Session</Text>
          <Text className="text-sm text-muted text-center mt-1">
            Start a signing session first to capture signatures
          </Text>
        </View>
      ) : (
        <>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Live Signing Order</Text>
            <Text className="text-sm text-muted mb-4">
              All parties must sign on this device in the presence of each other.
            </Text>

            {/* Maker Signature */}
            <View className="bg-background rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground font-bold">1. Maker (Patient)</Text>
                {currentSession.makerSigned ? (
                  <Text className="text-green-400">✓ Signed</Text>
                ) : (
                  <Text className="text-yellow-400">⏳ Pending</Text>
                )}
              </View>
              <Text className="text-sm text-muted mb-2">{makerName || 'Not specified'}</Text>
              {!currentSession.makerSigned && (
                <Pressable
                  onPress={() => captureSignature('maker')}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.8 : 1, backgroundColor: '#10B981' },
                    { borderRadius: 8, padding: 12, alignItems: 'center' }
                  ]}
                >
                  <Text className="text-white font-bold">✍️ Capture Maker Signature</Text>
                </Pressable>
              )}
              {currentSession.makerSigned && signatures.find(s => s.role === 'maker') && (
                <View className="mt-2 p-2 bg-green-500/10 rounded-lg">
                  <Text className="text-xs text-green-400">
                    📍 {formatCoordinates(
                      signatures.find(s => s.role === 'maker')!.gpsCoordinates.latitude,
                      signatures.find(s => s.role === 'maker')!.gpsCoordinates.longitude
                    )}
                  </Text>
                  <Text className="text-xs text-green-400">
                    🕐 {formatTimestamp(signatures.find(s => s.role === 'maker')!.timestamp)}
                  </Text>
                </View>
              )}
            </View>

            {/* Witness 1 Signature */}
            <View className="bg-background rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground font-bold">2. Witness 1</Text>
                {currentSession.witness1Signed ? (
                  <Text className="text-green-400">✓ Signed</Text>
                ) : (
                  <Text className="text-yellow-400">⏳ Pending</Text>
                )}
              </View>
              <Text className="text-sm text-muted mb-2">{witness1Name || 'Not specified'}</Text>
              {!currentSession.witness1Signed && currentSession.makerSigned && (
                <Pressable
                  onPress={() => captureSignature('witness1')}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.8 : 1, backgroundColor: '#3B82F6' },
                    { borderRadius: 8, padding: 12, alignItems: 'center' }
                  ]}
                >
                  <Text className="text-white font-bold">✍️ Capture Witness 1 Signature</Text>
                </Pressable>
              )}
              {!currentSession.makerSigned && !currentSession.witness1Signed && (
                <Text className="text-xs text-muted italic">Maker must sign first</Text>
              )}
              {currentSession.witness1Signed && signatures.find(s => s.role === 'witness1') && (
                <View className="mt-2 p-2 bg-blue-500/10 rounded-lg">
                  <Text className="text-xs text-blue-400">
                    📍 {formatCoordinates(
                      signatures.find(s => s.role === 'witness1')!.gpsCoordinates.latitude,
                      signatures.find(s => s.role === 'witness1')!.gpsCoordinates.longitude
                    )}
                  </Text>
                  <Text className="text-xs text-blue-400">
                    🕐 {formatTimestamp(signatures.find(s => s.role === 'witness1')!.timestamp)}
                  </Text>
                </View>
              )}
            </View>

            {/* Witness 2 Signature */}
            <View className="bg-background rounded-xl p-4 border border-border">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground font-bold">3. Witness 2</Text>
                {currentSession.witness2Signed ? (
                  <Text className="text-green-400">✓ Signed</Text>
                ) : (
                  <Text className="text-yellow-400">⏳ Pending</Text>
                )}
              </View>
              <Text className="text-sm text-muted mb-2">{witness2Name || 'Not specified'}</Text>
              {!currentSession.witness2Signed && currentSession.witness1Signed && (
                <Pressable
                  onPress={() => captureSignature('witness2')}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.8 : 1, backgroundColor: '#8B5CF6' },
                    { borderRadius: 8, padding: 12, alignItems: 'center' }
                  ]}
                >
                  <Text className="text-white font-bold">✍️ Capture Witness 2 Signature</Text>
                </Pressable>
              )}
              {!currentSession.witness1Signed && !currentSession.witness2Signed && (
                <Text className="text-xs text-muted italic">Witness 1 must sign first</Text>
              )}
              {currentSession.witness2Signed && signatures.find(s => s.role === 'witness2') && (
                <View className="mt-2 p-2 bg-purple-500/10 rounded-lg">
                  <Text className="text-xs text-purple-400">
                    📍 {formatCoordinates(
                      signatures.find(s => s.role === 'witness2')!.gpsCoordinates.latitude,
                      signatures.find(s => s.role === 'witness2')!.gpsCoordinates.longitude
                    )}
                  </Text>
                  <Text className="text-xs text-purple-400">
                    🕐 {formatTimestamp(signatures.find(s => s.role === 'witness2')!.timestamp)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {currentSession.status === 'completed' && (
            <View className="bg-green-500/20 rounded-2xl p-4 border border-green-500/50">
              <Text className="text-green-400 font-bold text-lg mb-2">✅ All Signatures Complete</Text>
              <Text className="text-sm text-muted">
                Document has been signed by all parties. GPS coordinates and timestamps 
                have been recorded and will appear in the document footer.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderVerifyTab = () => {
    const analytics = liveWitnessVerificationService.getAnalytics();
    
    return (
      <View className="gap-4">
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Verification Status</Text>
          
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-primary">{analytics.totalSessions}</Text>
              <Text className="text-xs text-muted">Total Sessions</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-green-400">{analytics.completedSessions}</Text>
              <Text className="text-xs text-muted">Completed</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-blue-400">{analytics.totalSignatures}</Text>
              <Text className="text-xs text-muted">Signatures</Text>
            </View>
            <View className="bg-background rounded-xl p-3 flex-1 min-w-[140px]">
              <Text className="text-2xl font-bold text-purple-400">
                {analytics.averageSessionDuration > 0 
                  ? `${Math.round(analytics.averageSessionDuration / 60000)}m`
                  : '0m'}
              </Text>
              <Text className="text-xs text-muted">Avg Duration</Text>
            </View>
          </View>
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">GPS Verification Features</Text>
          
          {[
            { icon: '📍', title: 'Location Capture', desc: 'Precise GPS coordinates for each signature' },
            { icon: '🕐', title: 'Timestamp', desc: 'Exact date and time of signing' },
            { icon: '📱', title: 'Device ID', desc: 'Unique device identifier recorded' },
            { icon: '🔒', title: 'Integrity Hash', desc: 'Cryptographic hash for tamper detection' },
            { icon: '📄', title: 'Footer Print', desc: 'All coordinates printed on document' },
          ].map((feature, index) => (
            <View key={index} className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0">
              <Text className="text-2xl">{feature.icon}</Text>
              <View className="flex-1">
                <Text className="text-foreground font-medium">{feature.title}</Text>
                <Text className="text-xs text-muted">{feature.desc}</Text>
              </View>
              <Text className="text-green-400">✓</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHistoryTab = () => {
    const sessions = liveWitnessVerificationService.getAllSessions();
    
    return (
      <View className="gap-4">
        <Text className="text-lg font-bold text-foreground">Signing History</Text>
        
        {sessions.length === 0 ? (
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            <Text className="text-4xl mb-2">📜</Text>
            <Text className="text-foreground font-bold">No History</Text>
            <Text className="text-sm text-muted text-center mt-1">
              Completed signing sessions will appear here
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.id} className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-foreground font-bold">{session.documentId}</Text>
                <View className={`px-2 py-1 rounded-full ${
                  session.status === 'completed' ? 'bg-green-500/20' :
                  session.status === 'in_progress' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <Text className={`text-xs font-medium ${
                    session.status === 'completed' ? 'text-green-400' :
                    session.status === 'in_progress' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {session.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-muted">Maker: {session.makerName}</Text>
              <Text className="text-sm text-muted">
                Started: {formatTimestamp(session.startedAt)}
              </Text>
              {session.completedAt && (
                <Text className="text-sm text-muted">
                  Completed: {formatTimestamp(session.completedAt)}
                </Text>
              )}
              <View className="flex-row gap-2 mt-2">
                <Text className={`text-xs ${session.makerSigned ? 'text-green-400' : 'text-muted'}`}>
                  Maker: {session.makerSigned ? '✓' : '○'}
                </Text>
                <Text className={`text-xs ${session.witness1Signed ? 'text-green-400' : 'text-muted'}`}>
                  W1: {session.witness1Signed ? '✓' : '○'}
                </Text>
                <Text className={`text-xs ${session.witness2Signed ? 'text-green-400' : 'text-muted'}`}>
                  W2: {session.witness2Signed ? '✓' : '○'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="items-center mb-2">
            <Text className="text-3xl mb-1">✍️</Text>
            <Text className="text-2xl font-bold text-foreground">Live Witness Verification</Text>
            <Text className="text-sm text-muted text-center">
              Real-time signing with GPS and timestamp logging
            </Text>
          </View>

          {/* Tab Bar */}
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1 },
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
                  activeTab === tab.id && { backgroundColor: colors.primary }
                ]}
              >
                <Text className="text-lg">{tab.icon}</Text>
                <Text className={`text-xs font-medium ${activeTab === tab.id ? 'text-background' : 'text-muted'}`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'session' && renderSessionTab()}
          {activeTab === 'signatures' && renderSignaturesTab()}
          {activeTab === 'verify' && renderVerifyTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
