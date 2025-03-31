/**
 * Coordinates sound and music systems with browser audio constraints.
 * - Implements safe audio initialization respecting browser autoplay policies
 * - Orchestrates communication between sound effects and music subsystems
 * - Manages global audio state (enabled/disabled, volume levels)
 * - Handles audio context resumption after user interaction
 * - Implements browser-specific workarounds for audio limitations
 * - Provides a unified interface for triggering game audio events
 * - Maintains synchronization between audio state and user preferences
 */
class AudioManager {
    constructor(game) {
        this.game = game;
    }

    // Check if audio is ready to be played
    isAudioReady() {
        return this.game.hasUserInteraction &&
            SoundManager.hasUserInteraction &&
            SoundManager.audioContext?.state === 'running';
    }

    init() {
        // Set the SoundManager's global flag
        SoundManager.hasUserInteraction = true;

        console.log("AudioManager: Initializing audio with user interaction");
        this.initializeAudio(true); // Force initialization
    }

    initializeAudio(forceInitialization = false) {
        if (!this.game.hasUserInteraction) {
            console.warn("Attempted to initialize audio before user interaction.");
            return false;
        }

        console.log("Initializing SoundManager and MusicManager contexts...");

        // Update SoundManager's flag
        SoundManager.hasUserInteraction = true;

        // Initialize SoundManager context
        if (this.game.soundManager) {
            // On mobile browsers, force initialization with user interaction
            this.game.soundManager.initAudioContext(true); // Force initialization/resume

            // On iOS and some mobile browsers, we need to ensure the context is resumed
            // after a short delay to give the browser time to process the user interaction
            // Only do this if we haven't confirmed audio is working yet
            if (!SoundManager.hasPlayedAudio) {
                setTimeout(() => {
                    if (SoundManager.audioContext &&
                        SoundManager.audioContext.state === 'suspended' &&
                        !SoundManager.hasPlayedAudio) {
                        console.log("AudioManager: Attempting delayed resume of AudioContext for mobile browsers");
                        this.game.soundManager.resumeAudioContext().then((resumed) => {
                            if (resumed) {
                                console.log("AudioManager: Successfully resumed AudioContext after delay");
                                // Play a silent sound to fully unlock audio on iOS
                                // but only if we haven't confirmed audio is working yet
                                if (!SoundManager.hasPlayedAudio) {
                                    this.game.soundManager.playSilentSound();
                                }

                                // Re-initialize music if it was supposed to be playing
                                if (this.game.gameStateManager.getGameState().musicEnabled &&
                                    !MusicManager.isPlaying) {
                                    console.log("AudioManager: Restarting music after successful resume");
                                    this.initializeGameMusic(false);
                                }
                            }
                        });
                    }
                }, 100);
            }
        } else {
            console.warn("SoundManager not available during audio initialization.");
            return false;
        }

        // Initialize MusicManager context
        MusicManager.initAudioContextIfNeeded();

        return true;
    }

    initializeGameMusic(forceNewMelody = true) {
        // Only proceed if user interaction has happened
        if (!this.game.hasUserInteraction) {
            console.log("[initializeGameMusic] User interaction required");
            return false;
        }

        // Only start music if it's enabled in game settings
        const gameState = this.game.gameStateManager.getGameState();
        if (!gameState.musicEnabled) {
            console.log("[initializeGameMusic] Music is disabled in game settings");
            return false;
        }

        console.log("[initializeGameMusic] Initializing game music");

        // Force audio context initialization first
        this.initializeAudio(true);

        // Ensure we have a running audio context
        if (!SoundManager.audioContext || SoundManager.audioContext.state !== 'running') {
            console.log("[initializeGameMusic] AudioContext not running, attempting to resume");
            if (SoundManager.audioContext && SoundManager.audioContext.state === 'suspended') {
                this.game.soundManager.resumeAudioContext().then((resumed) => {
                    if (resumed) {
                        console.log("[initializeGameMusic] Successfully resumed AudioContext, now starting music");
                        this._startMusicAfterContextResumed(forceNewMelody);
                    }
                });
                return false;
            }
            return false;
        }

        // Check if music is already playing
        const musicIsPlaying = MusicManager.isPlaying;

        // Determine if we need to select a new melody
        if (forceNewMelody || !MusicManager.currentMelodyId) {
            console.log("[initializeGameMusic] Selecting new random melody");
            MusicManager.selectRandomMelody();
        }

        // Start the music
        console.log("[initializeGameMusic] Starting music playback");
        MusicManager.startMusic();

        // Update the melody display
        this.game.uiManager.updateMelodyDisplay();

        return true;
    }

