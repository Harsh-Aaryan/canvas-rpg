// Background script for Canvas RPG extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Canvas RPG Extension installed');
    
    // Initialize default game state
    const defaultGameState = {
      xp: 0,
      maxXp: 100,
      level: 1,
      bossHealth: 100,
      maxBossHealth: 100,
      tasks: [],
      completedTasks: []
    };
    
    // Save initial game state
    chrome.storage.sync.set({ gameState: defaultGameState });
  });
  
  // Listen for messages from content script or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchCanvasTasks') {
      // This could be used if you want to periodically fetch tasks in the background
      // For now, we're handling this directly in the popup
      sendResponse({ success: true });
    }
    
    // Return true to indicate that we will send a response asynchronously
    return true;
  });