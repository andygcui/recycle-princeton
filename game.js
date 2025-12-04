// canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 768;
canvas.height = 1024; 

// education styff for the info page
const CATEGORY_INFO = {
  green: {
    name: "Green - Widely Recyclable",
    description: "Accepted in curbside recycling",
    codes: "Plastic codes #1 (PET) and #2 (HDPE)",
    examples: "Water bottles, milk jugs, detergent bottles"
  },
  orange: {
    name: "Orange - Special Dropoff",
    description: "Requires special dropoff locations",
    codes: "Plastic codes #4 (LDPE) and #5 (PP)",
    examples: "Plastic bags, yogurt cups, takeout containers"
  },
  red: {
    name: "Red - Not Recyclable Curbside",
    description: "Not accepted in curbside recycling",
    codes: "Plastic codes #3 (PVC), #6 (PS), #7 (Other)",
    examples: "Styrofoam, PVC pipes, mixed plastics"
  }
};

const PLASTIC_CODE_INFO = {
  1: { name: "PET (Polyethylene Terephthalate)", recyclable: true, common: "Water bottles, soda bottles" },
  2: { name: "HDPE (High-Density Polyethylene)", recyclable: true, common: "Milk jugs, detergent bottles" },
  3: { name: "PVC (Polyvinyl Chloride)", recyclable: false, common: "Pipes, vinyl flooring" },
  4: { name: "LDPE (Low-Density Polyethylene)", recyclable: "special", common: "Plastic bags, shrink wrap" },
  5: { name: "PP (Polypropylene)", recyclable: "special", common: "Yogurt cups, bottle caps" },
  6: { name: "PS (Polystyrene)", recyclable: false, common: "Styrofoam, disposable cups" },
  7: { name: "Other/Mixed", recyclable: false, common: "Mixed plastics, bioplastics" }
};

// ============================================================================
// GAME DATA - Plastic Items
// ============================================================================
const ITEMS = [
  {
    name: "Water bottle",
    code: 1,                // PET
    category: "green",
    description: "Made from PET #1 - widely recyclable!"
  },
  {
    name: "Milk jug",
    code: 2,                // HDPE
    category: "green",
    description: "Made from HDPE #2 - widely recyclable!"
  },
  {
    name: "Plastic bag",
    code: 4,                // LDPE
    category: "orange",
    description: "Made from LDPE #4 - needs special dropoff"
  },
  {
    name: "Yogurt cup",
    code: 5,                // PP
    category: "orange",
    description: "Made from PP #5 - needs special dropoff"
  },
  {
    name: "Styrofoam cup",
    code: 6,                // PS
    category: "red",
    description: "Made from PS #6 - not recyclable curbside"
  },
  {
    name: "Soda bottle",
    code: 1,
    category: "green",
    description: "Made from PET #1 - widely recyclable!"
  },
  {
    name: "Detergent bottle",
    code: 2,
    category: "green",
    description: "Made from HDPE #2 - widely recyclable!"
  },
  {
    name: "PVC pipe",
    code: 3,                // PVC
    category: "red",
    description: "Made from PVC #3 - not recyclable curbside"
  },
  {
    name: "Mixed plastic",
    code: 7,                // Other
    category: "red",
    description: "Made from mixed plastic #7 - not recyclable curbside"
  }
];

// ============================================================================
// GAME STATE
// ============================================================================
let currentItem = null;
let currentItemImage = null; // Store the selected image variant for current item
let itemX = 0;
let itemY = 0;
let itemSpeedY = 0.5;
let itemSpeedX = 0;
let itemWidth = 150;  // Increased from 100
let itemHeight = 120;  // Increased from 80

let phase = "category";
let codePhaseCategory = null;  // Track which category we're sorting codes for (green/orange/red)
let score = 0;
let message = "";
let educationalMessage = "";  // Detailed educational message
let messageTimer = 0;
let educationalTimer = 0;
let messageDuration = 180;
let educationalDuration = 300; // Longer for educational content

let bins = [];
let showHints = true;  // Show educational hints
let gameLocation = "Princeton, NJ";  // Store location for display
let hasCollided = false;  // Prevent multiple collision checks per item
let isTransitioning = false;  // Flag to prevent updates during phase transitions

// Game progression
let level = 1;
let correctItemsThisLevel = 0;  // Track correct items recycled for current level
let baseSpeedY = 0.5;  // Base falling speed
let gameOver = false;
let gameOverMessage = "";
let gamePaused = false;  // Pause state
let showHand = false;  // Show hand image (starts hidden)
let soundEnabled = false;  // Sound effects enabled (starts off)

// Level-based item unlocking
const ITEMS_BY_LEVEL = {
  1: ["Water bottle"],  // Level 1: Just water bottle
  2: ["Soda bottle", "PVC pipe"],  // Level 2: Add these 2
  3: ["Plastic bag", "Milk jug", "Styrofoam cup"],  // Level 3: Add these 3
  4: ["Detergent bottle", "Yogurt cup", "Mixed plastic"]  // Level 4: Add the rest
};

// Track which new items have been correctly sorted in current level
let newItemsSortedThisLevel = new Set();  // Track item names that were correctly sorted
let newItemsForCurrentLevel = [];  // Items added in current level
let itemAttempts = 0;  // Track attempts for current item (0 = first try)
let showHintsOffPopup = false;  // Show popup when hints are turned off
let hintsOffPopupTimer = 0;  // Timer for hints off popup
const hintsOffPopupDuration = 300;  // frames to show popup (5 seconds)
let showNewItemsPopup = false;  // Show popup when new items are unlocked

// Trash pile system
let trashPileHeight = 0;  // Height of trash pile (0-100, game ends at 100)
const maxTrashPileHeight = 100;

// Contamination tracking
let greenBinContaminated = false;
let contaminationTimer = 0;
const contaminationDuration = 180;  // frames
let contaminationCounts = {};  // Track contamination count per bin category: { "green": 2, "orange": 1 }
let contaminatedBins = new Set();  // Track which bins are contaminated (by category: "green", "orange")
let hasSeenContaminationPopup = false;  // Track if user has seen contamination explanation popup
let showContaminationPopup = false;  // Show contamination popup on first contamination

// Decontamination mini-game
let decontaminationActive = false;  // Is decontamination game active
let decontaminationBinCategory = null;  // Which bin category is being decontaminated
let decontaminationBinX = 0;  // X position of bin in decontamination game
let decontaminationBinWidth = 120;  // Width of bin in decontamination game
let decontaminationBinY = 0;  // Y position of bin (at bottom)
let decontaminationItems = [];  // Array of items falling in decontamination game
let decontaminationItemSpeed = 3;  // Speed of items falling
let decontaminationSpawnTimer = 0;  // Timer for spawning new items
let decontaminationSpawnInterval = 240;  // Frames between item spawns (slower for better visibility)
let decontaminationSpawnOffset = 0;  // Vertical offset to reduce spacing between items
let decontaminationCorrectCount = 0;  // Count of correct items collected
let decontaminationRequiredCorrect = 5;  // Need 5 correct items to decontaminate
let decontaminationWrongCount = 0;  // Count of wrong items collected
let decontaminationMaxWrong = 3;  // 3 wrong items = fail
let decontaminationCooldowns = {};  // Track cooldown timers per bin category: { "green": 1800 }
const decontaminationCooldownDuration = 1800;  // 30 seconds at 60fps

// Fake leaderboard and PvP
let showLeaderboard = false;
let showPvP = false;
let showHelpPanel = false;  // Show help panel with controls and plastics grid
let helpPanelScrollY = 0;  // Scroll position for help panel

// Tutorial system
let tutorialActive = false;
let tutorialStep = 0;
let tutorialAutoAdvance = false;
let tutorialAutoAdvanceTimer = 0;
const tutorialAutoAdvanceDelay = 300; // frames before auto-advancing (5 seconds at 60fps)
let tutorialSubStep = 0; // Track substeps within interactive tutorial steps (0 = explanation, 1 = ready, 2 = playing)

// Tutorial steps
const tutorialSteps = [
  {
    title: "Welcome to Recycle Princeton!",
    text: "Let's learn how to play! This tutorial will teach you everything you need to know about recycling.",
    highlight: null,
    action: null
  },
  {
    title: "Your Location",
    text: "This shows where you're playing. Recycling rules can vary by location!",
    highlight: { type: "location", x: 25, y: 28, width: 150, height: 20 },
    action: null
  },
  {
    title: "Your Score",
    text: "Every time you recycle correctly, you earn points! Try to get as many as you can!",
    highlight: { type: "score", x: canvas.width - 140, y: 15, width: 120, height: 40 },
    action: null
  },
  {
    title: "The Recycling Bins",
    text: "You'll see three colored bins at the bottom:\n• GREEN = Widely recyclable\n• ORANGE = Special dropoff needed\n• RED = Not recyclable curbside",
    highlight: { type: "bins", x: 0, y: canvas.height - 150, width: canvas.width, height: 150 },
    action: null
  },
  {
    title: "The Falling Item",
    text: "Items will fall from the top. Your goal is to sort them into the correct bin!",
    highlight: { type: "item", x: canvas.width / 2 - 75, y: 175, width: 150, height: 120 },
    action: null
  },
  {
    title: "Try It: Water Bottle",
    text: "Let's practice! A water bottle is made from PET (polyethylene terephthalate).\n\nPET, plastic type #1, goes in the GREEN bin because it's widely recyclable in Princeton! \n\n Use arrow keys to move the water bottle into the GREEN bin!",
    highlight: null,
    action: "setItem",
    itemName: "Water bottle",
    interactive: true,  // Allow game to run during this step
    substeps: [
      { title: "Try It: Water Bottle", text: "Let's practice! A water bottle is made from PET (polyethylene terephthalate), plastic type #1.\n\nUse arrow keys to move the water bottle into the GREEN bin, because it's widely recyclable in Princeton!" },
      { title: "Ready?", text: "Use the arrow keys to move the water bottle into the GREEN bin!\n\nTry it now!" }
    ]
  },
  {
    title: "Great Job!",
    text: "You correctly placed the water bottle in the green bin! Now you'll see the second step where you choose the specific plastic code number (#1 or #2).",
    highlight: null,
    action: null
  },
  {
    title: "Try It: Choose the Code",
    text: "Now choose the specific plastic code! The water bottle is made from PET plastic, which is plastic type #1.\n\nPut it in the #1 bin!",
    highlight: null,
    action: "setItemCodePhase",
    itemName: "Water bottle",
    interactive: true,
    substeps: [
      { title: "Try It: Choose the Code", text: "Now choose the specific plastic code! The water bottle is PET, which is plastic type #1.\n\nUse arrow keys to move it in the #1 bin!" },
      { title: "Ready?", text: "Use the arrow keys to move the water bottle into the #1 bin!\n\nTry it now!" }
    ]
  },
  {
    title: "Green Bin = Curbside Pickup",
    text: "Items in the GREEN bin can be picked up at your curb! These are codes #1 and #2 - the most common recyclable plastics.",
    highlight: { type: "bin", binIndex: 0, x: 0, y: canvas.height - 140, width: canvas.width / 3, height: 140 },
    action: null
  },
  {
    title: "Orange Bin = Special Dropoff",
    text: "Items in the ORANGE bin need special dropoff locations. Don't put them in curbside recycling - they can contaminate the stream!",
    highlight: { type: "bin", binIndex: 1, x: canvas.width / 3, y: canvas.height - 140, width: canvas.width / 3, height: 140 },
    action: null
  },
  {
    title: "Red Bin = Not Recyclable",
    text: "Items in the RED bin are NOT accepted in curbside recycling. These should go in regular trash, not recycling bins!",
    highlight: { type: "bin", binIndex: 2, x: (canvas.width / 3) * 2, y: canvas.height - 140, width: canvas.width / 3, height: 140 },
    action: null
  },
  {
    title: "Controls",
    text: "Use ARROW KEYS to move items left and right.\nPress ENTER to drop instantly.\nPress SHIFT to speed up.\nPress SPACE to pause.\nPress X to toggle hints.",
    highlight: null,
    action: null
  }
];

// Animated background elements
let cloudPositions = [
  { x: 100, y: 50, size: 60 },
  { x: 300, y: 80, size: 40 },
  { x: 600, y: 60, size: 50 }
];
let animationFrame = 0;

// Flash effect for correct/incorrect feedback
let flashColor = null;  // null, "green", or "red"
let flashTimer = 0;
let flashDuration = 30; // frames (about 0.5 seconds at 60fps)

// Animation effects for feedback
let binBounceTimer = 0;  // Timer for bin bounce animation (correct answer)
let binBounceDuration = 40; // frames
let bouncingBinIndex = -1;  // Index of the bin that should bounce (-1 = none)
let binShakeTimer = 0;  // Timer for bin shake animation (incorrect answer)
let binShakeDuration = 30; // frames
let shakingBinIndex = -1;  // Index of the bin that should shake (-1 = none)

// Image loading
const itemImages = {};  // Cache for loaded images (can be single image or array for variants)
let imagesLoaded = false;
let recycleSymbolImage = null;  // Recycling symbol image
let greenBinImage = null;  // Green bin image
let yellowBinImage = null;  // Yellow/Orange bin image
let redBinImage = null;  // Red bin image
let stopImage = null;  // Stop sign image for contamination indicator
let handImage = null;  // Hand image
let correctSound = null;  // Correct sound effect
let incorrectSound = null;  // Incorrect sound effect

