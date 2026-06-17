# FileMaker Sync System - Architecture & Design

## System Overview

The FileMaker Sync System provides comprehensive, non-destructive synchronization of FileMaker databases across three tiers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL FILEMAKER FILES                         │
│              (/home/ubuntu/projects/filemaker-databases/files)   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  FILE DISCOVERY     │
        │  & ANALYSIS         │
        │                     │
        │ • Hash calculation  │
        │ • Format validation │
        │ • Security check    │
        └─────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  CONFLICT           │
        │  DETECTION          │
        │                     │
        │ • Compare hashes    │
        │ • Version tracking  │
        │ • Metadata lookup   │
        └─────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────┐
        ▼                    ▼              ▼
   ┌─────────────┐   ┌──────────────┐  ┌──────────────┐
   │ JEDI FOLDER │   │ FILEMAKER    │  │ WEB DIRECT   │
   │ SYNC        │   │ SERVER       │  │ PUBLISHING   │
   │             │   │ UPLOAD       │  │              │
   │ • Copy file │   │              │  │ • Enable     │
   │ • Version   │   │ • Upload     │  │ • Verify     │
   │ • Backup    │   │ • Publish    │  │ • Monitor    │
   │ • Metadata  │   │ • Verify     │  │              │
   └─────────────┘   └──────────────┘  └──────────────┘
        │                    │              │
        └─────────┬──────────┴──────────────┘
                  ▼
        ┌─────────────────────┐
        │  JEDI COUNCIL       │
        │  REPORTING          │
        │                     │
        │ • Generate report   │
        │ • Track metrics     │
        │ • Send alerts       │
        │ • Log results       │
        └─────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  HOURLY CRON JOB    │
        │  SCHEDULER          │
        │                     │
        │ • Retry logic       │
        │ • Failure tracking  │
        │ • CODE BLUE alerts  │
        │ • Homing beacon     │
        └─────────────────────┘
