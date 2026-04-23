const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const minimapCanvas = document.getElementById("minimap");
const minimapCtx = minimapCanvas.getContext("2d");
const planetPopup = document.getElementById("planet-popup");
const pName = document.getElementById("planet-name");
const pDesc = document.getElementById("planet-desc");
const toast = document.getElementById("toast");
const screenshotOverlay = document.getElementById("screenshot-overlay");
const previewImg = document.getElementById("preview-img");

let isPaused = false;
let currentSnapshotBlob = null;
let gameActive = true;

// Fuel System Variables
let currentFuel = 1000;
const MAX_FUEL = 1000;
const FUEL_CONSUMPTION_RATE = 1.2;

// Physics Constants
const G_CONSTANT = 0.12; 
const MAX_THRUST_DIST = 300;
const MAX_THRUST_FORCE = 0.8;
const TERMINAL_VELOCITY = 25; 
const LANDING_SPEED_THRESHOLD = 4.2;
const BREAKOUT_THRUST_LIMIT = 0.2;

const planetData = [
    { name: "Java", desc: "Robust enterprise backend and high-scale systems.", icon: "☕" },
    { name: "Python", desc: "The language of AI and data science worldwide.", icon: "🐍" },
    { name: "JavaScript", desc: "Powering the modern interactive web experience.", icon: "📜" },
    { name: "C++", desc: "Extreme performance for games and low-level systems.", icon: "⚙️" },
    { name: "C#", desc: "The backbone of Unity and modern Windows apps.", icon: "🎮" },
    { name: "Go", desc: "Designed for simple, reliable cloud infrastructure.", icon: "🐹" },
    { name: "Rust", desc: "The future of safe and blazing fast systems.", icon: "🦀" },
    { name: "Kotlin", desc: "Modern, concise development for Android devices.", icon: "📱" },
    { name: "TypeScript", desc: "Bringing safety and scale to JavaScript apps.", icon: "🛡️" }
];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    minimapCanvas.width = 180;
    minimapCanvas.height = 180;
}
window.addEventListener('resize', resize);
resize();

function updateFuelDisplay() {
    const fuelPercent = (currentFuel / MAX_FUEL) * 100;
    document.getElementById("fuel-value").innerText = Math.floor(currentFuel);
    document.getElementById("fuel-fill").style.width = fuelPercent + "%";
    
    const fuelFill = document.getElementById("fuel-fill");
    if (fuelPercent < 20) {
        fuelFill.style.background = "linear-gradient(90deg, #ff4444, #ff8844)";
        document.getElementById("fuel-value").classList.add("fuel-warning");
    } else if (fuelPercent < 50) {
        fuelFill.style.background = "linear-gradient(90deg, #ffaa44, #ffdd44)";
        document.getElementById("fuel-value").classList.remove("fuel-warning");
    } else {
        fuelFill.style.background = "linear-gradient(90deg, #0ff, #0f0)";
        document.getElementById("fuel-value").classList.remove("fuel-warning");
    }
}

function consumeFuel(amount) {
    if (!gameActive) return false;
    
    currentFuel = Math.max(0, currentFuel - amount);
    updateFuelDisplay();
    
    if (currentFuel <= 0 && gameActive) {
        gameActive = false;
        isPaused = true;
        playSound('mission_fail');
        const visited = planets.filter(p => p.hasFlag).length;
        document.getElementById("game-over-title").innerText = "MISSION FAILED";
        document.getElementById("game-over-message").innerHTML = "⚠️ FUEL DEPLETED ⚠️<br>Your ship is adrift in space.";
        document.getElementById("planets-visited").innerHTML = `Planets visited: ${visited}/9`;
        document.getElementById("game-over").style.display = "block";
        showToast("CRITICAL: FUEL EMPTY - MISSION FAILED");
        return false;
    }
    return true;
}

function resetGame() {
    gameActive = true;
    isPaused = false;
    currentFuel = MAX_FUEL;
    updateFuelDisplay();
    
    planets.forEach((planet, idx) => {
        planet.hasFlag = false;
        planet.angle = Math.random() * Math.PI * 2;
    });
    
    player.x = 0;
    player.y = -900;
    player.vx = 0;
    player.vy = 0;
    player.landedOn = null;
    player.thrust = 0;
    player.particles = [];
    player.slingshotMessage = "";
    player.slingshotTimer = 0;
    
    const blackholeWarning = document.getElementById("blackhole-warning");
    if (blackholeWarning) blackholeWarning.style.opacity = "0";
    
    document.getElementById("game-over").style.display = "none";
    planetPopup.style.display = "none";
    showToast("MISSION RESTARTED - AVOID BLACK HOLES AND THE SUN!");
    playSound('thrust');
}

