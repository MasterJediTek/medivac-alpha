/**
 * Wait Time Alerts Management - v9.21
 * Manage wait time alert subscriptions, view triggered alert history,
 * and monitor current department wait statuses in real-time.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import {
  WaitAlertService,
  type WaitAlertSubscription,
  type WaitAlertNotification,
} from '@/lib/services/wait-alert.service';
import { WaitTimeService, type DepartmentWaitTime } from '@/lib/services/wait-time.service';

export default function WaitAlertsScreen() {
  const colors = useColors();
  const router = useRouter();
  const alertServiceRef = useRef<WaitAlertService | null>(null);
  const waitServiceRef = useRef<WaitTimeService | null>(null);

  const [subscriptions, setSubscriptions] = useState<WaitAlertSubscription[]>([]);
  const [history, setHistory] = useState<WaitAlertNotification[]>([]);
  const [waitTimes, setWaitTimes] = useState<Map<string, DepartmentWaitTime>>(new Map());
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    const as = WaitAlertService.getInstance();
    alertServiceRef.current = as;
    setSubscriptions(as.getAllSubscriptions());
    setHistory(as.getAlertHistory());

    const ws = WaitTimeService.getInstance();
    waitServiceRef.current = ws;
    const times = ws.refreshAll();
    const map = new Map<string, DepartmentWaitTime>();
    times.forEach(t => map.set(t.departmentId, t));
    setWaitTimes(map);

    const unsubChange = as.onSubscriptionChange(subs => setSubscriptions([...subs]));
    const unsubAlert = as.onAlert(() => setHistory(as.getAlertHistory()));
    const unsubWait = ws.subscribe(newTimes => {
      const m = new Map<string, DepartmentWaitTime>();
      newTimes.forEach(t => m.set(t.departmentId, t));
      setWaitTimes(m);
    });
    ws.startAutoRefresh(30000);

    return () => {
      unsubChange();
      unsubAlert();
      unsubWait();
      ws.stopAutoRefresh();
    };
  }, []);

  const handlePauseAll = useCallback(() => {
    const as = alertServiceRef.current;
    if (!as) return;
    subscriptions.filter(s => s.isActive).forEach(s => as.unsubscribe(s.id));
  }, [subscriptions]);

  const handleResumeAll = useCallback(() => {
    const as = alertServiceRef.current;
    if (!as) return;
    subscriptions.filter(s => !s.isActive).forEach(s => as.reactivate(s.id));
  }, [subscriptions]);

  const handleDelete = useCallback((id: string) => {
    alertServiceRef.current?.removeSubscription(id);
  }, []);

  const handleToggle = useCallback((sub: WaitAlertSubscription) => {
    const as = alertServiceRef.current;
    if (!as) return;
    if (sub.isActive) as.unsubscribe(sub.id);
    else as.reactivate(sub.id);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    alertServiceRef.current?.markAllRead();
    setHistory(alertServiceRef.current?.getAlertHistory() || []);
  }, []);

  const handleClearHistory = useCallback(() => {
    alertServiceRef.current?.clearHistory();
    setHistory([]);
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    alertServiceRef.current?.markAlertRead(id);
    setHistory(alertServiceRef.current?.getAlertHistory() || []);
  }, []);

  const activeSubs = subscriptions.filter(s => s.isActive);
  const pausedSubs = subscriptions.filter(s => !s.isActive);
  const unreadCount = history.filter(h => !h.isRead).length;

  const getUrgencyColor = (waitMin: number): string => {
    if (waitMin <= 10) return '#22C55E';
    if (waitMin <= 20) return '#F59E0B';
    if (waitMin <= 35) return '#F97316';
    return '#EF4444';
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <ScreenContainer className="p-0">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>⏱ Wait Time Alerts</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{activeSubs.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{pausedSubs.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Paused</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#22C55E15', borderColor: '#22C55E30' }]}>
          <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{history.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Triggered</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{unreadCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Unread</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? colors.primary : colors.muted }]}>
            Subscriptions ({subscriptions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.primary : colors.muted }]}>
            History ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {activeTab === 'active' ? (
          <>
            {subscriptions.length > 0 && (
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={[styles.bulkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handlePauseAll}
                >
                  <Text style={[styles.bulkBtnText, { color: '#F59E0B' }]}>⏸ Pause All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handleResumeAll}
                >
                  <Text style={[styles.bulkBtnText, { color: '#22C55E' }]}>▶ Resume All</Text>
                </TouchableOpacity>
              </View>
            )}

            {subscriptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔕</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Wait Time Alerts</Text>
                <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                  Tap any department on the hospital map and set a wait time threshold to get notified when it drops.
                </Text>
              </View>
            ) : (
              subscriptions.map(sub => {
                const currentWait = waitTimes.get(sub.departmentId);
                const waitMin = currentWait?.waitMinutes || 0;
                const urgencyColor = getUrgencyColor(waitMin);
                const isBelow = waitMin <= sub.thresholdMinutes && waitMin > 0;

                return (
                  <View
                    key={sub.id}
                    style={[
                      styles.subCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: sub.isActive ? (isBelow ? '#22C55E40' : colors.border) : '#F59E0B40',
                        opacity: sub.isActive ? 1 : 0.7,
                      },
                    ]}
                  >
                    <View style={styles.subCardHeader}>
                      <View style={styles.subCardInfo}>
                        <Text style={[styles.subDeptName, { color: colors.foreground }]}>{sub.departmentName}</Text>
                        <Text style={[styles.subThreshold, { color: colors.muted }]}>
                          Alert when under {sub.thresholdMinutes} min
                        </Text>
                      </View>
                      <View style={styles.subCardRight}>
                        {currentWait && waitMin > 0 ? (
                          <View style={[styles.currentWaitBadge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '50' }]}>
                            <Text style={[styles.currentWaitText, { color: urgencyColor }]}>{waitMin}m</Text>
                          </View>
                        ) : (
                          <Text style={[styles.noWaitText, { color: colors.muted }]}>—</Text>
                        )}
                      </View>
                    </View>

                    {isBelow && sub.isActive && (
                      <View style={[styles.belowBanner, { backgroundColor: '#22C55E15' }]}>
                        <Text style={styles.belowBannerText}>✅ Currently below your threshold!</Text>
                      </View>
                    )}

                    <View style={styles.subCardMeta}>
                      <Text style={[styles.subMetaText, { color: colors.muted }]}>
                        {sub.isActive ? '🟢 Active' : '🟡 Paused'} • Triggered {sub.triggerCount}x
                        {sub.lastTriggeredAt ? ` • Last: ${formatTime(sub.lastTriggeredAt)}` : ''}
                      </Text>
                    </View>

                    <View style={styles.subCardActions}>
                      <TouchableOpacity
                        style={[styles.subActionBtn, { backgroundColor: sub.isActive ? '#F59E0B15' : '#22C55E15' }]}
                        onPress={() => handleToggle(sub)}
                      >
                        <Text style={[styles.subActionText, { color: sub.isActive ? '#F59E0B' : '#22C55E' }]}>
                          {sub.isActive ? '⏸ Pause' : '▶ Resume'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.subActionBtn, { backgroundColor: '#EF444415' }]}
                        onPress={() => handleDelete(sub.id)}
                      >
                        <Text style={[styles.subActionText, { color: '#EF4444' }]}>🗑 Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            {history.length > 0 && (
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={[styles.bulkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handleMarkAllRead}
                >
                  <Text style={[styles.bulkBtnText, { color: colors.primary }]}>✓ Mark All Read</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handleClearHistory}
                >
                  <Text style={[styles.bulkBtnText, { color: '#EF4444' }]}>🗑 Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Alert History</Text>
                <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                  Alerts appear here when a department's wait time drops below your set threshold.
                </Text>
              </View>
            ) : (
              history.map(notif => (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: notif.isRead ? colors.surface : colors.primary + '08',
                      borderColor: notif.isRead ? colors.border : colors.primary + '30',
                    },
                  ]}
                  onPress={() => handleMarkRead(notif.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyCardLeft}>
                    {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                    <View style={styles.historyCardInfo}>
                      <Text style={[styles.historyDept, { color: colors.foreground, fontWeight: notif.isRead ? '600' : '800' }]}>
                        {notif.departmentName}
                      </Text>
                      <Text style={[styles.historyDetail, { color: colors.muted }]}>
                        Wait dropped to {notif.actualWaitMinutes} min (target: under {notif.thresholdMinutes} min)
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.historyTime, { color: colors.muted }]}>{formatTime(notif.triggeredAt)}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { paddingRight: 12 },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  headerRight: { width: 30, alignItems: 'flex-end' },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryCard: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  tabRow: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },

  content: { flex: 1 },
  contentInner: { padding: 12, paddingBottom: 40 },

  bulkActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  bulkBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  bulkBtnText: { fontSize: 13, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },

  subCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  subCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subCardInfo: { flex: 1 },
  subDeptName: { fontSize: 16, fontWeight: '700' },
  subThreshold: { fontSize: 12, marginTop: 2 },
  subCardRight: { marginLeft: 12 },
  currentWaitBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  currentWaitText: { fontSize: 14, fontWeight: '800' },
  noWaitText: { fontSize: 14 },
  belowBanner: { marginTop: 8, padding: 8, borderRadius: 8 },
  belowBannerText: { fontSize: 12, fontWeight: '700', color: '#22C55E', textAlign: 'center' },
  subCardMeta: { marginTop: 8 },
  subMetaText: { fontSize: 11 },
  subCardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  subActionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  subActionText: { fontSize: 12, fontWeight: '700' },

  historyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  historyCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyCardInfo: { flex: 1 },
  historyDept: { fontSize: 14 },
  historyDetail: { fontSize: 12, marginTop: 2 },
  historyTime: { fontSize: 11, marginLeft: 8 },
});
