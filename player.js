class Player {
    constructor(x, y) {

        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.radius = 10; this.direction = 0;
        this.controls = new Controls();
        this.particles = [];
        this.thrust = 0;
        this.landedOn = null; 
        
    }

    update(planets, sun) {
        if (isPaused) return;

        const dx = this.controls.mouse.x - canvas.width / 2;
        const dy = this.controls.mouse.y - canvas.height / 2;
        const dist = Math.hypot(dx, dy);
        this.direction = Math.atan2(dy, dx);

        if (this.controls.mouse.isDown) {
            this.thrust = Math.min(dist / MAX_THRUST_DIST, 1);
            const force = this.thrust * MAX_THRUST_FORCE;
            
            this.vx += Math.cos(this.direction) * force;
            this.vy += Math.sin(this.direction) * force;
            
            if (this.landedOn && this.thrust > BREAKOUT_THRUST_LIMIT) {
                this.landedOn = null;
                planetPopup.style.display = "none";
                this.vx += Math.cos(this.direction) * 3.5;
                this.vy += Math.sin(this.direction) * 3.5;
            }
            
            if (Math.random() > 0.4) {
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

            if (this.landedOn !== p) {
                const force = (G_CONSTANT * p.mass) / Math.max(distToBody * distToBody, 400);
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }

            const minP = this.radius + p.radius;
            if (distToBody < minP) {
                const currentSpeed = Math.hypot(this.vx, this.vy);
                if (currentSpeed < LANDING_SPEED_THRESHOLD && p.id !== 'sun') {
                    if (!this.landedOn) {
                        this.landedOn = p;
                        p.hasFlag = true;
                        this.vx = 0; this.vy = 0;
                        showPlanetData(p);
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

        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        const currentSpeedVal = Math.hypot(this.vx, this.vy);
        document.getElementById("vel").innerText = currentSpeedVal.toFixed(1);
        document.getElementById("power").innerText = Math.round(this.thrust * 100) + "%";
        document.getElementById("coord").innerText = `${Math.floor(this.x)},${Math.floor(this.y)}`;
        document.getElementById("bodies-count").innerText = `${claimedCount} / 9`;
    }

    draw(ctx, camera) {
        this.particles.forEach(p => p.draw(ctx, camera));
        const shipScreenX = canvas.width / 2;
        const shipScreenY = canvas.height / 2;

        // Visual Guidance System (Interaction Overlay)
        if (this.controls.mouse.isDown && !isPaused) {
            // Thrust Intent Vector Line (dashed)
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.moveTo(shipScreenX, shipScreenY);
            ctx.lineTo(this.controls.mouse.x, this.controls.mouse.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Target Point Circle
            ctx.strokeStyle = "#0ff";
            ctx.beginPath();
            ctx.arc(this.controls.mouse.x, this.controls.mouse.y, 5 + Math.sin(Date.now()*0.01)*2, 0, Math.PI * 2);
            ctx.stroke();

            // Magnitude Power Ring
            ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(shipScreenX, shipScreenY, MAX_THRUST_DIST * this.thrust, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Persistent Velocity Vector Line
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > 0.1) {
            ctx.strokeStyle = "#4da6ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shipScreenX, shipScreenY);
            // Length scales with velocity
            const vectorScale = 8;
            ctx.lineTo(shipScreenX + this.vx * vectorScale, shipScreenY + this.vy * vectorScale);
            ctx.stroke();
            
            // Vector Arrow Head
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

        // Direction Indicator Ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.arc(shipScreenX, shipScreenY, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#0ff";
        ctx.beginPath();
        ctx.arc(shipScreenX + Math.cos(this.direction) * 25, shipScreenY + Math.sin(this.direction) * 25, 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(shipScreenX, shipScreenY);
        ctx.rotate(this.direction + Math.PI / 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 8, Math.PI, 0); 
        ctx.lineTo(8, 10); ctx.lineTo(-8, 10);
        ctx.closePath();7
        ctx.stroke();
        ctx.fillStyle = this.thrust > 0 ? "#0ff" : (this.landedOn ? "#0f0" : "#333");
        ctx.fillRect(-2, 4, 4, 4);
        ctx.restore();
    }
}