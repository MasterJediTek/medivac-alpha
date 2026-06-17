import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "inProgress" | "done";
}

const MOCK_TASKS: Task[] = [
  { id: "1", title: "Review lab results", description: "Check blood work for patient John Doe", assignee: "Dr. Smith", assigneeInitials: "DS", dueDate: "Today", priority: "high", status: "todo" },
  { id: "2", title: "Update patient records", description: "Complete documentation for new admissions", assignee: "Nurse Chen", assigneeInitials: "NC", dueDate: "Today", priority: "medium", status: "todo" },
  { id: "3", title: "Schedule follow-up", description: "Book appointment for Sarah Johnson", assignee: "Admin", assigneeInitials: "AD", dueDate: "Tomorrow", priority: "low", status: "todo" },
  { id: "4", title: "Prepare surgery room", description: "Equipment check for afternoon procedure", assignee: "Dr. Patel", assigneeInitials: "DP", dueDate: "Today", priority: "high", status: "inProgress" },
  { id: "5", title: "Order medications", description: "Restock pharmacy supplies", assignee: "Pharmacy", assigneeInitials: "PH", dueDate: "Today", priority: "medium", status: "inProgress" },
  { id: "6", title: "Patient discharge", description: "Complete discharge papers for Robert Brown", assignee: "Dr. Smith", assigneeInitials: "DS", dueDate: "Yesterday", priority: "high", status: "done" },
  { id: "7", title: "Staff meeting notes", description: "Document morning briefing outcomes", assignee: "Admin", assigneeInitials: "AD", dueDate: "Yesterday", priority: "low", status: "done" },
];

type TabType = "todo" | "inProgress" | "done";

export default function TasksScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>("todo");

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "todo", label: "To Do", count: MOCK_TASKS.filter(t => t.status === "todo").length },
    { key: "inProgress", label: "In Progress", count: MOCK_TASKS.filter(t => t.status === "inProgress").length },
    { key: "done", label: "Done", count: MOCK_TASKS.filter(t => t.status === "done").length },
  ];

  const filteredTasks = MOCK_TASKS.filter(task => task.status === activeTab);

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high": return colors.error;
      case "medium": return colors.warning;
      case "low": return colors.success;
    }
  };

  const getStatusColor = (status: TabType) => {
    switch (status) {
      case "todo": return colors.primary;
      case "inProgress": return colors.warning;
      case "done": return colors.success;
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl p-4 mb-3"
      style={{ borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority) }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-foreground font-semibold text-base">{item.title}</Text>
          <Text className="text-muted text-sm mt-1">{item.description}</Text>
        </View>
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: getPriorityColor(item.priority) + '20' }}
        >
          <Text style={{ color: getPriorityColor(item.priority), fontSize: 10, fontWeight: '600', textTransform: 'capitalize' }}>
            {item.priority}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center gap-2">
          <View 
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
              {item.assigneeInitials}
            </Text>
          </View>
          <Text className="text-muted text-sm">{item.assignee}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <IconSymbol name="clock.fill" size={14} color={colors.muted} />
          <Text className="text-muted text-xs">{item.dueDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-foreground text-2xl font-bold">Tasks</Text>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View className="px-5 mb-4">
        <View className="flex-row bg-surface rounded-xl p-1">
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: activeTab === tab.key ? colors.background : 'transparent',
              }}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text 
                style={{ 
                  color: activeTab === tab.key ? colors.foreground : colors.muted,
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  fontSize: 14,
                }}
              >
                {tab.label}
              </Text>
              <View 
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: getStatusColor(tab.key) + '20' }}
              >
                <Text style={{ color: getStatusColor(tab.key), fontSize: 11, fontWeight: '600' }}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Stats */}
      <View className="px-5 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-3 flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.error }} />
            <Text className="text-muted text-sm">High: {MOCK_TASKS.filter(t => t.priority === "high").length}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.warning }} />
            <Text className="text-muted text-sm">Medium: {MOCK_TASKS.filter(t => t.priority === "medium").length}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.success }} />
            <Text className="text-muted text-sm">Low: {MOCK_TASKS.filter(t => t.priority === "low").length}</Text>
          </View>
        </View>
      </View>

      {/* Task List */}
      <View className="flex-1 px-5">
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center py-10">
              <IconSymbol name="checklist" size={48} color={colors.muted} />
              <Text className="text-muted text-base mt-3">No tasks in this category</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
