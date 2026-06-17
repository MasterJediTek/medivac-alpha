import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { delegationCalendarService, CalendarMonth, CalendarDelegation, CoverageGap } from "@/lib/services/delegation-calendar-service";
import { colorCodeService, SEVERITY_COLORS, STATUS_COLORS } from "@/lib/services/color-code-service";

export default function ColorCalendarScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [gaps, setGaps] = useState<CoverageGap[]>([]);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    loadCalendar();
  }, [currentDate]);

  const loadCalendar = async () => {
    setLoading(true);
    await delegationCalendarService.initialize();
    const month = delegationCalendarService.getCalendarMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    setCalendarMonth(month);
    setGaps(delegationCalendarService.getCoverageGaps());
    setLoading(false);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getGapColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return SEVERITY_COLORS.critical.primary;
      case 'high': return SEVERITY_COLORS.high.primary;
      case 'medium': return SEVERITY_COLORS.medium.primary;
      case 'low': return SEVERITY_COLORS.low.primary;
      default: return 'transparent';
    }
  };

  const getDayBackground = (delegations: CalendarDelegation[], hasGap: boolean, gapSeverity?: string) => {
    if (hasGap) {
      return getGapColor(gapSeverity) + '20';
    }
    if (delegations.length > 0) {
      return STATUS_COLORS.active.background;
    }
    return 'transparent';
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getMonth() === currentDate.getMonth();
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading calendar...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">Delegation Calendar</Text>
            <Text className="text-muted">Color-coded coverage view</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowLegend(!showLegend)}
            style={{ backgroundColor: colors.primary + '20', padding: 8, borderRadius: 8 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Legend</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        {showLegend && (
          <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Color Legend</Text>
            
            <Text className="text-sm font-medium text-muted mb-2">Gap Severity</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { label: 'Critical', color: SEVERITY_COLORS.critical.primary },
                { label: 'High', color: SEVERITY_COLORS.high.primary },
                { label: 'Medium', color: SEVERITY_COLORS.medium.primary },
                { label: 'Low', color: SEVERITY_COLORS.low.primary },
              ].map((item) => (
                <View key={item.label} className="flex-row items-center">
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 4 }} />
                  <Text className="text-xs text-muted">{item.label}</Text>
                </View>
              ))}
            </View>

            <Text className="text-sm font-medium text-muted mb-2">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'Active Coverage', color: STATUS_COLORS.active.primary },
                { label: 'Today', color: colors.primary },
                { label: 'Selected', color: '#8B5CF6' },
              ].map((item) => (
                <View key={item.label} className="flex-row items-center">
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 4 }} />
                  <Text className="text-xs text-muted">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Month Navigation */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigateMonth(-1)}
            style={{ padding: 12, backgroundColor: colors.primary + '20', borderRadius: 8 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>← Prev</Text>
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-foreground">
            {calendarMonth?.monthName} {calendarMonth?.year}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigateMonth(1)}
            style={{ padding: 12, backgroundColor: colors.primary + '20', borderRadius: 8 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
            <Text className="text-xs text-muted">Delegations</Text>
            <Text className="text-lg font-bold text-foreground">{calendarMonth?.totalDelegations}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
            <Text className="text-xs text-muted">Gaps</Text>
            <Text className="text-lg font-bold" style={{ color: SEVERITY_COLORS.high.primary }}>{calendarMonth?.totalGaps}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
            <Text className="text-xs text-muted">Coverage</Text>
            <Text className="text-lg font-bold" style={{ color: STATUS_COLORS.active.primary }}>{calendarMonth?.coveragePercentage}%</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="bg-surface rounded-xl border border-border overflow-hidden mb-4">
          {/* Day Headers */}
          <View className="flex-row border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} className="flex-1 py-2">
                <Text className="text-center text-xs font-medium text-muted">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Weeks */}
          {calendarMonth?.weeks.map((week) => (
            <View key={week.weekNumber} className="flex-row border-b border-border">
              {week.days.map((day) => {
                const date = new Date(day.date);
                const dayNum = date.getDate();
                const isSelected = selectedDay === day.date;
                const isTodayDate = isToday(day.date);
                const inMonth = isCurrentMonth(day.date);

                return (
                  <TouchableOpacity
                    key={day.date}
                    onPress={() => setSelectedDay(day.date)}
                    className="flex-1 p-1"
                    style={{
                      backgroundColor: getDayBackground(day.delegations, day.hasGap, day.gapSeverity),
                      minHeight: 60,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isTodayDate ? colors.primary : isSelected ? '#8B5CF6' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isTodayDate || isSelected ? '700' : '400',
                          color: isTodayDate || isSelected ? '#FFFFFF' : inMonth ? colors.foreground : colors.muted,
                        }}
                      >
                        {dayNum}
                      </Text>
                    </View>
                    
                    {/* Delegation indicators */}
                    <View className="flex-row flex-wrap justify-center mt-1 gap-0.5">
                      {day.delegations.slice(0, 3).map((del, idx) => (
                        <View
                          key={idx}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: del.color,
                          }}
                        />
                      ))}
                      {day.delegations.length > 3 && (
                        <Text className="text-xs text-muted">+{day.delegations.length - 3}</Text>
                      )}
                    </View>

                    {/* Gap indicator */}
                    {day.hasGap && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: getGapColor(day.gapSeverity),
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected Day Details */}
        {selectedDay && (
          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <Text className="font-semibold text-foreground mb-3">
              {new Date(selectedDay).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {calendarMonth?.weeks.flatMap(w => w.days).find(d => d.date === selectedDay)?.delegations.map((del) => (
              <View
                key={del.id}
                className="p-3 rounded-lg mb-2"
                style={{ backgroundColor: del.color + '20', borderLeftWidth: 4, borderLeftColor: del.color }}
              >
                <Text className="font-medium text-foreground">{del.delegatorName}</Text>
                <Text className="text-sm text-muted">→ {del.delegateName}</Text>
                <Text className="text-xs text-muted mt-1">{del.reason}</Text>
                <View className="flex-row items-center mt-2">
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: del.status === 'active' ? STATUS_COLORS.active.background : STATUS_COLORS.pending.background,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: del.status === 'active' ? STATUS_COLORS.active.text : STATUS_COLORS.pending.text,
                        fontWeight: '600',
                      }}
                    >
                      {del.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {calendarMonth?.weeks.flatMap(w => w.days).find(d => d.date === selectedDay)?.delegations.length === 0 && (
              <Text className="text-muted text-center py-4">No delegations on this day</Text>
            )}
          </View>
        )}

        {/* Coverage Gaps */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Coverage Gaps</Text>
          {gaps.length === 0 ? (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-muted text-center">No coverage gaps detected</Text>
            </View>
          ) : (
            gaps.map((gap) => (
              <View
                key={gap.id}
                className="bg-surface rounded-xl p-4 border mb-2"
                style={{ borderColor: getGapColor(gap.severity) }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: getGapColor(gap.severity) + '20',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: getGapColor(gap.severity), fontWeight: '700' }}>
                      {gap.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    {new Date(gap.startDate).toLocaleDateString()} - {new Date(gap.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-foreground font-medium mb-1">{gap.description}</Text>
                <Text className="text-sm text-muted mb-2">
                  Affected: {gap.affectedRoles.join(', ')}
                </Text>
                <View className="flex-row flex-wrap gap-1">
                  {gap.suggestedDelegates.map((delegate, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        backgroundColor: STATUS_COLORS.active.background,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: STATUS_COLORS.active.text }}>
                        Assign: {delegate}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
