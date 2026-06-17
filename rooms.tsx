import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TabBar } from "@/components/ui/control-panel";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface Room {
  id: string;
  number: string;
  name: string;
  type: "ward" | "private" | "icu" | "operating" | "emergency" | "consultation";
  floor: string;
  status: "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
  capacity: number;
  currentOccupancy: number;
  patient?: string;
  assignedStaff?: string;
  equipment: string[];
  lastCleaned?: string;
}

const MOCK_ROOMS: Room[] = [
  { id: "1", number: "101", name: "Ward A - Bed 1", type: "ward", floor: "1", status: "occupied", capacity: 1, currentOccupancy: 1, patient: "John Doe", assignedStaff: "Nurse Taylor", equipment: ["Bed", "Monitor", "IV Stand"], lastCleaned: "2 hours ago" },
  { id: "2", number: "102", name: "Ward A - Bed 2", type: "ward", floor: "1", status: "available", capacity: 1, currentOccupancy: 0, equipment: ["Bed", "Monitor", "IV Stand"], lastCleaned: "30 min ago" },
  { id: "3", number: "103", name: "Ward A - Bed 3", type: "ward", floor: "1", status: "cleaning", capacity: 1, currentOccupancy: 0, equipment: ["Bed", "Monitor", "IV Stand"], lastCleaned: "Cleaning..." },
  { id: "4", number: "201", name: "Private Suite 1", type: "private", floor: "2", status: "occupied", capacity: 1, currentOccupancy: 1, patient: "Sarah Johnson", assignedStaff: "Nurse Brown", equipment: ["Premium Bed", "Monitor", "IV Stand", "TV", "Ensuite"], lastCleaned: "4 hours ago" },
  { id: "5", number: "202", name: "Private Suite 2", type: "private", floor: "2", status: "reserved", capacity: 1, currentOccupancy: 0, equipment: ["Premium Bed", "Monitor", "IV Stand", "TV", "Ensuite"], lastCleaned: "1 hour ago" },
  { id: "6", number: "ICU-1", name: "ICU Bay 1", type: "icu", floor: "3", status: "occupied", capacity: 1, currentOccupancy: 1, patient: "Mike Wilson", assignedStaff: "Dr. Chen, Nurse Lee", equipment: ["ICU Bed", "Ventilator", "Multi-Monitor", "Infusion Pumps"], lastCleaned: "1 hour ago" },
  { id: "7", number: "ICU-2", name: "ICU Bay 2", type: "icu", floor: "3", status: "available", capacity: 1, currentOccupancy: 0, equipment: ["ICU Bed", "Ventilator", "Multi-Monitor", "Infusion Pumps"], lastCleaned: "45 min ago" },
  { id: "8", number: "OR-1", name: "Operating Room 1", type: "operating", floor: "4", status: "occupied", capacity: 1, currentOccupancy: 1, assignedStaff: "Dr. Watson, Team A", equipment: ["Operating Table", "Anesthesia", "Surgical Lights", "Monitors"], lastCleaned: "Pre-op sterile" },
  { id: "9", number: "OR-2", name: "Operating Room 2", type: "operating", floor: "4", status: "maintenance", capacity: 1, currentOccupancy: 0, equipment: ["Operating Table", "Anesthesia", "Surgical Lights", "Monitors"], lastCleaned: "Under maintenance" },
  { id: "10", number: "ER-1", name: "Emergency Bay 1", type: "emergency", floor: "G", status: "available", capacity: 2, currentOccupancy: 0, equipment: ["Trauma Bed", "Defibrillator", "Monitor", "Crash Cart"], lastCleaned: "15 min ago" },
  { id: "11", number: "ER-2", name: "Emergency Bay 2", type: "emergency", floor: "G", status: "occupied", capacity: 2, currentOccupancy: 1, patient: "Emergency Patient", equipment: ["Trauma Bed", "Defibrillator", "Monitor", "Crash Cart"], lastCleaned: "Active" },
  { id: "12", number: "C-101", name: "Consultation Room 1", type: "consultation", floor: "1", status: "available", capacity: 3, currentOccupancy: 0, equipment: ["Desk", "Examination Bed", "Computer"], lastCleaned: "20 min ago" },
];

type StatusFilter = "all" | "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
type TypeFilter = "all" | "ward" | "private" | "icu" | "operating" | "emergency" | "consultation";

