# MediVac One - Manus Task Instructions & Automation

**Version**: 1.0.0  
**Status**: PRODUCTION READY  
**Last Updated**: 2026-06-15  

---

## 📋 **Manus Task Overview**

This document provides comprehensive instructions for automating MediVac One operations through Manus task scheduling and execution.

---

## 🎯 **Task Categories**

### 1. **Daily Operations Tasks**

#### Task: Daily Health Check
**Frequency**: Every 6 hours  
**Command**:
```bash
npm run health:check && npm run metrics:check
```
**Expected Output**:
```
✅ API Health: OK
✅ Database: Connected
✅ Cache: Connected
✅ Storage: Connected
✅ Notifications: Ready
```

#### Task: Daily Backup
**Frequency**: Daily at 2 AM UTC  
**Command**:
```bash
npm run backup:database && npm run backup:storage
```
**Expected Output**:
```
✅ Database backup: /backups/medivac_20260615_020000.sql.gz
✅ Storage backup: s3://medivac-backups/storage_20260615_020000.tar.gz
```

#### Task: Log Rotation
**Frequency**: Daily at midnight UTC  
**Command**:
```bash
npm run logs:rotate && npm run logs:archive
```
**Expected Output**:
```
✅ Logs rotated: /var/log/medivac/medivac.log.1
✅ Logs archived: s3://medivac-logs/archive/2026-06-15.tar.gz
```

---

### 2. **Weekly Operations Tasks**

#### Task: Full Database Backup
**Frequency**: Every Sunday at 3 AM UTC  
**Command**:
```bash
npm run backup:database:full && npm run backup:verify
```
**Expected Output**:
```
✅ Full backup completed: /backups/medivac_full_20260615.sql.gz
✅ Backup verified: Size 2.5GB, Integrity OK
```

#### Task: Security Audit
**Frequency**: Weekly on Monday at 9 AM UTC  
**Command**:
```bash
npm run security:audit && npm run security:report
```
**Expected Output**:
```
✅ Security audit completed
✅ Vulnerabilities found: 0
✅ Report: /reports/security_20260615.pdf
```

#### Task: Performance Analysis
**Frequency**: Weekly on Friday at 5 PM UTC  
**Command**:
```bash
npm run performance:analyze && npm run performance:report
```
**Expected Output**:
```
✅ Response time: 145ms (target: <200ms)
✅ Error rate: 0.05% (target: <0.1%)
✅ Database query time: 85ms (target: <100ms)
✅ Uptime: 99.95% (target: >99.9%)
```

---

### 3. **Monthly Operations Tasks**

#### Task: Full System Audit
**Frequency**: 1st of every month at 10 AM UTC  
**Command**:
```bash
npm run audit:full && npm run audit:report
```
**Expected Output**:
```
✅ System audit completed
✅ Configuration review: OK
✅ Access control review: OK
✅ Compliance check: HIPAA OK, GDPR OK
```

#### Task: Capacity Planning
**Frequency**: 1st of every month at 11 AM UTC  
**Command**:
```bash
npm run capacity:analyze && npm run capacity:forecast
```
**Expected Output**:
```
✅ Current capacity usage: 65%
✅ Forecast (3 months): 78%
✅ Recommendation: Scale up in 2 months
```

#### Task: Archive Old Data
**Frequency**: 1st of every month at midnight UTC  
**Command**:
```bash
npm run data:archive && npm run data:cleanup
```
**Expected Output**:
```
✅ Archived 1000 old records
✅ Freed 500MB disk space
✅ Archive location: s3://medivac-archive/2026-05/
```

---

### 4. **On-Demand Tasks**

#### Task: Manual Sync
**Trigger**: Manual  
**Command**:
```bash
npm run sync:manual
```

#### Task: Database Optimization
**Trigger**: Manual or when performance degrades  
**Command**:
```bash
npm run db:optimize && npm run db:analyze
```

#### Task: Cache Clear
**Trigger**: Manual or after deployments  
**Command**:
```bash
npm run cache:clear && npm run cache:warm
```

#### Task: Emergency Rollback
**Trigger**: Manual (emergency only)  
**Command**:
```bash
npm run rollback:emergency
```

---

## 🔧 **Manus Configuration**

### Task Definition Template

```yaml
name: medivac-daily-health-check
description: "Daily health check for MediVac One"
schedule: "0 */6 * * *"  # Every 6 hours
command: "npm run health:check"
timeout: 300
retries: 3
notifications:
  - type: email
    recipients: ["ops@medivac.local"]
    on: failure
  - type: slack
    channel: "#medivac-ops"
    on: failure
```

### Manus CLI Commands

