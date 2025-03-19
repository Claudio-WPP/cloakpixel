/*
 * ============================================================================
 * NOTE: This is a temporary website, as WPP site creation fell through.
 * Thanks for checking out my code! 😉
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    document.body.style.transition = "background-color 1s ease-in-out";
    document.body.style.backgroundColor = "#111b34";
    
    // Make the container scrollable if content is tall
    const container = document.getElementById("content");
    const windowHeight = window.innerHeight;
    
    if (container.offsetHeight > windowHeight * 0.8) {
        document.body.style.height = "auto";
        document.body.style.minHeight = "100vh";
        document.body.style.overflowY = "auto";
        container.style.marginTop = "150px";
        container.style.marginBottom = "50px";
    }
    
    setTimeout(() => {
        startCracking();
    }, 500); // Glass effect starts within 0.5s
});

const canvas = document.getElementById("crackCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const cracks = [];
const crackCount = 20;
let opacity = 0;
let inverted = false;
let mouseX = -1000; // Start off-screen
let mouseY = -1000;
let touchActive = false;
let mouseInWindow = false;
let mouseFollowingCracks = 0; // Track number of cracks following mouse
let mouseFollowingTimes = {}; // Track how long each crack has been following mouse

// Track mouse position
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseInWindow = true;
});

// Track touch position
window.addEventListener('touchstart', (e) => {
    touchActive = true;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    mouseInWindow = true;
});

window.addEventListener('touchmove', (e) => {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    mouseInWindow = true;
});

window.addEventListener('touchend', () => {
    touchActive = false;
});

// Track mouse leaving window
window.addEventListener('mouseout', (e) => {
    if (e.relatedTarget === null) {
        mouseInWindow = false;
    }
});

window.addEventListener('mouseleave', () => {
    mouseInWindow = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Function to create a new crack
function createNewCrack() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.7, // Increased minimum line thickness for better visibility
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        opacity: opacity, // Use current global opacity
        // Increased length by 20% as requested
        maxLength: 2.4 + Math.random() * 3.6, // 20% increase from previous values (2+3)
        currentLength: 0.72, // 20% longer initial length (from 0.6)
        followMouse: Math.random() < 0.25, // Increased chance to 25% (was 15%)
        circlingMouse: false, // Flag to track if crack is circling the mouse
        angleAroundMouse: Math.random() * Math.PI * 2, // Initial angle for circling
        radiusFromMouse: 0, // Will be set when circling starts
        circlingSpeed: (Math.random() * 0.02) + 0.01, // Random speed for circling
        id: Math.random().toString(36).substr(2, 9), // Unique ID for tracking follow time
        startedFollowingAt: 0 // Timestamp when started following
    };
}

// Generate initial random cracks
for (let i = 0; i < crackCount; i++) {
    cracks.push(createNewCrack());
}

function drawCracks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Track how many cracks need to be regenerated
    let cracksToRegenerate = [];
    
    // Update mouse following count
    mouseFollowingCracks = cracks.filter(crack => crack.followMouse && mouseInWindow).length;
    
    // Current time for tracking follow duration
    const currentTime = Date.now();
    
    cracks.forEach((crack, index) => {
        // If not circling the mouse and not at max length, grow faster
        if (!crack.circlingMouse && crack.currentLength < crack.maxLength && Math.random() > 0.2) {
            crack.currentLength += 0.14; // Even faster growth (was 0.12)
        }
        
        // Check if this crack should stop following the mouse after 3 seconds
        if (crack.followMouse && mouseFollowingTimes[crack.id]) {
            const followDuration = currentTime - mouseFollowingTimes[crack.id];
            if (followDuration > 3000) { // 3 seconds
                // Only remove one at a time when we have 5 followers
                if (mouseFollowingCracks >= 5) {
                    crack.followMouse = false;
                    crack.circlingMouse = false;
                    delete mouseFollowingTimes[crack.id];
                    mouseFollowingCracks--;
                }
            }
        }
        
        // Enforce maximum of 5 cracks following mouse at once
        if (crack.followMouse && !mouseFollowingTimes[crack.id] && mouseFollowingCracks <= 5) {
            mouseFollowingTimes[crack.id] = currentTime;
        } else if (crack.followMouse && mouseFollowingCracks > 5) {
            // If we already have 5+ cracks following, don't allow more
            crack.followMouse = false;
        }
        
        // Draw crack
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${inverted ? "17, 27, 52" : "255, 255, 255"}, ${crack.opacity})`;
        ctx.lineWidth = crack.size;
        
        if (crack.circlingMouse) {
            // Draw circling around mouse
            const x = mouseX + Math.cos(crack.angleAroundMouse) * crack.radiusFromMouse;
            const y = mouseY + Math.sin(crack.angleAroundMouse) * crack.radiusFromMouse;
            ctx.moveTo(crack.x, crack.y);
            ctx.lineTo(x, y);
            
            // Update position to follow circle
            crack.x = x;
            crack.y = y;
            
            // Update angle for next frame
            crack.angleAroundMouse += crack.circlingSpeed;
        } else {
            // Draw normal straight line
            ctx.moveTo(crack.x, crack.y);
            ctx.lineTo(crack.x + crack.dx * crack.currentLength, crack.y + crack.dy * crack.currentLength);
        }
        
        ctx.stroke();
        
        // Check if this crack should follow the mouse
        if (crack.followMouse && mouseInWindow && !crack.circlingMouse) {
            // Calculate distance from mouse/touch point
            const dx = mouseX - crack.x;
            const dy = mouseY - crack.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Enhanced influence from mouse/touch (stronger when closer)
            if (distance < 250) { // Increased from 200 to 250px for better following
                // If very close to mouse, start circling
                if (distance < 40) {
                    crack.circlingMouse = true;
                    crack.radiusFromMouse = Math.random() * 30 + 15; // Random radius between 15-45px
                    crack.angleAroundMouse = Math.atan2(crack.y - mouseY, crack.x - mouseX);
                } else {
                    // Stronger influence factor (doubled from before)
                    const influence = (250 - distance) / 1000; // Changed from 2000 to 1000 for stronger effect
                    crack.dx += dx * influence;
                    crack.dy += dy * influence;
                    
                    // Limit speed but with higher maximum (increased from 3 to 4)
                    const speed = Math.sqrt(crack.dx * crack.dx + crack.dy * crack.dy);
                    if (speed > 4) {
                        crack.dx = (crack.dx / speed) * 4;
                        crack.dy = (crack.dy / speed) * 4;
                    }
                }
            }
        }
        
        // Only move if not circling
        if (!crack.circlingMouse) {
            // Move crack
            crack.x += crack.dx;
            crack.y += crack.dy;
            
            // Add some randomness to movement
            crack.dx += (Math.random() - 0.5) * 0.1;
            crack.dy += (Math.random() - 0.5) * 0.1;
            
            // Ensure minimum velocity
            const speed = Math.sqrt(crack.dx * crack.dx + crack.dy * crack.dy);
            if (speed < 0.5) {
                crack.dx *= 1.5;
                crack.dy *= 1.5;
            }
        }
        
        // Check if crack has gone off screen (only for non-circling cracks)
        if (!crack.circlingMouse) {
            const buffer = 50; // Provide some buffer so it's clearly off screen
            if (crack.x < -buffer || crack.x > canvas.width + buffer ||
                crack.y < -buffer || crack.y > canvas.height + buffer) {
                // Mark for regeneration
                cracksToRegenerate.push(index);
                return;
            }
        }
        
        // Check if circling crack should stop circling when mouse moves too far
        if (crack.circlingMouse && mouseInWindow) {
            const dx = crack.x - mouseX;
            const dy = crack.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If mouse moved too far from the circling point
            if (distance > crack.radiusFromMouse + 50) {
                crack.circlingMouse = false;
                // Set direction away from mouse
                crack.dx = dx / distance * 2;
                crack.dy = dy / distance * 2;
            }
        }
    });
    
    // Regenerate cracks that went off screen
    cracksToRegenerate.forEach(index => {
        cracks[index] = createNewCrack();
    });
    
    // Increase opacity if still fading in
    if (opacity < 1) {
        opacity += 0.02;
        cracks.forEach(crack => {
            crack.opacity = opacity;
        });
    }
}

function startCracking() {
    opacity = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cracks.forEach(crack => {
        crack.opacity = 0;
        crack.currentLength = 0.72; // 20% longer initial length (from 0.6)
    });
    
    if (!window.crackInterval) {
        window.crackInterval = setInterval(drawCracks, 33); // ~30fps for smoother animation
    }
}

// Thanks for checking out my code! This is a temporary website, as WPP site creation fell through.
