
// Wait for the YouTube page to fully load
document.addEventListener('DOMContentLoaded', initExtension);
window.addEventListener('load', initExtension);
// Also handle YouTube's navigation which doesn't always trigger page loads
document.addEventListener('yt-navigate-finish', initExtension);

// Declare variables only once at the top level
let checkInterval = null;
let buttonObserver = null;
const RAPID_API_KEY = '98826f73e7msh709657146921ebap1a6058jsn91e7d2b70360'; // Using the provided API key

function initExtension() {
  console.log('YouTube Direct Download: Initializing extension...');
  
  // Clear any previous interval
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Disconnect previous observer if exists
  if (buttonObserver) {
    buttonObserver.disconnect();
  }
  
  // Check once immediately
  checkAndReplaceButton();
  
  // Set up a mutation observer to watch for YouTube UI changes
  buttonObserver = new MutationObserver(function(mutations) {
    checkAndReplaceButton();
  });
  
  // Observe the entire document for changes, but be specific about what we watch
  buttonObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also set a backup interval but with longer delay (5 seconds)
  checkInterval = setInterval(checkAndReplaceButton, 5000);
}

function checkAndReplaceButton() {
  // Look for YouTube's download button in both old and new UI versions
  const downloadButtons = [
    ...document.querySelectorAll('ytd-button-renderer[aria-label*="Download"]'),
    ...document.querySelectorAll('button[aria-label*="Download"]'),
    ...document.querySelectorAll('ytd-menu-service-item-renderer'),
    ...document.querySelectorAll('.yt-spec-button-shape-next'),
    ...document.querySelectorAll('button span')
  ];
  
  // Filter the results to only include download-related elements
  const actualDownloadButtons = downloadButtons.filter(button => {
    const text = button.textContent || button.innerText;
    return text && text.toLowerCase().includes('download');
  });
  
  if (actualDownloadButtons.length > 0) {
    console.log('YouTube Direct Download: Found download buttons', actualDownloadButtons);
    actualDownloadButtons.forEach(button => {
      // Find the closest button or clickable parent element
      let targetButton = button;
      // Try to get the parent button if this is just text
      while (targetButton && targetButton.tagName !== 'BUTTON' && targetButton.tagName !== 'A' && targetButton.tagName !== 'YTD-BUTTON-RENDERER') {
        targetButton = targetButton.parentElement;
        // Avoid going too far up the DOM
        if (!targetButton || targetButton === document.body) break;
      }
      
      if (!targetButton) targetButton = button;
      
      // Completely hide the original button
      targetButton.style.display = 'none';
      
      // Check if we already placed our button next to this one
      const parentElement = targetButton.parentNode;
      if (parentElement && !parentElement.querySelector('.yt-direct-download-btn')) {
        replaceDownloadButton(targetButton);
      }
    });
  } else {
    // Try finding buttons in the more options menu
    const moreOptionsButtons = document.querySelectorAll('button[aria-label="More actions"], button.yt-spec-button-shape-next--tonal');
    moreOptionsButtons.forEach(button => {
      // Add our download button next to the more options button
      if (button && !button.nextSibling?.classList?.contains('yt-direct-download-btn')) {
        const customButton = createCustomButton();
        button.parentNode.insertBefore(customButton, button.nextSibling);
      }
    });
  }
}

