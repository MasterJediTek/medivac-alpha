import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { getStoredUser, AuthUser } from "@/lib/auth-providers";
import {
  getTodayEvents,
  getUpcomingEvents,
  getInboxMessages,
  getUnreadCount,
  getContacts,
  getUserPresence,
  CalendarEvent,
  EmailMessage,
  Contact,
  TeamsPresence,
} from "@/lib/office365";

type Tab = 'calendar' | 'email' | 'contacts' | 'teams';

export default function Office365Screen() {
  const colors = useColors();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data states
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [presence, setPresence] = useState<TeamsPresence | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedUser = await getStoredUser();
    setUser(storedUser);
    
    if (storedUser?.provider === 'microsoft') {
      loadData();
    } else {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [today, upcoming, inbox, unread, contactList, userPresence] = await Promise.allSettled([
        getTodayEvents(),
        getUpcomingEvents(),
        getInboxMessages(10),
        getUnreadCount(),
        getContacts(50),
        getUserPresence(),
      ]);

      if (today.status === 'fulfilled') setTodayEvents(today.value);
      if (upcoming.status === 'fulfilled') setUpcomingEvents(upcoming.value);
      if (inbox.status === 'fulfilled') setEmails(inbox.value);
      if (unread.status === 'fulfilled') setUnreadCount(unread.value);
      if (contactList.status === 'fulfilled') setContacts(contactList.value);
      if (userPresence.status === 'fulfilled') setPresence(userPresence.value);
    } catch (error) {
      console.error('Error loading O365 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

  const getPresenceColor = (availability?: string): string => {
    switch (availability) {
      case 'Available': return colors.success;
      case 'Busy': return colors.error;
      case 'DoNotDisturb': return colors.error;
      case 'Away': return colors.warning;
      default: return colors.muted;
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const TabButton = ({ tab, label, icon, badge }: { tab: Tab; label: string; icon: any; badge?: number }) => (
    <TouchableOpacity
      className="flex-1 items-center py-3"
      style={{
        borderBottomWidth: 2,
        borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
      }}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <View className="relative">
        <IconSymbol
          name={icon}
          size={22}
          color={activeTab === tab ? colors.primary : colors.muted}
        />
        {badge !== undefined && badge > 0 && (
          <View
            className="absolute -top-1 -right-2 w-4 h-4 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.error }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-xs mt-1"
        style={{ color: activeTab === tab ? colors.primary : colors.muted }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Not authenticated with Microsoft
  if (!user || user.provider !== 'microsoft') {
    return (
      <ScreenContainer className="flex-1">
        <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-foreground text-2xl font-bold">Office 365</Text>
        </View>
        
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row flex-wrap w-12 h-12">
              <View className="w-5 h-5 bg-[#F25022] mr-1 mb-1" />
              <View className="w-5 h-5 bg-[#7FBA00]" />
              <View className="w-5 h-5 bg-[#00A4EF] mr-1" />
              <View className="w-5 h-5 bg-[#FFB900]" />
            </View>
          </View>
          <Text className="text-foreground text-xl font-bold mb-2">Microsoft Sign-In Required</Text>
          <Text className="text-muted text-center mb-6">
            Sign in with your Microsoft account to access Office 365 features including Calendar, Email, and Teams.
          </Text>
          <TouchableOpacity
            className="py-4 px-8 rounded-xl"
            style={{ backgroundColor: '#2F2F2F' }}
            onPress={() => router.push('/auth' as any)}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Sign in with Microsoft</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Office 365</Text>
            <Text className="text-muted text-sm">{user.email}</Text>
          </View>
          {presence && (
            <View className="flex-row items-center gap-2">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPresenceColor(presence.availability) }}
              />
              <Text className="text-muted text-sm">{presence.availability}</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-border">
          <TabButton tab="calendar" label="Calendar" icon="calendar" />
          <TabButton tab="email" label="Email" icon="envelope.fill" badge={unreadCount} />
          <TabButton tab="contacts" label="Contacts" icon="person.2.fill" />
          <TabButton tab="teams" label="Teams" icon="person.3.fill" />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">Loading Office 365 data...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <View className="py-4">
              {/* Today's Events */}
              <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
                Today's Schedule
              </Text>
              {todayEvents.length > 0 ? (
                <View className="bg-surface rounded-2xl mb-6">
                  {todayEvents.map((event, index) => (
                    <View
                      key={event.id}
                      className="p-4"
                      style={{
                        borderBottomWidth: index < todayEvents.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-start gap-3">
                        <View
                          className="w-1 h-full rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <View className="flex-1">
                          <Text className="text-foreground font-semibold">{event.subject}</Text>
                          <Text className="text-muted text-sm mt-1">{formatEventTime(event)}</Text>
                          {event.location?.displayName && (
                            <View className="flex-row items-center gap-1 mt-1">
                              <IconSymbol name="mappin" size={12} color={colors.muted} />
                              <Text className="text-muted text-xs">{event.location.displayName}</Text>
                            </View>
                          )}
                          {event.isOnlineMeeting && (
                            <View className="flex-row items-center gap-1 mt-1">
                              <IconSymbol name="video.fill" size={12} color={colors.primary} />
                              <Text style={{ color: colors.primary, fontSize: 12 }}>Online Meeting</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl p-6 items-center mb-6">
                  <IconSymbol name="calendar" size={32} color={colors.muted} />
                  <Text className="text-muted mt-2">No events today</Text>
                </View>
              )}

              {/* Upcoming Events */}
              <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
                Upcoming (7 Days)
              </Text>
              {upcomingEvents.length > 0 ? (
                <View className="bg-surface rounded-2xl">
                  {upcomingEvents.slice(0, 5).map((event, index) => (
                    <View
                      key={event.id}
                      className="p-4"
                      style={{
                        borderBottomWidth: index < Math.min(upcomingEvents.length, 5) - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text className="text-foreground font-medium">{event.subject}</Text>
                      <Text className="text-muted text-sm">
                        {new Date(event.start.dateTime).toLocaleDateString()} • {formatEventTime(event)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl p-6 items-center">
                  <Text className="text-muted">No upcoming events</Text>
                </View>
              )}
            </View>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <View className="py-4">
              <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
                Inbox ({unreadCount} unread)
              </Text>
              {emails.length > 0 ? (
                <View className="bg-surface rounded-2xl">
                  {emails.map((email, index) => (
                    <View
                      key={email.id}
                      className="p-4"
                      style={{
                        borderBottomWidth: index < emails.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                        opacity: email.isRead ? 0.7 : 1,
                      }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        {!email.isRead && (
                          <View
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          />
                        )}
                        <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
                          {email.from.emailAddress.name || email.from.emailAddress.address}
                        </Text>
                        <Text className="text-muted text-xs">
                          {new Date(email.receivedDateTime).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-foreground text-sm" numberOfLines={1}>
                        {email.subject}
                      </Text>
                      <Text className="text-muted text-xs mt-1" numberOfLines={2}>
                        {email.bodyPreview}
                      </Text>
                      {email.hasAttachments && (
                        <View className="flex-row items-center gap-1 mt-2">
                          <IconSymbol name="paperclip" size={12} color={colors.muted} />
                          <Text className="text-muted text-xs">Attachments</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl p-6 items-center">
                  <IconSymbol name="envelope.fill" size={32} color={colors.muted} />
                  <Text className="text-muted mt-2">No emails</Text>
                </View>
              )}
            </View>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <View className="py-4">
              <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
                Contacts ({contacts.length})
              </Text>
              {contacts.length > 0 ? (
                <View className="bg-surface rounded-2xl">
                  {contacts.slice(0, 20).map((contact, index) => (
                    <View
                      key={contact.id}
                      className="p-4 flex-row items-center gap-3"
                      style={{
                        borderBottomWidth: index < Math.min(contacts.length, 20) - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary + '20' }}
                      >
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>
                          {contact.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground font-medium">{contact.displayName}</Text>
                        {contact.emailAddresses?.[0] && (
                          <Text className="text-muted text-sm">{contact.emailAddresses[0].address}</Text>
                        )}
                        {contact.jobTitle && (
                          <Text className="text-muted text-xs">{contact.jobTitle}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl p-6 items-center">
                  <IconSymbol name="person.2.fill" size={32} color={colors.muted} />
                  <Text className="text-muted mt-2">No contacts</Text>
                </View>
              )}
            </View>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <View className="py-4">
              <View className="bg-surface rounded-2xl p-6 items-center mb-6">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: getPresenceColor(presence?.availability) + '20' }}
                >
                  <IconSymbol name="person.fill" size={32} color={getPresenceColor(presence?.availability)} />
                </View>
                <Text className="text-foreground font-semibold text-lg">{user.name}</Text>
                <View className="flex-row items-center gap-2 mt-2">
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPresenceColor(presence?.availability) }}
                  />
                  <Text className="text-muted">{presence?.availability || 'Unknown'}</Text>
                </View>
                {presence?.activity && (
                  <Text className="text-muted text-sm mt-1">{presence.activity}</Text>
                )}
              </View>

              <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
                Quick Actions
              </Text>
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  className="flex-1 bg-surface rounded-xl p-4 items-center"
                  activeOpacity={0.7}
                >
                  <IconSymbol name="video.fill" size={24} color={colors.primary} />
                  <Text className="text-foreground text-sm mt-2">Start Meeting</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-surface rounded-xl p-4 items-center"
                  activeOpacity={0.7}
                >
                  <IconSymbol name="message.fill" size={24} color={colors.primary} />
                  <Text className="text-foreground text-sm mt-2">New Chat</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
                Set Status
              </Text>
              <View className="bg-surface rounded-2xl">
                {[
                  { status: 'Available', color: colors.success },
                  { status: 'Busy', color: colors.error },
                  { status: 'Do Not Disturb', color: colors.error },
                  { status: 'Away', color: colors.warning },
                ].map((item, index) => (
                  <TouchableOpacity
                    key={item.status}
                    className="p-4 flex-row items-center gap-3"
                    style={{
                      borderBottomWidth: index < 3 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-foreground flex-1">{item.status}</Text>
                    {presence?.availability === item.status.replace(' ', '') && (
                      <IconSymbol name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
