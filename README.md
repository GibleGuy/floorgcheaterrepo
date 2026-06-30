# The Floorg Helper

A Chrome extension that automatically detects clue images from **The Floor** Discord bot and opens a Google Lens reverse image search so you can quickly identify the answer.

## How It Works

1. Monitors Discord for new messages from The Floor bot
2. Detects embedded clue images (looks for "DUEL IN PROGRESS" embeds)
3. Automatically opens a **Google Lens** tab with the image pre-loaded
4. You find the answer from the search results and type it in Discord

## Features

- **Auto-detection** — MutationObserver watches for new bot messages in real-time
- **Google Lens integration** — Opens reverse image search instantly when a clue appears
- **Custom search phrase** — Add context like `"who is this person's parents"` to guide the AI Overview for category-specific questions
- **Activity log** — See what the extension is detecting in real-time

## Installation

1. Clone this repo or download the ZIP
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select this folder
5. Open Discord in Chrome and navigate to the game channel

## Usage

1. Click the extension icon in Chrome toolbar
2. Toggle **Enable Auto-Search** on
3. *(Optional)* Enter a **custom search phrase** to guide results for the current category
4. Start a game — when the bot sends a clue image, a Google Lens tab will pop open automatically

### Custom Search Phrase Examples

| Category | Suggested Phrase |
|----------|-----------------|
| Famous Logos | *(leave blank — Lens handles these great)* |
| Famous Parents | `who is this person's parents` |
| Movie Characters | `what movie is this character from` |
| Famous Landmarks | `where is this landmark located` |

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Chrome extension manifest |
| `content.js` | Injected into Discord — detects bot messages and opens Lens |
| `background.js` | Service worker for log storage |
| `popup.html` | Extension popup UI |
| `popup.css` | Dark Discord-themed styles |
| `popup.js` | Popup logic (settings + logs) |
