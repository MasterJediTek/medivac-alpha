import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Workflow Steps
const WORKFLOW_STEPS = [
  { id: 1, label: 'Task List', icon: '📋', color: '#87CEEB', description: 'View all assigned tasks' },
  { id: 2, label: 'Task Details', icon: '💊', color: '#98FB98', description: 'Review task specifics' },
  { id: 3, label: 'Assignee List', icon: '🏥', color: '#F5F5DC', description: 'View all assignees' },
  { id: 4, label: 'Assignee Details', icon: '🏥', color: '#E74C3C', description: 'Review assignee info' },
  { id: 5, label: 'Add Assignee', icon: '❤️', color: '#FFB6C1', description: 'Add new assignee' },
  { id: 6, label: 'Add Patient Details', icon: '🧑‍🦽', color: '#F5F5DC', description: 'Enter patient info' },
];

// Central Roles
const CENTRAL_ROLES = [
  { id: 'guard-handover', label: 'Guard Handover', icon: '👮', color: '#FFD700' },
  { id: 'clinical-staff', label: 'Clinical Staff', icon: '👨‍⚕️', color: '#F5F5DC' },
  { id: 'medivac-manager', label: 'MediVac Manager', icon: '🚑', color: '#E74C3C' },
  { id: 'reports-records', label: 'Reports and Records', icon: '📋', color: '#98FB98' },
];

