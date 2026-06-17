# MediVac One v2.0.0 - Production Deployment Guide

## Overview

This guide covers the complete production deployment process for MediVac One v2.0.0 to Google Play Console with automated publishing, beta testing, in-app payments, and institution billing.

---

## Pre-Deployment Checklist

### 1. Account Setup
- [x] Google Play Developer Account: `Stephen.michael.orazi@gmail.com`
- [x] GitHub Account with PAT configured
- [x] Stripe Account for payment processing
- [x] JEDI Systems credentials configured
- [x] FileMaker Server access verified

### 2. Application Configuration
- [x] App version: 2.0.0
- [x] Package name: `space.manus.medivac.one.app`
- [x] App icon and graphics prepared
- [x] Store listing metadata configured
- [x] Privacy policy and terms of service ready

### 3. Security & Signing
- [x] Android keystore created
- [x] Automatic signing enabled in Google Play
- [x] Signing key alias configured
- [x] Key password secured in GitHub Secrets

### 4. Payment Configuration
- [x] Stripe API keys configured
- [x] In-app purchase products created
- [x] Pricing tiers defined:
  - Free Trial: 10 days
  - Premium: $300/year or $25/month
  - Enterprise: $30,000 (auto-approve on payment)

---

## Deployment Steps

### Step 1: Build Production APK

```bash
# Install dependencies
pnpm install

# Build production bundle
pnpm run build

# Generate signed APK
cd android
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=app/medivac-release.keystore \
  -Pandroid.injected.signing.store.password=$ANDROID_KEYSTORE_PASSWORD \
  -Pandroid.injected.signing.key.alias=$ANDROID_KEY_ALIAS \
  -Pandroid.injected.signing.key.password=$ANDROID_KEY_PASSWORD
```

### Step 2: Configure Google Play Console

1. Go to https://play.google.com/console
2. Sign in with `Stephen.michael.orazi@gmail.com`
3. Create new app: "MediVac One - Virtual Hospital"
4. Configure app details:
   - Category: Medical
   - Content rating: PEGI 3
   - Target audience: Healthcare professionals, patients, institutions

### Step 3: Setup Automatic Signing

1. Navigate to Settings → App Signing
2. Enable "Google Play App Signing"
3. Let Google manage your signing key
4. Upload your keystore for initial signing

### Step 4: Configure Store Listing

**Title**: MediVac One - Virtual Hospital

**Short Description**: 
Complete virtual hospital management and patient care platform with real-time monitoring, accessible routing, and JEDI Systems integration.

**Full Description**:
```
MediVac One is a comprehensive virtual hospital platform providing:

✓ Real-time patient monitoring and management
✓ Accessible route planning with wheelchair support
✓ Department capacity alerts and monitoring
✓ Family member coordination and permissions
✓ Offline data synchronization
✓ Live transmission feeds and interactive sessions
✓ JEDI Systems integration
✓ Advanced health directive management
✓ God Mode administrative interface
✓ Multi-portal access and control

Features:
- 10-day free trial
- Flexible pricing ($300/year or $25/month)
- Enterprise plans for healthcare institutions
- Automatic institution approval on $30k payment
- Beta testing with 20-100 users
- Full offline support
- HIPAA-compliant data handling

Perfect for:
- Hospitals and clinics
- Healthcare professionals
- Patients and families
- Research institutions
- Government health agencies
```

**Screenshots**: Upload 5-8 screenshots showing:
1. Home screen and dashboard
2. Patient management interface
3. Accessible route planner
4. Department capacity monitoring
5. Family member management
6. God Mode interface
7. Live transmission feeds
8. Settings and preferences

**Feature Graphic**: 1024x500px banner image

**Icon**: 512x512px app icon

**Privacy Policy**: https://medivac.manus.space/privacy

**Support Email**: support@medivac.manus.space

### Step 5: Setup In-App Purchases

1. Go to Monetization → Products → Subscriptions
2. Create subscription products:

**Product 1: Premium Yearly**
- ID: `medivac_premium_yearly`
- Title: MediVac Premium - Yearly
- Description: Full access to all MediVac features for 1 year
- Price: $300 AUD
- Billing period: 1 year
- Free trial: 10 days
- Auto-renew: Enabled

**Product 2: Premium Monthly**
- ID: `medivac_premium_monthly`
- Title: MediVac Premium - Monthly
- Description: Full access to all MediVac features for 1 month
- Price: $25 AUD
- Billing period: 1 month
- Free trial: 10 days
- Auto-renew: Enabled

**Product 3: Enterprise**
- ID: `medivac_enterprise`
- Title: MediVac Enterprise
- Description: Custom enterprise plan for healthcare institutions
- Price: Custom (contact sales)
- Requires approval: Yes
- Auto-approve on $30k payment: Yes

### Step 6: Configure Beta Testing

1. Go to Release → Beta
2. Create beta track
3. Add testers:
   - Initial: 20 testers
   - Target: 100 testers
   - Scaling period: 14 days
   - Daily increase: ~6 testers/day

4. Beta testing schedule:
```
Day 1-2:   20 testers
Day 3-4:   26 testers
Day 5-6:   32 testers
Day 7-8:   38 testers
Day 9-10:  44 testers
Day 11-12: 50 testers
Day 13-14: 56 testers
Day 15+:   100 testers
```

### Step 7: Upload APK/AAB

1. Go to Release → Production
2. Upload Android App Bundle (AAB)
3. Set version name: 2.0.0
4. Set version code: 200
5. Add release notes:

