# MediVacAlpha — JEDITek Proprietary Product Launch Guide
# Fast-Track Production Deployment to Google Play, GitHub & Web

**Product**: MediVacAlpha (JEDITek.net Proprietary)  
**Version**: 1.0.29 (AAB ready) → 2.0.0 (full release)  
**Package**: `space.manus.medivac.one.app`  
**Author**: JEDITek Pty Ltd — Stephen Michael Patrick Orazi  
**Date**: 2026-06-17  
**Status**: PRE-LAUNCH — ALL ARTIFACTS READY  

---

## What's Already Done ✅

| Asset | Status | File |
|-------|--------|------|
| Android App Bundle (AAB) | ✅ Ready | `medivac-one-v1_0_29.aab` (40MB) |
| Android APK | ✅ Ready | `medivac-one-v1_0_29.apk` (55MB) |
| GitHub Actions CI/CD | ✅ Created | `.github/workflows/medivac-alpha-play-store.yml` |
| Web Landing Page | ✅ Created | `web/index.html` |
| Production Environment | ✅ Created | `.env.production` |
| GitHub Secrets Checklist | ✅ Created | `GITHUB_SECRETS_CHECKLIST.md` |
| Handoff Documentation | ✅ Complete | `CLAUDE_HANDOFF.md` |
| Manus Integration | ✅ Complete | `MANUS_INTEGRATION_SUITE.md` |
| Deployment Guide | ✅ Complete | `PRODUCTION_DEPLOYMENT.md` |
| Store Submission Guide | ✅ Complete | `STORE_SUBMISSION_GUIDE.md` |
| Test Suite | ✅ Complete | `.github/workflows/medivac-alpha-tests.yml` |

---

## PHASE 1: GitHub Setup (Day 1 — 30 mins)

### Step 1.1: Create GitHub Repository

```bash
# In your terminal (Windows — Git Bash or PowerShell):
cd "C:\JEDI\Casttwo Medivac One Virtual Hospital App"

# Initialize git
git init
git add .
git commit -m "feat: MediVacAlpha v1.0.29 - JEDITek proprietary product launch"

# Create repo at github.com (NEW → Private or Public)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/medivac-alpha.git
git branch -M main
git push -u origin main
```

### Step 1.2: Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/medivac-alpha/settings/secrets/actions`

Add these secrets (refer to `GITHUB_SECRETS_CHECKLIST.md` for values):

**Minimum for Play Store upload (fast-track):**
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — from Play Console
- (The pre-built AAB will be used, no keystore needed for fast-track)

**Full build pipeline (add later):**
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`  
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

---

## PHASE 2: Google Play Console (Day 1 — 2 hours)

### Step 2.1: Sign In

1. Go to https://play.google.com/console
2. Sign in as `stephen.michael.orazi@gmail.com`

### Step 2.2: Create the App

1. Click **"Create app"**
2. Fill in:
   - **App name**: MediVac One - Virtual Hospital
   - **Default language**: English (Australia)
   - **App type**: App
   - **Free or paid**: Free (IAP inside)
3. Accept policies → **Create app**

### Step 2.3: Set Up API Access (for GitHub Actions)

1. In Play Console → Setup → **API Access**
2. Link to Google Cloud project (create new: "medivac-api")
3. Click **"Create service account"**
4. Role: **Release Manager**
5. Download JSON key → base64 encode → add to GitHub Secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
6. Back in Play Console → Grant access to your app

### Step 2.4: Store Listing

**Main Store Listing → App Details:**

```
Title: MediVac One - Virtual Hospital
Short description: Complete virtual hospital platform — real-time monitoring, telemedicine & JEDI Systems integration.

Full description:
MediVacAlpha is the world's most advanced virtual hospital management platform by JEDITek.net.

✓ Real-time patient monitoring & vital signs
✓ Accessible route planner with wheelchair support  
✓ Telemedicine video calls & messaging
✓ AI clinical assistant & decision support
✓ Department capacity alerts & bed management
✓ Family coordination & visitor management
✓ JEDI Systems deep integration
✓ God Mode administrative interface
✓ Advanced health directive management
✓ Full offline support with 3-tier sync

PRICING:
• 10-day free trial — no credit card required
• Premium: $300 AUD/year or $25 AUD/month
• Enterprise: $30,000+ AUD (auto-approved on payment)

COMPLIANCE:
HIPAA • GDPR • CCPA • WCAG 2.1 AA • PCI-DSS Level 1

Perfect for hospitals, clinics, healthcare professionals, and institutions.

