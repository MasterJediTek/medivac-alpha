/**
 * Subscription & In-App Purchase Screen
 * Displays trial status, upgrade options, and JEDI partnership benefits
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { trialPromoService, TrialStatus } from '@/lib/services/trial-promo.service';
import { jediPartnershipService } from '@/lib/services/jedi-partnership.service';
import { stripePaymentService } from '@/lib/services/stripe-payment.service';

export default function SubscriptionScreen() {
  const colors = useColors();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [currentTier, setCurrentTier] = useState<'free' | 'pro' | 'enterprise'>('free');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      await trialPromoService.initialize('user-123'); // Replace with actual user ID
      const status = trialPromoService.getTrialStatus();
      setTrialStatus(status);

      // Get current tier
      const tier = stripePaymentService.getCurrentTier();
      setCurrentTier(tier as 'free' | 'pro' | 'enterprise');
    } catch (error) {
      console.error('[Subscription] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setUpgrading(true);
    try {
      // Create checkout session
      const session = await stripePaymentService.createCheckoutSession(
        'premium',
        'user-123',
        'user@example.com'
      );

      // In a real app, you would open the Stripe checkout URL
      console.log('[Subscription] Checkout session:', session);

      // For now, simulate successful upgrade
      await trialPromoService.convertTrial('MEDIVAC-PRO-100');
      await jediPartnershipService.initialize('user-123', 'pro');

      setCurrentTier('pro');
      await loadSubscriptionData();
    } catch (error) {
      console.error('[Subscription] Error upgrading:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const handleUpgradeToEnterprise = async () => {
    setUpgrading(true);
    try {
      const session = await stripePaymentService.createCheckoutSession(
        'enterprise',
        'user-123',
        'user@example.com'
      );
      console.log('[Subscription] Enterprise checkout session:', session);
    } catch (error) {
      console.error('[Subscription] Error upgrading to enterprise:', error);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const stats = trialPromoService.getTrialStats();
  const jediStats = jediPartnershipService.getAccessStats();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Subscription</Text>
          <Text className="text-muted">Manage your plan and JEDI access</Text>
        </View>

        {/* Trial Status Card */}
        {trialStatus?.isActive && (
          <View className="bg-success/10 rounded-2xl p-4 mb-4 border border-success/30">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-success font-bold text-lg">Free Trial Active</Text>
              <View className="bg-success/20 rounded-full px-3 py-1">
                <Text className="text-success font-semibold text-sm">
                  {stats.daysRemaining} days left
                </Text>
              </View>
            </View>

            {/* Trial Progress */}
            <View className="mb-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-success text-sm">Trial Progress</Text>
                <Text className="text-success font-semibold text-sm">{stats.percentageUsed}%</Text>
              </View>
              <View className="bg-success/20 rounded-full h-2 overflow-hidden">
                <View
                  className="h-full bg-success rounded-full"
                  style={{ width: `${stats.percentageUsed}%` }}
                />
              </View>
            </View>

            <Text className="text-success text-sm">
              Your 30-day free trial includes full access to all Pro features and JEDI Systems.
            </Text>
          </View>
        )}

        {/* Current Plan */}
        <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
          <Text className="text-foreground font-bold text-lg mb-4">Current Plan</Text>

          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
            <View>
              <Text className="text-foreground font-semibold text-lg capitalize">
                {currentTier} Plan
              </Text>
              <Text className="text-muted text-sm">
                {currentTier === 'free'
                  ? 'Basic hospital access'
                  : currentTier === 'pro'
                  ? 'Full access + JEDI Systems'
                  : 'Enterprise with dedicated support'}
              </Text>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor:
                  currentTier === 'free'
                    ? colors.muted + '20'
                    : currentTier === 'pro'
                    ? colors.primary + '20'
                    : colors.success + '20',
              }}
            >
              <Text
                className="font-semibold text-xs"
                style={{
                  color:
                    currentTier === 'free'
                      ? colors.muted
                      : currentTier === 'pro'
                      ? colors.primary
                      : colors.success,
                }}
              >
                ACTIVE
              </Text>
            </View>
          </View>

          {/* Plan Features */}
          <View>
            {currentTier === 'free' && (
              <>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Basic hospital navigation</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Department directory</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Patient records (read-only)</Text>
                </View>
              </>
            )}

            {currentTier === 'pro' && (
              <>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">All Free features</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Advanced route planning</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Real-time capacity alerts</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">JEDI Systems access</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Offline data sync</Text>
                </View>
              </>
            )}

            {currentTier === 'enterprise' && (
              <>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">All Pro features</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">API access</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Custom integrations</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">Dedicated support</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-foreground">SLA guarantee</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* JEDI Partnership Benefits */}
        <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
          <View className="flex-row items-center gap-2 mb-4">
            <View
              className="w-10 h-10 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <IconSymbol name="network" size={20} color={colors.primary} />
            </View>
            <Text className="text-foreground font-bold text-lg">JEDI Partnership</Text>
          </View>

          <View className="grid grid-cols-2 gap-3 mb-4">
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Systems</Text>
              <Text className="text-foreground font-bold text-lg">{jediStats.systemsCount}</Text>
            </View>
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Plugins</Text>
              <Text className="text-foreground font-bold text-lg">{jediStats.pluginsCount}</Text>
            </View>
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Portals</Text>
              <Text className="text-foreground font-bold text-lg">{jediStats.portalsCount}</Text>
            </View>
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Installed</Text>
              <Text className="text-foreground font-bold text-lg">{jediStats.installedPlugins}</Text>
            </View>
          </View>

          <Pressable className="bg-primary py-2 rounded-lg items-center">
            <Text className="text-white font-semibold">Explore JEDI Systems</Text>
          </Pressable>
        </View>

        {/* Upgrade Options */}
        {currentTier === 'free' && (
          <View className="gap-4 mb-6">
            {/* Pro Plan */}
            <View className="bg-primary/10 rounded-2xl p-4 border-2 border-primary">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-primary font-bold text-lg">Pro Plan</Text>
                  <Text className="text-muted text-sm">$100 AUD/year after trial</Text>
                </View>
                <View className="bg-primary rounded-full px-3 py-1">
                  <Text className="text-white font-bold text-xs">RECOMMENDED</Text>
                </View>
              </View>

              <View className="mb-4 space-y-2">
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  <Text className="text-foreground text-sm">Advanced routing & capacity alerts</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  <Text className="text-foreground text-sm">Full JEDI Systems access</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                  <Text className="text-foreground text-sm">Offline sync & plugins</Text>
                </View>
              </View>

              <Pressable
                onPress={handleUpgradeToPro}
                disabled={upgrading}
                className={cn(
                  'py-3 rounded-lg items-center',
                  upgrading ? 'bg-muted opacity-50' : 'bg-primary'
                )}
              >
                {upgrading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Upgrade to Pro</Text>
                )}
              </Pressable>
            </View>

            {/* Enterprise Plan */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="mb-3">
                <Text className="text-foreground font-bold text-lg">Enterprise Plan</Text>
                <Text className="text-muted text-sm">Custom pricing</Text>
              </View>

              <View className="mb-4 space-y-2">
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  <Text className="text-foreground text-sm">All Pro features</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  <Text className="text-foreground text-sm">API access & custom integrations</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  <Text className="text-foreground text-sm">Dedicated support & SLA</Text>
                </View>
              </View>

              <Pressable
                onPress={handleUpgradeToEnterprise}
                className="py-3 rounded-lg items-center border border-foreground"
              >
                <Text className="text-foreground font-semibold">Contact Sales</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Billing Info */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-foreground font-bold text-lg mb-3">Billing Information</Text>
          <Pressable className="flex-row items-center justify-between py-3 border-b border-border">
            <Text className="text-foreground">Payment Methods</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
          <Pressable className="flex-row items-center justify-between py-3 border-b border-border">
            <Text className="text-foreground">Invoices</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
          <Pressable className="flex-row items-center justify-between py-3">
            <Text className="text-foreground">Billing History</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
