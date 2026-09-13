function triggerInTab(tabName) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (tab) => {
          const btn = document.getElementById('angaar-ext-float-btn');
          if (btn) {
            btn.click();
            if (tab) {
              const targetTabBtn = document.querySelector(`[data-tab="${tab}"]`);
              targetTabBtn?.click();
            }
          } else {
            alert('Please open theangaarbatch.in/courses first.');
          }
        },
        args: [tabName]
      });
    }
  });
}

document.getElementById('openModalBtn')?.addEventListener('click', () => triggerInTab('tab-leaderboard'));
document.getElementById('openAnalyticsBtn')?.addEventListener('click', () => triggerInTab('tab-analytics'));
document.getElementById('openGhBtn')?.addEventListener('click', () => triggerInTab('tab-github'));
document.getElementById('openCheatBtn')?.addEventListener('click', () => triggerInTab('tab-solutions'));
document.getElementById('openChecklistBtn')?.addEventListener('click', () => triggerInTab('tab-backup'));
