
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  
  // Load saved API key if exists
  chrome.storage.local.get(['rapidApiKey'], function(result) {
    if (result.rapidApiKey) {
      apiKeyInput.value = result.rapidApiKey;
      showStatus('API key is set. The extension is ready to use.', 'success');
    }
  });
  
  // Save API key when button is clicked
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter a valid API key', 'error');
      return;
    }
    
    // Save the API key
    chrome.storage.local.set({rapidApiKey: apiKey}, function() {
      showStatus('API key saved successfully!', 'success');
    });
  });
  
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    
    // Clear the message after 3 seconds
    setTimeout(function() {
      statusMessage.className = 'status';
    }, 3000);
  }
});
