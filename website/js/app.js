// State for games 
let gameState = {
  xp: 0,
  maxXp: 80,
  level: 1,
  bossHealth: 100,
  maxBossHealth: 100,
  tasks: [],
  completedTasks: [],
  lastNotificationTime: 0, // Track when the last notification was shown
  playerName: 'Hero',
  difficulty: 'medium',
  soundEnabled: true,
  canvasToken: '',
  canvasDomain: ''
};

// DOM Elements - will be initialized after DOM is loaded
let xpBar;
let xpText;
let bossHealthBar;
let bossHealthText;
let questList;
let playerNameInput;
let difficultySelect;
let soundEnabledCheckbox;
let saveSettingsBtn;
let mainTab;
let settingsTab;
let mainContent;
let settingsContent;
let attackButton;
let canvasTokenInput;
let canvasDomainInput;
let fetchCanvasTasksBtn;
let knightIdleAnimationTimer; // Timer for random knight animations
let isKnightAnimating = false; // Flag to track if knight is currently in an animation
let isMobileView = false; // Flag to track if we're in mobile view

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize DOM elements
  xpBar = document.getElementById('xp-bar');
  xpText = document.getElementById('xp-text');
  bossHealthBar = document.getElementById('boss-health-bar');
  bossHealthText = document.getElementById('boss-health-text');
  questList = document.getElementById('quest-list');
  playerNameInput = document.getElementById('player-name');
  difficultySelect = document.getElementById('difficulty');
  soundEnabledCheckbox = document.getElementById('sound-enabled');
  saveSettingsBtn = document.getElementById('save-settings');
  mainTab = document.getElementById('main-tab');
  settingsTab = document.getElementById('settings-tab');
  mainContent = document.getElementById('main-content');
  settingsContent = document.getElementById('settings-content');
  attackButton = document.getElementById('attack-button');
  canvasTokenInput = document.getElementById('canvas-token');
  canvasDomainInput = document.getElementById('canvas-domain');
  fetchCanvasTasksBtn = document.getElementById('fetch-canvas-tasks');
  
  console.log('Attack button element:', attackButton); // Debug log
  
  // Initialize knight
  const knightImage = document.getElementById('knight-image');
  if (knightImage) {
    knightImage.classList.add('knight-idle');
    // Start the random knight animation cycle
    startRandomKnightAnimations();
  }
  
  // Load saved game state
  loadGameState();
  
  // Initialize UI
  updateProgressBars();
  
  // Get DOM elements
  const settingsButton = document.getElementById('settings-button');
  const backButton = document.getElementById('back-button');
  const saveSettingsButton = document.getElementById('save-settings');
  const addTaskBtn = document.getElementById('add-task-btn');
  
  // Setup event listeners
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Tab switching
  settingsButton.addEventListener('click', () => switchTab('settings'));
  
  // Attack button
  if (attackButton) {
    attackButton.addEventListener('click', function(e) {
      console.log('Attack button clicked!', e);
      attackBoss();
    });
    console.log('Attack button event listener added');
  } else {
    console.error('Attack button element not found!');
  }
  
  // Back button returns to main game
  backButton.addEventListener('click', () => switchTab('main'));
  
  // Add task button
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addNewTask);
  }
  
  // Fetch Canvas tasks button
  if (fetchCanvasTasksBtn) {
    fetchCanvasTasksBtn.addEventListener('click', fetchCanvasTasks);
  }
  
  // Populate settings form with current values
  populateSettingsForm();
  
  // Check if we're in mobile view
  checkMobileView();
  
  // Add resize listener to handle orientation changes
  window.addEventListener('resize', handleResize);
});

// Check if we're in mobile view
function checkMobileView() {
  isMobileView = window.innerWidth <= 900;
  
  // Adjust any elements that need special handling in mobile view
  const knightContainer = document.getElementById('knight-container');
  const bossCircle = document.getElementById('boss-image');
  
  if (knightContainer && bossCircle) {
    if (isMobileView) {
      // Mobile-specific adjustments if needed
      console.log('Mobile view detected');
    } else {
      // Desktop-specific adjustments if needed
      console.log('Desktop view detected');
    }
  }
}

// Handle resize events (including orientation changes)
function handleResize() {
  const wasMobile = isMobileView;
  checkMobileView();
  
  // If we crossed the mobile/desktop threshold, we might need to adjust some elements
  if (wasMobile !== isMobileView) {
    console.log('View mode changed:', isMobileView ? 'mobile' : 'desktop');
    
    // Reset any animations or positions that might be affected
    const knightImage = document.getElementById('knight-image');
    if (knightImage) {
      // Reset knight to idle state
      knightImage.className = '';
      knightImage.classList.add('knight-idle');
      
      // Restart random animations
      isKnightAnimating = false;
      if (knightIdleAnimationTimer) {
        clearTimeout(knightIdleAnimationTimer);
      }
      startRandomKnightAnimations();
    }
  }
}