```
MediVac One v2.0.0 - Production Release

New Features:
✓ God Mode administrative interface
✓ Multi-portal JEDI Systems integration
✓ Live transmission feeds with recording
✓ Interactive collaborative sessions
✓ Institution billing and auto-approval
✓ Enhanced accessibility features
✓ Improved offline synchronization

Improvements:
✓ Optimized performance and battery usage
✓ Enhanced security and encryption
✓ Better error handling and recovery
✓ Improved user interface and UX

Pricing:
✓ 10-day free trial
✓ $300/year or $25/month
✓ Enterprise plans available
✓ Auto-approval for $30k+ institutions
```

### Step 8: Review and Submit

1. Review all store listing details
2. Verify pricing and in-app purchases
3. Check content rating questionnaire
4. Review privacy policy
5. Submit for review

**Estimated review time**: 24-48 hours

---

## Automated Publishing with GitHub Actions

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:

```bash
ANDROID_KEYSTORE_BASE64      # Base64 encoded keystore file
ANDROID_KEYSTORE_PASSWORD    # Keystore password
ANDROID_KEY_ALIAS            # Key alias name
ANDROID_KEY_PASSWORD         # Key password
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  # Service account JSON
GITHUB_TOKEN                  # GitHub personal access token
```

### Trigger Automated Publishing

```bash
# Push a tag to trigger publishing
git tag v2.0.0
git push origin v2.0.0

# Or manually trigger workflow
gh workflow run google-play-publish.yml \
  -f version=2.0.0 \
  -f releaseType=production
```

---

## Post-Deployment Verification

### 1. Google Play Console Checks

- [ ] App appears in Google Play Store
- [ ] Store listing displays correctly
- [ ] Screenshots and graphics visible
- [ ] In-app purchases available
- [ ] Pricing displayed correctly
- [ ] Free trial configured
- [ ] Beta testing active

### 2. Functionality Testing

- [ ] App installs successfully
- [ ] Free trial activates automatically
- [ ] In-app purchases work
- [ ] Payment processing functional
- [ ] Institution registration works
- [ ] Auto-approval triggers on $30k
- [ ] Beta testing invitations sent

### 3. Monitoring

- [ ] Google Play Console analytics active
- [ ] Crash reporting enabled
- [ ] User reviews monitored
- [ ] Performance metrics tracked
- [ ] Payment transactions logged

---

## Pricing & Revenue Model

### Free Trial
- **Duration**: 10 days
- **Features**: Full access to all features
- **Conversion**: Automatic to Premium on day 11

### Premium Tier
- **Yearly**: $300 AUD
- **Monthly**: $25 AUD
- **Features**: Full access, priority support, custom integrations

### Enterprise Tier
- **Price**: $30,000+ AUD
- **Auto-Approval**: Triggered on payment receipt
- **Features**: Unlimited users, dedicated support, custom development

### Institution Billing
- **Registration**: Healthcare institutions register in-app
- **Payment**: Direct payment or invoice
- **Auto-Approval**: Automatic on $30k payment threshold
- **Tier Upgrade**: Enterprise tier automatically assigned

---

## Beta Testing Schedule

### Week 1
- **Days 1-2**: 20 testers (internal team + early adopters)
- **Days 3-4**: 26 testers
- **Days 5-6**: 32 testers
- **Days 7-8**: 38 testers

### Week 2
- **Days 9-10**: 44 testers
- **Days 11-12**: 50 testers
- **Days 13-14**: 56 testers
- **Days 15+**: 100 testers (full beta)

### Feedback Collection
- In-app feedback form
- Crash reporting
- Performance metrics
- User analytics
- Feature requests

---

## Troubleshooting

### Build Failures
```bash
# Clean build
pnpm run clean
pnpm install
pnpm run build

# Check logs
cat google-play-publish.log
```

### Signing Issues
```bash
# Verify keystore
keytool -list -v -keystore android/app/medivac-release.keystore

# Re-create keystore if needed
keytool -genkey -v -keystore android/app/medivac-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias medivac_key
```

### Payment Processing
- Verify Stripe API keys
- Check payment method configuration
- Review transaction logs
- Test with Stripe test cards

### Beta Testing Issues
- Verify tester email addresses
- Check Google Play Console permissions
- Review beta track configuration
- Monitor tester feedback

---

## Support & Escalation

### For Technical Issues
- Email: support@medivac.manus.space
- GitHub Issues: https://github.com/medivac-one/issues
- Slack: #medivac-support

### For Billing Issues
- Email: billing@medivac.manus.space
- Phone: +61 8 XXXX XXXX
- Support Portal: https://support.medivac.manus.space

### For Institution Onboarding
- Email: institutions@medivac.manus.space
- Dedicated Account Manager
- Custom Integration Support

---

## Version History

### v2.0.0 (Current)
- God Mode interface
- JEDI Systems integration
- Institution billing
- Beta testing framework
- In-app payments
- Automatic signing

### v1.0.0 (Previous)
- Initial release
- Basic patient management
- Appointment scheduling
- Family member access

---

## Next Steps

1. ✅ Build and test production APK
2. ✅ Configure Google Play Console
3. ✅ Setup automatic signing
4. ✅ Configure in-app purchases
5. ✅ Setup beta testing
6. ✅ Submit for review
7. ⏳ Monitor review process
8. ⏳ Launch to production
9. ⏳ Monitor analytics and feedback
10. ⏳ Plan v2.1.0 features

---

**Last Updated**: March 6, 2026
**Deployment Status**: Ready for Production
**Next Review**: Post-launch (48 hours)
