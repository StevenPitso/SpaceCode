class BlackHole {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.mass = 25000;
        this.glowIntensity = 0;
        this.accretionDiskAngle = 0;
    }
    
    update() {
        this.accretionDiskAngle += 0.02;
        this.glowIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
    }
    
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius);
        gradient.addColorStop(0, "#000000");
        gradient.addColorStop(0.7, "#1a0033");
        gradient.addColorStop(1, "#330066");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 3; i++) {
            const diskRadius = this.radius + 15 + i * 12;
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, diskRadius, diskRadius * 0.3, this.accretionDiskAngle + i, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 80, 255, ${0.1 - i * 0.03})`;
            ctx.fill();
        }
        
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius + 5 + i * 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff00ff";
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 255, 0.2)`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    applyGravity(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        if (dist < this.radius + player.radius) {
            if (gameActive) {
                gameActive = false;
                isPaused = true;
                playSound('blackhole');
                const visited = planets.filter(p => p.hasFlag).length;
                document.getElementById("game-over-title").innerHTML = "💀 LOST TO THE VOID 💀";
                document.getElementById("game-over-message").innerHTML = "Your ship was consumed by a black hole.\nSpaghettification complete.";
                document.getElementById("planets-visited").innerHTML = `Planets visited: ${visited}/9`;
                document.getElementById("game-over").style.display = "block";
                showToast("CRITICAL: ENTERED BLACK HOLE EVENT HORIZON");
                
                const blackholeWarning = document.getElementById("blackhole-warning");
                blackholeWarning.style.opacity = "1";
                setTimeout(() => { blackholeWarning.style.opacity = "0"; }, 2000);
            }
            return true;
        }
        
        const force = (this.mass * 0.8) / Math.max(dist * dist, 100);
        player.vx += Math.cos(angle) * force;
        player.vy += Math.sin(angle) * force;
        
        const blackholeWarning = document.getElementById("blackhole-warning");
        if (dist < this.radius * 3 && gameActive && !player.landedOn) {
            blackholeWarning.style.opacity = Math.min(1, (this.radius * 3 - dist) / this.radius);
            if (Math.random() < 0.05) playSound('warning');
        } else if (blackholeWarning.style.opacity !== "0") {
            blackholeWarning.style.opacity = "0";
        }
        
        return false;
    }
}