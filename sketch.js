// TripChaos: The Unprepared Traveler
// A game to drive traffic to tripmerge.com travel planning tools

// Global variables
let gameState = 'start'; // 'start', 'playing', 'decision', 'gameOver', 'win'
let score = 0;
let budget = 100;
let satisfaction = 100;
let timeLeft = 60;
let greyAtmosphere = 0; // Track grey atmosphere effect (0 to 1)

// Effect notification system
let effectNotifications = [];
const NOTIFICATION_DURATION = 60; // Duration in frames (1 second at 60fps)
const NOTIFICATION_RISE_SPEED = 1; // How fast notifications float up

// Global variables for leaderboard
let playerEmail = "";
let showLeaderboard = false;
let leaderboardData = [];
let leaderboardMessage = "";
let submittingScore = false;
let scoreSubmitted = false;
let currentInputField = null;

// New global variable for handling direct input
let isEmailInputActive = false;
let emailInputCursor = 0;
let lastKeyPressed = 0;
let cursorBlinkRate = 30; // Frames for cursor blink

// Add these variables to the top of the file with other global variables
let cloudSlowdownActive = false;
let cloudSlowdownTimer = 0;
let cloudSlowdownDuration = 180; // 3 seconds at 60fps
let originalPlayerSpeed = 5; // Updated to match new default speed
let fadingGreyAtmosphere = false;

// Add this at the top with other global variables
let cloudSlowdownEndTime = 0; // When the cloud effect should end (in millis)

// Player variables
let player = {
  x: 100,
  y: 300,
  width: 30,
  height: 50,
  speed: 5, // Changed from 6 to 5 as requested
  jumpForce: 15, // Keep at 15 as requested
  velocityY: 1, // Keep at 1 as requested
  isJumping: false,
  isColliding: false,
  worldX: 100,
  facingRight: true,
  // Cloud effect properties
  cloudEffectCounter: 0,
  isSlowed: false // New flag to track slowdown state
};

// Companion variables
let companion = {
  x: 70,
  y: 300,
  width: 25,
  height: 40,
  targetX: 0,
  worldX: 70
};

// Theme variables
let currentTheme = "beach"; // beach, city, adventure
let oceanHeight = 550; // Adjusted for larger canvas
let oceanWaves = [];
let sunPosition = { x: 800, y: 120 };
let clouds = [];

// Decision system
let decisionTimer = 0;
let decisionInterval = 600; // Show decision every 10 seconds (60fps) - no longer used with the new system
let currentDecision = null;
let showingDecision = false;
let decisionsThisLevel = 0; // Track decisions made in current level
let decisionPositions = [0.6, 0.8]; // Trigger decisions at 60% and 80% of level length
let decisionTriggeredAt = [false, false]; // Track which decision points have been triggered

// Game objects
let platforms = [];
let perks = [];
let mishaps = [];
let levelEndMarker = null;
let levelLength = 3000; // Level length in pixels
let cameraOffset = 0;
let currentLevelNumber = 1;

// Make game state globally accessible
window.gameState = gameState;

// UI and text rendering variables for improved readability
let buttonHover = "";
let tripmergeURL = "https://tripmerge.com";
let titleFontSize = 36;  // Reduced from 48
let subtitleFontSize = 24;  // Reduced from 32
let bodyFontSize = 18;  // Reduced from 22
let smallFontSize = 14;  // Reduced from 18
let primaryTextColor = '#000000';  // Updated to black
let highlightTextColor = '#c72a09';  // Updated to bold red
let fontFamily = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// Game elements for the legend
let gameElements = [
  { name: "Souvenir", description: "Boost score", draw: (x, y) => { 
    // Souvenir gift box
    fill(100, 100, 255);
    rect(x - 8, y - 8, 16, 16, 2); // Box
    
    // Ribbon
    fill(0, 0, 255);
    rect(x - 8, y - 2, 16, 4); // Horizontal ribbon
    rect(x - 2, y - 8, 4, 16); // Vertical ribbon
    
    // Gift bow
    fill(100, 100, 255);
    ellipse(x, y, 6, 6); // Center of bow
    
    // Knot details
    fill(0, 0, 255);
    ellipse(x - 3, y - 3, 3, 3); // Top left knot
    ellipse(x + 3, y - 3, 3, 3); // Top right knot
    ellipse(x - 3, y + 3, 3, 3); // Bottom left knot
    ellipse(x + 3, y + 3, 3, 3); // Bottom right knot
  }},
  { name: "Coin", description: "Refill budget & score", draw: (x, y) => { 
    // Gold coin with shine
    fill(255, 215, 0);
    ellipse(x, y, 16, 16);
    fill(255, 235, 100);
    ellipse(x, y, 13, 13);
    fill(255, 215, 0);
    fill(255, 255, 255, 150);
    ellipse(x - 4, y - 4, 4, 4);
  }},
  { name: "Map", description: "Refill satisfaction & score", draw: (x, y) => { 
    // Map base
    fill(50, 205, 50);  // Green color
    rect(x - 8, y - 8, 16, 16, 2);
    
    // Direction arrow
    stroke(255);  // White arrow for contrast
    strokeWeight(2);
    line(x - 4, y, x + 4, y);      // Arrow body
    line(x + 4, y, x + 1, y - 3);  // Arrow head top
    line(x + 4, y, x + 1, y + 3);  // Arrow head bottom
  }},
  { name: "Unexpected Expenses", description: "Drain budget", draw: (x, y) => { 
    // Red dollar sign
    fill(220, 20, 60);
    textAlign(CENTER, CENTER);
    textSize(20);
    textStyle(BOLD);
    text("💳", x, y);
    textStyle(NORMAL);
    // Subtle glow
    noFill();
    stroke(220, 20, 60, 100);
    strokeWeight(2);
    // Remove circle
    noStroke();
  }},
  { name: "Gray Cloud", description: "Slow moves & lose satisfaction", draw: (x, y) => { 
    // Storm cloud with rain
    fill(169, 169, 169);
    ellipse(x, y, 20, 14);
    ellipse(x - 7, y, 16, 11);
    ellipse(x + 7, y, 16, 11);
    fill(100, 149, 237);
    triangle(x - 7, y + 7, x - 10, y + 14, x - 4, y + 14);
    triangle(x, y + 7, x - 3, y + 14, x + 3, y + 14);
    triangle(x + 7, y + 7, x + 4, y + 14, x + 10, y + 14);
  }},
  { name: "Lost Luggage", description: "Lose satisfaction", draw: (x, y) => { 
    // Tilted lost suitcase with question mark
    push();
    translate(x, y);
    rotate(PI/12); // Slight tilt
    
    // Brown suitcase base
    fill(139, 69, 19);  // Saddle brown
    rect(-8, -8, 16, 16, 2);
    
    // Handle
    stroke(101, 67, 33);  // Darker brown
    strokeWeight(2);
    noFill();
    arc(0, -8, 8, 4, PI, TWO_PI);
    
    // Question mark
    fill(255);  // White question mark
    textAlign(CENTER, CENTER);
    textSize(12);
    text("?", 0, 0);
    
    pop();
    noStroke();
  }},
];

// Control keys for the legend
let controlKeys = [
  { key: "RIGHT ARROW", description: "Move" },
  { key: "UP ARROW", description: "Jump" },
];

// Decision points with simplified options
let decisions = [
  {
    question: "Your friend wants to visit an expensive restaurant!",
    options: [
      { text: "Go", effect: () => { budget -= 20; satisfaction += 15; } },
      { text: "Suggest alternative", effect: () => { budget -= 5; satisfaction += 5; } },
      { text: "Decline", effect: () => { satisfaction -= 15; } }
    ]
  },
  {
    question: "Weather forecast shows rain tomorrow!",
    options: [
      { text: "Change plans", effect: () => { budget -= 10; } },
      { text: "Continue", effect: () => { if (random() < 0.5) satisfaction -= 20; } },
      { text: "Backup plan", effect: () => { budget -= 5; } }
    ]
  },
  {
    question: "You found a risky shortcut!",
    options: [
      { text: "Take it", effect: () => { if (random() < 0.5) satisfaction -= 10; else timeLeft += 10; } },
      { text: "Stay on route", effect: () => {} },
      { text: "Ask locals", effect: () => { budget -= 5; satisfaction += 5; } }
    ]
  },
  {
    question: "Your group wants to split up!",
    options: [
      { text: "Let them", effect: () => { satisfaction -= 10; budget += 10; } },
      { text: "Stay together", effect: () => { satisfaction += 5; budget -= 5; } },
      { text: "Compromise", effect: () => {} }
    ]
  },
  {
    question: "A local offers a rare souvenir!",
    options: [
      { text: "Buy it", effect: () => { budget -= 15; satisfaction += 10; } },
      { text: "Negotiate", effect: () => { budget -= 10; satisfaction += 5; } },
      { text: "Decline", effect: () => {} }
    ]
  },
  {
    question: "Your flight is delayed!",
    options: [
      { text: "Wait", effect: () => { satisfaction -= 5; } },
      { text: "Book hotel", effect: () => { budget -= 10; satisfaction += 5; } },
      { text: "Find alternative", effect: () => { budget -= 15; timeLeft += 10; } }
    ]
  },
  {
    question: "You're invited to a local festival!",
    options: [
      { text: "Attend", effect: () => { budget -= 5; satisfaction += 15; } },
      { text: "Watch from afar", effect: () => {} },
      { text: "Skip it", effect: () => { timeLeft += 5; satisfaction -= 5; } }
    ]
  },
  {
    question: "Your phone battery is low!",
    options: [
      { text: "Charge at cafe", effect: () => { budget -= 5; satisfaction += 5; } },
      { text: "Use portable charger", effect: () => {} },
      { text: "Conserve", effect: () => { timeLeft -= 5; } }
    ]
  },
  {
    question: "A group member feels homesick!",
    options: [
      { text: "Call home", effect: () => { budget -= 5; satisfaction += 10; } },
      { text: "Distract them", effect: () => {} },
      { text: "Ignore", effect: () => { satisfaction -= 10; } }
    ]
  },
  {
    question: "You're offered a guided tour!",
    options: [
      { text: "Take it", effect: () => { budget -= 10; satisfaction += 10; } },
      { text: "Explore alone", effect: () => {} },
      { text: "Ask for discount", effect: () => { budget -= 5; satisfaction += 5; } }
    ]
  }
];

// Setup function
function setup() {
  let canvas;
  
  if (isMobileDevice()) {
    // For mobile devices, use full window dimensions
    canvas = createCanvas(windowWidth, windowHeight);
    // Calculate game scale based on viewport size while maintaining aspect ratio
    let scaleX = windowWidth / 1000;
    let scaleY = windowHeight / 600;
    window.gameScale = min(scaleX, scaleY);
  } else {
    // For desktop, use fixed dimensions
    canvas = createCanvas(1000, 600);
    window.gameScale = 1;
  }
  
  canvas.parent('game-container');
  
  // Initialize game objects and settings
  resetGame();
  
  // Add window resize handler
  window.addEventListener('resize', windowResized);
}

// Handle window resize events
function windowResized() {
  if (isMobileDevice()) {
    // Only resize canvas on mobile devices
    resizeCanvas(windowWidth, windowHeight);
    // Recalculate game scale
    let scaleX = windowWidth / 1000;
    let scaleY = windowHeight / 600;
    window.gameScale = min(scaleX, scaleY);
  }
  // Desktop keeps fixed size, no resize needed
}

// Update mobile detection to be more reliable
function isMobileDevice() {
  return (
    touches.length > 0 || 
    (typeof window.orientation !== 'undefined') || 
    (navigator.userAgent.indexOf('IEMobile') !== -1) ||
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ||
    (window.innerWidth <= 768)
  );
}

// Add orientation change handler
window.addEventListener('orientationchange', function() {
  // Small delay to ensure new dimensions are available
  setTimeout(windowResized, 100);
});

// Reset game state
function resetGame() {
  // Reset player
  player.worldX = 100;
  player.x = 100;
  player.y = 300;
  player.velocityY = 1; // Reset to 1 as requested
  player.isJumping = false;
  player.isColliding = false;
  player.facingRight = true;
  player.speed = 5; // Reset to 5 as requested
  player.jumpForce = 15; // Reset to 15 as requested
  player.cloudEffectCounter = 0;
  player.isSlowed = false;
  
  // Reset grey atmosphere
  cloudSlowdownEndTime = 0;
  greyAtmosphere = 0;
  
  // Reset companion
  companion.worldX = 70;
  companion.x = 70;
  companion.y = 300;
  
  // Reset game metrics
  score = 0;
  budget = 100;
  satisfaction = 100;
  timeLeft = 60;
  cameraOffset = 0;
  currentLevelNumber = 1;
  
  // Reset decision system
  decisionTimer = 0;
  showingDecision = false;
  currentDecision = null;
  decisionsThisLevel = 0;
  decisionTriggeredAt = [false, false];
  
  // Clear all game objects
  platforms = [];
  perks = [];
  mishaps = [];
  
  // Create initial platform that player starts on
  platforms.push({
    x: 0,
    y: 400,
    width: 200,
    height: 20,
    theme: "beach"
  });
  
  // Generate rest of the level
  generateLevel();
  
  // Reset cloud effect
  cloudSlowdownEndTime = 0;
  
  console.log("Game reset to initial state:", gameState);  // Debug log
}

