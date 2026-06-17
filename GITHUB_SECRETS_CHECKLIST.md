# GitHub Secrets Setup — MediVacAlpha

Add these secrets at: https://github.com/YOUR_REPO/settings/secrets/actions

## Required Secrets (Play Store Publishing)

| Secret Name | Value Source | Required? |
|-------------|-------------|-----------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play Console → Setup → API Access → Create Service Account → Download JSON | ✅ Critical |
| `ANDROID_KEYSTORE_BASE64` | `base64 -i medivac-release.keystore` | ✅ Critical |
| `ANDROID_KEYSTORE_PASSWORD` | Password used when creating keystore | ✅ Critical |
| `ANDROID_KEY_ALIAS` | Key alias (e.g. `medivac_key`) | ✅ Critical |
| `ANDROID_KEY_PASSWORD` | Key password | ✅ Critical |

## Authentication Secrets

| Secret Name | Value Source | Required? |
|-------------|-------------|-----------|
| `GOOGLE_CLIENT_ID` | console.cloud.google.com → OAuth Credentials | ✅ |
| `GOOGLE_CLIENT_SECRET` | Same as above | ✅ |
| `AZURE_CLIENT_ID` | portal.azure.com → App Registrations | ✅ |
| `AZURE_CLIENT_SECRET` | Same as above | ✅ |
| `AZURE_TENANT_ID` | Same as above | ✅ |
| `JWT_SECRET` | Generate: `openssl rand -base64 48` | ✅ |
| `JEDI_SSO_CLIENT_SECRET` | Contact JEDI Council | Optional |

## Payments

| Secret Name | Value Source | Required? |
|-------------|-------------|-----------|
| `STRIPE_SECRET_KEY` | dashboard.stripe.com/apikeys (use `sk_live_...`) | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Same (use `pk_live_...`) | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Endpoint secret | ✅ |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | Stripe Dashboard → Products | ✅ |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | Same | ✅ |

## Monitoring

| Secret Name | Value Source | Required? |
|-------------|-------------|-----------|
| `SENTRY_DSN` | sentry.io → Project → Settings → DSN | Recommended |
| `SENTRY_AUTH_TOKEN` | sentry.io → Settings → Auth Tokens | Recommended |

## Infrastructure

| Secret Name | Value Source | Required? |
|-------------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `FCM_SERVER_KEY` | Firebase Console → Project Settings → Cloud Messaging | ✅ |
| `S3_ACCESS_KEY_ID` | AWS IAM | ✅ |
| `S3_SECRET_ACCESS_KEY` | AWS IAM | ✅ |
| `EXPO_TOKEN` | expo.dev → Account Settings → Access Tokens | For EAS builds |

---

## How to Create Google Play Service Account

1. Go to https://play.google.com/console → Setup → API Access
2. Click "Link to Google Cloud Project" (create new or link existing)
3. Click "Create Service Account" → Grant role "Release Manager"
4. Download the JSON key file
5. In Play Console → Grant the service account access to your app
6. Base64 encode it: `base64 service-account.json | pbcopy`
7. Paste as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret

## How to Create Android Keystore (if needed)

```bash
keytool -genkey -v \
  -keystore medivac-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias medivac_key \
  -dname "CN=JEDITek Pty Ltd, OU=MediVacAlpha, O=JEDITek, L=Australia, S=WA, C=AU"

# Encode for GitHub Secret:
base64 -i medivac-release.keystore | pbcopy
```

## Stripe IAP Setup

1. Go to https://dashboard.stripe.com/products
2. Create "MediVac Premium Yearly" → $300 AUD → Recurring → 1 year
3. Create "MediVac Premium Monthly" → $25 AUD → Recurring → 1 month  
4. Copy both Price IDs (start with `price_`) to secrets
5. Go to Webhooks → Add endpoint: `https://api.medivac.jeditek.net/webhooks/stripe`
6. Events: `customer.subscription.created`, `invoice.payment_succeeded`, `customer.subscription.deleted`

## Google Play IAP Setup

In Play Console → Monetization → Subscriptions:
- `medivac_premium_yearly` → $300 AUD → 1 year → 10-day trial
- `medivac_premium_monthly` → $25 AUD → 1 month → 10-day trial
- `medivac_enterprise` → Contact Sales (manual approval)
