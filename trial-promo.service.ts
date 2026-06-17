/**
 * Trial & Promotional Offer Service
 * Manages 30-day free trial and promotional pricing
 * Automatic Pro upgrade offer ($100 AUD/year)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrialStatus {
  isActive: boolean;
  startDate: number;
  endDate: number;
  daysRemaining: number;
  percentageUsed: number;
  hasExpired: boolean;
}

export interface PromoOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  validFrom: number;
  validUntil: number;
  maxUses: number;
  usesRemaining: number;
  isActive: boolean;
  terms: string;
}

export interface UserTrial {
  userId: string;
  trialStartDate: number;
  trialEndDate: number;
  isActive: boolean;
  hasConverted: boolean;
  convertedAt?: number;
  promoCodeUsed?: string;
}

const TRIAL_DURATION_DAYS = 30;
const PRO_ANNUAL_PRICE_AUD = 100;
const PRO_MONTHLY_PRICE_AUD = 9.99;

const DEFAULT_PROMO_OFFER: PromoOffer = {
  id: 'promo-pro-annual-100',
  code: 'MEDIVAC-PRO-100',
  title: '30-Day Free Trial + Pro Annual',
  description: 'Get 30 days free, then upgrade to Pro for $100 AUD/year',
  discountType: 'fixed',
  discountValue: 100,
  originalPrice: 100,
  discountedPrice: 100,
  currency: 'AUD',
  billingPeriod: 'annual',
  validFrom: Date.now(),
  validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  maxUses: 999999,
  usesRemaining: 999999,
  isActive: true,
  terms: 'Valid for new users only. 30-day free trial included. Annual subscription at $100 AUD after trial.',
};

class TrialPromoService {
  private userTrial: UserTrial | null = null;
  private promoOffers: PromoOffer[] = [DEFAULT_PROMO_OFFER];

  async initialize(userId: string): Promise<void> {
    await this.loadUserTrial(userId);

    // If no trial exists, create one
    if (!this.userTrial) {
      await this.createTrial(userId);
    }
  }

  /**
   * Create new trial for user
   */
  async createTrial(userId: string): Promise<UserTrial> {
    const now = Date.now();
    const trialEndDate = now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

    this.userTrial = {
      userId,
      trialStartDate: now,
      trialEndDate,
      isActive: true,
      hasConverted: false,
    };

    await this.saveTrial();
    return this.userTrial;
  }

  /**
   * Get trial status
   */
  getTrialStatus(): TrialStatus {
    if (!this.userTrial) {
      return {
        isActive: false,
        startDate: 0,
        endDate: 0,
        daysRemaining: 0,
        percentageUsed: 0,
        hasExpired: true,
      };
    }

    const now = Date.now();
    const totalDuration = this.userTrial.trialEndDate - this.userTrial.trialStartDate;
    const elapsedTime = now - this.userTrial.trialStartDate;
    const daysRemaining = Math.ceil((this.userTrial.trialEndDate - now) / (1000 * 60 * 60 * 24));
    const percentageUsed = Math.round((elapsedTime / totalDuration) * 100);
    const hasExpired = now >= this.userTrial.trialEndDate;

    return {
      isActive: this.userTrial.isActive && !hasExpired,
      startDate: this.userTrial.trialStartDate,
      endDate: this.userTrial.trialEndDate,
      daysRemaining: Math.max(0, daysRemaining),
      percentageUsed: Math.min(100, percentageUsed),
      hasExpired,
    };
  }

  /**
   * Check if trial is active
   */
  isTrialActive(): boolean {
    return this.getTrialStatus().isActive;
  }

  /**
   * Get trial expiry date
   */
  getTrialExpiryDate(): Date {
    if (!this.userTrial) {
      return new Date();
    }
    return new Date(this.userTrial.trialEndDate);
  }

  /**
   * Get days remaining in trial
   */
  getDaysRemaining(): number {
    return this.getTrialStatus().daysRemaining;
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrial(promoCode?: string): Promise<boolean> {
    if (!this.userTrial) {
      return false;
    }

    this.userTrial.hasConverted = true;
    this.userTrial.convertedAt = Date.now();
    if (promoCode) {
      this.userTrial.promoCodeUsed = promoCode;
    }

    await this.saveTrial();
    return true;
  }

  /**
   * End trial early
   */
  async endTrialEarly(): Promise<void> {
    if (this.userTrial) {
      this.userTrial.isActive = false;
      await this.saveTrial();
    }
  }

  /**
   * Get promotional offers
   */
  getPromoOffers(): PromoOffer[] {
    const now = Date.now();
    return this.promoOffers.filter(
      offer =>
        offer.isActive &&
        offer.validFrom <= now &&
        offer.validUntil >= now &&
        offer.usesRemaining > 0
    );
  }

  /**
   * Get default pro offer
   */
  getDefaultProOffer(): PromoOffer {
    return DEFAULT_PROMO_OFFER;
  }

  /**
   * Get pro annual pricing
   */
  getProAnnualPrice(): { price: number; currency: string } {
    return {
      price: PRO_ANNUAL_PRICE_AUD,
      currency: 'AUD',
    };
  }

  /**
   * Get pro monthly pricing
   */
  getProMonthlyPrice(): { price: number; currency: string } {
    return {
      price: PRO_MONTHLY_PRICE_AUD,
      currency: 'AUD',
    };
  }

  /**
   * Validate promo code
   */
  validatePromoCode(code: string): PromoOffer | null {
    const offer = this.promoOffers.find(
      o =>
        o.code === code &&
        o.isActive &&
        o.validFrom <= Date.now() &&
        o.validUntil >= Date.now() &&
        o.usesRemaining > 0
    );

    return offer || null;
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(code: string): Promise<PromoOffer | null> {
    const offer = this.validatePromoCode(code);
    if (!offer) {
      return null;
    }

    // Decrement uses
    offer.usesRemaining--;
    if (offer.usesRemaining <= 0) {
      offer.isActive = false;
    }

    await this.saveOffers();
    return offer;
  }

  /**
   * Get trial stats
   */
  getTrialStats() {
    const status = this.getTrialStatus();
    return {
      isActive: status.isActive,
      daysRemaining: status.daysRemaining,
      percentageUsed: status.percentageUsed,
      hasExpired: status.hasExpired,
      hasConverted: this.userTrial?.hasConverted || false,
      trialEndDate: this.userTrial?.trialEndDate || 0,
      proAnnualPrice: PRO_ANNUAL_PRICE_AUD,
      proMonthlyPrice: PRO_MONTHLY_PRICE_AUD,
      currency: 'AUD',
    };
  }

  /**
   * Get trial offer message
   */
  getTrialOfferMessage(): string {
    const status = this.getTrialStatus();

    if (!status.isActive) {
      return 'Your trial has expired. Upgrade to Pro to continue.';
    }

    if (status.daysRemaining <= 3) {
      return `Your trial expires in ${status.daysRemaining} days! Upgrade to Pro for $100 AUD/year.`;
    }

    if (status.daysRemaining <= 7) {
      return `Your trial expires in ${status.daysRemaining} days. Upgrade to Pro now!`;
    }

    return `You have ${status.daysRemaining} days left in your free trial.`;
  }

  /**
   * Should show upgrade prompt
   */
  shouldShowUpgradePrompt(): boolean {
    const status = this.getTrialStatus();
    return !status.isActive || status.daysRemaining <= 7;
  }

  // Private methods

  private async loadUserTrial(userId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`trial_${userId}`);
      if (stored) {
        this.userTrial = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Trial Promo] Error loading trial:', error);
    }
  }

  private async saveTrial(): Promise<void> {
    try {
      if (this.userTrial) {
        await AsyncStorage.setItem(`trial_${this.userTrial.userId}`, JSON.stringify(this.userTrial));
      }
    } catch (error) {
      console.error('[Trial Promo] Error saving trial:', error);
    }
  }

  private async saveOffers(): Promise<void> {
    try {
      await AsyncStorage.setItem('promo_offers', JSON.stringify(this.promoOffers));
    } catch (error) {
      console.error('[Trial Promo] Error saving offers:', error);
    }
  }
}

export const trialPromoService = new TrialPromoService();