// Keyboard state
const keys = {
  left: false,
  right: false,
  down: false,
  space: false,  // Spacebar to toggle hints (demo mode)
  shift: false,  // Shift for speed up (3x faster while held)
  enter: false  // Enter key for instant drop
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function initGame() {
  // Get location from localStorage
  gameLocation = localStorage.getItem('gameLocation') || 'Princeton, NJ';
  
  loadImages();
  loadRecycleSymbol();
  loadGreenBinImage();
  loadYellowBinImage();
  loadRedBinImage();
  loadStopImage();
  loadHandImage();
  loadCorrectSound();
  loadIncorrectSound();
  
  // Initialize new items for level 1
  updateNewItemsForLevel();
  
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 180; // Start below the "Recycle this [item]!" text
  setupBins();
  
  // Check if this is first time playing (tutorial)
  const hasPlayedBefore = localStorage.getItem('hasPlayedBefore');
  if (!hasPlayedBefore) {
    tutorialActive = true;
    tutorialStep = 0;
    processTutorialAction(tutorialSteps[0]);
  }
  
  // Add click handler for info button on canvas
  canvas.addEventListener('click', (e) => {
    // Handle new items popup dismissal
    if (showNewItemsPopup) {
      showNewItemsPopup = false;
      // If this was a merged popup (level 4+), turn off hints
      if (level >= 4 && showHints) {
        showHints = false;
      }
      return;
    }
    
    // Handle hints off popup dismissal
    if (showHintsOffPopup) {
      showHintsOffPopup = false;
      // Turn off hints after popup is dismissed
      if (level >= 4) {
        showHints = false;
      }
      return;
    }
    
    // Handle contamination popup dismissal
    if (showContaminationPopup) {
      showContaminationPopup = false;
      // Reset item after popup is dismissed so next item can fall
      if (currentItem) {
        resetItem();
        pickRandomItem();
      }
      return;
    }
    
    // Handle help panel dismissal
    if (showHelpPanel) {
      showHelpPanel = false;
      helpPanelScrollY = 0; // Reset scroll position
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on info button (circular area)
    const infoButtonX = canvas.width - 160;
    const infoButtonY = 30 + 4;
    const infoButtonRadius = 18 * 0.7; // Scaled down by 0.7
    
    const dx = x - infoButtonX;
    const dy = y - infoButtonY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= infoButtonRadius) {
      window.location.href = 'info.html';
    }
    
    // Check clicks on leaderboard button (in header)
    const leaderboardBtnX = 300;
    const leaderboardBtnY = 20;
    const leaderboardBtnWidth = 90;
    const leaderboardBtnHeight = 30;
    if (x >= leaderboardBtnX && x <= leaderboardBtnX + leaderboardBtnWidth && 
        y >= leaderboardBtnY && y <= leaderboardBtnY + leaderboardBtnHeight) {
      showLeaderboard = !showLeaderboard;
      showPvP = false;
    }
    
    // Check clicks on PvP button (in header)
    const pvpBtnX = 400;
    const pvpBtnY = 20;
    const pvpBtnWidth = 70;
    const pvpBtnHeight = 30;
    if (x >= pvpBtnX && x <= pvpBtnX + pvpBtnWidth && 
        y >= pvpBtnY && y <= pvpBtnY + pvpBtnHeight) {
      showPvP = !showPvP;
      showLeaderboard = false;
    }
    
    // Check clicks on contaminated bins for decontamination (only if tutorial not active and not in decontamination game)
    if (!tutorialActive && !decontaminationActive) {
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        if (contaminatedBins.has(bin.category) && contaminationCounts[bin.category]) {
          // Check if click is on this bin
          if (x >= bin.x && x <= bin.x + bin.width && 
              y >= bin.y && y <= bin.y + bin.height) {
            // Check if cooldown has expired
            if (!decontaminationCooldowns[bin.category] || decontaminationCooldowns[bin.category] === 0) {
              startDecontaminationGame(bin.category);
              return;
            }
          }
        }
      }
    }
    
    // Check clicks on help button (bottom right) - only if tutorial not active
    if (!tutorialActive) {
      const helpBtnSize = 40;
      const helpBtnX = canvas.width - helpBtnSize - 15;
      const helpBtnY = canvas.height - helpBtnSize - 15;
      if (x >= helpBtnX && x <= helpBtnX + helpBtnSize && 
          y >= helpBtnY && y <= helpBtnY + helpBtnSize) {
        showHelpPanel = !showHelpPanel;
        return;
      }
    }
    
    // Check clicks on tutorial buttons
    if (tutorialActive && tutorialStep < tutorialSteps.length) {
      const step = tutorialSteps[tutorialStep];
      const isInteractive = step.interactive;
      const currentSubStep = step.substeps ? step.substeps[tutorialSubStep] : null;
      const isReadyStep = isInteractive && currentSubStep && tutorialSubStep === 1;
      const isExplanationStep = isInteractive && tutorialSubStep === 0;
      const panelWidth = 700;  // Same width for all panels
      const panelHeight = 300;  // Same height for all panels
      const panelX = (canvas.width - panelWidth) / 2;
      const panelY = (canvas.height - panelHeight) / 2;  // Always centered vertically
      
      if (isInteractive) {
        const buttonHeight = 35;
        const buttonWidth = 120;
        
        // Skip button at top right
        const skipBtnX = panelX + panelWidth - buttonWidth - 20;
        const skipBtnY = panelY + 10;
        if (x >= skipBtnX && x <= skipBtnX + buttonWidth && 
            y >= skipBtnY && y <= skipBtnY + buttonHeight) {
          skipTutorial();
          return;
        }
        
        // "Try It Now" and "Previous" buttons on substep 0 (explanation)
        if (currentSubStep && tutorialSubStep === 0 && step.substeps) {
          const buttonY = panelY + panelHeight - buttonHeight - 15;
          
          // Previous button (bottom left)
          if (tutorialStep > 0) {
            const prevBtnX = panelX + 20;
            if (x >= prevBtnX && x <= prevBtnX + buttonWidth && 
                y >= buttonY && y <= buttonY + buttonHeight) {
              previousTutorialStep();
              return;
            }
          }
          
          // Try It Now button (bottom right) - goes directly to gameplay (substep 2)
          const tryBtnX = panelX + panelWidth - buttonWidth - 20;
          if (x >= tryBtnX && x <= tryBtnX + buttonWidth && 
              y >= buttonY && y <= buttonY + buttonHeight) {
            tutorialSubStep = 2; // Skip to gameplay mode directly
            return;
          }
        }
        
        // "Try Now!" button on substep 1 (Ready? step) to start playing
        if (currentSubStep && tutorialSubStep === 1 && step.substeps && tutorialSubStep < step.substeps.length) {
          const nextBtnX = panelX + panelWidth - buttonWidth - 20;
          const nextBtnY = panelY + panelHeight - buttonHeight - 15;
          if (x >= nextBtnX && x <= nextBtnX + buttonWidth && 
              y >= nextBtnY && y <= nextBtnY + buttonHeight) {
            nextTutorialSubStep(); // Advance to playing mode (substep 2)
            return;
          }
        }
      } else {
        // Normal step - all buttons
        const buttonHeight = 35;
        const buttonWidth = 120;
        const isFirstStep = tutorialStep === 0;
        const panelHeight = 300;
        
        // Skip button (top right) - X button on first slide, full button otherwise
        if (isFirstStep) {
          const skipBtnSize = 30;
          const skipBtnX = panelX + panelWidth - skipBtnSize - 15;
          const skipBtnY = panelY + 15;
          if (x >= skipBtnX && x <= skipBtnX + skipBtnSize && 
              y >= skipBtnY && y <= skipBtnY + skipBtnSize) {
            skipTutorial();
            return;
          }
        } else {
          const skipBtnX = panelX + panelWidth - buttonWidth - 20;
          const skipBtnY = panelY + 10;
          if (x >= skipBtnX && x <= skipBtnX + buttonWidth && 
              y >= skipBtnY && y <= skipBtnY + buttonHeight) {
            skipTutorial();
            return;
          }
        }
        
        // Previous button (bottom left)
        const buttonY = panelY + panelHeight - buttonHeight - 15;
        if (tutorialStep > 0) {
          const prevBtnX = panelX + 20;
          if (x >= prevBtnX && x <= prevBtnX + buttonWidth && 
              y >= buttonY && y <= buttonY + buttonHeight) {
            previousTutorialStep();
            return;
          }
        }
        
        // Next button (bottom right)
        const nextBtnX = panelX + panelWidth - buttonWidth - 20;
        if (x >= nextBtnX && x <= nextBtnX + buttonWidth && 
            y >= buttonY && y <= buttonY + buttonHeight) {
          nextTutorialStep();
          return;
        }
      }
    }
  });
  
  gameLoop();
}

// ============================================================================
// TUTORIAL SYSTEM
// ============================================================================
function processTutorialAction(step) {
  if (!step) return;
  
  // Reset substep when starting a new step
  tutorialSubStep = 0;
  
  if (step.action === "setItem") {
    // Set specific item for tutorial
    const item = ITEMS.find(i => i.name === step.itemName);
    if (item) {
      currentItem = item;
      updateCurrentItemImage();
      itemX = canvas.width / 2 - itemWidth / 2;
      itemY = 180;
      phase = "category";
      setupBins();
    }
  } else if (step.action === "setItemCodePhase") {
    // Set specific item and transition to code phase for tutorial
    const item = ITEMS.find(i => i.name === step.itemName);
    if (item) {
      currentItem = item;
      updateCurrentItemImage();
      itemX = canvas.width / 2 - itemWidth / 2;
      itemY = 180;
      phase = "code";
      codePhaseCategory = item.category; // Set to green since water bottle is green
      setupBins();
    }
  } else if (step.action === "highlightBin") {
    // Bin highlighting is handled in rendering
  }
}

function nextTutorialStep() {
  if (tutorialStep < tutorialSteps.length - 1) {
    tutorialStep++;
    tutorialSubStep = 0; // Reset substep when moving to new step
    processTutorialAction(tutorialSteps[tutorialStep]);
    tutorialAutoAdvanceTimer = 0;
  } else {
    endTutorial();
  }
}

function nextTutorialSubStep() {
  const step = tutorialSteps[tutorialStep];
  if (step.interactive && step.substeps && tutorialSubStep < step.substeps.length - 1) {
    tutorialSubStep++;
  }
}

function previousTutorialStep() {
  if (tutorialStep > 0) {
    tutorialStep--;
    processTutorialAction(tutorialSteps[tutorialStep]);
    tutorialAutoAdvanceTimer = 0;
  }
}

function skipTutorial() {
  endTutorial();
}

function endTutorial() {
  tutorialActive = false;
  localStorage.setItem('hasPlayedBefore', 'true');
  // Reset to normal game state
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 180;
  phase = "category";
  setupBins();
}

// Load recycling symbol image
function loadRecycleSymbol() {
  const img = new Image();
  img.src = 'images/recycle.png';
  img.onload = () => {
    recycleSymbolImage = img;
  };
  img.onerror = () => {
    console.log('Recycle symbol image not found');
  };
}

// Load green bin image
function loadGreenBinImage() {
  const img = new Image();
  img.src = 'images/green.png';
  img.onload = () => {
    greenBinImage = img;
  };
  img.onerror = () => {
    console.log('Green bin image not found');
  };
}

function loadYellowBinImage() {
  const img = new Image();
  img.src = 'images/yellow.png';
  img.onload = () => {
    yellowBinImage = img;
  };
  img.onerror = () => {
    console.log('Yellow bin image not found');
  };
}

function loadRedBinImage() {
  const img = new Image();
  img.src = 'images/red.png';
  img.onload = () => {
    redBinImage = img;
  };
  img.onerror = () => {
    console.log('Red bin image not found');
  };
}

function loadStopImage() {
  const img = new Image();
  img.src = 'images/stop.png';
  img.onload = () => {
    stopImage = img;
  };
  img.onerror = () => {
    console.log('Stop image not found');
  };
}

function loadHandImage() {
  const img = new Image();
  img.src = 'images/hand.png';
  img.onload = () => {
    handImage = img;
  };
  img.onerror = () => {
    console.log('Hand image not found');
  };
}

function loadCorrectSound() {
  const audio = new Audio('images/correct.mp3');
  audio.preload = 'auto';
  audio.volume = 0.3; // Set volume to 30% (softer)
  correctSound = audio;
  audio.onerror = () => {
    console.log('Correct sound not found');
  };
}

function loadIncorrectSound() {
  const audio = new Audio('images/incorrect.mp3');
  audio.preload = 'auto';
  audio.volume = 0.5; // Set volume to 50% (louder than correct)
  incorrectSound = audio;
  audio.onerror = () => {
    console.log('Incorrect sound not found');
  };
}

// Load images for items
function loadImages() {
  let loadedCount = 0;
  const uniqueItems = {}; // Track unique item names to avoid loading duplicates
  
  // First, identify unique items
  ITEMS.forEach(item => {
    if (!uniqueItems[item.name]) {
      uniqueItems[item.name] = item;
    }
  });
  
  const totalItems = Object.keys(uniqueItems).length;
  let itemsProcessed = 0;
  
  // Load images for each unique item
  Object.values(uniqueItems).forEach(item => {
    const imageName = item.name.toLowerCase().replace(/\s+/g, '-');
    
    // Special handling for items with multiple variants
    if (item.name === "Water bottle") {
      const variants = [];
      let variantsLoaded = 0;
      const totalVariants = 5;
      
      for (let i = 1; i <= totalVariants; i++) {
        const img = new Image();
        img.src = `images/${imageName}-${i}.png`;
        
        img.onload = () => {
          variants.push(img);
          variantsLoaded++;
          if (variantsLoaded === totalVariants) {
            itemImages[item.name] = variants;
            itemsProcessed++;
            // Update current item image if this is the current item
            if (currentItem && currentItem.name === item.name) {
              updateCurrentItemImage();
            }
            if (itemsProcessed === totalItems) {
              imagesLoaded = true;
            }
          }
        };
        
        img.onerror = () => {
          variantsLoaded++;
          if (variantsLoaded === totalVariants) {
            // If no variants loaded, use fallback
            if (variants.length > 0) {
              itemImages[item.name] = variants;
              // Update current item image if this is the current item
              if (currentItem && currentItem.name === item.name) {
                updateCurrentItemImage();
              }
            }
            itemsProcessed++;
            if (itemsProcessed === totalItems) {
              imagesLoaded = true;
            }
          }
        };
      }
    } else if (item.name === "Milk jug") {
      const variants = [];
      let variantsLoaded = 0;
      const totalVariants = 3;
      
      for (let i = 1; i <= totalVariants; i++) {
        const img = new Image();
        img.src = `images/${imageName}-${i}.png`;
        
        img.onload = () => {
          variants.push(img);
          variantsLoaded++;
          if (variantsLoaded === totalVariants) {
            itemImages[item.name] = variants;
            itemsProcessed++;
            // Update current item image if this is the current item
            if (currentItem && currentItem.name === item.name) {
              updateCurrentItemImage();
            }
            if (itemsProcessed === totalItems) {
              imagesLoaded = true;
            }
          }
        };
        
        img.onerror = () => {
          variantsLoaded++;
          if (variantsLoaded === totalVariants) {
            // If no variants loaded, use fallback
            if (variants.length > 0) {
              itemImages[item.name] = variants;
              // Update current item image if this is the current item
              if (currentItem && currentItem.name === item.name) {
                updateCurrentItemImage();
              }
            }
            itemsProcessed++;
            if (itemsProcessed === totalItems) {
              imagesLoaded = true;
            }
          }
        };
      }
    } else if (item.name === "Soda bottle") {
      const variants = [];
      let variantsLoaded = 0;
      const totalVariants = 3;
      
      for (let i = 1; i <= totalVariants; i++) {
        const img = new Image();
        img.src = `images/${imageName}-${i}.png`;
        
        img.onload = () => {
          variants.push(img);
          variantsLoaded++;
          if (variantsLoaded === totalVariants) {
            itemImages[item.name] = variants;
            itemsProcessed++;
            // Update current item image if this is the current item
            if (currentItem && currentItem.name === item.name) {
              updateCurrentItemImage();
            }
            if (itemsProcessed === totalItems) {
              imagesLoaded = true;
            }
          }
        };
        
        img.onerror = () => {
          variantsLoaded++;
          if (variantsLoaded === totalVariants) {
            // If no variants loaded, use fallback
            if (variants.length > 0) {
              itemImages[item.name] = variants;
              // Update current item image if this is the current item
              if (currentItem && currentItem.name === item.name) {
                updateCurrentItemImage();
              }
            }
            itemsProcessed++;
            if (itemsProcessed === totalItems) {
              imagesLoaded = true;
            }
          }
        };
      }
    } else {
      // Regular single image loading
      const img = new Image();
      img.src = `images/${imageName}.png`;
      
      img.onload = () => {
        itemImages[item.name] = img;
        itemsProcessed++;
        // Update current item image if this is the current item
        if (currentItem && currentItem.name === item.name) {
          updateCurrentItemImage();
        }
        if (itemsProcessed === totalItems) {
          imagesLoaded = true;
        }
      };
      
      img.onerror = () => {
        // If image fails to load, we'll use the fallback drawing
        console.log(`Image not found: images/${imageName}.png - using fallback`);
        itemsProcessed++;
        if (itemsProcessed === totalItems) {
          imagesLoaded = true;
        }
      };
    }
  });
}

