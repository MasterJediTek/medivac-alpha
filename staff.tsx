import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TabBar } from "@/components/ui/control-panel";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  specialty?: string;
  phone: string;
  email: string;
  status: "available" | "busy" | "off-duty" | "on-call";
  avatar: string;
}

const MOCK_STAFF: StaffMember[] = [
  { id: "1", name: "Dr. Sarah Mitchell", role: "doctor", department: "Cardiology", specialty: "Interventional Cardiology", phone: "0412 345 678", email: "s.mitchell@medivac.one", status: "available", avatar: "SM" },
  { id: "2", name: "Dr. James Chen", role: "doctor", department: "Neurology", specialty: "Stroke Medicine", phone: "0423 456 789", email: "j.chen@medivac.one", status: "busy", avatar: "JC" },
  { id: "3", name: "Dr. Emily Watson", role: "surgeon", department: "Surgery", specialty: "General Surgery", phone: "0434 567 890", email: "e.watson@medivac.one", status: "on-call", avatar: "EW" },
  { id: "4", name: "Nurse Rebecca Taylor", role: "nurse", department: "Emergency", phone: "0445 678 901", email: "r.taylor@medivac.one", status: "available", avatar: "RT" },
  { id: "5", name: "Nurse Michael Brown", role: "nurse", department: "ICU", phone: "0456 789 012", email: "m.brown@medivac.one", status: "busy", avatar: "MB" },
  { id: "6", name: "Dr. Lisa Anderson", role: "specialist", department: "Radiology", specialty: "Diagnostic Imaging", phone: "0467 890 123", email: "l.anderson@medivac.one", status: "available", avatar: "LA" },
  { id: "7", name: "John Smith", role: "technician", department: "Pathology", phone: "0478 901 234", email: "j.smith@medivac.one", status: "available", avatar: "JS" },
  { id: "8", name: "Dr. David Martinez", role: "doctor", department: "Pediatrics", specialty: "Neonatology", phone: "0489 012 345", email: "d.martinez@medivac.one", status: "off-duty", avatar: "DM" },
  { id: "9", name: "Nurse Jennifer Lee", role: "nurse", department: "Maternity", phone: "0490 123 456", email: "j.lee@medivac.one", status: "available", avatar: "JL" },
  { id: "10", name: "Admin Karen White", role: "admin", department: "Administration", phone: "0401 234 567", email: "k.white@medivac.one", status: "available", avatar: "KW" },
];

type RoleFilter = "all" | "doctor" | "nurse" | "surgeon" | "specialist" | "technician" | "admin";

export default function StaffScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter>("all");

  const tabs = [
    { key: "all", label: "All Staff" },
    { key: "doctor", label: "Doctors" },
    { key: "nurse", label: "Nurses" },
    { key: "surgeon", label: "Surgeons" },
    { key: "specialist", label: "Specialists" },
    { key: "technician", label: "Technicians" },
    { key: "admin", label: "Admin" },
  ];

  const filteredStaff = MOCK_STAFF.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (staff.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesRole = activeRole === "all" || staff.role === activeRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: StaffMember["status"]) => {
    switch (status) {
      case "available": return colors.success;
      case "busy": return colors.error;
      case "on-call": return colors.warning;
      case "off-duty": return colors.muted;
    }
  };

  const getStatusLabel = (status: StaffMember["status"]) => {
    switch (status) {
      case "available": return "Available";
      case "busy": return "Busy";
      case "on-call": return "On Call";
      case "off-duty": return "Off Duty";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "doctor": return "#3B82F6";
      case "nurse": return "#EC4899";
      case "surgeon": return "#8B5CF6";
      case "specialist": return "#10B981";
      case "technician": return "#F59E0B";
      case "admin": return "#6B7280";
      default: return colors.primary;
    }
  };

  const renderStaff = ({ item }: { item: StaffMember }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3">
        <View 
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: getRoleColor(item.role) + '20' }}
        >
          <Text style={{ color: getRoleColor(item.role), fontWeight: '700', fontSize: 16 }}>
            {item.avatar}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-foreground font-semibold text-base">{item.name}</Text>
            <View 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getStatusColor(item.status) }}
            />
          </View>
          <Text className="text-muted text-sm">{item.department}{item.specialty ? ` • ${item.specialty}` : ''}</Text>
          <View className="flex-row items-center gap-4 mt-2">
            <TouchableOpacity className="flex-row items-center gap-1" activeOpacity={0.7}>
              <IconSymbol name="phone.fill" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12 }}>{item.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-1" activeOpacity={0.7}>
              <IconSymbol name="envelope.fill" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12 }}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: getStatusColor(item.status) + '20' }}
        >
          <Text style={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: '600' }}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const availableCount = MOCK_STAFF.filter(s => s.status === "available").length;
  const busyCount = MOCK_STAFF.filter(s => s.status === "busy").length;
  const onCallCount = MOCK_STAFF.filter(s => s.status === "on-call").length;

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Staff Directory</Text>
            <Text className="text-muted text-sm">{MOCK_STAFF.length} team members</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Status Summary */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text style={{ color: colors.success, fontSize: 20, fontWeight: '700' }}>{availableCount}</Text>
            <Text className="text-muted text-xs">Available</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text style={{ color: colors.error, fontSize: 20, fontWeight: '700' }}>{busyCount}</Text>
            <Text className="text-muted text-xs">Busy</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text style={{ color: colors.warning, fontSize: 20, fontWeight: '700' }}>{onCallCount}</Text>
            <Text className="text-muted text-xs">On Call</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border mb-4">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 text-foreground text-base"
            placeholder="Search staff..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Role Tabs */}
        <TabBar
          tabs={tabs}
          activeTab={activeRole}
          onTabChange={(key) => setActiveRole(key as RoleFilter)}
        />
      </View>

      {/* Staff List */}
      <FlatList
        data={filteredStaff}
        renderItem={renderStaff}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="person.2.fill" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No staff found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
