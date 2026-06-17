import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "image" | "report" | "form" | "lab";
  category: string;
  patient?: string;
  size: string;
  uploadedBy: string;
  uploadedDate: string;
  lastAccessed: string;
  synced: boolean;
}

type FilterType = "all" | "reports" | "forms" | "labs" | "images";

export default function DocumentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const documents: Document[] = [
    { id: "1", name: "Patient Admission Form - John Doe", type: "form", category: "Admission", patient: "John Doe", size: "245 KB", uploadedBy: "Admin", uploadedDate: "Jan 24, 2026", lastAccessed: "2 hours ago", synced: true },
    { id: "2", name: "Blood Work Results - CBC", type: "lab", category: "Laboratory", patient: "Sarah Johnson", size: "128 KB", uploadedBy: "Lab Dept", uploadedDate: "Jan 24, 2026", lastAccessed: "1 hour ago", synced: true },
    { id: "3", name: "Chest X-Ray Scan", type: "image", category: "Radiology", patient: "Mike Wilson", size: "2.4 MB", uploadedBy: "Radiology", uploadedDate: "Jan 23, 2026", lastAccessed: "5 hours ago", synced: true },
    { id: "4", name: "Monthly Health Report - December", type: "report", category: "Reports", size: "1.2 MB", uploadedBy: "Dr. Smith", uploadedDate: "Jan 15, 2026", lastAccessed: "3 days ago", synced: true },
    { id: "5", name: "Discharge Summary", type: "form", category: "Discharge", patient: "Robert Brown", size: "156 KB", uploadedBy: "Dr. Chen", uploadedDate: "Jan 20, 2026", lastAccessed: "4 days ago", synced: false },
    { id: "6", name: "MRI Brain Scan", type: "image", category: "Radiology", patient: "Emily Chen", size: "8.5 MB", uploadedBy: "Radiology", uploadedDate: "Jan 22, 2026", lastAccessed: "1 day ago", synced: true },
    { id: "7", name: "Quarterly Analytics Report", type: "report", category: "Reports", size: "3.8 MB", uploadedBy: "Analytics", uploadedDate: "Jan 10, 2026", lastAccessed: "1 week ago", synced: true },
    { id: "8", name: "Lipid Panel Results", type: "lab", category: "Laboratory", patient: "Lisa Anderson", size: "98 KB", uploadedBy: "Lab Dept", uploadedDate: "Jan 21, 2026", lastAccessed: "2 days ago", synced: true },
  ];

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "reports", label: "Reports" },
    { key: "forms", label: "Forms" },
    { key: "labs", label: "Lab Results" },
    { key: "images", label: "Images" },
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    switch (activeFilter) {
      case "reports": return matchesSearch && doc.type === "report";
      case "forms": return matchesSearch && doc.type === "form";
      case "labs": return matchesSearch && doc.type === "lab";
      case "images": return matchesSearch && doc.type === "image";
      default: return matchesSearch;
    }
  });

  const getTypeIcon = (type: Document["type"]): "doc.fill" | "stethoscope" | "folder.fill" => {
    switch (type) {
      case "pdf": return "doc.fill";
      case "image": return "folder.fill";
      case "report": return "doc.fill";
      case "form": return "doc.fill";
      case "lab": return "stethoscope";
    }
  };

  const getTypeColor = (type: Document["type"]) => {
    switch (type) {
      case "pdf": return colors.error;
      case "image": return colors.primary;
      case "report": return colors.success;
      case "form": return colors.warning;
      case "lab": return "#8B5CF6";
    }
  };

  const stats = {
    total: documents.length,
    synced: documents.filter(d => d.synced).length,
    pending: documents.filter(d => !d.synced).length,
    totalSize: "18.5 MB",
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center gap-3"
      activeOpacity={0.7}
    >
      <View 
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: getTypeColor(item.type) + '20' }}
      >
        <IconSymbol name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} />
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-medium" numberOfLines={1}>{item.name}</Text>
        <Text className="text-muted text-sm">{item.category} • {item.size}</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-muted text-xs">{item.uploadedDate}</Text>
          {!item.synced && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.warning + '20' }}>
              <Text style={{ color: colors.warning, fontSize: 10, fontWeight: '600' }}>Pending Sync</Text>
            </View>
          )}
        </View>
      </View>
      <IconSymbol name="chevron.right" size={18} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold">Documents</Text>
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
            placeholder="Search documents..."
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
            <Text className="text-success text-xl font-bold">{stats.synced}</Text>
            <Text className="text-muted text-xs">Synced</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-warning text-xl font-bold">{stats.pending}</Text>
            <Text className="text-muted text-xs">Pending</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 items-center">
            <Text className="text-primary text-xl font-bold">{stats.totalSize}</Text>
            <Text className="text-muted text-xs">Size</Text>
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

      {/* Documents List */}
      <FlatList
        data={filteredDocuments}
        renderItem={renderDocument}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="doc.fill" size={48} color={colors.muted} />
            <Text className="text-muted text-base mt-3">No documents found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
