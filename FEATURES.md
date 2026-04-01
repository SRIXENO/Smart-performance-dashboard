# Features Catalog

This document describes the functional and product-facing capability set of SPID in a way that is useful for reviewers, recruiters, and engineering collaborators.

## Capability Map

```mermaid
mindmap
  root((SPID))
    Authentication
      Local Login
      Google OAuth
      Role-Based Access
    Operations
      Students
      Faculty
      Subjects
      Performance
    Intelligence
      KPI Dashboards
      Risk Signals
      Trends
      Comparisons
    Governance
      Approvals
      Login History
      Activity Logs
    Reporting
      Imports
      Exports
```

## Functional Overview By Domain

### 1. Authentication and Access Control

- Local login with email, user ID, and register-number oriented handling
- Google OAuth integration
- JWT-based auth with refresh/session handling
- Role-based permissions enforced in backend middleware
- Account blocking and pending-approval restrictions

### 2. Admin Approval Workflow

- New viewers enter the system in a pending state
- Admin can review pending access requests
- Admin can approve or reject requests
- Unapproved users are prevented from gaining operational access

### 3. Student Management

- Create, view, edit, and delete student records
- Filter by department, year, semester, and status
- Navigate from student list to profile and analytics views
- Manage lifecycle state transitions such as active/inactive/suspended

### 4. Student Intelligence Views

- Student profile overview
- Analytics and trend views
- Attendance and academic summaries
- Risk-focused context for intervention workflows

### 5. Faculty Management

- Faculty list and lifecycle management
- Designation, bio, expertise, and profile metadata
- Faculty-level operational insights
- Admin-controlled create/update/delete flow

### 6. Subject Management

- Subject definitions and grouped assignment models
- Department/year/semester-based subject mapping
- Student-subject linking through operational workflows

### 7. Performance Management

- Performance record creation and updates
- Marks, grade, attendance, and semester handling
- Missing-performance views and remediation workflows
- Dashboard consumption of performance aggregates

### 8. Dashboard and Analytics

- KPI cards for operational metrics
- Performance trends and distribution charts
- Department comparisons
- Attendance/performance correlation views
- Student and institution-level analytics screens

### 9. Command Center

- Pending approvals queue
- Weak-department visibility
- Missing performance visibility
- Import issue alerts
- Recent anomalies and urgent action queues

### 10. Governance and Audit

- Login history screen
- Activity timeline
- Administrative action traceability
- Security-relevant operational visibility

### 11. Data Import and Export

- Import-preview workflows
- Commit flows for data updates
- Export support for filtered reporting use cases

## User Journey Summary

### Admin Journey

```mermaid
journey
  title Admin Operations Flow
  section Access
    Login: 5: Admin
    Review Dashboard Alerts: 5: Admin
  section Governance
    Approve Accounts: 5: Admin
    Review Login History: 4: Admin
  section Operations
    Manage Students: 5: Admin
    Review Performance Gaps: 5: Admin
    Export Reports: 4: Admin
```

### Faculty Journey

```mermaid
journey
  title Faculty Academic Workflow
  section Access
    Login: 5: Faculty
  section Work
    View Students: 5: Faculty
    Check Subject Mapping: 4: Faculty
    Enter Performance: 5: Faculty
    Review Analytics: 4: Faculty
```

### Student Journey

```mermaid
journey
  title Student Insight Workflow
  section Access
    Login: 5: Student
  section Visibility
    View Dashboard: 4: Student
    Review Performance Trends: 4: Student
    Track Academic Progress: 5: Student
```

## Operational Flow Examples

### Student Creation

```mermaid
sequenceDiagram
  participant Admin
  participant UI
  participant API
  participant DB
  Admin->>UI: Submit student form
  UI->>API: POST /api/students
  API->>DB: Create student + linked user record
  DB-->>API: Persisted entity
  API-->>UI: Success payload
  UI-->>Admin: Confirmation
```

### Performance Entry

```mermaid
sequenceDiagram
  participant Faculty
  participant UI
  participant API
  participant DB
  Faculty->>UI: Select student
  UI->>API: Fetch student and subjects
  API->>DB: Read linked records
  API-->>UI: Prefill eligible inputs
  Faculty->>UI: Submit marks + attendance
  UI->>API: POST /api/performance
  API->>DB: Save performance record
  API-->>UI: Response with saved data
```

## API Domain Map

| Domain | Route Base | Purpose |
|---|---|---|
| Auth | `/api/auth` | login, register, refresh, approvals |
| Students | `/api/students` | student lifecycle and profiles |
| Faculty | `/api/faculty` | faculty lifecycle and insights |
| Subjects | `/api/subjects` | subject assignment and mapping |
| Performance | `/api/performance` | marks, attendance, records |
| Dashboard | `/api/dashboard` | KPIs, charts, summaries |
| Academic | `/api/academic` | SGPA/CGPA and academic records |
| AI Analytics | `/api/ai-analytics` | risk and insight endpoints |
| Activities | `/api/activities` | logs, timelines, login history |
| Import | `/api/import` | data preview and commit workflows |

## Non-Functional Strengths

- Consistent route segmentation by domain
- Local startup scripts for quick onboarding
- Centralized API client usage on frontend
- Audit and governance features uncommon in student projects
- Test/build/lint workflow already integrated

## Reviewer Talking Points

- This is a multi-role system, not a single-role dashboard
- The project includes both operational control and analytical insight
- Governance features make it feel closer to a real internal enterprise tool
- The documentation, diagrams, and validation workflow indicate project maturity

## Document Metadata

- Last Updated: April 1, 2026
- Status: Active
