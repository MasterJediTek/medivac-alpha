import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Communication Tools from FileMaker
const COMM_TOOLS = [
  { id: 'bulletin-board', name: 'Bulletin Board', icon: '📋', color: '#4A90D9' },
  { id: 'screen-sharing', name: 'Screen Sharing', icon: '🖥️', color: '#E74C3C' },
  { id: 'isu-forum', name: 'ISU Forum', icon: '👥', color: '#9B59B6' },
  { id: 'video-conference', name: 'Video Conference', icon: '📹', color: '#27AE60' },
  { id: 'isu-chat', name: 'ISU Chat', icon: '💬', color: '#F39C12' },
  { id: 'service-desk', name: 'Service Desk Tick', icon: '🎫', color: '#1ABC9C' },
  { id: 'warp-chat', name: 'Warp Chat', icon: '🚀', color: '#8E44AD' },
  { id: 'soft-phone', name: 'Soft Phone', icon: '📞', color: '#3498DB' },
  { id: 'bulk-sms', name: 'Bulk SMS', icon: '📱', color: '#E67E22' },
  { id: 'bulk-email', name: 'Bulk Email', icon: '📧', color: '#C0392B' },
];

// Communication Dropdown (Forum, Phone, SMS)
const COMM_DROPDOWN = [
  { id: 'forum', name: 'Forum', icon: '👥', color: '#4A90D9' },
  { id: 'phone', name: 'Phone', icon: '📞', color: '#E74C3C' },
  { id: 'sms', name: 'SMS', icon: '📱', color: '#27AE60' },
];

// Sample Bulletins
const SAMPLE_BULLETINS = [
  { id: 1, title: 'System Maintenance Notice', content: 'Scheduled maintenance on Feb 5th, 2026 from 2:00 AM to 4:00 AM.', author: 'IT Admin', date: '2026-02-01', priority: 'high' },
  { id: 2, title: 'New SMPO Protocol Update', content: 'Please review the updated SMPO.ink protocol documentation.', author: 'Compliance Team', date: '2026-01-30', priority: 'medium' },
  { id: 3, title: 'Staff Meeting Reminder', content: 'Monthly staff meeting on Feb 3rd at 10:00 AM in Conference Room A.', author: 'HR Department', date: '2026-01-29', priority: 'normal' },
];

// Sample Forum Posts
const SAMPLE_FORUM_POSTS = [
  { id: 1, title: 'Best practices for patient handover', author: 'Dr. Sarah Chen', replies: 12, views: 156, lastActivity: '2 hours ago' },
  { id: 2, title: 'JEDI System Integration Tips', author: 'Tech Support', replies: 8, views: 89, lastActivity: '5 hours ago' },
  { id: 3, title: 'New medication protocols discussion', author: 'Nurse Williams', replies: 23, views: 234, lastActivity: '1 day ago' },
];

// Sample Messages
const SAMPLE_MESSAGES = [
  { id: 1, from: 'Dr. Michael Brown', subject: 'Patient Referral', preview: 'I would like to refer patient #1247 for...', time: '10:30 AM', unread: true },
  { id: 2, from: 'Admin Office', subject: 'Schedule Update', preview: 'Your shift schedule has been updated...', time: '9:15 AM', unread: true },
  { id: 3, from: 'Lab Department', subject: 'Results Ready', preview: 'Lab results for patient #1089 are now...', time: 'Yesterday', unread: false },
];

type ViewMode = 'overview' | 'bulletin' | 'forum' | 'messages' | 'phone' | 'sms' | 'email';