// Generate a complete level
function generateLevel() {
  // Keep the first platform (created in resetGame) and clear the rest
  let firstPlatform = platforms[0];
  platforms = [firstPlatform];
  perks = [];
  mishaps = [];
  
  let lastPlatformX = 0;
  let lastPlatformY = 400;
  
  // Adjust probabilities based on level
  let perkChance = 0.4 - (currentLevelNumber - 1) * 0.05; // Decrease perks with level (0.4, 0.35, 0.3)
  let mishapChance = 0.2 + (currentLevelNumber - 1) * 0.1; // Increase mishaps with level (0.2, 0.3, 0.4)
  
  // Adjust perk type probabilities based on level
  let coinChance = 0.4 - (currentLevelNumber - 1) * 0.1; // Decrease helpful perks
  let mapChance = 0.3 - (currentLevelNumber - 1) * 0.05;
  
  // Height variation settings
  let baseHeightMin = 250; // Base minimum height
  let baseHeightMax = 400; // Base maximum height
  let heightTrend = 0; // Used to create gradual height changes
  
  while (lastPlatformX < levelLength - 200) {
    // Random platform width between 60 and 100
    let platformWidth = random(60, 100);
    let platformX = lastPlatformX + random(100, 200);
    
    // Calculate new height with more variation
    let heightVariation = 80 + (currentLevelNumber - 1) * 30; // Increased variation
    
    // Update height trend (creates smoother transitions)
    heightTrend += random(-30, 30);
    heightTrend = constrain(heightTrend, -50, 50);
    
    // Calculate platform Y with trend and variation
    let platformY = constrain(
      lastPlatformY + heightTrend + random(-heightVariation, heightVariation),
      baseHeightMin,
      baseHeightMax
    );
    
    // Occasionally create high platforms
    if (random() < 0.2) { // 20% chance
      platformY = random(150, 250);
    }
    
    // Check for playability (ensure platforms aren't too far apart vertically)
    let maxJumpHeight = 120; // Maximum height player can jump
    if (abs(platformY - lastPlatformY) > maxJumpHeight) {
      // Add an intermediate platform if gap is too large
      let midX = (lastPlatformX + platformX) / 2;
      let midY = (lastPlatformY + platformY) / 2;
      platforms.push({
        x: midX,
        y: midY,
        width: random(60, 80),
        height: 20,
        theme: currentTheme
      });
    }
    
    // Check for overlap with existing platforms
    let overlap = false;
    for (let platform of platforms) {
      if (abs(platformX - platform.x) < platformWidth &&
          abs(platformY - platform.y) < 50) {
        overlap = true;
        break;
      }
    }
    
    if (!overlap) {
      // Add platform
      platforms.push({
        x: platformX,
        y: platformY,
        width: platformWidth,
        height: 20,
        theme: currentTheme
      });
      
      // Function to check perk overlap
      function checkPerkOverlap(x, y) {
        for (let perk of perks) {
          if (abs(x - perk.x) < 30 && abs(y - perk.y) < 30) {
            return true;
          }
        }
        for (let mishap of mishaps) {
          if (abs(x - mishap.x) < 30 && abs(y - mishap.y) < 30) {
            return true;
          }
        }
        return false;
      }
      
      // Add perk with level-based probability
      if (random() < perkChance) {
        let perkX = platformX + random(10, platformWidth - 30);
        let perkY = platformY - 30;
        
        if (!checkPerkOverlap(perkX, perkY)) {
          let rand = random();
          let perkType;
          
          // Distribute perk types based on level-adjusted probabilities
          if (rand < coinChance) perkType = 'coin';
          else if (rand < coinChance + mapChance) perkType = 'map';
          else perkType = 'star';
          
          perks.push({
            x: perkX,
            y: perkY,
            width: 20,
            height: 20,
            type: perkType
          });
        }
      }
      
      // Add mishap with level-based probability
      if (random() < mishapChance) {
        let mishapX = platformX + random(10, platformWidth - 30);
        let mishapY = platformY - 30;
        
        if (!checkPerkOverlap(mishapX, mishapY)) {
          // Adjust mishap type distribution based on level
          let mishapType;
          let typeRand = random();
          
          if (currentLevelNumber === 1) {
            // Level 1: 40% clouds (was 80%), 60% dollars (was 20%), no suitcases
            mishapType = typeRand < 0.4 ? 'cloud' : 'dollar';
          } else if (currentLevelNumber === 2) {
            // Level 2: 40% clouds, 40% dollars, 20% suitcases
            if (typeRand < 0.4) mishapType = 'cloud';
            else if (typeRand < 0.8) mishapType = 'dollar';
            else mishapType = 'suitcase';
          } else {
            // Level 3: 20% clouds, 40% dollars, 40% suitcases
            if (typeRand < 0.2) mishapType = 'cloud';
            else if (typeRand < 0.6) mishapType = 'dollar';
            else mishapType = 'suitcase';
          }
          
          mishaps.push({
            x: mishapX,
            y: mishapY,
            width: 20,
            height: 20,
            type: mishapType,
            isStatic: true,
            creationTime: millis()
          });
        }
      }
      
      lastPlatformX = platformX;
      lastPlatformY = platformY;
    }
  }
  
  // Add final platform and level end marker
  let finalPlatform = {
    x: levelLength - 150,
    y: random(250, 350),
    width: 100,
    height: 20,
    theme: currentTheme
  };
  
  platforms.push(finalPlatform);
  
  // Place level end marker on the final platform
  levelEndMarker = {
    x: finalPlatform.x + finalPlatform.width/2 - 25,
    y: finalPlatform.y - 50,
    width: 50,
    height: 50
  };
  
  // Add bonus platforms with adjusted difficulty
  let bonusPlatforms = 3 - (currentLevelNumber - 1); // Fewer bonus platforms in higher levels
  for (let i = 0; i < bonusPlatforms; i++) {
    let platformX = random(300, levelLength - 300);
    let platformY = random(150, 250);  // Higher platforms
    let platformWidth = random(40, 60);  // Smaller platforms
    
    // More strict overlap checking
    let overlap = false;
    for (let platform of platforms) {
      if (abs(platformX - platform.x) < platformWidth + 100 && 
          abs(platformY - platform.y) < 150) {
        overlap = true;
        break;
      }
    }
    
    if (!overlap) {
      platforms.push({
        x: platformX,
        y: platformY,
        width: platformWidth,
        height: 20,
        theme: currentTheme
      });
      
      // Add special perk (star) with scaled reward
      perks.push({
        x: platformX + platformWidth/2 - 10,
        y: platformY - 30,
        width: 20,
        height: 20,
        type: 'star'
      });
    }
  }
}

// Draw function - main game loop
function draw() {
  // Keep global gameState in sync
  window.gameState = gameState;
  
  // Handle continuous button presses
  if (gameState === 'playing' && !showingDecision) {
    let btnSize = 45;
    let btnY = height - btnSize - 20;
    
    // Check for mouse press on arrow buttons
    if (mouseIsPressed) {
      // Left arrow button check
      let leftBtnX = width - (btnSize * 2) - 40;
      if (mouseX >= leftBtnX && mouseX <= leftBtnX + btnSize &&
          mouseY >= btnY && mouseY <= btnY + btnSize) {
        if (player.worldX > 100) {
          player.worldX -= player.speed;
          player.facingRight = false;
        }
      }
      
      // Right arrow button check
      let rightBtnX = width - btnSize - 20;
      if (mouseX >= rightBtnX && mouseX <= rightBtnX + btnSize &&
          mouseY >= btnY && mouseY <= btnY + btnSize) {
        player.worldX += player.speed;
        player.facingRight = true;
      }
    }
    
    // Check for touch on arrow buttons
    for (let touch of touches) {
      // Left arrow button check
      let leftBtnX = width - (btnSize * 2) - 40;
      if (touch.x >= leftBtnX && touch.x <= leftBtnX + btnSize &&
          touch.y >= btnY && touch.y <= btnY + btnSize) {
        if (player.worldX > 100) {
          player.worldX -= player.speed;
          player.facingRight = false;
        }
      }
      
      // Right arrow button check
      let rightBtnX = width - btnSize - 20;
      if (touch.x >= rightBtnX && touch.x <= rightBtnX + btnSize &&
          touch.y >= btnY && touch.y <= btnY + btnSize) {
        player.worldX += player.speed;
        player.facingRight = true;
      }
    }
  }
  
  // Continue with existing draw states
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    updateGame();
    drawPlayingScreen();
  } else if (gameState === 'gameOver') {
    drawGameOverScreen();
  } else if (gameState === 'win') {
    drawWinScreen();
  }
}

// Draw the start screen with improved layout
function drawStartScreen() {
  // Background
  background('#d9d9d9');  // Updated to light gray
  
  // Title and subtitle - centered and higher up
  fill('#c72a09');  // Updated to bold red
  textStyle(BOLD);
  textSize(titleFontSize * window.gameScale);
  textAlign(CENTER, CENTER);
  text("WELCOME TO TRIPCHAOS!", width/2, height/10);
  
  // Welcome text - centered with proper spacing
  fill('#000000');  // Updated to black
  textStyle(NORMAL);
  textSize(bodyFontSize * window.gameScale);
  textAlign(CENTER, CENTER);
  
  // Draw each line separately for better control
  text("Navigate through beaches, cities, and adventures", width/2, height/6 + 20 * window.gameScale);
  text("while managing your budget, satisfaction, and time.", width/2, height/6 + 50 * window.gameScale);
  text("Collect items, avoid mishaps, and make smart decisions to succeed!", width/2, height/6 + 80 * window.gameScale);
  
  // Game elements table - moved down slightly
  drawElementsTable();
  
  // Controls legend
  drawControlsLegend();
  
  // Start button - moved down and scaled
  let startBtnX = width/2 - (100 * window.gameScale);
  let startBtnY = height - (100 * window.gameScale);
  let startBtnW = 200 * window.gameScale;
  let startBtnH = 40 * window.gameScale;
  
  // Button with hover effect
  let isHovering = mouseX >= startBtnX && mouseX <= startBtnX + startBtnW && 
                   mouseY >= startBtnY && mouseY <= startBtnY + startBtnH;
  
  fill(isHovering ? '#c72a09' : '#f5f7f8');
  stroke('#000000');
  strokeWeight(3 * window.gameScale);
  rect(startBtnX, startBtnY, startBtnW, startBtnH, 10 * window.gameScale);
  
  // Button text
  noStroke();
  fill(isHovering ? '#ffffff' : '#000000');
  textSize(20 * window.gameScale);
  textAlign(CENTER, CENTER);
  text("START GAME", width/2, startBtnY + 20 * window.gameScale);
  
  // Cursor
  if (isHovering) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
  
  // Tripmerge note
  textAlign(CENTER);
  textSize(20 * window.gameScale);
  fill('#c72a09');
  strokeWeight(0);
  text("Struggling? TripMerge.com has tools to win in real life trip planning!", width/2, height - 40 * window.gameScale);
}

// Draw elements table with improved layout
function drawElementsTable() {
  let tableX = width/2 - 350;
  let tableY = height/6 + 120;
  let rowHeight = 35;
  let colWidth = 350;
  
  // Table header
  fill('#c72a09');  // Updated to bold red
  rect(tableX, tableY, colWidth * 2, rowHeight, 5, 5, 0, 0);
  
  fill('#ffffff');
  textAlign(CENTER);
  textSize(bodyFontSize);
  text("PERKS", tableX + colWidth/2, tableY + rowHeight/2 + 6);
  text("MISHAPS", tableX + colWidth + colWidth/2, tableY + rowHeight/2 + 6);
  
  // Table rows
  for (let i = 0; i < 3; i++) {
    // Row background
    fill('#f5f7f8');  // Updated to light background
    rect(tableX, tableY + rowHeight * (i+1), colWidth * 2, rowHeight);
    
    // Perk item (left column)
    let perk = gameElements[i];
    
    // Icon
    push();
    translate(tableX + 30, tableY + rowHeight * (i+1) + rowHeight/2);
    scale(1.2);
    perk.draw(0, 0);
    pop();
    
    // Text
    fill('#000000');  // Updated to black
    textAlign(LEFT);
    textSize(smallFontSize);
    text(perk.name + ": " + perk.description, 
         tableX + 60, tableY + rowHeight * (i+1) + rowHeight/2 + 4);
    
    // Mishap item (right column)
    let mishap = gameElements[i+3];
    
    // Icon
    push();
    translate(tableX + colWidth + 30, tableY + rowHeight * (i+1) + rowHeight/2);
    scale(1.2);
    mishap.draw(0, 0);
    pop();
    
    // Text
    fill('#000000');  // Updated to black
    textAlign(LEFT);
    textSize(smallFontSize);
    text(mishap.name + ": " + mishap.description, 
         tableX + colWidth + 60, tableY + rowHeight * (i+1) + rowHeight/2 + 4);
  }
}

