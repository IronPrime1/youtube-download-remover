
// Wait for the YouTube page to fully load
document.addEventListener('DOMContentLoaded', initExtension);
window.addEventListener('load', initExtension);
// Also handle YouTube's navigation which doesn't always trigger page loads
document.addEventListener('yt-navigate-finish', initExtension);

let checkInterval;
const RAPID_API_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; // Hard-coded API key

function initExtension() {
  console.log('YouTube Direct Download: Initializing extension...');
  
  // Clear any previous interval
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Check periodically for the download button to appear
  checkInterval = setInterval(checkAndReplaceButton, 1000);
  
  // Also try immediately
  checkAndReplaceButton();
}

function checkAndReplaceButton() {
  // Look for YouTube's download button in both old and new UI versions
  const downloadButtons = [
    ...document.querySelectorAll('ytd-button-renderer:has(button[aria-label*="Download"])'),
    ...document.querySelectorAll('button[aria-label*="Download"]'),
    ...document.querySelectorAll('ytd-menu-service-item-renderer:has(yt-formatted-string:contains("Download"))'),
    ...document.querySelectorAll('.yt-spec-button-shape-next:has(span:contains("Download"))'),
    ...document.querySelectorAll('button:has(span:contains("Download"))'),
    ...document.querySelectorAll('button:has(div:contains("Download"))')
  ];
  
  if (downloadButtons.length > 0) {
    console.log('YouTube Direct Download: Found download buttons', downloadButtons);
    downloadButtons.forEach(button => {
      // Completely remove the original button
      button.style.display = 'none';
      
      // Check if we already placed our button next to this one
      const parentElement = button.parentNode;
      if (!parentElement.querySelector('.yt-direct-download-btn')) {
        replaceDownloadButton(button);
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
  const videoId = extractVideoId(window.location.href);
  
  if (!videoId) {
    showToast('Could not identify video. Please try again.');
    return;
  }
  
  // Show loading state
  button.disabled = true;
  button.innerHTML = 'Getting download link...';
  button.style.backgroundColor = '#888888';
  
  fetchVideoDownloadLink(videoId)
    .then(downloadLink => {
      if (downloadLink) {
        // Create a temporary link to trigger download
        const downloadLinkElement = document.createElement('a');
        downloadLinkElement.href = downloadLink;
        downloadLinkElement.download = `youtube-video-${videoId}.mp4`;
        document.body.appendChild(downloadLinkElement);
        downloadLinkElement.click();
        document.body.removeChild(downloadLinkElement);
        
        showToast('Download started!');
      } else {
        showToast('Download failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('YouTube Direct Download:', error);
      showToast('Error fetching download link. Please try again.');
    })
    .finally(() => {
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
    });
}

async function fetchVideoDownloadLink(videoId) {
  try {
    // Using the RapidAPI YouTube v3 API with hardcoded key
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'youtube-v311.p.rapidapi.com'
      }
    };
    
    // First get video info
    const response = await fetch(`https://youtube-v311.p.rapidapi.com/video/?id=${videoId}`, options);
    const data = await response.json();
    
    console.log('API response:', data);
    
    // Parse the formats to find the highest quality
    if (data && data.streamingData && data.streamingData.formats) {
      const formats = data.streamingData.formats;
      
      // Sort by quality (height) in descending order
      const sortedFormats = formats.sort((a, b) => b.height - a.height);
      
      // Return the URL of the highest quality format
      if (sortedFormats.length > 0) {
        return sortedFormats[0].url;
      }
    }
    
    throw new Error('No downloadable formats found');
  } catch (error) {
    console.error('Error fetching video download link:', error);
    throw error;
  }
}

function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  } catch (e) {
    console.error('Error extracting video ID:', e);
    return null;
  }
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
