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

// Image loading
const itemImages = {};  // Cache for loaded images (can be single image or array for variants)
let imagesLoaded = false;

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
  loadImages();
  pickRandomItem();
  itemX = canvas.width / 2 - itemWidth / 2;
  itemY = 50;
  setupBins();
  gameLoop();
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

function pickRandomItem() {
  const randomIndex = Math.floor(Math.random() * ITEMS.length);
  currentItem = ITEMS[randomIndex];
  
  // Select image variant for this item
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
          message = `Awesome! You got it right!`;
          educationalMessage = `${currentItem.name} goes in the ${bin.label} bin! ${currentItem.description}`;
          
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
          message = `Oops! Try again!`;
          educationalMessage = `Hint: ${currentItem.name} is plastic #${currentItem.code}. It goes in the ${currentItem.category} bin! ${correctInfo.description}`;
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          resetItem();
        }
      } else if (phase === "code") {
        if (bin.code === currentItem.code) {
          // Correct code!
          const codeInfo = PLASTIC_CODE_INFO[currentItem.code];
          score++;
          message = `You're a recycling superstar!`;
          educationalMessage = `Perfect! ${currentItem.name} is plastic #${currentItem.code} (${codeInfo.name}). ${codeInfo.common}!`;
          messageTimer = messageDuration;
          educationalTimer = educationalDuration;
          
          setTimeout(() => {
            pickRandomItem();
            phase = "category";
            codePhaseCategory = null; // Reset category tracking
            setupBins();
            resetItem();
          }, 3000);
        } else {
          // Wrong code - teach them!
          const correctInfo = PLASTIC_CODE_INFO[currentItem.code];
          message = `Almost there! Keep trying!`;
          educationalMessage = `Look at the number on the item! ${currentItem.name} is plastic #${currentItem.code} (${correctInfo.name}). You can do it!`;
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
  // Clear canvas with sky gradient
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
  
  // Draw phase text
  ctx.fillStyle = "#4A5568";
  ctx.font = "bold 20px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "left";
  
  let phaseText = "Step 1: Pick the right bin!";
  if (phase === "code") {
    phaseText = "Step 2: Find the plastic number!";
  }
  ctx.fillText(phaseText, 25, 42);
  
  // Draw score badge
  ctx.fillStyle = "#FF6B9D";
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
    const isCorrect = message.includes("Awesome") || message.includes("superstar");
    ctx.fillStyle = isCorrect ? "#4CAF50" : "#FF9800";
    ctx.font = "bold 24px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    
    ctx.fillText(message, canvas.width / 2, 170);
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
  
  // Draw friendly instructions
  ctx.fillStyle = "#666666";
  ctx.font = "13px 'Comic Sans MS', 'Trebuchet MS', Arial";
  ctx.textAlign = "right";
  ctx.fillText("SPACE: hints | ENTER: drop | Arrow keys: move", canvas.width - 15, canvas.height - 25);
  ctx.textAlign = "left";
}

function drawClouds() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  // Cloud 1
  drawCloud(100, 50, 60);
  drawCloud(300, 80, 40);
  drawCloud(600, 60, 50);
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
  if (phase === "category" && showHints) {
    const boxX = 20;
    const boxY = 200; // Moved down to avoid overlap with messages
    const boxWidth = canvas.width - 40;
    const boxHeight = 100;
    
    // Draw friendly info box
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    roundedRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = "#2D3748";
    ctx.font = "bold 16px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "left";
    ctx.fillText("Princeton Recycling Guide:", boxX + 15, boxY + 25);
    
    ctx.font = "14px 'Comic Sans MS', 'Trebuchet MS', Arial";
    let yPos = boxY + 50;
    for (const [key, info] of Object.entries(CATEGORY_INFO)) {
      const color = info.name.includes("Green") ? "#4CAF50" : 
                    info.name.includes("Orange") ? "#FF9800" : "#F44336";
      ctx.fillStyle = color;
      ctx.fillText(`${info.name}: ${info.description}`, boxX + 20, yPos);
      yPos += 22;
    }
  }
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
  const baseColor = bin.color;
  binGradient.addColorStop(0, lightenColor(baseColor, 20));
  binGradient.addColorStop(1, darkenColor(baseColor, 10));
  
  // Draw bin with rounded corners
  ctx.fillStyle = binGradient;
  roundedRect(bin.x, bin.y, bin.width, bin.height, 20);
  ctx.fill();
  
  // Bin border with glow
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Inner highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  roundedRect(bin.x + 2, bin.y + 2, bin.width - 4, bin.height - 4, 18);
  ctx.stroke();
  
  // Draw bin label - recycling symbol for category phase, text for code phase
  if (phase === "category") {
    // Draw recycling symbol (3 chasing arrows)
    drawRecyclingSymbol(bin.x + bin.width / 2, bin.y + 35, 30, "#FFFFFF");
  } else {
    // Draw text label for code phase
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.textAlign = "center";
    ctx.fillText(bin.label, bin.x + bin.width / 2, bin.y + 35);
  }
  
  // Show educational info if hints are on
  if (showHints && bin.info) {
    ctx.font = "12px 'Comic Sans MS', 'Trebuchet MS', Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    
    if (phase === "category") {
      // Show codes for this category
      ctx.fillText(bin.info.codes, bin.x + bin.width / 2, bin.y + 55);
      // Show examples
      const examples = wrapText(ctx, bin.info.examples, bin.width - 15, 12);
      let yOffset = bin.y + 75;
      for (const line of examples) {
        ctx.fillText(line, bin.x + bin.width / 2, yOffset);
        yOffset += 14;
      }
    } else {
      // Show plastic code info
      if (bin.info.common) {
        const common = wrapText(ctx, bin.info.common, bin.width - 15, 12);
        let yOffset = bin.y + 55;
        for (const line of common) {
          ctx.fillText(line, bin.x + bin.width / 2, yOffset);
          yOffset += 14;
        }
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
  if (currentItemImage && imagesLoaded) {
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
