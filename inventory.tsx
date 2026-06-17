import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TabBar, ProgressBar } from "@/components/ui/control-panel";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  expiryDate?: string;
  lastRestocked: string;
  supplier: string;
  unitCost: number;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Surgical Gloves (Large)", category: "PPE", sku: "PPE-GL-L", quantity: 450, minStock: 100, maxStock: 500, unit: "pairs", location: "Store A1", lastRestocked: "2 days ago", supplier: "MedSupply Co", unitCost: 0.50 },
  { id: "2", name: "N95 Masks", category: "PPE", sku: "PPE-N95", quantity: 85, minStock: 200, maxStock: 1000, unit: "units", location: "Store A1", lastRestocked: "1 week ago", supplier: "SafeGuard Med", unitCost: 2.50 },
  { id: "3", name: "IV Cannula 20G", category: "Consumables", sku: "CON-IV-20", quantity: 320, minStock: 100, maxStock: 500, unit: "units", location: "Store B2", lastRestocked: "3 days ago", supplier: "MedSupply Co", unitCost: 1.20 },
  { id: "4", name: "Saline Solution 500ml", category: "Fluids", sku: "FLU-SAL-500", quantity: 180, minStock: 50, maxStock: 300, unit: "bags", location: "Store C1", expiryDate: "2026-06-15", lastRestocked: "5 days ago", supplier: "PharmaCare", unitCost: 3.50 },
  { id: "5", name: "Paracetamol 500mg", category: "Medications", sku: "MED-PAR-500", quantity: 2500, minStock: 500, maxStock: 5000, unit: "tablets", location: "Pharmacy", expiryDate: "2027-03-20", lastRestocked: "1 week ago", supplier: "PharmaCare", unitCost: 0.05 },
  { id: "6", name: "Morphine 10mg/ml", category: "Controlled", sku: "CTR-MOR-10", quantity: 45, minStock: 20, maxStock: 100, unit: "ampoules", location: "Secure Cabinet", expiryDate: "2026-09-10", lastRestocked: "2 weeks ago", supplier: "ControlledMeds Ltd", unitCost: 15.00 },
  { id: "7", name: "Suture Kit 3-0", category: "Surgical", sku: "SUR-SUT-30", quantity: 75, minStock: 30, maxStock: 150, unit: "kits", location: "OR Supply", lastRestocked: "4 days ago", supplier: "SurgicalPro", unitCost: 8.50 },
  { id: "8", name: "Blood Glucose Strips", category: "Diagnostics", sku: "DIA-GLU-ST", quantity: 12, minStock: 50, maxStock: 200, unit: "boxes", location: "Lab Supply", expiryDate: "2026-04-01", lastRestocked: "3 weeks ago", supplier: "DiagnosticPlus", unitCost: 25.00 },
  { id: "9", name: "Oxygen Cylinder (Size D)", category: "Equipment", sku: "EQP-O2-D", quantity: 8, minStock: 5, maxStock: 20, unit: "cylinders", location: "Equipment Room", lastRestocked: "1 week ago", supplier: "MedGas Supply", unitCost: 45.00 },
  { id: "10", name: "Bandage Gauze 4x4", category: "Consumables", sku: "CON-BAN-44", quantity: 890, minStock: 200, maxStock: 1000, unit: "packs", location: "Store B1", lastRestocked: "1 day ago", supplier: "MedSupply Co", unitCost: 0.30 },
];

type CategoryFilter = "all" | "PPE" | "Consumables" | "Fluids" | "Medications" | "Controlled" | "Surgical" | "Diagnostics" | "Equipment";
type StockFilter = "all" | "low" | "normal" | "high" | "expiring";