// Draw controls with improved graphical layout
function drawControlsLegend() {
  let keySize = 30;
  let spacing = 80;
  let legendWidth = spacing * 2 + 40;
  let legendHeight = 90;
  let legendX = width/2 - legendWidth/2;
  let legendY = height - 220;
  
  // Background for controls section
  fill('#f5f7f8');  // Updated to light background
  rect(legendX, legendY, legendWidth, legendHeight, 5);
  
  // Title
  fill('#c72a09');  // Updated to bold red
  textStyle(BOLD);
  textAlign(CENTER);
  textSize(bodyFontSize);
  text("CONTROLS", width/2, legendY + 20);
  textStyle(NORMAL);
  
  // Draw RIGHT arrow key
  push();
  translate(legendX + spacing/2, legendY + 35);
  
  // Key background
  fill('#f5f7f8');  // Updated to light background
  stroke('#000000');
  strokeWeight(2);
  rect(0, 0, keySize, keySize, 6);
  
  // Arrow symbol
  fill('#000000');  // Updated to black
  noStroke();
  let arrowX = keySize/2;
  let arrowY = keySize/2;
  let arrowSize = keySize * 0.6;
  triangle(arrowX - arrowSize/3, arrowY - arrowSize/3,
           arrowX - arrowSize/3, arrowY + arrowSize/3,
           arrowX + arrowSize/3, arrowY);
  rect(arrowX - arrowSize/2, arrowY - 2, arrowSize/3, 4);
  
  // Label
  textAlign(CENTER);
  textSize(smallFontSize);
  text("MOVE RIGHT", keySize/2, keySize + 15);
  pop();
  
  // Draw UP arrow key
  push();
  translate(legendX + spacing * 1.5, legendY + 35);
  
  // Key background
  fill('#f5f7f8');  // Updated to light background
  stroke('#000000');
  strokeWeight(2);
  rect(0, 0, keySize, keySize, 6);
  
  // Arrow symbol
  fill('#000000');  // Updated to black
  noStroke();
  triangle(keySize/2, keySize/3,
           keySize/2 - arrowSize/3, keySize * 2/3,
           keySize/2 + arrowSize/3, keySize * 2/3);
  rect(keySize/2 - 2, keySize/2, 4, arrowSize/3);
  
  // Label
  textAlign(CENTER);
  textSize(smallFontSize);
  text("JUMP", keySize/2, keySize + 15);
  pop();
}

// Update game state
function updateGame() {
  // Don't update game physics during decision
  if (showingDecision) {
    // Still update visual elements
    updateCompanion();
    for (let wave of oceanWaves) {
      wave.x += wave.speed;
      if (wave.x > levelLength) wave.x = 0;
    }
    for (let cloud of clouds) {
      cloud.x += cloud.speed;
      if (cloud.x > levelLength) cloud.x = -cloud.width;
    }
    return;
  }
  
  // Update mishaps
  updateMishaps();
  
  // Handle cloud slowdown effect with explicit speed control
  if (player.cloudEffectCounter > 0) {
    // Make sure player is slowed
    if (!player.isSlowed) {
      player.speed = 2.5; // Match the speed set in collision
      player.isSlowed = true;
      console.log("Player slowed: " + player.speed);
    }
    
    player.cloudEffectCounter--;
    
    // When the effect ends
    if (player.cloudEffectCounter <= 0) {
      player.speed = 5; // Reset to normal speed (5)
      player.isSlowed = false;
      console.log("Player speed reset: " + player.speed);
    }
  }
  
  // Apply gravity to player
  player.velocityY += 0.7;
  player.y += player.velocityY;

  // Apply CONTROLLED movement based on keyboard input
  // This ensures the slowdown actually affects movement
  let moveSpeed = player.speed; // Use the current speed value
  
  if (keyIsDown(RIGHT_ARROW)) {
    player.worldX += moveSpeed;
    player.facingRight = true;
  }
  if (keyIsDown(LEFT_ARROW)) {
    // Only allow moving left if not at the start
    if (player.worldX > 100) {
      player.worldX -= moveSpeed;
      player.facingRight = false;
    }
  }
  if (keyIsDown(UP_ARROW) && !player.isJumping) {
    player.velocityY = -player.jumpForce;
    player.isJumping = true;
  }
  
  // Check platform collisions
  let onPlatform = false;
  for (let platform of platforms) {
    if (checkPlatformCollision(player, platform)) {
      onPlatform = true;
      break;
    }
  }

  // Update jumping state
  if (onPlatform) {
    player.isJumping = false;
  }

  // Constrain player to level bounds
  player.worldX = constrain(player.worldX, 100, levelLength - player.width);
  player.y = constrain(player.y, 0, height - player.height);

  // Update camera position based on player's world position
  cameraOffset = player.worldX - 100;
  cameraOffset = constrain(cameraOffset, 0, levelLength - width);

  // Calculate player's screen position from world position
  player.x = player.worldX - cameraOffset;

  // Update companion position
  updateCompanion();
  
  // Check perk collisions
  for (let i = perks.length - 1; i >= 0; i--) {
    let perk = perks[i];
    let perkWorldX = perk.x - perk.width/4;
    let perkWorldY = perk.y - perk.height/4;
    let perkWidth = perk.width * 1.5;
    let perkHeight = perk.height * 1.5;
    
    if (player.worldX < perkWorldX + perkWidth &&
        player.worldX + player.width > perkWorldX &&
        player.y < perkWorldY + perkHeight &&
        player.y + player.height > perkWorldY) {
      
      // Store initial values
      let oldBudget = budget;
      let oldSatisfaction = satisfaction;
      let oldScore = score;
      
      // Apply effect based on type
      if (perk.type === 'coin') {
        budget += 5;
        score += 5;
      } else if (perk.type === 'map') {
        satisfaction += 5;
        score += 5;
      } else if (perk.type === 'star') {
        score += 15;
      }
      
      // Create effect notifications
      if (budget !== oldBudget) {
        effectNotifications.push({
          type: "Budget",
          value: budget - oldBudget,
          x: width/2,
          y: player.y - 30,
          duration: NOTIFICATION_DURATION
        });
      }
      if (satisfaction !== oldSatisfaction) {
        effectNotifications.push({
          type: "Satisfaction",
          value: satisfaction - oldSatisfaction,
          x: width/2,
          y: player.y - 50,
          duration: NOTIFICATION_DURATION
        });
      }
      if (score !== oldScore) {
        effectNotifications.push({
          type: "Score",
          value: score - oldScore,
          x: width/2,
          y: player.y - 70,
          duration: NOTIFICATION_DURATION
        });
      }
      
      perks.splice(i, 1);
    }
  }
  
  // Check mishap collisions
  for (let i = mishaps.length - 1; i >= 0; i--) {
    let mishap = mishaps[i];
    let mishapWorldX = mishap.x - mishap.width/4;
    let mishapWorldY = mishap.y - mishap.height/4;
    let mishapWidth = mishap.width * 1.5;
    let mishapHeight = mishap.height * 1.5;
    
    if (player.worldX < mishapWorldX + mishapWidth &&
        player.worldX + player.width > mishapWorldX &&
        player.y < mishapWorldY + mishapHeight &&
        player.y + player.height > mishapWorldY) {
      
      // Store initial values
      let oldBudget = budget;
      let oldSatisfaction = satisfaction;
      
      // Apply effect based on type with scaled impact
      if (mishap.type === 'cloud') {
        satisfaction -= 15;
        // Set cloud effect
        player.speed = 2.5;
        player.isSlowed = true;
        player.cloudEffectCounter = 180; // Changed to exactly 3 seconds (60fps * 3)
        greyAtmosphere = 1;
        effectNotifications.push({
          type: "Speed",
          value: "SLOWED DOWN BECAUSE OF THE RAIN",
          x: width/2,
          y: player.y - 70,
          duration: NOTIFICATION_DURATION
        });
      } else if (mishap.type === 'dollar') {
        budget -= 15; // Was 8
      } else if (mishap.type === 'suitcase') {
        satisfaction -= 15; // Was 8
      }
      
      // Create effect notifications
      if (budget !== oldBudget) {
        effectNotifications.push({
          type: "Budget",
          value: budget - oldBudget,
          x: width/2,
          y: player.y - 30,
          duration: NOTIFICATION_DURATION
        });
      }
      if (satisfaction !== oldSatisfaction) {
        effectNotifications.push({
          type: "Satisfaction",
          value: satisfaction - oldSatisfaction,
          x: width/2,
          y: player.y - 50,
          duration: NOTIFICATION_DURATION
        });
      }
      if (mishap.type === 'cloud') {
        effectNotifications.push({
          type: "Speed",
          value: "SLOWED DOWN BECAUSE OF THE RAIN",
          x: width/2,
          y: player.y - 70,
          duration: NOTIFICATION_DURATION
        });
      }
      
      // Remove the mishap after collision
      mishaps.splice(i, 1);
    }
  }
  
  // Check level end marker collision
  if (levelEndMarker) {
    // Convert marker to world coordinates for collision check
    let markerWorldX = levelEndMarker.x;
    let markerWorldY = levelEndMarker.y;
    
    // Check collision with player in world coordinates
    if (player.worldX < markerWorldX + levelEndMarker.width &&
        player.worldX + player.width > markerWorldX &&
        player.y < markerWorldY + levelEndMarker.height &&
        player.y + player.height > markerWorldY) {
      
      // Level completed!
      currentLevelNumber++;
      score += 50; // Bonus for completing level
      
      // Reset any active cloud effects
      player.cloudEffectCounter = 0;
      player.speed = 5; // Reset to normal speed (5)
      greyAtmosphere = 0;
      
      // Check if all three levels are completed
      if (currentLevelNumber > 3) {
        // Game completed - show win screen
        gameState = 'win';
        window.gameState = 'win';
        return;
      }
      
      // Change theme based on level
      if (currentLevelNumber % 3 === 1) {
        currentTheme = "beach";
      } else if (currentLevelNumber % 3 === 2) {
        currentTheme = "city";
      } else {
        currentTheme = "adventure";
      }
      
      // Generate new level
      generateLevel();
      
      // Reset player position but keep stats
      player.worldX = 100;
      player.x = 100;
      player.y = 300;
      player.velocityY = 1; // Reset to 1 as requested
      cameraOffset = 0;
      
      // Add time bonus
      timeLeft += 20;
      
      // Reset decision timer to prevent immediate decision after level change
      decisionTimer = 0;
      showingDecision = false;
      currentDecision = null;
      decisionsThisLevel = 0;
      decisionTriggeredAt = [false, false];
    }
  }
  
  // Check if player has fallen off the screen - GAME OVER
  if (player.y + player.height >= oceanHeight) {
    gameState = 'gameOver';
    window.gameState = 'gameOver';
  }
  
  // Update time ONLY if not in a decision
  if (!showingDecision) {
    timeLeft -= 0.02;
  }
  
  // Check game over conditions
  if (budget <= 0 || satisfaction <= 0 || timeLeft <= 0) {
    gameState = 'gameOver';
    window.gameState = 'gameOver';
  }
  
  // Update decision timer ONLY if not in a decision - replaced with position-based trigger
  if (!showingDecision) {
    // Check if player has reached a decision point
    for (let i = 0; i < decisionPositions.length; i++) {
      let decisionX = levelLength * decisionPositions[i];
      if (!decisionTriggeredAt[i] && player.worldX >= decisionX) {
        triggerRandomDecision();
        decisionTriggeredAt[i] = true;
        break;
      }
    }
  }
}

// Update companion position
function updateCompanion() {
  // Target position is behind the player
  companion.targetX = player.facingRight ? player.worldX - 40 : player.worldX + player.width + 15;
  
  // Smooth follow
  companion.worldX += (companion.targetX - companion.worldX) * 0.1;
  
  // Update screen position
  companion.x = companion.worldX - cameraOffset;
  
  // Match player's y position
  companion.y = player.y + 10;
}

// Draw the playing screen
function drawPlayingScreen() {
  // Clear the entire canvas at the start of each frame
  clear();
  
  // Draw the current theme background first
  if (currentTheme === "beach") {
    drawBeachTheme();
  } else if (currentTheme === "city") {
    drawCityTheme();
  } else {
    drawAdventureTheme();
  }

  // Apply camera transform for game objects
  push();
  translate(-cameraOffset, 0);
  
  // Draw all game objects in order of depth
  // Draw background elements first
  drawBackgroundElements();
  
  // Draw platforms
  for (let platform of platforms) {
    drawPlatform(platform);
  }
  
  // Draw perks
  for (let perk of perks) {
    drawPerk(perk);
  }
  
  // Draw mishaps
  for (let mishap of mishaps) {
    drawMishap(mishap);
  }
  
  // Draw level end marker (portal)
  if (levelEndMarker) {
    drawLevelEndMarker();
  }
  
  // Draw characters last
  drawCompanion();
  drawPlayer();
  
  pop(); // End camera transform
  
  // Draw UI elements (not affected by camera)
  drawGameUI();
  
  // Apply fog effect if active (on top of everything)
  if (player.cloudEffectCounter > 0) {
    drawFogEffect();
  }
  
  // Draw decision UI if active (should be on top of fog)
  if (showingDecision) {
    drawDecisionUI();
  }
  
  // Draw effect notifications
  drawEffectNotifications();
  
  // Draw slowdown message if active
  drawSlowdownMessage();
}

// Helper function to draw background elements
function drawBackgroundElements() {
  // This function can be used for any additional background elements that should move with the camera
}

// Helper function to draw the level end marker
function drawLevelEndMarker() {
  // Create a pulsing portal effect
  let pulse = sin(frameCount * 0.1) * 5;
  
  // Outer glow
  noFill();
  stroke(255, 215, 0, 150 + pulse * 10);
  strokeWeight(5 + pulse);
  ellipse(levelEndMarker.x + levelEndMarker.width/2, 
          levelEndMarker.y + levelEndMarker.height/2, 
          levelEndMarker.width + 10, levelEndMarker.height + 10);
  
  // Portal
  fill(255, 165, 0);
  noStroke();
  ellipse(levelEndMarker.x + levelEndMarker.width/2, 
          levelEndMarker.y + levelEndMarker.height/2, 
          levelEndMarker.width, levelEndMarker.height);
  
  // Inner portal
  fill(255, 255, 255, 150);
  ellipse(levelEndMarker.x + levelEndMarker.width/2, 
          levelEndMarker.y + levelEndMarker.height/2, 
          levelEndMarker.width/2, levelEndMarker.height/2);
}

// Simple function to show message when slowed
function drawSlowdownMessage() {
  if (player.cloudEffectCounter > 0) {
    push();
    textAlign(CENTER, CENTER);
    textSize(24);
    fill(255, 0, 0);
    text("SLOWED DOWN BECAUSE OF THE RAIN!", width/2, 50);
    pop();
  }
}