function checkMissionComplete() {
    const visitedCount = planets.filter(p => p.hasFlag).length;
    if (visitedCount === 9 && gameActive) {
        gameActive = false;
        isPaused = true;
        playSound('mission_complete');
        const fuelRemaining = Math.floor(currentFuel);
        document.getElementById("game-over-title").innerHTML = "✅ MISSION ACCOMPLISHED! ✅";
        document.getElementById("game-over-message").innerHTML = `You visited all 9 planets!<br>Fuel remaining: ${fuelRemaining} units<br>Outstanding piloting!`;
        document.getElementById("planets-visited").innerHTML = `Perfect score: 9/9 planets`;
        document.getElementById("game-over").style.display = "block";
        showToast("MISSION COMPLETE! ALL PLANETS VISITED!");
    }
}

function showPlanetData(p) {
    isPaused = true;
    document.getElementById("planet-icon").innerText = p.icon;
    pName.innerText = p.name;
    pDesc.innerText = p.description;
    planetPopup.style.display = "block";
}

const sun = { x: 0, y: 0, radius: 110, mass: 65000, color: "#ff4d00", id: 'sun' };
const planets = [];
const planetColors = ["#555", "#8a6", "#46a", "#a44", "#a84", "#68a", "#84a", "#4a8", "#666"];

for (let i = 0; i < 9; i++) {
    planets.push({
        orbitRadius: 800 + i * 450,
        angle: Math.random() * Math.PI * 2,
        speed: 0.0015 / (i + 1),
        radius: 14 + i * 4,
        mass: 6000 + i * 3000,
        color: planetColors[i],
        hasFlag: false,
        x: 0, y: 0,
        id: 'p' + i,
        name: planetData[i].name,
        description: planetData[i].desc,
        icon: planetData[i].icon
    });
}

// Create black holes
const blackHoles = [
    new BlackHole(-1200, -800, 35),
    new BlackHole(1400, 600, 40),
    new BlackHole(500, -1300, 30)
];

const player = new Player(0, -900);

function drawGrid(camera) {
    const size = 300;
    ctx.strokeStyle = "#121218";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -camera.x % size; x < canvas.width; x += size) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = -camera.y % size; y < canvas.height; y += size) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

