import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  status: "active" | "discharged" | "critical";
  lastVisit: string;
  condition: string;
  avatar: string;
}

const MOCK_PATIENTS: Patient[] = [
  { id: "1", name: "John Doe", age: 45, gender: "Male", status: "active", lastVisit: "Today", condition: "Diabetes Type 2", avatar: "JD" },
  { id: "2", name: "Sarah Johnson", age: 32, gender: "Female", status: "active", lastVisit: "Yesterday", condition: "Hypertension", avatar: "SJ" },
  { id: "3", name: "Mike Wilson", age: 58, gender: "Male", status: "critical", lastVisit: "Today", condition: "Cardiac Arrhythmia", avatar: "MW" },
  { id: "4", name: "Emily Chen", age: 28, gender: "Female", status: "active", lastVisit: "3 days ago", condition: "Asthma", avatar: "EC" },
  { id: "5", name: "Robert Brown", age: 67, gender: "Male", status: "discharged", lastVisit: "1 week ago", condition: "Post-Surgery Recovery", avatar: "RB" },
  { id: "6", name: "Lisa Anderson", age: 41, gender: "Female", status: "active", lastVisit: "Today", condition: "Migraine", avatar: "LA" },
  { id: "7", name: "David Martinez", age: 53, gender: "Male", status: "critical", lastVisit: "Today", condition: "Pneumonia", avatar: "DM" },
  { id: "8", name: "Jennifer Taylor", age: 36, gender: "Female", status: "active", lastVisit: "2 days ago", condition: "Pregnancy - 28 weeks", avatar: "JT" },
];

type FilterType = "all" | "active" | "discharged" | "critical";

export default function PatientsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "critical", label: "Critical" },
    { key: "discharged", label: "Discharged" },
  ];

  const filteredPatients = MOCK_PATIENTS.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || patient.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "active": return colors.success;
      case "critical": return colors.error;
      case "discharged": return colors.muted;
    }
  };

  const getAvatarColor = (status: Patient["status"]) => {
    switch (status) {
      case "active": return colors.primary;
      case "critical": return colors.error;
      case "discharged": return colors.muted;
    }
  };

  const handlePatientPress = (patient: Patient) => {
    router.push(`/patient/${patient.id}`);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center gap-3"
      activeOpacity={0.7}
      onPress={() => handlePatientPress(item)}
    >
      <View 
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: getAvatarColor(item.status) + '20' }}
      >
        <Text style={{ color: getAvatarColor(item.status), fontWeight: '600', fontSize: 16 }}>
          {item.avatar}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-foreground font-semibold text-base">{item.name}</Text>
          <View 
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: getStatusColor(item.status) + '20' }}
          >
            <Text style={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: '600', textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text className="text-muted text-sm">{item.condition}</Text>
        <Text className="text-muted text-xs mt-1">{item.age} yrs • {item.gender} • Last visit: {item.lastVisit}</Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-foreground text-2xl font-bold">Patients</Text>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 text-foreground text-base"
            placeholder="Search patients..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              className="px-4 py-2 rounded-full mr-2"
              style={{
                backgroundColor: activeFilter === filter.key ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: activeFilter === filter.key ? colors.primary : colors.border,
              }}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text 
                style={{ 
                  color: activeFilter === filter.key ? colors.background : colors.foreground,
                  fontWeight: '500',
                  fontSize: 14,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Patient List */}
      <FlatList
        data={filteredPatients}
        renderItem={renderPatient}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="person.2.fill" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No patients found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
