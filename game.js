// canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 700; 

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

// Game progression
let level = 1;
let correctItemsThisLevel = 0;  // Track correct items recycled for current level
let baseSpeedY = 0.5;  // Base falling speed
let gameOver = false;
let gameOverMessage = "";

// Trash pile system
let trashPileHeight = 0;  // Height of trash pile (0-100, game ends at 100)
const maxTrashPileHeight = 100;

// Contamination tracking
let greenBinContaminated = false;
let contaminationTimer = 0;
const contaminationDuration = 180;  // frames

// Fake leaderboard and PvP
let showLeaderboard = false;
let showPvP = false;

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

// Image loading
const itemImages = {};  // Cache for loaded images (can be single image or array for variants)
let imagesLoaded = false;
let recycleSymbolImage = null;  // Recycling symbol image

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
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 200; // Start below the "Recycle this [item]!" text
  setupBins();
  
  // Add click handler for info button on canvas
  canvas.addEventListener('click', (e) => {
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
  });
  
  gameLoop();
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

function pickRandomItem() {
  const randomIndex = Math.floor(Math.random() * ITEMS.length);
  currentItem = ITEMS[randomIndex];
  
  // Try to select image variant for this item
  updateCurrentItemImage();
  
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
  const binY = canvas.height - binHeight - 40;
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
    showHints = !showHints; // Toggle hints (demo mode)
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
  if (e.key === "p" || e.key === "P") {
    // Toggle PvP
    showPvP = !showPvP;
    showLeaderboard = false;  // Close leaderboard if open
  }
});

