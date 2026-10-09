# Campus Placement & Internship Portal (CampusPlace)

A role-based recruitment portal for a university placement cell, built with **plain HTML, CSS and vanilla JavaScript only** — no frameworks, no build step, no CDN UI kits. It runs by double-clicking `index.html` or from any static server, and it keeps all data in `localStorage` through a mock backend module.

> Training & Placement Cell, Aditya Institute of Technology, Pune (demo build). All data is fictional and stored in your browser.

## Feature list by role

### Student
- Register / sign in; profile with branch, CGPA, graduation year, resume link, skills and contact number
- Browse **only admin-approved openings** (approved job **and** approved company), with search + filters for company, department, package band and type (Job / Internship)
- Opening detail page with a live eligibility indicator: *“You are eligible”* or *“You are not eligible because: Your CGPA 7.20 is below the required 7.5”*
- Apply — ineligible students are blocked with a structured reason, not a silent failure
- **My applications**: visual pipeline per application — Applied → Shortlisted → Interview → Offered / Rejected — each stage timestamped from the recruiter's action
- Profile completeness meter and an “eligibility snapshot” showing how many live openings the current CGPA/branch unlocks

### Recruiter
- Register / sign in; company profile (name, sector, website, location, about, hiring contact) that starts **Pending** until the cell approves it
- Create postings: title, type, description, responsibilities, skills, package/stipend, location, deadline, min CGPA, allowed departments (multi-select) and openings — submitted as **Pending**
- Dashboard: company status banner, stat cards, my postings with status badges, applicant / shortlisted / offer counts and deadlines
- Applicants page per posting: candidate profile (branch, CGPA, batch, contact, resume link), single status update, and **batch update** via checkbox selection + bulk action bar
- Rejections arrive with the reviewer's reason on the dashboard

### Placement admin
- Dedicated portal and sign-in (accounts are issued, never self-registered)
- Approval queues for companies and openings: Approve, or Reject **with a required reason**
- Audit log: action, target, decision, reviewer ID, reason, timestamp — filterable by action/date and searchable
- Overview stats: pending companies, pending applications, applications, offers/placements, plus an approval backlog readout
- **Reset demo data** button (admin only, in the sidebar and on the overview)

## Folder structure

```
index.html            Landing page: season stats, role process steps, closing-soon openings, footer
login.html            Sign in (all three roles, demo credential quick-fill)
register.html         Student / recruiter self-registration
css/
  tokens.css          Palette, type scale, 8px spacing grid, radii, shadows, motion
  base.css            Reset, typography, form controls, focus rings, utilities
  components.css      Buttons, badges, cards, tables, pipeline, tabs, pagination, toasts,
                      modals, bulk bar, empty states, skeletons, filter bar
  layout.css          Public nav/hero/footer, app shell (sidebar + topbar), drawer, responsive
js/
  api.js              MOCK BACKEND — every business rule lives here
  seed.js             Demo dataset (users, companies, openings, applications, audit entries)
  auth.js             Route guards, sidebar shell, sign-out, demo reset
  ui.js               Toasts, modals, icons, tables, pagination, validation, formatters
student/              dashboard, jobs, job-detail, profile, applications
recruiter/            dashboard, company, post-job, applicants
admin/                dashboard, companies, jobs, audit-log
README.md
```

## Screenshots (placeholders)

| Page | Screenshot |
|---|---|
| Landing (`index.html`) | `docs/screenshots/landing.png` *(to be added)* |
| Student — browse approved openings | `docs/screenshots/student-jobs.png` *(to be added)* |
| Student — ineligible block notice | `docs/screenshots/student-ineligible.png` *(to be added)* |
| Student — application pipeline | `docs/screenshots/student-applications.png` *(to be added)* |
| Recruiter — dashboard & posting status | `docs/screenshots/recruiter-dashboard.png` *(to be added)* |
| Recruiter — batch update bar | `docs/screenshots/recruiter-bulk.png` *(to be added)* |
| Admin — approval queue | `docs/screenshots/admin-queue.png` *(to be added)* |
| Admin — audit log | `docs/screenshots/admin-audit.png` *(to be added)* |

