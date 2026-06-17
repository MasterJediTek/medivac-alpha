import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Learning Tools Modules from FileMaker
const LEARNING_MODULES = [
  { id: 'projects', name: 'Projects', icon: '📁', color: '#4A90D9' },
  { id: 'works', name: 'Works', icon: '🚶', color: '#E74C3C' },
  { id: 'tasks', name: 'Tasks', icon: '🔴', color: '#9B59B6' },
  { id: 'inventory', name: 'Inventory', icon: '📦', color: '#27AE60' },
];

// File Libraries from FileMaker
const FILE_LIBRARIES = [
  { id: 'document', name: 'Document', color: '#4A90D9', count: 156 },
  { id: 'music', name: 'Music', color: '#E74C3C', count: 42 },
  { id: 're-database', name: 'RE Database', color: '#F39C12', count: 89 },
  { id: 'lending-library', name: 'Lending Library', color: '#9B59B6', count: 234 },
  { id: 'teacher-files', name: 'Teacher Files', color: '#27AE60', count: 67 },
  { id: 'class-content', name: 'Class Content', color: '#1ABC9C', count: 178 },
];

// Training Tools from FileMaker
const TRAINING_TOOLS = [
  { id: 'files', name: 'Files', icon: '📄', color: '#4A90D9' },
  { id: 'present', name: 'Present', icon: '📊', color: '#E74C3C' },
  { id: 'to-do', name: 'To Do', icon: '✅', color: '#27AE60' },
];

// Management Tools from FileMaker
const MANAGEMENT_TOOLS = [
  { id: 'diary', name: 'Diary', icon: '📔', color: '#9B59B6' },
  { id: 'cal', name: 'CAL', icon: '📅', color: '#F39C12' },
  { id: 'personnel', name: 'Personnel', icon: '👤', color: '#E74C3C' },
  { id: 'egroup', name: 'EGroup', icon: '⭐', color: '#4A90D9' },
  { id: 'meeting', name: 'Meeting', icon: '📧', color: '#27AE60' },
  { id: 'jobs', name: 'Jobs', icon: '💼', color: '#1ABC9C' },
];

// Record Keeping from FileMaker
const RECORD_KEEPING = [
  { id: 'marks', name: 'Marks', icon: '📝', color: '#4A90D9' },
  { id: 'alert', name: 'Alert', icon: '⚠️', color: '#E74C3C' },
  { id: 'student', name: 'Student', icon: '👨‍🎓', color: '#27AE60' },
];

// Sample Projects
const SAMPLE_PROJECTS = [
  { id: 1, name: 'JEDI Integration Phase 2', status: 'active', progress: 75, dueDate: '2026-02-15' },
  { id: 2, name: 'SMPO Protocol Update', status: 'active', progress: 45, dueDate: '2026-02-28' },
  { id: 3, name: 'Staff Training Module', status: 'planning', progress: 20, dueDate: '2026-03-10' },
  { id: 4, name: 'Patient Portal Enhancement', status: 'completed', progress: 100, dueDate: '2026-01-30' },
];

type ViewMode = 'overview' | 'projects' | 'files' | 'training' | 'management' | 'records';