function createCustomButton() {
  // Create our custom button
  const customButton = document.createElement('button');
  customButton.className = 'yt-direct-download-btn';
  customButton.innerHTML = 'Download Video';
  customButton.style.backgroundColor = '#FF0000';
  customButton.style.color = 'white';
  customButton.style.border = 'none';
  customButton.style.borderRadius = '2px';
  customButton.style.padding = '10px 16px';
  customButton.style.margin = '8px';
  customButton.style.fontSize = '14px';
  customButton.style.fontWeight = '500';
  customButton.style.cursor = 'pointer';
  customButton.style.display = 'flex';
  customButton.style.alignItems = 'center';
  customButton.style.zIndex = '9999'; // Ensure our button is on top
  
  // Add download icon
  const downloadIcon = document.createElement('span');
  downloadIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style="margin-right: 8px;" viewBox="0 0 16 16">
      <path d="M8 2a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 8.293V2.5A.5.5 0 0 1 8 2z"/>
      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
    </svg>
  `;
  customButton.prepend(downloadIcon);
  
  // Add hover effect
  customButton.addEventListener('mouseover', () => {
    customButton.style.backgroundColor = '#CC0000';
  });
  
  customButton.addEventListener('mouseout', () => {
    customButton.style.backgroundColor = '#FF0000';
  });
  
  // Add click event to handle the download
  customButton.addEventListener('click', handleDownloadClick);
  
  return customButton;
}

function replaceDownloadButton(originalButton) {
  // Completely remove the original button
  originalButton.style.display = 'none';
  
  // Create and add our custom button
  const customButton = createCustomButton();
  
  // Insert our button after the original
  originalButton.parentNode.insertBefore(customButton, originalButton.nextSibling);
  
  console.log('YouTube Direct Download: Button replaced successfully');
}

function handleDownloadClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const button = e.currentTarget;
  const currentUrl = window.location.href;
  
  if (!currentUrl.includes('youtube.com/watch')) {
    showToast('This is not a valid YouTube video page.');
    return;
  }
  
  // Show loading state
  button.disabled = true;
  button.innerHTML = 'Getting download link...';
  button.style.backgroundColor = '#888888';
  
  // Use the provided XHR code with the current video URL
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  
  xhr.addEventListener('readystatechange', function() {
    if (this.readyState === this.DONE) {
      try {
        const response = JSON.parse(this.responseText);
        console.log('API Response:', response);
        
        if (response && response.error) {
          showToast('Error: ' + response.error);
        } else if (response && response.url) {
          // Create a temporary link to trigger download
          const downloadLinkElement = document.createElement('a');
          downloadLinkElement.href = response.url;
          downloadLinkElement.download = 'youtube-video.mp4';
          document.body.appendChild(downloadLinkElement);
          downloadLinkElement.click();
          document.body.removeChild(downloadLinkElement);
          
          showToast('Download started!');
        } else {
          showToast('Could not get download link. Please try again.');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        showToast('Error processing download. Please try again.');
      } finally {
        // Reset button
        resetButton(button);
      }
    }
  });
  
  // Add error handling
  xhr.addEventListener('error', function() {
    showToast('Network error. Please check your internet connection.');
    resetButton(button);
  });
  
  xhr.addEventListener('timeout', function() {
    showToast('Request timed out. Please try again.');
    resetButton(button);
  });
  
  // Set a timeout
  xhr.timeout = 30000; // 30 seconds
  
  // Get the video URL
  const apiUrl = `https://youtube-video-downloader-4k-and-8k-mp3.p.rapidapi.com/download.php?button=1&start=1&end=1&format=mp4&url=${encodeURIComponent(currentUrl)}`;
  
  xhr.open('GET', apiUrl);
  xhr.setRequestHeader('x-rapidapi-key', RAPID_API_KEY);
  xhr.setRequestHeader('x-rapidapi-host', 'youtube-video-downloader-4k-and-8k-mp3.p.rapidapi.com');
  
  xhr.send(null);
}

function resetButton(button) {
  // Reset button
  button.disabled = false;
  button.innerHTML = 'Download Video';
  button.style.backgroundColor = '#FF0000';
  
  // Add download icon back
  const downloadIcon = document.createElement('span');
  downloadIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style="margin-right: 8px;" viewBox="0 0 16 16">
      <path d="M8 2a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 8.293V2.5A.5.5 0 0 1 8 2z"/>
      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
    </svg>
  `;
  button.prepend(downloadIcon);
}

function showToast(message, duration = 3000) {
  // Remove any existing toast
  const existingToast = document.querySelector('.yt-direct-download-toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
  // Create and show toast
  const toast = document.createElement('div');
  toast.className = 'yt-direct-download-toast';
  toast.textContent = message;
  
  // Style the toast
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '4px';
  toast.style.zIndex = '10000';
  toast.style.fontSize = '14px';
  
  document.body.appendChild(toast);
  
  // Remove after duration
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, duration);
}
