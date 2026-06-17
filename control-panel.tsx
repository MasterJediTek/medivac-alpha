import { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet,
} from "react-native";
import { IconSymbol } from "./icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Control Panel Props
interface ControlPanelProps {
  title: string;
  subtitle?: string;
  icon?: "network" | "person.2.fill" | "calendar" | "list.bullet" | "chart.bar.fill" | "gear" | "folder.fill" | "bell.fill" | "clock.fill";
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  headerAction?: {
    label: string;
    onPress: () => void;
  };
  color?: string;
}

export function ControlPanel({
  title,
  subtitle,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  headerAction,
  color,
}: ControlPanelProps) {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const accentColor = color || colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => collapsible && setIsExpanded(!isExpanded)}
        activeOpacity={collapsible ? 0.7 : 1}
        disabled={!collapsible}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
              <IconSymbol name={icon} size={20} color={accentColor} />
            </View>
          )}
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {headerAction && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: accentColor }]}
              onPress={headerAction.onPress}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: colors.background }]}>
                {headerAction.label}
              </Text>
            </TouchableOpacity>
          )}
          {collapsible && (
            <IconSymbol 
              name="chevron.right" 
              size={18} 
              color={colors.muted}
              style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}
            />
          )}
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={[styles.content, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

// Quick Action Button
interface QuickActionProps {
  icon: "plus" | "magnifyingglass" | "arrow.triangle.2.circlepath" | "doc.fill" | "person.fill" | "calendar" | "bell.fill" | "gear";
  label: string;
  onPress: () => void;
  color?: string;
  badge?: number;
}

export function QuickAction({ icon, label, onPress, color, badge }: QuickActionProps) {
  const colors = useColors();
  const accentColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.background }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: accentColor + '15' }]}>
        <IconSymbol name={icon} size={22} color={accentColor} />
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Module Grid Item
interface ModuleGridItemProps {
  icon: "person.2.fill" | "stethoscope" | "pills.fill" | "calendar" | "list.bullet" | "folder.fill" | "clock.fill" | "chart.bar.fill" | "gear" | "bell.fill" | "doc.fill" | "network";
  label: string;
  onPress: () => void;
  color?: string;
  badge?: number;
}

export function ModuleGridItem({ icon, label, onPress, color, badge }: ModuleGridItemProps) {
  const colors = useColors();
  const accentColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.moduleItem, { backgroundColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconSymbol name={icon} size={32} color="#FFFFFF" />
      <Text style={styles.moduleLabel} numberOfLines={2}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.moduleBadge, { backgroundColor: colors.error }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Status Indicator
interface StatusIndicatorProps {
  label: string;
  value: string | number;
  status: "success" | "warning" | "error" | "info" | "neutral";
  icon?: "checkmark.circle.fill" | "exclamationmark.triangle.fill" | "xmark.circle.fill" | "info.circle.fill";
}

export function StatusIndicator({ label, value, status, icon }: StatusIndicatorProps) {
  const colors = useColors();
  
  const statusColors = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.primary,
    neutral: colors.muted,
  };

  const statusIcons: Record<string, "checkmark.circle.fill" | "exclamationmark.triangle.fill" | "xmark.circle.fill" | "info.circle.fill"> = {
    success: "checkmark.circle.fill",
    warning: "exclamationmark.triangle.fill",
    error: "xmark.circle.fill",
    info: "info.circle.fill",
  };

  const statusColor = statusColors[status];
  const statusIcon = icon || statusIcons[status];

  return (
    <View style={[styles.statusIndicator, { backgroundColor: statusColor + '10' }]}>
      {statusIcon && (
        <IconSymbol name={statusIcon} size={18} color={statusColor} />
      )}
      <View style={styles.statusContent}>
        <Text style={[styles.statusLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.statusValue, { color: statusColor }]}>{value}</Text>
      </View>
    </View>
  );
}

// Tab Bar for Control Panels
interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const colors = useColors();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
    >
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            { 
              backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
              borderColor: activeTab === tab.key ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.tabLabel, 
              { color: activeTab === tab.key ? colors.background : colors.foreground }
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge !== undefined && tab.badge > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.tabBadgeText}>{tab.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Data Row for displaying key-value pairs
interface DataRowProps {
  label: string;
  value: string | number;
  icon?: "calendar" | "clock.fill" | "person.fill" | "doc.fill" | "stethoscope";
  onPress?: () => void;
}

export function DataRow({ label, value, icon, onPress }: DataRowProps) {
  const colors = useColors();
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.dataRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <IconSymbol name={icon} size={18} color={colors.muted} />
      )}
      <Text style={[styles.dataLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.dataValue, { color: colors.foreground }]}>{value}</Text>
      {onPress && (
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      )}
    </Component>
  );
}

// Progress Bar
interface ProgressBarProps {
  label?: string;
  value: number; // 0-100
  color?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ label, value, color, showPercentage = true }: ProgressBarProps) {
  const colors = useColors();
  const barColor = color || colors.primary;
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View style={styles.progressContainer}>
      {(label || showPercentage) && (
        <View style={styles.progressHeader}>
          {label && <Text style={[styles.progressLabel, { color: colors.muted }]}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.progressPercent, { color: colors.foreground }]}>
              {Math.round(clampedValue)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${clampedValue}%`, backgroundColor: barColor }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
  },
  quickAction: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  moduleItem: {
    width: 90,
    height: 90,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    position: "relative",
  },
  moduleLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },
  moduleBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabBar: {
    marginBottom: 16,
  },
  tabBarContent: {
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  dataLabel: {
    fontSize: 14,
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});

export default ControlPanel;
