/**
 * Content Script for The Floorg Helper
 * Monitors Discord for bot clue images and opens Google Lens reverse image search.
 */

(() => {
  'use strict';

  // ─── CONFIG ─────────────────────────────────────────────────
  const BOT_USER_ID = '1520542480372596736';
  const BOT_AVATAR_PATTERN = `/avatars/${BOT_USER_ID}/`;
  const DUEL_INDICATOR = 'DUEL IN PROGRESS';

  const processedMessages = new Set();
  let isEnabled = false;
  let searchPhrase = '';

  // ─── LOGGING ────────────────────────────────────────────────
  function log(text, level = 'info') {
    const styles = {
      info: 'color: #7289da; font-weight: bold',
      success: 'color: #43b581; font-weight: bold',
      warn: 'color: #faa61a; font-weight: bold',
      error: 'color: #f04747; font-weight: bold'
    };
    console.log(`%c[Floorg] ${text}`, styles[level] || styles.info);

    chrome.runtime.sendMessage({ type: 'LOG', text, level }).catch(() => {});
  }

  // ─── SETTINGS ───────────────────────────────────────────────
  function loadSettings() {
    chrome.storage.local.get(['enabled', 'searchPhrase'], (data) => {
      isEnabled = data.enabled ?? false;
      searchPhrase = data.searchPhrase || '';
      log(`Settings loaded: enabled=${isEnabled}, phrase="${searchPhrase || '(none)'}"`);
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
      log(`Auto-search ${isEnabled ? 'ENABLED' : 'DISABLED'}`, isEnabled ? 'success' : 'warn');
    }
    if (changes.searchPhrase) {
      searchPhrase = changes.searchPhrase.newValue || '';
      log(`Search phrase updated: "${searchPhrase || '(none)'}"`);
    }
  });

  // ─── DOM DETECTION ──────────────────────────────────────────

  function getMessageId(li) {
    return li?.id || null;
  }

  function isBotMessage(messageEl) {
    // Check for avatar with the bot's user ID
    const avatar = messageEl.querySelector(`img[src*="${BOT_AVATAR_PATTERN}"]`);
    if (avatar) return true;

    // Fallback: check username + bot tag
    const article = messageEl.querySelector('[role="article"]') || messageEl.closest('[role="article"]');
    if (!article) return false;

    const username = article.querySelector('[class*="username_"]');
    if (username && username.textContent.trim() === 'The Floor') {
      const botTag = article.querySelector('[class*="botTag"]');
      if (botTag) return true;
    }

    return false;
  }

  function isClueEmbed(messageEl) {
    // Check for "DUEL IN PROGRESS" in embed title
    const embedTitle = messageEl.querySelector('[class*="embedTitle"]');
    if (embedTitle && embedTitle.textContent.includes(DUEL_INDICATOR)) return true;

    // Check for embed with image + CATEGORY footer
    const embedImage = messageEl.querySelector('[class*="imageContent"] img[src*="discordapp"]');
    const embedFooter = messageEl.querySelector('[class*="embedFooter"]');
    if (embedImage && embedFooter && embedFooter.textContent.includes('CATEGORY')) return true;

    return false;
  }

  function extractImageUrl(messageEl) {
    // Try <a data-role="img"> href first (original quality)
    const imgLink = messageEl.querySelector('a[data-role="img"]');
    if (imgLink?.href) return imgLink.href;

    // Fallback: embed image src
    const embedImg = messageEl.querySelector('[class*="imageContent"] img[src*="discordapp"]');
    if (embedImg?.src) return embedImg.src;

    // Fallback: any non-avatar, non-emoji image in embed
    const allImgs = messageEl.querySelectorAll('[class*="embed"] img');
    for (const img of allImgs) {
      const src = img.src || '';
      if (src.includes('discordapp') && !src.includes('avatar') && !src.includes('emoji') && !src.includes('data:image')) {
        return src;
      }
    }

    return null;
  }

  function extractCategory(messageEl) {
    const footer = messageEl.querySelector('[class*="embedFooterText"]');
    if (footer) {
      const match = footer.textContent.trim().match(/CATEGORY:\s*(.+)/i);
      if (match) return match[1].trim();
    }
    return null;
  }

  // ─── MESSAGE PROCESSING ─────────────────────────────────────

  function processMessage(messageEl) {
    if (!isEnabled) return;

    const messageId = getMessageId(messageEl);
    if (!messageId || processedMessages.has(messageId)) return;

    if (!isBotMessage(messageEl)) return;

    if (!isClueEmbed(messageEl)) {
      log('Bot message detected but not a clue embed, skipping.');
      return;
    }

    processedMessages.add(messageId);

    const imageUrl = extractImageUrl(messageEl);
    if (!imageUrl) {
      log('Bot clue detected but no image found!', 'warn');
      processedMessages.delete(messageId);
      return;
    }

    const category = extractCategory(messageEl);
    log(`🎯 Clue detected! Category: ${category || 'unknown'}`, 'success');

    // Build search URL
    let searchUrl;
    if (searchPhrase) {
      // Google Search with image + custom phrase for AI Overview
      searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}&hl=en&q=${encodeURIComponent(searchPhrase)}`;
      log(`🔍 Opening Lens with phrase: "${searchPhrase}"`, 'success');
    } else {
      // Plain Google Lens reverse image search
      searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}&hl=en`;
      log('🔍 Opening Google Lens...', 'success');
    }

    window.open(searchUrl, '_blank');
  }

  // ─── MUTATION OBSERVER ──────────────────────────────────────

  function checkNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.matches?.('li[id^="chat-messages-"]')) {
      processMessage(node);
      return;
    }

    const items = node.querySelectorAll?.('li[id^="chat-messages-"]');
    if (items) items.forEach(item => processMessage(item));
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          checkNode(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    log('👁️ Watching for bot messages...', 'success');
    return observer;
  }

  // ─── INIT ───────────────────────────────────────────────────

  function init() {
    log('🎮 The Floorg Helper loaded!', 'success');
    loadSettings();
    setTimeout(() => startObserver(), 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
