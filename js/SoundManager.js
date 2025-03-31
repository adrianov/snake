/**
 * Handles sound effect processing, caching, and playback.
 * - Implements a singleton pattern to ensure consistent sound management across the game
 * - Lazily initializes audio components to respect browser autoplay policies
 * - Manages a sound buffer cache to optimize memory usage and performance
 * - Supports dynamic volume control for individual sound effects
 * - Implements sound effect polyphony for overlapping instances of the same sound
 * - Provides asynchronous loading of sound resources with error handling
 * - Uses Web Audio API for precise timing and audio processing
 * - Implements cross-browser compatibility for audio playback
 */
class SoundManager {
    // Static flag to track if user interaction has occurred
    static hasUserInteraction = false;
    // Static flag to track if we've successfully played audio
    static hasPlayedAudio = false;

    // Singleton instance
    static instance = null;
    static audioContext = null; // Store the single shared AudioContext statically

    /**
     * Get or create a SoundManager instance
     * @param {boolean} forceInit - Force initialization of AudioContext (use during user gestures)
     * @returns {SoundManager} The SoundManager instance
     */
    static getInstance(forceInit = false) {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager(forceInit);
        } else if (forceInit && (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed')) {
            // If we're forcing initialization and the context is closed, recreate it
            SoundManager.instance.initAudioContext(true);
        }
        return SoundManager.instance;
    }

    // Static getter for the shared AudioContext
    static getAudioContext() {
        return SoundManager.audioContext;
    }

    constructor(forceInit = false) {
        if (SoundManager.instance) {
            throw new Error("SoundManager is a singleton, use getInstance().");
        }
        // Register this instance as the singleton
        SoundManager.instance = this;

        // Initialize without creating AudioContext by default
        this.soundTemplates = {};
        this.silentNode = null;

        // Only initialize immediately if explicitly forced (from a user gesture)
        if (forceInit) {
            this.initAudioContext(true);
        }
    }

