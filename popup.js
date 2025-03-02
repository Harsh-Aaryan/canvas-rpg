// state for games 
let gameState = {
  xp: 0,
  maxXp: 100,
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
  
  // Initialize knight
  const knightImage = document.getElementById('knight-image');
  if (knightImage) {
    knightImage.classList.add('knight-idle');
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
  attackButton.addEventListener('click', attackBoss);
  console.log('Attack button event listener added');
  
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
    questText.textContent = task.title;
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const dateText = document.createElement('div');
      dateText.className = 'quest-due-date';
      dateText.textContent = `Due: ${dueDate.toLocaleDateString()}`;
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
      const xpGained = 10;
      gameState.xp += xpGained;
      
      // Check if player leveled up
      if (gameState.xp >= gameState.maxXp) {
        gameState.level++;
        gameState.xp = gameState.xp - gameState.maxXp;
        gameState.maxXp = Math.floor(gameState.maxXp * 1.5);
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

// Attack boss function
async function attackBoss() {
  console.log('Attack boss function called');
  
  if (gameState.xp < 10) {
    // Always show warning when out of XP
    showNotification('Not enough XP to attack!', 'warning', 2000);
    return;
  }
  
  // Calculate random damage between 5-15
  const damage = Math.floor(Math.random() * 11) + 5;
  // Calculate random XP cost between 5-10
  const xpCost = Math.floor(Math.random() * 6) + 5;
  
  console.log(`Dealing ${damage} damage to boss, costing ${xpCost} XP`);
  
  // Update game state
  gameState.bossHealth = Math.max(0, gameState.bossHealth - damage);
  gameState.xp = Math.max(0, gameState.xp - xpCost);
  
  // Animate knight attack
  const knightImage = document.getElementById('knight-image');
  knightImage.classList.remove('knight-idle');
  knightImage.classList.add('knight-attack');
  
  // Add visual effect to boss
  const bossImage = document.getElementById('boss-image');
  bossImage.classList.add('damaged');
  
  // Remove the effects after a short delay
  setTimeout(() => {
    bossImage.classList.remove('damaged');
    knightImage.classList.remove('knight-attack');
    knightImage.classList.add('knight-idle');
  }, 800);
  
  // Check if boss was defeated
  if (gameState.bossHealth <= 0) {
    gameState.bossHealth = 0;
    showNotification('Boss defeated! A new boss will appear soon!', 'success', 3000);
    setTimeout(() => {
      gameState.bossHealth = gameState.maxBossHealth = Math.floor(gameState.maxBossHealth * 1.5);
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