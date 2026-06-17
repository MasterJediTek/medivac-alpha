# FileMaker Sync System - Deployment Guide

## Quick Start

### 1. Prerequisites

```bash
# Verify Node.js installation
node --version  # Should be 16+
npm --version

# Verify JEDI folder structure exists
sudo mkdir -p /jedi/central/filemaker-databases
sudo mkdir -p /jedi/central/backups
sudo mkdir -p /jedi/central/metadata
sudo chmod 755 /jedi/central
```

### 2. Installation

```bash
cd /home/ubuntu/filemaker-sync-system

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env

# Required environment variables:
# - FILEMAKER_SERVER_HOST
# - FILEMAKER_SERVER_USERNAME
# - FILEMAKER_SERVER_PASSWORD
# - JEDI_COUNCIL_EMAIL
# - JEDI_MASTER_EMAILS
```

### 4. Test Sync

```bash
# Run manual sync
npm run sync

# Expected output:
# ✓ Discovers FileMaker files
# ✓ Syncs to JEDI folder
# ✓ Uploads to FileMaker Server
# ✓ Publishes to Web Direct
# ✓ Generates JEDI Council report
```

### 5. Activate Hourly Cron Job

#### Option A: Development Mode (Foreground)

```bash
npm run dev

# Runs sync every hour
# Press Ctrl+C to stop
```

#### Option B: Production Mode (Background with PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start cron job
npm run cron:start

# Check status
npm run cron:status

# View logs
npm run cron:logs

# Stop cron job
npm run cron:stop

# Make persistent across reboots
pm2 startup
pm2 save
```

#### Option C: Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/filemaker-sync.service
```

Paste this content:

```ini
[Unit]
Description=FileMaker Database Sync System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/filemaker-sync-system
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/scripts/hourly-sync-cron.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable filemaker-sync
sudo systemctl start filemaker-sync
sudo systemctl status filemaker-sync

# View logs
sudo journalctl -u filemaker-sync -f
```

## Monitoring

### Check Cron Job Status

```bash
# With PM2
npm run cron:status

# With Systemd
sudo systemctl status filemaker-sync

# View recent logs
tail -50 /var/log/filemaker-sync/sync-*.log
```

### View JEDI Council Reports

```bash
# List all reports
ls -la /var/log/filemaker-sync/jedi-council-reports/

# View latest report
cat /var/log/filemaker-sync/jedi-council-reports/report-JEDI-*.json | jq .

# View summary
ls -la /jedi/central/filemaker-databases/
ls -la /jedi/central/backups/
ls -la /jedi/central/metadata/
```

### Monitor Sync Activity

```bash
# Watch logs in real-time
tail -f /var/log/filemaker-sync/sync-$(date +%Y-%m-%d).log

# Check JEDI folder statistics
du -sh /jedi/central/*
find /jedi/central -type f | wc -l
```

## Troubleshooting

### Issue: "Permission denied" on JEDI folder

```bash
# Fix permissions
sudo chmod 755 /jedi/central
sudo chmod 755 /jedi/central/filemaker-databases
sudo chmod 755 /jedi/central/backups
sudo chmod 755 /jedi/central/metadata

# Verify
ls -la /jedi/central/
```

### Issue: Cron job not running

```bash
# Check if process is running
ps aux | grep filemaker-sync

# With PM2
pm2 list

# With Systemd
sudo systemctl status filemaker-sync

# Restart
npm run cron:stop
npm run cron:start
# or
sudo systemctl restart filemaker-sync
```

### Issue: FileMaker Server connection failed

```bash
# Verify credentials in .env
cat .env | grep FILEMAKER

# Test connectivity
ping iskooledu.fmcloud.fm

# Check firewall
sudo ufw status
```

### Issue: JEDI folder not found

```bash
# Create JEDI folder structure
sudo mkdir -p /jedi/central/{filemaker-databases,backups,metadata}
sudo chmod 755 /jedi/central

# Verify
ls -la /jedi/central/
```

## Maintenance

### Daily Tasks

- Review JEDI Council reports
- Check for CODE BLUE alerts
- Monitor sync success rate

