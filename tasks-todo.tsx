import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { tasksTodoService, Task, TaskPriority, TaskStatus } from "@/lib/services/tasks-todo-service";
import { PRIORITY_COLORS, STATUS_COLORS, CATEGORY_COLORS } from "@/lib/services/color-code-service";

const STATUS_COLOR_MAP: Record<TaskStatus, string> = {
  todo: '#6B7280',
  in_progress: '#3B82F6',
  review: '#F59E0B',
  done: '#22C55E',
  blocked: '#EF4444',
};

export default function TasksTodoScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [selectedStatus]);

  const loadTasks = async () => {
    setLoading(true);
    await tasksTodoService.initialize();
    
    const filter: any = {};
    if (selectedStatus !== 'all') filter.status = [selectedStatus];
    
    setTasks(tasksTodoService.getTasks(filter));
    setStats(tasksTodoService.getStats());
    setLoading(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await tasksTodoService.updateTaskStatus(taskId, newStatus);
    loadTasks();
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    await tasksTodoService.toggleSubtask(taskId, subtaskId);
    loadTasks();
  };

  const getPriorityColor = (priority: TaskPriority) => PRIORITY_COLORS[priority];
  
  const getDueDateColor = (dueDate?: string, status?: TaskStatus) => {
    if (!dueDate || status === 'done') return colors.muted;
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (due < today) return '#EF4444'; // Overdue - red
    if (due.toDateString() === today.toDateString()) return '#F59E0B'; // Today - orange
    return colors.muted;
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (due < today) return 'Overdue';
    if (due.toDateString() === today.toDateString()) return 'Due Today';
    if (due.toDateString() === tomorrow.toDateString()) return 'Due Tomorrow';
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading tasks...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Tasks & To-Do</Text>
          <Text className="text-muted">Color-coded priority management</Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3 border border-border">
            <Text className="text-xs text-muted">Total</Text>
            <Text className="text-2xl font-bold text-foreground">{stats?.total || 0}</Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' }}
          >
            <Text style={{ color: '#EF4444', fontSize: 12 }}>Overdue</Text>
            <Text style={{ color: '#EF4444', fontSize: 24, fontWeight: '700' }}>{stats?.overdue || 0}</Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: '#F59E0B20', borderWidth: 1, borderColor: '#F59E0B' }}
          >
            <Text style={{ color: '#F59E0B', fontSize: 12 }}>Due Today</Text>
            <Text style={{ color: '#F59E0B', fontSize: 24, fontWeight: '700' }}>{stats?.dueToday || 0}</Text>
          </View>
          <View 
            className="flex-1 min-w-[100px] rounded-xl p-3"
            style={{ backgroundColor: '#22C55E20', borderWidth: 1, borderColor: '#22C55E' }}
          >
            <Text style={{ color: '#22C55E', fontSize: 12 }}>Done (Week)</Text>
            <Text style={{ color: '#22C55E', fontSize: 24, fontWeight: '700' }}>{stats?.completedThisWeek || 0}</Text>
          </View>
        </View>

        {/* Status Filter */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-muted mb-2">Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(['all', 'todo', 'in_progress', 'review', 'done', 'blocked'] as const).map((stat) => {
                const isSelected = selectedStatus === stat;
                const statColor = stat === 'all' ? colors.primary : STATUS_COLOR_MAP[stat];
                return (
                  <TouchableOpacity
                    key={stat}
                    onPress={() => setSelectedStatus(stat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isSelected ? statColor : statColor + '20',
                      borderWidth: 1,
                      borderColor: statColor,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#FFFFFF' : statColor, fontWeight: '600', fontSize: 12 }}>
                      {stat === 'all' ? 'All' : stat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Priority Legend */}
        <View className="bg-surface rounded-xl p-3 mb-4 border border-border">
          <Text className="text-xs font-medium text-muted mb-2">Priority Colors</Text>
          <View className="flex-row flex-wrap gap-3">
            {Object.entries(PRIORITY_COLORS).map(([key, color]) => (
              <View key={key} className="flex-row items-center">
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 4 }} />
                <Text className="text-xs text-foreground capitalize">{key}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tasks List */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Tasks ({tasks.length})
          </Text>
          
          {tasks.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border">
              <Text className="text-muted text-center">No tasks match your filters</Text>
            </View>
          ) : (
            tasks.map((task) => {
              const priorityColor = getPriorityColor(task.priority);
              const statusColor = STATUS_COLOR_MAP[task.status];
              const dueDateColor = getDueDateColor(task.dueDate, task.status);
              const isExpanded = expandedTask === task.id;
              const completedSubtasks = task.subtasks.filter(s => s.completed).length;
              
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => setExpandedTask(isExpanded ? null : task.id)}
                  activeOpacity={0.7}
                >
                  <View
                    className="bg-surface rounded-xl mb-3 overflow-hidden"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  >
                    {/* Priority indicator bar */}
                    <View style={{ height: 4, backgroundColor: priorityColor }} />
                    
                    <View className="p-4">
                      {/* Header row */}
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 flex-row items-center gap-2 flex-wrap">
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: priorityColor + '20',
                            }}
                          >
                            <Text style={{ fontSize: 10, color: priorityColor, fontWeight: '700' }}>
                              {task.priority.toUpperCase()}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: statusColor + '20',
                            }}
                          >
                            <Text style={{ fontSize: 10, color: statusColor, fontWeight: '600' }}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: dueDateColor, fontWeight: '600' }}>
                          {formatDueDate(task.dueDate)}
                        </Text>
                      </View>
                      
                      {/* Title */}
                      <Text 
                        className="font-semibold mb-1"
                        style={{ 
                          color: task.status === 'done' ? colors.muted : colors.foreground,
                          textDecorationLine: task.status === 'done' ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </Text>
                      
                      {/* Description */}
                      <Text className="text-sm text-muted mb-2" numberOfLines={isExpanded ? undefined : 1}>
                        {task.description}
                      </Text>
                      
                      {/* Progress bar for subtasks */}
                      {task.subtasks.length > 0 && (
                        <View className="mb-2">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-muted">
                              Subtasks: {completedSubtasks}/{task.subtasks.length}
                            </Text>
                            <Text className="text-xs text-muted">
                              {Math.round((completedSubtasks / task.subtasks.length) * 100)}%
                            </Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                            <View 
                              style={{ 
                                height: 4, 
                                backgroundColor: '#22C55E', 
                                borderRadius: 2,
                                width: `${(completedSubtasks / task.subtasks.length) * 100}%`,
                              }} 
                            />
                          </View>
                        </View>
                      )}
                      
                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mb-2">
                          {task.tags.map((tag, idx) => (
                            <View
                              key={idx}
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                backgroundColor: colors.primary + '20',
                              }}
                            >
                              <Text style={{ fontSize: 10, color: colors.primary }}>#{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {/* Expanded content */}
                      {isExpanded && (
                        <View className="mt-3 pt-3 border-t border-border">
                          {/* Subtasks */}
                          {task.subtasks.length > 0 && (
                            <View className="mb-3">
                              <Text className="text-sm font-medium text-foreground mb-2">Subtasks</Text>
                              {task.subtasks.map((subtask) => (
                                <TouchableOpacity
                                  key={subtask.id}
                                  onPress={() => handleToggleSubtask(task.id, subtask.id)}
                                  className="flex-row items-center py-2"
                                >
                                  <View
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 4,
                                      borderWidth: 2,
                                      borderColor: subtask.completed ? '#22C55E' : colors.border,
                                      backgroundColor: subtask.completed ? '#22C55E' : 'transparent',
                                      marginRight: 8,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {subtask.completed && (
                                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>
                                    )}
                                  </View>
                                  <Text
                                    style={{
                                      color: subtask.completed ? colors.muted : colors.foreground,
                                      textDecorationLine: subtask.completed ? 'line-through' : 'none',
                                      fontSize: 14,
                                    }}
                                  >
                                    {subtask.title}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                          
                          {/* Status actions */}
                          <View className="flex-row flex-wrap gap-2">
                            {task.status !== 'done' && (
                              <>
                                {task.status !== 'in_progress' && (
                                  <TouchableOpacity
                                    onPress={() => handleStatusChange(task.id, 'in_progress')}
                                    style={{
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      borderRadius: 6,
                                      backgroundColor: STATUS_COLOR_MAP.in_progress + '20',
                                    }}
                                  >
                                    <Text style={{ color: STATUS_COLOR_MAP.in_progress, fontSize: 12, fontWeight: '600' }}>
                                      Start Progress
                                    </Text>
                                  </TouchableOpacity>
                                )}
                                {task.status !== 'review' && (
                                  <TouchableOpacity
                                    onPress={() => handleStatusChange(task.id, 'review')}
                                    style={{
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      borderRadius: 6,
                                      backgroundColor: STATUS_COLOR_MAP.review + '20',
                                    }}
                                  >
                                    <Text style={{ color: STATUS_COLOR_MAP.review, fontSize: 12, fontWeight: '600' }}>
                                      Move to Review
                                    </Text>
                                  </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                  onPress={() => handleStatusChange(task.id, 'done')}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 6,
                                    backgroundColor: STATUS_COLOR_MAP.done + '20',
                                  }}
                                >
                                  <Text style={{ color: STATUS_COLOR_MAP.done, fontSize: 12, fontWeight: '600' }}>
                                    Mark Complete
                                  </Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
