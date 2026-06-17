/**
 * Advanced Health Directive Wizard UI Screen
 * MediVac WACHS v9.2
 * 
 * Multi-step form wizard for creating WA Advance Health Directives
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  advancedHealthDirectiveService, 
  AHDStep,
  TreatmentPreference,
  LifeSustainingTreatment 
} from '@/lib/services/advanced-health-directive-service';
import { ahdPDFExportService } from '@/lib/services/ahd-pdf-export.service';

const PREFERENCE_OPTIONS: { value: TreatmentPreference; label: string; color: string }[] = [
  { value: 'want', label: 'I want this treatment', color: '#10B981' },
  { value: 'do-not-want', label: 'I do not want this treatment', color: '#EF4444' },
  { value: 'unsure', label: 'I am unsure / Let my TDM decide', color: '#F59E0B' },
  { value: 'not-applicable', label: 'Not applicable to me', color: '#6B7280' },
];

export default function AHDWizardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<AHDStep>('welcome');
  const [document, setDocument] = useState(advancedHealthDirectiveService.getCurrentDocument());
  const [progress, setProgress] = useState(advancedHealthDirectiveService.getWizardProgress());
  
  // Local state for form fields to ensure proper React Native Web input handling
  const [localPersonalDetails, setLocalPersonalDetails] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    suburb: '',
    postcode: '',
    phone: '',
    email: '',
  });
  
  const [localValuesWishes, setLocalValuesWishes] = useState({
    qualityOfLife: '',
    importantActivities: '',
    religiousBeliefs: '',
    culturalConsiderations: '',
    personalValues: '',
    fearsConcerns: '',
    additionalWishes: '',
  });

  useEffect(() => {
    const unsubscribe = advancedHealthDirectiveService.subscribe(() => {
      const doc = advancedHealthDirectiveService.getCurrentDocument();
      setDocument(doc);
      setProgress(advancedHealthDirectiveService.getWizardProgress());
      setCurrentStep(advancedHealthDirectiveService.getCurrentStep());
      
      // Sync local state with service state
      if (doc) {
        setLocalPersonalDetails({
          fullName: doc.personalDetails.fullName || '',
          dateOfBirth: doc.personalDetails.dateOfBirth || '',
          address: doc.personalDetails.address || '',
          suburb: doc.personalDetails.suburb || '',
          postcode: doc.personalDetails.postcode || '',
          phone: doc.personalDetails.phone || '',
          email: doc.personalDetails.email || '',
        });
        setLocalValuesWishes({
          qualityOfLife: doc.valuesAndWishes.qualityOfLife || '',
          importantActivities: doc.valuesAndWishes.importantActivities || '',
          religiousBeliefs: doc.valuesAndWishes.religiousBeliefs || '',
          culturalConsiderations: doc.valuesAndWishes.culturalConsiderations || '',
          personalValues: doc.valuesAndWishes.personalValues || '',
          fearsConcerns: doc.valuesAndWishes.fearsConcerns || '',
          additionalWishes: doc.valuesAndWishes.additionalWishes || '',
        });
      }
    });

    // Initialize document if needed
    if (!document) {
      advancedHealthDirectiveService.createDocument(true);
    }

    return unsubscribe;
  }, []);
  
  // Helper function to update personal details with local state sync
  const handlePersonalDetailChange = (field: string, value: string) => {
    setLocalPersonalDetails(prev => ({ ...prev, [field]: value }));
    advancedHealthDirectiveService.updatePersonalDetails({ [field]: value });
  };
  
  // Helper function to update values and wishes with local state sync
  const handleValuesWishesChange = (field: string, value: string) => {
    setLocalValuesWishes(prev => ({ ...prev, [field]: value }));
    advancedHealthDirectiveService.updateValuesAndWishes({ [field]: value });
  };

  const stepInfo = advancedHealthDirectiveService.getStepInfo(currentStep);
  const allSteps = advancedHealthDirectiveService.getAllSteps();

  const handleNext = () => {
    advancedHealthDirectiveService.nextStep();
  };

  const handlePrevious = () => {
    advancedHealthDirectiveService.previousStep();
  };

  const handleGoToStep = (step: AHDStep) => {
    advancedHealthDirectiveService.goToStep(step);
  };

  const handlePrintForm = () => {
    if (!document) {
      Alert.alert('Error', 'No document to print. Please complete the form first.');
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        ahdPDFExportService.printPDF(document);
      } else {
        Alert.alert('Info', 'Printing available on web browsers.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open print dialog.');
    }
  };

  const handleDownloadForm = () => {
    if (!document) {
      Alert.alert('Error', 'No document to download. Please complete the form first.');
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        ahdPDFExportService.downloadPDF(document);
        Alert.alert('Success', 'Form downloaded successfully.');
      } else {
        Alert.alert('Info', 'Download available on web browsers.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download form.');
    }
  };

  const handleSendEmail = async () => {
    try {
      const result = await advancedHealthDirectiveService.sendEmail();
      alert(result.message);
    } catch (error) {
      alert('Error sending email');
    }
  };

  const renderWelcome = () => (
    <View className="gap-6">
      <View className="items-center">
        <Text className="text-6xl mb-4">📋</Text>
        <Text className="text-2xl font-bold text-foreground text-center">
          Advance Health Directive
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Western Australia
        </Text>
      </View>

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-2">What is an AHD?</Text>
        <Text className="text-sm text-muted leading-relaxed">
          An Advance Health Directive (AHD) is a legal document that allows you to make decisions 
          about your future health care. It comes into effect if you become unable to make or 
          communicate decisions about your treatment.
        </Text>
      </View>

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-base font-semibold text-foreground mb-2">What you'll need:</Text>
        <View className="gap-2 mt-2">
          {[
            'Your personal details',
            'Details of your Treatment Decision Maker (optional)',
            'Your values and wishes about healthcare',
            'Your treatment preferences',
            'Two witnesses (18+ years, not your TDM)',
          ].map((item, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <Text className="text-success">✓</Text>
              <Text className="text-sm text-foreground">{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="bg-warning/10 rounded-xl p-4 border border-warning/30">
        <View className="flex-row items-start gap-2">
          <Text className="text-warning">⚠️</Text>
          <Text className="text-sm text-foreground flex-1">
            This form is for Western Australia only. The completed directive must be signed 
            by you and witnessed by two eligible witnesses to be legally valid.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPersonalDetails = () => (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Full Legal Name *</Text>
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3"
          style={{ color: colors.foreground }}
          placeholder="Enter your full name"
          placeholderTextColor={colors.muted}
          editable={true}
          value={localPersonalDetails.fullName}
          onChangeText={(text) => handlePersonalDetailChange('fullName', text)}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Date of Birth *</Text>
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3"
          style={{ color: colors.foreground }}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={colors.muted}
          editable={true}
          value={localPersonalDetails.dateOfBirth}
          onChangeText={(text) => handlePersonalDetailChange('dateOfBirth', text)}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Street Address *</Text>
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3"
          style={{ color: colors.foreground }}
          placeholder="Enter your street address"
          placeholderTextColor={colors.muted}
          editable={true}
          value={localPersonalDetails.address}
          onChangeText={(text) => handlePersonalDetailChange('address', text)}
        />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Text className="text-sm font-medium text-foreground">Suburb *</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3"
            style={{ color: colors.foreground }}
            placeholder="Suburb"
            placeholderTextColor={colors.muted}
            editable={true}
            value={localPersonalDetails.suburb}
            onChangeText={(text) => handlePersonalDetailChange('suburb', text)}
          />
        </View>
        <View className="w-24 gap-2">
          <Text className="text-sm font-medium text-foreground">Postcode</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3"
            style={{ color: colors.foreground }}
            placeholder="0000"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            editable={true}
            value={localPersonalDetails.postcode}
            onChangeText={(text) => handlePersonalDetailChange('postcode', text)}
          />
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Phone Number</Text>
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3"
          style={{ color: colors.foreground }}
          placeholder="Enter phone number"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          editable={true}
          value={localPersonalDetails.phone}
          onChangeText={(text) => handlePersonalDetailChange('phone', text)}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Email Address</Text>
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3"
          style={{ color: colors.foreground }}
          placeholder="Enter email address"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={true}
          value={localPersonalDetails.email}
          onChangeText={(text) => handlePersonalDetailChange('email', text)}
        />
      </View>
    </View>
  );

  const renderTreatmentDecisionMaker = () => (
    <View className="gap-4">
      <View className="bg-primary/10 rounded-xl p-4 border border-primary/30">
        <Text className="text-sm text-foreground">
          A Treatment Decision Maker (TDM) is someone you appoint to make healthcare decisions 
          on your behalf if you become unable to do so. This is optional but recommended.
        </Text>
      </View>

      {document?.treatmentDecisionMakers.map((tdm, index) => (
        <View key={tdm.id} className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">
              {tdm.isPrimary ? 'Primary TDM' : `TDM ${index + 1}`}
            </Text>
            <Pressable
              onPress={() => advancedHealthDirectiveService.removeTreatmentDecisionMaker(tdm.id)}
            >
              <Text className="text-error">Remove</Text>
            </Pressable>
          </View>
          <Text className="text-sm text-foreground">{tdm.fullName}</Text>
          <Text className="text-xs text-muted">{tdm.relationship}</Text>
        </View>
      ))}

      <Pressable
        onPress={() => {
          advancedHealthDirectiveService.addTreatmentDecisionMaker({
            fullName: 'New TDM',
            relationship: 'Family Member',
            address: '',
            phone: '',
            email: '',
            isPrimary: document?.treatmentDecisionMakers.length === 0,
            acceptedAppointment: false,
          });
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        <View className="bg-primary/20 rounded-xl py-4 items-center border border-primary/30">
          <Text className="text-primary font-semibold">+ Add Treatment Decision Maker</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderValuesAndWishes = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-sm text-muted mb-4">
          Describe what matters most to you about your quality of life and healthcare.
        </Text>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Quality of Life</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3"
              style={{ color: colors.foreground }}
              placeholder="What does quality of life mean to you?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={true}
              selectTextOnFocus={false}
              value={localValuesWishes.qualityOfLife}
              onChangeText={(text) => handleValuesWishesChange('qualityOfLife', text)}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Important Activities</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3"
              style={{ color: colors.foreground }}
              placeholder="What activities are important to you?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={true}
              selectTextOnFocus={false}
              value={localValuesWishes.importantActivities}
              onChangeText={(text) => handleValuesWishesChange('importantActivities', text)}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Religious/Spiritual Beliefs</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3"
              style={{ color: colors.foreground }}
              placeholder="Any religious or spiritual considerations?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={true}
              selectTextOnFocus={false}
              value={localValuesWishes.religiousBeliefs}
              onChangeText={(text) => handleValuesWishesChange('religiousBeliefs', text)}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Fears and Concerns</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-4 py-3"
              style={{ color: colors.foreground }}
              placeholder="What are your fears or concerns about healthcare?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={true}
              selectTextOnFocus={false}
              value={localValuesWishes.fearsConcerns}
              onChangeText={(text) => handleValuesWishesChange('fearsConcerns', text)}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderLifeSustainingTreatment = () => {
    const treatments = advancedHealthDirectiveService.getLifeSustainingTreatments();
    
    return (
      <View className="gap-4">
        <View className="bg-warning/10 rounded-xl p-4 border border-warning/30">
          <Text className="text-sm text-foreground">
            For each treatment, indicate your preference. These decisions will guide your 
            healthcare providers if you cannot communicate your wishes.
          </Text>
        </View>

        {treatments.map((treatment) => {
          const decision = advancedHealthDirectiveService.getTreatmentDecision(treatment.id);
          
          return (
            <View key={treatment.id} className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-1">{treatment.name}</Text>
              <Text className="text-xs text-muted mb-3">{treatment.description}</Text>
              
              <View className="gap-2">
                {PREFERENCE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => advancedHealthDirectiveService.updateTreatmentDecision(
                      treatment.id,
                      option.value
                    )}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View 
                      className="flex-row items-center gap-3 p-3 rounded-lg border"
                      style={{ 
                        backgroundColor: decision?.preference === option.value ? option.color + '20' : 'transparent',
                        borderColor: decision?.preference === option.value ? option.color : colors.border,
                      }}
                    >
                      <View 
                        className="w-5 h-5 rounded-full border-2 items-center justify-center"
                        style={{ borderColor: option.color }}
                      >
                        {decision?.preference === option.value && (
                          <View 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                      </View>
                      <Text className="text-sm text-foreground flex-1">{option.label}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderComplete = () => (
    <View className="gap-6">
      <View className="items-center">
        <View className="w-24 h-24 rounded-full bg-success/20 items-center justify-center mb-4">
          <Text className="text-5xl">✓</Text>
        </View>
        <Text className="text-2xl font-bold text-foreground text-center">
          Form Complete
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Your Advance Health Directive is ready
        </Text>
      </View>

      <View className="gap-3">
        <Pressable
          onPress={handlePrintForm}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <View className="bg-primary rounded-xl py-4 items-center">
            <Text className="text-white font-bold text-lg">🖨️ Print Form</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleSendEmail}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <View className="bg-success rounded-xl py-4 items-center">
            <Text className="text-white font-bold text-lg">📧 Email to Me</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleDownloadForm}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <View className="bg-success rounded-xl py-4 items-center">
            <Text className="text-white font-bold text-lg">📄 Download HTML</Text>
          </View>
        </Pressable>
      </View>

      <View className="bg-warning/10 rounded-xl p-4 border border-warning/30">
        <Text className="text-sm text-foreground font-semibold mb-2">Important Next Steps:</Text>
        <View className="gap-1">
          <Text className="text-sm text-foreground">1. Print the document</Text>
          <Text className="text-sm text-foreground">2. Sign in front of two witnesses</Text>
          <Text className="text-sm text-foreground">3. Have witnesses sign the document</Text>
          <Text className="text-sm text-foreground">4. Give copies to your TDM and doctor</Text>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome();
      case 'personal-details':
        return renderPersonalDetails();
      case 'treatment-decision-maker':
      case 'substitute-decision-maker':
        return renderTreatmentDecisionMaker();
      case 'values-wishes':
        return renderValuesAndWishes();
      case 'life-sustaining-treatment':
        return renderLifeSustainingTreatment();
      case 'complete':
        return renderComplete();
      default:
        return (
          <View className="bg-surface rounded-xl p-6 border border-border items-center">
            <Text className="text-lg font-semibold text-foreground">{stepInfo.title}</Text>
            <Text className="text-sm text-muted text-center mt-2">{stepInfo.description}</Text>
          </View>
        );
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary font-medium">← Back</Text>
            </Pressable>
            <Text className="text-sm text-muted">
              Step {stepInfo.index} of {stepInfo.total}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(stepInfo.index / stepInfo.total) * 100}%` }}
            />
          </View>

          {/* Step Title */}
          <View className="items-center py-2">
            <Text className="text-xl font-bold text-foreground">{stepInfo.title}</Text>
            <Text className="text-sm text-muted text-center mt-1">{stepInfo.description}</Text>
          </View>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep !== 'complete' && (
            <View className="flex-row gap-3 mt-4">
              {currentStep !== 'welcome' && (
                <Pressable
                  onPress={handlePrevious}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
                >
                  <View className="bg-surface rounded-xl py-4 items-center border border-border">
                    <Text className="text-foreground font-semibold">← Previous</Text>
                  </View>
                </Pressable>
              )}
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-primary rounded-xl py-4 items-center">
                  <Text className="text-white font-semibold">
                    {currentStep === 'review' ? 'Complete' : 'Next →'}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          <View className="h-20" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
