
// Chrome extension background script
// This script handles background operations for the YouTube Direct Download extension

console.log('YouTube Direct Download: Background script loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('YouTube Direct Download extension installed');
});

// Add permissions needed for Chrome storage
chrome.storage.local.get(['rapidApiKey'], function(result) {
  if (!result.rapidApiKey) {
    console.log('No RapidAPI key found. Users will need to set it in the popup.');
  }
});