```

## Core Components

### 1. FileMakerSyncService

**Purpose**: Analyze and track FileMaker databases

**Responsibilities**:
- Discover FileMaker files (.fmp12, .jedi)
- Calculate file hashes (SHA-256)
- Validate file format
- Check security settings
- Detect conflicts
- Track sync results

**Key Methods**:
- `analyzeDatabase()` - Extract file metadata
- `detectConflicts()` - Compare versions
- `resolveConflict()` - Apply conflict strategy
- `recordResult()` - Track sync outcome

### 2. JediFolderSyncService

**Purpose**: Synchronize files to central JEDI folder

**Responsibilities**:
- Ensure JEDI folder structure
- Copy files to JEDI folder
- Create versioned copies (non-destructive)
- Generate metadata files
- Maintain shadow backups

**Key Methods**:
- `syncToJediFolder()` - Main sync operation
- `createVersionedFilePath()` - Preserve originals
- `updateMetadata()` - Track file versions
- `getJediFolderStats()` - Report statistics

**Non-Destructive Behavior**:
- Skip files that already exist (if configured)
- Create versioned copies instead of overwriting
- Never delete files
- Always preserve originals

### 3. FileMakerServerService

**Purpose**: Upload and publish to FileMaker Server

**Responsibilities**:
- Upload databases to iskooledu.fmcloud.fm
- Publish to Web Direct
- Verify publication
- Handle versioning

**Key Methods**:
- `uploadDatabase()` - Upload to server
- `publishToWebDirect()` - Enable Web Direct
- `verifyWebDirectPublishing()` - Test access
- `createVersionedDatabaseName()` - Version naming

**Non-Destructive Behavior**:
- Skip if database already exists
- Create versioned copies on conflict
- Never overwrite existing databases
- Preserve all original files

### 4. JediCouncilReporter

**Purpose**: Generate comprehensive reports and alerts

**Responsibilities**:
- Generate sync reports
- Track metrics and statistics
- Create recommendations
- Format email notifications
- Send CODE BLUE alerts
- Track consecutive failures

**Key Methods**:
- `generateReport()` - Create full report
- `generateRecommendations()` - Actionable next steps
- `formatReportForEmail()` - Email formatting
- `getFailureStats()` - Failure tracking

**Report Contents**:
- Sync status (success/partial/failed)
- Files processed (new/updated/failed)
- Conflicts detected
- Consecutive failures
- Actionable recommendations
- Detailed error information

### 5. SyncOrchestrator

**Purpose**: Coordinate all sync operations

**Responsibilities**:
- Orchestrate complete sync workflow
- Manage all services
- Track overall status
- Generate final results
- Handle errors

**Workflow**:
1. Discover local databases
2. Sync to JEDI folder
3. Upload to FileMaker Server
4. Publish to Web Direct
5. Generate JEDI Council report
6. Print summary

### 6. FileMakerSyncCronJob

**Purpose**: Automated hourly monitoring

**Responsibilities**:
- Execute sync on schedule
- Implement retry logic
- Track execution statistics
- Handle failures
- Send alerts

**Features**:
- Hourly execution (configurable)
- Retry up to 5 times
- Exponential backoff
- CODE BLUE alert on threshold
- Homing beacon notification
- Graceful shutdown handling

## Data Flow

### Sync Execution Flow

```
START
  │
  ├─► Discover Local Files
  │    └─► Analyze each file
  │         └─► Calculate hash
  │         └─► Validate format
  │         └─► Check security
  │
  ├─► Detect Conflicts
  │    └─► Compare with JEDI folder
  │    └─► Compare with server
  │    └─► Apply resolution strategy
  │
  ├─► Sync to JEDI Folder
  │    └─► Check if exists
  │    │    ├─► Same hash? → SKIP
  │    │    ├─► Different hash? → VERSION or SKIP
  │    │    └─► Not exists? → COPY
  │    └─► Create metadata
  │    └─► Create backup
  │
  ├─► Upload to FileMaker Server
  │    └─► Check if exists
  │    │    ├─► Same hash? → SKIP
  │    │    ├─► Different hash? → VERSION or SKIP
  │    │    └─► Not exists? → UPLOAD
  │    └─► Verify upload
  │
  ├─► Publish to Web Direct
  │    └─► Check if published
  │    │    ├─► Already published? → SKIP
  │    │    └─► Not published? → PUBLISH
  │    └─► Verify access
  │
  ├─► Generate JEDI Council Report
  │    └─► Collect statistics
  │    └─► Generate recommendations
  │    └─► Format for email
  │    └─► Save to file
  │
  └─► END
       └─► Return results
```

## Configuration

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `FILEMAKER_SERVER_HOST` | FileMaker Server | `iskooledu.fmcloud.fm` |
| `FILEMAKER_SERVER_USERNAME` | Admin user | `admin` |
| `FILEMAKER_SERVER_PASSWORD` | Admin password | `secure_pass` |
| `JEDI_ROOT_PATH` | JEDI root folder | `/jedi/central` |
| `JEDI_SYNC_PATH` | Sync folder | `/jedi/central/filemaker-databases` |
| `JEDI_BACKUP_PATH` | Backup folder | `/jedi/central/backups` |
| `JEDI_METADATA_PATH` | Metadata folder | `/jedi/central/metadata` |
| `FILEMAKER_SOURCE_DIR` | Local source | `/home/ubuntu/projects/filemaker-databases/files` |
| `JEDI_COUNCIL_EMAIL` | Council email | `council@jedi.local` |
| `JEDI_MASTER_EMAILS` | Master emails | `master1@jedi.local,master2@jedi.local` |

### Sync Configuration

```typescript
sync: {
  overwriteExisting: false,           // Never overwrite
  createShadowBackup: true,           // Always backup
  conflictResolution: 'skip',         // Skip conflicts
  maxConcurrentUploads: 3,            // Parallel uploads
  retryAttempts: 5,                   // Retry count
  retryDelayMs: 2000,                 // Retry delay
  nonDestructive: true,               // ENFORCE non-destructive
  skipExistingFiles: true,            // Skip if exists
}
```

## File Organization

```
/jedi/central/
├── filemaker-databases/             # Main sync folder
│   ├── Database1.fmp12
│   ├── Database2.fmp12
│   ├── Database1.v2024-01-15...fmp12  # Versioned copy
│   └── ...
├── backups/                         # Shadow backups
│   ├── Database1.fmp12.backup.2024-01-15...
│   ├── Database2.fmp12.backup.2024-01-15...
│   └── ...
└── metadata/                        # Metadata files
    ├── Database1.fmp12.metadata.json
    ├── Database2.fmp12.metadata.json
    └── ...