// Load game state from localStorage
function loadGameState() {
  const savedState = localStorage.getItem('canvasRpgGameState');
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      gameState = { ...gameState, ...parsedState };
      
      // Render tasks
      renderTasks();
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }
}

// Save game state to localStorage
function saveGameState() {
  try {
    localStorage.setItem('canvasRpgGameState', JSON.stringify(gameState));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

// Update progress bars
function updateProgressBars() {
  // Update XP bar
  const xpPercentage = (gameState.xp / gameState.maxXp) * 100;
  xpBar.style.width = `${xpPercentage}%`;
  xpText.textContent = `${gameState.xp}/${gameState.maxXp}`;
  
  // Update boss health bar
  const healthPercentage = (gameState.bossHealth / gameState.maxBossHealth) * 100;
  bossHealthBar.style.width = `${healthPercentage}%`;
  bossHealthText.textContent = `${gameState.bossHealth}/${gameState.maxBossHealth}`;
}

// Render tasks as quests
function renderTasks() {
  if (gameState.tasks.length === 0) {
    questList.innerHTML = '<div class="loading">No active quests available. Add a new task below!</div>';
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

// Add a new task
function addNewTask() {
  const taskInput = document.getElementById('new-task');
  const dueDateInput = document.getElementById('task-due-date');
  
  if (taskInput.value.trim() === '') {
    showNotification('Please enter a task description', 'warning', 2000);
    return;
  }
  
  const newTask = {
    id: Date.now(), // Use timestamp as unique ID
    title: taskInput.value.trim(),
    dueDate: dueDateInput.value || null,
    completed: false
  };
  
  gameState.tasks.push(newTask);
  
  // Clear inputs
  taskInput.value = '';
  dueDateInput.value = '';
  
  // Update UI
  renderTasks();
  saveGameState();
  
  showNotification('New quest added!', 'success', 2000);
}

// Toggle task completion
function toggleTaskCompletion(taskId) {
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
    saveGameState();
  }
}

// Switch between tabs
function switchTab(tabName) {
  if (tabName === 'main') {
    mainContent.classList.add('active');
    settingsContent.classList.remove('active');
  } else if (tabName === 'settings') {
    mainContent.classList.remove('active');
    settingsContent.classList.add('active');
    
    // Update settings form with current values
    populateSettingsForm();
  }
}

// Populate settings form with current values
function populateSettingsForm() {
  playerNameInput.value = gameState.playerName;
  difficultySelect.value = gameState.difficulty;
  soundEnabledCheckbox.checked = gameState.soundEnabled;
  canvasTokenInput.value = gameState.canvasToken || '';
  canvasDomainInput.value = gameState.canvasDomain || '';
}

// Save settings
function saveSettings() {
  gameState.playerName = playerNameInput.value.trim() || 'Hero';
  gameState.difficulty = difficultySelect.value;
  gameState.soundEnabled = soundEnabledCheckbox.checked;
  gameState.canvasToken = canvasTokenInput.value.trim();
  gameState.canvasDomain = canvasDomainInput.value.trim();
  
  saveGameState();
  showNotification('Settings saved!', 'success', 2000);
  
  // Return to main game
  switchTab('main');
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
  
  // Play sound if enabled
  if (gameState.soundEnabled) {
    playSound(type);
  }
}

// Play sound effect
function playSound(type) {
  // In a real implementation, you would create and play audio elements
  // For now, we'll just log that a sound would play
  console.log(`Playing sound: ${type}`);
  
  // Example of how to implement sound:
  /*
  const sound = new Audio();
  switch(type) {
    case 'damage':
      sound.src = 'sounds/damage.mp3';
      break;
    case 'xp':
      sound.src = 'sounds/xp.mp3';
      break;
    case 'success':
      sound.src = 'sounds/success.mp3';
      break;
    case 'warning':
      sound.src = 'sounds/warning.mp3';
      break;
    default:
      sound.src = 'sounds/notification.mp3';
  }
  sound.play().catch(e => console.error('Error playing sound:', e));
  */
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
  
  // Calculate damage based on level and difficulty
  let baseDamage = Math.floor(Math.random() * 11) + 5;
  const levelBonus = Math.floor(gameState.level * 0.5); // Small bonus per level
  
  // Adjust damage based on difficulty
  switch(gameState.difficulty) {
    case 'easy':
      baseDamage = Math.floor(baseDamage * 1.5);
      break;
    case 'hard':
      baseDamage = Math.floor(baseDamage * 0.7);
      break;
  }
  
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
  saveGameState();
}

// Fetch tasks from Canvas API
async function fetchCanvasTasks() {
  try {
    // Check if Canvas API credentials are set
    if (!gameState.canvasToken || !gameState.canvasDomain) {
      showNotification('Please enter your Canvas API token and domain first', 'warning', 3000);
      return;
    }
    
    // Show loading notification
    showNotification('Fetching quests from Canvas...', 'info', 2000);
    
    // Use a CORS proxy to avoid CORS issues
    // In a real production app, you would use your own server as a proxy
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const domain = gameState.canvasDomain;
    const token = gameState.canvasToken;
    
    try {
      // Try with CORS proxy first
      await fetchCanvasTasksWithProxy(corsProxy, domain, token);
    } catch (proxyError) {
      console.error('Error using CORS proxy:', proxyError);
      
      // If proxy fails, show manual import dialog
      showManualImportDialog();
    }
  } catch (error) {
    console.error('Error fetching Canvas tasks:', error);
    showNotification(`Error: ${error.message}`, 'warning', 4000);
  }
}

// Fetch Canvas tasks using a CORS proxy
async function fetchCanvasTasksWithProxy(corsProxy, domain, token) {
  // Fetch todo items
  const todoResponse = await fetch(`${corsProxy}https://${domain}/api/v1/users/self/todo`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  if (!todoResponse.ok) {
    throw new Error(`Failed to fetch Canvas todo items: ${todoResponse.status}`);
  }
  
  const todoItems = await todoResponse.json();
  
  // Fetch upcoming calendar events
  const calendarResponse = await fetch(`${corsProxy}https://${domain}/api/v1/users/self/calendar_events?start_date=2023-01-01&end_date=2030-01-01`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  if (!calendarResponse.ok) {
    throw new Error(`Failed to fetch Canvas calendar events: ${calendarResponse.status}`);
  }
  
  const calendarEvents = await calendarResponse.json();
  
  // Process the fetched data
  processCanvasData(todoItems, calendarEvents);
}

// Process Canvas data and add to game state
function processCanvasData(todoItems, calendarEvents) {
  // Combine todo items and calendar events
  const canvasTasks = [
    ...todoItems.map(item => ({
      id: `canvas-todo-${item.id}`,
      title: item.assignment?.name || 'Task',
      dueDate: item.assignment?.due_at || null,
      completed: false,
      type: 'canvas-todo'
    })),
    ...calendarEvents.map(event => ({
      id: `canvas-event-${event.id}`,
      title: event.title,
      dueDate: event.start_at,
      completed: false,
      type: 'canvas-event'
    }))
  ];
  
  // Filter out any tasks already completed
  const newTasks = canvasTasks.filter(task => 
    !gameState.completedTasks.includes(task.id)
  );
  
  // Add new tasks to game state
  gameState.tasks = [...gameState.tasks, ...newTasks];
  
  // Save the updated game state
  saveGameState();
  
  // Render the tasks
  renderTasks();
  
  // Show success notification
  showNotification(`Imported ${newTasks.length} quests from Canvas!`, 'success', 3000);
  
  // Switch back to main tab
  switchTab('main');
}

// Show manual import dialog when CORS prevents direct API access
function showManualImportDialog() {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Manual Canvas Import';
  modal.appendChild(title);
  
  // Add instructions
  const instructions = document.createElement('p');
  instructions.textContent = 'Due to browser security restrictions, we cannot directly access Canvas. Please copy and paste your assignments from Canvas below:';
  instructions.className = 'modal-instructions';
  modal.appendChild(instructions);
  
  // Add textarea for manual input
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Format: Task Name, Due Date (MM/DD/YYYY)\nExample:\nMath Homework, 12/15/2023\nScience Project, 01/10/2024';
  textarea.rows = 8;
  modal.appendChild(textarea);
  
  // Add buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'modal-buttons';
  
  const importButton = document.createElement('button');
  importButton.textContent = 'Import Tasks';
  importButton.className = 'action-button';
  importButton.addEventListener('click', () => {
    const tasks = parseManualInput(textarea.value);
    if (tasks.length > 0) {
      // Add tasks to game state
      gameState.tasks = [...gameState.tasks, ...tasks];
      saveGameState();
      renderTasks();
      showNotification(`Imported ${tasks.length} quests manually!`, 'success', 3000);
      closeModal();
      switchTab('main');
    } else {
      showNotification('No valid tasks found. Please check the format.', 'warning', 3000);
    }
  });
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.className = 'secondary-button';
  cancelButton.addEventListener('click', closeModal);
  
  buttonContainer.appendChild(importButton);
  buttonContainer.appendChild(cancelButton);
  modal.appendChild(buttonContainer);
  
  // Add modal to overlay
  overlay.appendChild(modal);
  
  // Add overlay to body
  document.body.appendChild(overlay);
  
  // Function to close the modal
  function closeModal() {
    document.body.removeChild(overlay);
  }
}

// Parse manual input of tasks
function parseManualInput(input) {
  const lines = input.trim().split('\n');
  const tasks = [];
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    // Try to parse the line
    const parts = line.split(',').map(part => part.trim());
    const title = parts[0];
    
    if (!title) continue;
    
    let dueDate = null;
    if (parts.length > 1 && parts[1]) {
      // Try to parse the date
      try {
        const dateParts = parts[1].split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          dueDate = new Date(year, month, day).toISOString();
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    tasks.push({
      id: `manual-${Date.now()}-${tasks.length}`,
      title,
      dueDate,
      completed: false,
      type: 'manual'
    });
  }
  
  return tasks;
} 