export default function RoomsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "occupied", label: "Occupied" },
    { key: "reserved", label: "Reserved" },
    { key: "cleaning", label: "Cleaning" },
    { key: "maintenance", label: "Maintenance" },
  ];

  const typeTabs = [
    { key: "all", label: "All Types" },
    { key: "ward", label: "Ward" },
    { key: "private", label: "Private" },
    { key: "icu", label: "ICU" },
    { key: "operating", label: "OR" },
    { key: "emergency", label: "ER" },
    { key: "consultation", label: "Consult" },
  ];

  const filteredRooms = MOCK_ROOMS.filter(room => {
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    const matchesType = typeFilter === "all" || room.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "available": return colors.success;
      case "occupied": return colors.error;
      case "reserved": return colors.warning;
      case "cleaning": return colors.primary;
      case "maintenance": return colors.muted;
    }
  };

  const getStatusLabel = (status: Room["status"]) => {
    switch (status) {
      case "available": return "Available";
      case "occupied": return "Occupied";
      case "reserved": return "Reserved";
      case "cleaning": return "Cleaning";
      case "maintenance": return "Maintenance";
    }
  };

  const getTypeColor = (type: Room["type"]) => {
    switch (type) {
      case "ward": return "#3B82F6";
      case "private": return "#8B5CF6";
      case "icu": return "#EF4444";
      case "operating": return "#10B981";
      case "emergency": return "#F59E0B";
      case "consultation": return "#6B7280";
    }
  };

  const getTypeIcon = (type: Room["type"]): "bed.double.fill" | "star.fill" | "heart.fill" | "cross.fill" | "bolt.fill" | "person.fill" => {
    switch (type) {
      case "ward": return "bed.double.fill";
      case "private": return "star.fill";
      case "icu": return "heart.fill";
      case "operating": return "cross.fill";
      case "emergency": return "bolt.fill";
      case "consultation": return "person.fill";
    }
  };

  const availableCount = MOCK_ROOMS.filter(r => r.status === "available").length;
  const occupiedCount = MOCK_ROOMS.filter(r => r.status === "occupied").length;
  const totalCapacity = MOCK_ROOMS.reduce((sum, r) => sum + r.capacity, 0);
  const currentOccupancy = MOCK_ROOMS.reduce((sum, r) => sum + r.currentOccupancy, 0);
  const occupancyRate = Math.round((currentOccupancy / totalCapacity) * 100);

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3">
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: getTypeColor(item.type) + '20' }}
        >
          <IconSymbol name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-foreground font-bold text-lg">{item.number}</Text>
            <View 
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getStatusColor(item.status) + '20' }}
            >
              <Text style={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: '600' }}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text className="text-muted text-sm">{item.name}</Text>
          <Text className="text-muted text-xs mt-1">Floor {item.floor} • Capacity: {item.capacity}</Text>
          
          {item.patient && (
            <View className="flex-row items-center gap-1 mt-2">
              <IconSymbol name="person.fill" size={12} color={colors.foreground} />
              <Text className="text-foreground text-sm">{item.patient}</Text>
            </View>
          )}
          
          {item.assignedStaff && (
            <View className="flex-row items-center gap-1 mt-1">
              <IconSymbol name="stethoscope" size={12} color={colors.muted} />
              <Text className="text-muted text-xs">{item.assignedStaff}</Text>
            </View>
          )}
          
          {item.lastCleaned && (
            <Text className="text-muted text-xs mt-1">Last cleaned: {item.lastCleaned}</Text>
          )}
        </View>
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
      </View>
      
      {/* Equipment Tags */}
      <View className="flex-row flex-wrap gap-1 mt-3">
        {item.equipment.slice(0, 3).map((eq, idx) => (
          <View 
            key={idx}
            className="px-2 py-1 rounded-md"
            style={{ backgroundColor: colors.background }}
          >
            <Text style={{ color: colors.muted, fontSize: 10 }}>{eq}</Text>
          </View>
        ))}
        {item.equipment.length > 3 && (
          <View 
            className="px-2 py-1 rounded-md"
            style={{ backgroundColor: colors.background }}
          >
            <Text style={{ color: colors.muted, fontSize: 10 }}>+{item.equipment.length - 3} more</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Rooms</Text>
            <Text className="text-muted text-sm">{MOCK_ROOMS.length} rooms total</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between mb-3">
            <View className="items-center flex-1">
              <Text style={{ color: colors.success, fontSize: 24, fontWeight: '700' }}>{availableCount}</Text>
              <Text className="text-muted text-xs">Available</Text>
            </View>
            <View className="items-center flex-1">
              <Text style={{ color: colors.error, fontSize: 24, fontWeight: '700' }}>{occupiedCount}</Text>
              <Text className="text-muted text-xs">Occupied</Text>
            </View>
            <View className="items-center flex-1">
              <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '700' }}>{occupancyRate}%</Text>
              <Text className="text-muted text-xs">Occupancy</Text>
            </View>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View 
              className="h-full rounded-full"
              style={{ width: `${occupancyRate}%`, backgroundColor: occupancyRate > 80 ? colors.error : colors.primary }}
            />
          </View>
        </View>

        {/* Type Filter */}
        <Text className="text-muted text-xs font-semibold uppercase mb-2">Room Type</Text>
        <TabBar
          tabs={typeTabs}
          activeTab={typeFilter}
          onTabChange={(key) => setTypeFilter(key as TypeFilter)}
        />

        {/* Status Filter */}
        <Text className="text-muted text-xs font-semibold uppercase mb-2 mt-2">Status</Text>
        <TabBar
          tabs={statusTabs}
          activeTab={statusFilter}
          onTabChange={(key) => setStatusFilter(key as StatusFilter)}
        />
      </View>

      {/* Rooms List */}
      <FlatList
        data={filteredRooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="bed.double.fill" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No rooms found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
