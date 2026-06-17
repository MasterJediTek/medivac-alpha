/**
 * Public Landing Page - MediVac WACHS Virtual Hospital
 * v9.18 - Main staging page accessible without authentication.
 * Features interactive hospital map, navigation, and app install/sideloading.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

import { WaitTimeService, type DepartmentWaitTime } from '@/lib/services/wait-time.service';
import { PathAnimationService, type NavigationState } from '@/lib/services/path-animation.service';
import { FloorMapService } from '@/lib/services/floor-map.service';
import { WaitAlertService, type WaitAlertSubscription, type WaitAlertNotification } from '@/lib/services/wait-alert.service';
import { VisitorHistoryService } from '@/lib/services/visitor-history.service';
import { AccessibilityOverlayService, type AccessibilityFeature } from '@/lib/services/accessibility-overlay.service';
import { VisitorAnalyticsService } from '@/lib/services/visitor-analytics.service';

// ============================================================================
// HOSPITAL DATA (self-contained, no auth dependencies)
// ============================================================================

interface HospitalBuilding {
  id: string;
  name: string;
  icon: string;
  category: 'emergency' | 'department' | 'ward' | 'service' | 'facility' | 'entrance';
  position: { x: number; y: number };
  color: string;
  services: string[];
  hours: string;
  floor: string;
  description: string;
  isAccessible: boolean;
}

interface NavDirection {
  instruction: string;
  icon: string;
  distance: string;
}

const BUILDINGS: HospitalBuilding[] = [
  {
    id: 'main-entrance', name: 'Main Entrance', icon: '🚪', category: 'entrance',
    position: { x: 50, y: 85 }, color: '#F59E0B',
    services: ['Reception', 'Information Desk', 'Wheelchair Access'],
    hours: '24/7', floor: 'Ground', description: 'Primary hospital entrance with reception and information desk',
    isAccessible: true,
  },
  {
    id: 'emergency', name: 'Emergency Dept', icon: '🚨', category: 'emergency',
    position: { x: 18, y: 35 }, color: '#EF4444',
    services: ['Triage', 'Resuscitation', 'Acute Care', 'Ambulance Bay'],
    hours: '24/7', floor: 'Ground', description: '24/7 emergency and trauma care services',
    isAccessible: true,
  },
  {
    id: 'main-hospital', name: 'Main Hospital', icon: '🏥', category: 'department',
    position: { x: 50, y: 40 }, color: '#0077B6',
    services: ['Administration', 'Medical Records', 'Cafeteria', 'Gift Shop'],
    hours: '24/7', floor: 'Ground-3', description: 'Central hospital building with administration and support services',
    isAccessible: true,
  },
  {
    id: 'maternity', name: 'Maternity Ward', icon: '👶', category: 'ward',
    position: { x: 72, y: 25 }, color: '#EC4899',
    services: ['Labour & Delivery', 'Postnatal Care', 'Nursery', 'Antenatal'],
    hours: '24/7', floor: 'Level 1', description: 'Maternity and birthing suite with postnatal care',
    isAccessible: true,
  },
  {
    id: 'paediatrics', name: 'Paediatrics', icon: '🧸', category: 'ward',
    position: { x: 78, y: 48 }, color: '#8B5CF6',
    services: ["Children's Ward", 'Playroom', 'Family Room'],
    hours: '24/7', floor: 'Level 1', description: "Children's ward with dedicated play and family areas",
    isAccessible: true,
  },
  {
    id: 'mental-health', name: 'Mental Health', icon: '🧠', category: 'department',
    position: { x: 22, y: 60 }, color: '#10B981',
    services: ['Counseling', 'Psychiatric Care', 'Group Therapy', 'Crisis Support'],
    hours: '8am-6pm', floor: 'Ground', description: 'Mental health services including counseling and crisis support',
    isAccessible: true,
  },
  {
    id: 'radiology', name: 'Radiology', icon: '📷', category: 'department',
    position: { x: 38, y: 55 }, color: '#6366F1',
    services: ['X-Ray', 'CT Scan', 'Ultrasound', 'MRI'],
    hours: '8am-5pm', floor: 'Ground', description: 'Diagnostic imaging including X-ray, CT, MRI and ultrasound',
    isAccessible: true,
  },
  {
    id: 'pathology', name: 'Pathology Lab', icon: '🔬', category: 'department',
    position: { x: 62, y: 55 }, color: '#F59E0B',
    services: ['Blood Tests', 'Specimen Collection', 'Lab Analysis'],
    hours: '7am-5pm', floor: 'Ground', description: 'Pathology and laboratory testing services',
    isAccessible: true,
  },
  {
    id: 'pharmacy', name: 'Pharmacy', icon: '💊', category: 'service',
    position: { x: 55, y: 68 }, color: '#22C55E',
    services: ['Prescriptions', 'Medication Advice', 'Supplies'],
    hours: '8am-6pm', floor: 'Ground', description: 'Hospital pharmacy for prescriptions and medication advice',
    isAccessible: true,
  },
  {
    id: 'physiotherapy', name: 'Physiotherapy', icon: '🏃', category: 'department',
    position: { x: 82, y: 65 }, color: '#14B8A6',
    services: ['Rehabilitation', 'Exercise Therapy', 'Hydrotherapy'],
    hours: '8am-5pm', floor: 'Ground', description: 'Rehabilitation and physiotherapy services',
    isAccessible: true,
  },
  {
    id: 'helipad', name: 'Helipad', icon: '🚁', category: 'emergency',
    position: { x: 15, y: 15 }, color: '#EF4444',
    services: ['Air Ambulance', 'Emergency Transport'],
    hours: '24/7', floor: 'Roof', description: 'Emergency helicopter landing pad for air ambulance',
    isAccessible: false,
  },
  {
    id: 'parking', name: 'Visitor Parking', icon: '🅿️', category: 'facility',
    position: { x: 85, y: 85 }, color: '#64748B',
    services: ['Visitor Parking', 'Disabled Parking', 'Staff Parking'],
    hours: '24/7', floor: 'Ground', description: 'Parking facilities for visitors, disabled and staff',
    isAccessible: true,
  },
  {
    id: 'garden', name: 'Therapy Garden', icon: '🌿', category: 'facility',
    position: { x: 12, y: 75 }, color: '#22C55E',
    services: ['Relaxation Area', 'Walking Paths', 'Seating'],
    hours: '6am-8pm', floor: 'Ground', description: 'Peaceful therapy garden with walking paths and seating areas',
    isAccessible: true,
  },
  {
    id: 'chapel', name: 'Chapel', icon: '🕊️', category: 'facility',
    position: { x: 90, y: 30 }, color: '#A855F7',
    services: ['Spiritual Care', 'Meditation Room', 'Multi-faith'],
    hours: '24/7', floor: 'Ground', description: 'Multi-faith chapel and meditation space',
    isAccessible: true,
  },
  {
    id: 'icu', name: 'ICU', icon: '❤️‍🩹', category: 'ward',
    position: { x: 42, y: 25 }, color: '#DC2626',
    services: ['Intensive Care', 'Critical Monitoring', 'Ventilation'],
    hours: '24/7', floor: 'Level 1', description: 'Intensive Care Unit for critical patients',
    isAccessible: true,
  },
  {
    id: 'surgical', name: 'Surgical Ward', icon: '🔪', category: 'ward',
    position: { x: 55, y: 20 }, color: '#0EA5E9',
    services: ['Operating Theatres', 'Pre-Op', 'Recovery'],
    hours: '24/7', floor: 'Level 2', description: 'Surgical ward with operating theatres and recovery',
    isAccessible: true,
  },
  {
    id: 'cafeteria', name: 'Cafeteria', icon: '🍽️', category: 'facility',
    position: { x: 65, y: 75 }, color: '#F97316',
    services: ['Meals', 'Coffee', 'Vending Machines'],
    hours: '7am-7pm', floor: 'Ground', description: 'Hospital cafeteria with meals and beverages',
    isAccessible: true,
  },
  {
    id: 'staff-entrance', name: 'Staff Entrance', icon: '🔑', category: 'entrance',
    position: { x: 88, y: 50 }, color: '#64748B',
    services: ['Badge Access', 'Staff Lockers'],
    hours: '24/7', floor: 'Ground', description: 'Staff-only entrance with badge access',
    isAccessible: true,
  },
];

const ACCESSIBILITY_MARKERS = [
  { id: 'elev-1', type: 'elevator', icon: '🛗', position: { x: 48, y: 42 }, name: 'Main Elevator A' },
  { id: 'elev-2', type: 'elevator', icon: '🛗', position: { x: 70, y: 38 }, name: 'East Wing Elevator' },
  { id: 'ramp-1', type: 'ramp', icon: '♿', position: { x: 50, y: 80 }, name: 'Main Entrance Ramp' },
  { id: 'ramp-2', type: 'ramp', icon: '♿', position: { x: 20, y: 40 }, name: 'Emergency Ramp' },
  { id: 'wc-1', type: 'restroom', icon: '🚻', position: { x: 45, y: 50 }, name: 'Accessible Restroom - Main' },
  { id: 'wc-2', type: 'restroom', icon: '🚻', position: { x: 75, y: 55 }, name: 'Accessible Restroom - East' },
  { id: 'wc-3', type: 'restroom', icon: '🚻', position: { x: 30, y: 65 }, name: 'Accessible Restroom - West' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🗺️' },
  { id: 'emergency', label: 'Emergency', icon: '🚨' },
  { id: 'department', label: 'Departments', icon: '🏥' },
  { id: 'ward', label: 'Wards', icon: '🛏️' },
  { id: 'service', label: 'Services', icon: '📋' },
  { id: 'facility', label: 'Facilities', icon: '🏢' },
  { id: 'entrance', label: 'Entrances', icon: '🚪' },
];

// JEDI Portal Links
const JEDI_PORTALS = [
  { name: 'JediTek Main', url: 'https://jeditek.com.au', icon: '🏠', color: '#3B82F6' },
  { name: 'WONGI Station', url: 'https://jeditek.net', icon: '📡', color: '#16A34A' },
  { name: 'Nexus Beacon', url: 'https://nexus.jeditek.net', icon: '🔔', color: '#F59E0B' },
  { name: 'AlphaPrime', url: 'https://alphaprime.jeditek.com.au', icon: '⚡', color: '#9333EA' },
  { name: 'iSkoolEDU', url: 'https://iskooledu.jeditek.com.au', icon: '📚', color: '#DC2626' },
  { name: 'MediVac One', url: 'https://wongi.com.au', icon: '🏥', color: '#0891B2' },
  { name: 'Master Class', url: 'https://master.jeditek.com.au', icon: '🎓', color: '#EC4899' },
  { name: 'SMPO.ink KB', url: 'https://smpo-ink.manus.space', icon: '📖', color: '#6366F1' },
  { name: 'JEDI Systems', url: 'https://jeditek.org', icon: '⚙️', color: '#14B8A6' },
  { name: 'Death Star VIP', url: 'https://death-star.vip', icon: '🌑', color: '#1F2937' },
  { name: 'Falcon Command', url: 'https://falcon.manus.space', icon: '🦅', color: '#78350F' },
  { name: 'JEDI Church', url: 'https://jedi-church.manus.space', icon: '⛪', color: '#7C3AED' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function LandingScreen() {
  const colors = useColors();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState<HospitalBuilding | null>(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showInstallPanel, setShowInstallPanel] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<HospitalBuilding | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [waitTimes, setWaitTimes] = useState<Map<string, DepartmentWaitTime>>(new Map());
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [showNavPanel, setShowNavPanel] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [alertSubs, setAlertSubs] = useState<WaitAlertSubscription[]>([]);
  const [alertNotifications, setAlertNotifications] = useState<WaitAlertNotification[]>([]);
  const [showAlertBanner, setShowAlertBanner] = useState<WaitAlertNotification | null>(null);
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<AccessibilityFeature[]>([]);
  const [showAccessOverlay, setShowAccessOverlay] = useState(false);
  const waitServiceRef = useRef<WaitTimeService | null>(null);
  const pathServiceRef = useRef<PathAnimationService | null>(null);
  const floorServiceRef = useRef<FloorMapService | null>(null);
  const alertServiceRef = useRef<WaitAlertService | null>(null);
  const historyServiceRef = useRef<VisitorHistoryService | null>(null);

  // Initialize wait times and path animation
  useEffect(() => {
    const ws = WaitTimeService.getInstance();
    waitServiceRef.current = ws;
    const times = ws.refreshAll();
    const map = new Map<string, DepartmentWaitTime>();
    times.forEach(t => map.set(t.departmentId, t));
    setWaitTimes(map);

    const unsub = ws.subscribe((newTimes) => {
      const m = new Map<string, DepartmentWaitTime>();
      newTimes.forEach(t => m.set(t.departmentId, t));
      setWaitTimes(m);
    });
    ws.startAutoRefresh(30000);

    const ps = PathAnimationService.getInstance();
    pathServiceRef.current = ps;
    const unsubNav = ps.subscribe((state) => {
      setNavState({ ...state });
    });

    // Floor map service
    const fs = FloorMapService.getInstance();
    floorServiceRef.current = fs;
    fs.initializeBuildings(BUILDINGS.map(b => ({ id: b.id, name: b.name, floor: b.floor })));

    // Wait alert service
    const as = WaitAlertService.getInstance();
    alertServiceRef.current = as;
    setAlertSubs(as.getAllSubscriptions());
    const unsubAlertChange = as.onSubscriptionChange((subs) => setAlertSubs(subs));
    const unsubAlert = as.onAlert((notif) => {
      setAlertNotifications(prev => [notif, ...prev]);
      setShowAlertBanner(notif);
      setTimeout(() => setShowAlertBanner(null), 5000);
    });

    // Visitor history service
    historyServiceRef.current = VisitorHistoryService.getInstance();

    // Accessibility overlay service
    const aos = AccessibilityOverlayService.getInstance();

    return () => {
      unsub();
      ws.stopAutoRefresh();
      unsubNav();
      unsubAlertChange();
      unsubAlert();
    };
  }, []);

  // Filter buildings
  // Floor data
  const FLOOR_TABS = [
    { id: 'all', label: 'All Floors', short: 'All', color: '#6366F1' },
    { id: 'ground', label: 'Ground', short: 'G', color: '#22C55E' },
    { id: 'level1', label: 'Level 1', short: 'L1', color: '#3B82F6' },
    { id: 'level2', label: 'Level 2', short: 'L2', color: '#F59E0B' },
  ];

  const FLOOR_MAP: Record<string, string> = { 'Ground': 'ground', 'Level 1': 'level1', 'Level 2': 'level2' };

  const filteredBuildings = useMemo(() => {
    let result = BUILDINGS;
    if (selectedFloor !== 'all') {
      result = result.filter(b => (FLOOR_MAP[b.floor] || 'ground') === selectedFloor);
    }
    if (selectedCategory !== 'all') {
      result = result.filter(b => b.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.services.some(s => s.toLowerCase().includes(q)) ||
        b.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selectedCategory, searchQuery, selectedFloor]);

  // Alert subscription helpers
  const handleSubscribeAlert = useCallback((building: HospitalBuilding, threshold: number) => {
    alertServiceRef.current?.subscribe(building.id, building.name, threshold);
  }, []);

  const handleUnsubscribeAlert = useCallback((building: HospitalBuilding) => {
    const sub = alertServiceRef.current?.getSubscriptionForDepartment(building.id);
    if (sub) alertServiceRef.current?.removeSubscription(sub.id);
  }, []);

  // Generate directions from main entrance to building
  const getDirections = useCallback((building: HospitalBuilding): NavDirection[] => {
    const directions: NavDirection[] = [
      { instruction: 'Start at Main Entrance', icon: '🚪', distance: '' },
    ];
    if (building.position.y < 50) {
      directions.push({ instruction: 'Walk straight ahead through the lobby', icon: '⬆️', distance: '30m' });
    } else {
      directions.push({ instruction: 'Enter the main lobby', icon: '➡️', distance: '15m' });
    }
    if (building.position.x < 40) {
      directions.push({ instruction: 'Turn left at the corridor', icon: '⬅️', distance: '25m' });
    } else if (building.position.x > 60) {
      directions.push({ instruction: 'Turn right at the corridor', icon: '➡️', distance: '25m' });
    } else {
      directions.push({ instruction: 'Continue straight ahead', icon: '⬆️', distance: '20m' });
    }
    if (building.floor !== 'Ground') {
      directions.push({ instruction: `Take the elevator to ${building.floor}`, icon: '🛗', distance: '' });
    }
    const dist = Math.round(
      Math.sqrt(Math.pow(building.position.x - 50, 2) + Math.pow(building.position.y - 85, 2)) * 2
    );
    directions.push({ instruction: 'Continue along the corridor', icon: '⬆️', distance: `${dist}m` });
    directions.push({ instruction: `Arrive at ${building.name}`, icon: '📍', distance: '' });
    return directions;
  }, []);

  const handleBuildingPress = useCallback((building: HospitalBuilding) => {
    setSelectedBuilding(building);
    setShowBuildingModal(true);
  }, []);

  const handleNavigate = useCallback((building: HospitalBuilding) => {
    setNavigatingTo(building);
    setShowBuildingModal(false);
    setShowDirections(true);
    // Start walking animation
    pathServiceRef.current?.startNavigation(
      building.id,
      building.name,
      building.position,
      building.floor
    );
  }, []);

  const handleEnterApp = useCallback(() => {
    router.replace('/(tabs)' as any);
  }, [router]);

  const openLink = useCallback(async (url: string) => {
    try { await Linking.openURL(url); } catch (e) { /* ignore */ }
  }, []);

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================ */}
        {/* HERO HEADER */}
        {/* ================================================================ */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroIcon}>🏥</Text>
            <Text style={styles.heroTitle}>MediVac WACHS</Text>
            <Text style={styles.heroSubtitle}>Virtual Hospital Navigator</Text>
            <Text style={styles.heroDesc}>
              Explore the hospital, find departments, and navigate with ease — no login required
            </Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroBtn, { backgroundColor: '#fff' }]}
              onPress={() => scrollRef.current?.scrollTo({ y: 420, animated: true })}
              activeOpacity={0.8}
            >
              <Text style={[styles.heroBtnText, { color: colors.primary }]}>🗺️ Explore Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnOutline]}
              onPress={() => setShowInstallPanel(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.heroBtnText, { color: '#fff' }]}>📱 Install App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================================ */}
        {/* QUICK DEPARTMENT LINKS */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Access</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLinksScroll}>
            {BUILDINGS.filter(b => ['emergency', 'pharmacy', 'radiology', 'pathology', 'maternity', 'cafeteria', 'icu'].includes(b.id)).map(b => (
              <TouchableOpacity
                key={b.id}
                style={[styles.quickLinkCard, { backgroundColor: b.color + '15', borderColor: b.color + '30' }]}
                onPress={() => handleBuildingPress(b)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickLinkIcon}>{b.icon}</Text>
                <Text style={[styles.quickLinkName, { color: colors.foreground }]} numberOfLines={1}>{b.name}</Text>
                <Text style={[styles.quickLinkHours, { color: colors.muted }]}>{b.hours}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================================================================ */}
        {/* SEARCH & FILTER */}
        {/* ================================================================ */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search departments, services..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="done"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.searchClear, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                    borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryChipText, { color: selectedCategory === cat.id ? '#fff' : colors.foreground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================================================================ */}
        {/* INTERACTIVE HOSPITAL MAP */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <View style={styles.mapHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hospital Map</Text>
            <TouchableOpacity
              style={[styles.accessibilityToggle, { backgroundColor: showAccessOverlay ? '#3B82F6' : colors.surface, borderColor: colors.border }]}
              onPress={() => {
                const svc = AccessibilityOverlayService.getInstance();
                const newState = svc.toggleOverlay();
                setShowAccessOverlay(newState);
                if (newState) {
                  setAccessibilityFeatures(svc.getVisibleFeatures(selectedFloor));
                } else {
                  setAccessibilityFeatures([]);
                }
                setShowAccessibility(!showAccessibility);
              }}
            >
              <Text style={styles.accessibilityToggleIcon}>♿</Text>
              <Text style={[styles.accessibilityToggleText, { color: showAccessOverlay ? '#fff' : colors.foreground }]}>
                Accessibility
              </Text>
            </TouchableOpacity>
          </View>

          {/* Accessibility Feature Type Filters */}
          {showAccessOverlay && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accessTypeFilterScroll}>
              {AccessibilityOverlayService.getFeatureTypeInfo().map(info => {
                const svc = AccessibilityOverlayService.getInstance();
                const isSelected = svc.isTypeSelected(info.type);
                return (
                  <TouchableOpacity
                    key={info.type}
                    style={[
                      styles.accessTypeChip,
                      {
                        backgroundColor: isSelected ? info.color + '20' : colors.surface,
                        borderColor: isSelected ? info.color : colors.border,
                      },
                    ]}
                    onPress={() => {
                      svc.toggleType(info.type);
                      setAccessibilityFeatures(svc.getVisibleFeatures(selectedFloor));
                    }}
                  >
                    <Text style={styles.accessTypeIcon}>{info.icon}</Text>
                    <Text style={[styles.accessTypeLabel, { color: isSelected ? info.color : colors.muted }]}>{info.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Floor Selector Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorTabScroll}>
            {FLOOR_TABS.map(floor => {
              const isSelected = selectedFloor === floor.id;
              const count = floor.id === 'all' ? BUILDINGS.length : BUILDINGS.filter(b => (FLOOR_MAP[b.floor] || 'ground') === floor.id).length;
              return (
                <TouchableOpacity
                  key={floor.id}
                  style={[
                    styles.floorTab,
                    {
                      backgroundColor: isSelected ? floor.color : colors.surface,
                      borderColor: isSelected ? floor.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFloor(floor.id)}
                >
                  <Text style={[styles.floorTabLabel, { color: isSelected ? '#fff' : colors.foreground }]}>
                    {floor.label}
                  </Text>
                  <View style={[styles.floorTabBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : colors.border }]}>
                    <Text style={[styles.floorTabBadgeText, { color: isSelected ? '#fff' : colors.muted }]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Alert Banner */}
          {showAlertBanner && (
            <TouchableOpacity
              style={[styles.alertBanner, { backgroundColor: '#22C55E' + '15', borderColor: '#22C55E' + '40' }]}
              onPress={() => setShowAlertBanner(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.alertBannerIcon}>🔔</Text>
              <View style={styles.alertBannerInfo}>
                <Text style={[styles.alertBannerTitle, { color: '#22C55E' }]}>Wait Time Alert</Text>
                <Text style={[styles.alertBannerText, { color: colors.foreground }]}>
                  {showAlertBanner.departmentName} is now {showAlertBanner.actualWaitMinutes} min (under {showAlertBanner.thresholdMinutes} min target)
                </Text>
              </View>
              <Text style={[styles.alertBannerClose, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.mapContainer, { borderColor: colors.border }]}>
            {/* Map Background */}
            <View style={styles.mapGround}>
              {/* Roads */}
              <View style={[styles.roadH, { top: '82%', left: '5%', width: '90%' }]} />
              <View style={[styles.roadV, { left: '48%', top: '12%', height: '73%' }]} />
              <View style={[styles.roadH, { top: '38%', left: '12%', width: '76%' }]} />
              <View style={[styles.roadV, { left: '85%', top: '28%', height: '57%' }]} />
              <View style={[styles.roadH, { top: '60%', left: '18%', width: '65%' }]} />
              {/* Green Areas */}
              <View style={[styles.greenArea, { top: '68%', left: '4%', width: '22%', height: '20%' }]} />
              <View style={[styles.greenArea, { top: '4%', left: '4%', width: '16%', height: '18%' }]} />
              {/* Water feature */}
              <View style={[styles.waterArea, { top: '72%', left: '8%', width: '12%', height: '10%' }]} />
            </View>

            {/* Building Markers with Wait Time Badges */}
            {filteredBuildings.map(building => {
              const isNavTarget = navigatingTo?.id === building.id;
              const wt = waitTimes.get(building.id);
              return (
                <TouchableOpacity
                  key={building.id}
                  style={[
                    styles.buildingMarker,
                    {
                      left: `${building.position.x - 5}%`,
                      top: `${building.position.y - 5}%`,
                      backgroundColor: building.color,
                      borderColor: isNavTarget ? '#fff' : 'rgba(255,255,255,0.6)',
                      borderWidth: isNavTarget ? 3 : 1.5,
                      shadowColor: building.color,
                    },
                  ]}
                  onPress={() => handleBuildingPress(building)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buildingIcon}>{building.icon}</Text>
                  {wt && wt.waitMinutes > 0 && (
                    <View style={[styles.waitBadge, { backgroundColor: wt.urgencyColor }]}>
                      <Text style={styles.waitBadgeText}>{wt.waitMinutes}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Building Labels */}
            {filteredBuildings.map(building => (
              <View
                key={`label-${building.id}`}
                style={[styles.buildingLabel, { left: `${building.position.x - 12}%`, top: `${building.position.y + 5}%` }]}
                pointerEvents="none"
              >
                <Text style={styles.buildingLabelText} numberOfLines={1}>{building.name}</Text>
              </View>
            ))}

            {/* Accessibility Markers (basic) */}
            {showAccessibility && !showAccessOverlay && ACCESSIBILITY_MARKERS.map(marker => (
              <View
                key={marker.id}
                style={[styles.accessMarker, { left: `${marker.position.x - 2.5}%`, top: `${marker.position.y - 2.5}%` }]}
              >
                <Text style={styles.accessMarkerIcon}>{marker.icon}</Text>
              </View>
            ))}

            {/* Floor-Specific Accessibility Overlay (enhanced) */}
            {showAccessOverlay && accessibilityFeatures.map(feature => (
              <View
                key={feature.id}
                style={[
                  styles.accessOverlayMarker,
                  {
                    left: `${feature.x - 2.5}%`,
                    top: `${feature.y - 2.5}%`,
                    backgroundColor: AccessibilityOverlayService.getFeatureColor(feature.type) + '30',
                    borderColor: AccessibilityOverlayService.getFeatureColor(feature.type),
                    opacity: feature.isOperational ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={styles.accessOverlayIcon}>{AccessibilityOverlayService.getFeatureIcon(feature.type)}</Text>
                {!feature.isOperational && <View style={styles.accessOverlayOffline}><Text style={styles.accessOverlayOfflineText}>!</Text></View>}
              </View>
            ))}

            {/* Navigation indicator dots */}
            {navigatingTo && (
              <>
                <View style={[styles.navDot, { left: '48%', top: '83%', backgroundColor: '#22C55E' }]}>
                  <Text style={styles.navDotLabel}>START</Text>
                </View>
                <View style={[styles.navDot, { left: `${navigatingTo.position.x - 1.5}%`, top: `${navigatingTo.position.y - 1.5}%`, backgroundColor: '#EF4444' }]}>
                  <Text style={styles.navDotLabel}>END</Text>
                </View>
              </>
            )}

            {/* Animated Walking Dot */}
            {navState && navState.isActive && (
              <View
                style={[
                  styles.walkingDot,
                  {
                    left: `${navState.currentPosition.x - 2}%`,
                    top: `${navState.currentPosition.y - 2}%`,
                  },
                ]}
              >
                <Text style={styles.walkingDotIcon}>🚶</Text>
              </View>
            )}

            {/* Map Legend */}
            <View style={styles.mapLegend}>
              <Text style={styles.mapLegendTitle}>Legend</Text>
              {[
                { color: '#EF4444', label: 'Emergency' },
                { color: '#0077B6', label: 'Departments' },
                { color: '#EC4899', label: 'Wards' },
                { color: '#22C55E', label: 'Services' },
                { color: '#64748B', label: 'Facilities' },
              ].map(item => (
                <View key={item.label} style={styles.mapLegendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Map tip */}
          <Text style={[styles.mapTip, { color: colors.muted }]}>
            Tap any building to view details and get directions
          </Text>

          {/* Navigation Progress Panel */}
          {navState && navState.isActive && (
            <View style={[styles.navProgressPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.navProgressHeader}>
                <Text style={[styles.navProgressTitle, { color: colors.foreground }]}>🚶 Navigating to {navState.destinationName}</Text>
                <TouchableOpacity onPress={() => { pathServiceRef.current?.cancelNavigation(); }}>
                  <Text style={[styles.navProgressClose, { color: colors.muted }]}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.navProgressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.navProgressFill, { width: `${navState.progress * 100}%`, backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.navProgressStats}>
                <Text style={[styles.navProgressStat, { color: colors.muted }]}>⏱ {navState.etaSeconds}s remaining</Text>
                <Text style={[styles.navProgressStat, { color: colors.muted }]}>📏 {Math.round(navState.distanceRemaining)}m left</Text>
              </View>
              {navState.currentStepIndex < (pathServiceRef.current?.getSteps().length || 0) && (
                <Text style={[styles.navProgressStep, { color: colors.foreground }]}>
                  {pathServiceRef.current?.getSteps()[navState.currentStepIndex]?.icon}{' '}
                  {pathServiceRef.current?.getSteps()[navState.currentStepIndex]?.instruction}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ================================================================ */}
        {/* DEPARTMENT DIRECTORY */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Department Directory</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            {filteredBuildings.length} locations found
          </Text>
          {filteredBuildings.map(building => (
            <TouchableOpacity
              key={building.id}
              style={[styles.directoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleBuildingPress(building)}
              activeOpacity={0.7}
            >
              <View style={[styles.directoryIcon, { backgroundColor: building.color + '20' }]}>
                <Text style={styles.directoryIconText}>{building.icon}</Text>
              </View>
              <View style={styles.directoryInfo}>
                <Text style={[styles.directoryName, { color: colors.foreground }]}>{building.name}</Text>
                <Text style={[styles.directoryDesc, { color: colors.muted }]} numberOfLines={1}>
                  {building.services.slice(0, 3).join(' • ')}
                </Text>
                <View style={styles.directoryMeta}>
                  <Text style={[styles.directoryHours, { color: colors.primary }]}>🕐 {building.hours}</Text>
                  <Text style={[styles.directoryFloor, { color: colors.muted }]}>📍 {building.floor}</Text>
                  {building.isAccessible && <Text style={styles.directoryAccessible}>♿</Text>}
                  {waitTimes.get(building.id) && waitTimes.get(building.id)!.waitMinutes > 0 && (
                    <Text style={[styles.directoryWait, { color: waitTimes.get(building.id)!.urgencyColor }]}>
                      ⏳ {waitTimes.get(building.id)!.label} {waitTimes.get(building.id)!.trendIcon}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.directoryNavBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleNavigate(building)}
              >
                <Text style={styles.directoryNavBtnText}>GO</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* ================================================================ */}
        {/* INSTALL APP BANNER */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.installBannerCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
            onPress={() => setShowInstallPanel(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.installBannerIcon}>📱</Text>
            <View style={styles.installBannerInfo}>
              <Text style={[styles.installBannerTitle, { color: colors.foreground }]}>Get the MediVac App</Text>
              <Text style={[styles.installBannerDesc, { color: colors.muted }]}>
                Install on your device for offline access, push notifications, and full hospital management
              </Text>
            </View>
            <View style={[styles.installBannerBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.installBannerBtnText}>Install</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================================================================ */}
        {/* JEDI PORTAL NETWORK */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>JEDI Portal Network</Text>
          <View style={styles.portalGrid}>
            {JEDI_PORTALS.map((portal) => (
              <TouchableOpacity
                key={portal.name}
                style={[styles.portalCard, { backgroundColor: portal.color + '12' }]}
                onPress={() => openLink(portal.url)}
                activeOpacity={0.7}
              >
                <Text style={styles.portalIcon}>{portal.icon}</Text>
                <Text style={[styles.portalName, { color: portal.color }]} numberOfLines={1}>{portal.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================================================================ */}
        {/* VISITOR KIOSK & STAFF LOGIN */}
        {/* ================================================================ */}
        {/* Visitor Kiosk Mode */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.staffLoginBtn, { backgroundColor: '#22C55E' + '10', borderColor: '#22C55E' + '40' }]}
            onPress={() => router.push('/(tabs)/kiosk-checkin' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.staffLoginIcon}>🏥</Text>
            <View style={styles.staffLoginInfo}>
              <Text style={[styles.staffLoginTitle, { color: colors.foreground }]}>Visitor Check-In</Text>
              <Text style={[styles.staffLoginDesc, { color: colors.muted }]}>Self-service kiosk for visitor registration and directions</Text>
            </View>
            <Text style={[styles.staffLoginArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Wait Time Alerts */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.staffLoginBtn, { backgroundColor: '#F59E0B' + '10', borderColor: '#F59E0B' + '40' }]}
            onPress={() => router.push('/(tabs)/wait-alerts' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.staffLoginIcon}>⏱</Text>
            <View style={styles.staffLoginInfo}>
              <Text style={[styles.staffLoginTitle, { color: colors.foreground }]}>Wait Time Alerts</Text>
              <Text style={[styles.staffLoginDesc, { color: colors.muted }]}>Manage department wait time subscriptions and notifications</Text>
            </View>
            <Text style={[styles.staffLoginArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Visitor Analytics */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.staffLoginBtn, { backgroundColor: '#8B5CF6' + '10', borderColor: '#8B5CF6' + '40' }]}
            onPress={() => router.push('/(tabs)/visitor-analytics' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.staffLoginIcon}>📊</Text>
            <View style={styles.staffLoginInfo}>
              <Text style={[styles.staffLoginTitle, { color: colors.foreground }]}>Visitor Analytics</Text>
              <Text style={[styles.staffLoginDesc, { color: colors.muted }]}>Check-in statistics, peak hours, and department load data</Text>
            </View>
            <Text style={[styles.staffLoginArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Staff Login */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.staffLoginBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleEnterApp}
            activeOpacity={0.7}
          >
            <Text style={styles.staffLoginIcon}>🔐</Text>
            <View style={styles.staffLoginInfo}>
              <Text style={[styles.staffLoginTitle, { color: colors.foreground }]}>Staff Dashboard</Text>
              <Text style={[styles.staffLoginDesc, { color: colors.muted }]}>Access the full hospital management system</Text>
            </View>
            <Text style={[styles.staffLoginArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>MediVac One™ Virtual Hospital</Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>© 2020-2026 SMPO.ink™ • J.E.D.iTek PTY LTD</Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>WACHS - WA Country Health Service</Text>
        </View>
      </ScrollView>

      {/* ================================================================ */}
      {/* BUILDING DETAIL MODAL */}
      {/* ================================================================ */}
      <Modal visible={showBuildingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {selectedBuilding && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <View style={[styles.modalIconCircle, { backgroundColor: selectedBuilding.color + '20' }]}>
                    <Text style={styles.modalIconText}>{selectedBuilding.icon}</Text>
                  </View>
                  <View style={styles.modalHeaderInfo}>
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>{selectedBuilding.name}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.muted }]}>{selectedBuilding.description}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowBuildingModal(false)} style={styles.modalClose}>
                    <Text style={[styles.modalCloseText, { color: colors.muted }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Wait Time Banner */}
                  {(() => {
                    const wt = waitTimes.get(selectedBuilding.id);
                    if (wt && wt.waitMinutes > 0) {
                      return (
                        <View style={[styles.waitTimeBanner, { backgroundColor: wt.urgencyColor + '15', borderColor: wt.urgencyColor + '40' }]}>
                          <Text style={[styles.waitTimeBannerIcon, { color: wt.urgencyColor }]}>⏳</Text>
                          <View style={styles.waitTimeBannerInfo}>
                            <Text style={[styles.waitTimeBannerLabel, { color: wt.urgencyColor }]}>Current Wait Time</Text>
                            <Text style={[styles.waitTimeBannerValue, { color: wt.urgencyColor }]}>
                              {wt.label} {wt.trendIcon} • {wt.patientsWaiting} patients waiting
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  {[
                    { label: 'Hours', value: selectedBuilding.hours },
                    { label: 'Location', value: selectedBuilding.floor },
                    { label: 'Accessible', value: selectedBuilding.isAccessible ? '♿ Yes' : 'Limited' },
                  ].map(row => (
                    <View key={row.label} style={[styles.modalInfoRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalInfoLabel, { color: colors.muted }]}>{row.label}</Text>
                      <Text style={[styles.modalInfoValue, { color: colors.foreground }]}>{row.value}</Text>
                    </View>
                  ))}

                  <Text style={[styles.modalServicesTitle, { color: colors.foreground }]}>Services</Text>
                  {selectedBuilding.services.map((service, i) => (
                    <View key={i} style={[styles.serviceItem, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.serviceItemText, { color: colors.foreground }]}>• {service}</Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  {/* Alert Subscription */}
                  {(() => {
                    const existingSub = alertServiceRef.current?.getSubscriptionForDepartment(selectedBuilding.id);
                    if (existingSub && existingSub.isActive) {
                      return (
                        <TouchableOpacity
                          style={[styles.modalBtn, { backgroundColor: '#F59E0B', marginBottom: 8 }]}
                          onPress={() => handleUnsubscribeAlert(selectedBuilding)}
                        >
                          <Text style={styles.modalBtnText}>🔔 Alert set: under {existingSub.thresholdMinutes} min (tap to remove)</Text>
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <View style={styles.alertSubRow}>
                        <Text style={[styles.alertSubLabel, { color: colors.muted }]}>🔔 Alert me when wait is under:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertSubScroll}>
                          {[5, 10, 15, 20, 30].map(mins => (
                            <TouchableOpacity
                              key={mins}
                              style={[styles.alertSubChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                              onPress={() => handleSubscribeAlert(selectedBuilding, mins)}
                            >
                              <Text style={[styles.alertSubChipText, { color: colors.foreground }]}>{mins} min</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })()}
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleNavigate(selectedBuilding)}
                  >
                    <Text style={styles.modalBtnText}>🧭 Navigate Here</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* DIRECTIONS MODAL */}
      {/* ================================================================ */}
      <Modal visible={showDirections} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {navigatingTo && (() => {
              const dirs = getDirections(navigatingTo);
              const dist = Math.round(Math.sqrt(Math.pow(navigatingTo.position.x - 50, 2) + Math.pow(navigatingTo.position.y - 85, 2)) * 2);
              const walkMin = Math.max(1, Math.round(dist / 80));
              return (
                <>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <Text style={styles.modalIconText}>🧭</Text>
                    <View style={styles.modalHeaderInfo}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Directions</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.muted }]}>To {navigatingTo.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { setShowDirections(false); setNavigatingTo(null); }}
                      style={styles.modalClose}
                    >
                      <Text style={[styles.modalCloseText, { color: colors.muted }]}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    {/* Summary bar */}
                    <View style={[styles.directionSummary, { backgroundColor: colors.surface }]}>
                      <View style={styles.directionSummaryItem}>
                        <Text style={[styles.directionSummaryValue, { color: colors.primary }]}>{dist}m</Text>
                        <Text style={[styles.directionSummaryLabel, { color: colors.muted }]}>Distance</Text>
                      </View>
                      <View style={styles.directionSummaryItem}>
                        <Text style={[styles.directionSummaryValue, { color: colors.primary }]}>{walkMin} min</Text>
                        <Text style={[styles.directionSummaryLabel, { color: colors.muted }]}>Walk Time</Text>
                      </View>
                      <View style={styles.directionSummaryItem}>
                        <Text style={[styles.directionSummaryValue, { color: colors.primary }]}>{navigatingTo.floor}</Text>
                        <Text style={[styles.directionSummaryLabel, { color: colors.muted }]}>Floor</Text>
                      </View>
                    </View>

                    {/* Steps */}
                    {dirs.map((dir, i) => {
                      const isFirst = i === 0;
                      const isLast = i === dirs.length - 1;
                      const dotColor = isFirst ? colors.success : isLast ? '#EF4444' : colors.primary;
                      return (
                        <View key={i} style={[styles.directionStep, { borderLeftColor: dotColor }]}>
                          <View style={[styles.directionDot, { backgroundColor: dotColor }]} />
                          <View style={styles.directionContent}>
                            <Text style={styles.directionStepIcon}>{dir.icon}</Text>
                            <View style={styles.directionTextWrap}>
                              <Text style={[styles.directionText, { color: colors.foreground }]}>{dir.instruction}</Text>
                              {dir.distance ? <Text style={[styles.directionDist, { color: colors.muted }]}>{dir.distance}</Text> : null}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: colors.success }]}
                      onPress={() => setShowDirections(false)}
                    >
                      <Text style={styles.modalBtnText}>Got It</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* INSTALL / SIDELOAD PANEL MODAL */}
      {/* ================================================================ */}
      <Modal visible={showInstallPanel} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={styles.modalIconText}>📱</Text>
              <View style={styles.modalHeaderInfo}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Install MediVac</Text>
                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>Choose your preferred installation method</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInstallPanel(false)} style={styles.modalClose}>
                <Text style={[styles.modalCloseText, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sideload Preference Header */}
              <View style={[styles.installSectionHeader, { backgroundColor: '#8B5CF6' + '10' }]}>
                <Text style={[styles.installSectionTitle, { color: '#8B5CF6' }]}>⚡ Sideload Preference</Text>
                <Text style={[styles.installSectionDesc, { color: colors.muted }]}>
                  Install directly without app store — recommended for enterprise and JEDI system users
                </Text>
              </View>

              {/* Sideload APK */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '40' }]}
                onPress={() => openLink('https://jeditek.xyz/jedi-downloads')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Text style={styles.installOptionIcon}>⬇️</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>Sideload APK / IPA</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Download from AlphaPrime portal for Android sideloading or iOS enterprise install
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* JEDI System Install */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '40' }]}
                onPress={() => openLink('jedi://install?modules=homing-beacon,comm-station,friend-hatching,club-builder,web-share,vpn-browser')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Text style={styles.installOptionIcon}>⚡</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>JEDI System Install</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Full JEDI module suite: Homing Beacon, Comm Station, VPN Browser, and more
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* JEDI Installer */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: '#8B5CF6' + '40' }]}
                onPress={() => openLink('https://jediinstal-krne8jes.manus.space')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Text style={styles.installOptionIcon}>🔧</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>JEDI Installer Portal</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Web-based installer for all JEDI system components and modules
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* App Store Section */}
              <View style={[styles.installSectionHeader, { backgroundColor: colors.primary + '10', marginTop: 16 }]}>
                <Text style={[styles.installSectionTitle, { color: colors.primary }]}>📲 App Store Install</Text>
                <Text style={[styles.installSectionDesc, { color: colors.muted }]}>
                  Install via official app stores using Expo Go
                </Text>
              </View>

              {/* iOS */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openLink('https://apps.apple.com/app/expo-go/id982107779')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#000' + '10' }]}>
                  <Text style={styles.installOptionIcon}>🍎</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>iOS (iPhone / iPad)</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Install Expo Go from App Store, then scan QR code to open MediVac
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* Android */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openLink('https://play.google.com/store/apps/details?id=host.exp.exponent')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#22C55E' + '15' }]}>
                  <Text style={styles.installOptionIcon}>🤖</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>Android</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Install Expo Go from Google Play, then scan QR code to open MediVac
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* PWA */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    alert('To install as a web app:\n\n1. Tap the Share button in your browser\n2. Select "Add to Home Screen"\n3. Tap "Add" to confirm');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#3B82F6' + '15' }]}>
                  <Text style={styles.installOptionIcon}>🌐</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>Web App (PWA)</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Add to home screen from your browser — works offline
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* Browser Section */}
              <View style={[styles.installSectionHeader, { backgroundColor: '#10B981' + '10', marginTop: 16 }]}>
                <Text style={[styles.installSectionTitle, { color: '#10B981' }]}>🌐 JEDI Browsers</Text>
                <Text style={[styles.installSectionDesc, { color: colors.muted }]}>
                  Secure browsers with built-in MediVac integration
                </Text>
              </View>

              {/* JediTek Browser */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openLink('https://jeditek-bro.manus.space')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#00A8E8' + '15' }]}>
                  <Text style={styles.installOptionIcon}>🛡️</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>JediTek VPN Browser</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Secure VPN browser with built-in MediVac integration
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>

              {/* WONGI Browser */}
              <TouchableOpacity
                style={[styles.installOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openLink('https://wongi.manus.space')}
                activeOpacity={0.7}
              >
                <View style={[styles.installOptionIconWrap, { backgroundColor: '#E85D04' + '15' }]}>
                  <Text style={styles.installOptionIcon}>🦘</Text>
                </View>
                <View style={styles.installOptionInfo}>
                  <Text style={[styles.installOptionTitle, { color: colors.foreground }]}>WONGI Community Browser</Text>
                  <Text style={[styles.installOptionDesc, { color: colors.muted }]}>
                    Community browser with Aboriginal health resources
                  </Text>
                </View>
                <Text style={[styles.installOptionArrow, { color: colors.muted }]}>→</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 40 },

  // Hero
  hero: { paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroContent: { alignItems: 'center', marginBottom: 20 },
  heroIcon: { fontSize: 52, marginBottom: 8 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 17, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 2 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 10, lineHeight: 20, maxWidth: 300 },
  heroActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  heroBtn: { paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  heroBtnOutline: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  heroBtnText: { fontSize: 15, fontWeight: '700' },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  sectionSubtitle: { fontSize: 13, marginTop: 2, marginBottom: 10 },

  // Quick Links
  quickLinksScroll: { paddingRight: 16, gap: 10, paddingTop: 10, paddingBottom: 4 },
  quickLinkCard: { width: 96, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  quickLinkIcon: { fontSize: 28, marginBottom: 6 },
  quickLinkName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  quickLinkHours: { fontSize: 9, marginTop: 2, textAlign: 'center' },

  // Search
  searchSection: { paddingHorizontal: 16, paddingTop: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, marginBottom: 10 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  searchClear: { fontSize: 16, padding: 4 },
  categoryScroll: { marginBottom: 4, maxHeight: 42 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  categoryChipIcon: { fontSize: 14, marginRight: 4 },
  categoryChipText: { fontSize: 13, fontWeight: '600' },

  // Map
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  accessibilityToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  accessibilityToggleIcon: { fontSize: 14, marginRight: 4 },
  accessibilityToggleText: { fontSize: 12, fontWeight: '600' },
  mapContainer: { width: '100%', aspectRatio: 0.9, borderRadius: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', backgroundColor: '#E8F5E9' },
  mapGround: { position: 'absolute', width: '100%', height: '100%' },
  roadH: { position: 'absolute', height: 3, backgroundColor: '#D1D5DB', borderRadius: 1.5 },
  roadV: { position: 'absolute', width: 3, backgroundColor: '#D1D5DB', borderRadius: 1.5 },
  greenArea: { position: 'absolute', backgroundColor: '#A7F3D0', borderRadius: 10, opacity: 0.5 },
  waterArea: { position: 'absolute', backgroundColor: '#93C5FD', borderRadius: 20, opacity: 0.35 },
  buildingMarker: {
    position: 'absolute', width: '10%', aspectRatio: 1, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5,
  },
  buildingIcon: { fontSize: 20 },
  buildingLabel: { position: 'absolute', width: '24%', alignItems: 'center' },
  buildingLabelText: { fontSize: 8, fontWeight: '700', textAlign: 'center', color: '#333', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  accessMarker: { position: 'absolute', width: '5%', aspectRatio: 1, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.2)', alignItems: 'center', justifyContent: 'center' },
  accessMarkerIcon: { fontSize: 12 },
  navDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  navDotLabel: { fontSize: 4, fontWeight: '900', color: '#fff' },
  mapLegend: { position: 'absolute', bottom: 8, left: 8, padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
  mapLegendTitle: { fontSize: 10, fontWeight: '800', marginBottom: 4, color: '#333' },
  mapLegendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 9, color: '#666' },
  mapTip: { fontSize: 12, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  // Directory
  directoryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  directoryIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  directoryIconText: { fontSize: 24 },
  directoryInfo: { flex: 1, marginLeft: 12 },
  directoryName: { fontSize: 16, fontWeight: '700' },
  directoryDesc: { fontSize: 12, marginTop: 2 },
  directoryMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
  directoryHours: { fontSize: 11, fontWeight: '500' },
  directoryFloor: { fontSize: 11 },
  directoryAccessible: { fontSize: 12 },
  directoryNavBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  directoryNavBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Install Banner
  installBannerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1 },
  installBannerIcon: { fontSize: 32, marginRight: 12 },
  installBannerInfo: { flex: 1 },
  installBannerTitle: { fontSize: 16, fontWeight: '700' },
  installBannerDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  installBannerBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  installBannerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Portal Grid
  portalGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  portalCard: { width: '31%', marginRight: '2%', marginBottom: 8, borderRadius: 12, padding: 12, alignItems: 'center' },
  portalIcon: { fontSize: 24, marginBottom: 4 },
  portalName: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Staff Login
  staffLoginBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  staffLoginIcon: { fontSize: 28 },
  staffLoginInfo: { flex: 1 },
  staffLoginTitle: { fontSize: 16, fontWeight: '700' },
  staffLoginDesc: { fontSize: 12, marginTop: 2 },
  staffLoginArrow: { fontSize: 20, fontWeight: '600' },

  // Footer
  footer: { alignItems: 'center', paddingTop: 24, paddingBottom: 16, gap: 2 },
  footerText: { fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: SCREEN_HEIGHT * 0.78, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, gap: 12 },
  modalIconCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalIconText: { fontSize: 28 },
  modalHeaderInfo: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  modalClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 20 },
  modalBody: { padding: 16 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
  modalInfoLabel: { fontSize: 14 },
  modalInfoValue: { fontSize: 14, fontWeight: '600' },
  modalServicesTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  serviceItem: { padding: 10, borderRadius: 8, marginBottom: 4 },
  serviceItemText: { fontSize: 14 },
  modalFooter: { padding: 16, borderTopWidth: 0.5 },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Directions
  directionStep: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 16, paddingVertical: 8, borderLeftWidth: 3, marginLeft: 8 },
  directionDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', left: -8, top: 12 },
  directionContent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 },
  directionStepIcon: { fontSize: 18 },
  directionTextWrap: { flex: 1 },
  directionText: { fontSize: 15, fontWeight: '500' },
  directionDist: { fontSize: 12, marginTop: 2 },
  directionSummary: { flexDirection: 'row', padding: 16, borderRadius: 14, marginBottom: 16 },
  directionSummaryItem: { flex: 1, alignItems: 'center' },
  directionSummaryValue: { fontSize: 20, fontWeight: '800' },
  directionSummaryLabel: { fontSize: 11, marginTop: 2 },

  // Install Options
  installSectionHeader: { padding: 14, borderRadius: 14, marginBottom: 10 },
  installSectionTitle: { fontSize: 16, fontWeight: '800' },
  installSectionDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  installOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  installOptionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  installOptionIcon: { fontSize: 24 },
  installOptionInfo: { flex: 1 },
  installOptionTitle: { fontSize: 15, fontWeight: '700' },
  installOptionDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  installOptionArrow: { fontSize: 18, fontWeight: '600', marginLeft: 8 },

  // Wait Time Badges
  waitBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  waitBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

  // Walking Dot Animation
  walkingDot: { position: 'absolute', width: '4%', aspectRatio: 1, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  walkingDotIcon: { fontSize: 16 },

  // Navigation Progress Panel
  navProgressPanel: { marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  navProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navProgressTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  navProgressClose: { fontSize: 18, padding: 4 },
  navProgressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  navProgressFill: { height: '100%', borderRadius: 3 },
  navProgressStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  navProgressStat: { fontSize: 12, fontWeight: '500' },
  navProgressStep: { fontSize: 13, fontWeight: '600', marginTop: 4 },

  // Directory Wait Time
  directoryWait: { fontSize: 11, fontWeight: '700' },

  // Wait Time Banner in Modal
  waitTimeBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12, gap: 10 },
  waitTimeBannerIcon: { fontSize: 24 },
  waitTimeBannerInfo: { flex: 1 },
  waitTimeBannerLabel: { fontSize: 12, fontWeight: '700' },
  waitTimeBannerValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },

  // Floor Selector Tabs
  floorTabScroll: { marginBottom: 10 },
  floorTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 8, gap: 6 },
  floorTabLabel: { fontSize: 13, fontWeight: '700' },
  floorTabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, minWidth: 22, alignItems: 'center' },
  floorTabBadgeText: { fontSize: 10, fontWeight: '800' },

  // Alert Banner
  alertBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 10 },
  alertBannerIcon: { fontSize: 20 },
  alertBannerInfo: { flex: 1 },
  alertBannerTitle: { fontSize: 12, fontWeight: '800' },
  alertBannerText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  alertBannerClose: { fontSize: 16, padding: 4 },

  // Alert Subscription in Modal
  alertSubRow: { marginBottom: 10 },
  alertSubLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  alertSubScroll: { flexDirection: 'row' },
  alertSubChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginRight: 6 },
  alertSubChipText: { fontSize: 12, fontWeight: '700' },
  // Accessibility Type Filter
  accessTypeFilterScroll: { marginBottom: 8, paddingHorizontal: 4 },
  accessTypeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, marginRight: 6, gap: 4 },
  accessTypeIcon: { fontSize: 14 },
  accessTypeLabel: { fontSize: 11, fontWeight: '600' },
  // Accessibility Overlay Markers
  accessOverlayMarker: { position: 'absolute', width: '5%', aspectRatio: 1, borderRadius: 100, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 15 },
  accessOverlayIcon: { fontSize: 12 },
  accessOverlayOffline: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  accessOverlayOfflineText: { color: '#fff', fontSize: 8, fontWeight: '900' },
});