export default function LearningToolsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const renderOverview = () => (
    <View className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Learning Tools</Text>
      <Text className="text-muted mb-6">J.E.D.iTek-Council integrated learning and training platform.</Text>

      {/* Main Learning Modules */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-bold text-foreground mb-3">Learning Tools</Text>
        <View className="flex-row flex-wrap gap-3">
          {LEARNING_MODULES.map(module => (
            <TouchableOpacity
              key={module.id}
              className="items-center"
              style={{ width: '22%' }}
              onPress={() => module.id === 'projects' && setViewMode('projects')}
            >
              <View 
                style={{ backgroundColor: module.color }}
                className="w-14 h-14 rounded-xl items-center justify-center mb-1"
              >
                <Text className="text-2xl">{module.icon}</Text>
              </View>
              <Text className="text-foreground text-xs text-center">{module.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* File Libraries */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">File Libraries</Text>
          <TouchableOpacity onPress={() => setViewMode('files')}>
            <Text className="text-primary">View All</Text>
          </TouchableOpacity>
        </View>
        <View className="gap-2">
          {FILE_LIBRARIES.slice(0, 4).map(lib => (
            <TouchableOpacity 
              key={lib.id}
              className="flex-row items-center justify-between py-2 border-b border-border"
            >
              <View className="flex-row items-center gap-3">
                <View 
                  className="w-3 h-8 rounded"
                  style={{ backgroundColor: lib.color }}
                />
                <Text className="text-foreground">{lib.name}</Text>
              </View>
              <Text className="text-muted">{lib.count} files</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Access Sections */}
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity 
          className="flex-1 bg-surface p-4 rounded-xl"
          onPress={() => setViewMode('training')}
        >
          <Text className="text-lg font-bold text-foreground mb-2">Training Tools</Text>
          <Text className="text-muted text-sm">{TRAINING_TOOLS.length} modules</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 bg-surface p-4 rounded-xl"
          onPress={() => setViewMode('management')}
        >
          <Text className="text-lg font-bold text-foreground mb-2">Management</Text>
          <Text className="text-muted text-sm">{MANAGEMENT_TOOLS.length} tools</Text>
        </TouchableOpacity>
      </View>

      {/* Record Keeping */}
      <TouchableOpacity 
        className="bg-surface p-4 rounded-xl"
        onPress={() => setViewMode('records')}
      >
        <Text className="text-lg font-bold text-foreground mb-2">Record Keeping</Text>
        <View className="flex-row gap-4">
          {RECORD_KEEPING.map(record => (
            <View key={record.id} className="items-center">
              <View 
                style={{ backgroundColor: record.color + '20' }}
                className="w-10 h-10 rounded-lg items-center justify-center mb-1"
              >
                <Text>{record.icon}</Text>
              </View>
              <Text className="text-muted text-xs">{record.name}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderProjects = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Projects</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 mb-4">
        <IconSymbol name="house.fill" size={20} color="#9BA1A6" />
        <TextInput
          className="flex-1 text-foreground"
          placeholder="Search projects..."
          placeholderTextColor="#9BA1A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Project List */}
      {SAMPLE_PROJECTS.map(project => (
        <TouchableOpacity key={project.id} className="bg-surface p-4 rounded-xl mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground font-semibold flex-1">{project.name}</Text>
            <View className={`px-2 py-1 rounded ${
              project.status === 'active' ? 'bg-green-100' :
              project.status === 'planning' ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              <Text className={`text-xs font-medium ${
                project.status === 'active' ? 'text-green-700' :
                project.status === 'planning' ? 'text-yellow-700' : 'text-blue-700'
              }`}>{project.status}</Text>
            </View>
          </View>
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-muted text-sm">Progress</Text>
              <Text className="text-foreground font-medium">{project.progress}%</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </View>
          </View>
          <Text className="text-muted text-sm">Due: {project.dueDate}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFiles = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">File Libraries</Text>
        <TouchableOpacity>
          <Text className="text-primary font-semibold">+ Upload</Text>
        </TouchableOpacity>
      </View>

      {FILE_LIBRARIES.map(lib => (
        <TouchableOpacity 
          key={lib.id}
          className="bg-surface p-4 rounded-xl mb-3 flex-row items-center"
        >
          <View 
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: lib.color }}
          >
            <Text className="text-white text-lg">📁</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{lib.name}</Text>
            <Text className="text-muted text-sm">{lib.count} files</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTraining = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Training Tools</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="flex-row flex-wrap gap-4">
        {TRAINING_TOOLS.map(tool => (
          <TouchableOpacity
            key={tool.id}
            className="bg-surface rounded-2xl p-4 items-center"
            style={{ width: '30%', minWidth: 100 }}
          >
            <View 
              style={{ backgroundColor: tool.color }}
              className="w-16 h-16 rounded-xl items-center justify-center mb-2"
            >
              <Text className="text-3xl">{tool.icon}</Text>
            </View>
            <Text className="text-foreground text-center font-medium">{tool.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* IT Support Desk */}
      <TouchableOpacity className="bg-primary/10 p-4 rounded-xl mt-6 flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center mr-4">
          <Text className="text-2xl">❓</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">IT Support Desk</Text>
          <Text className="text-muted text-sm">Get help with technical issues</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#4A90D9" />
      </TouchableOpacity>

      {/* Database Options */}
      <TouchableOpacity className="bg-surface p-4 rounded-xl mt-3 flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-gray-700 items-center justify-center mr-4">
          <Text className="text-2xl">⚙️</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Database Options</Text>
          <Text className="text-muted text-sm">Configure database settings</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
      </TouchableOpacity>

      {/* File Organiser */}
      <TouchableOpacity className="bg-surface p-4 rounded-xl mt-3 flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-blue-500 items-center justify-center mr-4">
          <Text className="text-2xl">📂</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">File Organiser</Text>
          <Text className="text-muted text-sm">Manage and organize files</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
      </TouchableOpacity>

      {/* J.E.D.iTek-Council */}
      <TouchableOpacity className="bg-surface p-4 rounded-xl mt-3 flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-purple-500 items-center justify-center mr-4">
          <Text className="text-2xl">🎧</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">J.E.D.iTek-Council</Text>
          <Text className="text-muted text-sm">JEDI Council communications</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
      </TouchableOpacity>

      {/* Game Records */}
      <TouchableOpacity className="bg-surface p-4 rounded-xl mt-3 flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-yellow-500 items-center justify-center mr-4">
          <Text className="text-2xl">⭐</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Game Records</Text>
          <Text className="text-muted text-sm">Track gamification progress</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
      </TouchableOpacity>
    </View>
  );

  const renderManagement = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Management Tools</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="flex-row flex-wrap gap-4">
        {MANAGEMENT_TOOLS.map(tool => (
          <TouchableOpacity
            key={tool.id}
            className="bg-surface rounded-2xl p-4 items-center"
            style={{ width: '30%', minWidth: 100 }}
          >
            <View 
              style={{ backgroundColor: tool.color }}
              className="w-16 h-16 rounded-xl items-center justify-center mb-2"
            >
              <Text className="text-3xl">{tool.icon}</Text>
            </View>
            <Text className="text-foreground text-center font-medium">{tool.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecords = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Record Keeping</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="flex-row flex-wrap gap-4">
        {RECORD_KEEPING.map(record => (
          <TouchableOpacity
            key={record.id}
            className="bg-surface rounded-2xl p-4 items-center"
            style={{ width: '30%', minWidth: 100 }}
          >
            <View 
              style={{ backgroundColor: record.color }}
              className="w-16 h-16 rounded-xl items-center justify-center mb-2"
            >
              <Text className="text-3xl">{record.icon}</Text>
            </View>
            <Text className="text-foreground text-center font-medium">{record.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'projects' && renderProjects()}
        {viewMode === 'files' && renderFiles()}
        {viewMode === 'training' && renderTraining()}
        {viewMode === 'management' && renderManagement()}
        {viewMode === 'records' && renderRecords()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
