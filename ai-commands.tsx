import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { aiCommandsService, AICommand, CommandType, CommandTemplate, COMMAND_TYPE_COLORS, COMMAND_STATUS_COLORS } from "@/lib/services/ai-commands-service";

export default function AICommandsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [commands, setCommands] = useState<AICommand[]>([]);
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<CommandType>('query');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Refresh for running commands
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await aiCommandsService.initialize();
    setCommands(aiCommandsService.getCommands());
    setTemplates(aiCommandsService.getTemplates());
    setStats(aiCommandsService.getStats());
    setLoading(false);
  };

  const handleExecuteCommand = async (prompt: string, type: CommandType) => {
    await aiCommandsService.executeCommand(prompt, type);
    loadData();
    setCustomPrompt('');
  };

  const handleCancelCommand = async (commandId: string) => {
    await aiCommandsService.cancelCommand(commandId);
    loadData();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading AI Commands...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">AI Commands</Text>
          <Text className="text-muted">Color-coded command interface</Text>
        </View>

        {/* Command Type Legend */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-sm font-medium text-foreground mb-3">Command Types</Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(COMMAND_TYPE_COLORS) as CommandType[]).map((type) => {
              const typeColor = COMMAND_TYPE_COLORS[type];
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: isSelected ? typeColor.primary : typeColor.background,
                    borderWidth: 1,
                    borderColor: typeColor.primary,
                  }}
                >
                  <Text style={{ 
                    color: isSelected ? '#FFFFFF' : typeColor.primary, 
                    fontWeight: '600', 
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Command Input */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-sm font-medium text-foreground mb-2">Execute Custom Command</Text>
          <View 
            className="rounded-lg p-3 mb-3"
            style={{ backgroundColor: COMMAND_TYPE_COLORS[selectedType].background }}
          >
            <TextInput
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder={`Enter ${selectedType} command...`}
              placeholderTextColor={colors.muted}
              multiline
              style={{
                color: colors.foreground,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
            />
          </View>
          <TouchableOpacity
            onPress={() => customPrompt && handleExecuteCommand(customPrompt, selectedType)}
            disabled={!customPrompt}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: customPrompt ? COMMAND_TYPE_COLORS[selectedType].primary : colors.muted,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Execute {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Command
            </Text>
          </TouchableOpacity>
        </View>

        {/* Templates Section */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setShowTemplates(!showTemplates)}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-lg font-semibold text-foreground">Quick Templates</Text>
            <Text style={{ color: colors.primary }}>{showTemplates ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showTemplates && (
            <View className="flex-row flex-wrap gap-2">
              {templates.filter(t => t.type === selectedType).map((template) => {
                const typeColor = COMMAND_TYPE_COLORS[template.type];
                return (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleExecuteCommand(template.prompt, template.type)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: typeColor.background,
                      borderWidth: 1,
                      borderColor: typeColor.primary,
                      maxWidth: '48%',
                    }}
                  >
                    <Text style={{ color: typeColor.primary, fontWeight: '600', fontSize: 12 }}>
                      {template.name}
                    </Text>
                    <Text style={{ color: typeColor.text, fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                      {template.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {templates.filter(t => t.type === selectedType).length === 0 && (
                <Text className="text-muted text-sm">No templates for this command type</Text>
              )}
            </View>
          )}
        </View>

        {/* Command History */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Command History ({commands.length})
          </Text>
          
          {commands.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border">
              <Text className="text-muted text-center">No commands executed yet</Text>
            </View>
          ) : (
            commands.map((command) => {
              const typeColor = COMMAND_TYPE_COLORS[command.type];
              const statusColor = COMMAND_STATUS_COLORS[command.status];
              
              return (
                <View
                  key={command.id}
                  className="bg-surface rounded-xl mb-3 overflow-hidden"
                  style={{ borderWidth: 1, borderColor: typeColor.primary + '40' }}
                >
                  {/* Type indicator bar */}
                  <View style={{ height: 4, backgroundColor: typeColor.primary }} />
                  
                  <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: typeColor.background,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: typeColor.primary, fontWeight: '700', textTransform: 'uppercase' }}>
                            {command.type}
                          </Text>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: statusColor.background,
                          }}
                        >
                          <View className="flex-row items-center gap-1">
                            {command.status === 'running' && (
                              <ActivityIndicator size="small" color={statusColor.primary} />
                            )}
                            <Text style={{ fontSize: 10, color: statusColor.primary, fontWeight: '600', textTransform: 'uppercase' }}>
                              {command.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text className="text-xs text-muted">{formatTime(command.createdAt)}</Text>
                    </View>
                    
                    {/* Prompt */}
                    <Text className="text-foreground font-medium mb-2">{command.prompt}</Text>
                    
                    {/* Response */}
                    {command.response && (
                      <View 
                        className="rounded-lg p-3 mb-2"
                        style={{ backgroundColor: typeColor.background }}
                      >
                        <Text style={{ color: typeColor.text, fontSize: 13 }}>{command.response}</Text>
                      </View>
                    )}
                    
                    {/* Footer */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-muted">
                        Duration: {formatDuration(command.executionTime)}
                      </Text>
                      
                      {['pending', 'running'].includes(command.status) && (
                        <TouchableOpacity
                          onPress={() => handleCancelCommand(command.id)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 4,
                            backgroundColor: '#EF444420',
                          }}
                        >
                          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Stats */}
        {stats && (
          <View className="bg-surface rounded-xl p-4 border border-border mb-6">
            <Text className="font-semibold text-foreground mb-3">Command Statistics</Text>
            <View className="flex-row flex-wrap gap-2">
              {(Object.keys(stats.byType) as CommandType[]).map((type) => {
                const typeColor = COMMAND_TYPE_COLORS[type];
                return (
                  <View
                    key={type}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: typeColor.background,
                      minWidth: 80,
                    }}
                  >
                    <Text style={{ color: typeColor.text, fontSize: 10, textTransform: 'capitalize' }}>{type}</Text>
                    <Text style={{ color: typeColor.primary, fontSize: 18, fontWeight: '700' }}>{stats.byType[type]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
