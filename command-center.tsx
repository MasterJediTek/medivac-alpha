import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Database Module Tabs
const DATABASE_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'school-files', label: 'School Files' },
  { id: 'training', label: 'Training' },
  { id: 'learning', label: 'Learning' },
  { id: 'events', label: 'Events' },
  { id: 'reports', label: 'Reports' },
  { id: 'administration', label: 'Administration' },
  { id: 'my-profile', label: 'My Profile' },
];

// Top Navigation Tabs
const TOP_TABS = [
  { id: 'database-modules', label: 'Database Modules', color: '#4A90A4' },
  { id: 'learning-tools', label: 'Learning Tools', color: '#5BA4C9' },
  { id: 'communications', label: 'Communications', color: '#5BA4C9' },
  { id: 'record-keeping', label: 'Record Keeping', color: '#5BA4C9' },
  { id: 'training-tools', label: 'Training Tools', color: '#5BA4C9' },
  { id: 'finance-tools', label: 'Finance Tools', color: '#E74C3C' },
];

// Quick Access Icons
const QUICK_ACCESS = [
  { id: 'dashboard', icon: 'square.grid.2x2.fill' as const, label: 'Dashboard' },
  { id: 'quick-access', icon: 'list.bullet' as const, label: 'Quick Access' },
  { id: 'video-training', icon: 'play.rectangle.fill' as const, label: 'Video Training' },
  { id: 'live-training', icon: 'video.fill' as const, label: 'Live Training' },
  { id: 'preferences', icon: 'gearshape.fill' as const, label: 'Preferences' },
];