```bash
# Create task
manus-config schedule create --name medivac-daily-check \
  --command "npm run health:check" \
  --schedule "0 */6 * * *"

# List tasks
manus-config schedule list

# View task details
manus-config schedule get medivac-daily-check

# Update task
manus-config schedule update medivac-daily-check \
  --schedule "0 */4 * * *"

# Run task manually
manus-config schedule run medivac-daily-check

# Pause task
manus-config schedule pause medivac-daily-check

# Resume task
manus-config schedule resume medivac-daily-check

# Delete task
manus-config schedule delete medivac-daily-check

# View task logs
manus-config schedule logs medivac-daily-check

# View task metrics
manus-config schedule metrics medivac-daily-check
```

---

## 📊 **Task Monitoring**

### Task Status Dashboard

```bash
# View all task statuses
manus-config schedule status

# View task execution history
manus-config schedule history medivac-daily-check

# View task performance metrics
manus-config schedule metrics medivac-daily-check
```

### Expected Output
```
Task: medivac-daily-health-check
Status: ACTIVE
Last Run: 2026-06-15 10:30:00 UTC
Last Status: SUCCESS
Next Run: 2026-06-15 16:30:00 UTC
Execution Time: 45 seconds
Success Rate: 99.8%
```

---

## 🚨 **Error Handling & Alerts**

### Task Failure Notifications

```yaml
notifications:
  - type: email
    recipients: ["ops@medivac.local"]
    on: failure
    subject: "Task Failed: {task_name}"
    body: |
      Task: {task_name}
      Status: {status}
      Error: {error_message}
      Timestamp: {timestamp}
      
  - type: slack
    channel: "#medivac-alerts"
    on: failure
    message: |
      🚨 Task Failed: {task_name}
      Error: {error_message}
      
  - type: pagerduty
    severity: critical
    on: failure
    count: 3  # Alert after 3 consecutive failures
```

### Retry Logic

```yaml
retries:
  max: 3
  delay: 60  # seconds
  backoff: exponential  # exponential backoff
```

---

## 🔄 **Automation Workflows**

### Deployment Workflow

```yaml
workflow: deployment
steps:
  - name: run-tests
    command: "npm test"
    timeout: 600
    
  - name: build
    command: "npm run build"
    timeout: 300
    
  - name: deploy-staging
    command: "npm run deploy:staging"
    timeout: 600
    
  - name: run-smoke-tests
    command: "npm run test:smoke"
    timeout: 300
    
  - name: deploy-production
    command: "npm run deploy"
    timeout: 600
    
  - name: verify-deployment
    command: "npm run verify:deployment"
    timeout: 300
    
  - name: notify-team
    command: "npm run notify:deployment"
    timeout: 60
```

### Backup & Recovery Workflow

```yaml
workflow: backup-recovery
steps:
  - name: backup-database
    command: "npm run backup:database"
    timeout: 1800
    
  - name: backup-storage
    command: "npm run backup:storage"
    timeout: 1800
    
  - name: verify-backups
    command: "npm run backup:verify"
    timeout: 300
    
  - name: archive-backups
    command: "npm run backup:archive"
    timeout: 600
    
  - name: cleanup-old-backups
    command: "npm run backup:cleanup"
    timeout: 300
```

---

## 📈 **Performance Optimization Tasks**

### Task: Query Optimization
**Frequency**: Weekly  
**Command**:
```bash
npm run db:optimize:queries
```

### Task: Index Analysis
**Frequency**: Weekly  
**Command**:
```bash
npm run db:analyze:indexes
```

### Task: Cache Optimization
**Frequency**: Daily  
**Command**:
```bash
npm run cache:optimize
```

### Task: Connection Pool Tuning
**Frequency**: Monthly  
**Command**:
```bash
npm run db:tune:pool
```

---

## 🔐 **Security Tasks**

### Task: Vulnerability Scan
**Frequency**: Daily  
**Command**:
```bash
npm run security:scan
```

### Task: Dependency Update Check
**Frequency**: Weekly  
**Command**:
```bash
npm run security:check-updates
```

### Task: SSL Certificate Renewal
**Frequency**: Monthly  
**Command**:
```bash
npm run security:renew-certs
```

### Task: Access Control Audit
**Frequency**: Monthly  
**Command**:
```bash
npm run security:audit-access
```

---

## 📞 **Support & Escalation**

### Task Failure Escalation

1. **First Failure**: Log and notify ops team
2. **Second Failure**: Page on-call engineer
3. **Third Failure**: Escalate to director
4. **Fourth Failure**: Page JEDI Council

### Contact Information

- **Ops Team**: ops@medivac.local
- **On-Call**: See PagerDuty schedule
- **Director**: director@medivac.local
- **JEDI Council**: council@jeditek.net
- **Emergency**: +1-555-JEDI-911

---

## ✅ **Task Checklist**

- [ ] All daily tasks configured
- [ ] All weekly tasks configured
- [ ] All monthly tasks configured
- [ ] Error handling configured
- [ ] Notifications configured
- [ ] Monitoring configured
- [ ] Escalation procedures defined
- [ ] Contact information updated
- [ ] Documentation reviewed
- [ ] Tasks tested

---

**Status**: ✅ READY FOR MANUS AUTOMATION
