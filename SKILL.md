# Google Play Console Automation Skill

## Overview

This skill provides complete automation for publishing Android apps to Google Play Console with support for:
- Automated app signing and version management
- In-app payment integration
- Beta testing with progressive rollout
- Institution billing and auto-approval
- GitHub Actions CI/CD integration
- Multi-store publishing (Google Play, Apple App Store, Microsoft Store)

## Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
2. **GitHub Repository** with Actions enabled
3. **Stripe Account** for payment processing (optional)
4. **Android Keystore** for app signing
5. **Service Account JSON** from Google Play Console

## Setup Instructions

### Step 1: Create Google Play Service Account

1. Go to https://play.google.com/console
2. Navigate to **Settings → API Access**
3. Click **Create Service Account**
4. Follow Google's instructions to generate JSON key
5. Save the JSON file securely

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository:

```bash
ANDROID_KEYSTORE_BASE64           # Base64 encoded keystore
ANDROID_KEYSTORE_PASSWORD         # Keystore password
ANDROID_KEY_ALIAS                 # Key alias
ANDROID_KEY_PASSWORD              # Key password
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  # Service account JSON
GITHUB_TOKEN                       # GitHub PAT
STRIPE_API_KEY                     # Stripe secret key (optional)
```

### Step 3: Copy Workflow Files

Copy the GitHub Actions workflow to your repository:

```bash
cp .github/workflows/google-play-publish.yml your-repo/.github/workflows/
```

### Step 4: Configure App Details

Update `app.config.ts` with your app information:

```typescript
const env = {
  appName: "Your App Name",
  appSlug: "your-app-slug",
  iosBundleId: "com.yourcompany.yourapp",
  androidPackage: "com.yourcompany.yourapp",
};
```

## Usage

### Manual Publishing

```bash
# Publish to production
npx ts-node scripts/google-play-publish.ts \
  --action=publish \
  --version=2.0.0 \
  --releaseType=production

# Publish to beta
npx ts-node scripts/google-play-publish.ts \
  --action=publish \
  --version=2.0.0 \
  --releaseType=beta
```

### Automated Publishing via Git Tags

```bash
# Create and push version tag
git tag v2.0.0
git push origin v2.0.0

# GitHub Actions will automatically:
# 1. Build the app
# 2. Sign with automatic signing
# 3. Upload to Google Play Console
# 4. Configure in-app purchases
# 5. Setup beta testing
# 6. Create release notes
```

### Manual Workflow Trigger

```bash
gh workflow run google-play-publish.yml \
  -f version=2.0.0 \
  -f releaseType=production
```

## Configuration Options

### Pricing Configuration

Edit `scripts/google-play-publish.ts`:

```typescript
const DEFAULT_PRICING = {
  yearly: 300,              // Annual price in AUD
  monthly: 25,              // Monthly price in AUD
  trialDays: 10,            // Free trial duration
  institutionApprovalThreshold: 30000, // Auto-approval threshold
};
```

### Beta Testing Schedule

```typescript
const BETA_TESTER_SCHEDULE = {
  startCount: 20,           // Initial testers
  endCount: 100,            // Target testers
  durationDays: 14,         // Scaling period
  increasePerDay: 6,        // Testers per day
};
```

### In-App Purchases

Configure subscription products in `scripts/setup-iap.ts`:

```typescript
const subscriptions = [
  {
    id: 'premium_yearly',
    title: 'Premium - Yearly',
    price: 300,
    billingPeriod: 'P1Y',
    trialDays: 10,
  },
  {
    id: 'premium_monthly',
    title: 'Premium - Monthly',
    price: 25,
    billingPeriod: 'P1M',
    trialDays: 10,
  },
];
```

## Features

### Automatic App Signing
- Google Play manages signing keys
- No need to manage keystores
- Automatic key rotation
- Enhanced security

### Version Management
- Automatic version code generation
- Release notes management
- Version history tracking
- Rollback capability

### Beta Testing
- Progressive rollout (20 → 100 users)
- Configurable scaling period
- Feedback collection
- Crash reporting

### In-App Payments
- Stripe integration
- Multiple subscription tiers
- Free trial management
- Auto-renewal configuration

### Institution Billing
- Healthcare institution registration
- Custom enterprise pricing
- Auto-approval on payment threshold
- Tiered access control

### CI/CD Integration
- GitHub Actions automation
- Automated builds and signing
- Continuous deployment
- Release notifications

## Supported Platforms

- ✅ Google Play Console (Android)
- ✅ Apple App Store (iOS) - coming soon
- ✅ Microsoft Store - coming soon
- ✅ Amazon Appstore - coming soon

## Troubleshooting

### Build Failures

```bash
# Clean and rebuild
pnpm run clean
pnpm install
pnpm run build

# Check logs
tail -f google-play-publish.log
```

### Signing Issues

```bash
# Verify keystore
keytool -list -v -keystore android/app/medivac-release.keystore

# Test signing
jarsigner -verify -verbose android/app/build/outputs/bundle/release/app-release.aab
```

### Payment Processing

1. Verify Stripe API keys in GitHub Secrets
2. Test with Stripe test mode
3. Check payment method configuration
4. Review transaction logs

### Beta Testing Issues

1. Verify tester email addresses
2. Check Google Play Console permissions
3. Review beta track configuration
4. Monitor tester feedback channel

## Best Practices

1. **Version Management**
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Update version before publishing
   - Keep version code sequential

2. **Release Notes**
   - Include new features
   - List bug fixes
   - Note breaking changes
   - Add upgrade instructions

3. **Testing**
   - Test on multiple devices
   - Verify in-app purchases
   - Check payment processing
   - Monitor crash reports

4. **Security**
   - Rotate signing keys regularly
   - Use strong keystore passwords
   - Secure GitHub Secrets
   - Monitor access logs

5. **Monitoring**
   - Track analytics
   - Monitor crash reports
   - Review user feedback
   - Check payment transactions

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/your-repo/issues
- Email: support@yourcompany.com
- Documentation: https://docs.yourcompany.com

## License

This skill is provided as-is for use with Manus projects.

## Version History

- **v2.0.0** (Current)
  - Google Play Console automation
  - Institution billing
  - Beta testing framework
  - In-app payments
  - GitHub Actions CI/CD

- **v1.0.0** (Initial)
  - Basic publishing automation
  - Version management
  - Release notes generation

---

**Last Updated**: March 6, 2026
**Maintained By**: Manus Team
**Status**: Production Ready
