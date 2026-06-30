/**
 * Popup Script for The Floorg Helper
 * Manages enable toggle, search phrase, and activity log
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggle-enabled');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const searchPhrase = document.getElementById('search-phrase');
  const saveBtn = document.getElementById('save-settings');
  const copyLogBtn = document.getElementById('copy-log');
  const clearLogBtn = document.getElementById('clear-log');
  const logContainer = document.getElementById('log-container');

  // ─── Load Saved Settings ─────────────────────────────────────
  chrome.storage.local.get(['enabled', 'searchPhrase', 'logs'], (data) => {
    toggleEnabled.checked = data.enabled ?? false;
    updateStatusBanner(data.enabled ?? false);
    searchPhrase.value = data.searchPhrase || '';
    renderLogs(data.logs || []);
  });

  // ─── Enable/Disable Toggle ──────────────────────────────────
  toggleEnabled.addEventListener('change', () => {
    const enabled = toggleEnabled.checked;
    chrome.storage.local.set({ enabled });
    updateStatusBanner(enabled);
    showToast(enabled ? 'Auto-search enabled!' : 'Auto-search disabled');
  });

  function updateStatusBanner(enabled) {
    if (enabled) {
      statusBanner.className = 'status-banner status-enabled';
      statusText.textContent = 'Active — Watching for clues';
    } else {
      statusBanner.className = 'status-banner status-disabled';
      statusText.textContent = 'Disabled';
    }
  }

  // ─── Save Settings ──────────────────────────────────────────
  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({ searchPhrase: searchPhrase.value.trim() }, () => {
      showToast(searchPhrase.value.trim()
        ? `Phrase saved: "${searchPhrase.value.trim()}"`
        : 'Phrase cleared — using plain reverse image search');
    });
  });

  // ─── Activity Log ────────────────────────────────────────────
  function renderLogs(logs) {
    if (!logs || logs.length === 0) {
      logContainer.innerHTML = '<div class="log-empty">No activity yet. Enable and join a game!</div>';
      return;
    }

    logContainer.innerHTML = logs.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      return `<div class="log-entry">
        <span class="log-time">${time}</span>
        <span class="log-${entry.level || 'info'}">${escapeHtml(entry.text)}</span>
      </div>`;
    }).join('');

    logContainer.scrollTop = logContainer.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Refresh logs every second
  setInterval(() => {
    chrome.storage.local.get(['logs'], (data) => {
      renderLogs(data.logs || []);
    });
  }, 1000);

  copyLogBtn.addEventListener('click', () => {
    chrome.storage.local.get(['logs'], (data) => {
      const logs = data.logs || [];
      const text = logs.map(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        return `${time} [${entry.level || 'info'}] ${entry.text}`;
      }).join('\n');
      navigator.clipboard.writeText(text || 'No logs').then(() => {
        showToast('Log copied!');
      });
    });
  });

  clearLogBtn.addEventListener('click', () => {
    chrome.storage.local.set({ logs: [] }, () => {
      renderLogs([]);
      showToast('Log cleared');
    });
  });

  // ─── Toast Notifications ─────────────────────────────────────
  function showToast(message, isError = false) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
});