// Helper function to update currentItemImage when images are loaded
function updateCurrentItemImage() {
  if (!currentItem) return;
  
  const itemImageData = itemImages[currentItem.name];
  if (itemImageData) {
    if (Array.isArray(itemImageData)) {
      // For items with multiple variants (like water bottles), randomly pick one
      const randomVariantIndex = Math.floor(Math.random() * itemImageData.length);
      currentItemImage = itemImageData[randomVariantIndex];
    } else {
      currentItemImage = itemImageData;
    }
  } else {
    currentItemImage = null;
  }
}

// Get available items for current level
function getAvailableItemsForLevel(currentLevel) {
  const availableItems = [];
  
  // Add items from all levels up to and including current level
  for (let l = 1; l <= currentLevel; l++) {
    if (ITEMS_BY_LEVEL[l]) {
      ITEMS_BY_LEVEL[l].forEach(itemName => {
        const item = ITEMS.find(i => i.name === itemName);
        if (item) {
          availableItems.push(item);
        }
      });
    }
  }
  
  return availableItems;
}

function pickRandomItem() {
  // Get available items for current level
  const availableItems = getAvailableItemsForLevel(level);
  
  if (availableItems.length === 0) {
    // Fallback to all items if something goes wrong
  const randomIndex = Math.floor(Math.random() * ITEMS.length);
  currentItem = ITEMS[randomIndex];
  } else {
    // Create weighted array: new items get 2x weight
    const weightedItems = [];
    availableItems.forEach(item => {
      const isNewItem = newItemsForCurrentLevel.includes(item.name);
      // New items appear twice in the array (2x weight)
      weightedItems.push(item);
      if (isNewItem) {
        weightedItems.push(item);  // Add again for 2x weight
      }
    });
    
    // Pick random item from weighted array
    const randomIndex = Math.floor(Math.random() * weightedItems.length);
    currentItem = weightedItems[randomIndex];
  }
  
  // Try to select image variant for this item
  updateCurrentItemImage();
  
  // Reset attempts for new item
  itemAttempts = 0;
  
  // Show educational message when new item appears
  showEducationalContent();
}

function showEducationalContent() {
  if (!currentItem) return;
  
  // Simple message: "Recycle this [item]!"
  educationalMessage = `Recycle this ${currentItem.name.toLowerCase()}!`;
  educationalTimer = educationalDuration;
}

function setupBins() {
  bins = [];
  const binWidth = 180;
  const binHeight = 100;
  const binY = canvas.height - binHeight - 72;
  const spacing = (canvas.width - (binWidth * 3)) / 4;
  
  if (phase === "category") {
    bins = [
      {
        x: spacing,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "Green",
        category: "green",
        color: "#4CAF50",
        info: CATEGORY_INFO.green
      },
      {
        x: spacing * 2 + binWidth,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "Orange",
        category: "orange",
        color: "#FF9800",
        info: CATEGORY_INFO.orange
      },
      {
        x: spacing * 3 + binWidth * 2,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "Red",
        category: "red",
        color: "#F44336",
        info: CATEGORY_INFO.red
      }
    ];
  } else if (phase === "code") {
    // Set up bins based on which category we're sorting codes for
    if (codePhaseCategory === "green") {
      // Green items: #1, #2 only (widely recyclable)
      const twoBinSpacing = (canvas.width - (binWidth * 2)) / 3;
      bins = [
        {
          x: twoBinSpacing,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#1 PET",
          code: 1,
          color: "#4CAF50",
          info: PLASTIC_CODE_INFO[1]
        },
        {
          x: twoBinSpacing * 2 + binWidth,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#2 HDPE",
          code: 2,
          color: "#4CAF50",
          info: PLASTIC_CODE_INFO[2]
        }
      ];
    } else if (codePhaseCategory === "orange") {
      // Orange items: #4, #5
      const twoBinSpacing = (canvas.width - (binWidth * 2)) / 3;
      bins = [
        {
          x: twoBinSpacing,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#4 LDPE",
          code: 4,
          color: "#FF9800",
          info: PLASTIC_CODE_INFO[4]
        },
        {
          x: twoBinSpacing * 2 + binWidth,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#5 PP",
          code: 5,
          color: "#FF9800",
          info: PLASTIC_CODE_INFO[5]
        }
      ];
    } else if (codePhaseCategory === "red") {
      // Red items: #3, #6, #7
      bins = [
        {
          x: spacing,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#3 PVC",
          code: 3,
          color: "#F44336",
          info: PLASTIC_CODE_INFO[3]
        },
        {
          x: spacing * 2 + binWidth,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#6 PS",
          code: 6,
          color: "#F44336",
          info: PLASTIC_CODE_INFO[6]
        },
        {
          x: spacing * 3 + binWidth * 2,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#7 Other",
          code: 7,
          color: "#F44336",
          info: PLASTIC_CODE_INFO[7]
        }
      ];
    }
  }
}

// Function to drop item into bin directly below when Enter is pressed
function dropIntoBinBelow() {
  if (!currentItem || bins.length === 0 || hasCollided) return;
  
  const itemCenterX = itemX + itemWidth / 2;
  
  // Find which bin the item is over
  for (const bin of bins) {
    if (itemCenterX >= bin.x && itemCenterX <= bin.x + bin.width) {
      // Move item 60 pixels deep into bin before triggering collision
      itemY = bin.y + 60 - itemHeight;
      hasCollided = true;
      checkBinCollision();
      break;
    }
  }
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
window.addEventListener("keydown", (e) => {
  // Handle new items popup dismissal
  if (showNewItemsPopup) {
    e.preventDefault();
    showNewItemsPopup = false;
    // If this was a merged popup (level 4+), turn off hints
    if (level >= 4 && showHints) {
      showHints = false;
    }
    return;
  }
  
  // Handle hints off popup dismissal
  if (showHintsOffPopup) {
    e.preventDefault();
    showHintsOffPopup = false;
    // Turn off hints after popup is dismissed
    if (level >= 4) {
      showHints = false;
    }
    return;
  }
  
  // Handle contamination popup dismissal
  if (showContaminationPopup) {
    e.preventDefault();
    showContaminationPopup = false;
    // Reset item after popup is dismissed so next item can fall
    if (currentItem) {
      resetItem();
      pickRandomItem();
    }
    return;
  }
  
  // Handle help panel dismissal
  if (showHelpPanel) {
    e.preventDefault();
    showHelpPanel = false;
    return;
  }
  
  // Handle tutorial navigation (but allow gameplay controls during interactive demo)
  if (tutorialActive) {
    const currentStep = tutorialSteps[tutorialStep];
    const isPlayingMode = currentStep && currentStep.interactive && tutorialSubStep >= 2;
    
    // During gameplay mode, allow normal game controls (don't intercept)
    if (isPlayingMode) {
      // Only handle Escape to skip, let everything else pass through to game
      if (e.key === "Escape") {
        e.preventDefault();
        skipTutorial();
        return;
      }
      // Let all other keys (including arrows) pass through to normal game handling
      // Don't return here, continue to normal game key handling below
    } else {
      // During tutorial panels, handle navigation
      // Special case: on explanation slide (substep 0), right arrow goes to gameplay
      if (currentStep && currentStep.interactive && tutorialSubStep === 0 && e.key === "ArrowRight") {
        e.preventDefault();
        tutorialSubStep = 2; // Go directly to gameplay
        return;
      }
      
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextTutorialStep();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousTutorialStep();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        skipTutorial();
        return;
      }
      // Don't process other keys during tutorial panels
      return;
    }
  }
  
  // Handle C key for decontamination (only if not in tutorial and not in decontamination game)
  if (!tutorialActive && !decontaminationActive && (e.key === "c" || e.key === "C")) {
    e.preventDefault();
    startDecontaminationForFirstContaminatedBin();
    return;
  }
  
  // Handle decontamination game controls
  if (decontaminationActive) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      keys.left = true;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      keys.right = true;
    }
    return;
  }
  
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowDown") keys.down = true;
  if (e.shiftKey) {
    e.preventDefault();
    keys.shift = true; // Speed up (3x faster while held)
  }
  if (e.key === " ") {
    e.preventDefault();
    keys.space = true;
    // Toggle pause (only if not in tutorial, popups, or decontamination game)
    if (!tutorialActive && !showHintsOffPopup && !showNewItemsPopup && !showContaminationPopup && !showHelpPanel && !decontaminationActive && !gameOver) {
      gamePaused = !gamePaused;
    }
  }
  if (e.key === "Enter") {
    e.preventDefault();
    keys.enter = true;
    // Instant drop - drop item into bin directly below
    dropIntoBinBelow();
  }
  if (e.key === "r" || e.key === "R") {
    // Restart game
    if (gameOver) {
      restartGame();
    }
  }
  if (e.key === "l" || e.key === "L") {
    // Toggle leaderboard
    showLeaderboard = !showLeaderboard;
    showPvP = false;  // Close PvP if open
  }
  if (e.key === "x" || e.key === "X") {
    // Toggle hints (only if not in tutorial, popups, popups, or decontamination game)
    if (!tutorialActive && !showHintsOffPopup && !showNewItemsPopup && !showContaminationPopup && !showHelpPanel && !decontaminationActive && !gameOver) {
      e.preventDefault();
      showHints = !showHints;
    }
  }
  if (e.key === "h" || e.key === "H") {
    // Toggle sound effects and hand visibility together
    e.preventDefault();
    soundEnabled = !soundEnabled;
    showHand = soundEnabled; // Keep hand visibility in sync with sound
  }
  if (e.key === "t" || e.key === "T") {
    // Restart tutorial (for testing/debugging)
    localStorage.removeItem('hasPlayedBefore');
    tutorialActive = true;
    tutorialStep = 0;
    processTutorialAction(tutorialSteps[0]);
    resetItem();
    phase = "category";
    setupBins();
  }
});

window.addEventListener("keyup", (e) => {
  // Handle decontamination game controls
  if (decontaminationActive) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      keys.left = false;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      keys.right = false;
    }
    return;
  }
  
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowDown") keys.down = false;
  if (!e.shiftKey) keys.shift = false;
  if (e.key === " ") {
    e.preventDefault();
    keys.space = false;
  }
  if (e.key === "Enter") keys.enter = false;
});

// Handle mouse wheel for help panel scrolling
window.addEventListener("wheel", (e) => {
  if (showHelpPanel) {
    e.preventDefault();
    const scrollAmount = 30; // Pixels to scroll per wheel event
    if (e.deltaY > 0) {
      // Scroll down
      helpPanelScrollY = Math.min(helpPanelScrollY + scrollAmount, Infinity); // Will be clamped in drawHelpPanel
    } else {
      // Scroll up
      helpPanelScrollY = Math.max(helpPanelScrollY - scrollAmount, 0);
    }
  }
});

// ============================================================================
// GAME LOGIC
// ============================================================================
function update() {
  // Pause game when paused, hints off popup, new items popup, contamination popup, or help panel is shown
  if (gamePaused || showHintsOffPopup || showNewItemsPopup || showContaminationPopup || showHelpPanel) {
    return; // Don't update game logic while paused or popup is shown
  }
  
  // Handle decontamination game separately
  if (decontaminationActive) {
    updateDecontaminationGame();
    return;
  }
  
  // Update decontamination cooldowns
  for (let category in decontaminationCooldowns) {
    if (decontaminationCooldowns[category] > 0) {
      decontaminationCooldowns[category]--;
      if (decontaminationCooldowns[category] === 0) {
        delete decontaminationCooldowns[category];
      }
    }
  }
  
  // Update timers
  if (messageTimer > 0) {
    messageTimer--;
    if (messageTimer === 0) message = "";
  }
  
  if (educationalTimer > 0) {
    educationalTimer--;
    if (educationalTimer === 0) educationalMessage = "";
  }
  
  // Update flash effect
  if (flashTimer > 0) {
    flashTimer--;
    if (flashTimer === 0) {
      flashColor = null;
    }
  }
  
  // Update bin bounce animation (correct answer)
  if (binBounceTimer > 0) {
    binBounceTimer--;
    if (binBounceTimer === 0) {
      bouncingBinIndex = -1; // Reset when animation ends
    }
  }
  
  // Update bin shake animation (incorrect answer)
  if (binShakeTimer > 0) {
    binShakeTimer--;
    if (binShakeTimer === 0) {
      shakingBinIndex = -1; // Reset when animation ends
    }
  }
  
  // Update contamination timer
  if (contaminationTimer > 0) {
    contaminationTimer--;
    if (contaminationTimer === 0) {
      greenBinContaminated = false;
    }
  }
  
  // Update level-based speed
  itemSpeedY = baseSpeedY * (1 + (level - 1) * 0.3);  // 30% faster per level
  
  // Update tutorial auto-advance timer
  if (tutorialActive && tutorialAutoAdvance) {
    tutorialAutoAdvanceTimer++;
    if (tutorialAutoAdvanceTimer >= tutorialAutoAdvanceDelay) {
      nextTutorialStep();
    }
  }
  
  // Don't update game if game over
  if (gameOver) {
    return;
  }
  
  // Don't update game logic during tutorial (unless interactive step in playing mode)
  if (tutorialActive) {
    const currentStep = tutorialSteps[tutorialStep];
    const isInteractive = currentStep && currentStep.interactive;
    const isPlayingMode = isInteractive && tutorialSubStep >= 2;
    
    // Still animate clouds during tutorial
    animationFrame++;
    cloudPositions.forEach(cloud => {
      cloud.x += 0.1;
      if (cloud.x > canvas.width + cloud.size) {
        cloud.x = -cloud.size;
      }
    });
    
    // Allow game to run only during interactive tutorial steps in playing mode (substep >= 2)
    if (!isPlayingMode) {
      return;
    }
    // Continue with game logic if in playing mode
  }
  
  // Don't update item position during transitions
  if (!isTransitioning) {
  // Handle horizontal movement
  const moveSpeed = 2;
  if (keys.left) {
    itemSpeedX = -moveSpeed;
  } else if (keys.right) {
    itemSpeedX = moveSpeed;
  } else {
    itemSpeedX = 0;
  }
  
  // Update item position
  itemX += itemSpeedX;
  
  // Keep item within canvas bounds
  if (itemX < 0) itemX = 0;
  if (itemX + itemWidth > canvas.width) itemX = canvas.width - itemWidth;
  
  // Handle fall speed
  let currentSpeedY = itemSpeedY;
  if (keys.shift) {
    // Shift = speed up (3x faster while held)
    currentSpeedY *= 3;
  } else if (keys.down) {
    // Down arrow = slightly faster
    currentSpeedY *= 1.5;
  }
  
  // Update vertical position
  // Continue falling even after collision detected, so item goes into bin visually
  itemY += currentSpeedY;
  
  // Check collision with bins (only once per item)
  // Item must go 60 pixels deep into the bin before collision is detected
  if (!hasCollided && bins.length > 0 && itemY + itemHeight >= bins[0].y + 60) {
    hasCollided = true;
    checkBinCollision();
  }
  
  // Reset if item falls off screen (adds to trash pile)
  if (itemY > canvas.height) {
      if (!tutorialActive) {
    addToTrashPile();
      }
    resetItem();
  }
  }
  
  // Animate clouds (move slowly to the right)
  animationFrame++;
  cloudPositions.forEach(cloud => {
    cloud.x += 0.1; // Slow movement
    // Wrap around when cloud goes off screen
    if (cloud.x > canvas.width + cloud.size) {
      cloud.x = -cloud.size;
    }
  });
}

