// Angaar Pro - Main World Bridge Script
// Runs directly inside the website execution context (MAIN world)
// Has direct access to window.monaco, window.__NEXT_DATA__, and native window.fetch
(function() {
  'use strict';

  console.log('%cAngaar Main World Bridge Active', 'color: #f97316; font-size: 12px; font-weight: bold;');

  window.__ANGAAR_MAIN_BRIDGE_READY__ = true;
  window.dispatchEvent(new CustomEvent('ANGAAR_MAIN_WORLD_READY'));

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

  // 2. Intercept fetch & XMLHttpRequest for real-time Telemetry & Grader Test Cases
  function handleInterceptedPayload(url, data, status) {
    try {
      if (!url || !data) return;
      if (url.includes('run_code') || url.includes('submission_result') || url.includes('submit_code') || url.includes('execute_code') || url.includes('my-submissions')) {
        window.dispatchEvent(new CustomEvent('ANGAAR_NETWORK_RESULT', {
          detail: { url, data, status }
        }));
      } else if (url.includes('/api/django/dashboard/api/v1/question/')) {
        window.dispatchEvent(new CustomEvent('ANGAAR_QUESTION_DATA', {
          detail: { url, data }
        }));
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
      const response = await origFetch.apply(this, args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const clone = response.clone();
        clone.json().then(data => {
          handleInterceptedPayload(url, data, response.status);
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
      return origXhrOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(...args) {
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
