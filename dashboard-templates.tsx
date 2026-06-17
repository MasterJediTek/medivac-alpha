/**
 * Dashboard Widget Templates Screen
 * MediVac WACHS v8.6
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  dashboardWidgetTemplatesService, 
  DashboardTemplate,
  DashboardWidget,
  UserRole,
} from '@/lib/services/dashboard-widget-templates-service';

type TabType = 'templates' | 'widgets' | 'preview';

const ROLE_ICONS: Record<UserRole, string> = {
  doctor: '🩺',
  nurse: '👩‍⚕️',
  administrator: '👔',
  'jedi-commander': '⚔️',
  'master-jedi': '🌟',
  patient: '🏥',
  technician: '🔧',
  pharmacist: '💊',
};

export default function DashboardTemplatesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<DashboardTemplate | null>(null);
  const [activeWidgets, setActiveWidgets] = useState<DashboardWidget[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  useEffect(() => {
    loadData();
    const unsubscribe = dashboardWidgetTemplatesService.subscribe(() => loadData());
    return unsubscribe;
  }, []);

  const loadData = () => {
    setTemplates(dashboardWidgetTemplatesService.getAllTemplates());
    setActiveTemplate(dashboardWidgetTemplatesService.getActiveTemplate());
    setActiveWidgets(dashboardWidgetTemplatesService.getActiveWidgets());
  };

  const applyTemplate = (templateId: string) => {
    dashboardWidgetTemplatesService.applyTemplate(templateId);
    loadData();
  };

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      dashboardWidgetTemplatesService.duplicateTemplate(templateId, `${template.name} (Copy)`);
      loadData();
    }
  };

  const filteredTemplates = selectedRole === 'all' 
    ? templates 
    : templates.filter(t => t.role === selectedRole);

  const roleColors = dashboardWidgetTemplatesService.getRoleColors();

  const renderTemplatesTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          onPress={() => setSelectedRole('all')}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: selectedRole === 'all' ? '#1ABC9C' : colors.surface,
            marginRight: 8,
          }}
        >
          <Text style={{ color: selectedRole === 'all' ? '#FFFFFF' : colors.foreground, fontWeight: '600' }}>All</Text>
        </Pressable>
        {(['doctor', 'nurse', 'administrator', 'jedi-commander', 'master-jedi', 'patient'] as UserRole[]).map((role) => (
          <Pressable
            key={role}
            onPress={() => setSelectedRole(role)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: selectedRole === role ? roleColors[role].primary : colors.surface,
              marginRight: 8,
            }}
          >
            <Text style={{ color: selectedRole === role ? '#FFFFFF' : colors.foreground }}>
              {ROLE_ICONS[role]} {role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isActive = activeTemplate?.id === item.id;
          return (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: isActive ? 2 : 0,
              borderColor: item.color,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>{item.role.replace(/-/g, ' ')}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>{item.description}</Text>
                </View>
                {isActive && (
                  <View style={{ backgroundColor: '#27AE60', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                <View style={{ backgroundColor: item.color + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ color: item.color, fontSize: 10 }}>{item.widgets.length} widgets</Text>
                </View>
                <View style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>{item.columns}x{item.rows} grid</Text>
                </View>
                {item.isDefault && (
                  <View style={{ backgroundColor: '#3498DB20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: '#3498DB', fontSize: 10 }}>Default</Text>
                  </View>
                )}
                {item.isCustom && (
                  <View style={{ backgroundColor: '#F39C1220', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: '#F39C12', fontSize: 10 }}>Custom</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                {!isActive && (
                  <Pressable
                    onPress={() => applyTemplate(item.id)}
                    style={{ flex: 1, backgroundColor: item.color, padding: 10, borderRadius: 8, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Apply Template</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => duplicateTemplate(item.id)}
                  style={{ flex: 1, backgroundColor: colors.background, padding: 10, borderRadius: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>Duplicate</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>No templates found</Text>
          </View>
        }
      />
    </View>
  );

  const renderWidgetsTab = () => (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
        Active Widgets ({activeWidgets.length})
      </Text>
      <FlatList
        data={activeWidgets}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={{
            flex: 1,
            backgroundColor: item.color + '20',
            borderRadius: 12,
            padding: 12,
            borderLeftWidth: 4,
            borderLeftColor: item.color,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, flex: 1 }} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 10 }}>{item.size}</Text>
              </View>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 10 }}>{item.type}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>No active widgets</Text>
          </View>
        }
      />
    </View>
  );

  const renderPreviewTab = () => {
    if (!activeTemplate) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
          <Text style={{ fontSize: 16, color: colors.muted }}>No template selected</Text>
        </View>
      );
    }

    const preview = dashboardWidgetTemplatesService.getTemplatePreview(activeTemplate.id);

    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: activeTemplate.color, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 40 }}>{activeTemplate.icon}</Text>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{activeTemplate.name}</Text>
              <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>{activeTemplate.role.replace(/-/g, ' ')}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Layout Preview</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
            {preview?.layout || 'No layout'}
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>Widget Legend</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
          {activeTemplate.widgets.map((widget, idx) => (
            <View key={widget.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx < activeTemplate.widgets.length - 1 ? 12 : 0 }}>
              <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: widget.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{String.fromCharCode(65 + idx)}</Text>
              </View>
              <Text style={{ fontSize: 16, marginRight: 8 }}>{widget.icon}</Text>
              <Text style={{ flex: 1, color: colors.foreground }}>{widget.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{widget.size}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16, backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>Template Info</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.muted }}>Grid Size</Text>
            <Text style={{ color: colors.foreground }}>{activeTemplate.columns} x {activeTemplate.rows}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.muted }}>Widget Count</Text>
            <Text style={{ color: colors.foreground }}>{activeTemplate.widgets.length}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted }}>Type</Text>
            <Text style={{ color: colors.foreground }}>{activeTemplate.isCustom ? 'Custom' : 'Default'}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#F39C12', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Dashboard Templates</Text>
        <Text style={{ color: '#FFFFFF', opacity: 0.9, fontSize: 14 }}>
          {templates.length} templates • {activeTemplate?.name || 'None active'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, padding: 4, margin: 16, borderRadius: 12 }}>
        {(['templates', 'widgets', 'preview'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? '#F39C12' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#FFFFFF' : colors.muted, fontWeight: '600', fontSize: 12 }}>
              {tab === 'templates' ? '📋 Templates' : tab === 'widgets' ? '📦 Widgets' : '👁️ Preview'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'widgets' && renderWidgetsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </View>
    </ScreenContainer>
  );
}