function checkBinCollision() {
  const itemCenterX = itemX + itemWidth / 2;
  
  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (itemCenterX >= bin.x && itemCenterX <= bin.x + bin.width) {
      if (phase === "category") {
        if (bin.category === currentItem.category) {
          // Correct category!
          const categoryInfo = CATEGORY_INFO[currentItem.category];
          // Remove text message, keep educational message
          educationalMessage = `${currentItem.name} goes in the ${bin.label} bin! ${currentItem.description}`;
          
          // Play correct sound
          if (soundEnabled && correctSound) {
            correctSound.currentTime = 0; // Reset to start
            correctSound.play().catch(err => console.log('Could not play correct sound:', err));
          }
          
          // Flash green for correct answer
          flashColor = "green";
          flashTimer = flashDuration;
          
          // Start bin bounce animation for this specific bin
          binBounceTimer = binBounceDuration;
          bouncingBinIndex = i;
          
          // Check if this is tutorial interactive step
          if (tutorialActive && tutorialStep < tutorialSteps.length) {
            const currentStep = tutorialSteps[tutorialStep];
            if (currentStep.interactive && currentItem.name === "Water bottle" && bin.category === "green" && tutorialSubStep >= 2) {
              // Tutorial success! Advance to next tutorial step after bounce animation finishes
              const bounceDelayMs = (binBounceDuration / 60) * 1000;
              setTimeout(() => {
                nextTutorialStep();
                resetItem();
                phase = "category";
                setupBins();
              }, bounceDelayMs);
              return;
            }
          }
          
          // All items proceed to Phase 2 (code sorting)
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          // Set transition flag to prevent updates
          isTransitioning = true;
          
          // Wait for bin bounce animation to finish before transitioning to code phase
          const bounceDelayMs = (binBounceDuration / 60) * 1000;
          setTimeout(() => {
            phase = "code";
            codePhaseCategory = currentItem.category; // Remember which category we're sorting
            setupBins();
            itemX = canvas.width / 2 - itemWidth / 2;
            itemY = 180; // Start below the "Recycle this [item]!" text
            hasCollided = false;  // Reset collision flag for phase transition
            isTransitioning = false;  // End transition
            showEducationalContent();
          }, bounceDelayMs);
        } else {
          // Wrong bin - teach them!
          itemAttempts++;  // Increment attempts for wrong answer
          const correctInfo = CATEGORY_INFO[currentItem.category];
          const wrongInfo = bin.info;
          // Remove text message, keep educational message
          educationalMessage = `Hint: ${currentItem.name} is plastic #${currentItem.code}. It goes in the ${currentItem.category} bin! ${correctInfo.description}`;
          
          // Play incorrect sound
          if (soundEnabled && incorrectSound) {
            incorrectSound.currentTime = 0; // Reset to start
            incorrectSound.play().catch(err => console.log('Could not play incorrect sound:', err));
          }
          
          // Flash red for incorrect answer
          flashColor = "red";
          flashTimer = flashDuration;
          
          // Start bin shake animation for the incorrect bin
          binShakeTimer = binShakeDuration;
          shakingBinIndex = i;
          
          // Don't add to trash pile during tutorial
          if (!tutorialActive) {
            // Check for contamination: non-green items entering green bin, or red items entering orange/yellow bin
            const isContamination = (currentItem.category !== "green" && bin.category === "green") ||
                                   (currentItem.category === "red" && bin.category === "orange");
            
            if (isContamination) {
              // Increment contamination count for this specific bin
              if (!contaminationCounts[bin.category]) {
                contaminationCounts[bin.category] = 0;
              }
              contaminationCounts[bin.category]++;
              
              // Mark this bin as contaminated
              contaminatedBins.add(bin.category);
              if (bin.category === "green") {
            greenBinContaminated = true;
            contaminationTimer = contaminationDuration;
              }
              
              // Show contamination popup on first contamination
              if (!hasSeenContaminationPopup) {
                hasSeenContaminationPopup = true;
                // Wait for shake animations to finish before showing popup
                const shakeDelayMs = (binShakeDuration / 60) * 1000;
                setTimeout(() => {
                  showContaminationPopup = true;
                  // Don't reset item here - wait for popup dismissal
                }, shakeDelayMs);
              } else {
                // If popup already shown, reset item immediately
                resetItem();
              }
              
              // End game if this specific bin reaches 2 contaminations
              if (contaminationCounts[bin.category] >= 2) {
                setTimeout(() => {
                  endGame(false);
                  gameOverMessage = `Game Over!\nThe ${bin.category} bin is too contaminated.`;
                }, 1000);
              }
              // Don't add to trash pile for contamination
              // Don't reset item here - wait for popup or reset immediately if popup already shown
              messageTimer = messageDuration;
              educationalTimer = educationalDuration;
              return; // Exit early to prevent normal resetItem() call
            }
            // If recyclable plastic dropped into red/orange bin, add to trash pile
            else if (currentItem.category === "green" && (bin.category === "red" || bin.category === "orange")) {
            addToTrashPile();
          } else {
              addToTrashPile();  // Any other wrong bin adds to trash pile
            }
          }
          
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          resetItem();
        }
      } else if (phase === "code") {
        if (bin.code === currentItem.code) {
          // Correct code!
          const codeInfo = PLASTIC_CODE_INFO[currentItem.code];
          
          // Play correct sound
          if (soundEnabled && correctSound) {
            correctSound.currentTime = 0; // Reset to start
            correctSound.play().catch(err => console.log('Could not play correct sound:', err));
          }
          
          // Don't count score/level progression during tutorial
          if (!tutorialActive) {
          score++;
            
            // Only count level progression if this is the first try
            if (itemAttempts === 0) {
              // Track if this is a new item that was correctly sorted
              if (newItemsForCurrentLevel.includes(currentItem.name)) {
                newItemsSortedThisLevel.add(currentItem.name);
              }
          checkLevelProgression();
            }
          }
          
          // Remove text message, keep educational message
          educationalMessage = `Perfect! ${currentItem.name} is plastic #${currentItem.code} (${codeInfo.name}). ${codeInfo.common}!`;
          
          // Flash green for correct answer
          flashColor = "green";
          flashTimer = flashDuration;
          
          // Start bin bounce animation for this specific bin
          binBounceTimer = binBounceDuration;
          bouncingBinIndex = i;
          
          // Check if this is tutorial interactive step (code phase demo)
          if (tutorialActive && tutorialStep < tutorialSteps.length) {
            const currentStep = tutorialSteps[tutorialStep];
            if (currentStep.interactive && currentStep.action === "setItemCodePhase" && currentItem.name === "Water bottle" && bin.code === 1 && tutorialSubStep >= 2) {
              // Tutorial success! Advance to next tutorial step after bounce animation finishes
              const bounceDelayMs = (binBounceDuration / 60) * 1000;
              setTimeout(() => {
                nextTutorialStep();
                resetItem();
                phase = "category";
                codePhaseCategory = null;
                setupBins();
              }, bounceDelayMs);
              return;
            }
          }
          
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          // Wait for bin bounce animation to finish before transitioning back to category phase
          const bounceDelayMs = (binBounceDuration / 60) * 1000;
          setTimeout(() => {
          pickRandomItem();
          phase = "category";
          codePhaseCategory = null; // Reset category tracking
          setupBins();
          resetItem();
          hasCollided = false;  // Reset collision flag for new item
          }, bounceDelayMs);
        } else {
          // Wrong code - teach them!
          itemAttempts++;  // Increment attempts for wrong answer
          const correctInfo = PLASTIC_CODE_INFO[currentItem.code];
          // Remove text message, keep educational message
          educationalMessage = `Look at the number on the item! ${currentItem.name} is plastic #${currentItem.code} (${correctInfo.name}). You can do it!`;
          
          // Play incorrect sound
          if (soundEnabled && incorrectSound) {
            incorrectSound.currentTime = 0; // Reset to start
            incorrectSound.play().catch(err => console.log('Could not play incorrect sound:', err));
          }
          
          // Flash red for incorrect answer
          flashColor = "red";
          flashTimer = flashDuration;
          
          // Start bin shake animation for the incorrect bin
          binShakeTimer = binShakeDuration;
          shakingBinIndex = i;
          
          // Don't add to trash pile during tutorial
          if (!tutorialActive) {
          // Wrong code adds to trash pile
          addToTrashPile();
          }
          
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          resetItem();
        }
      }
      break;
    }
  }
}

function resetItem() {
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 180; // Start below the "Recycle this [item]!" text
  hasCollided = false;  // Reset collision flag
  // Don't reset itemAttempts here - only reset when new item is picked
}

// Add to trash pile when item is missed or incorrectly sorted
function addToTrashPile() {
  trashPileHeight += 5;  // Add 5% to trash pile
  if (trashPileHeight >= maxTrashPileHeight) {
    endGame(false);  // Game over - lose
  }
}

// End game (win or lose)
function endGame(won) {
  gameOver = true;
  if (won) {
    gameOverMessage = "Congratulations! You're a recycling champion!";
  } else {
    gameOverMessage =  "Game Over!\nThe tash pile got too high.";
  }
}

// Restart game
function restartGame() {
  gameOver = false;
  gameOverMessage = "";
  gamePaused = false;
  score = 0;
  level = 1;
  correctItemsThisLevel = 0;
  trashPileHeight = 0;
  greenBinContaminated = false;
  contaminationTimer = 0;
  contaminationCounts = {};
  contaminatedBins.clear();
  decontaminationActive = false;
  decontaminationBinCategory = null;
  decontaminationCooldowns = {};
  phase = "category";
  codePhaseCategory = null;
  itemSpeedY = baseSpeedY;
  hasCollided = false;
  isTransitioning = false;
  itemAttempts = 0;
  showHintsOffPopup = false;
  hintsOffPopupTimer = 0;
  showNewItemsPopup = false;
  showContaminationPopup = false;  // Reset contamination popup (but keep hasSeenContaminationPopup)
  newItemsSortedThisLevel.clear();
  binBounceTimer = 0;
  bouncingBinIndex = -1;
  binShakeTimer = 0;
  shakingBinIndex = -1;
  updateNewItemsForLevel();
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 180;
  setupBins();
  message = "";
  educationalMessage = "";
  messageTimer = 0;
  educationalTimer = 0;
}

// Check for level progression - need n correct items AND all new items sorted correctly
function checkLevelProgression() {
  correctItemsThisLevel++;
  
  // Check if all new items for current level have been sorted correctly
  const allNewItemsSorted = newItemsForCurrentLevel.length === 0 || 
                            newItemsForCurrentLevel.every(itemName => newItemsSortedThisLevel.has(itemName));
  
  // To go from level n to level n+1, you need:
  // 1. n correct items (first try only)
  // 2. All new items for current level sorted correctly (first try only)
  if (correctItemsThisLevel >= level && allNewItemsSorted) {
    const previousLevel = level;
    level++;
    correctItemsThisLevel = 0;  // Reset counter for next level
    newItemsSortedThisLevel.clear();  // Reset new items tracking
    
    // Update new items for the new level
    updateNewItemsForLevel();
    
    message = `Level ${level}! Items fall faster now!`;
    messageTimer = messageDuration;
    
    // Show popup for new items unlocked after bounce animation finishes
    // At level 4+, merge with hints-off message if hints are still on
    if (newItemsForCurrentLevel.length > 0 || (level >= 4 && showHints)) {
      // Wait for bin bounce animation to complete (convert frames to ms: ~667ms at 60fps)
      const bounceDelayMs = (binBounceDuration / 60) * 1000;
      setTimeout(() => {
        // If level 4+ and hints are on, show merged popup (new items popup will include hints message)
        // Otherwise just show new items popup
        if (level >= 4 && showHints && newItemsForCurrentLevel.length > 0) {
          showNewItemsPopup = true; // This will show merged popup
        } else if (level >= 4 && showHints) {
          // Level 4+ but no new items - just show hints-off popup
          showHintsOffPopup = true;
        } else if (newItemsForCurrentLevel.length > 0) {
          // New items but not level 4+ - show normal new items popup
          showNewItemsPopup = true;
        }
      }, bounceDelayMs);
    }
  }
}

// Update new items list when level changes
function updateNewItemsForLevel() {
  newItemsForCurrentLevel = ITEMS_BY_LEVEL[level] || [];
}

// ============================================================================
// DECONTAMINATION GAME
// ============================================================================
function startDecontaminationForFirstContaminatedBin() {
  // Find first contaminated bin
  for (let category of contaminatedBins) {
    if (contaminationCounts[category] && (!decontaminationCooldowns[category] || decontaminationCooldowns[category] === 0)) {
      startDecontaminationGame(category);
      return;
    }
  }
}

function startDecontaminationGame(category) {
  decontaminationActive = true;
  decontaminationBinCategory = category;
  decontaminationBinX = canvas.width / 2 - decontaminationBinWidth / 2;
  decontaminationBinY = canvas.height - 100;
  decontaminationItems = [];
  decontaminationSpawnTimer = 0;
  decontaminationSpawnOffset = 0; // Reset spawn offset
  decontaminationCorrectCount = 0;
  decontaminationWrongCount = 0;
}