JEDITek.net | contact: support@medivac.manus.space
```

**Category**: Medical  
**Tags**: hospital, telemedicine, patient management, healthcare  
**Contact Email**: support@medivac.manus.space  
**Privacy Policy**: https://medivac.manus.space/privacy  

### Step 2.5: Content Rating

1. Policy → **App Content → Content Rating**
2. Click "Start questionnaire"
3. Category: **Medical**
4. Answer: No violence, no adult content, no gambling
5. Rating will be: **Everyone / PEGI 3**

### Step 2.6: Upload AAB (Fast Track — MANUAL)

Since the AAB is ready NOW:

1. Release → **Internal testing** → Create new release
2. Upload: `medivac-one-v1_0_29.aab` (from this folder)
3. Release name: `1.0.29`
4. Release notes: "MediVacAlpha v1.0.29 — Initial internal testing release by JEDITek"
5. Click **"Review release"** → **"Start rollout to internal testing"**

**Result**: App live for internal testers within minutes.

### Step 2.7: Configure In-App Purchases

1. **Monetization → Subscriptions → Create subscription**

**Product 1:**
- Product ID: `medivac_premium_yearly`
- Name: MediVac Premium Yearly
- Price: AUD $300.00
- Billing: 1 year
- Free trial: 10 days
- Auto-renew: Yes

**Product 2:**
- Product ID: `medivac_premium_monthly`  
- Name: MediVac Premium Monthly
- Price: AUD $25.00
- Billing: 1 month
- Free trial: 10 days
- Auto-renew: Yes

### Step 2.8: Beta Testing Setup

1. Release → **Open testing** → Create new release
2. Add testers by email (20 initial):
   - Add your email first
   - Share opt-in link with healthcare professionals
3. Promote same AAB from Internal → Open testing track
4. Beta invite link: Share via email / LinkedIn

**Scaling schedule:**
- Week 1: 20 testers
- Week 2: 50 testers  
- Week 3: 100 testers → promote to Production

---

## PHASE 3: Automated Publishing via GitHub Actions (Day 2)

Once secrets are set, triggering a release is one command:

```bash
# Tag the release (triggers workflow automatically)
git tag v1.0.29
git push origin v1.0.29

# Or manually trigger from GitHub Actions UI:
# Actions → MediVacAlpha Play Store → Run workflow
# Track: internal (or beta/production)
# Upload existing AAB: true
```

The workflow will:
1. Find `medivac-one-v1_0_29.aab` in the repo
2. Upload to Play Console via Fastlane Supply
3. Configure beta testing (20→100 users)
4. Create a GitHub Release with the AAB attached

---

## PHASE 4: Web Deployment to jeditek.net (Day 1-2)

### Option A: Deploy to Manus Space (Fastest)

1. Go to https://manus.im
2. Create new task: "Deploy MediVacAlpha web landing page"
3. Upload `web/index.html` and `medivac-one-v1_0_29.apk`
4. Set domain: medivac.jeditek.net (or medivac.manus.space)

### Option B: Netlify (Free, 5 minutes)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy web folder
cd "C:\JEDI\Casttwo Medivac One Virtual Hospital App"
netlify deploy --dir=web --prod

# Set custom domain in Netlify dashboard:
# medivac.jeditek.net → CNAME → YOUR_NETLIFY_URL.netlify.app
```

### Option C: GitHub Pages (Free)

1. In GitHub repo → Settings → Pages
2. Source: Deploy from branch → main → /web folder
3. URL: https://YOUR_USERNAME.github.io/medivac-alpha
4. Add custom domain: medivac.jeditek.net

### DNS Setup for jeditek.net

In your domain registrar (for jeditek.net):
```
Type    Host       Value
CNAME   medivac    YOUR_NETLIFY_OR_GITHUB_URL
```

---

## PHASE 5: Auth Handoff Configuration

The app supports 4 authentication providers. Configure each:

### Google OAuth
1. https://console.cloud.google.com → New Project: MediVacAlpha
2. APIs & Services → OAuth consent screen:
   - App name: MediVacAlpha
   - Support email: stephen.michael.orazi@gmail.com  
   - Scopes: email, profile, openid
3. Credentials → Create OAuth 2.0 Client ID:
   - Type: Android
   - Package: space.manus.medivac.one.app
   - SHA-1: `keytool -list -v -keystore medivac-release.keystore`
4. Copy Client ID → Add to `.env.production`

### Microsoft Azure AD
1. https://portal.azure.com → App Registrations → New registration
2. Name: MediVacAlpha, Accounts: All Microsoft account types
3. Redirect URI: `manus20260306://auth/callback`
4. Add secret → Copy to `.env.production`

### Apple Sign In
1. https://developer.apple.com → Certificates → Identifiers
2. Enable "Sign in with Apple" on App ID
3. Create Service ID for web
4. Add to `.env.production`

---

## PHASE 6: Stripe Payment Integration

### Create Products
1. https://dashboard.stripe.com/products → Add product
2. **MediVac Premium** → Recurring:
   - $300 AUD / year (copy `price_xxx` ID)
   - $25 AUD / month (copy `price_xxx` ID)
3. Add Price IDs to GitHub Secrets & `.env.production`

