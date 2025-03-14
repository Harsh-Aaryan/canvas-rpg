// state for games 
let gameState = {
  xp: 0,
  maxXp: 80,
  level: 1,
  bossHealth: 100,
  maxBossHealth: 100,
  tasks: [],
  completedTasks: [],
  lastNotificationTime: 0 // Track when the last notification was shown
};

// DOM Elements - will be initialized after DOM is loaded
let xpBar;
let xpText;
let bossHealthBar;
let bossHealthText;
let questList;
let canvasTokenInput;
let canvasDomainInput;
let saveSettingsBtn;
let mainTab;
let settingsTab;
let mainContent;
let settingsContent;
let attackButton;
let knightIdleAnimationTimer; // Timer for random knight animations
let isKnightAnimating = false; // Flag to track if knight is currently in an animation

// Initialize the extension
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize DOM elements
  xpBar = document.getElementById('xp-bar');
  xpText = document.getElementById('xp-text');
  bossHealthBar = document.getElementById('boss-health-bar');
  bossHealthText = document.getElementById('boss-health-text');
  questList = document.getElementById('quest-list');
  canvasTokenInput = document.getElementById('canvas-token');
  canvasDomainInput = document.getElementById('canvas-domain');
  saveSettingsBtn = document.getElementById('save-settings');
  mainTab = document.getElementById('main-tab');
  settingsTab = document.getElementById('settings-tab');
  mainContent = document.getElementById('main-content');
  settingsContent = document.getElementById('settings-content');
  attackButton = document.getElementById('attack-button');
  
  console.log('Attack button element:', attackButton); // Debug log
  
  // Initialize knight
  const knightImage = document.getElementById('knight-image');
  if (knightImage) {
    knightImage.classList.add('knight-idle');
    // Start the random knight animation cycle
    startRandomKnightAnimations();
  }
  
  // Load saved settings and game state
  await loadSettings();
  await loadGameState();
  
  // Initialize UI
  updateProgressBars();
  
  // Load tasks from Canvas if we have a token
  if (canvasTokenInput.value) {
    fetchCanvasTasks();
  }
  
  // Get DOM elements
  const settingsButton = document.getElementById('settings-button');
  const backButton = document.getElementById('back-button');
  const saveSettingsButton = document.getElementById('save-settings');
  
  // Setup event listeners
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Tab switching
  mainTab?.addEventListener('click', () => switchTab('main'));
  settingsTab?.addEventListener('click', () => switchTab('settings'));
  
  // Attack button - make sure to use the attackButton variable we initialized above
  if (attackButton) {
    attackButton.addEventListener('click', function(e) {
      console.log('Attack button clicked!', e);
      attackBoss();
    });
    console.log('Attack button event listener added');
  } else {
    console.error('Attack button element not found!');
  }
  
  // Settings button opens settings tab
  settingsButton.addEventListener('click', () => switchTab('settings'));
  
  // Back button returns to main game
  backButton.addEventListener('click', () => switchTab('main'));
  
  // Settings button click handler
  settingsButton.addEventListener('click', () => {
    mainContent.classList.remove('active');
    settingsContent.classList.add('active');
  });

  // Back button click handler
  backButton.addEventListener('click', () => {
    settingsContent.classList.remove('active');
    mainContent.classList.add('active');
  });

  // Save settings button click handler
  saveSettingsButton.addEventListener('click', async () => {
    const token = document.getElementById('canvas-token').value;
    const domain = document.getElementById('canvas-domain').value;

    if (!token || !domain) {
      showNotification('Please enter both Canvas API token and domain.', 'warning', 2500);
      return;
    }

    try {
      await chrome.storage.sync.set({
        canvasToken: token,
        canvasDomain: domain
      });
      showNotification('Settings saved successfully!', 'success', 2000);
      
      // Switch back to main content
      settingsContent.classList.remove('active');
      mainContent.classList.add('active');
      
      // Refresh quests with new settings
      fetchCanvasTasks();
    } catch (error) {
      showNotification('Error saving settings: ' + error.message, 'warning', 3000);
    }
  });
  
  // Start with main tab active
  switchTab('main');
  
  // Initialize with main content visible
  mainContent.classList.add('active');
  settingsContent.classList.remove('active');
});

