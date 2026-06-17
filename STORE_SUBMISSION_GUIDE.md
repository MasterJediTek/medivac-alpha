# MediVac WACHS - App Store Submission Guide

## Overview

This document provides comprehensive instructions for submitting MediVac WACHS to Google Play Store, Apple App Store, and Microsoft Store. The app has been prepared with all necessary metadata, assets, and compliance documentation.

---

## App Information

| Field | Value |
|-------|-------|
| **App Name** | MediVac WACHS |
| **Developer** | JediTek Pty Ltd |
| **Version** | 8.0.0 |
| **Build Number** | 800 |
| **Category** | Medical / Health & Fitness |
| **Content Rating** | Everyone |

### Bundle Identifiers

| Store | Identifier |
|-------|------------|
| Google Play | space.manus.medivac.wachs |
| Apple App Store | space.manus.medivac.wachs |
| Microsoft Store | space.manus.medivac.wachs |

---

## Google Play Store Submission

### Prerequisites

1. Google Play Developer Account ($25 one-time fee)
2. Signed APK or Android App Bundle (AAB)
3. Privacy Policy URL
4. Content rating questionnaire completed

### Required Assets

| Asset | Specification | Status |
|-------|---------------|--------|
| App Icon | 512x512 PNG | ✅ Ready |
| Feature Graphic | 1024x500 PNG | ⚠️ Needed |
| Phone Screenshots | 1080x1920 (min 2, max 8) | ⚠️ Needed |
| Tablet Screenshots | 1200x1920 (optional) | ⚠️ Needed |

### Submission Steps

1. **Access Google Play Console**
   - Navigate to https://play.google.com/console
   - Sign in with JediTek developer account

2. **Create New App**
   - Click "Create app"
   - App name: MediVac WACHS
   - Default language: English (Australia)
   - App type: App
   - Free or paid: Free

3. **Store Listing**
   - Short description (80 chars max):
     ```
     Virtual Hospital Management for Western Australian Country Health Service
     ```
   - Full description: See `app-store-distribution-service.ts` for complete text
   - App icon: Upload from `assets/images/icon.png`
   - Feature graphic: Generate 1024x500 promotional banner
   - Screenshots: Capture from running app

4. **Content Rating**
   - Complete IARC questionnaire
   - Expected rating: Everyone (medical app, no violent content)

5. **App Content**
   - Privacy Policy: https://jeditek.com.au/privacy
   - Ads: No ads
   - Target audience: 18+ (healthcare professionals)

6. **Release Management**
   - Upload signed AAB file
   - Select release track (Internal → Closed → Open → Production)
   - Add release notes

7. **Review & Publish**
   - Review all sections for completeness
   - Submit for review (typically 1-3 days)

---

## Apple App Store Submission

### Prerequisites

1. Apple Developer Program membership ($99/year)
2. Xcode with valid signing certificates
3. App Store Connect access
4. Privacy Policy URL

### Required Assets

