---
name: angaar-platform
description: >-
  Comprehensive guide and reverse-engineered technical specification for The Angaar Batch platform (theangaarbatch.in).
  Covers the frontend architecture (Next.js/Turbopack), backend API endpoints (Django REST Framework),
  authentication flows, batch & contest leaderboard pagination, code execution runners, and data extraction workflows.
---

# The Angaar Batch Platform Guide

This skill documents the architecture, internal API endpoints, authentication mechanisms, and data extraction techniques for [The Angaar Batch](https://theangaarbatch.in), an Indian competitive programming and DSA bootcamp platform.

---

## 1. Platform Architecture

The Angaar Batch platform is built with a decoupled modern architecture:

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) + Turbopack | React 19 canary, server-driven chunks with `self.__next_f`, dark theme UI (`#0a0a0a`, `#f97316` orange accent). |
| **Backend** | Django & Django REST Framework (DRF) | Standard REST endpoints under `/dashboard/api/v1/` and `/administration/api/v1/`. |
| **Reverse Proxy / CDN** | Cloudflare Edge | SSL termination, rocket-loader, DDoS protection, static chunk caching. |
| **Authentication** | Cookie-based Session Auth | Unauthenticated requests receive HTTP `307 Temporary Redirect` to `/login?next=...`. Authenticated client requests send credentials automatically (`credentials: 'include'`). |

---

## 2. API Endpoint Reference

All endpoints below reside under `https://theangaarbatch.in`. Authenticated requests must include valid session cookies.

### 2.1 Batches & Leaderboard Schema (Reverse-Engineered)
- **Batch Leaderboard Endpoint**: `/api/django/dashboard/api/v1/batch/${batchSlugOrId}/leaderboard/`
- **Pagination Parameter**: `?page=1`, `?page=2` ... (Returns 10 students per page (Verified: batches contain 600+ students across 60+ pages)
- **Next.js Proxy Architecture**: The Next.js frontend proxies Django REST Framework requests under `/api/django/` (e.g. `/api/django/dashboard/api/v1/...`). Direct requests without `/api/django/` will result in HTTP 404!)
- **Actual Response Schema**:
```json
{
  "leaderboard": [
    {
      "student": {
        "id": 4848,
        "name": "Aayushi Soni"
      },
      "total_score": 21020,
      "solved_problems": 192,
      "rank": 1,
      "earliest_submission": "2026-01-31T17:29:19.179062Z",
      "sheet_breakdown": {
        "Binary Search ": 14,
        "2 Pointer | Partitioning Template": 5,
        "HashMap | Frequency Template": 9,
        "LinkedList Cracker": 13,
        ...
      }
    }
  ]
}
```
- Note: The response object does not include `next` or `count`. Termination condition for multi-page aggregation is `data.leaderboard.length === 0` or `data.leaderboard.length < 5`.

### 2.2 Contests & Competitions
- **Contest Leaderboard**: `/dashboard/api/v1/contests/${contestId}/leaderboard/`
- **List Contests**: `/dashboard/api/v1/contests/`
- **Contest Details**: `/dashboard/api/v1/contests/${contestId}/`
- **Contest Problem**: `/dashboard/api/v1/contests/${contestId}/questions/${questionId}/`
- **Submit Code (Contest)**: `/dashboard/api/v1/contests/${contestId}/submit-code/` (POST)
- **Submit MCQ (Contest)**: `/dashboard/api/v1/contests/${contestId}/submit-mcq/` (POST)
- **Contest Run Code**: `/dashboard/api/v1/contests/${contestId}/run-code/` (POST)
- **Contest Timer**: `/dashboard/api/v1/contests/${contestId}/timer/`
- **My Contest Submissions**: `/dashboard/api/v1/contests/${contestId}/questions/${questionId}/my-submissions/`
- **My Stats**: `/dashboard/api/v1/contests/my-stats/`

### 2.3 Question & Sheet Detail Schema (Reverse-Engineered)
- **Question Details Endpoint**: `GET /api/django/dashboard/api/v1/question/${questionSlug}`
  - Response Schema:
