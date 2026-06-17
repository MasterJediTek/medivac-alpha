/**
 * Report Templates Screen
 * Customize report templates with drag-and-drop sections
 * MediVac One v5.7
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  reportTemplateService, 
  ReportTemplate, 
  ReportSection,
  SectionType,
  SECTION_LIBRARY
} from "@/lib/services/report-template-service";

type TabType = 'templates' | 'editor' | 'sections';

export default function ReportTemplatesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [editingSection, setEditingSection] = useState<ReportSection | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await reportTemplateService.initialize();
      setTemplates(reportTemplateService.getTemplates());
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('editor');
  };

  const handleDuplicate = async (template: ReportTemplate) => {
    Alert.prompt(
      'Duplicate Template',
      'Enter a name for the new template:',
      async (name) => {
        if (name) {
          await reportTemplateService.duplicateTemplate(template.id, name);
          loadData();
        }
      },
      'plain-text',
      `${template.name} (Copy)`
    );
  };

  const handleDelete = async (template: ReportTemplate) => {
    if (template.isDefault) {
      Alert.alert('Cannot Delete', 'Default templates cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await reportTemplateService.deleteTemplate(template.id);
            if (selectedTemplate?.id === template.id) {
              setSelectedTemplate(null);
              setActiveTab('templates');
            }
            loadData();
          },
        },
      ]
    );
  };

  const handleAddSection = async (sectionType: SectionType) => {
    if (!selectedTemplate) return;
    
    await reportTemplateService.addSection(selectedTemplate.id, sectionType);
    const updated = reportTemplateService.getTemplate(selectedTemplate.id);
    if (updated) {
      setSelectedTemplate(updated);
    }
    loadData();
  };

  const handleToggleSectionVisibility = async (section: ReportSection) => {
    if (!selectedTemplate) return;
    
    await reportTemplateService.updateSection(selectedTemplate.id, section.id, {
      visible: !section.visible,
    });
    const updated = reportTemplateService.getTemplate(selectedTemplate.id);
    if (updated) {
      setSelectedTemplate(updated);
    }
  };

  const handleRemoveSection = async (section: ReportSection) => {
    if (!selectedTemplate) return;
    
    Alert.alert(
      'Remove Section',
      `Remove "${section.title}" from this template?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await reportTemplateService.removeSection(selectedTemplate.id, section.id);
            const updated = reportTemplateService.getTemplate(selectedTemplate.id);
            if (updated) {
              setSelectedTemplate(updated);
            }
            loadData();
          },
        },
      ]
    );
  };

  const handleMoveSection = async (section: ReportSection, direction: 'up' | 'down') => {
    if (!selectedTemplate) return;
    
    const sections = [...selectedTemplate.sections].sort((a, b) => a.order - b.order);
    const currentIndex = sections.findIndex(s => s.id === section.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const temp = sections[currentIndex];
      sections[currentIndex] = sections[currentIndex - 1];
      sections[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < sections.length - 1) {
      const temp = sections[currentIndex];
      sections[currentIndex] = sections[currentIndex + 1];
      sections[currentIndex + 1] = temp;
    } else {
      return;
    }
    
    await reportTemplateService.reorderSections(selectedTemplate.id, sections.map(s => s.id));
    const updated = reportTemplateService.getTemplate(selectedTemplate.id);
    if (updated) {
      setSelectedTemplate(updated);
    }
  };

  const stats = reportTemplateService.getStatistics();

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'compliance': return '#10B981';
      case 'security': return '#EF4444';
      case 'analytics': return '#8B5CF6';
      case 'audit': return '#F59E0B';
      default: return colors.muted;
    }
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['templates', 'editor', 'sections'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          disabled={tab === 'editor' && !selectedTemplate}
          className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''} ${tab === 'editor' && !selectedTemplate ? 'opacity-50' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStats = () => (
    <View className="flex-row flex-wrap gap-2 mb-4">
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Total</Text>
        <Text className="text-foreground text-xl font-bold">{stats.totalTemplates}</Text>
      </View>
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Custom</Text>
        <Text style={{ color: colors.primary }} className="text-xl font-bold">{stats.customTemplates}</Text>
      </View>
      <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
        <Text className="text-muted text-xs">Default</Text>
        <Text className="text-foreground text-xl font-bold">{stats.defaultTemplates}</Text>
      </View>
    </View>
  );

  const renderTemplateCard = (template: ReportTemplate) => (
    <TouchableOpacity
      key={template.id}
      onPress={() => handleSelectTemplate(template)}
      className="bg-surface rounded-xl p-4 mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground font-semibold">{template.name}</Text>
            {template.isDefault && (
              <View className="bg-primary/20 px-2 py-0.5 rounded">
                <Text style={{ color: colors.primary }} className="text-xs">Default</Text>
              </View>
            )}
          </View>
          <Text className="text-muted text-sm mt-1">{template.description}</Text>
        </View>
        <View 
          style={{ backgroundColor: getCategoryColor(template.category) + '20' }}
          className="px-2 py-1 rounded"
        >
          <Text style={{ color: getCategoryColor(template.category) }} className="text-xs capitalize">
            {template.category}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1">
          <IconSymbol name="rectangle.3.group.fill" size={14} color={colors.muted} />
          <Text className="text-muted text-sm">{template.sections.length} sections</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <IconSymbol name="doc.fill" size={14} color={colors.muted} />
          <Text className="text-muted text-sm">v{template.version}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleSelectTemplate(template)}
          className="flex-1 bg-primary/10 py-2 rounded-lg"
        >
          <Text style={{ color: colors.primary }} className="text-center font-medium">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDuplicate(template)}
          className="flex-1 bg-background py-2 rounded-lg"
        >
          <Text className="text-foreground text-center font-medium">Duplicate</Text>
        </TouchableOpacity>
        {!template.isDefault && (
          <TouchableOpacity
            onPress={() => handleDelete(template)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <IconSymbol name="chevron.right" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTemplatesTab = () => (
    <View>
      {renderStats()}
      
      {templates.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="doc.text.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No templates found</Text>
        </View>
      ) : (
        templates.map(renderTemplateCard)
      )}
    </View>
  );

  const renderEditorTab = () => {
    if (!selectedTemplate) {
      return (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="doc.text.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">Select a template to edit</Text>
          <TouchableOpacity
            onPress={() => setActiveTab('templates')}
            className="mt-4 bg-primary px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Browse Templates</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const sortedSections = [...selectedTemplate.sections].sort((a, b) => a.order - b.order);

    return (
      <View>
        <View className="bg-surface rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-foreground text-lg font-bold">{selectedTemplate.name}</Text>
            <View 
              style={{ backgroundColor: getCategoryColor(selectedTemplate.category) + '20' }}
              className="px-2 py-1 rounded"
            >
              <Text style={{ color: getCategoryColor(selectedTemplate.category) }} className="text-xs capitalize">
                {selectedTemplate.category}
              </Text>
            </View>
          </View>
          <Text className="text-muted text-sm">{selectedTemplate.description}</Text>
          
          <View className="flex-row items-center gap-2 mt-3">
            <View 
              style={{ backgroundColor: selectedTemplate.styling.primaryColor }}
              className="w-6 h-6 rounded-full"
            />
            <View 
              style={{ backgroundColor: selectedTemplate.styling.secondaryColor }}
              className="w-6 h-6 rounded-full"
            />
            <View 
              style={{ backgroundColor: selectedTemplate.styling.accentColor }}
              className="w-6 h-6 rounded-full"
            />
            <Text className="text-muted text-sm ml-2">{selectedTemplate.styling.fontFamily}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-semibold">Sections ({sortedSections.length})</Text>
          <TouchableOpacity
            onPress={() => setActiveTab('sections')}
            className="bg-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">+ Add Section</Text>
          </TouchableOpacity>
        </View>

        {sortedSections.map((section, index) => {
          const sectionConfig = SECTION_LIBRARY[section.type];
          
          return (
            <View 
              key={section.id} 
              className={`bg-surface rounded-xl p-3 mb-2 ${!section.visible ? 'opacity-50' : ''}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <IconSymbol name={sectionConfig.icon as any} size={16} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{section.title}</Text>
                    <Text className="text-muted text-xs">{sectionConfig.label}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center gap-1">
                  <TouchableOpacity
                    onPress={() => handleMoveSection(section, 'up')}
                    disabled={index === 0}
                    className={`p-2 ${index === 0 ? 'opacity-30' : ''}`}
                  >
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMoveSection(section, 'down')}
                    disabled={index === sortedSections.length - 1}
                    className={`p-2 ${index === sortedSections.length - 1 ? 'opacity-30' : ''}`}
                  >
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} style={{ transform: [{ rotate: '90deg' }] }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleToggleSectionVisibility(section)}
                    className="p-2"
                  >
                    <IconSymbol 
                      name={section.visible ? "eye.fill" : "eye.fill"} 
                      size={16} 
                      color={section.visible ? colors.primary : colors.muted} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveSection(section)}
                    className="p-2"
                  >
                    <IconSymbol name="chevron.right" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSectionsTab = () => (
    <View>
      <Text className="text-foreground text-lg font-bold mb-4">Section Library</Text>
      <Text className="text-muted text-sm mb-4">
        {selectedTemplate ? 'Tap a section to add it to your template' : 'Select a template first to add sections'}
      </Text>

      {(Object.keys(SECTION_LIBRARY) as SectionType[]).map((type) => {
        const section = SECTION_LIBRARY[type];
        
        return (
          <TouchableOpacity
            key={type}
            onPress={() => selectedTemplate && handleAddSection(type)}
            disabled={!selectedTemplate}
            className={`bg-surface rounded-xl p-4 mb-3 ${!selectedTemplate ? 'opacity-50' : ''}`}
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-primary/10 p-3 rounded-xl">
                <IconSymbol name={section.icon as any} size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{section.label}</Text>
                <Text className="text-muted text-sm">{section.description}</Text>
              </View>
              {selectedTemplate && (
                <IconSymbol name="chevron.right" size={20} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading templates...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Report Templates</Text>
            <Text className="text-muted">Customize report layouts</Text>
          </View>
          <View className="bg-primary/20 p-3 rounded-full">
            <IconSymbol name="doc.text.fill" size={24} color={colors.primary} />
          </View>
        </View>

        {renderTabs()}

        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'editor' && renderEditorTab()}
        {activeTab === 'sections' && renderSectionsTab()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
