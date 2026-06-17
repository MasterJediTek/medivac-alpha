/**
 * Stripe Payment Tier Service
 * Manages subscription tiers, payment processing, and tier-based feature access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  features: string[];
  stripePriceId: string;
  stripeProductId: string;
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: number;
  paidDate?: number;
  pdfUrl: string;
  createdAt: number;
}

const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [
      'Basic hospital navigation',
      'Department directory',
      'Vital signs monitoring',
      'Patient records (read-only)',
      'Basic messaging',
    ],
    stripePriceId: '',
    stripeProductId: '',
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [
      'All Free features',
      'Advanced route planning',
      'Real-time capacity alerts',
      'Visitor pre-registration',
      'Family member management',
      'Offline data sync',
      'Priority support',
      'Custom notifications',
      'Advanced analytics',
    ],
    stripePriceId: 'price_premium_monthly',
    stripeProductId: 'prod_premium',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [
      'All Premium features',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Advanced security',
      'White-label options',
      'Multi-location support',
      'Custom reporting',
      'SLA guarantee',
      'Training & onboarding',
    ],
    stripePriceId: 'price_enterprise_monthly',
    stripeProductId: 'prod_enterprise',
  },
};

class StripePaymentService {
  private stripeApiKey: string = '';
  private currentSubscription: UserSubscription | null = null;
  private paymentMethods: PaymentMethod[] = [];
  private invoices: Invoice[] = [];

  async initialize(apiKey: string): Promise<void> {
    this.stripeApiKey = apiKey;
    await this.loadSubscription();
    await this.loadPaymentMethods();
    await this.loadInvoices();
  }

  /**
   * Get subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Get plan by tier
   */
  getPlan(tier: SubscriptionTier): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[tier];
  }

  /**
   * Get current subscription
   */
  getCurrentSubscription(): UserSubscription | null {
    return this.currentSubscription;
  }

  /**
   * Get current tier
   */
  getCurrentTier(): SubscriptionTier {
    return this.currentSubscription?.tier || 'free';
  }

  /**
   * Check if feature is available for current tier
   */
  isFeatureAvailable(feature: string): boolean {
    const tier = this.getCurrentTier();
    const plan = SUBSCRIPTION_PLANS[tier];
    return plan.features.includes(feature);
  }

  /**
   * Check if tier is active
   */
  isTierActive(tier: SubscriptionTier): boolean {
    if (!this.currentSubscription) return tier === 'free';
    return this.currentSubscription.tier === tier && this.currentSubscription.status === 'active';
  }

  /**
   * Create checkout session for subscription upgrade
   */
  async createCheckoutSession(
    tier: SubscriptionTier,
    userId: string,
    email: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const plan = SUBSCRIPTION_PLANS[tier];

      // Call Stripe API to create checkout session
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.stripeApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          'line_items[0][price]': plan.stripePriceId,
          'line_items[0][quantity]': '1',
          mode: 'subscription',
          success_url: 'medivac://subscription/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'medivac://subscription/cancel',
          customer_email: email,
          metadata: JSON.stringify({ userId, tier }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const session = await response.json();
      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('[Stripe] Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(
    cardToken: string,
    billingDetails: {
      name: string;
      email: string;
      address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
    }
  ): Promise<PaymentMethod> {
    try {
      const response = await fetch('https://api.stripe.com/v1/payment_methods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.stripeApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          type: 'card',
          card: cardToken,
          'billing_details[name]': billingDetails.name,
          'billing_details[email]': billingDetails.email,
          ...(billingDetails.address && {
            'billing_details[address][line1]': billingDetails.address.line1,
            'billing_details[address][line2]': billingDetails.address.line2 || '',
            'billing_details[address][city]': billingDetails.address.city,
            'billing_details[address][state]': billingDetails.address.state,
            'billing_details[address][postal_code]': billingDetails.address.postalCode,
            'billing_details[address][country]': billingDetails.address.country,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const paymentMethod = await response.json();
      const method: PaymentMethod = {
        id: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        isDefault: false,
      };

      this.paymentMethods.push(method);
      await this.savePaymentMethods();
      return method;
    } catch (error) {
      console.error('[Stripe] Error creating payment method:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(methodId: string): Promise<void> {
    this.paymentMethods = this.paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === methodId,
    }));
    await this.savePaymentMethods();
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      await fetch(`https://api.stripe.com/v1/payment_methods/${methodId}/detach`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.stripeApiKey}`,
        },
      });

      this.paymentMethods = this.paymentMethods.filter(m => m.id !== methodId);
      await this.savePaymentMethods();
    } catch (error) {
      console.error('[Stripe] Error deleting payment method:', error);
      throw error;
    }
  }

  /**
   * Get invoices
   */
  getInvoices(): Invoice[] {
    return this.invoices;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<string> {
    const invoice = this.invoices.find(i => i.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice.pdfUrl;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(atPeriodEnd: boolean = true): Promise<void> {
    if (!this.currentSubscription?.stripeSubscriptionId) {
      throw new Error('No active subscription');
    }

    try {
      const response = await fetch(
        `https://api.stripe.com/v1/subscriptions/${this.currentSubscription.stripeSubscriptionId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.stripeApiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            cancel_at_period_end: atPeriodEnd ? 'true' : 'false',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const subscription = await response.json();
      if (this.currentSubscription) {
        this.currentSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        this.currentSubscription.status = subscription.status;
        await this.saveSubscription();
      }
    } catch (error) {
      console.error('[Stripe] Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(): Promise<void> {
    if (!this.currentSubscription?.stripeSubscriptionId) {
      throw new Error('No subscription to reactivate');
    }

    try {
      const response = await fetch(
        `https://api.stripe.com/v1/subscriptions/${this.currentSubscription.stripeSubscriptionId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.stripeApiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            cancel_at_period_end: 'false',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const subscription = await response.json();
      if (this.currentSubscription) {
        this.currentSubscription.cancelAtPeriodEnd = false;
        this.currentSubscription.status = subscription.status;
        await this.saveSubscription();
      }
    } catch (error) {
      console.error('[Stripe] Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription stats
   */
  getSubscriptionStats() {
    return {
      currentTier: this.getCurrentTier(),
      isActive: this.currentSubscription?.status === 'active',
      daysUntilRenewal: this.currentSubscription
        ? Math.ceil((this.currentSubscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
      cancelAtPeriodEnd: this.currentSubscription?.cancelAtPeriodEnd || false,
      paymentMethodCount: this.paymentMethods.length,
      invoiceCount: this.invoices.length,
    };
  }

  // Private methods

  private async loadSubscription(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('subscription');
      if (stored) {
        this.currentSubscription = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Stripe] Error loading subscription:', error);
    }
  }

  private async saveSubscription(): Promise<void> {
    try {
      if (this.currentSubscription) {
        await AsyncStorage.setItem('subscription', JSON.stringify(this.currentSubscription));
      }
    } catch (error) {
      console.error('[Stripe] Error saving subscription:', error);
    }
  }

  private async loadPaymentMethods(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('payment_methods');
      if (stored) {
        this.paymentMethods = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Stripe] Error loading payment methods:', error);
    }
  }

  private async savePaymentMethods(): Promise<void> {
    try {
      await AsyncStorage.setItem('payment_methods', JSON.stringify(this.paymentMethods));
    } catch (error) {
      console.error('[Stripe] Error saving payment methods:', error);
    }
  }

  private async loadInvoices(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('invoices');
      if (stored) {
        this.invoices = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Stripe] Error loading invoices:', error);
    }
  }
}

export const stripePaymentService = new StripePaymentService();