function drawCosineRings(x, y, radius) {
    const time = Date.now() * 0.0015;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const baseRadius = radius + 25 + i * 35;
        const opacity = 0.35 - i * 0.06;
        ctx.strokeStyle = `rgba(255, 90, 0, ${opacity})`;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
            const wave = Math.cos(a * 12 + time + i) * (6 + i * 2);
            const r = baseRadius + wave;
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

function drawMinimap(player, sun, planets, blackHoles) {
    const size = minimapCanvas.width;
    minimapCtx.clearRect(0, 0, size, size);
    
    minimapCtx.fillStyle = "rgba(10, 10, 15, 0.9)";
    minimapCtx.fillRect(0, 0, size, size);
    
    let minX = sun.x, maxX = sun.x, minY = sun.y, maxY = sun.y;
    planets.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });
    blackHoles.forEach(bh => {
        minX = Math.min(minX, bh.x);
        maxX = Math.max(maxX, bh.x);
        minY = Math.min(minY, bh.y);
        maxY = Math.max(maxY, bh.y);
    });
    minX = Math.min(minX, player.x);
    maxX = Math.max(maxX, player.x);
    minY = Math.min(minY, player.y);
    maxY = Math.max(maxY, player.y);
    
    const padding = 50;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    function worldToMap(x, y) {
        return {
            x: ((x - minX) / rangeX) * size,
            y: ((y - minY) / rangeY) * size
        };
    }
    
    planets.forEach(planet => {
        const orbitRadius = Math.hypot(planet.x - sun.x, planet.y - sun.y);
        const sunMap = worldToMap(sun.x, sun.y);
        const radiusOnMap = (orbitRadius / rangeX) * size;
        
        minimapCtx.beginPath();
        minimapCtx.arc(sunMap.x, sunMap.y, radiusOnMap, 0, Math.PI * 2);
        minimapCtx.strokeStyle = "rgba(100, 100, 150, 0.15)";
        minimapCtx.lineWidth = 1;
        minimapCtx.stroke();
    });
    
    planets.forEach(planet => {
        const pos = worldToMap(planet.x, planet.y);
        minimapCtx.beginPath();
        minimapCtx.arc(pos.x, pos.y, Math.max(3, planet.radius / 8), 0, Math.PI * 2);
        
        if (planet.hasFlag) {
            minimapCtx.fillStyle = "#0f0";
            minimapCtx.shadowBlur = 5;
            minimapCtx.shadowColor = "#0f0";
        } else {
            minimapCtx.fillStyle = planet.color;
            minimapCtx.shadowBlur = 0;
        }
        minimapCtx.fill();
        
        minimapCtx.font = "bold 8px 'Courier New'";
        minimapCtx.fillStyle = "#aaa";
        minimapCtx.shadowBlur = 0;
        minimapCtx.fillText(planet.name[0], pos.x - 2, pos.y - 3);
    });
    
    blackHoles.forEach(bh => {
        const pos = worldToMap(bh.x, bh.y);
        minimapCtx.beginPath();
        minimapCtx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        minimapCtx.fillStyle = "#ff00ff";
        minimapCtx.shadowBlur = 4;
        minimapCtx.shadowColor = "#ff00ff";
        minimapCtx.fill();
        minimapCtx.font = "bold 6px 'Courier New'";
        minimapCtx.fillStyle = "#ff88ff";
        minimapCtx.fillText("BH", pos.x - 4, pos.y - 4);
    });
    
    const sunPos = worldToMap(sun.x, sun.y);
    minimapCtx.beginPath();
    minimapCtx.arc(sunPos.x, sunPos.y, Math.max(6, sun.radius / 12), 0, Math.PI * 2);
    minimapCtx.fillStyle = "#ff6600";
    minimapCtx.shadowBlur = 8;
    minimapCtx.shadowColor = "#ff6600";
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    
    const playerPos = worldToMap(player.x, player.y);
    minimapCtx.save();
    minimapCtx.translate(playerPos.x, playerPos.y);
    minimapCtx.rotate(player.direction);
    minimapCtx.beginPath();
    minimapCtx.moveTo(6, 0);
    minimapCtx.lineTo(-4, -4);
    minimapCtx.lineTo(-4, 4);
    minimapCtx.closePath();
    
    if (currentFuel <= 0) {
        minimapCtx.fillStyle = "#ff4444";
    } else {
        minimapCtx.fillStyle = "#0ff";
    }
    minimapCtx.shadowBlur = 4;
    minimapCtx.shadowColor = "#0ff";
    minimapCtx.fill();
    minimapCtx.restore();
    minimapCtx.shadowBlur = 0;
    
    minimapCtx.strokeStyle = "#0ff";
    minimapCtx.lineWidth = 1.5;
    minimapCtx.strokeRect(0, 0, size, size);
}

function update() {
    if (isPaused) return;
    planets.forEach(p => {
        p.angle += p.speed;
        p.x = sun.x + Math.cos(p.angle) * p.orbitRadius;
        p.y = sun.y + Math.sin(p.angle) * p.orbitRadius;
    });
    blackHoles.forEach(bh => bh.update());
    player.update(planets, sun);
}

