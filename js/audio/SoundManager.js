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
    static contextRunningListeners = new Set(); // New listener set

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
        this.audioContextStateChangeHandler = this.handleAudioContextStateChange.bind(this);

        if (forceInit) {
            this.initAudioContext(true);
        }

        // Add event listener only if context is successfully created and running
        if (SoundManager.audioContext && SoundManager.audioContext.state === 'running') {
            SoundManager.audioContext.addEventListener('statechange', this.audioContextStateChangeHandler);
            console.log("SoundManager: Added statechange listener to new context.");
        } else if (SoundManager.audioContext) {
            // Attempt to add listener even if suspended, it might resume later
            try {
               SoundManager.audioContext.addEventListener('statechange', this.audioContextStateChangeHandler);
               console.log("SoundManager: Added statechange listener to suspended context.");
            } catch (e) {
               console.warn("SoundManager: Failed to add statechange listener to suspended context", e);
            }
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
                // resumeAudioContext will handle setup if successful
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
            console.log("SoundManager: New AudioContext created. State:", SoundManager.audioContext.state);
            
            // Add state change listener to detect audio context state changes
            SoundManager.audioContext.addEventListener('statechange', this.audioContextStateChangeHandler);
            
            this.initSoundTemplates();

            // Handle initial state after creation
            if (SoundManager.audioContext.state === 'running') {
                 console.log("SoundManager: Context started running immediately.");
                 this.playSilentSound();
            } else if (fromUserGesture && SoundManager.audioContext.state === 'suspended') {
                // Attempt resume; setup will happen inside resumeAudioContext if successful
                console.log("SoundManager: Context suspended after creation, attempting resume.");
                this.resumeAudioContext().then(resumed => {
                    if (resumed) this.playSilentSound();
                });
            }

            return true;
        } catch (e) {
            console.error("Failed to initialize audio context:", e);
            SoundManager.audioContext = null;
            return false;
        }
    }

    /**
     * Handle audio context state changes
     * @param {Event} event - The state change event
     */
    handleAudioContextStateChange(event) {
        const context = event.target;
        console.log("Audio context state changed to:", context.state);

        // Notify listeners when context becomes running
        if (context.state === 'running') {
            // Notify specific listeners that the context is now running
            for (const listener of SoundManager.contextRunningListeners) {
                try {
                    listener(); // Call the listener function
                } catch (e) {
                    console.error("Error in contextRunning listener:", e);
                }
            }
        }

        // If the context is suspended, it might be due to device muting
        if (context.state === 'suspended') {
            // We won't attempt automatic reinitialization here anymore
            // This is now handled by AudioManager which waits for user interaction
            if (document.visibilityState === 'visible') {
                console.log("SoundManager: Context suspended during visible state - will wait for user interaction to restore");
            }
        }
    }
    
    /**
     * Register a listener for when the audio context becomes RUNNING
     * @param {Function} listener - The callback function to call
     */
    static addContextRunningListener(listener) {
        SoundManager.contextRunningListeners.add(listener);
        console.log("SoundManager: Added contextRunning listener.");
    }

    /**
     * Unregister a listener for when the audio context becomes RUNNING
     * @param {Function} listener - The callback function to remove
     */
    static removeContextRunningListener(listener) {
        SoundManager.contextRunningListeners.delete(listener);
        console.log("SoundManager: Removed contextRunning listener.");
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
            console.log("SoundManager: Attempting to resume suspended context...");
            return context.resume()
                .then(() => {
                    const isRunning = context?.state === 'running';
                    console.log("SoundManager: Resume finished. Context state:", context?.state);

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
                                    console.log("SoundManager: Context resumed after iOS wakeup. State:", context?.state);
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

        console.log(`SoundManager: Closing AudioContext (State: ${context.state})`);
        try {
            // Remove event listeners first
            if (context.removeEventListener) {
                try {
                    context.removeEventListener('statechange', this.audioContextStateChangeHandler);
                    console.log("SoundManager: Removed statechange listener.");
                } catch (e) {
                    // Ignore errors from removal
                }
            }
            
            if (this.silentNode) {
                try {
                    this.silentNode.disconnect();
                } catch (e) { /* Ignore */ }
                this.silentNode = null;
            }

            if (context.state !== 'closed') {
                context.close().then(() => {
                    console.log("SoundManager: AudioContext closed successfully.");
                }).catch(e => {
                    console.warn("SoundManager: Error during context.close():", e);
                });
            } else {
                 console.log("SoundManager: Context was already closed.");
            }

            SoundManager.audioContext = null;
            SoundManager.hasPlayedAudio = false; // Reset this flag too
            // MusicManager gain nodes are reset in AudioManager::handleGameStart
        } catch (e) {
            console.warn("Error closing audio context:", e);
            // Ensure context is nulled even if error occurs during cleanup
            SoundManager.audioContext = null;
            SoundManager.hasPlayedAudio = false;
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
        // Use templates from the external SOUND_TEMPLATES global
        if (window.SOUND_TEMPLATES) {
            this.soundTemplates = window.SOUND_TEMPLATES;
        } else {
            console.error('SoundManager: SOUND_TEMPLATES not found. Make sure SoundTemplates.js is loaded before SoundManager.js');
            // Fallback - create an empty object to prevent errors
            this.soundTemplates = {};
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundType - The type of sound to play (must exist in soundTemplates)
     * @param {number} volume - Volume multiplier (0-1)
     * @returns {boolean} Success status (indicates if playback was initiated, not necessarily completed)
     */
    playSound(soundType, volume = 1) {
        // Skip if sound disabled or templates not available or device muted
        if (!this.isSoundEnabled() ||
            !SoundManager.hasUserInteraction ||
            !this.soundTemplates ||
            !this.soundTemplates[soundType]) {
             console.log(`SoundManager: PlaySound skipped. Enabled: ${this.isSoundEnabled()}, Interaction: ${SoundManager.hasUserInteraction}, Template: ${!!this.soundTemplates[soundType]}`);
            return false;
        }

        // Ensure audio context exists and try to initialize if not
        // Note: initAudioContext might need a user gesture context for the *very first* init.
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
             console.log("SoundManager: PlaySound attempting context init.");
            if (!this.initAudioContext(true)) { // Attempt init, best effort
                 console.warn("SoundManager: PlaySound failed to initialize context.");
                return false;
            }
        }

        const context = SoundManager.audioContext; // Get context reference after potential init

        // Handle suspended context - try to resume asynchronously
        if (context?.state === 'suspended') {
             console.log("SoundManager: PlaySound detected suspended context, attempting resume.");
             // Asynchronously resume and play if successful
             this.resumeAudioContext().then(resumed => {
                 // Important: Check context state *again* after promise resolves
                 if (resumed && SoundManager.audioContext?.state === 'running') {
                     console.log("SoundManager: Context resumed, playing sound asynchronously.");
                     this._createAndPlaySound(soundType, volume);
                 } else {
                     console.warn(`SoundManager: Context not running after resume attempt (State: ${SoundManager.audioContext?.state}). Sound skipped.`);
                 }
             });
             // Return false immediately because playback is deferred/not guaranteed
             return false;
        }

        // Play immediately if running
        if (context?.state === 'running') {
            // console.log("SoundManager: Context running, playing sound immediately."); // Reduce log noise
            this._createAndPlaySound(soundType, volume);
            return true; // Sound was successfully initiated
        }

        // If context exists but is not running or suspended (e.g., 'interrupted'?), log and fail.
        console.warn(`SoundManager: PlaySound context in unexpected state: ${context?.state}. Sound skipped.`);
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
        return this.playSequence('highscoreFanfare');
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

    /**
     * Reinitialize audio system after returning from suspension (PWA switch)
     * Forces a complete refresh of the audio context and state
     * @returns {Promise<boolean>} Whether the reinitialization was successful
     */
    async reinitializeAudio() {
        console.log("SoundManager: Performing audio context reinitialization for PWA switch");
        
        // Store whether we previously had user interaction
        const hadInteraction = SoundManager.hasUserInteraction;
        
        // Always close the previous context when the page becomes visible again
        if (SoundManager.audioContext) {
            try {
                // Remove any existing listeners 
                if (SoundManager.audioContext.removeEventListener) {
                    try {
                        SoundManager.audioContext.removeEventListener('statechange', this.audioContextStateChangeHandler);
                    } catch (e) {
                        // Ignore errors from removal
                    }
                }
                
                // Close the context regardless of its state to avoid issues with forcible stops
                try {
                    console.log(`SoundManager: Closing previous audio context (state: ${SoundManager.audioContext.state})`);
                    await SoundManager.audioContext.close();
                } catch (e) {
                    console.warn("SoundManager: Error closing audio context:", e);
                }
                
                // Set to null to ensure we create a new one
                SoundManager.audioContext = null;
                
                // Reset the gain nodes references
                this.silentNode = null;
                MusicManager.masterGain = null;
                MusicManager.melodyGain = null;
            } catch (e) {
                console.warn("SoundManager: Error cleaning up old context:", e);
            }
        }
        
        // Don't create a new context yet - wait for user interaction
        // Just mark that we need one, and it will be created on next interaction
        SoundManager.hasUserInteraction = hadInteraction;
        
        // We'll return true to indicate the cleanup was successful, 
        // but actual audio context creation will happen on user interaction
        return Promise.resolve(true);
    }

    /**
     * Synchronously attempts to resume the AudioContext if it exists and is suspended.
     * This is intended to be called directly within a user gesture handler (e.g., click/touch)
     * to satisfy browser autoplay policies, especially on mobile.
     * IMPORTANT: This calls instance methods, ensure getInstance() is called first if needed.
     * @returns {boolean} True if context is running OR if a synchronous resume/unlock attempt was successfully EXECUTED, false otherwise.
     */
    static tryUnlockAudioSync() {
        const instance = SoundManager.getInstance(); // Get instance
        if (!instance) {
            console.warn("SoundManager: Cannot attempt sync unlock, instance not available.");
            return false;
        }

        let contextJustCreatedAndRunning = false;

        // 1. Attempt to initialize context if it doesn't exist or is closed
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            console.log("SoundManager: Context is null or closed, attempting synchronous init...");
            try {
                instance.initAudioContext(true);
                console.log(`SoundManager: Synchronous init attempted. Context state after init: ${SoundManager.audioContext?.state}`);
                contextJustCreatedAndRunning = !!SoundManager.audioContext && SoundManager.audioContext.state === 'running';
            } catch (e) {
                console.error("SoundManager: Error during synchronous initAudioContext:", e);
            }
        }

        // 2. Check state and attempt resume / ensure silent sound played
        const context = SoundManager.audioContext; // Re-fetch context after potential init
        if (context && context.state === 'suspended') {
            console.log("SoundManager: Synchronously attempting to resume context and play silent sound...");
            try {
                context.resume(); // Fire-and-forget synchronous call
                console.log("SoundManager: Synchronous resume() called.");
                instance.playSilentSound(); // Immediately play silent sound after resuming
                console.log("SoundManager: Synchronous playSilentSound() called after resume attempt.");
                // Return TRUE because the synchronous actions required by browser were performed.
                // The state check will happen later in the calling function (_tryStartMusic).
                return true;
            } catch (e) {
                console.warn("SoundManager: Error during synchronous resume/playSilentSound attempt:", e);
                return false; // Return false if the attempt itself failed
            }
        } else if (context && context.state === 'running') {
             // If context is running, ensure silent sound is played (unless just created and running)
             if (!contextJustCreatedAndRunning) {
                  console.log("SoundManager: Context already running, ensuring silent sound played synchronously (for existing context).");
                  instance.playSilentSound();
             }
             return true; // Indicate context is ready
        } else {
             console.log(`SoundManager: Skipping synchronous action. Context state: ${context?.state}`);
             return false; // Context not ready (null, closed, interrupted)
        }
    }

    /**
     * Play a sound sequence from templates
     * @param {string} sequenceName - The name of the sequence in templates.sequences
     * @returns {boolean} Success status (indicates if playback was initiated)
     */
    playSequence(sequenceName) {
        if (!SoundManager.hasUserInteraction ||
            !this.isSoundEnabled()) {
            return false;
        }

        // Ensure audio context exists and try to initialize if not
        if (!SoundManager.audioContext || SoundManager.audioContext.state === 'closed') {
            console.log("SoundManager: PlaySequence attempting context init.");
            if (!this.initAudioContext(true)) {
                console.warn("SoundManager: PlaySequence failed to initialize context.");
                return false;
            }
        }

        const context = SoundManager.audioContext;

        // Handle suspended context - try to resume asynchronously
        if (context?.state === 'suspended') {
            console.log("SoundManager: PlaySequence detected suspended context, attempting resume.");
            // Asynchronously resume and play if successful
            this.resumeAudioContext().then(resumed => {
                if (resumed && SoundManager.audioContext?.state === 'running') {
                    console.log("SoundManager: Context resumed, playing sequence asynchronously.");
                    this._playSequenceImpl(sequenceName);
                } else {
                    console.warn(`SoundManager: Context not running after resume attempt. Sequence skipped.`);
                }
            });
            return false;
        }

        // Play immediately if running
        if (context?.state === 'running') {
            this._playSequenceImpl(sequenceName);
            return true;
        }

        // If context exists but is not running or suspended, log and fail
        console.warn(`SoundManager: PlaySequence context in unexpected state: ${context?.state}. Sequence skipped.`);
        return false;
    }

    /**
     * Internal implementation of sequence playback
     * @param {string} sequenceName - The name of the sequence to play
     * @private
     */
    _playSequenceImpl(sequenceName) {
        // Get the sequence template
        const sequenceTemplate = this.soundTemplates?.sequences?.[sequenceName];
        if (!sequenceTemplate) {
            console.warn(`SoundManager: Sequence template '${sequenceName}' not found`);
            return;
        }

        const context = SoundManager.audioContext;
        if (!context || context.state !== 'running') return;

        const now = context.currentTime;
        
        // Play each note in the sequence
        for (const note of sequenceTemplate.notes) {
            try {
                const osc = context.createOscillator();
                const gain = context.createGain();

                osc.type = note.type || sequenceTemplate.type;
                osc.frequency.value = note.freq;

                gain.gain.setValueAtTime(0, now + note.time);
                gain.gain.linearRampToValueAtTime(note.volume, now + note.time + 0.05);
                gain.gain.setValueAtTime(note.volume, now + note.time + note.duration - 0.05);
                gain.gain.linearRampToValueAtTime(0, now + note.time + note.duration);

                osc.connect(gain);
                gain.connect(context.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.duration);

                // Mark that audio has played successfully
                SoundManager.hasPlayedAudio = true;
            } catch (e) {
                console.warn('Error playing sequence note:', e);
            }
        }
    }
}

// Export SoundManager as a global variable
window.SoundManager = SoundManager;

