import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { broadcastService, Broadcast, BroadcastUrgency, URGENCY_COLORS, CATEGORY_COLORS, STATUS_COLORS } from "@/lib/services/broadcast-service";

export default function BroadcastsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<BroadcastUrgency | 'all'>('all');

  useEffect(() => {
    loadBroadcasts();
  }, [selectedUrgency]);

  const loadBroadcasts = async () => {
    setLoading(true);
    await broadcastService.initialize();
    
    const filter: any = {};
    if (selectedUrgency !== 'all') filter.urgency = [selectedUrgency];
    
    setBroadcasts(broadcastService.getBroadcasts(filter));
    setStats(broadcastService.getStats());
    setLoading(false);
  };

  const handleSend = async (broadcastId: string) => {
    await broadcastService.sendBroadcast(broadcastId);
    loadBroadcasts();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDeliveryRate = (broadcast: Broadcast) => {
    if (!broadcast.recipientCount || !broadcast.deliveredCount) return null;
    return Math.round((broadcast.deliveredCount / broadcast.recipientCount) * 100);
  };

  const getReadRate = (broadcast: Broadcast) => {
    if (!broadcast.deliveredCount || !broadcast.readCount) return null;
    return Math.round((broadcast.readCount / broadcast.deliveredCount) * 100);
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading broadcasts...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Broadcasts</Text>
          <Text className="text-muted">Color-coded communication system</Text>
        </View>

        {/* Urgency Stats */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(Object.keys(URGENCY_COLORS) as BroadcastUrgency[]).map((urgency) => {
            const urgencyColor = URGENCY_COLORS[urgency];
            const count = stats?.byUrgency[urgency] || 0;
            return (
              <TouchableOpacity
                key={urgency}
                onPress={() => setSelectedUrgency(selectedUrgency === urgency ? 'all' : urgency)}
                style={{
                  flex: 1,
                  minWidth: 80,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: selectedUrgency === urgency ? urgencyColor.primary : urgencyColor.background,
                  borderWidth: 1,
                  borderColor: urgencyColor.primary,
                }}
              >
                <Text style={{ 
                  color: selectedUrgency === urgency ? '#FFFFFF' : urgencyColor.text, 
                  fontSize: 10, 
                  textTransform: 'capitalize' 
                }}>
                  {urgency}
                </Text>
                <Text style={{ 
                  color: selectedUrgency === urgency ? '#FFFFFF' : urgencyColor.primary, 
                  fontSize: 20, 
                  fontWeight: '700' 
                }}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Color Legend */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-sm font-medium text-foreground mb-3">Category Colors</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
              <View key={key} className="flex-row items-center">
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color.primary, marginRight: 4 }} />
                <Text className="text-xs text-foreground capitalize">{key}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Broadcasts List */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            {selectedUrgency === 'all' ? 'All Broadcasts' : `${selectedUrgency.charAt(0).toUpperCase() + selectedUrgency.slice(1)} Broadcasts`} ({broadcasts.length})
          </Text>
          
          {broadcasts.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border">
              <Text className="text-muted text-center">No broadcasts match your filters</Text>
            </View>
          ) : (
            broadcasts.map((broadcast) => {
              const urgencyColor = URGENCY_COLORS[broadcast.urgency];
              const categoryColor = CATEGORY_COLORS[broadcast.category];
              const statusColor = STATUS_COLORS[broadcast.status];
              const deliveryRate = getDeliveryRate(broadcast);
              const readRate = getReadRate(broadcast);
              
              return (
                <View
                  key={broadcast.id}
                  className="bg-surface rounded-xl mb-3 overflow-hidden"
                  style={{ borderWidth: 1, borderColor: urgencyColor.primary + '40' }}
                >
                  {/* Urgency indicator bar */}
                  <View style={{ height: 4, backgroundColor: urgencyColor.primary }} />
                  
                  <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 flex-row items-center gap-2 flex-wrap">
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: urgencyColor.background,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: urgencyColor.primary, fontWeight: '700', textTransform: 'uppercase' }}>
                            {broadcast.urgency}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: categoryColor.background,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: categoryColor.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                            {broadcast.category}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: statusColor.background,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: statusColor.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                            {broadcast.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted">{formatDate(broadcast.createdAt)}</Text>
                    </View>
                    
                    {/* Title */}
                    <Text className="text-foreground font-semibold mb-1">{broadcast.title}</Text>
                    
                    {/* Message */}
                    <Text className="text-sm text-muted mb-3" numberOfLines={2}>{broadcast.message}</Text>
                    
                    {/* Channels */}
                    <View className="flex-row flex-wrap gap-1 mb-3">
                      {broadcast.channels.map((channel) => (
                        <View
                          key={channel}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: colors.primary + '20',
                          }}
                        >
                          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>{channel}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {/* Stats for sent broadcasts */}
                    {broadcast.status === 'sent' && broadcast.recipientCount && (
                      <View className="flex-row gap-3 mb-3">
                        <View className="flex-1">
                          <Text className="text-xs text-muted">Recipients</Text>
                          <Text className="text-sm font-semibold text-foreground">{broadcast.recipientCount}</Text>
                        </View>
                        {deliveryRate !== null && (
                          <View className="flex-1">
                            <Text className="text-xs text-muted">Delivered</Text>
                            <Text className="text-sm font-semibold" style={{ color: '#22C55E' }}>{deliveryRate}%</Text>
                          </View>
                        )}
                        {readRate !== null && (
                          <View className="flex-1">
                            <Text className="text-xs text-muted">Read</Text>
                            <Text className="text-sm font-semibold" style={{ color: '#3B82F6' }}>{readRate}%</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Audience */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-muted">
                        Audience: {broadcast.audienceScope.charAt(0).toUpperCase() + broadcast.audienceScope.slice(1)}
                        {broadcast.audienceFilter ? ` (${broadcast.audienceFilter})` : ''}
                      </Text>
                      
                      {broadcast.status === 'draft' && (
                        <TouchableOpacity
                          onPress={() => handleSend(broadcast.id)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 6,
                            borderRadius: 6,
                            backgroundColor: urgencyColor.primary,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Send Now</Text>
                        </TouchableOpacity>
                      )}
                      
                      {broadcast.status === 'scheduled' && broadcast.scheduledAt && (
                        <Text className="text-xs" style={{ color: STATUS_COLORS.scheduled.primary }}>
                          Scheduled: {new Date(broadcast.scheduledAt).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Create New Broadcast Button */}
        <TouchableOpacity
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Create New Broadcast</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
