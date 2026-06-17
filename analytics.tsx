import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface ChartBar {
  label: string;
  value: number;
  color: string;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: "person.2.fill" | "calendar" | "heart.fill" | "arrow.up.right";
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const periods = ["day", "week", "month", "year"];

  const stats: StatCard[] = [
    { title: "Total Patients", value: "1,234", change: "+12%", isPositive: true, icon: "person.2.fill" },
    { title: "Appointments", value: "456", change: "+8%", isPositive: true, icon: "calendar" },
    { title: "Critical Cases", value: "23", change: "-5%", isPositive: true, icon: "heart.fill" },
    { title: "Referrals", value: "89", change: "+15%", isPositive: true, icon: "arrow.up.right" },
  ];

  const patientTurnover: ChartBar[] = [
    { label: "May", value: 30000, color: colors.error },
    { label: "Jun", value: 15000, color: colors.warning },
    { label: "Jul", value: 25000, color: colors.warning },
    { label: "Aug", value: 45000, color: "#84CC16" },
    { label: "Nov", value: 35000, color: colors.success },
    { label: "Jan", value: 28000, color: colors.success },
  ];

  const referrals: ChartBar[] = [
    { label: "Mechem Valley", value: 65000, color: "#22C55E" },
    { label: "Stainton Mar", value: 35000, color: "#4ADE80" },
    { label: "Nito Holmberg", value: 28000, color: "#86EFAC" },
    { label: "Pariso Dexter", value: 22000, color: "#BBF7D0" },
    { label: "Lauls Meadow", value: 18000, color: "#DCFCE7" },
  ];

  const maxTurnover = Math.max(...patientTurnover.map(d => d.value));
  const maxReferral = Math.max(...referrals.map(d => d.value));

  return (
    <ScreenContainer className="flex-1">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-foreground text-2xl font-bold">Analytics</Text>
              <Text className="text-muted text-sm">Reports and Statistics</Text>
            </View>
            <TouchableOpacity 
              className="px-4 py-2 rounded-full bg-surface border border-border"
              activeOpacity={0.7}
            >
              <Text className="text-foreground text-sm font-medium">Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View className="px-5 mb-6">
          <View className="flex-row bg-surface rounded-xl p-1">
            {periods.map(period => (
              <TouchableOpacity
                key={period}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: selectedPeriod === period ? colors.primary : 'transparent',
                }}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.7}
              >
                <Text 
                  style={{ 
                    color: selectedPeriod === period ? colors.background : colors.muted,
                    fontWeight: selectedPeriod === period ? '600' : '500',
                    fontSize: 14,
                    textTransform: 'capitalize',
                  }}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-5 mb-6">
          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat, index) => (
              <View 
                key={index}
                className="bg-surface rounded-2xl p-4 flex-1 min-w-[45%]"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.primary + '15' }}
                  >
                    <IconSymbol name={stat.icon} size={20} color={colors.primary} />
                  </View>
                  <View 
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: stat.isPositive ? colors.success + '20' : colors.error + '20' }}
                  >
                    <Text 
                      style={{ 
                        color: stat.isPositive ? colors.success : colors.error, 
                        fontSize: 11, 
                        fontWeight: '600' 
                      }}
                    >
                      {stat.change}
                    </Text>
                  </View>
                </View>
                <Text className="text-foreground text-2xl font-bold">{stat.value}</Text>
                <Text className="text-muted text-sm">{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Patient Turnover Chart */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground text-lg font-semibold">Patient Turnover</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-primary text-sm font-medium">View Details</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-surface rounded-2xl p-4">
            <View className="flex-row items-end justify-between h-40 gap-2">
              {patientTurnover.map((bar, index) => (
                <View key={index} className="flex-1 items-center">
                  <View 
                    className="w-full rounded-t-lg"
                    style={{ 
                      height: (bar.value / maxTurnover) * 120,
                      backgroundColor: bar.color,
                    }}
                  />
                  <Text className="text-muted text-xs mt-2">{bar.label}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row justify-between mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
              <View>
                <Text className="text-muted text-xs">Total Revenue</Text>
                <Text className="text-foreground font-bold">$178,000</Text>
              </View>
              <View className="items-end">
                <Text className="text-muted text-xs">vs Last Period</Text>
                <Text className="text-success font-bold">+12.5%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Referrals Chart */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground text-lg font-semibold">Referrals This Month</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-primary text-sm font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-surface rounded-2xl p-4">
            {referrals.map((item, index) => (
              <View key={index} className="mb-4 last:mb-0">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-foreground text-sm font-medium">{item.label}</Text>
                  <Text className="text-muted text-sm">${(item.value / 1000).toFixed(0)}k</Text>
                </View>
                <View className="h-3 bg-border rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(item.value / maxReferral) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Patients */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground text-lg font-semibold">Top 5 Frequent Patients</Text>
          </View>
          <View className="bg-surface rounded-2xl p-4">
            {[
              { name: "Pen", visits: 45 },
              { name: "Printer Paper", visits: 890 },
              { name: "B&W Printr", visits: 120 },
              { name: "Color Printer", visits: 85 },
              { name: "Shredder", visits: 65 },
            ].map((patient, index) => (
              <View 
                key={index}
                className="flex-row items-center justify-between py-3"
                style={{
                  borderBottomWidth: index < 4 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-muted text-sm w-6">{index + 1}.</Text>
                  <Text className="text-foreground font-medium">{patient.name}</Text>
                </View>
                <Text className="text-primary font-semibold">{patient.visits}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
