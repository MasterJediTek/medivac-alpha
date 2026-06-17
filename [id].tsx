import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter, useLocalSearchParams } from "expo-router";

interface VitalSign {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
}

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  title: string;
  doctor: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  status: "scheduled" | "completed" | "cancelled";
}

type TabType = "overview" | "records" | "appointments";

export default function PatientDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Mock patient data
  const patient = {
    id: id,
    name: "John Doe",
    age: 45,
    gender: "Male",
    dob: "March 15, 1979",
    phone: "+61 412 345 678",
    email: "john.doe@email.com",
    address: "123 Medical Street, Perth WA 6000",
    emergencyContact: "Jane Doe (Wife) - +61 412 345 679",
    bloodType: "O+",
    allergies: ["Penicillin", "Shellfish"],
    status: "active" as const,
    avatar: "JD",
    insuranceId: "MED-2024-001234",
    admissionDate: "January 20, 2026",
  };

  const vitals: VitalSign[] = [
    { label: "Blood Pressure", value: "120/80", unit: "mmHg", status: "normal" },
    { label: "Heart Rate", value: "72", unit: "bpm", status: "normal" },
    { label: "Temperature", value: "37.2", unit: "°C", status: "normal" },
    { label: "Oxygen Saturation", value: "98", unit: "%", status: "normal" },
    { label: "Blood Glucose", value: "145", unit: "mg/dL", status: "warning" },
    { label: "Weight", value: "82", unit: "kg", status: "normal" },
  ];

  const medications: Medication[] = [
    { id: "1", name: "Metformin", dosage: "500mg", frequency: "Twice daily", startDate: "Jan 15, 2026" },
    { id: "2", name: "Lisinopril", dosage: "10mg", frequency: "Once daily", startDate: "Jan 10, 2026" },
    { id: "3", name: "Aspirin", dosage: "81mg", frequency: "Once daily", startDate: "Dec 1, 2025" },
  ];

  const records: MedicalRecord[] = [
    { id: "1", date: "Jan 24, 2026", type: "Consultation", title: "Diabetes Follow-up", doctor: "Dr. Smith", notes: "Blood glucose levels improving. Continue current medication." },
    { id: "2", date: "Jan 20, 2026", type: "Lab Test", title: "Complete Blood Count", doctor: "Dr. Chen", notes: "All values within normal range." },
    { id: "3", date: "Jan 15, 2026", type: "Procedure", title: "ECG Test", doctor: "Dr. Patel", notes: "Normal sinus rhythm. No abnormalities detected." },
    { id: "4", date: "Jan 10, 2026", type: "Consultation", title: "Initial Assessment", doctor: "Dr. Smith", notes: "Patient admitted for diabetes management." },
  ];

  const appointments: Appointment[] = [
    { id: "1", date: "Jan 28, 2026", time: "10:00 AM", type: "Follow-up", doctor: "Dr. Smith", status: "scheduled" },
    { id: "2", date: "Feb 5, 2026", time: "2:00 PM", type: "Lab Test", doctor: "Dr. Chen", status: "scheduled" },
    { id: "3", date: "Jan 24, 2026", time: "9:00 AM", type: "Check-up", doctor: "Dr. Smith", status: "completed" },
    { id: "4", date: "Jan 20, 2026", time: "11:00 AM", type: "Lab Test", doctor: "Dr. Chen", status: "completed" },
  ];

  const tabs: { key: TabType; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "records", label: "Records" },
    { key: "appointments", label: "Appointments" },
  ];

  const getStatusColor = (status: VitalSign["status"]) => {
    switch (status) {
      case "normal": return colors.success;
      case "warning": return colors.warning;
      case "critical": return colors.error;
    }
  };

  const getAppointmentStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled": return colors.primary;
      case "completed": return colors.success;
      case "cancelled": return colors.error;
    }
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Patient Info Card */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-4 mb-4">
          <View 
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 28 }}>{patient.avatar}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-xl font-bold">{patient.name}</Text>
            <Text className="text-muted text-sm">{patient.age} years • {patient.gender}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.success + '20' }}
              >
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                  {patient.status}
                </Text>
              </View>
              <Text className="text-muted text-xs">ID: {patient.insuranceId}</Text>
            </View>
          </View>
        </View>
        
        <View className="border-t pt-4" style={{ borderTopColor: colors.border }}>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[45%]">
              <Text className="text-muted text-xs mb-1">Date of Birth</Text>
              <Text className="text-foreground font-medium">{patient.dob}</Text>
            </View>
            <View className="flex-1 min-w-[45%]">
              <Text className="text-muted text-xs mb-1">Blood Type</Text>
              <Text className="text-foreground font-medium">{patient.bloodType}</Text>
            </View>
            <View className="flex-1 min-w-[45%]">
              <Text className="text-muted text-xs mb-1">Phone</Text>
              <Text className="text-foreground font-medium">{patient.phone}</Text>
            </View>
            <View className="flex-1 min-w-[45%]">
              <Text className="text-muted text-xs mb-1">Admission Date</Text>
              <Text className="text-foreground font-medium">{patient.admissionDate}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Allergies */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Allergies</Text>
        <View className="flex-row flex-wrap gap-2">
          {patient.allergies.map((allergy, index) => (
            <View 
              key={index}
              className="px-3 py-2 rounded-full"
              style={{ backgroundColor: colors.error + '20' }}
            >
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '500' }}>{allergy}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Vital Signs */}
      <View className="mb-4">
        <Text className="text-foreground font-semibold mb-3">Vital Signs</Text>
        <View className="flex-row flex-wrap gap-3">
          {vitals.map((vital, index) => (
            <View 
              key={index}
              className="bg-surface rounded-2xl p-3 flex-1 min-w-[30%]"
              style={{ borderLeftWidth: 3, borderLeftColor: getStatusColor(vital.status) }}
            >
              <Text className="text-muted text-xs mb-1">{vital.label}</Text>
              <Text className="text-foreground text-lg font-bold">{vital.value}</Text>
              <Text className="text-muted text-xs">{vital.unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Current Medications */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-semibold">Current Medications</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-primary text-sm font-medium">View All</Text>
          </TouchableOpacity>
        </View>
        <View className="bg-surface rounded-2xl overflow-hidden">
          {medications.map((med, index) => (
            <View 
              key={med.id}
              className="p-4"
              style={{ borderBottomWidth: index < medications.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-foreground font-medium">{med.name}</Text>
                  <Text className="text-muted text-sm">{med.dosage} • {med.frequency}</Text>
                </View>
                <Text className="text-muted text-xs">Since {med.startDate}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Emergency Contact */}
      <View className="bg-surface rounded-2xl p-4">
        <Text className="text-foreground font-semibold mb-2">Emergency Contact</Text>
        <Text className="text-muted">{patient.emergencyContact}</Text>
      </View>
    </ScrollView>
  );

  const renderRecords = () => (
    <FlatList
      data={records}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity 
          className="bg-surface rounded-2xl p-4 mb-3"
          activeOpacity={0.7}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>{item.type}</Text>
              </View>
              <Text className="text-muted text-xs">{item.date}</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </View>
          <Text className="text-foreground font-semibold mb-1">{item.title}</Text>
          <Text className="text-muted text-sm mb-2">{item.notes}</Text>
          <Text className="text-primary text-xs font-medium">{item.doctor}</Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderAppointments = () => (
    <FlatList
      data={appointments}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity 
          className="bg-surface rounded-2xl p-4 mb-3 flex-row"
          activeOpacity={0.7}
        >
          <View className="mr-4 items-center">
            <Text className="text-foreground font-bold">{item.time}</Text>
            <Text className="text-muted text-xs">{item.date}</Text>
          </View>
          <View 
            className="w-1 rounded-full mr-4"
            style={{ backgroundColor: getAppointmentStatusColor(item.status) }}
          />
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{item.type}</Text>
            <Text className="text-muted text-sm">{item.doctor}</Text>
            <View 
              className="px-2 py-1 rounded-full mt-2 self-start"
              style={{ backgroundColor: getAppointmentStatusColor(item.status) + '20' }}
            >
              <Text style={{ color: getAppointmentStatusColor(item.status), fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                {item.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
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
            <Text className="text-foreground text-xl font-bold">Patient Details</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border"
              activeOpacity={0.7}
            >
              <IconSymbol name="pencil" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-primary items-center justify-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="message.fill" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View className="flex-row bg-surface rounded-xl p-1">
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-3 rounded-lg items-center"
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
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-5 pt-4">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "records" && renderRecords()}
        {activeTab === "appointments" && renderAppointments()}
      </View>

      {/* Quick Actions */}
      <View className="px-5 pb-4">
        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="flex-1 bg-primary py-4 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-background font-semibold">Schedule Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-surface py-4 rounded-xl items-center border border-border"
            activeOpacity={0.8}
          >
            <Text className="text-foreground font-semibold">Add Record</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
