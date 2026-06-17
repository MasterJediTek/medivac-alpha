/**
 * Gifting Screen
 * Send and receive gifts including Tricorders to avatars and pets
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  giftingService,
  Gift,
  GiftWrap,
  GiftRecipientType,
  GIFT_WRAPS,
} from '@/lib/services/gifting-service';
import { tricorderService, Tricorder } from '@/lib/services/tricorder-service';
import { avatarService, Avatar } from '@/lib/services/avatar-service';
import { petService, Pet } from '@/lib/services/pet-service';

type TabType = 'send' | 'received' | 'sent';

export default function GiftingScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('send');
  const [receivedGifts, setReceivedGifts] = useState<Gift[]>([]);
  const [sentGifts, setSentGifts] = useState<Gift[]>([]);
  const [myTricorders, setMyTricorders] = useState<Tricorder[]>([]);
  const [myAvatars, setMyAvatars] = useState<Avatar[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  
  // Send gift form
  const [selectedTricorder, setSelectedTricorder] = useState<Tricorder | null>(null);
  const [recipientType, setRecipientType] = useState<GiftRecipientType>('avatar');
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedWrap, setSelectedWrap] = useState<GiftWrap>(GIFT_WRAPS[0]);

  const currentUserId = 'user_current';
  const currentUserName = 'Current User';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await giftingService.initialize();
      await tricorderService.initialize();
      await avatarService.initialize();
      await petService.initialize();

      setReceivedGifts(giftingService.getPendingGifts(currentUserId));
      setSentGifts(giftingService.getSentGifts(currentUserId));
      setMyTricorders(tricorderService.getTricorders().filter(t => !t.equipped));
      setMyAvatars(avatarService.getAvatars(currentUserId));
      setMyPets(petService.getPets(currentUserId));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedTricorder || !recipientName.trim()) {
      Alert.alert('Error', 'Please select a Tricorder and enter recipient name');
      return;
    }

    const result = await giftingService.sendGift(
      currentUserId,
      currentUserName,
      'user',
      `recipient_${Date.now()}`,
      recipientName,
      recipientType,
      {
        type: 'tricorder',
        itemId: selectedTricorder.id,
        itemName: selectedTricorder.name,
        itemRarity: selectedTricorder.rarity,
        quantity: 1,
        value: 100, // Default value for gifted tricorder
      },
      giftMessage || undefined
    );

    if (result.success) {
      Alert.alert('Success', `Gift sent to ${recipientName}!`);
      setSelectedTricorder(null);
      setRecipientName('');
      setGiftMessage('');
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to send gift');
    }
  };

  const handleAcceptGift = async (gift: Gift) => {
    const result = await giftingService.acceptGift(gift.id);
    if (result.success) {
      Alert.alert('Success', `You received ${gift.item.itemName}!`);
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to accept gift');
    }
  };

  const handleDeclineGift = async (gift: Gift) => {
    Alert.alert(
      'Decline Gift',
      'Are you sure you want to decline this gift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const result = await giftingService.declineGift(gift.id);
            if (result.success) {
              loadData();
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      pending: '#F59E0B',
      accepted: '#22C55E',
      declined: '#EF4444',
      expired: '#6B7280',
      cancelled: '#9CA3AF',
    };
    return statusColors[status] || colors.muted;
  };

  const getRarityColor = (rarity?: string): string => {
    const rarityColors: Record<string, string> = {
      common: '#9CA3AF',
      uncommon: '#22C55E',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
    };
    return rarityColors[rarity || 'common'] || colors.foreground;
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Loading Gift Center...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerIcon}>🎁</Text>
        <View>
          <Text style={styles.headerTitle}>Gift Center</Text>
          <Text style={styles.headerSubtitle}>
            Send Tricorders to avatars and pets
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['send', 'received', 'sent'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? '#FFFFFF' : colors.muted }
            ]}>
              {tab === 'send' ? '📤 Send' : tab === 'received' ? `📥 Received (${receivedGifts.length})` : '📋 Sent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'send' && (
          <View style={styles.sendForm}>
            {/* Select Tricorder */}
            <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Select Tricorder to Gift
              </Text>
              {myTricorders.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No available Tricorders. Purchase one from the Shop.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tricorderList}>
                    {myTricorders.map(tricorder => (
                      <TouchableOpacity
                        key={tricorder.id}
                        style={[
                          styles.tricorderCard,
                          { 
                            backgroundColor: colors.background,
                            borderColor: selectedTricorder?.id === tricorder.id ? colors.primary : colors.border,
                            borderWidth: selectedTricorder?.id === tricorder.id ? 2 : 1,
                          }
                        ]}
                        onPress={() => setSelectedTricorder(tricorder)}
                      >
                        <Text style={styles.tricorderIcon}>📡</Text>
                        <Text style={[styles.tricorderName, { color: colors.foreground }]} numberOfLines={1}>
                          {tricorder.customName || tricorder.name}
                        </Text>
                        <Text style={[styles.tricorderRarity, { color: getRarityColor(tricorder.rarity) }]}>
                          {tricorder.rarity}
                        </Text>
                        <Text style={[styles.tricorderLevel, { color: colors.muted }]}>
                          Lvl {tricorder.level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Recipient Type */}
            <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Recipient Type
              </Text>
              <View style={styles.recipientTypes}>
                {(['avatar', 'pet', 'user'] as GiftRecipientType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.recipientTypeBtn,
                      { 
                        backgroundColor: recipientType === type ? colors.primary : colors.background,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => setRecipientType(type)}
                  >
                    <Text style={styles.recipientTypeIcon}>
                      {type === 'avatar' ? '👤' : type === 'pet' ? '🐾' : '👥'}
                    </Text>
                    <Text style={[
                      styles.recipientTypeText,
                      { color: recipientType === type ? '#FFFFFF' : colors.foreground }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recipient Name */}
            <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Recipient Name
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder={`Enter ${recipientType} name...`}
                placeholderTextColor={colors.muted}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>

            {/* Gift Wrap */}
            <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Gift Wrap
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.wrapList}>
                  {GIFT_WRAPS.map(wrap => (
                    <TouchableOpacity
                      key={wrap.id}
                      style={[
                        styles.wrapCard,
                        { 
                          backgroundColor: selectedWrap.id === wrap.id ? wrap.color + '20' : colors.background,
                          borderColor: selectedWrap.id === wrap.id ? wrap.color : colors.border,
                        }
                      ]}
                      onPress={() => setSelectedWrap(wrap)}
                    >
                      <Text style={styles.wrapIcon}>{wrap.iconEmoji}</Text>
                      <Text style={[styles.wrapName, { color: colors.foreground }]}>{wrap.name}</Text>
                      {wrap.cost > 0 && (
                        <Text style={[styles.wrapCost, { color: colors.muted }]}>{wrap.cost} 💎</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Message */}
            <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Gift Message (Optional)
              </Text>
              <TextInput
                style={[styles.messageInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Add a personal message..."
                placeholderTextColor={colors.muted}
                value={giftMessage}
                onChangeText={setGiftMessage}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: selectedTricorder && recipientName ? colors.primary : colors.muted,
                }
              ]}
              onPress={handleSendGift}
              disabled={!selectedTricorder || !recipientName}
            >
              <Text style={styles.sendButtonIcon}>🎁</Text>
              <Text style={styles.sendButtonText}>Send Gift</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'received' && (
          <View style={styles.giftList}>
            {receivedGifts.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Pending Gifts</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Gifts you receive will appear here
                </Text>
              </View>
            ) : (
              receivedGifts.map(gift => (
                <View key={gift.id} style={[styles.giftCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.giftHeader}>
                    <Text style={styles.giftIcon}>🎁</Text>
                    <View style={styles.giftInfo}>
                      <Text style={[styles.giftItemName, { color: colors.foreground }]}>
                        {gift.item.itemName}
                      </Text>
                      <Text style={[styles.giftFrom, { color: colors.muted }]}>
                        From: {gift.senderName}
                      </Text>
                    </View>
                    <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(gift.item.itemRarity) }]}>
                      <Text style={styles.rarityText}>{gift.item.itemRarity?.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  {gift.message && (
                    <View style={[styles.messageBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.messageText, { color: colors.muted }]}>
                        "{gift.message}"
                      </Text>
                    </View>
                  )}

                  <View style={styles.giftActions}>
                    <TouchableOpacity
                      style={[styles.acceptBtn, { backgroundColor: '#22C55E' }]}
                      onPress={() => handleAcceptGift(gift)}
                    >
                      <Text style={styles.actionBtnText}>✓ Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.declineBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleDeclineGift(gift)}
                    >
                      <Text style={styles.actionBtnText}>✕ Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'sent' && (
          <View style={styles.giftList}>
            {sentGifts.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyIcon}>📤</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Sent Gifts</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Gifts you send will appear here
                </Text>
              </View>
            ) : (
              sentGifts.map(gift => (
                <View key={gift.id} style={[styles.giftCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.giftHeader}>
                    <Text style={styles.giftIcon}>📤</Text>
                    <View style={styles.giftInfo}>
                      <Text style={[styles.giftItemName, { color: colors.foreground }]}>
                        {gift.item.itemName}
                      </Text>
                      <Text style={[styles.giftFrom, { color: colors.muted }]}>
                        To: {gift.recipientName} ({gift.recipientType})
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gift.status) }]}>
                      <Text style={styles.statusText}>{gift.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.giftDate, { color: colors.muted }]}>
                    Sent: {new Date(gift.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  headerIcon: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  tabs: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  sendForm: {
    padding: 16,
    gap: 16,
  },
  formSection: {
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  tricorderList: {
    flexDirection: 'row',
    gap: 12,
  },
  tricorderCard: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tricorderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  tricorderName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tricorderRarity: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  tricorderLevel: {
    fontSize: 10,
    marginTop: 2,
  },
  recipientTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  recipientTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  recipientTypeIcon: {
    fontSize: 20,
  },
  recipientTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  wrapList: {
    flexDirection: 'row',
    gap: 12,
  },
  wrapCard: {
    width: 80,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  wrapIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  wrapName: {
    fontSize: 11,
    fontWeight: '600',
  },
  wrapCost: {
    fontSize: 10,
    marginTop: 2,
  },
  messageInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonIcon: {
    fontSize: 20,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giftList: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  giftCard: {
    padding: 16,
    borderRadius: 12,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  giftInfo: {
    flex: 1,
  },
  giftItemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  giftFrom: {
    fontSize: 13,
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  giftActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  acceptBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giftDate: {
    fontSize: 12,
    marginTop: 8,
  },
});
