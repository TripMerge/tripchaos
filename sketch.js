// TripChaos by TripMerge
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

// Make key game functions and variables accessible globally
window.playerEmail = playerEmail;
window.gameState = gameState;
window.showLeaderboard = showLeaderboard;
window.submitScoreToLeaderboard = null; // Will be assigned the actual function

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

// Near the top with other global variables
let showSharePopup = false; // Controls visibility of share popup
let showPrivacyPolicy = false; // Controls visibility of privacy policy popup
let privacyCheckboxChecked = false; // Tracks if the privacy policy checkbox is checked

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
    // For desktop, use fixed dimensions
  let canvas = createCanvas(1000, 600);
    window.gameScale = 1;
  
  canvas.parent('game-container');
  
  // Initialize game objects and settings
  resetGame();
  
  // Add window resize handler
  window.addEventListener('resize', windowResized);
}

// Handle window resize events
function windowResized() {
  // Desktop keeps fixed size, no resize needed
  resizeCanvas(1000, 600);
  window.gameScale = 1;
}

// Update mobile detection to be more reliable
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || (window.matchMedia && window.matchMedia('(max-width: 926px)').matches);
}

// Add orientation change handler
window.addEventListener('orientationchange', function() {
  // Small delay to ensure new dimensions are available
  setTimeout(windowResized, 100);
});

