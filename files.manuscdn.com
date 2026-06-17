# JediTek MediVac One - Comprehensive Knowledge Base

## Project Overview

**MediVac One Virtual Hospital** is a comprehensive healthcare management mobile application built with React Native and Expo, designed for the JediTek ecosystem. The application provides a complete suite of tools for hospital operations, patient management, clinical decision support, and JEDI system integration.

| Property | Value |
|----------|-------|
| Version | 7.4 |
| Platform | iOS, Android, Web |
| Framework | React Native 0.81.5, Expo SDK 54 |
| Language | TypeScript 5.9 |
| Tests | 1,752 passing |
| Services | 100 integrated services |
| Screens | 55+ application screens |

---

## Core Systems Architecture

### Authentication & Security

The application implements a multi-layered authentication system supporting enterprise-grade security requirements.

| Service | Description |
|---------|-------------|
| unified-auth-service | Central authentication orchestration |
| jeditek-sso-service | JEDI Single Sign-On integration |
| microsoft-auth-service | Microsoft Azure AD OAuth |
| social-auth-service | Google, Apple, Facebook authentication |
| mfa-enforcement-service | Multi-factor authentication management |
| zero-trust-policy-service | Zero-trust security framework |

### Data Management

A three-tier caching system ensures optimal performance and offline capability.

| Layer | Storage | Purpose |
|-------|---------|---------|
| L1 | In-Memory | Real-time access, session data |
| L2 | AsyncStorage | Persistent local storage |
| L3 | S3 Cloud | Cross-device sync, backup |

### JEDI Integration

Full integration with the JediTek JEDI ecosystem for enterprise operations.

| Component | Function |
|-----------|----------|
| Homing Beacon | Device location and tracking |
| Tentacle Sync | Multi-system data synchronization |
| Command Library | Centralized command execution |
| SMPO.ink Protocol | Compliance and audit logging |

---

## Services Inventory (100 Services)

### Clinical Services

| Service | Purpose |
|---------|---------|
| vital-signs-monitoring-service | Patient vital signs tracking and alerts |
| cpoe-service | Computerized Physician Order Entry |
| medicare-claiming-service | Australian Medicare billing integration |
| infection-control-service | Infection prevention and tracking |
| clinical-audit-service | Clinical compliance auditing |
| gp-integration-service | General Practice system integration |
| australian-gp-service | Australian GP-specific features |
| filemaker-patient-sync-service | FileMaker Pro patient data sync |

### Communication Services

| Service | Purpose |
|---------|---------|
| broadcast-service | Facility-wide announcements |
| push-notification-service | Mobile push notifications |
| live-push-notification-service | APNs/FCM live delivery |
| teams-integration-service | Microsoft Teams integration |
| teams-meeting-service | Teams video conferencing |
| email-template-service | Email template management |
| smtp-configuration-service | SMTP server configuration |

### Voice & Recording Services

| Service | Purpose |
|---------|---------|
| mission-voice-chat-service | WebRTC voice communication |
| voice-recording-service | JEDI Master authorized recording |
| voice-interaction-service | Voice command processing |
| transcription-search-service | Full-text transcription search |
| highlight-reels-service | Training clip extraction |
| recording-alerts-service | Recording notification system |
| retention-policies-service | Storage retention management |
| speaker-analytics-service | Speaker identification analytics |

### DevOps & Deployment Services

| Service | Purpose |
|---------|---------|
| cicd-build-service | CI/CD pipeline automation |
| cicd-teams-notification-service | Build status to Teams |
| beta-testing-service | TestFlight/Google Play beta management |
| wachs-deployment-service | WACHS site deployment |
| site-provisioning-service | New site setup automation |
| site-cloning-service | Site template cloning |

### Security Services

| Service | Purpose |
|---------|---------|
| security-scan-service | Vulnerability scanning |
| system-hardening-service | Security baseline enforcement |
| auto-security-baseline-service | Automated security configuration |
| credential-management-service | Secure credential storage |
| secure-import-export-service | Encrypted data transfer |

### AI & Analytics Services

| Service | Purpose |
|---------|---------|
| ai-assistant-service | AI-powered clinical assistant |
| ai-commands-service | Natural language command processing |
| llm-backend-service | Large language model integration |
| playbook-analytics-service | Incident response analytics |
| patient-satisfaction-service | Patient feedback analysis |

