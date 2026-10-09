/* ============================================================
   seed.js — demo dataset for the Campus Placement portal.
   Run by API.bootstrap() on first load and by API.resetDemo()
   (admin only). Stable IDs so pages can deep-link (?id=job3).
   ============================================================ */
window.SEED = (function () {
  'use strict';

  var K = {
    users: 'cpp.users', companies: 'cpp.companies', jobs: 'cpp.jobs',
    apps: 'cpp.applications', audit: 'cpp.audit', seeded: 'cpp.seeded'
  };

  function ago(days, hours) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    if (hours) d.setHours(d.getHours() - hours);
    return d.toISOString();
  }
  function ahead(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /* ---------- users ---------- */
  function users() {
    var admin = {
      id: 'u_admin', role: 'admin', name: 'Dr. R. Meenakshi',
      email: 'admin@placement.demo', password: 'Admin@123',
      designation: 'Chief Placement Officer', createdAt: ago(120)
    };

    var recruiters = [
      { id: 'u_rec1', role: 'recruiter', name: 'Vikram Shah', email: 'recruiter@acme.demo', password: 'Recruiter@123', designation: 'Senior Talent Partner', phone: '+91 98450 11201', createdAt: ago(96) },
      { id: 'u_rec2', role: 'recruiter', name: 'Lakshmi Iyer', email: 'recruiter@zoho.demo', password: 'Recruiter@123', designation: 'Campus Hiring Lead', phone: '+91 98860 44520', createdAt: ago(88) },
      { id: 'u_rec3', role: 'recruiter', name: 'Farhan Qureshi', email: 'recruiter@nexcore.demo', password: 'Recruiter@123', designation: 'HR Executive', phone: '+91 90000 76510', createdAt: ago(12) }
    ];

    var students = [
      { id: 'u_stu1', role: 'student', name: 'Ananya Rao', email: 'student@vit.demo', password: 'Student@123', branch: 'CSE', cgpa: 8.6, gradYear: 2026, phone: '+91 99001 22331', resumeLink: 'https://drive.example.com/ananya-rao-resume', skills: ['Java', 'React', 'SQL'], createdAt: ago(70) },
      { id: 'u_stu2', role: 'student', name: 'Rohit Menon', email: 'rohit@vit.demo', password: 'Student@123', branch: 'ECE', cgpa: 7.2, gradYear: 2026, phone: '+91 99001 22332', resumeLink: 'https://drive.example.com/rohit-menon-resume', skills: ['Embedded C', 'VLSI'], createdAt: ago(70) },
      { id: 'u_stu3', role: 'student', name: 'Priya Nair', email: 'priya@vit.demo', password: 'Student@123', branch: 'IT', cgpa: 9.1, gradYear: 2026, phone: '+91 99001 22333', resumeLink: 'https://drive.example.com/priya-nair-resume', skills: ['Python', 'Machine Learning'], createdAt: ago(64) },
      { id: 'u_stu4', role: 'student', name: 'Arjun Iyer', email: 'arjun@vit.demo', password: 'Student@123', branch: 'Mechanical', cgpa: 6.8, gradYear: 2027, phone: '+91 99001 22334', resumeLink: 'https://drive.example.com/arjun-iyer-resume', skills: ['SolidWorks', 'AutoCAD'], createdAt: ago(40) },
      { id: 'u_stu5', role: 'student', name: 'Sneha Kulkarni', email: 'sneha@vit.demo', password: 'Student@123', branch: 'CSE', cgpa: 7.9, gradYear: 2026, phone: '+91 99001 22335', resumeLink: 'https://drive.example.com/sneha-kulkarni-resume', skills: ['Node.js', 'MongoDB'], createdAt: ago(38) },
      { id: 'u_stu6', role: 'student', name: 'Karan Verma', email: 'karan@vit.demo', password: 'Student@123', branch: 'EEE', cgpa: 8.2, gradYear: 2027, phone: '+91 99001 22336', resumeLink: 'https://drive.example.com/karan-verma-resume', skills: ['MATLAB', 'Power Systems'], createdAt: ago(26) }
    ];

    return [admin].concat(recruiters, students);
  }

  /* ---------- companies (2 approved, 1 pending) ---------- */
  function companies() {
    return [
      {
        id: 'co_acme', ownerId: 'u_rec1', name: 'Acme Analytics Pvt Ltd',
        industry: 'Data & Analytics', website: 'https://acmeanalytics.example.in',
        location: 'Bengaluru, Karnataka', status: 'approved',
        about: 'Decision-science products for banking and retail, with a 40-member campus cohort every year.',
        hrName: 'Vikram Shah', hrEmail: 'recruiter@acme.demo',
        createdAt: ago(95), updatedAt: ago(60), reviewedAt: ago(60), reviewedBy: 'u_admin', rejectionReason: ''
      },
      {
        id: 'co_zoho', ownerId: 'u_rec2', name: 'Zoho Corporation',
        industry: 'SaaS Products', website: 'https://zoho.example.com',
        location: 'Chennai, Tamil Nadu', status: 'approved',
        about: 'Product engineering company hiring for Chennai and remote engineering teams.',
        hrName: 'Lakshmi Iyer', hrEmail: 'recruiter@zoho.demo',
        createdAt: ago(86), updatedAt: ago(58), reviewedAt: ago(58), reviewedBy: 'u_admin', rejectionReason: ''
      },
      {
        id: 'co_nex', ownerId: 'u_rec3', name: 'NexCore Systems LLP',
        industry: 'Electronics & Embedded', website: 'https://nexcoresystems.example.in',
        location: 'Hyderabad, Telangana', status: 'pending',
        about: 'Embedded systems design house building industrial controllers and gateways.',
        hrName: 'Farhan Qureshi', hrEmail: 'recruiter@nexcore.demo',
        createdAt: ago(9), updatedAt: ago(9), reviewedAt: null, reviewedBy: null, rejectionReason: ''
      }
    ];
  }

  /* ---------- job postings (6 approved, 1 rejected, 1 pending) ---------- */
  function job(o) {
    return {
      id: o.id, companyId: o.companyId, title: o.title, type: o.type,
      description: o.description,
      responsibilities: o.responsibilities || [],
      skills: o.skills || [],
      packageLpa: o.type === 'Job' ? o.packageLpa : 0,
      stipend: o.type === 'Internship' ? o.stipend : 0,
      location: o.location, deadline: o.deadline,
      minCgpa: o.minCgpa, departments: o.departments,
      openings: o.openings, status: o.status,
      rejectionReason: o.rejectionReason || '',
      createdAt: o.createdAt, updatedAt: o.createdAt,
      reviewedAt: o.status === 'pending' ? null : o.createdAt,
      reviewedBy: o.status === 'pending' ? null : 'u_admin',
      approvedAt: o.status === 'approved' ? o.createdAt : null
    };
  }

  function jobs() {
    return [
      job({
        id: 'job1', companyId: 'co_acme', title: 'Software Engineer — Graduate Trainee', type: 'Job',
        description: 'Two-year structured programme: 8 weeks of foundation training, then rotation across the data-platform and client-reporting teams. You ship production code from month two.',
        responsibilities: ['Write and review Java/Python services for ingestion pipelines', 'Own dashboards used by 60+ analyst users', 'Participate in a 24×7 rotation, one week every quarter'],
        skills: ['Java or Python', 'SQL', 'Git'], packageLpa: 8.5, location: 'Bengaluru',
        deadline: ahead(53), minCgpa: 7.5, departments: ['CSE', 'IT', 'ECE'], openings: 12,
        status: 'approved', createdAt: ago(46)
      }),
      job({
        id: 'job2', companyId: 'co_acme', title: 'Data Analyst — Summer Internship', type: 'Internship',
        description: '6-month paid internship (Jan–Jun 2027) on the retail analytics pod. Pre-placement offer possible for top 2 performers.',
        responsibilities: ['Build weekly demand models for 3 retail clients', 'Automate recurring Excel reports in Python', 'Present findings to the client every fortnight'],
        skills: ['Python', 'Pandas', 'Excel'], stipend: 25000, location: 'Pune (Hybrid)',
        deadline: ahead(17), minCgpa: 7.0, departments: ['CSE', 'IT', 'ECE'], openings: 4,
        status: 'approved', createdAt: ago(30)
      }),
      job({
        id: 'job3', companyId: 'co_acme', title: 'Backend Engineer — Node.js', type: 'Job',
        description: 'Join the platform team building the event-ingestion service (about 40k events/min). Remote-first with two office weeks per quarter.',
        responsibilities: ['Design REST and WebSocket endpoints', 'Tune PostgreSQL queries and indexes', 'Keep p95 latency under 250ms'],
        skills: ['Node.js', 'PostgreSQL', 'Docker'], packageLpa: 12.0, location: 'Remote / Bengaluru',
        deadline: ahead(38), minCgpa: 8.0, departments: ['CSE', 'IT'], openings: 3,
        status: 'approved', createdAt: ago(24)
      }),
      job({
        id: 'job4', companyId: 'co_acme', title: 'QA Automation Intern', type: 'Internship',
        description: '3-month internship converting to a full-time role. Build the regression suite for the reporting module.',
        responsibilities: ['Author Playwright specs for 120+ flows', 'Maintain the nightly CI run', 'File triaged bugs with reproduction steps'],
        skills: ['Playwright', 'JavaScript', 'API testing'], stipend: 20000, location: 'Bengaluru',
        deadline: ahead(9), minCgpa: 6.5, departments: ['CSE', 'IT', 'ECE', 'EEE'], openings: 5,
        status: 'approved', createdAt: ago(21)
      }),
      job({
        id: 'job5', companyId: 'co_zoho', title: 'Product Engineer', type: 'Job',
        description: 'Full-time role on the Zoho Creator platform team. Work on the form builder, workflow engine and the expression editor.',
        responsibilities: ['Ship features across the stack every sprint', 'Instrument and debug customer-reported issues', 'Mentor interns during summer cohorts'],
        skills: ['Java', 'JavaScript', 'Data structures'], packageLpa: 10.5, location: 'Chennai',
        deadline: ahead(45), minCgpa: 8.0, departments: ['CSE', 'IT'], openings: 8,
        status: 'approved', createdAt: ago(40)
      }),
      job({
        id: 'job6', companyId: 'co_zoho', title: 'Cloud Support Associate', type: 'Job',
        description: 'L2 support engineering for enterprise tenants — root-cause analysis, runbook authoring and escalations to product teams.',
        responsibilities: ['Handle 12–15 tickets a day with written RCA', 'Author internal runbooks', 'On-call support one weekend a month'],
        skills: ['Linux', 'Networking', 'Troubleshooting'], packageLpa: 6.8, location: 'Chennai',
        deadline: ahead(26), minCgpa: 6.5, departments: ['CSE', 'IT', 'ECE', 'EEE'], openings: 10,
        status: 'approved', createdAt: ago(18)
      }),
      job({
        id: 'job7', companyId: 'co_zoho', title: 'UX Engineering Intern', type: 'Internship',
        description: 'Design-system internship working with the product design team on component accessibility and documentation.',
        responsibilities: ['Audit components against WCAG 2.1 AA', 'Prototype interaction states in code', 'Maintain the design-token library'],
        skills: ['HTML/CSS', 'Accessibility', 'Figma'], stipend: 30000, location: 'Remote',
        deadline: ahead(31), minCgpa: 7.5, departments: ['CSE', 'IT'], openings: 2,
        status: 'rejected', rejectionReason: 'Stipend structure and mentor allocation details are incomplete. Re-post with a named mentor and stipend breakup.',
        createdAt: ago(16)
      }),
      job({
        id: 'job8', companyId: 'co_nex', title: 'Embedded Systems Trainee', type: 'Job',
        description: 'Trainee role on the industrial gateway team — firmware bring-up, drivers and factory test tooling.',
        responsibilities: ['Bring up peripherals on STM32 targets', 'Write C drivers and unit tests', 'Support factory test automation'],
        skills: ['C', 'RTOS', 'Serial protocols'], packageLpa: 5.4, location: 'Hyderabad',
        deadline: ahead(60), minCgpa: 7.0, departments: ['ECE', 'EEE'], openings: 6,
        status: 'pending', createdAt: ago(7)
      })
    ];
  }

  /* ---------- applications (~15 across every status) ---------- */
  function application(id, jobId, studentId, path, baseDays) {
    var timeline = path.map(function (status, i) {
      return {
        status: status,
        at: ago(Math.max(0, baseDays - i * 4)),
        by: i === 0 ? studentId : 'u_rec1',
        note: i === 0 ? 'Application submitted' : ''
      };
    });
    return {
      id: id, jobId: jobId, studentId: studentId,
      companyId: { job1: 'co_acme', job2: 'co_acme', job3: 'co_acme', job4: 'co_acme', job5: 'co_zoho', job6: 'co_zoho' }[jobId],
      status: path[path.length - 1],
      coverNote: '',
      timeline: timeline,
      createdAt: timeline[0].at,
      updatedAt: timeline[timeline.length - 1].at
    };
  }

  function applications() {
    return [
      application('app1', 'job1', 'u_stu1', ['applied', 'shortlisted', 'interview', 'offered'], 34),
      application('app2', 'job1', 'u_stu5', ['applied', 'shortlisted', 'interview'], 33),
      application('app3', 'job1', 'u_stu3', ['applied', 'shortlisted'], 31),
      application('app4', 'job2', 'u_stu2', ['applied'], 16),
      application('app5', 'job2', 'u_stu1', ['applied', 'shortlisted'], 15),
      application('app6', 'job3', 'u_stu3', ['applied', 'shortlisted', 'interview', 'offered'], 21),
      application('app7', 'job4', 'u_stu6', ['applied', 'shortlisted'], 12),
      application('app8', 'job4', 'u_stu5', ['applied', 'rejected'], 11),
      application('app9', 'job5', 'u_stu3', ['applied', 'shortlisted', 'interview', 'offered'], 36),
      application('app10', 'job5', 'u_stu1', ['applied', 'shortlisted', 'interview'], 35),
      application('app11', 'job6', 'u_stu2', ['applied', 'shortlisted', 'interview'], 14),
      application('app12', 'job6', 'u_stu6', ['applied', 'rejected'], 13),
      application('app13', 'job6', 'u_stu5', ['applied'], 8),
      application('app14', 'job3', 'u_stu1', ['applied', 'shortlisted'], 19),
      application('app15', 'job4', 'u_stu3', ['applied'], 6)
    ];
  }

  /* ---------- audit trail ---------- */
  function audit() {
    function e(id, at, action, targetType, targetId, targetLabel, decision, reviewerId, reviewerName, reviewerRole, reason) {
      return { id: id, at: at, action: action, targetType: targetType, targetId: targetId, targetLabel: targetLabel, decision: decision, reviewerId: reviewerId, reviewerName: reviewerName, reviewerRole: reviewerRole, reason: reason };
    }
    return [
      e('log1', ago(60), 'company_approved', 'company', 'co_acme', 'Acme Analytics Pvt Ltd', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Offer letters and last-season CTC sheet verified.'),
      e('log2', ago(58), 'company_approved', 'company', 'co_zoho', 'Zoho Corporation', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Existing MoU on file, no fresh approval needed.'),
      e('log3', ago(46), 'job_approved', 'job', 'job1', 'Software Engineer — Graduate Trainee — Acme Analytics Pvt Ltd', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'CTC and bond terms match the cell policy.'),
      e('log4', ago(40), 'job_approved', 'job', 'job5', 'Product Engineer — Zoho Corporation', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Approved after dept-wise seat split was confirmed.'),
      e('log5', ago(30), 'job_approved', 'job', 'job2', 'Data Analyst — Summer Internship — Acme Analytics Pvt Ltd', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Stipend above the ₹18,000 floor for internships.'),
      e('log6', ago(24), 'job_approved', 'job', 'job3', 'Backend Engineer — Node.js — Acme Analytics Pvt Ltd', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Approved with a note that remote onboarding needs parent consent.'),
      e('log7', ago(18), 'job_approved', 'job', 'job6', 'Cloud Support Associate — Zoho Corporation', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Headcount confirmed with the recruiter over call.'),
      e('log8', ago(15), 'job_rejected', 'job', 'job7', 'UX Engineering Intern — Zoho Corporation', 'rejected', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Stipend structure and mentor allocation details are incomplete. Re-post with a named mentor and stipend breakup.'),
      e('log9', ago(9), 'job_approved', 'job', 'job4', 'QA Automation Intern — Acme Analytics Pvt Ltd', 'approved', 'u_admin', 'Dr. R. Meenakshi', 'admin', 'Internship converted seats are permitted for the 2026 batch.'),
      e('log10', ago(6), 'application_status', 'application', 'app8', 'Sneha Kulkarni → QA Automation Intern', 'rejected', 'u_rec1', 'Vikram Shah', 'recruiter', 'No response to the screening call on two attempts.'),
      e('log11', ago(5), 'application_status', 'application', 'app1', 'Ananya Rao → Software Engineer — Graduate Trainee', 'offered', 'u_rec1', 'Vikram Shah', 'recruiter', 'Panel feedback outstanding, offer released after HR round.'),
      e('log12', ago(3), 'application_status', 'application', 'app11', 'Rohit Menon → Cloud Support Associate', 'interview', 'u_rec2', 'Lakshmi Iyer', 'recruiter', 'Technical round scheduled with the Chennai team.')
    ];
  }

  function put(key, rows) { localStorage.setItem(key, JSON.stringify(rows)); }

  function run() {
    put(K.users, users());
    put(K.companies, companies());
    put(K.jobs, jobs());
    put(K.apps, applications());
    put(K.audit, audit());
    put(K.seeded, true);
  }

  /* Reset keeps the admin session so the portal does not log you out mid-review. */
  function reset() {
    [K.users, K.companies, K.jobs, K.apps, K.audit, K.seeded].forEach(function (k) {
      localStorage.removeItem(k);
    });
    run();
  }
  return { run: run, reset: reset };
})();
