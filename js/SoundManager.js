/**
 * Handles sound effect processing, caching, and playback.
 * - Implements a singleton pattern to ensure consistent sound management across the game
 * - Manages the core Web Audio API context for the entire game
 * - Provides low-level audio initialization, resumption, and unlocking
 * - Handles cross-browser compatibility and mobile device constraints
 * - Implements sound effect creation and playback functionality
 * - Manages the audio enabled/disabled state
 */
class SoundManager {
    // Static flags and references
    static hasUserInteraction = false;
    static hasPlayedAudio = false;
    static instance = null;
    static audioContext = null;

    /**
     * Get or create the singleton SoundManager instance
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

    /**
     * Get the shared audio context
     * @returns {AudioContext|null} The shared AudioContext or null if not initialized
     */
    static getAudioContext() {
        return SoundManager.audioContext;
    }

    /**
     * Private constructor - use getInstance() instead
     * @param {boolean} forceInit - Whether to force initialization immediately
     */
    constructor(forceInit = false) {
        if (SoundManager.instance) {
            throw new Error("SoundManager is a singleton, use getInstance().");
        }

        SoundManager.instance = this;
        this.soundTemplates = {};
        this.silentNode = null;

        if (forceInit) {
            this.initAudioContext(true);
        }
    }

    /**
     * Initialize the audio context - core method for the audio system
     * @param {boolean} fromUserGesture - Whether this was called from a user gesture
     * @returns {boolean} Success status
     */
    initAudioContext(fromUserGesture = false) {
        const currentContext = SoundManager.audioContext;

        // Check if context already exists and isn't closed
        if (currentContext && currentContext.state !== 'closed') {
            if (fromUserGesture && currentContext.state === 'suspended') {
                return this.resumeAudioContext().then(resumed => resumed);
            }
            return true;
        }

        // Only proceed with valid user interaction
        if (!SoundManager.hasUserInteraction && !fromUserGesture) {
            return false;
        }

        try {
            const contextOptions = {
                sampleRate: 44100,
                latencyHint: 'interactive'
            };

            SoundManager.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
            this.initSoundTemplates();

            if (fromUserGesture && SoundManager.audioContext.state === 'suspended') {
                this.resumeAudioContext().then(resumed => {
                    if (resumed) this.playSilentSound();
                });
            } else if (SoundManager.audioContext.state === 'running') {
                this.playSilentSound();
            }

            return true;
        } catch (e) {
            console.error("Failed to initialize audio context:", e);
            SoundManager.audioContext = null;
            return false;
        }
    }

    /**
     * Resume the audio context - returns a promise
     * @returns {Promise<boolean>} Success status
     */
    resumeAudioContext() {
        const context = SoundManager.audioContext;
        if (!context) return Promise.resolve(false);

        // Fast returns for known states
        if (context.state === 'running') return Promise.resolve(true);
        if (context.state === 'closed') return Promise.resolve(false);

        // Platform detection for special handling
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const needsSpecialHandling = isMobile || isSafari;

        // Only try to resume if suspended
        if (context.state === 'suspended') {
            return context.resume()
                .then(() => {
                    const isRunning = context?.state === 'running';

                    if (isRunning) {
                        if (needsSpecialHandling && !SoundManager.hasPlayedAudio) {
                            this.playSilentSound();

                            // Second silent sound for stubborn devices
                            if (!SoundManager.hasPlayedAudio) {
                                setTimeout(() => this.playSilentSound(), 300);
                            }
                        }
                        return true;
                    } else if (isIOS) {
                        // If normal resume failed on iOS, try the forced approach
                        console.log("SoundManager: Standard resume failed on iOS, trying forced wakeup");
                        return this.forceIOSAudioWakeup();
                    }

                    return false;
                })
                .catch(e => {
                    console.warn("Error resuming audio context:", e);

                    // If there was an error and we're on iOS, try the forced approach
                    if (isIOS) {
                        console.log("SoundManager: Resume error on iOS, trying forced wakeup");
                        return this.forceIOSAudioWakeup();
                    }

                    return false;
                });
        }

        return Promise.resolve(false);
    }

