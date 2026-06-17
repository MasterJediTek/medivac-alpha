/**
 * Visitor Pre-Registration Screen
 * Allows visitors to pre-register appointments and get QR codes for express check-in
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { visitorPreRegistrationService, AppointmentConfirmation } from '@/lib/services/visitor-preregistration.service';

type FormStep = 'form' | 'confirmation';

export default function VisitorPreRegistrationScreen() {
  const colors = useColors();
  const [step, setStep] = useState<FormStep>('form');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<AppointmentConfirmation | null>(null);

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [department, setDepartment] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [relationship, setRelationship] = useState<'family' | 'friend' | 'colleague' | 'other'>('family');
  const [notes, setNotes] = useState('');

  const departments = [
    'Emergency',
    'Radiology',
    'Pharmacy',
    'Maternity',
    'Paediatrics',
    'Mental Health',
    'Surgery',
    'Cardiology',
  ];

  const relationships = ['family', 'friend', 'colleague', 'other'] as const;

  const handleSubmit = async () => {
    if (!visitorName || !visitorEmail || !patientName || !department || !appointmentDate || !appointmentTime) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await visitorPreRegistrationService.registerAppointment({
        visitorName,
        visitorEmail,
        visitorPhone,
        patientName,
        patientId,
        department,
        appointmentDate,
        appointmentTime,
        purpose,
        relationship,
        notes,
      });

      setConfirmation(result);
      setStep('confirmation');
    } catch (error) {
      console.error('[Visitor Registration] Error:', error);
      alert('Failed to register appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setConfirmation(null);
    setVisitorName('');
    setVisitorEmail('');
    setVisitorPhone('');
    setPatientName('');
    setPatientId('');
    setDepartment('');
    setAppointmentDate('');
    setAppointmentTime('');
    setPurpose('');
    setRelationship('family');
    setNotes('');
  };

  if (step === 'confirmation' && confirmation) {
    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
          {/* Success Header */}
          <View className="items-center mb-8">
            <View className="bg-success/20 rounded-full w-20 h-20 items-center justify-center mb-4">
              <Text className="text-4xl">✓</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Registration Confirmed
            </Text>
            <Text className="text-muted text-center">
              Your appointment has been successfully registered
            </Text>
          </View>

          {/* Confirmation Number */}
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
            <Text className="text-muted text-sm mb-2">Confirmation Number</Text>
            <Text className="text-foreground font-mono font-bold text-xl mb-3">
              {confirmation.confirmationNumber}
            </Text>
            <Pressable className="bg-primary py-2 rounded-lg items-center">
              <Text className="text-white font-semibold text-sm">Copy Number</Text>
            </Pressable>
          </View>

          {/* QR Code */}
          {confirmation.qrCode && (
            <View className="bg-surface rounded-2xl p-4 mb-4 border border-border items-center">
              <Text className="text-foreground font-semibold mb-3">QR Code for Check-In</Text>
              <Image
                source={{ uri: confirmation.qrCode }}
                style={{ width: 200, height: 200 }}
                className="rounded-lg mb-3"
              />
              <Pressable className="bg-primary px-4 py-2 rounded-lg">
                <Text className="text-white font-semibold text-sm">Save QR Code</Text>
              </Pressable>
            </View>
          )}

          {/* Instructions */}
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
            <Text className="text-foreground font-semibold mb-3">Check-In Instructions</Text>
            {confirmation.instructions.map((instruction, idx) => (
              <View key={idx} className="flex-row gap-3 mb-2">
                <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                </View>
                <Text className="flex-1 text-foreground pt-0.5 text-sm">{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Estimated Check-In Time */}
          <View className="bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/30">
            <Text className="text-muted text-sm mb-1">Estimated Check-In Time</Text>
            <Text className="text-primary font-bold text-lg">
              {Math.round(confirmation.estimatedCheckInTime / 60)} minutes
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Pressable className="bg-primary py-3 rounded-lg items-center">
              <Text className="text-white font-semibold">Share Confirmation</Text>
            </Pressable>
            <Pressable
              onPress={handleReset}
              className="bg-surface py-3 rounded-lg items-center border border-border"
            >
              <Text className="text-foreground font-semibold">Register Another Visitor</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Visitor Pre-Registration
          </Text>
          <Text className="text-muted">
            Register your appointment for express check-in
          </Text>
        </View>

        {/* Form */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          {/* Visitor Information */}
          <Text className="text-lg font-semibold text-foreground mb-3">Visitor Information</Text>

          <TextInput
            placeholder="Full Name *"
            value={visitorName}
            onChangeText={setVisitorName}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
          />

          <TextInput
            placeholder="Email Address *"
            value={visitorEmail}
            onChangeText={setVisitorEmail}
            keyboardType="email-address"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
          />

          <TextInput
            placeholder="Phone Number"
            value={visitorPhone}
            onChangeText={setVisitorPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-4 text-foreground border border-border"
          />

          {/* Relationship */}
          <Text className="text-muted text-sm mb-2">Relationship to Patient</Text>
          <View className="flex-row gap-2 mb-4">
            {relationships.map(rel => (
              <Pressable
                key={rel}
                onPress={() => setRelationship(rel)}
                className={cn(
                  'flex-1 py-2 rounded-lg',
                  relationship === rel ? 'bg-primary' : 'bg-background border border-border'
                )}
              >
                <Text
                  className={cn(
                    'text-center font-medium text-sm',
                    relationship === rel ? 'text-white' : 'text-foreground'
                  )}
                >
                  {rel.charAt(0).toUpperCase() + rel.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Patient Information */}
          <Text className="text-lg font-semibold text-foreground mb-3 mt-4">Patient Information</Text>

          <TextInput
            placeholder="Patient Name *"
            value={patientName}
            onChangeText={setPatientName}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
          />

          <TextInput
            placeholder="Patient ID"
            value={patientId}
            onChangeText={setPatientId}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-4 text-foreground border border-border"
          />

          {/* Appointment Information */}
          <Text className="text-lg font-semibold text-foreground mb-3 mt-4">Appointment Information</Text>

          <Text className="text-muted text-sm mb-2">Department *</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {departments.map(dept => (
              <Pressable
                key={dept}
                onPress={() => setDepartment(dept)}
                className={cn(
                  'py-2 px-3 rounded-lg',
                  department === dept ? 'bg-primary' : 'bg-background border border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-medium text-sm',
                    department === dept ? 'text-white' : 'text-foreground'
                  )}
                >
                  {dept}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            placeholder="Date (YYYY-MM-DD) *"
            value={appointmentDate}
            onChangeText={setAppointmentDate}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
          />

          <TextInput
            placeholder="Time (HH:MM) *"
            value={appointmentTime}
            onChangeText={setAppointmentTime}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-4 text-foreground border border-border"
          />

          {/* Purpose & Notes */}
          <TextInput
            placeholder="Purpose of Visit"
            value={purpose}
            onChangeText={setPurpose}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-3 text-foreground border border-border"
          />

          <TextInput
            placeholder="Additional Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg p-3 mb-4 text-foreground border border-border"
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={cn(
              'py-3 rounded-lg items-center',
              loading ? 'bg-muted opacity-50' : 'bg-primary'
            )}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Register Appointment</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