## Local setup

No install and no build step. Either:

1. **Double-click `index.html`** — everything (including `localStorage`) works from `file://` in Chrome, Edge and Firefox.
2. **Serve it locally** (recommended, matches production path handling):

```bash
# option A
npx serve .
# option B
python -m http.server 8000
```

Then open <http://localhost:3000> (serve) or <http://localhost:8000> (python).

> Google Fonts are loaded from the network when available; with no network the pages fall back to system fonts and behave identically.

## Mock credentials

| Role | Email | Password | Lands on |
|---|---|---|---|
| Student | `student@vit.demo` | `Student@123` | `student/dashboard.html` |
| Recruiter | `recruiter@acme.demo` | `Recruiter@123` | `recruiter/dashboard.html` |
| Admin | `admin@placement.demo` | `Admin@123` | `admin/dashboard.html` |

Extra seeded accounts (same passwords unless noted):

| Account | Email | Notes |
|---|---|---|
| Recruiter (approved company) | `recruiter@zoho.demo` / `Recruiter@123` | Zoho Corporation, approved |
| Recruiter (pending company) | `recruiter@nexcore.demo` / `Recruiter@123` | NexCore Systems, pending approval |
| Student, CGPA 7.2 (ECE) | `rohit@vit.demo` / `Student@123` | Fails the 7.5 cut-off — good for the block test |
| Student, CGPA 9.1 (IT) | `priya@vit.demo` / `Student@123` | Holds offers from two companies |
| Student, 2027 batch | `arjun@vit.demo` / `Student@123` | Mechanical, most openings reject his branch |

The login page has **Use** buttons that fill these credentials in one click.

## Seeding & resetting sample data

- **First load**: `AUTH.boot()` calls `API.bootstrap()`, which writes the dataset from `js/seed.js` into `localStorage` once (flag key `cpp.seeded`).
- **In-app reset**: sign in as admin → sidebar **Reset demo data** (also on the overview page). It clears every collection, re-seeds the original dataset and keeps you signed in.
- **Full wipe** (dev console or DevTools → Application → Local storage → Clear):

```js
localStorage.clear(); location.reload();   // re-seeds on next load
```

Storage keys: `cpp.users`, `cpp.companies`, `cpp.jobs`, `cpp.applications`, `cpp.audit`, `cpp.session`, `cpp.seeded`.

## How the mock API layer works (`js/api.js`)

`api.js` is a single IIFE that exposes `window.API`. It is the **only** module allowed to touch storage or enforce rules; pages are presentational.

**Shape** — every data function returns a `Promise` and waits 160–320 ms first (`delay()`), so swapping in a real REST backend means replacing the function bodies with `fetch()` calls and keeping the same signatures:

```js
API.listJobs({ q, company, type, department, minPackage }) // → [{ job, company, packageLabel, eligibility }]
API.applyToJob(jobId)                                      // → application | throws ApiError(403, …)
API.setApplicationStatus(appId, status, note)              // → updated application
API.auditLog({ q, action, from, to, page, perPage })       // → { items, total, page, pages }
```

**Errors** are `ApiError` objects with HTTP-style `status` (401 unauthenticated, 403 forbidden, 409 conflict, 422 validation, 404 missing) plus `details`. `UI.reportError()` turns them into toasts and inline field messages.

**Role checks** — `requireRole('student')` (route guards) and `assertRole(user, roles, action)` (inside every mutation) throw 403-style errors. A recruiter calling `API.listCompanies()` gets a 403 even though the admin page for it exists.

### Eligibility gating

```js
API.evaluateEligibility(job, student)  // pure function → { eligible, reasons: [{ code, message }] }
API.applyToJob(jobId)                 // calls it and THROWS when ineligible
```

`applyToJob()` is the authority: it re-checks visibility (job approved **and** company approved), deadline, CGPA against `job.minCgpa`, department membership in `job.departments`, and that a resume link exists. On failure it throws:

