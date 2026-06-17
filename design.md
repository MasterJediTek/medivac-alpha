# MediVac One Virtual Hospital - Mobile App Design

## Design Philosophy

This mobile app follows Apple Human Interface Guidelines (HIG) to deliver a first-party iOS experience. The design assumes mobile portrait orientation (9:16) and one-handed usage patterns. The interface translates the comprehensive FileMaker-based MediVac One system into a touch-optimized mobile experience.

## Screen List

| Screen | Purpose | Primary Content |
|--------|---------|-----------------|
| Home Dashboard | Main entry point | Quick stats, recent activity, quick actions |
| Patients | Patient management | Patient list with search and filters |
| Patient Detail | Individual patient view | Patient info, records, appointments |
| Doctors | Staff directory | Doctor list with specialties |
| Appointments | Scheduling | Calendar view, appointment list |
| Medications | Medication tracking | Medication list, dosage info |
| Labs | Laboratory results | Lab test results and history |
| Tasks | Task management | Kanban-style task board |
| Communications | Messaging hub | Chat, bulletins, alerts |
| Analytics | Data visualization | Charts and statistics |
| JEDI Hub | JEDI integration | JEDI systems access, VPN browser |
| Settings | App configuration | Profile, sync, preferences |

## Primary Content and Functionality

### Home Dashboard
The dashboard presents a personalized overview with greeting header showing current date and user name. Quick stats cards display today's appointments count, pending tasks, and unread messages. A recent activity feed shows the last 5 patient interactions. Quick action buttons provide one-tap access to add patient, schedule appointment, and new message.

### Patients Screen
A searchable list displays all patients with avatar, name, and last visit date. Filter chips enable filtering by status (active, discharged, critical). Each patient card shows key vitals summary. Pull-to-refresh updates the patient list. Floating action button enables adding new patients.

### Patient Detail Screen
Segmented control switches between Overview, Records, and Appointments tabs. Overview displays demographics, emergency contact, and current medications. Records shows medical history timeline with expandable entries. Appointments displays upcoming and past appointments with scheduling options.

### Appointments Screen
Calendar strip at top enables date selection. Appointment cards display time, patient name, doctor, and type. Color coding indicates appointment status (confirmed, pending, completed). Bottom sheet enables creating new appointments with date picker, patient selector, and notes field.

### Tasks Screen
Three-column Kanban layout (To Do, In Progress, Done) with horizontal scroll on mobile. Task cards display title, description preview, assignee avatar, and due date. Drag-and-drop (or tap-to-move) enables status changes. Filter options for assigned to me, all tasks, and by priority.

### Communications Screen
Tab bar switches between Chat, Bulletins, and Alerts. Chat displays conversation list with unread badges. Bulletins shows institutional announcements with timestamps. Alerts displays system notifications with severity indicators (info, warning, critical).

### JEDI Hub Screen
Connection status indicator shows JEDI system connectivity. Quick links to JEDI Knowledge Base, WONGI Tracker, and VPN Browser. Sync status displays last sync time and pending changes. Manual sync button triggers immediate synchronization.

## Key User Flows

### Patient Check-In Flow
User taps patient from list, views patient detail, taps "Check In" button, confirms check-in with optional notes, system updates patient status and creates activity log entry.

### Appointment Scheduling Flow
User navigates to Appointments, taps floating action button, selects patient from picker, chooses date and time from calendar, selects doctor, adds notes, taps "Schedule" to confirm.

### Task Completion Flow
User views task in To Do column, taps task to view details, completes required actions, taps "Mark Complete" or drags to Done column, system updates task status with timestamp.

### JEDI Sync Flow
User opens JEDI Hub, views sync status, taps "Sync Now" if needed, system connects to JEDI servers, downloads updates and uploads local changes, displays sync completion confirmation.

## Color Choices

| Element | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| Primary | #0066CC | #4DA6FF | Buttons, links, active states |
| Background | #FFFFFF | #1A1A2E | Screen backgrounds |
| Surface | #F5F7FA | #252540 | Cards, elevated surfaces |
| Foreground | #1A1A2E | #FFFFFF | Primary text |
| Muted | #6B7280 | #9CA3AF | Secondary text |
| Success | #22C55E | #4ADE80 | Positive states, completed |
| Warning | #F59E0B | #FBBF24 | Caution states, pending |
| Error | #EF4444 | #F87171 | Error states, critical |
| Medical Blue | #0EA5E9 | #38BDF8 | Medical-specific elements |
| JEDI Purple | #8B5CF6 | #A78BFA | JEDI integration elements |

## Navigation Structure

The app uses bottom tab navigation with five primary tabs:

1. **Home** (house icon) - Dashboard with quick access
2. **Patients** (people icon) - Patient management
3. **Schedule** (calendar icon) - Appointments and scheduling
4. **Tasks** (checklist icon) - Task management
5. **More** (grid icon) - Additional features and settings

The "More" tab provides access to: Communications, Labs, Medications, Analytics, JEDI Hub, and Settings.

## Component Patterns

Cards use 16px corner radius with subtle shadow on light mode and border on dark mode. Buttons follow iOS conventions with 44pt minimum touch targets. Lists use standard iOS cell styling with chevron indicators for navigation. Forms use grouped style with section headers. Modals slide up from bottom with drag-to-dismiss gesture.

## Accessibility Considerations

All interactive elements meet minimum 44x44pt touch target size. Color contrast ratios exceed WCAG AA standards. VoiceOver labels provided for all icons and images. Dynamic type support enables user font size preferences. Reduced motion option respects system accessibility settings.


---

## Landing Page & Cloud Integration Upgrade

### New Screens Added

#### Landing/Welcome Screen
- Hero section with MediVac One branding
- Feature showcase cards highlighting key benefits
- Sign In and Register call-to-action buttons
- Hospital information and contact details
- Animated background with medical theme

#### Sign In Screen
- OAuth provider selection (Microsoft, Google, Apple)
- Email/password fallback option
- "Forgot Password" link
- "Create Account" link
- Secure credential handling

#### Registration Screen
- Email and password input fields
- Hospital role selection (Doctor, Nurse, Admin, etc.)
- Terms and conditions acceptance
- Email verification step
- Profile completion flow

#### Cloud Dashboard
- Real-time patient data from cloud
- Appointment calendar synced with cloud backend
- Medical records cloud storage viewer
- Sync status indicator
- Offline mode indicator

### Cloud Integration Architecture

**Authentication Flow**:
1. User selects OAuth provider
2. OAuth redirect to provider
3. Provider returns auth token
4. App exchanges token for session
5. Session stored securely in Secure Store
6. User authenticated for cloud API calls

**Data Synchronization**:
1. App detects online/offline status
2. When online: syncs local changes to cloud
3. Cloud sends delta updates to app
4. Conflict resolution: server-wins strategy
5. Local cache updated with cloud data
6. Offline mode: app uses cached data

**Real-Time Updates**:
1. WebSocket connection to cloud server
2. Server pushes appointment changes
3. Server pushes medical record updates
4. Server pushes alert notifications
5. App updates UI in real-time
6. Background sync when offline

### Security Considerations

- OAuth tokens stored in Secure Store
- API calls use HTTPS only
- Medical data encrypted at rest
- Biometric authentication for sensitive data
- Session timeout after 15 minutes
- Audit logging for all data access
