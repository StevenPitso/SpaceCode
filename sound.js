// Audio Context Setup
let audioCtx = null;
let soundsEnabled = false;

function initAudio() {
    if (!audioCtx && window.AudioContext) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        soundsEnabled = true;
        // Resume on first user interaction
        document.body.addEventListener('click', () => {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
                showToast("🔊 SOUND ENABLED");
            }
        }, { once: true });
    }
}

function playSound(type) {
    if (!audioCtx || !soundsEnabled || audioCtx.state !== 'running') return;
    
    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    switch(type) {
        case 'thrust':
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 200;
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
            
        case 'landing':
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.type = 'sine';
            osc2.frequency.value = 440;
            gain2.gain.setValueAtTime(0.1, now);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
            osc2.start(now);
            osc2.stop(now + 0.8);
            break;
            
        case 'slingshot':
            oscillator.type = 'square';
            oscillator.frequency.value = 523.25;
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            
            const osc3 = audioCtx.createOscillator();
            const gain3 = audioCtx.createGain();
            osc3.connect(gain3);
            gain3.connect(audioCtx.destination);
            osc3.type = 'square';
            osc3.frequency.value = 659.25;
            gain3.gain.setValueAtTime(0.15, now + 0.05);
            gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc3.start(now + 0.05);
            osc3.stop(now + 0.35);
            break;
            
        case 'warning':
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            setTimeout(() => {
                if (audioCtx && soundsEnabled) {
                    const osc4 = audioCtx.createOscillator();
                    const gain4 = audioCtx.createGain();
                    osc4.connect(gain4);
                    gain4.connect(audioCtx.destination);
                    osc4.type = 'sine';
                    osc4.frequency.value = 660;
                    gain4.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gain4.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
                    osc4.start();
                    osc4.stop(audioCtx.currentTime + 0.15);
                }
            }, 200);
            break;
            
        case 'blackhole':
            oscillator.type = 'sine';
            oscillator.frequency.value = 50;
            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
            oscillator.start(now);
            oscillator.stop(now + 1.5);
            
            const oscLow = audioCtx.createOscillator();
            const gainLow = audioCtx.createGain();
            oscLow.connect(gainLow);
            gainLow.connect(audioCtx.destination);
            oscLow.type = 'sine';
            oscLow.frequency.value = 30;
            gainLow.gain.setValueAtTime(0.3, now);
            gainLow.gain.exponentialRampToValueAtTime(0.0001, now + 2);
            oscLow.start(now);
            oscLow.stop(now + 2);
            break;
            
        case 'mission_complete':
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc5 = audioCtx.createOscillator();
                const gain5 = audioCtx.createGain();
                osc5.connect(gain5);
                gain5.connect(audioCtx.destination);
                osc5.type = 'sine';
                osc5.frequency.value = freq;
                gain5.gain.setValueAtTime(0.2, now + i * 0.15);
                gain5.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.5);
                osc5.start(now + i * 0.15);
                osc5.stop(now + i * 0.15 + 0.5);
            });
            break;
            
        case 'mission_fail':
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 220;
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1);
            oscillator.start(now);
            oscillator.stop(now + 1);
            break;
    }
}