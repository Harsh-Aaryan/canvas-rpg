// Background script for Canvas RPG extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Canvas RPG Extension installed');
    
    // Initialize default game state
    const defaultGameState = {
      xp: 0,
      maxXp: 80, // Reduced from 100 to make leveling easier
      level: 1,
      bossHealth: 100,
      maxBossHealth: 100,
      tasks: [],
      completedTasks: [],
      lastNotificationTime: 0 // Track when the last notification was shown
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
    
    if (request.action === 'openPopup') {
      // Handle opening the popup when the indicator is clicked
      chrome.action.openPopup();
      sendResponse({ success: true });
    }
    
    if (request.action === 'attackBoss') {
      // Handle the attack boss action
      handleAttackBoss(request.xpCost, request.damage)
        .then(result => sendResponse(result));
      return true;
    }
    
    // Return true to indicate that we will send a response asynchronously
    return true;
  });

  // Handle boss attack logic
  async function handleAttackBoss(xpCost, damage) {
    try {
      // Get current game state
      const data = await chrome.storage.sync.get('gameState');
      const gameState = data.gameState;
      
      if (!gameState) {
        return { success: false, message: 'Game state not found' };
      }
      
      // Check if player has enough XP (reduced minimum)
      if (gameState.xp < xpCost) {
        return { 
          success: false, 
          message: 'Not enough XP to attack! Complete more tasks to gain XP.' 
        };
      }
      
      // Update game state
      gameState.bossHealth = Math.max(0, gameState.bossHealth - damage);
      gameState.xp = Math.max(0, gameState.xp - xpCost);
      
      // Check if boss was defeated
      let bossDefeated = false;
      let bonusXp = 0;
      
      if (gameState.bossHealth <= 0) {
        gameState.bossHealth = 0;
        bossDefeated = true;
        
        // Award bonus XP for defeating the boss
        bonusXp = 20 + (gameState.level * 5);
        gameState.xp += bonusXp;
        
        // Check if player leveled up from boss defeat bonus
        if (gameState.xp >= gameState.maxXp) {
          const excessXp = gameState.xp - gameState.maxXp;
          gameState.level++;
          gameState.maxXp = Math.floor(gameState.maxXp * 1.25);
          gameState.xp = excessXp;
        }
        
        // Schedule a new boss after a delay
        setTimeout(async () => {
          const updatedData = await chrome.storage.sync.get('gameState');
          const currentState = updatedData.gameState;
          currentState.bossHealth = currentState.maxBossHealth = Math.floor(currentState.maxBossHealth * 1.3);
          await chrome.storage.sync.set({ gameState: currentState });
        }, 3000);
      }
      
      // Save updated game state
      await chrome.storage.sync.set({ gameState });
      
      return { 
        success: true, 
        damage, 
        xpCost, 
        bossDefeated,
        bonusXp,
        gameState
      };
    } catch (error) {
      console.error('Error handling boss attack:', error);
      return { success: false, message: error.message };
    }
  }
