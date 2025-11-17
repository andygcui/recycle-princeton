// ============================================================================
// RECYCLING EDUCATION GAME - PRINCETON, NJ
// ============================================================================
// This game teaches players which plastics are recyclable in Princeton, NJ.
// The game has two phases: Category sorting and Plastic Code sorting.
// ============================================================================

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// ============================================================================
// GAME DATA - Plastic Items
// ============================================================================
// Each item has: name, code (resin code), and category (green/orange/red)
// Green = widely recyclable (PET #1, HDPE #2)
// Orange = sometimes/special dropoff (LDPE #4, PP #5)
// Red = not recyclable curbside (#3 PVC, #6 PS, #7 Other)
// ============================================================================
const ITEMS = [
  {
    name: "Water bottle",
    code: 1,                // PET
    category: "green",      // recyclable in Princeton
  },
  {
    name: "Milk jug",
    code: 2,                // HDPE
    category: "green",
  },
  {
    name: "Plastic bag",
    code: 4,                // LDPE
    category: "orange",     // special dropoff
  },
  {
    name: "Yogurt cup",
    code: 5,                // PP
    category: "orange",
  },
  {
    name: "Styrofoam cup",
    code: 6,                // PS
    category: "red",        // not recyclable curbside
  }
];

// ============================================================================
// GAME STATE
// ============================================================================
let currentItem = null;      // current item object from ITEMS array
let itemX = 0;               // item horizontal position
let itemY = 0;               // item vertical position
let itemSpeedY = 0.5;         // falling speed (pixels per frame) - much slower
let itemSpeedX = 0;          // horizontal movement speed
let itemWidth = 80;          // item rectangle width
let itemHeight = 60;         // item rectangle height

let phase = "category";      // "category" or "code"
let score = 0;               // player score
let message = "";            // feedback message (correct/wrong)
let messageTimer = 0;        // timer for message display
let messageDuration = 120;   // frames to show message

let bins = [];               // array of bin objects (changes per phase)

// Keyboard state
const keys = {
  left: false,
  right: false,
  down: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function initGame() {
  // Pick a random item to start
  pickRandomItem();
  
  // Initialize item position (top center)
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 50;
  
  // Set up bins for category phase
  setupBins();
  
  // Start game loop
  gameLoop();
}

// Pick a random item from ITEMS array
function pickRandomItem() {
  const randomIndex = Math.floor(Math.random() * ITEMS.length);
  currentItem = ITEMS[randomIndex];
}

// Set up bins based on current phase
function setupBins() {
  bins = [];
  const binWidth = 150;
  const binHeight = 80;
  const binY = canvas.height - binHeight - 20;
  const spacing = (canvas.width - (binWidth * 3)) / 4;
  
  if (phase === "category") {
    // Phase 1: Green, Orange, Red bins
    bins = [
      {
        x: spacing,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "Green",
        category: "green",
        color: "#4CAF50"
      },
      {
        x: spacing * 2 + binWidth,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "Orange",
        category: "orange",
        color: "#FF9800"
      },
      {
        x: spacing * 3 + binWidth * 2,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "Red",
        category: "red",
        color: "#F44336"
      }
    ];
  } else if (phase === "code") {
    // Phase 2: #1, #2, #5 bins
    bins = [
      {
        x: spacing,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "#1",
        code: 1,
        color: "#2196F3"
      },
      {
        x: spacing * 2 + binWidth,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "#2",
        code: 2,
        color: "#2196F3"
      },
      {
        x: spacing * 3 + binWidth * 2,
        y: binY,
        width: binWidth,
        height: binHeight,
        label: "#5",
        code: 5,
        color: "#2196F3"
      }
    ];
  }
}

// ============================================================================
// INPUT HANDLING
// ============================================================================
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    keys.left = true;
  }
  if (e.key === "ArrowRight") {
    keys.right = true;
  }
  if (e.key === "ArrowDown") {
    keys.down = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") {
    keys.left = false;
  }
  if (e.key === "ArrowRight") {
    keys.right = false;
  }
  if (e.key === "ArrowDown") {
    keys.down = false;
  }
});