// Draw beach theme
function drawBeachTheme() {
  // Beautiful sunset gradient with vibrant colors
  noStroke();
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c;
    if (y < height * 0.3) {  // Upper sky - deep orange to pink
      let inter2 = map(y, 0, height * 0.3, 0, 1);
      c = lerpColor(
        color(255, 69, 0),    // Deep orange/red
        color(255, 127, 80),  // Coral pink
        inter2
      );
    } else if (y < height * 0.6) {  // Middle sky - pink to gold
      let inter2 = map(y, height * 0.3, height * 0.6, 0, 1);
      c = lerpColor(
        color(255, 127, 80),  // Coral pink
        color(255, 190, 100), // Golden yellow
        inter2
      );
    } else {  // Lower sky - gold to light yellow
      let inter2 = map(y, height * 0.6, height, 0, 1);
      c = lerpColor(
        color(255, 190, 100), // Golden yellow
        color(255, 230, 180), // Light yellow near horizon
        inter2
      );
    }
    fill(c);
    rect(0, y, width, 1);
  }
  
  // Rest of beach theme remains the same
  // Glowing sun with corona effect
  push();
  let sunX = sunPosition.x - cameraOffset * 0.2;
  let sunY = sunPosition.y;
  
  // Sun corona
  for (let i = 0; i < 360; i += 10) {
    let rad = radians(i);
    let len = 50 + sin(frameCount * 0.02 + i) * 10;
    stroke(255, 183, 77, 100);
    strokeWeight(2);
    line(sunX, sunY, 
         sunX + cos(rad) * len,
         sunY + sin(rad) * len);
  }
  
  // Main sun
  noStroke();
  fill(255, 183, 77);
  ellipse(sunX, sunY, 80, 80);
  
  // Sun face
  fill(255, 100, 0);
  ellipse(sunX - 15, sunY - 10, 8, 8); // Left eye
  ellipse(sunX + 15, sunY - 10, 8, 8); // Right eye
  noFill();
  stroke(255, 100, 0);
  strokeWeight(2);
  arc(sunX, sunY + 10, 40, 20, 0, PI);
  pop();
  
  // Parallax clouds with depth
  for (let cloud of clouds) {
    let cloudX = cloud.x - cameraOffset * 0.5;
    drawDetailedCloud(cloudX, cloud.y, cloud.width);
  }
  
  // Ocean with dynamic waves
  drawDetailedOcean();
  
  // Add palm trees in the background
  drawPalmTrees();
}

function drawCityTheme() {
  // Night city sky gradient
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(
      color(25, 25, 112),  // Midnight blue
      color(138, 43, 226), // Purple
      inter
    );
    stroke(c);
    line(0, y, width, y);
  }
  
  // Stars
  drawStars();
  
  // Moon
  drawMoon();
  
  // City skyline with lights
  drawCitySkyline();
  
  // Street lights and their reflections
  drawStreetLights();
}

function drawAdventureTheme() {
  // Mystical forest background gradient
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(
      color(34, 139, 34),  // Forest green
      color(85, 107, 47),  // Dark olive green
      inter
    );
    stroke(c);
    line(0, y, width, y);
  }
  
  // Distant mountains with snow caps
  drawMountains();
  
  // Forest with multiple layers for depth
  drawForest();
  
  // Mystical particles floating in the air
  drawMysticalParticles();
}

// Helper functions for detailed elements
function drawDetailedCloud(x, y, width) {
  push();
  noStroke();
  // Base cloud
  fill(255, 255, 255, 200);
  ellipse(x, y, width, width * 0.6);
  ellipse(x - width * 0.3, y, width * 0.7, width * 0.4);
  ellipse(x + width * 0.3, y, width * 0.7, width * 0.4);
  // Highlight
  fill(255, 255, 255);
  ellipse(x - width * 0.1, y - width * 0.1, width * 0.5, width * 0.3);
  pop();
}

function drawDetailedOcean() {
  push();
  // Ocean base
  fill(65, 105, 225);
  rect(0, oceanHeight, width, height - oceanHeight);
  
  // Dynamic waves
  stroke(255, 255, 255, 100);
  strokeWeight(3);
  for (let wave of oceanWaves) {
    let waveX = wave.x - cameraOffset * 0.8;
    beginShape();
    noFill();
    for (let i = 0; i < 100; i++) {
      let x = waveX + i * 10;
      let y = oceanHeight + sin(frameCount * 0.05 + i * 0.2) * 5;
      vertex(x, y);
    }
    endShape();
  }
  
  // Sparkles on water
  for (let i = 0; i < 50; i++) {
    let sparkleX = (frameCount + i * 50) % width;
    let sparkleY = random(oceanHeight, height);
    stroke(255, 255, 255, random(50, 150));
    point(sparkleX, sparkleY);
  }
  pop();
}

function drawPalmTrees() {
  push();
  // Draw several palm trees at different depths
  for (let i = 0; i < 5; i++) {
    let x = ((i * 500) - cameraOffset * 0.7) % levelLength;
    let y = oceanHeight - 50;
    
    // Trunk
    stroke(139, 69, 19);
    strokeWeight(10);
    noFill();
    bezier(x, y, x - 10, y - 30, x + 10, y - 60, x + 20, y - 80);
    
    // Leaves
    stroke(34, 139, 34);
    strokeWeight(5);
    for (let angle = 0; angle < TWO_PI; angle += PI/4) {
      let leafX = x + 20;
      let leafY = y - 80;
      bezier(leafX, leafY,
             leafX + cos(angle) * 30, leafY + sin(angle) * 30,
             leafX + cos(angle) * 60, leafY + sin(angle) * 60,
             leafX + cos(angle) * 80, leafY + sin(angle) * 80);
    }
  }
  pop();
}

function drawStars() {
  push();
  // Static stars
  for (let i = 0; i < 100; i++) {
    let x = (i * 50 - cameraOffset * 0.1) % width;
    let y = random(height/2);
    fill(255, 255, 255, random(100, 200));
    noStroke();
    ellipse(x, y, random(1, 3));
  }
  
  // Twinkling stars
  for (let i = 0; i < 20; i++) {
    let x = (i * 100 - cameraOffset * 0.1) % width;
    let y = random(height/3);
    let twinkle = sin(frameCount * 0.1 + i) * 127 + 128;
    fill(255, 255, 255, twinkle);
    noStroke();
    ellipse(x, y, random(2, 4));
  }
  pop();
}

function drawMoon() {
  push();
  let moonX = width * 0.8 - cameraOffset * 0.1;
  let moonY = height * 0.2;
  
  // Moon glow
  for (let i = 30; i > 0; i--) {
    noStroke();
    fill(255, 255, 255, i);
    ellipse(moonX, moonY, 80 + i*2);
  }
  
  // Moon surface
  fill(255);
  ellipse(moonX, moonY, 80);
  
  // Moon craters
  fill(200);
  ellipse(moonX - 20, moonY - 15, 15);
  ellipse(moonX + 10, moonY + 10, 20);
  ellipse(moonX + 15, moonY - 20, 12);
  pop();
}

function drawCitySkyline() {
  push();
  // Multiple layers of buildings with completely static positions and sizes
  for (let layer = 3; layer > 0; layer--) {
    let offset = cameraOffset * (0.3 * layer);
    let alpha = map(layer, 1, 3, 255, 150);
    let layerSeed = 123 * layer; // Fixed seed for each layer
    
    for (let i = 0; i < 10; i++) {
      let x = ((i * 200) - offset) % levelLength;
      // Use noise with fixed seeds for stable dimensions
      let buildingHeight = map(noise(i * 0.5 + layerSeed), 0, 1, 100, 200) * layer;
      let buildingWidth = map(noise(i * 0.3 + layerSeed), 0, 1, 40, 80) * layer;
      
      // Building
      fill(50, 50, 50, alpha);
      rect(x, oceanHeight - buildingHeight, buildingWidth, buildingHeight);
      
      // Windows - completely static with minimal variation
      fill(255, 255, 150, alpha);
      let windowRows = floor(buildingHeight / 30);
      let windowCols = floor(buildingWidth / 20);
      
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          // Use position-based noise for window state (on/off)
          let windowState = noise(x * 0.05 + col * 0.3, row * 0.3 + layerSeed);
          if (windowState < 0.7) {  // 70% of windows are lit
            // Very subtle brightness variation using stable noise
            let brightness = map(noise(col * 0.5 + layerSeed, row * 0.5), 0, 1, 245, 255);
            fill(255, 255, brightness, alpha);
            let wx = x + 10 + col * 20;
            let wy = oceanHeight - buildingHeight + 10 + row * 30;
            rect(wx, wy, 10, 20);
          }
        }
      }
    }
  }
  pop();
}

function drawStreetLights() {
  push();
  for (let i = 0; i < 10; i++) {
    let x = ((i * 300) - cameraOffset * 0.8) % levelLength;
    let y = oceanHeight - 20;
    
    // Light pole
    stroke(100);
    strokeWeight(5);
    line(x, y, x, y - 100);
    line(x, y - 100, x + 50, y - 100);
    
    // Light glow - almost static with minimal variation
    let flickerIntensity = 245 + sin(frameCount * 0.02 + i) * 0.5;  // Extremely reduced flicker range
    for (let r = 30; r > 0; r--) {
      noStroke();
      fill(255, 255, 200, flickerIntensity * (r/20));
      ellipse(x + 50, y - 100, r*2);
    }
    
    // Light reflection on ground - very stable
    for (let r = 50; r > 0; r--) {
      noStroke();
      fill(255, 255, 200, (flickerIntensity/8) * (r/50));
      ellipse(x + 50, y, r*3, r);
    }
  }
  pop();
}

function drawMountains() {
  push();
  // Three layers of mountains with stable positions
  for (let layer = 3; layer > 0; layer--) {
    let offset = cameraOffset * (0.2 * layer);
    let alpha = map(layer, 1, 3, 255, 150);
    
    // Use noise for stable mountain generation
    let mountainSeed = 123 * layer; // Fixed seed for each layer
    
    for (let i = 0; i < 5; i++) {
      let x = ((i * 400) - offset) % levelLength;
      // Use noise instead of random for stable height
      let peakHeight = map(noise(i * 0.5 + mountainSeed), 0, 1, 150, 250) * layer;
      
      // Mountain body
      fill(101, 67, 33, alpha);
      triangle(x - 200, oceanHeight,
              x, oceanHeight - peakHeight,
              x + 200, oceanHeight);
      
      // Snow cap with stable position
      fill(255, 255, 255, alpha);
      let snowCapWidth = 50 + noise(i * 0.3 + mountainSeed) * 20;
      triangle(x - snowCapWidth, oceanHeight - peakHeight + 50,
              x, oceanHeight - peakHeight,
              x + snowCapWidth, oceanHeight - peakHeight + 50);
    }
  }
  pop();
}

function drawForest() {
  push();
  // Multiple layers of trees with reduced movement
  for (let layer = 3; layer > 0; layer--) {
    let offset = cameraOffset * (0.3 * layer);
    let alpha = map(layer, 1, 3, 255, 150);
    
    // Use noise for stable random values
    let noiseOffset = frameCount * 0.0001;  // Very slow movement
    
    for (let i = 0; i < 15; i++) {
      let x = ((i * 100) - offset) % levelLength;
      let y = oceanHeight - (70 + noise(i * 0.5, noiseOffset) * 30) * layer;
      
      // Tree trunk
      fill(101, 67, 33, alpha);
      rect(x - 5, y, 10, 100);
      
      // Tree foliage with subtle movement
      fill(34, 139, 34, alpha);
      let swayAmount = sin(frameCount * 0.02 + i) * 2;  // Reduced sway
      
      // First triangle (bottom)
      triangle(x - 30 + swayAmount, y,
              x, y - 60,
              x + 30 + swayAmount, y);
              
      // Second triangle (top)
      triangle(x - 25 + swayAmount, y - 30,
              x, y - 80,
              x + 25 + swayAmount, y - 30);
    }
  }
  pop();
}

function drawMysticalParticles() {
  push();
  // Floating particles with glow
  for (let i = 0; i < 50; i++) {
    let x = ((frameCount + i * 50) - cameraOffset * 0.5) % levelLength;
    let y = height/2 + sin(frameCount * 0.02 + i) * 50;
    let alpha = sin(frameCount * 0.05 + i) * 127 + 128;
    
    // Particle glow
    for (let r = 10; r > 0; r--) {
      noStroke();
      fill(255, 255, 200, alpha * (r/10));
      ellipse(x, y, r*2);
    }
  }
  pop();
}

// Draw platform based on theme
function drawPlatform(platform) {
  // Use same style for all themes
  fill(210, 180, 140); // Tan/beachwood color
  noStroke();  // Remove contours for all platforms
  rect(platform.x, platform.y, platform.width, platform.height);
}

// Draw player character
function drawPlayer() {
  push();
  translate(player.worldX, player.y);
  
  // Body
  fill(255, 100, 100);
  rect(0, 10, player.width, player.height - 10, 5);
  
  // Head
  ellipse(player.width/2, 10, player.width * 0.8, player.width * 0.8);
  
  // Backpack
  fill(139, 69, 19);
  rect(player.facingRight ? -5 : player.width - 5, 15, 10, 25, 3);
  
  // Camera around neck
  fill(50);
  rect(player.width/2 - 8, 15, 16, 10, 2);
  
  // Face
  fill(0);
  // Eyes
  if (player.facingRight) {
    ellipse(player.width/2 + 5, 8, 4, 4);
    ellipse(player.width/2 + 12, 8, 4, 4);
  } else {
    ellipse(player.width/2 - 12, 8, 4, 4);
    ellipse(player.width/2 - 5, 8, 4, 4);
  }
  // Smile
  noFill();
  stroke(0);
  strokeWeight(1.5);
  if (player.facingRight) {
    arc(player.width/2 + 8, 10, 10, 8, 0, PI);
  } else {
    arc(player.width/2 - 8, 10, 10, 8, 0, PI);
  }
  noStroke();
  
  pop();
}

