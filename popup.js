// state for games 
let gameState = {
    xp: 0,
    maxXp: 100,
    level: 1,
    bossHealth: 100,
    maxBossHealth: 100,
    tasks: [],
    completedTasks: []
  };
  
  // DOM Elements
  const xpBar = document.getElementById('xp-bar');
  const xpText = document.getElementById('xp-text');
  const bossHealthBar = document.getElementById('boss-health-bar');
  const bossHealthText = document.getElementById('boss-health-text');
  const questList = document.getElementById('quest-list');
  const canvasTokenInput = document.getElementById('canvas-token');
  const canvasDomainInput = document.getElementById('canvas-domain');
  const saveSettingsBtn = document.getElementById('save-settings');
  const mainTab = document.getElementById('main-tab');
  const settingsTab = document.getElementById('settings-tab');
  const mainContent = document.getElementById('main-content');
  const settingsContent = document.getElementById('settings-content');
  const attackButton = document.getElementById('attack-button');
  
  // Initialize the extension
  document.addEventListener('DOMContentLoaded', async () => {
    // Load saved settings and game state
    await loadSettings();
    await loadGameState();
    
    // Initialize UI
    updateProgressBars();
    
    // Load tasks from Canvas if we have a token
    if (canvasTokenInput.value) {
      fetchCanvasTasks();
    }
    
    // Setup event listeners
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Tab switching
    mainTab.addEventListener('click', () => switchTab('main'));
    settingsTab.addEventListener('click', () => switchTab('settings'));
    
    // Attack button
    attackButton.addEventListener('click', attackBoss);
    
    // Settings button opens settings tab
    const settingsButton = document.getElementById('settings-button');
    settingsButton.addEventListener('click', () => switchTab('settings'));
    
    // Back button returns to main game
    const backButton = document.getElementById('back-button');
    backButton.addEventListener('click', () => switchTab('main'));
    
    // Start with main tab active
    switchTab('main');
  });
  
  // Save settings to chrome storage
  async function saveSettings() {
    const token = canvasTokenInput.value;
    const domain = canvasDomainInput.value;
    
    if (!token || !domain) {
      alert('Please enter both Canvas API token and domain.');
      return;
    }
    
    await chrome.storage.sync.set({ 
      canvasToken: token,
      canvasDomain: domain
    });
    
    alert('Settings saved successfully!');
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
    // Update XP bar
    const xpPercentage = (gameState.xp / gameState.maxXp) * 100;
    xpBar.style.width = `${xpPercentage}%`;
    xpText.textContent = `${gameState.xp}/${gameState.maxXp}`;
    
    // Update boss health bar
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
        // Task was completed, add XP only (no boss damage)
        gameState.xp += 10;
        
        // Check if player leveled up
        if (gameState.xp >= gameState.maxXp) {
          gameState.level++;
          gameState.xp = gameState.xp - gameState.maxXp;
          gameState.maxXp = Math.floor(gameState.maxXp * 1.5);
          alert(`Level up! You are now level ${gameState.level}!`);
        }
        
        // Add to completed tasks
        gameState.completedTasks.push(taskId);
        
        // Remove from active tasks
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
      
      // Update UI
      updateProgressBars();
      renderTasks();
      
      // Save game state
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
  
  // Attack boss function
  async function attackBoss() {
    // Random XP cost between 5 and 15
    const xpCost = Math.floor(Math.random() * 11) + 5;
    
    // Check if player has enough XP
    if (gameState.xp < xpCost) {
      alert(`Not enough XP! This attack needs ${xpCost} XP. Complete more tasks to gain XP.`);
      return;
    }
    
    // Calculate damage based on XP cost (higher XP cost = more damage)
    // Damage will be between 1.5x to 2.5x the XP cost
    const damageMultiplier = 1.5 + Math.random();
    const damage = Math.floor(xpCost * damageMultiplier);
    
    // Update game state
    gameState.xp -= xpCost;
    gameState.bossHealth = Math.max(0, gameState.bossHealth - damage);
    
    // Show attack animation
    const bossImage = document.getElementById('boss-image');
    bossImage.style.transform = 'scale(0.9)';
    setTimeout(() => {
      bossImage.style.transform = 'scale(1)';
    }, 100);
    
    // Check if boss was defeated
    if (gameState.bossHealth <= 0) {
      gameState.bossHealth = 0;
      alert(`Boss defeated! You dealt ${damage} damage using ${xpCost} XP!\nA stronger boss will appear soon...`);
      
      // Spawn a new, stronger boss after a delay
      setTimeout(() => {
        gameState.maxBossHealth = Math.floor(gameState.maxBossHealth * 1.5);
        gameState.bossHealth = gameState.maxBossHealth;
        updateProgressBars();
      }, 3000);
    } else {
      // Show attack result
      alert(`You dealt ${damage} damage using ${xpCost} XP!`);
    }
    
    // Update UI
    updateProgressBars();
    
    // Save game state
    await saveGameState();
  }

  // Add this CSS to make the boss image transition smooth
  const style = document.createElement('style');
  style.textContent = `
    #boss-image {
      transition: transform 0.1s ease-in-out;
    }
  `;
  document.head.appendChild(style);