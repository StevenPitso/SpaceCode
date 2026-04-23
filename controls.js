class Controls {
    constructor() {
        this.mouse = { x: 0, y: 0, isDown: false };
        window.addEventListener("mousemove", e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
        window.addEventListener("mousedown", () => { if(!isPaused && gameActive) this.mouse.isDown = true; });
        window.addEventListener("mouseup", () => { this.mouse.isDown = false; });
        window.addEventListener("touchstart", e => {
            if(isPaused || !gameActive) return;
            const t = e.touches[0];
            this.mouse.x = t.clientX; this.mouse.y = t.clientY;
            this.mouse.isDown = true;
        });
        window.addEventListener("touchend", () => { this.mouse.isDown = false; });
    }
}