/**
 * MediVac One - Virtual Receptionist Screen
 * Patient-facing AI reception interface
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

// ==========================================
// Types
// ==========================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickActions?: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
}

// ==========================================
// Virtual Receptionist Screen
// ==========================================

export default function VirtualReceptionistScreen() {
  const colors = useColors();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello and welcome to MediVac One! 👋\n\nI'm RUBY, your virtual receptionist. I'm here to help you with:\n\n• Checking in for appointments\n• Scheduling new appointments\n• Finding your way around\n• Answering questions about our services\n\nHow can I assist you today?",
      timestamp: new Date(),
      quickActions: [
        { id: 'qa1', label: 'Check In', icon: 'checkmark.circle.fill', action: 'check_in' },
        { id: 'qa2', label: 'Book Appointment', icon: 'calendar', action: 'book_appointment' },
        { id: 'qa3', label: 'Get Directions', icon: 'map.fill', action: 'directions' },
        { id: 'qa4', label: 'Contact Doctor', icon: 'message.fill', action: 'contact' },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Pulse animation for avatar
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(inputText.trim());
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    let userMessage = '';
    switch (action) {
      case 'check_in':
        userMessage = "I'd like to check in for my appointment";
        break;
      case 'book_appointment':
        userMessage = "I want to book a new appointment";
        break;
      case 'directions':
        userMessage = "Can you help me find my way?";
        break;
      case 'contact':
        userMessage = "I need to contact my doctor";
        break;
      default:
        userMessage = action;
    }

    const message: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(userMessage);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (input: string): Message => {
    const lowerInput = input.toLowerCase();
    let content = '';
    let quickActions: QuickAction[] = [];

    if (lowerInput.includes('check in') || lowerInput.includes('checkin')) {
      content = "Great! I can help you check in for your appointment. 📋\n\nTo verify your identity, please confirm:\n\n1. Your full name\n2. Date of birth\n3. The time of your appointment\n\nOr you can scan the QR code on your appointment confirmation.";
      quickActions = [
        { id: 'scan', label: 'Scan QR Code', icon: 'qrcode', action: 'I want to scan my QR code' },
        { id: 'manual', label: 'Enter Details', icon: 'pencil', action: 'I will enter my details manually' },
      ];
    } else if (lowerInput.includes('book') || lowerInput.includes('appointment') || lowerInput.includes('schedule')) {
      content = "I'd be happy to help you schedule an appointment! 📅\n\nWhat type of appointment do you need?\n\n• General consultation\n• Specialist referral\n• Follow-up visit\n• Urgent care\n\nPlease select an option or tell me more about what you need.";
      quickActions = [
        { id: 'general', label: 'General', icon: 'stethoscope', action: 'I need a general consultation' },
        { id: 'specialist', label: 'Specialist', icon: 'person.fill', action: 'I need to see a specialist' },
        { id: 'followup', label: 'Follow-up', icon: 'arrow.triangle.2.circlepath', action: 'I need a follow-up appointment' },
        { id: 'urgent', label: 'Urgent', icon: 'exclamationmark.triangle.fill', action: 'I need urgent care' },
      ];
    } else if (lowerInput.includes('direction') || lowerInput.includes('find') || lowerInput.includes('where') || lowerInput.includes('way')) {
      content = "I can help you navigate our facility! 🗺️\n\nWhere would you like to go?\n\n• Emergency Department\n• Outpatient Clinics\n• Radiology / Imaging\n• Pathology / Labs\n• Pharmacy\n• Cafeteria\n• Parking\n\nJust let me know your destination!";
      quickActions = [
        { id: 'emergency', label: 'Emergency', icon: 'cross.fill', action: 'Take me to Emergency' },
        { id: 'clinics', label: 'Clinics', icon: 'building.2.fill', action: 'Take me to Outpatient Clinics' },
        { id: 'labs', label: 'Labs', icon: 'stethoscope', action: 'Take me to Pathology' },
        { id: 'pharmacy', label: 'Pharmacy', icon: 'pills.fill', action: 'Take me to Pharmacy' },
      ];
    } else if (lowerInput.includes('contact') || lowerInput.includes('doctor') || lowerInput.includes('message')) {
      content = "I can help you get in touch with your care team! 💬\n\nHow would you like to contact them?\n\n• Send a secure message\n• Request a callback\n• View contact information\n• Schedule a telehealth visit\n\nNote: For medical emergencies, please go directly to the Emergency Department or call 000.";
      quickActions = [
        { id: 'message', label: 'Send Message', icon: 'message.fill', action: 'I want to send a message' },
        { id: 'callback', label: 'Request Callback', icon: 'phone.fill', action: 'I want a callback' },
        { id: 'telehealth', label: 'Telehealth', icon: 'video.fill', action: 'I want a telehealth visit' },
      ];
    } else if (lowerInput.includes('wait') || lowerInput.includes('how long')) {
      content = "Let me check the current wait times for you... ⏱️\n\n**Current Wait Times:**\n\n• Emergency Department: ~45 minutes\n• Outpatient Clinics: ~15 minutes\n• Radiology: ~20 minutes\n• Pathology: ~10 minutes\n\nThese are estimates and may vary. Would you like me to notify you when it's your turn?";
      quickActions = [
        { id: 'notify', label: 'Notify Me', icon: 'bell.fill', action: 'Please notify me when its my turn' },
      ];
    } else if (lowerInput.includes('urgent') || lowerInput.includes('emergency')) {
      content = "⚠️ **If this is a medical emergency, please proceed immediately to the Emergency Department or call 000.**\n\nFor urgent but non-emergency care, I can help you:\n\n• Find the nearest urgent care clinic\n• Check emergency wait times\n• Contact on-call staff\n\nHow can I assist you?";
      quickActions = [
        { id: 'ed', label: 'Go to ED', icon: 'cross.fill', action: 'Take me to Emergency Department' },
        { id: 'urgent_clinic', label: 'Urgent Clinic', icon: 'stethoscope', action: 'Find urgent care clinic' },
      ];
    } else if (lowerInput.includes('thank')) {
      content = "You're very welcome! 😊\n\nIs there anything else I can help you with today?\n\nRemember, I'm available 24/7 to assist with:\n• Appointments\n• Directions\n• General questions\n• Connecting with your care team";
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      content = "Hello! 👋 Welcome to MediVac One!\n\nI'm RUBY, your virtual receptionist. How can I help you today?\n\nI can assist with check-ins, appointments, directions, and answering questions about our services.";
      quickActions = [
        { id: 'qa1', label: 'Check In', icon: 'checkmark.circle.fill', action: 'check_in' },
        { id: 'qa2', label: 'Book Appointment', icon: 'calendar', action: 'book_appointment' },
        { id: 'qa3', label: 'Get Directions', icon: 'map.fill', action: 'directions' },
      ];
    } else {
      content = "I understand you're asking about: \"" + input + "\"\n\nLet me help you with that. Could you please provide a bit more detail, or select one of these common options?\n\nIf you need immediate assistance, please speak to one of our staff members at the front desk.";
      quickActions = [
        { id: 'qa1', label: 'Check In', icon: 'checkmark.circle.fill', action: 'check_in' },
        { id: 'qa2', label: 'Book Appointment', icon: 'calendar', action: 'book_appointment' },
        { id: 'qa3', label: 'Get Directions', icon: 'map.fill', action: 'directions' },
        { id: 'qa4', label: 'Speak to Staff', icon: 'person.fill', action: 'I need to speak to a staff member' },
      ];
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      quickActions: quickActions.length > 0 ? quickActions : undefined,
    };
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.avatarEmoji}>💁‍♀️</Text>
          </Animated.View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>RUBY</Text>
            <Text style={styles.headerSubtitle}>Virtual Receptionist • Online</Text>
          </View>
        </View>
        <View style={styles.statusDot} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  message.role === 'user'
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                {message.role === 'assistant' && (
                  <View style={styles.assistantHeader}>
                    <Text style={styles.assistantAvatar}>💁‍♀️</Text>
                    <Text style={[styles.assistantName, { color: colors.primary }]}>RUBY</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.messageText,
                    { color: message.role === 'user' ? '#FFFFFF' : colors.foreground },
                  ]}
                >
                  {message.content}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : colors.muted },
                  ]}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {/* Quick Actions */}
              {message.quickActions && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.quickActionsContainer}
                  contentContainerStyle={styles.quickActionsContent}
                >
                  {message.quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                      onPress={() => handleQuickAction(action.action)}
                    >
                      <IconSymbol name={action.icon as any} size={18} color={colors.primary} />
                      <Text style={[styles.quickActionText, { color: colors.primary }]}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.typingContainer, { backgroundColor: colors.surface }]}>
              <Text style={styles.typingAvatar}>💁‍♀️</Text>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { backgroundColor: colors.muted }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.muted }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.muted }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.muted }]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            For medical emergencies, please call 000 or go to Emergency
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantAvatar: {
    fontSize: 20,
  },
  assistantName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  quickActionsContainer: {
    marginBottom: 12,
  },
  quickActionsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingAvatar: {
    fontSize: 20,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
