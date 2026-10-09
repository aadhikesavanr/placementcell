/* ============================================================
   ui.js — shared presentational helpers.
   Toasts, confirm/detail modals, icons, tables, pagination,
   tabs, skeleton loaders, inline form validation.
   No business rules here: ui.js only renders.
   ============================================================ */
window.UI = (function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- formatters ---------- */
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  function relTime(iso) {
    if (!iso) return '—';
    var diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return iso;
    var mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
    var days = Math.round(hrs / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    var months = Math.round(days / 30);
    if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
    var years = Math.round(months / 12);
    return years + (years === 1 ? ' year ago' : ' years ago');
  }
  function daysLeft(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + 'T23:59:59').getTime();
    return Math.ceil((d - Date.now()) / 86400000);
  }
  function initials(name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  /* ---------- inline SVG icons (Lucide-style, stroke 1.75) ---------- */
  var PATHS = {
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    rupee: '<path d="M6 3h12M6 8h12M6 13h4a4 4 0 0 0 0-8l-4 8v6h12"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 8.4-7 9-4-.6-7-4.5-7-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 8v4l3 2"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 4-6"/>',
    edit: '<path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M18 3l3 3-8 8h-3v-3Z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>'
  };

  function icon(name, size) {
    var s = size || 16;
    var d = PATHS[name] || PATHS.info;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + d + '</svg>';
  }

  /* ---------- toasts ---------- */
  function toastRegion() {
    var el = document.getElementById('toast-region');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-region';
      el.className = 'toast-region';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }
  function toast(message, type) {
    var region = toastRegion();
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    var glyph = type === 'error' ? 'alert' : (type === 'warn' ? 'info' : 'check');
    el.innerHTML = '<span style="flex:none;margin-top:2px">' + icon(glyph, 16) + '</span>' +
      '<span class="grow">' + esc(message) + '</span>' +
      '<button class="toast-close" type="button" aria-label="Dismiss">' + icon('x', 14) + '</button>';
    el.querySelector('.toast-close').addEventListener('click', function () { el.remove(); });
    region.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 4600);
    return el;
  }

  /* ---------- modals (keyboard navigable, focus trapped) ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openModal(opts) {
    opts = opts || {};
    var opener = document.activeElement;
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal ' + (opts.wide ? 'modal-wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal-head">' +
          '<h3 id="modal-title">' + esc(opts.title || '') + '</h3>' +
          '<button class="modal-close" type="button" data-close aria-label="Close dialog">' + icon('x', 18) + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        '<div class="modal-foot">' + (opts.foot ||
          '<button class="btn btn-outline" type="button" data-close>Close</button>') + '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var modal = overlay.querySelector('.modal');
    function close(result) {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      document.body.style.overflow = '';
      if (opener && opener.focus) opener.focus();
      if (opts.onClose) opts.onClose(result);
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(null); return; }
      if (e.key === 'Tab') {
        var nodes = Array.prototype.slice.call(modal.querySelectorAll(FOCUSABLE));
        if (!nodes.length) return;
        var first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(null); });
    Array.prototype.forEach.call(overlay.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () { close(null); });
    });
    document.addEventListener('keydown', onKey, true);

    var auto = modal.querySelector('[data-autofocus]') || modal.querySelector(FOCUSABLE);
    if (auto) setTimeout(function () { auto.focus(); }, 30);

    return { el: modal, close: close };
  }

  /** Promise-based confirmation, optionally demanding a typed reason. */
  function confirmDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var settled = false;
      function settle(value) { if (!settled) { settled = true; resolve(value); } }
      var needsReason = !!opts.reasonLabel;
      var body = '<p>' + esc(opts.message || 'Are you sure?') + '</p>' +
        (needsReason ?
          '<div class="field" style="margin-top:16px">' +
            '<label for="cf-reason">' + esc(opts.reasonLabel) + ' <span class="req">*</span></label>' +
            '<textarea id="cf-reason" rows="3" placeholder="' + esc(opts.reasonHint || 'Give a clear reason — it is recorded in the audit log.') + '"></textarea>' +
            '<p class="field-error">A reason of at least 5 characters is required.</p>' +
          '</div>' : '');
      var m = openModal({
        title: opts.title || 'Please confirm',
        body: body,
        foot: '<button class="btn btn-outline" type="button" data-close>Cancel</button>' +
              '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-ok data-autofocus>' +
              esc(opts.confirmText || 'Confirm') + '</button>',
        onClose: function () { settle(null); }
      });
      m.el.querySelector('[data-ok]').addEventListener('click', function () {
        var reason = '';
        if (needsReason) {
          var ta = m.el.querySelector('#cf-reason');
          reason = ta.value.trim();
          if (reason.length < 5) {
            ta.closest('.field').classList.add('has-error');
            ta.focus();
            return;
          }
        }
        var okBtn = m.el.querySelector('[data-ok]');
        okBtn.disabled = true;
        okBtn.innerHTML = '<span class="spin"></span> Working…';
        setTimeout(function () { settle(reason || true); m.close(); }, 60);
      });
    });
  }

  /* ---------- empty states & skeletons ---------- */
  function emptyState(opts) {
    opts = opts || {};
    return '<div class="empty">' +
      '<div class="empty-mark">' + icon(opts.icon || 'inbox', 22) + '</div>' +
      '<h4>' + esc(opts.title || 'Nothing here yet') + '</h4>' +
      '<p>' + esc(opts.text || '') + '</p>' +
      (opts.action ? '<button class="btn btn-primary" type="button" data-empty-action>' + esc(opts.action) + '</button>' : '') +
      '</div>';
  }

  function skeletonRows(count, cols) {
    var out = '';
    for (var i = 0; i < (count || 5); i++) {
      out += '<div class="skel-row">';
      for (var c = 0; c < (cols || 4); c++) {
        out += '<div class="skel skel-line" style="flex:' + (c === 0 ? 2 : 1) + '"></div>';
      }
      out += '</div>';
    }
    return out;
  }

  function showSkeleton(container, count, cols) {
    if (!container) return;
    container.innerHTML = skeletonRows(count, cols);
    container.setAttribute('aria-busy', 'true');
  }
  function hideSkeleton(container) { if (container) container.removeAttribute('aria-busy'); }

  /* ---------- pagination ---------- */
  function pagination(state, onGo) {
    // state: {page, pages, total, perPage}
    if (!state || state.pages <= 1) {
      return state && state.total ? '<div class="pagination"><span class="text-sm muted">' + state.total + ' record' + (state.total === 1 ? '' : 's') + '</span></div>' : '';
    }
    var btns = '';
    var start = Math.max(1, state.page - 2), end = Math.min(state.pages, state.page + 2);
    btns += '<button class="page-btn" type="button" data-page="' + (state.page - 1) + '" ' + (state.page === 1 ? 'disabled' : '') + ' aria-label="Previous page">‹</button>';
    for (var p = start; p <= end; p++) {
      btns += '<button class="page-btn" type="button" data-page="' + p + '" ' + (p === state.page ? 'aria-current="page"' : '') + '>' + p + '</button>';
    }
    btns += '<button class="page-btn" type="button" data-page="' + (state.page + 1) + '" ' + (state.page === state.pages ? 'disabled' : '') + ' aria-label="Next page">›</button>';
    var from = (state.page - 1) * state.perPage + 1;
    var to = Math.min(state.total, state.page * state.perPage);
    return '<div class="pagination">' +
      '<span class="text-sm muted">Showing ' + from + '–' + to + ' of ' + state.total + '</span>' +
      '<span class="pages">' + btns + '</span>' +
      '</div>';
  }
  function bindPagination(root, state, onGo) {
    if (!root) return;
    $$('.page-btn[data-page]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = Number(b.getAttribute('data-page'));
        if (!b.disabled && p >= 1 && p <= state.pages && p !== state.page) onGo(p);
      });
    });
  }

  /* ---------- badges ---------- */
  var STATUS_LABEL = {
    pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected',
    applied: 'Applied', shortlisted: 'Shortlisted', interview: 'Interview', offered: 'Offered',
    Job: 'Full-time', Internship: 'Internship'
  };
  function badge(status, overrideLabel) {
    var cls = { hired: 'offered' }[status] || status;
    return '<span class="badge badge-' + esc(cls) + '">' + esc(overrideLabel || STATUS_LABEL[status] || status) + '</span>';
  }

  /** Set a stat card's sub-line, creating the element if the markup lacks one. */
  function statSub(card, html) {
    if (!card) return;
    var el = card.querySelector('.stat-sub');
    if (!el) { el = document.createElement('div'); el.className = 'stat-sub'; card.appendChild(el); }
    el.innerHTML = html;
  }

  /* ---------- inline form validation (UI-side only; API re-validates) ---------- */
  var MESSAGES = {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    url: 'Must start with http:// or https://',
    number: 'Enter a number.',
    min: 'Value is too low.',
    max: 'Value is too high.',
    minlength: 'Too short.',
    match: 'Values do not match.'
  };

  function fieldWrap(el) { return el.closest('.field') || el.parentNode; }

  function setError(el, msg) {
    var wrap = fieldWrap(el);
    if (!wrap) return;
    wrap.classList.add('has-error');
    var out = wrap.querySelector('.field-error');
    if (out) out.textContent = msg;
    el.setAttribute('aria-invalid', 'true');
  }
  function clearErrors(form) {
    $$('.has-error', form).forEach(function (w) { w.classList.remove('has-error'); });
    $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
  }

  function validate(form, rules) {
    clearErrors(form);
    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (!el) return;
      var r = rules[name];
      var v = (el.type === 'checkbox' || el.type === 'radio') ? el.value : String(el.value || '').trim();
      var msg = '';
      if (r.required && !v) msg = MESSAGES.required;
      else if (v && r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = MESSAGES.email;
      else if (v && r.url && !/^https?:\/\//i.test(v)) msg = MESSAGES.url;
      else if (v && r.number && isNaN(Number(v))) msg = MESSAGES.number;
      else if (v && r.number && r.min != null && Number(v) < r.min) msg = MESSAGES.min + ' (min ' + r.min + ')';
      else if (v && r.number && r.max != null && Number(v) > r.max) msg = MESSAGES.max + ' (max ' + r.max + ')';
      else if (v && r.minlength && v.length < r.minlength) msg = 'Use at least ' + r.minlength + ' characters.';
      else if (r.matches) {
        var other = form.querySelector('[name="' + r.matches + '"]');
        if (other && other.value !== el.value) msg = MESSAGES.match;
      }
      if (msg) { setError(el, msg); if (!firstBad) firstBad = el; }
    });
    if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return !firstBad;
  }

  /** Disable a submit button while an async action runs. */
  function busy(btn, label) {
    var original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> ' + esc(label || 'Working…');
    return function restore() { btn.disabled = false; btn.innerHTML = original; };
  }

  /** Convert an ApiError into a toast + inline field error. */
  function reportError(err, form) {
    console.error(err);
    var msg = (err && err.message) ? err.message : 'Something went wrong. Please try again.';
    toast(msg, 'error');
    if (form && err && err.details && err.details.field) {
      var el = form.querySelector('[name="' + err.details.field + '"]');
      if (el) setError(el, msg);
    }
    if (err && err.status === 401) window.location.href = 'login.html';
  }

  /* marker: ui part 4 appended below */
  return { $: $, $$: $$, esc: esc, fmtDate: fmtDate, fmtDateTime: fmtDateTime, relTime: relTime,
    daysLeft: daysLeft, initials: initials, icon: icon, toast: toast,
    openModal: openModal, confirmDialog: confirmDialog,
    emptyState: emptyState, skeletonRows: skeletonRows, showSkeleton: showSkeleton, hideSkeleton: hideSkeleton,
    pagination: pagination, bindPagination: bindPagination,
    badge: badge, STATUS_LABEL: STATUS_LABEL,
    validate: validate, clearErrors: clearErrors, setError: setError,
    statSub: statSub,
    busy: busy, reportError: reportError };
})();