### Webhook Setup
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.medivac.jeditek.net/webhooks/stripe`
3. Events to listen:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Enterprise Auto-Approval
When a payment of $30,000+ is received:
- Webhook triggers `invoice.payment_succeeded`
- Backend checks amount ≥ 30000
- Auto-promotes user to Enterprise tier
- Sends confirmation email to `institutions@medivac.manus.space`

---

## PHASE 7: Fast-Track Testing Phases

### Alpha (Internal) — Days 1-3
- **Who**: Stephen + JEDI Council (5 people)
- **Track**: Internal testing (Play Console)
- **Focus**: Core flows — auth, payments, telemedicine
- **AAB**: `medivac-one-v1_0_29.aab` (already uploaded)
- **Pass criteria**: No crash on startup, auth works, IAP visible

### Beta — Days 4-14
- **Who**: 20 → 100 healthcare professionals
- **Track**: Open testing (Play Console)
- **Focus**: All features, performance, edge cases
- **Recruit**: LinkedIn post, healthcare forums, JEDI network
- **Pass criteria**: Crash-free rate >99%, rating >4.0/5

### Production — Day 15+
- **Who**: Everyone
- **Track**: Production (Play Console)
- **Rollout**: 20% → 50% → 100% over 3 days
- **Monitor**: Play Console → Android Vitals
- **Pass criteria**: ANR rate <0.47%, crash rate <1.09%

---

## PHASE 8: Internet Marketing Launch

### Day 1: Organic Launch
1. **LinkedIn post** (Stephen Orazi):
   > "Excited to announce MediVacAlpha — JEDITek's proprietary virtual hospital platform is now in beta on Google Play. 10-day free trial. HIPAA compliant. 100+ integrated services. [Play Store link] #HealthTech #MedTech #JEDITek"

2. **JEDI Portal announcements**:
   - https://jeditek.net — Front page banner
   - https://jedi.church — Community announcement
   - https://death-star.vip — Platform notification

3. **App Store Optimization (ASO)**:
   - Title: "MediVac One - Virtual Hospital"
   - Keywords: virtual hospital, telemedicine, patient management, healthcare, HIPAA
   - Screenshots: Upload all 8 required screenshots

### Week 2: Paid Campaigns
- Facebook/Instagram: Healthcare professional targeting (see `facebook-ads-campaign.md`)
- LinkedIn: Hospital administrators (see `linkedin-ads-campaign.md`)
- Google UAC: Android users in AU, US, UK
- Budget: $500 AUD/week initially

### Content Calendar
Refer to: `30-day-content-calendar.ts`

---

## Production Readiness Checklist

### Play Store
- [ ] App created in Play Console
- [ ] Store listing complete (title, description, screenshots)
- [ ] Content rating completed
- [ ] Privacy policy URL live
- [ ] AAB uploaded to Internal track
- [ ] IAP products created (yearly + monthly)
- [ ] Beta track configured
- [ ] Service account linked to GitHub

### GitHub
- [ ] Repository created (public or private)
- [ ] All files pushed to main branch
- [ ] GitHub Secrets configured (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON minimum)
- [ ] Actions workflow visible and enabled
- [ ] First tag pushed (v1.0.29)

### Web
- [ ] `web/index.html` deployed
- [ ] Custom domain medivac.jeditek.net pointing to host
- [ ] APK download link working
- [ ] Play Store link working
- [ ] Contact email working

### Payments
- [ ] Stripe account live (not test mode)
- [ ] Products + prices created
- [ ] Webhook endpoint configured
- [ ] IAP products live in Play Console

### Auth
- [ ] Google OAuth credentials created
- [ ] Microsoft Azure AD registered
- [ ] At least one OAuth provider working end-to-end

### Monitoring
- [ ] Sentry DSN configured
- [ ] Firebase/FCM set up
- [ ] Google Analytics connected
- [ ] Play Console vitals monitoring active

---

## Support Contacts

| Role | Contact |
|------|---------|
| Technical | stephen.michael.orazi@gmail.com |
| JEDI Council | council@jeditek.net |
| Institutions | institutions@medivac.manus.space |
| Support | support@medivac.manus.space |
| Emergency | +1-555-JEDI-911 |

---

## Key URLs

| Resource | URL |
|----------|-----|
| Play Console | https://play.google.com/console |
| GitHub Repo | https://github.com/YOUR_USERNAME/medivac-alpha |
| Web Landing | https://medivac.jeditek.net |
| Manus App | https://manus.im/app/2yMXAKtXY8WWtC1K3Kz2Vy |
| Stripe Dashboard | https://dashboard.stripe.com |
| Sentry | https://sentry.io/organizations/jeditek |
| Firebase | https://console.firebase.google.com |

---

**Document**: MEDIVAC_ALPHA_LAUNCH_GUIDE.md  
**Created by**: Claude (Cowork) for JEDITek Pty Ltd  
**Date**: 2026-06-17  
**Classification**: PROPRIETARY — JEDITek Confidential