### Integration Services

| Service | Purpose |
|---------|---------|
| webhook-service | Webhook management |
| eclipse-api-service | Eclipse system integration |
| claris-connect-service | Claris Connect automation |
| onedrive-sync-service | OneDrive file synchronization |
| sharepoint-sync-service | SharePoint document sync |
| azure-ad-service | Azure Active Directory |

### Specialized Services

| Service | Purpose |
|---------|---------|
| tricorder-service | Medical scanning gamification |
| cooperative-mission-service | Multiplayer training missions |
| pet-service | Virtual companion system |
| avatar-service | User avatar management |
| gifting-service | Digital gift system |
| jedi-membership-service | JEDI membership tiers |

---

## Application Screens (55+ Screens)

### Core Navigation

| Screen | Route | Purpose |
|--------|-------|---------|
| Home Dashboard | /(tabs)/index | Main dashboard with metrics |
| Patients | /(tabs)/patients | Patient list and management |
| Schedule | /(tabs)/schedule | Appointment scheduling |
| Tasks | /(tabs)/tasks | Task management kanban |
| More | /(tabs)/more | Extended menu options |

### Clinical Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Medications | /medications | Medication management |
| Labs | /labs | Laboratory results |
| Documents | /documents | Clinical documentation |
| WONGI Tracker | /wongi | WONGI health tracking |

### Administration Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Admin | /admin | Administrative tools |
| Roles Manager | /roles-manager | Role configuration |
| Hospital Permissions | /hospital-permissions | Permission management |
| OAuth Config | /oauth-config | OAuth credential setup |

### JEDI System Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| JEDI Hub | /jedi | JEDI system dashboard |
| Master JEDI Control | /master-jedi-control | Advanced JEDI controls |
| Command Center | /command-center | Mission command interface |
| Module Scanner | /module-scanner | JEDI module detection |

### Communication Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Communications | /communications | Communication hub |
| Messages | /messages | Direct messaging |
| Notifications | /notifications | Notification center |
| Voice Chat | /voice-chat | Voice communication |

### Recording & Training Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Voice Recordings | /voice-recordings | Recording management |
| Highlight Reels | /highlight-reels | Training clip library |
| Playlists | /playlists | Training playlists |
| Transcription Search | /transcription-search | Search recordings |
| Recording Alerts | /recording-alerts | Alert configuration |
| Retention Policies | /retention-policies | Storage policies |

### DevOps Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| CI/CD Builds | /cicd-builds | Build pipeline status |
| Beta Testing | /beta-testing | Beta distribution |
| Teams Notifications | /teams-notifications | Teams webhook config |
| Crash Templates | /crash-templates | Crash report templates |
| JEDI Forum Crashes | /jedi-forum-crashes | Forum crash posting |

---

## JediTek Portal Links

### Primary Portals

| Portal | URL | Purpose |
|--------|-----|---------|
| Main | https://jeditek.com.au | Primary JediTek website |
| WONGI | https://jeditek.net | WONGI health platform |
| Nexus Beacon | https://nexus.jeditek.net | Beacon management |
| AlphaPrime | https://alphaprime.jeditek.com.au | Alpha systems |
| iSkoolEDU | https://iskooledu.jeditek.com.au | Education platform |
| MediVac One | https://wongi.com.au | MediVac One portal |
| Master Class | https://master.jeditek.com.au | Training platform |

### Manus-Hosted Applications

| Application | URL | Purpose |
|-------------|-----|---------|
| JEDI.church Resource Hub | https://jedi-church.manus.space | Resource management |
| JEDI VPN Browser | https://jeditek-bro.manus.space | Secure browsing |
| Jedi Knights Pokie Game | https://jedipokie.com | Gamification |
| AlphaPrime Downloads | https://jeditek.xyz | System downloads |
| WONGI Communications | https://wongi.manus.space | Community comms |
| WONGI Integrated System | https://jeditek.org | Integrated platform |
| Knowledge Base | https://jedi.church | Knowledge management |
| JEDI Evidence Portal | https://smpo-evidance-port.manus.space | Evidence management |
| Stephen Orazi Portfolio | https://smpo-port.manus.space | Professional portfolio |
| Project Falcon | https://falcon.manus.space | Command center |
| JEDI USB Loader | https://jedi-pen.manus.space | USB installation |
| JEDI Backend | https://jedi.click | Backend services |
| JEDI Platform | https://death-star.vip | Integrated platform |
| JEDI Knowledge Base | https://smpo-ink.manus.space | Knowledge base |
| SchoolZone Master Class | https://schoolzone.pro | Education platform |
| Nexus Beacon Prime | https://nexusbp-jrzfy3zp.manus.space | Beacon prime |
| JEDI Platform v3 | https://jedi-system.manus.space | Platform v3 |
| JEDI Space Stations | https://jedi-station.manus.space | Station comms |
| JEDI Installer | https://jediinstal-krne8jes.manus.space | Installation |

