/* ============================================================
   auth.js — session bootstrap, route guards, app shell.
   Every page calls AUTH.guard(...) on load; unauthorised users
   are redirected instead of seeing protected markup.
   ============================================================ */
window.AUTH = (function () {
  'use strict';

  var HOME = { student: 'student/dashboard.html', recruiter: 'recruiter/dashboard.html', admin: 'admin/dashboard.html' };

  var NAV = {
    student: [
      { key: 'dashboard', label: 'Overview', href: 'dashboard.html', icon: 'chart' },
      { key: 'jobs', label: 'Browse openings', href: 'jobs.html', icon: 'briefcase' },
      { key: 'applications', label: 'My applications', href: 'applications.html', icon: 'list' },
      { key: 'profile', label: 'My profile', href: 'profile.html', icon: 'user' }
    ],
    recruiter: [
      { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'chart' },
      { key: 'company', label: 'Company profile', href: 'company.html', icon: 'building' },
      { key: 'post-job', label: 'Post an opening', href: 'post-job.html', icon: 'plus' },
      { key: 'applicants', label: 'Applicants', href: 'applicants.html', icon: 'users' }
    ],
    admin: [
      { key: 'dashboard', label: 'Overview', href: 'dashboard.html', icon: 'chart' },
      { key: 'companies', label: 'Company approvals', href: 'companies.html', icon: 'building' },
      { key: 'jobs', label: 'Opening approvals', href: 'jobs.html', icon: 'briefcase' },
      { key: 'audit-log', label: 'Audit log', href: 'audit-log.html', icon: 'history' }
    ]
  };

  function current() { return window.API.currentUser(); }

  /** Route guard — call on every protected page. Returns the signed-in user. */
  function guard() {
    var roles = Array.prototype.slice.call(arguments);
    var inSubdir = /\/(student|recruiter|admin)\//.test(location.pathname);
    try {
      return window.API.requireRole.apply(null, roles);
    } catch (err) {
      if (err.status === 401) {
        // keep the directory so login can return to e.g. admin/dashboard.html
        var next = encodeURIComponent(location.pathname.replace(/^\/+/, '') + location.search);
        location.replace((inSubdir ? '../' : '') + 'login.html?next=' + next);
      } else {
        var u = current();
        var home = (u && HOME[u.role]) || 'index.html';
        location.replace((inSubdir ? '../' : '') + home);
      }
      throw err;
    }
  }

  /* ---------- app shell (sidebar + topbar) ---------- */
  function shell(role, activeKey) {
    var user = current();
    if (!user) return;
    var items = NAV[role] || [];
    var title = (items.filter(function (i) { return i.key === activeKey; })[0] || {}).label || 'Portal';
    var root = document.getElementById('shell-root');
    if (!root) return;

    var links = items.map(function (i) {
      return '<a href="' + i.href + '"' + (i.key === activeKey ? ' aria-current="page"' : '') + '>' +
        window.UI.icon(i.icon, 17) + '<span>' + i.label + '</span></a>';
    }).join('');

    root.innerHTML =
      '<div class="scrim" data-drawer-close></div>' +
      '<aside class="sidebar" id="sidebar" aria-label="Portal navigation">' +
        '<a class="brand" href="' + roleHome(role) + '">' +
          '<span class="brand-mark">CP</span>' +
          '<span>CampusPlace<br><span class="brand-sub" style="color:rgba(255,255,255,.55)">' + roleLabel(role) + '</span></span>' +
        '</a>' +
        '<div class="side-label">Menu</div>' +
        '<nav class="side-nav">' + links + '</nav>' +
        '<div class="sidebar-foot">' +
          '<div class="side-user">' +
            '<span class="avatar avatar-navy">' + window.UI.esc(window.UI.initials(user.name)) + '</span>' +
            '<span class="who"><b>' + window.UI.esc(user.name) + '</b><span>' + window.UI.esc(user.email) + '</span></span>' +
          '</div>' +
          (role === 'admin' ? '<button class="side-link" type="button" data-action="reset-demo">' + window.UI.icon('refresh', 16) + ' Reset demo data</button>' : '') +
          '<button class="side-link" type="button" data-action="logout">' + window.UI.icon('logout', 16) + ' Sign out</button>' +
        '</div>' +
      '</aside>' +
      '<header class="topbar">' +
        '<button class="drawer-btn" type="button" data-drawer-open aria-label="Open navigation" aria-controls="sidebar">' + window.UI.icon('menu', 18) + '</button>' +
        '<div class="grow"><div class="crumb">' + window.UI.esc(roleLabel(role)) + '</div><h2>' + window.UI.esc(title) + '</h2></div>' +
        '<span class="avatar" title="' + window.UI.esc(user.name) + '">' + window.UI.esc(window.UI.initials(user.name)) + '</span>' +
      '</header>';

    document.body.classList.add('has-shell');

    var openBtn = root.querySelector('[data-drawer-open]');
    function drawerOpen() { return document.body.classList.contains('drawer-open'); }
    function setDrawer(open) {
      document.body.classList.toggle('drawer-open', open);
      if (openBtn) {
        openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        openBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      }
    }
    if (openBtn) {
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.addEventListener('click', function () { setDrawer(!drawerOpen()); });
    }
    Array.prototype.forEach.call(root.querySelectorAll('[data-drawer-close]'), function (el) {
      el.addEventListener('click', function () { setDrawer(false); });
    });
    var logoutBtn = root.querySelector('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
    var resetBtn = root.querySelector('[data-action="reset-demo"]');
    if (resetBtn) resetBtn.addEventListener('click', doReset);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerOpen()) setDrawer(false);
    });
  }

  function roleHome(role) { return HOME[role]; }
  function roleLabel(role) {
    return role === 'student' ? 'Student portal' : role === 'recruiter' ? 'Recruiter portal' : 'Placement cell';
  }

  function doLogout() {
    window.API.logout().then(function () { location.href = 'login.html'; });
  }

  function doReset() {
    window.UI.confirmDialog({
      title: 'Reset demo data?',
      message: 'All accounts, openings, applications and audit entries you created will be replaced by the original sample dataset.',
      confirmText: 'Reset data', danger: true
    }).then(function (ok) {
      if (!ok) return;
      window.API.resetDemo().then(function () {
        window.UI.toast('Demo data restored to the original sample set.');
        setTimeout(function () { location.reload(); }, 700);
      }).catch(function (err) { window.UI.reportError(err); });
    });
  }

  /* ---------- public top nav ---------- */
  function publicNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.topnav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  /* ---------- boot: seed on first load ---------- */
  function boot() {
    return window.API.bootstrap().then(function (didSeed) {
      if (didSeed) console.info('[CampusPlace] demo dataset seeded into localStorage.');
      return didSeed;
    });
  }

  return { guard: guard, shell: shell, publicNav: publicNav, boot: boot, current: current, doLogout: doLogout, doReset: doReset };
})();