// Draw companion character
function drawCompanion() {
  push();
  translate(companion.worldX, companion.y);
  
  // Body
  fill(100, 100, 255);
  rect(0, 8, companion.width, companion.height - 8, 5);
  
  // Head
  ellipse(companion.width/2, 8, companion.width * 0.7, companion.width * 0.7);
  
  // Hat
  fill(255, 200, 0);
  arc(companion.width/2, 8, companion.width * 0.8, companion.width * 0.8, PI, TWO_PI);
  
  // Face
  fill(0);
  // Eyes
  if (companion.worldX < player.worldX) {
    ellipse(companion.width/2 + 4, 6, 3, 3);
    ellipse(companion.width/2 + 9, 6, 3, 3);
  } else {
    ellipse(companion.width/2 - 9, 6, 3, 3);
    ellipse(companion.width/2 - 4, 6, 3, 3);
  }
  // Smile
  noFill();
  stroke(0);
  strokeWeight(1);
  if (companion.worldX < player.worldX) {
    arc(companion.width/2 + 6, 8, 8, 6, 0, PI);
  } else {
    arc(companion.width/2 - 6, 8, 8, 6, 0, PI);
  }
  noStroke();
  
  pop();
}

// Draw perks (larger and more detailed)
function drawPerk(perk) {
  push();
  translate(perk.x + perk.width/2, perk.y + perk.height/2);
  scale(1.5);
  noStroke();  // Remove all contours
  
  if (perk.type === 'coin') {
    // Gold coin with shine
    fill(255, 215, 0);
    ellipse(0, 0, perk.width, perk.height);
    fill(255, 235, 100);
    ellipse(0, 0, perk.width * 0.8, perk.height * 0.8);
    fill(255, 215, 0);
    fill(255, 255, 255, 150);
    ellipse(-perk.width/4, -perk.height/4, perk.width/4, perk.height/4);
  } 
  else if (perk.type === 'map') {
    // Map base
    fill(50, 205, 50);  // Green color
    rect(-perk.width/2, -perk.height/2, perk.width, perk.height, 2);
    
    // Direction arrow
    stroke(255);  // White arrow for contrast
    strokeWeight(perk.width/8);
    line(-perk.width/4, 0, perk.width/4, 0);           // Arrow body
    line(perk.width/4, 0, 0, -perk.height/4);          // Arrow head top
    line(perk.width/4, 0, 0, perk.height/4);           // Arrow head bottom
  } 
  else if (perk.type === 'star') {
    // Souvenir gift box
    fill(100, 100, 255);
    rect(-perk.width/2, -perk.height/2, perk.width, perk.height, 2); // Box
    
    // Ribbon
    fill(0, 0, 255);
    rect(-perk.width/2, -perk.height/8, perk.width, perk.height/4); // Horizontal ribbon
    rect(-perk.width/8, -perk.height/2, perk.width/4, perk.height); // Vertical ribbon
    
    // Gift bow
    fill(100, 100, 255);
    ellipse(0, 0, perk.width/3, perk.height/3); // Center of bow
    
    // Knot details
    fill(0, 0, 255);
    let knotSize = perk.width/6;
    ellipse(-knotSize*1.5, -knotSize*1.5, knotSize, knotSize); // Top left knot
    ellipse(knotSize*1.5, -knotSize*1.5, knotSize, knotSize); // Top right knot
    ellipse(-knotSize*1.5, knotSize*1.5, knotSize, knotSize); // Bottom left knot
    ellipse(knotSize*1.5, knotSize*1.5, knotSize, knotSize); // Bottom right knot
  }
  
  pop();
}

// Draw mishaps (larger and more detailed)
function drawMishap(mishap) {
  push();
  translate(mishap.x + mishap.width/2, mishap.y + mishap.height/2);
  scale(1.5);
  noStroke();  // Remove all contours
  
  if (mishap.type === 'cloud') {
    // Storm cloud with rain
    fill(169, 169, 169);
    ellipse(0, 0, mishap.width * 1.2, mishap.height);
    ellipse(-mishap.width/3, 0, mishap.width * 0.8, mishap.height * 0.8);
    ellipse(mishap.width/3, 0, mishap.width * 0.8, mishap.height * 0.8);
    fill(100, 149, 237);
    triangle(-mishap.width/3, mishap.height/2,
             -mishap.width/3 - 3, mishap.height,
             -mishap.width/3 + 3, mishap.height);
    triangle(0, mishap.height/2,
             -3, mishap.height,
             3, mishap.height);
    triangle(mishap.width/3, mishap.height/2,
             mishap.width/3 - 3, mishap.height,
             mishap.width/3 + 3, mishap.height);
  }
  else if (mishap.type === 'dollar') {
    // Red dollar sign
    fill(220, 20, 60);
    textAlign(CENTER, CENTER);
  textSize(20);
    textStyle(BOLD);
    text("💳", 0, 0);
    textStyle(NORMAL);
  } 
  else if (mishap.type === 'suitcase') {
    // Tilted lost suitcase with question mark
    push();
    rotate(PI/12); // Slight tilt
    
    // Brown suitcase base
    fill(139, 69, 19);  // Saddle brown
    rect(-mishap.width/2, -mishap.height/2, mishap.width, mishap.height, 2);
    
    // Handle
    stroke(101, 67, 33);  // Darker brown
    strokeWeight(2);
    noFill();
    arc(0, -mishap.height/2, mishap.width/2, mishap.height/4, PI, TWO_PI);
    
    // Question mark
    fill(255);  // White question mark
    textAlign(CENTER, CENTER);
    textSize(mishap.width/2);
    text("?", 0, 0);
    
    pop();
    noStroke();
  }
  
  pop();
}

// Draw decision UI with improved readability
function drawDecisionUI() {
  push();  // Save the current drawing state
  
  // Semi-transparent overlay - reduced opacity
  fill(0, 0, 0, 100);  // Reduced from 150 to 100
  noStroke();
  rect(0, 0, width, height);
  
  // Box dimensions and position
  let boxWidth = 500;
  let boxHeight = 300;
  let boxX = width/2 - boxWidth/2;
  let boxY = height/2 - boxHeight/2;
  
  // Decision box
  fill('#f5f7f8');
  stroke('#000000');
  strokeWeight(2);
  rect(boxX, boxY, boxWidth, boxHeight, 10);
  
  // Title bar
  fill(highlightTextColor);
  noStroke();
  rect(boxX, boxY, boxWidth, 40, 10, 10, 0, 0);
  
  // Decision title
  fill('#ffffff');
  textStyle(BOLD);
  textAlign(CENTER);
  textSize(24);
  text("DECISION POINT", width/2, boxY + 28);
  textStyle(NORMAL);
  
  // Question
  fill(primaryTextColor);
  textSize(18);
  text(currentDecision.question, width/2, boxY + 80);
  
  // Options
  for (let i = 0; i < currentDecision.options.length; i++) {
    let y = boxY + 120 + i * 50;
    let isHovering = mouseX >= width/2 - 180 && mouseX <= width/2 + 180 && 
                     mouseY >= y && mouseY <= y + 40;
    
    // Option button
    fill(isHovering ? '#c72a09' : '#f5f7f8');
    stroke('#000000');
    strokeWeight(1);
    rect(width/2 - 180, y, 360, 40, 5);
    
    // Option text
    noStroke();
    fill(isHovering ? '#ffffff' : '#000000');
    textAlign(LEFT);
    text(currentDecision.options[i].text, width/2 - 140, y + 26);
    
    // Change cursor on hover
    if (isHovering) {
      cursor(HAND);
    }
  }
  
  // Reset cursor if not hovering over any option
  if (mouseY < boxY + 120 || mouseY > boxY + 120 + 3 * 50 || 
      mouseX < width/2 - 180 || mouseX > width/2 + 180) {
    cursor(ARROW);
  }
  
  // Instruction text
  fill(primaryTextColor);
  textAlign(CENTER);
  textSize(14);
  text("Click an option or press 1-3 to choose", width/2, boxY + boxHeight - 20);
  
  pop();  // Restore the previous drawing state
}

// Trigger a random decision
function triggerRandomDecision() {
  currentDecision = random(decisions);
  showingDecision = true;
  decisionTimer = 0;
}

// Make a decision
function makeDecision(optionIndex) {
  if (currentDecision && currentDecision.options[optionIndex]) {
    // Store initial values
    let oldBudget = budget;
    let oldSatisfaction = satisfaction;
    let oldTimeLeft = timeLeft;
    
    // Apply the effect
    currentDecision.options[optionIndex].effect();
    
    // Calculate changes
    let budgetChange = budget - oldBudget;
    let satisfactionChange = satisfaction - oldSatisfaction;
    let timeChange = timeLeft - oldTimeLeft;
    
    // Count how many changes we'll show to calculate vertical spacing
    let changes = 0;
    if (budgetChange !== 0) changes++;
    if (satisfactionChange !== 0) changes++;
    if (timeChange !== 0) changes++;
    
    // Calculate starting Y position based on number of notifications
    let startY = height/2 - (changes - 1) * 25; // 25 pixels between each notification
    let currentY = startY;
    
    // Create notifications with stacked positioning
    if (budgetChange !== 0) {
      effectNotifications.push({
        type: "Budget",
        value: Math.round(budgetChange),
        x: width/2,
        y: currentY,
        duration: NOTIFICATION_DURATION
      });
      currentY += 25;
    }
    
    if (satisfactionChange !== 0) {
      effectNotifications.push({
        type: "Satisfaction",
        value: Math.round(satisfactionChange),
        x: width/2,
        y: currentY,
        duration: NOTIFICATION_DURATION
      });
      currentY += 25;
    }
    
    if (timeChange !== 0) {
      effectNotifications.push({
        type: "Time",
        value: Math.round(timeChange),
        x: width/2,
        y: currentY,
        duration: NOTIFICATION_DURATION
      });
    }
    
    // Resume game and properly clear decision state
    showingDecision = false;
    currentDecision = null;
    decisionTimer = 0;
    
    // Clear any lingering mishaps that might have spawned during decision
    mishaps = mishaps.filter(mishap => mishap.isStatic);
  }
}

// Draw game UI with improved readability
function drawGameUI() {
  push();
  
  if (isMobileDevice()) {
    // Calculate the game viewport center offset for mobile
    let gameWidth = 1000 * window.gameScale;
    let gameHeight = 600 * window.gameScale;
    let offsetX = (width - gameWidth) / 2;
    let offsetY = (height - gameHeight) / 2;
    
    // Apply translation to center the game viewport
    translate(offsetX, offsetY);
  }
  
  // Draw UI elements
  fill(0);
  textSize(20 * window.gameScale);
  textAlign(LEFT, TOP);
  
  // Draw level indicator with total levels
  text(`Level ${currentLevelNumber}/3`, 20 * window.gameScale, 20 * window.gameScale);
  
  // Draw meters horizontally across the top
  let meterSpacing = (isMobileDevice() ? 1000 * window.gameScale : width) / 5;
  drawMeter("Budget", budget, meterSpacing, 20 * window.gameScale);
  drawMeter("Satisfaction", satisfaction, meterSpacing * 2, 20 * window.gameScale);
  drawMeter("Time", timeLeft, meterSpacing * 3, 20 * window.gameScale);
  drawMeter("Score", score, meterSpacing * 4, 20 * window.gameScale);
  
  // Draw control buttons only on mobile when playing
  if (gameState === 'playing' && !showingDecision && isMobileDevice()) {
    push();
    // Common button properties with scaling
    let btnSize = 60 * window.gameScale;
    let btnY = (isMobileDevice() ? 600 * window.gameScale : height) - btnSize - (30 * window.gameScale);
    drawingContext.shadowBlur = 5 * window.gameScale;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
    
    // Jump button (left side)
    let jumpBtnX = 30 * window.gameScale;
    fill('#f5f7f8');
    stroke('#000000');
    strokeWeight(2 * window.gameScale);
    rect(jumpBtnX, btnY, btnSize, btnSize, 12 * window.gameScale);
    
    // Up arrow for jump
    fill('#000000');
    noStroke();
    beginShape();
    vertex(jumpBtnX + btnSize/2, btnY + btnSize/4);
    vertex(jumpBtnX + btnSize/4, btnY + 3*btnSize/4);
    vertex(jumpBtnX + 3*btnSize/4, btnY + 3*btnSize/4);
    endShape(CLOSE);
    
    // Left arrow button
    let leftBtnX = (isMobileDevice() ? 1000 * window.gameScale : width) - (btnSize * 2) - (50 * window.gameScale);
    fill('#f5f7f8');
    stroke('#000000');
    strokeWeight(2 * window.gameScale);
    rect(leftBtnX, btnY, btnSize, btnSize, 12 * window.gameScale);
    
    // Left arrow symbol
    fill('#000000');
    noStroke();
    beginShape();
    vertex(leftBtnX + btnSize/4, btnY + btnSize/2);
    vertex(leftBtnX + 3*btnSize/4, btnY + btnSize/4);
    vertex(leftBtnX + 3*btnSize/4, btnY + 3*btnSize/4);
    endShape(CLOSE);
    
    // Right arrow button
    let rightBtnX = (isMobileDevice() ? 1000 * window.gameScale : width) - btnSize - (30 * window.gameScale);
    fill('#f5f7f8');
    stroke('#000000');
    strokeWeight(2 * window.gameScale);
    rect(rightBtnX, btnY, btnSize, btnSize, 12 * window.gameScale);
    
    // Right arrow symbol
    fill('#000000');
    noStroke();
    beginShape();
    vertex(rightBtnX + 3*btnSize/4, btnY + btnSize/2);
    vertex(rightBtnX + btnSize/4, btnY + btnSize/4);
    vertex(rightBtnX + btnSize/4, btnY + 3*btnSize/4);
    endShape(CLOSE);
    
    pop();
  }
  pop();
}

