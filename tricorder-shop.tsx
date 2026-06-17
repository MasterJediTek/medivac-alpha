/**
 * Tricorder Shop Screen
 * Purchase Tricorders for yourself, avatars, or pets
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  tricorderService,
  TricorderTemplate,
  TRICORDER_TEMPLATES,
  TricorderType,
  TricorderRarity,
  OwnerType,
} from '@/lib/services/tricorder-service';
import { avatarService, Avatar } from '@/lib/services/avatar-service';
import { petService, Pet } from '@/lib/services/pet-service';

type FilterType = 'all' | TricorderType;

export default function TricorderShopScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(1000);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TricorderTemplate | null>(null);
  const [purchaseFor, setPurchaseFor] = useState<'self' | 'avatar' | 'pet'>('self');
  const [myAvatars, setMyAvatars] = useState<Avatar[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [ownedTricorders, setOwnedTricorders] = useState<number>(0);

  const currentUserId = 'user_current';
  const currentUserName = 'Current User';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await tricorderService.initialize();
      await avatarService.initialize();
      await petService.initialize();

      setMyAvatars(avatarService.getAvatars(currentUserId));
      setMyPets(petService.getPets(currentUserId));
      setOwnedTricorders(tricorderService.getTricorders().length);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedTemplate) return;

    const price = purchaseFor === 'self' ? selectedTemplate.price : selectedTemplate.giftPrice;
    
    if (credits < price) {
      Alert.alert('Insufficient Credits', 'You need more credits to purchase this Tricorder.');
      return;
    }

    let ownerId = currentUserId;
    let ownerType: OwnerType = 'user';
    let ownerName = currentUserName;

    if (purchaseFor === 'avatar' && selectedAvatar) {
      ownerId = selectedAvatar.id;
      ownerType = 'avatar';
      ownerName = selectedAvatar.name;
    } else if (purchaseFor === 'pet' && selectedPet) {
      ownerId = selectedPet.id;
      ownerType = 'pet';
      ownerName = selectedPet.name;
    }

    const result = await tricorderService.purchaseTricorder(
      selectedTemplate,
      ownerId,
      ownerType,
      ownerName,
      purchaseFor !== 'self'
    );

    if (result.success && result.tricorder) {
      setCredits(prev => prev - price);
      Alert.alert(
        'Purchase Successful!',
        `${result.tricorder.name} has been added to ${ownerName}'s inventory.`
      );
      setSelectedTemplate(null);
      loadData();
    } else {
      Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase');
    }
  };

  const getTypeColor = (type: TricorderType): string => {
    const typeColors: Record<TricorderType, string> = {
      medical: '#3B82F6',
      engineering: '#F97316',
      science: '#8B5CF6',
      tactical: '#EF4444',
      environmental: '#10B981',
    };
    return typeColors[type];
  };

  const getTypeIcon = (type: TricorderType): string => {
    const icons: Record<TricorderType, string> = {
      medical: '🏥',
      engineering: '⚙️',
      science: '🔬',
      tactical: '🎯',
      environmental: '🌍',
    };
    return icons[type];
  };

  const getRarityColor = (rarity: TricorderRarity): string => {
    const rarityColors: Record<TricorderRarity, string> = {
      common: '#9CA3AF',
      uncommon: '#22C55E',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
    };
    return rarityColors[rarity];
  };

  const filteredTemplates = filter === 'all' 
    ? TRICORDER_TEMPLATES 
    : TRICORDER_TEMPLATES.filter(t => t.type === filter);

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Loading Shop...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📡</Text>
          <View>
            <Text style={styles.headerTitle}>Tricorder Shop</Text>
            <Text style={styles.headerSubtitle}>
              {ownedTricorders} Tricorders Owned
            </Text>
          </View>
        </View>
        <View style={styles.creditsBox}>
          <Text style={styles.creditsIcon}>💎</Text>
          <Text style={styles.creditsAmount}>{credits.toLocaleString()}</Text>
        </View>
      </View>

      {/* Type Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.filterContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: filter === 'all' ? colors.primary : colors.background }
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, { color: filter === 'all' ? '#FFFFFF' : colors.foreground }]}>
              All
            </Text>
          </TouchableOpacity>
          {(['medical', 'engineering', 'science', 'tactical', 'environmental'] as TricorderType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterBtn,
                { backgroundColor: filter === type ? getTypeColor(type) : colors.background }
              ]}
              onPress={() => setFilter(type)}
            >
              <Text style={styles.filterIcon}>{getTypeIcon(type)}</Text>
              <Text style={[styles.filterText, { color: filter === type ? '#FFFFFF' : colors.foreground }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tricorder Grid */}
        <View style={styles.shopGrid}>
          {filteredTemplates.map((template, index) => (
            <TouchableOpacity
              key={`${template.type}-${template.rarity}-${index}`}
              style={[
                styles.shopCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: selectedTemplate === template ? colors.primary : colors.border,
                  borderWidth: selectedTemplate === template ? 2 : 1,
                }
              ]}
              onPress={() => setSelectedTemplate(template)}
            >
              <View style={[styles.cardHeader, { backgroundColor: getTypeColor(template.type) }]}>
                <Text style={styles.cardIcon}>{getTypeIcon(template.type)}</Text>
                <View style={[styles.rarityTag, { backgroundColor: getRarityColor(template.rarity) }]}>
                  <Text style={styles.rarityText}>{template.rarity.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>
                  {template.name}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
                  {template.description}
                </Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {template.baseStats.scanRange}m
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>Range</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {template.baseStats.scanAccuracy}%
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>Accuracy</Text>
                  </View>
                </View>
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceIcon}>💎</Text>
                  <Text style={[styles.priceText, { color: colors.foreground }]}>
                    {template.price.toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Panel */}
        {selectedTemplate && (
          <View style={[styles.purchasePanel, { backgroundColor: colors.surface }]}>
            <Text style={[styles.purchaseTitle, { color: colors.foreground }]}>
              Purchase {selectedTemplate.name}
            </Text>
            
            {/* Purchase For Selection */}
            <Text style={[styles.purchaseLabel, { color: colors.muted }]}>Purchase For:</Text>
            <View style={styles.purchaseForOptions}>
              <TouchableOpacity
                style={[
                  styles.purchaseForBtn,
                  { 
                    backgroundColor: purchaseFor === 'self' ? colors.primary : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setPurchaseFor('self')}
              >
                <Text style={styles.purchaseForIcon}>👤</Text>
                <Text style={[styles.purchaseForText, { color: purchaseFor === 'self' ? '#FFFFFF' : colors.foreground }]}>
                  Myself
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.purchaseForBtn,
                  { 
                    backgroundColor: purchaseFor === 'avatar' ? colors.primary : colors.background,
                    borderColor: colors.border,
                    opacity: myAvatars.length === 0 ? 0.5 : 1,
                  }
                ]}
                onPress={() => myAvatars.length > 0 && setPurchaseFor('avatar')}
                disabled={myAvatars.length === 0}
              >
                <Text style={styles.purchaseForIcon}>🧑‍🚀</Text>
                <Text style={[styles.purchaseForText, { color: purchaseFor === 'avatar' ? '#FFFFFF' : colors.foreground }]}>
                  Avatar ({myAvatars.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.purchaseForBtn,
                  { 
                    backgroundColor: purchaseFor === 'pet' ? colors.primary : colors.background,
                    borderColor: colors.border,
                    opacity: myPets.length === 0 ? 0.5 : 1,
                  }
                ]}
                onPress={() => myPets.length > 0 && setPurchaseFor('pet')}
                disabled={myPets.length === 0}
              >
                <Text style={styles.purchaseForIcon}>🐾</Text>
                <Text style={[styles.purchaseForText, { color: purchaseFor === 'pet' ? '#FFFFFF' : colors.foreground }]}>
                  Pet ({myPets.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Avatar Selection */}
            {purchaseFor === 'avatar' && myAvatars.length > 0 && (
              <View style={styles.selectionSection}>
                <Text style={[styles.selectionLabel, { color: colors.muted }]}>Select Avatar:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectionList}>
                    {myAvatars.map(avatar => (
                      <TouchableOpacity
                        key={avatar.id}
                        style={[
                          styles.selectionCard,
                          { 
                            backgroundColor: selectedAvatar?.id === avatar.id ? colors.primary + '20' : colors.background,
                            borderColor: selectedAvatar?.id === avatar.id ? colors.primary : colors.border,
                          }
                        ]}
                        onPress={() => setSelectedAvatar(avatar)}
                      >
                        <Text style={styles.selectionIcon}>👤</Text>
                        <Text style={[styles.selectionName, { color: colors.foreground }]}>{avatar.name}</Text>
                        <Text style={[styles.selectionSub, { color: colors.muted }]}>Lvl {avatar.stats.level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Pet Selection */}
            {purchaseFor === 'pet' && myPets.length > 0 && (
              <View style={styles.selectionSection}>
                <Text style={[styles.selectionLabel, { color: colors.muted }]}>Select Pet:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectionList}>
                    {myPets.map(pet => (
                      <TouchableOpacity
                        key={pet.id}
                        style={[
                          styles.selectionCard,
                          { 
                            backgroundColor: selectedPet?.id === pet.id ? colors.primary + '20' : colors.background,
                            borderColor: selectedPet?.id === pet.id ? colors.primary : colors.border,
                          }
                        ]}
                        onPress={() => setSelectedPet(pet)}
                      >
                        <Text style={styles.selectionIcon}>🐾</Text>
                        <Text style={[styles.selectionName, { color: colors.foreground }]}>{pet.name}</Text>
                        <Text style={[styles.selectionSub, { color: colors.muted }]}>{pet.species}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Purchase Summary */}
            <View style={[styles.purchaseSummary, { backgroundColor: colors.background }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Item:</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>{selectedTemplate.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>For:</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {purchaseFor === 'self' ? currentUserName : 
                   purchaseFor === 'avatar' ? (selectedAvatar?.name || 'Select Avatar') :
                   (selectedPet?.name || 'Select Pet')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Price:</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  💎 {(purchaseFor === 'self' ? selectedTemplate.price : selectedTemplate.giftPrice).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Purchase Button */}
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: (purchaseFor === 'avatar' && !selectedAvatar) || 
                           (purchaseFor === 'pet' && !selectedPet) ? 0.5 : 1,
                }
              ]}
              onPress={handlePurchase}
              disabled={(purchaseFor === 'avatar' && !selectedAvatar) || 
                       (purchaseFor === 'pet' && !selectedPet)}
            >
              <Text style={styles.purchaseButtonIcon}>🛒</Text>
              <Text style={styles.purchaseButtonText}>Complete Purchase</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  creditsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  creditsIcon: {
    fontSize: 18,
  },
  creditsAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
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
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  shopCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  cardIcon: {
    fontSize: 28,
  },
  rarityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 12,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceIcon: {
    fontSize: 14,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  purchasePanel: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  purchaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  purchaseLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  purchaseForOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  purchaseForBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  purchaseForIcon: {
    fontSize: 16,
  },
  purchaseForText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionSection: {
    marginBottom: 16,
  },
  selectionLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  selectionList: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionCard: {
    width: 80,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  selectionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  selectionName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionSub: {
    fontSize: 9,
    marginTop: 2,
  },
  purchaseSummary: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonIcon: {
    fontSize: 20,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