// General Practice Modules (Main Grid)
const GENERAL_PRACTICE_MODULES = [
  { id: 'patient', icon: '🏥', label: 'Patient', color: '#E74C3C', route: '/patients' },
  { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors', color: '#F5F5DC', route: '/staff' },
  { id: 'medication', icon: '💊', label: 'Medication', color: '#FFB6C1', route: '/medications' },
  { id: 'check-up', icon: '🌡️', label: 'Check Up', color: '#90EE90', route: '/schedule' },
  { id: 'surgery', icon: '🏥', label: 'Surgery', color: '#87CEEB', route: '/rooms' },
  { id: 'nurse', icon: '👩‍⚕️', label: 'Nurse', color: '#98FB98', route: '/staff' },
  { id: 'labs', icon: '🔬', label: 'Labs', color: '#DEB887', route: '/labs' },
  { id: 'rooms', icon: '🛏️', label: 'Rooms', color: '#D2B48C', route: '/rooms' },
  { id: 'appointment', icon: '📞', label: 'Appointment', color: '#ADD8E6', route: '/schedule' },
];

// Database Modules (Left Sidebar)
const DATABASE_MODULES = [
  { id: 'families', icon: '👥', label: 'Families', color: '#4A90D9' },
  { id: 'contacts', icon: '📇', label: 'Contacts', color: '#4A90D9' },
  { id: 'gap-quotes', icon: '📋', label: 'Gap Quotes', color: '#4A90D9' },
  { id: 'invoices', icon: '📄', label: 'Invoices', color: '#4A90D9' },
  { id: 'procedures', icon: '📝', label: 'Procedures', color: '#4A90D9' },
  { id: 'medicin-treatment', icon: '💉', label: 'Medicin/Treatment', color: '#4A90D9' },
  { id: 'aids-follow-up', icon: '❤️', label: 'Aids - Follow Up', color: '#4A90D9' },
  { id: 'staff', icon: '👩‍⚕️', label: 'Staff', color: '#4A90D9' },
  { id: 'inventory', icon: '📦', label: 'Inventory', color: '#4A90D9' },
  { id: 'timesheets', icon: '⏰', label: 'Timesheets', color: '#4A90D9' },
  { id: 'tasks', icon: '✓', label: 'Tasks', color: '#4A90D9' },
  { id: 'calendar', icon: '📅', label: 'Calendar', color: '#4A90D9' },
];

// Learning Tools Panel
const LEARNING_TOOLS = [
  { id: 'jeditek-council', label: 'J.E.D.iTek-Council', icon: '🎧' },
  { id: 'projects', icon: '📊', label: 'Projects', color: '#4A90D9' },
  { id: 'works', icon: '🚶', label: 'Works', color: '#4A90D9' },
  { id: 'tasks-learning', icon: '🔴', label: 'Tasks', color: '#4A90D9' },
  { id: 'inventory-learning', icon: '📦', label: 'Inventory', color: '#2196F3' },
];

// Communications Panel
const COMMUNICATIONS_PANEL = [
  { id: 'bulletin-board', icon: '📋', label: 'Bulletin Board', color: '#FFFFFF' },
  { id: 'screen-sharing', icon: '🖥️', label: 'Screen Sharing', color: '#FFFFFF' },
  { id: 'isu-forum', icon: '👥', label: 'ISU Forum', color: '#FFFFFF' },
  { id: 'video-conference', icon: '📹', label: 'Video Conference', color: '#FFFFFF' },
  { id: 'isu-chat', icon: '💬', label: 'ISU Chat', color: '#FFFFFF' },
  { id: 'service-desk', icon: '🎫', label: 'Service Desk Tick', color: '#FFFFFF' },
  { id: 'warp-chat', icon: '⚡', label: 'Warp Chat', color: '#FFFFFF' },
  { id: 'soft-phone', icon: '📱', label: 'Soft Phone', color: '#FFFFFF' },
  { id: 'bulk-sms', icon: '📨', label: 'Bulk SMS', color: '#FFFFFF' },
  { id: 'bulk-email', icon: '✉️', label: 'Bulk Email', color: '#FFFFFF' },
];

// File Libraries
const FILE_LIBRARIES = [
  { id: 'document', label: 'Document', color: '#4A90D9' },
  { id: 'music', label: 'Music', color: '#4A90D9' },
  { id: 're-database', label: 'RE Database', color: '#4A90D9' },
  { id: 'lending-library', label: 'Lending Library', color: '#4A90D9' },
  { id: 'teacher-files', label: 'Teacher Files', color: '#4A90D9' },
  { id: 'class-content', label: 'Class Content', color: '#4A90D9' },
];

// Mental Health Module
const MENTAL_HEALTH_MODULES = [
  { id: 'task-list', icon: '📋', label: 'Task List', color: '#87CEEB' },
  { id: 'task-details', icon: '💊', label: 'Task Details', color: '#98FB98' },
  { id: 'guard-handover', icon: '👮', label: 'Guard Handover', color: '#FFD700' },
  { id: 'clinical-staff', icon: '👨‍⚕️', label: 'Clinical Staff', color: '#F5F5DC' },
  { id: 'add-patient', icon: '🧑‍🦽', label: 'Add Patient Details', color: '#F5F5DC' },
  { id: 'assignee-details', icon: '🏥', label: 'Assignee Details', color: '#E74C3C' },
  { id: 'flags', icon: '🚩', label: 'Flags', color: '#DEB887' },
];

// Admin Tasks
const ADMIN_TASKS = [
  { id: 'stud-data', icon: '📊', label: 'Stud.Data', color: '#4A90D9' },
  { id: 'expenses', icon: '💰', label: 'Expenses', color: '#4A90D9' },
  { id: 'letters', icon: '✉️', label: 'Letters', color: '#4A90D9' },
  { id: 'sms', icon: '📱', label: 'SMS', color: '#4A90D9' },
];

// Management Tools
const MANAGEMENT_TOOLS = [
  { id: 'diary', icon: '📔', label: 'Diary', color: '#F5F5DC' },
  { id: 'cal', icon: '📅', label: 'CAL', color: '#4A90D9' },
  { id: 'personnel', icon: '👤', label: 'Personnel', color: '#E74C3C' },
  { id: 'egroup', icon: '📧', label: 'EGroup', color: '#4A90D9' },
  { id: 'meeting', icon: '🤝', label: 'Meeting', color: '#4A90D9' },
  { id: 'jobs', icon: '💼', label: 'Jobs', color: '#4A90D9' },
];

// Bottom Toolbar
const BOTTOM_TOOLBAR = [
  { id: 'meetings', icon: '👥', label: 'Meetings' },
  { id: 'ischool', icon: '🎓', label: 'iSchool' },
  { id: 'virtual-classroom', icon: '🌐', label: 'Virtual Classroom' },
  { id: 'tests', icon: '📝', label: 'Tests' },
  { id: 'courses', icon: '📚', label: 'Courses' },
  { id: 'curriculum', icon: '📖', label: 'Curriculum' },
];

// Secondary Bottom Toolbar
const SECONDARY_TOOLBAR = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'find', icon: '🔍', label: 'Find' },
  { id: 'msg-board', icon: '📋', label: 'Msg Board' },
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'forum', icon: '📢', label: 'Forum' },
  { id: 'task-cal', icon: '📅', label: 'Task Cal' },
  { id: 'margin', icon: '💰', label: 'Margin' },
  { id: 'users', icon: '👥', label: 'Users' },
  { id: 'sec-notes', icon: 'ℹ️', label: 'Sec Notes' },
  { id: 'files', icon: '📁', label: 'Files' },
];

// System Toolbar
const SYSTEM_TOOLBAR = [
  { id: 'dictation', icon: '🎤', label: 'Dictation Stardate Log' },
  { id: 'file-organiser', icon: '📂', label: 'File Organiser' },
  { id: 'user-profile', icon: '👤', label: 'User Profile' },
  { id: 'maps-tracking', icon: '📍', label: 'Maps & Tracking' },
  { id: 'database-options', icon: '💾', label: 'Database Options' },
  { id: 'search-selection', icon: '🔎', label: 'Search Selection' },
];