```json
{
  "type": "Coding",
  "problem": {
    "id": 499,
    "title": "Print Numbers from 1 to 10 | LB",
    "slug": "print-numbers-from-1-to-10",
    "difficulty": "Easy",
    "status": "solved",
    "description": "Write a function printOneToTen that prints numbers from 1 to 10...",
    "acceptance": 74.8,
    "totalSolved": 448,
    "starterCode": {
      "C": "...",
      "C++": "...",
      "Java": "...",
      "Python": "..."
    },
    "testCases": [
      {
        "input": "\"\"",
        "expected_output": "1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\r\n10"
      }
    ],
    "youtube_url": "https://youtu.be/...",
    "sheetId": 52
  },
  "sheet": {
    "id": 52,
    "name": "For loop Template"
  },
  "siblings": [
    {
      "id": 1630,
      "title": "For Loop Theory",
      "difficulty": "Easy",
      "status": "solved",
      "slug": "pointer-notes-1-4",
      "is_enabled": true
    },
    ...
  ]
}
```
- Note: `problem.status` changes to `"solved"` upon accepted submission, making it an authoritative trigger for GitHub auto-sync.
- `siblings` provides the complete question list for the parent sheet with real-time solve statuses.

### 2.4 Code Execution & Playground
- **Run Code (Practice)**: `/practice/run_code/${questionId}/`
- **Submit Code (Practice)**: `/practice/submit_code/${questionId}/`
- **Playground Execution**: `/practice/execute_code`
- **Submission Result Polling**: `/practice/submission_result/${submissionId}/`
- **Driver Code**: `/practice/get-driver-code/${questionId}/${languageId}/`
- **Unlock Hint**: `/practice/unlock-hint/${questionId}/`

### 2.5 Jovac & Mastersheets
- **Jovac Courses**: `/dashboard/api/v1/jovac/courses/`
- **Jovac Workspace**: `/dashboard/api/v1/jovac/courses/${courseId}/workspace/`
- **Jovac Sheets**: `/dashboard/api/v1/jovac/courses/${courseId}/sheets/`
- **Assignment Submission**: `/dashboard/api/v1/jovac/assignments/${assignmentId}/submit/`
- **Mastersheet Topic PDF**: `/dashboard/api/v1/mastersheets/${sheetId}/topics/${topicId}/pdf/`

### 2.6 Profile, Stats & Certificates
- **User Profile**: `/dashboard/api/v1/profile/`
- **DSA Stats**: `/dashboard/api/v1/profile/dsa-stats/`
- **Activity Log**: `/dashboard/api/v1/profile/activity/`
- **Certificates**: `/dashboard/api/v1/certificates/`
- **Download Certificate**: `/dashboard/api/v1/certificate/${certId}/download/`

---


### 2.7 Question Navigation & Sheet Hierarchy
When moving between problems (e.g., clicking "Next Problem"):
1. **Next.js RSC Navigation**: Client requests RSC payload for `/courses/${courseSlug}/solve/${problemSlug}`.
2. **Question Fetch**: Client calls `GET /api/django/dashboard/api/v1/question/${problemSlug}`.
3. **Hierarchy Context**:
   - `response.sheet`: Contains current sheet metadata (`id`, `name`).
   - `response.siblings`: Contains the ordered list of all sibling questions in the sheet with their individual `status` (`"solved"` vs `"unsolved"`), `id`, `title`, `slug`, and `difficulty`.
   - `response.problem.starterCode`: Language-specific boilerplate templates for C, C++, Java, Python.
   - `response.problem.testCases`: Sample test inputs and expected outputs.

## 3. Leaderboard Pagination & Extraction Strategy

### Why only 7 members appear at once
The Angaar batch courses frontend queries `/api/django/dashboard/api/v1/batch/${slug}/leaderboard/` with DRF page-size pagination returning 7 rows per page. The web UI exposes only simple Previous / Next pagination buttons.

### Method A: Automated API Multi-Page Aggregator
Because authentication is cookie-based, any script running in DevTools console or an extension content script can fetch sequential pages in the browser context:

