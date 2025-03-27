class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
    }

    init(forceNewContext = false) {
        // If forcing a new context, close the existing one first
        if (forceNewContext && this.audioContext) {
            try {
                // First suspend the context
                if (this.audioContext.state === 'running') {
                    this.audioContext.suspend();
                }

                // Then close it if possible
                if (this.audioContext.state !== 'closed') {
                    this.audioContext.close();
                }

                // Set to null to allow creation of a new context
                this.audioContext = null;
                this.isInitialized = false;
                console.log('Previous AudioContext closed, creating new one');
            } catch (e) {
                console.error('Error closing previous AudioContext:', e);
            }
        }

        if (this.isInitialized && !forceNewContext) return;

        // Create audio context only when needed
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Created new AudioContext, state:', this.audioContext.state);
        }

        // Resume the audio context (needed for some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully');
            }).catch(err => {
                console.error('Failed to resume AudioContext:', err);
            });
        }

        this.isInitialized = true;
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.init();
        }
        return this.audioContext;
    }

    playSound(fruitType) {
        // Initialize audio context if not already done
        if (!this.audioContext) {
            this.init();
        }

        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Create new sound nodes for each play
        let sound;
        switch (fruitType) {
            case 'apple':
                sound = this.createAppleSound();
                break;
            case 'banana':
                sound = this.createBananaSound();
                break;
            case 'orange':
                sound = this.createOrangeSound();
                break;
            case 'strawberry':
                sound = this.createStrawberrySound();
                break;
            case 'cherry':
                sound = this.createCherrySound();
                break;
            case 'crash':
                sound = this.createCrashSound();
                break;
            case 'highscore':
                sound = this.createHighScoreSound();
                break;
            default:
                return;
        }

        sound.oscillator.start();
        sound.oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createAppleSound() {
        if (!this.audioContext) this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1); // A4 note

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createBananaSound() {
        if (!this.audioContext) this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime); // E5 note
        oscillator.frequency.exponentialRampToValueAtTime(330, this.audioContext.currentTime + 0.15); // E4 note

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createOrangeSound() {
        if (!this.audioContext) this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(550, this.audioContext.currentTime); // C#5 note
        oscillator.frequency.exponentialRampToValueAtTime(275, this.audioContext.currentTime + 0.2); // C#4 note

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createStrawberrySound() {
        if (!this.audioContext) this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1100, this.audioContext.currentTime); // C#6 note
        oscillator.frequency.exponentialRampToValueAtTime(550, this.audioContext.currentTime + 0.25); // C#5 note

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createCherrySound() {
        if (!this.audioContext) this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime); // G5 note
        oscillator.frequency.exponentialRampToValueAtTime(392, this.audioContext.currentTime + 0.15); // G4 note

        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createCrashSound() {
        if (!this.audioContext) this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Create a descending "crash" sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4 note
        oscillator.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 0.3); // A1 note

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    createHighScoreSound() {
        if (!this.audioContext) this.init();

        // We'll create a multi-note triumphant fanfare
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Make it sound triumphant and celebratory
        oscillator.type = 'triangle';

        // Starting time
        const now = this.audioContext.currentTime;

        // Create an ascending victorious pattern
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6

        // Set envelope to make it sound like a fanfare
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gainNode.gain.setValueAtTime(0.4, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.25);
        gainNode.gain.setValueAtTime(0.4, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    playHighScoreFanfare() {
        if (!this.audioContext) {
            this.init();
        }

        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Simpler implementation with sequential notes that are guaranteed to play
        const now = this.audioContext.currentTime;

        // Simple rising arpeggio for victory
        this.playSimpleNote(392.00, now, 0.15, 0.5);       // G4
        this.playSimpleNote(523.25, now + 0.15, 0.15, 0.5); // C5
        this.playSimpleNote(659.25, now + 0.3, 0.15, 0.5);  // E5
        this.playSimpleNote(783.99, now + 0.45, 0.3, 0.6);  // G5

        // Final chord
        this.playSimpleNote(783.99, now + 0.8, 0.5, 0.4);   // G5
        this.playSimpleNote(987.77, now + 0.8, 0.5, 0.4);   // B5
        this.playSimpleNote(1174.66, now + 0.8, 0.5, 0.4);  // D6

        // Also play the simple sound in case the above doesn't work
        this.playSound('highscore');
    }

    playSimpleNote(frequency, startTime, duration, volume) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Use triangle for a richer sound
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        // Simplified envelope with higher volume
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
}

// Make SoundManager a global variable
window.SoundManager = SoundManager;