// Draw a meter for game stats
function drawMeter(label, value, x, y) {
  push();
  
  // Bar dimensions
  let barWidth = 120;
  let barHeight = 20;
  
  // Draw the background bar
  fill(200);
  noStroke();
  rect(x, y, barWidth, barHeight, 5);
  
  // Draw the value bar
  let fillWidth = map(value, 0, 100, 0, barWidth);
  fill('#4CAF50');  // Green color for the meter
  rect(x, y, fillWidth, barHeight, 5);
  
  // Draw the label and value on top of the bar
  fill(255); // White text for better contrast
  textAlign(CENTER, CENTER);
  textSize(14);
  let displayValue = Math.round(value);
  text(`${label}: ${displayValue}`, x + barWidth/2, y + barHeight/2);
  
  pop();
}

// Draw game over screen with improved readability
function drawGameOverScreen() {
  background('#d9d9d9');

  // Handle leaderboard view if active
  if (showLeaderboard) {
    drawLeaderboardScreen();
    return;
  }

  // Game Over Title and Play Again text
  noStroke();
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(titleFontSize);
  textAlign(CENTER);
  text("GAME OVER", width/2 - 100, height/12);
  
  // Play Again text - white with red contour
  let playAgainX = width/2 + 150;
  let playAgainY = height/12;
  let isPlayAgainHovering = mouseX >= playAgainX - 80 && mouseX <= playAgainX + 80 && 
                           mouseY >= playAgainY - 20 && mouseY <= playAgainY + 20;
  
  stroke(highlightTextColor);
  strokeWeight(3);
  fill('#ffffff');
  text("PLAY AGAIN", playAgainX, playAgainY);
  noStroke();
  
  if (isPlayAgainHovering) {
    cursor(HAND);
  } else if (!isEmailInputActive) {
    cursor(ARROW);
  }

  // Score section
  fill('#f5f7f8');
  rect(width/2 - 150, height/12 + 20, 300, 50, 10);
  
  fill(primaryTextColor);
  textSize(bodyFontSize);
  text(`Final Score: ${score}`, width/2, height/12 + 50);

  // Achievement section
  let achievement = getAchievement(score);
  fill(achievement.color);
  textStyle(BOLD);
  textSize(bodyFontSize);
  text("🏆", width/2 - 90, height/12 + 90);
  text(achievement.title, width/2, height/12 + 90);
  
  // Achievement description
  fill(primaryTextColor);
  textStyle(NORMAL);
  textSize(smallFontSize);
  text("Achievement Unlocked!", width/2, height/12 + 110);

  // Challenges section - moved down to accommodate achievement
  fill('#f5f7f8');
  rect(width/2 - 300, height/12 + 130, 600, 100, 10);

  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  text("Your trip faced challenges with:", width/2, height/12 + 150);
  
  textStyle(NORMAL);
  fill(primaryTextColor);
  textSize(smallFontSize);
  text(`• Budget management: ${Math.round((100 - budget))}% overspent`, width/2, height/12 + 170);
  text(`• Group coordination: ${Math.round((100 - satisfaction))}% satisfaction lost`, width/2, height/12 + 190);
  text(`• Finding the best experiences: ${Math.floor(score/100)}/10 gems found`, width/2, height/12 + 210);

  // TripMerge solutions section - Redesigned with two columns
  fill('#f5f7f8');
  rect(width/2 - 300, height/12 + 250, 600, 120, 10);

  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  text("In real life, avoid these problems with Tripmerge!", width/2, height/12 + 270);

  // TripMerge features list - two columns with smaller text
  textStyle(NORMAL);
  fill(primaryTextColor);
  textSize(smallFontSize - 2); // Smaller text
  
  // Left column features
  textAlign(LEFT);
  text("💰 Trip budget calculation tools", width/2 - 270, height/12 + 295);
  text("👥 Group trip planning features", width/2 - 270, height/12 + 315);
  text("📊 Trip destination decision matrix", width/2 - 270, height/12 + 335);
  text("✨ Travel wishlists with groups", width/2 - 270, height/12 + 355);
  
  // Right column features
  text("🗺️ Hidden gems search tool", width/2 + 30, height/12 + 295);
  text("🌱 Trip carbon footprint tool", width/2 + 30, height/12 + 315);
  text("💼 Expense tracking features", width/2 + 30, height/12 + 335);
  text("✨ And so much more!", width/2 + 30, height/12 + 355);

  // Email collection section - moved up with red border
  fill('#f5f7f8');
  stroke(highlightTextColor);
  strokeWeight(3);  // Thicker border for emphasis
  rect(width/2 - 300, height/12 + 390, 600, 140, 10);
  noStroke();

  // Newsletter text and leaderboard prompt
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  text("🚀 JOIN THE LEADERBOARD & GET TRIPMERGE UPDATES!", width/2 - 200, height/12 + 410);
  textAlign(CENTER);
  
  // Instructions for email input
  fill(primaryTextColor);
  textStyle(NORMAL);
  textSize(smallFontSize - 2);
  text("Click below to enter your email address", width/2, height/12 + 430);
  
  // Email input box with improved interactive functionality
  fill('#ffffff');
  if (isEmailInputActive) {
    stroke('#c72a09'); // Red border when active
    strokeWeight(2);
  } else {
    stroke('#3498db');
    strokeWeight(2);
  }
  
  // Email input box
  let emailBoxX = width/2 - 200;
  let emailBoxY = height/12 + 440;
  let emailBoxWidth = 400;
  let emailBoxHeight = 35;
  rect(emailBoxX, emailBoxY, emailBoxWidth, emailBoxHeight, 5);
  
  // Email placeholder or entered text
  noStroke();
  textAlign(LEFT);
  textSize(smallFontSize);
  
  if (playerEmail === "") {
    fill('#999999');
    text("  your.email@example.com", emailBoxX + 10, emailBoxY + 23);
  } else {
    fill('#333333');
    text("  " + playerEmail, emailBoxX + 10, emailBoxY + 23);
    
    // Draw blinking cursor when input is active
    if (isEmailInputActive && frameCount % cursorBlinkRate < cursorBlinkRate/2) {
      let cursorX = emailBoxX + 12 + textWidth("  " + playerEmail.substring(0, emailInputCursor));
      stroke('#333333');
      strokeWeight(1);
      line(cursorX, emailBoxY + 8, cursorX, emailBoxY + 28);
    }
  }
  
  // Submit button - Adjusted position and improved appearance with red color
  let submitBtnX = width/2;
  let submitBtnY = height/12 + 490;
  let submitBtnWidth = 200;
  let submitBtnHeight = 35;
  let isSubmitHovering = mouseX >= submitBtnX - submitBtnWidth/2 && mouseX <= submitBtnX + submitBtnWidth/2 && 
                         mouseY >= submitBtnY && mouseY <= submitBtnY + submitBtnHeight;
  
  // Button with red color
  fill(highlightTextColor);  // Always use the red highlight color
  if (isSubmitHovering) {
    // Add glow effect on hover
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(199, 42, 9, 0.5)';
  }
  noStroke();
  rect(submitBtnX - submitBtnWidth/2, submitBtnY, submitBtnWidth, submitBtnHeight, 5);
  drawingContext.shadowBlur = 0;  // Reset shadow
  
  // Button text
  fill('#ffffff');  // White text for better contrast on red
  textAlign(CENTER, CENTER);  // Center both horizontally and vertically
  textSize(isSubmitHovering ? smallFontSize : smallFontSize - 1);
  let buttonText = submittingScore ? "Submitting..." : (scoreSubmitted ? "Submitted!" : "SUBMIT");
  text(buttonText, submitBtnX, submitBtnY + submitBtnHeight/2);
  
  if (isSubmitHovering && !submittingScore && !scoreSubmitted) {
    cursor(HAND);
  }
  
  // Display submission message if any
  if (leaderboardMessage) {
    fill(scoreSubmitted ? '#4CAF50' : '#c72a09');
    textAlign(CENTER);
    text(leaderboardMessage, width/2, submitBtnY + 55);
  }
}

// Draw win screen with improved readability
function drawWinScreen() {
  background('#d9d9d9');

  // Handle leaderboard view if active
  if (showLeaderboard) {
    drawLeaderboardScreen();
    return;
  }

  // Success Title and Play Again text
  noStroke();
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(titleFontSize);
  textAlign(CENTER);
  text("SUCCESS!", width/2 - 100, height/12);
  
  // Play Again text - white with red contour
  let playAgainX = width/2 + 150;
  let playAgainY = height/12;
  let isPlayAgainHovering = mouseX >= playAgainX - 80 && mouseX <= playAgainX + 80 && 
                           mouseY >= playAgainY - 20 && mouseY <= playAgainY + 20;
  
  stroke(highlightTextColor);
  strokeWeight(3);
  fill('#ffffff');
  text("PLAY AGAIN", playAgainX, playAgainY);
  noStroke();
  
  if (isPlayAgainHovering) {
    cursor(HAND);
  } else if (!isEmailInputActive) {
    cursor(ARROW);
  }

  // Score section
  fill('#f5f7f8');
  rect(width/2 - 150, height/12 + 20, 300, 50, 10);
  
  fill(primaryTextColor);
  textSize(bodyFontSize);
  text(`Final Score: ${score}`, width/2, height/12 + 50);

  // Achievement section
  let achievement = getAchievement(score);
  fill(achievement.color);
  textStyle(BOLD);
  textSize(bodyFontSize);
  text("🏆", width/2 - 90, height/12 + 90);
  text(achievement.title, width/2, height/12 + 90);
  
  // Achievement description
  fill(primaryTextColor);
  textStyle(NORMAL);
  textSize(smallFontSize);
  text("Achievement Unlocked!", width/2, height/12 + 110);

  // Success section - modified from challenges section
  fill('#f5f7f8');
  rect(width/2 - 300, height/12 + 130, 600, 100, 10);

  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  text("Your trip was a great success!", width/2, height/12 + 150);
  
  textStyle(NORMAL);
  fill(primaryTextColor);
  textSize(smallFontSize);
  text(`• Budget management: ${Math.round(budget)}% budget remaining`, width/2, height/12 + 170);
  text(`• Group coordination: ${Math.round(satisfaction)}% satisfaction maintained`, width/2, height/12 + 190);
  text(`• Found amazing experiences: ${Math.floor(score/100)}/10 gems discovered`, width/2, height/12 + 210);

  // TripMerge solutions section - Redesigned with two columns
  fill('#f5f7f8');
  rect(width/2 - 300, height/12 + 250, 600, 120, 10);

  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  text("Make your real trips just as successful with Tripmerge!", width/2, height/12 + 270);

  // TripMerge features list - two columns with smaller text
  textStyle(NORMAL);
  fill(primaryTextColor);
  textSize(smallFontSize - 2); // Smaller text
  
  // Left column features
  textAlign(LEFT);
  text("💰 Trip budget calculation tools", width/2 - 270, height/12 + 295);
  text("👥 Group trip planning features", width/2 - 270, height/12 + 315);
  text("📊 Trip destination decision matrix", width/2 - 270, height/12 + 335);
  text("✨ Travel wishlists with groups", width/2 - 270, height/12 + 355);
  
  // Right column features
  text("🗺️ Hidden gems search tool", width/2 + 30, height/12 + 295);
  text("🌱 Trip carbon footprint tool", width/2 + 30, height/12 + 315);
  text("💼 Expense tracking features", width/2 + 30, height/12 + 335);
  text("✨ And so much more!", width/2 + 30, height/12 + 355);

  // Email collection section - moved up with red border
  fill('#f5f7f8');
  stroke(highlightTextColor);
  strokeWeight(3);  // Thicker border for emphasis
  rect(width/2 - 300, height/12 + 390, 600, 140, 10);
  noStroke();

  // Newsletter text and leaderboard prompt
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  text("🚀 JOIN THE LEADERBOARD & GET TRIPMERGE UPDATES!", width/2 - 200, height/12 + 410);
  textAlign(CENTER);
  
  // Instructions for email input
  fill(primaryTextColor);
  textStyle(NORMAL);
  textSize(smallFontSize - 2);
  text("Click below to enter your email address", width/2, height/12 + 430);
  
  // Email input box with improved interactive functionality
  fill('#ffffff');
  if (isEmailInputActive) {
    stroke('#c72a09'); // Red border when active
    strokeWeight(2);
  } else {
    stroke('#3498db');
    strokeWeight(2);
  }
  
  // Email input box
  let emailBoxX = width/2 - 200;
  let emailBoxY = height/12 + 440;
  let emailBoxWidth = 400;
  let emailBoxHeight = 35;
  rect(emailBoxX, emailBoxY, emailBoxWidth, emailBoxHeight, 5);
  
  // Email placeholder or entered text
  noStroke();
  textAlign(LEFT);
  textSize(smallFontSize);
  
  if (playerEmail === "") {
    fill('#999999');
    text("  your.email@example.com", emailBoxX + 10, emailBoxY + 23);
  } else {
    fill('#333333');
    text("  " + playerEmail, emailBoxX + 10, emailBoxY + 23);
    
    // Draw blinking cursor when input is active
    if (isEmailInputActive && frameCount % cursorBlinkRate < cursorBlinkRate/2) {
      let cursorX = emailBoxX + 12 + textWidth("  " + playerEmail.substring(0, emailInputCursor));
      stroke('#333333');
      strokeWeight(1);
      line(cursorX, emailBoxY + 8, cursorX, emailBoxY + 28);
    }
  }
  
  // Submit button - Adjusted position and improved appearance with red color
  let submitBtnX = width/2;
  let submitBtnY = height/12 + 490;
  let submitBtnWidth = 200;
  let submitBtnHeight = 35;
  let isSubmitHovering = mouseX >= submitBtnX - submitBtnWidth/2 && mouseX <= submitBtnX + submitBtnWidth/2 && 
                         mouseY >= submitBtnY && mouseY <= submitBtnY + submitBtnHeight;
  
  // Button with red color
  fill(highlightTextColor);  // Always use the red highlight color
  if (isSubmitHovering) {
    // Add glow effect on hover
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(199, 42, 9, 0.5)';
  }
  noStroke();
  rect(submitBtnX - submitBtnWidth/2, submitBtnY, submitBtnWidth, submitBtnHeight, 5);
  drawingContext.shadowBlur = 0;  // Reset shadow
  
  // Button text
  fill('#ffffff');  // White text for better contrast on red
  textAlign(CENTER, CENTER);  // Center both horizontally and vertically
  textSize(isSubmitHovering ? smallFontSize : smallFontSize - 1);
  let buttonText = submittingScore ? "Submitting..." : (scoreSubmitted ? "Submitted!" : "SUBMIT");
  text(buttonText, submitBtnX, submitBtnY + submitBtnHeight/2);
  
  if (isSubmitHovering && !submittingScore && !scoreSubmitted) {
    cursor(HAND);
  }
  
  // Display submission message if any
  if (leaderboardMessage) {
    fill(scoreSubmitted ? '#4CAF50' : '#c72a09');
    textAlign(CENTER);
    text(leaderboardMessage, width/2, submitBtnY + 55);
  }
}

