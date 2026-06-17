# Manus Integration Suite for JediTek Practices

## Overview

This document establishes the integration framework for connecting all Manus tasks to the JediTek central knowledge base and S3 storage system. The integration enables seamless data sharing, consistent documentation, and unified access across all current and future tasks in this account.

---

## S3 Storage Configuration

### Uploaded Knowledge Base Files

| Document | S3 URL | Purpose |
|----------|--------|---------|
| Knowledge Base | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/JkByKVopkATKabTM.md | Comprehensive project documentation |
| Services Inventory | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/ONxWryWMFqvanuHA.json | JSON inventory of all services |
| Todo List | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/MrkqjUmghPxDJwDM.md | Complete feature tracking |
| Design Document | https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/uGRYffoynagOcoKP.md | UI/UX design specifications |

### Storage Structure

```
JediTek Manus CDN Storage
├── Knowledge Base Documents
│   ├── JEDITEK_KNOWLEDGE_BASE.md     # Master documentation
│   ├── services-inventory.json        # Service catalog
│   ├── todo.md                        # Feature tracking
│   └── design.md                      # Design specs
├── Project Checkpoints
│   └── medivac-one-app/               # Version snapshots
└── Shared Assets
    └── templates/                      # Reusable templates
```

---

## Task Integration Protocol

### For All Future Tasks

When starting any new task in this Manus account, reference these resources:

1. **Knowledge Base Reference**
   ```
   Reference: https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/JkByKVopkATKabTM.md
   ```

2. **Services Inventory**
   ```
   Reference: https://files.manuscdn.com/user_upload_by_module/session_file/310519663311318226/ONxWryWMFqvanuHA.json
   ```

3. **Project Instructions**
   Include in project instructions:
   ```
   JediTek Integration: All tasks should reference the central knowledge base at the S3 URLs above for consistent documentation and service integration.
   ```

---

## Portal Integration Matrix

### Primary JediTek Portals

| Portal | URL | Integration Status |
|--------|-----|-------------------|
| Main Website | https://jeditek.com.au | Active |
| WONGI Platform | https://jeditek.net | Active |
| Nexus Beacon | https://nexus.jeditek.net | Active |
| AlphaPrime | https://alphaprime.jeditek.com.au | Active |
| iSkoolEDU | https://iskooledu.jeditek.com.au | Active |
| MediVac One | https://wongi.com.au | Active |
| Master Class | https://master.jeditek.com.au | Active |

### Manus-Hosted Applications

| Application | URL | Type |
|-------------|-----|------|
| JEDI.church Resource Hub | https://jedi-church.manus.space | Knowledge Base |
| JEDI VPN Browser | https://jeditek-bro.manus.space | Secure Browser |
| Jedi Knights Pokie Game | https://jedipokie.com | Gamification |
| AlphaPrime Downloads | https://jeditek.xyz | Downloads Portal |
| WONGI Communications | https://wongi.manus.space | Communications |
| WONGI Integrated System | https://jeditek.org | Platform |
| Knowledge Base | https://jedi.church | Documentation |
| JEDI Evidence Portal | https://smpo-evidance-port.manus.space | Evidence |
| Stephen Orazi Portfolio | https://smpo-port.manus.space | Portfolio |
| Project Falcon | https://falcon.manus.space | Command Center |
| JEDI USB Loader | https://jedi-pen.manus.space | Installation |
| JEDI Backend | https://jedi.click | Backend API |
| JEDI Platform | https://death-star.vip | Main Platform |
| JEDI Knowledge Base | https://smpo-ink.manus.space | Knowledge |
| SchoolZone Master Class | https://schoolzone.pro | Education |
| Nexus Beacon Prime | https://nexusbp-jrzfy3zp.manus.space | Beacon |
| JEDI Platform v3 | https://jedi-system.manus.space | Platform v3 |
| JEDI Space Stations | https://jedi-station.manus.space | Communications |
| JEDI Installer | https://jediinstal-krne8jes.manus.space | Installation |

---

## Task Sharing Links Registry

### Active Task Links

