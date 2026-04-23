class Particle {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y;
        this.vx = vx * 0.4 + (Math.random()-0.5);
        this.vy = vy * 0.4 + (Math.random()-0.5);
        this.life = 1.0;
        this.size = 2 + Math.random() * 4;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= 0.015;
    }
    draw(ctx, camera) {
        ctx.strokeStyle = `rgba(150, 150, 180, ${this.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x - camera.x, this.y - camera.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
    }
}