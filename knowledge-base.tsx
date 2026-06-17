import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Knowledge Base Categories
const KB_CATEGORIES = [
  { id: 'medical-protocols', name: 'Medical Protocols', icon: '🏥', count: 45, color: '#4A90D9' },
  { id: 'smpo-ink', name: 'SMPO.ink Protocols', icon: '🔐', count: 28, color: '#9B59B6' },
  { id: 'jedi-systems', name: 'JEDI Systems', icon: '⚔️', count: 67, color: '#27AE60' },
  { id: 'wongi', name: 'WONGI Documentation', icon: '🌐', count: 34, color: '#F39C12' },
  { id: 'python-hitch', name: 'Python Hitch', icon: '🐍', count: 23, color: '#E74C3C' },
  { id: 'training', name: 'Training Materials', icon: '📚', count: 89, color: '#1ABC9C' },
  { id: 'policies', name: 'Policies & Procedures', icon: '📋', count: 56, color: '#8E44AD' },
  { id: 'technical', name: 'Technical Docs', icon: '⚙️', count: 41, color: '#34495E' },
];

// Recent Documents
const RECENT_DOCS = [
  { id: 1, title: 'SMPO.ink Protocol v3.2', category: 'SMPO.ink Protocols', updated: '2 hours ago', author: 'System Admin' },
  { id: 2, title: 'Patient Handover Procedure', category: 'Medical Protocols', updated: '5 hours ago', author: 'Dr. Chen' },
  { id: 3, title: 'JEDI Integration Guide', category: 'JEDI Systems', updated: '1 day ago', author: 'Tech Team' },
  { id: 4, title: 'WONGI Communication Setup', category: 'WONGI Documentation', updated: '2 days ago', author: 'IT Support' },
  { id: 5, title: 'Python Hitch Automation Scripts', category: 'Python Hitch', updated: '3 days ago', author: 'Dev Team' },
];

// S3 Sync Status
const S3_SYNC_STATUS = {
  lastSync: '5 minutes ago',
  totalFiles: 383,
  syncedFiles: 380,
  pendingFiles: 3,
  rootFolder: '/JEDI/Systems/MediVac/KnowledgeBase',
  storageUsed: '1.2 GB',
  storageLimit: '10 GB',
};

// Sample Articles
const SAMPLE_ARTICLES = [
  { id: 1, title: 'Getting Started with MediVac One', views: 1234, helpful: 98 },
  { id: 2, title: 'Understanding SMPO.ink Compliance', views: 856, helpful: 95 },
  { id: 3, title: 'JEDI Systems Integration Overview', views: 723, helpful: 92 },
  { id: 4, title: 'Python Hitch Automation Guide', views: 567, helpful: 89 },
  { id: 5, title: 'L3 Cache Configuration', views: 445, helpful: 94 },
];

type ViewMode = 'overview' | 'category' | 'article' | 'sync' | 'add';

