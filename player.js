class Player {
    constructor(x, y) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.radius = 10; this.direction = 0;
        this.controls = new Controls();
        this.particles = [];
        this.thrust = 0;
        this.landedOn = null; 
        this.slingshotMessage = "";
        this.slingshotTimer = 0;
    }

    update(planets, sun) {
        if (isPaused) return;

        const currentSpeed = Math.hypot(this.vx, this.vy);
        const dx = this.controls.mouse.x - canvas.width / 2;
        const dy = this.controls.mouse.y - canvas.height / 2;
        const dist = Math.hypot(dx, dy);
        this.direction = Math.atan2(dy, dx);

        if (this.controls.isTouching() && currentFuel > 0) {
            this.thrust = Math.min(dist / MAX_THRUST_DIST, 1);
            const force = this.thrust * MAX_THRUST_FORCE;
            
            const fuelCost = this.thrust * FUEL_CONSUMPTION_RATE;
            if (consumeFuel(fuelCost)) {
                this.vx += Math.cos(this.direction) * force;
                this.vy += Math.sin(this.direction) * force;
                playSound('thrust');
            } else {
                this.thrust = 0;
            }
            
            if (this.landedOn && this.thrust > BREAKOUT_THRUST_LIMIT) {
                this.landedOn = null;
                planetPopup.style.display = "none";
                this.vx += Math.cos(this.direction) * 3.5;
                this.vy += Math.sin(this.direction) * 3.5;
            }
            
            // Reduce particle count on mobile for performance
            if (Math.random() > 0.5 && currentFuel > 0) {
                this.particles.push(new Particle(this.x, this.y, -Math.cos(this.direction)*2.5, -Math.sin(this.direction)*2.5));
            }
        } else {
            this.thrust = 0;
        }

        const bodies = [sun, ...planets];
        let claimedCount = 0;
        
        bodies.forEach(p => {
            const pdx = p.x - this.x;
            const pdy = p.y - this.y;
            const distToBody = Math.hypot(pdx, pdy);
            const angle = Math.atan2(pdy, pdx);
            const oldVel = Math.hypot(this.vx, this.vy);

            if (this.landedOn !== p) {
                const force = (G_CONSTANT * p.mass) / Math.max(distToBody * distToBody, 400);
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }
            
            const newVel = Math.hypot(this.vx, this.vy);
            if (this.landedOn !== p && p.id !== 'sun' && newVel > oldVel + 0.5 && newVel > currentSpeed + 0.5) {
                this.slingshotMessage = `⚡ GRAVITY SLINGSHOT! +${(newVel - oldVel).toFixed(1)} VEL ⚡`;
                this.slingshotTimer = 60;
                playSound('slingshot');
                showToast(this.slingshotMessage);
            }

            const minP = this.radius + p.radius;
            if (distToBody < minP) {
                const currentSpeed = Math.hypot(this.vx, this.vy);
                if (currentSpeed < LANDING_SPEED_THRESHOLD && p.id !== 'sun') {
                    if (!this.landedOn) {
                        this.landedOn = p;
                        p.hasFlag = true;
                        this.vx = 0; this.vy = 0;
                        playSound('landing');
                        showPlanetData(p);
                        checkMissionComplete();
                        
                        // Haptic feedback on landing (mobile)
                        if (window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate([100, 50, 100]);
                        }
                    }
                } else if (this.landedOn !== p) {
                    const nx = pdx / distToBody; const ny = pdy / distToBody;
                    this.x = p.x - nx * minP;
                    this.y = p.y - ny * minP;
                    const dot = this.vx * nx + this.vy * ny;
                    this.vx = (this.vx - 2 * dot * nx) * 0.3;
                    this.vy = (this.vy - 2 * dot * ny) * 0.3;
                }
            }
            if (p.hasFlag) claimedCount++;
        });
        
        for (let bh of blackHoles) {
            if (bh.applyGravity(this)) return;
        }
        
        const distToSun = Math.hypot(sun.x - this.x, sun.y - this.y);
        if (distToSun < sun.radius + this.radius && gameActive) {
            gameActive = false;
            isPaused = true;
            playSound('blackhole');
            const visited = planets.filter(p => p.hasFlag).length;
            document.getElementById("game-over-title").innerHTML = "☀️ INCINERATED ☀️";
            document.getElementById("game-over-message").innerHTML = "Your ship was destroyed by solar radiation.\nToo close to the star!";
            document.getElementById("planets-visited").innerHTML = `Planets visited: ${visited}/9`;
            document.getElementById("game-over").style.display = "block";
            showToast("CRITICAL: SOLAR INCINERATION");
            
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate([200, 100, 200]);
            }
            return;
        }

        if (this.landedOn) {
            const p = this.landedOn;
            const angleToBody = Math.atan2(this.y - p.y, this.x - p.x);
            const surfaceDist = p.radius + this.radius;
            this.x = p.x + Math.cos(angleToBody) * surfaceDist;
            this.y = p.y + Math.sin(angleToBody) * surfaceDist;
        } else {
            this.x += this.vx;
            this.y += this.vy;
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > TERMINAL_VELOCITY) {
                this.vx *= 0.98; this.vy *= 0.98;
            }
        }

        // Limit particles for mobile performance
        if (this.particles.length > 100) {
            this.particles = this.particles.slice(-80);
        }
        
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        if (this.slingshotTimer > 0) {
            this.slingshotTimer--;
        } else {
            this.slingshotMessage = "";
        }

        const currentSpeedVal = Math.hypot(this.vx, this.vy);
        document.getElementById("vel").innerText = currentSpeedVal.toFixed(1);
        document.getElementById("power").innerText = this.thrust > 0 && currentFuel > 0 ? Math.round(this.thrust * 100) + "%" : "0%";
        document.getElementById("coord").innerText = `${Math.floor(this.x)},${Math.floor(this.y)}`;
        document.getElementById("bodies-count").innerText = `${claimedCount} / 9`;
    }

    draw(ctx, camera) {
        this.particles.forEach(p => p.draw(ctx, camera));
        const shipScreenX = canvas.width / 2;
        const shipScreenY = canvas.height / 2;

        if (this.controls.isTouching() && !isPaused && gameActive && currentFuel > 0) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.moveTo(shipScreenX, shipScreenY);
            ctx.lineTo(this.controls.mouse.x, this.controls.mouse.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = "#0ff";
            ctx.beginPath();
            ctx.arc(this.controls.mouse.x, this.controls.mouse.y, 5 + Math.sin(Date.now()*0.01)*2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(shipScreenX, shipScreenY, MAX_THRUST_DIST * this.thrust, 0, Math.PI * 2);
            ctx.stroke();
        }

        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > 0.1) {
            ctx.strokeStyle = "#4da6ff";
            ctx.lineWidth = Math.max(1, window.innerWidth / 500); // Scale line width
            ctx.beginPath();
            ctx.moveTo(shipScreenX, shipScreenY);
            const vectorScale = Math.min(8, window.innerWidth / 60);
            ctx.lineTo(shipScreenX + this.vx * vectorScale, shipScreenY + this.vy * vectorScale);
            ctx.stroke();
            
            const vAngle = Math.atan2(this.vy, this.vx);
            ctx.save();
            ctx.translate(shipScreenX + this.vx * vectorScale, shipScreenY + this.vy * vectorScale);
            ctx.rotate(vAngle);
            ctx.fillStyle = "#4da6ff";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-6, -3);
            ctx.lineTo(-6, 3);
            ctx.fill();
            ctx.restore();
            ctx.lineWidth = 1;
        }

        if (this.slingshotMessage && this.slingshotTimer > 0) {
            ctx.font = `bold ${Math.max(10, Math.min(14, window.innerWidth / 40))}px 'Courier New'`;
            ctx.fillStyle = "#ffaa44";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#ffaa44";
            const textWidth = ctx.measureText(this.slingshotMessage).width;
            ctx.fillText(this.slingshotMessage, shipScreenX - textWidth / 2, shipScreenY - 50);
            ctx.shadowBlur = 0;
        }

        // Adjust UI elements size based on screen size
        const ringRadius = Math.min(25, window.innerWidth / 20);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.arc(shipScreenX, shipScreenY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#0ff";
        ctx.beginPath();
        ctx.arc(shipScreenX + Math.cos(this.direction) * ringRadius, shipScreenY + Math.sin(this.direction) * ringRadius, 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(shipScreenX, shipScreenY);
        ctx.rotate(this.direction + Math.PI / 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.max(1, window.innerWidth / 600);
        ctx.beginPath();
        ctx.arc(0, 0, 8, Math.PI, 0); 
        ctx.lineTo(8, 10); ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.stroke();
        
        if (currentFuel <= 0) {
            ctx.fillStyle = "#ff4444";
        } else if (this.thrust > 0) {
            ctx.fillStyle = "#0ff";
        } else if (this.landedOn) {
            ctx.fillStyle = "#0f0";
        } else {
            ctx.fillStyle = "#333";
        }
        ctx.fillRect(-2, 4, 4, 4);
        ctx.restore();
        
        if (currentFuel < 200 && currentFuel > 0 && !this.landedOn) {
            ctx.font = `bold ${Math.max(10, Math.min(12, window.innerWidth / 50))}px 'Courier New'`;
            ctx.fillStyle = "#ff4444";
            ctx.fillText("⚠️ LOW FUEL", shipScreenX - 45, shipScreenY - 70);
        }
    }
}