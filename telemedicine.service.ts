/**
 * Telemedicine Service
 * Manages video calls, messaging, and remote consultations
 */

export interface VideoCall {
  id: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  roomUrl: string;
  recordingUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  read: boolean;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  lastMessageTime: number;
  unreadCount: number;
}

export class TelemedicineService {
  private static instance: TelemedicineService;
  private apiUrl = process.env.EXPO_PUBLIC_API_URL;
  private activeCall: VideoCall | null = null;
  private messageListeners: Set<(message: Message) => void> = new Set();

  private constructor() {}

  static getInstance(): TelemedicineService {
    if (!TelemedicineService.instance) {
      TelemedicineService.instance = new TelemedicineService();
    }
    return TelemedicineService.instance;
  }

  /**
   * Start video call for appointment
   */
  async startVideoCall(appointmentId: string): Promise<VideoCall> {
    try {
      const response = await fetch(`${this.apiUrl}/telemedicine/video-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) throw new Error('Failed to start video call');
      
      const call = await response.json();
      this.activeCall = call;
      
      // Setup call listeners
      this.setupCallListeners(call.id);
      
      return call;
    } catch (error) {
      console.error('Failed to start video call:', error);
      throw error;
    }
  }

  /**
   * End video call
   */
  async endVideoCall(callId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/telemedicine/video-calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to end video call');
      
      this.activeCall = null;
    } catch (error) {
      console.error('Failed to end video call:', error);
      throw error;
    }
  }

  /**
   * Get call recording
   */
  async getCallRecording(callId: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.apiUrl}/telemedicine/video-calls/${callId}/recording`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to get recording');
      const data = await response.json();
      return data.recordingUrl;
    } catch (error) {
      console.error('Failed to get recording:', error);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    try {
      const response = await fetch(`${this.apiUrl}/telemedicine/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ conversationId, content }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/telemedicine/conversations/${conversationId}/messages?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${this.apiUrl}/telemedicine/conversations`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');
      return await response.json();
    } catch (error) {
      console.error('Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * Create or get conversation
   */
  async getOrCreateConversation(participantIds: string[]): Promise<Conversation> {
    try {
      const response = await fetch(`${this.apiUrl}/telemedicine/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ participantIds }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      return await response.json();
    } catch (error) {
      console.error('Failed to get or create conversation:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/telemedicine/messages/${messageId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to mark message as read');
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  /**
   * Setup call listeners
   */
  private setupCallListeners(callId: string): void {
    // TODO: Implement WebSocket listeners for real-time updates
    // This would connect to a WebSocket server to receive:
    // - Call status updates
    // - Participant join/leave events
    // - Call quality metrics
  }

  /**
   * Subscribe to messages
   */
  subscribe(listener: (message: Message) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Get active call
   */
  getActiveCall(): VideoCall | null {
    return this.activeCall;
  }

  /**
   * Get access token
   */
  private getAccessToken(): string {
    // TODO: Get from auth service
    return '';
  }
}