function updateDecontaminationGame() {
  // Move bin left/right
  const moveSpeed = 5;
  if (keys.left) {
    decontaminationBinX = Math.max(0, decontaminationBinX - moveSpeed);
  }
  if (keys.right) {
    decontaminationBinX = Math.min(canvas.width - decontaminationBinWidth, decontaminationBinX + moveSpeed);
  }
  
  // Spawn new items from sides with arc motion
  decontaminationSpawnTimer++;
  if (decontaminationSpawnTimer >= decontaminationSpawnInterval) {
    decontaminationSpawnTimer = 0;
    
    // Get available items
    const availableItems = getAvailableItemsForLevel(level);
    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    
    // Determine if this item is correct for the bin category
    const isCorrect = randomItem.category === decontaminationBinCategory;
    
    // Get item image
    const itemImageData = itemImages[randomItem.name];
    let itemImage = null;
    if (itemImageData) {
      itemImage = Array.isArray(itemImageData) ? itemImageData[0] : itemImageData;
    }
    
    // Spawn from left or right side randomly
    const spawnFromLeft = Math.random() < 0.5;
    const startX = spawnFromLeft ? -80 : canvas.width;
    const startY = 50 + decontaminationSpawnOffset; // Start from top with offset
    
    // Calculate arc trajectory with randomized target point
    // All items must land in the middle 2 quadrants (25% to 75% of screen width)
    const minTargetX = canvas.width * 0.25; // 25% from left
    const maxTargetX = canvas.width * 0.75; // 75% from left
    const targetX = minTargetX + Math.random() * (maxTargetX - minTargetX);
    // Vary target Y position (some higher, some lower)
    const targetYVariation = (Math.random() - 0.5) * 100; // ±50px variation
    const targetY = canvas.height - 50 + targetYVariation;
    
    const distanceX = targetX - startX;
    const distanceY = targetY - startY;
    
    // Calculate velocities based on target distance for varied arc trajectories
    // Horizontal velocity (toward target) - slowed down 0.5x, varies with distance
    const baseVelocityX = Math.abs(distanceX) / 400;
    const velocityX = spawnFromLeft ? baseVelocityX : -baseVelocityX;
    
    // Initial vertical velocity varies based on throw distance and height
    // Longer throws need more upward velocity, shorter throws need less
    const throwDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const baseVerticalVelocity = -2.5;
    const distanceFactor = Math.min(throwDistance / 400, 1.5); // Scale up to 1.5x for longer throws
    const velocityY = baseVerticalVelocity * (0.7 + distanceFactor * 0.3); // Vary between 0.7x and 1.0x
    
    // Gravity for arc motion - slowed down 0.5x
    const gravity = 0.075;
    
    decontaminationItems.push({
      item: randomItem,
      x: startX,
      y: startY,
      width: 80,
      height: 80,
      image: itemImage,
      isCorrect: isCorrect,
      velocityX: velocityX,
      velocityY: velocityY,
      gravity: gravity
    });
    
    // Update spawn offset for next item (reduced spacing)
    decontaminationSpawnOffset = (decontaminationSpawnOffset + 30) % 60; // Cycle between 0-60px offset
  }
  
  // Update falling items with arc motion
  for (let i = decontaminationItems.length - 1; i >= 0; i--) {
    const item = decontaminationItems[i];
    
    // Apply arc physics
    item.x += item.velocityX;
    item.y += item.velocityY;
    item.velocityY += item.gravity; // Apply gravity for arc motion
    
    // Check collision with bin
    const binHeight = 80; // Medium height for decontamination game
    if (item.y + item.height >= decontaminationBinY && 
        item.y <= decontaminationBinY + binHeight &&
        item.x + item.width >= decontaminationBinX &&
        item.x <= decontaminationBinX + decontaminationBinWidth) {
      // Item collected!
      if (item.isCorrect) {
        decontaminationCorrectCount++;
      } else {
        decontaminationWrongCount++;
      }
      decontaminationItems.splice(i, 1);
      
      // Check win/lose conditions
      if (decontaminationCorrectCount >= decontaminationRequiredCorrect) {
        endDecontaminationGame(true);
        return;
      }
      if (decontaminationWrongCount >= decontaminationMaxWrong) {
        endDecontaminationGame(false);
        return;
      }
    }
    
    // Remove items that fall off screen (check both sides and bottom)
    if (item.y > canvas.height || (item.velocityX > 0 && item.x > canvas.width) || (item.velocityX < 0 && item.x < -80)) {
      decontaminationItems.splice(i, 1);
    }
  }
}

function endDecontaminationGame(success) {
  decontaminationActive = false;
  
  if (success) {
    // Decontaminate the bin
    contaminatedBins.delete(decontaminationBinCategory);
    delete contaminationCounts[decontaminationBinCategory];
    if (decontaminationBinCategory === "green") {
      greenBinContaminated = false;
    }
  } else {
    // Set cooldown
    decontaminationCooldowns[decontaminationBinCategory] = decontaminationCooldownDuration;
  }
  
  decontaminationBinCategory = null;
  decontaminationItems = [];
}

function renderDecontaminationGame() {
  // Draw sky gradient background (same as main game)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw clouds in background (same as main game)
  drawClouds();
  
  // Draw title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText(` ${decontaminationBinCategory.charAt(0).toUpperCase() + decontaminationBinCategory.slice(1)} decomtaminate bin asdf...`, canvas.width / 2, 50);
  
  // Draw instructions
  ctx.fillStyle = "#CCCCCC";
  ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.fillText("asdf ", canvas.width / 2, 90);
  
  // Draw progress
  ctx.fillStyle = "#4CAF50";
  ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Correct: ${decontaminationCorrectCount}/${decontaminationRequiredCorrect}`, 20, canvas.height - 60);
  
  ctx.fillStyle = "#F44336";
  ctx.fillText(`Wrong: ${decontaminationWrongCount}/${decontaminationMaxWrong}`, 20, canvas.height - 30);
  
  // Draw bin using green.png image (smaller size for decontamination game)
  const binHeight = 80; // Medium height for decontamination game
  if (greenBinImage && greenBinImage.complete && greenBinImage.naturalWidth > 0) {
    // Scale image by 1.5x while maintaining aspect ratio (smaller than main game's 2x)
    const imgAspectRatio = greenBinImage.width / greenBinImage.height;
    const baseWidth = decontaminationBinWidth * 1.5;
    const baseHeight = binHeight * 1.5;
    
    let drawWidth, drawHeight;
    
    // Calculate size maintaining aspect ratio at 1.5x scale
    if (imgAspectRatio > (baseWidth / baseHeight)) {
      // Image is wider - fit to width at 1.5x
      drawWidth = baseWidth;
      drawHeight = baseWidth / imgAspectRatio;
    } else {
      // Image is taller - fit to height at 1.5x
      drawHeight = baseHeight;
      drawWidth = baseHeight * imgAspectRatio;
    }
    
    // Center the scaled image
    const drawX = decontaminationBinX + (decontaminationBinWidth - drawWidth) / 2;
    const drawY = decontaminationBinY + (binHeight - drawHeight) / 2;
    
    // Draw the bin image
    ctx.drawImage(greenBinImage, drawX, drawY, drawWidth, drawHeight);
  } else {
    // Fallback to drawn bin if image not loaded
    const binColor = decontaminationBinCategory === "green" ? "#4CAF50" : 
                     decontaminationBinCategory === "orange" ? "#FF9800" : "#F44336";
    ctx.fillStyle = binColor;
    roundedRect(decontaminationBinX, decontaminationBinY, decontaminationBinWidth, binHeight, 8);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    roundedRect(decontaminationBinX, decontaminationBinY, decontaminationBinWidth, binHeight, 8);
    ctx.stroke();
  }
  
  // Draw falling items
  decontaminationItems.forEach(item => {
    if (item.image && item.image.complete && item.image.naturalWidth > 0) {
      const imgAspectRatio = item.image.width / item.image.height;
      let drawWidth = item.width;
      let drawHeight = item.height;
      
      if (imgAspectRatio > 1) {
        drawHeight = item.width / imgAspectRatio;
      } else {
        drawWidth = item.height * imgAspectRatio;
      }
      
      const drawX = item.x + (item.width - drawWidth) / 2;
      const drawY = item.y + (item.height - drawHeight) / 2;
      
      ctx.drawImage(item.image, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Fallback rectangle
      ctx.fillStyle = item.isCorrect ? "#4CAF50" : "#F44336";
      ctx.fillRect(item.x, item.y, item.width, item.height);
    }
  });
  
  ctx.textAlign = "left";
}

// ============================================================================
// RENDERING
// ============================================================================
// Helper function to draw rounded rectangles
function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTutorial() {
  if (!tutorialActive || tutorialStep >= tutorialSteps.length) return;
  
  const step = tutorialSteps[tutorialStep];
  
  // Handle substeps for interactive steps
  let currentSubStep = null;
  let showPanel = true;
  if (step.interactive && step.substeps) {
    currentSubStep = step.substeps[tutorialSubStep];
    // Hide panel when playing (substep 2)
    if (tutorialSubStep >= 2) {
      showPanel = false;
    }
  }
  
  // Don't draw panel if we're in playing mode
  if (!showPanel) {
    return;
  }
  
  // Calculate highlight area first
  let highlightX, highlightY, highlightWidth, highlightHeight, highlightRadius;
  
  if (step.highlight) {
    if (step.highlight.type === "bin" && bins.length > step.highlight.binIndex) {
      const bin = bins[step.highlight.binIndex];
      highlightX = bin.x + 16;  // 1px to the left (was +17, now +16)
      highlightY = bin.y - 57;  // 3px down (was -60, now -57)
      highlightWidth = bin.width - 27;  // 3px thinner on right side (unchanged)
      highlightHeight = bin.height + 110;  // 5px taller on bottom (was +105, now +110)
      highlightRadius = 10;
    } else if (step.highlight.type === "item") {
      // Use actual item position if available
      highlightX = (currentItem && itemX !== undefined) ? itemX - 5 : step.highlight.x - 5;
      highlightY = (currentItem && itemY !== undefined) ? itemY - 5 : step.highlight.y - 5;
      highlightWidth = itemWidth + 10;
      highlightHeight = itemHeight + 10;
      highlightRadius = 10;
    } else if (step.highlight.type === "location") {
      highlightX = step.highlight.x - 5;
      highlightY = step.highlight.y - 5;
      highlightWidth = step.highlight.width + 10;
      highlightHeight = step.highlight.height + 10;
      highlightRadius = 5;
    } else if (step.highlight.type === "score") {
      highlightX = step.highlight.x - 5;
      highlightY = step.highlight.y - 5;
      highlightWidth = step.highlight.width + 10;
      highlightHeight = step.highlight.height + 10;
      highlightRadius = 10;
    } else if (step.highlight.type === "bins") {
      // Calculate highlight based on actual bin positions
      if (bins.length > 0) {
        const firstBin = bins[0];
        const lastBin = bins[bins.length - 1];
        highlightX = -5;
        highlightY = firstBin.y - 80; // 20px taller on top (was -60, now -80)
        highlightWidth = canvas.width + 10;
        highlightHeight = (canvas.height - highlightY) + 5; // Extend to bottom of canvas
        highlightRadius = 10;
      } else {
        // Fallback to step coordinates
        highlightX = step.highlight.x - 5;
        highlightY = step.highlight.y - 5;
        highlightWidth = step.highlight.width + 10;
        highlightHeight = step.highlight.height + 10;
        highlightRadius = 10;
      }
    }
  }
  
  // Draw dark overlay in parts (around the highlight area)
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  
  if (step.highlight && highlightX !== undefined) {
    // Draw overlay in 4 rectangles around the highlight
    // Top
    ctx.fillRect(0, 0, canvas.width, highlightY);
    // Bottom
    ctx.fillRect(0, highlightY + highlightHeight, canvas.width, canvas.height - (highlightY + highlightHeight));
    // Left
    ctx.fillRect(0, highlightY, highlightX, highlightHeight);
    // Right
    ctx.fillRect(highlightX + highlightWidth, highlightY, canvas.width - (highlightX + highlightWidth), highlightHeight);
    
    // Draw highlight border
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    roundedRect(highlightX, highlightY, highlightWidth, highlightHeight, highlightRadius);
    ctx.stroke();
  } else {
    // No highlight - draw full overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw tutorial panel
  // All panels are the same size and centered vertically
  const isInteractive = step.interactive;
  const isFirstStep = tutorialStep === 0;
  const isReadyStep = isInteractive && currentSubStep && tutorialSubStep === 1;
  const isExplanationStep = isInteractive && tutorialSubStep === 0;
  const panelWidth = 700;  // Same width for all panels
  const panelHeight = 300;  // Same height for all panels (like "Try it" panels)
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;  // Always centered vertically
  
  // Panel background
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  // Panel border
  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Title - use substep title if available
  const displayTitle = currentSubStep ? currentSubStep.title : step.title;
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 28px 'Comic Sans MS', 'Trebuchet MS', Arial";  // Same size for all steps
  ctx.textAlign = "center";
  ctx.fillText(displayTitle, panelX + panelWidth / 2, panelY + 48);  // Better spacing from top
  
  // Text (with line breaks) - use substep text if available
  const displayText = currentSubStep ? currentSubStep.text : step.text;
  ctx.fillStyle = "#4A5568";
  ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";  // Same size for all steps
  ctx.textAlign = "left";
  const lines = displayText.split('\n');
  let textY = panelY + 90;  // Better spacing from title (42px gap)
  const lineHeight = 26;  // Uniform line height for all steps
  const textPadding = 40;  // Increased padding from sides
  lines.forEach(line => {
    const wrappedLines = wrapText(ctx, line, panelWidth - (textPadding * 2), 18);  // More padding
    wrappedLines.forEach(wrappedLine => {
      ctx.fillText(wrappedLine, panelX + textPadding, textY);
      textY += lineHeight;
    });
  });
  
  // Buttons (hide during interactive steps except skip)
  if (!isInteractive) {
    const buttonHeight = 38;
    const buttonWidth = 130;
    const buttonPadding = 24;  // Increased padding from edges
    const buttonBottomPadding = 24;  // Increased bottom padding
    
    // Skip button (top right) - smaller X button on first slide
    // Skip button - always use X button
    const skipBtnSize = 32;
    const skipBtnX = panelX + panelWidth - skipBtnSize - buttonPadding;
    const skipBtnY = panelY + buttonPadding;
    ctx.fillStyle = "#F44336";
    roundedRect(skipBtnX, skipBtnY, skipBtnSize, skipBtnSize, 6);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText("×", skipBtnX + skipBtnSize / 2, skipBtnY + skipBtnSize / 2 + 6);
    
    // Previous button (bottom left)
    const buttonY = panelY + panelHeight - buttonHeight - buttonBottomPadding;
    if (tutorialStep > 0) {
      const prevBtnX = panelX + buttonPadding;
      ctx.fillStyle = "#FF9800";
      roundedRect(prevBtnX, buttonY, buttonWidth, buttonHeight, 8);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Previous", prevBtnX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    }
    
    // Next button (bottom right) - green "Play" button on last step
    const nextBtnX = panelX + panelWidth - buttonWidth - buttonPadding;
    ctx.fillStyle = tutorialStep === tutorialSteps.length - 1 ? "#4CAF50" : "#2196F3";
    roundedRect(nextBtnX, buttonY, buttonWidth, buttonHeight, 8);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tutorialStep === tutorialSteps.length - 1 ? "Play" : "Next", nextBtnX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    
    // Step indicator (centered between the buttons)
    ctx.fillStyle = "#999";
    ctx.font = "14px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Step ${tutorialStep + 1} of ${tutorialSteps.length}`, panelX + panelWidth / 2, buttonY + buttonHeight / 2 + 5);
  } else {
    // Interactive step - show skip button and optionally Next button
    const buttonHeight = 38;
    const buttonWidth = 130;
    const buttonPadding = 24;  // Increased padding from edges
    const buttonBottomPadding = 24;  // Increased bottom padding
    
    // Skip button at top right - always use X button
    const skipBtnSize = 32;
    const skipBtnX = panelX + panelWidth - skipBtnSize - buttonPadding;
    const skipBtnY = panelY + buttonPadding;
    ctx.fillStyle = "#F44336";
    roundedRect(skipBtnX, skipBtnY, skipBtnSize, skipBtnSize, 6);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText("×", skipBtnX + skipBtnSize / 2, skipBtnY + skipBtnSize / 2 + 6);
    
    // Show "Try It Now" and "Previous" buttons on substep 0 (explanation)
    if (currentSubStep && tutorialSubStep === 0 && step.substeps) {
      const buttonY = panelY + panelHeight - buttonHeight - buttonBottomPadding;
      
      // Previous button (bottom left) - only show if not first tutorial step
      if (tutorialStep > 0) {
        const prevBtnX = panelX + buttonPadding;
        ctx.fillStyle = "#FF9800";
        roundedRect(prevBtnX, buttonY, buttonWidth, buttonHeight, 8);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("Previous", prevBtnX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
      }
      
      // Try It Now button (bottom right) - goes directly to gameplay
      const tryBtnX = panelX + panelWidth - buttonWidth - buttonPadding;
      ctx.fillStyle = "#4CAF50";
      roundedRect(tryBtnX, buttonY, buttonWidth, buttonHeight, 8);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Try It Now", tryBtnX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    }
    
    // Show "Try Now!" button on substep 1 (Ready? step) to start playing
    if (currentSubStep && tutorialSubStep === 1 && step.substeps && tutorialSubStep < step.substeps.length) {
      const nextBtnX = panelX + panelWidth - buttonWidth - buttonPadding;
      const nextBtnY = panelY + panelHeight - buttonHeight - buttonBottomPadding;
      ctx.fillStyle = "#4CAF50";
      roundedRect(nextBtnX, nextBtnY, buttonWidth, buttonHeight, 8);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Try Now!", nextBtnX + buttonWidth / 2, nextBtnY + buttonHeight / 2 + 5);
    }
  }
  
  ctx.textAlign = "left";
}

function drawNewItemsPopup() {
  // Draw dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get item data for new items
  const newItemsData = newItemsForCurrentLevel.map(itemName => {
    return ITEMS.find(item => item.name === itemName);
  }).filter(item => item !== undefined);
  
  // Check if this is level 4+ with hints being turned off (merged popup)
  const isMergedPopup = (level >= 4 && showHints);
  
  // Calculate grid layout (2 columns) - only if there are new items
  const itemsPerRow = 2;
  const rows = newItemsData.length > 0 ? Math.ceil(newItemsData.length / itemsPerRow) : 0;
  const itemImageSize = 80;
  const itemSpacing = 20;
  const itemPadding = 15;
  
  // Calculate panel dimensions
  const panelWidth = 600;
  const itemCellWidth = (panelWidth - (itemPadding * 2) - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;
  const itemCellHeight = itemImageSize + 50; // Image + text space
  // Add extra height if merged popup (for hints-off message)
  const extraHeight = isMergedPopup ? 60 : 0;
  // Base height: title + message + items grid (if any) + hints message (if merged) + continue text
  const baseHeight = 120;
  const itemsHeight = rows > 0 ? (rows * itemCellHeight) + (rows > 1 ? (rows - 1) * itemSpacing : 0) : 0;
  const panelHeight = baseHeight + itemsHeight + extraHeight;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;
  
  // Draw panel background
  ctx.fillStyle = "#FFFFFF";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  // Draw panel border
  ctx.strokeStyle = isMergedPopup ? "#FFD700" : "#4CAF50";
  ctx.lineWidth = 4;
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();
  
  // Draw title
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 28px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  if (isMergedPopup && newItemsData.length === 0) {
    // Level 4+ but no new items - just show congratulations
    ctx.fillText("Congratulations!", panelX + panelWidth / 2, panelY + 40);
  } else {
    ctx.fillText("New Items Unlocked!", panelX + panelWidth / 2, panelY + 40);
  }
  
  // Draw message (only if there are new items)
  if (newItemsData.length > 0) {
    ctx.fillStyle = "#4A5568";
    ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText("You can now sort:", panelX + panelWidth / 2, panelY + 75);
  }
  
  // Draw items in grid
  const startX = panelX + itemPadding;
  const startY = panelY + 105;
  
  newItemsData.forEach((item, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const cellX = startX + col * (itemCellWidth + itemSpacing);
    const cellY = startY + row * (itemCellHeight + itemSpacing);
    
    // Get item image
    const itemImageData = itemImages[item.name];
    let itemImage = null;
    if (itemImageData) {
      if (Array.isArray(itemImageData)) {
        // Use first variant for popup
        itemImage = itemImageData[0];
      } else {
        itemImage = itemImageData;
      }
    }
    
    // Draw item image
    if (itemImage && itemImage.complete && itemImage.naturalWidth > 0) {
      const imageX = cellX + (itemCellWidth - itemImageSize) / 2;
      const imageY = cellY;
      
      // Calculate aspect ratio to fit image
      const imgAspectRatio = itemImage.width / itemImage.height;
      let drawWidth = itemImageSize;
      let drawHeight = itemImageSize;
      
      if (imgAspectRatio > 1) {
        // Wider than tall
        drawHeight = itemImageSize / imgAspectRatio;
      } else {
        // Taller than wide
        drawWidth = itemImageSize * imgAspectRatio;
      }
      
      const drawX = imageX + (itemImageSize - drawWidth) / 2;
      const drawY = imageY + (itemImageSize - drawHeight) / 2;
      
      ctx.drawImage(itemImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Fallback: draw placeholder rectangle
      ctx.fillStyle = "#E2E8F0";
      ctx.fillRect(cellX + (itemCellWidth - itemImageSize) / 2, cellY, itemImageSize, itemImageSize);
    }
    
    // Draw item name
    ctx.fillStyle = "#2D3748";
    ctx.font = "bold 14px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.name, cellX + itemCellWidth / 2, cellY + itemImageSize + 18);
    
    // Draw code number with category color
    let codeColor = "#2D3748"; // Default
    if (item.category === "green") {
      codeColor = "#4CAF50";
    } else if (item.category === "orange") {
      codeColor = "#FF9800";
    } else if (item.category === "red") {
      codeColor = "#F44336";
    }
    
    ctx.fillStyle = codeColor;
    ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(`#${item.code}`, cellX + itemCellWidth / 2, cellY + itemImageSize + 38);
  });
  
  // Draw hints-off message if merged popup (level 4+)
  if (isMergedPopup) {
    // Position message after items (or after title if no items)
    const itemsHeight = rows > 0 ? (rows * itemCellHeight) + (rows > 1 ? (rows - 1) * itemSpacing : 0) : 0;
    const messageY = panelY + (newItemsData.length > 0 ? 120 + itemsHeight + 10 : 80);
    ctx.fillStyle = "#4A5568";
    ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText("You're turning into an expert recycler! Turning off hints....", panelX + panelWidth / 2, messageY);
  }
  
  // Draw "press any key to continue" text at bottom
  ctx.fillStyle = "#718096";
  ctx.font = "16px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press any key to continue", panelX + panelWidth / 2, panelY + panelHeight - 20);
  
  ctx.textAlign = "left";
}

function drawHintsOffPopup() {
  // Draw dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw popup panel
  const panelWidth = 500;
  const panelHeight = 200;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;
  
  // Draw panel background
  ctx.fillStyle = "#FFFFFF";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  // Draw panel border
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 4;
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();
  
  // Draw title
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 28px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Congratulations!", panelX + panelWidth / 2, panelY + 50);
  
  // Draw message
  ctx.fillStyle = "#4A5568";
  ctx.font = "20px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("You're turning into an expert recycler!", panelX + panelWidth / 2, panelY + 90);
  ctx.fillText("Turning off hints...", panelX + panelWidth / 2, panelY + 120);
  
  // Draw "press any key to continue" text at bottom
  ctx.fillStyle = "#718096";
  ctx.font = "16px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press any key to continue", panelX + panelWidth / 2, panelY + panelHeight - 20);
  
  ctx.textAlign = "left";
}

function drawContaminationPopup() {
  // Draw dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw popup panel (similar to tutorial style)
  const panelWidth = 600;
  const panelHeight = 300;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;
  
  // Draw panel background
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  // Draw panel border (red for contamination)
  ctx.strokeStyle = "#F44336";
  ctx.lineWidth = 4;
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();
  
  // Draw title
  ctx.fillStyle = "#F44336";
  ctx.font = "bold 28px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Contamination Alert!", panelX + panelWidth / 2, panelY + 40);
  
  // Draw message with line breaks
  ctx.fillStyle = "#4A5568";
  ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  const messageLines = [
    "Putting the wrong item in a bin causes CONTAMINATION!",
    "",
    "This ruins entire batches of recyclables!",
    "",
    "After 2 contaminations in any given bin, you lose!."
  ];
  
  let textY = panelY + 80;
  const lineHeight = 26;
  messageLines.forEach(line => {
    if (line === "") {
      textY += lineHeight / 2; // Add spacing for empty lines
    } else {
      const wrappedLines = wrapText(ctx, line, panelWidth - 60, 18);
      wrappedLines.forEach(wrappedLine => {
        ctx.fillText(wrappedLine, panelX + 30, textY);
        textY += lineHeight;
      });
    }
  });
  
  // Draw "press any key to continue" text at bottom
  ctx.fillStyle = "#718096";
  ctx.font = "16px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press any key or click to continue", panelX + panelWidth / 2, panelY + panelHeight - 20);
  
  ctx.textAlign = "left";
}

