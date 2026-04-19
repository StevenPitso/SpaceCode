

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const planetPopup = document.getElementById("planet-popup");
const pName = document.getElementById("planet-name");
const pDesc = document.getElementById("planet-desc");
const toast = document.getElementById("toast");
const screenshotOverlay = document.getElementById("screenshot-overlay");
const previewImg = document.getElementById("preview-img");

let isPaused = false;
let currentSnapshotBlob = null;

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
}
window.addEventListener('resize', resize);
resize();




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

function update() {
    if (isPaused) return;

    planets.forEach(p => {
        p.angle += p.speed;
        p.x = sun.x + Math.cos(p.angle) * p.orbitRadius;
        p.y = sun.y + Math.sin(p.angle) * p.orbitRadius;
    });


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
        ctx.fillStyle = "#aaa"; ctx.font = "10px Courier New"; ctx.textAlign = "center";

        ctx.fillText(b.name.toUpperCase(), x, y + b.radius + 20);
        if (b.hasFlag) {

            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath();
            ctx.moveTo(x, y - b.radius); ctx.lineTo(x, y - b.radius - 14);

                    ctx.lineTo(x + 10, y - b.radius - 10); ctx.lineTo(x, y - b.radius - 6);
                    ctx.stroke();
        }
    });
    player.draw(  ctx, camera);
}






function captureAndShow() {
    planetPopup.style.display = "none";
    document.getElementById("hud").style.opacity = "0";
    document.getElementById("data-overlay").style.opacity = "0";
    
    setTimeout(() => {
        draw(); 
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        ctx.font = "bold 24px Courier New";
        ctx.textAlign = "right";
        ctx.fillText(`PLANET ${pName.innerText.toUpperCase()}`, canvas.width - 40, 60);
        ctx.font = "14px Courier New";
        ctx.fillText(pDesc.innerText, canvas.width - 40, 85);
        ctx.fillText("DEVSOC SPACE EXPLORER", canvas.width - 40, 110);

        const dataURL = canvas.toDataURL("image/png");
        previewImg.src = dataURL;
        
        canvas.toBlob(blob => {
            currentSnapshotBlob = blob;
        }, 'image/png');

        screenshotOverlay.style.display = "flex";
        
        document.getElementById("hud").style.opacity = "1";
        document.getElementById("data-overlay").style.opacity = "1";
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
    const text = `🚀 I've discovered Planet ${pName.innerText} in DevSoc Space! ${pDesc.innerText}\n\nExplore with me: ${url}\n\n#DevSoc #SpaceExploration`;
    
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






// 

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}
window.onload = animate;
