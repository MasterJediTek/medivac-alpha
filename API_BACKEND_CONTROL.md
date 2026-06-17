# MediVac One - API & Backend Control Guide

**Version**: 1.0.0  
**Status**: PRODUCTION READY  
**Last Updated**: 2026-06-15  

---

## 🔌 **API Architecture Overview**

### Backend Stack
- **Runtime**: Node.js 22.13.0
- **Framework**: Express.js
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **API Protocol**: REST + tRPC
- **Authentication**: OAuth 2.0 + JWT
- **Real-Time**: WebSocket

### Server Configuration
```typescript
// server/_core/index.ts
const app = express();
const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`API Server running on ${HOST}:${PORT}`);
});
```

---

## 🛣️ **API Endpoints Reference**

### Authentication Endpoints

#### POST `/api/auth/login`
**Purpose**: User login with email/password  
**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "user-123", "email": "user@example.com", "role": "patient" },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

#### POST `/api/auth/oauth/{provider}`
**Purpose**: OAuth login (microsoft, google, apple)  
**Request**:
```json
{
  "code": "oauth-code",
  "redirectUri": "https://app.medivac.local/oauth/callback"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "user-123", "email": "user@example.com", "role": "patient" },
    "tokens": { "accessToken": "jwt-token", "refreshToken": "refresh-token" }
  }
}
```

#### POST `/api/auth/register`
**Purpose**: User registration  
**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "user": { "id": "user-123", "email": "newuser@example.com" } }
}
```

#### POST `/api/auth/refresh`
**Purpose**: Refresh access token  
**Request**:
```json
{
  "refreshToken": "refresh-token"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "accessToken": "new-jwt-token" }
}
```

#### POST `/api/auth/logout`
**Purpose**: User logout  
**Response**:
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

### Patient Endpoints

#### GET `/api/patients`
**Purpose**: Get all patients (admin only)  
**Headers**: `Authorization: Bearer {jwt}`  
**Query**: `?page=1&limit=20&search=query`  
**Response**:
```json
{
  "success": true,
  "data": {
    "patients": [
      { "id": "p1", "firstName": "John", "lastName": "Doe", "email": "john@example.com" }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### GET `/api/patients/{id}`
**Purpose**: Get patient details  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "p1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-01",
    "phone": "+1-555-0000",
    "address": "123 Main St",
    "emergencyContact": { "name": "Jane Doe", "phone": "+1-555-0001" }
  }
}
```

#### PUT `/api/patients/{id}`
**Purpose**: Update patient profile  
**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0000",
  "address": "123 Main St"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "id": "p1", "firstName": "John", "lastName": "Doe" }
}
```

---

### Medical Records Endpoints

#### GET `/api/records`
**Purpose**: Get patient's medical records  
**Query**: `?type=lab&startDate=2026-01-01&endDate=2026-06-15`  
**Response**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "rec-1",
        "type": "lab",
        "title": "Blood Test Results",
        "date": "2026-06-10",
        "provider": "Dr. Smith",
        "status": "normal",
        "attachments": ["result.pdf"]
      }
    ]
  }
}
```

#### POST `/api/records`
**Purpose**: Create new medical record  
**Request**:
```json
{
  "patientId": "p1",
  "type": "diagnosis",
  "title": "Hypertension",
  "description": "Patient diagnosed with stage 2 hypertension",
  "date": "2026-06-15",
  "attachments": ["scan.pdf"]
}
```
**Response**:
```json
{
  "success": true,
  "data": { "id": "rec-1", "type": "diagnosis", "title": "Hypertension" }
}
```

#### GET `/api/records/{id}`
**Purpose**: Get specific record details  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "rec-1",
    "type": "lab",
    "title": "Blood Test",
    "description": "Complete blood count",
    "date": "2026-06-10",
    "results": { "RBC": "4.5M", "WBC": "7.2K" }
  }
}
```

#### PUT `/api/records/{id}`
**Purpose**: Update record  
**Request**:
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### DELETE `/api/records/{id}`
**Purpose**: Delete record (soft delete)  
**Response**:
```json
{
  "success": true,
  "data": { "message": "Record deleted" }
}
```

---

### Appointments Endpoints

#### GET `/api/appointments`
**Purpose**: Get appointments  
**Query**: `?status=scheduled&startDate=2026-06-15`  
**Response**:
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "apt-1",
        "providerId": "prov-1",
        "providerName": "Dr. Sarah Johnson",
        "date": "2026-06-20",
        "time": "14:00",
        "type": "consultation",
        "status": "scheduled",
        "location": "Room 101"
      }
    ]
  }
}
```

#### POST `/api/appointments`
**Purpose**: Book appointment  
**Request**:
```json
{
  "providerId": "prov-1",
  "date": "2026-06-20",
  "time": "14:00",
  "type": "consultation",
  "reason": "Regular checkup"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "id": "apt-1", "status": "scheduled" }
}
```

#### PUT `/api/appointments/{id}`
**Purpose**: Reschedule appointment  
**Request**:
```json
{
  "date": "2026-06-21",
  "time": "15:00"
}
```

#### DELETE `/api/appointments/{id}`
**Purpose**: Cancel appointment  
**Request**:
```json
{
  "reason": "Cannot make it"
}
```

---

### Telemedicine Endpoints

#### POST `/api/telemedicine/calls`
**Purpose**: Start video call  
**Request**:
```json
{
  "appointmentId": "apt-1",
  "providerId": "prov-1"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "callId": "call-1",
    "roomUrl": "https://jitsi.medivac.local/medivac/call-1",
    "startTime": "2026-06-15T14:00:00Z"
  }
}
```

#### POST `/api/telemedicine/calls/{id}/end`
**Purpose**: End video call  
**Request**:
```json
{
  "duration": 1800,
  "recordingUrl": "https://storage.medivac.local/recordings/call-1.mp4"
}
```

#### POST `/api/telemedicine/messages`
**Purpose**: Send message  
**Request**:
```json
{
  "conversationId": "conv-1",
  "content": "How are you feeling today?",
  "attachments": []
}
```

#### GET `/api/telemedicine/conversations`
**Purpose**: Get all conversations  
**Response**:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-1",
        "participantName": "Dr. Sarah Johnson",
        "lastMessage": "How are you feeling?",
        "lastMessageTime": "2026-06-15T10:30:00Z",
        "unreadCount": 2
      }
    ]
  }
}
```