export default function KnowledgeBaseScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedCategory, setSelectedCategory] = useState<typeof KB_CATEGORIES[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const renderOverview = () => (
    <View className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Knowledge Base</Text>
      <Text className="text-muted mb-4">Centralized documentation and resources synced to JEDI S3.</Text>

      {/* Search */}
      <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 mb-4">
        <IconSymbol name="house.fill" size={20} color="#9BA1A6" />
        <TextInput
          className="flex-1 text-foreground"
          placeholder="Search knowledge base..."
          placeholderTextColor="#9BA1A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* S3 Sync Status Card */}
      <TouchableOpacity 
        className="bg-primary/10 p-4 rounded-xl mb-4"
        onPress={() => setViewMode('sync')}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl">☁️</Text>
            <Text className="text-foreground font-bold">JEDI S3 Sync</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-green-600 text-sm">Synced</Text>
          </View>
        </View>
        <Text className="text-muted text-sm">{S3_SYNC_STATUS.rootFolder}</Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-muted text-sm">{S3_SYNC_STATUS.syncedFiles}/{S3_SYNC_STATUS.totalFiles} files</Text>
          <Text className="text-muted text-sm">Last sync: {S3_SYNC_STATUS.lastSync}</Text>
        </View>
      </TouchableOpacity>

      {/* Categories Grid */}
      <Text className="text-lg font-bold text-foreground mb-3">Categories</Text>
      <View className="flex-row flex-wrap gap-3 mb-6">
        {KB_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            className="bg-surface rounded-xl p-3"
            style={{ width: '47%' }}
            onPress={() => {
              setSelectedCategory(category);
              setViewMode('category');
            }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <View 
                style={{ backgroundColor: category.color }}
                className="w-10 h-10 rounded-lg items-center justify-center"
              >
                <Text className="text-xl">{category.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-sm">{category.name}</Text>
                <Text className="text-muted text-xs">{category.count} docs</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Documents */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-foreground">Recent Documents</Text>
        <TouchableOpacity onPress={() => setViewMode('add')}>
          <Text className="text-primary font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>
      <View className="gap-2">
        {RECENT_DOCS.map(doc => (
          <TouchableOpacity key={doc.id} className="bg-surface p-4 rounded-xl">
            <Text className="text-foreground font-semibold mb-1">{doc.title}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-primary text-sm">{doc.category}</Text>
              <Text className="text-muted text-sm">{doc.updated}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategory = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">{selectedCategory?.name}</Text>
        <TouchableOpacity onPress={() => setViewMode('add')}>
          <Text className="text-primary font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Category Header */}
      <View className="bg-surface p-4 rounded-xl mb-4 flex-row items-center gap-4">
        <View 
          style={{ backgroundColor: selectedCategory?.color }}
          className="w-16 h-16 rounded-xl items-center justify-center"
        >
          <Text className="text-3xl">{selectedCategory?.icon}</Text>
        </View>
        <View>
          <Text className="text-foreground font-bold text-lg">{selectedCategory?.name}</Text>
          <Text className="text-muted">{selectedCategory?.count} documents</Text>
        </View>
      </View>

      {/* Articles */}
      <Text className="text-lg font-bold text-foreground mb-3">Articles</Text>
      {SAMPLE_ARTICLES.map(article => (
        <TouchableOpacity key={article.id} className="bg-surface p-4 rounded-xl mb-3">
          <Text className="text-foreground font-semibold mb-2">{article.title}</Text>
          <View className="flex-row items-center gap-4">
            <Text className="text-muted text-sm">👁️ {article.views} views</Text>
            <Text className="text-muted text-sm">👍 {article.helpful}% helpful</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSync = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">S3 Sync Status</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Sync Overview */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <View className="flex-row items-center gap-3 mb-4">
          <Text className="text-3xl">☁️</Text>
          <View>
            <Text className="text-foreground font-bold text-lg">JEDI S3 Cloud Storage</Text>
            <Text className="text-muted">Knowledge Base Repository</Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-muted">Root Folder</Text>
            <Text className="text-primary font-medium">{S3_SYNC_STATUS.rootFolder}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Total Files</Text>
            <Text className="text-foreground font-medium">{S3_SYNC_STATUS.totalFiles}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Synced Files</Text>
            <Text className="text-green-600 font-medium">{S3_SYNC_STATUS.syncedFiles}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Pending Files</Text>
            <Text className="text-yellow-600 font-medium">{S3_SYNC_STATUS.pendingFiles}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Last Sync</Text>
            <Text className="text-foreground font-medium">{S3_SYNC_STATUS.lastSync}</Text>
          </View>
        </View>
      </View>

      {/* Storage Usage */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-foreground font-bold mb-3">Storage Usage</Text>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted">Used</Text>
          <Text className="text-foreground font-medium">{S3_SYNC_STATUS.storageUsed} / {S3_SYNC_STATUS.storageLimit}</Text>
        </View>
        <View className="h-3 bg-border rounded-full overflow-hidden">
          <View className="h-full bg-primary rounded-full" style={{ width: '12%' }} />
        </View>
      </View>

      {/* Sync Folders */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-foreground font-bold mb-3">Synced Folders</Text>
        {[
          { name: 'Medical Protocols', files: 45, size: '156 MB' },
          { name: 'SMPO.ink Protocols', files: 28, size: '89 MB' },
          { name: 'JEDI Systems', files: 67, size: '234 MB' },
          { name: 'Training Materials', files: 89, size: '456 MB' },
          { name: 'Technical Docs', files: 41, size: '178 MB' },
        ].map(folder => (
          <View key={folder.name} className="flex-row items-center justify-between py-2 border-b border-border">
            <View className="flex-row items-center gap-2">
              <Text>📁</Text>
              <Text className="text-foreground">{folder.name}</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <Text className="text-muted text-sm">{folder.files} files</Text>
              <Text className="text-muted text-sm">{folder.size}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Sync Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 bg-primary p-4 rounded-xl">
          <Text className="text-white font-semibold text-center">Sync Now</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-surface border border-border p-4 rounded-xl">
          <Text className="text-foreground font-semibold text-center">View Logs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAdd = () => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setViewMode('overview')} className="flex-row items-center gap-2">
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4A90D9" />
          <Text className="text-primary">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Add Document</Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="bg-surface p-4 rounded-xl">
        <Text className="text-foreground font-semibold mb-2">Title</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Document title..."
          placeholderTextColor="#9BA1A6"
        />

        <Text className="text-foreground font-semibold mb-2">Category</Text>
        <TouchableOpacity className="bg-background border border-border rounded-lg p-3 mb-4">
          <Text className="text-muted">Select category...</Text>
        </TouchableOpacity>

        <Text className="text-foreground font-semibold mb-2">Content</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground h-40 mb-4"
          placeholder="Document content..."
          placeholderTextColor="#9BA1A6"
          multiline
          textAlignVertical="top"
        />

        <Text className="text-foreground font-semibold mb-2">Tags</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 text-foreground mb-4"
          placeholder="Add tags (comma separated)..."
          placeholderTextColor="#9BA1A6"
        />

        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity className="flex-1 bg-background border border-dashed border-border p-4 rounded-lg items-center">
            <Text className="text-2xl mb-1">📎</Text>
            <Text className="text-muted text-sm">Attach Files</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-primary p-4 rounded-xl">
            <Text className="text-white font-semibold text-center">Save & Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-surface border border-border p-4 rounded-xl">
            <Text className="text-foreground font-semibold text-center">Save Draft</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'category' && renderCategory()}
        {viewMode === 'sync' && renderSync()}
        {viewMode === 'add' && renderAdd()}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
