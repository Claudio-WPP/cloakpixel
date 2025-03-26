document.addEventListener("DOMContentLoaded", () => {
    document.body.style.transition = "background-color 1s ease-in-out";
    document.body.style.backgroundColor = "#111b34";

    // Create audio element
    const audioElement = document.createElement("audio");
    audioElement.id = "backgroundAudio";
    audioElement.src = "key-art-audio.wav";
    audioElement.loop = true;
    audioElement.volume = 0; // Start with volume at 0
    audioElement.preload = "auto"; // Preload the audio
    document.body.appendChild(audioElement);
    
    // Hide countdown initially
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        countdownElement.style.opacity = "0";
        countdownElement.style.visibility = "hidden";
    }
    
    // Initial page fade-in sequence
    startInitialFadeInSequence();
    
    // Start the ellipsis animation for "stay tuned"
    const stayTunedEllipsis = document.querySelector('.ellipsis');
    if (stayTunedEllipsis) {
        animateEllipsis(stayTunedEllipsis);
    }
    
    setTimeout(() => {
        startCracking();
    }, 500); // Glass effect starts within 0.5s
});

// Function to handle sequential fade-in for initial page elements
function startInitialFadeInSequence() {
    const fadeElements = document.querySelectorAll('.fade-element');
    const fadeDelay = 600; // 600ms between each element
    
    // Group the h2 and hr elements to fade in together
    const h2Element = document.querySelector('h2.fade-element');
    const hrElement = document.querySelector('hr.fade-element');
    
    fadeElements.forEach((element, index) => {
        setTimeout(() => {
            element.style.transition = "opacity 1s ease-in-out";
            element.style.opacity = "1";
            
            // If this is the paragraph with bold elements, DON'T immediately start animating underlines
            // We'll start that animation after the loading text appears
        }, fadeDelay * index);
    });
    
    // Start animating underlines after the last element has faded in
    const lastElementIndex = fadeElements.length - 1;
    setTimeout(() => {
        // Get the paragraph with bold elements
        const paragraph = document.querySelector('.justified-text');
        
        // Now start animating the underlines
        if (paragraph) {
            // First get all bold elements within this paragraph
            const boldElements = paragraph.querySelectorAll('strong');
            const delay = 10000 / boldElements.length; // Distribute over 10 seconds
            
            boldElements.forEach((boldElement, boldIndex) => {
                setTimeout(() => {
                    boldElement.classList.add('highlight-active');
                }, delay * boldIndex);
            });
        }
    }, fadeDelay * (lastElementIndex + 1) + 500); // Add a bit extra delay
}

// Function to animate underlines for bold text elements one by one
function animateUnderlines() {
    const boldElements = document.querySelectorAll('strong');
     const delay = 10000 / boldElements.length; // Distribute over 10 seconds
    
    boldElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('highlight-active');
        }, delay * index);
    });
}

// Function to animate ellipsis
function animateEllipsis(element) {
    let count = 0;
    const ellipsisInterval = setInterval(() => {
        count = (count + 1) % 4;
        element.textContent = '.'.repeat(count || 1);
    }, 500);
    
    // Store interval ID to clear it later if needed
    window.ellipsisInterval = ellipsisInterval;
}

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
let audioStarted = false;
let mouseFollowingCracks = 0; // Track number of cracks following mouse
let mouseFollowingTimes = {}; // Track how long each crack has been following mouse
let staticTransitionCount = 0; // Track number of static transitions

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