| Asset | Specification | Status |
|-------|---------------|--------|
| App Icon | 1024x1024 PNG (no alpha) | ✅ Ready |
| iPhone Screenshots | 1290x2796 (6.7") | ⚠️ Needed |
| iPad Screenshots | 2048x2732 (12.9") | ⚠️ Needed |
| App Preview Video | Optional | ⚠️ Optional |

### Submission Steps

1. **Access App Store Connect**
   - Navigate to https://appstoreconnect.apple.com
   - Sign in with JediTek Apple Developer account

2. **Create New App**
   - Click "+" → "New App"
   - Platform: iOS
   - Name: MediVac WACHS
   - Primary Language: English (Australia)
   - Bundle ID: space.manus.medivac.wachs
   - SKU: medivac-wachs-001

3. **App Information**
   - Category: Medical
   - Secondary Category: Health & Fitness
   - Content Rights: Own all rights
   - Age Rating: Complete questionnaire (expected 4+)

4. **Pricing and Availability**
   - Price: Free
   - Availability: Australia (primary), worldwide (optional)

5. **App Privacy**
   - Privacy Policy URL: https://jeditek.com.au/privacy
   - Data collection: Health data, usage data
   - Complete privacy nutrition labels

6. **Version Information**
   - Screenshots: Upload for each device size
   - Description: See full description in service
   - Keywords: healthcare, hospital, medical, WACHS, Western Australia, patient management, clinical, JediTek, MediVac, telemedicine
   - Support URL: https://jeditek.com.au/support
   - Marketing URL: https://jeditek.com.au

7. **Build Upload**
   - Archive app in Xcode
   - Upload via Xcode or Transporter
   - Select build in App Store Connect

8. **Submit for Review**
   - Complete all required fields
   - Add review notes for Apple (healthcare app context)
   - Submit (typically 1-7 days review)

### App Review Notes

```
MediVac WACHS is a healthcare management application designed for 
Western Australian Country Health Service (WACHS) professionals.

Demo Account (if required):
- Username: demo@jeditek.com.au
- Password: [Contact JediTek for demo credentials]

The app requires healthcare professional authentication and is 
intended for use by authorized WACHS staff members.

Key Features:
- Patient management and records
- Clinical decision support
- Team coordination and communication
- Training and compliance modules

This app does not provide direct medical advice to end users.
All clinical features are tools for healthcare professionals.
```

---

## Microsoft Store Submission

### Prerequisites

1. Microsoft Partner Center account ($19 one-time fee)
2. MSIX or AppX package
3. Privacy Policy URL

### Required Assets

| Asset | Specification | Status |
|-------|---------------|--------|
| App Icon | 1240x1240 PNG | ✅ Ready |
| Desktop Screenshots | 1920x1080 (min 1) | ⚠️ Needed |
| Mobile Screenshots | 1080x1920 (optional) | ⚠️ Needed |
| Store Logo | 300x300 PNG | ⚠️ Needed |

### Submission Steps

1. **Access Partner Center**
   - Navigate to https://partner.microsoft.com
   - Sign in with JediTek Microsoft account

2. **Create New App**
   - Click "Create a new app"
   - Reserve name: MediVac WACHS
   - App type: App

3. **Properties**
   - Category: Medical
   - Subcategory: Health & fitness
   - Privacy Policy: https://jeditek.com.au/privacy
   - Website: https://jeditek.com.au

4. **Age Ratings**
   - Complete IARC questionnaire
   - Expected: PEGI 3 / ESRB Everyone

5. **Packages**
   - Upload MSIX package
   - Target: Windows 10/11 (x64, ARM64)

6. **Store Listings**
   - Description: See full description in service
   - Screenshots: Desktop and mobile
   - Search terms: healthcare, hospital, medical, WACHS, patient management, clinical, JediTek

7. **Submission Options**
   - Publish date: As soon as possible
   - Certification notes: Healthcare professional app

8. **Submit**
   - Review all sections
   - Submit for certification (typically 1-5 days)

---

## Post-Submission Checklist

### All Stores

- [ ] Monitor review status daily
- [ ] Respond promptly to any reviewer questions
- [ ] Prepare for potential rejection reasons:
  - Missing privacy policy
  - Incomplete metadata
  - Crash during review
  - Healthcare compliance concerns

### After Approval

- [ ] Verify app appears in store search
- [ ] Test download and installation
- [ ] Monitor crash reports and user feedback
- [ ] Set up automated monitoring for reviews

---

## Support Contacts

| Role | Contact |
|------|---------|
| Developer Support | support@jeditek.com.au |
| Technical Lead | tech@jeditek.com.au |
| Store Submissions | appstore@jeditek.com.au |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 8.0.0 | Feb 2026 | Initial store submission release |

---

## S3 CDN Assets

All documentation and assets are available on S3 CDN:

| Document | URL |
|----------|-----|
| Knowledge Base | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/JkByKVopkATKabTM.md |
| Services Inventory | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/ONxWryWMFqvanuHA.json |
| Integration Suite | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/UUjuprmnTEocLITi.md |
| App Icon | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/yqwptaymsvXKBDSW.png |

---

*Document generated by MediVac WACHS v8.0 - JediTek Pty Ltd*
