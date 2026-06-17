import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { 
  jediTekAgent, 
  type AgentHealth, 
  type AgentMetrics, 
  type AgentCommand,
  type AgentTask,
  type AgentEvent,
  type AgentRole,
} from '@/lib/services/jeditek-agent-service';

type TabId = 'overview' | 'commands' | 'tasks' | 'events' | 'config';

export default function JediTekAgentScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commandInput, setCommandInput] = useState('');

  useEffect(() => {
    loadAgentData();
    
    // Subscribe to agent events
    const handleHeartbeat = (data: unknown) => setHealth(data as AgentHealth);
    const handleCommand = () => loadCommands();
    const handleTask = () => loadTasks();
    const handleEvent = () => loadEvents();

    jediTekAgent.on('heartbeat', handleHeartbeat);
    jediTekAgent.on('command_completed', handleCommand);
    jediTekAgent.on('task_completed', handleTask);
    jediTekAgent.on('event', handleEvent);

    return () => {
      jediTekAgent.off('heartbeat', handleHeartbeat);
      jediTekAgent.off('command_completed', handleCommand);
      jediTekAgent.off('task_completed', handleTask);
      jediTekAgent.off('event', handleEvent);
    };
  }, []);

  const loadAgentData = () => {
    setHealth(jediTekAgent.getHealth());
    setMetrics(jediTekAgent.getMetrics());
    loadCommands();
    loadTasks();
    loadEvents();
  };

  const loadCommands = () => {
    setCommands(jediTekAgent.getCommands({ limit: 20 }));
  };

  const loadTasks = () => {
    setTasks(jediTekAgent.getTasks());
  };

  const loadEvents = () => {
    setEvents(jediTekAgent.getEvents({ limit: 50 }));
  };

  const handleStartAgent = async () => {
    setIsLoading(true);
    try {
      await jediTekAgent.start();
      setHealth(jediTekAgent.getHealth());
      Alert.alert('Success', 'JEDI Agent started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start agent');
    }
    setIsLoading(false);
  };

  const handleStopAgent = async () => {
    setIsLoading(true);
    try {
      await jediTekAgent.stop();
      setHealth(jediTekAgent.getHealth());
      Alert.alert('Success', 'JEDI Agent stopped');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop agent');
    }
    setIsLoading(false);
  };

  const handleExecuteCommand = async () => {
    if (!commandInput.trim()) return;
    
    setIsLoading(true);
    try {
      const [type, action] = commandInput.split(':');
      await jediTekAgent.executeCommand({
        type: type || 'system',
        action: action || commandInput,
        parameters: {},
        priority: 'normal',
        source: 'user',
      });
      setCommandInput('');
      loadCommands();
      Alert.alert('Success', 'Command executed');
    } catch (error) {
      Alert.alert('Error', 'Failed to execute command');
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#22C55E';
      case 'standby': return '#F59E0B';
      case 'busy': return '#3B82F6';
      case 'error': return '#EF4444';
      default: return colors.muted;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'error': return '#F97316';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return colors.muted;
    }
  };

  const config = jediTekAgent.getConfig();
  const roleInfo = jediTekAgent.getRoleInfo();

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'house.fill' },
    { id: 'commands', label: 'Commands', icon: 'doc.fill' },
    { id: 'tasks', label: 'Tasks', icon: 'checkmark.circle.fill' },
    { id: 'events', label: 'Events', icon: 'bell.fill' },
    { id: 'config', label: 'Config', icon: 'gear' },
  ];

  const renderOverview = () => (
    <View className="gap-4">
      {/* Agent Status Card */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View 
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: roleInfo.color + '30' }}
            >
              <IconSymbol name="sparkles" size={28} color={roleInfo.color} />
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">{config.agentName}</Text>
              <Text className="text-sm text-muted">{roleInfo.name}</Text>
            </View>
          </View>
          <View 
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: getStatusColor(health?.status || 'offline') + '20' }}
          >
            <Text 
              className="text-sm font-medium capitalize"
              style={{ color: getStatusColor(health?.status || 'offline') }}
            >
              {health?.status || 'Offline'}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {health?.status === 'active' ? (
            <TouchableOpacity
              className="flex-1 bg-error/10 rounded-xl py-3 items-center"
              onPress={handleStopAgent}
              disabled={isLoading}
            >
              <Text className="text-error font-semibold">Stop Agent</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 bg-success/10 rounded-xl py-3 items-center"
              onPress={handleStartAgent}
              disabled={isLoading}
            >
              <Text className="text-success font-semibold">Start Agent</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Health Metrics */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">CPU Usage</Text>
          <Text className="text-xl font-bold text-foreground">
            {health?.cpuUsage.toFixed(1) || '0'}%
          </Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Memory</Text>
          <Text className="text-xl font-bold text-foreground">
            {health?.memoryUsage.toFixed(1) || '0'}%
          </Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Uptime</Text>
          <Text className="text-xl font-bold text-foreground">
            {Math.floor((health?.uptime || 0) / 60)}m
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-4">Performance Metrics</Text>
        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Commands Executed</Text>
            <Text className="text-sm font-medium text-foreground">{metrics?.commandsExecuted || 0}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Tasks Completed</Text>
            <Text className="text-sm font-medium text-foreground">{metrics?.tasksCompleted || 0}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Events Processed</Text>
            <Text className="text-sm font-medium text-foreground">{metrics?.eventsProcessed || 0}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Avg Response Time</Text>
            <Text className="text-sm font-medium text-foreground">
              {metrics?.averageResponseTime.toFixed(0) || 0}ms
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Auth Success Rate</Text>
            <Text className="text-sm font-medium text-foreground">
              {metrics?.authenticationAttempts 
                ? ((metrics.successfulAuths / metrics.authenticationAttempts) * 100).toFixed(1)
                : '0'}%
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Command */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">Quick Command</Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="type:action (e.g., sync:patients)"
            placeholderTextColor={colors.muted}
            value={commandInput}
            onChangeText={setCommandInput}
            returnKeyType="send"
            onSubmitEditing={handleExecuteCommand}
          />
          <TouchableOpacity
            className="bg-primary rounded-lg px-4 items-center justify-center"
            onPress={handleExecuteCommand}
            disabled={isLoading || !commandInput.trim()}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCommands = () => (
    <View className="gap-3">
      {commands.length === 0 ? (
        <View className="bg-surface rounded-xl p-6 items-center border border-border">
          <IconSymbol name="doc.fill" size={40} color={colors.muted} />
          <Text className="text-muted mt-2">No commands yet</Text>
        </View>
      ) : (
        commands.map(cmd => (
          <View key={cmd.id} className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-foreground">
                {cmd.type}:{cmd.action}
              </Text>
              <View 
                className="px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: cmd.status === 'completed' ? '#22C55E20' : 
                    cmd.status === 'failed' ? '#EF444420' : '#F59E0B20'
                }}
              >
                <Text 
                  className="text-xs capitalize"
                  style={{ 
                    color: cmd.status === 'completed' ? '#22C55E' : 
                      cmd.status === 'failed' ? '#EF4444' : '#F59E0B'
                  }}
                >
                  {cmd.status}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-muted">
              {new Date(cmd.createdAt).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderTasks = () => (
    <View className="gap-3">
      {tasks.length === 0 ? (
        <View className="bg-surface rounded-xl p-6 items-center border border-border">
          <IconSymbol name="checkmark.circle.fill" size={40} color={colors.muted} />
          <Text className="text-muted mt-2">No tasks scheduled</Text>
        </View>
      ) : (
        tasks.map(task => (
          <View key={task.id} className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-foreground">{task.name}</Text>
              <View 
                className="px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: task.status === 'completed' ? '#22C55E20' : 
                    task.status === 'running' ? '#3B82F620' : '#F59E0B20'
                }}
              >
                <Text 
                  className="text-xs capitalize"
                  style={{ 
                    color: task.status === 'completed' ? '#22C55E' : 
                      task.status === 'running' ? '#3B82F6' : '#F59E0B'
                  }}
                >
                  {task.status}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-muted mb-2">{task.description}</Text>
            {task.status === 'running' && (
              <View className="h-2 bg-background rounded-full overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderEvents = () => (
    <View className="gap-2">
      {events.length === 0 ? (
        <View className="bg-surface rounded-xl p-6 items-center border border-border">
          <IconSymbol name="bell.fill" size={40} color={colors.muted} />
          <Text className="text-muted mt-2">No events logged</Text>
        </View>
      ) : (
        events.slice(0, 20).map(event => (
          <View key={event.id} className="bg-surface rounded-lg p-3 border border-border flex-row items-start gap-3">
            <View 
              className="w-2 h-2 rounded-full mt-1.5"
              style={{ backgroundColor: getSeverityColor(event.severity) }}
            />
            <View className="flex-1">
              <Text className="text-sm text-foreground">{event.message}</Text>
              <Text className="text-xs text-muted mt-1">
                {new Date(event.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderConfig = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-4">Agent Configuration</Text>
        
        <View className="gap-3">
          <View>
            <Text className="text-xs text-muted mb-1">Agent ID</Text>
            <Text className="text-sm text-foreground font-mono">{config.agentId}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">Agent Name</Text>
            <Text className="text-sm text-foreground">{config.agentName}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">Role</Text>
            <Text className="text-sm text-foreground">{roleInfo.name}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">API Endpoint</Text>
            <Text className="text-sm text-foreground font-mono">{config.apiEndpoint}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">Heartbeat Interval</Text>
            <Text className="text-sm text-foreground">{config.heartbeatInterval / 1000}s</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">Max Concurrent Tasks</Text>
            <Text className="text-sm text-foreground">{config.maxConcurrentTasks}</Text>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-4">Capabilities</Text>
        <View className="gap-2">
          {config.capabilities.map(cap => (
            <View key={cap.id} className="flex-row items-center justify-between py-2 border-b border-border">
              <View className="flex-1">
                <Text className="text-sm text-foreground">{cap.name}</Text>
                <Text className="text-xs text-muted">{cap.description}</Text>
              </View>
              <View className={`w-3 h-3 rounded-full ${cap.enabled ? 'bg-success' : 'bg-muted'}`} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">JEDI Agent</Text>
          <Text className="text-base text-muted mt-1">
            AI-powered automation and control
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                activeTab === tab.id ? 'bg-primary' : 'bg-surface border border-border'
              }`}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconSymbol 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? '#fff' : colors.muted} 
              />
              <Text className={activeTab === tab.id ? 'text-white font-medium' : 'text-muted'}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'commands' && renderCommands()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'config' && renderConfig()}
      </ScrollView>
    </ScreenContainer>
  );
}