    /**
     * Play a silent sound to unlock audio on mobile browsers
     */
    playSilentSound() {
        const context = SoundManager.audioContext;
        if (!context || context.state !== 'running') {
            return;
        }

        try {
            const unlockOsc = context.createOscillator();
            const unlockGain = context.createGain();

            unlockGain.gain.setValueAtTime(0.00001, context.currentTime);
            unlockOsc.connect(unlockGain);
            unlockGain.connect(context.destination);

            unlockOsc.start(0);
            unlockOsc.stop(context.currentTime + 0.05);

            // Mark that audio has been successfully played
            SoundManager.hasPlayedAudio = true;
        } catch (e) {
            console.warn("Error playing silent sound:", e);
        }
    }

    /**
     * Force iOS audio wakeup using HTML Audio fallback
     * This is a more aggressive approach for iOS devices that resist normal WebAudio resumption
     * @returns {Promise<boolean>} Whether the wakeup was successful
     */
    forceIOSAudioWakeup() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) return Promise.resolve(false);

        console.log("SoundManager: Attempting iOS-specific audio wakeup");

        return new Promise((resolve) => {
            // Create and immediately play a short, silent audio element
            try {
                const audioElement = document.createElement('audio');
                audioElement.setAttribute('src', 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
                audioElement.setAttribute('playsinline', 'true');
                audioElement.volume = 0.01;

                // Try to play - this may help wake up iOS audio system
                const playPromise = audioElement.play();

                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log("SoundManager: iOS audio element played successfully");
                        audioElement.remove();

                        // Now try to resume the audio context
                        setTimeout(() => {
                            const context = SoundManager.audioContext;
                            if (context && context.state === 'suspended') {
                                context.resume().then(() => {
                                    const success = context.state === 'running';
                                    if (success) {
                                        // Play another silent sound through WebAudio for good measure
                                        this.playSilentSound();
                                        // Mark that audio has been successfully played
                                        SoundManager.hasPlayedAudio = true;
                                    }
                                    resolve(success);
                                }).catch(() => resolve(false));
                            } else {
                                const success = context && context.state === 'running';
                                if (success) {
                                    SoundManager.hasPlayedAudio = true;
                                }
                                resolve(success);
                            }
                        }, 50);
                    }).catch(e => {
                        console.log("SoundManager: iOS audio element play failed:", e);
                        audioElement.remove();
                        resolve(false);
                    });
                } else {
                    resolve(false);
                }
            } catch (e) {
                console.error("SoundManager: Error in iOS audio wakeup:", e);
                resolve(false);
            }
        });
    }

    /**
     * Close and cleanup the audio context
     */
    closeAudioContext() {
        const context = SoundManager.audioContext;
        if (!context) return;

        try {
            if (this.silentNode) {
                this.silentNode.disconnect();
                this.silentNode = null;
            }

            if (context.state !== 'closed') {
                context.close();
            }

            SoundManager.audioContext = null;
        } catch (e) {
            console.warn("Error closing audio context:", e);
        }
    }

    /**
     * Fully initialize the audio system with a user interaction
     * @param {boolean} playClickSound - Whether to play a click sound after initialization
     * @returns {Promise<boolean>} Success status
     */
    unlockAudio(playClickSound = false) {
        // Set flag indicating user interaction
        SoundManager.hasUserInteraction = true;

        // Initialize context if needed
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            if (!this.initAudioContext(true)) {
                return Promise.resolve(false);
            }
        }

        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Resume context and unlock audio
        return this.resumeAudioContext()
            .then(resumed => {
                if (resumed) {
                    // Play a silent sound to fully engage audio system
                    this.playSilentSound();

                    if (playClickSound && !SoundManager.hasPlayedAudio) {
                        // Play click sound to fully engage audio system
                        setTimeout(() => {
                            this._createAndPlaySound('click', 0.3, true);
                        }, 50);
                    }

                    return true;
                } else if (isIOS) {
                    // If standard resume failed on iOS, try our specialized wakeup method
                    return this.forceIOSAudioWakeup().then(success => {
                        if (success && playClickSound) {
                            setTimeout(() => {
                                this._createAndPlaySound('click', 0.3, true);
                            }, 50);
                        }
                        return success;
                    });
                }

                return false;
            });
    }

    /**
     * Initialize all sound templates
     */
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

    /**
     * Play a sound effect
     * @param {string} soundType - The type of sound to play (must exist in soundTemplates)
     * @param {number} volume - Volume multiplier (0-1)
     * @returns {boolean} Success status
     */
    playSound(soundType, volume = 1) {
        // Skip if sound disabled or templates not available
        if (!this.isSoundEnabled() ||
            !SoundManager.hasUserInteraction ||
            !this.soundTemplates ||
            !this.soundTemplates[soundType]) {
            return false;
        }

        // Ensure audio context exists and is initialized
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            if (!this.initAudioContext(true)) {
                return false;
            }
        }

        // Handle suspended context
        if (SoundManager.audioContext?.state === 'suspended') {
            this.resumeAudioContext().then(resumed => {
                if (resumed) this._createAndPlaySound(soundType, volume);
            });
            return true;
        }

        // Play immediately if running
        if (SoundManager.audioContext?.state === 'running') {
            this._createAndPlaySound(soundType, volume);
            return true;
        }

        // Final fallback
        this.resumeAudioContext().then(resumed => {
            if (resumed) this._createAndPlaySound(soundType, volume);
        });

        return false;
    }

    /**
     * Create and play a sound from the templates
     * @param {string} soundType - The type of sound to play
     * @param {number} volume - Volume multiplier
     * @param {boolean} bypassSoundCheck - Whether to bypass the sound enabled check
     * @private
     */
    _createAndPlaySound(soundType, volume, bypassSoundCheck = false) {
        // Skip if sound is disabled (unless bypassing)
        if (!bypassSoundCheck && !this.isSoundEnabled()) return;

        const context = SoundManager.audioContext;
        if (!context || context.state !== 'running') return;

        try {
            const template = this.soundTemplates[soundType];
            const now = context.currentTime;
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.type = template.type;
            oscillator.frequency.value = template.frequency;
            gainNode.gain.value = template.gainValue * volume;

            const soundDuration = template.duration || 0.3;

            if (template.frequencyEnvelope) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    template.frequencyEnvelope.targetFreq,
                    now + template.frequencyEnvelope.duration
                );
            }

            gainNode.gain.exponentialRampToValueAtTime(0.001, now + soundDuration);

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(now);
            oscillator.stop(now + soundDuration + 0.05);

            // Mark that audio has played successfully
            SoundManager.hasPlayedAudio = true;
        } catch (e) {
            console.error('Error playing sound:', e);
        }
    }

    /**
     * Play a high score celebration fanfare
     */
    playHighScoreFanfare() {
        if (!SoundManager.hasUserInteraction || !this.isSoundEnabled()) {
            return;
        }

        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            if (!this.initAudioContext(true)) return;
        }

        this.resumeAudioContext().then(success => {
            if (!success || SoundManager.audioContext.state !== 'running') return;

            const now = SoundManager.audioContext.currentTime;
            const notes = [
                { freq: 392.00, time: 0.00, duration: 0.15, volume: 0.5 },  // G4
                { freq: 523.25, time: 0.15, duration: 0.15, volume: 0.5 },  // C5
                { freq: 659.25, time: 0.30, duration: 0.15, volume: 0.5 },  // E5
                { freq: 783.99, time: 0.45, duration: 0.30, volume: 0.6 },  // G5
                { freq: 783.99, time: 0.80, duration: 0.50, volume: 0.4 },  // G5
                { freq: 987.77, time: 0.80, duration: 0.50, volume: 0.4 },  // B5
                { freq: 1174.66, time: 0.80, duration: 0.50, volume: 0.4 }  // D6
            ];

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

                    // Mark that audio has played successfully
                    SoundManager.hasPlayedAudio = true;
                } catch (e) {
                    // Ignore errors, music is not critical
                }
            }
        });
    }

    /**
     * Check if sound is enabled in user preferences
     * @returns {boolean} Whether sound is enabled
     */
    isSoundEnabled() {
        return localStorage.getItem('snakeSoundEnabled') !== 'false';
    }

    /**
     * Toggle sound on/off in user preferences
     * @returns {boolean} The new sound enabled state
     */
    toggleSound() {
        const currentState = this.isSoundEnabled();
        localStorage.setItem('snakeSoundEnabled', (!currentState).toString());
        return !currentState;
    }
}

// Export SoundManager as a global variable
window.SoundManager = SoundManager;

