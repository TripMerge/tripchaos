// TripChaos by TripMerge
// A game to drive traffic to tripmerge.com travel planning tools

// Global variables
let gameState = 'start'; // 'start', 'playing', 'decision', 'gameOver', 'win'
let score = 0;
let budget = 100;
let satisfaction = 100;
let timeLeft = 60;
let greyAtmosphere = 0; // Track grey atmosphere effect (0 to 1)

// Font variables
let fredokaOne;
let fallbackFont = 'Arial';

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
window.submitScoreToLeaderboard = function() {
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
    
    // First try to submit to the leaderboard
    if (window.leaderboard && typeof window.leaderboard.submitScore === 'function') {
        try {
            window.leaderboard.submitScore(
                playerEmail,
                score,
                currentLevelNumber - 1,
                satisfaction,
                budget,
                achievement.title
            )
            .then(result => {
                submittingScore = false;
                
                if (result && result.success) {
                    scoreSubmitted = true;
                    leaderboardMessage = "Score submitted successfully!";
                    showLeaderboard = true;
                } else {
                    // If submission fails, fall back to local storage
                    fallbackToLocalStorage();
                }
            })
            .catch(error => {
                console.error("Error submitting to leaderboard:", error);
                // Fall back to local storage on error
                fallbackToLocalStorage();
            });
        } catch (error) {
            console.error("Error in score submission:", error);
            fallbackToLocalStorage();
        }
    } else {
        // If leaderboard API is not available, use local storage
        fallbackToLocalStorage();
    }
};

function fallbackToLocalStorage() {
    submittingScore = false;
    scoreSubmitted = true;
    leaderboardMessage = "Score saved locally!";
    
    // Store score in local storage
    try {
        const scores = JSON.parse(localStorage.getItem('tripchaos_scores') || '[]');
        scores.push({
            email: maskEmail(playerEmail),
            score: score,
            date: new Date().toISOString()
        });
        localStorage.setItem('tripchaos_scores', JSON.stringify(scores));
    } catch (error) {
        console.error("Error saving to local storage:", error);
    }
    
    // Load and show leaderboard
    loadLeaderboardData();
    showLeaderboard = true;
    window.showLeaderboard = true;
}

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

// Add this at the top of the file with other global variables
let privacyPolicyAccepted = false;

// Email validation and submission functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function maskEmail(email) {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
}

// Player variables
let player = {
  x: 100,
  y: 300,
  width: 45,  // Increased from 30
  height: 75, // Increased from 50
  speed: 5,
  jumpForce: 15,
  velocityY: 1,
  isJumping: false,
  isColliding: false,
  worldX: 100,
  facingRight: true,
  // Cloud effect properties
  cloudEffectCounter: 0,
  isSlowed: false
};