// Quick Actions (Bottom Bar)
const QUICK_ACTIONS = [
  { id: 'patient', icon: '🏥', label: 'Patient', color: '#E74C3C' },
  { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors', color: '#F5F5DC' },
  { id: 'medication', icon: '💊', label: 'Medication', color: '#FFB6C1' },
  { id: 'check-up', icon: '🌡️', label: 'Check Up', color: '#90EE90' },
  { id: 'surgery', icon: '🏥', label: 'Surgery', color: '#87CEEB' },
  { id: 'labs', icon: '🔬', label: 'Labs', color: '#DEB887' },
  { id: 'rooms', icon: '🛏️', label: 'Rooms', color: '#D2B48C' },
  { id: 'appointment', icon: '📞', label: 'Appointment', color: '#ADD8E6' },
  { id: 'nurse', icon: '👩‍⚕️', label: 'Nurse', color: '#98FB98' },
];

// Sample Tasks
const SAMPLE_TASKS = [
  { id: 1, title: 'Morning medication round', assignee: 'Dr. Smith', status: 'pending', priority: 'high' },
  { id: 2, title: 'Patient vitals check - Ward A', assignee: 'Nurse Johnson', status: 'in-progress', priority: 'medium' },
  { id: 3, title: 'Equipment sterilization', assignee: 'Tech Williams', status: 'completed', priority: 'low' },
  { id: 4, title: 'Emergency response drill', assignee: 'All Staff', status: 'scheduled', priority: 'high' },
];

// Sample Assignees
const SAMPLE_ASSIGNEES = [
  { id: 1, name: 'Dr. Sarah Smith', role: 'Senior Doctor', shift: 'Day', status: 'active' },
  { id: 2, name: 'Nurse Mike Johnson', role: 'Head Nurse', shift: 'Day', status: 'active' },
  { id: 3, name: 'Dr. Emily Brown', role: 'Resident', shift: 'Night', status: 'off-duty' },
  { id: 4, name: 'Tech Alex Williams', role: 'Lab Technician', shift: 'Day', status: 'active' },
];

type ViewMode = 'workflow' | 'tasks' | 'assignees' | 'add-assignee' | 'add-patient';

export default function GuardHandoverScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('workflow');
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);

  const renderWorkflowView = () => (
    <View className="p-4">
      {/* Header with Government Logo */}
      <View className="bg-gray-800 p-4 rounded-t-xl">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-white rounded-lg items-center justify-center">
              <Text className="text-2xl">🦘</Text>
            </View>
            <View>
              <Text className="text-white font-bold">Government of Western Australia</Text>
              <Text className="text-gray-300 text-sm">WA Country Health Service</Text>
            </View>
          </View>
          <View className="items-center">
            <Text className="text-white text-xl font-bold">Guard Hand-over Manager</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-yellow-400 font-bold">iSKOOLEDU</Text>
              <Text className="text-2xl">⚖️</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Workflow Diagram */}
      <View className="bg-white p-6 rounded-b-xl">
        {/* Top Row - Steps 1 & 2 */}
        <View className="flex-row justify-center gap-8 mb-4">
          {WORKFLOW_STEPS.slice(0, 2).map(step => (
            <TouchableOpacity
              key={step.id}
              className="items-center"
              onPress={() => {
                if (step.id === 1) setViewMode('tasks');
              }}
            >
              <View 
                style={{ backgroundColor: step.color }}
                className="w-16 h-16 rounded-xl items-center justify-center shadow-md"
              >
                <Text className="text-2xl">{step.icon}</Text>
              </View>
              <Text className="text-primary text-sm mt-2 font-medium">{step.id}. {step.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Central Hub */}
        <View className="items-center my-6">
          <View className="flex-row items-center gap-4">
            {/* Guard Handover (Center) */}
            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 rounded-full bg-yellow-400 items-center justify-center shadow-lg">
                <Text className="text-4xl">👮</Text>
              </View>
              <Text className="text-primary text-sm mt-2 font-bold">Guard Handover</Text>
            </TouchableOpacity>
            
            {/* MediVac Manager */}
            <View className="items-center ml-8">
              <View className="w-16 h-16 rounded-xl bg-red-500 items-center justify-center shadow-md">
                <Text className="text-2xl">🚑</Text>
              </View>
              <Text className="text-primary text-sm mt-2 font-medium">MediVac Manager</Text>
            </View>
          </View>
          
          {/* Reports and Records */}
          <TouchableOpacity className="items-center mt-4">
            <View className="w-16 h-16 rounded-xl bg-green-100 items-center justify-center shadow-md border border-green-300">
              <Text className="text-2xl">📋</Text>
            </View>
            <Text className="text-primary text-sm mt-2 font-medium">Reports and Records</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Row - Steps 3, 4, 5, 6 */}
        <View className="flex-row justify-center gap-4 mt-4">
          {WORKFLOW_STEPS.slice(2).map(step => (
            <TouchableOpacity
              key={step.id}
              className="items-center"
              onPress={() => {
                if (step.id === 3) setViewMode('assignees');
                if (step.id === 5) setViewMode('add-assignee');
                if (step.id === 6) setViewMode('add-patient');
              }}
            >
              <View 
                style={{ backgroundColor: step.color }}
                className="w-14 h-14 rounded-xl items-center justify-center shadow-md"
              >
                <Text className="text-xl">{step.icon}</Text>
              </View>
              <Text className="text-primary text-xs mt-2 font-medium text-center">{step.id}. {step.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Clinical Staff */}
        <View className="items-center mt-6">
          <TouchableOpacity className="items-center">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center shadow-md">
              <Text className="text-3xl">👨‍⚕️</Text>
            </View>
            <Text className="text-primary text-sm mt-2 font-medium">Clinical Staff</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTasksView = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('workflow')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back to Workflow</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Task List</Text>
      </View>

      {SAMPLE_TASKS.map(task => (
        <TouchableOpacity
          key={task.id}
          className={`bg-surface p-4 rounded-xl mb-3 border-l-4 ${
            task.priority === 'high' ? 'border-l-red-500' :
            task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
          }`}
          onPress={() => setSelectedTask(task.id)}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{task.title}</Text>
              <Text className="text-muted text-sm mt-1">Assignee: {task.assignee}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              task.status === 'completed' ? 'bg-green-100' :
              task.status === 'in-progress' ? 'bg-yellow-100' :
              task.status === 'pending' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Text className={`text-xs font-medium ${
                task.status === 'completed' ? 'text-green-700' :
                task.status === 'in-progress' ? 'text-yellow-700' :
                task.status === 'pending' ? 'text-red-700' : 'text-blue-700'
              }`}>{task.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAssigneesView = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('workflow')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back to Workflow</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Assignee List</Text>
      </View>

      {SAMPLE_ASSIGNEES.map(assignee => (
        <TouchableOpacity
          key={assignee.id}
          className="bg-surface p-4 rounded-xl mb-3 flex-row items-center"
          onPress={() => setSelectedAssignee(assignee.id)}
        >
          <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4">
            <Text className="text-white font-bold">{assignee.name.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{assignee.name}</Text>
            <Text className="text-muted text-sm">{assignee.role} • {assignee.shift} Shift</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${assignee.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Text className={`text-xs font-medium ${assignee.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
              {assignee.status}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        className="bg-primary p-4 rounded-xl mt-4 flex-row items-center justify-center gap-2"
        onPress={() => setViewMode('add-assignee')}
      >
        <Text className="text-2xl">➕</Text>
        <Text className="text-white font-semibold">Add New Assignee</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddAssigneeForm = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('assignees')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back to Assignees</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Add Assignee</Text>
      </View>

      <View className="bg-surface p-4 rounded-xl">
        <Text className="text-foreground font-semibold mb-2">Full Name</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter full name"
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Role</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Select role"
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Shift</Text>
        <View className="flex-row gap-2 mb-4">
          {['Day', 'Night', 'Rotating'].map(shift => (
            <TouchableOpacity key={shift} className="flex-1 bg-background border border-border rounded-lg p-3">
              <Text className="text-center text-foreground">{shift}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-foreground font-semibold mb-2">Contact Number</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter contact number"
          placeholderTextColor="#9BA1A6"
          keyboardType="phone-pad"
        />

        <Text className="text-foreground font-semibold mb-2">Email</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter email address"
          placeholderTextColor="#9BA1A6"
          keyboardType="email-address"
        />

        <TouchableOpacity className="bg-primary p-4 rounded-xl mt-4">
          <Text className="text-white font-semibold text-center">Save Assignee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddPatientForm = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('workflow')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back to Workflow</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Add Patient Details</Text>
      </View>

      <View className="bg-surface p-4 rounded-xl">
        <Text className="text-foreground font-semibold mb-2">Patient Name</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter patient name"
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Date of Birth</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Medical Record Number</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter MRN"
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Ward/Room</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter ward/room"
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Diagnosis</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter primary diagnosis"
          placeholderTextColor="#9BA1A6"
          multiline
          numberOfLines={3}
        />

        <Text className="text-foreground font-semibold mb-2">Special Notes</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Enter any special notes or flags"
          placeholderTextColor="#9BA1A6"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity className="bg-primary p-4 rounded-xl mt-4">
          <Text className="text-white font-semibold text-center">Save Patient Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'workflow' && renderWorkflowView()}
        {viewMode === 'tasks' && renderTasksView()}
        {viewMode === 'assignees' && renderAssigneesView()}
        {viewMode === 'add-assignee' && renderAddAssigneeForm()}
        {viewMode === 'add-patient' && renderAddPatientForm()}

        {/* Quick Actions Bar */}
        <View className="bg-surface py-4 mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3 px-4">
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={{ backgroundColor: action.color }}
                  className="w-16 h-16 rounded-xl items-center justify-center shadow-md"
                >
                  <Text className="text-2xl">{action.icon}</Text>
                  <Text className="text-xs mt-1 text-center" style={{ color: '#333' }}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
