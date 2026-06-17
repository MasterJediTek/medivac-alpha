import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { IconSymbol } from "../ui/icon-symbol";
import { Dropdown, PATIENT_STATUS_OPTIONS, PRIORITY_OPTIONS, MEDICATION_FREQUENCY_OPTIONS } from "../ui/dropdown";
import { useColors } from "@/hooks/use-colors";

// Vitals Form Data
export interface VitalsData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  respiratoryRate: string;
  weight: string;
  height: string;
  painLevel: string;
  notes: string;
}

// Patient Vitals Form
interface VitalsFormProps {
  initialData?: Partial<VitalsData>;
  onSubmit: (data: VitalsData) => void;
  onCancel?: () => void;
}

export function VitalsForm({ initialData, onSubmit, onCancel }: VitalsFormProps) {
  const colors = useColors();
  const [data, setData] = useState<VitalsData>({
    bloodPressureSystolic: initialData?.bloodPressureSystolic || "",
    bloodPressureDiastolic: initialData?.bloodPressureDiastolic || "",
    heartRate: initialData?.heartRate || "",
    temperature: initialData?.temperature || "",
    oxygenSaturation: initialData?.oxygenSaturation || "",
    respiratoryRate: initialData?.respiratoryRate || "",
    weight: initialData?.weight || "",
    height: initialData?.height || "",
    painLevel: initialData?.painLevel || "",
    notes: initialData?.notes || "",
  });

  const updateField = (field: keyof VitalsData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <View style={styles.form}>
      <Text style={[styles.formTitle, { color: colors.foreground }]}>Patient Vitals</Text>
      
      {/* Blood Pressure */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Blood Pressure (mmHg)</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Systolic"
              placeholderTextColor={colors.muted}
              value={data.bloodPressureSystolic}
              onChangeText={v => updateField("bloodPressureSystolic", v)}
              keyboardType="numeric"
            />
          </View>
          <Text style={[styles.separator, { color: colors.muted }]}>/</Text>
          <View style={styles.halfField}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Diastolic"
              placeholderTextColor={colors.muted}
              value={data.bloodPressureDiastolic}
              onChangeText={v => updateField("bloodPressureDiastolic", v)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Heart Rate & Temperature */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Heart Rate (bpm)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="72"
            placeholderTextColor={colors.muted}
            value={data.heartRate}
            onChangeText={v => updateField("heartRate", v)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Temperature (°C)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="36.5"
            placeholderTextColor={colors.muted}
            value={data.temperature}
            onChangeText={v => updateField("temperature", v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* O2 Sat & Respiratory Rate */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>O2 Saturation (%)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="98"
            placeholderTextColor={colors.muted}
            value={data.oxygenSaturation}
            onChangeText={v => updateField("oxygenSaturation", v)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Resp. Rate (/min)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="16"
            placeholderTextColor={colors.muted}
            value={data.respiratoryRate}
            onChangeText={v => updateField("respiratoryRate", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Weight & Height */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="70"
            placeholderTextColor={colors.muted}
            value={data.weight}
            onChangeText={v => updateField("weight", v)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Height (cm)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="175"
            placeholderTextColor={colors.muted}
            value={data.height}
            onChangeText={v => updateField("height", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Pain Level */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Pain Level (0-10)</Text>
        <View style={styles.painScale}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.painButton,
                { 
                  backgroundColor: data.painLevel === String(level) 
                    ? getPainColor(level) 
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => updateField("painLevel", String(level))}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.painText, 
                  { color: data.painLevel === String(level) ? "#FFF" : colors.foreground }
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Notes</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Additional observations..."
          placeholderTextColor={colors.muted}
          value={data.notes}
          onChangeText={v => updateField("notes", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitButtonText, { color: colors.background }]}>Save Vitals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Check Up Assessment Form
export interface CheckUpData {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  socialHistory: string;
  reviewOfSystems: string;
  physicalExamination: string;
  assessment: string;
  plan: string;
  followUp: string;
}

interface CheckUpFormProps {
  initialData?: Partial<CheckUpData>;
  onSubmit: (data: CheckUpData) => void;
  onCancel?: () => void;
}

export function CheckUpForm({ initialData, onSubmit, onCancel }: CheckUpFormProps) {
  const colors = useColors();
  const [data, setData] = useState<CheckUpData>({
    chiefComplaint: initialData?.chiefComplaint || "",
    historyOfPresentIllness: initialData?.historyOfPresentIllness || "",
    pastMedicalHistory: initialData?.pastMedicalHistory || "",
    medications: initialData?.medications || "",
    allergies: initialData?.allergies || "",
    familyHistory: initialData?.familyHistory || "",
    socialHistory: initialData?.socialHistory || "",
    reviewOfSystems: initialData?.reviewOfSystems || "",
    physicalExamination: initialData?.physicalExamination || "",
    assessment: initialData?.assessment || "",
    plan: initialData?.plan || "",
    followUp: initialData?.followUp || "",
  });

  const updateField = (field: keyof CheckUpData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const sections = [
    { key: "chiefComplaint", label: "Chief Complaint", placeholder: "Patient's main concern..." },
    { key: "historyOfPresentIllness", label: "History of Present Illness", placeholder: "Detailed history..." },
    { key: "pastMedicalHistory", label: "Past Medical History", placeholder: "Previous conditions, surgeries..." },
    { key: "medications", label: "Current Medications", placeholder: "List all medications..." },
    { key: "allergies", label: "Allergies", placeholder: "Known allergies..." },
    { key: "familyHistory", label: "Family History", placeholder: "Relevant family medical history..." },
    { key: "socialHistory", label: "Social History", placeholder: "Lifestyle, occupation, habits..." },
    { key: "reviewOfSystems", label: "Review of Systems", placeholder: "Systematic review..." },
    { key: "physicalExamination", label: "Physical Examination", placeholder: "Examination findings..." },
    { key: "assessment", label: "Assessment", placeholder: "Diagnosis and clinical impression..." },
    { key: "plan", label: "Plan", placeholder: "Treatment plan and recommendations..." },
    { key: "followUp", label: "Follow Up", placeholder: "Follow-up instructions..." },
  ];

  return (
    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
      <Text style={[styles.formTitle, { color: colors.foreground }]}>Check Up Assessment</Text>
      
      {sections.map(section => (
        <View key={section.key} style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{section.label}</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder={section.placeholder}
            placeholderTextColor={colors.muted}
            value={data[section.key as keyof CheckUpData]}
            onChangeText={v => updateField(section.key as keyof CheckUpData, v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      ))}

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={() => onSubmit(data)}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitButtonText, { color: colors.background }]}>Save Assessment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Medication Administration Record
export interface MedicationRecordData {
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  instructions: string;
  refills: string;
  isActive: boolean;
}

interface MedicationRecordFormProps {
  initialData?: Partial<MedicationRecordData>;
  onSubmit: (data: MedicationRecordData) => void;
  onCancel?: () => void;
}

export function MedicationRecordForm({ initialData, onSubmit, onCancel }: MedicationRecordFormProps) {
  const colors = useColors();
  const [data, setData] = useState<MedicationRecordData>({
    medicationName: initialData?.medicationName || "",
    dosage: initialData?.dosage || "",
    route: initialData?.route || "",
    frequency: initialData?.frequency || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    prescribedBy: initialData?.prescribedBy || "",
    instructions: initialData?.instructions || "",
    refills: initialData?.refills || "",
    isActive: initialData?.isActive ?? true,
  });

  const updateField = <K extends keyof MedicationRecordData>(field: K, value: MedicationRecordData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const routeOptions = [
    { label: "Oral", value: "oral" },
    { label: "Intravenous (IV)", value: "iv" },
    { label: "Intramuscular (IM)", value: "im" },
    { label: "Subcutaneous", value: "sc" },
    { label: "Topical", value: "topical" },
    { label: "Inhalation", value: "inhalation" },
    { label: "Rectal", value: "rectal" },
    { label: "Sublingual", value: "sublingual" },
    { label: "Transdermal", value: "transdermal" },
  ];

  return (
    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
      <Text style={[styles.formTitle, { color: colors.foreground }]}>Medication Record</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Medication Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Enter medication name"
          placeholderTextColor={colors.muted}
          value={data.medicationName}
          onChangeText={v => updateField("medicationName", v)}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Dosage *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g., 500mg"
            placeholderTextColor={colors.muted}
            value={data.dosage}
            onChangeText={v => updateField("dosage", v)}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Refills</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="0"
            placeholderTextColor={colors.muted}
            value={data.refills}
            onChangeText={v => updateField("refills", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Dropdown
        label="Route of Administration"
        options={routeOptions}
        value={data.route}
        onChange={v => updateField("route", v)}
        placeholder="Select route"
      />

      <Dropdown
        label="Frequency"
        options={MEDICATION_FREQUENCY_OPTIONS}
        value={data.frequency}
        onChange={v => updateField("frequency", v)}
        placeholder="Select frequency"
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Start Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            value={data.startDate}
            onChangeText={v => updateField("startDate", v)}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>End Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            value={data.endDate}
            onChangeText={v => updateField("endDate", v)}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Prescribed By</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Doctor's name"
          placeholderTextColor={colors.muted}
          value={data.prescribedBy}
          onChangeText={v => updateField("prescribedBy", v)}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Special Instructions</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Take with food, avoid alcohol, etc."
          placeholderTextColor={colors.muted}
          value={data.instructions}
          onChangeText={v => updateField("instructions", v)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.switchRow, { borderColor: colors.border }]}>
        <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 0 }]}>Active Medication</Text>
        <Switch
          value={data.isActive}
          onValueChange={v => updateField("isActive", v)}
          trackColor={{ false: colors.border, true: colors.success + '50' }}
          thumbColor={data.isActive ? colors.success : colors.muted}
        />
      </View>

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={() => onSubmit(data)}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitButtonText, { color: colors.background }]}>Save Medication</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Lab Order Form
export interface LabOrderData {
  testName: string;
  testCategory: string;
  priority: string;
  fasting: boolean;
  clinicalIndication: string;
  specialInstructions: string;
  orderedBy: string;
}

interface LabOrderFormProps {
  initialData?: Partial<LabOrderData>;
  onSubmit: (data: LabOrderData) => void;
  onCancel?: () => void;
}

export function LabOrderForm({ initialData, onSubmit, onCancel }: LabOrderFormProps) {
  const colors = useColors();
  const [data, setData] = useState<LabOrderData>({
    testName: initialData?.testName || "",
    testCategory: initialData?.testCategory || "",
    priority: initialData?.priority || "normal",
    fasting: initialData?.fasting ?? false,
    clinicalIndication: initialData?.clinicalIndication || "",
    specialInstructions: initialData?.specialInstructions || "",
    orderedBy: initialData?.orderedBy || "",
  });

  const updateField = <K extends keyof LabOrderData>(field: K, value: LabOrderData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const testCategoryOptions = [
    { label: "Blood Chemistry", value: "blood_chemistry" },
    { label: "Hematology", value: "hematology" },
    { label: "Urinalysis", value: "urinalysis" },
    { label: "Microbiology", value: "microbiology" },
    { label: "Immunology", value: "immunology" },
    { label: "Endocrinology", value: "endocrinology" },
    { label: "Cardiac Markers", value: "cardiac" },
    { label: "Tumor Markers", value: "tumor" },
    { label: "Coagulation", value: "coagulation" },
    { label: "Other", value: "other" },
  ];

  return (
    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
      <Text style={[styles.formTitle, { color: colors.foreground }]}>Lab Order</Text>
      
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Test Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="e.g., Complete Blood Count (CBC)"
          placeholderTextColor={colors.muted}
          value={data.testName}
          onChangeText={v => updateField("testName", v)}
        />
      </View>

      <Dropdown
        label="Test Category"
        options={testCategoryOptions}
        value={data.testCategory}
        onChange={v => updateField("testCategory", v)}
        placeholder="Select category"
        searchable
      />

      <Dropdown
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={data.priority}
        onChange={v => updateField("priority", v)}
      />

      <View style={[styles.switchRow, { borderColor: colors.border }]}>
        <View>
          <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 0 }]}>Fasting Required</Text>
          <Text style={[styles.switchHint, { color: colors.muted }]}>Patient must fast before test</Text>
        </View>
        <Switch
          value={data.fasting}
          onValueChange={v => updateField("fasting", v)}
          trackColor={{ false: colors.border, true: colors.primary + '50' }}
          thumbColor={data.fasting ? colors.primary : colors.muted}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Clinical Indication *</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Reason for ordering this test..."
          placeholderTextColor={colors.muted}
          value={data.clinicalIndication}
          onChangeText={v => updateField("clinicalIndication", v)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Special Instructions</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Any special collection or handling instructions..."
          placeholderTextColor={colors.muted}
          value={data.specialInstructions}
          onChangeText={v => updateField("specialInstructions", v)}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Ordered By</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Ordering physician"
          placeholderTextColor={colors.muted}
          value={data.orderedBy}
          onChangeText={v => updateField("orderedBy", v)}
        />
      </View>

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={() => onSubmit(data)}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitButtonText, { color: colors.background }]}>Submit Order</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helper function for pain level colors
function getPainColor(level: number): string {
  if (level <= 2) return "#22C55E";
  if (level <= 4) return "#84CC16";
  if (level <= 6) return "#F59E0B";
  if (level <= 8) return "#F97316";
  return "#EF4444";
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  separator: {
    fontSize: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 80,
  },
  painScale: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  painButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  painText: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default { VitalsForm, CheckUpForm, MedicationRecordForm, LabOrderForm };
