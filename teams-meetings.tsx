/**
 * Teams Meeting Scheduler Screen
 * Schedule incident response meetings from drill mode
 * MediVac One v5.8
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  teamsMeetingService,
  TeamsMeeting,
  MeetingTemplate,
  MeetingAttendee,
  AgendaItem,
  MEETING_TYPES,
  MeetingType,
  RecurrenceType,
} from "@/lib/services/teams-meeting-service";

type TabType = 'upcoming' | 'past' | 'templates';
type ViewMode = 'list' | 'create' | 'detail';

export default function TeamsMeetingsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<TeamsMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<TeamsMeeting[]>([]);
  const [staff, setStaff] = useState<MeetingAttendee[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<TeamsMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('general');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [duration, setDuration] = useState(30);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await teamsMeetingService.initialize();
      setTemplates(teamsMeetingService.getTemplates());
      setUpcomingMeetings(teamsMeetingService.getUpcomingMeetings());
      setPastMeetings(teamsMeetingService.getPastMeetings());
      setStaff(teamsMeetingService.getStaff());
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFromTemplate = (template: MeetingTemplate) => {
    setTitle('');
    setDescription(template.description);
    setMeetingType(template.type);
    setDuration(template.defaultDuration);
    setSelectedAttendees([]);
    setRecurrence('none');
    setViewMode('create');
  };

  const handleCreateMeeting = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a meeting title');
      return;
    }

    setCreating(true);
    try {
      const attendees = staff
        .filter(s => selectedAttendees.includes(s.id))
        .map(s => ({ ...s, isRequired: true, responseStatus: 'pending' as const }));

      await teamsMeetingService.createMeeting({
        title,
        description,
        type: meetingType,
        startTime: selectedDate,
        duration,
        attendees,
        recurrence,
      });

      Alert.alert('Success', 'Meeting scheduled successfully');
      setViewMode('list');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    Alert.alert(
      'Cancel Meeting',
      'Are you sure you want to cancel this meeting?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await teamsMeetingService.cancelMeeting(meetingId);
            loadData();
            setSelectedMeeting(null);
            setViewMode('list');
          },
        },
      ]
    );
  };

  const toggleAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(attendeeId)
        ? prev.filter(id => id !== attendeeId)
        : [...prev, attendeeId]
    );
  };

  const stats = teamsMeetingService.getStatistics();
  const departments = teamsMeetingService.getDepartments();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'in_progress': return colors.warning;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.muted;
    }
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['upcoming', 'past', 'templates'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMeetingCard = (meeting: TeamsMeeting) => {
    const typeConfig = MEETING_TYPES[meeting.type];
    return (
      <TouchableOpacity
        key={meeting.id}
        onPress={() => {
          setSelectedMeeting(meeting);
          setViewMode('detail');
        }}
        className="bg-surface rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{meeting.title}</Text>
            <Text className="text-muted text-sm">{formatDateTime(meeting.startTime)}</Text>
          </View>
          <View 
            style={{ backgroundColor: getStatusColor(meeting.status) + '20' }}
            className="px-2 py-1 rounded"
          >
            <Text style={{ color: getStatusColor(meeting.status) }} className="text-xs capitalize">
              {meeting.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View 
            style={{ backgroundColor: typeConfig.color + '20' }}
            className="px-2 py-1 rounded"
          >
            <Text style={{ color: typeConfig.color }} className="text-xs">{typeConfig.label}</Text>
          </View>
          <Text className="text-muted text-sm">{meeting.duration} min</Text>
          <Text className="text-muted text-sm">{meeting.attendees.length} attendees</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderList = () => (
    <View>
      {/* Stats */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Upcoming</Text>
          <Text className="text-foreground text-xl font-bold">{stats.upcomingMeetings}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Completed</Text>
          <Text className="text-foreground text-xl font-bold">{stats.completedMeetings}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Avg Duration</Text>
          <Text className="text-foreground text-xl font-bold">{stats.averageDuration}m</Text>
        </View>
      </View>

      {renderTabs()}

      {activeTab === 'upcoming' && (
        <>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground text-lg font-bold">Upcoming Meetings</Text>
            <TouchableOpacity
              onPress={() => {
                setTitle('');
                setDescription('');
                setMeetingType('general');
                setDuration(30);
                setSelectedAttendees([]);
                setViewMode('create');
              }}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">+ New</Text>
            </TouchableOpacity>
          </View>

          {upcomingMeetings.length === 0 ? (
            <View className="bg-surface rounded-xl p-8 items-center">
              <IconSymbol name="calendar" size={48} color={colors.muted} />
              <Text className="text-muted mt-4 text-center">No upcoming meetings</Text>
              <Text className="text-muted text-sm text-center mt-1">
                Schedule a meeting to get started
              </Text>
            </View>
          ) : (
            upcomingMeetings.map(renderMeetingCard)
          )}
        </>
      )}

      {activeTab === 'past' && (
        <>
          <Text className="text-foreground text-lg font-bold mb-3">Past Meetings</Text>
          {pastMeetings.length === 0 ? (
            <View className="bg-surface rounded-xl p-8 items-center">
              <IconSymbol name="clock.fill" size={48} color={colors.muted} />
              <Text className="text-muted mt-4 text-center">No past meetings</Text>
            </View>
          ) : (
            pastMeetings.slice(0, 10).map(renderMeetingCard)
          )}
        </>
      )}

      {activeTab === 'templates' && (
        <>
          <Text className="text-foreground text-lg font-bold mb-3">Meeting Templates</Text>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              onPress={() => handleCreateFromTemplate(template)}
              className="bg-surface rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: template.color }} className="p-3 rounded-xl">
                  <IconSymbol name="calendar" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{template.name}</Text>
                  <Text className="text-muted text-sm">{template.description}</Text>
                  <Text className="text-muted text-xs mt-1">{template.defaultDuration} min • {template.defaultAgenda.length} agenda items</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  const renderCreate = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Schedule Meeting</Text>
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          className="px-3 py-1 rounded-lg"
          style={{ backgroundColor: colors.error + '20' }}
        >
          <Text style={{ color: colors.error }} className="text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Meeting Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter meeting title"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Meeting description"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-2">Meeting Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(Object.keys(MEETING_TYPES) as MeetingType[]).map((type) => {
                const typeConfig = MEETING_TYPES[type];
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setMeetingType(type)}
                    style={meetingType === type ? { backgroundColor: typeConfig.color } : undefined}
                    className={`px-3 py-2 rounded-lg ${meetingType !== type ? 'bg-background' : ''}`}
                  >
                    <Text className={meetingType === type ? 'text-white font-medium' : 'text-muted'}>
                      {typeConfig.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-2">Duration (minutes)</Text>
          <View className="flex-row gap-2">
            {[15, 30, 45, 60, 90].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                className={`flex-1 py-2 rounded-lg ${duration === d ? 'bg-primary' : 'bg-background'}`}
              >
                <Text className={`text-center ${duration === d ? 'text-white font-medium' : 'text-muted'}`}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-2">Recurrence</Text>
          <View className="flex-row gap-2">
            {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRecurrence(r)}
                className={`flex-1 py-2 rounded-lg ${recurrence === r ? 'bg-primary' : 'bg-background'}`}
              >
                <Text className={`text-center text-sm ${recurrence === r ? 'text-white font-medium' : 'text-muted'}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Attendees */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">
          Select Attendees ({selectedAttendees.length})
        </Text>
        
        {departments.map((dept) => (
          <View key={dept} className="mb-3">
            <Text className="text-muted text-sm mb-2">{dept}</Text>
            <View className="flex-row flex-wrap gap-2">
              {staff.filter(s => s.department === dept).map((person) => {
                const isSelected = selectedAttendees.includes(person.id);
                return (
                  <TouchableOpacity
                    key={person.id}
                    onPress={() => toggleAttendee(person.id)}
                    className={`px-3 py-2 rounded-lg ${isSelected ? 'bg-primary' : 'bg-background'}`}
                  >
                    <Text className={isSelected ? 'text-white font-medium' : 'text-muted'}>
                      {person.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleCreateMeeting}
        disabled={creating}
        className="bg-[#5B5FC7] py-4 rounded-xl"
      >
        <Text className="text-white text-center font-semibold">
          {creating ? 'Scheduling...' : 'Schedule Meeting'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetail = () => {
    if (!selectedMeeting) return null;
    const typeConfig = MEETING_TYPES[selectedMeeting.type];

    return (
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => {
              setSelectedMeeting(null);
              setViewMode('list');
            }}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="font-medium">Back</Text>
          </TouchableOpacity>
          {selectedMeeting.status === 'scheduled' && (
            <TouchableOpacity
              onPress={() => handleCancelMeeting(selectedMeeting.id)}
              className="px-3 py-1 rounded-lg"
              style={{ backgroundColor: colors.error + '20' }}
            >
              <Text style={{ color: colors.error }} className="text-sm">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-surface rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View style={{ backgroundColor: typeConfig.color }} className="p-3 rounded-xl">
              <IconSymbol name="calendar" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold">{selectedMeeting.title}</Text>
              <View 
                style={{ backgroundColor: typeConfig.color + '20' }}
                className="px-2 py-1 rounded self-start mt-1"
              >
                <Text style={{ color: typeConfig.color }} className="text-xs">{typeConfig.label}</Text>
              </View>
            </View>
          </View>

          {selectedMeeting.description && (
            <Text className="text-muted mb-3">{selectedMeeting.description}</Text>
          )}

          <View className="flex-row items-center gap-4 mb-3">
            <View>
              <Text className="text-muted text-xs">Date & Time</Text>
              <Text className="text-foreground font-medium">{formatDateTime(selectedMeeting.startTime)}</Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Duration</Text>
              <Text className="text-foreground font-medium">{selectedMeeting.duration} min</Text>
            </View>
          </View>

          {selectedMeeting.joinUrl && (
            <TouchableOpacity
              onPress={() => Alert.alert('Join Meeting', 'Opening Teams...')}
              className="bg-[#5B5FC7] py-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">Join in Teams</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Agenda */}
        {selectedMeeting.agenda.length > 0 && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-foreground font-semibold mb-3">Agenda</Text>
            {selectedMeeting.agenda.map((item, index) => (
              <View key={item.id} className="flex-row items-center gap-3 mb-2">
                <View className="bg-primary/20 w-6 h-6 rounded-full items-center justify-center">
                  <Text style={{ color: colors.primary }} className="text-xs font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground">{item.title}</Text>
                  <Text className="text-muted text-xs">{item.duration} min</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Attendees */}
        <View className="bg-surface rounded-xl p-4">
          <Text className="text-foreground font-semibold mb-3">
            Attendees ({selectedMeeting.attendees.length})
          </Text>
          {selectedMeeting.attendees.map((attendee) => (
            <View key={attendee.id} className="flex-row items-center justify-between mb-2 pb-2 border-b border-border">
              <View>
                <Text className="text-foreground font-medium">{attendee.name}</Text>
                <Text className="text-muted text-sm">{attendee.role}</Text>
              </View>
              <View 
                style={{ 
                  backgroundColor: attendee.responseStatus === 'accepted' ? colors.success + '20' 
                    : attendee.responseStatus === 'declined' ? colors.error + '20' 
                    : colors.muted + '20' 
                }}
                className="px-2 py-1 rounded"
              >
                <Text 
                  style={{ 
                    color: attendee.responseStatus === 'accepted' ? colors.success 
                      : attendee.responseStatus === 'declined' ? colors.error 
                      : colors.muted 
                  }} 
                  className="text-xs capitalize"
                >
                  {attendee.responseStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading meetings...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Teams Meetings</Text>
            <Text className="text-muted">Schedule & Manage Meetings</Text>
          </View>
          <View className="bg-[#5B5FC7] p-3 rounded-full">
            <IconSymbol name="calendar" size={24} color="#FFFFFF" />
          </View>
        </View>

        {viewMode === 'list' && renderList()}
        {viewMode === 'create' && renderCreate()}
        {viewMode === 'detail' && renderDetail()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
