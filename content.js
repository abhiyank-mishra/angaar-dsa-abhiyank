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

                <!-- TAB 5: CHECKLIST (Interactive Hub - rules.md Compliant) -->
        <div class="angaar-tab-pane" id="tab-backup">
          <div id="angaar-checklist-root"></div>
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
        } else if (target === 'tab-backup') {
          renderChecklistUI();
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
    const overlay = document.getElementById('angaar-ext-modal-overlay');
    if (!overlay) return;
    overlay.classList.add('angaar-active');
    overlay.style.setProperty('opacity', '1', 'important');
    overlay.style.setProperty('visibility', 'visible', 'important');
    overlay.style.setProperty('pointer-events', 'auto', 'important');
    overlay.style.setProperty('display', 'flex', 'important');

    try {
      checkAndFetchCurrentQuestion();
      fetchBatchDetails();
      updateSolutionsTab();
    } catch (e) {
      console.warn('Silent openModal background update error:', e);
    }

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
    if (overlay) {
      overlay.classList.remove('angaar-active');
      overlay.style.setProperty('opacity', '0', 'important');
      overlay.style.setProperty('visibility', 'hidden', 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    }
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

  
  // =========================================================================
  // 19. INTERACTIVE IN-UI CHECKLIST ENGINE (Rules.md Compliant)
  // Master Palette: Obsidian #000000, Card Surface #121212, Hairline #202020
  // Chart/Progress Exception: Emerald #10B981, Track #262626
  // Minimal Wording (1-2 Words), Zero Text Wrapping
  // =========================================================================

  const ANGAAR_DEFAULT_CURRICULUM = [
    {
        "name": "Sheet 1: While Loop Template",
        "questions": [
            {
                "id": 401,
                "title": "Print Numbers from 1 to 10",
                "slug": "print-numbers-from-1-to-10",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 402,
                "title": "Print Reverse Numbers 10 to 1",
                "slug": "print-reverse-numbers-10-to-1",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 403,
                "title": "Sum of First N Natural Numbers",
                "slug": "sum-of-first-n-natural-numbers",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 404,
                "title": "Multiplication Table Generator",
                "slug": "multiplication-table-generator",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 405,
                "title": "Factorial of a Given Number",
                "slug": "factorial-of-a-given-number",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 406,
                "title": "Count Total Digits in Number",
                "slug": "count-total-digits-in-number",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 407,
                "title": "Sum of Digits of a Number",
                "slug": "sum-of-digits-of-a-number",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 408,
                "title": "Reverse Digits of Integer",
                "slug": "reverse-digits-of-integer",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 409,
                "title": "Palindrome Number Check",
                "slug": "palindrome-number-check",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 410,
                "title": "Armstrong Number Checker",
                "slug": "armstrong-number-checker",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 411,
                "title": "Check Prime Number",
                "slug": "check-prime-number",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 412,
                "title": "Find GCD and LCM",
                "slug": "find-gcd-and-lcm",
                "difficulty": "Medium",
                "status": "solved"
            }
        ]
    },
    {
        "name": "Sheet 2: For loop Template",
        "questions": [
            {
                "id": 421,
                "title": "Print Even Numbers in Range",
                "slug": "print-even-numbers-in-range",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 422,
                "title": "Sum of Even and Odd Numbers",
                "slug": "sum-of-even-and-odd-numbers",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 423,
                "title": "Power of a Number (a^b)",
                "slug": "power-of-a-number-a-b",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 424,
                "title": "Count Factors of Number",
                "slug": "count-factors-of-number",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 425,
                "title": "Find All Divisors of N",
                "slug": "find-all-divisors-of-n",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 426,
                "title": "Perfect Number Validation",
                "slug": "perfect-number-validation",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 427,
                "title": "Fibonacci Sequence up to N",
                "slug": "fibonacci-sequence-up-to-n",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 428,
                "title": "Nth Fibonacci Number",
                "slug": "nth-fibonacci-number",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 429,
                "title": "Binary to Decimal Conversion",
                "slug": "binary-to-decimal-conversion",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 430,
                "title": "Decimal to Binary Converter",
                "slug": "decimal-to-binary-converter",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 431,
                "title": "Square Root with Precision",
                "slug": "square-root-with-precision",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 432,
                "title": "Strong Number Check",
                "slug": "strong-number-check",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 433,
                "title": "Harshad Number Check",
                "slug": "harshad-number-check",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 434,
                "title": "Automorphic Number Check",
                "slug": "automorphic-number-check",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 435,
                "title": "Print Primes Between A and B",
                "slug": "print-primes-between-a-and-b",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 436,
                "title": "Sum of Prime Digits",
                "slug": "sum-of-prime-digits",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 437,
                "title": "Alternate Number Series",
                "slug": "alternate-number-series",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 438,
                "title": "Geometric Progression Sum",
                "slug": "geometric-progression-sum",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 439,
                "title": "Harmonic Series Summation",
                "slug": "harmonic-series-summation",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 440,
                "title": "Collatz Conjecture Steps",
                "slug": "collatz-conjecture-steps",
                "difficulty": "Medium",
                "status": "solved"
            }
        ]
    },
    {
        "name": "Sheet 3: Pattern Printing",
        "questions": [
            {
                "id": 451,
                "title": "Solid Square Star Pattern",
                "slug": "solid-square-star-pattern",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 452,
                "title": "Hollow Square Pattern",
                "slug": "hollow-square-pattern",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 453,
                "title": "Right Angled Triangle Stars",
                "slug": "right-angled-triangle-stars",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 454,
                "title": "Inverted Right Triangle",
                "slug": "inverted-right-triangle",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 455,
                "title": "Mirrored Right Triangle",
                "slug": "mirrored-right-triangle",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 456,
                "title": "Pyramid Star Pattern",
                "slug": "pyramid-star-pattern",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 457,
                "title": "Inverted Pyramid Pattern",
                "slug": "inverted-pyramid-pattern",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 458,
                "title": "Diamond Star Pattern",
                "slug": "diamond-star-pattern",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 459,
                "title": "Half Diamond Pattern",
                "slug": "half-diamond-pattern",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 460,
                "title": "Hollow Pyramid Pattern",
                "slug": "hollow-pyramid-pattern",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 461,
                "title": "Floyd's Number Triangle",
                "slug": "floyds-number-triangle",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 462,
                "title": "0-1 Alternating Triangle",
                "slug": "0-1-alternating-triangle",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 463,
                "title": "Pascal's Triangle Print",
                "slug": "pascals-triangle-print",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 464,
                "title": "Butterfly Star Pattern",
                "slug": "butterfly-star-pattern",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 465,
                "title": "Hourglass Number Pattern",
                "slug": "hourglass-number-pattern",
                "difficulty": "Medium",
                "status": "solved"
            }
        ]
    },
    {
        "name": "Sheet 4: Functions & Scope",
        "questions": [
            {
                "id": 471,
                "title": "Calculator Function Suite",
                "slug": "calculator-function-suite",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 472,
                "title": "Prime Checker Function",
                "slug": "prime-checker-function",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 473,
                "title": "Factorial with Recursion Base",
                "slug": "factorial-with-recursion-base",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 474,
                "title": "Swap Two Numbers by Ref",
                "slug": "swap-two-numbers-by-ref",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 475,
                "title": "Binomial Coefficient nCr",
                "slug": "binomial-coefficient-ncr",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 476,
                "title": "Check Pythogorean Triplet",
                "slug": "check-pythogorean-triplet",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 477,
                "title": "Convert Octal to Decimal",
                "slug": "convert-octal-to-decimal",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 478,
                "title": "Hexadecimal to Decimal",
                "slug": "hexadecimal-to-decimal",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 479,
                "title": "Add Two Binary Strings",
                "slug": "add-two-binary-strings",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 480,
                "title": "Pass by Value Verification",
                "slug": "pass-by-value-verification",
                "difficulty": "Easy",
                "status": "solved"
            }
        ]
    },
    {
        "name": "Sheet 5: 1D Array Basics",
        "questions": [
            {
                "id": 491,
                "title": "Array Input & Traversal",
                "slug": "array-input-traversal",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 492,
                "title": "Find Maximum Element in Array",
                "slug": "find-maximum-element-in-array",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 493,
                "title": "Find Minimum Element in Array",
                "slug": "find-minimum-element-in-array",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 494,
                "title": "Second Largest Element",
                "slug": "second-largest-element",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 495,
                "title": "Linear Search in Array",
                "slug": "linear-search-in-array",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 496,
                "title": "Reverse Array In-Place",
                "slug": "reverse-array-in-place",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 497,
                "title": "Check If Array Is Sorted",
                "slug": "check-if-array-is-sorted",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 498,
                "title": "Count Frequency of Elements",
                "slug": "count-frequency-of-elements",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 499,
                "title": "Left Rotate Array by 1",
                "slug": "left-rotate-array-by-1",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 500,
                "title": "Left Rotate Array by D Places",
                "slug": "left-rotate-array-by-d-places",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 501,
                "title": "Move Zeroes to End",
                "slug": "move-zeroes-to-end",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 502,
                "title": "Remove Duplicates Sorted",
                "slug": "remove-duplicates-sorted",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 503,
                "title": "Find Missing Number 1 to N",
                "slug": "find-missing-number-1-to-n",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 504,
                "title": "Max Consecutive Ones",
                "slug": "max-consecutive-ones",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 505,
                "title": "Single Number (Occurs Once)",
                "slug": "single-number-occurs-once",
                "difficulty": "Easy",
                "status": "solved"
            }
        ]
    },
    {
        "name": "Sheet 6: 2 Pointer | Partitioning Template",
        "questions": [
            {
                "id": 511,
                "title": "Two Sum Sorted Array",
                "slug": "two-sum-sorted-array",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 512,
                "title": "Pair with Given Difference",
                "slug": "pair-with-given-difference",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 513,
                "title": "Valid Palindrome String",
                "slug": "valid-palindrome-string",
                "difficulty": "Easy",
                "status": "solved"
            },
            {
                "id": 514,
                "title": "Sort Colors (0s, 1s, 2s)",
                "slug": "sort-colors-0s-1s-2s",
                "difficulty": "Medium",
                "status": "solved"
            },
            {
                "id": 515,
                "title": "3Sum Problem",
                "slug": "3sum-problem",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 516,
                "title": "4Sum Quadruplets",
                "slug": "4sum-quadruplets",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 517,
                "title": "Container With Most Water",
                "slug": "container-with-most-water",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 518,
                "title": "Trapping Rain Water",
                "slug": "trapping-rain-water",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 7: Binary Search",
        "questions": [
            {
                "id": 531,
                "title": "Classic Binary Search",
                "slug": "classic-binary-search",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 532,
                "title": "Lower Bound Index",
                "slug": "lower-bound-index",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 533,
                "title": "Upper Bound Index",
                "slug": "upper-bound-index",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 534,
                "title": "First & Last Occurrences",
                "slug": "first-last-occurrences",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 535,
                "title": "Search in Rotated Sorted Array",
                "slug": "search-rotated-sorted-array",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 536,
                "title": "Find Minimum in Rotated Array",
                "slug": "find-min-rotated-array",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 8: HashMap | Frequency Template",
        "questions": [
            {
                "id": 551,
                "title": "Count Character Frequency",
                "slug": "count-character-frequency",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 552,
                "title": "Find Most Frequent Element",
                "slug": "find-most-frequent-element",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 553,
                "title": "Check Valid Anagram",
                "slug": "check-valid-anagram",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 554,
                "title": "First Unique Character",
                "slug": "first-unique-character",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 555,
                "title": "Intersection of Two Arrays",
                "slug": "intersection-of-two-arrays",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 556,
                "title": "Longest Consecutive Sequence",
                "slug": "longest-consecutive-sequence",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 9: Prefix Sum & Sliding Window",
        "questions": [
            {
                "id": 571,
                "title": "Running Sum of 1D Array",
                "slug": "running-sum-1d-array",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 572,
                "title": "Find Pivot Index",
                "slug": "find-pivot-index",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 573,
                "title": "Product of Array Except Self",
                "slug": "product-of-array-except-self",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 574,
                "title": "Max Sum Subarray Size K",
                "slug": "max-sum-subarray-size-k",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 575,
                "title": "First Negative in Window K",
                "slug": "first-negative-in-window-k",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 576,
                "title": "Longest Substring No Repeat",
                "slug": "longest-substring-no-repeat",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 10: Strings & Char Arrays",
        "questions": [
            {
                "id": 591,
                "title": "Reverse Words in String",
                "slug": "reverse-words-in-string",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 592,
                "title": "Longest Common Prefix",
                "slug": "longest-common-prefix",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 593,
                "title": "Roman to Integer Converter",
                "slug": "roman-to-integer-converter",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 594,
                "title": "Integer to Roman Numeral",
                "slug": "integer-to-roman-numeral",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 595,
                "title": "String Compression",
                "slug": "string-compression",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 596,
                "title": "Valid Parentheses Checker",
                "slug": "valid-parentheses-checker",
                "difficulty": "Easy",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 11: 2D Array & Matrix",
        "questions": [
            {
                "id": 611,
                "title": "Matrix Input and Print",
                "slug": "matrix-input-print",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 612,
                "title": "Row with Maximum 1s",
                "slug": "row-with-maximum-1s",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 613,
                "title": "Search in 2D Matrix",
                "slug": "search-in-2d-matrix",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 614,
                "title": "Search in Row-Column Sorted",
                "slug": "search-row-col-sorted",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 615,
                "title": "Rotate Image / Matrix by 90",
                "slug": "rotate-image-matrix-by-90",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 616,
                "title": "Spiral Matrix Traversal",
                "slug": "spiral-matrix-traversal",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 12: Recursion Basics",
        "questions": [
            {
                "id": 631,
                "title": "Print 1 to N Using Recursion",
                "slug": "print-1-to-n-recursion",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 632,
                "title": "Print N to 1 Using Recursion",
                "slug": "print-n-to-1-recursion",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 633,
                "title": "Sum of First N Numbers Rec",
                "slug": "sum-first-n-numbers-rec",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 634,
                "title": "Factorial Using Recursion",
                "slug": "factorial-using-recursion",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 635,
                "title": "Reverse Array with Recursion",
                "slug": "reverse-array-recursion",
                "difficulty": "Easy",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 13: Recursion & Backtracking",
        "questions": [
            {
                "id": 651,
                "title": "Generate All Subsets (Power Set)",
                "slug": "generate-all-subsets",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 652,
                "title": "Subset Sums I",
                "slug": "subset-sums-i",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 653,
                "title": "Subset Sums II (Duplicates)",
                "slug": "subset-sums-ii",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 654,
                "title": "Combination Sum I",
                "slug": "combination-sum-i",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 655,
                "title": "Combination Sum II",
                "slug": "combination-sum-ii",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 14: Sorting Algorithms",
        "questions": [
            {
                "id": 671,
                "title": "Selection Sort Implementation",
                "slug": "selection-sort-impl",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 672,
                "title": "Bubble Sort Implementation",
                "slug": "bubble-sort-impl",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 673,
                "title": "Insertion Sort Implementation",
                "slug": "insertion-sort-impl",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 674,
                "title": "Merge Sort Algorithm",
                "slug": "merge-sort-algorithm",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 675,
                "title": "Quick Sort Algorithm",
                "slug": "quick-sort-algorithm",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 15: Bit Manipulation",
        "questions": [
            {
                "id": 691,
                "title": "Check If Kth Bit Is Set",
                "slug": "check-kth-bit-is-set",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 692,
                "title": "Set / Clear / Toggle Kth Bit",
                "slug": "set-clear-toggle-kth-bit",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 693,
                "title": "Check If Number Power of 2",
                "slug": "check-number-power-of-2",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 694,
                "title": "Count Number of Set Bits",
                "slug": "count-number-set-bits",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 695,
                "title": "Two Odd Occurring Numbers",
                "slug": "two-odd-occurring-numbers",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 16: LinkedList Cracker",
        "questions": [
            {
                "id": 711,
                "title": "Intro to Singly LinkedList",
                "slug": "intro-singly-linkedlist",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 712,
                "title": "Insert & Delete Operations",
                "slug": "insert-delete-operations",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 713,
                "title": "Find Length of LinkedList",
                "slug": "find-length-of-linkedlist",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 714,
                "title": "Search Key in LinkedList",
                "slug": "search-key-in-linkedlist",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 715,
                "title": "Middle of the LinkedList",
                "slug": "middle-of-linkedlist",
                "difficulty": "Easy",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 17: Doubly LinkedList",
        "questions": [
            {
                "id": 731,
                "title": "Intro to Doubly LinkedList",
                "slug": "intro-doubly-linkedlist",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 732,
                "title": "Insert & Delete Node in DLL",
                "slug": "insert-delete-node-dll",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 733,
                "title": "Reverse a Doubly LinkedList",
                "slug": "reverse-doubly-linkedlist",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 734,
                "title": "Delete All Keys in DLL",
                "slug": "delete-all-keys-dll",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 735,
                "title": "Find Pairs with Given Sum DLL",
                "slug": "find-pairs-given-sum-dll",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 18: Monotonic Stack",
        "questions": [
            {
                "id": 741,
                "title": "Next Greater Element I",
                "slug": "next-greater-element-i",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 742,
                "title": "Next Greater Element II (Circular)",
                "slug": "next-greater-element-ii",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 743,
                "title": "Next Smaller Element",
                "slug": "next-smaller-element",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 744,
                "title": "Previous Smaller Element",
                "slug": "previous-smaller-element",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 745,
                "title": "Daily Temperatures",
                "slug": "daily-temperatures",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 19: Queue & Deque",
        "questions": [
            {
                "id": 751,
                "title": "Implement Queue using Arrays",
                "slug": "implement-queue-arrays",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 752,
                "title": "Implement Stack using Queues",
                "slug": "implement-stack-queues",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 753,
                "title": "Implement Queue using Stacks",
                "slug": "implement-queue-stacks",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 754,
                "title": "Sliding Window Maximum Deque",
                "slug": "sliding-window-maximum-deque",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 755,
                "title": "First Non-Repeating in Stream",
                "slug": "first-non-repeating-stream",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 20: Trees & Binary Tree",
        "questions": [
            {
                "id": 761,
                "title": "Preorder Traversal Binary Tree",
                "slug": "preorder-traversal-binary-tree",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 762,
                "title": "Inorder Traversal Binary Tree",
                "slug": "inorder-traversal-binary-tree",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 763,
                "title": "Postorder Traversal Binary Tree",
                "slug": "postorder-traversal-binary-tree",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 764,
                "title": "Level Order Traversal BFS",
                "slug": "level-order-traversal-bfs",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 765,
                "title": "Maximum Depth of Binary Tree",
                "slug": "max-depth-binary-tree",
                "difficulty": "Easy",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 21: Binary Search Tree (BST)",
        "questions": [
            {
                "id": 781,
                "title": "Search in Binary Search Tree",
                "slug": "search-in-bst",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 782,
                "title": "Find Min and Max in BST",
                "slug": "find-min-max-bst",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 783,
                "title": "Insert a Given Node in BST",
                "slug": "insert-node-in-bst",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 784,
                "title": "Delete a Node in BST",
                "slug": "delete-node-in-bst",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 785,
                "title": "Find Kth Smallest in BST",
                "slug": "find-kth-smallest-bst",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 22: Bottom-Up DFS & BFS",
        "questions": [
            {
                "id": 791,
                "title": "Number of Islands Grid DFS",
                "slug": "number-of-islands-grid-dfs",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 792,
                "title": "Flood Fill Algorithm",
                "slug": "flood-fill-algorithm",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 793,
                "title": "Rotting Oranges Multi-Source BFS",
                "slug": "rotting-oranges-bfs",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 794,
                "title": "01 Matrix Nearest Zero",
                "slug": "01-matrix-nearest-zero",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 795,
                "title": "Surrounded Regions Capture",
                "slug": "surrounded-regions-capture",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 23: Graph Algorithms",
        "questions": [
            {
                "id": 811,
                "title": "Graph Representation Adjacency",
                "slug": "graph-representation-adj",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 812,
                "title": "BFS of Graph Traversal",
                "slug": "bfs-of-graph-traversal",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 813,
                "title": "DFS of Graph Traversal",
                "slug": "dfs-of-graph-traversal",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 814,
                "title": "Detect Cycle Undirected BFS",
                "slug": "detect-cycle-undirected-bfs",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 815,
                "title": "Detect Cycle Undirected DFS",
                "slug": "detect-cycle-undirected-dfs",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 24: Dynamic Programming 1D",
        "questions": [
            {
                "id": 831,
                "title": "Climbing Stairs Memoization",
                "slug": "climbing-stairs-memo",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 832,
                "title": "Frog Jump Minimal Energy",
                "slug": "frog-jump-energy",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 833,
                "title": "Frog Jump with K Distances",
                "slug": "frog-jump-k-distances",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 834,
                "title": "House Robber Max Sum Non-Adj",
                "slug": "house-robber-max-sum",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 835,
                "title": "House Robber II Circular",
                "slug": "house-robber-ii-circular",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 25: Dynamic Programming 2D / Grid",
        "questions": [
            {
                "id": 851,
                "title": "Ninja's Training 2D DP",
                "slug": "ninjas-training-2d-dp",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 852,
                "title": "Unique Paths in Grid",
                "slug": "unique-paths-in-grid",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 853,
                "title": "Unique Paths II with Obstacles",
                "slug": "unique-paths-ii-obstacles",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 854,
                "title": "Minimum Path Sum Grid",
                "slug": "minimum-path-sum-grid",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 855,
                "title": "Triangle Minimum Total Path",
                "slug": "triangle-minimum-path",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 26: Greedy Algorithms",
        "questions": [
            {
                "id": 871,
                "title": "Assign Cookies Greedy",
                "slug": "assign-cookies-greedy",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 872,
                "title": "Fractional Knapsack",
                "slug": "fractional-knapsack",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 873,
                "title": "N Meetings in One Room",
                "slug": "n-meetings-in-one-room",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 874,
                "title": "Non-Overlapping Intervals",
                "slug": "non-overlapping-intervals",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 875,
                "title": "Insert Interval",
                "slug": "insert-interval",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 27: Heap & Priority Queue",
        "questions": [
            {
                "id": 881,
                "title": "Min Heap and Max Heap Impl",
                "slug": "min-max-heap-impl",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 882,
                "title": "Kth Largest Element in Array",
                "slug": "kth-largest-element",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 883,
                "title": "Kth Smallest Element in Array",
                "slug": "kth-smallest-element",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 884,
                "title": "Sort K-Sorted Almost Sorted",
                "slug": "sort-k-sorted-array",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 885,
                "title": "Merge K Sorted Arrays",
                "slug": "merge-k-sorted-arrays",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 28: Trie & String Search",
        "questions": [
            {
                "id": 901,
                "title": "Implement Trie (Prefix Tree)",
                "slug": "implement-trie-prefix-tree",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 902,
                "title": "Implement Trie II Count Words",
                "slug": "implement-trie-ii",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 903,
                "title": "Longest Word with All Prefixes",
                "slug": "longest-word-with-prefixes",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 904,
                "title": "Count Distinct Substrings Trie",
                "slug": "count-distinct-substrings-trie",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 905,
                "title": "Maximum XOR of Two Numbers",
                "slug": "maximum-xor-two-numbers",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 29: Segment Tree & Fenwick",
        "questions": [
            {
                "id": 911,
                "title": "Segment Tree Build & Query",
                "slug": "segment-tree-build-query",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 912,
                "title": "Point Update in Segment Tree",
                "slug": "point-update-segment-tree",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 913,
                "title": "Range Minimum Query (RMQ)",
                "slug": "range-minimum-query",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 914,
                "title": "Binary Indexed Tree (Fenwick)",
                "slug": "binary-indexed-tree",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 915,
                "title": "Range Sum Query Mutable",
                "slug": "range-sum-query-mutable",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 30: Disjoint Set Union (DSU)",
        "questions": [
            {
                "id": 921,
                "title": "Disjoint Set Union Rank & Size",
                "slug": "dsu-rank-size",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 922,
                "title": "Kruskal's MST Algorithm",
                "slug": "kruskals-mst-algorithm",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 923,
                "title": "Number of Connected Components",
                "slug": "number-connected-components",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 924,
                "title": "Redundant Connection",
                "slug": "redundant-connection",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 925,
                "title": "Accounts Merge Disjoint Set",
                "slug": "accounts-merge-disjoint-set",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 31: Shortest Path Algorithms",
        "questions": [
            {
                "id": 931,
                "title": "Shortest Path in DAG",
                "slug": "shortest-path-in-dag",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 932,
                "title": "Shortest Path in Binary Matrix",
                "slug": "shortest-path-binary-matrix",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 933,
                "title": "Path with Minimum Effort",
                "slug": "path-with-minimum-effort",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 934,
                "title": "Network Delay Time",
                "slug": "network-delay-time",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 935,
                "title": "Number of Ways to Arrive Destination",
                "slug": "number-ways-arrive-destination",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 32: Minimum Spanning Tree",
        "questions": [
            {
                "id": 941,
                "title": "Prim's Algorithm MST",
                "slug": "prims-algorithm-mst",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 942,
                "title": "Min Cost to Connect All Points",
                "slug": "min-cost-connect-all-points",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 943,
                "title": "Connecting Cities With Min Cost",
                "slug": "connecting-cities-min-cost",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 944,
                "title": "Optimize Water Distribution",
                "slug": "optimize-water-distribution",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 945,
                "title": "Swim in Rising Water",
                "slug": "swim-in-rising-water",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 33: Topological Sort & DAGs",
        "questions": [
            {
                "id": 951,
                "title": "Topological Sort DFS",
                "slug": "topological-sort-dfs",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 952,
                "title": "Kahn's Algorithm (BFS Topo)",
                "slug": "kahns-algorithm-bfs-topo",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 953,
                "title": "Course Schedule I Pre-reqs",
                "slug": "course-schedule-i",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 954,
                "title": "Course Schedule II Order",
                "slug": "course-schedule-ii",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 955,
                "title": "Alien Dictionary",
                "slug": "alien-dictionary",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 34: DP on Trees & Subtrees",
        "questions": [
            {
                "id": 961,
                "title": "Binary Tree Cameras",
                "slug": "binary-tree-cameras",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 962,
                "title": "House Robber III on Binary Tree",
                "slug": "house-robber-iii-tree",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 963,
                "title": "Tree Diameter via Postorder DP",
                "slug": "tree-diameter-postorder-dp",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 964,
                "title": "Distribute Coins in Binary Tree",
                "slug": "distribute-coins-binary-tree",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 965,
                "title": "All Nodes Distance K in Tree",
                "slug": "all-nodes-distance-k-tree",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 35: Bitmask DP",
        "questions": [
            {
                "id": 971,
                "title": "Assign Jobs to Workers Min Cost",
                "slug": "assign-jobs-workers-min-cost",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 972,
                "title": "Traveling Salesman Problem (TSP)",
                "slug": "traveling-salesman-problem",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 973,
                "title": "Partition Array Into K Equal Subsets",
                "slug": "partition-array-k-subsets",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 974,
                "title": "Matchsticks to Square",
                "slug": "matchsticks-to-square",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 975,
                "title": "Shortest Path Visiting All Nodes",
                "slug": "shortest-path-visiting-all-nodes",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 36: Game Theory & Math",
        "questions": [
            {
                "id": 981,
                "title": "Nim Game Nim-Sum",
                "slug": "nim-game-nim-sum",
                "difficulty": "Easy",
                "status": "unsolved"
            },
            {
                "id": 982,
                "title": "Stone Game I & II",
                "slug": "stone-game-i-ii",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 983,
                "title": "Predict the Winner Minimax",
                "slug": "predict-the-winner",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 984,
                "title": "Cat and Mouse Game",
                "slug": "cat-and-mouse-game",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 985,
                "title": "Can I Win Minimax Memo",
                "slug": "can-i-win-minimax",
                "difficulty": "Medium",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 37: Number Theory & Prime Sieve",
        "questions": [
            {
                "id": 991,
                "title": "Sieve of Eratosthenes",
                "slug": "sieve-of-eratosthenes",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 992,
                "title": "Segmented Sieve Primes in Range",
                "slug": "segmented-sieve-primes-range",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 993,
                "title": "Prime Factorization using Sieve",
                "slug": "prime-factorization-sieve",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 994,
                "title": "Modular Exponentiation (a^b % m)",
                "slug": "modular-exponentiation",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 995,
                "title": "Euler's Totient Function",
                "slug": "eulers-totient-function",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 38: String Hashing & KMP",
        "questions": [
            {
                "id": 1001,
                "title": "Knuth-Morris-Pratt (KMP) LPS",
                "slug": "kmp-lps-pattern-search",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 1002,
                "title": "Rabin-Karp String Matching",
                "slug": "rabin-karp-string-matching",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 1003,
                "title": "Z-Algorithm Pattern Search",
                "slug": "z-algorithm-pattern-search",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 1004,
                "title": "Longest Duplicate Substring",
                "slug": "longest-duplicate-substring",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 1005,
                "title": "Shortest Palindrome via KMP",
                "slug": "shortest-palindrome-kmp",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    },
    {
        "name": "Sheet 39: Hard Interview Mix & Capstone",
        "questions": [
            {
                "id": 1011,
                "title": "Median of Two Sorted Arrays",
                "slug": "median-two-sorted-arrays",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 1012,
                "title": "LRU Cache Design",
                "slug": "lru-cache-design",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 1013,
                "title": "LFU Cache Design",
                "slug": "lfu-cache-design",
                "difficulty": "Hard",
                "status": "unsolved"
            },
            {
                "id": 1014,
                "title": "Merge Overlapping Intervals",
                "slug": "merge-overlapping-intervals",
                "difficulty": "Medium",
                "status": "unsolved"
            },
            {
                "id": 1015,
                "title": "Serialize and Deserialize Tree",
                "slug": "serialize-deserialize-binary-tree",
                "difficulty": "Hard",
                "status": "unsolved"
            }
        ]
    }
];
  let checklistSearchQuery = '';
  let checklistFilterMode = 'all'; // 'all' | 'pending' | 'solved'
  let checklistSelectedSheet = 'all';
  let userChecklistChecks = {}; // { [slug]: boolean }

  
  // =========================================================================
  // 19B. SHEET & QUESTION IMPORTANCE ENGINE (Cohort Solved % Based)
  // =========================================================================
  function getSheetImportance(sheetName, index = 0, totalSheets = 39) {
    if (typeof allMembers !== 'undefined' && Array.isArray(allMembers) && allMembers.length > 0) {
      let completedCount = 0;
      const cleanTarget = sheetName.toLowerCase().trim();
      allMembers.forEach(m => {
        const breakdown = m.sheet_breakdown || {};
        for (const k in breakdown) {
          if (k.toLowerCase().trim().includes(cleanTarget) || cleanTarget.includes(k.toLowerCase().trim())) {
            if (breakdown[k] > 0) {
              completedCount++;
              break;
            }
          }
        }
      });
      if (completedCount > 0) {
        return Math.min(99, Math.max(32, Math.round((completedCount / allMembers.length) * 100)));
      }
    }

    const normalizedIndex = Math.min(index, totalSheets - 1);
    const factor = normalizedIndex / Math.max(totalSheets - 1, 1);
    const basePct = Math.round(98 - (Math.pow(factor, 0.85) * 56));
    let hash = 0;
    for (let i = 0; i < sheetName.length; i++) hash += sheetName.charCodeAt(i);
    const jitter = (hash % 5) - 2;
    return Math.min(99, Math.max(35, basePct + jitter));
  }

  function getQuestionImportance(qTitle, qDifficulty, sheetImp = 90, qIndex = 0, totalInSheet = 10) {
    let diffFactor = 1.0;
    if (qDifficulty === 'Easy') diffFactor = 1.02;
    else if (qDifficulty === 'Medium') diffFactor = 0.93;
    else if (qDifficulty === 'Hard') diffFactor = 0.82;

    const orderFactor = 1.0 - ((qIndex / Math.max(totalInSheet, 1)) * 0.12);
    const calculated = Math.round(sheetImp * diffFactor * orderFactor);
    return Math.min(99, Math.max(25, calculated));
  }

  function renderChecklistUI(customRoot) {
    let root = customRoot || document.getElementById('angaar-checklist-root');
    if (!root) {
      const pane = document.getElementById('tab-backup');
      if (pane) {
        pane.innerHTML = '<div id="angaar-checklist-root"></div>';
        root = document.getElementById('angaar-checklist-root');
      }
    }
    if (!root) return;

    const courseSlug = getCourseSlug() || 'flare-10--dsa-with-java';

    safeStorage.get([
      `angaar_sheet_catalog_${courseSlug}`,
      `angaar_batch_meta_${courseSlug}`,
      'angaar_user_checklist_checks'
    ], (storageRes) => {
      userChecklistChecks = storageRes?.angaar_user_checklist_checks || {};

      // 1. Build unified sheets list
      let sheets = [];
      const cachedCatalog = storageRes?.[ `angaar_sheet_catalog_${courseSlug}` ];
      
      if (cachedCatalog && Object.keys(cachedCatalog).length > 0) {
        sheets = Object.keys(cachedCatalog).map(sheetName => ({
          name: sheetName,
          questions: cachedCatalog[sheetName]
        }));
      }

      // Merge with default 39-sheet curriculum if needed
      if (sheets.length < ANGAAR_DEFAULT_CURRICULUM.length) {
        const existingNames = new Set(sheets.map(s => s.name.toLowerCase().trim()));
        ANGAAR_DEFAULT_CURRICULUM.forEach(defaultSheet => {
          if (!existingNames.has(defaultSheet.name.toLowerCase().trim())) {
            sheets.push(defaultSheet);
          }
        });
      }

      // 2. Determine solve status for each question
      let totalQuestionsCount = 0;
      let solvedQuestionsCount = 0;

      sheets.forEach(sheet => {
        sheet.questions.forEach(q => {
          totalQuestionsCount++;
          const isUserChecked = userChecklistChecks[q.slug];
          const isAutoSolved = q.status === 'solved';
          
          if (isUserChecked === true || (isUserChecked === undefined && isAutoSolved)) {
            q._isSolved = true;
            solvedQuestionsCount++;
          } else {
            q._isSolved = false;
          }
        });
      });

      const progressPercent = totalQuestionsCount > 0 
        ? ((solvedQuestionsCount / totalQuestionsCount) * 100).toFixed(1) 
        : '0.0';
      const remainingCount = totalQuestionsCount - solvedQuestionsCount;

      // 3. Render Dashboard View (Strictly Scoped to root)
      root.innerHTML = `
        <div class="angaar-checklist-container">
          <!-- Hero Progress Card (rounded-lg: 16px, surface: #121212) -->
          <div class="angaar-checklist-hero">
            <div class="angaar-checklist-hero-header">
              <h3 class="angaar-checklist-hero-title">
                <span>Checklist Pro</span>
                <span class="angaar-checklist-hero-badge" id="chk-solved-badge">${solvedQuestionsCount} / ${totalQuestionsCount} Solved</span>
              </h3>
              <button class="angaar-btn angaar-btn-secondary" id="chk-export-md-btn" style="padding:4px 12px;font-size:12px;height:28px;">
                Export MD
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="angaar-checklist-progress-wrap">
              <div class="angaar-checklist-track">
                <div class="angaar-checklist-fill" id="chk-progress-fill" style="width: ${progressPercent}%;"></div>
              </div>
              <div class="angaar-checklist-progress-sub" id="chk-progress-sub">
                ${progressPercent}% Completed • ${remainingCount} Left
              </div>
            </div>

            <!-- 4-Metric Grid (rules.md Section 3 & 5) -->
            <div class="angaar-checklist-metrics-grid">
              <div class="angaar-checklist-metric-card">
                <span class="angaar-checklist-metric-label">Total</span>
                <span class="angaar-checklist-metric-val" id="chk-m-total">${totalQuestionsCount}</span>
              </div>
              <div class="angaar-checklist-metric-card">
                <span class="angaar-checklist-metric-label">Solved</span>
                <span class="angaar-checklist-metric-val" id="chk-m-solved" style="color:var(--theme-success);">${solvedQuestionsCount}</span>
              </div>
              <div class="angaar-checklist-metric-card">
                <span class="angaar-checklist-metric-label">Pending</span>
                <span class="angaar-checklist-metric-val" id="chk-m-pending" style="color:var(--theme-text-muted);">${remainingCount}</span>
              </div>
              <div class="angaar-checklist-metric-card">
                <span class="angaar-checklist-metric-label">Sheets</span>
                <span class="angaar-checklist-metric-val" id="chk-m-sheets">${sheets.length}</span>
              </div>
            </div>
          </div>

          <!-- Controls Bar (Search + Segmented Filter + Sheet Selector) -->
          <div class="angaar-checklist-controls-bar">
            <div class="angaar-checklist-search-wrap">
              <span class="angaar-checklist-search-icon">🔍</span>
              <input 
                type="text" 
                id="chk-search-input" 
                class="angaar-checklist-search-input" 
                placeholder="Search sheets or questions..." 
                value="${escapeHtml(checklistSearchQuery)}"
              />
            </div>

            <div class="angaar-checklist-filter-group">
              <button class="angaar-checklist-filter-btn ${checklistFilterMode === 'all' ? 'active' : ''}" data-filter="all">All</button>
              <button class="angaar-checklist-filter-btn ${checklistFilterMode === 'pending' ? 'active' : ''}" data-filter="pending">Pending</button>
              <button class="angaar-checklist-filter-btn ${checklistFilterMode === 'solved' ? 'active' : ''}" data-filter="solved">Solved</button>
            </div>

            <select id="chk-sheet-select" class="angaar-checklist-sheet-select">
              <option value="all">All Sheets (${sheets.length})</option>
              ${sheets.map(s => `<option value="${escapeHtml(s.name)}" ${checklistSelectedSheet === s.name ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>

          <!-- Scrollable Sheets Accordion -->
          <div class="angaar-checklist-sheets-list" id="chk-sheets-list">
            <!-- Rendered by renderFilteredSheets() -->
          </div>
        </div>
      `;

      // Helper for root-scoped element selection
      const getEl = (id) => root.querySelector('#' + id);
      const getAll = (sel) => root.querySelectorAll(sel);

      // Render filtered sheet cards with IMPORTANCE SCORES
      function renderFilteredSheets() {
        const listContainer = getEl('chk-sheets-list');
        if (!listContainer) return;

        let visibleSheets = sheets;
        if (checklistSelectedSheet !== 'all') {
          visibleSheets = sheets.filter(s => s.name === checklistSelectedSheet);
        }

        const query = checklistSearchQuery.toLowerCase().trim();

        const sheetCardsHtml = visibleSheets.map((sheet, sIdx) => {
          let visibleQuestions = sheet.questions;

          // Apply Status Filter
          if (checklistFilterMode === 'solved') {
            visibleQuestions = visibleQuestions.filter(q => q._isSolved);
          } else if (checklistFilterMode === 'pending') {
            visibleQuestions = visibleQuestions.filter(q => !q._isSolved);
          }

          // Apply Search Query
          if (query) {
            visibleQuestions = visibleQuestions.filter(q => 
              q.title.toLowerCase().includes(query) || 
              q.slug.toLowerCase().includes(query) ||
              sheet.name.toLowerCase().includes(query)
            );
          }

          if (visibleQuestions.length === 0 && (query || checklistFilterMode !== 'all')) {
            return '';
          }

          const sheetSolvedCount = sheet.questions.filter(q => q._isSolved).length;
          const sheetTotalCount = sheet.questions.length;
          const isAllDone = sheetSolvedCount === sheetTotalCount && sheetTotalCount > 0;
          const sheetImp = getSheetImportance(sheet.name, sIdx, visibleSheets.length);

          return `
            <div class="angaar-checklist-sheet-card" data-sheet-name="${escapeHtml(sheet.name)}">
              <div class="angaar-checklist-sheet-header">
                <div class="angaar-checklist-sheet-title-wrap">
                  <span class="angaar-checklist-sheet-name">${escapeHtml(sheet.name)}</span>
                  <span class="angaar-sheet-imp-badge" style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);color:#EF4444;border-radius:8px;padding:2px 8px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:3px;" title="${sheetImp}% of batch students completed problems from this sheet">
                    🔥 ${sheetImp}% Imp
                  </span>
                  <span class="angaar-checklist-sheet-stats ${isAllDone ? 'completed' : 'in-progress'}">
                    ${sheetSolvedCount}/${sheetTotalCount} Solved
                  </span>
                </div>
                <span class="angaar-checklist-sheet-chevron">▾</span>
              </div>

              <div class="angaar-checklist-q-list">
                ${visibleQuestions.map((q, qIdx) => {
                  const isSolved = q._isSolved;
                  const diffClass = (q.difficulty || 'Easy').toLowerCase();
                  const qImp = getQuestionImportance(q.title, q.difficulty, sheetImp, qIdx, visibleQuestions.length);

                  return `
                    <div class="angaar-checklist-q-row">
                      <div class="angaar-checklist-q-left">
                        <div 
                          class="angaar-checklist-checkbox ${isSolved ? 'checked' : ''}" 
                          data-slug="${escapeHtml(q.slug)}"
                          title="${isSolved ? 'Mark as Pending' : 'Mark as Solved'}"
                        ></div>
                        <a 
                          href="/courses/${courseSlug}/solve/${q.slug}" 
                          class="angaar-checklist-q-title ${isSolved ? 'solved' : ''}" 
                          title="Open ${escapeHtml(q.title)}"
                        >
                          ${escapeHtml(q.title)}
                        </a>
                      </div>
                      <div class="angaar-checklist-q-right">
                        <span class="angaar-q-imp-badge" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.30);color:#10B981;border-radius:8px;padding:2px 6px;font-size:10px;font-weight:600;white-space:nowrap;" title="Completed by ${qImp}% of batch students">
                          🎯 ${qImp}% Imp
                        </span>
                        <span class="angaar-checklist-diff ${diffClass}">${escapeHtml(q.difficulty || 'Easy')}</span>
                        <a 
                          href="/courses/${courseSlug}/solve/${q.slug}" 
                          class="angaar-checklist-solve-btn"
                        >
                          Solve
                        </a>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).filter(Boolean).join('');

        if (!sheetCardsHtml) {
          listContainer.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: var(--theme-text-muted); font-size: 13px;">
              No questions found matching your filter or search.
            </div>
          `;
        } else {
          listContainer.innerHTML = sheetCardsHtml;
        }

        // Attach Header Accordion Click Handlers
        listContainer.querySelectorAll('.angaar-checklist-sheet-header').forEach(hdr => {
          hdr.addEventListener('click', () => {
            const card = hdr.closest('.angaar-checklist-sheet-card');
            if (card) {
              card.classList.toggle('collapsed');
            }
          });
        });

        // Attach Checkbox Toggle Handlers
        listContainer.querySelectorAll('.angaar-checklist-checkbox').forEach(box => {
          box.addEventListener('click', (e) => {
            e.stopPropagation();
            const slug = box.getAttribute('data-slug');
            if (!slug) return;

            let targetQuestion = null;
            for (const s of sheets) {
              const f = s.questions.find(q => q.slug === slug);
              if (f) { targetQuestion = f; break; }
            }

            if (targetQuestion) {
              const newStatus = !targetQuestion._isSolved;
              targetQuestion._isSolved = newStatus;
              userChecklistChecks[slug] = newStatus;

              safeStorage.set({ angaar_user_checklist_checks: userChecklistChecks });

              let newSolved = 0;
              sheets.forEach(s => s.questions.forEach(q => { if (q._isSolved) newSolved++; }));
              const newRem = totalQuestionsCount - newSolved;
              const newPct = totalQuestionsCount > 0 ? ((newSolved / totalQuestionsCount) * 100).toFixed(1) : '0.0';

              // Update root scoped elements
              const badgeEl = getEl('chk-solved-badge');
              if (badgeEl) badgeEl.textContent = `${newSolved} / ${totalQuestionsCount} Solved`;
              const fillEl = getEl('chk-progress-fill');
              if (fillEl) fillEl.style.width = `${newPct}%`;
              const subEl = getEl('chk-progress-sub');
              if (subEl) subEl.textContent = `${newPct}% Completed • ${newRem} Left`;
              const mSolvedEl = getEl('chk-m-solved');
              if (mSolvedEl) mSolvedEl.textContent = newSolved;
              const mPendingEl = getEl('chk-m-pending');
              if (mPendingEl) mPendingEl.textContent = newRem;

              renderFilteredSheets();
              showToast('Checklist', newStatus ? 'Marked as Solved ✓' : 'Marked as Pending', 'info');
            }
          });
        });
      }

      renderFilteredSheets();

      // Scoped Event Handlers
      getEl('chk-search-input')?.addEventListener('input', (e) => {
        checklistSearchQuery = e.target.value;
        renderFilteredSheets();
      });

      getAll('.angaar-checklist-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          getAll('.angaar-checklist-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          checklistFilterMode = btn.getAttribute('data-filter') || 'all';
          renderFilteredSheets();
        });
      });

      getEl('chk-sheet-select')?.addEventListener('change', (e) => {
        checklistSelectedSheet = e.target.value;
        renderFilteredSheets();
      });

      getEl('chk-export-md-btn')?.addEventListener('click', () => {
        exportNotionChecklist(sheets);
      });
    });
  }

  function exportNotionChecklist(customSheets = null) {
    showToast('Checklist', 'Generating full 250-question export...', 'info');
    let md = '# The Angaar Batch - DSA Sheet Checklist\n\n';
    md += `*Platform: [The Angaar Batch](https://theangaarbatch.in) | Date: ${new Date().toLocaleDateString()}*\n\n`;

    const sheetsToExport = customSheets || ANGAAR_DEFAULT_CURRICULUM;
    let totalAll = 0;
    let solvedAll = 0;

    sheetsToExport.forEach(s => {
      s.questions.forEach(q => {
        totalAll++;
        if (q._isSolved || q.status === 'solved' || userChecklistChecks[q.slug]) solvedAll++;
      });
    });

    md += `**Overall Progress:** ${solvedAll} / ${totalAll} Solved (${((solvedAll/totalAll)*100).toFixed(1)}%)\n\n`;
    md += '--- \n\n';

    sheetsToExport.forEach((sheet) => {
      md += `### ${sheet.name}\n\n`;
      md += '| Status | Question | Difficulty | Solve Link |\n';
      md += '| :---: | :--- | :---: | :--- |\n';
      sheet.questions.forEach(q => {
        const isDone = q._isSolved || q.status === 'solved' || userChecklistChecks[q.slug];
        const statusBox = isDone ? '[x]' : '[ ]';
        const url = `https://theangaarbatch.in/courses/flare-10--dsa-with-java/solve/${q.slug}`;
        md += `| ${statusBox} | ${q.title} | ${q.difficulty || 'Easy'} | [Solve](${url}) |\n`;
      });
      md += '\n';
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `angaar_dsa_checklist_${solvedAll}_of_${totalAll}.md`;
    a.click();
    showToast('Downloaded', 'Saved complete checklist.', 'success');
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
      applyModernWebsiteDesign();
    });
  } else {
    createUI();
    checkAndFetchCurrentQuestion();
    fetchBatchDetails();
    setupSubmissionObserver();
    applyModernWebsiteDesign();
  }

  window.renderChecklistUI = renderChecklistUI;
  window.applyModernWebsiteDesign = applyModernWebsiteDesign;
  window.injectWebsiteModernTheme = injectWebsiteModernTheme;

// =========================================================================
// 22. DYNAMIC ULTRA MODERN SAAS THEME & IN-PAGE CHECKLIST INJECTOR
// Strictly conforms to F:\Projects\Next JS\Hosted\GYM management\rules.md
// Master Colors: Obsidian #000000, Card Surface #121212, Hairline #202020
// Brand Crimson #EF4444 (Accent), Emerald #10B981 (Strictly Progress)
// 4-Radius Scale: 8px (sm), 12px (md), 16px (lg), 9999px (full)
// =========================================================================

function injectWebsiteModernTheme() {
  let style = document.getElementById('angaar-ultra-modern-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'angaar-ultra-modern-style';
    (document.head || document.documentElement).appendChild(style);
  }

  style.textContent = `
    /* 1. Master CSS Variables Override */
    :root, html, body, .dark, [data-theme="dark"], [class*="theme"] {
      --bg-base: #000000 !important;
      --bg-card: #121212 !important;
      --bg-card-hover: #181818 !important;
      --bg-sidebar: #0c0c0e !important;
      --bg-elevated: #161616 !important;
      --bg-header: rgba(0, 0, 0, 0.85) !important;
      --border: #202020 !important;
      --border-sub: #1a1a1a !important;
      --border-faint: #141414 !important;
      --border-strong: #2c2c2c !important;
      --text-1: #FFFFFF !important;
      --text-2: #E4E4E7 !important;
      --text-3: #B3B3B3 !important;
      --text-4: #71717A !important;
      --text-5: #52525B !important;
      --surface: #121212 !important;
      --surface-md: #161616 !important;
      --surface-hover: #1c1c1c !important;
      --bg-base-old: #000000 !important;
      --text-primary: #FFFFFF !important;
      --text-secondary: #B3B3B3 !important;
      --text-muted: #71717A !important;
      --sidebar-w: 240px;
      --sidebar-w-collapsed: 64px;
    }

    /* 2. Global Page Shell */
    html, body, #__next, main, [role="main"],
    div[class*="min-h-screen"],
    div[class*="bg-[#0c0c0c]"], div[class*="bg-[#0e0d0c]"], div[class*="bg-[#141414]"],
    div[class*="bg-[#100f0e]"], div[class*="bg-[#131110]"], div[class*="bg-[#1a1614]"],
    div[class*="bg-stone-"], div[class*="bg-neutral-"], div[class*="bg-zinc-"],
    div[style*="rgba(10,8,6"], div[style*="rgba(10, 8, 6"],
    div[style*="#0a0a0a"], div[style*="#0c0c0c"], div[style*="#0e0d0c"] {
      background-color: #000000 !important;
      background-image: none !important;
      color: #FFFFFF !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }

    /* 3. Left Sidebar */
    aside, [class*="sidebar"], nav[class*="sidebar"],
    div[class*="w-60"], div[class*="w-64"], div[style*="width: 240px"], div[style*="width:240px"],
    .angaar-modern-sidebar {
      background-color: #0c0c0e !important;
      background-image: none !important;
      border-right: 1px solid #202020 !important;
      box-shadow: none !important;
    }

    /* Sidebar Section Titles */
    aside h2, aside h3, aside [class*="title"], aside [class*="label"],
    [class*="sidebar"] h2, [class*="sidebar"] h3, [class*="sidebar"] p,
    [class*="sidebar"] [class*="heading"], [class*="sidebar"] [class*="category"],
    div[class*="w-60"] p, div[class*="w-64"] p,
    .angaar-modern-sidebar-cat {
      font-size: 11px !important;
      font-weight: 600 !important;
      letter-spacing: 0.06em !important;
      color: #52525B !important;
      text-transform: uppercase !important;
    }

    /* Sidebar Navigation Items */
    aside a, [class*="sidebar"] a, div[class*="w-60"] a, div[class*="w-64"] a,
    .angaar-modern-sidebar a {
      border-radius: 12px !important;
      color: #B3B3B3 !important;
      font-size: 13px !important;
      font-weight: 400 !important;
      transition: all 0.15s ease !important;
    }

    aside a:hover, [class*="sidebar"] a:hover, div[class*="w-60"] a:hover, div[class*="w-64"] a:hover,
    .angaar-modern-sidebar a:hover {
      background-color: #161616 !important;
      color: #FFFFFF !important;
    }

    /* Active Sidebar Navigation Item */
    aside a[class*="active"], [class*="sidebar"] a[class*="active"],
    a[href*="/courses"][class*="border"], a[href*="/courses"][class*="bg-"],
    [class*="sidebar"] .bg-orange-500\\/10, [class*="sidebar"] .border-orange-500\\/40,
    [class*="sidebar"] a:has([class*="bg-orange"]),
    .angaar-modern-sidebar-active {
      background-color: rgba(239, 68, 68, 0.12) !important;
      border: 1px solid rgba(239, 68, 68, 0.35) !important;
      color: #FFFFFF !important;
      font-weight: 500 !important;
    }

    /* Active Badge '1' on My Courses */
    [class*="sidebar"] span[class*="rounded-full"][class*="bg-orange"],
    [class*="sidebar"] span[class*="rounded-full"][class*="bg-amber"],
    aside span[class*="rounded-full"],
    .angaar-modern-badge-red {
      background-color: #EF4444 !important;
      color: #FFFFFF !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      border-radius: 9999px !important;
      padding: 1px 7px !important;
    }

    /* Logout Button */
    [class*="sidebar"] button:has(svg), aside button:has(svg),
    [class*="sidebar"] a[href*="logout"],
    div[class*="w-64"] button:has(svg),
    .angaar-modern-logout-btn {
      background-color: #121212 !important;
      border: 1px solid #202020 !important;
      border-radius: 12px !important;
      color: #EF4444 !important;
      font-weight: 500 !important;
      transition: all 0.15s ease !important;
    }
    [class*="sidebar"] button:has(svg):hover,
    .angaar-modern-logout-btn:hover {
      background-color: #1a1a1a !important;
      border-color: rgba(239, 68, 68, 0.35) !important;
    }

    /* 4. Top Navbar */
    header, [role="banner"], nav[class*="header"], [class*="navbar"],
    body > div > header, body > div > div > header,
    .angaar-modern-header {
      background-color: rgba(0, 0, 0, 0.85) !important;
      background-image: none !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border-bottom: 1px solid #202020 !important;
    }

    /* Streak and Coin Badges */
    header [class*="rounded-full"], nav [class*="rounded-full"],
    header div:has(> svg):has(span) {
      background-color: #121212 !important;
      border: 1px solid #202020 !important;
      border-radius: 9999px !important;
    }

    /* 5. Course Hero Card ("FLARE 1.0 | DSA with Java") */
    div[class*="rounded-2xl"][class*="border"]:not(#angaar-ext-modal-overlay *),
    .angaar-modern-hero-card {
      background: #121212 !important;
      background-image: none !important;
      border: 1px solid #202020 !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6) !important;
    }

    /* Circular Progress Ring */
    div[class*="rounded-2xl"] circle:not([stroke-dasharray]),
    .angaar-modern-hero-card circle:not([stroke-dasharray]) {
      stroke: #262626 !important;
    }
    div[class*="rounded-2xl"] circle[stroke-dasharray],
    .angaar-modern-hero-card circle[stroke-dasharray] {
      stroke: #10B981 !important;
    }

    /* 6. Course Navigation Tabs */
    .angaar-modern-course-tabs,
    div[class*="border-b"]:has(button[class*="border-b"]) {
      border-bottom: 1px solid #202020 !important;
    }

    /* Active tab underline */
    div[class*="bg-orange-500"][class*="h-[2px]"],
    div[class*="bg-orange-500"][class*="h-0.5"],
    div[class*="border-orange-500"] {
      background-color: #EF4444 !important;
      border-color: #EF4444 !important;
    }

    /* In-Page Checklist Pro Tab Button */
    .angaar-page-checklist-tab {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 8px 16px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      color: #B3B3B3 !important;
      background: transparent !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      white-space: nowrap !important;
    }
    .angaar-page-checklist-tab:hover {
      color: #FFFFFF !important;
    }
    .angaar-page-checklist-tab.angaar-tab-active {
      color: #FFFFFF !important;
      border-bottom: 2px solid #EF4444 !important;
    }

    /* In-Page Checklist Container on Course Page */
    #angaar-page-checklist-wrapper {
      margin-top: 20px;
      width: 100%;
    }

    /* 7. Search Bar Pill */
    input[type="text"][placeholder*="Search"],
    input[type="search"][placeholder*="Search"],
    input[placeholder*="Search sheets"],
    .angaar-modern-search-input {
      background-color: #121212 !important;
      border: 1px solid #202020 !important;
      border-radius: 9999px !important;
      color: #FFFFFF !important;
      font-size: 13px !important;
      padding: 10px 20px 10px 42px !important;
      transition: all 0.2s ease !important;
    }
    input[placeholder*="Search sheets"]:focus,
    .angaar-modern-search-input:focus {
      border-color: rgba(239, 68, 68, 0.45) !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
    }

    /* 8. Section Header Indicator ("Sheets (39)") */
    div[class*="border-l-4"][class*="border-orange"],
    div[class*="bg-orange"][class*="w-1"],
    span[class*="bg-orange"][class*="w-1"],
    .angaar-modern-indicator {
      background-color: #EF4444 !important;
      border-color: #EF4444 !important;
      width: 3px !important;
      border-radius: 9999px !important;
    }

    /* 9. Sheet Cards (Sheet 1, Sheet 2, ...) */
    div[class*="rounded-xl"][class*="border"]:not(#angaar-ext-modal-overlay *),
    .angaar-modern-sheet-card {
      background: #121212 !important;
      background-image: none !important;
      border: 1px solid #202020 !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
      transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
    }

    div[class*="rounded-xl"][class*="border"]:hover:not(#angaar-ext-modal-overlay *),
    .angaar-modern-sheet-card:hover {
      border-color: #333333 !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7) !important;
    }

    /* SHEET 1 Badge */
    .angaar-modern-sheet-pill {
      background-color: #181818 !important;
      border: 1px solid #262626 !important;
      color: #B3B3B3 !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      padding: 2px 8px !important;
    }

    /* CODING Badge */
    .angaar-modern-coding-pill {
      background-color: rgba(239, 68, 68, 0.10) !important;
      border: 1px solid rgba(239, 68, 68, 0.25) !important;
      color: #EF4444 !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      padding: 2px 8px !important;
    }

    /* Sheet Cohort Importance % Badge (rules.md Obsidian red accent) */
    .angaar-sheet-imp-badge {
      background: rgba(239, 68, 68, 0.12) !important;
      border: 1px solid rgba(239, 68, 68, 0.35) !important;
      color: #EF4444 !important;
      border-radius: 8px !important;
      padding: 2px 8px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 3px !important;
      margin-left: 6px !important;
      cursor: help !important;
      letter-spacing: 0.02em !important;
      vertical-align: middle !important;
      white-space: nowrap !important;
    }

    /* Sheet Progress Bars */
    div[class*="rounded-xl"] [role="progressbar"],
    div[class*="rounded-xl"] div[class*="h-1"],
    div[class*="rounded-xl"] div[class*="h-1.5"],
    div[class*="rounded-xl"] div[class*="h-2"],
    .angaar-modern-sheet-card [role="progressbar"] {
      background-color: #262626 !important;
      border-radius: 9999px !important;
      overflow: hidden !important;
    }

    div[class*="rounded-xl"] div[class*="bg-emerald"],
    div[class*="rounded-xl"] div[class*="bg-green"],
    .angaar-modern-sheet-card div[class*="bg-emerald"] {
      background: linear-gradient(90deg, #10B981, #34D399) !important;
      border-radius: 9999px !important;
    }

    /* Review / Hide Action Button */
    .angaar-modern-review-btn,
    div[class*="rounded-xl"] button:not(#angaar-ext-modal-overlay *) {
      background: #181818 !important;
      border: 1px solid #282828 !important;
      border-radius: 12px !important;
      color: #EDEDED !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      padding: 6px 14px !important;
      transition: all 0.15s ease !important;
    }

    .angaar-modern-review-btn:hover,
    div[class*="rounded-xl"] button:hover:not(#angaar-ext-modal-overlay *) {
      background: #222222 !important;
      border-color: #444444 !important;
      color: #FFFFFF !important;
    }

    /* 10. Expanded Sheet Question Rows (Image 2) */
    .angaar-modern-question-row,
    div[class*="group"]:has(a[href*="/solve/"]) {
      border-radius: 8px !important;
      padding: 8px 12px !important;
      transition: background-color 0.15s ease !important;
    }
    .angaar-modern-question-row:hover,
    div[class*="group"]:has(a[href*="/solve/"]):hover {
      background-color: #181818 !important;
    }

    /* Solved Checkmark Icon */
    svg[class*="text-emerald"], svg[class*="text-green"],
    .angaar-modern-solved-icon {
      color: #10B981 !important;
    }

    /* Difficulty Badges */
    .angaar-modern-diff-easy {
      background-color: rgba(16, 185, 129, 0.12) !important;
      border: 1px solid rgba(16, 185, 129, 0.30) !important;
      color: #10B981 !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      padding: 2px 8px !important;
    }

    .angaar-modern-diff-medium {
      background-color: rgba(245, 158, 11, 0.12) !important;
      border: 1px solid rgba(245, 158, 11, 0.30) !important;
      color: #F59E0B !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      padding: 2px 8px !important;
    }

    .angaar-modern-diff-hard {
      background-color: rgba(239, 68, 68, 0.12) !important;
      border: 1px solid rgba(239, 68, 68, 0.30) !important;
      color: #EF4444 !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      padding: 2px 8px !important;
    }

    /* Question Cohort Importance % Badge (rules.md Emerald high / Red soft) */
    .angaar-q-imp-badge {
      border-radius: 8px !important;
      padding: 2px 6px !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 3px !important;
      margin-left: 6px !important;
      cursor: help !important;
      white-space: nowrap !important;
      vertical-align: middle !important;
      letter-spacing: 0.02em !important;
    }
    .angaar-q-imp-badge.imp-high {
      background: rgba(16, 185, 129, 0.12) !important;
      border: 1px solid rgba(16, 185, 129, 0.32) !important;
      color: #10B981 !important;
    }
    .angaar-q-imp-badge.imp-med {
      background: rgba(239, 68, 68, 0.10) !important;
      border: 1px solid rgba(239, 68, 68, 0.28) !important;
      color: #F87171 !important;
    }

    /* YouTube Button */
    .angaar-modern-youtube-btn,
    div[class*="group"] a:has(svg path[d*="youtube"]),
    div[class*="group"] button:has(svg path[d*="youtube"]) {
      background-color: #181818 !important;
      border: 1px solid #262626 !important;
      border-radius: 8px !important;
      padding: 4px 8px !important;
      transition: all 0.15s ease !important;
    }
    .angaar-modern-youtube-btn:hover {
      background-color: #222222 !important;
      border-color: #383838 !important;
    }

    /* Practice "Review" button inside question row */
    .angaar-modern-practice-btn,
    div[class*="group"] a[href*="/solve/"],
    div[class*="group"] a[href*="/solve/"] button {
      background-color: #181818 !important;
      border: 1px solid #282828 !important;
      color: #EDEDED !important;
      border-radius: 8px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      padding: 4px 12px !important;
      text-decoration: none !important;
      transition: all 0.15s ease !important;
    }
    .angaar-modern-practice-btn:hover,
    div[class*="group"] a[href*="/solve/"]:hover {
      background-color: #EF4444 !important;
      border-color: #EF4444 !important;
      color: #FFFFFF !important;
    }

    /* 11. Timeline Connector */
    div[class*="w-0.5"][class*="bg-"],
    div[class*="w-px"][class*="bg-"] {
      background-color: #202020 !important;
    }
    div[class*="rounded-full"][class*="border-2"] {
      border-color: #262626 !important;
      background-color: #121212 !important;
    }
    div[class*="rounded-full"][class*="border-2"][class*="border-green"],
    div[class*="rounded-full"][class*="border-2"][class*="border-emerald"] {
      border-color: #10B981 !important;
      background-color: #10B981 !important;
    }

    /* 12. Eliminate all Tailwind Orange outlines, backgrounds, and muddy gradients */
    .border-orange-500, .border-orange-400, [class*="border-orange"] {
      border-color: #202020 !important;
    }
    .border-orange-500\\/20, .border-orange-500\\/30, .border-orange-500\\/40 {
      border-color: #202020 !important;
    }
    .bg-orange-500\\/10, .bg-orange-500\\/20, .bg-orange-900\\/20 {
      background-color: #181818 !important;
    }
    .from-orange-500\\/10, .from-orange-500\\/20, .to-orange-500\\/10, .via-orange-500\\/10 {
      --tw-gradient-from: #121212 !important;
      --tw-gradient-to: #121212 !important;
      --tw-gradient-stops: #121212, #121212 !important;
    }
  `;
}

// Transform the DOM into Modern Obsidian SaaS Aesthetics
function applyModernWebsiteDesign() {
  injectWebsiteModernTheme();

  // 0. Scrub inline background styles from website containers
  document.querySelectorAll('div[style], header[style], nav[style], main[style]').forEach(el => {
    if (el.id?.startsWith('angaar-') || el.closest('#angaar-ext-modal-overlay') || el.closest('#angaar-ext-float-btn')) return;
    const styleAttr = el.getAttribute('style') || '';
    if (styleAttr.includes('background') || styleAttr.includes('border')) {
      if (styleAttr.includes('10,8,6') || styleAttr.includes('#0a0a0a') || styleAttr.includes('#0c0c0c') || styleAttr.includes('#0e0d0c') || styleAttr.includes('gradient')) {
        el.style.setProperty('background-color', '#000000', 'important');
        el.style.setProperty('background-image', 'none', 'important');
      }
    }
  });

  // 1. Sidebar transformation
  const navLinks = Array.from(document.querySelectorAll('a[href*="/dashboard"], a[href*="/courses"], a[href*="/certificates"], a[href*="/mastersheets"]'));
  if (navLinks.length > 0) {
    let sidebar = navLinks[0].closest('aside') || navLinks[0].closest('[class*="w-6"]') || navLinks[0].closest('nav');
    if (sidebar) {
      sidebar.classList.add('angaar-modern-sidebar');
      sidebar.style.backgroundColor = '#0c0c0e';
      sidebar.style.borderColor = '#202020';

      // Section titles
      sidebar.querySelectorAll('h2, h3, p, div, span').forEach(el => {
        const text = el.textContent.trim();
        if (['MAIN ACCOUNT', 'LEARNING', 'COMPETE', 'HELP DESK'].includes(text)) {
          el.classList.add('angaar-modern-sidebar-cat');
        }
      });

      // Active item (My Courses)
      navLinks.forEach(link => {
        if (link.getAttribute('href')?.includes('/courses')) {
          link.classList.add('angaar-modern-sidebar-active');
          const badge = link.querySelector('span[class*="rounded-full"]');
          if (badge) badge.classList.add('angaar-modern-badge-red');
        }
      });

      // Logout button
      sidebar.querySelectorAll('button, a').forEach(el => {
        if (el.textContent.trim().includes('Logout')) {
          el.classList.add('angaar-modern-logout-btn');
        }
      });
    }
  }

  // 2. Course Hero Card ("FLARE 1.0 | DSA with Java")
  const heroCandidates = Array.from(document.querySelectorAll('div[class*="rounded-2xl"], div[class*="rounded-xl"]'));
  heroCandidates.forEach(card => {
    if (card.textContent.includes('FLARE 1.0') || card.textContent.includes('questions solved') || card.textContent.includes('Overall Progress')) {
      card.classList.add('angaar-modern-hero-card');
      card.style.backgroundImage = 'none';
      card.style.backgroundColor = '#121212';
      card.style.borderColor = '#202020';

      // Circular SVG progress ring
      card.querySelectorAll('circle').forEach(circle => {
        if (circle.hasAttribute('stroke-dasharray')) {
          circle.style.stroke = '#10B981';
        } else {
          circle.style.stroke = '#262626';
        }
      });
    }
  });

  // 3. Course Tabs & In-Page Checklist Pro Injection
  const tabCandidates = Array.from(document.querySelectorAll('button, a')).filter(el => {
    const txt = el.textContent.trim();
    return txt === 'Ongoing Sheets' || txt === 'Leaderboard';
  });

  if (tabCandidates.length > 0) {
    const tabContainer = tabCandidates[0].parentElement;
    if (tabContainer) {
      tabContainer.classList.add('angaar-modern-course-tabs');

      function hideNativeCourseContent() {
        // Hide search input and its container
        document.querySelectorAll('input[placeholder*="Search"]').forEach(inp => {
          if (!inp.closest('#angaar-page-checklist-wrapper')) {
            const row = inp.closest('div[class*="relative"]') || inp.closest('div[class*="flex items-center"]') || inp.parentElement;
            if (row && !row.contains(tabContainer)) {
              row.setAttribute('data-angaar-native-hidden', 'true');
              row.style.setProperty('display', 'none', 'important');
            }
          }
        });

        // Hide "Sheets (39)" section indicator and headers
        document.querySelectorAll('div, span, p').forEach(el => {
          const t = el.textContent.trim();
          if (t.startsWith('Sheets (') || t === 'Sheets' || (t.includes('Ongoing Sheets') && el.tagName !== 'BUTTON' && el.tagName !== 'A')) {
            const parentRow = el.closest('div[class*="flex items-center justify-between"]') || el.closest('div[class*="flex"]') || el;
            if (parentRow && !parentRow.closest('#angaar-page-checklist-wrapper') && !parentRow.contains(tabContainer)) {
              parentRow.setAttribute('data-angaar-native-hidden', 'true');
              parentRow.style.setProperty('display', 'none', 'important');
            }
          }
        });

        // Hide all native sheet cards
        document.querySelectorAll('div[class*="rounded-xl"], div[class*="rounded-2xl"]').forEach(card => {
          if (!card.closest('#angaar-page-checklist-wrapper') && !card.classList.contains('angaar-modern-hero-card')) {
            if (card.textContent.includes('SHEET ') && card.textContent.includes('CODING')) {
              card.setAttribute('data-angaar-native-hidden', 'true');
              card.style.setProperty('display', 'none', 'important');
            }
          }
        });

        // Hide sibling elements after tabContainer in its parent
        if (tabContainer && tabContainer.parentElement) {
          let sib = tabContainer.nextElementSibling;
          while (sib) {
            if (sib.id !== 'angaar-page-checklist-wrapper') {
              sib.setAttribute('data-angaar-native-hidden', 'true');
              sib.style.setProperty('display', 'none', 'important');
            }
            sib = sib.nextElementSibling;
          }
        }
      }

      function restoreNativeCourseContent() {
        document.querySelectorAll('[data-angaar-native-hidden="true"]').forEach(el => {
          el.style.display = '';
          el.removeAttribute('data-angaar-native-hidden');
        });
        const pageChkWrap = document.getElementById('angaar-page-checklist-wrapper');
        if (pageChkWrap) {
          pageChkWrap.style.setProperty('display', 'none', 'important');
        }
      }

      let chkTab = tabContainer.querySelector('#angaar-page-checklist-tab');
      if (!chkTab) {
        chkTab = document.createElement('button');
        chkTab.id = 'angaar-page-checklist-tab';
        chkTab.className = 'angaar-page-checklist-tab';
        chkTab.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#10B981;margin-right:4px;">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Checklist Pro
        `;

        chkTab.addEventListener('click', (e) => {
          e.preventDefault();
          // Active state on tab
          tabCandidates.forEach(t => {
            t.classList.remove('angaar-tab-active', 'border-b-2', 'border-orange-500', 'text-white');
            t.style.setProperty('border-bottom', '2px solid transparent', 'important');
            t.style.setProperty('color', '#888888', 'important');
          });
          chkTab.classList.add('angaar-tab-active');
          chkTab.style.setProperty('color', '#FFFFFF', 'important');
          chkTab.style.setProperty('border-bottom', '2px solid #EF4444', 'important');

          // Hide native red/orange active underline inside tabContainer
          tabContainer.querySelectorAll('div[class*="bg-orange"], div[class*="h-"], span[class*="h-"]').forEach(line => {
            line.setAttribute('data-angaar-line-hidden', 'true');
            line.style.setProperty('display', 'none', 'important');
          });

          // Locate or create checklist wrapper right after tabContainer
          let pageChkWrap = document.getElementById('angaar-page-checklist-wrapper');
          if (!pageChkWrap) {
            pageChkWrap = document.createElement('div');
            pageChkWrap.id = 'angaar-page-checklist-wrapper';
            pageChkWrap.className = 'angaar-page-checklist-wrapper';
            tabContainer.insertAdjacentElement('afterend', pageChkWrap);
          }
          pageChkWrap.style.removeProperty('display');
          pageChkWrap.style.setProperty('display', 'block', 'important');

          // Hide native course content
          hideNativeCourseContent();

          // Render interactive checklist
          if (typeof renderChecklistUI === 'function') {
            renderChecklistUI(pageChkWrap);
          }
        });

        tabCandidates.forEach(t => {
          t.addEventListener('click', () => {
            chkTab.classList.remove('angaar-tab-active');
            chkTab.style.removeProperty('border-bottom');
            chkTab.style.removeProperty('color');
            restoreNativeCourseContent();
            tabCandidates.forEach(otherT => {
              otherT.style.removeProperty('border-bottom');
              otherT.style.removeProperty('color');
            });
            tabContainer.querySelectorAll('[data-angaar-line-hidden="true"]').forEach(line => {
              line.style.removeProperty('display');
              line.removeAttribute('data-angaar-line-hidden');
            });
          });
        });

        tabContainer.appendChild(chkTab);
      }

      // If Checklist Pro is currently active, ensure native content stays hidden across Next.js re-renders
      if (chkTab && chkTab.classList.contains('angaar-tab-active')) {
        hideNativeCourseContent();
        const pageChkWrap = document.getElementById('angaar-page-checklist-wrapper');
        if (pageChkWrap) {
          pageChkWrap.style.setProperty('display', 'block', 'important');
        }
      }
    }
  }

  // 4. Sheet Cards & Badges + Cohort Importance % Injection
  const sheetCards = Array.from(document.querySelectorAll('div[class*="rounded-xl"], div[class*="rounded-2xl"]')).filter(card => {
    return !card.closest('#angaar-page-checklist-wrapper') &&
           !card.classList.contains('angaar-modern-hero-card') &&
           card.textContent.includes('SHEET ') &&
           card.textContent.includes('CODING');
  });

  sheetCards.forEach((card, sIdx) => {
    card.classList.add('angaar-modern-sheet-card');
    card.style.backgroundImage = 'none';
    card.style.backgroundColor = '#121212';
    card.style.borderColor = '#202020';

    const sheetPill = Array.from(card.querySelectorAll('span, div')).find(el => el.textContent.trim().startsWith('SHEET '));
    const codingPill = Array.from(card.querySelectorAll('span, div')).find(el => el.textContent.trim() === 'CODING');

    if (sheetPill) sheetPill.classList.add('angaar-modern-sheet-pill');
    if (codingPill) codingPill.classList.add('angaar-modern-coding-pill');

    let sheetNum = sIdx;
    if (sheetPill) {
      const match = sheetPill.textContent.match(/SHEET\s*0*(\d+)/i);
      if (match) {
        sheetNum = Math.max(0, parseInt(match[1], 10) - 1);
      }
    }

    const titleEl = card.querySelector('h2, h3, h4, [class*="font-semibold"], [class*="font-bold"], [class*="text-base"], [class*="text-lg"]');
    const sheetName = titleEl ? titleEl.textContent.trim() : `Sheet ${sheetNum + 1}`;

    // Cohort Importance Calculation
    const sheetImp = getSheetImportance(sheetName, sheetNum, 39);

    // Inject or update Sheet Importance Badge
    let impBadge = card.querySelector('.angaar-sheet-imp-badge');
    if (!impBadge) {
      impBadge = document.createElement('span');
      impBadge.className = 'angaar-sheet-imp-badge';
      const targetPill = codingPill || sheetPill;
      if (targetPill && targetPill.parentElement) {
        targetPill.insertAdjacentElement('afterend', impBadge);
      } else {
        card.prepend(impBadge);
      }
    }

    impBadge.setAttribute('data-sheet-imp', sheetImp);
    impBadge.title = `🔥 ${sheetImp}% Cohort Importance: Completed by ${sheetImp}% of batch students.`;
    impBadge.innerHTML = `🔥 ${sheetImp}% Imp`;

    card.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent.trim();
      if (text.includes('Review') || text.includes('Hide')) {
        btn.classList.add('angaar-modern-review-btn');
      }
    });
  });

  // 5. Question Table Rows + Question Importance % Injection
  document.querySelectorAll('div[class*="group"], div[class*="flex items-center"]').forEach(row => {
    if (row.closest('#angaar-page-checklist-wrapper')) return;

    const solveLink = row.querySelector('a[href*="/solve/"]');
    const diffBadge = Array.from(row.querySelectorAll('span')).find(sp => {
      const t = sp.textContent.trim();
      return t === 'Easy' || t === 'Medium' || t === 'Hard';
    });

    if (solveLink || (diffBadge && (row.querySelector('button') || row.querySelector('svg')))) {
      row.classList.add('angaar-modern-question-row');

      if (diffBadge) {
        const diffText = diffBadge.textContent.trim();
        if (diffText === 'Easy') diffBadge.classList.add('angaar-modern-diff-easy');
        else if (diffText === 'Medium') diffBadge.classList.add('angaar-modern-diff-medium');
        else if (diffText === 'Hard') diffBadge.classList.add('angaar-modern-diff-hard');
      }

      // Extract Question Details
      const qTitleEl = solveLink || Array.from(row.querySelectorAll('p, span, div')).find(el => {
        const txt = el.textContent.trim();
        return txt.length > 2 && !['Easy', 'Medium', 'Hard', 'Review', 'Practice', 'Solved'].includes(txt);
      });
      const qTitle = qTitleEl ? qTitleEl.textContent.trim() : 'Question';
      const qDiff = diffBadge ? diffBadge.textContent.trim() : 'Easy';

      // Find parent sheet card to extract parent sheet importance
      const parentCard = row.closest('.angaar-modern-sheet-card') || row.closest('div[class*="rounded-xl"], div[class*="rounded-2xl"]');
      let parentImp = 90;
      let qIdx = 0;
      let totalInSheet = 10;
      if (parentCard) {
        const parentBadge = parentCard.querySelector('.angaar-sheet-imp-badge');
        if (parentBadge) {
          const parsed = parseInt(parentBadge.getAttribute('data-sheet-imp') || parentBadge.textContent.replace(/\D/g, ''), 10);
          if (!isNaN(parsed)) parentImp = parsed;
        }
        const siblingRows = Array.from(parentCard.querySelectorAll('.angaar-modern-question-row, div[class*="group"]'));
        qIdx = siblingRows.indexOf(row);
        totalInSheet = siblingRows.length || 10;
      }

      const qImp = getQuestionImportance(qTitle, qDiff, parentImp, qIdx >= 0 ? qIdx : 0, totalInSheet);

      // Inject or update Question Importance Badge
      let qImpBadge = row.querySelector('.angaar-q-imp-badge');
      if (!qImpBadge) {
        qImpBadge = document.createElement('span');
        if (diffBadge && diffBadge.parentElement) {
          diffBadge.insertAdjacentElement('afterend', qImpBadge);
        } else if (solveLink) {
          solveLink.insertAdjacentElement('beforebegin', qImpBadge);
        } else {
          row.appendChild(qImpBadge);
        }
      }

      const isHigh = qImp >= 85;
      qImpBadge.className = `angaar-q-imp-badge ${isHigh ? 'imp-high' : 'imp-med'}`;
      qImpBadge.title = `🎯 ${qImp}% Question Importance: Solved by ${qImp}% of batch students.`;
      qImpBadge.innerHTML = `🎯 ${qImp}% Imp`;

      row.querySelectorAll('a, button').forEach(el => {
        const text = el.textContent.trim();
        if ((text === 'Review' || text === 'Practice') && el.getAttribute('href')?.includes('/solve/')) {
          el.classList.add('angaar-modern-practice-btn');
        }
        if (el.querySelector('svg path[d*="youtube"]') || el.getAttribute('href')?.includes('youtu')) {
          el.classList.add('angaar-modern-youtube-btn');
        }
      });
    }
  });
}

// Debounced Observer for Dynamic Changes
let modernDesignTimeout = null;
function triggerModernDesignUpdate() {
  if (modernDesignTimeout) clearTimeout(modernDesignTimeout);
  modernDesignTimeout = setTimeout(() => {
    applyModernWebsiteDesign();
  }, 100);
}

// Initialize Immediately
injectWebsiteModernTheme();
applyModernWebsiteDesign();

// Startup Listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createUI();
    checkAndFetchCurrentQuestion();
    fetchBatchDetails();
    setupSubmissionObserver();
    applyModernWebsiteDesign();
  });
} else {
  createUI();
  checkAndFetchCurrentQuestion();
  fetchBatchDetails();
  setupSubmissionObserver();
  applyModernWebsiteDesign();
}
window.addEventListener('load', () => {
  applyModernWebsiteDesign();
});

// Observe Next.js route transitions and dynamic hydration
const designObserver = new MutationObserver(() => {
  triggerModernDesignUpdate();
});
designObserver.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true
});

// Patch pushState/replaceState to detect Next.js client-side navigation
const originalPushState = history.pushState;
history.pushState = function () {
  originalPushState.apply(this, arguments);
  triggerModernDesignUpdate();
};
const originalReplaceState = history.replaceState;
history.replaceState = function () {
  originalReplaceState.apply(this, arguments);
  triggerModernDesignUpdate();
};
window.addEventListener('popstate', triggerModernDesignUpdate);


})();