/* ============================================================
   api.js — mock backend over localStorage.
   ALL business rules live in this file only:
     • role-based access checks (403-style ApiError)
     • eligibility gating inside applyToJob()
     • visibility: students only see approved job + approved company
     • audit-log writes inside approve/reject functions
     • every data function is async with simulated latency
   Page scripts must never implement these rules themselves.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = {
    users: 'cpp.users',
    companies: 'cpp.companies',
    jobs: 'cpp.jobs',
    apps: 'cpp.applications',
    audit: 'cpp.audit',
    session: 'cpp.session',
    seeded: 'cpp.seeded'
  };

  /* ---------- storage helpers ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { throw new ApiError(507, 'Browser storage is unavailable or full.'); }
  }

  /* ---------- errors ---------- */
  function ApiError(status, message, details) {
    var err = new Error(message);
    err.name = 'ApiError';
    err.status = status;
    err.details = details || null;
    return err;
  }
  function isApiError(e) { return !!e && (e.name === 'ApiError'); }

  /* ---------- async simulation ---------- */
  function delay(ms) {
    var t = ms == null ? 160 : ms;
    return new Promise(function (res) { setTimeout(res, t + Math.round(Math.random() * 90)); });
  }
  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function nowISO() { return new Date().toISOString(); }

  /* ---------- collections ---------- */
  function col(key) { return read(key, []); }
  function save(key, rows) { write(key, rows); }
  function findById(rows, id) {
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  /* ---------- session ---------- */
  function getSession() { return read(KEY.session, null); }
  function setSession(s) { s ? write(KEY.session, s) : localStorage.removeItem(KEY.session); }

  function userById(id) { return id ? findById(col(KEY.users), id) : null; }
  function publicUser(u) {
    if (!u) return null;
    var copy = {};
    for (var k in u) if (Object.prototype.hasOwnProperty.call(u, k) && k !== 'password') copy[k] = u[k];
    return copy;
  }

  function currentUser() {
    var s = getSession();
    if (!s) return null;
    return userById(s.userId);
  }

  /** Synchronous route guard. Throws 401/403 ApiError — auth.js converts it into a redirect. */
  function requireRole() {
    var roles = Array.prototype.slice.call(arguments);
    var u = currentUser();
    if (!u) throw ApiError(401, 'You must sign in to continue.');
    if (roles.length && roles.indexOf(u.role) === -1) {
      throw ApiError(403, 'Your account (' + u.role + ') is not allowed to open this page.');
    }
    return u;
  }

  function assertRole(user, roles, action) {
    if (!user) throw ApiError(401, 'Sign in required' + (action ? ' to ' + action : '') + '.');
    if (roles && roles.indexOf(user.role) === -1) {
      throw ApiError(403, 'Only ' + roles.join(' / ') + ' accounts can ' + (action || 'do this') + '.', {
        requiredRoles: roles, actualRole: user.role
      });
    }
    return user;
  }

  function findUserByEmail(email) {
    var rows = col(KEY.users), e = String(email || '').trim().toLowerCase();
    for (var i = 0; i < rows.length; i++) if (rows[i].email.toLowerCase() === e) return rows[i];
    return null;
  }

  /* ---------- auth ---------- */
  function login(email, password) {
    return delay().then(function () {
      if (!email || !password) throw ApiError(422, 'Email and password are required.', { field: 'email' });
      var user = findUserByEmail(email);
      if (!user || user.password !== password) {
        throw ApiError(401, 'Incorrect email or password.', { field: 'password' });
      }
      setSession({ userId: user.id, role: user.role, at: nowISO() });
      return publicUser(user);
    });
  }

  function register(payload) {
    return delay().then(function () {
      payload = payload || {};
      var name = String(payload.name || '').trim();
      var email = String(payload.email || '').trim().toLowerCase();
      var password = String(payload.password || '');
      var role = payload.role;
      if (!name) throw ApiError(422, 'Full name is required.', { field: 'name' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw ApiError(422, 'Enter a valid email address.', { field: 'email' });
      if (password.length < 6) throw ApiError(422, 'Password must be at least 6 characters.', { field: 'password' });
      if (role !== 'student' && role !== 'recruiter') {
        throw ApiError(403, 'Accounts can only be created as student or recruiter. Placement admin accounts are issued by the cell.', { field: 'role' });
      }
      if (findUserByEmail(email)) throw ApiError(409, 'An account with this email already exists.', { field: 'email' });

      var users = col(KEY.users);
      var user = {
        id: uid('u'),
        name: name, email: email, password: password, role: role,
        createdAt: nowISO()
      };
      if (role === 'student') {
        user.branch = payload.branch || '';
        user.cgpa = payload.cgpa != null && payload.cgpa !== '' ? Number(payload.cgpa) : null;
        user.gradYear = payload.gradYear ? Number(payload.gradYear) : new Date().getFullYear() + 1;
        user.resumeLink = '';
        user.phone = '';
        user.skills = [];
      } else {
        user.designation = payload.designation || 'Recruiter';
        user.phone = payload.phone || '';
      }
      users.push(user);
      save(KEY.users, users);

      if (role === 'recruiter') {
        var companies = col(KEY.companies);
        companies.push({
          id: uid('co'), ownerId: user.id, name: '', industry: '', website: '',
          location: '', about: '', hrName: name, hrEmail: email,
          status: 'pending', createdAt: nowISO(), updatedAt: nowISO(), rejectionReason: ''
        });
        save(KEY.companies, companies);
      }

      setSession({ userId: user.id, role: role, at: nowISO() });
      return publicUser(user);
    });
  }

  function logout() {
    setSession(null);
    return Promise.resolve(true);
  }

  function me() {
    return delay(60).then(function () { return publicUser(currentUser()); });
  }

  /* ---------- shared lookups ---------- */
  function jobById(id) { return findById(col(KEY.jobs), id); }
  function companyById(id) { return findById(col(KEY.companies), id); }

  /** Visibility rule: an opening is public only when BOTH job and company are approved. */
  function isVisibleJob(job) {
    if (!job) return false;
    var co = companyById(job.companyId);
    return job.status === 'approved' && !!co && co.status === 'approved';
  }

  function isPastDeadline(job) {
    if (!job || !job.deadline) return false;
    var d = new Date(job.deadline + 'T23:59:59');
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  function fmtPackage(job) {
    if (!job) return '';
    if (job.type === 'Internship') return '₹' + Number(job.stipend || 0).toLocaleString('en-IN') + ' / month';
    return '₹' + Number(job.packageLpa || 0).toFixed(1) + ' LPA';
  }

  /* ---------- eligibility (advisory for UI, authoritative inside applyToJob) ---------- */
  function evaluateEligibility(job, student) {
    var reasons = [];
    if (!isVisibleJob(job)) {
      reasons.push({ code: 'not_open', message: 'This opening is not accepting applications right now.' });
    }
    if (isPastDeadline(job)) {
      reasons.push({ code: 'deadline', message: 'The application deadline (' + job.deadline + ') has passed.' });
    }
    if (student) {
      var cgpa = student.cgpa == null ? 0 : Number(student.cgpa);
      if (Number(job.minCgpa) > 0 && cgpa < Number(job.minCgpa)) {
        reasons.push({
          code: 'cgpa',
          message: 'Your CGPA ' + cgpa.toFixed(2) + ' is below the required ' + Number(job.minCgpa).toFixed(1)
        });
      }
      var depts = job.departments || [];
      if (depts.length && depts.indexOf(student.branch) === -1) {
        reasons.push({
          code: 'department',
          message: 'Your branch ' + (student.branch || 'not set') + ' is not in the allowed departments (' + depts.join(', ') + ')'
        });
      }
      if (!student.resumeLink) {
        reasons.push({ code: 'resume', message: 'Add a resume link to your profile before applying.' });
      }
    } else {
      reasons.push({ code: 'auth', message: 'Sign in with a student account to check eligibility.' });
    }
    return { eligible: reasons.length === 0, reasons: reasons };
  }

  /* ---------- student: profile ---------- */
  function updateProfile(patch) {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['student'], 'update a profile');
      patch = patch || {};
      if (patch.cgpa != null && patch.cgpa !== '' && (isNaN(Number(patch.cgpa)) || Number(patch.cgpa) < 0 || Number(patch.cgpa) > 10)) {
        throw ApiError(422, 'CGPA must be a number between 0 and 10.', { field: 'cgpa' });
      }
      if (patch.resumeLink && !/^https?:\/\//i.test(patch.resumeLink)) {
        throw ApiError(422, 'Resume link must start with http:// or https://', { field: 'resumeLink' });
      }
      var users = col(KEY.users), u = findById(users, user.id);
      ['name', 'branch', 'gradYear', 'resumeLink', 'phone', 'skills', 'headline'].forEach(function (k) {
        if (patch[k] !== undefined) u[k] = patch[k];
      });
      if (patch.cgpa !== undefined && patch.cgpa !== '') u.cgpa = Number(patch.cgpa);
      u.updatedAt = nowISO();
      save(KEY.users, users);
      return publicUser(u);
    });
  }

  /* ---------- jobs: browse (visibility enforced here) ---------- */
  function listJobs(filters) {
    return delay().then(function () {
      filters = filters || {};
      var meUser = currentUser();
      var jobs = col(KEY.jobs).filter(function (j) {
        if (meUser && (meUser.role === 'admin' || meUser.role === 'recruiter')) return true;
        return isVisibleJob(j); // students + guests: approved job AND approved company
      });
      var q = String(filters.q || '').trim().toLowerCase();
      jobs = jobs.filter(function (j) {
        var co = companyById(j.companyId);
        if (q && (j.title + ' ' + (co ? co.name : '') + ' ' + j.location).toLowerCase().indexOf(q) === -1) return false;
        if (filters.company && j.companyId !== filters.company) return false;
        if (filters.type && j.type !== filters.type) return false;
        if (filters.department && (j.departments || []).indexOf(filters.department) === -1) return false;
        if (filters.minPackage && j.type !== 'Internship' && Number(j.packageLpa) < Number(filters.minPackage)) return false;
        if (filters.status && j.status !== filters.status) return false;
        if (filters.companyId && j.companyId !== filters.companyId) return false;
        return true;
      });
      jobs.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
      var student = meUser && meUser.role === 'student' ? meUser : null;
      var allApps = col(KEY.apps);
      return jobs.map(function (j) {
        var co = companyById(j.companyId);
        return {
          job: j,
          company: co ? { id: co.id, name: co.name, status: co.status, location: co.location } : null,
          packageLabel: fmtPackage(j),
          applicantCount: allApps.filter(function (a) { return a.jobId === j.id; }).length,
          eligibility: student ? evaluateEligibility(j, student) : null
        };
      });
    });
  }

  function getJob(id) {
    return delay().then(function () {
      var user = currentUser();
      var job = jobById(id);
      if (!job) throw ApiError(404, 'Opening not found.');
      if (!isVisibleJob(job) && (!user || (user.role !== 'admin' && !(user.role === 'recruiter' && companyById(job.companyId) && companyById(job.companyId).ownerId === user.id)))) {
        throw ApiError(404, 'Opening not found or no longer published.');
      }
      var co = companyById(job.companyId);
      var student = user && user.role === 'student' ? user : null;
      var mine = student ? col(KEY.apps).filter(function (a) { return a.jobId === job.id && a.studentId === student.id; }) : [];
      return {
        job: job,
        company: co,
        packageLabel: fmtPackage(job),
        eligibility: evaluateEligibility(job, student || currentUser()),
        alreadyApplied: mine.length > 0,
        application: mine[0] || null,
        applicantCount: col(KEY.apps).filter(function (a) { return a.jobId === job.id; }).length
      };
    });
  }

  /** The authority on eligibility. UI checks are advisory only. */
  function applyToJob(jobId) {
    return delay(240).then(function () {
      var student = assertRole(currentUser(), ['student'], 'apply to an opening');
      var job = jobById(jobId);
      if (!job) throw ApiError(404, 'Opening not found.');

      var check = evaluateEligibility(job, student);
      if (!check.eligible) {
        throw ApiError(403, check.reasons[0].message, {
          code: 'ineligible',
          reasons: check.reasons,
          job: { id: job.id, title: job.title, minCgpa: job.minCgpa, departments: job.departments }
        });
      }
      var apps = col(KEY.apps);
      var dup = apps.filter(function (a) { return a.jobId === job.id && a.studentId === student.id; })[0];
      if (dup) throw ApiError(409, 'You have already applied to this opening.', { applicationId: dup.id });

      var app = {
        id: uid('app'), jobId: job.id, studentId: student.id,
        companyId: job.companyId, status: 'applied',
        coverNote: '',
        timeline: [{ status: 'applied', at: nowISO(), by: student.id, note: 'Application submitted' }],
        createdAt: nowISO(), updatedAt: nowISO()
      };
      apps.push(app);
      save(KEY.apps, apps);
      return app;
    });
  }

  function myApplications() {
    return delay().then(function () {
      var student = assertRole(currentUser(), ['student'], 'view applications');
      var apps = col(KEY.apps).filter(function (a) { return a.studentId === student.id; });
      apps.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
      return apps.map(function (a) {
        var job = jobById(a.jobId);
        var co = job ? companyById(job.companyId) : null;
        return {
          application: a,
          job: job,
          company: co ? co.name : '—',
          packageLabel: job ? fmtPackage(job) : ''
        };
      });
    });
  }

  /* ---------- recruiter: company ---------- */
  function myCompanyId(user) {
    var rows = col(KEY.companies);
    for (var i = 0; i < rows.length; i++) if (rows[i].ownerId === user.id) return rows[i].id;
    return null;
  }
  function getMyCompany() {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'open the company profile');
      var rows = col(KEY.companies);
      for (var i = 0; i < rows.length; i++) if (rows[i].ownerId === user.id) return rows[i];
      return null;
    });
  }
  function saveCompany(payload) {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'save a company profile');
      payload = payload || {};
      if (!String(payload.name || '').trim()) throw ApiError(422, 'Company name is required.', { field: 'name' });
      if (!String(payload.industry || '').trim()) throw ApiError(422, 'Industry / sector is required.', { field: 'industry' });
      var companies = col(KEY.companies);
      var co = null, i;
      for (i = 0; i < companies.length; i++) if (companies[i].ownerId === user.id) co = companies[i];
      if (!co) {
        co = { id: uid('co'), ownerId: user.id, status: 'pending', createdAt: nowISO(), rejectionReason: '' };
        companies.push(co);
      } else if (co.status === 'rejected') {
        co.status = 'pending';           // resubmitting a rejected profile re-enters the queue
        co.rejectionReason = '';
      }
      ['name', 'industry', 'website', 'location', 'about', 'hrName', 'hrEmail'].forEach(function (k) {
        if (payload[k] !== undefined) co[k] = String(payload[k]).trim();
      });
      co.updatedAt = nowISO();
      save(KEY.companies, companies);
      return co;
    });
  }

  /* ---------- recruiter: job postings ---------- */
  var JOB_FIELDS = ['title', 'type', 'description', 'responsibilities', 'skills', 'location', 'deadline', 'minCgpa', 'departments', 'openings'];

  function validateJobPayload(p, companyId) {
    if (!companyId) throw ApiError(409, 'Submit your company profile for approval before posting openings.');
    if (!String(p.title || '').trim()) throw ApiError(422, 'Job title is required.', { field: 'title' });
    if (p.type !== 'Job' && p.type !== 'Internship') throw ApiError(422, 'Choose Job or Internship.', { field: 'type' });
    if (!String(p.description || '').trim() || String(p.description).trim().length < 30) {
      throw ApiError(422, 'Description must be at least 30 characters.', { field: 'description' });
    }
    if (!p.deadline) throw ApiError(422, 'Application deadline is required.', { field: 'deadline' });
    if (!p.departments || !p.departments.length) throw ApiError(422, 'Select at least one eligible department.', { field: 'departments' });
    if (isNaN(Number(p.minCgpa)) || Number(p.minCgpa) < 0 || Number(p.minCgpa) > 10) {
      throw ApiError(422, 'Minimum CGPA must be between 0 and 10.', { field: 'minCgpa' });
    }
    if (!Number(p.openings) || Number(p.openings) < 1) throw ApiError(422, 'Openings must be at least 1.', { field: 'openings' });
    if (p.type === 'Job' && (!Number(p.packageLpa) || Number(p.packageLpa) <= 0)) {
      throw ApiError(422, 'Annual package (LPA) is required for job postings.', { field: 'packageLpa' });
    }
    if (p.type === 'Internship' && (!Number(p.stipend) || Number(p.stipend) <= 0)) {
      throw ApiError(422, 'Monthly stipend (₹) is required for internships.', { field: 'stipend' });
    }
  }

  function createJob(payload) {
    return delay(240).then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'post an opening');
      var companyId = myCompanyId(user);
      validateJobPayload(payload, companyId);
      var jobs = col(KEY.jobs);
      var job = {
        id: uid('job'), companyId: companyId, status: 'pending',
        rejectionReason: '', createdAt: nowISO(), updatedAt: nowISO(), approvedAt: null
      };
      JOB_FIELDS.forEach(function (k) { if (payload[k] !== undefined) job[k] = payload[k]; });
      job.minCgpa = Number(payload.minCgpa);
      job.openings = Number(payload.openings);
      job.packageLpa = payload.type === 'Job' ? Number(payload.packageLpa) : 0;
      job.stipend = payload.type === 'Internship' ? Number(payload.stipend) : 0;
      jobs.push(job);
      save(KEY.jobs, jobs);
      return job;
    });
  }

  function myJobs() {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'view your postings');
      var companyId = myCompanyId(user);
      var apps = col(KEY.apps);
      return col(KEY.jobs)
        .filter(function (j) { return j.companyId === companyId; })
        .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); })
        .map(function (j) {
          return {
            job: j,
            packageLabel: fmtPackage(j),
            applicantCount: apps.filter(function (a) { return a.jobId === j.id; }).length,
            shortlisted: apps.filter(function (a) { return a.jobId === j.id && a.status === 'shortlisted'; }).length,
            offered: apps.filter(function (a) { return a.jobId === j.id && a.status === 'offered'; }).length
          };
        });
    });
  }

  /* ---------- recruiter: applicants ---------- */
  function assertOwnJob(user, jobId) {
    var job = jobById(jobId);
    if (!job) throw ApiError(404, 'Opening not found.');
    var co = companyById(job.companyId);
    if (!co || co.ownerId !== user.id) throw ApiError(403, 'This opening belongs to another company.');
    return job;
  }

  function jobApplicants(jobId) {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['recruiter', 'admin'], 'view applicants');
      if (user.role === 'recruiter') assertOwnJob(user, jobId);
      var students = col(KEY.users);
      return col(KEY.apps)
        .filter(function (a) { return a.jobId === jobId; })
        .sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); })
        .map(function (a) {
          var s = null;
          for (var i = 0; i < students.length; i++) if (students[i].id === a.studentId) s = students[i];
          return { application: a, student: publicUser(s) };
        });
    });
  }

  var APP_STATUSES = ['applied', 'shortlisted', 'interview', 'offered', 'rejected'];

  function writeAudit(entry) {
    var audit = col(KEY.audit);
    audit.unshift(entry);
    save(KEY.audit, audit);
  }

  function changeApplicationStatus(app, status, note, actor) {
    if (APP_STATUSES.indexOf(status) === -1) throw ApiError(422, 'Unknown status "' + status + '".');
    var apps = col(KEY.apps);
    var row = findById(apps, app.id);
    if (!row) throw ApiError(404, 'Application not found.');
    row.status = status;
    row.updatedAt = nowISO();
    row.timeline = row.timeline || [];
    row.timeline.push({ status: status, at: nowISO(), by: actor.id, note: note || '' });
    save(KEY.apps, apps);
    writeAudit({
      id: uid('log'), at: nowISO(), action: 'application_status', targetType: 'application',
      targetId: row.id, targetLabel: (actor.studentName || 'Applicant') + ' → ' + ((jobById(row.jobId) || {}).title || 'Opening'),
      decision: status, reviewerId: actor.id, reviewerName: actor.name, reviewerRole: actor.role,
      reason: note || ''
    });
    return row;
  }

  function setApplicationStatus(appId, status, note) {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'update an application');
      var apps = col(KEY.apps), app = findById(apps, appId);
      if (!app) throw ApiError(404, 'Application not found.');
      assertOwnJob(user, app.jobId);
      var student = userById(app.studentId);
      return changeApplicationStatus(app, status, note, {
        id: user.id, name: user.name, role: 'recruiter',
        studentName: student ? student.name : 'Applicant'
      });
    });
  }

  function bulkSetStatus(appIds, status, note) {
    return delay(320).then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'batch update applications');
      if (!appIds || !appIds.length) throw ApiError(422, 'Select at least one application.');
      var updated = [];
      appIds.forEach(function (id) {
        var app = findById(col(KEY.apps), id);
        if (!app) return;
        assertOwnJob(user, app.jobId);
        var student = userById(app.studentId);
        updated.push(changeApplicationStatus(app, status, note || 'Batch update', {
          id: user.id, name: user.name, role: 'recruiter',
          studentName: student ? student.name : 'Applicant'
        }));
      });
      return updated;
    });
  }

  /* ---------- admin: approval queues ---------- */
  function listCompanies(filter) {
    return delay().then(function () {
      assertRole(currentUser(), ['admin'], 'manage companies');
      filter = filter || {};
      var rows = col(KEY.companies).slice();
      if (filter.status) rows = rows.filter(function (c) { return c.status === filter.status; });
      if (filter.q) {
        var q = filter.q.toLowerCase();
        rows = rows.filter(function (c) { return (c.name + ' ' + c.industry + ' ' + c.location).toLowerCase().indexOf(q) !== -1; });
      }
      var apps = col(KEY.apps), jobs = col(KEY.jobs);
      rows.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
      return rows.map(function (c) {
        return {
          company: c,
          jobCount: jobs.filter(function (j) { return j.companyId === c.id; }).length,
          applicantCount: apps.filter(function (a) { return a.companyId === c.id; }).length,
          owner: publicUser(userById(c.ownerId))
        };
      });
    });
  }

  function listJobsAdmin(filter) {
    return delay().then(function () {
      assertRole(currentUser(), ['admin'], 'manage openings');
      filter = filter || {};
      var rows = col(KEY.jobs).slice();
      if (filter.status) rows = rows.filter(function (j) { return j.status === filter.status; });
      if (filter.q) {
        var q = filter.q.toLowerCase();
        rows = rows.filter(function (j) {
          var co = companyById(j.companyId);
          return (j.title + ' ' + (co ? co.name : '')).toLowerCase().indexOf(q) !== -1;
        });
      }
      var apps = col(KEY.apps);
      rows.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
      return rows.map(function (j) {
        var co = companyById(j.companyId);
        return {
          job: j,
          company: co || null,
          packageLabel: fmtPackage(j),
          applicantCount: apps.filter(function (a) { return a.jobId === j.id; }).length
        };
      });
    });
  }

  function requireReason(reason, verb) {
    var r = String(reason || '').trim();
    if (r.length < 5) throw ApiError(422, 'A rejection reason is required (at least 5 characters).', { field: 'reason' });
    return r;
  }

  /** Audit entries are written HERE, inside the decision function — never in page scripts. */
  function decide(kind, id, decision, reason) {
    var admin = assertRole(currentUser(), ['admin'], 'approve or reject');
    var rows, row, label, targetType;
    if (kind === 'company') { rows = col(KEY.companies); targetType = 'company'; }
    else { rows = col(KEY.jobs); targetType = 'job'; }
    row = findById(rows, id);
    if (!row) throw ApiError(404, (kind === 'company' ? 'Company' : 'Opening') + ' not found.');

    if (kind === 'company') {
      label = row.name || 'Unnamed company';
      if (decision === 'rejected') {
        var coJobs = col(KEY.jobs);
        coJobs.forEach(function (j) {           // rejecting a company also withdraws its openings
          if (j.companyId === row.id && j.status === 'approved') { j.status = 'pending'; j.updatedAt = nowISO(); }
        });
        save(KEY.jobs, coJobs);
      }
    } else {
      var co = companyById(row.companyId);
      label = row.title + ' — ' + (co ? co.name : 'Unknown company');
      if (decision === 'approved' && (!co || co.status !== 'approved')) {
        throw ApiError(422, 'Approve the company "' + (co ? co.name : '?') + '" before approving its openings.');
      }
    }

    if (decision === 'rejected') row.rejectionReason = requireReason(reason);
    else row.rejectionReason = '';
    row.status = decision;
    row.updatedAt = nowISO();
    row.reviewedAt = nowISO();
    row.reviewedBy = admin.id;
    if (decision === 'approved' && kind === 'job') row.approvedAt = nowISO();
    save(kind === 'company' ? KEY.companies : KEY.jobs, rows);

    writeAudit({
      id: uid('log'), at: nowISO(),
      action: kind + '_' + decision,
      targetType: targetType, targetId: row.id, targetLabel: label,
      decision: decision, reviewerId: admin.id, reviewerName: admin.name, reviewerRole: 'admin',
      reason: decision === 'rejected' ? row.rejectionReason : 'Meets placement cell norms'
    });
    return row;
  }

  function approveCompany(id) { return delay(240).then(function () { return decide('company', id, 'approved', ''); }); }
  function rejectCompany(id, reason) { return delay(240).then(function () { return decide('company', id, 'rejected', reason); }); }
  function approveJob(id) { return delay(240).then(function () { return decide('job', id, 'approved', ''); }); }
  function rejectJob(id, reason) { return delay(240).then(function () { return decide('job', id, 'rejected', reason); }); }

  /* ---------- admin: audit log ---------- */
  function auditLog(filters) {
    return delay(120).then(function () {
      assertRole(currentUser(), ['admin'], 'view the audit log');
      filters = filters || {};
      var rows = col(KEY.audit).slice();
      if (filters.action) rows = rows.filter(function (r) { return r.action === filters.action; });
      if (filters.decision) rows = rows.filter(function (r) { return r.decision === filters.decision; });
      if (filters.from) rows = rows.filter(function (r) { return r.at >= filters.from; });
      if (filters.to) rows = rows.filter(function (r) { return r.at <= filters.to + 'T23:59:59'; });
      if (filters.q) {
        var q = filters.q.toLowerCase();
        rows = rows.filter(function (r) {
          return (r.targetLabel + ' ' + r.reviewerName + ' ' + (r.reason || '') + ' ' + r.action)
            .toLowerCase().indexOf(q) !== -1;
        });
      }
      rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
      var page = Math.max(1, Number(filters.page) || 1);
      var perPage = Number(filters.perPage) || 10;
      var total = rows.length;
      var pages = Math.max(1, Math.ceil(total / perPage));
      if (page > pages) page = pages;
      return {
        items: rows.slice((page - 1) * perPage, page * perPage),
        total: total, page: page, pages: pages, perPage: perPage
      };
    });
  }

  /* ---------- admin: overview ---------- */
  function adminStats() {
    return delay().then(function () {
      assertRole(currentUser(), ['admin'], 'view the dashboard');
      var companies = col(KEY.companies), jobs = col(KEY.jobs), apps = col(KEY.apps);
      var students = col(KEY.users).filter(function (u) { return u.role === 'student'; });
      var offers = apps.filter(function (a) { return a.status === 'offered'; });
      var joined = apps.filter(function (a) { return a.status === 'hired' || a.status === 'offered'; });
      return {
        pendingCompanies: companies.filter(function (c) { return c.status === 'pending'; }).length,
        pendingJobs: jobs.filter(function (j) { return j.status === 'pending'; }).length,
        approvedCompanies: companies.filter(function (c) { return c.status === 'approved'; }).length,
        approvedJobs: jobs.filter(function (j) { return j.status === 'approved'; }).length,
        rejectedJobs: jobs.filter(function (j) { return j.status === 'rejected'; }).length,
        applications: apps.length,
        offers: offers.length,
        placements: joined.length,
        students: students.length,
        recruiters: col(KEY.users).filter(function (u) { return u.role === 'recruiter'; }).length,
        recentAudit: col(KEY.audit).slice(0, 6)
      };
    });
  }

  /* ---------- shared reference data ---------- */
  var DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil'];

  function listCompaniesPublic() {
    return delay(80).then(function () {
      return col(KEY.companies)
        .filter(function (c) { return c.status === 'approved' && c.name; })
        .map(function (c) { return { id: c.id, name: c.name, location: c.location }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
  }

  /* ---------- dashboards ---------- */
  function studentStats() {
    return delay().then(function () {
      var student = assertRole(currentUser(), ['student'], 'open your dashboard');
      var apps = col(KEY.apps).filter(function (a) { return a.studentId === student.id; });
      var visible = col(KEY.jobs).filter(isVisibleJob);
      return {
        applications: apps.length,
        shortlisted: apps.filter(function (a) { return a.status === 'shortlisted' || a.status === 'interview'; }).length,
        offers: apps.filter(function (a) { return a.status === 'offered'; }).length,
        rejected: apps.filter(function (a) { return a.status === 'rejected'; }).length,
        openJobs: visible.length,
        deadlineSoon: visible.filter(function (j) {
          if (!j.deadline) return false;
          var d = new Date(j.deadline + 'T23:59:59').getTime();
          return d >= Date.now() && d - Date.now() < 1000 * 60 * 60 * 24 * 21;
        }).length,
        profileComplete: profileCompleteness(student),
        recent: apps.slice(0, 4)
      };
    });
  }

  function profileCompleteness(u) {
    var fields = ['name', 'branch', 'cgpa', 'gradYear', 'resumeLink', 'phone'];
    var done = fields.filter(function (f) { return u[f] !== undefined && u[f] !== null && String(u[f]).trim() !== ''; }).length;
    return Math.round((done / fields.length) * 100);
  }

  function recruiterStats() {
    return delay().then(function () {
      var user = assertRole(currentUser(), ['recruiter'], 'open your dashboard');
      var companyId = myCompanyId(user);
      var co = companyById(companyId);
      var jobs = col(KEY.jobs).filter(function (j) { return j.companyId === companyId; });
      var jobIds = jobs.map(function (j) { return j.id; });
      var apps = col(KEY.apps).filter(function (a) { return jobIds.indexOf(a.jobId) !== -1; });
      return {
        company: co || null,
        postings: jobs.length,
        pending: jobs.filter(function (j) { return j.status === 'pending'; }).length,
        approved: jobs.filter(function (j) { return j.status === 'approved'; }).length,
        rejected: jobs.filter(function (j) { return j.status === 'rejected'; }).length,
        applicants: apps.length,
        interview: apps.filter(function (a) { return a.status === 'interview'; }).length,
        offers: apps.filter(function (a) { return a.status === 'offered'; }).length
      };
    });
  }

  /* ---------- seeding / demo reset ---------- */
  function isSeeded() { return read(KEY.seeded, false) === true; }
  function markSeeded() { write(KEY.seeded, true); }

  function bootstrap() {
    return delay(40).then(function () {
      if (isSeeded()) return false;
      if (typeof global.SEED === 'undefined') throw ApiError(500, 'seed.js did not load.');
      global.SEED.run();
      return true;
    });
  }

  function resetDemo() {
    return delay(300).then(function () {
      assertRole(currentUser(), ['admin'], 'reset demo data');
      if (typeof global.SEED === 'undefined') throw ApiError(500, 'seed.js did not load.');
      global.SEED.reset();
      return true;
    });
  }

  /* ---------- public surface ---------- */
  global.API = {
    ApiError: ApiError, isApiError: isApiError,
    KEY: KEY, read: read, write: write, col: col, save: save, findById: findById,
    uid: uid, nowISO: nowISO, delay: delay, DEPARTMENTS: DEPARTMENTS,

    currentUser: currentUser, publicUser: publicUser, userById: userById,
    requireRole: requireRole, assertRole: assertRole,
    login: login, register: register, logout: logout, me: me,
    isSeeded: isSeeded, bootstrap: bootstrap, resetDemo: resetDemo,

    updateProfile: updateProfile, evaluateEligibility: evaluateEligibility,
    listJobs: listJobs, getJob: getJob, applyToJob: applyToJob, myApplications: myApplications,
    listCompaniesPublic: listCompaniesPublic,

    getMyCompany: getMyCompany, saveCompany: saveCompany,
    createJob: createJob, myJobs: myJobs, jobApplicants: jobApplicants,
    setApplicationStatus: setApplicationStatus, bulkSetStatus: bulkSetStatus,
    APP_STATUSES: APP_STATUSES,

    listCompanies: listCompanies, listJobsAdmin: listJobsAdmin,
    approveCompany: approveCompany, rejectCompany: rejectCompany,
    approveJob: approveJob, rejectJob: rejectJob,
    auditLog: auditLog, adminStats: adminStats, studentStats: studentStats,
    recruiterStats: recruiterStats, profileCompleteness: profileCompleteness
  };
})(window);