    // Helper method to start music after the audio context has been successfully resumed
    _startMusicAfterContextResumed(forceNewMelody) {
        // Determine if we need to select a new melody
        if (forceNewMelody || !MusicManager.currentMelodyId) {
            console.log("[_startMusicAfterContextResumed] Selecting new random melody");
            MusicManager.selectRandomMelody();
        }

        // Start the music
        console.log("[_startMusicAfterContextResumed] Starting music playback after context resume");
        MusicManager.startMusic();

        // Update the melody display
        this.game.uiManager.updateMelodyDisplay();
    }

    toggleSound() {
        // Initialize audio on first toggle if interaction hasn't happened yet
        if (!this.game.hasUserInteraction) {
            console.warn("Cannot toggle sound before user interaction");
            return false;
        }

        this.initializeAudio();

        const soundEnabled = this.game.gameStateManager.toggleSound();
        this.game.uiManager.updateSoundToggleUI();

        // Play click sound if enabling sound
        if (soundEnabled && this.game.soundManager?.audioContext?.state === 'running') {
            this.game.soundManager.playSound('click');
        }

        localStorage.setItem('snakeSoundEnabled', soundEnabled);
        return soundEnabled;
    }

    toggleMusic() {
        // Initialize audio on first toggle if interaction hasn't happened yet
        if (!this.game.hasUserInteraction) {
            console.warn("Cannot toggle music before user interaction");
            return false;
        }

        this.initializeAudio();

        const musicEnabled = this.game.gameStateManager.toggleMusic();
        this.game.uiManager.updateMusicToggleUI();

        if (musicEnabled) {
            // Don't force a new melody when simply toggling
            this.initializeGameMusic(false);
        } else {
            MusicManager.stopMusic();
            this.game.uiManager.updateMelodyDisplay(); // Clear display when music stops
        }

        localStorage.setItem('snakeMusicEnabled', musicEnabled);

        // Play click sound when toggling if sound is enabled
        if (this.game.gameStateManager.getGameState().soundEnabled && this.isAudioReady()) {
            this.game.soundManager.playSound('click', 0.5);
        }

        return musicEnabled;
    }

    changeMusic() {
        // Check for user interaction
        if (!this.game.hasUserInteraction) {
            console.warn("Cannot change music before user interaction");
            return false;
        }

        this.initializeAudio();

        if (this.game.gameStateManager.getGameState().musicEnabled) {
            // Change melody and update UI
            MusicManager.changeToRandomMelody();
            this.game.uiManager.updateMelodyDisplay();

            // Play click sound if sound is enabled
            if (this.game.gameStateManager.getGameState().soundEnabled) {
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        } else {
            // If music is off, still select a new melody but don't play it
            MusicManager.selectRandomMelody();
            this.game.uiManager.updateMelodyDisplay();

            // Play click sound if sound is enabled
            if (this.game.gameStateManager.getGameState().soundEnabled && this.isAudioReady()) {
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        }
        return false;
    }

    handleGameOverAudio(isNewHighScore) {
        // Skip audio handling if no user interaction
        if (!this.game.hasUserInteraction) {
            console.warn("Cannot handle game over audio: No user interaction");
            return;
        }

        // Skip audio handling if we don't have a valid audio context
        const sharedContext = SoundManager.getAudioContext();
        if (!this.game.soundManager || !sharedContext) {
            console.warn("Cannot handle game over audio: SoundManager or shared context unavailable.");
            return;
        }

        // Force initialize audio context if needed
        this.initializeAudio();

        // Calculate delay for potential high score sound
        const highScoreFanfareDelay = 800;
        const fanfareDuration = 1300;

        // Calculate total cleanup delay - increase delay to give more time for quick restarts
        const cleanupDelay = isNewHighScore
            ? highScoreFanfareDelay + fanfareDuration + 300  // After fanfare completes + buffer
            : 1500;                                          // Increased delay for crash sound

        // 1. Stop music but don't fully clean up
        MusicManager.stopMusic(false);

        // 2. Play crash sound immediately
        if (this.game.soundManager) {
            this.game.soundManager.playSound('crash');
        }

        // 3. Play high score fanfare if needed
        if (isNewHighScore && this.game.soundManager) {
            console.log("Game Over: Scheduling high score fanfare.");
            setTimeout(() => {
                this.game.soundManager.playHighScoreFanfare();
            }, highScoreFanfareDelay);
        }

        // Cancel any existing cleanup for this game instance
        const existingTimeoutId = MusicManager.cleanupTimeouts.get(this.game);
        if (existingTimeoutId) {
            clearTimeout(existingTimeoutId);
        }

        // 4. Schedule final cleanup after all sounds have played
        console.log(`Game Over: Scheduling audio resources cleanup in ${cleanupDelay}ms`);

        // Use MusicManager's own cleanup mechanism with delay
        // This lets the cleanup be properly cancelled if the game is restarted
        MusicManager.clearCurrentMelody();
        MusicManager.cleanupAudioResources(this.game, cleanupDelay);
    }
}
