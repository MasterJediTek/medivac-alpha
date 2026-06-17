import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Mental Health Module Icons from FileMaker
const MENTAL_HEALTH_MODULES = [
  { id: 'task-list', name: 'Task List', icon: '📋', color: '#4ECDC4', route: '/tasks' },
  { id: 'task-details', name: 'Task Details', icon: '💊', color: '#45B7D1', route: '/tasks' },
  { id: 'guard-handover', name: 'Guard Handover', icon: '👮', color: '#96CEB4', route: '/guard-handover' },
  { id: 'clinical-staff', name: 'Clinical Staff', icon: '👨‍⚕️', color: '#FFEAA7', route: '/staff' },
  { id: 'add-patient', name: 'Add Patient Details', icon: '♿', color: '#DDA0DD', route: '/patients' },
  { id: 'assignee-details', name: 'Assignee Details', icon: '🏥', color: '#FF6B6B', route: '/staff' },
  { id: 'flags', name: 'Flags', icon: '🚩', color: '#C9B037', route: '/flags' },
];

// Patient Flags
const PATIENT_FLAGS = [
  { id: 1, name: 'High Risk', color: '#E74C3C', count: 3 },
  { id: 2, name: 'Suicide Watch', color: '#9B59B6', count: 1 },
  { id: 3, name: 'Medication Alert', color: '#F39C12', count: 5 },
  { id: 4, name: 'Aggressive Behavior', color: '#E67E22', count: 2 },
  { id: 5, name: 'Fall Risk', color: '#3498DB', count: 4 },
  { id: 6, name: 'Isolation Required', color: '#1ABC9C', count: 1 },
];

// Clinical Staff Types
const STAFF_TYPES = [
  { id: 'psychiatrist', name: 'Psychiatrist', icon: '🧠', count: 4 },
  { id: 'psychologist', name: 'Psychologist', icon: '💭', count: 6 },
  { id: 'nurse', name: 'Mental Health Nurse', icon: '👩‍⚕️', count: 12 },
  { id: 'social-worker', name: 'Social Worker', icon: '🤝', count: 5 },
  { id: 'counselor', name: 'Counselor', icon: '💬', count: 8 },
  { id: 'support-worker', name: 'Support Worker', icon: '🙋', count: 15 },
];

// Sample Tasks
const MENTAL_HEALTH_TASKS = [
  { id: 1, title: 'Patient Assessment - Room 204', priority: 'high', status: 'pending', assignee: 'Dr. Sarah Chen', time: '09:00 AM' },
  { id: 2, title: 'Medication Review - John Smith', priority: 'medium', status: 'in-progress', assignee: 'Nurse Williams', time: '10:30 AM' },
  { id: 3, title: 'Group Therapy Session', priority: 'normal', status: 'scheduled', assignee: 'Dr. Michael Brown', time: '02:00 PM' },
  { id: 4, title: 'Crisis Intervention - Ward B', priority: 'urgent', status: 'pending', assignee: 'On-call Team', time: 'ASAP' },
  { id: 5, title: 'Family Meeting - Patient #1247', priority: 'medium', status: 'scheduled', assignee: 'Social Worker', time: '03:30 PM' },
];

type ViewMode = 'overview' | 'tasks' | 'flags' | 'staff';

