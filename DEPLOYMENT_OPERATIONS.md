# MediVac One - Deployment & Operations Manual

**Version**: 1.0.0  
**Status**: PRODUCTION READY  
**Last Updated**: 2026-06-15  

---

## 📋 Quick Start

### Pre-Deployment
```bash
npm install
npm test
npm run build
npm run check
```

### Deploy to Staging
```bash
npm run deploy:staging
npm run test:smoke
npm run test:integration
```

### Deploy to Production
```bash
git tag -a v1.0.0 -m "Production release"
npm run deploy
npm run verify:deployment
npm run health:check
```

---

## 🔧 Environment Variables

```bash
NODE_ENV=production
APP_NAME=MediVac One
API_PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/medivac
JWT_SECRET=$(openssl rand -base64 32)
OAUTH_MICROSOFT_ID=your-id
OAUTH_GOOGLE_ID=your-id
OAUTH_APPLE_ID=your-id
S3_BUCKET=medivac-storage
SENTRY_DSN=your-dsn
```

---

## 🚀 Deployment Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development mode |
| `npm run build` | Production build |
| `npm run start` | Start production |
| `npm run deploy` | Deploy to production |
| `npm run deploy:staging` | Deploy to staging |
| `npm run rollback` | Rollback to previous |
| `npm test` | Run tests |
| `npm run check` | TypeScript check |
| `npm run lint` | Lint code |
| `npm run format` | Format code |

---

## 📊 Monitoring

### Key Metrics
- API Response Time: < 200ms
- Error Rate: < 0.1%
- Database Query Time: < 100ms
- Uptime: > 99.9%

### Health Checks
```bash
curl https://api.medivac.local/health
npm run db:health
npm run cache:health
npm run storage:health
```

---

## 💾 Backup & Recovery

### Backup Schedule
- Daily: 2 AM UTC (incremental)
- Weekly: Sunday 3 AM UTC (full)
- Monthly: 1st at 4 AM UTC (archive)

### Recovery
```bash
systemctl stop medivac-api
pg_restore -d medivac /backups/medivac/latest.sql.gz
npm run db:verify
systemctl start medivac-api
```

---

## 🚨 Incident Response

### Critical Issues
- Response Time: 15 minutes
- Contact: JEDI Council
- Action: Page on-call team

### High Priority Issues
- Response Time: 1 hour
- Contact: Medical Director
- Action: Notify team

### Medium Priority Issues
- Response Time: 4 hours
- Contact: Dev Team
- Action: Create ticket

---

## 📞 Support

**24/7 Support**: support@medivac.local  
**Emergency**: +1-555-JEDI-911  
**On-Call**: See PagerDuty schedule  

---

**Status**: ✅ READY FOR PRODUCTION