// Reset game state
function resetGame() {
  // Always reset level number first to ensure it's set to 1
  currentLevelNumber = 1;
  // Also reset any window-level storage of level number that might exist
  if (window.currentLevelNumber !== undefined) {
    window.currentLevelNumber = 1;
  }
  
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
  console.log("Generating level:", currentLevelNumber);
  
  // Keep the first platform (created in resetGame) and clear the rest
  let firstPlatform = platforms[0];
  platforms = [firstPlatform];
  perks = [];
  mishaps = [];
  
  let lastPlatformX = 0;
  let lastPlatformY = 400;
  
  // Adjust probabilities based on level
  let perkChance = 0.4 - (currentLevelNumber - 1) * 0.05; // Decrease perks with level (0.4, 0.35, 0.3)
  let mishapChance = 0.15 + (currentLevelNumber - 1) * 0.08; // Reduced from 0.2+(level-1)*0.1 to 0.15+(level-1)*0.08
  
  // Adjust perk type probabilities based on level
  let coinChance = 0.4 - (currentLevelNumber - 1) * 0.1; // Decrease helpful perks
  let mapChance = 0.3 - (currentLevelNumber - 1) * 0.05;
  
  // Height variation settings
  let baseHeightMin = 250; // Base minimum height
  let baseHeightMax = 400; // Base maximum height
  let heightTrend = 0; // Used to create gradual height changes
  
  while (lastPlatformX < levelLength - 200) {
    // Platform width decreases with each level
    let minWidth = 90 - (currentLevelNumber - 1) * 15; // Starts at 90, decreases by 15 per level
    let maxWidth = 150 - (currentLevelNumber - 1) * 20; // Starts at 150, decreases by 20 per level
    
    // Ensure minimum platform width doesn't go below playable threshold
    minWidth = Math.max(minWidth, 50);
    maxWidth = Math.max(maxWidth, 80);
    
    let platformWidth = random(minWidth, maxWidth);
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
      
      // Intermediate platform width also decreases with level
      let minIntWidth = 80 - (currentLevelNumber - 1) * 10; // Starts at 80, decreases by 10 per level
      let maxIntWidth = 120 - (currentLevelNumber - 1) * 15; // Starts at 120, decreases by 15 per level
      
      // Ensure minimum width doesn't go below playable threshold
      minIntWidth = Math.max(minIntWidth, 45);
      maxIntWidth = Math.max(maxIntWidth, 70);
      
      platforms.push({
        x: midX,
        y: midY,
        width: random(minIntWidth, maxIntWidth),
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
            // Level 1: 30% clouds, 70% dollars, no suitcases
            mishapType = typeRand < 0.3 ? 'cloud' : 'dollar';
          } else if (currentLevelNumber === 2) {
            // Level 2: 30% clouds, 50% dollars, 20% suitcases
            if (typeRand < 0.3) mishapType = 'cloud';
            else if (typeRand < 0.8) mishapType = 'dollar';
            else mishapType = 'suitcase';
          } else {
            // Level 3: 15% clouds (reduced from 20%), 45% dollars (increased from 40%), 40% suitcases
            if (typeRand < 0.15) mishapType = 'cloud';
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
  // Final platform width also decreases with level but remains generous enough for the end marker
  let finalPlatformWidth = 180 - (currentLevelNumber - 1) * 20; // Starts at 180, decreases by 20 per level
  finalPlatformWidth = Math.max(finalPlatformWidth, 120); // Ensure it doesn't get too small
  
  let finalPlatform = {
    x: levelLength - 150,
    y: random(200, 300), // Lowered from random(250, 350) to make it easier to reach
    width: finalPlatformWidth,
    height: 20,
    theme: currentTheme
  };
  
  platforms.push(finalPlatform);
  
  // Place level end marker on the final platform
  levelEndMarker = {
    x: finalPlatform.x + finalPlatform.width/2 - 35, // Centered on the platform
    y: finalPlatform.y - 70, // Raised higher above the platform for better visibility
    width: 70, // Increased from 50 to make it larger and easier to touch
    height: 70  // Increased from 50 to make it larger and easier to touch
  };
  
  // Add approach platforms to make reaching the final platform easier
  // Approach platform also gets shorter with level
  let approachPlatformWidth = 120 - (currentLevelNumber - 1) * 15; // Starts at 120, decreases by 15 per level
  approachPlatformWidth = Math.max(approachPlatformWidth, 70); // Ensure it doesn't get too small
  
  let approachPlatform = {
    x: finalPlatform.x - 180, // Position before the final platform
    y: finalPlatform.y + random(-30, 30), // Similar height with small variation
    width: approachPlatformWidth,
    height: 20,
    theme: currentTheme
  };
  
  platforms.push(approachPlatform);
  
  // Add bonus platforms with adjusted difficulty
  let bonusPlatforms = 3 - (currentLevelNumber - 1); // Fewer bonus platforms in higher levels
  for (let i = 0; i < bonusPlatforms; i++) {
    let platformX = random(300, levelLength - 300);
    let platformY = random(150, 250);  // Higher platforms
    
    // Bonus platform width also decreases with level
    let bonusPlatformWidth = 70 - (currentLevelNumber - 1) * 10; // Starts at 70, decreases by 10 per level
    bonusPlatformWidth = Math.max(bonusPlatformWidth, 40); // Ensure it doesn't get too small
    
    let platformWidth = random(bonusPlatformWidth, bonusPlatformWidth + 20);
    
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

// Main draw function
function draw() {
  // Clear canvas
  clear();
  
  // Draw the appropriate screen based on game state
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    if (!showingDecision) {
    updateGame();
    }
    drawPlayingScreen();
  } else if (gameState === 'gameOver') {
    drawGameOverScreen();
  } else if (gameState === 'win') {
    drawWinScreen();
  }
  
  // Draw leaderboard if active
  if (showLeaderboard) {
    drawLeaderboardScreen();
  }
  
  // Draw share popup on top if active
  if (showSharePopup) {
    drawSharePopup();
  }
  
  // Draw privacy policy popup if active
  if (showPrivacyPolicy) {
    drawPrivacyPolicyPopup();
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
        satisfaction -= 10; // Reduced from 15
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
        budget -= 10 + (currentLevelNumber * 5); // Increased base penalty and level scaling
      } else if (mishap.type === 'suitcase') {
        satisfaction -= 10 + (currentLevelNumber * 3); // Increased base penalty and added level scaling
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
    
    // Enhanced collision box that's more generous (larger than the visual size)
    let collisionMargin = 15; // Extra collision margin
    
    if (player.worldX < markerWorldX + levelEndMarker.width + collisionMargin &&
        player.worldX + player.width > markerWorldX - collisionMargin &&
        player.y < markerWorldY + levelEndMarker.height + collisionMargin &&
        player.y + player.height > markerWorldY - collisionMargin) {
      
      // Level completed!
      currentLevelNumber++;
      // Sync with window level variable if it exists
      if (window.currentLevelNumber !== undefined) {
        window.currentLevelNumber = currentLevelNumber;
      }
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
  // Create a pulsing portal effect with stronger pulsation
  let pulse = sin(frameCount * 0.1) * 8; // Increased from 5 to 8 for more noticeable pulse
  
  // Add directional arrow above the portal to guide players
  push();
  translate(levelEndMarker.x + levelEndMarker.width/2, levelEndMarker.y - 40);
  noStroke();
  fill(255, 255, 50, 150 + pulse * 10);
  triangle(-20, 0, 20, 0, 0, -25);
  pop();
  
  // Outer glow - larger and more vibrant
  push();
  noFill();
  stroke(255, 215, 0, 180 + pulse * 15); // Brighter and more opaque
  strokeWeight(6 + pulse); // Thicker stroke
  ellipse(levelEndMarker.x + levelEndMarker.width/2, 
          levelEndMarker.y + levelEndMarker.height/2, 
          levelEndMarker.width + 20, levelEndMarker.height + 20); // Larger glow
  
  // Second outer glow for enhanced visibility
  stroke(255, 100, 0, 100 + pulse * 10);
  strokeWeight(4 + pulse);
  ellipse(levelEndMarker.x + levelEndMarker.width/2, 
          levelEndMarker.y + levelEndMarker.height/2, 
          levelEndMarker.width + 30, levelEndMarker.height + 30);
  pop();
  
  // Portal - more vibrant color
  fill(255, 165, 0);
  noStroke();
  ellipse(levelEndMarker.x + levelEndMarker.width/2, 
          levelEndMarker.y + levelEndMarker.height/2, 
          levelEndMarker.width, levelEndMarker.height);
  
  // Inner portal with moving swirl effect
  push();
  translate(levelEndMarker.x + levelEndMarker.width/2, levelEndMarker.y + levelEndMarker.height/2);
  rotate(frameCount * 0.02);
  fill(255, 255, 255, 180);
  ellipse(0, 0, levelEndMarker.width/2, levelEndMarker.height/2);
  
  // Add swirl elements
  fill(255, 200, 0, 150);
  rotate(frameCount * 0.03);
  ellipse(0, 0, levelEndMarker.width/3, levelEndMarker.height/3);
  pop();
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
  
  // Box dimensions and position - adjust for mobile
  let boxWidth = isMobileDevice() ? width * 0.9 : 500;
  let boxHeight = isMobileDevice() ? height * 0.5 : 300;
  let boxX = width/2 - boxWidth/2;
  let boxY = isMobileDevice() ? height * 0.2 : height/2 - boxHeight/2;
  
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
  textAlign(CENTER, CENTER);  // Center both horizontally and vertically
  textSize(isMobileDevice() ? 20 : 24);
  text("DECISION POINT", width/2, boxY + 20);  // Center in 40px high title bar
  
  // Question
  fill(primaryTextColor);
  textStyle(BOLD);
  textSize(isMobileDevice() ? 18 : 22);
  textAlign(CENTER);
  text(currentDecision.question, width/2, boxY + 70);
  
  // Options
  let optionSpacing = isMobileDevice() ? 50 : 45;
  let optionStartY = boxY + (isMobileDevice() ? 100 : 110);
  
  for (let i = 0; i < currentDecision.options.length; i++) {
    let y = optionStartY + i * optionSpacing;
    let buttonWidth = isMobileDevice() ? boxWidth * 0.8 : 360;
    let buttonX = width/2 - buttonWidth/2;
    let isHovering = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && 
                     mouseY >= y && mouseY <= y + 40;
    
    // Option button
    fill(isHovering ? '#c72a09' : '#f5f7f8');
    stroke('#000000');
    strokeWeight(1);
    rect(buttonX, y, buttonWidth, 40, 5);
    
    // Option text
    noStroke();
    fill(isHovering ? '#ffffff' : '#000000');
    textAlign(LEFT, CENTER);  // Add CENTER alignment vertically
    textStyle(BOLD);
    textSize(isMobileDevice() ? 16 : 18);
    text(currentDecision.options[i].text, buttonX + 20, y + 20);  // Center vertically within 40px high button
    
    // Change cursor on hover
    if (isHovering) {
      cursor(HAND);
    }
  }
  
  // Reset cursor if not hovering over any option
  if (mouseY < boxY + 140 || mouseY > boxY + 140 + 3 * 40 || 
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
  
  // Draw level indicator with total levels - pushed down for better visibility on mobile
  let levelY = isMobileDevice() ? 35 * window.gameScale : 20 * window.gameScale;
  text(`Level ${currentLevelNumber}/3`, 20 * window.gameScale, levelY);
  
  // Draw meters horizontally across the top with adjusted positioning for mobile
  let meterY = isMobileDevice() ? 65 * window.gameScale : 20 * window.gameScale;
  let meterSpacing = (isMobileDevice() ? 1000 * window.gameScale : width) / 5;
  
  // Adjust horizontal spacing for mobile to ensure all meters are visible
  if (isMobileDevice()) {
    drawMeter("Budget", budget, meterSpacing * 0.8, meterY);
    drawMeter("Satisfaction", satisfaction, meterSpacing * 1.8, meterY);
    drawMeter("Time", timeLeft, meterSpacing * 2.8, meterY);
    drawMeter("Score", score, meterSpacing * 3.8, meterY);
  } else {
    // Standard positioning for desktop
    drawMeter("Budget", budget, meterSpacing, meterY);
    drawMeter("Satisfaction", satisfaction, meterSpacing * 2, meterY);
    drawMeter("Time", timeLeft, meterSpacing * 3, meterY);
    drawMeter("Score", score, meterSpacing * 4, meterY);
  }
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
  text("GAME OVER", width/2, height/12);
  
  // Play Again text - moved under Game Over
  let playAgainX = width/2;
  let playAgainY = height/12 + 40;
  let playAgainWidth = 180; // Increased button width
  let playAgainHeight = 50; // Added button height
  let isPlayAgainHovering = mouseX >= playAgainX - playAgainWidth/2 && 
                           mouseX <= playAgainX + playAgainWidth/2 && 
                           mouseY >= playAgainY - playAgainHeight/2 && 
                           mouseY <= playAgainY + playAgainHeight/2;
  
  // Add a visually distinct button with shadow and highlight
  drawingContext.shadowBlur = isPlayAgainHovering ? 15 : 5;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
  
  fill(isPlayAgainHovering ? '#c72a09' : '#f5f7f8');
  stroke(isPlayAgainHovering ? '#ffffff' : highlightTextColor);
  strokeWeight(isPlayAgainHovering ? 2 : 1);
  rect(playAgainX - playAgainWidth/2, playAgainY - playAgainHeight/2, 
       playAgainWidth, playAgainHeight, 10);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Draw the text
  fill(isPlayAgainHovering ? '#ffffff' : '#000000');
  noStroke();
  textSize(titleFontSize - 10);
  textAlign(CENTER, CENTER);
  text("PLAY AGAIN", playAgainX, playAgainY);
  
  if (isPlayAgainHovering) {
    cursor(HAND);
  } else if (!isEmailInputActive) {
    cursor(ARROW);
  }

  // COMBINED Score & Achievement section
  fill('#f5f7f8');
  rect(width/2 - 250, height/12 + 70, 500, 90, 10);
  
  // Score part
  fill(primaryTextColor);
  textSize(bodyFontSize);
  textAlign(CENTER);
  text(`Final Score: ${score}`, width/2, height/12 + 100);

  // Achievement part
  let achievement = getAchievement(score);
  fill(achievement.color);
  textStyle(BOLD);
  textSize(bodyFontSize);
  textAlign(CENTER);
  text("🏆 " + achievement.title, width/2, height/12 + 140);
  
  // TripMerge solutions section - BIGGER with two columns
  fill('#f5f7f8');
  // Remove the red stroke/contour
  noStroke();
  rect(width/2 - 300, height/12 + 170, 600, 150, 12); // Made taller

  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize + 4); // Increased size
  textAlign(CENTER);
  text("Improve Your Trips with Tripmerge!", width/2, height/12 + 200);
  
  // TripMerge features list - two columns with larger text
  textStyle(NORMAL);
  fill(primaryTextColor);
  textSize(smallFontSize); // Larger text
  
  // Left column features
  textAlign(LEFT);
  text("💰 Trip budget calculation tools", width/2 - 270, height/12 + 220);
  text("👥 Group trip planning features", width/2 - 270, height/12 + 245);
  text("📊 Trip destination decision matrix", width/2 - 270, height/12 + 270);
  text("✨ Travel wishlists with groups", width/2 - 270, height/12 + 295);
  
  // Right column features
  text("🗺️ Hidden gems search tool", width/2 + 30, height/12 + 220);
  text("🌱 Trip carbon footprint tool", width/2 + 30, height/12 + 245);
  text("💼 Expense tracking features", width/2 + 30, height/12 + 270);
  text("✨ And so much more!", width/2 + 30, height/12 + 295);

  // Minimal spacing between sections 
  const sectionSpacing = 5; // Reduced from 20 to bring sections closer

  // Email collection section - POSITIONED MUCH CLOSER to section above
  fill('#f5f7f8');
  stroke(highlightTextColor);
  strokeWeight(4);  // Thicker border for emphasis
  // Calculate position right after Tripmerge section
  let leaderboardSectionY = height/12 + 330 + sectionSpacing;
  rect(width/2 - 280, leaderboardSectionY, 560, 200, 12); 
  noStroke();

  // Newsletter text and leaderboard prompt - CENTERED
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize + 4); // Increased size
  textAlign(CENTER);
  text("🚀 JOIN THE LEADERBOARD & GET TRIPMERGE UPDATES!", width/2, leaderboardSectionY + 30);
  
  // Instructions for email input - moved right under the headline
  fill(primaryTextColor);
  textStyle(NORMAL);
  textSize(smallFontSize - 1); // Smaller font for longer text
  
  // Calculate checkbox position on the left side of the text
  let checkboxX = width/2 - 180;
  let checkboxY = leaderboardSectionY + 40;
  let checkboxSize = 16;
  
  // Draw checkbox
    stroke('#3498db');
    strokeWeight(2);
  fill(255);
  rect(checkboxX, checkboxY, checkboxSize, checkboxSize, 3);
  
  // Draw check mark if checked
  if (privacyCheckboxChecked) {
    stroke('#4CAF50'); // Green check
    strokeWeight(3);
    line(checkboxX + 3, checkboxY + checkboxSize/2, checkboxX + 6, checkboxY + checkboxSize - 3);
    line(checkboxX + 6, checkboxY + checkboxSize - 3, checkboxX + checkboxSize - 2, checkboxY + 3);
  }
  noStroke();
  
  // Use LEFT alignment for the checkbox text to position it properly
  textAlign(LEFT);
  fill(primaryTextColor);
  
  // Position the text right next to the checkbox
  // Split the text to avoid overlapping "privacy policy" text
  let beforeText = "I accept the ";
  let policyText = "privacy policy";
  let afterText = " and would like to register for the";
  
  // Calculate positions
  let textX = checkboxX + checkboxSize + 10;
  let textY = checkboxY + 12;
  
  // Draw first part of text
  text(beforeText, textX, textY);
  
  // Calculate position for privacy policy text
  let policyX = textX + textWidth(beforeText);
  
  // Draw privacy policy text in blue and bold
  fill('#3498db'); // Blue color for privacy policy text
  textStyle(BOLD);
  text(policyText, policyX, textY);
  
  // Calculate position for after text
  let afterX = policyX + textWidth(policyText);
  
  // Reset style and draw the remainder of the text
  textStyle(NORMAL);
  fill(primaryTextColor);
  text(afterText, afterX, textY);
  
  // Draw second line of text
  text("public leaderboard & get news about TripMerge launch and updates", textX, checkboxY + 27);
  
  // Reset text style and alignment
  textStyle(NORMAL);
  fill(primaryTextColor);
  textAlign(CENTER);
  
  // Email input box with improved interactive functionality
  fill('#ffffff');
  if (isEmailInputActive) {
    stroke('#c72a09'); // Red border when active
    strokeWeight(3);
  } else {
    stroke('#3498db');
    strokeWeight(3);
  }
  
  // Email input box - LARGER
  let emailBoxX = width/2 - 200;
  let emailBoxY = leaderboardSectionY + 80;
  let emailBoxWidth = 400;
  let emailBoxHeight = 50;
  rect(emailBoxX, emailBoxY, emailBoxWidth, emailBoxHeight, 8);
  
  // Email placeholder or entered text
  noStroke();
  textAlign(LEFT);
  textSize(smallFontSize + 2); // Larger text
  
  if (playerEmail === "") {
    fill('#999999');
    text("  your.email@example.com", emailBoxX + 15, emailBoxY + 30);
  } else {
    fill('#333333');
    text("  " + playerEmail, emailBoxX + 15, emailBoxY + 30);
    
    // Draw blinking cursor when input is active
    if (isEmailInputActive && frameCount % cursorBlinkRate < cursorBlinkRate/2) {
      let cursorX = emailBoxX + 17 + textWidth("  " + playerEmail.substring(0, emailInputCursor));
      stroke('#333333');
      strokeWeight(2);
      line(cursorX, emailBoxY + 10, cursorX, emailBoxY + 40);
    }
  }
  
  // Submit button - Adjusted position and improved appearance with red color
  let submitBtnX = width/2;
  let submitBtnY = emailBoxY + 70;
  let submitBtnWidth = 250;
  let submitBtnHeight = 45;
  let isSubmitHovering = mouseX >= submitBtnX - submitBtnWidth/2 && mouseX <= submitBtnX + submitBtnWidth/2 && 
                         mouseY >= submitBtnY && mouseY <= submitBtnY + submitBtnHeight;
  
  // Button with red color
  fill(highlightTextColor);  // Always use the red highlight color
  if (isSubmitHovering) {
    // Add glow effect on hover
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(199, 42, 9, 0.5)';
  }
  noStroke();
  rect(submitBtnX - submitBtnWidth/2, submitBtnY, submitBtnWidth, submitBtnHeight, 8);
  drawingContext.shadowBlur = 0;  // Reset shadow
  
  // Button text
  fill('#ffffff');  // White text for better contrast on red
  textAlign(CENTER, CENTER);  // Center both horizontally and vertically
  textSize(isSubmitHovering ? smallFontSize + 2 : smallFontSize + 1);
  let buttonText = submittingScore ? "Submitting..." : (scoreSubmitted ? "Submitted!" : "SUBMIT");
  text(buttonText, submitBtnX, submitBtnY + submitBtnHeight/2);
  
  if (isSubmitHovering && !submittingScore && !scoreSubmitted) {
    cursor(HAND);
  }
  
  // Display submission message if any
  if (leaderboardMessage) {
    fill(scoreSubmitted ? '#4CAF50' : '#c72a09');
    textAlign(CENTER);
    textSize(smallFontSize);
    text(leaderboardMessage, width/2, submitBtnY + 60);
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
      // Only display the top 5 entries to make room for share buttons
      if (index < 5) {
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
      }
    });
  }
  
  // Share section title
  fill(highlightTextColor);
  textStyle(BOLD);
  textAlign(CENTER);
  textSize(bodyFontSize + 4);
  text("SHARE YOUR SCORE", width/2, height/12 + 360);
  
  // Platform buttons - smaller circular buttons with just icons
  const buttonSpacing = 80;
  const buttonY = height/12 + 420;
  const buttonSize = 70;
  
  // Draw share buttons
  // Twitter button
  drawCircularShareButton("🐦", "#1DA1F2", width/2 - buttonSpacing * 1.5, buttonY, buttonSize);
  
  // Facebook button
  drawCircularShareButton("📘", "#4267B2", width/2 - buttonSpacing * 0.5, buttonY, buttonSize);
  
  // Threads button (using thread emoji)
  drawCircularShareButton("🧵", "#000000", width/2 + buttonSpacing * 0.5, buttonY, buttonSize);
  
  // WhatsApp button
  drawCircularShareButton("📱", "#25D366", width/2 + buttonSpacing * 1.5, buttonY, buttonSize);
  
  // Platform labels
  fill(primaryTextColor);
  textSize(smallFontSize);
  textStyle(NORMAL);
  text("Twitter", width/2 - buttonSpacing * 1.5, buttonY + buttonSize/2 + 35);
  text("Facebook", width/2 - buttonSpacing * 0.5, buttonY + buttonSize/2 + 35);
  text("Threads", width/2 + buttonSpacing * 0.5, buttonY + buttonSize/2 + 35);
  text("WhatsApp", width/2 + buttonSpacing * 1.5, buttonY + buttonSize/2 + 35);
  
  // Display any share message
  if (leaderboardMessage) {
    fill(highlightTextColor);
    textStyle(NORMAL);
    textSize(smallFontSize);
    textAlign(CENTER);
    text(leaderboardMessage, width/2, buttonY + buttonSize/2 + 70);
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

// Add this function near other helper functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Updated to ensure better validation and error handling - removed async
function submitScoreToLeaderboard() {
  console.log("Submitting score with email:", playerEmail);
  
  if (!playerEmail || playerEmail.trim() === "") {
    leaderboardMessage = "Please enter a valid email address";
    return;
  }
  
  // Email validation
  if (!validateEmail(playerEmail)) {
    leaderboardMessage = "Please enter a valid email address";
    return;
  }
  
  submittingScore = true;
  leaderboardMessage = "Submitting your score...";
  
  const achievement = getAchievement(score);
  
  // Use Promise-based approach instead of async/await
    // Call the global leaderboard function defined in index.html
  window.leaderboard.submitScore(
      playerEmail,
      score,
      currentLevelNumber - 1, // Levels completed (current level minus 1)
      satisfaction,
      budget,
      achievement.title
  )
  .then(result => {
    submittingScore = false;
    
    if (result && result.success) {
      scoreSubmitted = true;
      leaderboardMessage = "Score submitted successfully!";
      
      // Ensure leaderboard data is available before showing
      fetchLeaderboard()
        .then(() => {
          // Show leaderboard explicitly
          console.log("Showing leaderboard after submission");
      showLeaderboard = true;
          window.showLeaderboard = true;
        })
        .catch(leaderboardError => {
          console.error("Error loading leaderboard:", leaderboardError);
          // Still show leaderboard with simulated data on error
          loadLeaderboardData();
          showLeaderboard = true;
          window.showLeaderboard = true;
        });
    } else {
      const errorMsg = result && result.error ? result.error : "Failed to submit score. Please try again.";
      leaderboardMessage = errorMsg;
      console.error("Submission error:", errorMsg);
      
      // Add fallback to still show the leaderboard
      setTimeout(() => {
        if (!showLeaderboard) {
          loadLeaderboardData();
          showLeaderboard = true;
          window.showLeaderboard = true;
        }
      }, 2000);
    }
  })
  .catch(error => {
    submittingScore = false;
    leaderboardMessage = "Error submitting score: " + error.message;
    console.error("Error submitting score:", error);
    
    // Add fallback to still show the leaderboard
    setTimeout(() => {
      if (!showLeaderboard) {
        loadLeaderboardData();
        showLeaderboard = true;
        window.showLeaderboard = true;
      }
    }, 2000);
  });
}

// Helper function to load simulated leaderboard data as a fallback
function loadLeaderboardData() {
  console.log("Loading simulated leaderboard data");
  // Create simulated leaderboard with the player at the top
  leaderboardData = [
    { name: maskEmail(playerEmail), score: score, rank: 1 },
    { name: "j***@example.com", score: Math.floor(score * 0.9), rank: 2 },
    { name: "a***@gmail.com", score: Math.floor(score * 0.8), rank: 3 },
    { name: "t***@hotmail.com", score: Math.floor(score * 0.7), rank: 4 },
    { name: "m***@outlook.com", score: Math.floor(score * 0.6), rank: 5 }
  ];
}

// Helper function to fetch leaderboard data
function fetchLeaderboard() {
  return new Promise((resolve, reject) => {
    window.leaderboard.getTopScores(10)
      .then(result => {
    if (result.success) {
      leaderboardData = result.data || [];
          resolve(leaderboardData);
    } else {
      console.error("Error fetching leaderboard:", result.error);
      leaderboardMessage = "Failed to load leaderboard data.";
          reject(new Error(result.error));
    }
      })
      .catch(error => {
    console.error("Error fetching leaderboard:", error);
    leaderboardMessage = "Error loading leaderboard: " + error.message;
        reject(error);
      });
  });
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
                  `Can you beat my score? Play at tripmerge.com/tripchaos 🌟\n` +
                  `#TripChaos #TripMerge`;
                  
  // Open share dialog based on platform
  if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  } else if (platform === 'threads') {
    // Threads doesn't have a direct share API, so use Twitter as fallback
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  } else if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://tripmerge.com/tripchaos")}&quote=${encodeURIComponent(shareText)}`);
  } else if (platform === 'linkedin') {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://tripmerge.com/tripchaos")}&summary=${encodeURIComponent(shareText)}`);
  } else if (platform === 'clipboard') {
    // Copy to clipboard
    navigator.clipboard.writeText(shareText)
      .then(() => {
        // Show success message
        const message = "Score copied to clipboard!";
        leaderboardMessage = message;
        console.log(message);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          if (leaderboardMessage === message) {
            leaderboardMessage = "";
          }
        }, 3000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        leaderboardMessage = "Failed to copy to clipboard";
      });
  } else if (platform === 'whatsapp') {
    // Share via WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
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
  // Reset any window-level currentLevelNumber
  if (window.currentLevelNumber !== undefined) {
    window.currentLevelNumber = 1;
  }
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
  
  // Initialize first platform
  platforms.push({
    x: 0,
    y: 400,
    width: 200,
    height: 20,
    theme: "beach"
  });
  
  // Ensure level is properly generated
  generateLevel();
  
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
  let baseSpawnRate = 0.015; // Increased from 0.015 for more frequent mishaps
  let spawnRate = baseSpawnRate * (1 + (currentLevelNumber - 1) * 0.6); // Increased scaling from 0.5 to 0.6
  let maxMishaps = 2 + (currentLevelNumber - 1) * 2; // Increased base from 2 to 3
  
  // Spawn new falling mishaps with scaled frequency
  if (!showingDecision && random() < spawnRate && mishaps.length < maxMishaps) {
    // Calculate spawn position relative to player
    let spawnX = player.worldX + random(-50, 250); // Reduced safe zone, more challenging positioning
    spawnX = constrain(spawnX, 100, levelLength - 100); // Keep within level bounds
    
    // Determine mishap type based on level
    let mishapType;
    let typeRand = random();
    
    if (currentLevelNumber === 1) {
      // Level 1: 30% clouds (unchanged), 70% dollars
      mishapType = typeRand < 0.3 ? 'cloud' : 'dollar';
    } else if (currentLevelNumber === 2) {
      // Level 2: 30% clouds (unchanged), 40% dollars, 30% suitcases (increased from 20%)
      if (typeRand < 0.3) mishapType = 'cloud';
      else if (typeRand < 0.7) mishapType = 'dollar';
      else mishapType = 'suitcase';
    } else {
      // Level 3: 15% clouds (unchanged), 35% dollars, 50% suitcases (increased from 40%)
      if (typeRand < 0.15) mishapType = 'cloud';
      else if (typeRand < 0.5) mishapType = 'dollar';
      else mishapType = 'suitcase';
    }
    
    // Scale falling speed with level
    let baseVelocity = 0.8 + (currentLevelNumber - 1) * 0.4; // Reduced from 1 + (level-1) * 0.5
    
    mishaps.push({
      x: spawnX,
      y: -50,  // Start above the screen
      width: 20,
      height: 20,
      type: mishapType,
      velocityY: baseVelocity,
      gravity: 0.15, // Reduced from 0.2 to make falling slower
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
      // Ensure level number is reset to 1
      currentLevelNumber = 1;
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
        showSharePopup = false; // Also hide popup
        return false;
      }
      
      // Handle share popup if it's visible
      if (showSharePopup) {
        // Popup dimensions for reference
        const popupWidth = 450;
        const popupHeight = 350;
        const popupX = width/2 - popupWidth/2;
        const popupY = height/2 - popupHeight/2;
        
        // Close button
        const closeX = popupX + popupWidth - 30;
        const closeY = popupY + 25;
        const closeButtonSize = 30;
        const closeTouchArea = 20; // Extra touch area for close button
        
        if (mouseX >= closeX - closeButtonSize/2 - closeTouchArea && 
            mouseX <= closeX + closeButtonSize/2 + closeTouchArea &&
            mouseY >= closeY - closeButtonSize/2 - closeTouchArea && 
            mouseY <= closeY + closeButtonSize/2 + closeTouchArea) {
          showSharePopup = false;
          return false;
        }
        
        // Check if touch is outside popup (to close it)
        if (mouseX < popupX || mouseX > popupX + popupWidth || 
            mouseY < popupY || mouseY > popupY + popupHeight) {
          showSharePopup = false;
          return false;
        }
        
        // Platform buttons - circular buttons
        const buttonSpacing = 70;
        const buttonY = popupY + 210;
        const buttonSize = 60;
        const buttonTouchArea = 15; // Extra touch area for button detection
        
        // Twitter button
        if (dist(mouseX, mouseY, width/2 - buttonSpacing * 1.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
        shareScore('twitter');
          showSharePopup = false;
        return false;
      }
      
        // Facebook button
        if (dist(mouseX, mouseY, width/2 - buttonSpacing * 0.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
          shareScore('facebook');
          showSharePopup = false;
      return false;
    }
  
        // LinkedIn button
        if (dist(mouseX, mouseY, width/2 + buttonSpacing * 0.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
          shareScore('linkedin');
          showSharePopup = false;
          return false;
        }
        
        // Copy button
        if (dist(mouseX, mouseY, width/2 + buttonSpacing * 1.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
          shareScore('clipboard');
          showSharePopup = false;
          return false;
        }
        
        return false; // Prevent other touches when popup is shown
      }
      
      // Check for clicks on the new share buttons
      const buttonSpacing = 80;
      const buttonY = height/12 + 420;
      const buttonSize = 70;
      const buttonTouchArea = 20; // Extra touch area for better detection
      
      // Twitter button
      if (dist(mouseX, mouseY, width/2 - buttonSpacing * 1.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
        shareScore('twitter');
        return false;
      }
      
      // Facebook button
      if (dist(mouseX, mouseY, width/2 - buttonSpacing * 0.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
        shareScore('facebook');
        return false;
      }
      
      // Threads button (using the existing LinkedIn URL for now)
      if (dist(mouseX, mouseY, width/2 + buttonSpacing * 0.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
        // For Threads, we'll use the threads parameter
        shareScore('threads');
        return false;
      }
      
      // WhatsApp button
      if (dist(mouseX, mouseY, width/2 + buttonSpacing * 1.5, buttonY) <= (buttonSize/2 + buttonTouchArea)) {
        shareScore('whatsapp');
        return false;
      }
      
      return false;
    }
  
    // Check if play again text was clicked - UPDATED POSITION
    let playAgainX = width/2;
    let playAgainY = height/12 + 40;
    
    // Add larger click area for better interaction
    let playAgainClickArea = 25;
    
    if (mouseX >= playAgainX - 80 - playAgainClickArea && 
        mouseX <= playAgainX + 80 + playAgainClickArea && 
        mouseY >= playAgainY - 20 - playAgainClickArea && 
        mouseY <= playAgainY + 20 + playAgainClickArea) {
      console.log("Play again clicked");  // Debug log
      // Ensure level number is reset before starting game
      currentLevelNumber = 1;
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

    // Calculate leaderboard section Y position consistently with draw function
    const sectionSpacing = 5; // Reduced spacing to match drawGameOverScreen
    let leaderboardSectionY = height/12 + 330 + sectionSpacing;
    
    // Check if privacy checkbox was clicked - updated position
    let checkboxX = width/2 - 180;
    let checkboxY = leaderboardSectionY + 40;
    let checkboxSize = 16;
    
    if (mouseX >= checkboxX && mouseX <= checkboxX + checkboxSize && 
        mouseY >= checkboxY && mouseY <= checkboxY + checkboxSize) {
      privacyCheckboxChecked = !privacyCheckboxChecked; // Toggle checkbox state
      console.log("Privacy checkbox clicked, now:", privacyCheckboxChecked ? "checked" : "unchecked");
      return false;
    }
    
    // Check if privacy policy text was clicked - updated position
    if (!showPrivacyPolicy) {
      // Use the same approach as in drawGameOverScreen and drawWinScreen
      let beforeText = "I accept the ";
      let policyText = "privacy policy";
      
      // Calculate position based on the checkbox
      let textX = checkboxX + checkboxSize + 10;
      let policyX = textX + textWidth(beforeText);
      let policyWidth = textWidth(policyText);
      
      if (mouseX >= policyX && mouseX <= policyX + policyWidth && 
          mouseY >= checkboxY && mouseY <= checkboxY + 20) {
        showPrivacyPolicy = true;
        console.log("Privacy policy link clicked");
        return false;
      }
    }
    
    // Check if privacy policy popup is visible and handle close actions
    if (showPrivacyPolicy) {
      const popupWidth = 600;
      const popupHeight = 400; 
      const popupX = width/2 - popupWidth/2;
      const popupY = height/2 - popupHeight/2;
      
      // Close button
      const closeX = popupX + popupWidth - 30;
      const closeY = popupY + 25;
      const closeButtonSize = 30;
      const closeTouchArea = 20; // Extra touch area for close button
      
      if (mouseX >= closeX - closeButtonSize/2 - closeTouchArea && 
          mouseX <= closeX + closeButtonSize/2 + closeTouchArea &&
          mouseY >= closeY - closeButtonSize/2 - closeTouchArea && 
          mouseY <= closeY + closeButtonSize/2 + closeTouchArea) {
        showPrivacyPolicy = false;
        return false;
      }
      
      // Check if touch is outside popup (to close it)
      if (mouseX < popupX || mouseX > popupX + popupWidth || 
          mouseY < popupY || mouseY > popupY + popupHeight) {
        showPrivacyPolicy = false;
        return false;
      }
      
      return false; // Prevent other touches when popup is shown
    }

    // Check if email input was clicked
    let emailBoxX = width/2 - 200;
    let emailBoxY = leaderboardSectionY + 80;
    let emailBoxWidth = 400;
    let emailBoxHeight = 50;
    
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
    let submitBtnY = emailBoxY + 70;
    let submitBtnWidth = 250;
    let submitBtnHeight = 45;
    
    if (mouseX >= submitBtnX - submitBtnWidth/2 && mouseX <= submitBtnX + submitBtnWidth/2 && 
        mouseY >= submitBtnY && mouseY <= submitBtnY + submitBtnHeight &&
        !submittingScore && !scoreSubmitted) {
      isEmailInputActive = false; // Deactivate input
      submitEmailToLeaderboard(); // Use the wrapper function instead
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
  
  // Handle decision point touches
  if (showingDecision && touches.length > 0) {
    let touch = touches[0];
    // Adjust touch coordinates to account for viewport offset
    let adjustedX = touch.x - offsetX;
    let adjustedY = touch.y - offsetY;
    
    // Calculate decision box dimensions
    let boxWidth = isMobileDevice() ? gameWidth * 0.9 : 500;
    let boxHeight = isMobileDevice() ? gameHeight * 0.5 : 300;
    let boxX = gameWidth/2 - boxWidth/2;
    let boxY = isMobileDevice() ? gameHeight * 0.2 : gameHeight/2 - boxHeight/2;
    
    // Calculate option positions
    let optionSpacing = isMobileDevice() ? 50 : 45;
    let optionStartY = boxY + (isMobileDevice() ? 100 : 110);
    
    for (let i = 0; i < currentDecision.options.length; i++) {
      let y = optionStartY + i * optionSpacing;
      let buttonWidth = isMobileDevice() ? boxWidth * 0.8 : 360;
      let buttonX = gameWidth/2 - buttonWidth/2;
      
      // Add extra touch area for better touch response
      let touchArea = 20 * window.gameScale;
      
      if (adjustedX >= buttonX - touchArea && 
          adjustedX <= buttonX + buttonWidth + touchArea && 
          adjustedY >= y - touchArea && 
          adjustedY <= y + 40 + touchArea) {
        console.log("Decision option touched:", i);  // Debug log
        makeDecision(i);
        return false;
      }
    }
  }
  
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
      // Ensure level number is reset to 1
      currentLevelNumber = 1;
      resetGame();
      return false;
    }
  }
  
  // Handle Game Over and Win screens
  if ((gameState === 'gameOver' || gameState === 'win') && touches.length > 0) {
    let touch = touches[0];
    
    // Check if we're in leaderboard view
    if (showLeaderboard) {
      // Check if back button was touched
      let backBtnX = width/2 + 150;
      let backBtnY = height/12;
      
      if (touch.x >= backBtnX - 50 && touch.x <= backBtnX + 50 && 
          touch.y >= backBtnY - 20 && touch.y <= backBtnY + 20) {
        showLeaderboard = false;
        showSharePopup = false; // Also hide popup
        return false;
      }
      
      // Handle touches on new share buttons
      const buttonSpacing = 80;
      const buttonY = height/12 + 420;
      const buttonSize = 70;
      const touchArea = 25; // Extra touch area for better detection
      
      // Twitter button
      if (dist(touch.x, touch.y, width/2 - buttonSpacing * 1.5, buttonY) <= (buttonSize/2 + touchArea)) {
        shareScore('twitter');
        return false;
      }
      
      // Facebook button
      if (dist(touch.x, touch.y, width/2 - buttonSpacing * 0.5, buttonY) <= (buttonSize/2 + touchArea)) {
        shareScore('facebook');
        return false;
      }
      
      // Threads button
      if (dist(touch.x, touch.y, width/2 + buttonSpacing * 0.5, buttonY) <= (buttonSize/2 + touchArea)) {
        // Use threads parameter
        shareScore('threads');
        return false;
      }
      
      // WhatsApp button
      if (dist(touch.x, touch.y, width/2 + buttonSpacing * 1.5, buttonY) <= (buttonSize/2 + touchArea)) {
        shareScore('whatsapp');
        return false;
      }
      
      return false;
    }
    
    // Check if play again text was touched - UPDATED POSITION
    let playAgainX = width/2;
    let playAgainY = height/12 + 40;
    
    // Add extra touch area for better interaction
    let playAgainTouchArea = 30;
    
    if (touch.x >= playAgainX - 80 - playAgainTouchArea && 
        touch.x <= playAgainX + 80 + playAgainTouchArea && 
        touch.y >= playAgainY - 20 - playAgainTouchArea && 
        touch.y <= playAgainY + 20 + playAgainTouchArea) {
      console.log("Play again touched");  // Debug log
      // Ensure level number is reset before starting game
      currentLevelNumber = 1;
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
    
    // Calculate leaderboard section Y position consistently with draw function
    const sectionSpacing = 5; // Reduced spacing to match drawGameOverScreen
    let leaderboardSectionY = height/12 + 330 + sectionSpacing;
    
    // IMPROVED: Check if email input was touched with larger touch area
    let emailBoxX = width/2 - 200;
    let emailBoxY = leaderboardSectionY + 80;
    let emailBoxWidth = 400;
    let emailBoxHeight = 50;
    
    // Add extra touch area for better touch response
    let emailTouchArea = 60; // Increased from 40 for better detection
    
    if (touch.x >= emailBoxX - emailTouchArea && 
        touch.x <= emailBoxX + emailBoxWidth + emailTouchArea &&
        touch.y >= emailBoxY - emailTouchArea && 
        touch.y <= emailBoxY + emailBoxHeight + emailTouchArea) {
      // Add visual feedback
      push();
      fill('#ffffff');
      stroke('#c72a09');
      strokeWeight(4);
      rect(emailBoxX, emailBoxY, emailBoxWidth, emailBoxHeight, 8);
      pop();
      
      // Activate the input field directly
      isEmailInputActive = true;
      emailInputCursor = playerEmail.length; // Set cursor at the end
      
      // Show keyboard on mobile devices
      if (isMobileDevice()) {
        // Use our improved email input creation
        const tempInput = createEmailInput(playerEmail);
        
        // Position it properly when needed (but keep it invisible)
        tempInput.style.top = '50%';
        tempInput.style.left = '50%';
        tempInput.style.transform = 'translate(-50%, -50%)';
        tempInput.style.width = '300px';
        tempInput.style.height = '40px';
        tempInput.style.zIndex = '9999';
        tempInput.style.pointerEvents = 'auto'; // Make it receive input events
        
        // Focus it
        tempInput.focus();
        
        // Listen for input and update the game's email field
        tempInput.addEventListener('input', function(e) {
          playerEmail = e.target.value;
          emailInputCursor = playerEmail.length;
          console.log("Email updated:", playerEmail);
        });
        
        // Clean up when done
        tempInput.addEventListener('blur', function() {
          setTimeout(function() {
            tempInput.style.pointerEvents = 'none';
            tempInput.style.top = '-1000px'; // Move off-screen again
          }, 100);
        });
      }
      
      console.log("Email input touched");
      return false;
    } else if (isEmailInputActive) {
      // Only deactivate if we're not touching the submit button
      let submitBtnX = width/2;
      let submitBtnY = emailBoxY + 70;
      let submitBtnWidth = 250;
      let submitBtnHeight = 45;
      let submitTouchArea = 50; // Very large touch area
      
      if (!(touch.x >= submitBtnX - submitBtnWidth/2 - submitTouchArea && 
          touch.x <= submitBtnX + submitBtnWidth/2 + submitTouchArea && 
          touch.y >= submitBtnY - submitTouchArea && 
          touch.y <= submitBtnY + submitBtnHeight + submitTouchArea)) {
        isEmailInputActive = false;
      }
    }
    
    // IMPROVED: Check if submit button was touched with much larger touch area
    let submitBtnX = width/2;
    let submitBtnY = emailBoxY + 70;
    let submitBtnWidth = 250;
    let submitBtnHeight = 45;
    let submitTouchArea = 70; // Increased from 50 to 70 for even more generous touch area
    
    console.log("Touch at:", touch.x, touch.y);
    console.log("Submit button bounds:", 
                submitBtnX - submitBtnWidth/2 - submitTouchArea, 
                submitBtnX + submitBtnWidth/2 + submitTouchArea, 
                submitBtnY - submitTouchArea, 
                submitBtnY + submitBtnHeight + submitTouchArea);
    
    if (touch.x >= submitBtnX - submitBtnWidth/2 - submitTouchArea && 
        touch.x <= submitBtnX + submitBtnWidth/2 + submitTouchArea && 
        touch.y >= submitBtnY - submitTouchArea && 
        touch.y <= submitBtnY + submitBtnHeight + submitTouchArea) {
      
      // Add visual feedback for touch
      push();
      fill(highlightTextColor);
      noStroke();
      rect(submitBtnX - submitBtnWidth/2, submitBtnY, submitBtnWidth, submitBtnHeight, 8);
      fill('#ffffff');
      textAlign(CENTER, CENTER);
      textSize(smallFontSize + 3); // Slightly larger text for feedback
      text("SUBMIT", submitBtnX, submitBtnY + submitBtnHeight/2);
      pop();
      
      console.log("Submit button touched - calling submitScoreToLeaderboard with email:", playerEmail);
      isEmailInputActive = false; // Deactivate input field
      
      // Add a small delay to allow the touch feedback to be visible
      setTimeout(() => {
        // Direct submission for clearer debugging
        submitEmailToLeaderboard();
      }, 100);
      
      return false;
    }
  }
  
  return false; // Prevent default touch behavior
}

// Add a wrapper function to make email submission more reliable
function submitEmailToLeaderboard() {
  // Add thorough debugging for the submission process
  console.log("==== EMAIL SUBMISSION DEBUG ====");
  console.log("1. Email:", playerEmail);
  console.log("2. Score:", score);
  console.log("3. Level:", currentLevelNumber - 1);
  console.log("4. Satisfaction:", satisfaction);
  console.log("5. Budget:", budget);
  console.log("6. Window.leaderboard available:", window.leaderboard ? "Yes" : "No");
  console.log("7. Supabase client available:", typeof supabase !== 'undefined' ? "Yes" : "No");
  console.log("8. Privacy checkbox checked:", privacyCheckboxChecked ? "Yes" : "No");
  
  // Check if the privacy checkbox is checked
  if (!privacyCheckboxChecked) {
    leaderboardMessage = "Please accept the privacy policy first";
    console.log("Submission blocked: Privacy policy not accepted");
    return;
  }
  
  // Check if Supabase is properly initialized
  if (typeof supabase === 'undefined') {
    console.error("CRITICAL ERROR: Supabase is not defined!");
    leaderboardMessage = "Error: Supabase API not available";
    
    // Add a reload button to fix potential loading issues
    let reloadBtn = document.createElement('button');
    reloadBtn.innerText = "Reload Page";
    reloadBtn.style.position = 'fixed';
    reloadBtn.style.top = '20px';
    reloadBtn.style.right = '20px';
    reloadBtn.style.padding = '10px 20px';
    reloadBtn.style.backgroundColor = '#c72a09';
    reloadBtn.style.color = 'white';
    reloadBtn.style.border = 'none';
    reloadBtn.style.borderRadius = '5px';
    reloadBtn.style.fontSize = '16px';
    reloadBtn.style.cursor = 'pointer';
    reloadBtn.onclick = function() {
      window.location.reload();
    };
    document.body.appendChild(reloadBtn);
    
    return;
  }
  
  // Check if the leaderboard API is available in the window object
  if (!window.leaderboard) {
    console.error("CRITICAL ERROR: Leaderboard API not found!");
    leaderboardMessage = "Error: Leaderboard API not available";
    return;
  }
  
  // Email validation
  if (!playerEmail || playerEmail.trim() === "") {
    leaderboardMessage = "Please enter a valid email address";
    console.error("Email submission failed: Empty email");
    return;
  }
  
  // Email format validation
  if (!validateEmail(playerEmail)) {
    leaderboardMessage = "Please enter a valid email format";
    console.error("Email submission failed: Invalid format:", playerEmail);
    return;
  }
  
  console.log("All validation passed, proceeding with submission");
  
  // DIRECT IMPLEMENTATION: Instead of calling submitScoreToLeaderboard
  submittingScore = true;
  leaderboardMessage = "Submitting your score...";
  
  const achievement = getAchievement(score);
  
  // Use Promise-based approach
  window.leaderboard.submitScore(
    playerEmail,
    score,
    currentLevelNumber - 1, // Levels completed (current level minus 1)
    satisfaction,
    budget,
    achievement.title
  )
  .then(result => {
    submittingScore = false;
    
    if (result && result.success) {
      scoreSubmitted = true;
      leaderboardMessage = "Score submitted successfully!";
      
      // Ensure leaderboard data is available before showing
      fetchLeaderboard()
        .then(() => {
          // Show leaderboard explicitly
          console.log("Showing leaderboard after submission");
          showLeaderboard = true;
          window.showLeaderboard = true;
        })
        .catch(leaderboardError => {
          console.error("Error loading leaderboard:", leaderboardError);
          // Still show leaderboard with simulated data on error
          loadLeaderboardData();
          showLeaderboard = true;
          window.showLeaderboard = true;
        });
    } else {
      const errorMsg = result && result.error ? result.error : "Failed to submit score. Please try again.";
      leaderboardMessage = errorMsg;
      console.error("Submission error:", errorMsg);
      
      // Add fallback to still show the leaderboard
      setTimeout(() => {
        if (!showLeaderboard) {
          loadLeaderboardData();
          showLeaderboard = true;
          window.showLeaderboard = true;
        }
      }, 2000);
    }
  })
  .catch(error => {
    submittingScore = false;
    leaderboardMessage = "Error submitting score: " + error.message;
    console.error("Error submitting score:", error);
    
    // Add fallback to still show the leaderboard
    setTimeout(() => {
      if (!showLeaderboard) {
        loadLeaderboardData();
        showLeaderboard = true;
        window.showLeaderboard = true;
      }
    }, 2000);
  });
}

// Modified function to create a more browser-friendly email input
function createEmailInput(value) {
  // Remove any existing input elements
  const existingInputs = document.querySelectorAll('.game-email-input');
  existingInputs.forEach(input => input.remove());
  
  // Create a form element to properly handle submissions
  const form = document.createElement('form');
  form.setAttribute('novalidate', 'true');
  form.style.position = 'absolute';
  form.style.opacity = '0.01';
  form.style.pointerEvents = 'none'; // Make it invisible to clicks/touches except when specifically targeted
  form.style.zIndex = '-1';
  form.onsubmit = (e) => {
    e.preventDefault();
    submitEmailToLeaderboard();
    return false;
  };
  document.body.appendChild(form);
  
  // Create the actual input element with improved styles for mobile
  const input = document.createElement('input');
  input.setAttribute('type', 'email');
  input.setAttribute('inputmode', 'email'); // Better mobile keyboard
  input.setAttribute('autocapitalize', 'none'); // Prevent auto-capitalization
  input.setAttribute('autocorrect', 'off'); // Disable autocorrect
  input.setAttribute('spellcheck', 'false'); // Disable spellcheck
  input.setAttribute('autocomplete', 'email'); // Enable email autocomplete
  input.setAttribute('placeholder', 'your.email@example.com');
  input.setAttribute('enterkeyhint', 'go'); // Changes enter key to "Go" on mobile
  input.classList.add('game-email-input');
  input.value = value || '';
  
  // Apply styles for better mobile UX
  input.style.width = '100%';
  input.style.height = '100%';
  input.style.fontSize = '16px'; // At least 16px to prevent zoom on iOS
  input.style.padding = '12px';
  input.style.boxSizing = 'border-box';
  input.style.border = '2px solid #3498db';
  input.style.borderRadius = '5px';
  input.style.zIndex = '9999';
  input.style.backgroundColor = '#ffffff';
  input.style.pointerEvents = 'auto'; // Enable interaction
  
  // Add mobile-specific styles
  if (isMobileDevice()) {
    input.style.fontSize = '18px'; // Larger for mobile
    input.style.padding = '14px 12px';
  }
  
  // Handle keyboard events
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitEmailToLeaderboard();
      input.blur(); // Hide keyboard
      return false;
    }
  });
  
  form.appendChild(input);
  return input;
}

// Function to draw the share popup modal
function drawSharePopup() {
  // Semi-transparent background overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Popup container
  const popupWidth = 450;
  const popupHeight = 350;
  const popupX = width/2 - popupWidth/2;
  const popupY = height/2 - popupHeight/2;
  
  // Popup background
  fill(255);
  stroke(highlightTextColor);
  strokeWeight(3);
  rect(popupX, popupY, popupWidth, popupHeight, 15);
  
  // Popup header
  fill(highlightTextColor);
  noStroke();
  rect(popupX, popupY, popupWidth, 50, 15, 15, 0, 0);
  
  // Title
  fill(255);
  textAlign(CENTER);
  textSize(bodyFontSize + 2);
  textStyle(BOLD);
  text("Share Your Score", width/2, popupY + 32);
  
  // Close button
  const closeX = popupX + popupWidth - 30;
  const closeY = popupY + 25;
  const closeButtonSize = 30;
  const isCloseHovering = mouseX >= closeX - closeButtonSize/2 && mouseX <= closeX + closeButtonSize/2 &&
                          mouseY >= closeY - closeButtonSize/2 && mouseY <= closeY + closeButtonSize/2;
  
  stroke(255);
  strokeWeight(isCloseHovering ? 3 : 2);
  line(closeX - 10, closeY - 10, closeX + 10, closeY + 10);
  line(closeX + 10, closeY - 10, closeX - 10, closeY + 10);
  
  if (isCloseHovering) {
    cursor(HAND);
  }
  
  // Score preview
  noStroke();
  fill(primaryTextColor);
  textSize(smallFontSize);
  textStyle(NORMAL);
  textAlign(CENTER);
  
  const achievement = getAchievement(score);
  let previewText = `Score: ${score} • Achievement: ${achievement.title}\n` +
                   `Level ${currentLevelNumber} with ${Math.round(satisfaction)}% satisfaction!`;
  
  // Draw a preview of the score text that will be shared
  fill('#f5f7f8');
  rect(popupX + 25, popupY + 70, popupWidth - 50, 60, 10);
  
  fill(primaryTextColor);
  text(previewText, width/2, popupY + 100);
  
  // Share options
  textAlign(CENTER);
  textStyle(BOLD);
  fill(primaryTextColor);
  text("Choose a platform:", width/2, popupY + 160);
  
  // Platform buttons - smaller circular buttons with just icons
  const buttonSpacing = 70;
  const buttonY = popupY + 210;
  const buttonSize = 60;
  
  // Twitter button
  drawCircularShareButton("🐦", "#1DA1F2", width/2 - buttonSpacing * 1.5, buttonY, buttonSize);
  
  // Facebook button
  drawCircularShareButton("📘", "#4267B2", width/2 - buttonSpacing * 0.5, buttonY, buttonSize);
  
  // LinkedIn button
  drawCircularShareButton("📊", "#0077B5", width/2 + buttonSpacing * 0.5, buttonY, buttonSize);
  
  // Copy button
  drawCircularShareButton("📋", "#333333", width/2 + buttonSpacing * 1.5, buttonY, buttonSize);
  
  // Platform labels
  fill(primaryTextColor);
  textSize(smallFontSize - 2);
  textStyle(NORMAL);
  text("Twitter", width/2 - buttonSpacing * 1.5, buttonY + buttonSize/2 + 25);
  text("Facebook", width/2 - buttonSpacing * 0.5, buttonY + buttonSize/2 + 25);
  text("LinkedIn", width/2 + buttonSpacing * 0.5, buttonY + buttonSize/2 + 25);
  text("Copy", width/2 + buttonSpacing * 1.5, buttonY + buttonSize/2 + 25);
  
  // Or click anywhere outside to close (hint text)
  text("or click outside to close", width/2, popupY + popupHeight - 15);
}

// Function to draw circular share buttons
function drawCircularShareButton(icon, color, x, y, size) {
  // Increase button size for mobile
  if (isMobileDevice()) {
    size = size * 1.3;
  }
  
  const isHovering = dist(mouseX, mouseY, x, y) <= size/1.8; // Larger touch area
  
  // Button shadow
  if (isHovering) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  } else {
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
  }
  
  // Button background with visual feedback on hover
  fill(isHovering ? colorShift(color) : color);
  strokeWeight(isHovering ? 3 : 0);
  stroke(255);
  ellipse(x, y, size, size);
  drawingContext.shadowBlur = 0;
  
  // Button icon
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(size * 0.5);
  text(icon, x, y);
  
  if (isHovering) {
    cursor(HAND);
  }
}

// Helper function to slightly shift a color for hover effect
function colorShift(hexColor) {
  // Simple implementation - darken by 15%
  let r = parseInt(hexColor.substr(1, 2), 16);
  let g = parseInt(hexColor.substr(3, 2), 16);
  let b = parseInt(hexColor.substr(5, 2), 16);
  
  r = Math.max(0, Math.floor(r * 0.85));
  g = Math.max(0, Math.floor(g * 0.85));
  b = Math.max(0, Math.floor(b * 0.85));
  
  return '#' + 
    (r < 16 ? '0' : '') + r.toString(16) +
    (g < 16 ? '0' : '') + g.toString(16) +
    (b < 16 ? '0' : '') + b.toString(16);
}

// Add new function to draw privacy policy popup
// Function to draw the privacy policy popup
// Add new function to draw privacy policy popup
// Function to draw the privacy policy popup
function drawPrivacyPolicyPopup() {
  // Semi-transparent overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Popup container
  const popupWidth = 600;
  const popupHeight = 400;
  const popupX = width/2 - popupWidth/2;
  const popupY = height/2 - popupHeight/2;
  
  // Popup background
  fill(255);
  stroke(100);
  strokeWeight(2);
  rect(popupX, popupY, popupWidth, popupHeight, 15);
  
  // Popup header
  fill('#3498db');
  noStroke();
  rect(popupX, popupY, popupWidth, 50, 15, 15, 0, 0);
  
  // Title
  fill(255);
  textAlign(CENTER);
  textSize(bodyFontSize + 2);
  text("Privacy Policy", width/2, popupY + 32);
  
  // Close button (X)
  const closeX = popupX + popupWidth - 30;
  const closeY = popupY + 25;
  textSize(bodyFontSize);
  textAlign(CENTER, CENTER);
  text("×", closeX, closeY);
  
  // Privacy policy content
  fill(50);
  textAlign(LEFT);
  textSize(smallFontSize);
  const contentX = popupX + 30;
  let contentY = popupY + 80;
  const lineHeight = smallFontSize * 1.5;
  
  // Policy sections - this will need to be updated with actual policy text
  textStyle(BOLD);
  text("TripMerge Privacy Policy", contentX, contentY);
  contentY += lineHeight;
  
  textStyle(NORMAL);
  text("Last Updated: " + new Date().toLocaleDateString(), contentX, contentY);
  contentY += lineHeight * 1.5;
  
  text("1. Information We Collect", contentX, contentY);
  contentY += lineHeight;
  textSize(smallFontSize - 1);
  text("We collect your email address when you submit your score to our leaderboard. This helps us", contentX, contentY);
  contentY += lineHeight;
  text("identify your score and contact you with updates about TripMerge.", contentX, contentY);
  contentY += lineHeight * 1.5;
  
  textSize(smallFontSize);
  text("2. How We Use Your Information", contentX, contentY);
  contentY += lineHeight;
  textSize(smallFontSize - 1);
  text("Your email may be used to: display your score on our leaderboard, send you updates", contentX, contentY);
  contentY += lineHeight;
  text("about TripMerge's launch, and notify you about future game updates.", contentX, contentY);
  contentY += lineHeight * 1.5;
  
  textSize(smallFontSize);
  text("3. Data Security", contentX, contentY);
  contentY += lineHeight;
  textSize(smallFontSize - 1);
  text("We implement reasonable security measures to protect your personal information.", contentX, contentY);
  contentY += lineHeight * 1.5;
  
  textSize(smallFontSize);
  text("4. Your Rights", contentX, contentY);
  contentY += lineHeight;
  textSize(smallFontSize - 1);
  text("You can request to access, correct, or delete your personal information by contacting us.", contentX, contentY);
  contentY += lineHeight * 2;
  
  // Footer
  fill('#3498db');
  textAlign(CENTER);
  textSize(smallFontSize);
  text("By clicking outside this popup or on the X, you acknowledge you've read this policy.", width/2, popupY + popupHeight - 25);
}


// Draw win screen with improved readability
function drawWinScreen() {
  background('#d9d9d9');

  // Handle leaderboard view if active
  if (showLeaderboard) {
    drawLeaderboardScreen();
    return;
  }

  // Win Title and Play Again text
  noStroke();
  fill('#4CAF50');  // Green color for "YOU WIN"
  textStyle(BOLD);
  textSize(titleFontSize);
  textAlign(CENTER);
  text("YOU WIN", width/2, height/12);
  
  // Play Again text - moved under Win title
  let playAgainX = width/2;
  let playAgainY = height/12 + 40;
  let isPlayAgainHovering = mouseX >= playAgainX - 80 && mouseX <= playAgainX + 80 && 
                           mouseY >= playAgainY - 20 && mouseY <= playAgainY + 20;
  
  stroke(highlightTextColor);
  strokeWeight(3);
  fill('#ffffff');
  textSize(titleFontSize - 10);
  text("PLAY AGAIN", playAgainX, playAgainY);
  noStroke();
  
  if (isPlayAgainHovering) {
    cursor(HAND);
  } else if (!isEmailInputActive) {
    cursor(ARROW);
  }

  // COMBINED Score & Achievement section
  fill('#f5f7f8');
  rect(width/2 - 250, height/12 + 70, 500, 90, 10);
  
  // Score part
  fill(primaryTextColor);
  textSize(bodyFontSize);
  textAlign(CENTER);
  text(`Final Score: ${score}`, width/2, height/12 + 100);

  // Achievement part
  let achievement = getAchievement(score);
  fill(achievement.color);
  textStyle(BOLD);
  textSize(bodyFontSize);
  textAlign(CENTER);
  text("🏆 " + achievement.title, width/2, height/12 + 140);
  
  // TripMerge solutions section - BIGGER with two columns
  fill('#f5f7f8');
  // Remove the red stroke/contour
  noStroke();
  rect(width/2 - 300, height/12 + 170, 600, 150, 12); // Made taller

  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize + 4); // Increased size
  textAlign(CENTER);
  text("Improve Your Trips with Tripmerge!", width/2, height/12 + 200);
  
  // TripMerge features list - two columns with larger text
  textStyle(NORMAL);
  fill(primaryTextColor);
  textSize(smallFontSize); // Larger text
  
  // Left column features
  textAlign(LEFT);
  text("💰 Trip budget calculation tools", width/2 - 270, height/12 + 220);
  text("👥 Group trip planning features", width/2 - 270, height/12 + 245);
  text("📊 Trip destination decision matrix", width/2 - 270, height/12 + 270);
  text("✨ Travel wishlists with groups", width/2 - 270, height/12 + 295);
  
  // Right column features
  text("🗺️ Hidden gems search tool", width/2 + 30, height/12 + 220);
  text("🌱 Trip carbon footprint tool", width/2 + 30, height/12 + 245);
  text("💼 Expense tracking features", width/2 + 30, height/12 + 270);
  text("✨ And so much more!", width/2 + 30, height/12 + 295);

  // Minimal spacing between sections 
  const sectionSpacing = 5; // Reduced from 20 to bring sections closer

  // Email collection section - POSITIONED MUCH CLOSER to section above
  fill('#f5f7f8');
  stroke(highlightTextColor);
  strokeWeight(4);  // Thicker border for emphasis
  // Calculate position right after Tripmerge section
  let leaderboardSectionY = height/12 + 330 + sectionSpacing;
  rect(width/2 - 280, leaderboardSectionY, 560, 200, 12); 
  noStroke();

  // Newsletter text and leaderboard prompt - CENTERED
  fill(highlightTextColor);
  textStyle(BOLD);
  textSize(smallFontSize + 4); // Increased size
  textAlign(CENTER);
  text("🚀 JOIN THE LEADERBOARD & GET TRIPMERGE UPDATES!", width/2, leaderboardSectionY + 30);
  
  // Instructions for email input - moved right under the headline
  fill(primaryTextColor);
  textStyle(NORMAL);
  textSize(smallFontSize - 1); // Smaller font for longer text
  
  // Calculate checkbox position on the left side of the text
  let checkboxX = width/2 - 180;
  let checkboxY = leaderboardSectionY + 40;
  let checkboxSize = 16;
  
  // Draw checkbox
  stroke('#3498db');
  strokeWeight(2);
  fill(255);
  rect(checkboxX, checkboxY, checkboxSize, checkboxSize, 3);
  
  // Draw check mark if checked
  if (privacyCheckboxChecked) {
    stroke('#4CAF50'); // Green check
    strokeWeight(3);
    line(checkboxX + 3, checkboxY + checkboxSize/2, checkboxX + 6, checkboxY + checkboxSize - 3);
    line(checkboxX + 6, checkboxY + checkboxSize - 3, checkboxX + checkboxSize - 2, checkboxY + 3);
  }
  noStroke();
  
  // Use LEFT alignment for the checkbox text to position it properly
  textAlign(LEFT);
  fill(primaryTextColor);
  
  // Split the text to avoid overlapping "privacy policy" text
  let beforeText = "I accept the ";
  let policyText = "privacy policy";
  let afterText = " and would like to register for the";
  
  // Calculate positions
  let textX = checkboxX + checkboxSize + 10;
  let textY = checkboxY + 12;
  
  // Draw first part of text
  text(beforeText, textX, textY);
  
  // Calculate position for privacy policy text
  let policyX = textX + textWidth(beforeText);
  
  // Draw privacy policy text in blue and bold
  fill('#3498db'); // Blue color for privacy policy text
  textStyle(BOLD);
  text(policyText, policyX, textY);
  
  // Calculate position for after text
  let afterX = policyX + textWidth(policyText);
  
  // Reset style and draw the remainder of the text
  textStyle(NORMAL);
  fill(primaryTextColor);
  text(afterText, afterX, textY);
  
  // Draw second line of text
  text("public leaderboard & get news about TripMerge launch and updates", textX, checkboxY + 27);
  
  // Reset text style and alignment
  textStyle(NORMAL);
  fill(primaryTextColor);
  textAlign(CENTER);
  
  // Email input box with improved interactive functionality
  fill('#ffffff');
  if (isEmailInputActive) {
    stroke('#c72a09'); // Red border when active
    strokeWeight(3);
  } else {
    stroke('#3498db');
    strokeWeight(3);
  }
  
  // Email input box - LARGER with mobile optimization
  let emailBoxX = width/2 - 200;
  let emailBoxY = leaderboardSectionY + 80;
  let emailBoxWidth = isMobileDevice() ? 450 : 400; // Wider on mobile
  let emailBoxHeight = isMobileDevice() ? 60 : 50;  // Taller on mobile
  
  // Add shadow for better visibility
  drawingContext.shadowBlur = 8;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.2)';
  
  rect(emailBoxX, emailBoxY, emailBoxWidth, emailBoxHeight, 8);
  drawingContext.shadowBlur = 0; // Reset shadow
  
  // Email placeholder or entered text
  noStroke();
  textAlign(LEFT);
  textSize(isMobileDevice() ? smallFontSize + 4 : smallFontSize + 2); // Larger text on mobile
  
  let textPadding = isMobileDevice() ? 20 : 15; // More padding on mobile
  let textVerticalPosition = isMobileDevice() ? emailBoxY + 35 : emailBoxY + 30;
  
  if (playerEmail === "") {
    fill('#999999');
    text("  your.email@example.com", emailBoxX + textPadding, textVerticalPosition);
  } else {
    fill('#333333');
    text("  " + playerEmail, emailBoxX + textPadding, textVerticalPosition);
    
    // Draw blinking cursor when input is active
    if (isEmailInputActive && frameCount % cursorBlinkRate < cursorBlinkRate/2) {
      let cursorX = emailBoxX + textPadding + 2 + textWidth("  " + playerEmail.substring(0, emailInputCursor));
      stroke('#333333');
      strokeWeight(2);
      line(cursorX, emailBoxY + (emailBoxHeight * 0.2), cursorX, emailBoxY + (emailBoxHeight * 0.8));
    }
  }
  
  // Submit button - Enhanced for mobile
  let submitBtnX = width/2;
  let submitBtnY = emailBoxY + 70;
  let submitBtnWidth = isMobileDevice() ? 300 : 250; // Wider on mobile
  let submitBtnHeight = isMobileDevice() ? 60 : 45;  // Taller on mobile
  let isSubmitHovering = mouseX >= submitBtnX - submitBtnWidth/2 && mouseX <= submitBtnX + submitBtnWidth/2 && 
                        mouseY >= submitBtnY && mouseY <= submitBtnY + submitBtnHeight;
  
  // Enhanced button styling
  if (isSubmitHovering && !submittingScore && !scoreSubmitted) {
    // Add glow effect on hover
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(199, 42, 9, 0.7)';
    fill('#a81e00'); // Darker red on hover
  } else {
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
    fill(highlightTextColor);
  }
  
  // Add border for better definition
  stroke(255);
  strokeWeight(isSubmitHovering ? 2 : 1);
  rect(submitBtnX - submitBtnWidth/2, submitBtnY, submitBtnWidth, submitBtnHeight, 8);
  drawingContext.shadowBlur = 0;  // Reset shadow
  
  // Button text with responsive sizing
  fill('#ffffff');  // White text for better contrast on red
  noStroke();
  textAlign(CENTER, CENTER);  // Center both horizontally and vertically
  textSize(isMobileDevice() ? (isSubmitHovering ? smallFontSize + 4 : smallFontSize + 3) : 
                             (isSubmitHovering ? smallFontSize + 2 : smallFontSize + 1));
  let buttonText = submittingScore ? "Submitting..." : (scoreSubmitted ? "Submitted!" : "SUBMIT");
  text(buttonText, submitBtnX, submitBtnY + submitBtnHeight/2);
  
  if (isSubmitHovering && !submittingScore && !scoreSubmitted) {
    cursor(HAND);
  }
  
  // Display submission message if any
  if (leaderboardMessage) {
    fill(scoreSubmitted ? '#4CAF50' : '#c72a09');
    textAlign(CENTER);
    textSize(smallFontSize);
    text(leaderboardMessage, width/2, submitBtnY + 60);
  }
}

// Add this function after drawModernButton to create a new standardized button function
function createTouchFriendlyButton(x, y, width, height, label, color, hoverColor, labelColor, hoverLabelColor, cornerRadius) {
  // Default values if not provided
  color = color || '#f5f7f8';
  hoverColor = hoverColor || '#c72a09';
  labelColor = labelColor || '#000000';
  hoverLabelColor = hoverLabelColor || '#ffffff';
  cornerRadius = cornerRadius || 10;
  
  // Calculate if mouse is hovering
  let isHovering = mouseX >= x && mouseX <= x + width && 
                   mouseY >= y && mouseY <= y + height;
  
  // Add shadow effect on hover
  if (isHovering) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(199, 42, 9, 0.5)';
  } else {
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
  }
  
  // Draw the button
  fill(isHovering ? hoverColor : color);
  stroke('#000000');
  strokeWeight(2);
  rect(x, y, width, height, cornerRadius);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Draw the label
  fill(isHovering ? hoverLabelColor : labelColor);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(isHovering ? bodyFontSize + 2 : bodyFontSize);
  text(label, x + width/2, y + height/2);
  
  // Change cursor on hover
  if (isHovering) {
    cursor(HAND);
  }
  
  // Return hover state for click detection
  return isHovering;
}

function touchStarted() {
  // Calculate the game viewport offset
  let gameWidth = 1000 * window.gameScale;
  let gameHeight = 600 * window.gameScale;
  let offsetX = (width - gameWidth) / 2;
  let offsetY = (height - gameHeight) / 2;
  
  // Handle decision point touches
  if (showingDecision && touches.length > 0) {
    let touch = touches[0];
    // Adjust touch coordinates to account for viewport offset
    let adjustedX = touch.x - offsetX;
    let adjustedY = touch.y - offsetY;
    
    // Calculate decision box dimensions
    let boxWidth = isMobileDevice() ? gameWidth * 0.9 : 500;
    let boxHeight = isMobileDevice() ? gameHeight * 0.5 : 300;
    let boxX = gameWidth/2 - boxWidth/2;
    let boxY = isMobileDevice() ? gameHeight * 0.2 : gameHeight/2 - boxHeight/2;
    
    // Calculate option positions
    let optionSpacing = isMobileDevice() ? 50 : 45;
    let optionStartY = boxY + (isMobileDevice() ? 100 : 110);
    
    for (let i = 0; i < currentDecision.options.length; i++) {
      let y = optionStartY + i * optionSpacing;
      let buttonWidth = isMobileDevice() ? boxWidth * 0.8 : 360;
      let buttonX = gameWidth/2 - buttonWidth/2;
      
      // Add extra touch area for better touch response
      let touchArea = 20 * window.gameScale;
      
      if (adjustedX >= buttonX - touchArea && 
          adjustedX <= buttonX + buttonWidth + touchArea && 
          adjustedY >= y - touchArea && 
          adjustedY <= y + 40 + touchArea) {
        console.log("Decision option touched:", i);  // Debug log
        makeDecision(i);
        return false;
      }
    }
  }
  
  // ... existing code for start, gameOver, and win screens ...
}