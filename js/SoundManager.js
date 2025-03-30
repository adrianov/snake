class SoundManager {
    // Static reference to the current instance
    static instance = null;
    
    // Flag to track if audio has been initialized by a real user action
    static audioInitialized = false;
    
    /**
     * Get or create a SoundManager instance
     * @param {boolean} forceInit - Force initialization of AudioContext (use during user gestures)
     * @returns {SoundManager} The SoundManager instance
     */
    static getInstance(forceInit = false) {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager(forceInit);
        } else if (forceInit && (!SoundManager.instance.audioContext || SoundManager.instance.audioContext.state === 'closed')) {
            // If we're forcing initialization and the context is closed, recreate it
            SoundManager.instance.initAudioContext(true);
        }
        return SoundManager.instance;
    }

    constructor(forceInit = false) {
        // Register this instance as the singleton
        SoundManager.instance = this;
        
        // Initialize without creating AudioContext by default
        this.audioContext = null;
        this.soundTemplates = null;
        
        // Only initialize immediately if explicitly forced (from a user gesture)
        if (forceInit) {
            this.initAudioContext(true);
        }
    }
    
    initAudioContext(fromUserGesture = false) {
        // Only initialize once or if we're forcing a new initialization
        if (this.audioContext && this.audioContext.state !== 'closed' && !fromUserGesture) {
            return;
        }
        
        try {
            // Clean up existing context if needed
            if (this.audioContext && this.audioContext.state !== 'closed') {
                try {
                    this.audioContext.close().catch(() => {});
                } catch (e) {
                    // Ignore errors closing context
                }
            }
            
            // Create audio context with options for best performance
            const contextOptions = {
                latencyHint: 'interactive',
                sampleRate: 44100
            };

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
            
            // Create sound templates
            this.initSoundTemplates();

            // When forced from a user gesture, resume right away and create a silent sound
            // to fully unlock audio on iOS/Safari
            if (fromUserGesture) {
                try {
                    // First try to resume the context
                    this.audioContext.resume().then(() => {
                        // After resume, play a short silent sound to fully unlock audio
                        // This is critical for iOS Safari
                        try {
                            const unlockOsc = this.audioContext.createOscillator();
                            const unlockGain = this.audioContext.createGain();
                            unlockGain.gain.value = 0.001;  // Effectively silent
                            unlockOsc.connect(unlockGain);
                            unlockGain.connect(this.audioContext.destination);
                            unlockOsc.start(0);
                            unlockOsc.stop(this.audioContext.currentTime + 0.001);
                        } catch (e) {
                            // Ignore unlock errors
                        }
                    }).catch(() => {});
                } catch (e) {
                    // Ignore errors resuming
                }
            }
            
            // Mark that audio has been properly initialized
            SoundManager.audioInitialized = true;
            
            return true;
        } catch (e) {
            console.error('Error creating AudioContext:', e);
            this.audioContext = null;
            return false;
        }
    }
    
    // Helper method to resume audio context
    resumeAudioContext() {
        // Don't try to resume if we don't have user interaction yet
        if (!SoundManager.hasUserInteraction) {
            return false;
        }
        
        if (this.audioContext && this.audioContext.state !== 'running') {
            try {
                // Wrap in a try/catch and return a promise that resolves when resumed
                return this.audioContext.resume().catch(e => {
                    console.warn('Could not resume AudioContext:', e);
                    return false;
                });
            } catch (e) {
                console.warn('Error resuming AudioContext:', e);
                return Promise.resolve(false);
            }
        }
        return Promise.resolve(true);
    }

    // Keep audio context alive with a silent node
    keepContextAlive() {
        if (!this.audioContext) return;

        // Create a silent oscillator that runs continuously
        this.silentNode = this.audioContext.createGain();
        this.silentNode.gain.value = 0; // Completely silent
        this.silentNode.connect(this.audioContext.destination);
    }

    // Close the audio context to free up resources
    closeAudioContext() {
        if (!this.audioContext) return;

        try {
            // Disconnect any silent node if it exists
            if (this.silentNode) {
                this.silentNode.disconnect();
                this.silentNode = null;
            }

            // Close the audio context
            if (this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
            this.audioContext = null;
        } catch (e) {
            console.error('Error closing audio context:', e);
        }
    }

    // Reinitialize audio context if needed
    reinitialize() {
        if (this.audioContext && this.audioContext.state !== 'closed') return;
        
        // Only initialize if we've had user interaction
        if (SoundManager.hasUserInteraction) {
            this.initAudioContext();
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
        // Check if sound is enabled in localStorage
        const soundEnabled = localStorage.getItem('snakeSoundEnabled') !== 'false';
        if (!soundEnabled) return;
        
        // Cannot play sound without AudioContext
        if (!this.audioContext) return;

        // Check if we have the requested sound template
        if (!this.soundTemplates || !this.soundTemplates[soundType]) return;

        // Try to resume the context before playing
        const resumeAndPlay = async () => {
            try {
                // In case the context is suspended, try to resume it
                if (this.audioContext.state !== 'running') {
                    await this.audioContext.resume();
                }
                
                // Only play if the context is running
                if (this.audioContext.state === 'running') {
                    this._createAndPlaySound(soundType, volume);
                }
            } catch (err) {
                // Ignore any errors during resuming
            }
        };
        
        // Start the async resume process
        resumeAndPlay();
    }
    
    // Private method to create and play a sound after context is ready
    _createAndPlaySound(soundType, volume) {
        try {
            // Get template and create sound
            const template = this.soundTemplates[soundType];
            const now = this.audioContext.currentTime;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

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
            gainNode.connect(this.audioContext.destination);
            oscillator.start(now);
            oscillator.stop(now + soundDuration + 0.05);
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    // Play high score fanfare with improved handling
    playHighScoreFanfare() {
        // Only play if we have user interaction and sound is enabled
        if (!SoundManager.hasUserInteraction || !this.isSoundEnabled()) {
            return;
        }
        
        // Ensure audio context is initialized and resumed
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.reinitialize();
            if (!this.audioContext) return;
        }
        
        // Resume context and play the fanfare
        this.resumeAudioContext().then(success => {
            if (!success || this.audioContext.state !== 'running') return;
            
            const now = this.audioContext.currentTime;

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
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();

                    osc.type = 'triangle';
                    osc.frequency.value = note.freq;

                    gain.gain.setValueAtTime(0, now + note.time);
                    gain.gain.linearRampToValueAtTime(note.volume, now + note.time + 0.05);
                    gain.gain.setValueAtTime(note.volume, now + note.time + note.duration - 0.05);
                    gain.gain.linearRampToValueAtTime(0, now + note.time + note.duration);

                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);

                    osc.start(now + note.time);
                    osc.stop(now + note.time + note.duration);
                } catch (e) {
                    console.warn('Error scheduling note:', e);
                }
            }
        }).catch(err => {
            console.warn('Error resuming AudioContext for fanfare:', err);
        });
    }

    // Check if sound is enabled
    isSoundEnabled() {
        return localStorage.getItem('snakeSoundEnabled') !== 'false';
    }

    // Set sound enabled state
    setSoundEnabled(enabled) {
        localStorage.setItem('snakeSoundEnabled', enabled.toString());
    }

    // Toggle sound enabled state
    toggleSound() {
        const currentState = this.isSoundEnabled();
        this.setSoundEnabled(!currentState);
        return !currentState;
    }
}

// Make SoundManager a global variable
window.SoundManager = SoundManager;

