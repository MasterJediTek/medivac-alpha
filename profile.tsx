import { ScrollView, Text, View, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeId: string;
  joinDate: string;
  avatar: string;
  status: "active" | "away" | "busy" | "offline";
}

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: "U001",
    firstName: "Jedi",
    lastName: "User",
    email: "jedi@medivac.one",
    phone: "+61 412 345 678",
    role: "Medical Administrator",
    department: "Administration",
    employeeId: "EMP-2024-001",
    joinDate: "January 15, 2024",
    avatar: "JU",
    status: "active",
  });

  const recentActivity: ActivityItem[] = [
    { id: "1", action: "Viewed patient record", target: "John Doe", time: "5 min ago" },
    { id: "2", action: "Updated appointment", target: "Sarah Johnson", time: "15 min ago" },
    { id: "3", action: "Completed task", target: "Review lab results", time: "1 hour ago" },
    { id: "4", action: "Sent message", target: "Dr. Smith", time: "2 hours ago" },
    { id: "5", action: "Synced with JEDI", target: "Knowledge Base", time: "3 hours ago" },
  ];

  const stats = [
    { label: "Patients Managed", value: "156" },
    { label: "Tasks Completed", value: "89" },
    { label: "Messages Sent", value: "234" },
    { label: "Days Active", value: "365" },
  ];

  const getStatusColor = (status: UserProfile["status"]) => {
    switch (status) {
      case "active": return colors.success;
      case "away": return colors.warning;
      case "busy": return colors.error;
      case "offline": return colors.muted;
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // Save profile changes
    console.log("Profile saved:", profile);
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-foreground text-2xl font-bold">Profile</Text>
            </View>
            <TouchableOpacity 
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: isEditing ? colors.success : colors.surface, borderWidth: 1, borderColor: isEditing ? colors.success : colors.border }}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: isEditing ? colors.background : colors.foreground, fontWeight: '600' }}>
                {isEditing ? "Save" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-2xl p-6 items-center">
            <View className="relative mb-4">
              <View 
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 32 }}>{profile.avatar}</Text>
              </View>
              <View 
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 items-center justify-center"
                style={{ backgroundColor: getStatusColor(profile.status), borderColor: colors.surface }}
              />
            </View>
            <Text className="text-foreground text-xl font-bold">{profile.firstName} {profile.lastName}</Text>
            <Text className="text-muted text-sm">{profile.role}</Text>
            <Text className="text-primary text-sm mt-1">{profile.department}</Text>
            
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold">Message</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl items-center border"
                style={{ borderColor: colors.border }}
                activeOpacity={0.8}
              >
                <Text className="text-foreground font-semibold">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-5 mb-6">
          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat, index) => (
              <View 
                key={index}
                className="bg-surface rounded-2xl p-4 flex-1 min-w-[45%] items-center"
              >
                <Text className="text-foreground text-2xl font-bold">{stat.value}</Text>
                <Text className="text-muted text-xs text-center">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile Details */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">Personal Information</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted text-xs mb-1">First Name</Text>
              {isEditing ? (
                <TextInput
                  className="text-foreground text-base font-medium"
                  value={profile.firstName}
                  onChangeText={(text) => setProfile({ ...profile, firstName: text })}
                />
              ) : (
                <Text className="text-foreground font-medium">{profile.firstName}</Text>
              )}
            </View>
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted text-xs mb-1">Last Name</Text>
              {isEditing ? (
                <TextInput
                  className="text-foreground text-base font-medium"
                  value={profile.lastName}
                  onChangeText={(text) => setProfile({ ...profile, lastName: text })}
                />
              ) : (
                <Text className="text-foreground font-medium">{profile.lastName}</Text>
              )}
            </View>
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted text-xs mb-1">Email</Text>
              {isEditing ? (
                <TextInput
                  className="text-foreground text-base font-medium"
                  value={profile.email}
                  onChangeText={(text) => setProfile({ ...profile, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text className="text-foreground font-medium">{profile.email}</Text>
              )}
            </View>
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted text-xs mb-1">Phone</Text>
              {isEditing ? (
                <TextInput
                  className="text-foreground text-base font-medium"
                  value={profile.phone}
                  onChangeText={(text) => setProfile({ ...profile, phone: text })}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="text-foreground font-medium">{profile.phone}</Text>
              )}
            </View>
            <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-muted text-xs mb-1">Employee ID</Text>
              <Text className="text-foreground font-medium">{profile.employeeId}</Text>
            </View>
            <View className="p-4">
              <Text className="text-muted text-xs mb-1">Member Since</Text>
              <Text className="text-foreground font-medium">{profile.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-5">
          <Text className="text-foreground text-lg font-semibold mb-3">Recent Activity</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {recentActivity.map((activity, index) => (
              <View 
                key={activity.id}
                className="flex-row items-center p-4 gap-3"
                style={{ borderBottomWidth: index < recentActivity.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
              >
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{activity.action}</Text>
                  <Text className="text-muted text-sm">{activity.target}</Text>
                </View>
                <Text className="text-muted text-xs">{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
