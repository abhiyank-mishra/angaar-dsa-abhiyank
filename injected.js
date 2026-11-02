// Angaar Pro - Main World Bridge Script
// Runs directly inside the website execution context (MAIN world)
// Has direct access to window.monaco, window.__NEXT_DATA__, and native window.fetch
(function() {
  'use strict';

  console.log('%c[Angaar Pro] 🛡️ Admin Contest Shield ACTIVE — 0 Flags Enforced', 'color: #10b981; font-size: 13px; font-weight: bold;');

  window.__ANGAAR_MAIN_BRIDGE_READY__ = true;
  window.dispatchEvent(new CustomEvent('ANGAAR_MAIN_WORLD_READY'));

  // =========================================================================
  // 🛡️ ADMIN CONTEST SHIELD & PROCTORING BYPASS ENGINE
  // =========================================================================
  let blockedFlagsCount = 0;
  function notifyFlagBlocked(reason) {
    blockedFlagsCount++;
    console.log(`%c[Admin Shield] Blocked flag attempt: ${reason} (Total blocked: ${blockedFlagsCount})`, 'color: #10b981; font-weight: bold;');
    try {
      window.dispatchEvent(new CustomEvent('ANGAAR_FLAG_BLOCKED', {
        detail: { reason, total: blockedFlagsCount, timestamp: Date.now() }
      }));
    } catch(e) {}
  }

  window.addEventListener('ANGAAR_GET_SHIELD_STATUS', () => {
    window.dispatchEvent(new CustomEvent('ANGAAR_SHIELD_STATUS_RESPONSE', {
      detail: { active: true, blockedCount: blockedFlagsCount }
    }));
  });

  // A. Page Visibility & Focus Spoofing (Tab-switch protection)
  try {
    Object.defineProperty(document, 'hidden', {
      get: () => false,
      configurable: true
    });
    Object.defineProperty(document, 'visibilityState', {
      get: () => 'visible',
      configurable: true
    });
    Object.defineProperty(document, 'webkitHidden', {
      get: () => false,
      configurable: true
    });
    Object.defineProperty(document, 'webkitVisibilityState', {
      get: () => 'visible',
      configurable: true
    });
    document.hasFocus = function() { return true; };
  } catch(e) {}

  // B. Fullscreen Spoofing (Fullscreen exit protection)
  try {
    const getFullscreenElement = () => document.documentElement;
    Object.defineProperty(document, 'fullscreenElement', {
      get: getFullscreenElement,
      configurable: true
    });
    Object.defineProperty(document, 'webkitFullscreenElement', {
      get: getFullscreenElement,
      configurable: true
    });
    Object.defineProperty(document, 'mozFullScreenElement', {
      get: getFullscreenElement,
      configurable: true
    });
    Object.defineProperty(document, 'msFullscreenElement', {
      get: getFullscreenElement,
      configurable: true
    });
    Object.defineProperty(document, 'fullscreen', {
      get: () => true,
      configurable: true
    });
    Object.defineProperty(document, 'webkitIsFullScreen', {
      get: () => true,
      configurable: true
    });
    Object.defineProperty(document, 'mozFullScreen', {
      get: () => true,
      configurable: true
    });
    document.exitFullscreen = async function() { return Promise.resolve(); };
  } catch(e) {}

  // C. Event Interception & Global Listener Neutralization
  const BLOCKED_PROCTOR_EVENTS = new Set([
    'visibilitychange',
    'webkitvisibilitychange',
    'blur',
    'focusout',
    'pagehide',
    'mouseleave',
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'msfullscreenchange',
    'copy',
    'cut',
    'contextmenu',
    'selectstart'
  ]);

  const origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    const lowerType = (type || '').toLowerCase();
    const isGlobal = (this === window || this === document || this === document.documentElement || this === document.body);

    if (isGlobal && BLOCKED_PROCTOR_EVENTS.has(lowerType)) {
      const stack = new Error().stack || '';
      if (!stack.includes('angaar-injected-bridge') && !stack.includes('content.js')) {
        notifyFlagBlocked(`Blocked ${lowerType} listener on global target`);
        const dummy = function(e) {
          if (e && typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
          }
        };
        return origAddEventListener.call(this, type, dummy, options);
      }
    }
    return origAddEventListener.call(this, type, listener, options);
  };

  // Suppress one-off property handlers (e.g. window.onblur = ...)
  ['onblur', 'onfocusout', 'onpagehide', 'onmouseleave'].forEach(p => {
    try {
      Object.defineProperty(window, p, {
        set: function() { notifyFlagBlocked(`Suppressed window.${p} assignment`); },
        get: function() { return null; },
        configurable: true
      });
    } catch(e) {}
  });

  ['onvisibilitychange', 'onwebkitvisibilitychange', 'onfullscreenchange', 'onwebkitfullscreenchange', 'oncopy', 'oncut', 'oncontextmenu'].forEach(p => {
    try {
      Object.defineProperty(document, p, {
        set: function() { notifyFlagBlocked(`Suppressed document.${p} assignment`); },
        get: function() { return null; },
        configurable: true
      });
    } catch(e) {}
  });

  // Capturing-phase event eaters
  ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'fullscreenchange', 'webkitfullscreenchange', 'pagehide'].forEach(evt => {
    window.addEventListener(evt, (e) => {
      e.stopImmediatePropagation();
      e.stopPropagation();
      notifyFlagBlocked(`Intercepted native ${evt} event`);
    }, true);
    document.addEventListener(evt, (e) => {
      e.stopImmediatePropagation();
      e.stopPropagation();
    }, true);
  });

  // D. DOM Cloaking (Hides extension elements from site scanner scripts like exam-ext)
  function isAngaarNode(node) {
    if (!node) return false;
    const id = node.id || '';
    const className = typeof node.className === 'string' ? node.className : '';
    const tagName = (node.tagName || '').toLowerCase();
    return id.includes('angaar') || className.includes('angaar') || tagName.includes('angaar');
  }

  const origGetElementById = document.getElementById.bind(document);
  document.getElementById = function(id) {
    if (typeof id === 'string' && id.includes('angaar')) {
      const stack = new Error().stack || '';
      if (!stack.includes('content.js') && !stack.includes('injected.js')) {
        notifyFlagBlocked(`Cloaked document.getElementById('${id}')`);
        return null;
      }
    }
    return origGetElementById(id);
  };

  const origQuerySelectorAll = document.querySelectorAll.bind(document);
  document.querySelectorAll = function(selectors) {
    const list = origQuerySelectorAll(selectors);
    const stack = new Error().stack || '';
    if (stack.includes('content.js') || stack.includes('injected.js')) {
      return list;
    }
    const filtered = Array.from(list).filter(el => !isAngaarNode(el));
    filtered.item = (i) => filtered[i] || null;
    return filtered;
  };

  const origQuerySelector = document.querySelector.bind(document);
  document.querySelector = function(selectors) {
    const stack = new Error().stack || '';
    if (stack.includes('content.js') || stack.includes('injected.js')) {
      return origQuerySelector(selectors);
    }
    if (typeof selectors === 'string' && selectors.includes('angaar')) {
      return null;
    }
    const res = origQuerySelector(selectors);
    if (res && isAngaarNode(res)) return null;
    return res;
  };

  // E. LocalStorage & SessionStorage Shield (exam-ext, exam-copies, exam-queue, flag)
  try {
    const origSetItem = Storage.prototype.setItem;
    const origGetItem = Storage.prototype.getItem;

    Storage.prototype.setItem = function(key, value) {
      if (typeof key === 'string') {
        const lowerKey = key.toLowerCase();
        if (lowerKey.startsWith('exam-ext')) {
          notifyFlagBlocked(`Neutralized localStorage.setItem('${key}') -> Empty array`);
          return origSetItem.call(this, key, '[]');
        }
        if (lowerKey.startsWith('exam-copies')) {
          notifyFlagBlocked(`Neutralized localStorage.setItem('${key}') -> Empty array`);
          return origSetItem.call(this, key, '[]');
        }
        if (lowerKey.startsWith('exam-queue')) {
          notifyFlagBlocked(`Neutralized localStorage.setItem('${key}') -> Empty array`);
          return origSetItem.call(this, key, '[]');
        }
        if (
          lowerKey.includes('flag') ||
          lowerKey.includes('violation') ||
          lowerKey.includes('tab_switch') ||
          lowerKey.includes('tabswitch') ||
          lowerKey.includes('warning')
        ) {
          notifyFlagBlocked(`Neutralized flag storage '${key}'`);
          return origSetItem.call(this, key, '0');
        }
      }
      return origSetItem.call(this, key, value);
    };

    Storage.prototype.getItem = function(key) {
      if (typeof key === 'string') {
        const lowerKey = key.toLowerCase();
        if (lowerKey.startsWith('exam-ext') || lowerKey.startsWith('exam-copies') || lowerKey.startsWith('exam-queue')) {
          return '[]';
        }
        if (
          lowerKey.includes('flag') ||
          lowerKey.includes('violation') ||
          lowerKey.includes('tab_switch') ||
          lowerKey.includes('tabswitch') ||
          lowerKey.includes('warning')
        ) {
          return '0';
        }
      }
      return origGetItem.call(this, key);
    };

    // Auto-clean any residual violation records from localStorage
    function purgeExamStorage() {
      try {
        const keysToPurge = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (
            k && (
              k.startsWith('exam-') ||
              k.includes('flag') ||
              k.includes('violation') ||
              k.includes('tab_switch') ||
              k.includes('warning')
            )
          ) {
            keysToPurge.push(k);
          }
        }
        keysToPurge.forEach(k => {
          localStorage.removeItem(k);
          console.log(`%c[Admin Shield] Purged violation record: ${k}`, 'color: #10b981;');
        });
      } catch(e) {}
    }
    purgeExamStorage();
    setTimeout(purgeExamStorage, 1000);
  } catch(e) {}

  // F. Outgoing Payload Sanitizer
  function sanitizeContestPayload(body) {
    if (!body) return body;
    try {
      let isJson = false;
      let parsed = body;
      if (typeof body === 'string') {
        try {
          parsed = JSON.parse(body);
          isJson = true;
        } catch(e) {
          return body;
        }
      }

      if (parsed && typeof parsed === 'object') {
        let changed = false;
        const zeroFields = [
          'flags', 'flag_count', 'flagCount', 'tab_switches', 'tabSwitches',
          'tab_switch_count', 'switch_count', 'warnings', 'warning_count',
          'copies_count', 'copy_count'
        ];
        for (const f of zeroFields) {
          if (f in parsed) {
            parsed[f] = 0;
            changed = true;
          }
        }
        const emptyArrayFields = ['violations', 'copies', 'extensions', 'ext', 'events', 'exam_queue'];
        for (const f of emptyArrayFields) {
          if (f in parsed) {
            parsed[f] = [];
            changed = true;
          }
        }
        if (parsed.telemetry && typeof parsed.telemetry === 'object') {
          parsed.telemetry.flags = 0;
          parsed.telemetry.tab_switches = 0;
          parsed.telemetry.violations = [];
          changed = true;
        }
        if (parsed.is_disqualified) {
          parsed.is_disqualified = false;
          changed = true;
        }
        if (changed) {
          notifyFlagBlocked('Sanitized network telemetry payload (flags set to 0)');
          return isJson ? JSON.stringify(parsed) : parsed;
        }
      }
    } catch(e) {}
    return body;
  }

  // 1. Check window.__NEXT_DATA__ on startup for instant zero-fetch hydration
  function checkNextData() {
    try {
      const pageProps = window.__NEXT_DATA__?.props?.pageProps;
      if (pageProps?.problem) {
        window.dispatchEvent(new CustomEvent('ANGAAR_QUESTION_DATA', {
          detail: { url: 'next_data', data: pageProps }
        }));
      }
      if (pageProps?.profile) {
        window.dispatchEvent(new CustomEvent('ANGAAR_PROFILE_DATA', {
          detail: { url: 'next_data', data: pageProps.profile }
        }));
      }
      if (pageProps?.batch || pageProps?.course || pageProps?.sheets) {
        window.dispatchEvent(new CustomEvent('ANGAAR_COURSE_CATALOG', {
          detail: { data: pageProps }
        }));
      }
    } catch(e) {}
  }
  checkNextData();
  setTimeout(checkNextData, 500);
  setTimeout(checkNextData, 1500);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkNextData);
  }

  // 2. Intercept fetch & XMLHttpRequest for real-time Telemetry & Grader Test Cases
  function handleInterceptedPayload(url, data, status) {
    try {
      if (!url || !data) return;
      const lowerUrl = url.toLowerCase();
      if (
        lowerUrl.includes('submit') || 
        lowerUrl.includes('submission') || 
        lowerUrl.includes('run_code') || 
        lowerUrl.includes('run-code') || 
        lowerUrl.includes('execute') || 
        lowerUrl.includes('verdict') || 
        lowerUrl.includes('my-submissions')
      ) {
        window.dispatchEvent(new CustomEvent('ANGAAR_NETWORK_RESULT', {
          detail: { url, data, status }
        }));
      } else if (url.includes('/api/django/dashboard/api/v1/question/')) {
        window.dispatchEvent(new CustomEvent('ANGAAR_QUESTION_DATA', {
          detail: { url, data }
        }));
      } else if (url.includes('potd') || url.includes('problem-of-the-day') || url.includes('daily-problem')) {
        window.dispatchEvent(new CustomEvent('ANGAAR_POTD_DATA', { detail: { url, data } }));
      } else if (url.includes('/contests/')) {
        if (url.includes('/leaderboard/')) {
          window.dispatchEvent(new CustomEvent('ANGAAR_CONTEST_LEADERBOARD_DATA', { detail: { url, data } }));
        } else {
          window.dispatchEvent(new CustomEvent('ANGAAR_CONTESTS_DATA', { detail: { url, data } }));
        }
      } else if (url.includes('/certificates/')) {
        window.dispatchEvent(new CustomEvent('ANGAAR_CERTIFICATES_DATA', { detail: { url, data } }));
      } else if (url.includes('/api/django/dashboard/api/v1/profile/')) {
        if (url.includes('/dsa-stats/')) {
          window.dispatchEvent(new CustomEvent('ANGAAR_DSA_STATS_DATA', { detail: { url, data } }));
        } else if (url.includes('/activity/')) {
          window.dispatchEvent(new CustomEvent('ANGAAR_ACTIVITY_DATA', { detail: { url, data } }));
        } else {
          window.dispatchEvent(new CustomEvent('ANGAAR_PROFILE_DATA', { detail: { url, data } }));
        }
      }
    } catch(e) {}
  }

  try {
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
      let rawUrl = '';
      try {
        rawUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const method = (args[1]?.method || (typeof args[0] === 'object' && args[0]?.method) || 'GET').toUpperCase();
        const lowerUrl = (rawUrl || '').toLowerCase();

        // Sanitize contest payload (force flags = 0, violations = [])
        if (args[1] && args[1].body) {
          args[1].body = sanitizeContestPayload(args[1].body);
        }

        // Suppress dedicated flag/violation endpoints completely
        if (
          lowerUrl.includes('/flag') || 
          lowerUrl.includes('/violation') || 
          lowerUrl.includes('/tab-switch') ||
          lowerUrl.includes('/tab_switch') ||
          lowerUrl.includes('/telemetry')
        ) {
          notifyFlagBlocked(`Suppressed server flag call: ${rawUrl}`);
          return new Response(JSON.stringify({ success: true, flags: 0, status: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // If a POST/PUT request is initiated to submit or run code, notify immediately
        if ((method === 'POST' || method === 'PUT') && (
          lowerUrl.includes('submit') || 
          lowerUrl.includes('run_code') || 
          lowerUrl.includes('run-code') || 
          lowerUrl.includes('execute')
        )) {
          window.dispatchEvent(new CustomEvent('ANGAAR_SUBMIT_DETECTED', {
            detail: { url: rawUrl, method }
          }));
        }
      } catch(err) {}

      const response = await origFetch.apply(this, args);
      try {
        const clone = response.clone();
        clone.json().then(data => {
          handleInterceptedPayload(rawUrl, data, response.status);
        }).catch(() => {});
      } catch(err) {}
      return response;
    };
  } catch(e) {}

  try {
    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._url = url;
      this._method = (method || 'GET').toUpperCase();
      try {
        const lowerUrl = (url || '').toLowerCase();
        if ((this._method === 'POST' || this._method === 'PUT') && (
          lowerUrl.includes('submit') || 
          lowerUrl.includes('run_code') || 
          lowerUrl.includes('run-code') || 
          lowerUrl.includes('execute')
        )) {
          window.dispatchEvent(new CustomEvent('ANGAAR_SUBMIT_DETECTED', {
            detail: { url: url, method: this._method }
          }));
        }
      } catch(e) {}
      return origXhrOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      if (args[0]) {
        args[0] = sanitizeContestPayload(args[0]);
      }
      this.addEventListener('load', function() {
        try {
          if (this.responseText) {
            const data = JSON.parse(this.responseText);
            handleInterceptedPayload(this._url, data, this.status);
          }
        } catch(e) {}
      });
      return origXhrSend.apply(this, args);
    };
  } catch(e) {}

  // 3. Handle Question Fetch Requests from Content Script (Native page origin privileges)
  window.addEventListener('ANGAAR_FETCH_QUESTION', async function(e) {
    const slug = typeof e.detail === 'string' ? e.detail : (e.detail?.slug || '');
    if (!slug) return;

    // Check __NEXT_DATA__ first
    try {
      const pageProps = window.__NEXT_DATA__?.props?.pageProps;
      if (pageProps?.problem && (pageProps.problem.slug === slug || String(pageProps.problem.id) === slug)) {
        window.dispatchEvent(new CustomEvent('ANGAAR_QUESTION_DATA', {
          detail: { url: 'next_data', data: pageProps }
        }));
        return;
      }
    } catch(err) {}

    // Perform native fetch inside MAIN world (same origin & cookies)
    try {
      const res = await window.fetch(`/api/django/dashboard/api/v1/question/${slug}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_QUESTION_DATA', {
          detail: { url: res.url, data }
        }));
      }
    } catch(err) {}
  });

  // 4. Handle Profile Fetch Requests from Content Script
  window.addEventListener('ANGAAR_FETCH_PROFILE', async function() {
    try {
      const res = await window.fetch('/api/django/dashboard/api/v1/profile/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_PROFILE_DATA', {
          detail: { url: res.url, data }
        }));
      }
    } catch(err) {}

    try {
      const resStats = await window.fetch('/api/django/dashboard/api/v1/profile/dsa-stats/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (resStats.ok) {
        const data = await resStats.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_DSA_STATS_DATA', {
          detail: { url: resStats.url, data }
        }));
      }
    } catch(err) {}

    try {
      const resAct = await window.fetch('/api/django/dashboard/api/v1/profile/activity/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (resAct.ok) {
        const data = await resAct.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_ACTIVITY_DATA', {
          detail: { url: data.url || '/api/django/dashboard/api/v1/profile/activity/', data }
        }));
      }
    } catch(err) {}
  });

  // 4B. Fetch Past Submissions for Current Question (Grader test cases extraction)
  window.addEventListener('ANGAAR_FETCH_MY_SUBMISSIONS', async function(e) {
    const qId = e.detail?.questionId;
    if (!qId) return;
    try {
      const res = await window.fetch(`/api/django/dashboard/api/v1/questions/${qId}/my-submissions/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_MY_SUBMISSIONS_DATA', {
          detail: { questionId: qId, data }
        }));
      }
    } catch(err) {}
  });

  // 4C. Fetch Questions for a Sheet
  window.addEventListener('ANGAAR_FETCH_SHEET_QUESTIONS', async function(e) {
    const sheetId = e.detail?.sheetId;
    if (!sheetId) return;
    try {
      const res = await window.fetch(`/api/django/dashboard/api/v1/sheet/${sheetId}/questions/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_SHEET_QUESTIONS_DATA', {
          detail: { sheetId, data }
        }));
      }
    } catch(err) {}
  });

  // 4D. Fetch Problem of the Day (POTD)
  window.addEventListener('ANGAAR_FETCH_POTD', async function() {
    try {
      const endpoints = [
        '/api/django/dashboard/api/v1/potd/',
        '/api/django/dashboard/api/v1/problem-of-the-day/',
        '/api/django/dashboard/api/v1/daily-problem/'
      ];
      for (const ep of endpoints) {
        try {
          const res = await window.fetch(ep, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && (data.problem || data.id || data.slug || data.title || data.status)) {
              window.dispatchEvent(new CustomEvent('ANGAAR_POTD_DATA', {
                detail: { url: ep, data, active: true }
              }));
              return;
            }
          }
        } catch(e) {}
      }
      // If no endpoint returned active problem, signal empty state
      window.dispatchEvent(new CustomEvent('ANGAAR_POTD_DATA', {
        detail: { active: false, message: 'No Problem of the Day today — check back tomorrow!' }
      }));
    } catch(err) {}
  });

  // 4E. Fetch Contests and My Stats
  window.addEventListener('ANGAAR_FETCH_CONTESTS', async function() {
    try {
      let contests = [];
      let stats = null;
      try {
        const res = await window.fetch('/api/django/dashboard/api/v1/contests/', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) contests = await res.json();
      } catch(e) {}

      try {
        const sRes = await window.fetch('/api/django/dashboard/api/v1/contests/my-stats/', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (sRes.ok) stats = await sRes.json();
      } catch(e) {}

      window.dispatchEvent(new CustomEvent('ANGAAR_CONTESTS_DATA', {
        detail: { contests, stats }
      }));
    } catch(err) {}
  });

  // 4F. Fetch Contest Leaderboard
  window.addEventListener('ANGAAR_FETCH_CONTEST_LEADERBOARD', async function(e) {
    const contestId = e.detail?.contestId;
    if (!contestId) return;
    try {
      const res = await window.fetch(`/api/django/dashboard/api/v1/contests/${contestId}/leaderboard/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_CONTEST_LEADERBOARD_DATA', {
          detail: { contestId, data }
        }));
      }
    } catch(err) {}
  });

  // 4G. Fetch Jovac Courses & Sheets
  window.addEventListener('ANGAAR_FETCH_JOVAC_SHEETS', async function() {
    try {
      const res = await window.fetch('/api/django/dashboard/api/v1/jovac/courses/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const courses = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_JOVAC_DATA', { detail: { courses } }));
      }
    } catch(err) {}
  });

  // 4H. Fetch Grader Driver Code
  window.addEventListener('ANGAAR_FETCH_DRIVER_CODE', async function(e) {
    const { questionId, languageId } = e.detail || {};
    if (!questionId) return;
    const lang = languageId || 1; // 1: C++, 2: Java, 3: Python
    try {
      const res = await window.fetch(`/practice/get-driver-code/${questionId}/${lang}/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json, text/plain, */*' }
      });
      if (res.ok) {
        let code = '';
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('json')) {
          const data = await res.json();
          code = data.driver_code || data.code || JSON.stringify(data, null, 2);
        } else {
          code = await res.text();
        }
        window.dispatchEvent(new CustomEvent('ANGAAR_DRIVER_CODE_DATA', {
          detail: { questionId, languageId: lang, code }
        }));
      }
    } catch(err) {}
  });

  // 4I. Unlock Problem Hint
  window.addEventListener('ANGAAR_UNLOCK_HINT', async function(e) {
    const questionId = e.detail?.questionId;
    if (!questionId) return;
    try {
      const res = await window.fetch(`/practice/unlock-hint/${questionId}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_HINT_UNLOCKED', {
          detail: { questionId, hint: data.hint || data.message || 'Hint Unlocked!' }
        }));
      }
    } catch(err) {}
  });

  // 4J. Fetch Certificates
  window.addEventListener('ANGAAR_FETCH_CERTIFICATES', async function() {
    try {
      const res = await window.fetch('/api/django/dashboard/api/v1/certificates/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('ANGAAR_CERTIFICATES_DATA', { detail: { data } }));
      }
    } catch(err) {}
  });

  // 5. Monaco Editor Code Insertion
  window.addEventListener('ANGAAR_INJECT_CODE', function(e) {
    const code = e.detail;
    if (!code) return;

    let success = false;
    let method = 'none';

    // A. Monaco Editor Instances (Active / Visible on screen)
    try {
      const editors = window.monaco?.editor?.getEditors?.() || [];
      if (editors.length > 0) {
        let targetEditor = editors.find(ed => {
          try {
            const dom = ed.getContainerDomNode ? ed.getContainerDomNode() : null;
            return dom && (dom.offsetWidth > 0 || dom.offsetHeight > 0 || dom.offsetParent !== null);
          } catch(err) { return false; }
        });
        if (!targetEditor) targetEditor = editors[editors.length - 1];

        if (targetEditor) {
          const model = targetEditor.getModel?.();
          if (model) {
            if (typeof targetEditor.executeEdits === 'function') {
              targetEditor.executeEdits('angaar-toolkit', [
                { range: model.getFullModelRange(), text: code }
              ]);
              targetEditor.pushUndoStop?.();
            } else {
              model.setValue(code);
            }
            targetEditor.focus?.();
            success = true;
            method = 'monaco_editor_instance';
          } else if (typeof targetEditor.setValue === 'function') {
            targetEditor.setValue(code);
            targetEditor.focus?.();
            success = true;
            method = 'monaco_editor_setvalue';
          }
        }
      }
    } catch(err) {
      console.warn('Monaco getEditors injection error:', err);
    }

    // B. Monaco Models (Latest active model)
    if (!success) {
      try {
        const models = window.monaco?.editor?.getModels?.() || [];
        if (models.length > 0) {
          const codeModels = models.filter(m => {
            const uri = m.uri ? m.uri.toString() : '';
            return !uri.includes('schema') && !uri.includes('diff');
          });
          const targetModel = codeModels.length > 0 ? codeModels[codeModels.length - 1] : models[models.length - 1];
          if (targetModel) {
            targetModel.setValue(code);
            success = true;
            method = 'monaco_latest_model';
          }
        }
      } catch(err) {
        console.warn('Monaco getModels injection error:', err);
      }
    }

    // C. Fallback: Hidden Monaco inputarea
    if (!success) {
      try {
        const textarea = document.querySelector('.monaco-editor textarea.inputarea') ||
                         document.querySelector('.monaco-editor textarea') ||
                         document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          try {
            const dt = new DataTransfer();
            dt.setData('text/plain', code);
            const pasteEvent = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: dt
            });
            textarea.dispatchEvent(pasteEvent);
          } catch(e) {}

          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, code);
          success = true;
          method = 'dom_textarea_fallback';
        }
      } catch(err) {
        console.warn('DOM textarea injection error:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('ANGAAR_INJECT_RESULT', {
      detail: { success: success, method: method }
    }));
  });

  // 6. Monaco Editor Code Extraction (For GitHub Auto-Sync)
  window.addEventListener('ANGAAR_GET_CODE_REQUEST', function(e) {
    let code = '';
    let lang = 'java';

    try {
      const editors = window.monaco?.editor?.getEditors?.() || [];
      if (editors.length > 0) {
        let activeEditor = editors.find(ed => {
          try {
            const dom = ed.getContainerDomNode ? ed.getContainerDomNode() : null;
            return dom && (dom.offsetWidth > 0 || dom.offsetHeight > 0 || dom.offsetParent !== null);
          } catch(err) { return false; }
        });
        if (!activeEditor) activeEditor = editors[editors.length - 1];

        if (activeEditor) {
          code = activeEditor.getValue?.() || '';
          const model = activeEditor.getModel?.();
          if (model) {
            lang = model.getLanguageId?.() || 'java';
          }
        }
      }

      if (!code) {
        const models = window.monaco?.editor?.getModels?.() || [];
        if (models.length > 0) {
          const codeModels = models.filter(m => {
            const uri = m.uri ? m.uri.toString() : '';
            return !uri.includes('schema') && !uri.includes('diff');
          });
          const target = codeModels.length > 0 ? codeModels[codeModels.length - 1] : models[models.length - 1];
          if (target) {
            code = target.getValue?.() || '';
            lang = target.getLanguageId?.() || 'java';
          }
        }
      }
    } catch(err) {
      console.warn('Monaco getCode error:', err);
    }

    // Fallback: Read from DOM lines if Monaco API returned empty
    if (!code) {
      try {
        const viewLines = document.querySelector('.monaco-editor .view-lines');
        if (viewLines) {
          code = viewLines.innerText;
        }
      } catch(e) {}
    }

    window.dispatchEvent(new CustomEvent('ANGAAR_GET_CODE_RESPONSE', {
      detail: { code, lang, requestId: e.detail?.requestId }
    }));
  });

})();