### Weekly Tasks

- Archive old logs
- Review performance metrics
- Check JEDI folder disk usage

### Monthly Tasks

- Update FileMaker Server credentials if needed
- Review and update JEDI Master email list
- Verify Web Direct publishing status

### Quarterly Tasks

- Review sync strategy and conflict resolution
- Update documentation
- Test disaster recovery procedures

## Backup and Recovery

### Backup JEDI Folder

```bash
# Create backup of entire JEDI folder
sudo tar -czf /backup/jedi-central-$(date +%Y%m%d).tar.gz /jedi/central/

# Verify backup
tar -tzf /backup/jedi-central-*.tar.gz | head -20
```

### Restore from Backup

```bash
# Extract backup
sudo tar -xzf /backup/jedi-central-YYYYMMDD.tar.gz -C /

# Verify restoration
ls -la /jedi/central/
```

### Shadow Backup Management

```bash
# List all shadow backups
ls -la /jedi/central/backups/

# Find backups older than 30 days
find /jedi/central/backups -mtime +30 -type f

# Delete old backups (keep last 30 days)
find /jedi/central/backups -mtime +30 -type f -delete
```

## Performance Tuning

### Increase Concurrent Uploads

Edit `config/sync-config.ts`:

```typescript
sync: {
  maxConcurrentUploads: 5,  // Increase from 3
  retryAttempts: 5,
  retryDelayMs: 2000,
}
```

Rebuild:

```bash
npm run build
```

### Adjust Retry Strategy

```typescript
sync: {
  retryAttempts: 10,        // More retries
  retryDelayMs: 5000,       // Longer delay between retries
}
```

### Change Sync Interval

Edit `scripts/hourly-sync-cron.ts`:

```typescript
const cronConfig: CronJobConfig = {
  interval: 1800000,  // 30 minutes instead of 1 hour
}
```

Rebuild and restart:

```bash
npm run build
npm run cron:stop
npm run cron:start
```

## Security

### Protect Credentials

```bash
# Ensure .env is not committed to git
echo ".env" >> .gitignore

# Restrict file permissions
chmod 600 .env

# Never share .env file
```

### Audit Logs

```bash
# Review all sync operations
grep "Sync Execution" /var/log/filemaker-sync/sync-*.log

# Find all failures
grep "FAILED\|ERROR" /var/log/filemaker-sync/sync-*.log

# Check CODE BLUE alerts
grep "CODE BLUE" /var/log/filemaker-sync/sync-*.log
```

### Verify File Integrity

```bash
# Check metadata for file hashes
cat /jedi/central/metadata/*.metadata.json | jq .

# Verify file hashes match
sha256sum /jedi/central/filemaker-databases/*.fmp12
```

## Scaling

### Handle Large File Volumes

```typescript
// Increase memory allocation
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

// Or in systemd service
Environment="NODE_OPTIONS=--max-old-space-size=4096"
```

### Distribute Across Multiple Servers

1. Setup multiple sync instances
2. Use different source directories
3. Centralize JEDI folder on NFS
4. Coordinate via shared metadata

## Support

### Get Help

```bash
# View help
npm run --help

# Check logs
tail -100 /var/log/filemaker-sync/sync-*.log

# View latest report
cat /var/log/filemaker-sync/jedi-council-reports/report-JEDI-*.json | jq .

# Contact JEDI Council
echo "Issue: $(cat error.log)" | mail -s "FileMaker Sync Error" council@jedi.local
```

### Report Issues

Include in bug report:
- Error message from logs
- Environment details (OS, Node version)
- FileMaker Server version
- Steps to reproduce
- JEDI Council report ID

## Next Steps

1. ✅ Install and configure system
2. ✅ Run manual sync test
3. ✅ Activate hourly cron job
4. ✅ Monitor first 24 hours
5. ✅ Review JEDI Council reports
6. ✅ Adjust configuration as needed
7. ✅ Setup backup strategy
8. ✅ Document any customizations

## Contact

- **JEDI Council**: council@jedi.local
- **JEDI Masters**: master1@jedi.local, master2@jedi.local
- **System Administrator**: admin@jedi.local