```

## Metadata Format

```json
{
  "fileName": "Database1.fmp12",
  "fileHash": "abc123def456...",
  "status": "synced",
  "syncedAt": "2024-01-15T10:30:45.123Z",
  "backupPath": "/jedi/central/backups/Database1.fmp12.backup.2024-01-15...",
  "nonDestructive": true
}
```

## Error Handling

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: Wait 2 seconds
Attempt 3: Wait 2 seconds
Attempt 4: Wait 2 seconds
Attempt 5: Wait 2 seconds
Failed: Report error
```

### Failure Tracking

- Count consecutive failures
- Alert when threshold (5) exceeded
- Send CODE BLUE alert
- Notify JEDI Masters
- Continue with next file

### Recovery

- Automatic retry with backoff
- Manual intervention option
- Detailed error logging
- Actionable recommendations

## Alerts and Notifications

### CODE BLUE Alert

**Trigger**: 5 consecutive failures

**Recipients**:
- JEDI Masters
- Grand Masters
- System Administrator

**Content**:
- Failure count
- Threshold exceeded
- Immediate action required
- Recommended remedies

### Homing Beacon

**Trigger**: Critical system failure

**Recipients**:
- JEDI Council
- All JEDI Masters
- Manus Account

**Content**:
- Emergency alert
- System status
- Recovery instructions

## Performance Characteristics

### Typical Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Discover 100 files | 1-2s | Hash calculation |
| Sync 100 files | 2-5s | Copy operations |
| Upload 100 files | 5-10s | Network dependent |
| Publish 100 files | 3-5s | API calls |
| Generate report | 1-2s | JSON processing |
| **Total (100 files)** | **12-25s** | End-to-end |

### Resource Usage

- **CPU**: < 5% during sync
- **Memory**: ~100MB base + file size
- **Disk I/O**: Depends on file sizes
- **Network**: Depends on server latency

## Security Considerations

### Credentials

- Store in `.env` file (never commit)
- Restrict file permissions (600)
- Use strong passwords
- Rotate credentials quarterly

### File Integrity

- SHA-256 hash verification
- Metadata tracking
- Shadow backups
- Audit logging

### Access Control

- JEDI folder permissions (755)
- User-based access
- Audit trail
- Role-based notifications

## Scalability

### Current Limits

- ~1000 files per sync
- ~100MB total size per sync
- Single-threaded processing
- Hourly execution

### Scaling Options

1. **Increase concurrency**: Adjust `maxConcurrentUploads`
2. **Distribute load**: Multiple sync instances
3. **Optimize storage**: Use NFS for JEDI folder
4. **Parallel processing**: Implement worker queue

## Future Enhancements

1. **Real-time sync**: Watch for file changes
2. **Compression**: Reduce file sizes
3. **Encryption**: Secure file transfer
4. **Replication**: Multi-server setup
5. **Web UI**: Dashboard for monitoring
6. **API**: RESTful interface
7. **Webhooks**: Event notifications
8. **Advanced analytics**: Performance insights

## Testing Strategy

### Unit Tests

- File hash calculation
- Conflict detection
- Metadata generation
- Report formatting

### Integration Tests

- JEDI folder sync
- FileMaker Server upload
- Web Direct publishing
- Email notifications

### End-to-End Tests

- Complete sync workflow
- Error scenarios
- Recovery procedures
- Performance benchmarks

## Maintenance

### Daily

- Monitor sync success
- Review CODE BLUE alerts
- Check JEDI Council reports

### Weekly

- Archive old logs
- Verify backups
- Review metrics

### Monthly

- Update credentials
- Review conflict patterns
- Optimize configuration

### Quarterly

- Full system audit
- Disaster recovery test
- Documentation update
