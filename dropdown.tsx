import { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { IconSymbol } from "./icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Dropdown Option Type
export interface DropdownOption<T = string> {
  label: string;
  value: T;
  icon?: string;
  color?: string;
  disabled?: boolean;
}

// Dropdown Props
interface DropdownProps<T = string> {
  label?: string;
  placeholder?: string;
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function Dropdown<T = string>({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  searchable = false,
  disabled = false,
  error,
  required = false,
}: DropdownProps<T>) {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.trigger,
          { 
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
      >
        {selectedOption?.color && (
          <View 
            style={[styles.colorDot, { backgroundColor: selectedOption.color }]} 
          />
        )}
        <Text 
          style={[
            styles.triggerText, 
            { color: selectedOption ? colors.foreground : colors.muted }
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <IconSymbol 
          name="chevron.right" 
          size={16} 
          color={colors.muted}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => setIsOpen(false)}
        >
          <Pressable 
            style={[styles.modal, { backgroundColor: colors.surface }]}
            onPress={e => e.stopPropagation()}
          >
            {label && (
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {label}
              </Text>
            )}

            {searchable && (
              <View style={[styles.searchContainer, { borderColor: colors.border }]}>
                <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search..."
                  placeholderTextColor={colors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    item.value === value && { backgroundColor: colors.primary + '15' },
                    item.disabled && styles.optionDisabled,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  disabled={item.disabled}
                >
                  {item.color && (
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  )}
                  <Text 
                    style={[
                      styles.optionText, 
                      { color: item.disabled ? colors.muted : colors.foreground },
                      item.value === value && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: colors.muted }}>No options found</Text>
                </View>
              }
              style={styles.list}
            />

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeButtonText, { color: colors.background }]}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Pre-configured Medical Dropdowns

// Patient Status Dropdown
export const PATIENT_STATUS_OPTIONS: DropdownOption<string>[] = [
  { label: "Active", value: "active", color: "#22C55E" },
  { label: "Critical", value: "critical", color: "#EF4444" },
  { label: "Stable", value: "stable", color: "#3B82F6" },
  { label: "Discharged", value: "discharged", color: "#6B7280" },
  { label: "Deceased", value: "deceased", color: "#1F2937" },
  { label: "Pending Admission", value: "pending", color: "#F59E0B" },
];

// Priority Level Dropdown
export const PRIORITY_OPTIONS: DropdownOption<string>[] = [
  { label: "Critical", value: "critical", color: "#EF4444" },
  { label: "High", value: "high", color: "#F97316" },
  { label: "Normal", value: "normal", color: "#3B82F6" },
  { label: "Low", value: "low", color: "#22C55E" },
];

// Appointment Type Dropdown
export const APPOINTMENT_TYPE_OPTIONS: DropdownOption<string>[] = [
  { label: "Check Up", value: "checkup" },
  { label: "Consultation", value: "consultation" },
  { label: "Follow Up", value: "followup" },
  { label: "Surgery", value: "surgery" },
  { label: "Emergency", value: "emergency" },
  { label: "Lab Work", value: "labwork" },
  { label: "Imaging", value: "imaging" },
  { label: "Therapy", value: "therapy" },
  { label: "Vaccination", value: "vaccination" },
  { label: "Procedure", value: "procedure" },
];

// Medication Frequency Dropdown
export const MEDICATION_FREQUENCY_OPTIONS: DropdownOption<string>[] = [
  { label: "Once Daily", value: "once_daily" },
  { label: "Twice Daily", value: "twice_daily" },
  { label: "Three Times Daily", value: "three_times_daily" },
  { label: "Four Times Daily", value: "four_times_daily" },
  { label: "Every 4 Hours", value: "every_4_hours" },
  { label: "Every 6 Hours", value: "every_6_hours" },
  { label: "Every 8 Hours", value: "every_8_hours" },
  { label: "Every 12 Hours", value: "every_12_hours" },
  { label: "Weekly", value: "weekly" },
  { label: "As Needed (PRN)", value: "prn" },
  { label: "Before Meals", value: "before_meals" },
  { label: "After Meals", value: "after_meals" },
  { label: "At Bedtime", value: "bedtime" },
];

// Lab Result Status Dropdown
export const LAB_STATUS_OPTIONS: DropdownOption<string>[] = [
  { label: "Pending", value: "pending", color: "#F59E0B" },
  { label: "In Progress", value: "in_progress", color: "#3B82F6" },
  { label: "Complete - Normal", value: "normal", color: "#22C55E" },
  { label: "Complete - Abnormal", value: "abnormal", color: "#EF4444" },
  { label: "Complete - Critical", value: "critical", color: "#DC2626" },
  { label: "Cancelled", value: "cancelled", color: "#6B7280" },
];

// Staff Role Dropdown
export const STAFF_ROLE_OPTIONS: DropdownOption<string>[] = [
  { label: "Doctor", value: "doctor" },
  { label: "Nurse", value: "nurse" },
  { label: "Specialist", value: "specialist" },
  { label: "Surgeon", value: "surgeon" },
  { label: "Technician", value: "technician" },
  { label: "Pharmacist", value: "pharmacist" },
  { label: "Therapist", value: "therapist" },
  { label: "Administrator", value: "admin" },
  { label: "Receptionist", value: "receptionist" },
  { label: "Intern", value: "intern" },
];

// Room Status Dropdown
export const ROOM_STATUS_OPTIONS: DropdownOption<string>[] = [
  { label: "Available", value: "available", color: "#22C55E" },
  { label: "Occupied", value: "occupied", color: "#EF4444" },
  { label: "Reserved", value: "reserved", color: "#F59E0B" },
  { label: "Cleaning", value: "cleaning", color: "#3B82F6" },
  { label: "Maintenance", value: "maintenance", color: "#6B7280" },
  { label: "Out of Service", value: "out_of_service", color: "#1F2937" },
];

// Message Type Dropdown
export const MESSAGE_TYPE_OPTIONS: DropdownOption<string>[] = [
  { label: "Information", value: "information", color: "#3B82F6" },
  { label: "Alert", value: "alert", color: "#F59E0B" },
  { label: "Warning", value: "warning", color: "#EF4444" },
  { label: "Add", value: "add", color: "#22C55E" },
];

// Department Dropdown
export const DEPARTMENT_OPTIONS: DropdownOption<string>[] = [
  { label: "Emergency", value: "emergency" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Neurology", value: "neurology" },
  { label: "Orthopedics", value: "orthopedics" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Oncology", value: "oncology" },
  { label: "Radiology", value: "radiology" },
  { label: "Pathology", value: "pathology" },
  { label: "Surgery", value: "surgery" },
  { label: "ICU", value: "icu" },
  { label: "Maternity", value: "maternity" },
  { label: "Psychiatry", value: "psychiatry" },
];

// Insurance Type Dropdown
export const INSURANCE_TYPE_OPTIONS: DropdownOption<string>[] = [
  { label: "Medicare", value: "medicare" },
  { label: "Private Health", value: "private" },
  { label: "Workers Compensation", value: "workers_comp" },
  { label: "DVA", value: "dva" },
  { label: "Self Pay", value: "self_pay" },
  { label: "Third Party", value: "third_party" },
];

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    maxHeight: 300,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  empty: {
    padding: 20,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Dropdown;