function draw() {
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const camera = { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2 };
    
    drawGrid(camera);
    ctx.setLineDash([2, 10]);
    ctx.strokeStyle = "#1a1c24";
    planets.forEach(p => {
        ctx.beginPath();
        ctx.arc(sun.x - camera.x, sun.y - camera.y, p.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    
    blackHoles.forEach(bh => bh.draw(ctx, camera));
    
    const sunX = sun.x - camera.x;
    const sunY = sun.y - camera.y;
    drawCosineRings(sunX, sunY, sun.radius);
    
    const gradient = ctx.createRadialGradient(sunX, sunY, sun.radius * 0.5, sunX, sunY, sun.radius);
    gradient.addColorStop(0, "#ff9d00");
    gradient.addColorStop(1, "#ff4d00");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sun.radius, 0, Math.PI * 2);
    ctx.fill();
    
    planets.forEach(b => {
        const x = b.x - camera.x;
        const y = b.y - camera.y;
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(x, y, b.radius, 0, Math.PI * 2); ctx.fill();
        
        // Scale font for mobile
        const fontSize = Math.max(8, Math.min(10, window.innerWidth / 80));
        ctx.fillStyle = "#aaa"; 
        ctx.font = `${fontSize}px Courier New`; 
        ctx.textAlign = "center";
        ctx.fillText(b.name.toUpperCase(), x, y + b.radius + 15);
        if (b.hasFlag) {
            ctx.strokeStyle = "#fff"; 
            ctx.lineWidth = Math.max(1, window.innerWidth / 800);
            ctx.beginPath();
            ctx.moveTo(x, y - b.radius); 
            ctx.lineTo(x, y - b.radius - 12);
            ctx.lineTo(x + 8, y - b.radius - 8); 
            ctx.lineTo(x, y - b.radius - 5);
            ctx.stroke();
        }
    });
    player.draw(ctx, camera);
    drawMinimap(player, sun, planets, blackHoles);
}

function captureAndShow() {
    planetPopup.style.display = "none";
    document.getElementById("hud").style.opacity = "0";
    document.getElementById("data-overlay").style.opacity = "0";
    document.getElementById("minimap-container").style.opacity = "0";
    
    setTimeout(() => {
        draw(); 
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        ctx.font = "bold 24px Courier New";
        ctx.textAlign = "right";
        ctx.fillText(`PLANET ${pName.innerText.toUpperCase()}`, canvas.width - 40, 60);
        ctx.font = "14px Courier New";
        ctx.fillText(pDesc.innerText, canvas.width - 40, 85);
        ctx.fillText("DEVSOC SPACE EXPLORER", canvas.width - 40, 110);
        ctx.font = "10px Courier New";
        ctx.fillText(`FUEL REMAINING: ${Math.floor(currentFuel)}/${MAX_FUEL}`, canvas.width - 40, 135);

        const dataURL = canvas.toDataURL("image/png");
        previewImg.src = dataURL;
        
        canvas.toBlob(blob => {
            currentSnapshotBlob = blob;
        }, 'image/png');

        screenshotOverlay.style.display = "flex";
        
        document.getElementById("hud").style.opacity = "1";
        document.getElementById("data-overlay").style.opacity = "1";
        document.getElementById("minimap-container").style.opacity = "1";
        showToast("SNAPSHOT GENERATED");
    }, 100);
}

async function copyImageToClipboard() {
    if (!currentSnapshotBlob) {
        showToast("ERROR: NO IMAGE DATA");
        return;
    }
    try {
        const item = new ClipboardItem({ "image/png": currentSnapshotBlob });
        await navigator.clipboard.write([item]);
        showToast("IMAGE COPIED TO CLIPBOARD!");
    } catch (err) {
        console.error(err);
        showToast("CLIPBOARD ACCESS DENIED");
    }
}

function shareSocial(platform) {
    const url = window.location.href;
    const text = `🚀 I've discovered Planet ${pName.innerText} in DevSoc Space! ${pDesc.innerText}\n\nFuel remaining: ${Math.floor(currentFuel)}/${MAX_FUEL}\n\nExplore with me: ${url}\n\n#DevSoc #SpaceExploration #FuelEconomy`;
    
    if (platform === 'linkedin') {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
        showToast("PRE-FILLING LINKEDIN...");
    } else if (platform === 'instagram' || platform === 'tiktok') {
        try {
            const tempInput = document.createElement("textarea");
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            showToast("CAPTION & URL COPIED!");
        } catch(e) {}

        const target = platform === 'instagram' ? "https://www.instagram.com/" : "https://www.tiktok.com/upload";
        setTimeout(() => {
            window.open(target, '_blank');
        }, 1200);
    }
}

function closePopups() {
    screenshotOverlay.style.display = "none";
    planetPopup.style.display = "none";
    isPaused = false;
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = `planet_discovery_${pName.innerText.toLowerCase()}.png`;
    link.href = previewImg.src;
    link.click();
    showToast("LOG SAVED TO GALLERY");
}

function showToast(msg) {
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 4000);
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

// Mobile hint dismissal with localStorage
function dismissHint() {
    const hint = document.getElementById("mobile-controls-hint");
    hint.style.animation = "none";
    hint.style.opacity = "0";
    hint.style.visibility = "hidden";
    localStorage.setItem("hintDismissed", "true");
}

// Check if hint should be shown
function checkShowHint() {
    const hintDismissed = localStorage.getItem("hintDismissed");
    if (!hintDismissed && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const hint = document.getElementById("mobile-controls-hint");
        hint.style.display = "flex";
        setTimeout(() => {
            if (hint.style.visibility !== "hidden") {
                hint.style.animation = "fadeInOut 3s ease-in-out forwards";
            }
        }, 100);
    } else {
        document.getElementById("mobile-controls-hint").style.display = "none";
    }
}

// Fullscreen handling
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Enter fullscreen
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        showToast("FULLSCREEN MODE");
        
        // Haptic feedback
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        showToast("EXIT FULLSCREEN");
    }
}