function drawHelpPanel() {
  // Draw dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get all available items for current level
  const availableItems = getAvailableItemsForLevel(level);
  const itemsPerRow = 3;
  const rows = Math.ceil(availableItems.length / itemsPerRow);
  const itemImageSize = 80;
  const itemSpacing = 20;
  const itemPadding = 20;
  
  // Calculate panel dimensions (fixed size)
  const panelWidth = 600;
  const fixedPanelHeight = 500; // Fixed height
  const itemCellWidth = (panelWidth - (itemPadding * 2) - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;
  const itemCellHeight = itemImageSize + 60; // Image + text space
  const controlsHeight = 90;
  const gridTitleHeight = 30;
  const footerHeight = 40;
  const contentPadding = 20;
  
  // Calculate content area
  const contentStartY = 100 + controlsHeight + gridTitleHeight;
  const contentAreaHeight = fixedPanelHeight - contentStartY - footerHeight;
  const totalContentHeight = rows * itemCellHeight + (rows > 1 ? (rows - 1) * itemSpacing : 0);
  const needsScroll = totalContentHeight > contentAreaHeight;
  
  // Clamp scroll position
  const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);
  helpPanelScrollY = Math.max(0, Math.min(helpPanelScrollY, maxScroll));
  
  const panelHeight = fixedPanelHeight;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;
  
  // Draw panel background
  ctx.fillStyle = "#FFFFFF";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  // Draw panel border
  ctx.strokeStyle = "#2196F3";
  ctx.lineWidth = 4;
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.stroke();
  
  // Draw title
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 28px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Help & Controls", panelX + panelWidth / 2, panelY + 40);
  
  // Draw controls section
  ctx.fillStyle = "#4A5568";
  ctx.font = "bold 18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  ctx.fillText("Controls:", panelX + itemPadding, panelY + 70);
  
  ctx.fillStyle = "#4A5568";
  ctx.font = "16px 'Comic Sans MS', 'Trebuchet MS', Arial";
  const controlsY = panelY + 90;
  ctx.fillText("Arrow Keys: Move | ENTER: Drop | SHIFT: Speed up", panelX + itemPadding, controlsY);
  ctx.fillText("SPACE: Pause | X: Toggle hints", panelX + itemPadding, controlsY + 20);
  
  // Draw plastics grid title
  const gridTitleY = panelY + 100 + controlsHeight;
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.fillText("Available Plastics:", panelX + itemPadding, gridTitleY);
  
  // Set up clipping for scrollable content area
  const contentAreaY = gridTitleY + 30;
  const contentAreaX = panelX + itemPadding;
  const contentAreaWidth = panelWidth - (itemPadding * 2) - (needsScroll ? 20 : 0); // Reserve space for scrollbar
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(contentAreaX, contentAreaY, contentAreaWidth, contentAreaHeight);
  ctx.clip();
  
  // Draw items in grid (only visible ones)
  const startX = contentAreaX;
  const startY = contentAreaY - helpPanelScrollY;
  
  availableItems.forEach((item, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const cellX = startX + col * (itemCellWidth + itemSpacing);
    const cellY = startY + row * (itemCellHeight + itemSpacing);
    
    // Skip items that are outside the visible area
    if (cellY + itemCellHeight < contentAreaY || cellY > contentAreaY + contentAreaHeight) {
      return;
    }
    
    // Get item image
    const itemImageData = itemImages[item.name];
    let itemImage = null;
    if (itemImageData) {
      if (Array.isArray(itemImageData)) {
        itemImage = itemImageData[0]; // Use first variant
      } else {
        itemImage = itemImageData;
      }
    }
    
    // Draw item image
    if (itemImage && itemImage.complete && itemImage.naturalWidth > 0) {
      const imageX = cellX + (itemCellWidth - itemImageSize) / 2;
      const imageY = cellY;
      
      // Calculate aspect ratio to fit image
      const imgAspectRatio = itemImage.width / itemImage.height;
      let drawWidth = itemImageSize;
      let drawHeight = itemImageSize;
      
      if (imgAspectRatio > 1) {
        drawHeight = itemImageSize / imgAspectRatio;
      } else {
        drawWidth = itemImageSize * imgAspectRatio;
      }
      
      const drawX = imageX + (itemImageSize - drawWidth) / 2;
      const drawY = imageY + (itemImageSize - drawHeight) / 2;
      
      ctx.drawImage(itemImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Fallback: draw placeholder rectangle
      ctx.fillStyle = "#E2E8F0";
      ctx.fillRect(cellX + (itemCellWidth - itemImageSize) / 2, cellY, itemImageSize, itemImageSize);
    }
    
    // Draw item name
    ctx.fillStyle = "#2D3748";
    ctx.font = "bold 14px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.name, cellX + itemCellWidth / 2, cellY + itemImageSize + 18);
    
    // Draw code number with category color
    let codeColor = "#2D3748";
    if (item.category === "green") {
      codeColor = "#4CAF50";
    } else if (item.category === "orange") {
      codeColor = "#FF9800";
    } else if (item.category === "red") {
      codeColor = "#F44336";
    }
    
    ctx.fillStyle = codeColor;
    ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(`#${item.code}`, cellX + itemCellWidth / 2, cellY + itemImageSize + 38);
  });
  
  ctx.restore();
  
  // Draw scrollbar if needed
  if (needsScroll) {
    const scrollbarWidth = 12;
    const scrollbarX = panelX + panelWidth - itemPadding - scrollbarWidth;
    const scrollbarTrackHeight = contentAreaHeight;
    const scrollbarThumbHeight = (contentAreaHeight / totalContentHeight) * scrollbarTrackHeight;
    const scrollbarThumbY = contentAreaY + (helpPanelScrollY / totalContentHeight) * scrollbarTrackHeight;
    
    // Draw scrollbar track
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(scrollbarX, contentAreaY, scrollbarWidth, scrollbarTrackHeight);
    
    // Draw scrollbar thumb
    ctx.fillStyle = "#A0AEC0";
    ctx.fillRect(scrollbarX + 2, scrollbarThumbY, scrollbarWidth - 4, scrollbarThumbHeight);
    
    // Draw scrollbar thumb border
    ctx.strokeStyle = "#718096";
    ctx.lineWidth = 1;
    ctx.strokeRect(scrollbarX + 2, scrollbarThumbY, scrollbarWidth - 4, scrollbarThumbHeight);
  }
  
  // Draw "press any key to continue" text at bottom
  ctx.fillStyle = "#718096";
  ctx.font = "16px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press any key or click to close", panelX + panelWidth / 2, panelY + panelHeight - 20);
  
  ctx.textAlign = "left";
}