export default function MentalHealthScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const renderOverview = () => (
    <View className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Mental Health</Text>
      <Text className="text-muted mb-6">Comprehensive mental health management and patient care.</Text>

      {/* Module Grid */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        {MENTAL_HEALTH_MODULES.map(module => (
          <TouchableOpacity
            key={module.id}
            className="bg-surface rounded-2xl p-4 items-center"
            style={{ width: '30%', minWidth: 100 }}
            onPress={() => {
              if (module.id === 'task-list') setViewMode('tasks');
              else if (module.id === 'flags') setViewMode('flags');
              else if (module.id === 'clinical-staff') setViewMode('staff');
            }}
          >
            <View 
              style={{ backgroundColor: module.color }}
              className="w-16 h-16 rounded-xl items-center justify-center mb-2"
            >
              <Text className="text-3xl">{module.icon}</Text>
            </View>
            <Text className="text-foreground text-center text-sm font-medium">{module.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-bold text-foreground mb-3">Today's Overview</Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Active Patients</Text>
          <Text className="text-foreground font-semibold">47</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Pending Assessments</Text>
          <Text className="text-warning font-semibold">8</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted">Scheduled Sessions</Text>
          <Text className="text-foreground font-semibold">12</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted">Staff On Duty</Text>
          <Text className="text-success font-semibold">24</Text>
        </View>
      </View>

      {/* Active Flags Summary */}
      <View className="bg-surface p-4 rounded-xl">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">Active Flags</Text>
          <TouchableOpacity onPress={() => setViewMode('flags')}>
            <Text className="text-primary">View All</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {PATIENT_FLAGS.slice(0, 4).map(flag => (
            <View 
              key={flag.id}
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: flag.color + '20' }}
            >
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: flag.color }} />
              <Text style={{ color: flag.color }} className="font-medium">{flag.name}</Text>
              <Text style={{ color: flag.color }} className="font-bold">({flag.count})</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTasks = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Task List</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 mb-4">
        <IconSymbol name="house.fill" size={20} color="#9BA1A6" />
        <TextInput
          className="flex-1 text-foreground"
          placeholder="Search tasks..."
          placeholderTextColor="#9BA1A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Task List */}
      {MENTAL_HEALTH_TASKS.map(task => (
        <TouchableOpacity key={task.id} className="bg-surface p-4 rounded-xl mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{task.title}</Text>
              <Text className="text-muted text-sm mt-1">{task.assignee}</Text>
            </View>
            <View className={`px-2 py-1 rounded ${
              task.priority === 'urgent' ? 'bg-red-100' :
              task.priority === 'high' ? 'bg-orange-100' :
              task.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              <Text className={`text-xs font-medium ${
                task.priority === 'urgent' ? 'text-red-700' :
                task.priority === 'high' ? 'text-orange-700' :
                task.priority === 'medium' ? 'text-yellow-700' : 'text-blue-700'
              }`}>{task.priority.toUpperCase()}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View className={`px-2 py-1 rounded ${
              task.status === 'pending' ? 'bg-gray-100' :
              task.status === 'in-progress' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <Text className={`text-xs ${
                task.status === 'pending' ? 'text-gray-600' :
                task.status === 'in-progress' ? 'text-blue-600' : 'text-green-600'
              }`}>{task.status}</Text>
            </View>
            <Text className="text-muted text-sm">{task.time}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFlags = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Patient Flags</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-muted mb-4">Monitor and manage patient safety flags and alerts.</Text>

      {PATIENT_FLAGS.map(flag => (
        <TouchableOpacity 
          key={flag.id}
          className="bg-surface p-4 rounded-xl mb-3 flex-row items-center"
        >
          <View 
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: flag.color + '20' }}
          >
            <Text className="text-2xl">🚩</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{flag.name}</Text>
            <Text className="text-muted text-sm">{flag.count} active patients</Text>
          </View>
          <View 
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: flag.color }}
          >
            <Text className="text-white font-bold">{flag.count}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStaff = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Clinical Staff</Text>
        <View style={{ width: 50 }} />
      </View>

      <Text className="text-muted mb-4">Mental health clinical staff directory.</Text>

      {STAFF_TYPES.map(staff => (
        <TouchableOpacity 
          key={staff.id}
          className="bg-surface p-4 rounded-xl mb-3 flex-row items-center"
        >
          <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-4">
            <Text className="text-2xl">{staff.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{staff.name}</Text>
            <Text className="text-muted text-sm">{staff.count} staff members</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'tasks' && renderTasks()}
        {viewMode === 'flags' && renderFlags()}
        {viewMode === 'staff' && renderStaff()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
