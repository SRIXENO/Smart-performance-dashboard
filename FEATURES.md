# Features Catalog

This document lists the functional capabilities currently implemented in SPID.

## 1. Authentication and Access
- Local login with email/userId/registerNumber support
- Google OAuth login flow
- JWT-based auth with cookie support
- Role-based route enforcement via middleware
- Blocked account prevention at login
- Pending approval prevention for unapproved viewer accounts

## 2. Account Approval Workflow (Admin)
- New signups (`register` or `Google`) are created as `viewer` + `pending`
- Admin can open `New Approvals`
- Admin can `Approve` or `Reject` each request
- Approved users can proceed with normal login
- Rejected users are denied login

## 3. Student Management
- Student create/read/update/delete
- Student search/filter by department/year/status
- Student block/unblock actions (admin + faculty)
- Student detail and edit pages with tabbed profile sections
- Student login password reset from edit flow (admin + faculty)

## 4. Student Documents
- Upload/replace student documents in edit/detail flows
- Document status and file preview links
- Supported by admin and faculty roles

## 5. Faculty Management
- Faculty list/create/update/delete (admin-only modifications)
- Faculty profile metadata (designation, bio, expertise, photo)
- Faculty status handling (`active`/`blocked`)
- Faculty password change/update available only to admin

## 6. Subject Management
- Subject assignment by department and year
- Subject group updates/deletions
- Student subject mapping by department/year

## 7. Performance and Analytics
- Student intelligence dashboard (filters, KPIs, charts)
- Cohort and trend visualizations
- Department-level comparative analytics
- Performance record CRUD (admin-controlled writes)

## 8. Academic and AI Analytics
- Academic record endpoints and semester updates
- AI analytics endpoints for risk and insight workflows
- Dashboard summary and trend endpoints

## 9. Governance and Audit
- Login history page (admin)
- Activity log tracking for relevant auth actions
- Admin governance pages in dashboard sidebar

## 10. Reliability and Data Integrity
- Cascade deletion for student and faculty cleanup
- Transaction-based cleanup of linked records (student/faculty deletes)
- Backend validations for password and role-sensitive operations

## 11. UX and Accessibility
- Responsive dashboard shell and pages
- Custom dropdown with keyboard + ARIA behavior
- Consistent confirmation modals for destructive/sensitive actions
- Password show/hide toggles on login and student add/edit flows

## Document Metadata
- Last Updated: February 25, 2026
- Status: Active
