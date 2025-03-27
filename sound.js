class SoundManager {
    constructor() {
        // Create an immediate audio context on instantiation
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Force immediate activation of audio context
            this.activateAudioContext();
        } catch (e) {
            console.error('Error creating AudioContext:', e);
            this.audioContext = null;
        }

        // Pre-create and cache basic sound nodes for faster playback
        this.soundCache = {};

        // Flag for initialization
        this.isInitialized = !!this.audioContext;
    }

    activateAudioContext() {
        if (!this.audioContext) return;

        // Force context to running state
        if (this.audioContext.state !== 'running') {
            this.audioContext.resume().catch(err => {
                console.error('Error activating AudioContext:', err);
            });
        }

        // Create a silent sound to activate the audio context immediately
        const silentOsc = this.audioContext.createOscillator();
        const silentGain = this.audioContext.createGain();
        silentGain.gain.value = 0.001; // Nearly silent
        silentOsc.connect(silentGain);
        silentGain.connect(this.audioContext.destination);
        silentOsc.start();
        silentOsc.stop(this.audioContext.currentTime + 0.001);
    }

    init(forceNewContext = false) {
        // If forcing a new context, close the existing one first
        if (forceNewContext && this.audioContext) {
            try {
                if (this.audioContext.state === 'running') {
                    this.audioContext.suspend();
                }

                if (this.audioContext.state !== 'closed') {
                    this.audioContext.close();
                }

                this.audioContext = null;
                this.isInitialized = false;
                this.soundCache = {}; // Clear sound cache
            } catch (e) {
                console.error('Error closing previous AudioContext:', e);
            }
        }

        if (this.isInitialized && !forceNewContext) return;

        // Create a new audio context
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.activateAudioContext();
                this.isInitialized = true;
            } catch (e) {
                console.error('Error creating new AudioContext:', e);
                return;
            }
        }
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.init();
        }
        return this.audioContext;
    }

    playSound(fruitType) {
        // Fast return if no audio context available
        if (!this.audioContext) {
            this.init();
            if (!this.audioContext) return; // Still no context after init
        }

        // Force wake the audio context immediately if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Create or retrieve the sound
        let sound;
        const now = this.audioContext.currentTime;

        // Use pre-cached sound or create a new one
        if (this.soundCache[fruitType]) {
            // Clone the cached nodes for reuse
            sound = this.cloneSound(this.soundCache[fruitType], now);
        } else {
            // Create a new sound
            switch (fruitType) {
                case 'apple':
                    sound = this.createAppleSound(now);
                    break;
                case 'banana':
                    sound = this.createBananaSound(now);
                    break;
                case 'orange':
                    sound = this.createOrangeSound(now);
                    break;
                case 'strawberry':
                    sound = this.createStrawberrySound(now);
                    break;
                case 'cherry':
                    sound = this.createCherrySound(now);
                    break;
                case 'crash':
                    sound = this.createCrashSound(now);
                    break;
                case 'highscore':
                    sound = this.createHighScoreSound(now);
                    break;
                case 'disappear':
                    sound = this.createDisappearSound(now);
                    break;
                default:
                    return;
            }

            // Cache the sound configuration
            this.soundCache[fruitType] = this.createCacheableSound(sound);
        }

        // Play immediately
        sound.oscillator.start(now);
        sound.oscillator.stop(now + 0.3);

        // Clean up nodes automatically after playback
        setTimeout(() => {
            try {
                sound.oscillator.disconnect();
                sound.gainNode.disconnect();
            } catch (e) {
                // Ignore errors from already disconnected nodes
            }
        }, 400);
    }

    // Create a template for caching
    createCacheableSound(sound) {
        return {
            type: sound.oscillator.type,
            frequency: sound.oscillator.frequency.value,
            gainValue: sound.gainNode.gain.value,
            envelopeSettings: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.5,
                release: 0.1
            },
            frequencyEnvelope: sound.frequencyEnvelope || null
        };
    }

    // Clone a cached sound for reuse
    cloneSound(cachedSound, startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Set basic properties
        oscillator.type = cachedSound.type;
        oscillator.frequency.value = cachedSound.frequency;

        // Apply frequency envelope if any
        if (cachedSound.frequencyEnvelope) {
            const targetFreq = cachedSound.frequencyEnvelope.targetFreq;
            const duration = cachedSound.frequencyEnvelope.duration;
            oscillator.frequency.exponentialRampToValueAtTime(targetFreq, startTime + duration);
        }

        // Apply gain envelope
        gainNode.gain.setValueAtTime(cachedSound.gainValue, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        // Connect
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createAppleSound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, startTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, startTime + 0.1); // A4 note

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 440, duration: 0.1 }
        };
    }

    createBananaSound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(660, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(330, startTime + 0.15);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 330, duration: 0.15 }
        };
    }

    createOrangeSound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(550, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(275, startTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 275, duration: 0.2 }
        };
    }

    createStrawberrySound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1100, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(550, startTime + 0.25);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 550, duration: 0.25 }
        };
    }

    createCherrySound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(784, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(392, startTime + 0.15);

        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 392, duration: 0.15 }
        };
    }

    createCrashSound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, startTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 55, duration: 0.3 }
        };
    }

    createHighScoreSound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, startTime); // C5

        // Create an ascending victorious pattern
        oscillator.frequency.setValueAtTime(523.25, startTime); // C5
        oscillator.frequency.setValueAtTime(659.25, startTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, startTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, startTime + 0.3); // C6

        // Set envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gainNode.gain.setValueAtTime(0.4, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, startTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.25);
        gainNode.gain.setValueAtTime(0.4, startTime + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createDisappearSound(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, startTime + 0.15);

        gainNode.gain.setValueAtTime(0.08, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return {
            oscillator,
            gainNode,
            frequencyEnvelope: { targetFreq: 220, duration: 0.15 }
        };
    }

    playHighScoreFanfare() {
        if (!this.audioContext) {
            this.init();
            if (!this.audioContext) return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Direct scheduling for immediate playback
        this.playSimpleNote(392.00, now, 0.15, 0.5);       // G4
        this.playSimpleNote(523.25, now + 0.15, 0.15, 0.5); // C5
        this.playSimpleNote(659.25, now + 0.3, 0.15, 0.5);  // E5
        this.playSimpleNote(783.99, now + 0.45, 0.3, 0.6);  // G5

        // Final chord
        this.playSimpleNote(783.99, now + 0.8, 0.5, 0.4);   // G5
        this.playSimpleNote(987.77, now + 0.8, 0.5, 0.4);   // B5
        this.playSimpleNote(1174.66, now + 0.8, 0.5, 0.4);  // D6
    }

    playSimpleNote(frequency, startTime, duration, volume) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        // Automatic cleanup
        setTimeout(() => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch (e) {
                // Ignore errors from already disconnected nodes
            }
        }, (startTime + duration - this.audioContext.currentTime) * 1000 + 100);
    }
}

// Make SoundManager a global variable
window.SoundManager = SoundManager;
