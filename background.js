/**
 * Background Service Worker for The Floorg Helper
 * Handles log storage from the content script.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG') {
    chrome.storage.local.get(['logs'], (data) => {
      const logs = data.logs || [];
      logs.push({
        timestamp: Date.now(),
        text: message.text,
        level: message.level || 'info'
      });
      // Keep only last 50 logs
      if (logs.length > 50) logs.splice(0, logs.length - 50);
      chrome.storage.local.set({ logs });
    });
    return false;
  }
});