function render() {
  // Render decontamination game if active (separate from main game)
  if (decontaminationActive) {
    renderDecontaminationGame();
    return;
  }
  
  // Draw sky gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw clouds in background
  drawClouds();
  
  // Draw educational header
  drawEducationalHeader();
  
  // Draw friendly header with rounded background
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  roundedRect(10, 10, canvas.width - 20, 50, 15);
  ctx.fill();
  
  // Draw location text (left side)
  ctx.fillStyle = "#666";
  ctx.font = "14px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  ctx.fillText(gameLocation, 25, 42);
  
  // Draw Level indicator (left-center)
  const levelX = 200;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  roundedRect(levelX, 20, 80, 30, 8);
  ctx.fill();
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 14px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Level ${level}`, levelX + 40, 40);
  ctx.textAlign = "left";
  
  // Draw Leaderboard button (center-left)
  const leaderboardBtnX = 300;
  const leaderboardBtnY = 20;
  const leaderboardBtnWidth = 90;
  const leaderboardBtnHeight = 30;
  ctx.fillStyle = showLeaderboard ? "#4CAF50" : "rgba(255, 255, 255, 0.9)";
  roundedRect(leaderboardBtnX, leaderboardBtnY, leaderboardBtnWidth, leaderboardBtnHeight, 8);
  ctx.fill();
  ctx.fillStyle = showLeaderboard ? "#FFFFFF" : "#2D3748";
  ctx.font = "bold 12px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Leaderboard", leaderboardBtnX + leaderboardBtnWidth / 2, leaderboardBtnY + leaderboardBtnHeight / 2 + 4);
  ctx.textAlign = "left";
  
  // Draw PvP button (center-right)
  const pvpBtnX = 400;
  const pvpBtnY = 20;
  const pvpBtnWidth = 70;
  const pvpBtnHeight = 30;
  ctx.fillStyle = showPvP ? "#2196F3" : "rgba(255, 255, 255, 0.9)";
  roundedRect(pvpBtnX, pvpBtnY, pvpBtnWidth, pvpBtnHeight, 8);
  ctx.fill();
  ctx.fillStyle = showPvP ? "#FFFFFF" : "#2D3748";
  ctx.font = "bold 12px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("PvP", pvpBtnX + pvpBtnWidth / 2, pvpBtnY + pvpBtnHeight / 2 + 4);
  ctx.textAlign = "left";
  
  // Draw info button (circular icon) - positioned before score
  const infoButtonX = canvas.width - 160;
  const infoButtonY = 30 + 4;
  const infoButtonRadius = 18 * 0.7; // Scaled down by 0.7
  
  ctx.fillStyle = "#2196F3";
  ctx.beginPath();
  ctx.arc(infoButtonX, infoButtonY, infoButtonRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw "i" icon
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 14px 'Comic Sans MS', 'Trebuchet MS', Arial"; // Scaled down font
  ctx.textAlign = "center";
  ctx.fillText("i", infoButtonX, infoButtonY + 4); // Adjusted vertical offset
  ctx.textAlign = "left";
  
  // Draw score badge (right side)
  ctx.fillStyle = "#FFD700";
  roundedRect(canvas.width - 140, 15, 120, 40, 20);
  ctx.fill();
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Score: ${score}`, canvas.width - 80, 40);
  ctx.textAlign = "left";
  
  // Draw educational message in friendly speech bubble (with proper spacing)
  if (educationalMessage) {
    drawSpeechBubble(educationalMessage, canvas.width / 2, 90, canvas.width - 60);
  }
  
  // Removed feedback message - using visual animations instead
  // (bin bounce for correct, bin shake + screen shake for incorrect)
  
  
  // Draw item FIRST (so it appears behind bins when overlapping)
  // Draw item even when it's going into the bin (up to 60 pixels deep)
  // Don't draw item during transitions
  if (currentItem && !isTransitioning) {
    let shouldDrawItem = true;
    if (bins.length > 0) {
      const binTop = bins[0].y;
      const itemBottom = itemY + itemHeight;
      // Only hide item if it's gone too deep (more than 60 pixels into bin)
      if (itemBottom > binTop + 60) {
        shouldDrawItem = false;
      }
    }
    
    // Draw item if it should be visible
    if (shouldDrawItem) {
      drawItem();
    }
  }
  
  // Draw bins AFTER items (so bins appear on top, like items going into them)
  for (let i = 0; i < bins.length; i++) {
    drawBin(bins[i], i);
  }
  
  // Draw flash effect overlay on top of everything
  if (flashColor === "green") {
    // Green flash for correct
    const alpha = flashTimer / flashDuration; // Fade out
    ctx.fillStyle = `rgba(76, 175, 80, ${0.4 * alpha})`; // Green with fade
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (flashColor === "red") {
    // Red flash for incorrect
    const alpha = flashTimer / flashDuration; // Fade out
    ctx.fillStyle = `rgba(244, 67, 54, ${0.4 * alpha})`; // Red with fade
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw trash percentage in bottom left corner
  if (!tutorialActive && !decontaminationActive) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Trash: ${Math.round(trashPileHeight)}%`, 15, canvas.height - 15);
  }
  
  // Draw fake leaderboard if shown
  if (showLeaderboard) {
    drawFakeLeaderboard();
  }
  
  // Draw fake PvP if shown
  if (showPvP) {
    drawFakePvP();
  }
  
  // Draw hand image (only during normal gameplay and if visible)
  if (showHand && handImage && handImage.complete && handImage.naturalWidth > 0 && !tutorialActive && !gameOver && !decontaminationActive) {
    const handWidth = 300;  // Scaled down 2x from 600
    const handHeight = 300;  // Scaled down 2x from 600
    const handX = canvas.width - handWidth;  // Right edge of screen
    const handY = canvas.height / 25;  // Centered vertically
    ctx.drawImage(handImage, handX, handY, handWidth, handHeight);
  }
  
  // Draw pause overlay
  if (gamePaused && !gameOver && !tutorialActive && !decontaminationActive) {
    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pause text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = "#CCCCCC";
    ctx.font = "24px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.fillText("Press SPACE to resume", canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = "left";
  }
  
  // Draw game over screen
  if (gameOver) {
    drawGameOverScreen();
  }
  
  // Draw question mark help button (only if tutorial not active)
  if (!tutorialActive) {
    const helpBtnSize = 40;
    const helpBtnX = canvas.width - helpBtnSize - 15;
    const helpBtnY = canvas.height - helpBtnSize - 15;
    
    // Draw button background
    ctx.fillStyle = showHelpPanel ? "#4CAF50" : "rgba(255, 255, 255, 0.9)";
    roundedRect(helpBtnX, helpBtnY, helpBtnSize, helpBtnSize, 8);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 2;
    roundedRect(helpBtnX, helpBtnY, helpBtnSize, helpBtnSize, 8);
    ctx.stroke();
    
    // Draw question mark
    ctx.fillStyle = showHelpPanel ? "#FFFFFF" : "#2196F3";
    ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", helpBtnX + helpBtnSize / 2, helpBtnY + helpBtnSize / 2 + 8);
  ctx.textAlign = "left";
  }
  
  // Draw new items popup (on top of everything except tutorial)
  if (showNewItemsPopup) {
    drawNewItemsPopup();
  }
  
  // Draw hints off popup (on top of everything except tutorial)
  if (showHintsOffPopup) {
    drawHintsOffPopup();
  }
  
  // Draw contamination popup (on top of everything except tutorial)
  if (showContaminationPopup) {
    drawContaminationPopup();
  }
  
  // Draw help panel (on top of everything except tutorial)
  if (showHelpPanel) {
    drawHelpPanel();
  }
  
  // Draw tutorial overlay (on top of everything)
  if (tutorialActive) {
    drawTutorial();
  }
  
  // Restore canvas transform (undo screen shake)
  ctx.restore();
}

function drawTrashPile() {
  if (trashPileHeight <= 0) return;
  
  const pileX = 20;
  const pileY = canvas.height - 40;
  const pileWidth = 120;
  const pileHeight = (trashPileHeight / maxTrashPileHeight) * 200;  // Max height 200px
  const actualPileY = pileY - pileHeight;
  
  // Helper function for seeded random based on index
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  // Draw base trash pile with irregular shape
  ctx.fillStyle = "#4A3428";
  ctx.beginPath();
  ctx.moveTo(pileX, pileY);
  ctx.lineTo(pileX + pileWidth, pileY);
  // Create irregular top edge
  const topPoints = 8;
  for (let i = 0; i <= topPoints; i++) {
    const t = i / topPoints;
    const x = pileX + pileWidth - (pileWidth - 20) * t - 10;
    const y = actualPileY + Math.sin(t * Math.PI * 3 + animationFrame * 0.1) * 8 + seededRandom(i * 5) * 5;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(pileX + 10, actualPileY);
  ctx.closePath();
  ctx.fill();
  
  // Add darker shadow/overlap areas
  ctx.fillStyle = "#3D2A1F";
  ctx.beginPath();
  ctx.moveTo(pileX + 5, pileY);
  ctx.lineTo(pileX + pileWidth - 5, pileY);
  ctx.lineTo(pileX + pileWidth - 15, actualPileY + 10);
  ctx.lineTo(pileX + 15, actualPileY + 10);
  ctx.closePath();
  ctx.fill();
  
  // Add various trash items sticking out with different shapes and colors
  const trashColors = ["#6B4423", "#8D6E63", "#5D4037", "#795548", "#6D4C41", "#8B6F47"];
  
  // Generate consistent trash items
  for (let i = 0; i < 12; i++) {
    const seed = i * 7 + trashPileHeight;
    const baseX = pileX + seededRandom(seed) * pileWidth;
    const baseY = actualPileY + seededRandom(seed + 1) * pileHeight;
    const size = 8 + seededRandom(seed + 2) * 15;
    const shapeType = Math.floor(seededRandom(seed + 3) * 3);
    const color = trashColors[Math.floor(seededRandom(seed + 4) * trashColors.length)];
    
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(seededRandom(seed + 5) * Math.PI * 0.5);
    
    if (shapeType === 0) {
      // Rectangular trash
      ctx.fillRect(-size/2, -size/3, size, size * 0.6);
    } else if (shapeType === 1) {
      // Circular trash
      ctx.beginPath();
      ctx.arc(0, 0, size/2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Triangular trash
      ctx.beginPath();
      ctx.moveTo(0, -size/2);
      ctx.lineTo(-size/2, size/2);
      ctx.lineTo(size/2, size/2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Add some plastic bottles/cans sticking out
  for (let i = 0; i < 4; i++) {
    const seed = i * 11 + trashPileHeight;
    const bottleX = pileX + 15 + i * 25 + Math.sin(i + animationFrame * 0.05) * 8;
    const bottleY = actualPileY - 5 + Math.cos(i) * 3;
    const bottleHeight = 20 + seededRandom(seed) * 10;
    const bottleWidth = 8 + seededRandom(seed + 1) * 4;
    
    // Bottle body
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(bottleX - bottleWidth/2, bottleY, bottleWidth, bottleHeight);
    
    // Bottle top
    ctx.fillStyle = "#6B5B47";
    ctx.fillRect(bottleX - bottleWidth/2 - 1, bottleY, bottleWidth + 2, 3);
  }
  
  // Add texture with consistent dark spots
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  for (let i = 0; i < 15; i++) {
    const seed = i * 13 + trashPileHeight;
    const spotX = pileX + seededRandom(seed) * pileWidth;
    const spotY = actualPileY + seededRandom(seed + 1) * pileHeight;
    const spotSize = 3 + seededRandom(seed + 2) * 5;
    ctx.beginPath();
    ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw trash pile label with background
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  roundedRect(pileX - 2, actualPileY - 22, 100, 18, 4);
  ctx.fill();
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Trash: ${Math.round(trashPileHeight)}%`, pileX + 2, actualPileY - 8);
}


function drawFakeLeaderboard() {
  const panelX = canvas.width / 2 - 200;
  const panelY = canvas.height / 2 - 150;
  const panelWidth = 400;
  const panelHeight = 300;
  
  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Title
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("Top Recyclers", panelX + panelWidth / 2, panelY + 35);
  
  // Fake scores
  const fakeScores = [
    { name: "EcoHero123", score: 847 },
    { name: "GreenGamer", score: 723 },
    { name: "RecycleKing", score: 689 },
    { name: "You", score: score },
    { name: "Taylor Swift", score: -150 },
    { name: "Elon Musk", score: -200 }
  ].sort((a, b) => b.score - a.score);
  
  ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  let yPos = panelY + 80;
  fakeScores.forEach((entry, index) => {
    const isYou = entry.name === "You";
    const isNegativeScore = entry.name === "Taylor Swift" || entry.name === "Elon Musk";
    ctx.fillStyle = isYou ? "#4CAF50" : "#2D3748";
    ctx.textAlign = "left";
    ctx.fillText(`${index + 1}. ${entry.name}`, panelX + 30, yPos);
    ctx.textAlign = "right";
    ctx.fillStyle = isNegativeScore ? "#F44336" : (isYou ? "#4CAF50" : "#2D3748");
    ctx.fillText(`${entry.score}`, panelX + panelWidth - 30, yPos);
    yPos += 35;
  });
  
  ctx.textAlign = "left";
}

function drawFakePvP() {
  const panelX = canvas.width / 2 - 200;
  const panelY = canvas.height / 2 - 100;
  const panelWidth = 400;
  const panelHeight = 200;
  
  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  ctx.strokeStyle = "#2196F3";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Title
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText("PvP Match", panelX + panelWidth / 2, panelY + 35);
  
  // Fake opponent
  ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#2196F3";
  ctx.fillText("Opponent: RecycleMaster", panelX + 30, panelY + 80);
  ctx.fillText(`Score: ${score + 15}`, panelX + 30, panelY + 110);
  
  ctx.fillStyle = "#4CAF50";
  ctx.fillText("You", panelX + 30, panelY + 140);
  ctx.fillText(`Score: ${score}`, panelX + 30, panelY + 170);
  
  ctx.textAlign = "left";
}

function drawGameOverScreen() {
  // Dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Game over panel
  const panelX = canvas.width / 2 - 250;
  const panelY = canvas.height / 2 - 100;
  const panelWidth = 500;
  const panelHeight = 200;
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();
  
  ctx.strokeStyle = "#F44336";
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Message (handle multiple lines)
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  const messageLines = gameOverMessage.split('\n');
  let messageY = panelY + 60;
  messageLines.forEach(line => {
    ctx.fillText(line, panelX + panelWidth / 2, messageY);
    messageY += 30;
  });
  
  ctx.font = "18px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.fillText(`Final Score: ${score} | Level: ${level}`, panelX + panelWidth / 2, panelY + 120);
  ctx.fillText("Press R to restart", panelX + panelWidth / 2, panelY + 160);
  
  ctx.textAlign = "left";
}