// Companion variables
let companion = {
  x: 70,
  y: 300,
  width: 25,
  height: 50, // Increased from 40 to 50 to make it taller
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

// Add this near the top with other constants
const COLORS = {
    background: '#FF69B4',  // Pink
    ground: '#4B0082',      // Deep Purple
    brick: '#FF1493',       // Deep Pink
    text: '#FFFFFF',        // White
    shadow: '#4B0082',      // Deep Purple
    button: {
        default: '#FF69B4', // Pink
        hover: '#32CD32'    // Green
    }
};

// Game elements for the legend
let gameElements = [
  // PERKS
  { name: "Coin", description: "Get extra budget", draw: (x, y) => {
    push();
    translate(x, y);
    scale(1.2); // Reduced from 1.8
    
    // Gold coin with black outline
    stroke(0);
    strokeWeight(2); // Consistent with other elements
    fill('#FFD700'); // Bright gold
    circle(0, 0, 20);
    
    // Dollar sign - lighter stroke and fill
    textAlign(CENTER, CENTER);
    textSize(10);
    textStyle(NORMAL);
    fill(0, 100);
    stroke(0, 100); // Semi-transparent black stroke
    strokeWeight(0.5); // Thinner stroke for dollar sign
    text("$", 0, 1);
    pop();
  }},
  
  { name: "Map", description: "Increase satisfaction", draw: (x, y) => {
    push();
    translate(x, y);
    scale(1.2); // Reduced from 1.8
    
    // Map background
    stroke(0);
    strokeWeight(2);
    fill('#4CAF50'); // Bright green like in the image
    rect(-12, -12, 24, 24, 4);
    
    // Map details
    stroke(255);
    strokeWeight(2);
    noFill();
    // Horizontal fold line
    line(-8, 0, 8, 0);
    // Vertical fold line
    line(0, -8, 0, 8);
    pop();
  }},
  
  { name: "Souvenir", description: "Bonus points", draw: (x, y) => {
    push();
    translate(x, y);
    scale(1.2); // Reduced from 1.8
    
    // Gift box
    stroke(0);
    strokeWeight(2);
    fill('#FF69B4'); // Hot pink like in the image
    rect(-12, -12, 24, 24, 4);
    
    // Ribbon
    stroke(0);
    strokeWeight(2);
    fill('#9370DB'); // Purple like in the image
    rect(-12, -4, 24, 8); // Horizontal ribbon
    rect(-4, -12, 8, 24); // Vertical ribbon
    
    // Bow center
    circle(0, 0, 8);
    pop();
  }},
  
  // MISHAPS
  { name: "Storm Cloud", description: "Slow down player", draw: (x, y) => {
    push();
    translate(x, y);
    scale(1.2); // Consistent scale with other elements
    
    // Main cloud body
    stroke(0);
    strokeWeight(2);
    fill('#9370DB'); // Purple cloud
    beginShape();
    vertex(-15, 0);
    bezierVertex(-15, -10, -5, -15, 0, -15);
    bezierVertex(5, -15, 15, -10, 15, 0);
    bezierVertex(15, 5, 10, 10, 0, 10);
    bezierVertex(-10, 10, -15, 5, -15, 0);
    endShape();
    
    // Angry eyes (oval shaped)
    fill(0);
    noStroke();
    ellipse(-6, -5, 4, 6); // Left eye
    ellipse(6, -5, 4, 6);  // Right eye
    
    // Angry eyebrows
    stroke(0);
    strokeWeight(2);
    line(-8, -9, -4, -7);  // Left eyebrow
    line(4, -7, 8, -9);    // Right eyebrow
    
    // Frowning mouth
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(0, 2, 12, 8, PI + QUARTER_PI, TWO_PI - QUARTER_PI);
    
    // Lightning bolt
    stroke('#FFD700'); // Yellow lightning
    strokeWeight(2.5);
    fill('#FFD700');
    beginShape();
    vertex(0, 10);    // Top of bolt
    vertex(-4, 15);   // Left point
    vertex(-1, 15);   // Inner left
    vertex(-5, 22);   // Bottom point
    vertex(2, 15);    // Inner right
    vertex(-1, 15);   // Back to center
    vertex(0, 10);    // Back to top
    endShape(CLOSE);
    
    pop();
  }},
  
  { name: "Unexpected Expenses", description: "Drain budget", draw: (x, y) => { 
    push();
    translate(x, y);
    scale(1.2); // Reduced from 1.8
    
    // Credit card shape
    stroke(0);
    strokeWeight(2);
    fill('#FF1493'); // Deep pink like in the image
    rect(-15, -10, 30, 20, 4);
    
    // Card details
    stroke(255);
    strokeWeight(1);
    line(-10, -2, 10, -2); // Magnetic stripe
    
    // Dollar sign
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("$", 0, 5);
    pop();
  }},
  
  { name: "Lost Luggage", description: "Lose satisfaction", draw: (x, y) => { 
    push();
    translate(x, y);
    scale(1.2); // Reduced from 1.8
    rotate(PI/12); // Slight tilt
    
    // Suitcase body
    stroke(0);
    strokeWeight(2);
    fill('#9370DB'); // Purple like in the image
    rect(-12, -12, 24, 24, 4);
    
    // Handle
    stroke(0);
    strokeWeight(2);
    noFill();
    arc(0, -12, 12, 8, PI, TWO_PI);
    
    // Question mark
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("?", 0, 0);
    pop();
  }}
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
    // Create canvas with fixed dimensions
    let canvas = createCanvas(1000, 600);
    canvas.parent('game-container');
    
    // Set initial scale
    window.gameScale = 1;
    
    // Initialize level length
    levelLength = 3000;
    
    // Set initial game state
    gameState = 'start';
    window.gameState = 'start';
  
  // Initialize game objects and settings
  resetGame();
  
  // Add window resize handler
  window.addEventListener('resize', windowResized);
    
    // Debug log
    console.log('Canvas created:', canvas);
    console.log('Game state:', gameState);

    // Initialize mobile email form
    const form = document.getElementById('mobile-email-form');
    form.addEventListener('click', (e) => {
        if (e.target === form) {
            form.classList.remove('active');
        }
    });
}

// Handle window resize events
function windowResized() {
  // Desktop keeps fixed size, no resize needed
  resizeCanvas(1000, 600);
  window.gameScale = 1;
}

// Update mobile detection to be more reliable
function isMobileDevice() {
    // More comprehensive mobile detection
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768 || 
           window.matchMedia("(max-width: 768px)").matches;
}

// Add orientation change handler
window.addEventListener('orientationchange', function() {
  // Small delay to ensure new dimensions are available
  setTimeout(windowResized, 100);
});

// Reset game state
function resetGame() {
    // Set initial game state
    gameState = 'start';
    window.gameState = 'start';
    
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
    
    // Reset game elements
  perks = [];
  mishaps = [];
    platforms = [];
    
    // Reset UI state
    showLeaderboard = false;
    showSharePopup = false;
    isEmailInputActive = false;
    playerEmail = '';
    
    // Generate initial level
    generateLevel();
}

// Generate a complete level
function generateLevel() {
    console.log("Generating level:", currentLevelNumber);
    
    // Initialize platforms array if empty
    if (platforms.length === 0) {
  platforms.push({
    x: 0,
    y: 400,
    width: 200,
    height: 20,
    theme: "beach"
  });
    }
    
    // Keep the first platform and clear the rest
  let firstPlatform = platforms[0];
  platforms = [firstPlatform];
  perks = [];
  mishaps = [];
  
    let lastPlatformX = firstPlatform.x + firstPlatform.width;
    let lastPlatformY = firstPlatform.y;
  
  // Adjust probabilities based on level
    let perkChance = 0.4 - (currentLevelNumber - 1) * 0.05;
    let mishapChance = 0.15 + (currentLevelNumber - 1) * 0.08;
  
  // Adjust perk type probabilities based on level
    let coinChance = 0.4 - (currentLevelNumber - 1) * 0.1;
  let mapChance = 0.3 - (currentLevelNumber - 1) * 0.05;
  
  // Height variation settings
    let baseHeightMin = 250;
    let baseHeightMax = 400;
    let heightTrend = 0;
  
  while (lastPlatformX < levelLength - 200) {
        // Platform width decreases with each level
        let minWidth = Math.max(90 - (currentLevelNumber - 1) * 15, 50);
        let maxWidth = Math.max(150 - (currentLevelNumber - 1) * 20, 80);
        
        let platformWidth = random(minWidth, maxWidth);
    let platformX = lastPlatformX + random(100, 200);
    
    // Calculate new height with more variation
        let heightVariation = 80 + (currentLevelNumber - 1) * 30;
    
        // Update height trend
    heightTrend += random(-30, 30);
    heightTrend = constrain(heightTrend, -50, 50);
    
    // Calculate platform Y with trend and variation
    let platformY = constrain(
      lastPlatformY + heightTrend + random(-heightVariation, heightVariation),
      baseHeightMin,
      baseHeightMax
    );
    
        // Create platform
      platforms.push({
        x: platformX,
        y: platformY,
        width: platformWidth,
        height: 20,
            theme: "beach"
        });
        
        // Generate perks on platforms
      if (random() < perkChance) {
          let perkType;
          let typeRand = random();
          
            if (typeRand < coinChance) {
                perkType = 'coin';
            } else if (typeRand < coinChance + mapChance) {
                perkType = 'map';
          } else {
                perkType = 'star';
            }
            
      perks.push({
        x: platformX + platformWidth/2 - 10,
        y: platformY - 30,
            width: 20,
            height: 20,
                type: perkType,
                isStatic: true
          });
      }
      
        lastPlatformX = platformX + platformWidth;
      lastPlatformY = platformY;
    }

    // Initialize level end marker at the end of the level
  levelEndMarker = {
      x: levelLength - 100,
      y: lastPlatformY - 100,
      width: 60,
      height: 60
    };
  }
  
// Main draw function
function draw() {
    // Reset cursor to default at the start of each frame
    cursor(ARROW);

    // Draw appropriate screen based on game state
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

    // Draw privacy policy popup if active (this should be drawn last to appear on top)
    if (showPrivacyPolicy) {
        // Draw semi-transparent overlay to darken the background
        push();
        fill(0, 0, 0, 200);
        noStroke();
        rect(0, 0, width, height);
        pop();
        
        // Draw the popup
        drawPrivacyPolicyPopup();
    }

    // Only show hover effects when privacy policy is not open
    if (!showPrivacyPolicy && (gameState === 'gameOver' || gameState === 'win')) {
        let restartButtonX = width/2;
        let restartButtonY = height/2 + 100;
        let buttonWidth = 200;
        let buttonHeight = 60;
        
        if (mouseX > restartButtonX - buttonWidth/2 && 
            mouseX < restartButtonX + buttonWidth/2 && 
            mouseY > restartButtonY - buttonHeight/2 && 
            mouseY < restartButtonY + buttonHeight/2) {
            cursor(HAND);
        }

        let privacyLinkY = height * 0.9;
        if (mouseX >= width/2 - 100 && mouseX <= width/2 + 100 && 
            mouseY >= privacyLinkY - 15 && mouseY <= privacyLinkY + 15) {
            cursor(HAND);
        }
    }
}

// Draw the start screen with improved layout
function drawStartScreen() {
    // Background
    background('#FF69B4');
    
    // Handle leaderboard view if active
    if (showLeaderboard) {
        drawLeaderboardScreen();
        return;
    }
    
    // Draw stars first (so they appear behind other elements)
    for (let i = 0; i < 20; i++) {
        drawStar(random(width), random(height * 0.4), random(5, 15));
    }
    
    // Draw ground first (so palm trees appear on top)
    push();
    fill('#4B0082');  // Deep purple ground
    noStroke();
    rect(0, height * 0.75, width, height * 0.25);
    
    // Grid lines
    stroke('#FF1493');  // Deep pink lines
    strokeWeight(1);
    for(let x = 0; x < width; x += 50) {
        line(x, height * 0.75, x, height);
    }
    for(let y = height * 0.75; y < height; y += 25) {
        line(0, y, width, y);
    }
    
    // Brick pattern at the top of the ground
    noStroke();
    fill('#FF1493');  // Deep pink bricks
    for (let x = 0; x < width; x += 50) {
        rect(x, height * 0.75, 45, 20);
    }
    pop();
    
    // Draw palm trees
    drawPalmTree(width * 0.1, height * 0.8, 1);
    drawPalmTree(width * 0.9, height * 0.8, 1);
    drawPalmTree(width * 0.2, height * 0.85, 0.8);
    drawPalmTree(width * 0.8, height * 0.85, 0.8);

    if (typeof startScreenStep === 'undefined') {
        startScreenStep = 1;
    }
    
    if (startScreenStep === 1) {
        // Title with retro effect
        push();
        textFont('Fredoka One');  // Using Fredoka One font
        
        // Shadow effect
        fill('#4B0082');  // Deep purple shadow
  textStyle(BOLD);
        textSize(titleFontSize * 2.2 * window.gameScale);
  textAlign(CENTER, CENTER);
        text("TRIPCHAOS!", width/2 + 4, height/6 + 64);
        
        // Main text
        fill('#FFFFFF');  // White main text
        text("TRIPCHAOS!", width/2, height/6 + 60);
        pop();
        
        // Welcome text with enhanced readability
        push();
        textFont('Inter');  // Back to Inter font for better readability
  textAlign(CENTER, CENTER);
  
        // Add text shadow for better readability
        textStyle(BOLD);
        textSize(bodyFontSize * 1.3 * window.gameScale);
        
        // First line
        fill('#4B0082');  // Shadow color
        text("Navigate through 🏖️ beaches, 🌆 cities, and 🏔️ adventures!", width/2 + 2, height/2 - 40 + 2);
        fill('#FFFFFF');  // Text color
        text("Navigate through 🏖️ beaches, 🌆 cities, and 🏔️ adventures!", width/2, height/2 - 40);
        
        // Second line
        textSize(bodyFontSize * 1.2 * window.gameScale);
        fill('#4B0082');  // Shadow color
        text("Manage your 💰 budget, 😊 satisfaction, and ⏰ time", width/2 + 2, height/2 + 2);
        fill('#FFFFFF');  // Text color
        text("Manage your 💰 budget, 😊 satisfaction, and ⏰ time", width/2, height/2);
        
        // Third line
        textSize(bodyFontSize * 1.1 * window.gameScale);
        fill('#4B0082');  // Shadow color
        text("Collect ⭐ items, avoid ☁️ mishaps, and 🎯 succeed!", width/2 + 2, height/2 + 40 + 2);
        fill('#FFFFFF');  // Text color
        text("Collect ⭐ items, avoid ☁️ mishaps, and 🎯 succeed!", width/2, height/2 + 40);
        pop();
        
        // Next button with retro style
        let nextBtnX = width/2 - (150 * window.gameScale);
        let nextBtnY = height - (120 * window.gameScale);
        let nextBtnW = 300 * window.gameScale;
        let nextBtnH = 60 * window.gameScale;
        
        let isNextHovering = mouseX >= nextBtnX && mouseX <= nextBtnX + nextBtnW && 
                            mouseY >= nextBtnY && mouseY <= nextBtnY + nextBtnH;
        
        // Button with consistent style
        push();
        strokeWeight(4);
        stroke('#4B0082');  // Deep purple outline
        fill(isNextHovering ? '#32CD32' : '#FF69B4');
        rect(nextBtnX, nextBtnY, nextBtnW, nextBtnH, 15);
  
  // Button text
        textFont('Fredoka One');
        fill('#FFFFFF');
        textSize(30 * window.gameScale);
  textAlign(CENTER, CENTER);
        text("NEXT →", width/2, nextBtnY + nextBtnH/2);
        pop();
  
        if (isNextHovering) {
    cursor(HAND);
            if (mouseIsPressed) {
                startScreenStep = 2;
                mouseIsPressed = false;
            }
  } else {
    cursor(ARROW);
  }
  
    } else {
        // Step 2: Game Elements and Start Button
        
        // Header
        push();
        textFont('Fredoka One');
        textStyle(BOLD);
        textSize(bodyFontSize * 1.5 * window.gameScale);
        textAlign(CENTER, CENTER);
        
        // Header shadow
        fill('#4B0082');
        text("GAME ELEMENTS", width/2 + 2, height/8 + 2);
        // Header text
        fill('#FFFFFF');
        text("GAME ELEMENTS", width/2, height/8);
        pop();
        
        // Game elements layout - moved up
        let tableX = width/2 - 350;
        let tableY = height/5;  // Moved up from height/4
        
        // Draw section containers with thick outlines
        push();
        strokeWeight(4);
        stroke('#4B0082');  // Deep purple outline
        fill('#FF69B4');    // Pink fill
        rect(tableX - 10, tableY - 10, 340, 250, 20);
        rect(tableX + 360, tableY - 10, 340, 250, 20);
        pop();
        
        // Headers with retro style
        push();
        textFont('Fredoka One');
        textStyle(BOLD);
        textSize(bodyFontSize * 1.2 * window.gameScale);
  textAlign(CENTER);
        
        // PERKS header
        fill('#FFFFFF');
        text("✨ PERKS ✨", tableX + 160, tableY + 20);
        
        // MISHAPS header
        text("☁️ MISHAPS ☁️", tableX + 530, tableY + 20);
        pop();
        
        // Elements with improved spacing
        push();
        textFont('Inter');
        textAlign(LEFT);
        textSize(smallFontSize * window.gameScale);
        
        for (let i = 0; i < 3; i++) {
            let yPos = tableY + 60 + i * 60;  // Reduced spacing from 70 to 60
            let perk = gameElements[i];
            let mishap = gameElements[i+3];
            
            // Draw perk elements
            push();
            translate(tableX + 30, yPos + 20);  // Adjusted Y position
            scale(1.2);  // Make elements bigger
            perk.draw(0, 0);  // Use the draw function directly
            pop();
            
            // Perk text
            fill('#FFFFFF');
            text(perk.name + ": " + perk.description, tableX + 70, yPos + 25);  // Adjusted Y position
            
            // Draw mishap elements
            push();
            translate(tableX + 390, yPos + 20);  // Adjusted Y position
            scale(1.2);  // Make elements bigger
            mishap.draw(0, 0);  // Use the draw function directly
            pop();
            
            // Mishap text
            fill('#FFFFFF');
            text(mishap.name + ": " + mishap.description, tableX + 430, yPos + 25);  // Adjusted Y position
        }
        pop();
        
        // Back and Start buttons
        let backBtnX = width/4 - (100 * window.gameScale);
        let backBtnY = height - (120 * window.gameScale);
        let backBtnW = 200 * window.gameScale;
        let backBtnH = 60 * window.gameScale;
        
        let startBtnX = width * 3/4 - (100 * window.gameScale);
        let startBtnY = height - (120 * window.gameScale);
        let startBtnW = 200 * window.gameScale;
        let startBtnH = 60 * window.gameScale;
        
        let isBackHovering = mouseX >= backBtnX && mouseX <= backBtnX + backBtnW && 
                            mouseY >= backBtnY && mouseY <= backBtnY + backBtnH;
        
        let isStartHovering = mouseX >= startBtnX && mouseX <= startBtnX + startBtnW && 
                             mouseY >= startBtnY && mouseY <= startBtnY + startBtnH;
        
        // Draw buttons
        push();
        strokeWeight(4);
        stroke('#4B0082');  // Deep purple outline
        textFont('Fredoka One');
        textAlign(CENTER, CENTER);
        textSize(25 * window.gameScale);
        
        // Back button
        fill(isBackHovering ? '#32CD32' : '#FF69B4');
        rect(backBtnX, backBtnY, backBtnW, backBtnH, 15);
        fill('#FFFFFF');
        text("← BACK", backBtnX + backBtnW/2, backBtnY + backBtnH/2);
        
        // Start button
        fill(isStartHovering ? '#32CD32' : '#FF69B4');
        rect(startBtnX, startBtnY, startBtnW, startBtnH, 15);
        fill('#FFFFFF');
        text("START!", startBtnX + startBtnW/2, startBtnY + startBtnH/2);
        pop();
        
        // Handle button clicks
        if (isBackHovering && mouseIsPressed) {
            startScreenStep = 1;
            mouseIsPressed = false;
        }
        
        if (isStartHovering && mouseIsPressed) {
            resetGame();
            gameState = 'playing';
            window.gameState = 'playing';
            currentLevelNumber = 1;
            if (window.currentLevelNumber !== undefined) {
                window.currentLevelNumber = 1;
            }
            mouseIsPressed = false;
        }
        
        // Update cursor
        if (isBackHovering || isStartHovering) {
            cursor(HAND);
        } else {
            cursor(ARROW);
        }
    }
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
    mishap.draw(0, 0);  // Use the draw function directly
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
    // Make sure player is slowed only horizontally
    if (!player.isSlowed) {
        player.speed = 3.5; // Changed from 2.5 to 3.5 for less severe slowdown
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
  
  // Apply gravity to player - keep jump force constant regardless of cloud effect
  player.velocityY += 0.7;
  player.y += player.velocityY;

  // Apply CONTROLLED movement based on keyboard input
  let moveSpeed = player.speed; // Use the current speed value
  
  if (keyIsDown(RIGHT_ARROW)) {
    // Add a small boost when moving in the air during cloud effect
    if (player.isJumping && player.isSlowed) {
        player.worldX += moveSpeed * 1.2; // 20% boost when jumping during cloud effect
    } else {
    player.worldX += moveSpeed;
    }
    player.facingRight = true;
  }
  if (keyIsDown(LEFT_ARROW)) {
    // Only allow moving left if not at the start
    if (player.worldX > 100) {
        // Add a small boost when moving in the air during cloud effect
        if (player.isJumping && player.isSlowed) {
            player.worldX -= moveSpeed * 1.2; // 20% boost when jumping during cloud effect
        } else {
      player.worldX -= moveSpeed;
        }
      player.facingRight = false;
    }
  }
  if (keyIsDown(UP_ARROW) && !player.isJumping) {
    player.velocityY = -player.jumpForce; // Always use full jump force
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
        player.speed = 3.5; // Match the new speed
        player.isSlowed = true;
        player.cloudEffectCounter = 120; // Changed from 180 to 120 (2 seconds instead of 3)
        greyAtmosphere = 1;
        effectNotifications.push({
          type: "Speed",
          value: "SLOWED DOWN BY CLOUD!",
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
  if (!levelEndMarker) return;
  
  push();
  // Draw pole
  stroke(100);
  strokeWeight(4);
  line(levelEndMarker.x, levelEndMarker.y + levelEndMarker.height, 
       levelEndMarker.x, levelEndMarker.y);
  
  // Draw flag
  fill('#FF4444');
  noStroke();
  beginShape();
  vertex(levelEndMarker.x, levelEndMarker.y);
  vertex(levelEndMarker.x + levelEndMarker.width, levelEndMarker.y + levelEndMarker.height/2);
  vertex(levelEndMarker.x, levelEndMarker.y + levelEndMarker.height);
  endShape(CLOSE);
  pop();
}

// Simple function to show message when slowed
function drawSlowdownMessage() {
  if (player.cloudEffectCounter > 0) {
    push();
    textAlign(CENTER, CENTER);
    textSize(24);
    fill('#9370DB'); // Match the purple cloud color
    text("SLOWED DOWN BECAUSE OF THE RAIN!", width/2, 50);
    pop();
  }
}

// Draw beach theme
function drawBeachTheme() {
  // Beautiful gradient with pink accents - full screen
  noStroke();
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c;
    if (y < height * 0.4) {  // Upper sky - orange to pink (40% of screen)
      let inter2 = map(y, 0, height * 0.4, 0, 1);
      c = lerpColor(
        color('#FFA07A'),  // Light salmon
        color('#FFB6C1'),  // Light pink
        inter2
      );
    } else if (y < height * 0.8) {  // Middle sky - pink gradient (next 40% of screen)
      let inter2 = map(y, height * 0.4, height * 0.8, 0, 1);
      c = lerpColor(
        color('#FFB6C1'),  // Light pink
        color('#FF69B4'),  // Hot pink
        inter2
      );
    } else {  // Lower sky - pink to sea green (last 20% of screen)
      let inter2 = map(y, height * 0.8, height, 0, 1);
      c = lerpColor(
        color('#FF69B4'),  // Hot pink
        color('#40E0D0'),  // Turquoise
        inter2
      );
    }
    fill(c);
    rect(0, y, width, 1);
  }
  
  // Draw sun
  push();
  let sunX = sunPosition.x - cameraOffset * 0.2;
  let sunY = height * 0.2;
  noStroke();
  fill('#FFD700');  // Golden yellow sun
  circle(sunX, sunY, 80);
  pop();
  
  // Draw clouds in the background
  for (let cloud of clouds) {
    let cloudX = cloud.x - cameraOffset * 0.5;
    drawDetailedCloud(cloudX, cloud.y, cloud.width);
  }
  
  // Draw ocean
  drawDetailedOcean();
  
  // Draw beach area behind palm trees
  drawBeachArea();
  
  // Draw palm trees
  drawPalmTrees();
}

function drawBeachArea() {
  push();
  // Sandy beach area
  noStroke();
  fill('#F0E68C');  // Khaki sand color
  
  // Draw beach with a slight curve
  beginShape();
  vertex(0, oceanHeight);
  vertex(width, oceanHeight);
  vertex(width, oceanHeight - 30);
  
  // Add some wave to the beach
  for (let x = width; x >= 0; x -= 50) {
    let yOffset = sin(x * 0.02) * 10;
    vertex(x, oceanHeight - 40 + yOffset);
  }
  
  vertex(0, oceanHeight - 30);
  endShape(CLOSE);
  
  // Add some texture to the sand
  stroke('#DEB887');  // Burlywood - slightly darker sand
  strokeWeight(1);
  for (let x = 0; x < width; x += 30) {
    let y = oceanHeight - 20 + sin(x * 0.05) * 5;
    line(x, y, x + 15, y - 5);
  }
  pop();
}

function drawDetailedOcean() {
  push();
  // Ocean base
  noStroke();
  fill('#40E0D0');  // Turquoise base
  rect(0, oceanHeight, width, height - oceanHeight);
  
  // Create layered waves
  let waveColors = [
    color('#40E0D0'),  // Turquoise
    color('#48D1CC'),  // Medium turquoise
    color('#00CED1'),  // Dark turquoise
    color('#5F9EA0')   // Cadet blue
  ];
  
  // Draw multiple wave layers
  for (let layer = 0; layer < 4; layer++) {
    fill(waveColors[layer]);
    noStroke();
    beginShape();
    vertex(0, height);
    vertex(0, oceanHeight + layer * 15);
    
    // Create wave pattern
    for (let x = 0; x <= width + 50; x += 50) {
      let xOffset = x + frameCount * (1 + layer * 0.5);
      let yOffset = sin(xOffset * 0.02) * (10 + layer * 5);
      let y = oceanHeight + layer * 15 + yOffset;
      vertex(x, y);
    }
    
    vertex(width, height);
    endShape(CLOSE);
  }
  
  // Add decorative wave symbols
  stroke(255, 255, 255, 180);
  noFill();
  strokeWeight(2);
  
  // Draw wave symbols at different depths
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < width; col += 100) {
      let x = col + (row * 50) + sin(frameCount * 0.02) * 10;
      let y = oceanHeight + 40 + (row * 30) + cos(frameCount * 0.02 + col) * 5;
      
      // Draw stylized wave symbol
      push();
      translate(x, y);
      scale(0.8);
      
      // Curved wave symbol
      beginShape();
      vertex(-15, 0);
      bezierVertex(-10, -10, 10, -10, 15, 0);
      endShape();
      
      // Second curve below
      translate(0, 5);
      beginShape();
      vertex(-10, 0);
      bezierVertex(-5, -7, 5, -7, 10, 0);
      endShape();
  pop();
    }
  }
  
  // Add foam/highlights at wave peaks
  stroke(255, 255, 255, 150);
  strokeWeight(3);
  noFill();
  for (let layer = 0; layer < 3; layer++) {
    beginShape();
    for (let x = 0; x <= width + 50; x += 50) {
      let xOffset = x + frameCount * (1 + layer * 0.5);
      let yOffset = sin(xOffset * 0.02) * (10 + layer * 5);
      let y = oceanHeight + layer * 15 + yOffset;
      vertex(x, y);
    }
    endShape();
  }
  
  // Add sparkles on water
  fill(255, 255, 255, 100);
  noStroke();
  for (let i = 0; i < 30; i++) {
    let x = ((frameCount * 2 + i * 100) % width);
    let y = oceanHeight + 20 + sin(frameCount * 0.05 + i) * 10;
    circle(x, y, 3);
  }
  
  // Add small curved wave details
  stroke(255, 255, 255, 100);
  strokeWeight(1.5);
  for (let x = 0; x < width; x += 40) {
    let yBase = oceanHeight + 60 + sin(x * 0.1 + frameCount * 0.02) * 15;
    // Draw small curved wave
    noFill();
    beginShape();
    curveVertex(x - 10, yBase);
    curveVertex(x, yBase - 5);
    curveVertex(x + 10, yBase);
    curveVertex(x + 20, yBase - 3);
    endShape();
  }
  pop();
}

function drawDetailedCloud(x, y, width) {
  push();
  noStroke();
  fill(255, 255, 255);
  ellipse(x, y, width * 0.8, width * 0.5);
  ellipse(x - width * 0.2, y, width * 0.6, width * 0.4);
  ellipse(x + width * 0.2, y, width * 0.6, width * 0.4);
  pop();
}

function drawPalmTrees() {
  push();
  for (let i = 0; i < 5; i++) {
    let x = ((i * 400) - cameraOffset * 0.7) % levelLength;
    let y = oceanHeight;
    
    // Draw palm tree using the main page style
    drawPalmTree(x, y, 1.2);
  }
  pop();
}

function drawPalmTree(x, y, treeScale) {
    push();
    let trunkHeight = 120 * treeScale;
    let trunkWidth = 20 * treeScale;
    let segments = 5;
    let segmentHeight = trunkHeight / segments;
    
    // Draw trunk segments with darker color
    fill('#8B4513');  // Saddle brown for trunk
    stroke('#4B0082');
    strokeWeight(3);
    
    // Draw trunk segments
    for (let i = 0; i < segments; i++) {
        rect(x - trunkWidth/2, 
             y - trunkHeight + (i * segmentHeight), 
             trunkWidth, 
             segmentHeight);
    }
    
    // Larger, more visible leaves
    fill('#98FB98');  // Pale green for leaves
    stroke('#228B22');  // Forest green for leaf outline
    strokeWeight(3);
    
    // Draw leaves in a symmetrical fan pattern
    let numLeaves = 7;
    let startAngle = -PI * 0.8;
    let angleStep = (PI * 1.6) / (numLeaves - 1);
    
    for (let i = 0; i < numLeaves; i++) {
        let angle = startAngle + (i * angleStep);
        push();
        translate(x, y - trunkHeight);
        rotate(angle);
        
        // Draw a larger curved triangular leaf
        beginShape();
        vertex(0, 0);
        bezierVertex(
            30 * treeScale, -30 * treeScale,
            60 * treeScale, -45 * treeScale,
            75 * treeScale, -22.5 * treeScale
        );
        bezierVertex(
            60 * treeScale, -7.5 * treeScale,
            30 * treeScale, 0,
            0, 0
        );
        endShape(CLOSE);
        pop();
    }
    pop();
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

function drawStars() {
    // Draw stars in the background
    fill(255);
    noStroke();
    for (let i = 0; i < 100; i++) {
        let x = random(width);
        let y = random(height * 0.7);
        let size = random(1, 3);
        ellipse(x, y, size, size);
    }
}

function drawStar(x, y, size) {
    push();
    fill(255);
    noStroke();
    beginShape();
    for (let i = 0; i < 5; i++) {
        let angle = TWO_PI * i / 5 - PI / 2;
        let px = x + cos(angle) * size;
        let py = y + sin(angle) * size;
        vertex(px, py);
        angle += TWO_PI / 10;
        px = x + cos(angle) * (size/2);
        py = y + sin(angle) * (size/2);
        vertex(px, py);
    }
    endShape(CLOSE);
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
  rect(0, 15, player.width, player.height - 15, 7); // Adjusted for new size
  
  // Head
  ellipse(player.width/2, 15, player.width * 0.8, player.width * 0.8); // Adjusted for new size
  
  // Backpack
  fill(139, 69, 19);
  rect(player.facingRight ? -7 : player.width - 7, 20, 15, 35, 4); // Adjusted for new size
  
  // Camera around neck
  fill(50);
  rect(player.width/2 - 12, 20, 24, 15, 3); // Adjusted for new size
  
  // Face
  fill(0);
  // Eyes
  if (player.facingRight) {
    ellipse(player.width/2 + 7, 12, 6, 6); // Adjusted for new size
    ellipse(player.width/2 + 18, 12, 6, 6); // Adjusted for new size
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
  rect(0, 0, companion.width, companion.height, 5); // Changed y position to 0 to touch ground
  
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
  scale(2.0); // Larger scale for gameplay visibility
  
  if (perk.type === 'coin') {
    // Gold coin with black outline
    stroke(0);
    strokeWeight(2);
    fill('#FFD700'); // Bright gold
    circle(0, 0, 20);
    
    // Dollar sign - lighter stroke and fill
    textAlign(CENTER, CENTER);
    textSize(10);
    textStyle(NORMAL);
    fill(0, 100);
    stroke(0, 100);
    strokeWeight(0.5);
    text("$", 0, 1);
  } 
  else if (perk.type === 'map') {
    // Map background
    stroke(0);
    strokeWeight(2);
    fill('#4CAF50'); // Bright green
    rect(-12, -12, 24, 24, 4);
    
    // Map details
    stroke(255);
    strokeWeight(2);
    noFill();
    // Horizontal fold line
    line(-8, 0, 8, 0);
    // Vertical fold line
    line(0, -8, 0, 8);
  }
  else if (perk.type === 'souvenir') {
    // Gift box
    stroke(0);
    strokeWeight(2);
    fill('#FF69B4'); // Hot pink
    rect(-12, -12, 24, 24, 4);
    
    // Ribbon
    stroke(0);
    strokeWeight(2);
    fill('#9370DB'); // Purple
    rect(-12, -4, 24, 8); // Horizontal ribbon
    rect(-4, -12, 8, 24); // Vertical ribbon
    
    // Bow center
    circle(0, 0, 8);
  }
  pop();
}

// Draw mishaps (larger and more detailed)
function drawMishap(mishap) {
  push();
  translate(mishap.x + mishap.width/2, mishap.y + mishap.height/2);
  scale(2.0); // Larger scale for gameplay visibility
  
  if (mishap.type === 'cloud') {
    // Main cloud body
    stroke(0);
    strokeWeight(2);
    fill('#9370DB'); // Purple cloud
    beginShape();
    vertex(-15, 0);
    bezierVertex(-15, -10, -5, -15, 0, -15);
    bezierVertex(5, -15, 15, -10, 15, 0);
    bezierVertex(15, 5, 10, 10, 0, 10);
    bezierVertex(-10, 10, -15, 5, -15, 0);
    endShape();
    
    // Angry eyes (oval shaped)
    fill(0);
    noStroke();
    ellipse(-6, -5, 4, 6); // Left eye
    ellipse(6, -5, 4, 6);  // Right eye
    
    // Angry eyebrows
    stroke(0);
    strokeWeight(2);
    line(-8, -9, -4, -7);  // Left eyebrow
    line(4, -7, 8, -9);    // Right eyebrow
    
    // Frowning mouth
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(0, 2, 12, 8, PI + QUARTER_PI, TWO_PI - QUARTER_PI);
    
    // Lightning bolt
    stroke('#FFD700'); // Yellow lightning
    strokeWeight(2.5);
    fill('#FFD700');
    beginShape();
    vertex(0, 10);    // Top of bolt
    vertex(-4, 15);   // Left point
    vertex(-1, 15);   // Inner left
    vertex(-5, 22);   // Bottom point
    vertex(2, 15);    // Inner right
    vertex(-1, 15);   // Back to center
    vertex(0, 10);    // Back to top
    endShape(CLOSE);
  }
  else if (mishap.type === 'dollar') {
    // Credit card shape
    stroke(0);
    strokeWeight(2);
    fill('#FF1493'); // Deep pink
    rect(-15, -10, 30, 20, 4);
    
    // Card details
    stroke(255);
    strokeWeight(1);
    line(-10, -2, 10, -2); // Magnetic stripe
    
    // Dollar sign
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("$", 0, 5);
  } 
  else if (mishap.type === 'suitcase') {
    push();
    rotate(PI/12); // Slight tilt like in game elements
    
    // Suitcase body
    stroke(0);
    strokeWeight(2);
    fill('#9370DB'); // Purple
    rect(-12, -12, 24, 24, 4);
    
    // Handle
    stroke(0);
    strokeWeight(2);
    noFill();
    arc(0, -12, 12, 8, PI, TWO_PI);
    
    // Question mark
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("?", 0, 0);
    pop();
  }
  pop();
}

// Draw decision UI with improved readability
function drawDecisionUI() {
  push();  // Save the current drawing state
  
  // Semi-transparent overlay
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);
  
  // Box dimensions and position - adjust for mobile
  let boxWidth = isMobileDevice() ? width * 0.95 : 500;
  let boxHeight = isMobileDevice() ? height * 0.7 : 300;
  let boxX = width/2 - boxWidth/2;
  let boxY = isMobileDevice() ? height * 0.15 : height/2 - boxHeight/2;
  
  // Decision box with shadow
  fill('#f5f7f8');
  stroke('#000000');
  strokeWeight(2);
  rect(boxX, boxY, boxWidth, boxHeight, 10);
  
  // Title bar
  fill(highlightTextColor);
  noStroke();
  rect(boxX, boxY, boxWidth, isMobileDevice() ? 60 : 40, 10, 10, 0, 0);
  
  // Decision title
  fill('#ffffff');
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(isMobileDevice() ? 24 : 24);
  text("DECISION POINT", width/2, boxY + (isMobileDevice() ? 30 : 20));
  
  // Question
  fill(primaryTextColor);
  textStyle(BOLD);
  textSize(isMobileDevice() ? 20 : 22);
  textAlign(CENTER, CENTER);
  
  // Calculate question position and height
  let questionY = boxY + (isMobileDevice() ? 100 : 90);
  let questionHeight = 60;
  text(currentDecision.question, boxX + boxWidth/2, questionY, boxWidth - 40);
  
  // Options
  let optionSpacing = isMobileDevice() ? 80 : 60;
  let optionStartY = questionY + questionHeight + (isMobileDevice() ? 20 : 10);
  
  for (let i = 0; i < currentDecision.options.length; i++) {
    let y = optionStartY + i * optionSpacing;
    let buttonWidth = isMobileDevice() ? boxWidth * 0.9 : boxWidth * 0.8;
    let buttonHeight = isMobileDevice() ? 60 : 40;
    let buttonX = width/2 - buttonWidth/2;
    
    let isHovering = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && 
                     mouseY >= y && mouseY <= y + buttonHeight;
    
    // Option button with clear hit area
    fill(isHovering ? '#c72a09' : '#f5f7f8');
    stroke('#000000');
    strokeWeight(2);
    rect(buttonX, y, buttonWidth, buttonHeight, 10);
    
    // Option text
    noStroke();
    fill(isHovering ? '#ffffff' : '#000000');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(isMobileDevice() ? 18 : 18);
    text(currentDecision.options[i].text, buttonX + buttonWidth/2, y + buttonHeight/2);
    
    // Store button coordinates for touch detection
    currentDecision.options[i].buttonBounds = {
      x: buttonX,
      y: y,
      width: buttonWidth,
      height: buttonHeight
    };
  }
  
  // Instruction text
  fill(primaryTextColor);
  textAlign(CENTER);
  textSize(isMobileDevice() ? 16 : 14);
  text("Tap an option to choose", width/2, boxY + boxHeight - 20);
  
  pop();
}

function makeDecision(optionIndex) {
  if (!currentDecision || !currentDecision.options[optionIndex]) return;
  
  // Prevent multiple selections
  if (!showingDecision) return;
  
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
  
  // Count how many changes we'll show
  let changes = 0;
  if (budgetChange !== 0) changes++;
  if (satisfactionChange !== 0) changes++;
  if (timeChange !== 0) changes++;
  
  // Calculate starting Y position
  let startY = height/2 - (changes - 1) * 25;
  let currentY = startY;
  
  // Create notifications
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
  
  // Resume game immediately
  showingDecision = false;
  currentDecision = null;
  decisionTimer = 0;
  
  // Clear lingering mishaps
  mishaps = mishaps.filter(mishap => mishap.isStatic);
}

// Single touchStarted function that handles all touch events
function touchStarted() {
    // Handle privacy policy link click first
    if ((gameState === 'gameOver' || gameState === 'win') && touches.length > 0) {
        let touch = touches[0];
        const privacyLinkY = height * 0.9;
        
        // Make the click area larger for mobile
        const clickAreaWidth = isMobileDevice() ? 300 : 100;  // Increased width for mobile
        const clickAreaHeight = isMobileDevice() ? 50 : 15;   // Increased height for mobile
        
        if (touch.x >= width/2 - clickAreaWidth/2 && 
            touch.x <= width/2 + clickAreaWidth/2 && 
            touch.y >= privacyLinkY - clickAreaHeight/2 && 
            touch.y <= privacyLinkY + clickAreaHeight/2) {
            showPrivacyPolicy = true;
            return false;
        }
    }
    
    // Handle email input touch
    if (gameState === 'gameOver' && isEmailInputActive) {
        const input = document.querySelector('.game-email-input');
        if (input) {
            // Get the input's position and dimensions
            const rect = input.getBoundingClientRect();
            
            // Check if touch is within the input area
            if (touches[0].x >= rect.left && 
                touches[0].x <= rect.right && 
                touches[0].y >= rect.top && 
                touches[0].y <= rect.bottom) {
                // Focus the input and show keyboard
                input.focus();
                input.click();
                return false;
            }
        }
    }
    
    // Rest of the touch handling code...
    // ... existing code ...
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
    if (showLeaderboard) {
        drawLeaderboardScreen();
        return;
    }

    // Draw solid pink background
    background('#FF69B4');
    
    // Draw stars
    for (let i = 0; i < 20; i++) {
        drawStar(random(width), random(height * 0.4), random(5, 15));
    }

    // Draw palm trees at the bottom
    drawPalmTree(width * 0.2, height * 0.85, 0.8);
    drawPalmTree(width * 0.8, height * 0.85, 0.8);

    // Ground with grid effect
    push();
    fill('#4B0082');  // Deep purple ground
    noStroke();
    rect(0, height * 0.85, width, height * 0.15);
    
    // Grid lines
    stroke('#FF1493');  // Deep pink lines
    strokeWeight(1);
    for(let x = 0; x < width; x += 50) {
        line(x, height * 0.85, x, height);
    }
    for(let y = height * 0.85; y < height; y += 25) {
        line(0, y, width, y);
    }
    pop();

    // Top Section: Game Info
    let topY = height/8;
    
    // Game Over Title (centered)
    push();
    textFont('Fredoka One');
    fill('#4B0082');
    textStyle(BOLD);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2 + 4, topY + 4);
    fill('#FFFFFF');
    text("GAME OVER", width/2, topY);
    pop();

    // Score and Achievement (left side, with proper spacing)
    push();
    textFont('Fredoka One');
    fill('#FFFFFF');
    textSize(24);
    textAlign(LEFT, CENTER);
    let scoreX = width * 0.1;
    text("YOUR SCORE: " + score, scoreX, topY);
    
    let achievement = getAchievement(score);
    textSize(20);
    text("🏆 " + achievement.title, scoreX, topY + 30);
    pop();

    // Play Again button (right side, smaller)
    let playAgainX = width * 0.85;
    let playAgainWidth = 200;
    let playAgainHeight = 60;
    let playAgainY = topY + 15;

    // Draw play again button
    push();
    fill('#4B0082');
    noStroke();
    rect(playAgainX - playAgainWidth/2, playAgainY - playAgainHeight/2, playAgainWidth, playAgainHeight, 10);
    fill('#FFFFFF');
    textSize(24);
    textAlign(CENTER, CENTER);
    text("PLAY AGAIN", playAgainX, playAgainY);
    pop();

    // Leaderboard section (centered)
    let leaderboardY = height * 0.4;
    let leaderboardWidth = 400;
    let leaderboardHeight = 200;

    // Draw leaderboard section
    push();
    fill('#4B0082');
    noStroke();
    rect(width/2 - leaderboardWidth/2, leaderboardY - leaderboardHeight/2, leaderboardWidth, leaderboardHeight, 20);
    fill('#FFFFFF');
    textSize(24);
    textAlign(CENTER, CENTER);
    text("LEADERBOARD", width/2, leaderboardY - 60);
    pop();

    // Draw leaderboard entries
    let entryY = leaderboardY - 30;
    for (let i = 0; i < Math.min(leaderboardData.length, 5); i++) {
        let entry = leaderboardData[i];
        push();
        fill('#FFFFFF');
        textSize(18);
        textAlign(LEFT, CENTER);
        text((i + 1) + ". " + entry.email, width/2 - 180, entryY);
        textAlign(RIGHT, CENTER);
        text(entry.score, width/2 + 180, entryY);
        pop();
        entryY += 30;
    }

    // Mobile email form trigger
    if (isMobileDevice()) {
        let leaderboardArea = {
            x: width/2 - leaderboardWidth/2,
            y: leaderboardY - leaderboardHeight/2,
            width: leaderboardWidth,
            height: leaderboardHeight
        };

        // Draw mobile-specific text
        push();
        fill('#FFFFFF');
        textSize(20);
        textAlign(CENTER, CENTER);
        text("TAP HERE TO ENTER EMAIL", width/2, leaderboardY + 100);
        pop();

        // Check for touch events
        if (touches.length > 0) {
            let touch = touches[0];
            if (touch.x >= leaderboardArea.x && 
                touch.x <= leaderboardArea.x + leaderboardArea.width && 
                touch.y >= leaderboardArea.y && 
                touch.y <= leaderboardArea.y + leaderboardArea.height) {
                showMobileEmailForm();
                return;
            }
        }
    }

    // Privacy policy link (bottom)
    let privacyLinkY = height * 0.9;
    push();
    fill('#FFFFFF');
    textSize(16);
    textAlign(CENTER, CENTER);
    text("Privacy Policy", width/2, privacyLinkY);
    pop();

    // Check for play again button click
    if (mouseIsPressed && 
        mouseX > playAgainX - playAgainWidth/2 && 
        mouseX < playAgainX + playAgainWidth/2 && 
        mouseY > playAgainY - playAgainHeight/2 && 
        mouseY < playAgainY + playAgainHeight/2) {
        resetGame();
    }

    // Check for privacy policy link click
    if (mouseIsPressed && 
        mouseX >= width/2 - 100 && mouseX <= width/2 + 100 && 
        mouseY >= privacyLinkY - 15 && mouseY <= privacyLinkY + 15) {
        showPrivacyPolicy = true;
    }
}

function mousePressed() {
    if (showPrivacyPolicy) {
        // Calculate popup dimensions
        const popupWidth = isMobileDevice() ? width * 0.95 : width * 0.8;
        const popupHeight = isMobileDevice() ? height * 0.9 : height * 0.8;
        const popupX = (width - popupWidth) / 2;
        const popupY = (height - popupHeight) / 2;
        
        // Close button dimensions
        const closeButtonSize = isMobileDevice() ? 44 : 30;
        const closeButtonX = popupX + 10;
        const closeButtonY = popupY + 10;
        
        // Check if close button was clicked
        if (mouseX > closeButtonX && mouseX < closeButtonX + closeButtonSize &&
            mouseY > closeButtonY && mouseY < closeButtonY + closeButtonSize) {
            showPrivacyPolicy = false;
        }
    }
    // ... rest of the mousePressed function ...
}

// ... existing code ...

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

// ... existing code ...

function drawFogEffect() {
    push();
    // Create multiple layers of fog with different opacities and movement
    for (let i = 0; i < 3; i++) {
        let fogOpacity = map(i, 0, 2, 40, 20); // Increased base opacity
        let yOffset = sin(frameCount * 0.02 + i) * 10;
        
        // Main fog layer
        noStroke();
        fill(147, 112, 219, fogOpacity); // Purple fog with varying opacity
        rect(0, yOffset, width, height);
        
        // Add some darker patches for depth
        fill(75, 0, 130, fogOpacity * 0.5); // Darker purple patches
        for (let j = 0; j < 5; j++) {
            let x = ((frameCount * (i + 1) + j * 200) % width) - 100;
            let y = (height * j / 5) + yOffset;
            ellipse(x, y, 200, 100);
        }
    }
    
    // Add lightning flash effect occasionally
    if (frameCount % 60 < 2) { // Flash every ~1 second
        noStroke();
        fill(255, 255, 255, 30);
        rect(0, 0, width, height);
    }
    
    // Add rain effect
    stroke(147, 112, 219, 100);
    strokeWeight(2);
    for (let i = 0; i < 50; i++) {
        let x = ((frameCount * 5 + i * 20) % width);
        let y = ((frameCount * 15 + i * 30) % height);
        line(x, y, x + 5, y + 15);
    }
    pop();
}

function showMobileEmailForm() {
    const form = document.getElementById('mobile-email-form');
    const emailInput = document.getElementById('mobile-email-input');
    const privacyCheckbox = document.getElementById('mobile-privacy-checkbox');
    const submitButton = document.getElementById('mobile-submit-button');
    const privacyLink = document.getElementById('mobile-privacy-link');

    // Make sure the form is visible
    form.style.display = 'flex';
    form.style.position = 'fixed';
    form.style.top = '0';
    form.style.left = '0';
    form.style.width = '100%';
    form.style.height = '100%';
    form.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    form.style.zIndex = '9999';
    form.style.justifyContent = 'center';
    form.style.alignItems = 'center';
    
    // Set initial values
    emailInput.value = playerEmail || '';
    privacyCheckbox.checked = privacyPolicyAccepted;

    // Focus the email input
    setTimeout(() => {
        emailInput.focus();
    }, 100);

    // Handle input changes
    emailInput.addEventListener('input', (e) => {
        playerEmail = e.target.value;
    });

    // Handle form submission
    submitButton.onclick = (e) => {
        e.preventDefault();
        if (privacyCheckbox.checked) {
            playerEmail = emailInput.value;
            privacyPolicyAccepted = true;
            form.style.display = 'none';
            submitScoreToLeaderboard();
        }
    };

    // Handle privacy policy link
    privacyLink.onclick = (e) => {
        e.preventDefault();
        showPrivacyPolicy = true;
        form.style.display = 'none';
    };

    // Handle privacy checkbox changes
    privacyCheckbox.onchange = () => {
        privacyPolicyAccepted = privacyCheckbox.checked;
    };

    // Handle form close when clicking outside
    form.addEventListener('click', (e) => {
        if (e.target === form) {
            form.style.display = 'none';
        }
    });

    // Handle keyboard submit
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && privacyCheckbox.checked) {
            e.preventDefault();
            playerEmail = emailInput.value;
            privacyPolicyAccepted = true;
            form.style.display = 'none';
            submitScoreToLeaderboard();
        }
    });
}

function drawGameOverScreen() {
    if (showLeaderboard) {
        // ... existing leaderboard drawing code ...

        if (isMobileDevice()) {
            // Show mobile email form when clicking the leaderboard section
            let leaderboardArea = {
                x: width/2 - 200,
                y: leaderboardY - 30,
                width: 400,
                height: 60
            };

            // Draw leaderboard section with touch area
            push();
            fill('#FF69B4');
            noStroke();
            rect(leaderboardArea.x, leaderboardArea.y, leaderboardArea.width, leaderboardArea.height, 10);
            fill('#FFFFFF');
            textSize(24);
            textAlign(CENTER, CENTER);
            text("TAP HERE TO ENTER EMAIL", width/2, leaderboardY);
            pop();

            // Check for touch events
            if (touches.length > 0) {
                let touch = touches[0];
                if (touch.x >= leaderboardArea.x && 
                    touch.x <= leaderboardArea.x + leaderboardArea.width && 
                    touch.y >= leaderboardArea.y && 
                    touch.y <= leaderboardArea.y + leaderboardArea.height) {
                    showMobileEmailForm();
                    return;
                }
            }
        } else {
            // Desktop email submission form (unchanged)
            // ... existing desktop code ...
        }
    }
    // ... rest of the function ...
}