function fadeInAudio() {
    // Only start audio if it hasn't been started yet
    if (!audioStarted) {
        const audioElement = document.getElementById("backgroundAudio");
        
        // Ensure audio plays as a direct response to user interaction
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Audio successfully started playing
                audioStarted = true;
                console.log("Audio started playing successfully");
                
                // Fade in audio over 6 seconds to 80% volume
                let volume = 0;
                const maxVolume = 0.8;
                const fadeSteps = 60; // 60 steps over 6 seconds = 100ms per step
                const volumeIncrement = maxVolume / fadeSteps;
                
                const intervalId = setInterval(() => {
                    volume += volumeIncrement;
                    if (volume >= maxVolume) {
                        clearInterval(intervalId);
                        volume = maxVolume; // Set to 80% max volume
                    }
                    audioElement.volume = volume;
                    console.log("Audio volume:", volume);
                }, 100); // 100ms per step for 6 seconds total
            }).catch(e => {
                // Fallback for cases where autoplay is blocked
                console.log("Audio play failed: ", e);
                
                // Add a click-to-play fallback
                const clickToPlay = function() {
                    audioElement.play().then(() => {
                        audioStarted = true;
                        
                        // Fade in audio over 6 seconds to 80% volume
                        let volume = 0;
                        const maxVolume = 0.8;
                        const fadeSteps = 60;
                        const volumeIncrement = maxVolume / fadeSteps;
                        
                        const intervalId = setInterval(() => {
                            volume += volumeIncrement;
                            if (volume >= maxVolume) {
                                clearInterval(intervalId);
                                volume = maxVolume;
                            }
                            audioElement.volume = volume;
                        }, 100);
                        
                        // Remove event listeners once audio plays
                        document.removeEventListener('click', clickToPlay);
                        document.removeEventListener('touchstart', clickToPlay);
                    });
                };
                
                document.addEventListener('click', clickToPlay);
                document.addEventListener('touchstart', clickToPlay);
            });
        }
    }
}

function tvStaticTransition() {
    const staticOverlay = document.getElementById("static");
    staticOverlay.style.opacity = "1";
    staticOverlay.style.animation = "none";
    
    // Start playing audio immediately with first transition
    fadeInAudio();

    // Increment static transition counter
    staticTransitionCount++;

    // Create image teaser element if it doesn't exist
    let keyImageElement = document.getElementById("keyImage");
    if (!keyImageElement) {
        keyImageElement = document.createElement("div");
        keyImageElement.id = "keyImage";
        keyImageElement.style.position = "fixed";
        keyImageElement.style.top = "50%";
        keyImageElement.style.left = "50%";
        keyImageElement.style.transform = "translate(-50%, -50%)";
        keyImageElement.style.height = "80vh";
        keyImageElement.style.display = "flex";
        keyImageElement.style.justifyContent = "center";
        keyImageElement.style.alignItems = "center";
        keyImageElement.style.backgroundColor = "black";
        keyImageElement.style.zIndex = "20";
        keyImageElement.style.opacity = "0";
        
        const img = document.createElement("img");
        img.src = "Key-Image-Art.jpeg";
        img.style.height = "100%";
        img.style.width = "auto";
        img.style.maxWidth = "100%";
        img.style.objectFit = "contain";
        
        keyImageElement.appendChild(img);
        document.body.appendChild(keyImageElement);
    }
    
    let flickerCount = 0;
    const maxFlickers = Math.floor(Math.random() * 6) + 5; // Random between 5-10 flickers
    const showKeyImageOnFlicker = Math.floor(Math.random() * maxFlickers);
    
    // Ensure key image only appears after first full heading set
    const checkFullTextAppeared = () => {
        const heading1 = document.querySelector('h1.glitch-text');
        const heading2 = document.querySelector('h2.glitch-text:nth-of-type(1)');
        return heading1 && heading2 && 
               heading1.style.opacity === '1' && 
               heading2.style.opacity === '1';
    };
    
    let flickerInterval = setInterval(() => {
        flickerCount++;
        
        // Decide whether to show static or key image for this flicker
        if (flickerCount === showKeyImageOnFlicker) {
            // Only show key image if full text has already appeared
            if (checkFullTextAppeared()) {
                staticOverlay.style.opacity = "0";
                keyImageElement.style.opacity = "1";
                
                // Keep the image on screen for .1 seconds longer
                setTimeout(() => {
                    if (flickerCount < maxFlickers) {
                        keyImageElement.style.opacity = "0";
                        staticOverlay.style.opacity = "1";
                    }
                }, 200); // 100ms (default) + 100ms (additional) = 200ms total
            }
        } else {
            staticOverlay.style.opacity = staticOverlay.style.opacity === "1" ? "0" : "1";
            keyImageElement.style.opacity = "0";
        }
        
        if (flickerCount >= maxFlickers) {
            clearInterval(flickerInterval);
            staticOverlay.style.opacity = "0";
            keyImageElement.style.opacity = "0";
            
            // After three static transitions, show the survey
            if (staticTransitionCount >= 3) {
                showSurvey();
            } else {
                showNotEverythingIsAsItSeems();
            }
        }
    }, 100);
}

