/**
 * Storage Tier Pricing Screen
 * Cost tracking for different retention tiers to optimize storage budgets
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  storagePricingService,
  StorageAnalytics,
  DepartmentBudget,
  CostForecast,
  BudgetAlert,
  TierPricing,
} from '@/lib/services/storage-pricing-service';

type TabType = 'overview' | 'tiers' | 'budgets' | 'alerts' | 'forecasts';

export default function StoragePricingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
  const [tiers, setTiers] = useState<TierPricing[]>([]);
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [forecasts, setForecasts] = useState<CostForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await storagePricingService.initialize();
      setAnalytics(storagePricingService.getAnalytics());
      setTiers(storagePricingService.getAllTierPricing());
      setBudgets(storagePricingService.getAllBudgets());
      setAlerts(storagePricingService.getAlerts({ status: 'active' }));

      // Get forecasts for all departments
      const allBudgets = storagePricingService.getAllBudgets();
      const allForecasts = allBudgets.map(b => storagePricingService.getForecast(b.departmentId));
      setForecasts(allForecasts);
    } catch (error) {
      console.error('Failed to load storage pricing data:', error);
    }
    setLoading(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await storagePricingService.acknowledgeAlert(alertId, 'current_user');
      loadData();
      Alert.alert('Success', 'Alert acknowledged');
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatStorage = (gb: number): string => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'standard': return '#3B82F6';
      case 'important': return '#10B981';
      case 'critical': return '#F59E0B';
      case 'permanent': return '#EF4444';
      case 'archive': return '#8B5CF6';
      default: return colors.primary;
    }
  };

  const renderOverview = () => {
    if (!analytics) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="server" size={24} color={colors.primary} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {formatStorage(analytics.totalStorageGB)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Total Storage</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="cash" size={24} color="#10B981" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {formatCurrency(analytics.totalMonthlyCost)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Monthly Cost</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="trending-down" size={24} color="#F59E0B" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {formatCurrency(analytics.averageCostPerGB)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Avg Cost/GB</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="bulb" size={24} color="#8B5CF6" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginTop: 8 }}>
              {formatCurrency(analytics.savingsOpportunities)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Potential Savings</Text>
          </View>
        </View>

        {/* Storage by Tier */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          Storage by Tier
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {analytics.storageByTier.map((tier) => (
            <View key={tier.tier} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: getTierColor(tier.tier),
                      marginRight: 8,
                    }}
                  />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, textTransform: 'capitalize' }}>
                    {tier.tier}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: colors.muted }}>
                  {formatStorage(tier.usageGB)} • {formatCurrency(tier.cost)}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.border,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${tier.percentage}%`,
                    backgroundColor: getTierColor(tier.tier),
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Cost by Department */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
          Cost by Department
        </Text>
        {analytics.costByDepartment.slice(0, 5).map((dept, index) => (
          <View
            key={dept.departmentId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.primary,
                width: 30,
              }}
            >
              #{index + 1}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                {dept.departmentName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {dept.percentage.toFixed(1)}% of total
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
              {formatCurrency(dept.cost)}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderTiers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {tiers.map((tier) => (
        <View
          key={tier.tier}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderLeftWidth: 4,
            borderLeftColor: getTierColor(tier.tier),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
                {tier.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {tier.description}
              </Text>
            </View>
            {tier.isDefault && (
              <View
                style={{
                  backgroundColor: colors.primary + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
                  DEFAULT
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.foreground }}>
              {formatCurrency(tier.pricePerGBMonth)}
              <Text style={{ fontSize: 14, fontWeight: '400', color: colors.muted }}>
                {' '}/GB/month
              </Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="time" size={16} color={colors.muted} />
            <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 6 }}>
              Retention: {tier.minRetentionDays} - {tier.maxRetentionDays || '∞'} days
            </Text>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
            Features:
          </Text>
          {tier.features.map((feature, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 8 }}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderBudgets = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {budgets.map((budget) => {
        const status = storagePricingService.checkBudgetStatus(budget.departmentId);
        const statusColor = status.status === 'ok' ? '#10B981' :
          status.status === 'warning' ? '#F59E0B' :
          status.status === 'critical' ? '#EF4444' : '#DC2626';

        return (
          <View
            key={budget.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {budget.departmentName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  Budget: {formatCurrency(budget.monthlyBudget)}/month
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: statusColor + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: statusColor, fontWeight: '600', textTransform: 'uppercase' }}>
                  {status.status}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {formatCurrency(budget.currentMonthSpend)} of {formatCurrency(budget.monthlyBudget)}
                </Text>
                <Text style={{ fontSize: 12, color: statusColor, fontWeight: '600' }}>
                  {status.percentage.toFixed(0)}%
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.border,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(status.percentage, 100)}%`,
                    backgroundColor: statusColor,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 11, color: colors.muted }}>Year-to-Date</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(budget.currentYearSpend)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Yearly Budget</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(budget.yearlyBudget)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderAlerts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {alerts.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text style={{ fontSize: 16, color: colors.foreground, marginTop: 12, fontWeight: '600' }}>
            No Active Alerts
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            All budgets are within thresholds
          </Text>
        </View>
      ) : (
        alerts.map((alert) => {
          const severityColor = alert.severity === 'info' ? '#3B82F6' :
            alert.severity === 'warning' ? '#F59E0B' : '#EF4444';

          return (
            <View
              key={alert.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 4,
                borderLeftColor: severityColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons
                  name={alert.severity === 'critical' ? 'alert-circle' : 'warning'}
                  size={20}
                  color={severityColor}
                />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginLeft: 8, flex: 1 }}>
                  {alert.title}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {new Date(alert.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
                {alert.message}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {alert.departmentName}
                </Text>
                <TouchableOpacity
                  onPress={() => handleAcknowledgeAlert(alert.id)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
                    Acknowledge
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderForecasts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {forecasts.map((forecast) => {
        const trendColor = forecast.trend === 'increasing' ? '#EF4444' :
          forecast.trend === 'decreasing' ? '#10B981' : '#F59E0B';
        const trendIcon = forecast.trend === 'increasing' ? 'trending-up' :
          forecast.trend === 'decreasing' ? 'trending-down' : 'remove';

        return (
          <View
            key={forecast.departmentId}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {forecast.departmentName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={trendIcon as any} size={16} color={trendColor} />
                <Text style={{ fontSize: 12, color: trendColor, marginLeft: 4, fontWeight: '600' }}>
                  {forecast.trendPercent > 0 ? '+' : ''}{forecast.trendPercent.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>This Month</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(forecast.currentMonthProjected)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Next Month</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(forecast.nextMonthProjected)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Year End</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(forecast.yearEndProjected)}
                </Text>
              </View>
            </View>

            {forecast.recommendations.length > 0 && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                  Recommendations
                </Text>
                {forecast.recommendations.slice(0, 2).map((rec) => (
                  <View
                    key={rec.id}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="bulb" size={14} color="#F59E0B" />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground, marginLeft: 6, flex: 1 }}>
                        {rec.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>
                        Save {formatCurrency(rec.potentialSavings)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {rec.description}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
                Storage Pricing
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                Cost tracking & optimization
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'overview', label: 'Overview', icon: 'pie-chart' },
                { key: 'tiers', label: 'Tiers', icon: 'layers' },
                { key: 'budgets', label: 'Budgets', icon: 'wallet' },
                { key: 'alerts', label: 'Alerts', icon: 'notifications' },
                { key: 'forecasts', label: 'Forecasts', icon: 'analytics' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as TabType)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeTab === tab.key ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.key ? '#FFFFFF' : colors.muted}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: activeTab === tab.key ? '#FFFFFF' : colors.muted,
                      marginLeft: 6,
                    }}
                  >
                    {tab.label}
                  </Text>
                  {tab.key === 'alerts' && alerts.length > 0 && (
                    <View
                      style={{
                        backgroundColor: '#EF4444',
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>
                        {alerts.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tiers' && renderTiers()}
          {activeTab === 'budgets' && renderBudgets()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'forecasts' && renderForecasts()}
        </View>
      </View>
    </ScreenContainer>
  );
}
