import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

// Lazy initialization to avoid SSR issues
let wizardService: any = null;
const getWizardService = () => {
  if (!wizardService) {
    const { routeCreationWizardService } = require('@/lib/services/route-creation-wizard.service');
    wizardService = routeCreationWizardService;
  }
  return wizardService;
};

interface HospitalLocation {
  id: string;
  name: string;
  category: string;
  position: { x: number; y: number };
  floor: number;
  description: string;
}

export default function RouteWizardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [routeName, setRouteName] = useState('');
  const [isAccessible, setIsAccessible] = useState(true);
  const [shareEmail, setShareEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const service = getWizardService();
    const newDraft = service.startNewRoute();
    setDraft(newDraft);

    const unsubscribe = service.subscribe((updatedDraft: any) => {
      setDraft(updatedDraft ? { ...updatedDraft } : null);
      if (updatedDraft) {
        setCurrentStep(updatedDraft.currentStep);
        setRouteName(updatedDraft.name || '');
      }
    });

    return () => unsubscribe();
  }, []);

  const getLocations = useCallback(() => {
    const service = getWizardService();
    if (searchQuery) {
      return service.searchLocations(searchQuery);
    }
    if (selectedCategory) {
      return service.getLocationsByCategory(selectedCategory);
    }
    return service.getHospitalLocations();
  }, [searchQuery, selectedCategory]);

  const handleSelectStart = (location: HospitalLocation) => {
    const service = getWizardService();
    service.setStartLocation(location);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleSelectEnd = (location: HospitalLocation) => {
    const service = getWizardService();
    service.setEndLocation(location);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleAddWaypoint = (location: HospitalLocation) => {
    const service = getWizardService();
    service.addWaypoint(location);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleRemoveWaypoint = (index: number) => {
    getWizardService().removeWaypoint(index);
  };

  const handleSave = () => {
    const service = getWizardService();
    service.setRouteName(routeName);
    service.setAccessible(isAccessible);
    service.setNotes(notes);

    const validation = service.validateDraft();
    if (!validation.isValid) {
      Alert.alert('Cannot Save', validation.errors.join('\n'));
      return;
    }

    const saved = service.saveRoute();
    if (saved) {
      Alert.alert('Route Saved', `"${saved.name}" has been saved to your routes.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'Failed to save route. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Route', 'Discard this route?', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          getWizardService().cancelRoute();
          router.back();
        },
      },
    ]);
  };

  const handleAddShare = () => {
    if (shareEmail.trim() && shareEmail.includes('@')) {
      getWizardService().addShareRecipient(shareEmail.trim());
      setShareEmail('');
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      entrance: '🚪',
      emergency: '🚨',
      department: '🏥',
      ward: '🛏️',
      service: '📋',
      facility: '🏢',
    };
    return icons[category] || '📍';
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map(step => (
        <TouchableOpacity
          key={step}
          style={[
            styles.stepDot,
            {
              backgroundColor: step === currentStep ? colors.primary : step < currentStep ? colors.success : colors.border,
            },
          ]}
          onPress={() => {
            if (step <= currentStep) {
              getWizardService().goToStep(step);
            }
          }}
        >
          <Text style={[styles.stepDotText, { color: step <= currentStep ? '#fff' : colors.muted }]}>
            {step < currentStep ? '✓' : step}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStepTitle = () => {
    const titles = ['', 'Select Start', 'Select Destination', 'Add Waypoints', 'Name & Options', 'Preview & Save'];
    return (
      <View style={styles.stepTitleContainer}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          Step {currentStep}: {titles[currentStep]}
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          {currentStep === 1 && 'Choose where your route begins'}
          {currentStep === 2 && 'Choose your destination'}
          {currentStep === 3 && 'Add stops along the way (optional)'}
          {currentStep === 4 && 'Name your route and set preferences'}
          {currentStep === 5 && 'Review and save your custom route'}
        </Text>
      </View>
    );
  };

  const renderLocationPicker = (onSelect: (loc: HospitalLocation) => void) => {
    const locations = getLocations();
    const categories = getWizardService().getCategories();

    return (
      <View style={styles.locationPicker}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Search locations..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="done"
        />

        {!searchQuery && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, { backgroundColor: !selectedCategory ? colors.primary : colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, { color: !selectedCategory ? '#fff' : colors.foreground }]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, { backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface, borderColor: colors.border }]}
                onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              >
                <Text style={[styles.categoryChipText, { color: selectedCategory === cat.id ? '#fff' : colors.foreground }]}>
                  {cat.icon} {cat.name} ({cat.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <FlatList
          data={locations}
          keyExtractor={(item: HospitalLocation) => item.id}
          style={styles.locationList}
          renderItem={({ item }: { item: HospitalLocation }) => (
            <TouchableOpacity
              style={[styles.locationItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>{getCategoryIcon(item.category)}</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.locationDesc, { color: colors.muted }]}>{item.description}</Text>
                <Text style={[styles.locationFloor, { color: colors.primary }]}>
                  {item.floor === 0 ? 'Ground Floor' : `Floor ${item.floor}`}
                </Text>
              </View>
              <Text style={[styles.selectArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderWaypointStep = () => (
    <View style={styles.waypointStep}>
      {draft?.waypoints?.length > 0 && (
        <View style={[styles.waypointList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.waypointListTitle, { color: colors.foreground }]}>Current Waypoints</Text>
          {draft.waypoints.map((wp: HospitalLocation, index: number) => (
            <View key={`wp-${index}`} style={[styles.waypointItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.waypointNumber, { color: colors.primary }]}>{index + 1}</Text>
              <Text style={[styles.waypointName, { color: colors.foreground }]}>{wp.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveWaypoint(index)}>
                <Text style={[styles.removeBtn, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.waypointHint, { color: colors.muted }]}>
        {draft?.waypoints?.length === 0 ? 'No waypoints added. You can skip this step.' : 'Add more waypoints or continue.'}
      </Text>

      {renderLocationPicker(handleAddWaypoint)}
    </View>
  );

  const renderNameStep = () => (
    <ScrollView style={styles.nameStep}>
      <View style={[styles.formGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Route Name</Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
          placeholder="e.g., My Daily Route"
          placeholderTextColor={colors.muted}
          value={routeName}
          onChangeText={(text) => {
            setRouteName(text);
            getWizardService().setRouteName(text);
          }}
          returnKeyType="done"
        />
      </View>

      <View style={[styles.formGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Accessible Route</Text>
            <Text style={[styles.formHint, { color: colors.muted }]}>Avoids stairs and narrow passages</Text>
          </View>
          <Switch
            value={isAccessible}
            onValueChange={(val) => {
              setIsAccessible(val);
              getWizardService().setAccessible(val);
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.formGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Notes (Optional)</Text>
        <TextInput
          style={[styles.formTextArea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Add any notes about this route..."
          placeholderTextColor={colors.muted}
          value={notes}
          onChangeText={(text) => {
            setNotes(text);
            getWizardService().setNotes(text);
          }}
          multiline
          numberOfLines={3}
          returnKeyType="done"
        />
      </View>

      <View style={[styles.formGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Share with Family</Text>
        <Text style={[styles.formHint, { color: colors.muted }]}>Send this route to family members via email</Text>
        <View style={styles.shareInputRow}>
          <TextInput
            style={[styles.shareInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="email@example.com"
            placeholderTextColor={colors.muted}
            value={shareEmail}
            onChangeText={setShareEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleAddShare}
          />
          <TouchableOpacity
            style={[styles.shareAddBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddShare}
          >
            <Text style={styles.shareAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {draft?.sharedWith?.map((email: string, i: number) => (
          <View key={i} style={[styles.shareChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.shareChipText, { color: colors.foreground }]}>{email}</Text>
            <TouchableOpacity onPress={() => getWizardService().removeShareRecipient(email)}>
              <Text style={[styles.shareChipRemove, { color: colors.error }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPreviewStep = () => {
    const preview = getWizardService().getRoutePreview();
    if (!preview) return null;

    return (
      <ScrollView style={styles.previewStep}>
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>{routeName || 'Unnamed Route'}</Text>

          <View style={styles.previewRoute}>
            <View style={styles.previewPoint}>
              <View style={[styles.previewDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.previewPointText, { color: colors.foreground }]}>{draft?.startLocation?.name}</Text>
            </View>

            {draft?.waypoints?.map((wp: HospitalLocation, i: number) => (
              <View key={i} style={styles.previewPoint}>
                <View style={[styles.previewDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.previewPointText, { color: colors.muted }]}>{wp.name}</Text>
              </View>
            ))}

            <View style={styles.previewPoint}>
              <View style={[styles.previewDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.previewPointText, { color: colors.foreground }]}>{draft?.endLocation?.name}</Text>
            </View>
          </View>

          <View style={styles.previewStats}>
            <View style={[styles.previewStat, { backgroundColor: colors.background }]}>
              <Text style={[styles.previewStatValue, { color: colors.primary }]}>{preview.totalDistance}m</Text>
              <Text style={[styles.previewStatLabel, { color: colors.muted }]}>Distance</Text>
            </View>
            <View style={[styles.previewStat, { backgroundColor: colors.background }]}>
              <Text style={[styles.previewStatValue, { color: colors.primary }]}>
                {preview.estimatedTime < 60 ? `${preview.estimatedTime}s` : `${Math.ceil(preview.estimatedTime / 60)}min`}
              </Text>
              <Text style={[styles.previewStatLabel, { color: colors.muted }]}>Est. Time</Text>
            </View>
            <View style={[styles.previewStat, { backgroundColor: colors.background }]}>
              <Text style={[styles.previewStatValue, { color: colors.primary }]}>{preview.waypointCount}</Text>
              <Text style={[styles.previewStatLabel, { color: colors.muted }]}>Stops</Text>
            </View>
          </View>

          <View style={styles.previewFlags}>
            <View style={[styles.previewFlag, { backgroundColor: isAccessible ? colors.success + '20' : colors.warning + '20' }]}>
              <Text style={{ color: isAccessible ? colors.success : colors.warning }}>
                {isAccessible ? '♿ Accessible Route' : '⚠️ May not be accessible'}
              </Text>
            </View>
            {draft?.sharedWith?.length > 0 && (
              <View style={[styles.previewFlag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ color: colors.primary }}>
                  📤 Shared with {draft.sharedWith.length} {draft.sharedWith.length === 1 ? 'person' : 'people'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderSelectedInfo = () => {
    if (!draft) return null;
    const items = [];
    if (draft.startLocation) {
      items.push({ label: 'From', value: draft.startLocation.name, color: colors.success });
    }
    if (draft.endLocation) {
      items.push({ label: 'To', value: draft.endLocation.name, color: colors.error });
    }
    if (items.length === 0) return null;

    return (
      <View style={[styles.selectedInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item, i) => (
          <View key={i} style={styles.selectedItem}>
            <View style={[styles.selectedDot, { backgroundColor: item.color }]} />
            <Text style={[styles.selectedLabel, { color: colors.muted }]}>{item.label}: </Text>
            <Text style={[styles.selectedValue, { color: colors.foreground }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.headerBtn, { color: colors.error }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Route</Text>
        <View style={{ width: 60 }} />
      </View>

      {renderStepIndicator()}
      {renderStepTitle()}
      {renderSelectedInfo()}

      <View style={styles.content}>
        {currentStep === 1 && renderLocationPicker(handleSelectStart)}
        {currentStep === 2 && renderLocationPicker(handleSelectEnd)}
        {currentStep === 3 && renderWaypointStep()}
        {currentStep === 4 && renderNameStep()}
        {currentStep === 5 && renderPreviewStep()}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => getWizardService().previousStep()}
          >
            <Text style={[styles.footerBtnText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {currentStep < 5 ? (
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: colors.primary }]}
            onPress={() => getWizardService().nextStep()}
          >
            <Text style={[styles.footerBtnText, { color: '#fff' }]}>
              {currentStep === 3 ? 'Skip / Next' : 'Next'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: colors.success }]}
            onPress={handleSave}
          >
            <Text style={[styles.footerBtnText, { color: '#fff' }]}>Save Route</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerBtn: { fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 12 },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { fontSize: 14, fontWeight: '600' },
  stepTitleContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  stepTitle: { fontSize: 18, fontWeight: '700' },
  stepSubtitle: { fontSize: 14, marginTop: 2 },
  content: { flex: 1 },
  locationPicker: { flex: 1, paddingHorizontal: 16 },
  searchInput: { height: 44, borderRadius: 10, paddingHorizontal: 14, fontSize: 16, borderWidth: 1, marginBottom: 8 },
  categoryScroll: { marginBottom: 8, maxHeight: 40 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1 },
  categoryChipText: { fontSize: 13, fontWeight: '500' },
  locationList: { flex: 1 },
  locationItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1 },
  locationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  locationIconText: { fontSize: 20 },
  locationInfo: { flex: 1, marginLeft: 12 },
  locationName: { fontSize: 16, fontWeight: '600' },
  locationDesc: { fontSize: 13, marginTop: 2 },
  locationFloor: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  selectArrow: { fontSize: 20, fontWeight: '700', marginLeft: 8 },
  selectedInfo: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 16, borderBottomWidth: 0.5 },
  selectedItem: { flexDirection: 'row', alignItems: 'center' },
  selectedDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  selectedLabel: { fontSize: 13 },
  selectedValue: { fontSize: 13, fontWeight: '600' },
  waypointStep: { flex: 1, paddingHorizontal: 0 },
  waypointList: { marginHorizontal: 16, padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  waypointListTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  waypointItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5 },
  waypointNumber: { fontSize: 16, fontWeight: '700', width: 24 },
  waypointName: { flex: 1, fontSize: 15 },
  removeBtn: { fontSize: 13, fontWeight: '500' },
  waypointHint: { fontSize: 13, paddingHorizontal: 16, marginBottom: 8 },
  nameStep: { flex: 1, paddingHorizontal: 16 },
  formGroup: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  formLabel: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  formHint: { fontSize: 13, marginBottom: 8 },
  formInput: { height: 44, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, borderWidth: 1 },
  formTextArea: { height: 80, borderRadius: 8, paddingHorizontal: 12, paddingTop: 10, fontSize: 16, borderWidth: 1, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shareInputRow: { flexDirection: 'row', gap: 8 },
  shareInput: { flex: 1, height: 44, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, borderWidth: 1 },
  shareAddBtn: { height: 44, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shareAddBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  shareChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 8, borderWidth: 1 },
  shareChipText: { flex: 1, fontSize: 14 },
  shareChipRemove: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  previewStep: { flex: 1, paddingHorizontal: 16 },
  previewCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  previewTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  previewRoute: { gap: 4, marginBottom: 16 },
  previewPoint: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  previewDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  previewPointText: { fontSize: 15 },
  previewStats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  previewStat: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  previewStatValue: { fontSize: 18, fontWeight: '700' },
  previewStatLabel: { fontSize: 12, marginTop: 2 },
  previewFlags: { gap: 8 },
  previewFlag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5 },
  footerBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  footerBtnText: { fontSize: 16, fontWeight: '600' },
});