// Save settings to chrome storage
async function saveSettings() {
  const token = canvasTokenInput.value;
  const domain = canvasDomainInput.value;
  
  if (!token || !domain) {
    showNotification('Please enter both Canvas API token and domain.', 'warning', 2500);
    return;
  }
  
  await chrome.storage.sync.set({ 
    canvasToken: token,
    canvasDomain: domain
  });
  
  showNotification('Settings saved successfully!', 'success', 2000);
  fetchCanvasTasks();
}

// Load settings from chrome storage
async function loadSettings() {
  const data = await chrome.storage.sync.get(['canvasToken', 'canvasDomain']);
  if (data.canvasToken) canvasTokenInput.value = data.canvasToken;
  if (data.canvasDomain) canvasDomainInput.value = data.canvasDomain;
}

// Load game state from chrome storage
async function loadGameState() {
  const data = await chrome.storage.sync.get('gameState');
  if (data.gameState) {
    gameState = {...gameState, ...data.gameState};
  }
}

// Save game state to chrome storage
async function saveGameState() {
  await chrome.storage.sync.set({ gameState });
}

// Update XP and boss health bars
function updateProgressBars() {
  console.log('Updating progress bars');
  console.log(`XP: ${gameState.xp}/${gameState.maxXp}`);
  console.log(`Boss Health: ${gameState.bossHealth}/${gameState.maxBossHealth}`);
  
  // Update XP bar (light bar)
  const xpPercentage = (gameState.xp / gameState.maxXp) * 100;
  xpBar.style.width = `${xpPercentage}%`;
  xpText.textContent = `${gameState.xp}/${gameState.maxXp}`;
  
  // Update boss health (light bar)
  const healthPercentage = (gameState.bossHealth / gameState.maxBossHealth) * 100;
  bossHealthBar.style.width = `${healthPercentage}%`;
  bossHealthText.textContent = `${gameState.bossHealth}/${gameState.maxBossHealth}`;
}

// Fetch tasks from Canvas API
async function fetchCanvasTasks() {
  try {
    questList.innerHTML = '<div class="loading">Loading quests from Canvas...</div>';
    
    const token = canvasTokenInput.value;
    const domain = canvasDomainInput.value;
    
    if (!token || !domain) {
      questList.innerHTML = '<div class="loading">Please set your Canvas API token and domain in settings.</div>';
      return;
    }
    
    // Fetch todo items
    const todoResponse = await fetch(`https://${domain}/api/v1/users/self/todo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!todoResponse.ok) {
      throw new Error('Failed to fetch Canvas todo items');
    }
    
    const todoItems = await todoResponse.json();
    
    // Fetch upcoming calendar events
    const calendarResponse = await fetch(`https://${domain}/api/v1/users/self/calendar_events?start_date=2023-01-01&end_date=2030-01-01`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!calendarResponse.ok) {
      throw new Error('Failed to fetch Canvas calendar events');
    }
    
    const calendarEvents = await calendarResponse.json();
    
    // Combine todo items and calendar events
    gameState.tasks = [
      ...todoItems.map(item => ({
        id: `todo-${item.id}`,
        title: item.assignment?.name || 'Task',
        dueDate: item.assignment?.due_at || null,
        completed: false,
        type: 'todo'
      })),
      ...calendarEvents.map(event => ({
        id: `event-${event.id}`,
        title: event.title,
        dueDate: event.start_at,
        completed: false,
        type: 'event'
      }))
    ];
    
    // Filter out any tasks already completed
    gameState.tasks = gameState.tasks.filter(task => 
      !gameState.completedTasks.includes(task.id)
    );
    
    // Save the updated game state
    await saveGameState();
    
    // Render the tasks
    renderTasks();
  } catch (error) {
    console.error('Error fetching Canvas tasks:', error);
    questList.innerHTML = `<div class="loading">Error loading tasks: ${error.message}</div>`;
  }
}

