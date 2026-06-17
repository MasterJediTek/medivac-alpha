/**
 * Email Template Editor Screen
 * Customizable templates for compliance reports, incident alerts, and policy notifications
 * MediVac One v5.5
 */

import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  emailTemplateService,
  type EmailTemplate,
  type TemplateCategory,
  type TemplateVariable,
  type TemplatePreview,
} from "@/lib/services/email-template-service";

const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; icon: string; color: string }> = {
  compliance: { label: "Compliance", icon: "✓", color: "#10B981" },
  incident: { label: "Incident", icon: "🚨", color: "#EF4444" },
  policy: { label: "Policy", icon: "📋", color: "#3B82F6" },
  general: { label: "General", icon: "📧", color: "#6B7280" },
  clinical: { label: "Clinical", icon: "🏥", color: "#8B5CF6" },
  administrative: { label: "Administrative", icon: "📊", color: "#F59E0B" },
};

export default function EmailTemplatesScreen() {
  const colors = useColors();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<TemplatePreview | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  // Editor state
  const [editorName, setEditorName] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorCategory, setEditorCategory] = useState<TemplateCategory>("general");
  const [editorSubject, setEditorSubject] = useState("");
  const [editorBodyHtml, setEditorBodyHtml] = useState("");
  const [editorBodyText, setEditorBodyText] = useState("");
  const [editorVariables, setEditorVariables] = useState<TemplateVariable[]>([]);
  const [editorTags, setEditorTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      await emailTemplateService.initialize();
      setTemplates(emailTemplateService.getTemplates());
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useCallback(() => {
    let result = templates;
    
    if (selectedCategory !== "all") {
      result = result.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [templates, selectedCategory, searchQuery]);

  const openEditor = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setEditorName(template.name);
      setEditorDescription(template.description);
      setEditorCategory(template.category);
      setEditorSubject(template.subject);
      setEditorBodyHtml(template.bodyHtml);
      setEditorBodyText(template.bodyText);
      setEditorVariables([...template.variables]);
      setEditorTags(template.tags.join(", "));
    } else {
      setEditingTemplate(null);
      setEditorName("");
      setEditorDescription("");
      setEditorCategory("general");
      setEditorSubject("");
      setEditorBodyHtml("");
      setEditorBodyText("");
      setEditorVariables([]);
      setEditorTags("");
    }
    setShowEditor(true);
  };

  const saveTemplate = async () => {
    if (!editorName || !editorSubject) {
      Alert.alert("Validation Error", "Name and subject are required");
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: editorName,
        description: editorDescription,
        category: editorCategory,
        subject: editorSubject,
        bodyHtml: editorBodyHtml,
        bodyText: editorBodyText,
        variables: editorVariables,
        tags: editorTags.split(",").map(t => t.trim()).filter(Boolean),
        status: "active" as const,
      };

      if (editingTemplate) {
        await emailTemplateService.updateTemplate(editingTemplate.id, templateData);
      } else {
        await emailTemplateService.createTemplate(templateData);
      }

      setTemplates(emailTemplateService.getTemplates());
      setShowEditor(false);
      Alert.alert("Success", editingTemplate ? "Template updated" : "Template created");
    } catch (error) {
      Alert.alert("Error", `Failed to save template: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await emailTemplateService.deleteTemplate(id);
            setTemplates(emailTemplateService.getTemplates());
          },
        },
      ]
    );
  };

  const duplicateTemplate = async (id: string) => {
    try {
      await emailTemplateService.duplicateTemplate(id);
      setTemplates(emailTemplateService.getTemplates());
      Alert.alert("Success", "Template duplicated");
    } catch (error) {
      Alert.alert("Error", `Failed to duplicate: ${error}`);
    }
  };

  const openPreview = (template: EmailTemplate) => {
    const initialValues: Record<string, string> = {};
    template.variables.forEach(v => {
      initialValues[v.name] = v.defaultValue;
    });
    setPreviewVariables(initialValues);
    setEditingTemplate(template);
    
    const preview = emailTemplateService.previewTemplate(template.id, initialValues);
    setPreviewData(preview);
    setShowPreview(true);
  };

  const updatePreview = () => {
    if (editingTemplate) {
      const preview = emailTemplateService.previewTemplate(editingTemplate.id, previewVariables);
      setPreviewData(preview);
    }
  };

  const addVariable = () => {
    setEditorVariables([
      ...editorVariables,
      {
        name: `variable${editorVariables.length + 1}`,
        description: "",
        defaultValue: "",
        required: false,
        type: "text",
      },
    ]);
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: string | boolean) => {
    const updated = [...editorVariables];
    const variable = updated[index];
    if (field === 'name') variable.name = value as string;
    else if (field === 'description') variable.description = value as string;
    else if (field === 'defaultValue') variable.defaultValue = value as string;
    else if (field === 'required') variable.required = value as boolean;
    else if (field === 'type') variable.type = value as 'text' | 'number' | 'date' | 'list' | 'boolean';
    setEditorVariables(updated);
  };

  const removeVariable = (index: number) => {
    setEditorVariables(editorVariables.filter((_, i) => i !== index));
  };

  const renderTemplateCard = (template: EmailTemplate) => {
    const config = CATEGORY_CONFIG[template.category];
    
    return (
      <View
        key={template.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontSize: 16 }}>{config.icon}</Text>
              <Text className="text-foreground font-semibold text-base flex-1" numberOfLines={1}>
                {template.name}
              </Text>
            </View>
            <Text className="text-muted text-sm" numberOfLines={2}>
              {template.description || "No description"}
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: config.color + "20" }}
          >
            <Text style={{ color: config.color, fontSize: 10, fontWeight: "600" }}>
              {config.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-row items-center gap-1">
            <IconSymbol name="doc.fill" size={12} color={colors.muted} />
            <Text className="text-muted text-xs">v{template.version}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconSymbol name="envelope.fill" size={12} color={colors.muted} />
            <Text className="text-muted text-xs">{template.usageCount} uses</Text>
          </View>
          {template.variables.length > 0 && (
            <View className="flex-row items-center gap-1">
              <Text className="text-muted text-xs">{template.variables.length} vars</Text>
            </View>
          )}
        </View>

        {template.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 4).map((tag, i) => (
              <View key={i} className="bg-background px-2 py-0.5 rounded">
                <Text className="text-muted text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: colors.primary + "20" }}
            onPress={() => openEditor(template)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: colors.success + "20" }}
            onPress={() => openPreview(template)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12 }}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-2 px-3 rounded-lg items-center"
            style={{ backgroundColor: colors.muted + "20" }}
            onPress={() => duplicateTemplate(template.id)}
            activeOpacity={0.7}
          >
            <IconSymbol name="doc.fill" size={14} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            className="py-2 px-3 rounded-lg items-center"
            style={{ backgroundColor: colors.error + "20" }}
            onPress={() => deleteTemplate(template.id)}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark.circle.fill" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-foreground text-2xl font-bold">Email Templates</Text>
              <Text className="text-muted text-sm mt-1">
                Customize notification templates
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => openEditor()}
              activeOpacity={0.7}
            >
              <IconSymbol name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="px-5 mb-4">
          <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center border border-border">
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              className="flex-1 ml-3 text-foreground"
              placeholder="Search templates..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: selectedCategory === "all" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: selectedCategory === "all" ? colors.primary : colors.border,
            }}
            onPress={() => setSelectedCategory("all")}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: selectedCategory === "all" ? "#FFFFFF" : colors.foreground,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              All
            </Text>
          </TouchableOpacity>
          {(Object.keys(CATEGORY_CONFIG) as TemplateCategory[]).map(cat => (
            <TouchableOpacity
              key={cat}
              className="px-4 py-2 rounded-full flex-row items-center gap-1"
              style={{
                backgroundColor: selectedCategory === cat ? CATEGORY_CONFIG[cat].color : colors.surface,
                borderWidth: 1,
                borderColor: selectedCategory === cat ? CATEGORY_CONFIG[cat].color : colors.border,
              }}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12 }}>{CATEGORY_CONFIG[cat].icon}</Text>
              <Text
                style={{
                  color: selectedCategory === cat ? "#FFFFFF" : colors.foreground,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {CATEGORY_CONFIG[cat].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Templates List */}
        <View className="px-5 pb-8">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">Loading templates...</Text>
            </View>
          ) : filteredTemplates().length === 0 ? (
            <View className="py-12 items-center">
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📧</Text>
              <Text className="text-foreground font-semibold text-lg">No Templates</Text>
              <Text className="text-muted text-center mt-2">
                {searchQuery ? "No templates match your search" : "Create your first email template"}
              </Text>
              <TouchableOpacity
                className="mt-4 px-6 py-3 rounded-xl"
                style={{ backgroundColor: colors.primary }}
                onPress={() => openEditor()}
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">Create Template</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTemplates().map(renderTemplateCard)
          )}
        </View>
      </ScrollView>

      {/* Editor Modal */}
      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">
              {editingTemplate ? "Edit Template" : "New Template"}
            </Text>
            <TouchableOpacity onPress={saveTemplate} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <Text className="text-foreground font-semibold mb-2">Template Name *</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="Enter template name"
              placeholderTextColor={colors.muted}
              value={editorName}
              onChangeText={setEditorName}
            />

            <Text className="text-foreground font-semibold mb-2">Description</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="Enter description"
              placeholderTextColor={colors.muted}
              value={editorDescription}
              onChangeText={setEditorDescription}
              multiline
              numberOfLines={2}
            />

            <Text className="text-foreground font-semibold mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {(Object.keys(CATEGORY_CONFIG) as TemplateCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  className="mr-2 px-4 py-2 rounded-full flex-row items-center gap-1"
                  style={{
                    backgroundColor: editorCategory === cat ? CATEGORY_CONFIG[cat].color : colors.surface,
                    borderWidth: 1,
                    borderColor: editorCategory === cat ? CATEGORY_CONFIG[cat].color : colors.border,
                  }}
                  onPress={() => setEditorCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12 }}>{CATEGORY_CONFIG[cat].icon}</Text>
                  <Text
                    style={{
                      color: editorCategory === cat ? "#FFFFFF" : colors.foreground,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {CATEGORY_CONFIG[cat].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Email Content */}
            <Text className="text-foreground font-semibold mb-2">Subject Line *</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="Email subject (use {{variable}} for placeholders)"
              placeholderTextColor={colors.muted}
              value={editorSubject}
              onChangeText={setEditorSubject}
            />

            <Text className="text-foreground font-semibold mb-2">HTML Body</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="HTML email content"
              placeholderTextColor={colors.muted}
              value={editorBodyHtml}
              onChangeText={setEditorBodyHtml}
              multiline
              numberOfLines={6}
              style={{ minHeight: 120, textAlignVertical: "top" }}
            />

            <Text className="text-foreground font-semibold mb-2">Plain Text Body</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="Plain text fallback"
              placeholderTextColor={colors.muted}
              value={editorBodyText}
              onChangeText={setEditorBodyText}
              multiline
              numberOfLines={4}
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />

            {/* Variables */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground font-semibold">Variables</Text>
              <TouchableOpacity
                className="px-3 py-1 rounded-lg"
                style={{ backgroundColor: colors.primary + "20" }}
                onPress={addVariable}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {editorVariables.map((variable, index) => (
              <View key={index} className="bg-surface rounded-xl p-3 mb-2 border border-border">
                <View className="flex-row items-center justify-between mb-2">
                  <TextInput
                    className="flex-1 text-foreground font-medium"
                    placeholder="Variable name"
                    placeholderTextColor={colors.muted}
                    value={variable.name}
                    onChangeText={(v) => updateVariable(index, "name", v)}
                  />
                  <TouchableOpacity onPress={() => removeVariable(index)}>
                    <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  className="text-muted text-sm mb-2"
                  placeholder="Description"
                  placeholderTextColor={colors.muted}
                  value={variable.description}
                  onChangeText={(v) => updateVariable(index, "description", v)}
                />
                <TextInput
                  className="text-muted text-sm"
                  placeholder="Default value"
                  placeholderTextColor={colors.muted}
                  value={variable.defaultValue}
                  onChangeText={(v) => updateVariable(index, "defaultValue", v)}
                />
              </View>
            ))}

            {/* Tags */}
            <Text className="text-foreground font-semibold mb-2 mt-4">Tags</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-8 border border-border"
              placeholder="Comma-separated tags"
              placeholderTextColor={colors.muted}
              value={editorTags}
              onChangeText={setEditorTags}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">Template Preview</Text>
            <TouchableOpacity onPress={updatePreview}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {editingTemplate && (
              <>
                {/* Variable Inputs */}
                <Text className="text-foreground font-semibold mb-3">Test Variables</Text>
                {editingTemplate.variables.map((variable, index) => (
                  <View key={index} className="mb-3">
                    <Text className="text-muted text-sm mb-1">
                      {variable.name} {variable.required && "*"}
                    </Text>
                    <TextInput
                      className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                      placeholder={variable.defaultValue || `Enter ${variable.name}`}
                      placeholderTextColor={colors.muted}
                      value={previewVariables[variable.name] || ""}
                      onChangeText={(v) => {
                        setPreviewVariables({ ...previewVariables, [variable.name]: v });
                      }}
                      onBlur={updatePreview}
                    />
                  </View>
                ))}

                {/* Preview Output */}
                {previewData && (
                  <View className="mt-4">
                    <Text className="text-foreground font-semibold mb-3">Preview Output</Text>
                    
                    {previewData.missingVariables.length > 0 && (
                      <View className="bg-warning/20 rounded-xl p-3 mb-3">
                        <Text style={{ color: colors.warning, fontWeight: "600" }}>
                          Missing Variables: {previewData.missingVariables.join(", ")}
                        </Text>
                      </View>
                    )}

                    <View className="bg-surface rounded-xl p-4 border border-border mb-3">
                      <Text className="text-muted text-xs mb-1">Subject</Text>
                      <Text className="text-foreground font-medium">{previewData.subject}</Text>
                    </View>

                    <View className="bg-surface rounded-xl p-4 border border-border mb-3">
                      <Text className="text-muted text-xs mb-2">HTML Preview</Text>
                      <Text className="text-foreground text-sm">{previewData.bodyHtml}</Text>
                    </View>

                    <View className="bg-surface rounded-xl p-4 border border-border mb-8">
                      <Text className="text-muted text-xs mb-2">Plain Text</Text>
                      <Text className="text-foreground text-sm">{previewData.bodyText}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
