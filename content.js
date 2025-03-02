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
      background-color: transparent;
      color: white;
      width: 80px;
      height: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      z-index: 9999;
      cursor: pointer;
    `;
    
    // Create level display (8-bit style)
    const levelDisplay = document.createElement('div');
    levelDisplay.id = 'canvas-rpg-level';
    levelDisplay.style.cssText = `
      background-color: #000;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 12px;
      padding: 3px 6px;
      border: 2px solid #fff;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
      image-rendering: pixelated;
      text-shadow: 2px 2px 0 #000;
      box-shadow: 0 0 0 2px #000, 0 0 0 4px #fff, 0 0 0 6px #000;
      transform: rotate(-2deg);
    `;
    
    // Create knight character
    const knight = document.createElement('div');
    knight.id = 'canvas-rpg-knight';
    knight.style.cssText = `
      width: 60px;
      height: 60px;
      background-image: url('${chrome.runtime.getURL('images/knight.gif')}');
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      image-rendering: pixelated;
      transition: transform 0.3s;
      transform-origin: bottom center;
    `;
    
    // Create dialogue bubble
    const dialogueBubble = document.createElement('div');
    dialogueBubble.id = 'canvas-rpg-dialogue';
    dialogueBubble.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 0;
      background-color: #fff;
      color: #000;
      padding: 8px 12px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      max-width: 200px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
      text-align: center;
      border: 2px solid #000;
      transform: translateY(10px);
    `;
    
    // Add dialogue text span
    dialogueBubble.innerHTML = `<span id="dialogue-text"></span>`;
    
    // Add CSS for the speech bubble arrow and knight animations
    const style = document.createElement('style');
    style.textContent = `
      #canvas-rpg-dialogue::after {
        content: '';
        position: absolute;
        bottom: -10px;
        right: 20px;
        border-width: 10px 10px 0 10px;
        border-style: solid;
        border-color: #fff transparent transparent transparent;
      }
      
      #canvas-rpg-dialogue::before {
        content: '';
        position: absolute;
        bottom: -13px;
        right: 18px;
        border-width: 12px 12px 0 12px;
        border-style: solid;
        border-color: #000 transparent transparent transparent;
        z-index: -1;
      }
      
      @keyframes knight-attack {
        0% { transform: translateX(0) scale(1); }
        25% { transform: translateX(-5px) scale(1.1); }
        50% { transform: translateX(5px) scale(1.2); }
        75% { transform: translateX(-3px) scale(1.1); }
        100% { transform: translateX(0) scale(1); }
      }
      
      .knight-attacking {
        animation: knight-attack 0.8s forwards;
        background-image: url('${chrome.runtime.getURL('images/knight-attack.gif')}') !important;
      }
      
      #canvas-rpg-level {
        transition: transform 0.3s, background-color 0.3s;
        position: relative;
      }
      
      /* 8-bit pixel corners for level display */
      #canvas-rpg-level::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        width: 4px;
        height: 4px;
        background-color: transparent;
        box-shadow: 2px 2px 0 #fff;
      }
      
      #canvas-rpg-level::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 4px;
        height: 4px;
        background-color: transparent;
        box-shadow: -2px 2px 0 #fff;
      }
      
      .level-up {
        transform: scale(1.2) rotate(-2deg) !important;
        background-color: #ffcc00 !important;
        color: #000 !important;
        box-shadow: 0 0 10px #ffcc00, 0 0 0 2px #000, 0 0 0 4px #ffcc00, 0 0 0 6px #000 !important;
      }
      
      /* Idle animation for knight */
      @keyframes knight-idle {
        0% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
        100% { transform: translateY(0); }
      }
      
      #canvas-rpg-knight {
        animation: knight-idle 1.5s infinite ease-in-out;
      }
      
      /* Prevent idle animation during attack */
      .knight-attacking {
        animation: knight-attack 0.8s forwards !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add elements to indicator
    indicator.appendChild(levelDisplay);
    indicator.appendChild(knight);
    indicator.appendChild(dialogueBubble);
    
    // Add click event to open the popup and show attack animation
    indicator.addEventListener('click', () => {
      // Show attack animation
      knight.classList.add('knight-attacking');
      
      // Show attack dialogue
      showDialogue("For glory and XP!");
      
      // Remove attack animation after it completes
      setTimeout(() => {
        knight.classList.remove('knight-attacking');
        hideDialogue();
        
        // Open the popup
        chrome.runtime.sendMessage({ action: 'openPopup' });
      }, 800);
    });
    
    // Add to page
    document.body.appendChild(indicator);
    
    // Add hover effect
    indicator.addEventListener('mouseover', () => {
      knight.style.transform = 'scale(1.1)';
      showDialogue(getRandomDialogue());
    });
    
    indicator.addEventListener('mouseout', () => {
      knight.style.transform = 'scale(1)';
      hideDialogue();
    });
    
    // Periodically update the indicator with game state info
    updateIndicatorWithGameState();
    
    // Start random dialogue intervals
    startRandomDialogues();
    
    // Simulate level up occasionally (every 5-10 minutes)
    setInterval(() => {
      const levelDisplay = document.getElementById('canvas-rpg-level');
      if (levelDisplay) {
        levelDisplay.classList.add('level-up');
        showDialogue("*LEVEL UP EFFECT* Thy power grows!");
        
        setTimeout(() => {
          levelDisplay.classList.remove('level-up');
          hideDialogue();
        }, 3000);
      }
    }, Math.random() * 300000 + 300000); // 5-10 minutes
  }
  
  // Update the indicator with game state information
  async function updateIndicatorWithGameState() {
    try {
      // Get game state from storage
      const data = await chrome.storage.sync.get('gameState');
      
      if (data.gameState) {
        const { level } = data.gameState;
        
        // Update the level display
        const levelDisplay = document.getElementById('canvas-rpg-level');
        if (levelDisplay) {
          levelDisplay.textContent = `LVL ${level}`;
        }
      }
      
      // Update again in 60 seconds
      setTimeout(updateIndicatorWithGameState, 60000);
    } catch (error) {
      console.error('Error updating RPG indicator:', error);
    }
  }
  
  // Show dialogue in the bubble
  function showDialogue(text) {
    const dialogueBubble = document.getElementById('canvas-rpg-dialogue');
    const dialogueText = document.getElementById('dialogue-text');
    
    if (dialogueBubble && dialogueText) {
      dialogueText.textContent = text;
      dialogueBubble.style.opacity = '1';
      dialogueBubble.style.transform = 'translateY(0)';
    }
  }
  
  // Hide dialogue bubble
  function hideDialogue() {
    const dialogueBubble = document.getElementById('canvas-rpg-dialogue');
    
    if (dialogueBubble) {
      dialogueBubble.style.opacity = '0';
      dialogueBubble.style.transform = 'translateY(10px)';
    }
  }
  
  // Get random dialogue
  function getRandomDialogue() {
    const dialogues = [
      "Greetings, brave scholar!",
      "The quests await your wisdom!",
      "A true hero completes assignments before the deadline!",
      "I sense a powerful boss approaching...",
      "Your knowledge is your strongest weapon!",
      "The path to victory is paved with completed quests!",
      "Even the mightiest warriors study diligently!",
      "The ancient scrolls of Canvas hold many secrets!",
      "Sharpen your mind, sharpen your blade!",
      "The dragon of procrastination lurks nearby...",
      "Huzzah! Another day of academic adventure!",
      "By the power of knowledge, we shall prevail!",
      "Thy grades shall rise like the morning sun!",
      "Beware the dungeon of missed deadlines!",
      "Each completed quest brings thee closer to glory!",
      "The wise warrior plans their quests in advance!",
      "I have fought many dragons, but none as fierce as finals week!",
      "Equip thy brain with knowledge, and success shall follow!",
      "The guild of scholars awaits thy contributions!",
      "Thy professor's favor is earned through diligent questing!",
      "Rest when needed, but remember: the quest timer still ticks!",
      "The mightiest weapon is the pen... or keyboard!",
      "Gather thy party before venturing forth into group projects!",
      "The Canvas realm holds many treasures for those who seek!"
    ];
    
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  }
  
  // Get random time-based challenge dialogue
  function getRandomChallengeDialogue() {
    const timeFrames = [15, 20, 30, 45, 60];
    const selectedTime = timeFrames[Math.floor(Math.random() * timeFrames.length)];
    
    const challenges = [
      `Complete a quest in the next ${selectedTime} minutes for double XP!`,
      `A time portal has opened! Finish an assignment within ${selectedTime} minutes for bonus rewards!`,
      `The stars align! Complete any task in ${selectedTime} minutes to receive a critical hit bonus!`,
      `The ancient timer of Chronos has started! ${selectedTime} minutes to gain extra power!`,
      `Quest opportunity: Submit any work in ${selectedTime} minutes for an XP multiplier!`,
      `The Wizard of Time offers thee a challenge: ${selectedTime} minutes to earn bonus loot!`,
      `The hourglass has been turned! ${selectedTime} minutes for legendary completion bonus!`,
      `A spell of haste has been cast! Complete thy task in ${selectedTime} minutes for magical rewards!`,
      `The guild master offers a bounty: ${selectedTime} minutes to earn double gold!`,
      `The moon phase grants power for ${selectedTime} minutes! Use it wisely for bonus XP!`
    ];
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  }
  
  // Start random dialogue intervals
  function startRandomDialogues() {
    // Regular dialogues every 3-5 minutes
    setInterval(() => {
      showDialogue(getRandomDialogue());
      setTimeout(hideDialogue, 5000);
    }, Math.random() * 120000 + 180000); // 3-5 minutes
    
    // Time-based challenges every 15-30 minutes
    setInterval(() => {
      showDialogue(getRandomChallengeDialogue());
      setTimeout(hideDialogue, 8000);
    }, Math.random() * 900000 + 900000); // 15-30 minutes
  }