// Draw the leaderboard screen
function drawLeaderboardScreen() {
  background('#d9d9d9');
  
  // Leaderboard Title
  noStroke();
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(titleFontSize);
  textAlign(CENTER);
  text("LEADERBOARD", width/2 - 100, height/12);
  
  // Back button
  let backBtnX = width/2 + 150;
  let backBtnY = height/12;
  let isBackHovering = mouseX >= backBtnX - 50 && mouseX <= backBtnX + 50 && 
                        mouseY >= backBtnY - 20 && mouseY <= backBtnY + 20;
  
  stroke(highlightTextColor);
  strokeWeight(3);
  fill('#ffffff');
  text("BACK", backBtnX, backBtnY);
  noStroke();
  
  if (isBackHovering) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
  
  // Your score highlight
  fill('#f5f7f8');
  rect(width/2 - 300, height/12 + 20, 600, 50, 10);
  
  fill(primaryTextColor);
  textSize(bodyFontSize);
  textAlign(CENTER);
  text(`Your Score: ${score} - ${getAchievement(score).title}`, width/2, height/12 + 50);
  
  // Leaderboard table
  fill('#f5f7f8');
  rect(width/2 - 400, height/12 + 80, 800, 400, 10);
  
  // Table header
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize);
  textAlign(LEFT);
  text("Rank", width/2 - 380, height/12 + 110);
  text("Email", width/2 - 310, height/12 + 110);
  text("Score", width/2 + 50, height/12 + 110);
  text("Achievement", width/2 + 130, height/12 + 110);
  text("Date", width/2 + 280, height/12 + 110);
  
  // Divider line
  stroke(highlightTextColor);
  strokeWeight(2);
  line(width/2 - 380, height/12 + 120, width/2 + 380, height/12 + 120);
  noStroke();
  
  // Check if data is loaded
  if (leaderboardData.length === 0) {
    fill(primaryTextColor);
    textAlign(CENTER);
    textStyle(NORMAL);
    text("Loading leaderboard data...", width/2, height/12 + 170);
  } else {
    // Display leaderboard data
    textAlign(LEFT);
    textStyle(NORMAL);
    fill(primaryTextColor);
    
    leaderboardData.forEach((entry, index) => {
      const y = height/12 + 150 + (index * 30);
      
      // Highlight user's entry
      if (entry.email === playerEmail) {
        fill(255, 240, 200);
        rect(width/2 - 390, y - 15, 770, 25, 5);
        fill(primaryTextColor);
      }
      
      textAlign(LEFT);
      text(`#${index + 1}`, width/2 - 380, y);
      
      // Mask email for privacy
      const maskedEmail = maskEmail(entry.email);
      text(maskedEmail, width/2 - 310, y);
      
      textAlign(RIGHT);
      text(entry.score, width/2 + 80, y);
      
      textAlign(LEFT);
      text(getAchievement(entry.score).title, width/2 + 130, y);
      
      // Format date
      const created = new Date(entry.created_at);
      const formattedDate = `${created.getMonth()+1}/${created.getDate()}/${created.getFullYear()}`;
      text(formattedDate, width/2 + 280, y);
    });
  }
  
  // Share button - now styled with red to match titles
  let shareBtnX = width/2;
  let shareBtnY = height/12 + 500;
  let shareBtnWidth = 300;
  let shareBtnHeight = 40;
  let isShareHovering = mouseX >= shareBtnX - shareBtnWidth/2 && mouseX <= shareBtnX + shareBtnWidth/2 && 
                         mouseY >= shareBtnY && mouseY <= shareBtnY + shareBtnHeight;
  
  // Button with red color
  fill(highlightTextColor);  // Always use the red highlight color
  if (isShareHovering) {
    // Add glow effect on hover
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(199, 42, 9, 0.5)';
  }
  noStroke();
  rect(shareBtnX - shareBtnWidth/2, shareBtnY, shareBtnWidth, shareBtnHeight, 10);
  drawingContext.shadowBlur = 0;  // Reset shadow
  
  // Button text
  fill('#ffffff');  // White text for better contrast on red
  textAlign(CENTER);
  textSize(bodyFontSize);
  text("📊 Share Your Score", shareBtnX, shareBtnY + 25);
  
  if (isShareHovering) {
      cursor(HAND);
  }
}

// Helper function to mask email for privacy
function maskEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const name = parts[0];
  const domain = parts[1];
  
  let maskedName = "";
  if (name.length <= 2) {
    maskedName = name;
    } else {
    maskedName = name.substring(0, 2) + "*".repeat(name.length - 2);
  }
  
  return maskedName + '@' + domain;
}

// Helper function to submit score to leaderboard
async function submitScoreToLeaderboard() {
  if (!playerEmail || submittingScore || scoreSubmitted) return;
  
  submittingScore = true;
  leaderboardMessage = "";
  
  const achievement = getAchievement(score);
  
  try {
    // Call the global leaderboard function defined in index.html
    const result = await window.leaderboard.submitScore(
      playerEmail,
      score,
      currentLevelNumber - 1, // Levels completed (current level minus 1)
      satisfaction,
      budget,
      achievement.title
    );
    
    submittingScore = false;
    
    if (result.success) {
      scoreSubmitted = true;
      leaderboardMessage = "Score submitted successfully!";
      
      // Fetch and show leaderboard
      await fetchLeaderboard();
      showLeaderboard = true;
    } else {
      leaderboardMessage = result.error || "Failed to submit score. Please try again.";
    }
  } catch (error) {
    submittingScore = false;
    leaderboardMessage = "Error submitting score: " + error.message;
    console.error("Error submitting score:", error);
  }
}