```javascript
async function fetchFullLeaderboard(slug) {
  let allMembers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`/api/django/dashboard/api/v1/batch/${slug}/leaderboard?page=${page}`, {
      credentials: 'include'
    });
    if (!res.ok) break;
    const data = await res.json();
    const items = data.results || data.data || (Array.isArray(data) ? data : []);
    if (items.length === 0) break;

    allMembers.push(...items);
    hasMore = Boolean(data.next) && items.length > 0;
    page++;
    await new Promise(r => setTimeout(r, 60)); // gentle delay
  }
  return allMembers;
}
```

### Method B: DOM Auto-Crawler Fallback
If direct API calls are blocked by CORS or tokens:
1. Extract existing 7 rows from the DOM table (`table tbody tr`).
2. Query the "Next" button (`button` matching text "Next" or arrow svg).
3. Dispatch `.click()` event, wait 300ms for React hydration.
4. Repeat until the "Next" button is disabled or no new students are found.

---

## 4. Key Takeaways & Recommendations

- Always use `credentials: 'include'` when interacting with the `/dashboard/api/v1/` routes from JavaScript.
- Dynamic batch slugs (such as `flare-10--dsa-with-java`) can be resolved directly from `window.location.pathname.match(/\/courses\/([^\/\?#]+)/)[1]`.
- Top-ranking members in competitive cohorts can be quickly filtered or exported to CSV for batch-wide performance tracking.


## 6. Pro & Cheat Features (Platform Secrets)

1. **Secret Test Cases & Expected Outputs**:
   - The platform sends the entire test suite in `response.problem.testCases` (`input` and `expected_output`) via `GET /api/django/dashboard/api/v1/question/${slug}`.
   - The extension exposes these directly in the "Cheat Menu" so students can see all edge cases before submitting.
2. **Hidden Video Editorials**:
   - `response.problem.youtube_url` contains unlisted/direct YouTube video solution links for problems.
3. **Fast Sheet Navigator**:
   - Uses `response.siblings` to switch between all problems in a sheet without returning to the course curriculum page.

## 7. Master Design System & UI Architecture (Strict SaaS Rules)

The extension UI conforms strictly to the production-grade SaaS design principles derived from `rules.md`:

1. **Master Color System (:root)**:
   - Zero hardcoded random hex colors. All elements consume CSS variables.
   - Primary Accent: Angaar Flame Orange (`#f97316`), hover (`#ea580c`), subtle glow (`rgba(249, 115, 22, 0.12)`).
   - Surfaces: Obsidian dark (`#0a0a0c` bg, `#11141d` cards, `#161b26` elevated, `#202637` borders).
   - High Contrast Law: Crisp white (`#f8fafc`) on dark surfaces; zero dark-on-dark or low-contrast text.

2. **Strict 4-Token Border-Radius Scale**:
   - `rounded-sm` (8px): Inputs, mini tags, badges, code boxes.
   - `rounded-md` (12px): Action buttons, dropdowns, segmented toggles.
   - `rounded-lg` (16px): Main modal container (`#angaar-ext-modal-container`), stat cards, section boxes.
   - `rounded-full` (9999px): Avatars, floating launcher, progress bars, close buttons.

3. **Strict 4px Spacing Scale**:
   - Spacing: 8px, 12px, 16px, 20px, 24px across cards and layout.
   - Card internal padding is uniformly 20px (`p-5`).

4. **Minimal Wording (1-2 Words Maximum)**:
   - All tabs, buttons, card titles, and status tags are strictly 1 to 2 words max (`Leaderboard`, `Analytics`, `GitHub Sync`, `Cheats`, `Checklist`, `Reload`, `Auto-Connect`, `Export CSV`).

5. **Zero Text Wrapping**:
   - Enforced `white-space: nowrap` on all buttons, headers, metric titles, and badges to guarantee single-line cleanliness across all breakpoints.

6. **Purposeful Typography**:
   - Regular (`400`) and medium (`500`) font-weight for list items, member names, scores, and cells. No gratuitous bold (`700+`) anywhere.
   - Headings use clean subtle `600` weight.

7. **Interactive Member Identity**:
   - Student avatar + name groupings are interactive with hover color transition to `--theme-accent`.

## 8. Smart Caching & Zero-Server-Load Auto Rank Update Architecture

