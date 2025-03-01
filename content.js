// Content script for Canvas RPG extension

// This script runs in the context of Canvas pages

// Listen for page load
window.addEventListener('load', () => {
    console.log('Canvas RPG Extension loaded on Canvas page');
    
    // Check if we're on a Canvas page
    if (window.location.hostname.includes('instructure.com')) {
      // We could add notifications or UI elements to the Canvas page here
      
      // For example, we could add a small floating RPG status indicator
      addRpgStatusIndicator();
    }
  });
  
  // Add a small RPG status indicator to the Canvas page
  function addRpgStatusIndicator() {
    // Create the indicator element
    const indicator = document.createElement('div');
    indicator.id = 'canvas-rpg-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #34495e;
      color: white;
      padding: 10px;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      z-index: 9999;
      cursor: pointer;
      border: 3px solid #f39c12;
    `;
    
    // Add text
    indicator.innerHTML = 'RPG';
    
    // Add click event to open the popup
    indicator.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    // Add to page
    document.body.appendChild(indicator);
    
    // Add hover effect
    indicator.addEventListener('mouseover', () => {
      indicator.style.transform = 'scale(1.1)';
      indicator.style.transition = 'transform 0.3s';
    });
    
    indicator.addEventListener('mouseout', () => {
      indicator.style.transform = 'scale(1)';
    });
    
    // Periodically update the indicator with game state info
    updateIndicatorWithGameState();
  }
  
  // Update the indicator with game state information
  async function updateIndicatorWithGameState() {
    try {
      // Get game state from storage
      const data = await chrome.storage.sync.get('gameState');
      
      if (data.gameState) {
        const { level } = data.gameState;
        
        // Update the indicator text
        const indicator = document.getElementById('canvas-rpg-indicator');
        if (indicator) {
          indicator.innerHTML = `LVL ${level}`;
        }
      }
      
      // Update again in 60 seconds
      setTimeout(updateIndicatorWithGameState, 60000);
    } catch (error) {
      console.error('Error updating RPG indicator:', error);
    }
  }