// Render tasks as quests
function renderTasks() {
  if (gameState.tasks.length === 0) {
    questList.innerHTML = '<div class="loading">No active quests available. Complete all your Canvas tasks!</div>';
    return;
  }
  
  questList.innerHTML = '';
  
  gameState.tasks.forEach(task => {
    const questItem = document.createElement('div');
    questItem.className = `quest-item ${task.completed ? 'completed' : ''}`;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
    
    const questText = document.createElement('div');
    questText.className = 'quest-text';
    
    // Truncate long titles to make display more compact
    let displayTitle = task.title;
    if (displayTitle.length > 25) {
      displayTitle = displayTitle.substring(0, 22) + '...';
    }
    questText.textContent = displayTitle;
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const dateText = document.createElement('div');
      dateText.className = 'quest-due-date';
      
      // Format date more compactly
      const month = dueDate.getMonth() + 1;
      const day = dueDate.getDate();
      dateText.textContent = `Due: ${month}/${day}`;
      
      questText.appendChild(dateText);
    }
    
    questItem.appendChild(checkbox);
    questItem.appendChild(questText);
    questList.appendChild(questItem);
  });
}

// Toggle task completion
async function toggleTaskCompletion(taskId) {
  // Find the task
  const taskIndex = gameState.tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    const task = gameState.tasks[taskIndex];
    
    // Toggle completion status
    task.completed = !task.completed;
    
    if (task.completed) {
      // Task was completed, add XP only
      const xpGained = 15;
      gameState.xp += xpGained;
      
      // Check if player leveled up
      if (gameState.xp >= gameState.maxXp) {
        // Level up and keep excess XP
        const excessXp = gameState.xp - gameState.maxXp;
        gameState.level++;
        // Only increase max XP by 25% instead of 50% to make leveling easier
        gameState.maxXp = Math.floor(gameState.maxXp * 1.25);
        // Keep the excess XP for the next level
        gameState.xp = excessXp;
        showNotification(`Level up! You are now level ${gameState.level}!`, 'success', 3000);
      } else {
        // Only show XP gain notification occasionally
        const currentTime = Date.now();
        const timeSinceLastNotification = currentTime - gameState.lastNotificationTime;
        
        if (timeSinceLastNotification > 8000) {
          showNotification(`Gained ${xpGained} XP!`, 'xp', 1200);
        }
      }
      
      // Add to completed tasks and remove from active tasks
      gameState.completedTasks.push(taskId);
      gameState.tasks.splice(taskIndex, 1);
    } else {
      // Task was uncompleted, remove XP only
      gameState.xp = Math.max(0, gameState.xp - 10);
      
      // Remove from completed tasks
      const completedIndex = gameState.completedTasks.indexOf(taskId);
      if (completedIndex !== -1) {
        gameState.completedTasks.splice(completedIndex, 1);
      }
    }
    
    // Update UI and save game state
    updateProgressBars();
    renderTasks();
    await saveGameState();
  }
}


// Switch between tabs
function switchTab(tabName) {
  const mainContent = document.getElementById('main-content');
  const settingsContent = document.getElementById('settings-content');
  
  if (tabName === 'main') {
    mainContent.classList.add('active');
    settingsContent.classList.remove('active');
  } else if (tabName === 'settings') {
    mainContent.classList.remove('active');
    settingsContent.classList.add('active');
  }
}

// Show a notification
function showNotification(message, type = 'damage', duration = 1500) {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // Trigger reflow to ensure transition works
  notification.offsetHeight;
  
  // Show the notification
  notification.classList.add('show');
  
  // Remove the notification after the specified duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      container.removeChild(notification);
    }, 300); // Wait for the fade out transition
  }, duration);
  
  // Update the last notification time
  gameState.lastNotificationTime = Date.now();
}

// Function to start random knight animations
function startRandomKnightAnimations() {
  // Clear any existing timer
  if (knightIdleAnimationTimer) {
    clearTimeout(knightIdleAnimationTimer);
  }
  
  // Set a new random timer (1-10 seconds)
  const randomDelay = Math.floor(Math.random() * 9000) + 1000; // 1000-10000ms
  
  knightIdleAnimationTimer = setTimeout(() => {
    // Only play the animation if the knight is not already animating
    if (!isKnightAnimating) {
      playKnightAltAnimation();
    }
    
    // Restart the cycle
    startRandomKnightAnimations();
  }, randomDelay);
}

