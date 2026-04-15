// background.js — Tree of Life EMR Rx Filler service worker
// Minimal background script for extension lifecycle.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Tree of Life Rx Filler installed');
});
