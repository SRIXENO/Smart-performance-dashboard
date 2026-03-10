# Features Catalog

This document lists the functional capabilities implemented in SPID.

## 1. Authentication and Access
- Local login with email/userId/registerNumber support
- Google OAuth login flow
- JWT-based auth with cookie support
- Role-based route enforcement via middleware
- Blocked account prevention at login
- Pending approval prevention for unapproved viewer accounts

## 2. Account Approval Workflow (Admin)
- New signups are created as `viewer` + `pending`
- Admin can open `New Approvals` and approve or reject
- Approved users can proceed with normal login
- Rejected users are denied login

## 3. Student Management
- Student create/read/update/delete
- Search and filter by department/year/status
- Block/unblock actions (admin + faculty)
- Student detail pages with tabs and analytics
- Student password reset from edit flow (admin + faculty)

## 4. Student 360 Hub
- Overview, Trends, Risk, Attendance, Advisor Notes tabs
- Risk timeline chart and intervention checklist
- Focus mode for student-only analytics

## 5. Faculty Management
- Faculty list/create/update/delete (admin-only modifications)
- Faculty profile metadata (designation, bio, expertise, photo)
- Faculty status handling (`active`/`blocked`)
- Faculty password change/update available only to admin
- Faculty-level insights (fail rate, improvement, risk)

## 6. Subject Management
- Subject assignment by department, year, and semester
- Subject group updates/deletions
- Student subject mapping by department/year

## 7. Performance and Analytics
- Performance record CRUD (admin-controlled writes)
- Student intelligence dashboard (filters, KPIs, charts)
- Department and cohort analytics
- Risk indicators and “students without performance” queue

## 8. Command Center Dashboard
- Actionable cards for approvals and risk queues
- Urgent queue ranked by risk trend score
- Quick access to critical data gaps and follow-ups

## 9. Governance and Audit
- Login history page (admin)
- Activity log tracking for auth and key admin actions

## 10. Reliability and Data Integrity
- Cascade deletion for student and faculty cleanup
- Transaction-based cleanup of linked records
- Backend validations for password and role-sensitive operations

## 11. UX and Accessibility
- Responsive dashboard shell and pages
- Custom dropdown with keyboard + ARIA behavior
- Confirmation modals for destructive/sensitive actions
- Consistent button system and semantic color palette

## 12. Reporting and Export
- CSV/PDF exports for performance and analytics tables
- Filtered exports by department, semester, and date range

## Document Metadata
- Last Updated: March 10, 2026
- Status: Active