---

### Analytics Endpoints

#### GET `/api/analytics/metrics`
**Purpose**: Get health metrics  
**Query**: `?type=vital&period=week`  
**Response**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "heartRate": { "current": 72, "average": 70, "trend": "stable" },
      "bloodPressure": { "current": "120/80", "average": "118/78", "trend": "stable" },
      "temperature": { "current": 98.6, "average": 98.5, "trend": "stable" },
      "oxygenSaturation": { "current": 98, "average": 97.5, "trend": "stable" }
    }
  }
}
```

#### GET `/api/analytics/trends`
**Purpose**: Get metric trends  
**Query**: `?metric=heartRate&period=month`  
**Response**:
```json
{
  "success": true,
  "data": {
    "trend": [
      { "date": "2026-05-15", "value": 68 },
      { "date": "2026-05-16", "value": 70 },
      { "date": "2026-05-17", "value": 72 }
    ],
    "average": 70,
    "min": 65,
    "max": 78
  }
}
```

#### POST `/api/analytics/report`
**Purpose**: Generate health report  
**Request**:
```json
{
  "period": "month",
  "includeMetrics": ["heart_rate", "blood_pressure", "steps"],
  "format": "pdf"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "reportId": "report-1",
    "downloadUrl": "https://storage.medivac.local/reports/report-1.pdf",
    "generatedAt": "2026-06-15T10:30:00Z"
  }
}
```

---

## 🎮 **Backend Control Commands**

### Server Management

```bash
# Start server
npm run dev:server

# Start in production
npm start

# Stop server
pm2 stop medivac-api

# Restart server
pm2 restart medivac-api

# View logs
pm2 logs medivac-api

# Monitor
pm2 monit
```

### Database Management

```bash
# Generate migrations
npm run db:generate

# Push schema
npm run db:push

# Migrate
npm run db:migrate

# Seed data
npm run db:seed

# Verify schema
npm run db:verify

# Reset (CAUTION)
npm run db:reset
```

### Testing & Validation

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# TypeScript check
npm run check

# Lint
npm run lint

# Format
npm run format
```

### Build & Deployment

```bash
# Build
npm run build

# Verify build
npm run check

# Deploy
npm run deploy

# Deploy staging
npm run deploy:staging

# Rollback
npm run rollback

# Verify deployment
npm run verify:deployment
```

---

## 🔐 **Backend Security Controls**

### Authentication Middleware
```typescript
// middleware/auth.ts
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Authorization Middleware
```typescript
// middleware/authorize.ts
export const authorize = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

### Rate Limiting
```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests'
});
```

### CORS Configuration
```typescript
// middleware/cors.ts
app.use(cors({
  origin: process.env.API_CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📊 **Monitoring & Observability**

### Health Check Endpoint
```bash
GET /health
Response: { "status": "healthy", "timestamp": "2026-06-15T10:30:00Z" }
```

### Metrics Endpoint
```bash
GET /metrics
Response: {
  "uptime": 3600,
  "memory": { "used": 150, "total": 512 },
  "requests": { "total": 1000, "errors": 5 },
  "database": { "connections": 10, "queries": 500 }
}
```

### Logging
```typescript
// All requests logged
app.use(morgan('combined'));

// Error logging
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    request: { method: req.method, path: req.path }
  });
  res.status(500).json({ error: 'Internal server error' });
});
```

---

## 🚀 **Scaling & Performance**

### Horizontal Scaling
```bash
# Add API instances
kubectl scale deployment medivac-api --replicas=5

# Add worker instances
kubectl scale deployment medivac-worker --replicas=3
```

### Caching Strategy
```typescript
// Redis caching
const cache = redis.createClient();

app.get('/api/patients/:id', async (req, res) => {
  const cached = await cache.get(`patient:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  const patient = await db.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
  await cache.setex(`patient:${req.params.id}`, 3600, JSON.stringify(patient));
  res.json(patient);
});
```

### Connection Pooling
```typescript
// Database connection pool
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 📞 **Support & Troubleshooting**

| Issue | Solution |
|-------|----------|
| API not responding | Check server status: `pm2 status` |
| Database connection error | Verify DATABASE_URL and credentials |
| Authentication failing | Check JWT_SECRET and token expiry |
| High memory usage | Restart server: `pm2 restart medivac-api` |
| Slow queries | Check database indexes and query plans |

---

**Status**: ✅ PRODUCTION READY