export default function InventoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const categoryTabs = [
    { key: "all", label: "All" },
    { key: "PPE", label: "PPE" },
    { key: "Consumables", label: "Consumables" },
    { key: "Medications", label: "Medications" },
    { key: "Surgical", label: "Surgical" },
    { key: "Equipment", label: "Equipment" },
  ];

  const stockTabs = [
    { key: "all", label: "All Stock" },
    { key: "low", label: "Low Stock", badge: MOCK_INVENTORY.filter(i => i.quantity < i.minStock).length },
    { key: "normal", label: "Normal" },
    { key: "expiring", label: "Expiring Soon" },
  ];

  const getStockStatus = (item: InventoryItem): "low" | "normal" | "high" => {
    const percentage = (item.quantity / item.maxStock) * 100;
    if (item.quantity < item.minStock) return "low";
    if (percentage > 80) return "high";
    return "normal";
  };

  const isExpiringSoon = (item: InventoryItem): boolean => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90;
  };

  const filteredInventory = MOCK_INVENTORY.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === "low") matchesStock = getStockStatus(item) === "low";
    else if (stockFilter === "normal") matchesStock = getStockStatus(item) === "normal";
    else if (stockFilter === "high") matchesStock = getStockStatus(item) === "high";
    else if (stockFilter === "expiring") matchesStock = isExpiringSoon(item);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockColor = (status: "low" | "normal" | "high") => {
    switch (status) {
      case "low": return colors.error;
      case "normal": return colors.success;
      case "high": return colors.primary;
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      "PPE": "#3B82F6",
      "Consumables": "#10B981",
      "Fluids": "#06B6D4",
      "Medications": "#8B5CF6",
      "Controlled": "#EF4444",
      "Surgical": "#F59E0B",
      "Diagnostics": "#EC4899",
      "Equipment": "#6B7280",
    };
    return categoryColors[category] || colors.primary;
  };

  const lowStockCount = MOCK_INVENTORY.filter(i => getStockStatus(i) === "low").length;
  const expiringCount = MOCK_INVENTORY.filter(i => isExpiringSoon(i)).length;
  const totalValue = MOCK_INVENTORY.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    const stockPercentage = Math.min(100, (item.quantity / item.maxStock) * 100);
    const expiring = isExpiringSoon(item);

    return (
      <TouchableOpacity 
        className="bg-surface rounded-2xl p-4 mb-3"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start gap-3">
          <View 
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: getCategoryColor(item.category) + '20' }}
          >
            <IconSymbol name="cube.fill" size={24} color={getCategoryColor(item.category)} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-foreground font-semibold text-base flex-1" numberOfLines={1}>{item.name}</Text>
              {stockStatus === "low" && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.error + '20' }}>
                  <Text style={{ color: colors.error, fontSize: 10, fontWeight: '600' }}>LOW</Text>
                </View>
              )}
              {expiring && (
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.warning + '20' }}>
                  <Text style={{ color: colors.warning, fontSize: 10, fontWeight: '600' }}>EXPIRING</Text>
                </View>
              )}
            </View>
            <Text className="text-muted text-xs">{item.sku} • {item.category}</Text>
            
            <View className="flex-row items-center justify-between mt-2">
              <View>
                <Text className="text-foreground font-bold text-lg">{item.quantity}</Text>
                <Text className="text-muted text-xs">{item.unit}</Text>
              </View>
              <View className="items-end">
                <Text className="text-muted text-xs">Min: {item.minStock}</Text>
                <Text className="text-muted text-xs">Max: {item.maxStock}</Text>
              </View>
            </View>

            {/* Stock Level Bar */}
            <View className="mt-2">
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${stockPercentage}%`, 
                    backgroundColor: getStockColor(stockStatus) 
                  }}
                />
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-muted text-xs">{item.location}</Text>
              <Text className="text-muted text-xs">Restocked: {item.lastRestocked}</Text>
            </View>

            {item.expiryDate && (
              <Text 
                className="text-xs mt-1"
                style={{ color: expiring ? colors.warning : colors.muted }}
              >
                Expires: {item.expiryDate}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Inventory</Text>
            <Text className="text-muted text-sm">{MOCK_INVENTORY.length} items tracked</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-surface rounded-xl p-3">
            <View className="flex-row items-center gap-2">
              <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 18, fontWeight: '700' }}>{lowStockCount}</Text>
            </View>
            <Text className="text-muted text-xs mt-1">Low Stock</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3">
            <View className="flex-row items-center gap-2">
              <IconSymbol name="clock.fill" size={16} color={colors.warning} />
              <Text style={{ color: colors.warning, fontSize: 18, fontWeight: '700' }}>{expiringCount}</Text>
            </View>
            <Text className="text-muted text-xs mt-1">Expiring</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3">
            <Text style={{ color: colors.success, fontSize: 18, fontWeight: '700' }}>${totalValue.toFixed(0)}</Text>
            <Text className="text-muted text-xs mt-1">Total Value</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border mb-4">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 text-foreground text-base"
            placeholder="Search inventory..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Category Filter */}
        <TabBar
          tabs={categoryTabs}
          activeTab={categoryFilter}
          onTabChange={(key) => setCategoryFilter(key as CategoryFilter)}
        />

        {/* Stock Filter */}
        <TabBar
          tabs={stockTabs}
          activeTab={stockFilter}
          onTabChange={(key) => setStockFilter(key as StockFilter)}
        />
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="cube.fill" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No items found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