function showNotEverythingIsAsItSeems() {
    document.body.style.backgroundColor = "white";
    inverted = true; // Invert crack colors
    document.body.style.color = "#001f3f";
    
    // Switch WPP logo from inverse to regular
    const wppLogo = document.getElementById("wpp-logo");
    wppLogo.src = "WPP-logo.png";

    // Clear content first
    document.getElementById("content").innerHTML = '';
    
    // Create text elements (all initially hidden)
    const heading1 = document.createElement('h1');
    heading1.className = 'glitch-text fade-in-element';
    heading1.textContent = 'Everything is not as it seems';
    heading1.style.opacity = '0';
    heading1.style.transition = 'opacity 1s ease-in-out';
    
    const heading2 = document.createElement('h2');
    heading2.className = 'glitch-text fade-in-element';
    heading2.textContent = 'Some of you have guessed it... there is no training, instead you will be playing a game';
    heading2.style.opacity = '0';
    heading2.style.transition = 'opacity 1s ease-in-out';
    
    const heading3 = document.createElement('h2');
    heading3.className = 'glitch-text fade-in-element';
    heading3.textContent = 'Claudio will see you soon';
    heading3.style.opacity = '0';
    heading3.style.transition = 'opacity 1s ease-in-out';
    
    const loadingText = document.createElement('p');
    loadingText.className = 'glitch-text loading-text';
    loadingText.style.opacity = '0'; 
    loadingText.style.transition = 'opacity 1s ease-in-out';
    loadingText.innerHTML = 'Please remain on the page - loading<span class="ellipsis">.</span>';
    
    // Add elements to the content container
    const contentElement = document.getElementById("content");
    contentElement.appendChild(heading1);
    contentElement.appendChild(heading2);
    contentElement.appendChild(heading3);
    contentElement.appendChild(loadingText);
    
    // Start countdown but keep it hidden
    startCountdown();
    const countdownElement = document.getElementById("countdown");
    countdownElement.style.opacity = "0";
    countdownElement.style.visibility = "visible";
    countdownElement.style.transition = "opacity 1s ease-in-out";
    
    document.getElementById("static").style.opacity = "0";
    
    // Check if we've already shown this screen before
    if (window.notEverythingShown) {
        // If already shown, just make all elements visible immediately
        heading1.style.opacity = '1';
        heading2.style.opacity = '1';
        heading3.style.opacity = '1';
        loadingText.style.opacity = '1';
        countdownElement.style.opacity = '1';
        
        // Start ellipsis animation for loading text
        startEllipsisAnimation();
    } else {
        // First time showing, do sequential fade-in
        // First line
        setTimeout(() => {
            heading1.style.opacity = '1';
            
            // Second line (after 3s - 1s fade + 2s gap)
            setTimeout(() => {
                heading2.style.opacity = '1';
                
                // Third line (after 3s more)
                setTimeout(() => {
                    heading3.style.opacity = '1';
                    
                    // Loading text (after 3s more)
                    setTimeout(() => {
                        loadingText.style.opacity = '1';
                        startEllipsisAnimation();
                        
                        // Countdown (after 3s more)
                        setTimeout(() => {
                            countdownElement.style.opacity = '1';
                        }, 2000);
                    }, 2000);
                }, 2000);
            }, 2000);
        }, 500);
        
        // Mark that we've shown this screen
        window.notEverythingShown = true;
    }
    
    // Only schedule next transition if we haven't shown the survey yet
    if (staticTransitionCount < 3) {
        let nextEffectTime = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
        setTimeout(() => {
            // Don't restart cracking, just ensure cracks are visible
            cracks.forEach(crack => {
                crack.opacity = 1;
            });
            setTimeout(tvStaticTransition, 1000);
        }, nextEffectTime);
    }
}