type TabId = 'general' | 'mental-health' | 'learning' | 'communications' | 'admin' | 'management';

export default function CommandCenterScreen() {
  const router = useRouter();
  const [activeTopTab, setActiveTopTab] = useState('database-modules');
  const [activeDbTab, setActiveDbTab] = useState('home');
  const [activePanel, setActivePanel] = useState<TabId>('general');

  const renderModuleButton = (item: { id: string; icon: string; label: string; color: string; route?: string }) => (
    <TouchableOpacity
      key={item.id}
      style={{ 
        backgroundColor: item.color,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
        margin: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => item.route && router.push(item.route as any)}
    >
      <Text style={{ fontSize: 28 }}>{item.icon}</Text>
      <Text style={{ fontSize: 10, marginTop: 4, textAlign: 'center', color: '#333' }}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderPanelSelector = () => (
    <View className="flex-row flex-wrap justify-center mb-4 gap-2">
      {[
        { id: 'general' as TabId, label: 'General Practice' },
        { id: 'mental-health' as TabId, label: 'Mental Health' },
        { id: 'learning' as TabId, label: 'Learning Tools' },
        { id: 'communications' as TabId, label: 'Communications' },
        { id: 'admin' as TabId, label: 'Admin Tasks' },
        { id: 'management' as TabId, label: 'Management' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          className={`px-3 py-2 rounded-lg ${activePanel === tab.id ? 'bg-primary' : 'bg-surface'}`}
          onPress={() => setActivePanel(tab.id)}
        >
          <Text className={`text-xs font-medium ${activePanel === tab.id ? 'text-white' : 'text-foreground'}`}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'general':
        return (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">General Practice</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {GENERAL_PRACTICE_MODULES.map(renderModuleButton)}
            </View>
          </View>
        );
      case 'mental-health':
        return (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Mental Health</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {MENTAL_HEALTH_MODULES.map(renderModuleButton)}
            </View>
          </View>
        );
      case 'learning':
        return (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Learning Tools</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {LEARNING_TOOLS.map(item => renderModuleButton({ ...item, color: item.color || '#4A90D9' }))}
            </View>
          </View>
        );
      case 'communications':
        return (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Communications</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {COMMUNICATIONS_PANEL.map(renderModuleButton)}
            </View>
          </View>
        );
      case 'admin':
        return (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Admin Tasks</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {ADMIN_TASKS.map(renderModuleButton)}
            </View>
          </View>
        );
      case 'management':
        return (
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Management Tools</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {MANAGEMENT_TOOLS.map(renderModuleButton)}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-3 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-bold text-foreground">ISU_MediVac_One</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted">Hello Jedi, today is {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              <Text className="text-2xl">❤️</Text>
            </View>
          </View>
        </View>

        {/* Top Navigation Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-surface">
          <View className="flex-row p-2 gap-1">
            {TOP_TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                className={`px-4 py-2 rounded-lg`}
                style={{ backgroundColor: activeTopTab === tab.id ? tab.color : 'transparent' }}
                onPress={() => setActiveTopTab(tab.id)}
              >
                <Text className={`text-sm font-medium ${activeTopTab === tab.id ? 'text-white' : 'text-foreground'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Database Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-background border-b border-border">
          <View className="flex-row p-2 gap-2">
            {DATABASE_TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                className={`px-3 py-1 ${activeDbTab === tab.id ? 'border-b-2 border-primary' : ''}`}
                onPress={() => setActiveDbTab(tab.id)}
              >
                <Text className={`text-sm ${activeDbTab === tab.id ? 'text-primary font-semibold' : 'text-muted'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Quick Access Toolbar */}
        <View className="flex-row justify-around py-3 bg-surface border-b border-border">
          {QUICK_ACCESS.map(item => (
            <TouchableOpacity key={item.id} className="items-center">
              <IconSymbol name={item.icon} size={24} color="#4A90D9" />
              <Text className="text-xs text-muted mt-1">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coms Tower Status */}
        <View className="mx-4 mt-4 p-3 bg-primary rounded-xl flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl">📡</Text>
            <Text className="text-white font-semibold">Coms Tower</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-green-400" />
            <Text className="text-white text-sm">Connected</Text>
          </View>
        </View>

        {/* Panel Selector */}
        <View className="px-4 mt-4">
          {renderPanelSelector()}
        </View>

        {/* Active Panel Content */}
        <View className="px-4 mt-2">
          {renderActivePanel()}
        </View>

        {/* Database Modules Sidebar (Scrollable) */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Database Modules</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {DATABASE_MODULES.map(renderModuleButton)}
          </View>
        </View>

        {/* File Libraries */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">File Libraries</Text>
          <View className="gap-2">
(Content truncated due to size limit. Use line ranges to read remaining content)