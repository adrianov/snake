/**
 * Coordinates sound and music systems with browser audio constraints.
 * - Orchestrates communication between sound effects and music subsystems
 * - Manages global audio state (enabled/disabled, volume levels)
 * - Coordinates audio initialization across the game
 * - Provides a unified interface for triggering game audio events
 * - Maintains synchronization between audio state and user preferences
 * - Delegates core audio functionality to SoundManager
 */
class AudioManager {
    /**
     * Create a new AudioManager instance
     * @param {SnakeGame} game - The game instance
     */
    constructor(game) {
        this.game = game;
        this.pendingMusicPromise = null;
        this.isInitializing = false;
        this.lastMusicInitTime = 0;
        this.musicWasPlaying = false;

        // Add visibility change listener to handle audio resumption when browser tab is focused
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Check if audio is ready to be played
     * @returns {boolean} Whether audio is ready
     */
    isAudioReady() {
        return this.game.hasUserInteraction &&
            SoundManager.hasUserInteraction &&
            SoundManager.audioContext?.state === 'running';
    }

    /**
     * Initialize audio systems on user interaction
     */
    init() {
        // Prevent multiple simultaneous initializations
        if (this.isInitializing) {
            console.log("AudioManager: Already initializing, ignoring duplicate call");
            return;
        }

        this.isInitializing = true;

        // Set the interaction flag
        SoundManager.hasUserInteraction = true;
        console.log("AudioManager: Initializing audio with user interaction");

        // Initialize audio with force flag
        this.initializeAudio(true);

        // Ensure audio context is running and play a click sound to fully unlock audio
        this.ensureAudioContext(true, true)
            .finally(() => {
                this.isInitializing = false;
            });
    }

    /**
     * Ensure the audio context is properly initialized and running
     * @param {boolean} playClickSound - Whether to play a click sound
     * @param {boolean} force - Whether to force initialization
     * @returns {Promise<boolean>} Success status
     */
    ensureAudioContext(playClickSound = false, force = true) {
        if (!this.game.hasUserInteraction) {
            console.warn("AudioManager: Cannot ensure audio context without user interaction");
            return Promise.resolve(false);
        }

        // Use SoundManager's unlockAudio method to handle initialization and unlocking
        // This now includes iOS-specific handling through forceIOSAudioWakeup
        if (this.game.soundManager) {
            return this.game.soundManager.unlockAudio(playClickSound);
        }

        return Promise.resolve(false);
    }

    /**
     * Initialize audio subsystems
     * @param {boolean} forceInitialization - Whether to force initialization
     * @returns {boolean} Success status
     */
    initializeAudio(forceInitialization = false) {
        if (!this.game.hasUserInteraction) {
            console.warn("AudioManager: Attempted to initialize audio before user interaction");
            return false;
        }

        console.log("AudioManager: Initializing SoundManager and MusicManager contexts...");

        // Update the interaction flag
        SoundManager.hasUserInteraction = true;

        // Initialize SoundManager (if available)
        if (this.game.soundManager) {
            // Force audio context initialization
            this.game.soundManager.initAudioContext(forceInitialization);

            // For mobile devices, ensure audio is fully unlocked after a delay
            // This helps on iOS and some Android browsers
            if (!SoundManager.hasPlayedAudio) {
                setTimeout(() => {
                    if (!this.isInitializing) { // Prevent overlapping initializations
                        this.ensureAudioContext(false, true);
                    }
                }, 100);
            }
        } else {
            console.warn("AudioManager: SoundManager not available for initialization");
            return false;
        }

        // Initialize MusicManager context if needed
        MusicManager.initAudioContextIfNeeded();

        return true;
    }

    /**
     * Initialize and start game background music
     * @param {boolean} forceNewMelody - Whether to force selection of a new melody
     * @returns {Promise<boolean>} Success status
     */
    initializeGameMusic(forceNewMelody = true) {
        // Prevent rapid successive calls to music initialization to reduce race conditions
        const now = Date.now();
        if (now - this.lastMusicInitTime < 500) {
            console.log("AudioManager: Skipping music initialization due to debounce");
            return this.pendingMusicPromise || Promise.resolve(false);
        }
        this.lastMusicInitTime = now;

        // Only proceed if user interaction has happened
        if (!this.game.hasUserInteraction) {
            console.log("AudioManager: User interaction required for music initialization");
            return Promise.resolve(false);
        }

        // Only start music if it's enabled in game settings
        const gameState = this.game.gameStateManager.getGameState();
        if (!gameState.musicEnabled) {
            console.log("AudioManager: Music is disabled in game settings");
            return Promise.resolve(false);
        }

        console.log("AudioManager: Initializing game music");

        // First ensure audio context is initialized
        this.initializeAudio(true);

        // Keep track of the promise for debouncing
        this.pendingMusicPromise = this.ensureAudioContext(false, true)
            .then(success => {
                if (!success) {
                    console.log("AudioManager: Failed to ensure audio context for music");
                    return false;
                }

                // Cancel any pending cleanups to avoid conflicts
                for (const [gameInstance, timeoutId] of MusicManager.cleanupTimeouts.entries()) {
                    clearTimeout(timeoutId);
                    MusicManager.cleanupTimeouts.delete(gameInstance);
                }

                // Select a new melody if needed
                if (forceNewMelody || !MusicManager.currentMelodyId) {
                    console.log("AudioManager: Selecting new random melody");
                    MusicManager.selectRandomMelody();
                }

                // Start the music playback
                console.log("AudioManager: Starting music playback");
                const result = MusicManager.startMusic();

                // Update UI display
                this.game.uiManager.updateMelodyDisplay();

                return result;
            })
            .finally(() => {
                this.pendingMusicPromise = null;
            });

        return this.pendingMusicPromise;
    }

    /**
     * Toggle sound on/off
     * @returns {boolean} The new sound state
     */
    toggleSound() {
        // Initialize audio first if needed
        if (!this.game.hasUserInteraction) {
            console.warn("AudioManager: Cannot toggle sound before user interaction");
            return false;
        }

        // Initialize audio subsystems
        this.initializeAudio();

        // Toggle sound using the game state manager
        const soundEnabled = this.game.gameStateManager.toggleSound();
        this.game.uiManager.updateSoundToggleUI();

        // Play click sound when enabling sound
        if (soundEnabled && this.isAudioReady()) {
            this.game.soundManager.playSound('click');
        }

        // Save preference
        localStorage.setItem('snakeSoundEnabled', soundEnabled);
        return soundEnabled;
    }

    /**
     * Toggle music on/off
     * @returns {boolean} The new music state
     */
    toggleMusic() {
        // Initialize audio first if needed
        if (!this.game.hasUserInteraction) {
            console.warn("AudioManager: Cannot toggle music before user interaction");
            return false;
        }

        // Initialize audio subsystems
        this.initializeAudio();

        // Toggle music using the game state manager
        const musicEnabled = this.game.gameStateManager.toggleMusic();
        this.game.uiManager.updateMusicToggleUI();

        // Start or stop music based on new state
        if (musicEnabled) {
            // Only start music if game is actually in playing state
            const gameState = this.game.gameStateManager.getGameState();
            if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
                this.initializeGameMusic(false);
            }
        } else {
            // Only stop if actually playing to avoid unnecessary cleanup
            if (MusicManager.isPlaying) {
                MusicManager.stopMusic();
                this.game.uiManager.updateMelodyDisplay();
            }
        }

        // Save preference
        localStorage.setItem('snakeMusicEnabled', musicEnabled);

        // Play click sound for feedback
        if (this.game.gameStateManager.getGameState().soundEnabled && this.isAudioReady()) {
            this.game.soundManager.playSound('click', 0.5);
        }

        return musicEnabled;
    }