To eliminate repeated high-volume network traffic (60+ page HTTP scrapes on every modal open or reload), the platform companion implements an intelligent local state engine:

1. **Persistent Local Caching (`chrome.storage.local`)**:
   - The entire 600+ students dataset is persisted to disk under `angaar_lb_${courseSlug}`.
   - On modal launch or tab navigation, data loads in **0 ms** without sending a single network packet to `theangaarbatch.in`.
   - Displays a live cache freshness indicator (`⚡ Cached (Xm ago)`).

2. **Zero-Server-Load In-Memory Rank Recalculation**:
   - When a student completes a DSA problem, the extension captures the `Accepted` event via DOM mutation observation or question status inspection (`problem.status === 'solved'`).
   - Rather than re-scraping the 600+ member leaderboard from the server, the client:
     1. Increments the student's `solved` count (`+1`) and `score` (`+100 pts`).
     2. Re-sorts all 600+ cached students in memory:
        `allMembers.sort((a, b) => b.score - a.score || b.solved - a.solved)`.
     3. Recalculates exact ranks across the whole batch.
     4. Updates the pinned profile and persists back to `chrome.storage.local`.
     5. Triggers celebratory rank-up toasts with live comparison (`Jumped from #45 to #41`).
   - **Result**: Zero backend load, instantaneous UI responsiveness.

3. **1-Click Profile Pinning**:
   - Each leaderboard row provides a `⭐ Pin Me` button.
   - Pinned student is elevated into a persistent top banner:
     `🏆 My Rank: #42 · Abhiyank · Score: 1,200 · Solved: 12`.
   - Student row is highlighted with flame orange tint (`angaar-row-me`).

4. **Server Anti-DDoS Throttling**:
   - The manual `Reload` button enforces a 2-minute safety guardrail to prevent spamming the Django REST Framework endpoints.
   - Paging loop uses throttled inter-request delays (60ms) to ensure low concurrency pressure on the host server.

## 9. VS Code-Style Code Templates & LeetCode-Style Peer Solutions Engine

The extension equips competitive DSA learners with two primary coding accelerators:

### 9.1 VS Code-Style Templates & Auto-Suggestions
1. **Auto-Suggestion Heuristics**:
   - The extension analyzes the active problem's `title`, `description`, and `sheet.name`.
   - Pattern matchers automatically identify algorithm archetypes:
     - *Binary Search / Boundary*: `Binary Search Template [O(log N)]`
     - *Two Pointers / Sliding Window*: `Sliding Window Template [O(N)]`
     - *Grid / Graph DFS & BFS*: `4-Way Grid Exploration Template`
     - *Monotonic Stack*: `Next Greater Element Template [O(N)]`
     - *Recursion / Backtracking*: `Backtracking & Subsets Template`
     - *Basic Loops / Easy*: `Standard Iteration Range Template`
     - *Frequency*: `HashMap Frequency Counter`
     - *General*: `Java Fast I/O & Template`
   - Displays a live suggestion banner within the modal and an in-editor floating suggestion chip (`#angaar-editor-suggest-bar`).

2. **Custom Snippet Creator (VS Code style)**:
   - Users can define, name, and save their own custom snippets across Java, C++, and Python.
   - Persisted in `chrome.storage.local` under `angaar_custom_snippets`.

3. **1-Click Direct Monaco Editor Injection**:
   - Injects directly into the page context using `window.monaco.editor.getModels()[0].setValue(code)` or `getEditors()[0]`.
   - Simultaneously writes to system clipboard as an instantaneous backup.

### 9.2 LeetCode-Style Peer Solutions Hub
1. **Community Submissions**:
   - Displays accepted solutions authored by top rankers (e.g. `Aayushi Soni - Rank #1`, `Batch Top Solver`).
   - Categorized by language (`Java`, `C++`, `Python`) and complexity tag (`O(N) Optimal`, `1ms`).
2. **Community Sharing**:
   - Students can contribute their own accepted solutions via `Share My Solution`.
   - Saved into local community storage `angaar_peer_solutions_${slug}` with contributor name, rank, and timestamp.
3. **1-Click Insertion**:
   - Users can preview peer code and insert it directly into the active editor or copy it with a single click.