// Orientation handling
function checkOrientation() {
    if (window.matchMedia("(orientation: portrait)").matches && window.innerWidth <= 768) {
        // In portrait mode, show warning
        const warning = document.getElementById("orientation-warning");
        if (warning) warning.style.display = "flex";
        isPaused = true;
    } else {
        const warning = document.getElementById("orientation-warning");
        if (warning) warning.style.display = "none";
        isPaused = false;
    }
}

function hideOrientationWarning() {
    const warning = document.getElementById("orientation-warning");
    warning.style.display = "none";
    isPaused = false;
    showToast("CONTINUING IN PORTRAIT MODE");
}

// Performance monitoring and adjustments
let frameTimes = [];
let performanceMode = false;

function monitorPerformance() {
    const now = performance.now();
    frameTimes.push(now);
    
    // Keep last 60 frame times
    if (frameTimes.length > 60) frameTimes.shift();
    
    if (frameTimes.length >= 30) {
        const avgFrameTime = (frameTimes[frameTimes.length - 1] - frameTimes[0]) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        
        // If FPS drops below 45, enable performance mode
        if (fps < 45 && !performanceMode) {
            performanceMode = true;
            enablePerformanceMode();
        } else if (fps > 55 && performanceMode) {
            performanceMode = false;
            disablePerformanceMode();
        }
    }
    
    requestAnimationFrame(monitorPerformance);
}

function enablePerformanceMode() {
    // Reduce particle count
    window.particleMultiplier = 0.3;
    
    // Reduce visual effects
    window.lowQualityMode = true;
    
    // Show badge
    const badge = document.getElementById("performance-badge");
    if (badge) badge.style.display = "block";
    
    // Hide slingshot messages for performance
    window.showSlingshotMessages = false;
    
    console.log("Performance mode enabled - reducing effects");
}

function disablePerformanceMode() {
    window.particleMultiplier = 0.6;
    window.lowQualityMode = false;
    
    const badge = document.getElementById("performance-badge");
    if (badge) badge.style.display = "none";
    
    window.showSlingshotMessages = true;
    
    console.log("Performance mode disabled");
}

// Optimized resize handler with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resize();
        checkOrientation();
    }, 100);
});

// Listen for fullscreen change events
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);

function updateFullscreenButton() {
    const btn = document.getElementById("fullscreen-btn");
    if (!btn) return;
    
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        // In fullscreen, change icon to exit
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>`;
    } else {
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>`;
    }
}

// Also update the particle creation in player.js to respect performance mode
// Add this to the particle creation section in player.js:
// if (window.particleMultiplier && Math.random() > window.particleMultiplier) { ... }

// Initialize all mobile features
function initMobileFeatures() {
    checkOrientation();
    window.addEventListener('orientationchange', () => {
        setTimeout(checkOrientation, 100);
    });
    
    // Start performance monitoring on higher-end devices only
    if (window.navigator.hardwareConcurrency > 4) {
        monitorPerformance();
    }
    
    // Set initial particle multiplier
    window.particleMultiplier = 0.6;
    window.showSlingshotMessages = true;
    window.lowQualityMode = false;
}

// Initialize everything
initAudio();
updateFuelDisplay();
checkShowHint();
initMobileFeatures(); // Initialize mobile features
updateFullscreenButton(); // Set initial fullscreen button state
window.onload = animate;