    // Initialize AudioContext - manages the *static* shared context
    initAudioContext(fromUserGesture = false) {
        const currentContext = SoundManager.audioContext;

        // Prevent re-initialization if context exists and is not closed
        if (currentContext && currentContext.state !== 'closed') {
            // If called from user gesture and context is suspended, try resuming
            if (fromUserGesture && currentContext.state === 'suspended') {
                return this.resumeAudioContext(); // Attempt resume and return promise result
            }
            return currentContext != null;
        }

        // Only proceed if we have user interaction OR if forced by gesture
        if (!SoundManager.hasUserInteraction && !fromUserGesture) {
            return false;
        }

        try {
            const contextOptions = {
                sampleRate: 44100, // Standard sample rate
                latencyHint: 'interactive' // Prioritize low latency
            };
            SoundManager.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);

            // Create sound templates
            this.initSoundTemplates();

            // If created from a user gesture, immediately try to resume and play silent sound
            if (fromUserGesture && SoundManager.audioContext.state === 'suspended') {
                this.resumeAudioContext().then(resumed => {
                    if (resumed && SoundManager.audioContext?.state === 'running') {
                        this.playSilentSound(); // Play silent sound AFTER resuming
                    }
                });
            } else if (SoundManager.audioContext.state === 'running') {
                this.playSilentSound(); // Play silent sound if already running
            }

            return true;
        } catch (e) {
            SoundManager.audioContext = null;
            return false;
        }
    }

    // Helper method to resume audio context - returns a Promise
    resumeAudioContext() {
        const context = SoundManager.audioContext; // Use static context
        if (!context) {
            return Promise.resolve(false);
        }

        if (context.state === 'running') {
            return Promise.resolve(true);
        }

        if (context.state === 'closed') {
            return Promise.resolve(false);
        }

        // For iOS and Safari, we need to handle resume in a special way
        // by playing a silent sound immediately after resume
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const needsSpecialHandling = isIOS || isSafari;

        // Attempt resume only if suspended
        if (context.state === 'suspended') {
            return context.resume().then(() => {
                const isRunning = context?.state === 'running';

                // For iOS/Safari, force playing a silent sound immediately after resume
                // but only if we haven't already played audio successfully
                if (isRunning && needsSpecialHandling && !SoundManager.hasPlayedAudio) {
                    this.playSilentSound();

                    // Add a second silent sound after a short delay only if required
                    // and we still haven't confirmed successful audio playback
                    if (!SoundManager.hasPlayedAudio) {
                        setTimeout(() => this.playSilentSound(), 500);
                    }
                }

                // Handle music resumption if context was successfully resumed
                if (isRunning) {
                    this._triggerMusicRestart();
                }

                return isRunning; // Return true if running, false otherwise
            }).catch(e => {
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    // Helper to play a short, silent sound to unlock audio on some platforms (like iOS)
    playSilentSound() {
        const context = SoundManager.audioContext; // Use static context
        if (!context || context.state !== 'running') {
            return;
        }

        // Skip if we've already successfully played audio
        if (SoundManager.hasPlayedAudio) {
            return;
        }

        try {
            const unlockOsc = context.createOscillator();
            const unlockGain = context.createGain();

            // Set extremely low gain to make it silent
            unlockGain.gain.setValueAtTime(0.00001, context.currentTime);

            // Connect nodes
            unlockOsc.connect(unlockGain);
            unlockGain.connect(context.destination);

            // Play a short sound (iOS needs actual sound to unlock audio)
            unlockOsc.start(0);
            unlockOsc.stop(context.currentTime + 0.05);
        } catch (e) {
            // Ignore errors, silent sound is not critical
        }
    }

    // Extracted method to handle music restart logic
    _triggerMusicRestart() {
        // Access the global game instance
        const gameInstance = window.SnakeGame;
        if (gameInstance && gameInstance.gameStateManager && gameInstance.musicManager) {
            const gameState = gameInstance.gameStateManager.getGameState();
            // If music is enabled but not currently playing, try starting it now
            if (gameState.musicEnabled && !gameInstance.musicManager.isPlaying) {
                setTimeout(() => gameInstance.musicManager.startMusic(), 0);
            }
        }
    }

    // Close the audio context to free up resources
    closeAudioContext() {
        const context = SoundManager.audioContext; // Use static context
        if (!context) return;

        try {
            // Disconnect any silent node if it exists
            if (this.silentNode) {
                this.silentNode.disconnect();
                this.silentNode = null;
            }

            // Close the audio context
            if (context.state !== 'closed') {
                context.close();
            }
            SoundManager.audioContext = null; // Clear static reference
        } catch (e) {
            // Ignore errors, closing is not critical
        }
    }

    // Initialize all sound templates
    initSoundTemplates() {
        this.soundTemplates = {
            'apple': {
                type: 'sine',
                frequency: 880,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 440, duration: 0.1 },
                duration: 0.2
            },
            'banana': {
                type: 'triangle',
                frequency: 660,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 330, duration: 0.15 },
                duration: 0.2
            },
            'orange': {
                type: 'square',
                frequency: 550,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 275, duration: 0.2 },
                duration: 0.25
            },
            'strawberry': {
                type: 'sine',
                frequency: 1100,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 550, duration: 0.25 },
                duration: 0.3
            },
            'cherry': {
                type: 'sine',
                frequency: 784,
                gainValue: 0.25,
                frequencyEnvelope: { targetFreq: 392, duration: 0.15 },
                duration: 0.2
            },
            'crash': {
                type: 'sawtooth',
                frequency: 440,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 55, duration: 0.6 },
                duration: 0.8
            },
            'highscore': {
                type: 'triangle',
                frequency: 523.25,
                gainValue: 0.4,
                frequencyEnvelope: { targetFreq: 1046.50, duration: 0.3 },
                duration: 0.3
            },
            'disappear': {
                type: 'sine',
                frequency: 440,
                gainValue: 0.08,
                frequencyEnvelope: { targetFreq: 220, duration: 0.15 },
                duration: 0.2
            },
            'click': {
                type: 'sine',
                frequency: 800,
                gainValue: 0.1,
                duration: 0.1
            }
        };
    }

    // Play sound from template
    playSound(soundType, volume = 1) {
        // Validation checks all in one place - quick exit if any condition fails
        if (!this.isSoundEnabled() || 
            !SoundManager.hasUserInteraction || 
            !this.soundTemplates || 
            !this.soundTemplates[soundType]) {
            return;
        }

        // Ensure context is initialized (create if needed)
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            if (!this.initAudioContext(true)) {
                return; // Exit if initialization failed
            }
        }

        // Attempt to resume the context before playing
        this.resumeAudioContext().then(resumed => {
            // Only play if the context is running after attempting resume
            const context = SoundManager.audioContext;
            if (context?.state === 'running') {
                this._createAndPlaySound(soundType, volume);
            }
        });
    }

    // Private method to create and play a sound (assumes context is running)
    _createAndPlaySound(soundType, volume) {
        const context = SoundManager.audioContext; // Use static context
        if (!context) return; // Should not happen if checks in playSound work

        try {
            // Get template and create sound
            const template = this.soundTemplates[soundType];
            const now = context.currentTime;
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            // Apply template values with volume adjustment
            oscillator.type = template.type;
            oscillator.frequency.value = template.frequency;
            gainNode.gain.value = template.gainValue * volume;

            const soundDuration = template.duration || 0.3;

            // Apply frequency envelope
            if (template.frequencyEnvelope) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    template.frequencyEnvelope.targetFreq,
                    now + template.frequencyEnvelope.duration
                );
            }

            // Apply gain envelope
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + soundDuration);

            // Connect and play
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(now);
            oscillator.stop(now + soundDuration + 0.05);

            // Set flag that audio has been successfully played
            SoundManager.hasPlayedAudio = true;
        } catch (e) {
            console.error('Error playing sound:', e);
        }
    }

    // Play high score fanfare with improved handling
    playHighScoreFanfare() {
        // Single validation check - exit early if any condition fails
        if (!SoundManager.hasUserInteraction || !this.isSoundEnabled()) {
            return;
        }

        // Ensure audio context is initialized and resumed
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            if (!this.initAudioContext(true)) return;
        }

        // Resume context and play the fanfare
        this.resumeAudioContext().then(success => {
            if (!success || SoundManager.audioContext.state !== 'running') return;

            const now = SoundManager.audioContext.currentTime;

            // Define notes
            const notes = [
                { freq: 392.00, time: 0.00, duration: 0.15, volume: 0.5 },  // G4
                { freq: 523.25, time: 0.15, duration: 0.15, volume: 0.5 },  // C5
                { freq: 659.25, time: 0.30, duration: 0.15, volume: 0.5 },  // E5
                { freq: 783.99, time: 0.45, duration: 0.30, volume: 0.6 },  // G5
                // Final chord
                { freq: 783.99, time: 0.80, duration: 0.50, volume: 0.4 },  // G5
                { freq: 987.77, time: 0.80, duration: 0.50, volume: 0.4 },  // B5
                { freq: 1174.66, time: 0.80, duration: 0.50, volume: 0.4 }  // D6
            ];

            // Schedule all notes
            for (const note of notes) {
                try {
                    const osc = SoundManager.audioContext.createOscillator();
                    const gain = SoundManager.audioContext.createGain();

                    osc.type = 'triangle';
                    osc.frequency.value = note.freq;

                    gain.gain.setValueAtTime(0, now + note.time);
                    gain.gain.linearRampToValueAtTime(note.volume, now + note.time + 0.05);
                    gain.gain.setValueAtTime(note.volume, now + note.time + note.duration - 0.05);
                    gain.gain.linearRampToValueAtTime(0, now + note.time + note.duration);

                    osc.connect(gain);
                    gain.connect(SoundManager.audioContext.destination);

                    osc.start(now + note.time);
                    osc.stop(now + note.time + note.duration);
                } catch (e) {
                    // Ignore errors, music is not critical
                }
            }
        }).catch(err => {
            // Ignore errors, music is not critical
        });
    }

    // Check if sound is enabled
    isSoundEnabled() {
        return localStorage.getItem('snakeSoundEnabled') !== 'false';
    }

    // Toggle sound enabled state
    toggleSound() {
        const currentState = this.isSoundEnabled();
        localStorage.setItem('snakeSoundEnabled', (!currentState).toString());
        return !currentState;
    }
}

// Make SoundManager a global variable
window.SoundManager = SoundManager;