window.addEventListener("keyup", (e) => {
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

// ============================================================================
// GAME LOGIC
// ============================================================================
function update() {
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
  
  // Update contamination timer
  if (contaminationTimer > 0) {
    contaminationTimer--;
    if (contaminationTimer === 0) {
      greenBinContaminated = false;
    }
  }
  
  // Update level-based speed
  itemSpeedY = baseSpeedY * (1 + (level - 1) * 0.3);  // 30% faster per level
  
  // Don't update game if game over
  if (gameOver) {
    return;
  }
  
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
  
  // Animate clouds (move slowly to the right)
  animationFrame++;
  cloudPositions.forEach(cloud => {
    cloud.x += 0.1; // Slow movement
    // Wrap around when cloud goes off screen
    if (cloud.x > canvas.width + cloud.size) {
      cloud.x = -cloud.size;
    }
  });
  
  // Check collision with bins (only once per item)
  // Item must go 60 pixels deep into the bin before collision is detected
  if (!hasCollided && bins.length > 0 && itemY + itemHeight >= bins[0].y + 60) {
    hasCollided = true;
    checkBinCollision();
  }
  
  // Reset if item falls off screen (adds to trash pile)
  if (itemY > canvas.height) {
    addToTrashPile();
    resetItem();
  }
}

function checkBinCollision() {
  const itemCenterX = itemX + itemWidth / 2;
  
  for (const bin of bins) {
    if (itemCenterX >= bin.x && itemCenterX <= bin.x + bin.width) {
      if (phase === "category") {
        if (bin.category === currentItem.category) {
          // Correct category!
          const categoryInfo = CATEGORY_INFO[currentItem.category];
          message = `Awesome! You got it right!`;
          educationalMessage = `${currentItem.name} goes in the ${bin.label} bin! ${currentItem.description}`;
          
          // Flash green for correct answer
          flashColor = "green";
          flashTimer = flashDuration;
          
          // All items proceed to Phase 2 (code sorting)
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          // Let item continue falling into bin, then transition after it's fully in
          setTimeout(() => {
            phase = "code";
            codePhaseCategory = currentItem.category; // Remember which category we're sorting
            setupBins();
            itemX = canvas.width / 2 - itemWidth / 2;
            itemY = 200; // Start below the "Recycle this [item]!" text
            hasCollided = false;  // Reset collision flag for phase transition
            showEducationalContent();
          }, 3000); // Increased delay to see item go into bin
        } else {
          // Wrong bin - teach them!
          const correctInfo = CATEGORY_INFO[currentItem.category];
          const wrongInfo = bin.info;
          message = `Oops! Try again!`;
          educationalMessage = `Hint: ${currentItem.name} is plastic #${currentItem.code}. It goes in the ${currentItem.category} bin! ${correctInfo.description}`;
          
          // Flash red for incorrect answer
          flashColor = "red";
          flashTimer = flashDuration;
          
          // If recyclable plastic dropped into red/orange bin, add to trash pile
          if (currentItem.category === "green" && (bin.category === "red" || bin.category === "orange")) {
            addToTrashPile();
          }
          
          // If non-recyclable plastic dropped into green bin, contaminate it
          if (currentItem.category !== "green" && bin.category === "green") {
            greenBinContaminated = true;
            contaminationTimer = contaminationDuration;
            addToTrashPile();
          } else {
            addToTrashPile();  // Any wrong bin adds to trash pile
          }
          
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          resetItem();
        }
      } else if (phase === "code") {
        if (bin.code === currentItem.code) {
          // Correct code!
          const codeInfo = PLASTIC_CODE_INFO[currentItem.code];
          score++;
          checkLevelProgression();
          message = `Awesome! You got it right!`;
          educationalMessage = `Perfect! ${currentItem.name} is plastic #${currentItem.code} (${codeInfo.name}). ${codeInfo.common}!`;
          
          // Flash green for correct answer
          flashColor = "green";
          flashTimer = flashDuration;
          
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          // Immediately transition to new item (no delay)
          pickRandomItem();
          phase = "category";
          codePhaseCategory = null; // Reset category tracking
          setupBins();
          resetItem();
          hasCollided = false;  // Reset collision flag for new item
        } else {
          // Wrong code - teach them!
          const correctInfo = PLASTIC_CODE_INFO[currentItem.code];
          message = `Almost there! Keep trying!`;
          educationalMessage = `Look at the number on the item! ${currentItem.name} is plastic #${currentItem.code} (${correctInfo.name}). You can do it!`;
          
          // Flash red for incorrect answer
          flashColor = "red";
          flashTimer = flashDuration;
          
          // Wrong code adds to trash pile
          addToTrashPile();
          
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
  itemY = 200; // Start below the "Recycle this [item]!" text
  hasCollided = false;  // Reset collision flag
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
    gameOverMessage = "Game Over! The trash pile got too high. Try again!";
  }
}

// Restart game
function restartGame() {
  gameOver = false;
  gameOverMessage = "";
  score = 0;
  level = 1;
  correctItemsThisLevel = 0;
  trashPileHeight = 0;
  greenBinContaminated = false;
  contaminationTimer = 0;
  phase = "category";
  codePhaseCategory = null;
  itemSpeedY = baseSpeedY;
  hasCollided = false;
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 200;
  setupBins();
  message = "";
  educationalMessage = "";
  messageTimer = 0;
  educationalTimer = 0;
}

// Check for level progression - need n correct items to go from level n to n+1
function checkLevelProgression() {
  correctItemsThisLevel++;
  
  // To go from level n to level n+1, you need n correct items
  if (correctItemsThisLevel >= level) {
    level++;
    correctItemsThisLevel = 0;  // Reset counter for next level
    message = `Level ${level}! Items fall faster now!`;
    messageTimer = messageDuration;
  }
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

function render() {
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
  
  // Draw feedback message (with proper spacing to avoid overlap)
  if (message) {
    const isCorrect = message.includes("Awesome");
    ctx.fillStyle = isCorrect ? "#4CAF50" : "#FF9800";
    ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    
    ctx.fillText(message, canvas.width / 2, 170);
    ctx.textAlign = "left";
  }
  
  // Draw item FIRST (so it appears behind bins when overlapping)
  // Draw item even when it's going into the bin (up to 60 pixels deep)
  if (currentItem) {
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
  for (const bin of bins) {
    drawBin(bin);
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
  
  // Draw trash pile in background
  drawTrashPile();
  
  // Draw fake leaderboard if shown
  if (showLeaderboard) {
    drawFakeLeaderboard();
  }
  
  // Draw fake PvP if shown
  if (showPvP) {
    drawFakePvP();
  }
  
  // Draw game over screen
  if (gameOver) {
    drawGameOverScreen();
  }
  
  // Draw friendly instructions
  ctx.fillStyle = "#666666";
  ctx.font = "13px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "right";
  ctx.fillText("SPACE: toggle hints | SHIFT: speed up | ENTER: instant drop | Arrow keys: move", canvas.width - 15, canvas.height - 25);
  ctx.textAlign = "left";
}

function drawTrashPile() {
  if (trashPileHeight <= 0) return;
  
  const pileX = 20;
  const pileY = canvas.height - 40;
  const pileWidth = 120;
  const pileHeight = (trashPileHeight / maxTrashPileHeight) * 200;  // Max height 200px
  const actualPileY = pileY - pileHeight;
  
  // Draw trash pile as a messy stack
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.moveTo(pileX, pileY);
  ctx.lineTo(pileX + pileWidth, pileY);
  ctx.lineTo(pileX + pileWidth - 10, actualPileY);
  ctx.lineTo(pileX + 10, actualPileY);
  ctx.closePath();
  ctx.fill();
  
  // Add some trash items sticking out
  ctx.fillStyle = "#8D6E63";
  for (let i = 0; i < 5; i++) {
    const offsetX = pileX + (i * 20) + Math.sin(i) * 5;
    const offsetY = actualPileY + Math.cos(i) * 3;
    ctx.fillRect(offsetX, offsetY, 15, 10);
  }
  
  // Draw trash pile label
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Trash: ${Math.round(trashPileHeight)}%`, pileX, actualPileY - 5);
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
  
  // Message
  ctx.fillStyle = "#2D3748";
  ctx.font = "bold 28px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "center";
  ctx.fillText(gameOverMessage, panelX + panelWidth / 2, panelY + 70);
  
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

function drawBin(bin) {
  // Create gradient for bin
  const binGradient = ctx.createLinearGradient(bin.x, bin.y, bin.x, bin.y + bin.height);
  let baseColor = bin.color;
  
  // Show contamination effect if green bin is contaminated
  if (greenBinContaminated && bin.category === "green") {
    baseColor = "#FF6B6B";  // Red tint for contamination
  }
  
  binGradient.addColorStop(0, lightenColor(baseColor, 20));
  binGradient.addColorStop(1, darkenColor(baseColor, 10));
  
  // Draw recycling bin shape (trapezoid - wider at top, narrower at bottom)
  const topWidth = bin.width;
  const bottomWidth = bin.width * 0.75; // Bottom is 75% of top width
  const widthDiff = (topWidth - bottomWidth) / 2;
  
  ctx.fillStyle = binGradient;
  ctx.beginPath();
  ctx.moveTo(bin.x, bin.y); // Top left
  ctx.lineTo(bin.x + topWidth, bin.y); // Top right
  ctx.lineTo(bin.x + topWidth - widthDiff, bin.y + bin.height); // Bottom right
  ctx.lineTo(bin.x + widthDiff, bin.y + bin.height); // Bottom left
  ctx.closePath();
  ctx.fill();
  
  // Bin border (red if contaminated)
  ctx.strokeStyle = greenBinContaminated && bin.category === "green" ? "#FF0000" : "#FFFFFF";
  ctx.lineWidth = greenBinContaminated && bin.category === "green" ? 6 : 4;
  ctx.stroke();
  
  // Inner highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bin.x + 2, bin.y + 2);
  ctx.lineTo(bin.x + topWidth - 2, bin.y + 2);
  ctx.lineTo(bin.x + topWidth - widthDiff - 2, bin.y + bin.height - 2);
  ctx.lineTo(bin.x + widthDiff + 2, bin.y + bin.height - 2);
  ctx.closePath();
  ctx.stroke();
  
  // Draw bin content - symbol and numbers/icons together
  const centerX = bin.x + bin.width / 2;
  
  if (phase === "category") {
    // Draw recycling symbol image in the center
    if (recycleSymbolImage) {
      const symbolSize = 40;
      const symbolX = centerX - symbolSize / 2;
      const symbolY = bin.y + bin.height / 2 - symbolSize / 2;
      ctx.drawImage(recycleSymbolImage, symbolX, symbolY, symbolSize, symbolSize);
    } else {
      // Fallback to drawn symbol if image not loaded
      drawRecyclingSymbol(centerX, bin.y + bin.height / 2, 30, "#FFFFFF");
    }
    
    // Show numbers/icons at the top (always visible, more bin-like)
    if (bin.info) {
      const codesMatch = bin.info.codes.match(/#\d+/g);
      const codesText = codesMatch ? codesMatch.join(", ") : "";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.textAlign = "center";
      ctx.fillText(codesText, centerX, bin.y + 18);
    }
    
    // Show contamination warning if contaminated
    if (greenBinContaminated && bin.category === "green") {
      ctx.fillStyle = "#FF0000";
      ctx.font = "bold 14px 'Comic Sans MS', 'Trebuchet MS', Arial";
      ctx.fillText("CONTAMINATED!", centerX, bin.y + bin.height - 8);
    }
  } else {
    // Code phase: show label (with number) at top, symbol in center
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(bin.label, centerX, bin.y + 20);
    
    // Draw recycling symbol in center
    if (recycleSymbolImage) {
      const symbolSize = 35;
      const symbolX = centerX - symbolSize / 2;
      const symbolY = bin.y + bin.height / 2 - symbolSize / 2;
      ctx.drawImage(recycleSymbolImage, symbolX, symbolY, symbolSize, symbolSize);
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