// ============================================================================
// GAME LOGIC
// ============================================================================
function update() {
  // Update message timer
  if (messageTimer > 0) {
    messageTimer--;
    if (messageTimer === 0) {
      message = "";
    }
  }
  
  // Handle horizontal movement
  const moveSpeed = 2;        // slower horizontal movement
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
  if (itemX < 0) {
    itemX = 0;
  }
  if (itemX + itemWidth > canvas.width) {
    itemX = canvas.width - itemWidth;
  }
  
  // Handle fall speed
  let currentSpeedY = itemSpeedY;
  if (keys.down) {
    currentSpeedY *= 1.5; // Slight speed boost when holding down arrow
  }
  
  // Update vertical position (falling)
  itemY += currentSpeedY;
  
  // Check collision with bins
  if (itemY + itemHeight >= bins[0].y) {
    // Item has reached bin area
    checkBinCollision();
  }
  
  // Reset if item falls off screen (shouldn't happen, but safety check)
  if (itemY > canvas.height) {
    resetItem();
  }
}

// Check if item collides with any bin
function checkBinCollision() {
  const itemCenterX = itemX + itemWidth / 2;
  
  for (const bin of bins) {
    // Check if item center is over this bin
    if (itemCenterX >= bin.x && itemCenterX <= bin.x + bin.width) {
      if (phase === "category") {
        // Phase 1: Check category match
        if (bin.category === currentItem.category) {
          // Correct!
          if (currentItem.category === "green") {
            // Green items proceed to Phase 2 (plastic code sorting)
            message = "Correct! Now choose the plastic type";
            messageTimer = messageDuration;
            
            // Switch to code phase
            phase = "code";
            setupBins();
            
            // Reset item position for phase 2
            itemX = canvas.width / 2 - itemWidth / 2;
            itemY = 50;
          } else {
            // Orange and Red items complete after Phase 1
            score++;
            message = `Correct! ${currentItem.name} is ${currentItem.category === "orange" ? "special dropoff" : "not recyclable curbside"}`;
            messageTimer = messageDuration;
            
            // Pick new item and reset to category phase
            pickRandomItem();
            phase = "category";
            setupBins();
            resetItem();
          }
        } else {
          // Wrong bin
          message = "Wrong bin! Try again.";
          messageTimer = messageDuration;
          resetItem();
        }
      } else if (phase === "code") {
        // Phase 2: Check code match
        // Only Green items reach Phase 2, and they have codes 1 or 2
        // Bins are #1, #2, #5 (showing recyclable codes in Princeton)
        if (bin.code === currentItem.code) {
          // Correct!
          score++;
          message = `Correct! ${currentItem.name} is plastic #${currentItem.code}`;
          messageTimer = messageDuration;
          
          // Pick new item and reset to category phase
          pickRandomItem();
          phase = "category";
          setupBins();
          resetItem();
        } else {
          // Wrong code
          message = "Wrong plastic type! Try again.";
          messageTimer = messageDuration;
          resetItem();
        }
      }
      break; // Only check one bin collision per frame
    }
  }
}

// Reset item to top of screen
function resetItem() {
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 50;
}

// ============================================================================
// RENDERING
// ============================================================================
function render() {
  // Clear canvas
  ctx.fillStyle = "#16213e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw UI text at top
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "left";
  
  const phaseText = phase === "category" ? "Phase 1: Category" : "Phase 2: Plastic Type";
  ctx.fillText(phaseText, 20, 30);
  
  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);
  
  // Draw message if present
  if (message) {
    ctx.fillStyle = "#ffff00";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, 100);
    ctx.textAlign = "left";
  }
  
  // Draw bins
  for (const bin of bins) {
    // Bin rectangle
    ctx.fillStyle = bin.color;
    ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
    
    // Bin border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(bin.x, bin.y, bin.width, bin.height);
    
    // Bin label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(bin.label, bin.x + bin.width / 2, bin.y + bin.height / 2 + 8);
    ctx.textAlign = "left";
  }
  
  // Draw item
  if (currentItem) {
    // In code phase, tint item green to show it's recyclable
    if (phase === "code") {
      ctx.fillStyle = "#90EE90"; // light green
    } else {
      ctx.fillStyle = "#E0E0E0"; // light gray
    }
    
    // Item rectangle
    ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
    
    // Item border
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
    
    // Item text
    ctx.fillStyle = "#000000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    
    // Wrap text if needed
    const textLines = currentItem.name.split(' ');
    const lineHeight = 16;
    let yOffset = itemY + itemHeight / 2 - (textLines.length - 1) * lineHeight / 2;
    
    for (const line of textLines) {
      ctx.fillText(line, itemX + itemWidth / 2, yOffset);
      yOffset += lineHeight;
    }
    
    // Show plastic code in small text (for debugging/learning)
    ctx.font = "12px Arial";
    ctx.fillStyle = "#666666";
    ctx.fillText(`#${currentItem.code}`, itemX + itemWidth / 2, itemY + itemHeight - 8);
    ctx.textAlign = "left";
  }
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

