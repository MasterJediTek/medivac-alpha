# MediVac One - Production Authorization & Control

**Version**: 1.0.0  
**Status**: PRODUCTION READY  
**Last Updated**: 2026-06-15  
**Authorized By**: JEDI Council  

---

## 🔐 Authorization Levels

### Level 1: System Administrator
**Permissions**:
- Full system access
- User management
- Role assignment
- Security configuration
- Backup & recovery
- System monitoring
- Incident response

**Credentials**: 
- Username: `admin@medivac.local`
- MFA: Required (TOTP)
- Session Timeout: 30 minutes

### Level 2: Medical Director
**Permissions**:
- Patient data access
- Provider management
- Appointment oversight
- Clinical protocols
- Report generation
- Audit logs access

**Credentials**:
- Username: `director@medivac.local`
- MFA: Required (TOTP)
- Session Timeout: 60 minutes

### Level 3: Provider (Doctor/Nurse)
**Permissions**:
- Own patient records
- Appointment management
- Prescription creation
- Medical notes
- Lab result access
- Telemedicine access

**Credentials**:
- Username: `provider@medivac.local`
- MFA: Optional (TOTP)
- Session Timeout: 120 minutes

### Level 4: Patient
**Permissions**:
- Own medical records
- Appointment booking
- Telemedicine access
- Prescription refills
- Message providers
- Health analytics

**Credentials**:
- Username: `patient@medivac.local`
- MFA: Optional (TOTP)
- Session Timeout: 240 minutes

---

## 🎮 Command Distribution

### Administrative Commands

#### System Management
```bash
# Start application
npm run start

# Development mode
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Check TypeScript
npm run check

# Lint code
npm run lint

# Format code
npm run format
```

#### Database Commands
```bash
# Push schema changes
npm run db:push

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database (CAUTION)
npm run db:reset
```

#### Deployment Commands
```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Rollback to previous version
npm run rollback

# View deployment status
npm run status
```

### Provider Commands

#### Patient Management
```bash
# View patient list
GET /api/patients

# Get patient details
GET /api/patients/{id}

# Update patient record
PUT /api/patients/{id}

# Create medical note
POST /api/patients/{id}/notes

# Create prescription
POST /api/patients/{id}/prescriptions
```

#### Appointment Management
```bash
# View appointments
GET /api/appointments

# Create appointment
POST /api/appointments

# Update appointment
PUT /api/appointments/{id}

# Cancel appointment
DELETE /api/appointments/{id}

# View availability
GET /api/providers/{id}/availability
```

#### Telemedicine
```bash
# Start video call
POST /api/telemedicine/calls

# End video call
POST /api/telemedicine/calls/{id}/end

# Send message
POST /api/telemedicine/messages

# Get recording
GET /api/telemedicine/calls/{id}/recording
```

### Patient Commands

#### Self-Service
```bash
# View medical records
GET /api/my/records

# Book appointment
POST /api/my/appointments

# View appointments
GET /api/my/appointments

# Message provider
POST /api/my/messages

# View health analytics
GET /api/my/analytics
```

---

## 🔗 Integration Handoff to Claude

### System Architecture Overview

**Frontend**: React Native with Expo (Mobile-First)
**Backend**: Node.js with Express + TypeScript
**Database**: PostgreSQL with Drizzle ORM
**Authentication**: OAuth 2.0 + JWT
**Real-Time**: WebSocket for live updates
**Storage**: S3-compatible cloud storage
**Notifications**: Push notifications + in-app alerts

### API Endpoints

#### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/oauth/{provider}
POST   /api/auth/refresh
POST   /api/auth/logout
```

#### Patients
```
GET    /api/patients
GET    /api/patients/{id}
PUT    /api/patients/{id}
GET    /api/patients/{id}/records
GET    /api/patients/{id}/appointments
GET    /api/patients/{id}/prescriptions
```

#### Providers
```
GET    /api/providers
GET    /api/providers/{id}
GET    /api/providers/{id}/availability
POST   /api/providers/{id}/schedule
PUT    /api/providers/{id}/profile
```

#### Appointments
```
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/{id}
PUT    /api/appointments/{id}
DELETE /api/appointments/{id}
POST   /api/appointments/{id}/reschedule
```

#### Medical Records
```
GET    /api/records
GET    /api/records/{id}
POST   /api/records
PUT    /api/records/{id}
GET    /api/records/{id}/download
POST   /api/records/{id}/share
```

#### Telemedicine
```
POST   /api/telemedicine/calls
GET    /api/telemedicine/calls/{id}
POST   /api/telemedicine/calls/{id}/end
GET    /api/telemedicine/calls/{id}/recording
POST   /api/telemedicine/messages
GET    /api/telemedicine/conversations
```

#### Health Analytics
```
GET    /api/analytics/metrics
GET    /api/analytics/trends
POST   /api/analytics/report
GET    /api/analytics/insights
GET    /api/analytics/score
```

### Environment Variables

```env
# Application
NODE_ENV=production
APP_NAME=MediVac One
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:password@host:5432/medivac
DATABASE_SSL=true

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=3600
OAUTH_MICROSOFT_ID=your-id
OAUTH_MICROSOFT_SECRET=your-secret
OAUTH_GOOGLE_ID=your-id
OAUTH_GOOGLE_SECRET=your-secret
OAUTH_APPLE_ID=your-id
OAUTH_APPLE_SECRET=your-secret

# API
API_PORT=3000
API_HOST=0.0.0.0
API_CORS_ORIGIN=https://medivacapp-yqqx4b4l.manus.space

# Storage
S3_BUCKET=medivac-storage
S3_REGION=us-east-1
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret

# Notifications
PUSH_NOTIFICATION_KEY=your-key
APNS_CERTIFICATE=your-cert
FCM_SERVER_KEY=your-key

# Monitoring
SENTRY_DSN=your-dsn
LOG_LEVEL=info
```

### Service Integration Points

#### CloudAuthService
- Handles OAuth login/registration
- Manages JWT tokens
- Stores credentials securely
- Implements role-based access control

#### CloudSyncService
- Real-time data synchronization
- Conflict resolution (server-wins)
- Offline queue management
- Automatic retry logic

#### MedicalRecordsService
- CRUD operations for medical records
- File attachment management
- Access control enforcement
- Audit logging

#### AppointmentsService
- Appointment scheduling
- Provider availability management
- Appointment reminders
- Cancellation handling

#### NotificationsService
- Push notification delivery
- In-app notification management
- Notification preferences
- Delivery tracking

#### TelemedicineService
- Video call initiation
- Call recording management
- Messaging system
- Presence tracking

#### HealthAnalyticsService
- Metrics collection
- Trend analysis
- Report generation
- Health scoring

#### ProviderDirectoryService
- Provider search
- Specialty filtering
- Review management
- Favorite tracking

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] OAuth credentials configured
- [ ] S3 bucket created and configured
- [ ] Notification services configured
- [ ] Monitoring and logging enabled
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] User acceptance testing completed
- [ ] Documentation reviewed
- [ ] Support team trained
- [ ] Incident response plan ready

### Monitoring & Alerts

#### Key Metrics
- API response time (target: < 200ms)
- Error rate (target: < 0.1%)
- Database query time (target: < 100ms)
- Uptime (target: > 99.9%)

#### Alert Thresholds
- Response time > 500ms
- Error rate > 1%
- Database connection pool exhausted
- Disk space < 10%
- Memory usage > 80%

### Incident Response

#### Critical Issues
1. Page down
2. Data corruption
3. Security breach
4. Authentication failure

**Response Time**: 15 minutes  
**Escalation**: JEDI Council

#### High Priority Issues
1. Degraded performance
2. Partial service outage
3. Data sync failures
4. Notification delays

**Response Time**: 1 hour  
**Escalation**: Medical Director

#### Medium Priority Issues
1. UI bugs
2. Minor performance issues
3. Non-critical features down
4. Documentation updates

**Response Time**: 4 hours  
**Escalation**: Development Team

### Support Contacts

**JEDI Council**: council@jeditek.net  
**Medical Director**: director@medivac.local  
**Development Team**: dev@medivac.local  
**Support Team**: support@medivac.local  
**Emergency**: +1-555-JEDI-911  

---

## 📋 Handoff Checklist

- [x] All services implemented and tested
- [x] API endpoints documented
- [x] Database schema finalized
- [x] Authentication configured
- [x] Authorization levels defined
- [x] Command distribution documented
- [x] Environment variables specified
- [x] Deployment checklist created
- [x] Monitoring configured
- [x] Incident response plan ready
- [x] Support contacts established

**Status**: ✅ READY FOR PRODUCTION HANDOFF
