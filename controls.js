class Controls {
    constructor() {
        this.mouse = { x: 0, y: 0, isDown: false };
        this.pointerId = null;
        
        // Mouse events (for desktop)
        window.addEventListener("mousemove", e => { 
            this.mouse.x = e.clientX; 
            this.mouse.y = e.clientY; 
        });
        window.addEventListener("mousedown", () => { 
            if(!isPaused && gameActive) this.mouse.isDown = true; 
        });
        window.addEventListener("mouseup", () => { 
            this.mouse.isDown = false; 
        });
        
        // Touch events (for mobile)
        window.addEventListener("touchstart", e => {
            if(isPaused || !gameActive) return;
            e.preventDefault();
            const t = e.touches[0];
            this.mouse.x = t.clientX;
            this.mouse.y = t.clientY;
            this.mouse.isDown = true;
            this.pointerId = t.identifier;
            
            // Add haptic feedback on touch start (if supported)
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        });
        
        window.addEventListener("touchmove", e => {
            if(this.mouse.isDown && !isPaused && gameActive) {
                e.preventDefault();
                const t = Array.from(e.touches).find(touch => touch.identifier === this.pointerId);
                if (t) {
                    this.mouse.x = t.clientX;
                    this.mouse.y = t.clientY;
                }
            }
        });
        
        window.addEventListener("touchend", e => {
            this.mouse.isDown = false;
            this.pointerId = null;
        });
        
        window.addEventListener("touchcancel", e => {
            this.mouse.isDown = false;
            this.pointerId = null;
        });
        
        // Prevent context menu on long press
        window.addEventListener("contextmenu", e => {
            e.preventDefault();
        });
    }
    
    // Helper to check if touch is active
    isTouching() {
        return this.mouse.isDown;
    }
}