---

## Task Sharing Links

### Active Manus Tasks

| Task | Share Link |
|------|------------|
| Primary Task | https://manus.im/share/CBqwaLkisKmTcNOUE6ybt8 |
| Evidence Portal | https://manus.im/share/9ntwq6pvznbt7n6zPgxQ2J |
| Platform Development | https://manus.im/share/XbTkmdBwnznDLcYaa4dtYB |
| System Integration | https://manus.im/share/zEmPC5ojo3dzTWqXuVUdZ2 |
| Documentation | https://manus.im/share/HDuZP8F200qCVMkM67fXaR |
| Research | https://manus.im/share/p8BZBzbGA1YZsKkY62pSNM |
| Portfolio | https://manus.im/share/gG5gX6wkySQA2XM2CR2MSL |

### Application Links

| Application | Link |
|-------------|------|
| MediVac One App | https://manus.im/app/2yMXAKtXY8WWtC1K3Kz2Vy |
| JEDI Platform App | https://manus.im/app/wsYyyWSajwBv1PrDHjxIAY |
| Current Project | https://manus.im/app/P5XNYXf3uaUXAjaZUeJRHT |

---

## JEDI Installation Protocol

The JEDI system supports modular installation via deep links:

```
jedi://install?modules=homing-beacon,comm-station,friend-hatching,club-builder,web-share,vpn-browser
```

### Available Modules

| Module | Purpose |
|--------|---------|
| homing-beacon | Device location tracking |
| comm-station | Communication hub |
| friend-hatching | Social connections |
| club-builder | Community building |
| web-share | Content sharing |
| vpn-browser | Secure browsing |

---

## S3 Integration Configuration

### Storage Structure

```
s3://jeditek-knowledge-base/
├── medivac-one/
│   ├── services/           # Service implementations
│   ├── screens/            # Application screens
│   ├── documentation/      # Technical docs
│   └── assets/             # Media assets
├── shared/
│   ├── templates/          # Reusable templates
│   ├── configurations/     # System configs
│   └── protocols/          # SMPO.ink protocols
└── archives/
    ├── checkpoints/        # Version checkpoints
    └── backups/            # System backups
```

### Integration Points

| System | S3 Bucket | Purpose |
|--------|-----------|---------|
| MediVac One | jeditek-medivac | App data storage |
| Knowledge Base | jeditek-knowledge-base | Documentation |
| Evidence Portal | jeditek-evidence | Legal documents |
| Training | jeditek-training | Training materials |

---

## Version History

| Version | Date | Features |
|---------|------|----------|
| v1.0 | Initial | Core navigation, patient management |
| v2.0 | Production | JEDI integration, role-based access |
| v3.0 | Enhanced | Real-time sync, biometric auth |
| v4.0 | Clinical | Decision support, analytics |
| v5.0 | Enterprise | WACHS deployment, compliance |
| v6.0 | Advanced | Tricorder, AI assistant |
| v7.0 | Complete | Cooperative missions, CI/CD |
| v7.1 | Voice | Voice chat, crash templates |
| v7.2 | Recording | JEDI Master recording |
| v7.3 | Management | Alerts, reels, retention |
| v7.4 | Search | Transcription search, playlists, pricing |

---

## Contact & Support

| Resource | Link |
|----------|------|
| JediTek Support | https://jeditek.com.au/support |
| JEDI Masters Forum | https://jedi.church/forum |
| High JEDI Council | https://jedi.church/council |
| Documentation | https://smpo-ink.manus.space |

---

*This document is part of the JediTek Knowledge Base and is automatically synchronized across all Manus tasks for consistent reference.*

**Last Updated:** February 5, 2026
**Document Version:** 1.0
**Classification:** JediTek Internal
