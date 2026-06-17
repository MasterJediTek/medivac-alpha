import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface LabTest {
  id: string;
  testName: string;
  category: string;
  patient: string;
  patientId: string;
  orderedBy: string;
  orderedDate: string;
  status: "pending" | "processing" | "completed" | "critical";
  results?: LabResult[];
}

interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  reference: string;
  status: "normal" | "low" | "high" | "critical";
}

type FilterType = "all" | "pending" | "completed" | "critical";

export default function LabsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const labTests: LabTest[] = [
    { 
      id: "1", 
      testName: "Complete Blood Count", 
      category: "Hematology",
      patient: "John Doe", 
      patientId: "P001",
      orderedBy: "Dr. Smith", 
      orderedDate: "Jan 24, 2026",
      status: "completed",
      results: [
        { parameter: "WBC", value: "7.5", unit: "10³/µL", reference: "4.5-11.0", status: "normal" },
        { parameter: "RBC", value: "4.8", unit: "10⁶/µL", reference: "4.5-5.5", status: "normal" },
        { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", reference: "13.5-17.5", status: "normal" },
        { parameter: "Platelets", value: "250", unit: "10³/µL", reference: "150-400", status: "normal" },
      ]
    },
    { 
      id: "2", 
      testName: "Lipid Panel", 
      category: "Chemistry",
      patient: "Sarah Johnson", 
      patientId: "P002",
      orderedBy: "Dr. Chen", 
      orderedDate: "Jan 24, 2026",
      status: "completed",
      results: [
        { parameter: "Total Cholesterol", value: "245", unit: "mg/dL", reference: "<200", status: "high" },
        { parameter: "LDL", value: "165", unit: "mg/dL", reference: "<100", status: "high" },
        { parameter: "HDL", value: "42", unit: "mg/dL", reference: ">40", status: "normal" },
        { parameter: "Triglycerides", value: "180", unit: "mg/dL", reference: "<150", status: "high" },
      ]
    },
    { 
      id: "3", 
      testName: "Blood Glucose", 
      category: "Chemistry",
      patient: "Mike Wilson", 
      patientId: "P003",
      orderedBy: "Dr. Patel", 
      orderedDate: "Jan 24, 2026",
      status: "critical",
      results: [
        { parameter: "Fasting Glucose", value: "285", unit: "mg/dL", reference: "70-100", status: "critical" },
        { parameter: "HbA1c", value: "9.5", unit: "%", reference: "<5.7", status: "critical" },
      ]
    },
    { 
      id: "4", 
      testName: "Liver Function Test", 
      category: "Chemistry",
      patient: "Emily Chen", 
      patientId: "P004",
      orderedBy: "Dr. Smith", 
      orderedDate: "Jan 23, 2026",
      status: "processing"
    },
    { 
      id: "5", 
      testName: "Urinalysis", 
      category: "Urinalysis",
      patient: "Robert Brown", 
      patientId: "P005",
      orderedBy: "Dr. Chen", 
      orderedDate: "Jan 23, 2026",
      status: "pending"
    },
    { 
      id: "6", 
      testName: "Thyroid Panel", 
      category: "Endocrinology",
      patient: "Lisa Anderson", 
      patientId: "P006",
      orderedBy: "Dr. Patel", 
      orderedDate: "Jan 22, 2026",
      status: "completed",
      results: [
        { parameter: "TSH", value: "2.5", unit: "mIU/L", reference: "0.4-4.0", status: "normal" },
        { parameter: "T4", value: "1.2", unit: "ng/dL", reference: "0.8-1.8", status: "normal" },
        { parameter: "T3", value: "120", unit: "ng/dL", reference: "80-200", status: "normal" },
      ]
    },
  ];

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "critical", label: "Critical" },
  ];

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.patient.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeFilter) {
      case "pending": return matchesSearch && (test.status === "pending" || test.status === "processing");
      case "completed": return matchesSearch && test.status === "completed";
      case "critical": return matchesSearch && test.status === "critical";
      default: return matchesSearch;
    }
  });

  const stats = {
    total: labTests.length,
    pending: labTests.filter(t => t.status === "pending" || t.status === "processing").length,
    completed: labTests.filter(t => t.status === "completed").length,
    critical: labTests.filter(t => t.status === "critical").length,
  };

  const getStatusColor = (status: LabTest["status"]) => {
    switch (status) {
      case "pending": return colors.muted;
      case "processing": return colors.warning;
      case "completed": return colors.success;
      case "critical": return colors.error;
    }
  };

  const getResultStatusColor = (status: LabResult["status"]) => {
    switch (status) {
      case "normal": return colors.success;
      case "low": return colors.warning;
      case "high": return colors.warning;
      case "critical": return colors.error;
    }
  };

  const renderLabTest = ({ item }: { item: LabTest }) => {
    const isExpanded = expandedTest === item.id;
    
    return (
      <TouchableOpacity 
        className="bg-surface rounded-2xl mb-3 overflow-hidden"
        onPress={() => setExpandedTest(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-base">{item.testName}</Text>
              <Text className="text-muted text-sm">{item.patient} • {item.patientId}</Text>
            </View>
            <View 
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(item.status) + '20' }}
            >
              <Text style={{ color: getStatusColor(item.status), fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                {item.status}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-xs">{item.category} • {item.orderedBy}</Text>
            <Text className="text-muted text-xs">{item.orderedDate}</Text>
          </View>
        </View>
        
        {isExpanded && item.results && (
          <View className="border-t px-4 py-3" style={{ borderTopColor: colors.border, backgroundColor: colors.background }}>
            <Text className="text-foreground font-semibold mb-3">Results</Text>
            {item.results.map((result, index) => (
              <View 
                key={index}
                className="flex-row items-center justify-between py-2"
                style={{ borderBottomWidth: index < item.results!.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
              >
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{result.parameter}</Text>
                  <Text className="text-muted text-xs">Ref: {result.reference}</Text>
                </View>
                <View className="items-end">
                  <Text 
                    className="font-bold"
                    style={{ color: getResultStatusColor(result.status) }}
                  >
                    {result.value} {result.unit}
                  </Text>
                  <Text 
                    style={{ color: getResultStatusColor(result.status), fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}
                  >
                    {result.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold">Lab Results</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border mb-4">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 text-foreground text-base"
            placeholder="Search tests or patients..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Stats */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-foreground text-xl font-bold">{stats.total}</Text>
            <Text className="text-muted text-xs">Total</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-warning text-xl font-bold">{stats.pending}</Text>
            <Text className="text-muted text-xs">Pending</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-success text-xl font-bold">{stats.completed}</Text>
            <Text className="text-muted text-xs">Completed</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-error text-xl font-bold">{stats.critical}</Text>
            <Text className="text-muted text-xs">Critical</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="-mx-1"
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

      {/* Lab Tests List */}
      <FlatList
        data={filteredTests}
        renderItem={renderLabTest}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="stethoscope" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No lab tests found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