function startEllipsisAnimation() {
    const ellipsisElement = document.querySelector('.ellipsis');
    if (!ellipsisElement) return;
    
    // Clear any existing interval
    if (window.ellipsisInterval) {
        clearInterval(window.ellipsisInterval);
    }
    
    let count = 0;
    const ellipsisInterval = setInterval(() => {
        count = (count + 1) % 4;
        ellipsisElement.textContent = '.'.repeat(count || 1);
    }, 500);
    
    // Store interval ID to clear it later if needed
    window.ellipsisInterval = ellipsisInterval;
}

function showSurvey() {
    // Clear ellipsis animation if it's running
    if (window.ellipsisInterval) {
        clearInterval(window.ellipsisInterval);
    }
    
    // Fade out current content
    const contentElement = document.getElementById("content");
    contentElement.style.opacity = "0";
    
    // Make sure countdown is visible and ready
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        countdownElement.style.opacity = "1";
        countdownElement.style.visibility = "visible";
    }
    
    // Ensure logo container stays on top
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.style.zIndex = "15";
    }
    
    setTimeout(() => {
        // Replace with survey content using the wrapper structure to prevent scrolling
        contentElement.innerHTML = `
            <div class="survey-wrapper">
                <h1 class="glitch-text survey-heading">Claudio needs help with a quick survey. Please fill in the below - zoom out or use a larger screen to avoid issues submitting:</h1>
                <div class="survey-container">
                    <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfWxhnc6D1mUzPOtiOdiG70yXaVOUCCWDfUZVtmW5vO7GpnpQ/viewform?embedded=true" width="620" height="500" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>
                </div>
            </div>
        `;
        
        // Reset content container styles
        contentElement.style.opacity = "1";
        contentElement.style.overflow = "hidden";
        contentElement.style.maxHeight = "calc(100vh - 140px)"; // Leave room for countdown
        contentElement.style.paddingBottom = "25px"; // Reduce padding to minimize whitespace
        contentElement.style.maxWidth = "620px"; // More constrained width to prevent horizontal scroll
        
        // Ensure proper positioning
        contentElement.style.display = "flex";
        contentElement.style.flexDirection = "column";
        contentElement.style.justifyContent = "center";
        contentElement.style.marginTop = "100px"; // Push content below logo
    }, 1000);
}

function startCountdown() {
    const countdownElement = document.getElementById("countdown");
    
    // Reset any existing styles
    countdownElement.style = "";
    
    // Set initial styles
    countdownElement.style.opacity = "0";
    countdownElement.style.fontFamily = "'YaroCut', sans-serif";
    countdownElement.style.transition = "opacity 1.5s ease-in-out";
    countdownElement.style.visibility = "visible"; // Make sure it's visible before fading in
    
    // Force the browser to apply the initial styles before changing them
    void countdownElement.offsetWidth;
    
    // Set the countdown text before starting the fade-in
    updateCountdownText();

     // Start the fade-in effect after a small delay
    setTimeout(() => {
        countdownElement.style.opacity = "1";
    }, 500);
    
    // Update the countdown text every second
    function updateCountdownText() {
        const targetDate = new Date("March 26, 2025 11:00:00").getTime();
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            countdownElement.innerHTML = "The event has started!";
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    // Set up the interval to update the countdown
    const countdownInterval = setInterval(() => {
        const targetDate = new Date("March 26, 2025 11:00:00").getTime();
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            clearInterval(countdownInterval);
            countdownElement.innerHTML = "The event has started!";
            return;
        }
        
        updateCountdownText();
    }, 1000);
}

// Changed from 10000 to 11000 (11 seconds) as requested
setTimeout(() => {
    tvStaticTransition();
}, 12000);