// Function to play the knight-alt animation
function playKnightAltAnimation() {
  const knightImage = document.getElementById('knight-image');
  if (!knightImage) return;
  
  // Set the animating flag
  isKnightAnimating = true;
  
  // Remove idle class and add alt animation class
  knightImage.classList.remove('knight-idle');
  knightImage.classList.add('knight-alt');
  
  // After animation completes, return to idle state
  setTimeout(() => {
    knightImage.classList.remove('knight-alt');
    knightImage.classList.add('knight-idle');
    isKnightAnimating = false;
  }, 1500); // Match the animation duration in CSS
}

// Attack boss function
async function attackBoss() {
  console.log('Attack boss function called');
  
  // Clear any pending idle animations when attacking
  if (knightIdleAnimationTimer) {
    clearTimeout(knightIdleAnimationTimer);
  }
  
  // Set the animating flag
  isKnightAnimating = true;
  
  if (gameState.xp < 5) { // Reduced from 10 to 5 to allow more attacks
    // Always show warning when out of XP
    showNotification('Not enough XP to attack!', 'warning', 2000);
    
    // Reset animation flag and restart random animations
    isKnightAnimating = false;
    startRandomKnightAnimations();
    return;
  }
  
  // Calculate damage based on level (5-15 base damage + level bonus)
  const baseDamage = Math.floor(Math.random() * 11) + 5;
  const levelBonus = Math.floor(gameState.level * 0.5); // Small bonus per level
  const damage = baseDamage + levelBonus;
  
  // Calculate random XP cost between 3-8 (reduced from 5-10)
  const xpCost = Math.floor(Math.random() * 6) + 3;
  
  console.log(`Dealing ${damage} damage to boss, costing ${xpCost} XP`);
  
  // Update game state
  gameState.bossHealth = Math.max(0, gameState.bossHealth - damage);
  gameState.xp = Math.max(0, gameState.xp - xpCost);
  
  // Animate knight attack
  const knightImage = document.getElementById('knight-image');
  knightImage.classList.remove('knight-idle');
  knightImage.classList.remove('knight-alt'); // Also remove alt animation if it's active
  knightImage.classList.add('knight-attack');
  
  // Add visual effect to boss
  const bossImage = document.getElementById('boss-image');
  bossImage.classList.add('damaged');
  
  // Add visual effect to boss health bar
  const bossHealthBar = document.getElementById('boss-health-bar');
  bossHealthBar.classList.add('health-damage');
  
  // Remove the effects after a short delay
  setTimeout(() => {
    bossImage.classList.remove('damaged');
    bossHealthBar.classList.remove('health-damage');
    knightImage.classList.remove('knight-attack');
    knightImage.classList.add('knight-idle');
    
    // Reset animation flag and restart random animations
    isKnightAnimating = false;
    startRandomKnightAnimations();
  }, 800);
  
  // Check if boss was defeated
  if (gameState.bossHealth <= 0) {
    gameState.bossHealth = 0;
    showNotification('Boss defeated! A new boss will appear soon!', 'success', 3000);
    
    // Award bonus XP for defeating the boss
    const bossDefeatXP = 20 + (gameState.level * 5);
    gameState.xp += bossDefeatXP;
    showNotification(`Gained ${bossDefeatXP} bonus XP for defeating the boss!`, 'xp', 2000);
    
    // Check if player leveled up from boss defeat bonus
    if (gameState.xp >= gameState.maxXp) {
      const excessXp = gameState.xp - gameState.maxXp;
      gameState.level++;
      gameState.maxXp = Math.floor(gameState.maxXp * 1.25);
      gameState.xp = excessXp;
      showNotification(`Level up! You are now level ${gameState.level}!`, 'success', 3000);
    }
    
    setTimeout(() => {
      // New boss has more health based on player level
      gameState.bossHealth = gameState.maxBossHealth = Math.floor(gameState.maxBossHealth * 1.3);
      updateProgressBars();
    }, 3000);
  } else {
    // Only show damage notifications infrequently (every 5 seconds)
    const currentTime = Date.now();
    const timeSinceLastNotification = currentTime - gameState.lastNotificationTime;
    
    // Show notification only if it's been more than 5 seconds since the last one
    // or if it's a critical hit (damage > 12)
    if (timeSinceLastNotification > 5000 || damage > 12) {
      showNotification(`Dealt ${damage} damage! Used ${xpCost} XP`, 'damage', 1200);
    }
  }
  
  // Update UI
  updateProgressBars();
  
  // Save game state
  await saveGameState();
}