function drawClouds() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  // Draw clouds using animated positions
  cloudPositions.forEach(cloud => {
    drawCloud(cloud.x, cloud.y, cloud.size);
  });
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
  ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.7, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpeechBubble(text, x, y, maxWidth) {
  const lines = wrapText(ctx, text, maxWidth, 15);
  const padding = 12;
  const lineHeight = 18;
  const bubbleHeight = lines.length * lineHeight + padding * 2;
  const bubbleWidth = maxWidth + padding * 2;
  
  const bubbleX = x - bubbleWidth / 2;
  const bubbleY = y - bubbleHeight / 2;
  
  // Draw bubble with rounded corners
  ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
  roundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
  ctx.fill();
  
  // Add border
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw text
  ctx.fillStyle = "#2D3748";
  ctx.font = "15px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  let yPos = bubbleY + padding + 15;
  for (const line of lines) {
    ctx.fillText(line, x, yPos);
    yPos += lineHeight;
  }
  ctx.textAlign = "left";
}

function drawEducationalHeader() {
  // Draw category legend if in category phase (positioned to avoid overlap)
  // Simplified - removed to reduce clutter
  // Hints are now only shown in bins
}

// Draw recycling symbol (3 chasing arrows)
function drawRecyclingSymbol(x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.25;
  const arrowLength = size * 0.2;
  
  // Draw 3 curved arrows forming a triangle
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i * Math.PI * 2) / 3 - Math.PI / 6);
    
    ctx.beginPath();
    
    // Start from inner radius
    const startAngle = Math.PI / 3;
    const endAngle = Math.PI / 3 + Math.PI * 2 / 3;
    
    // Outer arc (curved part of arrow)
    ctx.arc(0, 0, outerRadius, startAngle, endAngle);
    
    // Arrow head at the end
    const tipAngle = endAngle;
    const tipX = Math.cos(tipAngle) * outerRadius;
    const tipY = Math.sin(tipAngle) * outerRadius;
    
    // Draw arrow head pointing outward
    const arrowAngle1 = tipAngle + Math.PI / 2;
    const arrowAngle2 = tipAngle - Math.PI / 2;
    
    ctx.lineTo(
      tipX + Math.cos(arrowAngle1) * arrowLength,
      tipY + Math.sin(arrowAngle1) * arrowLength
    );
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX + Math.cos(arrowAngle2) * arrowLength,
      tipY + Math.sin(arrowAngle2) * arrowLength
    );
    
    ctx.stroke();
    
    // Fill arrow head
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX + Math.cos(arrowAngle1) * arrowLength,
      tipY + Math.sin(arrowAngle1) * arrowLength
    );
    ctx.lineTo(
      tipX + Math.cos(arrowAngle2) * arrowLength,
      tipY + Math.sin(arrowAngle2) * arrowLength
    );
    ctx.closePath();
    ctx.fill();
    
    // Inner arc (tail of arrow)
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, startAngle, endAngle, true);
    ctx.stroke();
    
    ctx.restore();
  }
  
  ctx.restore();
}

function drawBin(bin, binIndex) {
  // Calculate animation offsets
  let offsetX = 0;
  let offsetY = 0;
  
  // Bin bounce animation (correct answer) - smooth up and down motion
  // Only bounce the specific bin that was correct
  if (binBounceTimer > 0 && bouncingBinIndex === binIndex) {
    const progress = 1 - (binBounceTimer / binBounceDuration);
    // Bounce effect: goes up then down with easing
    const bounceHeight = 15 * Math.sin(progress * Math.PI);
    offsetY = -bounceHeight;
  }
  
  // Bin shake animation (incorrect answer) - rapid horizontal movement
  // Only shake the specific bin that was incorrect
  if (binShakeTimer > 0 && shakingBinIndex === binIndex) {
    const shakeAmount = 5;
    // Rapid random shake
    offsetX = (Math.random() - 0.5) * shakeAmount * 2;
    offsetY = (Math.random() - 0.5) * shakeAmount;
  }
  
  // Apply offsets to bin position
  const binX = bin.x + offsetX;
  const binY = bin.y + offsetY;
  
  // Determine which bin image to use (green, yellow/orange, or red)
  const isGreenBin = (bin.category === "green") || (phase === "code" && codePhaseCategory === "green");
  const isOrangeBin = (bin.category === "orange") || (phase === "code" && codePhaseCategory === "orange");
  const isRedBin = (bin.category === "red") || (phase === "code" && codePhaseCategory === "red");
  
  let binImage = null;
  if (isGreenBin && greenBinImage && greenBinImage.complete && greenBinImage.naturalWidth > 0) {
    binImage = greenBinImage;
  } else if (isOrangeBin && yellowBinImage && yellowBinImage.complete && yellowBinImage.naturalWidth > 0) {
    binImage = yellowBinImage;
  } else if (isRedBin && redBinImage && redBinImage.complete && redBinImage.naturalWidth > 0) {
    binImage = redBinImage;
  }
  
  if (binImage) {
    // Draw bin image preserving original aspect ratio, scaled by 2x
    ctx.save();
    
    // Scale image by 2x while maintaining aspect ratio
    const imgAspectRatio = binImage.width / binImage.height;
    const baseWidth = bin.width * 2;
    const baseHeight = bin.height * 2;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    // Calculate size maintaining aspect ratio at 2x scale
    if (imgAspectRatio > (baseWidth / baseHeight)) {
      // Image is wider - fit to width at 2x
      drawWidth = baseWidth;
      drawHeight = baseWidth / imgAspectRatio;
    } else {
      // Image is taller - fit to height at 2x
      drawHeight = baseHeight;
      drawWidth = baseHeight * imgAspectRatio;
    }
    
    // Center the scaled image (with animation offsets)
    drawX = binX + (bin.width - drawWidth) / 2;
    drawY = binY + (bin.height - drawHeight) / 2;
    
    // Draw the bin image at original aspect ratio
    ctx.drawImage(binImage, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
  } else {
    // Fallback to drawn bin for non-green bins or if image not loaded
    // Create gradient for bin (with animation offsets)
    const binGradient = ctx.createLinearGradient(binX, binY, binX, binY + bin.height);
    let baseColor = bin.color;
  
  binGradient.addColorStop(0, lightenColor(baseColor, 20));
  binGradient.addColorStop(1, darkenColor(baseColor, 10));
  
  // Draw recycling bin shape (trapezoid - wider at top, narrower at bottom)
  const topWidth = bin.width;
  const bottomWidth = bin.width * 0.75; // Bottom is 75% of top width
  const widthDiff = (topWidth - bottomWidth) / 2;
  
  ctx.fillStyle = binGradient;
  ctx.beginPath();
    ctx.moveTo(binX, binY); // Top left
    ctx.lineTo(binX + topWidth, binY); // Top right
    ctx.lineTo(binX + topWidth - widthDiff, binY + bin.height); // Bottom right
    ctx.lineTo(binX + widthDiff, binY + bin.height); // Bottom left
  ctx.closePath();
  ctx.fill();
  
  // Bin border
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Inner highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
    ctx.moveTo(binX + 2, binY + 2);
    ctx.lineTo(binX + topWidth - 2, binY + 2);
    ctx.lineTo(binX + topWidth - widthDiff - 2, binY + bin.height - 2);
    ctx.lineTo(binX + widthDiff + 2, binY + bin.height - 2);
  ctx.closePath();
  ctx.stroke();
  }
  
  // Draw bin content - symbol and numbers/icons together (with animation offsets)
  const centerX = binX + bin.width / 2;
  
  if (phase === "category") {
    // Draw recycling symbol image in the center (skip for bins using images)
    const usingBinImage = (isGreenBin && greenBinImage && greenBinImage.complete && greenBinImage.naturalWidth > 0) ||
                          (isOrangeBin && yellowBinImage && yellowBinImage.complete && yellowBinImage.naturalWidth > 0) ||
                          (isRedBin && redBinImage && redBinImage.complete && redBinImage.naturalWidth > 0);
    
    if (!usingBinImage) {
    if (recycleSymbolImage) {
      const symbolSize = 40;
      const symbolX = centerX - symbolSize / 2;
        const symbolY = binY + bin.height / 2 - symbolSize / 2;
      ctx.drawImage(recycleSymbolImage, symbolX, symbolY, symbolSize, symbolSize);
    } else {
      // Fallback to drawn symbol if image not loaded
        drawRecyclingSymbol(centerX, binY + bin.height / 2, 30, "#FFFFFF");
      }
    }
    
    // Show numbers/icons at the bottom (step 1)
    if (bin.info) {
      const codesMatch = bin.info.codes.match(/#\d+/g);
      // Remove "#" symbol from numbers (e.g., "#1, #2" -> "1, 2")
      const codesText = codesMatch ? codesMatch.map(code => code.replace("#", "")).join(", ") : "";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.textAlign = "center";
      // Position at bottom
      const bottomY = binY + bin.height + 12;
      ctx.fillText(codesText, centerX, bottomY);
    }
    
    // Draw stop sign image above contaminated bin (moved up 30px more, right 5px, 2x size)
    if (contaminatedBins.has(bin.category) && contaminationCounts[bin.category]) {
      if (stopImage && stopImage.complete && stopImage.naturalWidth > 0) {
        const stopSize = 80; // 2x size (was 40, now 80)
        const stopX = centerX - stopSize / 2 + 5; // Moved right 5px (was +3, now +5)
        const stopY = binY - 120; // Moved up 30px more from -90 to -120
        ctx.drawImage(stopImage, stopX, stopY, stopSize, stopSize);
      }
    }
  } else {
    // Code phase: show symbol in center, type at bottom
    // Remove number from label (e.g., "#1 PET" -> "PET")
    const labelWithoutNumber = bin.label.replace(/^#\d+\s+/, "");
    
    // Draw recycling symbol in center (skip for bins using images)
    const usingBinImage = (isGreenBin && greenBinImage && greenBinImage.complete && greenBinImage.naturalWidth > 0) ||
                          (isOrangeBin && yellowBinImage && yellowBinImage.complete && yellowBinImage.naturalWidth > 0) ||
                          (isRedBin && redBinImage && redBinImage.complete && redBinImage.naturalWidth > 0);
    
    if (!usingBinImage && recycleSymbolImage) {
      const symbolSize = 35;
      const symbolX = centerX - symbolSize / 2;
      const symbolY = binY + bin.height / 2 - symbolSize / 2;
      ctx.drawImage(recycleSymbolImage, symbolX, symbolY, symbolSize, symbolSize);
    }
    
    // Draw number in the center (always show in code phase)
    if (bin.code !== undefined) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.textAlign = "center";
      // Adjust horizontal position for different numbers
      let numberX = centerX;
      if (bin.code === 1 || bin.code === 2 || bin.code === 6 || bin.code === 7) {
        numberX = centerX + 2;
      } else if (bin.code === 3 || bin.code === 5) {
        numberX = centerX + 1;
      }
      ctx.fillText(bin.code.toString(), numberX, binY + bin.height / 2 + 20);
    }
    
    // Draw type at the bottom (step 2)
    if (bin.code !== undefined) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.textAlign = "center";
      ctx.fillText(labelWithoutNumber, centerX, binY + bin.height + 12);
    }
    
    // Draw stop sign image above contaminated bin (code phase, moved up 30px more, right 5px, 2x size)
    if (contaminatedBins.has(bin.category) && contaminationCounts[bin.category]) {
      if (stopImage && stopImage.complete && stopImage.naturalWidth > 0) {
        const stopSize = 80; // 2x size (was 40, now 80)
        const stopX = centerX - stopSize / 2 + 5; // Moved right 5px (was +3, now +5)
        const stopY = binY - 120; // Moved up 30px more from -90 to -120
        ctx.drawImage(stopImage, stopX, stopY, stopSize, stopSize);
      }
    }
  }
  
  ctx.textAlign = "left";
}

// Helper functions for color manipulation
function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
  const b = Math.min(255, (num & 0x0000FF) + percent);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - percent);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
  const b = Math.max(0, (num & 0x0000FF) - percent);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawItem() {
  // Use the pre-selected image variant for this item
  // Check if image exists and is loaded (complete property indicates it's loaded)
  if (currentItemImage && currentItemImage.complete && currentItemImage.naturalWidth > 0) {
    // Draw item image - just the image, no box, preserve aspect ratio
    ctx.save();
    
    // Calculate aspect ratio and scale to fit while maintaining original proportions
    const maxWidth = itemWidth;
    const maxHeight = itemHeight - 20; // Leave room for code label at bottom
    
    const imgAspectRatio = currentItemImage.width / currentItemImage.height;
    const maxAspectRatio = maxWidth / maxHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspectRatio > maxAspectRatio) {
      // Image is wider - fit to width
      drawWidth = maxWidth;
      drawHeight = maxWidth / imgAspectRatio;
      drawX = itemX;
      drawY = itemY + (maxHeight - drawHeight) / 2; // Center vertically
    } else {
      // Image is taller - fit to height
      drawHeight = maxHeight;
      drawWidth = maxHeight * imgAspectRatio;
      drawX = itemX + (maxWidth - drawWidth) / 2; // Center horizontally
      drawY = itemY;
    }
    
    // Draw image at original aspect ratio
    ctx.drawImage(
      currentItemImage,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
    
    // Draw plastic code badge at bottom only if hints are enabled
    if (showHints) {
      ctx.fillStyle = "#2D3748";
      ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.textAlign = "center";
      ctx.fillText(`#${currentItem.code}`, itemX + itemWidth / 2, itemY + itemHeight - 8);
    }
    
    ctx.restore();
  } else {
    // Fallback: Draw item as before (if images not loaded)
    let baseColor = "#FFFFFF";
    if (phase === "code") {
      if (codePhaseCategory === "green") {
        baseColor = "#90EE90";
      } else if (codePhaseCategory === "orange") {
        baseColor = "#FFE0B2";
      } else if (codePhaseCategory === "red") {
        baseColor = "#FFB3BA";
      }
    }
    
    const itemGradient = ctx.createLinearGradient(itemX, itemY, itemX, itemY + itemHeight);
    itemGradient.addColorStop(0, lightenColor(baseColor, 15));
    itemGradient.addColorStop(1, baseColor);
    
    ctx.fillStyle = itemGradient;
    roundedRect(itemX, itemY, itemWidth, itemHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = "#4A5568";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw plastic code only if hints are enabled
    if (showHints) {
      ctx.fillStyle = "#2D3748";
      ctx.font = "bold 36px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.textAlign = "center";
      ctx.fillText(`#${currentItem.code}`, itemX + itemWidth / 2, itemY + 50);
    }
    
    // Item name
    ctx.fillStyle = "#2D3748";
    ctx.font = "bold 14px 'Comic Sans MS', 'Trebuchet MS', Arial";
    const nameLines = wrapText(ctx, currentItem.name, itemWidth - 15, 14);
    let yOffset = itemY + 68;
    for (const line of nameLines) {
      ctx.fillText(line, itemX + itemWidth / 2, yOffset);
      yOffset += 16;
    }
  }
  
  ctx.textAlign = "left";
}

// Helper function to wrap text
function wrapText(context, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  context.font = `${fontSize}px 'Comic Sans MS', 'Trebuchet MS', Arial`;
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = context.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// ============================================================================
// GAME LOOP
// ============================================================================
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// ============================================================================
// START GAME
// ============================================================================
initGame();