export default function CommunicationsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommDropdown, setShowCommDropdown] = useState(false);

  const renderOverview = () => (
    <View className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Communications</Text>
      <Text className="text-muted mb-6">Integrated communication hub for all hospital communications.</Text>

      {/* Quick Communication Dropdown */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <TouchableOpacity 
          className="flex-row items-center justify-between"
          onPress={() => setShowCommDropdown(!showCommDropdown)}
        >
          <Text className="text-lg font-bold text-foreground">Quick Communications</Text>
          <IconSymbol name="chevron.right" size={20} color="#4A90D9" />
        </TouchableOpacity>
        {showCommDropdown && (
          <View className="mt-3 gap-2">
            {COMM_DROPDOWN.map(item => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center gap-3 p-3 bg-background rounded-lg"
                onPress={() => {
                  setShowCommDropdown(false);
                  if (item.id === 'forum') setViewMode('forum');
                  else if (item.id === 'phone') setViewMode('phone');
                  else if (item.id === 'sms') setViewMode('sms');
                }}
              >
                <View 
                  style={{ backgroundColor: item.color }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                >
                  <Text className="text-xl">{item.icon}</Text>
                </View>
                <Text className="text-foreground font-medium">{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Communication Tools Grid */}
      <Text className="text-lg font-bold text-foreground mb-3">Communication Tools</Text>
      <View className="flex-row flex-wrap gap-3 mb-6">
        {COMM_TOOLS.map(tool => (
          <TouchableOpacity
            key={tool.id}
            className="bg-surface rounded-xl p-3 items-center"
            style={{ width: '22%', minWidth: 80 }}
            onPress={() => {
              if (tool.id === 'bulletin-board') setViewMode('bulletin');
              else if (tool.id === 'isu-forum') setViewMode('forum');
              else if (tool.id === 'isu-chat') setViewMode('messages');
              else if (tool.id === 'bulk-sms') setViewMode('sms');
              else if (tool.id === 'bulk-email') setViewMode('email');
              else if (tool.id === 'soft-phone') setViewMode('phone');
            }}
          >
            <View 
              style={{ backgroundColor: tool.color }}
              className="w-12 h-12 rounded-lg items-center justify-center mb-1"
            >
              <Text className="text-xl">{tool.icon}</Text>
            </View>
            <Text className="text-foreground text-xs text-center">{tool.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Bulletins */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">Recent Bulletins</Text>
          <TouchableOpacity onPress={() => setViewMode('bulletin')}>
            <Text className="text-primary">View All</Text>
          </TouchableOpacity>
        </View>
        {SAMPLE_BULLETINS.slice(0, 2).map(bulletin => (
          <TouchableOpacity key={bulletin.id} className="py-2 border-b border-border">
            <View className="flex-row items-center gap-2 mb-1">
              <View className={`w-2 h-2 rounded-full ${
                bulletin.priority === 'high' ? 'bg-red-500' :
                bulletin.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <Text className="text-foreground font-medium">{bulletin.title}</Text>
            </View>
            <Text className="text-muted text-sm">{bulletin.date} • {bulletin.author}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Unread Messages */}
      <View className="bg-surface p-4 rounded-xl">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">Unread Messages</Text>
          <View className="bg-red-500 px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">2</Text>
          </View>
        </View>
        {SAMPLE_MESSAGES.filter(m => m.unread).map(message => (
          <TouchableOpacity 
            key={message.id} 
            className="py-2 border-b border-border"
            onPress={() => setViewMode('messages')}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-foreground font-medium">{message.from}</Text>
              <Text className="text-muted text-xs">{message.time}</Text>
            </View>
            <Text className="text-foreground text-sm">{message.subject}</Text>
            <Text className="text-muted text-sm" numberOfLines={1}>{message.preview}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBulletin = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Bulletin Board</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ Post</Text>
        </TouchableOpacity>
      </View>

      {SAMPLE_BULLETINS.map(bulletin => (
        <TouchableOpacity key={bulletin.id} className="bg-surface p-4 rounded-xl mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <View className={`w-2 h-2 rounded-full ${
                  bulletin.priority === 'high' ? 'bg-red-500' :
                  bulletin.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <Text className="text-foreground font-semibold">{bulletin.title}</Text>
              </View>
              <Text className="text-muted text-sm mb-2">{bulletin.content}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-sm">{bulletin.author}</Text>
            <Text className="text-muted text-sm">{bulletin.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderForum = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">ISU Forum</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 mb-4">
        <IconSymbol name="house.fill" size={20} color="#9BA1A6" />
        <TextInput
          className="flex-1 text-foreground"
          placeholder="Search forum..."
          placeholderTextColor="#9BA1A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {SAMPLE_FORUM_POSTS.map(post => (
        <TouchableOpacity key={post.id} className="bg-surface p-4 rounded-xl mb-3">
          <Text className="text-foreground font-semibold mb-1">{post.title}</Text>
          <Text className="text-muted text-sm mb-2">by {post.author}</Text>
          <View className="flex-row items-center gap-4">
            <Text className="text-muted text-sm">💬 {post.replies} replies</Text>
            <Text className="text-muted text-sm">👁️ {post.views} views</Text>
            <Text className="text-muted text-sm">{post.lastActivity}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMessages = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Messages</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ New</Text>
        </TouchableOpacity>
      </View>

      {SAMPLE_MESSAGES.map(message => (
        <TouchableOpacity 
          key={message.id} 
          className={`p-4 rounded-xl mb-3 ${message.unread ? 'bg-primary/10' : 'bg-surface'}`}
        >
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`font-semibold ${message.unread ? 'text-foreground' : 'text-muted'}`}>
              {message.from}
            </Text>
            <Text className="text-muted text-xs">{message.time}</Text>
          </View>
          <Text className="text-foreground font-medium mb-1">{message.subject}</Text>
          <Text className="text-muted text-sm" numberOfLines={1}>{message.preview}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPhone = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Soft Phone</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Dialpad */}
      <View className="bg-surface p-6 rounded-xl mb-4">
        <TextInput
          className="text-3xl text-center text-foreground mb-6"
          placeholder="Enter number"
          placeholderTextColor="#9BA1A6"
          keyboardType="phone-pad"
        />
        <View className="gap-3">
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['*', '0', '#']].map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-center gap-6">
              {row.map(digit => (
                <TouchableOpacity
                  key={digit}
                  className="w-16 h-16 rounded-full bg-background items-center justify-center"
                >
                  <Text className="text-2xl text-foreground">{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        <TouchableOpacity className="bg-green-500 p-4 rounded-full mt-6 self-center">
          <Text className="text-white text-xl">📞</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Contacts */}
      <Text className="text-lg font-bold text-foreground mb-3">Quick Contacts</Text>
      <View className="gap-2">
        {['Emergency', 'Reception', 'Lab', 'Pharmacy', 'IT Support'].map(contact => (
          <TouchableOpacity key={contact} className="bg-surface p-4 rounded-xl flex-row items-center justify-between">
            <Text className="text-foreground">{contact}</Text>
            <View className="bg-green-500 p-2 rounded-full">
              <Text>📞</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSMS = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Bulk SMS</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-foreground font-semibold mb-2">Recipients</Text>
        <TouchableOpacity className="bg-background border border-border rounded-lg p-3 mb-4">
          <Text className="text-muted">Select recipients or groups...</Text>
        </TouchableOpacity>

        <Text className="text-foreground font-semibold mb-2">Message</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground h-32"
          placeholder="Type your message..."
          placeholderTextColor="#9BA1A6"
          multiline
          textAlignVertical="top"
        />

        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-muted">Characters: 0/160</Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Send SMS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SMS Templates */}
      <Text className="text-lg font-bold text-foreground mb-3">Templates</Text>
      <View className="gap-2">
        {['Appointment Reminder', 'Lab Results Ready', 'Prescription Ready', 'Follow-up Reminder'].map(template => (
          <TouchableOpacity key={template} className="bg-surface p-4 rounded-xl">
            <Text className="text-foreground">{template}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmail = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Bulk Email</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-foreground font-semibold mb-2">To</Text>
        <TouchableOpacity className="bg-background border border-border rounded-lg p-3 mb-4">
          <Text className="text-muted">Select recipients or groups...</Text>
        </TouchableOpacity>

        <Text className="text-foreground font-semibold mb-2">Subject</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Email subject..."
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Message</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground h-40"
          placeholder="Compose your email..."
          placeholderTextColor="#9BA1A6"
          multiline
          textAlignVertical="top"
        />

        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity className="flex-row items-center gap-2">
            <Text className="text-primary">📎 Attach</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Send Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'bulletin' && renderBulletin()}
        {viewMode === 'forum' && renderForum()}
        {viewMode === 'messages' && renderMessages()}
        {viewMode === 'phone' && renderPhone()}
        {viewMode === 'sms' && renderSMS()}
        {viewMode === 'email' && renderEmail()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