    /**
     * Change to a different background melody
     * @returns {boolean} Success status
     */
    changeMusic() {
        // Check for user interaction
        if (!this.game.hasUserInteraction) {
            console.warn("AudioManager: Cannot change music before user interaction");
            return false;
        }

        // Initialize audio subsystems
        this.initializeAudio();

        // Get current game state
        const gameState = this.game.gameStateManager.getGameState();
        const isPlaying = gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver;

        // Handle based on whether music is enabled and game is in playing state
        if (gameState.musicEnabled && isPlaying) {
            // Change to a new melody (only if game is playing)
            MusicManager.changeToRandomMelody();
            this.game.uiManager.updateMelodyDisplay();

            // Play feedback sound
            if (gameState.soundEnabled) {
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        } else if (gameState.musicEnabled) {
            // Just select a new melody but don't play it if game is not in playing state
            MusicManager.selectRandomMelody();
            this.game.uiManager.updateMelodyDisplay();

            // Play feedback sound
            if (gameState.soundEnabled && this.isAudioReady()) {
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        } else {
            // Just select a new melody but don't play it (music is disabled)
            MusicManager.selectRandomMelody();
            this.game.uiManager.updateMelodyDisplay();

            // Play feedback sound
            if (gameState.soundEnabled && this.isAudioReady()) {
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        }
    }

    /**
     * Handle audio for game over state
     * @param {boolean} isNewHighScore - Whether a new high score was achieved
     */
    handleGameOverAudio(isNewHighScore) {
        // Exit if no user interaction
        if (!this.game.hasUserInteraction) return;

        // Stop background music
        if (MusicManager.isPlaying) {
            MusicManager.stopMusic(false);
        }

        // Play crash sound
        if (this.game.soundManager) {
            this.game.soundManager.playSound('crash');
        }

        // Play high score fanfare if needed
        if (isNewHighScore && this.game.soundManager) {
            const highScoreFanfareDelay = 800;
            setTimeout(() => {
                this.game.soundManager.playHighScoreFanfare();
            }, highScoreFanfareDelay);
        }

        // Cancel any existing cleanup for this game instance
        const existingTimeoutId = MusicManager.cleanupTimeouts.get(this.game);
        if (existingTimeoutId) {
            clearTimeout(existingTimeoutId);
        }

        // Schedule cleanup with appropriate delay based on sounds being played
        const cleanupDelay = isNewHighScore ? 2400 : 1500;

        // Only clear melody ID if we're not going to restart immediately
        if (!this.game.startRequested) {
            MusicManager.clearCurrentMelody();
        }

        MusicManager.cleanupAudioResources(this.game, cleanupDelay);
    }

    /**
     * Handle visibility change events (browser tab focus/blur)
     * Particularly important for iOS devices that suspend audio contexts
     */
    handleVisibilityChange() {
        // Only proceed if we have user interaction and audio was initialized
        if (!this.game.hasUserInteraction || !SoundManager.hasUserInteraction) {
            return;
        }

        if (document.visibilityState === 'visible') {
            console.log("AudioManager: Document became visible, checking audio state");

            // Check if audio context is suspended (common on iOS when switching apps)
            const audioContext = SoundManager.getAudioContext();
            if (audioContext && audioContext.state === 'suspended') {
                console.log("AudioManager: Audio context is suspended, attempting to resume");

                // Resume audio context using SoundManager's method which handles iOS specifics
                this.game.soundManager.resumeAudioContext().then(resumed => {
                    if (resumed) {
                        console.log("AudioManager: Successfully resumed audio context");

                        // Play a silent sound to fully unlock audio on iOS
                        this.game.soundManager.playSilentSound();

                        // Get the current game state
                        const gameState = this.game.gameStateManager.getGameState();

                        // Check if music should be playing based on game state and settings
                        const shouldMusicBePlaying = gameState.musicEnabled &&
                            gameState.isGameStarted &&
                            !gameState.isPaused &&
                            !gameState.isGameOver;

                        // If music should be playing but is not, restart it
                        if (shouldMusicBePlaying && !MusicManager.isPlaying) {
                            console.log("AudioManager: Restarting music after visibility change");

                            // Small delay to ensure audio context is fully ready
                            setTimeout(() => {
                                // Force MusicManager to refresh its audio context reference
                                MusicManager.audioContext = audioContext;

                                // Initialize master gain nodes if needed
                                MusicManager.setupGainNodes();

                                // Restart music without changing melody
                                this.initializeGameMusic(false);
                            }, 100);
                        }
                    } else {
                        console.warn("AudioManager: Failed to resume audio context through standard method");

                        // The SoundManager.resumeAudioContext already tried the iOS forced wakeup if needed
                        // so we don't need to do anything else here
                    }
                });
            }
        } else if (document.visibilityState === 'hidden') {
            // Store music state when page becomes hidden
            this.musicWasPlaying = MusicManager.isPlaying;
            console.log("AudioManager: Document hidden, music state saved:", this.musicWasPlaying);
        }
    }
}