| Task Name | Share URL | Replay URL |
|-----------|-----------|------------|
| Primary Development | https://manus.im/share/CBqwaLkisKmTcNOUE6ybt8 | - |
| Evidence Portal | https://manus.im/share/9ntwq6pvznbt7n6zPgxQ2J | https://manus.im/share/9ntwq6pvznbt7n6zPgxQ2J?replay=1 |
| Platform Development | https://manus.im/share/XbTkmdBwnznDLcYaa4dtYB | https://manus.im/share/XbTkmdBwnznDLcYaa4dtYB?replay=1 |
| System Integration | https://manus.im/share/zEmPC5ojo3dzTWqXuVUdZ2 | https://manus.im/share/zEmPC5ojo3dzTWqXuVUdZ2?replay=1 |
| Documentation | https://manus.im/share/HDuZP8F200qCVMkM67fXaR | https://manus.im/share/HDuZP8F200qCVMkM67fXaR?replay=1 |
| Research | https://manus.im/share/p8BZBzbGA1YZsKkY62pSNM | https://manus.im/share/p8BZBzbGA1YZsKkY62pSNM?replay=1 |
| Portfolio | https://manus.im/share/gG5gX6wkySQA2XM2CR2MSL | - |
| Additional Tasks | https://manus.im/share/DtEkvqgpuOX9jj2wccnAVJ | https://manus.im/share/DtEkvqgpuOX9jj2wccnAVJ?replay=1 |
| Research Extended | https://manus.im/share/zTg5r5LHgdgRRs9w5M3Nd4 | https://manus.im/share/zTg5r5LHgdgRRs9w5M3Nd4?replay=1 |

### Application Links

| Application | URL |
|-------------|-----|
| MediVac One App | https://manus.im/app/2yMXAKtXY8WWtC1K3Kz2Vy |
| JEDI Platform App | https://manus.im/app/wsYyyWSajwBv1PrDHjxIAY |
| Current Project | https://manus.im/app/P5XNYXf3uaUXAjaZUeJRHT |

---

## Service Categories Summary

### Total: 100 Services

| Category | Count | Key Services |
|----------|-------|--------------|
| Authentication | 7 | SSO, OAuth, MFA |
| Security | 6 | Zero-trust, scanning, hardening |
| Clinical | 10 | Vitals, CPOE, Medicare |
| Communication | 10 | Push, Teams, Email |
| Voice & Recording | 12 | WebRTC, transcription, playlists |
| DevOps | 11 | CI/CD, beta testing, deployment |
| AI | 3 | Assistant, commands, LLM |
| Integration | 8 | Webhooks, sync, APIs |
| JEDI | 6 | Beacon, commands, forum |
| Gamification | 7 | Tricorder, missions, pets |
| Compliance | 6 | Reporting, policies, playbooks |
| Administration | 14 | Tasks, reports, monitoring |

---

## JEDI Installation Deep Link

For installing JEDI modules on devices:

```
jedi://install?modules=homing-beacon,comm-station,friend-hatching,club-builder,web-share,vpn-browser
```

### Available Modules

| Module | Description |
|--------|-------------|
| homing-beacon | Device location and tracking |
| comm-station | Communication hub |
| friend-hatching | Social connections |
| club-builder | Community building |
| web-share | Content sharing |
| vpn-browser | Secure browsing |

---

## Integration Checklist for New Tasks

When creating new tasks in this account, ensure:

- [ ] Reference knowledge base S3 URL in project instructions
- [ ] Include portal links relevant to the task
- [ ] Use consistent service naming conventions
- [ ] Follow SMPO.ink protocol for compliance
- [ ] Connect to JEDI systems where applicable
- [ ] Document all new services in the inventory
- [ ] Update todo.md with new features
- [ ] Upload key documents to S3 for persistence

---

## Version Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-05 | Initial integration suite |

---

## Contact

For JediTek integration support:
- Knowledge Base: https://jedi.church
- JEDI Masters Forum: https://jedi.church/forum
- High JEDI Council: https://jedi.church/council

---

*This document is maintained as part of the JediTek Manus Integration Suite and should be referenced in all future tasks for consistency.*
