/**
 * Gifting System Service
 * Manages gifting of items (Tricorders, etc.) between users, avatars, and pets
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medivac_gifts';

export type GiftRecipientType = 'user' | 'avatar' | 'pet';
export type GiftItemType = 'tricorder' | 'credits' | 'pet' | 'cosmetic' | 'consumable';
export type GiftStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface GiftItem {
  type: GiftItemType;
  itemId: string;
  itemName: string;
  itemRarity?: string;
  quantity: number;
  value: number;
}

export interface Gift {
  id: string;
  senderId: string;
  senderName: string;
  senderType: GiftRecipientType;
  recipientId: string;
  recipientName: string;
  recipientType: GiftRecipientType;
  item: GiftItem;
  message?: string;
  status: GiftStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}

export interface GiftWrap {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  color: string;
  cost: number;
}

export const GIFT_WRAPS: GiftWrap[] = [
  { id: 'standard', name: 'Standard', description: 'Simple gift packaging', iconEmoji: '🎁', color: '#3B82F6', cost: 0 },
  { id: 'festive', name: 'Festive', description: 'Holiday themed wrapping', iconEmoji: '🎄', color: '#22C55E', cost: 10 },
  { id: 'romantic', name: 'Romantic', description: 'Heart-themed packaging', iconEmoji: '💝', color: '#EC4899', cost: 15 },
  { id: 'premium', name: 'Premium', description: 'Elegant gold wrapping', iconEmoji: '✨', color: '#F59E0B', cost: 25 },
  { id: 'starfleet', name: 'Starfleet', description: 'Official Starfleet packaging', iconEmoji: '🚀', color: '#1E3A5F', cost: 50 },
  { id: 'legendary', name: 'Legendary', description: 'Rare holographic wrapping', iconEmoji: '🌟', color: '#8B5CF6', cost: 100 },
];

export interface GiftStats {
  totalSent: number;
  totalReceived: number;
  totalValue: number;
  pendingGifts: number;
  mostGiftedItem: string;
  topRecipient: string;
}

class GiftingService {
  private gifts: Gift[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.gifts = JSON.parse(stored);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load gifts:', error);
      this.gifts = [];
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.gifts));
    } catch (error) {
      console.error('Failed to save gifts:', error);
    }
  }

  getGifts(): Gift[] {
    return this.gifts;
  }

  getSentGifts(senderId: string): Gift[] {
    return this.gifts.filter(g => g.senderId === senderId);
  }

  getReceivedGifts(recipientId: string): Gift[] {
    return this.gifts.filter(g => g.recipientId === recipientId);
  }

  getPendingGifts(recipientId: string): Gift[] {
    return this.gifts.filter(g => 
      g.recipientId === recipientId && 
      g.status === 'pending' &&
      new Date(g.expiresAt) > new Date()
    );
  }

  getGiftById(id: string): Gift | undefined {
    return this.gifts.find(g => g.id === id);
  }

  getGiftWraps(): GiftWrap[] {
    return GIFT_WRAPS;
  }

  async sendGift(
    senderId: string,
    senderName: string,
    senderType: GiftRecipientType,
    recipientId: string,
    recipientName: string,
    recipientType: GiftRecipientType,
    item: GiftItem,
    message?: string,
    expirationDays: number = 7
  ): Promise<{ success: boolean; gift?: Gift; error?: string }> {
    // Validate recipient type for tricorders
    if (item.type === 'tricorder') {
      if (recipientType !== 'avatar' && recipientType !== 'pet' && recipientType !== 'user') {
        return { success: false, error: 'Tricorders can only be gifted to users, avatars, or pets' };
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const gift: Gift = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName,
      senderType,
      recipientId,
      recipientName,
      recipientType,
      item,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.gifts.push(gift);
    await this.save();

    return { success: true, gift };
  }

  async acceptGift(giftId: string): Promise<{ success: boolean; error?: string }> {
    const gift = this.gifts.find(g => g.id === giftId);
    if (!gift) {
      return { success: false, error: 'Gift not found' };
    }

    if (gift.status !== 'pending') {
      return { success: false, error: 'Gift is no longer pending' };
    }

    if (new Date(gift.expiresAt) < new Date()) {
      gift.status = 'expired';
      await this.save();
      return { success: false, error: 'Gift has expired' };
    }

    gift.status = 'accepted';
    gift.acceptedAt = new Date().toISOString();
    await this.save();

    return { success: true };
  }

  async declineGift(giftId: string): Promise<{ success: boolean; error?: string }> {
    const gift = this.gifts.find(g => g.id === giftId);
    if (!gift) {
      return { success: false, error: 'Gift not found' };
    }

    if (gift.status !== 'pending') {
      return { success: false, error: 'Gift is no longer pending' };
    }

    gift.status = 'declined';
    gift.declinedAt = new Date().toISOString();
    await this.save();

    return { success: true };
  }

  async cancelGift(giftId: string, senderId: string): Promise<{ success: boolean; error?: string }> {
    const gift = this.gifts.find(g => g.id === giftId);
    if (!gift) {
      return { success: false, error: 'Gift not found' };
    }

    if (gift.senderId !== senderId) {
      return { success: false, error: 'Only the sender can cancel this gift' };
    }

    if (gift.status !== 'pending') {
      return { success: false, error: 'Gift is no longer pending' };
    }

    gift.status = 'cancelled';
    await this.save();

    return { success: true };
  }

  expireOldGifts(): number {
    let expiredCount = 0;
    const now = new Date();

    this.gifts.forEach(gift => {
      if (gift.status === 'pending' && new Date(gift.expiresAt) < now) {
        gift.status = 'expired';
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      this.save();
    }

    return expiredCount;
  }

  getStats(userId: string): GiftStats {
    const sent = this.gifts.filter(g => g.senderId === userId);
    const received = this.gifts.filter(g => g.recipientId === userId);
    const pending = received.filter(g => g.status === 'pending');

    // Calculate most gifted item
    const itemCounts: Record<string, number> = {};
    sent.forEach(g => {
      itemCounts[g.item.itemName] = (itemCounts[g.item.itemName] || 0) + 1;
    });
    const mostGiftedItem = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Calculate top recipient
    const recipientCounts: Record<string, number> = {};
    sent.forEach(g => {
      recipientCounts[g.recipientName] = (recipientCounts[g.recipientName] || 0) + 1;
    });
    const topRecipient = Object.entries(recipientCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
      totalSent: sent.length,
      totalReceived: received.length,
      totalValue: sent.reduce((sum, g) => sum + g.item.value, 0),
      pendingGifts: pending.length,
      mostGiftedItem,
      topRecipient,
    };
  }

  getGlobalStats(): {
    totalGifts: number;
    totalAccepted: number;
    totalDeclined: number;
    totalExpired: number;
    totalValue: number;
    byItemType: Record<GiftItemType, number>;
  } {
    const byItemType: Record<GiftItemType, number> = {
      tricorder: 0,
      credits: 0,
      pet: 0,
      cosmetic: 0,
      consumable: 0,
    };

    this.gifts.forEach(g => {
      byItemType[g.item.type]++;
    });

    return {
      totalGifts: this.gifts.length,
      totalAccepted: this.gifts.filter(g => g.status === 'accepted').length,
      totalDeclined: this.gifts.filter(g => g.status === 'declined').length,
      totalExpired: this.gifts.filter(g => g.status === 'expired').length,
      totalValue: this.gifts.reduce((sum, g) => sum + g.item.value, 0),
      byItemType,
    };
  }
}

export const giftingService = new GiftingService();
