import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  form: string;
  stock: number;
  minStock: number;
  category: string;
  expiryDate: string;
  supplier: string;
}

type FilterType = "all" | "low" | "expiring" | "controlled";

export default function MedicationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const medications: Medication[] = [
    { id: "1", name: "Metformin", genericName: "Metformin HCl", dosage: "500mg", form: "Tablet", stock: 500, minStock: 100, category: "Diabetes", expiryDate: "Dec 2026", supplier: "PharmaCorp" },
    { id: "2", name: "Lisinopril", genericName: "Lisinopril", dosage: "10mg", form: "Tablet", stock: 45, minStock: 50, category: "Cardiovascular", expiryDate: "Mar 2026", supplier: "MediSupply" },
    { id: "3", name: "Amoxicillin", genericName: "Amoxicillin", dosage: "250mg", form: "Capsule", stock: 200, minStock: 75, category: "Antibiotic", expiryDate: "Feb 2026", supplier: "PharmaCorp" },
    { id: "4", name: "Aspirin", genericName: "Acetylsalicylic Acid", dosage: "81mg", form: "Tablet", stock: 1000, minStock: 200, category: "Analgesic", expiryDate: "Jun 2027", supplier: "GenericMeds" },
    { id: "5", name: "Morphine", genericName: "Morphine Sulfate", dosage: "10mg", form: "Injection", stock: 25, minStock: 20, category: "Controlled", expiryDate: "Sep 2026", supplier: "SecurePharma" },
    { id: "6", name: "Omeprazole", genericName: "Omeprazole", dosage: "20mg", form: "Capsule", stock: 30, minStock: 50, category: "Gastrointestinal", expiryDate: "Apr 2026", supplier: "MediSupply" },
    { id: "7", name: "Atorvastatin", genericName: "Atorvastatin Calcium", dosage: "40mg", form: "Tablet", stock: 150, minStock: 50, category: "Cardiovascular", expiryDate: "Aug 2026", supplier: "PharmaCorp" },
    { id: "8", name: "Fentanyl", genericName: "Fentanyl Citrate", dosage: "50mcg", form: "Patch", stock: 15, minStock: 10, category: "Controlled", expiryDate: "Jul 2026", supplier: "SecurePharma" },
  ];

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low", label: "Low Stock" },
    { key: "expiring", label: "Expiring Soon" },
    { key: "controlled", label: "Controlled" },
  ];

  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         med.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeFilter) {
      case "low": return matchesSearch && med.stock < med.minStock;
      case "expiring": return matchesSearch && new Date(med.expiryDate) < new Date("2026-06-01");
      case "controlled": return matchesSearch && med.category === "Controlled";
      default: return matchesSearch;
    }
  });

  const stats = {
    total: medications.length,
    lowStock: medications.filter(m => m.stock < m.minStock).length,
    expiringSoon: medications.filter(m => new Date(m.expiryDate) < new Date("2026-06-01")).length,
    controlled: medications.filter(m => m.category === "Controlled").length,
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock < minStock * 0.5) return { color: colors.error, label: "Critical" };
    if (stock < minStock) return { color: colors.warning, label: "Low" };
    return { color: colors.success, label: "OK" };
  };

  const renderMedication = ({ item }: { item: Medication }) => {
    const stockStatus = getStockStatus(item.stock, item.minStock);
    
    return (
      <TouchableOpacity 
        className="bg-surface rounded-2xl p-4 mb-3"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-foreground font-semibold text-base">{item.name}</Text>
              {item.category === "Controlled" && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.error + '20' }}>
                  <Text style={{ color: colors.error, fontSize: 10, fontWeight: '600' }}>Controlled</Text>
                </View>
              )}
            </View>
            <Text className="text-muted text-sm">{item.genericName}</Text>
          </View>
          <View 
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: stockStatus.color + '20' }}
          >
            <Text style={{ color: stockStatus.color, fontSize: 11, fontWeight: '600' }}>
              {stockStatus.label}
            </Text>
          </View>
        </View>
        
        <View className="flex-row flex-wrap gap-4 mt-3">
          <View>
            <Text className="text-muted text-xs">Dosage</Text>
            <Text className="text-foreground font-medium">{item.dosage}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Form</Text>
            <Text className="text-foreground font-medium">{item.form}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Stock</Text>
            <Text className="text-foreground font-medium">{item.stock} units</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Expires</Text>
            <Text className="text-foreground font-medium">{item.expiryDate}</Text>
          </View>
        </View>
        
        <View className="mt-3 pt-3 border-t flex-row items-center justify-between" style={{ borderTopColor: colors.border }}>
          <Text className="text-muted text-xs">{item.category} • {item.supplier}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-primary text-sm font-medium">Reorder</Text>
          </TouchableOpacity>
        </View>
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
            <Text className="text-foreground text-2xl font-bold">Medications</Text>
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
            placeholder="Search medications..."
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
            <Text className="text-warning text-xl font-bold">{stats.lowStock}</Text>
            <Text className="text-muted text-xs">Low Stock</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-error text-xl font-bold">{stats.expiringSoon}</Text>
            <Text className="text-muted text-xs">Expiring</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text style={{ color: colors.primary }} className="text-xl font-bold">{stats.controlled}</Text>
            <Text className="text-muted text-xs">Controlled</Text>
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

      {/* Medication List */}
      <FlatList
        data={filteredMedications}
        renderItem={renderMedication}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="pills.fill" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No medications found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
