
document.addEventListener('DOMContentLoaded', function() {
  const statusMessage = document.getElementById('status-message');
  
  // No need to load or save API key as it's hardcoded in content.js
  showStatus('The extension is ready to use. No API key needed.', 'success');
  
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
  }
});
