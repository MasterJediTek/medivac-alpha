/**
 * MediVac One - Virtual Staff Assistant Screen
 * Staff-facing AI assistant with LLM backend and voice interaction
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { llmBackend, type AIPersonaRole, type LLMResponse, type SuggestedAction } from '@/lib/services/llm-backend-service';
import { voiceInteraction, type TranscriptionResult } from '@/lib/services/voice-interaction-service';

// ==========================================
// Types
// ==========================================

interface AIPersona {
  id: string;
  role: AIPersonaRole;
  name: string;
  avatar: string;
  title: string;
  color: string;
  wakeWord: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  persona?: AIPersonaRole;
  actions?: SuggestedAction[];
  isStreaming?: boolean;
  confidence?: number;
  sources?: string[];
}

// ==========================================
// AI Personas
// ==========================================

const AI_PERSONAS: AIPersona[] = [
  { id: 'doctor', role: 'doctor', name: 'Dr. ARIA', avatar: '👨‍⚕️', title: 'Clinical Assistant', color: '#3B82F6', wakeWord: 'Hey ARIA' },
  { id: 'nurse', role: 'nurse', name: 'Nurse NOVA', avatar: '👩‍⚕️', title: 'Nursing Assistant', color: '#EC4899', wakeWord: 'Hey NOVA' },
  { id: 'admin', role: 'admin', name: 'ALEX Admin', avatar: '👔', title: 'Admin Assistant', color: '#8B5CF6', wakeWord: 'Hey ALEX' },
  { id: 'pharmacist', role: 'pharmacist', name: 'PHARMA-X', avatar: '💊', title: 'Pharmacy Assistant', color: '#10B981', wakeWord: 'Hey PHARMA' },
  { id: 'lab_tech', role: 'lab_tech', name: 'LAB-E', avatar: '🔬', title: 'Lab Assistant', color: '#F59E0B', wakeWord: 'Hey LAB-E' },
  { id: 'emergency', role: 'emergency', name: 'CODE RED', avatar: '🚨', title: 'Emergency Response', color: '#EF4444', wakeWord: 'Code Red' },
  { id: 'jedi_commander', role: 'jedi_commander', name: 'Commander JEDI', avatar: '⚔️', title: 'JEDI Command', color: '#6366F1', wakeWord: 'Commander' },
];

// ==========================================
// Virtual Assistant Screen
// ==========================================

export default function VirtualAssistantScreen() {
  const colors = useColors();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [currentPersona, setCurrentPersona] = useState<AIPersona>(AI_PERSONAS[0]);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [jediLevel] = useState('Master');

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      const context = await llmBackend.createConversation(
        currentPersona.role,
        'staff_user',
        undefined,
        { department: 'General', urgencyLevel: 'routine' }
      );
      setSessionId(context.sessionId);

      // Send initial greeting
      const greeting = await llmBackend.sendMessage(
        context.sessionId,
        'Hello, I just logged in. Please introduce yourself and tell me how you can help.',
        {
          onToken: (token) => setStreamingText(prev => prev + token),
          onComplete: (response) => {
            setStreamingText('');
            addAssistantMessage(response);
          },
          onError: (error) => console.error('LLM Error:', error),
        }
      );
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      // Fallback greeting
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm ${currentPersona.name}, your ${currentPersona.title}. How can I assist you today?`,
        timestamp: new Date(),
        persona: currentPersona.role,
      }]);
    }
  };

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Voice event handlers
  useEffect(() => {
    voiceInteraction.on('listening_started', () => setIsListening(true));
    voiceInteraction.on('listening_stopped', () => setIsListening(false));
    voiceInteraction.on('speech_started', () => setIsSpeaking(true));
    voiceInteraction.on('speech_ended', () => setIsSpeaking(false));

    return () => {
      voiceInteraction.off('listening_started');
      voiceInteraction.off('listening_stopped');
      voiceInteraction.off('speech_started');
      voiceInteraction.off('speech_ended');
    };
  }, []);

  const addAssistantMessage = (response: LLMResponse) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      persona: currentPersona.role,
      actions: response.suggestedActions,
      confidence: response.confidence,
      sources: response.sources,
    };
    setMessages(prev => [...prev, message]);

    // Speak response if voice is enabled
    if (voiceEnabled && response.content) {
      speakResponse(response.content);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      await voiceInteraction.speak({
        text,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      const result = await voiceInteraction.stopListening();
      if (result && result.text) {
        setInputText(result.text);
        // Auto-send after voice input
        handleSendWithText(result.text);
      }
    } else {
      setInputText('');
      await voiceInteraction.startListening({
        onResult: (result: TranscriptionResult) => {
          if (result.isFinal) {
            setInputText(result.text);
          } else {
            setInputText(result.text + '...');
          }
        },
        onError: (error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
        },
      });
    }
  };

  const toggleHandsFreeMode = async () => {
    if (handsFreeMode) {
      await voiceInteraction.disableHandsFreeMode();
      setHandsFreeMode(false);
    } else {
      await voiceInteraction.enableHandsFreeMode();
      setHandsFreeMode(true);
    }
  };

  const switchPersona = async (persona: AIPersona) => {
    setCurrentPersona(persona);
    setShowPersonaSelector(false);
    
    // Create new conversation for new persona
    try {
      const context = await llmBackend.createConversation(
        persona.role,
        'staff_user',
        undefined,
        { department: 'General', urgencyLevel: 'routine' }
      );
      setSessionId(context.sessionId);

      const systemMessage: Message = {
        id: Date.now().toString() + '_sys',
        role: 'system',
        content: `Switched to ${persona.name} (${persona.title})`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);

      // Get greeting from new persona
      const response = await llmBackend.sendMessage(
        context.sessionId,
        'Hello, I just switched to you. Please introduce yourself.',
        {
          onToken: (token) => setStreamingText(prev => prev + token),
          onComplete: (response) => {
            setStreamingText('');
            addAssistantMessage(response);
          },
          onError: (error) => console.error('LLM Error:', error),
        }
      );
    } catch (error) {
      console.error('Failed to switch persona:', error);
    }
  };

  const handleSend = () => {
    handleSendWithText(inputText.trim());
  };

  const handleSendWithText = async (text: string) => {
    if (!text || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setStreamingText('');

    try {
      // Check for voice commands first
      const commandResult = voiceInteraction.processVoiceCommand(text);
      if (commandResult.recognized && commandResult.action) {
        // Handle voice command
        const commandMessage: Message = {
          id: Date.now().toString() + '_cmd',
          role: 'system',
          content: `Voice command recognized: ${commandResult.command?.description}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, commandMessage]);
      }

      // Send to LLM
      await llmBackend.sendMessage(
        sessionId,
        text,
        {
          onToken: (token) => setStreamingText(prev => prev + token),
          onComplete: (response) => {
            setStreamingText('');
            setIsTyping(false);
            addAssistantMessage(response);
          },
          onError: (error) => {
            console.error('LLM Error:', error);
            setIsTyping(false);
            setStreamingText('');
            // Add error message
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'I apologize, but I encountered an error processing your request. Please try again.',
              timestamp: new Date(),
              persona: currentPersona.role,
            }]);
          },
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const handleAction = async (action: SuggestedAction) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Action: ${action.label}]`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    if (action.requiresConfirmation) {
      // Show confirmation
      const confirmMessage: Message = {
        id: Date.now().toString() + '_confirm',
        role: 'assistant',
        content: `⚠️ **Confirmation Required**\n\nYou're about to: ${action.description}\n\nPlease confirm by saying "Yes" or "Confirm", or cancel by saying "No" or "Cancel".`,
        timestamp: new Date(),
        persona: currentPersona.role,
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      if (voiceEnabled) {
        await speakResponse(`Confirmation required. You're about to ${action.description}. Please confirm or cancel.`);
      }
    } else {
      // Execute action directly
      setIsTyping(true);
      
      if (sessionId) {
        await llmBackend.sendMessage(
          sessionId,
          `Execute action: ${action.label}. ${action.description}`,
          {
            onToken: (token) => setStreamingText(prev => prev + token),
            onComplete: (response) => {
              setStreamingText('');
              setIsTyping(false);
              addAssistantMessage(response);
            },
            onError: (error) => {
              console.error('Action error:', error);
              setIsTyping(false);
            },
          }
        );
      }
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <Text style={[styles.systemMessage, { color: colors.muted }]}>
            {message.content}
          </Text>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          { backgroundColor: isUser ? currentPersona.color : colors.surface },
        ]}
      >
        {!isUser && (
          <View style={styles.messageHeader}>
            <Text style={styles.avatarText}>{currentPersona.avatar}</Text>
            <Text style={[styles.personaName, { color: currentPersona.color }]}>
              {currentPersona.name}
            </Text>
            {message.confidence && (
              <Text style={[styles.confidenceBadge, { color: colors.muted }]}>
                {Math.round(message.confidence * 100)}% confident
              </Text>
            )}
          </View>
        )}
        <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : colors.foreground }]}>
          {message.content}
        </Text>
        {message.sources && message.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <Text style={[styles.sourcesLabel, { color: colors.muted }]}>Sources:</Text>
            {message.sources.map((source, index) => (
              <Text key={index} style={[styles.sourceText, { color: colors.muted }]}>
                • {source}
              </Text>
            ))}
          </View>
        )}
        {message.actions && message.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {message.actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionButton, { backgroundColor: currentPersona.color + '20', borderColor: currentPersona.color }]}
                onPress={() => handleAction(action)}
              >
                <Text style={[styles.actionText, { color: currentPersona.color }]}>
                  {action.label}
                </Text>
                {action.requiresConfirmation && (
                  <Text style={[styles.confirmBadge, { color: '#F59E0B' }]}>⚠️</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.muted }]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.personaHeader}
            onPress={() => setShowPersonaSelector(true)}
          >
            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.avatar, { backgroundColor: currentPersona.color + '20' }]}>
                <Text style={styles.avatarText}>{currentPersona.avatar}</Text>
              </View>
              {isListening && (
                <View style={[styles.listeningIndicator, { backgroundColor: '#EF4444' }]} />
              )}
              {isSpeaking && (
                <View style={[styles.speakingIndicator, { backgroundColor: '#10B981' }]} />
              )}
            </Animated.View>
            <View style={styles.personaInfo}>
              <Text style={[styles.personaName, { color: colors.foreground }]}>{currentPersona.name}</Text>
              <Text style={[styles.personaTitle, { color: colors.muted }]}>{currentPersona.title}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.voiceToggle, voiceEnabled && styles.voiceToggleActive, { backgroundColor: voiceEnabled ? '#10B981' + '20' : colors.surface }]}
              onPress={() => setVoiceEnabled(!voiceEnabled)}
            >
              <IconSymbol name={voiceEnabled ? 'speaker.wave.2.fill' : 'speaker.slash.fill'} size={20} color={voiceEnabled ? '#10B981' : colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.handsFreeToggle, handsFreeMode && styles.handsFreeActive, { backgroundColor: handsFreeMode ? currentPersona.color + '20' : colors.surface }]}
              onPress={toggleHandsFreeMode}
            >
              <IconSymbol name="waveform" size={20} color={handsFreeMode ? currentPersona.color : colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* JEDI Status Bar */}
        <View style={[styles.jediBar, { backgroundColor: '#6366F1' + '15' }]}>
          <Text style={styles.jediIcon}>⚔️</Text>
          <Text style={[styles.jediText, { color: '#6366F1' }]}>JEDI {jediLevel}</Text>
          <View style={[styles.jediStatus, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.jediStatusText, { color: colors.muted }]}>Connected</Text>
          {handsFreeMode && (
            <View style={styles.handsFreeIndicator}>
              <Text style={[styles.handsFreeText, { color: currentPersona.color }]}>
                🎤 Say "{currentPersona.wakeWord}"
              </Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {/* Streaming text */}
          {streamingText && (
            <View style={[styles.messageContainer, styles.assistantMessage, { backgroundColor: colors.surface }]}>
              <View style={styles.messageHeader}>
                <Text style={styles.avatarText}>{currentPersona.avatar}</Text>
                <Text style={[styles.personaName, { color: currentPersona.color }]}>
                  {currentPersona.name}
                </Text>
              </View>
              <Text style={[styles.messageText, { color: colors.foreground }]}>
                {streamingText}
                <Text style={{ color: currentPersona.color }}>▊</Text>
              </Text>
            </View>
          )}
          
          {/* Typing indicator */}
          {isTyping && !streamingText && (
            <View style={[styles.typingContainer, { backgroundColor: colors.surface }]}>
              <Text style={styles.avatarText}>{currentPersona.avatar}</Text>
              <View style={styles.typingDots}>
                <Animated.View style={[styles.typingDot, { backgroundColor: currentPersona.color }]} />
                <Animated.View style={[styles.typingDot, { backgroundColor: currentPersona.color, opacity: 0.7 }]} />
                <Animated.View style={[styles.typingDot, { backgroundColor: currentPersona.color, opacity: 0.4 }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isListening && styles.voiceButtonActive,
              { backgroundColor: isListening ? '#EF4444' : currentPersona.color + '20' }
            ]}
            onPress={handleVoiceInput}
          >
            <IconSymbol 
              name={isListening ? 'stop.fill' : 'mic.fill'} 
              size={24} 
              color={isListening ? '#FFFFFF' : currentPersona.color} 
            />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder={isListening ? 'Listening...' : `Ask ${currentPersona.name}...`}
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={1000}
            editable={!isListening}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? currentPersona.color : colors.muted }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Persona Selector Modal */}
        <Modal
          visible={showPersonaSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPersonaSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Switch AI Assistant</Text>
                <TouchableOpacity onPress={() => setShowPersonaSelector(false)}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.personaList}>
                {AI_PERSONAS.map((persona) => (
                  <TouchableOpacity
                    key={persona.id}
                    style={[
                      styles.personaItem,
                      { backgroundColor: colors.surface, borderColor: persona.id === currentPersona.id ? persona.color : colors.border }
                    ]}
                    onPress={() => switchPersona(persona)}
                  >
                    <View style={[styles.personaAvatar, { backgroundColor: persona.color + '20' }]}>
                      <Text style={styles.personaAvatarText}>{persona.avatar}</Text>
                    </View>
                    <View style={styles.personaDetails}>
                      <Text style={[styles.personaItemName, { color: colors.foreground }]}>{persona.name}</Text>
                      <Text style={[styles.personaItemTitle, { color: colors.muted }]}>{persona.title}</Text>
                      <Text style={[styles.wakeWordText, { color: persona.color }]}>"{persona.wakeWord}"</Text>
                    </View>
                    {persona.id === currentPersona.id && (
                      <View style={[styles.activeBadge, { backgroundColor: persona.color }]}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  personaHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  listeningIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  personaInfo: {
    marginLeft: 12,
    flex: 1,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
  },
  personaTitle: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceToggleActive: {},
  handsFreeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handsFreeActive: {},
  jediBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  jediIcon: {
    fontSize: 16,
  },
  jediText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jediStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  jediStatusText: {
    fontSize: 12,
  },
  handsFreeIndicator: {
    marginLeft: 'auto',
  },
  handsFreeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  confidenceBadge: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  confirmBadge: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
  },
  systemMessageContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  systemMessage: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {},
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  personaList: {
    padding: 16,
  },
  personaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  personaAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaAvatarText: {
    fontSize: 28,
  },
  personaDetails: {
    flex: 1,
    marginLeft: 16,
  },
  personaItemName: {
    fontSize: 17,
    fontWeight: '600',
  },
  personaItemTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  wakeWordText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