// Helper function to fetch leaderboard data
async function fetchLeaderboard() {
  try {
    const result = await window.leaderboard.getTopScores(10);
    
    if (result.success) {
      leaderboardData = result.data || [];
    } else {
      console.error("Error fetching leaderboard:", result.error);
      leaderboardMessage = "Failed to load leaderboard data.";
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    leaderboardMessage = "Error loading leaderboard: " + error.message;
  }
}

// Helper function to draw social media buttons
function drawSocialButton(label, color, x, y) {
  let btnWidth = 200;
  let btnHeight = 40;
  let isHovering = mouseX >= x - btnWidth/2 && mouseX <= x + btnWidth/2 && 
                   mouseY >= y && mouseY <= y + btnHeight;
  
  // Button shadow
  drawingContext.shadowBlur = isHovering ? 15 : 5;
  drawingContext.shadowColor = 'rgba(199, 42, 9, 0.3)';  // Updated shadow color
  
  // Button background
  fill(isHovering ? '#c72a09' : color);  // Updated hover color
  stroke('#000000');  // Updated stroke color
  strokeWeight(2);
  rect(x - btnWidth/2, y, btnWidth, btnHeight, 20);
  
  // Button text
  noStroke();
  fill(isHovering ? '#ffffff' : '#000000');  // Updated text color based on hover
  textSize(smallFontSize);
  textAlign(CENTER, CENTER);
  text(label, x, y + btnHeight/2);
  
  if (isHovering) {
      cursor(HAND);
  }
}

// Helper function to determine achievement
function getAchievement(score) {
  if (score >= 1000) {
    return { title: "Travel Master", color: "#FFD700" }; // Gold
  } else if (score >= 500) {
    return { title: "Adventure Pro", color: "#C0C0C0" }; // Silver
  } else if (score >= 200) {
    return { title: "Tourist Explorer", color: "#CD7F32" }; // Bronze
  } else {
    return { title: "Brave Traveler", color: "#c72a09" }; // Red
  }
}

// Add social sharing functionality
function shareScore(platform) {
  let achievement = getAchievement(score);
  let shareText = `🎮 Just scored ${score} points in TripChaos! Earned "${achievement.title}" 🏆\n` +
                  `Level ${currentLevelNumber} with ${Math.round(satisfaction)}% satisfaction!\n` +
                  `Can you beat my score? Play at [game_url] 🌟\n` +
                  `#TripChaos #TripMerge`;
                  
  // Open share dialog based on platform
  if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  } else if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`);
  }
}

// Helper function to start the game
function startGame() {
  console.log("Starting game...");  // Debug log
  gameState = 'start';  // First go to start screen
  window.gameState = 'start';
  
  // Reset all game variables
  score = 0;
  budget = 100;
  satisfaction = 100;
  timeLeft = 60;
  currentLevelNumber = 1;
  currentTheme = "beach";
  greyAtmosphere = 0;
  
  // Reset player and companion
  player.worldX = 100;
  player.x = 100;
  player.y = 300;
  player.velocityY = 1; // Reset to 1 as requested
  player.isJumping = false;
  player.isColliding = false;
  player.facingRight = true;
  player.speed = 6; // Reset to 6 as requested
  
  companion.worldX = 70;
  companion.x = 70;
  companion.y = 300;
  
  // Reset game objects
  platforms = [];
  perks = [];
  mishaps = [];
  cameraOffset = 0;
  
  // Reset decision system
  decisionTimer = 0;
  showingDecision = false;
  currentDecision = null;
  decisionsThisLevel = 0;
  decisionTriggeredAt = [false, false];
  
  console.log("Game reset to initial state:", gameState);  // Debug log
}

// Key press handler
function keyPressed() {
  // Space key handling - REMOVED decision trigger
  
  // Handle email input special keys
  if (isEmailInputActive) {
    if (keyCode === BACKSPACE) {
      if (emailInputCursor > 0) {
        playerEmail = playerEmail.substring(0, emailInputCursor - 1) + playerEmail.substring(emailInputCursor);
        emailInputCursor--;
      }
      return false;
    } else if (keyCode === DELETE) {
      if (emailInputCursor < playerEmail.length) {
        playerEmail = playerEmail.substring(0, emailInputCursor) + playerEmail.substring(emailInputCursor + 1);
      }
      return false;
    } else if (keyCode === LEFT_ARROW) {
      emailInputCursor = max(0, emailInputCursor - 1);
      return false;
    } else if (keyCode === RIGHT_ARROW) {
      emailInputCursor = min(playerEmail.length, emailInputCursor + 1);
      return false;
    } else if (keyCode === ENTER) {
      isEmailInputActive = false;
      submitScoreToLeaderboard();
      return false;
    } else if (keyCode === ESCAPE) {
      isEmailInputActive = false;
      return false;
    }
  }
  
  // Original game key handling for UP_ARROW jump
  if (gameState === 'playing' && !showingDecision) {
    if (keyCode === UP_ARROW && !player.isJumping) {
      player.velocityY = -player.jumpForce;
      player.isJumping = true;
      return false;
    }
  }
  
  // Handle the space key for menu navigation
  if (keyCode === 32) { // SPACE key
    if (gameState === 'start') {
      startGame();
      return false;
    } else if (gameState === 'gameOver' || gameState === 'win') {
      startGame();
      return false;
    }
  }
  
  return true;
}

// Key release handler
function keyReleased() {
  // Prevent space key from doing anything during gameplay
  if (keyCode === 32) { // SPACE key
    return false; // Prevent default
  }
  return true;
}

// Helper function to check collision between two objects
function checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Update platform collision detection
function checkPlatformCollision(player, platform) {
  // Get player edges
  let playerBottom = player.y + player.height;
  let playerRight = player.worldX + player.width;
  let playerLeft = player.worldX;
  
  // Get platform edges
  let platformTop = platform.y;
  let platformLeft = platform.x;
  let platformRight = platform.x + platform.width;
  
  // Check horizontal overlap - use a slightly wider margin for more forgiving landings
  let horizontalOverlap = playerLeft < platformRight + 5 && playerRight > platformLeft - 5;
  
  // Check for landing on platform with a larger collision margin for more reliable landing
  if (horizontalOverlap && 
      player.velocityY >= 0 && 
      playerBottom >= platformTop - 15 && // Increased from 8 to 15
      playerBottom <= platformTop + 15) { // Increased from 8 to 15
    
    // Snap to platform and stop falling
    player.y = platformTop - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    return true;
  }
  
  return false;
}

// Draw a star shape (used for perks)
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// Helper function to draw a modern button with hover effects
function drawModernButton(x, y, w, h, label, isHovering) {
  // Button shadow
  drawingContext.shadowBlur = isHovering ? 15 : 5;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
  
  // Button background
  fill(isHovering ? '#c72a09' : '#f5f7f8');
  stroke('#000000');
  strokeWeight(2);
  rect(x, y, w, h, 10);
  
  // Button text
  fill(isHovering ? '#ffffff' : '#000000');
  noStroke();
  textSize(bodyFontSize);
  textAlign(CENTER, CENTER);
  text(label, x + w/2, y + h/2);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
}

// Update mishaps (including falling ones)
function updateMishaps() {
  // Update existing mishaps
  for (let i = mishaps.length - 1; i >= 0; i--) {
    let mishap = mishaps[i];
    if (!mishap.isStatic) {
      // Apply gravity to falling mishaps
      mishap.velocityY += 0.2;
      mishap.y += mishap.velocityY;
      
      // Remove mishap if it falls below screen or exists too long
      if (mishap.y > height + 50 || millis() - mishap.creationTime > 10000) {
        mishaps.splice(i, 1);
      }
    }
  }
  
  // Scale spawn rate and max mishaps with level
  let baseSpawnRate = 0.02; // Increased base spawn rate (was 0.008)
  let spawnRate = baseSpawnRate * (1 + (currentLevelNumber - 1) * 0.75); // 75% increase per level
  let maxMishaps = 3 + (currentLevelNumber - 1) * 3; // Start with 3, add 3 per level (was 2)
  
  // Spawn new falling mishaps with scaled frequency
  if (!showingDecision && random() < spawnRate && mishaps.length < maxMishaps) {
    // Calculate spawn position relative to player
    let spawnX = player.worldX + random(-100, 300); // Bias towards front of player
    spawnX = constrain(spawnX, 100, levelLength - 100); // Keep within level bounds
    
    // Determine mishap type based on level
    let mishapType;
    let typeRand = random();
    
    if (currentLevelNumber === 1) {
      // Level 1: 40% clouds (was 80%), 60% dollars (was 20%), no suitcases
      mishapType = typeRand < 0.4 ? 'cloud' : 'dollar';
    } else if (currentLevelNumber === 2) {
      // Level 2: 40% clouds, 40% dollars, 20% suitcases
      if (typeRand < 0.4) mishapType = 'cloud';
      else if (typeRand < 0.8) mishapType = 'dollar';
      else mishapType = 'suitcase';
    } else {
      // Level 3: 20% clouds, 40% dollars, 40% suitcases
      if (typeRand < 0.2) mishapType = 'cloud';
      else if (typeRand < 0.6) mishapType = 'dollar';
      else mishapType = 'suitcase';
    }
    
    // Scale falling speed with level
    let baseVelocity = 1 + (currentLevelNumber - 1) * 0.5; // Increase initial velocity per level
    
    mishaps.push({
      x: spawnX,
      y: -50,  // Start above the screen
      width: 20,
      height: 20,
      type: mishapType,
      velocityY: baseVelocity,
      gravity: 0.2,
      isStatic: false,
      creationTime: millis()
    });
  }
  
  // Handle active cloud slow effects
  if (greyAtmosphere > 0) {
    greyAtmosphere -= 0.02;
    if (greyAtmosphere < 0) {
      greyAtmosphere = 0;
    }
  }
}

// Mouse click handler
function mouseClicked() {
  console.log("Mouse clicked, current game state:", gameState);  // Debug log
  
  if (gameState === 'start') {
    // Check if start button was clicked - with mobile scaling
    let startBtnX = width/2 - (100 * window.gameScale);
    let startBtnY = height - (100 * window.gameScale);
    let startBtnW = 200 * window.gameScale;
    let startBtnH = 40 * window.gameScale;
    
    if (mouseX >= startBtnX && mouseX <= startBtnX + startBtnW && 
        mouseY >= startBtnY && mouseY <= startBtnY + startBtnH) {
      console.log("Start button clicked");  // Debug log
      gameState = 'playing';
      window.gameState = 'playing';
      resetGame();
      return false;
    }
  } else if (gameState === 'gameOver' || gameState === 'win') {
    // Check if we're in leaderboard view
    if (showLeaderboard) {
      // Check if back button was clicked
      let backBtnX = width/2 + 150;
      let backBtnY = height/12;
      
      if (mouseX >= backBtnX - 50 && mouseX <= backBtnX + 50 && 
          mouseY >= backBtnY - 20 && mouseY <= backBtnY + 20) {
        showLeaderboard = false;
        return false;
      }
      
      // Check if share button was clicked
      let shareBtnX = width/2;
      let shareBtnY = height/12 + 500;
      
      if (mouseX >= shareBtnX - 150 && mouseX <= shareBtnX + 150 && 
          mouseY >= shareBtnY && mouseY <= shareBtnY + 40) {
        shareScore('twitter');
        return false;
      }
      
      return false;
    }
  
    // Check if play again text was clicked
    let playAgainX = width/2 + 150;
    let playAgainY = height/12;
    
    if (mouseX >= playAgainX - 80 && mouseX <= playAgainX + 80 && 
        mouseY >= playAgainY - 20 && mouseY <= playAgainY + 20) {
      console.log("Play again clicked");  // Debug log
      startGame();  // Reset to start screen
      // Reset leaderboard state
      playerEmail = "";
      showLeaderboard = false;
      leaderboardData = [];
      leaderboardMessage = "";
      submittingScore = false;
      scoreSubmitted = false;
      isEmailInputActive = false;
      return false;
    }

    // Check if email input was clicked
    let emailBoxX = width/2 - 200;
    let emailBoxY = height/12 + 440;
    let emailBoxWidth = 400;
    let emailBoxHeight = 35;
    
    if (mouseX >= emailBoxX && mouseX <= emailBoxX + emailBoxWidth &&
        mouseY >= emailBoxY && mouseY <= emailBoxY + emailBoxHeight) {
      // Activate the input field directly
      isEmailInputActive = true;
      emailInputCursor = playerEmail.length; // Set cursor at the end
      return false;
    } else {
      // Deactivate input field when clicking elsewhere
      isEmailInputActive = false;
    }
    
    // Check if submit button was clicked
    let submitBtnX = width/2;
    let submitBtnY = height/12 + 490;
    let submitBtnWidth = 200;
    let submitBtnHeight = 35;
    
    if (mouseX >= submitBtnX - submitBtnWidth/2 && mouseX <= submitBtnX + submitBtnWidth/2 && 
        mouseY >= submitBtnY && mouseY <= submitBtnY + submitBtnHeight &&
        !submittingScore && !scoreSubmitted) {
      isEmailInputActive = false; // Deactivate input
      submitScoreToLeaderboard();
      return false;
    }
  } else if (gameState === 'playing' && showingDecision) {
    // Calculate decision box position
    let boxWidth = 500;
    let boxHeight = 300;
    let boxY = height/2 - boxHeight/2;
    
    // Check if a decision option was clicked
    for (let i = 0; i < currentDecision.options.length; i++) {
      let y = boxY + 120 + i * 50;
      
      if (mouseX >= width/2 - 180 && mouseX <= width/2 + 180 && 
          mouseY >= y && mouseY <= y + 40) {
        makeDecision(i);
        break;
      }
    }
  }
  
  // Add jump button check for playing state
  if (gameState === 'playing' && !showingDecision) {
    let jumpBtnSize = 45;
    let jumpBtnX = 20;
    let jumpBtnY = height - jumpBtnSize - 20;
    
    if (mouseX >= jumpBtnX && mouseX <= jumpBtnX + jumpBtnSize &&
        mouseY >= jumpBtnY && mouseY <= jumpBtnY + jumpBtnSize) {
      if (!player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
      }
      return false;
    }
  }
  
  return false;
}

// Add keyTyped function to handle email input
function keyTyped() {
  if (isEmailInputActive) {
    // Only add printable characters
    if (key.length === 1 && key.charCodeAt(0) >= 32) {
      playerEmail = playerEmail.substring(0, emailInputCursor) + key + playerEmail.substring(emailInputCursor);
      emailInputCursor++;
    }
    return false; // Prevent default behavior
  }
  return true;
}

// Function to draw the fog effect when slowed down
function drawFogEffect() {
  if (player.cloudEffectCounter > 0) {
    // Create a semi-transparent grey overlay
    push();
    noStroke();
    
    // Draw main fog layer
    fill(100, 100, 100, 150);  // Grey with 150/255 opacity
    rect(0, 0, width, height);
    
    // Draw a few very simple cloud shapes for visual effect
    // but avoid complex animations that might cause freezing
    fill(150, 150, 150, 100);
    ellipse(width/2, height/2, 300, 200);
    ellipse(width/4, height/3, 200, 150);
    ellipse(3*width/4, 2*height/3, 250, 180);
    
    pop();
  }
}

// Draw effect notifications
function drawEffectNotifications() {
  for (let i = effectNotifications.length - 1; i >= 0; i--) {
    let notification = effectNotifications[i];
    
    // Update position
    notification.y -= NOTIFICATION_RISE_SPEED;
    notification.duration--;
    
    // Draw notification
    push();
    textAlign(CENTER);
    textSize(20);
    
    // Fade out near the end
    let alpha = notification.duration > 15 ? 255 : map(notification.duration, 0, 15, 0, 255);
    
    if (notification.value > 0) {
      fill(50, 205, 50, alpha); // Green for positive
      text("+" + notification.value + " " + notification.type, notification.x, notification.y);
    } else {
      fill(255, 50, 50, alpha); // Red for negative
      text(notification.value + " " + notification.type, notification.x, notification.y);
    }
    pop();
    
    // Remove expired notifications
    if (notification.duration <= 0) {
      effectNotifications.splice(i, 1);
    }
  }
}

// Add touch support for mobile
function touchStarted() {
  // Calculate the game viewport offset
  let gameWidth = 1000 * window.gameScale;
  let gameHeight = 600 * window.gameScale;
  let offsetX = (width - gameWidth) / 2;
  let offsetY = (height - gameHeight) / 2;
  
  if (gameState === 'start' && touches.length > 0) {
    let touch = touches[0];
    // Adjust touch coordinates to account for viewport offset
    let adjustedX = touch.x - offsetX;
    let adjustedY = touch.y - offsetY;
    
    let startBtnX = gameWidth/2 - (100 * window.gameScale);
    let startBtnY = gameHeight - (100 * window.gameScale);
    let startBtnW = 200 * window.gameScale;
    let startBtnH = 40 * window.gameScale;
    
    // Add extra touch area for better touch response
    let touchArea = 20 * window.gameScale;
    
    if (adjustedX >= startBtnX - touchArea && 
        adjustedX <= startBtnX + startBtnW + touchArea && 
        adjustedY >= startBtnY - touchArea && 
        adjustedY <= startBtnY + startBtnH + touchArea) {
      console.log("Start button touched");  // Debug log
      gameState = 'playing';
      window.gameState = 'playing';
      resetGame();
      return false;
    }
  }
  
  // Handle gameplay touch controls with adjusted coordinates
  if (gameState === 'playing' && !showingDecision && touches.length > 0) {
    let touch = touches[0];
    // Adjust touch coordinates
    let adjustedX = touch.x - offsetX;
    let adjustedY = touch.y - offsetY;
    
    let btnSize = 60 * window.gameScale;
    let btnY = gameHeight - btnSize - (30 * window.gameScale);
    
    // Add touch feedback with scaling
    let touchFeedback = (x, y) => {
      push();
      noFill();
      stroke('#c72a09');
      strokeWeight(3 * window.gameScale);
      ellipse(x + btnSize/2, y + btnSize/2, btnSize/2);
      pop();
    };
    
    // Jump button check with scaled positions
    let jumpBtnX = 30 * window.gameScale;
    let jumpTouchArea = 15 * window.gameScale;
    if (adjustedX >= jumpBtnX - jumpTouchArea && 
        adjustedX <= jumpBtnX + btnSize + jumpTouchArea &&
        adjustedY >= btnY - jumpTouchArea && 
        adjustedY <= btnY + btnSize + jumpTouchArea) {
      if (!player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
        touchFeedback(jumpBtnX, btnY);
      }
      return false;
    }
    
    // Left arrow button check with scaled positions
    let leftBtnX = gameWidth - (btnSize * 2) - (50 * window.gameScale);
    if (adjustedX >= leftBtnX - jumpTouchArea && 
        adjustedX <= leftBtnX + btnSize + jumpTouchArea &&
        adjustedY >= btnY - jumpTouchArea && 
        adjustedY <= btnY + btnSize + jumpTouchArea) {
      if (player.worldX > 100) {
        player.worldX -= player.speed;
        player.facingRight = false;
        touchFeedback(leftBtnX, btnY);
      }
      return false;
    }
    
    // Right arrow button check with scaled positions
    let rightBtnX = width - btnSize - (30 * window.gameScale);
    if (touch.x >= rightBtnX - jumpTouchArea && 
        touch.x <= rightBtnX + btnSize + jumpTouchArea &&
        touch.y >= btnY - jumpTouchArea && 
        touch.y <= btnY + btnSize + jumpTouchArea) {
      player.worldX += player.speed;
      player.facingRight = true;
      touchFeedback(rightBtnX, btnY);
      return false;
    }
  }
  return true;
}

// Add mobile detection function
function isMobileDevice() {
  return (touches.length > 0 || (window.innerWidth <= 768)) && window.matchMedia("(orientation: landscape)").matches;
}
