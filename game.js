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
canvas.height = 700; // Taller canvas for educational content

// ============================================================================
// EDUCATIONAL CONTENT DATABASE
// ============================================================================
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
  }
];

// ============================================================================
// GAME STATE
// ============================================================================
let currentItem = null;
let itemX = 0;
let itemY = 0;
let itemSpeedY = 0.5;
let itemSpeedX = 0;
let itemWidth = 100;
let itemHeight = 80;

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

// Keyboard state
const keys = {
  left: false,
  right: false,
  down: false,
  space: false,  // Spacebar for hints
  enter: false   // Enter key to drop into bin below
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function initGame() {
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 50;
  setupBins();
  gameLoop();
}

function pickRandomItem() {
  const randomIndex = Math.floor(Math.random() * ITEMS.length);
  currentItem = ITEMS[randomIndex];
  // Show educational message when new item appears
  showEducationalContent();
}

function showEducationalContent() {
  if (!currentItem) return;
  
  const codeInfo = PLASTIC_CODE_INFO[currentItem.code];
  educationalMessage = `${currentItem.name}: Plastic #${currentItem.code} (${codeInfo.name})`;
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
      // Green items: #1, #2, #5
      bins = [
        {
          x: spacing,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#1 PET",
          code: 1,
          color: "#2196F3",
          info: PLASTIC_CODE_INFO[1]
        },
        {
          x: spacing * 2 + binWidth,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#2 HDPE",
          code: 2,
          color: "#2196F3",
          info: PLASTIC_CODE_INFO[2]
        },
        {
          x: spacing * 3 + binWidth * 2,
          y: binY,
          width: binWidth,
          height: binHeight,
          label: "#5 PP",
          code: 5,
          color: "#2196F3",
          info: PLASTIC_CODE_INFO[5]
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
  if (!currentItem || bins.length === 0) return;
  
  const itemCenterX = itemX + itemWidth / 2;
  
  // Find which bin the item is over
  for (const bin of bins) {
    if (itemCenterX >= bin.x && itemCenterX <= bin.x + bin.width) {
      // Move item to bin position and trigger collision
      itemY = bin.y - itemHeight - 5;
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
  if (e.key === "Enter") {
    e.preventDefault();
    keys.enter = true;
    // Drop item into bin directly below
    dropIntoBinBelow();
  }
  if (e.key === " ") {
    e.preventDefault();
    keys.space = true;
    showHints = !showHints; // Toggle hints
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowDown") keys.down = false;
  if (e.key === "Enter") keys.enter = false;
  if (e.key === " ") keys.space = false;
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
  if (keys.down) {
    currentSpeedY *= 1.5;
  }
  
  // Update vertical position
  itemY += currentSpeedY;
  
  // Check collision with bins
  if (itemY + itemHeight >= bins[0].y) {
    checkBinCollision();
  }
  
  // Reset if item falls off screen
  if (itemY > canvas.height) {
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
          message = `✓ Correct! ${currentItem.name} goes in ${bin.label}`;
          educationalMessage = `${categoryInfo.description}. ${currentItem.description}`;
          
          // All items proceed to Phase 2 (code sorting)
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          setTimeout(() => {
            phase = "code";
            codePhaseCategory = currentItem.category; // Remember which category we're sorting
            setupBins();
            itemX = canvas.width / 2 - itemWidth / 2;
            itemY = 50;
            showEducationalContent();
          }, 2000);
        } else {
          // Wrong bin - teach them!
          const correctInfo = CATEGORY_INFO[currentItem.category];
          const wrongInfo = bin.info;
          message = `✗ Wrong! ${currentItem.name} is ${currentItem.category}, not ${bin.category}`;
          educationalMessage = `Hint: ${currentItem.name} is plastic #${currentItem.code}. ${correctInfo.description}. ${correctInfo.codes}`;
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          resetItem();
        }
      } else if (phase === "code") {
        if (bin.code === currentItem.code) {
          // Correct code!
          const codeInfo = PLASTIC_CODE_INFO[currentItem.code];
          score++;
          message = `✓ Perfect! ${currentItem.name} is plastic #${currentItem.code}`;
          educationalMessage = `${codeInfo.name}. ${codeInfo.common}. ${currentItem.description}`;
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          setTimeout(() => {
            pickRandomItem();
            phase = "category";
            setupBins();
            resetItem();
          }, 3000);
        } else {
          // Wrong code - teach them!
          const correctInfo = PLASTIC_CODE_INFO[currentItem.code];
          message = `✗ Wrong! ${currentItem.name} is plastic #${currentItem.code}, not #${bin.code}`;
          educationalMessage = `Hint: Look at the plastic code on the item. ${currentItem.name} is ${correctInfo.name} (#${currentItem.code})`;
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
  itemY = 50;
}

// ============================================================================
// RENDERING
// ============================================================================
function render() {
  // Clear canvas
  ctx.fillStyle = "#16213e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw educational header
  drawEducationalHeader();
  
  // Draw UI text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  
  let phaseText = "Phase 1: Choose the recycling category";
  if (phase === "code") {
    const categoryName = codePhaseCategory === "green" ? "Green" : 
                         codePhaseCategory === "orange" ? "Orange" : "Red";
    phaseText = `Phase 2: Choose the plastic code (${categoryName} items)`;
  }
  ctx.fillText(phaseText, 20, 30);
  
  ctx.font = "16px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width - 120, 30);
  
  // Draw educational message
  if (educationalMessage) {
    ctx.fillStyle = "#87CEEB";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    const lines = wrapText(ctx, educationalMessage, canvas.width - 40, 20);
    let yPos = 60;
    for (const line of lines) {
      ctx.fillText(line, canvas.width / 2, yPos);
      yPos += 18;
    }
    ctx.textAlign = "left";
  }
  
  // Draw feedback message
  if (message) {
    ctx.fillStyle = message.startsWith("✓") ? "#90EE90" : "#FF6B6B";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, 140);
    ctx.textAlign = "left";
  }
  
  // Draw bins with educational info
  for (const bin of bins) {
    drawBin(bin);
  }
  
  // Draw item with prominent plastic code
  if (currentItem) {
    drawItem();
  }
  
  // Draw instructions
  ctx.fillStyle = "#888888";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  ctx.fillText("SPACE: toggle hints | ENTER: drop into bin", canvas.width - 10, canvas.height - 25);
  ctx.fillText("Arrow keys: move item", canvas.width - 10, canvas.height - 10);
  ctx.textAlign = "left";
}

function drawEducationalHeader() {
  // Draw a subtle header bar
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(0, 0, canvas.width, 160);
  
  // Draw category legend if in category phase
  if (phase === "category" && showHints) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Princeton Recycling Guide:", 20, 180);
    
    ctx.font = "12px Arial";
    let yPos = 200;
    for (const [key, info] of Object.entries(CATEGORY_INFO)) {
      ctx.fillStyle = info.name.includes("Green") ? "#4CAF50" : 
                      info.name.includes("Orange") ? "#FF9800" : "#F44336";
      ctx.fillText(`• ${info.name}: ${info.description}`, 30, yPos);
      yPos += 20;
    }
  }
}

function drawBin(bin) {
  // Bin rectangle
  ctx.fillStyle = bin.color;
  ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
  
  // Bin border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(bin.x, bin.y, bin.width, bin.height);
  
  // Bin label
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(bin.label, bin.x + bin.width / 2, bin.y + 30);
  
  // Show educational info if hints are on
  if (showHints && bin.info) {
    ctx.font = "11px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    
    if (phase === "category") {
      // Show codes for this category
      ctx.fillText(bin.info.codes, bin.x + bin.width / 2, bin.y + 50);
      // Show examples
      const examples = wrapText(ctx, bin.info.examples, bin.width - 10, 11);
      let yOffset = bin.y + 70;
      for (const line of examples) {
        ctx.fillText(line, bin.x + bin.width / 2, yOffset);
        yOffset += 12;
      }
    } else {
      // Show plastic code info
      if (bin.info.common) {
        const common = wrapText(ctx, bin.info.common, bin.width - 10, 11);
        let yOffset = bin.y + 50;
        for (const line of common) {
          ctx.fillText(line, bin.x + bin.width / 2, yOffset);
          yOffset += 12;
        }
      }
    }
  }
  
  ctx.textAlign = "left";
}

function drawItem() {
  // Item background - color based on category in code phase
  if (phase === "code") {
    if (codePhaseCategory === "green") {
      ctx.fillStyle = "#90EE90"; // light green for recyclable
    } else if (codePhaseCategory === "orange") {
      ctx.fillStyle = "#FFE0B2"; // light orange
    } else if (codePhaseCategory === "red") {
      ctx.fillStyle = "#FFB3BA"; // light red
    } else {
      ctx.fillStyle = "#E0E0E0";
    }
  } else {
    ctx.fillStyle = "#E0E0E0";
  }
  
  ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
  
  // Item border
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
  
  // PLASTIC CODE - Make it HUGE and prominent!
  ctx.fillStyle = "#000000";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`#${currentItem.code}`, itemX + itemWidth / 2, itemY + 45);
  
  // Item name
  ctx.fillStyle = "#000000";
  ctx.font = "bold 12px Arial";
  const nameLines = wrapText(ctx, currentItem.name, itemWidth - 10, 12);
  let yOffset = itemY + 60;
  for (const line of nameLines) {
    ctx.fillText(line, itemX + itemWidth / 2, yOffset);
    yOffset += 14;
  }
  
  // Show plastic code name if hints are on
  if (showHints && PLASTIC_CODE_INFO[currentItem.code]) {
    ctx.font = "10px Arial";
    ctx.fillStyle = "#444444";
    const codeInfo = PLASTIC_CODE_INFO[currentItem.code];
    const codeName = wrapText(ctx, codeInfo.name, itemWidth - 10, 10);
    yOffset = itemY + itemHeight - 8;
    for (let i = codeName.length - 1; i >= 0; i--) {
      ctx.fillText(codeName[i], itemX + itemWidth / 2, yOffset);
      yOffset -= 12;
    }
  }
  
  ctx.textAlign = "left";
}

// Helper function to wrap text
function wrapText(context, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  context.font = `${fontSize}px Arial`;
  
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