```js
ApiError(403, 'Your CGPA 7.20 is below the required 7.5', {
  code: 'ineligible',
  reasons: [{ code: 'cgpa', message: 'Your CGPA 7.20 is below the required 7.5' }, …]
})
```

The job-detail page renders the same `evaluateEligibility()` output as an **advisory** indicator, but a user can always call `API.applyToJob()` directly — the block still happens. Duplicate applications are rejected with 409.

### Visibility rule

`isVisibleJob(job)` returns true only when `job.status === 'approved'` **and** `companyById(job.companyId).status === 'approved'`. `listJobs()` filters through it for students and guests; recruiters and admins see their own/all postings with explicit status badges instead.

### Audit logging

Entries are written **inside** the decision functions (`decide()` in `approveCompany`/`rejectCompany`/`approveJob`/`rejectJob`) and inside `changeApplicationStatus()` — never in page scripts:

```js
{ id, at, action: 'job_rejected', targetType: 'job', targetId, targetLabel,
  decision: 'rejected', reviewerId, reviewerName, reviewerRole, reason }
```

Rejection requires a reason (≥ 5 chars) or the API throws 422 — the modal's inline validation only mirrors that rule. Approving a posting whose company is not approved throws 422 with a pointer to the company queue.

## Known limitations

- Passwords are stored in plain text in `localStorage`; this is a demo, never a real identity system.
- All data lives per-browser: there is no cross-user sync, no server, no concurrency control (two tabs can race).
- `file://` works, but the session is origin-scoped — a browser that partitions `localStorage` per file may require a local server.
- No email verification, password reset, CSRF, or rate limiting (nothing to protect against yet).
- Deadlines are date-only (checked at 23:59 local time); interview scheduling, offer-letter upload and withdrawal are out of scope.
- Audit entries are append-only but not tamper-evident.

## Future work

1. Replace `js/api.js` with a real **Node/Express + MongoDB** backend (Mongoose models: `User`, `Company`, `Job`, `Application`, `AuditLog`), JWT auth with `httpOnly` cookies, and a `fetch`-based client that keeps the same function signatures — pages need no changes beyond swapping script tags.
2. Add server-side pagination, sorting and field-level indexes (`Job.companyId`, `Application.jobId`, `AuditLog.at`).
3. Role-scoped RBAC middleware + `requireAuth()` on every route, audit writes in an Express middleware.
4. Resume file upload to S3/GCS instead of a link, with virus scanning and access expiry.
5. Interview slot booking, offer-letter PDF generation and placement-letter downloads.
6. Reporting: branch-wise placement %, package distribution, day-wise application funnel (CSV export).

## Test checklist

- [ ] **Ineligible-student block** — sign in as `rohit@vit.demo / Student@123` (CGPA 7.2), open *Software Engineer — Graduate Trainee* (min 7.5): the panel says “Your CGPA 7.20 is below the required 7.5”, **Apply now** is disabled, and calling `API.applyToJob('job1')` from the console throws a 403 with `details.reasons`.
- [ ] **Approval gating / visibility** — sign in as `recruiter@nexcore.demo`, post an opening (stays *Pending*); sign in as `student@vit.demo`: it is absent from Browse openings and `API.getJob('<new id>')` 404s. Approve it from the admin queue → it appears for the student.
- [ ] **Batch status update** — `recruiter@acme.demo` → Applicants → tick **Select all** → bulk bar appears → set *Shortlisted* → confirm → every selected row flips, counts on the dashboard update, and audit entries appear.
- [ ] **Audit log entries** — as admin, reject an opening with a reason (empty reason is refused), then open Audit log: the entry shows action, target, decision, `reviewerId`, your reason and a timestamp; filters and search narrow it correctly.
- [ ] Role guard: open `admin/dashboard.html` while signed out → redirected to `login.html?next=…`; sign in as a student → redirected away from the admin area.
- [ ] Responsive: 360 px wide the sidebar becomes a drawer; tables scroll horizontally; modals trap focus and close on `Escape`.

