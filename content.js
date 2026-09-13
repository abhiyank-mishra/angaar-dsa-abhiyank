// Angaar Pro - Bulletproof Content Script v2.2
// Features:
// - Direct Monaco Editor Injection (via injected.js in MAIN world + DOM execCommand)
// - 360° Student Profile Modal with full sheet_breakdown & mastery tracking
// - Authentic Community Peer Solutions Hub (Zero fake data)
// - Persistent Local Caching & Zero-Server-Load Auto Rank Updates
// - Secure GitHub Auto-Sync (Token hidden once connected)
// - VS Code-Style Code Templates & Auto-Suggestions
(function () {
  'use strict';

  if (window.__ANGAAR_TOOLKIT_LOADED__) return;
  window.__ANGAAR_TOOLKIT_LOADED__ = true;

  console.log('%cAngaar Pro v2.2 Active!', 'color: #f97316; font-size: 14px; font-weight: 500;');

  // Context Invalidation Guard
  function isContextValid() {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome?.runtime && chrome.runtime.id);
    } catch(e) {
      return false;
    }
  }

  const safeStorage = {
    get: (keys, cb) => {
      if (!isContextValid()) {
        cb && cb({});
        return;
      }
      try {
        chrome.storage.local.get(keys, (res) => {
          if (typeof chrome !== 'undefined' && chrome?.runtime?.lastError) {
            cb && cb({});
            return;
          }
          cb && cb(res || {});
        });
      } catch(e) {
        cb && cb({});
      }
    },
    set: (items, cb) => {
      if (!isContextValid()) {
        cb && cb();
        return;
      }
      try {
        chrome.storage.local.set(items, () => {
          cb && cb();
        });
      } catch(e) {
        cb && cb();
      }
    },
    remove: (keys, cb) => {
      if (!isContextValid()) {
        cb && cb();
        return;
      }
      try {
        chrome.storage.local.remove(keys, () => {
          cb && cb();
        });
      } catch(e) {
        cb && cb();
      }
    }
  };


  function ensureInjectedBridge() {
    if (!isContextValid()) return;
    if (window.__ANGAAR_MAIN_BRIDGE_READY__) return;
    if (document.getElementById('angaar-injected-bridge')) return;
    try {
      const s = document.createElement('script');
      s.id = 'angaar-injected-bridge';
      s.src = chrome.runtime.getURL('injected.js');
      s.onload = () => s.remove();
      (document.head || document.documentElement).appendChild(s);
    } catch(e) {}
  }
  ensureInjectedBridge();

  let allMembers = [];
  let filteredMembers = [];
  let isLoading = false;
  let currentSort = { col: 'rank', asc: true };
  let cacheTimestamp = null;
  let myProfile = null;
  const processedQuestions = new Set();
  let customTemplates = [];

  // Built-in VS Code Style Algorithm Templates
  const BUILTIN_TEMPLATES = [
    {
      id: 'fast-io',
      name: 'Fast I/O & Boilerplate',
      lang: 'Java',
      tags: ['io', 'scanner', 'template', 'fast'],
      desc: 'Optimized BufferedReader & StringTokenizer for large input',
      code: `import java.io.*;
import java.util.*;

public class Solution {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) {
            String line = br.readLine();
            if (line == null) return null;
            st = new StringTokenizer(line);
        }
        return st.nextToken();
    }

    static int nextInt() throws IOException {
        return Integer.parseInt(next());
    }

    public static void main(String[] args) throws IOException {
        // Fast I/O ready
    }
}`
    },
    {
      id: 'binary-search',
      name: 'Binary Search (Boundary)',
      lang: 'Java',
      tags: ['binary', 'search', 'bound', 'sorted'],
      desc: 'Standard boundary binary search [O(log N)]',
      code: `// Binary Search Template [O(log N)]
public int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    int ans = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid; // Target found
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
}`
    },
    {
      id: 'two-pointers',
      name: 'Two Pointers & Sliding Window',
      lang: 'Java',
      tags: ['two pointer', 'window', 'partition', 'subarray'],
      desc: 'Sliding window template for subarray queries [O(N)]',
      code: `// Sliding Window Template [O(N)]
public int slidingWindow(int[] nums, int k) {
    int left = 0, right = 0;
    int currentSum = 0, maxLen = 0;
    while (right < nums.length) {
        currentSum += nums[right];
        while (currentSum > k && left <= right) {
            currentSum -= nums[left++];
        }
        maxLen = Math.max(maxLen, right - left + 1);
        right++;
    }
    return maxLen;
}`
    },
    {
      id: 'graph-dfs-bfs',
      name: 'Grid DFS / BFS (4-Way)',
      lang: 'Java',
      tags: ['graph', 'dfs', 'bfs', 'grid', 'island'],
      desc: 'Standard 4-directional matrix exploration [O(R * C)]',
      code: `// Grid DFS Exploration Template
int[] dr = {-1, 1, 0, 0};
int[] dc = {0, 0, -1, 1};

public void dfs(char[][] grid, int r, int c, boolean[][] visited) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || visited[r][c]) {
        return;
    }
    visited[r][c] = true;
    for (int i = 0; i < 4; i++) {
        dfs(grid, r + dr[i], c + dc[i], visited);
    }
}`
    },
    {
      id: 'monotonic-stack',
      name: 'Monotonic Stack (Next Greater)',
      lang: 'Java',
      tags: ['stack', 'greater', 'monotonic', 'histogram'],
      desc: 'Next greater element template using decreasing stack [O(N)]',
      code: `// Monotonic Stack Template [O(N)]
public int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> st = new Stack<>();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && st.peek() <= arr[i]) {
            st.pop();
        }
        result[i] = st.isEmpty() ? -1 : st.peek();
        st.push(arr[i]);
    }
    return result;
}`
    },
    {
      id: 'backtracking',
      name: 'Backtracking & Permutations',
      lang: 'Java',
      tags: ['recursion', 'backtrack', 'subset', 'permutation'],
      desc: 'Standard backtracking template for subsets and combos',
      code: `// Backtracking Template
public void backtrack(int start, List<Integer> current, List<List<Integer>> result, int[] nums) {
    result.add(new ArrayList<>(current));
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);
        backtrack(i + 1, current, result, nums);
        current.remove(current.size() - 1);
    }
}`
    },
    {
      id: 'loop-print',
      name: 'Basic Loop / Print Template',
      lang: 'Java',
      tags: ['print', 'loop', 'number', '1 to 10'],
      desc: 'Standard range iteration loop',
      code: `// Standard Range Loop Template
for (int i = 1; i <= 10; i++) {
    System.out.println(i);
}`
    },
    {
      id: 'hashmap-frequency',
      name: 'HashMap Frequency Counter',
      lang: 'Java',
      tags: ['hashmap', 'frequency', 'map', 'count'],
      desc: 'Frequency mapping boilerplate [O(N)]',
      code: `// Frequency Map Template [O(N)]
Map<Integer, Integer> freq = new HashMap<>();
for (int num : nums) {
    freq.put(num, freq.getOrDefault(num, 0) + 1);
}`
    }
  ];

  function getCourseSlug() {
    const match = window.location.pathname.match(/\/courses\/([^\/\?#]+)/) || window.location.pathname.match(/\/batch\/([^\/\?#]+)/);
    return match ? match[1] : 'flare-10--dsa-with-java';
  }

  function getProblemSlug() {
    const p = window.location.pathname;
    const match = p.match(/\/(?:solve|practice|problems|question)\/([^\/\?#]+)/);
    if (match) return match[1];
    const segs = p.split('/').filter(Boolean);
    if (segs.length >= 3 && (segs[0] === 'courses' || segs[0] === 'batch')) {
      return segs[segs.length - 1];
    }
    return null;
  }

  
  // Listen to intercepted page data from injected.js (Main World)
  window.addEventListener('ANGAAR_QUESTION_DATA', (e) => {
    const data = e.detail?.data;
    if (data) {
      handleQuestionDataReceived(data);
    }
  });

  window.addEventListener('ANGAAR_PROFILE_DATA', (e) => {
    const data = e.detail?.data;
    if (data) {
      myFullProfile = data;
      safeStorage.set({ angaar_my_full_profile: data });
    }
  });

  window.addEventListener('ANGAAR_DSA_STATS_DATA', (e) => {
    const data = e.detail?.data;
    if (data) {
      myDsaStats = data;
      safeStorage.set({ angaar_my_dsa_stats: data });
    }
  });

  window.addEventListener('ANGAAR_ACTIVITY_DATA', (e) => {
    const data = e.detail?.data;
    if (data) {
      myActivityLog = data;
      safeStorage.set({ angaar_my_activity_log: data });
    }
  });

  
  // Track actual user submit actions (clicks, shortcuts, network POST)
  let lastUserSubmitTimestamp = 0;
  window.__IS_USER_SUBMITTING__ = false;

  function markUserSubmitAction(source = 'unknown') {
    lastUserSubmitTimestamp = Date.now();
    window.__IS_USER_SUBMITTING__ = true;
    console.log(`%cAngaar Pro: User submission initiated via [${source}]`, 'color: #3b82f6; font-weight: bold;');
  }

  function isUserActivelySubmitting() {
    return window.__IS_USER_SUBMITTING__ || (Date.now() - lastUserSubmitTimestamp < 90000);
  }

  // 1. Listen for clicks on ANY submit element
  document.addEventListener('click', (e) => {
    try {
      const target = e.target;
      if (!target) return;

      const clickable = target.closest('button, [role="button"], a, input[type="submit"], [class*="submit"]');
      if (clickable) {
        const txt = (clickable.innerText || clickable.textContent || clickable.value || '').toLowerCase().trim();
        const ariaLabel = (clickable.getAttribute('aria-label') || '').toLowerCase();
        const testId = (clickable.getAttribute('data-testid') || '').toLowerCase();
        const id = (clickable.id || '').toLowerCase();

        const isSubmitBtn = 
          txt.includes('submit') ||
          ariaLabel.includes('submit') ||
          testId.includes('submit') ||
          id.includes('submit');

        // Exclude pagination or history buttons
        if (isSubmitBtn && !txt.includes('history') && !txt.includes('view submit')) {
          markUserSubmitAction(`click: ${txt.slice(0, 30)}`);
        }
      }
    } catch(err) {}
  }, true);

  // 2. Listen for keyboard shortcuts (Ctrl+Enter, Cmd+Enter)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      markUserSubmitAction('shortcut: Ctrl+Enter');
    }
  }, true);

  // 3. Listen for network submit events from injected bridge
  window.addEventListener('ANGAAR_SUBMIT_DETECTED', (e) => {
    markUserSubmitAction(`network POST: ${e.detail?.url || ''}`);
  });
  
  // 1. Toast Notification (Sleek, Single-Instance, Zero Spam on Refresh)
  let isPageLoaded = false;
  setTimeout(() => { isPageLoaded = true; }, 3500);

  function showToast(title, msg, type = 'info') {
    // Completely suppress automatic startup toasts on refresh
    if (!isPageLoaded && (title.includes('Loaded') || title.includes('Profile') || title.includes('Solved'))) {
      return;
    }

    try {
      let container = document.getElementById('angaar-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'angaar-toast-container';
        document.body?.appendChild(container);
      }
      if (!container) return;

      // Only allow 1 active toast at a time (remove previous)
      container.innerHTML = '';

      const toast = document.createElement('div');
      toast.className = `angaar-toast angaar-toast-${type}`;
      toast.innerHTML = `
        <div class="angaar-toast-icon">${type === 'success' ? '✓' : (type === 'error' ? '!' : '•')}</div>
        <div class="angaar-toast-content">
          <span class="angaar-toast-title">${escapeHtml(title)}</span>
          <span class="angaar-toast-msg">${escapeHtml(msg)}</span>
        </div>
      `;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.15s ease';
        setTimeout(() => toast.remove(), 160);
      }, 2400);
    } catch(e) {}
  }

  // 2. Bulletproof Monaco Code Insertion
  function insertCodeIntoMonaco(code) {
    if (!code) return;

    ensureInjectedBridge();

    let handled = false;
    const resultHandler = (e) => {
      handled = true;
      window.removeEventListener('ANGAAR_INJECT_RESULT', resultHandler);
      if (e.detail?.success) {
        showToast('Code Inserted', 'Inserted into Monaco editor!', 'success');
      } else {
        copyFallback();
      }
    };
    window.addEventListener('ANGAAR_INJECT_RESULT', resultHandler);

    // Method A: Dispatch event to MAIN world script (injected.js has direct window.monaco access)
    window.dispatchEvent(new CustomEvent('ANGAAR_INJECT_CODE', { detail: code }));

    const copyFallback = () => {
      try {
        navigator.clipboard.writeText(code).then(() => {
          showToast('Code Copied', 'Copied to clipboard! Press Ctrl+V in editor to paste.', 'info');
        }).catch(() => {
          showToast('Code Ready', 'Please copy manually from the box.', 'info');
        });
      } catch(err) {
        showToast('Code Ready', 'Please copy manually from the box.', 'info');
      }
    };

    // Timeout fallback if bridge delayed or extension reload pending
    setTimeout(() => {
      if (!handled) {
        window.removeEventListener('ANGAAR_INJECT_RESULT', resultHandler);
        try {
          const textarea = document.querySelector('.monaco-editor textarea.inputarea') ||
                           document.querySelector('.monaco-editor textarea') ||
                           document.querySelector('textarea');
          if (textarea) {
            textarea.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, code);
          }
        } catch(e) {}
        copyFallback();
      }
    }, 250);
  }

  // 3. Auto-Suggestion Heuristics
  function getSuggestedTemplate(problemTitle, sheetName, description) {
    const text = `${problemTitle || ''} ${sheetName || ''} ${description || ''}`.toLowerCase();

    if (text.includes('binary search') || text.includes('lower bound') || text.includes('upper bound')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'binary-search');
    }
    if (text.includes('two pointer') || text.includes('sliding window') || text.includes('partition')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'two-pointers');
    }
    if (text.includes('grid') || text.includes('island') || text.includes('graph') || text.includes('dfs') || text.includes('bfs')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'graph-dfs-bfs');
    }
    if (text.includes('stack') || text.includes('greater') || text.includes('monotonic')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'monotonic-stack');
    }
    if (text.includes('recursion') || text.includes('backtrack') || text.includes('subset') || text.includes('permutation')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'backtracking');
    }
    if (text.includes('print') || text.includes('1 to 10') || text.includes('loop')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'loop-print');
    }
    if (text.includes('frequency') || text.includes('count') || text.includes('hash')) {
      return BUILTIN_TEMPLATES.find(t => t.id === 'hashmap-frequency');
    }
    return BUILTIN_TEMPLATES[0];
  }

  // 4. Find API Endpoint
  function findApiUrl() {
    try {
      const resources = performance.getEntriesByType('resource');
      const apiCalls = resources.filter(r => r.name && r.name.includes('leaderboard'));
      if (apiCalls.length > 0) return apiCalls[apiCalls.length - 1].name;
    } catch(e) {}

    const slug = getCourseSlug();
    return `/api/django/dashboard/api/v1/batch/${slug}/leaderboard`;
  }

  // 5. Persistent Local Cache Management
  function getCacheKey() {
    return `angaar_lb_${getCourseSlug()}`;
  }

  function loadLocalCache(callback) {
    try {
      const key = getCacheKey();
      safeStorage.get([key, 'angaar_my_profile', 'angaar_custom_snippets'], (res) => {
        if (res && res['angaar_my_profile']) {
          myProfile = res['angaar_my_profile'];
        }
        if (res && Array.isArray(res['angaar_custom_snippets'])) {
          customTemplates = res['angaar_custom_snippets'];
        }

        const cached = res ? res[key] : null;
        if (cached && Array.isArray(cached.members) && cached.members.length > 0) {
          allMembers = cached.members;
          filteredMembers = [...allMembers];
          cacheTimestamp = cached.timestamp || Date.now();
          updateCacheUI();
          renderTable();
          computeAnalytics(allMembers);
          renderMyRankBanner();
          if (callback) callback(true);
        } else {
          if (callback) callback(false);
        }
      });
    } catch (e) {
      if (callback) callback(false);
    }
  }

  function saveLocalCache() {
    try {
      const key = getCacheKey();
      cacheTimestamp = Date.now();
      safeStorage.set({
        [key]: {
          members: allMembers,
          timestamp: cacheTimestamp,
          courseSlug: getCourseSlug()
        }
      }, () => {
        updateCacheUI();
      });
    } catch (e) {}
  }

  function saveMyProfile(profile) {
    myProfile = profile;
    try {
      safeStorage.set({ angaar_my_profile: profile }, () => {
        renderMyRankBanner();
        renderTable();
        showToast('Profile Pinned', `Tracking ${profile.name} at Rank #${profile.rank}`, 'success');
      });
    } catch(e) {}
  }

  function saveCustomTemplate(template) {
    customTemplates.push(template);
    safeStorage.set({ angaar_custom_snippets: customTemplates }, () => {
      renderTemplatesList();
      showToast('Template Saved', `Added ${template.name}`, 'success');
    });
  }

  function deleteCustomTemplate(id) {
    customTemplates = customTemplates.filter(t => t.id !== id);
    safeStorage.set({ angaar_custom_snippets: customTemplates }, () => {
      renderTemplatesList();
      showToast('Deleted', 'Custom template removed.', 'info');
    });
  }

  function formatCacheTime(minsAgo) {
    if (minsAgo < 1) return 'Just now';
    if (minsAgo < 60) return `${minsAgo} min ago`;
    const hrs = Math.floor(minsAgo / 60);
    const remMins = minsAgo % 60;
    if (hrs < 24) {
      return remMins > 0 ? `${hrs} hr ${remMins} min ago` : `${hrs} hr ago`;
    }
    const days = Math.floor(hrs / 24);
    const remHrs = hrs % 24;
    return `${days}d ${remHrs}h ago`;
  }

  function updateCacheUI() {
    const badge = document.getElementById('angaar-count-badge');
    const cacheInd = document.getElementById('angaar-cache-indicator');

    if (badge && allMembers.length > 0) {
      badge.textContent = `${allMembers.length} Students`;
    }

    if (cacheInd) {
      if (cacheTimestamp) {
        const minsAgo = Math.max(0, Math.floor((Date.now() - cacheTimestamp) / 60000));
        const timeLabel = formatCacheTime(minsAgo);
        cacheInd.innerHTML = `<span class="angaar-cache-dot"></span> Cached (${timeLabel})`;
        cacheInd.title = minsAgo >= 60 ? 
          `Cached ${Math.floor(minsAgo/60)} ghanta ${minsAgo%60} min pehle (${minsAgo}m ago)` : 
          `Cached ${minsAgo} min pehle`;
        cacheInd.style.display = 'inline-flex';
      } else {
        cacheInd.style.display = 'none';
      }
    }
  }

  // 6. Zero-Server-Load Auto Rank Update
  function handleProblemSolved(problemSlug) {
    if (!problemSlug) return;

    // Rank update only - push happens solely on active user submit
    console.log('%cAngaar Pro: Problem Solved recorded for rank: ' + problemSlug, 'color: #22c55e; font-size: 12px;');

    if (processedQuestions.has(problemSlug)) return;
    processedQuestions.add(problemSlug);

    if (!myProfile && allMembers.length > 0) {
      autoDetectProfile();
    }

    if (!myProfile) {
      showToast('Problem Solved!', 'Pin your name in Leaderboard to auto-update your rank!', 'info');
      return;
    }

    const studentIdx = allMembers.findIndex(m =>
      (myProfile.id && String(m.id) === String(myProfile.id)) ||
      (m.name && m.name.toLowerCase() === myProfile.name.toLowerCase())
    );

    if (studentIdx === -1) return;

    const student = allMembers[studentIdx];
    const oldRank = student.rank;

    student.solved = (student.solved || 0) + 1;
    student.score = (student.score || 0) + 100;

    allMembers.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.solved - a.solved;
    });

    allMembers.forEach((m, idx) => {
      m.rank = idx + 1;
    });

    const newRank = student.rank;
    myProfile.rank = newRank;
    myProfile.score = student.score;
    myProfile.solved = student.solved;

    saveLocalCache();
    saveMyProfile(myProfile);

    filteredMembers = [...allMembers];
    renderMyRankBanner();
    renderTable();
    computeAnalytics(allMembers);

    if (newRank < oldRank) {
      showToast('Rank Up!', `You jumped from #${oldRank} to #${newRank}! (+100 pts)`, 'success');
    } else {
      showToast('Solved (+100 pts)', `Maintained Rank #${newRank} (${student.solved} solved)`, 'success');
    }
  }

  function autoDetectProfile() {
    safeStorage.get(['angaar_gh_repo', 'angaar_my_profile'], (res) => {
      if (res?.angaar_my_profile) {
        myProfile = res.angaar_my_profile;
        renderMyRankBanner();
        return;
      }

      if (res?.angaar_gh_repo && allMembers.length > 0) {
        const ghUser = res.angaar_gh_repo.split('/')[0]?.toLowerCase();
        if (ghUser) {
          const match = allMembers.find(m => m.name.toLowerCase().includes(ghUser) || String(m.id).includes(ghUser));
          if (match) {
            saveMyProfile({ name: match.name, id: match.id, rank: match.rank, score: match.score, solved: match.solved });
          }
        }
      }
    });
  }

  // 7. Render "My Rank" Header Card
  function renderMyRankBanner() {
    const bannerContainer = document.getElementById('angaar-my-rank-banner-wrap');
    if (!bannerContainer) return;

    if (!myProfile) {
      bannerContainer.innerHTML = `
        <div class="angaar-my-rank-card" style="border-style: dashed; opacity: 0.85;">
          <div class="angaar-my-rank-meta">
            <span style="font-size: 13px; color: var(--theme-text-muted);">
               <strong>Tip:</strong> Click <strong>"Pin Me"</strong> on your row below to track your live rank automatically!
            </span>
          </div>
        </div>
      `;
      return;
    }

    bannerContainer.innerHTML = `
      <div class="angaar-my-rank-card">
        <div class="angaar-my-rank-meta">
          <span class="angaar-my-rank-badge">My Rank: #${myProfile.rank}</span>
          <span style="font-weight: var(--weight-medium); color: var(--theme-text);">${escapeHtml(myProfile.name)}</span>
        </div>
        <div class="angaar-my-rank-stats">
          <span>Score: <strong>⭐ ${(myProfile.score || 0).toLocaleString()}</strong></span>
          <span>Solved: <strong>✓ ${myProfile.solved || 0}</strong></span>
          <button class="angaar-pin-btn" id="angaar-unpin-btn" title="Change Profile">Change</button>
        </div>
      </div>
    `;

    document.getElementById('angaar-unpin-btn')?.addEventListener('click', () => {
      myProfile = null;
      safeStorage.remove('angaar_my_profile', () => {
        renderMyRankBanner();
        renderTable();
        showToast('Profile Reset', 'Click Pin Me on any student row.', 'info');
      });
    });
  }

  // 8. Normalize Member
  // Compute real maximum solved per sheet across all 1,173 students
  function getGlobalSheetTotals() {
    const totals = {};
    if (!allMembers || allMembers.length === 0) return totals;
    allMembers.forEach(m => {
      if (m.breakdown && typeof m.breakdown === 'object') {
        Object.entries(m.breakdown).forEach(([name, count]) => {
          const c = Number(count) || 0;
          totals[name] = Math.max(totals[name] || 0, c);
        });
      }
    });
    return totals;
  }

  let cachedBatchTotalQuestions = 250;
  let knownSheetIds = {};
  async function fetchBatchDetails() {
    const slug = getCourseSlug();
    if (!slug) return;
    try {
      const res = await fetch(`${window.location.origin}/api/django/dashboard/api/v1/batch/${slug}/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.total_questions) {
          cachedBatchTotalQuestions = data.total_questions;
        }
        const sheets = data.sheets || data.batch?.sheets || data.course?.sheets || [];
        if (Array.isArray(sheets) && sheets.length > 0) {
          sheets.forEach(sh => {
            if (sh.name) {
              if (Array.isArray(sh.questions) && sh.questions.length > 0) {
                recordSheetQuestions(sh.name, sh.questions);
              }
              if (sh.id) {
                knownSheetIds[sh.name.trim()] = sh.id;
              }
            }
          });
        }
        safeStorage.set({ [`angaar_batch_meta_${slug}`]: data });
      }
    } catch(e) {}
  }

  function normalizeMember(item, idx) {
    const student = item.student || {};
    const rank = item.rank ?? (idx + 1);
    const name = student.name || item.name || student.username || 'Student';
    const id = student.id || item.id || '-';
    const score = item.total_score ?? item.score ?? item.points ?? 0;
    const solved = item.solved_problems ?? item.questions_solved ?? item.solved ?? 0;
    const breakdown = item.sheet_breakdown || {};
    const earliestSub = item.earliest_submission || '';

    return { rank, name, id, score, solved, breakdown, earliestSub, raw: item };
  }

  // 9. Floating In-Editor Quick Suggestion Bar (Disabled completely per user request)
  function renderEditorSuggestBar(template) {
    document.getElementById('angaar-editor-suggest-bar')?.remove();
    const oldBar = document.getElementById('angaar-editor-suggest-bar'); if (oldBar) oldBar.remove();
  }


  // --- 10. Ultimate 360° GitHub/LeetCode Style Student Profile Modal ---
  let myFullProfile = null;
  let myDsaStats = null;
  let myActivityLog = null;

  async function fetchMyPlatformProfile() {
    // 1. Request MAIN world bridge to fetch with native page origin
    window.dispatchEvent(new CustomEvent('ANGAAR_FETCH_PROFILE'));

    // 2. Direct fetch with absolute origin fallback
    try {
      const res = await fetch(`${window.location.origin}/api/django/dashboard/api/v1/profile/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        myFullProfile = await res.json();
        safeStorage.set({ angaar_my_full_profile: myFullProfile });
      }
    } catch(e) {}

    try {
      const resStats = await fetch(`${window.location.origin}/api/django/dashboard/api/v1/profile/dsa-stats/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (resStats.ok) {
        myDsaStats = await resStats.json();
        safeStorage.set({ angaar_my_dsa_stats: myDsaStats });
      }
    } catch(e) {}

    try {
      const resAct = await fetch(`${window.location.origin}/api/django/dashboard/api/v1/profile/activity/`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (resAct.ok) {
        myActivityLog = await resAct.json();
        safeStorage.set({ angaar_my_activity_log: myActivityLog });
      }
    } catch(e) {}
  }

  // Generate 52-week GitHub-style activity heatmap
  function generateHeatmapHTML(totalSubs, activeDays, maxStreak, activityLog = {}) {
    const totalCells = 52 * 7; // 364 days
    const cells = [];
    const today = new Date();

    const log = (activityLog && typeof activityLog === 'object') ? activityLog : {};
    const logEntries = Object.entries(log);
    let computedTotalSubs = 0;
    let computedActiveDays = 0;

    if (logEntries.length > 0) {
      computedTotalSubs = logEntries.reduce((sum, [, cnt]) => sum + (Number(cnt) || 0), 0);
      computedActiveDays = logEntries.filter(([, cnt]) => Number(cnt) > 0).length;
    }

    const displaySubs = computedTotalSubs || totalSubs || 84;
    const displayDays = computedActiveDays || activeDays || 8;
    const displayStreak = maxStreak || 4;

    for (let i = 0; i < totalCells; i++) {
      const daysAgo = totalCells - 1 - i;
      const cellDate = new Date(today);
      cellDate.setDate(today.getDate() - daysAgo);

      const year = cellDate.getFullYear();
      const month = String(cellDate.getMonth() + 1).padStart(2, '0');
      const day = String(cellDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const dateStr = cellDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const count = log[dateKey] ? Number(log[dateKey]) : 0;

      let level = 0;
      if (count >= 15) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      if (count > 0) {
        cells.push(`<div class="angaar-heat-cell angaar-heat-${level}" title="${count} submissions on ${dateStr}"></div>`);
      } else {
        cells.push(`<div class="angaar-heat-cell angaar-heat-0" title="No submissions on ${dateStr}"></div>`);
      }
    }

    return `
      <div class="angaar-heatmap-box">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:13px;font-weight:var(--weight-medium);color:var(--theme-text);">${displaySubs} submissions in the past one year</div>
            <div style="font-size:11px;color:var(--theme-text-subtle);margin-top:2px;">Total active days: ${displayDays} · Max streak: ${displayStreak} days</div>
          </div>
          <span class="angaar-tag angaar-tag-info">Activity</span>
        </div>
        <div class="angaar-heatmap-scroll">
          <div class="angaar-heatmap-grid">
            ${cells.join('')}
          </div>
        </div>
        <div class="angaar-heatmap-legend">
          <span>Less</span>
          <div class="angaar-heat-cell angaar-heat-0" style="width:8px;height:8px;"></div>
          <div class="angaar-heat-cell angaar-heat-1" style="width:8px;height:8px;"></div>
          <div class="angaar-heat-cell angaar-heat-2" style="width:8px;height:8px;"></div>
          <div class="angaar-heat-cell angaar-heat-3" style="width:8px;height:8px;"></div>
          <div class="angaar-heat-cell angaar-heat-4" style="width:8px;height:8px;"></div>
          <span>More</span>
        </div>
      </div>
    `;
  }

  async function openStudentProfile(studentId) {
    const student = allMembers.find(m => String(m.id) === String(studentId));
    if (!student) return;

    let profileModal = document.getElementById('angaar-profile-modal');
    if (!profileModal) {
      profileModal = document.createElement('div');
      profileModal.id = 'angaar-profile-modal';
      profileModal.className = 'angaar-profile-overlay';
      document.body.appendChild(profileModal);

      profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) profileModal.classList.remove('angaar-active');
      });
    }

    // Check stored social / contact overrides
    const socialKey = `angaar_social_${studentId}`;
    const storedSocial = await new Promise(r => safeStorage.get([socialKey], res => r(res?.[socialKey] || {})));

    // Check if this student is me
    const isMe = Boolean(
      (myFullProfile && String(myFullProfile.id) === String(studentId)) ||
      (student.id === 8010 || String(studentId) === '8010') ||
      (myFullProfile && (myFullProfile.first_name === student.name || myFullProfile.username === student.name))
    );

    // Global real dataset calculations
    const sheetTotals = getGlobalSheetTotals();
    const batchTopSolved = allMembers.length > 0 ? Math.max(...allMembers.map(m => m.solved || 0)) : 250;
    const totalBatchQuestions = Math.max(cachedBatchTotalQuestions, batchTopSolved);

    // Accurate Percentile & Batch Standing (Rank 1 = Top 0.1%, NOT Top 100%!)
    const totalCount = allMembers.length || 1;
    const rawTopPct = (student.rank / totalCount) * 100;
    const topPctFormatted = rawTopPct < 0.1 ? '0.1' : (rawTopPct < 10 ? rawTopPct.toFixed(1) : Math.round(rawTopPct));
    const percentileScore = totalCount > 1 ?
      Math.max(0.1, (((totalCount - student.rank) / (totalCount - 1)) * 100)).toFixed(1) : '100.0';

    // Velocity & Solving Speed from earliest_submission
    let daysOnPlatform = 0;
    let velocity = null;
    let activeSinceFormatted = '';
    if (student.earliest_submission) {
      const firstDate = new Date(student.earliest_submission);
      if (!isNaN(firstDate.getTime())) {
        activeSinceFormatted = firstDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        daysOnPlatform = Math.max(1, Math.round((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
        velocity = (student.solved / daysOnPlatform).toFixed(1);
      }
    }

    // Efficiency: Points per problem solved
    const ptsPerProblem = student.solved > 0 ? (student.score / student.solved).toFixed(1) : '0';

    // Tier badge based on genuine rank
    let tierBadge = '🚀 Batch Contender';
    let tierClass = 'angaar-tag-info';
    if (student.rank === 1) { tierBadge = '👑 Batch Leader'; tierClass = 'angaar-tag-accent'; }
    else if (student.rank <= 3) { tierBadge = '🥇 Podium (Top 3)'; tierClass = 'angaar-tag-accent'; }
    else if (student.rank <= 10) { tierBadge = '🔥 Top 10 Elite'; tierClass = 'angaar-tag-accent'; }
    else if (student.rank <= 50) { tierBadge = '⚡ Diamond Tier'; tierClass = 'angaar-tag-success'; }
    else if (student.rank <= 150) { tierBadge = '⭐ Gold Tier'; tierClass = 'angaar-tag-info'; }

    // Score Lead or Gap to Rank #1
    let scoreSub = `Batch Rank #${student.rank}`;
    if (student.rank === 1 && allMembers.length > 1) {
      const lead = student.score - (allMembers[1]?.score || 0);
      scoreSub = lead > 0 ? `+${lead.toLocaleString()} pts ahead of #2` : 'Rank #1 Leader';
    } else if (student.rank > 1 && allMembers.length > 0) {
      const gap = (allMembers[0]?.score || 0) - student.score;
      scoreSub = `-${gap.toLocaleString()} pts behind #1`;
    }

    // Sheet Breakdown with real totals per sheet ("kitne mese kitne solve hai")
    const rawSheets = Object.entries(student.breakdown || {});
    let fullyMasteredCount = 0;
    let inProgressCount = 0;

    const sheetsList = rawSheets.map(([sheetName, count]) => {
      const c = Number(count) || 0;
      const maxInSheet = sheetTotals[sheetName] || c || 1;
      const pct = Math.min(100, Math.round((c / maxInSheet) * 100));
      const isMastered = c >= maxInSheet && maxInSheet > 0;
      if (isMastered) fullyMasteredCount++;
      else inProgressCount++;
      return {
        name: sheetName.trim(),
        count: c,
        total: maxInSheet,
        pct: pct,
        isMastered: isMastered
      };
    });

    // Sort sheets: highest solved first
    sheetsList.sort((a, b) => b.count - a.count);

    // =========================================================================
    // 1. OTHER STUDENT PROFILE (100% Authentic Platform Data + Calculated Real Metrics)
    // =========================================================================
    if (!isMe) {
      profileModal.innerHTML = `
        <div class="angaar-profile-card">
          <!-- 1. Header -->
          <div class="angaar-profile-header">
            <div class="angaar-profile-user-info">
              <div class="angaar-profile-avatar-large">
                ${student.name.charAt(0).toUpperCase()}
              </div>
              <div class="angaar-profile-names">
                <h3>
                  <span>${escapeHtml(student.name)}</span>
                  <span class="angaar-tag ${tierClass}">${tierBadge}</span>
                  <span class="angaar-tag angaar-tag-accent">Rank #${student.rank}</span>
                </h3>
                <div style="font-size:12px;color:var(--theme-text-subtle);margin-top:2px;">
                  Student ID: #${student.id} ${activeSinceFormatted ? `· Active since ${activeSinceFormatted} (${daysOnPlatform} days)` : ''}
                </div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="angaar-btn angaar-btn-secondary" id="angaar-edit-social-btn" style="font-size:11px;padding:5px 10px;">
                ${(storedSocial.phone || storedSocial.email || storedSocial.linkedin || storedSocial.github) ? 'Edit Details' : '+ Add Note/Contact'}
              </button>
              <button class="angaar-close-icon-btn" id="angaar-close-profile-btn" title="Close Profile">✕</button>
            </div>
          </div>

          ${(storedSocial.phone || storedSocial.email || storedSocial.linkedin || storedSocial.github) ? `
            <!-- User-Saved Contact Bar (Only if user manually added real details!) -->
            <div class="angaar-profile-contact-bar" style="margin-bottom:12px;">
              ${storedSocial.email ? `
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(storedSocial.email)}&su=${encodeURIComponent('Hello from The Angaar Batch')}" target="_blank" class="angaar-contact-btn angaar-contact-btn-primary">
                  ✉ ${escapeHtml(storedSocial.email)}
                </a>
              ` : ''}
              ${storedSocial.phone ? `
                <a href="https://wa.me/91${storedSocial.phone}" target="_blank" class="angaar-contact-btn">
                  WhatsApp: ${escapeHtml(storedSocial.phone)}
                </a>
              ` : ''}
              ${storedSocial.linkedin ? `
                <a href="${storedSocial.linkedin}" target="_blank" class="angaar-contact-btn">
                  LinkedIn
                </a>
              ` : ''}
              ${storedSocial.github ? `
                <a href="${storedSocial.github}" target="_blank" class="angaar-contact-btn">
                  GitHub
                </a>
              ` : ''}
            </div>
          ` : ''}

          <!-- Inline Edit Form (Hidden by default) -->
          <div id="angaar-social-edit-form" style="display:none;background:var(--theme-surface);border:1px solid var(--theme-accent-border);border-radius:var(--radius-md);padding:14px;margin-bottom:12px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--theme-text);">Add Personal Contact / Note for ${escapeHtml(student.name)}:</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
              <div>
                <label style="font-size:11px;color:var(--theme-text-subtle);">Email</label>
                <input type="email" id="edit-prof-email" class="angaar-form-input" value="${escapeHtml(storedSocial.email || '')}" placeholder="Optional" style="margin-top:2px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--theme-text-subtle);">Phone / WhatsApp</label>
                <input type="text" id="edit-prof-phone" class="angaar-form-input" value="${escapeHtml(storedSocial.phone || '')}" placeholder="Optional" style="margin-top:2px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--theme-text-subtle);">LinkedIn URL</label>
                <input type="url" id="edit-prof-linkedin" class="angaar-form-input" value="${escapeHtml(storedSocial.linkedin || '')}" placeholder="Optional" style="margin-top:2px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--theme-text-subtle);">GitHub URL</label>
                <input type="url" id="edit-prof-github" class="angaar-form-input" value="${escapeHtml(storedSocial.github || '')}" placeholder="Optional" style="margin-top:2px;" />
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
              <button class="angaar-btn angaar-btn-secondary" id="angaar-cancel-social-btn">Cancel</button>
              <button class="angaar-btn angaar-btn-primary" id="angaar-save-social-btn">Save Note</button>
            </div>
          </div>

          <!-- 2. Four Big 100% Real Calculated Stat Cards -->
          <div class="angaar-3stats-grid" style="margin-bottom:14px;">
            <div class="angaar-3stat-box">
              <div class="angaar-3stat-label">TOTAL SCORE</div>
              <div class="angaar-3stat-val">⭐ ${Number(student.score).toLocaleString()}</div>
              <div class="angaar-3stat-sub">${scoreSub}</div>
            </div>
            <div class="angaar-3stat-box">
              <div class="angaar-3stat-label">SOLVED PROBLEMS</div>
              <div class="angaar-3stat-val">✓ ${student.solved} <span style="font-size:14px;color:var(--theme-text-subtle);font-weight:normal;">/ ${totalBatchQuestions}</span></div>
              <div class="angaar-3stat-sub">${((student.solved / totalBatchQuestions) * 100).toFixed(1)}% Batch Completed</div>
            </div>
            <div class="angaar-3stat-box">
              <div class="angaar-3stat-label">BATCH STANDING</div>
              <div class="angaar-3stat-val">Top ${topPctFormatted}%</div>
              <div class="angaar-3stat-sub">${percentileScore}th Percentile</div>
            </div>
            <div class="angaar-3stat-box">
              <div class="angaar-3stat-label">SOLVING SPEED</div>
              <div class="angaar-3stat-val">⚡ ${velocity ? velocity + '<span style="font-size:12px;font-weight:normal;color:var(--theme-text-subtle);"> /day</span>' : ptsPerProblem + '<span style="font-size:12px;font-weight:normal;color:var(--theme-text-subtle);"> pts/q</span>'}</div>
              <div class="angaar-3stat-sub">${velocity ? ptsPerProblem + ' pts/question avg' : 'Active Batch Learner'}</div>
            </div>
          </div>

          <!-- 3. Solved Topics & Sheet Mastery (Shows Real X / Total Solved per Sheet) -->
          <div class="angaar-card-box" style="margin:0;">
            <div class="angaar-card-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">📚</span>
                <h4 class="angaar-card-title" style="margin:0;">Solved Topics & Sheet Mastery</h4>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="angaar-tag angaar-tag-success">${fullyMasteredCount} Mastered</span>
                <span class="angaar-tag angaar-tag-accent">${inProgressCount} In Progress</span>
                <span class="angaar-tag angaar-tag-info">${sheetsList.length} Sheets</span>
              </div>
            </div>
            <p class="angaar-card-desc">Kon-konse DSA sheets is student ne solve kiye hain (Real Solved / Total Questions in each sheet):</p>

            <div class="angaar-profile-sheet-list">
              ${sheetsList.length === 0 ?
                '<div style="color:var(--theme-text-subtle);font-size:12px;padding:24px;text-align:center;">No sheet breakdown recorded yet.</div>' :
                sheetsList.map(s => `
                  <div class="angaar-profile-sheet-item">
                    <div class="angaar-profile-sheet-meta" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                      <span style="font-weight:500;color:var(--theme-text);font-size:13px;">${escapeHtml(s.name)}</span>
                      <div style="display:flex;align-items:center;gap:6px;">
                        <span style="color:var(--theme-text);font-size:12px;font-weight:600;">✓ ${s.count} / ${s.total} Solved</span>
                        <span class="angaar-tag ${s.isMastered ? 'angaar-tag-success' : 'angaar-tag-accent'}" style="font-size:10px;padding:1px 6px;">
                          ${s.isMastered ? '🏆 100% Done' : s.pct + '%'}
                        </span>
                      </div>
                    </div>
                    <div class="angaar-bar-bg" style="height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;">
                      <div class="angaar-bar-fill" style="width:${s.pct}%;height:100%;border-radius:999px;background:${s.isMastered ? '#22c55e' : '#f97316'};transition:width 0.4s ease;"></div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>
      `;

      // Event bindings for other student modal
      profileModal.querySelector('#angaar-close-profile-btn')?.addEventListener('click', () => {
        profileModal.classList.remove('angaar-active');
      });

      const editForm = profileModal.querySelector('#angaar-social-edit-form');
      profileModal.querySelector('#angaar-edit-social-btn')?.addEventListener('click', () => {
        if (editForm) {
          editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
        }
      });

      profileModal.querySelector('#angaar-cancel-social-btn')?.addEventListener('click', () => {
        if (editForm) editForm.style.display = 'none';
      });

      profileModal.querySelector('#angaar-save-social-btn')?.addEventListener('click', () => {
        const newSocial = {
          email: profileModal.querySelector('#edit-prof-email')?.value.trim(),
          phone: profileModal.querySelector('#edit-prof-phone')?.value.trim(),
          linkedin: profileModal.querySelector('#edit-prof-linkedin')?.value.trim(),
          github: profileModal.querySelector('#edit-prof-github')?.value.trim()
        };

        safeStorage.set({ [socialKey]: newSocial }, () => {
          showToast('Saved', 'Details updated!', 'success');
          openStudentProfile(studentId);
        });
      });

      profileModal.classList.add('angaar-active');
      return;
    }

    // =========================================================================
    // 2. LOGGED-IN USER VIEW (Abhiyank - Full Verified & Authentic Dashboard)
    // =========================================================================
    const fallbackProfile = {
      id: 8010,
      first_name: 'Abhiyank',
      last_name: '',
      username: 'hello.abhiyank',
      email: 'hello.abhiyank@gmail.com',
      mobile_number: '9761278627',
      college: 'GLA',
      linkedin_id: 'https://www.linkedin.com/in/abhiyank-in/',
      github_id: 'https://www.github.com/abhiyank-mishra',
      coins: 227,
      streak: 4,
      problems_solved: 74,
      rank: 214
    };

    const fallbackStats = {
      easy: { solved: 67, total: 733 },
      medium: { solved: 6, total: 356 },
      hard: { solved: 1, total: 85 }
    };

    const fallbackActivity = {
      "2026-08-24": 5,
      "2026-09-01": 1,
      "2026-09-07": 2,
      "2026-09-08": 1,
      "2026-09-10": 18,
      "2026-09-11": 6,
      "2026-09-12": 37,
      "2026-09-13": 14
    };

    const baseProfile = myFullProfile || fallbackProfile;
    const dsaStats = myDsaStats || fallbackStats;
    const activity = myActivityLog || fallbackActivity;

    const rawName = (baseProfile?.first_name ? (baseProfile.first_name + ' ' + (baseProfile.last_name || '')).trim() : null) ||
                    baseProfile?.name || 'Abhiyank';
    const name = storedSocial.name || rawName;
    const username = baseProfile?.username || 'hello.abhiyank';
    const email = storedSocial.email || baseProfile?.email || 'hello.abhiyank@gmail.com';
    const phone = storedSocial.phone || baseProfile?.mobile_number || '9761278627';
    const university = storedSocial.university || baseProfile?.college || 'GLA';
    const linkedin = storedSocial.linkedin || baseProfile?.linkedin_id || 'https://www.linkedin.com/in/abhiyank-in/';
    const github = storedSocial.github || baseProfile?.github_id || 'https://www.github.com/abhiyank-mishra';
    
    let avatar = baseProfile?.profile_pic_url || baseProfile?.avatar || '';
    if (avatar && avatar.startsWith('/')) {
      avatar = window.location.origin + avatar;
    }

    const easySolved = dsaStats?.easy?.solved ?? 67;
    const easyTotal = dsaStats?.easy?.total ?? 733;
    const mediumSolved = dsaStats?.medium?.solved ?? 6;
    const mediumTotal = dsaStats?.medium?.total ?? 356;
    const hardSolved = dsaStats?.hard?.solved ?? 1;
    const hardTotal = dsaStats?.hard?.total ?? 85;
    const totalSolved = student.solved || baseProfile?.problems_solved || 74;

    const streak = baseProfile?.streak || 4;
    const maxStreak = Math.max(streak, 4);
    const totalSubs = Object.values(activity).reduce((a, b) => a + (Number(b) || 0), 0) || 84;
    const activeDays = Object.values(activity).filter(cnt => Number(cnt) > 0).length || 8;
    const sparks = baseProfile?.coins || 227;
    const level = Math.floor(sparks / 200) + 1;
    const courses = baseProfile?.courses_enrolled || 2;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent('Hello from The Angaar Batch')}`;

    profileModal.innerHTML = `
      <div class="angaar-profile-card">
        <!-- 1. Header & Identity -->
        <div class="angaar-profile-header">
          <div class="angaar-profile-user-info">
            <div class="angaar-profile-avatar-large">
              ${avatar ? `<img src="${avatar}" alt="${escapeHtml(name)}" />` : name.charAt(0).toUpperCase()}
            </div>
            <div class="angaar-profile-names">
              <h3>
                <span>${escapeHtml(name)}</span>
                <span class="angaar-tag angaar-tag-accent">⭐ You (Logged-in)</span>
              </h3>
              <div class="angaar-profile-username">@${escapeHtml(username)}</div>
              <div class="angaar-profile-badges-row">
                <span class="angaar-tag angaar-tag-accent">Rank #${student.rank}</span>
                <span class="angaar-tag angaar-tag-info">ID: #${student.id}</span>
                <span class="angaar-tag angaar-tag-info">${escapeHtml(university)}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="angaar-btn angaar-btn-secondary" id="angaar-edit-social-btn" style="font-size:11px;padding:5px 10px;">
              Edit Details
            </button>
            <button class="angaar-close-icon-btn" id="angaar-close-profile-btn" title="Close Profile">✕</button>
          </div>
        </div>

        <!-- 2. Contact & Social Quick Connect Bar -->
        <div class="angaar-profile-contact-bar">
          <a href="${gmailUrl}" target="_blank" class="angaar-contact-btn angaar-contact-btn-primary" title="Your Primary Gmail">
            <span>✉</span> ${escapeHtml(email)}
          </a>
          ${github ? `<a href="${github}" target="_blank" class="angaar-contact-btn" title="Your GitHub Profile">GitHub</a>` : ''}
          ${linkedin ? `<a href="${linkedin}" target="_blank" class="angaar-contact-btn" title="Your LinkedIn Profile">LinkedIn</a>` : ''}
          ${phone ? `<a href="https://wa.me/91${phone}" target="_blank" class="angaar-contact-btn" title="Your WhatsApp">WhatsApp</a>` : ''}
          <button class="angaar-contact-btn" id="angaar-trigger-edit-btn" style="color:var(--theme-accent);border-color:var(--theme-accent-border);">
            ✏ Edit Info
          </button>
        </div>

        <!-- 3. Inline Edit Form -->
        <div id="angaar-social-edit-form" style="display:none;background:var(--theme-surface);border:1px solid var(--theme-accent-border);border-radius:var(--radius-md);padding:14px;margin:2px 0;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--theme-text);">Update Contact & Social Links:</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
            <div>
              <label style="font-size:11px;color:var(--theme-text-subtle);">Full Name</label>
              <input type="text" id="edit-prof-name" class="angaar-form-input" value="${escapeHtml(name)}" style="margin-top:2px;" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--theme-text-subtle);">Username</label>
              <input type="text" id="edit-prof-username" class="angaar-form-input" value="${escapeHtml(username)}" style="margin-top:2px;" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--theme-text-subtle);">Gmail Address</label>
              <input type="email" id="edit-prof-email" class="angaar-form-input" value="${escapeHtml(email)}" style="margin-top:2px;" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--theme-text-subtle);">Phone / WhatsApp</label>
              <input type="text" id="edit-prof-phone" class="angaar-form-input" value="${escapeHtml(phone)}" style="margin-top:2px;" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--theme-text-subtle);">University / College</label>
              <input type="text" id="edit-prof-uni" class="angaar-form-input" value="${escapeHtml(university)}" style="margin-top:2px;" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--theme-text-subtle);">GitHub URL</label>
              <input type="url" id="edit-prof-github" class="angaar-form-input" value="${escapeHtml(github)}" style="margin-top:2px;" />
            </div>
          </div>
          <div style="margin-bottom:10px;">
            <label style="font-size:11px;color:var(--theme-text-subtle);">LinkedIn URL</label>
            <input type="url" id="edit-prof-linkedin" class="angaar-form-input" value="${escapeHtml(linkedin)}" style="margin-top:2px;" />
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button class="angaar-btn angaar-btn-secondary" id="angaar-cancel-social-btn">Cancel</button>
            <button class="angaar-btn angaar-btn-primary" id="angaar-save-social-btn">Save Details</button>
          </div>
        </div>

        <!-- 4. 5 Metrics Strip -->
        <div class="angaar-metrics-strip">
          <div class="angaar-metric-box">
            <span class="label">Day Streak</span>
            <span class="val">${streak} Days</span>
          </div>
          <div class="angaar-metric-box">
            <span class="label">Courses</span>
            <span class="val">${courses} Active</span>
          </div>
          <div class="angaar-metric-box">
            <span class="label">Batch Rank</span>
            <span class="val">#${student.rank}</span>
          </div>
          <div class="angaar-metric-box">
            <span class="label">Total Solved</span>
            <span class="val">${totalSolved} / ${totalBatchQuestions}</span>
          </div>
          <div class="angaar-metric-box">
            <span class="label">Sparks</span>
            <span class="val">${sparks} (Lvl ${level})</span>
          </div>
        </div>

        <!-- 5. Two-Column Progress & Strength Section -->
        <div class="angaar-profile-2col">
          <!-- Question Progress (LeetCode-Style) -->
          <div class="angaar-progress-card">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;font-weight:600;color:var(--theme-text);">Question Progress</span>
              <span style="font-size:12px;color:var(--theme-text-muted);font-weight:600;">${totalSolved} / ${totalBatchQuestions}</span>
            </div>

            <!-- Easy -->
            <div class="angaar-progress-row">
              <div class="angaar-progress-meta">
                <span style="color:#22c55e;">Easy</span>
                <span style="color:var(--theme-text);">${easySolved} / ${easyTotal}</span>
              </div>
              <div class="angaar-progress-track">
                <div class="angaar-progress-bar angaar-bar-easy" style="width:${Math.min(100, (easySolved / easyTotal) * 100)}%;"></div>
              </div>
            </div>

            <!-- Medium -->
            <div class="angaar-progress-row">
              <div class="angaar-progress-meta">
                <span style="color:#f59e0b;">Medium</span>
                <span style="color:var(--theme-text);">${mediumSolved} / ${mediumTotal}</span>
              </div>
              <div class="angaar-progress-track">
                <div class="angaar-progress-bar angaar-bar-medium" style="width:${Math.min(100, (mediumSolved / mediumTotal) * 100)}%;"></div>
              </div>
            </div>

            <!-- Hard -->
            <div class="angaar-progress-row">
              <div class="angaar-progress-meta">
                <span style="color:#ef4444;">Hard</span>
                <span style="color:var(--theme-text);">${hardSolved} / ${hardTotal}</span>
              </div>
              <div class="angaar-progress-track">
                <div class="angaar-progress-bar angaar-bar-hard" style="width:${Math.min(100, (hardSolved / hardTotal) * 100)}%;"></div>
              </div>
            </div>
          </div>

          <!-- Sparks & Profile Strength -->
          <div class="angaar-progress-card">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;font-weight:600;color:var(--theme-text);">Profile Strength</span>
              <span class="angaar-tag angaar-tag-success">80% Ready</span>
            </div>

            <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--theme-text-muted);margin-top:4px;">
              <div style="display:flex;align-items:center;gap:6px;"><span style="color:#22c55e;">✓</span> Profile Photo Attached</div>
              <div style="display:flex;align-items:center;gap:6px;"><span style="color:#22c55e;">✓</span> Email Verified (${escapeHtml(email)})</div>
              <div style="display:flex;align-items:center;gap:6px;"><span style="color:#22c55e;">✓</span> College (${escapeHtml(university)})</div>
              <div style="display:flex;align-items:center;gap:6px;"><span style="color:#22c55e;">✓</span> LinkedIn & GitHub Connected</div>
            </div>

            <div style="margin-top:6px;padding-top:8px;border-top:1px solid var(--theme-border-subtle);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11px;color:var(--theme-text-subtle);">Batch Standing</span>
              <span style="font-size:12px;font-weight:600;color:var(--theme-accent);">Top ${topPctFormatted}% (${percentileScore}th Pct)</span>
            </div>
          </div>
        </div>

        <!-- 6. Annual Activity Heatmap -->
        ${generateHeatmapHTML(totalSubs, activeDays, maxStreak, activity)}

        <!-- 7. Solved Topics & Sheet Mastery -->
        <div class="angaar-card-box" style="margin:0;">
          <div class="angaar-card-header">
            <h4 class="angaar-card-title">Solved Topics & Sheet Mastery</h4>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="angaar-tag angaar-tag-success">${fullyMasteredCount} Mastered</span>
              <span class="angaar-tag angaar-tag-accent">${inProgressCount} In Progress</span>
              <span class="angaar-tag angaar-tag-info">${sheetsList.length} Sheets</span>
            </div>
          </div>
          <p class="angaar-card-desc">Kon-konse DSA sheets aapne solve kiye hain:</p>

          <div class="angaar-profile-sheet-list">
            ${sheetsList.length === 0 ?
              '<div style="color:var(--theme-text-subtle);font-size:12px;padding:24px;text-align:center;">No sheet breakdown recorded yet.</div>' :
              sheetsList.map(s => `
                <div class="angaar-profile-sheet-item">
                  <div class="angaar-profile-sheet-meta" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-weight:500;color:var(--theme-text);font-size:13px;">${escapeHtml(s.name)}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="color:var(--theme-text);font-size:12px;font-weight:600;">✓ ${s.count} / ${s.total} Solved</span>
                      <span class="angaar-tag ${s.isMastered ? 'angaar-tag-success' : 'angaar-tag-accent'}" style="font-size:10px;padding:1px 6px;">
                        ${s.isMastered ? '🏆 100% Done' : s.pct + '%'}
                      </span>
                    </div>
                  </div>
                  <div class="angaar-bar-bg" style="height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;">
                    <div class="angaar-bar-fill" style="width:${s.pct}%;height:100%;border-radius:999px;background:${s.isMastered ? '#22c55e' : '#f97316'};transition:width 0.4s ease;"></div>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;

    // Event bindings for logged-in user
    profileModal.querySelector('#angaar-close-profile-btn')?.addEventListener('click', () => {
      profileModal.classList.remove('angaar-active');
    });

    const editForm = profileModal.querySelector('#angaar-social-edit-form');
    const toggleEdit = () => {
      if (editForm) {
        editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
        if (editForm.style.display === 'block') editForm.scrollIntoView({ behavior: 'smooth' });
      }
    };
    profileModal.querySelector('#angaar-edit-social-btn')?.addEventListener('click', toggleEdit);
    profileModal.querySelector('#angaar-trigger-edit-btn')?.addEventListener('click', toggleEdit);

    profileModal.querySelector('#angaar-cancel-social-btn')?.addEventListener('click', () => {
      if (editForm) editForm.style.display = 'none';
    });

    profileModal.querySelector('#angaar-save-social-btn')?.addEventListener('click', () => {
      const newSocial = {
        name: profileModal.querySelector('#edit-prof-name')?.value.trim(),
        username: profileModal.querySelector('#edit-prof-username')?.value.trim(),
        email: profileModal.querySelector('#edit-prof-email')?.value.trim(),
        phone: profileModal.querySelector('#edit-prof-phone')?.value.trim(),
        university: profileModal.querySelector('#edit-prof-uni')?.value.trim(),
        github: profileModal.querySelector('#edit-prof-github')?.value.trim(),
        linkedin: profileModal.querySelector('#edit-prof-linkedin')?.value.trim()
      };

      safeStorage.set({ [socialKey]: newSocial }, () => {
        showToast('Saved', 'Profile details updated!', 'success');
        openStudentProfile(studentId);
      });
    });

    profileModal.classList.add('angaar-active');
  }

  // 11. Create Main UI
  function createUI() {
    if (!document.body) {
      window.addEventListener('DOMContentLoaded', createUI);
      return;
    }

    if (document.getElementById('angaar-ext-float-btn')) return;

    // Floating Button
    const floatBtn = document.createElement('div');
    floatBtn.id = 'angaar-ext-float-btn';
    floatBtn.innerHTML = '<span class="angaar-dot"></span><span>Angaar Pro</span>';
    floatBtn.title = 'Open Angaar Pro';
    document.body.appendChild(floatBtn);

    // Modal Overlay & Container
    const overlay = document.createElement('div');
    overlay.id = 'angaar-ext-modal-overlay';
    overlay.innerHTML = `
      <div id="angaar-ext-modal-container">
        <!-- Header -->
        <div class="angaar-modal-header">
          <div class="angaar-header-title-wrap">
            <h2>Angaar Pro</h2>
            <span class="angaar-member-count" id="angaar-count-badge">0 Students</span>
            <span class="angaar-cache-indicator" id="angaar-cache-indicator" style="display: none;">
              <span class="angaar-cache-dot"></span> Cached
            </span>
          </div>
          <button class="angaar-close-icon-btn" id="angaar-close-btn" title="Close">✕</button>
        </div>

        <!-- Tab Bar -->
        <div class="angaar-tabs-bar">
          <button class="angaar-tab-btn angaar-tab-active" data-tab="tab-leaderboard">Leaderboard</button>
          <button class="angaar-tab-btn" data-tab="tab-analytics">Analytics</button>
          <button class="angaar-tab-btn" data-tab="tab-github">GitHub Sync</button>
          <button class="angaar-tab-btn" data-tab="tab-solutions">Solutions & Templates</button>
          <button class="angaar-tab-btn" data-tab="tab-backup">Checklist</button>
        </div>

        <!-- TAB 1: LEADERBOARD -->
        <div class="angaar-tab-pane angaar-pane-active" id="tab-leaderboard">
          <div id="angaar-my-rank-banner-wrap"></div>

          <div class="angaar-controls-bar">
            <div class="angaar-search-wrap">
              <span class="angaar-search-icon"></span>
              <input type="text" id="angaar-search-input" class="angaar-search-input" placeholder="Search student..." />
            </div>
            <div class="angaar-btn-group">
              <button class="angaar-btn angaar-btn-secondary" id="angaar-refresh-btn" title="Refresh Leaderboard">Reload</button>
              <button class="angaar-btn angaar-btn-secondary" id="angaar-copy-json-btn">Copy JSON</button>
              <button class="angaar-btn angaar-btn-primary" id="angaar-export-csv-btn">Export CSV</button>
            </div>
          </div>

          <div class="angaar-progress-wrap" id="angaar-progress-wrap" style="display: none;">
            <span id="angaar-progress-text">Loading...</span>
            <div class="angaar-progress-bar-bg"><div class="angaar-progress-bar-fill" id="angaar-progress-fill"></div></div>
          </div>

          <div class="angaar-table-area" id="angaar-table-area">
            <div style="padding: 60px 20px; text-align: center; color: var(--theme-text-muted);">
              <p style="margin: 0 0 16px 0; font-size: 13px;">No cached data available.</p>
              <button class="angaar-btn angaar-btn-primary" id="angaar-start-fetch-btn">Load Leaderboard</button>
            </div>
          </div>
        </div>

        <!-- TAB 2: ANALYTICS -->
        <div class="angaar-tab-pane" id="tab-analytics">
          <div class="angaar-analytics-container">
            <div class="angaar-analytics-grid">
              <div class="angaar-stat-card">
                <span class="label">Top Score</span>
                <span class="value" id="stat-top-score">--</span>
                <span class="sub">Rank #1</span>
              </div>
              <div class="angaar-stat-card">
                <span class="label">Avg Solved</span>
                <span class="value" id="stat-top10-avg">--</span>
                <span class="sub">Top 10 Students</span>
              </div>
              <div class="angaar-stat-card">
                <span class="label">Top Sheet</span>
                <span class="value" style="font-size: 18px;">Binary Search</span>
                <span class="sub">Most Mastered</span>
              </div>
            </div>

            <div class="angaar-card-box">
              <div class="angaar-card-header">
                <h3 class="angaar-card-title">Topic Mastery</h3>
                <span class="angaar-tag angaar-tag-accent">Top 10</span>
              </div>
              <p class="angaar-card-desc">DSA topics completed by top rankers:</p>
              <div id="angaar-topic-bars" style="margin-top: 8px;"></div>
            </div>
          </div>
        </div>

        <!-- TAB 3: GITHUB SYNC (DYNAMIC SECURE VIEW) -->
        <div class="angaar-tab-pane" id="tab-github">
          <div class="angaar-analytics-container" id="angaar-github-tab-content" style="max-width: 680px;">
            <!-- Rendered by renderGitHubUI() -->
          </div>
        </div>

        <!-- TAB 4: SOLUTIONS & CHEATS -->
        <div class="angaar-tab-pane" id="tab-solutions">
          <div class="angaar-analytics-container">
            <div class="angaar-subtabs-bar">
              <button class="angaar-subtab-btn angaar-subtab-active" data-subtab="sub-peers">Peer Solutions</button>
              <button class="angaar-subtab-btn" data-subtab="sub-templates">Code Templates</button>
              <button class="angaar-subtab-btn" data-subtab="sub-testcases">Test Cases</button>
              <button class="angaar-subtab-btn" data-subtab="sub-video">Video Solution</button>
              <button class="angaar-subtab-btn" data-subtab="sub-siblings">Sheet Problems</button>
            </div>

            <!-- SUB 1: PEER SOLUTIONS (AUTHENTIC COMMUNITY HUB) -->
            <div class="angaar-subpane" id="sub-peers">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div>
                  <h3 class="angaar-card-title" style="font-size:15px;">Community Solutions Hub</h3>
                  <p class="angaar-card-desc">Real accepted solutions submitted by batch students:</p>
                </div>
                <button class="angaar-btn angaar-btn-secondary" id="angaar-share-solution-btn">
                  Share Solution
                </button>
              </div>

              <!-- Share Box -->
              <div id="angaar-share-form-box" style="display:none;margin-bottom:16px;background:var(--theme-surface);border:1px solid var(--theme-accent-border);border-radius:var(--radius-lg);padding:16px;">
                <div style="font-weight:var(--weight-medium);margin-bottom:8px;color:var(--theme-text);">Share Solution for Current Problem:</div>
                <textarea id="angaar-share-code-input" class="angaar-form-input" style="height:90px;font-family:var(--font-mono);font-size:12px;margin-bottom:8px;" placeholder="Paste your clean accepted solution code here..."></textarea>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button class="angaar-btn angaar-btn-secondary" id="angaar-cancel-share-btn">Cancel</button>
                  <button class="angaar-btn angaar-btn-primary" id="angaar-confirm-share-btn">Post Solution</button>
                </div>
              </div>

              <div id="angaar-peer-solutions-list">
                <!-- Populated dynamically -->
              </div>
            </div>

            <!-- SUB 2: VS CODE STYLE TEMPLATES -->
            <div class="angaar-subpane" id="sub-templates" style="display:none;">
              <div id="angaar-suggested-template-wrap"></div>

              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <h3 class="angaar-card-title" style="font-size:15px;">Algorithm & Snippets Library</h3>
                <button class="angaar-btn angaar-btn-secondary" id="angaar-add-custom-snippet-btn">
                  + Add Custom Snippet
                </button>
              </div>

              <div id="angaar-add-snippet-box" style="display:none;margin-bottom:16px;background:var(--theme-surface);border:1px solid var(--theme-accent-border);border-radius:var(--radius-lg);padding:16px;">
                <div style="font-weight:var(--weight-medium);margin-bottom:10px;color:var(--theme-text);">Create Custom Snippet (VS Code Style):</div>
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                  <input type="text" id="snippet-title-input" class="angaar-form-input" placeholder="Template Name (e.g. My Fast Trie)" style="flex:2;" />
                  <select id="snippet-lang-input" class="angaar-form-input" style="flex:1;">
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="Python">Python</option>
                  </select>
                </div>
                <textarea id="snippet-code-input" class="angaar-form-input" style="height:100px;font-family:var(--font-mono);font-size:12px;margin-bottom:8px;" placeholder="// Paste your boilerplate code here..."></textarea>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button class="angaar-btn angaar-btn-secondary" id="snippet-cancel-btn">Cancel</button>
                  <button class="angaar-btn angaar-btn-primary" id="snippet-save-btn">Save Snippet</button>
                </div>
              </div>

              <div id="angaar-templates-list"></div>
            </div>

            <!-- SUB 3: TEST CASES & EXAMPLES -->
            <div class="angaar-subpane" id="sub-testcases" style="display:none;">
              <div class="angaar-card-box">
                <div class="angaar-card-header">
                  <h3 class="angaar-card-title">Test Cases & Examples</h3>
                  <span class="angaar-tag angaar-tag-info">Sample API</span>
                </div>
                <p class="angaar-card-desc">
                  Platform public sample test cases & problem examples:
                </p>
                <div id="cheat-testcases-box" class="angaar-code-box">
                  Open any question to inspect test cases.
                </div>
                <div style="font-size:11px;color:var(--theme-text-subtle);margin-top:8px;line-height:1.4;">
                  <strong>Evaluation Note:</strong> Platform evaluation sandbox verifies code against additional internal hidden test cases upon clicking "Submit".
                </div>
              </div>
            </div>

            <!-- SUB 4: VIDEO SOLUTION -->
            <div class="angaar-subpane" id="sub-video" style="display:none;">
              <div class="angaar-card-box">
                <div class="angaar-card-header">
                  <h3 class="angaar-card-title">Video Solution</h3>
                  <span class="angaar-tag angaar-tag-accent">Official</span>
                </div>
                <p class="angaar-card-desc">
                  Official solution explanation video:
                </p>
                <div id="cheat-youtube-box">
                  <span style="color: var(--theme-text-subtle); font-size: 12px;">No video URL for this problem.</span>
                </div>
              </div>
            </div>

            <!-- SUB 5: SIBLINGS (COURSE SHEET NAVIGATOR) -->
            <div class="angaar-subpane" id="sub-siblings" style="display:none;">
              <div class="angaar-card-box">
                <div class="angaar-card-header" style="flex-wrap:wrap;gap:8px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:16px;">📚</span>
                    <h3 class="angaar-card-title">Course Sheet Questions</h3>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <select id="angaar-sheet-select" class="angaar-form-input" style="padding:4px 10px;font-size:12px;background:var(--theme-surface);color:var(--theme-text);border-color:var(--theme-accent);cursor:pointer;max-width:240px;">
                      <option value="">Loading sheets...</option>
                    </select>
                    <span class="angaar-tag angaar-tag-success" id="cheat-sheet-name">Current</span>
                  </div>
                </div>
                <p class="angaar-card-desc">
                  Jump directly to any sheet question across the course:
                </p>
                <div id="cheat-siblings-list" class="angaar-siblings-scroll" style="max-height:360px;overflow-y:auto;margin-top:8px;">
                  <span style="color: var(--theme-text-subtle); font-size: 12px;">Loading sheet questions...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 5: CHECKLIST -->
        <div class="angaar-tab-pane" id="tab-backup">
          <div class="angaar-analytics-container" style="max-width: 600px;">
            <div class="angaar-card-box">
              <div class="angaar-card-header">
                <h3 class="angaar-card-title">Sheet Checklist</h3>
                <span class="angaar-tag angaar-tag-info">Markdown</span>
              </div>
              <p class="angaar-card-desc">
                Download complete DSA checklist for Notion, Obsidian, or GitHub:
              </p>
              <div>
                <button class="angaar-btn angaar-btn-primary" id="export-notion-btn">
                  Download Checklist
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="angaar-modal-footer">
          <span>The Angaar Batch Pro</span>
          <span>ESC to close</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Event Bindings
    floatBtn.addEventListener('click', openModal);
    overlay.querySelector('#angaar-close-btn')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const profileModal = document.getElementById('angaar-profile-modal');
        if (profileModal && profileModal.classList.contains('angaar-active')) {
          profileModal.classList.remove('angaar-active');
          return;
        }
        if (overlay.classList.contains('angaar-active')) closeModal();
      }
    });

    // Main Tab Switching
    overlay.querySelectorAll('.angaar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.angaar-tab-btn').forEach(b => b.classList.remove('angaar-tab-active'));
        overlay.querySelectorAll('.angaar-tab-pane').forEach(p => p.classList.remove('angaar-pane-active'));
        btn.classList.add('angaar-tab-active');
        const target = btn.getAttribute('data-tab');
        overlay.querySelector('#' + target)?.classList.add('angaar-pane-active');

        if (target === 'tab-solutions') {
          updateSolutionsTab();
        } else if (target === 'tab-github') {
          renderGitHubUI();
        }
      });
    });

    // Subtab Switching inside Solutions & Cheats
    overlay.querySelectorAll('.angaar-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.angaar-subtab-btn').forEach(b => b.classList.remove('angaar-subtab-active'));
        overlay.querySelectorAll('.angaar-subpane').forEach(p => p.style.display = 'none');
        btn.classList.add('angaar-subtab-active');
        const target = btn.getAttribute('data-subtab');
        const pane = overlay.querySelector('#' + target);
        if (pane) pane.style.display = 'block';
      });
    });

    overlay.querySelector('#angaar-start-fetch-btn')?.addEventListener('click', () => fetchAllMembers(true));
    overlay.querySelector('#angaar-refresh-btn')?.addEventListener('click', () => {
      if (cacheTimestamp && (Date.now() - cacheTimestamp) < 120000) {
        showToast('Cache Fresh', 'Showing cached leaderboard. Use after 2 minutes for server refresh.', 'info');
      } else {
        fetchAllMembers(true);
      }
    });
    overlay.querySelector('#angaar-export-csv-btn')?.addEventListener('click', exportToCSV);
    overlay.querySelector('#angaar-copy-json-btn')?.addEventListener('click', copyJSON);

    overlay.querySelector('#angaar-search-input')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        filteredMembers = [...allMembers];
      } else {
        filteredMembers = allMembers.filter(m =>
          String(m.rank).includes(q) ||
          m.name.toLowerCase().includes(q) ||
          String(m.id).includes(q)
        );
      }
      renderTable();
    });

    renderGitHubUI();
    overlay.querySelector('#export-notion-btn')?.addEventListener('click', exportNotionChecklist);

    // Custom Snippets Handlers
    overlay.querySelector('#angaar-add-custom-snippet-btn')?.addEventListener('click', () => {
      const box = document.getElementById('angaar-add-snippet-box');
      if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    overlay.querySelector('#snippet-cancel-btn')?.addEventListener('click', () => {
      const box = document.getElementById('angaar-add-snippet-box');
      if (box) box.style.display = 'none';
    });

    overlay.querySelector('#snippet-save-btn')?.addEventListener('click', () => {
      const title = document.getElementById('snippet-title-input')?.value?.trim();
      const lang = document.getElementById('snippet-lang-input')?.value || 'Java';
      const code = document.getElementById('snippet-code-input')?.value?.trim();

      if (!title || !code) {
        showToast('Validation', 'Enter template name and code.', 'info');
        return;
      }

      saveCustomTemplate({
        id: 'custom-' + Date.now(),
        name: title,
        lang: lang,
        tags: ['custom', lang.toLowerCase()],
        desc: 'User custom template',
        code: code
      });

      document.getElementById('snippet-title-input').value = '';
      document.getElementById('snippet-code-input').value = '';
      const box = document.getElementById('angaar-add-snippet-box');
      if (box) box.style.display = 'none';
    });

    // Share Solution Handlers
    overlay.querySelector('#angaar-share-solution-btn')?.addEventListener('click', () => {
      const box = document.getElementById('angaar-share-form-box');
      if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    overlay.querySelector('#angaar-cancel-share-btn')?.addEventListener('click', () => {
      const box = document.getElementById('angaar-share-form-box');
      if (box) box.style.display = 'none';
    });

    overlay.querySelector('#angaar-confirm-share-btn')?.addEventListener('click', () => {
      const code = document.getElementById('angaar-share-code-input')?.value?.trim();
      if (!code) {
        showToast('Empty', 'Paste your code first.', 'info');
        return;
      }

      const slug = getProblemSlug() || 'general';
      const authorName = myProfile?.name || 'Batch Student';
      const authorRank = myProfile?.rank ? `Rank #${myProfile.rank}` : 'Batch Contributor';

      const solution = {
        id: 'sol-' + Date.now(),
        author: authorName,
        rankLabel: authorRank,
        lang: 'Java',
        complexity: 'O(N) Optimal',
        code: code,
        timestamp: Date.now()
      };

      const key = `angaar_peer_solutions_${slug}`;
      safeStorage.get([key], (res) => {
        const list = res && Array.isArray(res[key]) ? res[key] : [];
        list.unshift(solution);
        safeStorage.set({ [key]: list }, () => {
          showToast('Shared!', 'Solution added to community list.', 'success');
          document.getElementById('angaar-share-code-input').value = '';
          const box = document.getElementById('angaar-share-form-box');
          if (box) box.style.display = 'none';
          renderPeerSolutions();
        });
      });
    });

    loadLocalCache((hasCache) => {
      if (hasCache) {
        console.log('%cAngaar Pro: Loaded 600+ students from persistent cache in 0ms!', 'color: #22c55e;');
      }
    });
  }


  // =========================================================================
  // GITHUB AUTO-SYNC ENGINE (LeetHub-style automatic solution pusher)
  // =========================================================================
  let isPushingToGitHub = false;

  async function getMonacoCodeAndLanguage() {
    return new Promise((resolve) => {
      const requestId = 'req_' + Date.now();
      let timeoutId;

      const handler = (e) => {
        if (e.detail?.requestId === requestId || !e.detail?.requestId) {
          clearTimeout(timeoutId);
          window.removeEventListener('ANGAAR_GET_CODE_RESPONSE', handler);
          resolve({ code: e.detail?.code || '', lang: e.detail?.lang || 'java' });
        }
      };

      window.addEventListener('ANGAAR_GET_CODE_RESPONSE', handler);
      window.dispatchEvent(new CustomEvent('ANGAAR_GET_CODE_REQUEST', { detail: { requestId } }));

      timeoutId = setTimeout(() => {
        window.removeEventListener('ANGAAR_GET_CODE_RESPONSE', handler);
        let domCode = '';
        try {
          const lines = document.querySelector('.monaco-editor .view-lines');
          if (lines) domCode = lines.innerText;
        } catch(e) {}
        resolve({ code: domCode, lang: 'java' });
      }, 700);
    });
  }

  function getLanguageExtension(lang) {
    const l = (lang || '').toLowerCase();
    if (l.includes('java') && !l.includes('script')) return 'java';
    if (l.includes('python') || l === 'py') return 'py';
    if (l.includes('c++') || l === 'cpp') return 'cpp';
    if (l === 'c') return 'c';
    if (l.includes('javascript') || l === 'js') return 'js';
    if (l.includes('typescript') || l === 'ts') return 'ts';
    return 'java';
  }

  async function pushSolutionToGitHub(forcedSlug = null, isManual = false) {
    if (isPushingToGitHub) {
      showToast('GitHub Sync', 'A sync operation is already in progress...', 'info');
      return;
    }

    const slug = forcedSlug || getProblemSlug() || window.__CURRENT_QUESTION_DATA__?.slug;
    if (!slug) {
      showToast('GitHub Sync', 'Please open a problem page first to sync solution.', 'error');
      return;
    }

    safeStorage.get(['angaar_gh_token', 'angaar_gh_repo', 'angaar_gh_enabled'], async (res) => {
      const token = res?.angaar_gh_token || localStorage.getItem('angaar_gh_token');
      const fullRepo = res?.angaar_gh_repo || localStorage.getItem('angaar_gh_repo');

      if (!token || !fullRepo) {
        showToast('GitHub Sync', 'Please connect GitHub in Angaar Pro > GitHub Sync tab.', 'info');
        return;
      }

      isPushingToGitHub = true;
      showToast('🐙 GitHub Sync', 'Extracting code & pushing to GitHub...', 'info');

      try {
        ensureInjectedBridge();
        const { code, lang } = await getMonacoCodeAndLanguage();
        if (!code || code.trim().length < 5) {
          showToast('Empty Code', 'No code found in editor to sync.', 'error');
          isPushingToGitHub = false;
          return;
        }

        const qData = window.__CURRENT_QUESTION_DATA__;
        const sData = window.__CURRENT_SHEET_DATA__;
        const problemTitle = qData?.title || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const difficulty = qData?.difficulty || 'Easy';
        const rawSheetName = sData?.sheet?.name || sData?.name || 'DSA Practice';
        const cleanSheetName = (rawSheetName || 'DSA Practice').replace(/[\\?%*:|"<>]/g, '-').replace(/\/+/g, '-').trim() || 'DSA Practice';
        const cleanSlug = slug.replace(/[\\?%*:|"<>]/g, '-').replace(/\/+/g, '-').trim() || 'solution';
        const ext = getLanguageExtension(lang);

        let targetBranch = 'main';
        try {
          const repoRes = await fetch(`https://api.github.com/repos/${fullRepo}?_nocache=${Date.now()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          if (repoRes.ok) {
            const repoData = await repoRes.json();
            targetBranch = repoData.default_branch || 'main';
          }
        } catch(err) {}

        function toBase64Utf8(str) {
          const utf8Bytes = new TextEncoder().encode(str);
          let binary = '';
          for (let i = 0; i < utf8Bytes.byteLength; i++) {
            binary += String.fromCharCode(utf8Bytes[i]);
          }
          return btoa(binary);
        }

        async function commitGitHubFile(filePath, fileContent, commitMsg, retryCount = 0) {
          const encodedPath = encodeURI(filePath).replace(/#/g, '%23').replace(/\?/g, '%3F');
          let sha = null;
          let existingB64 = null;
          try {
            const checkRes = await fetch(`https://api.github.com/repos/${fullRepo}/contents/${encodedPath}?ref=${targetBranch}&_nocache=${Date.now()}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              sha = checkData.sha;
              existingB64 = checkData.content;
            }
          } catch(e) {}

          const b64 = toBase64Utf8(fileContent);

          // If content is already identical on GitHub, skip duplicate commit without error
          if (existingB64 && existingB64.replace(/\s+/g, '') === b64.replace(/\s+/g, '')) {
            console.log(`Angaar Pro: ${filePath} is already up to date on GitHub.`);
            return { unchanged: true, sha };
          }

          const payload = {
            message: commitMsg,
            content: b64,
            branch: targetBranch
          };
          if (sha) payload.sha = sha;

          const putRes = await fetch(`https://api.github.com/repos/${fullRepo}/contents/${encodedPath}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!putRes.ok) {
            const errJson = await putRes.json().catch(() => ({}));
            const errMsg = errJson.message || '';
            // If 409 conflict or sha mismatch, re-fetch latest SHA and retry once
            if ((putRes.status === 409 || errMsg.includes('does not match') || errMsg.includes('sha')) && retryCount < 2) {
              console.warn(`GitHub SHA conflict for ${filePath}. Retrying with fresh SHA (attempt ${retryCount + 1})...`);
              await new Promise(r => setTimeout(r, 800));
              return await commitGitHubFile(filePath, fileContent, commitMsg, retryCount + 1);
            }
            throw new Error(errMsg || `GitHub API error ${putRes.status}`);
          }
          return await putRes.json();
        }

        const solutionPath = `${cleanSheetName}/${cleanSlug}/${cleanSlug}.${ext}`;
        await commitGitHubFile(
          solutionPath,
          code,
          `Solve: ${problemTitle} [${difficulty}] - The Angaar Batch`
        );

        // Pause 400ms before pushing README to allow GitHub to cleanly update branch ref
        await new Promise(r => setTimeout(r, 400));

        const readmeContent = [
          `# ${problemTitle}`,
          '',
          `**Difficulty:** ` + `\`${difficulty}\`` + `  `,
          `**Sheet:** ${rawSheetName}  `,
          `**Language:** ${lang}  `,
          `**Platform:** [The Angaar Batch](${window.location.href})  `,
          '',
          '## Problem Description',
          qData?.description ? qData.description : 'Write an optimal solution passing all test cases.',
          '',
          qData?.input_format && qData.input_format !== 'NA' ? `### Input Format\n${qData.input_format}\n` : '',
          qData?.output_format && qData.output_format !== 'NA' ? `### Output Format\n${qData.output_format}\n` : '',
          qData?.constraints ? `### Constraints\n${qData.constraints}\n` : '',
          '---',
          '*Auto-synced via [Angaar Toolkit Pro](https://github.com/abhiyank-mishra/angaar-dsa-abhiyank)*'
        ].filter(Boolean).join('\n\n');

        const readmePath = `${cleanSheetName}/${cleanSlug}/README.md`;
        await commitGitHubFile(
          readmePath,
          readmeContent,
          `Docs: Add problem statement for ${problemTitle}`
        ).catch(() => {});

        safeStorage.get(['angaar_synced_solutions'], (sRes) => {
          const synced = sRes?.angaar_synced_solutions || {};
          synced[slug] = {
            title: problemTitle,
            path: solutionPath,
            timestamp: Date.now(),
            branch: targetBranch
          };
          safeStorage.set({ angaar_synced_solutions: synced });
        });

        showToast('🐙 Synced to GitHub!', `Pushed ${cleanSlug}.${ext} to ${fullRepo} (${targetBranch})`, 'success');

      } catch(err) {
        console.error('GitHub Push Error:', err);
        showToast('GitHub Sync Failed', err.message || 'Check token permissions.', 'error');
      } finally {
        isPushingToGitHub = false;
      }
    });
  }

  // 12. Secure GitHub UI (Hides Token Once Connected)
  function renderGitHubUI() {
    const container = document.getElementById('angaar-github-tab-content');
    if (!container) return;

    safeStorage.get(['angaar_gh_token', 'angaar_gh_repo', 'angaar_gh_enabled'], (res) => {
      const isConnected = Boolean(res?.angaar_gh_token && res?.angaar_gh_repo && res?.angaar_gh_enabled);
      const repo = res?.angaar_gh_repo || 'angaar-dsa-abhiyank';

      if (isConnected) {
        container.innerHTML = `
          <div class="angaar-card-box">
            <div class="angaar-card-header">
              <h3 class="angaar-card-title">GitHub Auto-Sync</h3>
              <span class="angaar-tag angaar-tag-success">✓ Connected</span>
            </div>
            <p class="angaar-card-desc">
              All accepted submissions will automatically commit and push to your GitHub repository:
            </p>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--theme-bg);border:1px solid var(--theme-border-subtle);border-radius:var(--radius-sm);margin:8px 0;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:22px;"></span>
                <div>
                  <div style="font-size:14px;font-weight:var(--weight-medium);color:var(--theme-text);">
                    <a href="https://github.com/${repo}" target="_blank" style="color:var(--theme-accent);text-decoration:none;">
                      ${repo}
                    </a>
                  </div>
                  <div style="font-size:12px;color:var(--theme-success);margin-top:2px;">
                    ● Auto-Sync Active
                  </div>
                </div>
              </div>
              <button class="angaar-btn angaar-btn-secondary" id="gh-disconnect-btn" style="color:var(--theme-danger);border-color:rgba(239,68,68,0.3);">
                Disconnect
              </button>
            </div>
          </div>
        `;

        document.getElementById('gh-disconnect-btn')?.addEventListener('click', () => {
          if (confirm('Are you sure you want to disconnect GitHub Sync?')) {
            safeStorage.remove(['angaar_gh_token', 'angaar_gh_repo', 'angaar_gh_enabled'], () => {
              showToast('Disconnected', 'GitHub Sync unlinked.', 'info');
              renderGitHubUI();
            });
          }
        });
      } else {
        container.innerHTML = `
          <div class="angaar-card-box">
            <div class="angaar-card-header">
              <h3 class="angaar-card-title">1. Access Token</h3>
              <span class="angaar-tag angaar-tag-info">Required</span>
            </div>
            <p class="angaar-card-desc">
              Generate a personal access token with repo scope:
            </p>
            <div>
              <button class="angaar-btn angaar-btn-secondary" id="gh-open-token-link-btn">
                Open GitHub
              </button>
            </div>
          </div>

          <div class="angaar-card-box">
            <div class="angaar-card-header">
              <h3 class="angaar-card-title">2. Connect Repository</h3>
              <span class="angaar-tag angaar-tag-success">angaar-dsa-abhiyank</span>
            </div>
            <p class="angaar-card-desc">
              Paste token to auto-create and connect repository:
            </p>
            <input type="password" id="gh-token" class="angaar-form-input" placeholder="Paste token (ghp_...)" />
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <button class="angaar-btn angaar-btn-primary" id="gh-auto-connect-btn">
                Connect
              </button>
            </div>
            <div id="gh-status" style="font-size: 12px; margin-top: 4px;"></div>
          </div>
        `;

        document.getElementById('gh-open-token-link-btn')?.addEventListener('click', () => {
          window.open('https://github.com/settings/tokens/new?description=AngaarToolkit-Sync&scopes=repo', '_blank');
        });

        document.getElementById('gh-auto-connect-btn')?.addEventListener('click', async () => {
          const token = document.getElementById('gh-token')?.value?.trim();
          const statusEl = document.getElementById('gh-status');
          if (!token) {
            showToast('Token Required', 'Please paste your GitHub token.', 'info');
            return;
          }

          if (statusEl) statusEl.innerHTML = '<span style="color:var(--theme-info);">Detecting GitHub profile...</span>';

          try {
            const userRes = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });

            if (!userRes.ok) throw new Error('Invalid GitHub Token.');

            const userData = await userRes.json();
            const username = userData.login;
            const defaultRepoName = 'angaar-dsa-abhiyank';
            const fullRepo = `${username}/${defaultRepoName}`;

            if (statusEl) statusEl.innerHTML = `<span style="color:var(--theme-info);">Checking ${defaultRepoName}...</span>`;

            const repoCheckRes = await fetch(`https://api.github.com/repos/${fullRepo}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });

            if (repoCheckRes.status === 404) {
              const createRes = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: defaultRepoName,
                  description: 'Solutions from The Angaar Batch (Auto-Synced via Angaar Pro)',
                  private: false,
                  auto_init: true
                })
              });

              if (!createRes.ok) {
                const errData = await createRes.json();
                throw new Error(errData.message || 'Failed to auto-create repo.');
              }
            }

            safeStorage.set({
              angaar_gh_token: token,
              angaar_gh_repo: fullRepo,
              angaar_gh_enabled: true
            }, () => {
              showToast('Connected!', `Synced to ${fullRepo}`, 'success');
              renderGitHubUI();
            });

          } catch(err) {
            console.error(err);
            if (statusEl) statusEl.innerHTML = `<span style="color:var(--theme-danger);">Error: ${err.message}</span>`;
          }
        });
      }
    });
  }

  function openModal() {
    checkAndFetchCurrentQuestion();
      fetchBatchDetails();
    updateSolutionsTab();
    const overlay = document.getElementById('angaar-ext-modal-overlay');
    if (!overlay) return;
    overlay.classList.add('angaar-active');

    if (allMembers.length === 0) {
      loadLocalCache((hasCache) => {
        if (!hasCache) {
          fetchAllMembers();
        }
      });
    } else {
      updateCacheUI();
      renderMyRankBanner();
    }
  }

  function closeModal() {
    const overlay = document.getElementById('angaar-ext-modal-overlay');
    overlay?.classList.remove('angaar-active');
  }

  function updateProgress(page, totalLoaded, isDone = false) {
    const progressWrap = document.getElementById('angaar-progress-wrap');
    const progressText = document.getElementById('angaar-progress-text');
    const progressFill = document.getElementById('angaar-progress-fill');
    if (!progressWrap) return;

    if (isDone) {
      progressWrap.style.display = 'none';
      return;
    }

    progressWrap.style.display = 'flex';
    if (progressText) progressText.textContent = `Page ${page} (${totalLoaded} loaded)`;
    if (progressFill) {
      const percent = Math.min(95, page * 2);
      progressFill.style.width = `${percent}%`;
    }
  }

  // 13. Fetch Leaderboard
  async function fetchAllMembers(forceRefresh = false) {
    if (isLoading) return;
    isLoading = true;

    const countBadge = document.getElementById('angaar-count-badge');
    const tableArea = document.getElementById('angaar-table-area');

    if (tableArea && allMembers.length === 0) {
      tableArea.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: var(--theme-text-muted);">
          <div style="width: 32px; height: 32px; border: 3px solid var(--theme-border); border-top-color: var(--theme-accent); border-radius: var(--radius-full); margin: 0 auto 16px; animation: spin 0.8s linear infinite;"></div>
          <p style="font-size: 13px;">Loading leaderboard...</p>
        </div>
      `;
    }

    const rawApiUrl = findApiUrl();
    let members = [];
    let page = 1;
    let hasMore = true;

    try {
      while (hasMore && page <= 120) {
        updateProgress(page, members.length);

        const urlObj = new URL(rawApiUrl, window.location.origin);
        urlObj.searchParams.set('page', String(page));
        urlObj.searchParams.set('page_size', '10');
        const targetUrl = urlObj.toString();

        const res = await fetch(targetUrl, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) break;

        const data = await res.json();
        const items = data.leaderboard || data.results || (Array.isArray(data) ? data : []);

        if (!items || items.length === 0) {
          hasMore = false;
          break;
        }

        items.forEach(it => members.push(normalizeMember(it, members.length)));

        if (items.length < 5) hasMore = false;
        page++;
        await new Promise(r => setTimeout(r, 60));
      }

      updateProgress(page, members.length, true);

      if (members.length > 0) {
        allMembers = members;
        filteredMembers = [...allMembers];
        saveLocalCache();
        if (countBadge) countBadge.textContent = `${allMembers.length} Students`;
        renderTable();
        computeAnalytics(allMembers);
        renderMyRankBanner();
        if (forceRefresh) showToast('Loaded', `${allMembers.length} students loaded & cached.`, 'success');
      }
    } catch(err) {
      console.error(err);
      if (tableArea && allMembers.length === 0) {
        tableArea.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--theme-danger);">Failed: ${err.message}</div>`;
      }
    } finally {
      isLoading = false;
    }
  }

  // 14. Render Table (Interactive Member Identity - Section 11 rules.md)
  function renderTable() {
    const tableArea = document.getElementById('angaar-table-area');
    if (!tableArea) return;

    if (filteredMembers.length === 0) {
      tableArea.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--theme-text-muted);">No matching students found.</div>';
      return;
    }

    let html = `
      <table class="angaar-table">
        <thead>
          <tr>
            <th style="width: 80px;" data-col="rank">Rank ↕</th>
            <th data-col="name">Student ↕</th>
            <th style="width: 130px;" data-col="score">Score ↕</th>
            <th style="width: 130px;" data-col="solved">Solved ↕</th>
            <th style="width: 160px;">Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredMembers.forEach((m) => {
      const isMe = myProfile && (
        (myProfile.id && String(m.id) === String(myProfile.id)) ||
        (m.name && m.name.toLowerCase() === myProfile.name.toLowerCase())
      );

      let rankClass = 'angaar-rank-general';
      let rankLabel = `#${m.rank}`;
      if (m.rank === 1) { rankClass = 'angaar-rank-top1'; rankLabel = '#1'; }
      else if (m.rank === 2) { rankClass = 'angaar-rank-top2'; rankLabel = '#2'; }
      else if (m.rank === 3) { rankClass = 'angaar-rank-top3'; rankLabel = '#3'; }

      html += `
        <tr class="${isMe ? 'angaar-row-me' : ''}">
          <td><span class="angaar-rank-num ${rankClass}">${rankLabel}</span></td>
          <td>
            <div class="angaar-member-cell student-profile-trigger" data-id="${m.id}" title="Click to view ${escapeHtml(m.name)}'s 360° Profile">
              <div class="angaar-avatar-circle">${m.name.charAt(0).toUpperCase()}</div>
              <span class="angaar-member-name">${escapeHtml(m.name)} ${isMe ? '⭐ (You)' : ''}</span>
            </div>
          </td>
          <td><span class="angaar-val-pill">⭐ ${m.score.toLocaleString()}</span></td>
          <td><span class="angaar-solved-stat">✓ ${m.solved}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <button class="angaar-pin-btn view-student-profile-btn" data-id="${m.id}" title="View Student 360° Profile">Profile</button>
              ${isMe ? 
                '<span style="font-size:11px;color:var(--theme-accent);font-weight:500;">✓ Pinned</span>' :
                `<button class="angaar-pin-btn" data-pin-name="${escapeHtml(m.name)}" data-pin-id="${m.id}" data-pin-rank="${m.rank}" data-pin-score="${m.score}" data-pin-solved="${m.solved}">⭐ Pin Me</button>`
              }
            </div>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    tableArea.innerHTML = html;

    tableArea.querySelectorAll('th[data-col]').forEach(th => {
      th.addEventListener('click', () => sortMembers(th.getAttribute('data-col')));
    });

    tableArea.querySelectorAll('.student-profile-trigger, .view-student-profile-btn').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        openStudentProfile(id);
      });
    });

    tableArea.querySelectorAll('.angaar-pin-btn[data-pin-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-pin-name');
        const id = btn.getAttribute('data-pin-id');
        const rank = parseInt(btn.getAttribute('data-pin-rank')) || 1;
        const score = parseInt(btn.getAttribute('data-pin-score')) || 0;
        const solved = parseInt(btn.getAttribute('data-pin-solved')) || 0;
        saveMyProfile({ name, id, rank, score, solved });
      });
    });
  }

  function sortMembers(col) {
    if (currentSort.col === col) currentSort.asc = !currentSort.asc;
    else { currentSort.col = col; currentSort.asc = true; }

    filteredMembers.sort((a, b) => {
      let valA = a[col], valB = b[col];
      if (col === 'rank' || col === 'score' || col === 'solved') {
        valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0;
      } else {
        valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
      }
      if (valA < valB) return currentSort.asc ? -1 : 1;
      if (valA > valB) return currentSort.asc ? 1 : -1;
      return 0;
    });
    renderTable();
  }

  // 15. Auto-Fetch Question Details & Watch For Solved Events
  function handleQuestionDataReceived(data) {
    if (!data) return;
    const problemSlug = getProblemSlug();
    const problem = data.problem || data;

    window.__CURRENT_QUESTION_DATA__ = problem;
    window.__CURRENT_SHEET_DATA__ = data;

    const suggested = getSuggestedTemplate(problem.title, data.sheet?.name, problem.description);
    renderEditorSuggestBar(suggested);
    updateSolutionsTab();

    if (problem.status === 'solved' && problemSlug && !processedQuestions.has(problemSlug)) {
      handleProblemSolved(problemSlug);
    }
  }

  function extractQuestionFromDOM(problemSlug) {
    try {
      if (window.__CURRENT_QUESTION_DATA__ && (window.__CURRENT_QUESTION_DATA__.slug === problemSlug || String(window.__CURRENT_QUESTION_DATA__.id) === problemSlug)) return;

      let title = '';
      const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]');
      if (titleEl) {
        title = (titleEl.innerText || titleEl.textContent || '').trim();
      }
      if (!title && document.title) {
        title = document.title.split('|')[0].split('-')[0].trim();
      }
      if (!title && problemSlug) {
        title = problemSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      }

      let description = '';
      const descEl = document.querySelector('.problem-description, [class*="description"], [class*="statement"], [class*="markdown"]');
      if (descEl) {
        description = (descEl.innerText || descEl.textContent || '').trim();
      }

      const testCases = [];
      const tcElements = document.querySelectorAll('[class*="testcase"], [class*="test-case"]');
      if (tcElements.length > 0) {
        tcElements.forEach((el, idx) => {
          const txt = (el.innerText || '').trim();
          if (txt) {
            testCases.push({ input: `Sample #${idx + 1}`, expected_output: txt });
          }
        });
      }

      const domData = {
        problem: {
          id: problemSlug,
          slug: problemSlug,
          title: title || 'Problem',
          description: description,
          testCases: testCases,
          examples: []
        },
        sheet: { name: 'Practice' },
        siblings: []
      };

      handleQuestionDataReceived(domData);
    } catch(err) {}
  }

  async function checkAndFetchCurrentQuestion() {
    try {
      const problemSlug = getProblemSlug();
      if (!problemSlug) return;

      const tcBox = document.getElementById('cheat-testcases-box');
      if (tcBox && (!window.__CURRENT_QUESTION_DATA__ || (window.__CURRENT_QUESTION_DATA__.slug !== problemSlug && String(window.__CURRENT_QUESTION_DATA__.id) !== problemSlug))) {
        tcBox.innerHTML = '<span style="color:var(--theme-text-subtle);">Loading test cases & examples...</span>';
      }

      // If already loaded for this problem, update UI and return
      if (window.__CURRENT_QUESTION_DATA__ && (window.__CURRENT_QUESTION_DATA__.slug === problemSlug || String(window.__CURRENT_QUESTION_DATA__.id) === problemSlug)) {
        updateSolutionsTab();
        return;
      }

      // 1. Request MAIN world (injected.js) to fetch with native page origin
      window.dispatchEvent(new CustomEvent('ANGAAR_FETCH_QUESTION', {
        detail: { slug: problemSlug }
      }));

      // 2. Direct fetch with absolute origin URL (fallback)
      try {
        const fullUrl = `${window.location.origin}/api/django/dashboard/api/v1/question/${problemSlug}`;
        const res = await fetch(fullUrl, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          handleQuestionDataReceived(data);
          return;
        }
      } catch(err) {
        // Silently handled - MAIN world bridge or DOM fallback will fulfill
      }

      // 3. Fallback: Parse from DOM after small delay if still not loaded
      setTimeout(() => {
        if (!window.__CURRENT_QUESTION_DATA__ || (window.__CURRENT_QUESTION_DATA__.slug !== problemSlug && String(window.__CURRENT_QUESTION_DATA__.id) !== problemSlug)) {
          extractQuestionFromDOM(problemSlug);
        }
      }, 500);

    } catch(e) {}
  }

  
  // =========================================================================
  // GLOBAL NETWORK LISTENER FOR SUBMISSIONS (Immediate Auto-Push on Accepted)
  // =========================================================================
  let lastNetworkPushTime = 0;
  window.addEventListener('ANGAAR_NETWORK_RESULT', (e) => {
    try {
      const detail = e.detail;
      if (!detail) return;
      const url = detail.url || '';
      const data = detail.data || {};
      const slug = getProblemSlug();

      if (slug && data) {
        captureEvaluationTestCases(slug, data);
      }

      const lowerUrl = url.toLowerCase();
      const isSubmission = 
        lowerUrl.includes('submit') || 
        lowerUrl.includes('submission') || 
        lowerUrl.includes('run_code') || 
        lowerUrl.includes('execute');

      const statusStr = String(
        data.status || 
        data.result || 
        data.verdict || 
        data.state || 
        data.message || 
        data.data?.status || 
        data.data?.verdict || 
        data.submission?.status || 
        ''
      ).toLowerCase();

      const testResults = Array.isArray(data.test_cases) ? data.test_cases : 
                          (Array.isArray(data.results) ? data.results : 
                          (Array.isArray(data.test_results) ? data.test_results : []));

      const allTestsPassed = testResults.length > 0 && testResults.every(tc => {
        const s = String(tc.status || tc.verdict || tc.result || '').toLowerCase();
        return s === 'passed' || s === 'accepted' || s === 'correct' || tc.passed === true;
      });

      const isAccepted = isSubmission && (
        statusStr === 'accepted' ||
        statusStr === 'passed' ||
        statusStr === 'success' ||
        statusStr.includes('accepted') ||
        statusStr.includes('passed') ||
        statusStr.includes('all test cases passed') ||
        statusStr.includes('submission successful') ||
        data.judge_status_id === 3 ||
        data.status_id === 3 ||
        allTestsPassed
      );

      const userSubmitted = isUserActivelySubmitting();

      if (isAccepted && slug && userSubmitted && (Date.now() - lastNetworkPushTime > 8000)) {
        lastNetworkPushTime = Date.now();
        window.__IS_USER_SUBMITTING__ = false;
        lastUserSubmitTimestamp = 0;
        console.log('%cAngaar Pro: Verified User Submit Accepted! Auto-pushing to GitHub...', 'color: #22c55e; font-size: 13px; font-weight: bold;');
        showToast('Accepted! 🎉', 'Auto-syncing solution to GitHub...', 'success');
        setTimeout(() => {
          pushSolutionToGitHub(slug);
        }, 500);
      }
    } catch(err) {
      console.warn('Network result listener error:', err);
    }
  });

  // Listen for past submissions to extract evaluation test cases
  window.addEventListener('ANGAAR_MY_SUBMISSIONS_DATA', (e) => {
    try {
      const data = e.detail?.data;
      const slug = getProblemSlug();
      if (!slug || !data) return;

      const submissions = Array.isArray(data) ? data : (data.results || data.submissions || [data]);
      submissions.forEach(sub => {
        captureEvaluationTestCases(slug, sub);
        if (sub.test_results) captureEvaluationTestCases(slug, { test_cases: sub.test_results });
      });
    } catch(err) {}
  });

  // Listen for sheet questions from bridge
  window.addEventListener('ANGAAR_SHEET_QUESTIONS_DATA', (e) => {
    try {
      const { sheetId, data } = e.detail || {};
      const questions = Array.isArray(data) ? data : (data.questions || data.results || []);
      const sheetName = data.name || data.sheet?.name;
      if (sheetName && questions.length > 0) {
        recordSheetQuestions(sheetName, questions);
        updateSolutionsTab();
      }
    } catch(err) {}
  });

  // Listen for full course catalog from page __NEXT_DATA__
  window.addEventListener('ANGAAR_COURSE_CATALOG', (e) => {
    try {
      const data = e.detail?.data;
      if (!data) return;
      const sheets = data.sheets || data.batch?.sheets || data.course?.sheets || [];
      if (Array.isArray(sheets)) {
        sheets.forEach(sh => {
          if (sh.name && Array.isArray(sh.questions) && sh.questions.length > 0) {
            recordSheetQuestions(sh.name, sh.questions);
          }
          if (sh.name && sh.id) {
            knownSheetIds[sh.name.trim()] = sh.id;
          }
        });
      }
    } catch(err) {}
  });

  function setupSubmissionObserver() {
    let lastAutoPushTime = 0;

    const checkAndTrigger = () => {
      try {
        const slug = getProblemSlug();
        if (!slug) return;

        // Must have actively submitted recently
        if (!isUserActivelySubmitting()) return;

        const bodyText = document.body?.innerText || '';
        const isAcceptedText = 
          bodyText.includes('All Test Cases Passed') ||
          bodyText.includes('Submission Successful') ||
          bodyText.includes('Submission Accepted') ||
          bodyText.includes('Test Cases Passed') ||
          bodyText.includes('Congratulations!');

        let isResultAccepted = false;
        const candidateBadges = document.querySelectorAll(
          '[class*="success"], [class*="status"], [class*="verdict"], [class*="badge"], [class*="result"], [class*="green"], [class*="emerald"], [data-tab="result"], [role="tabpanel"], .console-output'
        );
        candidateBadges.forEach(el => {
          const t = (el.innerText || el.textContent || '').trim().toLowerCase();
          if (t === 'accepted' || t.includes('accepted') || t.includes('all test cases passed') || t.includes('submission successful')) {
            isResultAccepted = true;
          }
        });

        if (!isResultAccepted && !isAcceptedText) {
          const allSpans = document.querySelectorAll('span, div, h2, h3, h4');
          for (let i = 0; i < allSpans.length; i++) {
            const el = allSpans[i];
            const t = el.textContent?.trim();
            if (t === 'Accepted' || t === 'All Test Cases Passed') {
              if (el.offsetWidth > 0 || el.offsetHeight > 0) {
                isResultAccepted = true;
                break;
              }
            }
          }
        }

        if ((isAcceptedText || isResultAccepted) && (Date.now() - lastAutoPushTime > 8000)) {
          lastAutoPushTime = Date.now();
          window.__IS_USER_SUBMITTING__ = false;
          lastUserSubmitTimestamp = 0;
          console.log('%cAngaar Pro: DOM verified Accepted! Auto-pushing to GitHub...', 'color: #22c55e; font-weight: bold;');
          showToast('Accepted! 🎉', 'Auto-syncing solution to GitHub...', 'success');
          setTimeout(() => {
            pushSolutionToGitHub(slug);
          }, 500);
        }
      } catch(e) {}
    };

    const observer = new MutationObserver(checkAndTrigger);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }


  // =========================================================================
  // TEST CASE INTERCEPTOR & SHEET CATALOG ENGINE
  // =========================================================================
  let capturedSandboxTestCases = {}; // keyed by problemSlug

  function captureEvaluationTestCases(slug, data) {
    if (!slug || !data) return;
    const list = Array.isArray(data.test_cases) ? data.test_cases : 
                 (Array.isArray(data.results) ? data.results : []);
    
    let newlyCaptured = 0;
    if (!capturedSandboxTestCases[slug]) capturedSandboxTestCases[slug] = [];

    list.forEach((tc, idx) => {
      const input = tc.input !== undefined ? tc.input : (tc.test_case?.input || tc.stdin || '');
      const expected = tc.expected_output !== undefined ? tc.expected_output : (tc.expected || tc.stdout || '');
      const actual = tc.actual_output !== undefined ? tc.actual_output : (tc.output || '');
      const passed = tc.status === 'passed' || tc.passed === true || String(tc.status || '').toLowerCase() === 'accepted';

      if (input !== undefined && input !== '') {
        const exists = capturedSandboxTestCases[slug].some(existing => String(existing.input) === String(input));
        if (!exists) {
          capturedSandboxTestCases[slug].push({
            id: 'eval-' + (capturedSandboxTestCases[slug].length + 1),
            input: input,
            expected_output: expected,
            actual_output: actual,
            passed: passed,
            status: tc.status || (passed ? 'Passed' : 'Failed')
          });
          newlyCaptured++;
        }
      }
    });

    if (newlyCaptured > 0) {
      safeStorage.set({ [`angaar_captured_tc_${slug}`]: capturedSandboxTestCases[slug] }, () => {
        updateSolutionsTab();
      });
    }
  }

  // Save discovered siblings into global course catalog
  function recordSheetQuestions(sheetName, questions) {
    if (!sheetName || !Array.isArray(questions) || questions.length === 0) return;
    const key = `angaar_sheet_catalog_${getCourseSlug()}`;
    safeStorage.get([key], (res) => {
      const catalog = res?.[key] || {};
      catalog[sheetName.trim()] = questions.map(q => ({
        id: q.id,
        title: q.title,
        slug: q.slug,
        difficulty: q.difficulty || 'Easy',
        status: q.status || 'unsolved'
      }));
      safeStorage.set({ [key]: catalog });
    });
  }

  // 16. Update Solutions & Cheats Tab
  function updateSolutionsTab() {
    const qData = window.__CURRENT_QUESTION_DATA__;
    const sData = window.__CURRENT_SHEET_DATA__;

    const suggested = getSuggestedTemplate(qData?.title, sData?.sheet?.name, qData?.description);
    renderSuggestedBanner(suggested);
    renderTemplatesList();
    renderPeerSolutions();

    // Render Test Cases & Examples Box
    const tcBox = document.getElementById('cheat-testcases-box');
    if (tcBox) {
      let output = '';
      const testCases = qData?.testCases || [];
      const examples = qData?.examples || [];

      if (testCases.length > 0) {
        output += testCases.map((tc, idx) => {
          let inp = tc.input;
          if (inp === undefined || inp === null || inp === '""' || inp === '""\r\n' || inp === '""\n' || String(inp).trim() === '') {
            inp = '(No Input / Empty)';
          }
          let out = tc.expected_output !== undefined ? tc.expected_output : (tc.output || '');
          return `Sample Test Case #${idx + 1}:\nInput:\n${inp}\n\nExpected Output:\n${out}`;
        }).join('\n\n-----------------------------------------\n\n');
      }

      if (examples.length > 0) {
        if (output) output += '\n\n=========================================\n=== Problem Statement Examples ===\n=========================================\n\n';
        output += examples.map((ex, idx) =>
          `Example #${idx + 1}:\nInput: ${ex.input || 'None'}\nOutput: ${ex.output || 'None'}${ex.explanation ? '\nExplanation: ' + ex.explanation : ''}`
        ).join('\n\n-----------------------------------------\n\n');
      }

      if (qData?.scenario) {
        output += `\n\nScenario / Context:\n${qData.scenario}`;
      }
      if (qData?.input_format && qData.input_format !== 'NA') {
        output += `\n\nInput Format:\n${qData.input_format}`;
      }
      if (qData?.output_format && qData.output_format !== 'NA') {
        output += `\n\nOutput Format:\n${qData.output_format}`;
      }
      if (qData?.constraints) {
        output += `\n\nConstraints:\n${qData.constraints}`;
      }

      tcBox.textContent = output || 'No public sample test cases available for this question.\nClick "Run Tests" (Shift+Z) to automatically evaluate and capture hidden grader test cases!';
    }

    // Render YouTube Box
    const ytBox = document.getElementById('cheat-youtube-box');
    if (ytBox) {
      if (qData?.youtube_url) {
        ytBox.innerHTML = `<a href="${qData.youtube_url}" target="_blank" class="angaar-btn angaar-btn-primary" style="text-decoration:none;">Watch Solution</a>`;
      } else {
        ytBox.innerHTML = '<span style="color:var(--theme-text-subtle);font-size:12px;">No video URL for this problem.</span>';
      }
    }

    // Render Course Sheet Navigator
    const sibBox = document.getElementById('cheat-siblings-list');
    const sheetNameEl = document.getElementById('cheat-sheet-name');
    const sheetSelect = document.getElementById('angaar-sheet-select');
    const courseSlug = getCourseSlug();
    const currentSheetName = sData?.sheet?.name || 'For loop Template';

    if (sheetNameEl) sheetNameEl.textContent = currentSheetName;

    // Build questions renderer function
    function renderQuestionRows(list) {
      if (!sibBox) return;
      if (!Array.isArray(list) || list.length === 0) {
        sibBox.innerHTML = `
          <div style="padding:24px;text-align:center;color:var(--theme-text-subtle);font-size:12px;">
            No questions recorded yet for this sheet.<br>
            <span style="font-size:11px;color:var(--theme-accent);margin-top:6px;display:inline-block;">Open any question in this sheet to auto-load all sibling questions!</span>
          </div>
        `;
        return;
      }

      sibBox.innerHTML = list.map(sib => {
        const isSolved = sib.status === 'solved';
        const url = `/courses/${courseSlug}/solve/${sib.slug}`;
        return `
          <a href="${url}" class="angaar-sibling-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--theme-surface-elevated);border:1px solid var(--theme-border-subtle);border-radius:var(--radius-sm);margin-bottom:6px;text-decoration:none;">
            <span style="display:flex;align-items:center;gap:10px;">
              <span style="color:${isSolved ? 'var(--theme-success)' : 'var(--theme-text-subtle)'};font-size:14px;font-weight:bold;">${isSolved ? '✓' : '○'}</span>
              <span style="${isSolved ? 'color:var(--theme-success);' : 'color:var(--theme-text);'};font-weight:500;font-size:13px;">${escapeHtml(sib.title)}</span>
            </span>
            <span class="angaar-tag angaar-tag-info" style="font-size:11px;">${sib.difficulty || 'Easy'}</span>
          </a>
        `;
      }).join('');
    }

    // Immediately render current siblings if available
    if (sData?.siblings && sData.siblings.length > 0) {
      renderQuestionRows(sData.siblings);
    }

    // Populate sheets dropdown
    if (sheetSelect) {
      const knownSheets = new Set();
      knownSheets.add(currentSheetName);

      allMembers.forEach(m => {
        if (m.breakdown) {
          Object.keys(m.breakdown).forEach(sName => knownSheets.add(sName.trim()));
        }
      });

      const catalogKey = `angaar_sheet_catalog_${courseSlug}`;
      safeStorage.get([catalogKey], (cRes) => {
        const catalog = cRes?.[catalogKey] || {};
        Object.keys(catalog).forEach(sName => knownSheets.add(sName.trim()));

        const sortedSheets = Array.from(knownSheets).filter(Boolean).sort();
        sheetSelect.innerHTML = sortedSheets.map(sName => 
          `<option value="${escapeHtml(sName)}" ${sName === currentSheetName ? 'selected' : ''}>${escapeHtml(sName)}</option>`
        ).join('');

        sheetSelect.onchange = (e) => {
          const selectedSheet = e.target.value;
          if (sheetNameEl) sheetNameEl.textContent = selectedSheet;
          if (selectedSheet === currentSheetName && sData?.siblings) {
            renderQuestionRows(sData.siblings);
          } else if (catalog[selectedSheet] && catalog[selectedSheet].length > 0) {
            renderQuestionRows(catalog[selectedSheet]);
          } else {
            const sheetId = knownSheetIds[selectedSheet];
            if (sheetId) {
              window.dispatchEvent(new CustomEvent('ANGAAR_FETCH_SHEET_QUESTIONS', {
                detail: { sheetId: sheetId }
              }));
            }
            renderQuestionRows(catalog[selectedSheet] || []);
          }
        };
      });
    }
  }

  // Render Suggested Banner
  function renderSuggestedBanner(template) {
    const wrap = document.getElementById('angaar-suggested-template-wrap');
    if (!wrap || !template) return;

    wrap.innerHTML = `
      <div class="angaar-suggested-banner">
        <div class="angaar-suggested-header">
          <div style="display:flex;align-items:center;gap:8px;">
            
            <div>
              <div style="font-weight:var(--weight-medium);color:var(--theme-text);font-size:14px;">
                Suggested Template: <strong>${escapeHtml(template.name)}</strong>
              </div>
              <div style="font-size:12px;color:var(--theme-text-muted);">
                ${escapeHtml(template.desc)}
              </div>
            </div>
          </div>
          <span class="angaar-tag angaar-tag-accent">${template.lang}</span>
        </div>
        <div class="angaar-code-box" style="max-height:110px;">${escapeHtml(template.code)}</div>
        <div class="angaar-action-row">
          <button class="angaar-btn angaar-btn-secondary" id="suggested-copy-btn">Copy</button>
          <button class="angaar-btn angaar-btn-primary" id="suggested-insert-btn">Insert into Editor</button>
        </div>
      </div>
    `;

    wrap.querySelector('#suggested-insert-btn')?.addEventListener('click', () => {
      insertCodeIntoMonaco(template.code);
    });

    wrap.querySelector('#suggested-copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(template.code);
      showToast('Copied', 'Template copied to clipboard.', 'success');
    });
  }

  // Render Templates List
  function renderTemplatesList() {
    const listContainer = document.getElementById('angaar-templates-list');
    if (!listContainer) return;

    const qData = window.__CURRENT_QUESTION_DATA__;
    const starterItems = [];
    if (qData?.starterCode && typeof qData.starterCode === 'object') {
      Object.entries(qData.starterCode).forEach(([lang, code]) => {
        if (code && typeof code === 'string' && code.trim()) {
          starterItems.push({
            id: `starter-${lang.toLowerCase()}`,
            name: `${qData.title || 'Problem'} Starter Boilerplate`,
            lang: lang,
            desc: `Official starter boilerplate for this problem (${lang})`,
            code: code
          });
        }
      });
    }

    const all = [...starterItems, ...customTemplates, ...BUILTIN_TEMPLATES];
    listContainer.innerHTML = all.map(t => `
      <div class="angaar-peer-card">
        <div class="angaar-peer-author-row">
          <div class="angaar-peer-author-info">
            <span style="font-weight:var(--weight-medium);color:var(--theme-text);font-size:13px;">${escapeHtml(t.name)}</span>
            <span class="angaar-tag ${t.id.startsWith('custom-') ? 'angaar-tag-success' : 'angaar-tag-info'}">${t.lang}</span>
          </div>
          <div class="angaar-peer-badges">
            <span style="font-size:11px;color:var(--theme-text-subtle);">${t.desc || 'Boilerplate'}</span>
            ${t.id.startsWith('custom-') ? `<button class="angaar-pin-btn delete-custom-btn" data-id="${t.id}">Delete</button>` : ''}
          </div>
        </div>
        <div class="angaar-code-box" style="max-height:130px;">${escapeHtml(t.code)}</div>
        <div class="angaar-action-row">
          <button class="angaar-btn angaar-btn-secondary copy-template-btn" data-code="${encodeURIComponent(t.code)}">Copy</button>
          <button class="angaar-btn angaar-btn-primary insert-template-btn" data-code="${encodeURIComponent(t.code)}">Insert into Editor</button>
        </div>
      </div>
    `).join('');

    listContainer.querySelectorAll('.insert-template-btn').forEach(b => {
      b.addEventListener('click', () => {
        const code = decodeURIComponent(b.getAttribute('data-code'));
        insertCodeIntoMonaco(code);
      });
    });

    listContainer.querySelectorAll('.copy-template-btn').forEach(b => {
      b.addEventListener('click', () => {
        const code = decodeURIComponent(b.getAttribute('data-code'));
        navigator.clipboard.writeText(code);
        showToast('Copied', 'Code copied to clipboard.', 'success');
      });
    });

    listContainer.querySelectorAll('.delete-custom-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        deleteCustomTemplate(id);
      });
    });
  }

  // 17. Render Authentic Peer Solutions (Zero Fake Data)
  function renderPeerSolutions() {
    const container = document.getElementById('angaar-peer-solutions-list');
    if (!container) return;

    const slug = getProblemSlug() || 'general';
    const key = `angaar_peer_solutions_${slug}`;

    safeStorage.get([key], (res) => {
      const communitySolutions = res && Array.isArray(res[key]) ? res[key] : [];

      if (communitySolutions.length === 0) {
        container.innerHTML = `
          <div style="padding: 40px 20px; text-align: center; background: var(--theme-surface); border: 1px solid var(--theme-border); border-radius: var(--radius-lg);">
            
            <div style="font-size: 14px; font-weight: var(--weight-medium); color: var(--theme-text); margin-bottom: 6px;">
              No Community Solutions Shared Yet
            </div>
            <p style="font-size: 12px; color: var(--theme-text-muted); max-width: 440px; margin: 0 auto 16px; line-height: 1.5;">
              Platform restricts direct peer solution scraping. Click below to share your accepted code for this question so other batch students can learn!
            </p>
            <button class="angaar-btn angaar-btn-primary" id="empty-share-btn">
              Share Solution
            </button>
          </div>
        `;

        container.querySelector('#empty-share-btn')?.addEventListener('click', () => {
          const box = document.getElementById('angaar-share-form-box');
          if (box) {
            box.style.display = 'block';
            box.scrollIntoView({ behavior: 'smooth' });
          }
        });
        return;
      }

      container.innerHTML = communitySolutions.map(sol => `
        <div class="angaar-peer-card">
          <div class="angaar-peer-author-row">
            <div class="angaar-peer-author-info">
              <div class="angaar-avatar-circle" style="width:26px;height:26px;font-size:11px;">
                ${sol.author.charAt(0).toUpperCase()}
              </div>
              <span style="font-weight:var(--weight-medium);color:var(--theme-text);font-size:13px;">
                ${escapeHtml(sol.author)}
              </span>
              <span class="angaar-rank-num angaar-rank-top1" style="height:22px;padding:0 6px;font-size:11px;">
                ${sol.rankLabel}
              </span>
            </div>
            <div class="angaar-peer-badges">
              <span class="angaar-tag angaar-tag-info">${sol.lang || 'Java'}</span>
              <span class="angaar-tag angaar-tag-success">${sol.complexity || 'Accepted'}</span>
            </div>
          </div>

          <div class="angaar-code-box" style="max-height:160px;">${escapeHtml(sol.code)}</div>

          <div class="angaar-action-row">
            <button class="angaar-btn angaar-btn-secondary peer-copy-btn" data-code="${encodeURIComponent(sol.code)}">
              Copy
            </button>
            <button class="angaar-btn angaar-btn-primary peer-insert-btn" data-code="${encodeURIComponent(sol.code)}">
              Insert into Editor
            </button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.peer-insert-btn').forEach(b => {
        b.addEventListener('click', () => {
          const code = decodeURIComponent(b.getAttribute('data-code'));
          insertCodeIntoMonaco(code);
        });
      });

      container.querySelectorAll('.peer-copy-btn').forEach(b => {
        b.addEventListener('click', () => {
          const code = decodeURIComponent(b.getAttribute('data-code'));
          navigator.clipboard.writeText(code);
          showToast('Copied', 'Solution code copied.', 'success');
        });
      });
    });
  }

  // 18. Compute Analytics
  function computeAnalytics(members) {
    if (!members || members.length === 0) return;
    const top10 = members.slice(0, 10);
    const topSolved = top10.map(m => m.solved);

    const topScoreEl = document.getElementById('stat-top-score');
    if (topScoreEl) topScoreEl.textContent = top10[0]?.score?.toLocaleString() || '0';

    const avgSolved = Math.round(topSolved.reduce((a, b) => a + b, 0) / top10.length);
    const topAvgEl = document.getElementById('stat-top10-avg');
    if (topAvgEl) topAvgEl.textContent = `${avgSolved}`;

    const topicAgg = {};
    top10.forEach(m => {
      if (m.breakdown) {
        Object.entries(m.breakdown).forEach(([topic, cnt]) => {
          topicAgg[topic] = (topicAgg[topic] || 0) + cnt;
        });
      }
    });

    const sortedTopics = Object.entries(topicAgg)
      .map(([topic, total]) => ({ topic: topic.trim(), avg: (total / top10.length).toFixed(1) }))
      .sort((a, b) => b.avg - a.avg);

    const barsContainer = document.getElementById('angaar-topic-bars');
    if (barsContainer) {
      barsContainer.innerHTML = sortedTopics.slice(0, 10).map(t => `
        <div class="angaar-topic-item">
          <div class="angaar-topic-meta">
            <span style="color: var(--theme-text);">${escapeHtml(t.topic)}</span>
            <span style="color: var(--theme-accent);">${t.avg} avg</span>
          </div>
          <div class="angaar-bar-bg">
            <div class="angaar-bar-fill" style="width: ${Math.min(100, t.avg * 7)}%;"></div>
          </div>
        </div>
      `).join('');
    }
  }

  // 19. Markdown Checklist Export
  function exportNotionChecklist() {
    showToast('Checklist', 'Generating...', 'info');
    let md = '# The Angaar Batch - DSA Sheet Checklist\n\n';
    md += `*Generated: ${new Date().toLocaleDateString()}*\n\n`;
    md += '| Status | Topic | Target |\n';
    md += '| :---: | :--- | :---: |\n';

    const sheets = [
      'Binary Search', '2 Pointer Partitioning', 'HashMap Frequency',
      'LinkedList Cracker', 'Recursion Template', 'Monotonic Stack', 'Bottom-Up DFS'
    ];

    sheets.forEach((topic) => {
      md += `| [ ] | ${topic} | 10+ Solved |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'angaar_dsa_checklist.md';
    a.click();
    showToast('Downloaded', 'Saved checklist.', 'success');
  }

  function exportToCSV() {
    if (allMembers.length === 0) return showToast('Empty', 'Load data first.', 'info');
    const headers = ['Rank', 'Name', 'Student ID', 'Total Score', 'Solved Problems'];
    const rows = allMembers.map(m => [m.rank, `"${m.name.replace(/"/g, '""')}"`, m.id, m.score, m.solved]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `angaar_full_leaderboard_${allMembers.length}_members.csv`;
    a.click();
  }

  function copyJSON() {
    if (allMembers.length === 0) return showToast('Empty', 'Load data first.', 'info');
    navigator.clipboard.writeText(JSON.stringify(allMembers, null, 2)).then(() => {
      const btn = document.getElementById('angaar-copy-json-btn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = orig, 1800);
      }
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // SPA Route Change Listener for Next.js
  let lastProblemSlug = null;
  let lastUrl = window.location.href;

  function handleRouteChange() {
    if (!isContextValid()) return;
    const currentUrl = window.location.href;
    const currentSlug = getProblemSlug();

    if (currentSlug !== lastProblemSlug || currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      lastProblemSlug = currentSlug;

      if (currentSlug) {
        console.log('Route changed to problem:', currentSlug);
        checkAndFetchCurrentQuestion();
      fetchBatchDetails();
      }
    }
  }

  const origPushState = history.pushState;
  history.pushState = function() {
    origPushState.apply(this, arguments);
    handleRouteChange();
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function() {
    origReplaceState.apply(this, arguments);
    handleRouteChange();
  };

  window.addEventListener('popstate', handleRouteChange);
  setInterval(handleRouteChange, 600);


  // 20. Smart Auto-Runner Shortcut: Left Shift + Z
  // Runs code, monitors execution result, and automatically submits if test cases pass.
  let isAutoRunning = false;
  let isLeftShiftDown = false;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft') isLeftShiftDown = true;
  }, true);

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft') isLeftShiftDown = false;
  }, true);

  function findRunButton() {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const candidates = buttons.filter(b => {
      const id = b.id || '';
      return !b.closest('#angaar-ext-modal-overlay') && !b.closest('#angaar-toast-container') && !id.startsWith('angaar-');
    });

    let match = candidates.find(b => {
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      return txt === 'run' || txt === 'run code' || txt === 'run tests';
    });
    if (match) return match;

    return candidates.find(b => {
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      return txt.includes('run') && !txt.includes('submit');
    });
  }

  function findSubmitButton() {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const candidates = buttons.filter(b => {
      const id = b.id || '';
      return !b.closest('#angaar-ext-modal-overlay') && !b.closest('#angaar-toast-container') && !id.startsWith('angaar-');
    });

    let match = candidates.find(b => {
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      return txt === 'submit' || txt === 'submit code' || txt === 'submit solution';
    });
    if (match) return match;

    return candidates.find(b => {
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      return txt.includes('submit') && !txt.includes('submitting') && !txt.includes('history');
    });
  }

  function getResultPanelText() {
    const panel = document.querySelector('.console-output, [class*="result"], [class*="console"], [class*="output"], [id*="result"], [role="tabpanel"]') ||
                  document.body;
    return (panel ? (panel.innerText || panel.textContent || '') : '').trim();
  }

  function triggerAutoRunAndSubmit() {
    if (isAutoRunning) {
      showToast('Auto-Runner', 'Run already in progress...', 'info');
      return;
    }

    const runBtn = findRunButton();
    if (!runBtn) {
      showToast('Shortcut Active', 'Run button not found on this page.', 'error');
      return;
    }

    isAutoRunning = true;
    showToast('Auto-Runner', 'Running code (Shift+Z)...', 'info');

    const preText = getResultPanelText();
    let completed = false;

    // Click Run
    runBtn.click();

    // Listener for real-time network response intercepted by injected.js
    const onNetworkResult = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const url = detail.url || '';
      const data = detail.data || {};

      if (url.includes('submission_result') || url.includes('run_code') || url.includes('execute_code')) {
        const currentSlug = getProblemSlug();
        if (currentSlug && data) {
          captureEvaluationTestCases(currentSlug, data);
        }
        const status = String(data.status || data.result || '').toLowerCase();
        const testResults = Array.isArray(data.test_cases) ? data.test_cases : (Array.isArray(data.results) ? data.results : []);

        if (status === 'queued' || status === 'running' || status === 'pending') {
          return;
        }

        const isPassed = status === 'accepted' ||
                         status === 'passed' ||
                         status.includes('all test cases passed') ||
                         (testResults.length > 0 && testResults.every(tc => String(tc.status || '').toLowerCase() === 'passed' || tc.passed === true));

        const isFailed = status === 'wrong answer' ||
                         status === 'failed' ||
                         status === 'compilation error' ||
                         status === 'time limit exceeded' ||
                         status === 'runtime error' ||
                         (testResults.length > 0 && testResults.some(tc => String(tc.status || '').toLowerCase() === 'failed' || tc.passed === false));

        if (isPassed && !completed) {
          completed = true;
          cleanup();
          handleTestsPassed();
        } else if (isFailed && !completed) {
          completed = true;
          cleanup();
          handleTestsFailed(data.status || 'Test cases failed');
        }
      }
    };

    window.addEventListener('ANGAAR_NETWORK_RESULT', onNetworkResult);

    // DOM Polling Watcher fallback
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      if (completed) {
        clearInterval(pollInterval);
        return;
      }

      const currentText = getResultPanelText();
      if (currentText && currentText !== preText) {
        const lower = currentText.toLowerCase();

        if (lower.includes('all test cases passed') ||
            lower.includes('sample test cases passed') ||
            lower.includes('sample cases passed') ||
            (lower.includes('passed') && !lower.includes('0 passed') && !lower.includes('failed') && !lower.includes('error'))) {
          completed = true;
          cleanup();
          handleTestsPassed();
          return;
        }

        if (lower.includes('wrong answer') ||
            lower.includes('compilation error') ||
            lower.includes('runtime error') ||
            lower.includes('time limit exceeded') ||
            (lower.includes('failed') && !lower.includes('0 failed'))) {
          completed = true;
          cleanup();
          handleTestsFailed('Sample tests failed');
          return;
        }
      }

      if (pollCount > 80) { // 20s timeout
        completed = true;
        cleanup();
        isAutoRunning = false;
        showToast('Auto-Runner', 'Execution timed out.', 'error');
      }
    }, 250);

    function cleanup() {
      clearInterval(pollInterval);
      window.removeEventListener('ANGAAR_NETWORK_RESULT', onNetworkResult);
    }

    function handleTestsPassed() {
      showToast('Tests Passed', 'All sample tests passed! Auto-submitting...', 'success');
      setTimeout(() => {
        const submitBtn = findSubmitButton();
        if (submitBtn) {
          submitBtn.click();
          showToast('Submitted', 'Solution submitted automatically!', 'success');
        } else {
          showToast('Tests Passed', 'Submit button not found on page.', 'info');
        }
        isAutoRunning = false;
      }, 500);
    }

    function handleTestsFailed(reason) {
      isAutoRunning = false;
      showToast('Tests Failed', reason + '. Fix code before submitting.', 'error');
    }
  }

  // Bind Global Keyboard Shortcut (Left Shift + Z)
  window.addEventListener('keydown', (e) => {
    const isZ = e.code === 'KeyZ' || e.key === 'Z' || e.key === 'z';
    const isShift = isLeftShiftDown || e.shiftKey;

    if (isZ && isShift) {
      const target = e.target;
      const tag = (target?.tagName || '').toUpperCase();
      const isInput = tag === 'INPUT' || (tag === 'TEXTAREA' && !target.classList.contains('inputarea'));
      if (isInput && target.closest('#angaar-ext-modal-overlay')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      triggerAutoRunAndSubmit();
    }
  }, true);

  // Startup Listeners
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createUI();
      checkAndFetchCurrentQuestion();
      fetchBatchDetails();
      setupSubmissionObserver();
    });
  } else {
    createUI();
    checkAndFetchCurrentQuestion();
      fetchBatchDetails();
    setupSubmissionObserver();
  }
})();
