
// Chrome extension background script
// This script handles background operations for the YouTube Direct Download extension

console.log('YouTube Direct Download: Background script loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('YouTube Direct Download extension installed');
  
  // Inject the content script on already open YouTube tabs
  chrome.tabs.query({url: "https://www.youtube.com/watch?v=*"}, function(tabs) {
    for (let tab of tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
      });
    }
  });
});

// Add a listener for tab updates to ensure our script runs on YouTube video pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    console.log('YouTube video page loaded, executing content script');
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => console.error('Error executing script:', err));
  }
});
