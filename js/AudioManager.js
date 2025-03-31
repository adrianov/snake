class AudioManager {
    constructor(game) {
        this.game = game;
        this.hasUserInteraction = false;
    }

    // New method to check if we have user interaction and audio initialized
    isAudioReady() {
        // Update our internal flag
        this.hasUserInteraction = this.game.hasUserInteraction;

        // Check if we have user interaction and audio context is running
        return this.hasUserInteraction &&
            SoundManager.hasUserInteraction &&
            SoundManager.audioContext?.state === 'running';
    }

    init() {
        // Sync our state with the game's state
        this.hasUserInteraction = this.game.hasUserInteraction;

        // Set the SoundManager's global flag too
        SoundManager.hasUserInteraction = true;

        console.log("AudioManager: Initializing audio with user interaction");
        this.initializeAudio();
    }

    initializeAudio() {
        // Always sync our state with the game's state
        this.hasUserInteraction = this.game.hasUserInteraction;

        if (!this.hasUserInteraction) {
            console.warn("Attempted to initialize audio before user interaction.");
            return false;
        }

        console.log("Initializing SoundManager and MusicManager contexts...");

        // Always ensure SoundManager knows we have user interaction
        SoundManager.hasUserInteraction = true;

        // Tell SoundManager to initialize its context now that interaction has happened
        if (this.game.soundManager) {
            this.game.soundManager.initAudioContext(true); // Force initialization/resume
        } else {
            console.warn("SoundManager not available during audio initialization.");
            return false;
        }

        // Tell MusicManager to initialize/resume its context
        if (this.game.musicManager) {
            this.game.musicManager.initAudioContextIfNeeded(); // Create/resume context
        } else {
            console.warn("MusicManager not available during audio initialization.");
            return false;
        }

        return true;
    }

    initializeGameMusic(forceNewMelody = true) {
        // Always sync our state with the game's state
        this.hasUserInteraction = this.game.hasUserInteraction;

        // Make sure SoundManager is also updated
        SoundManager.hasUserInteraction = this.hasUserInteraction;

        // Only proceed if user interaction has happened
        if (!this.hasUserInteraction) {
            console.log("[initializeGameMusic] User interaction required");
            return false;
        }

        // Only proceed if there's a music manager
        if (!this.game.musicManager) {
            console.log("[initializeGameMusic] No music manager available");
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
        this.initializeAudio();

        // Make sure the audio context is initialized
        this.game.musicManager.initAudioContextIfNeeded();

        // Select a new random melody if requested
        if (forceNewMelody) {
            console.log("[initializeGameMusic] Selecting new random melody");
            this.game.musicManager.selectRandomMelody();
        }

        // Start the music
        console.log("[initializeGameMusic] Starting music playback");
        this.game.musicManager.startMusic();

        // Update the melody display
        this.game.uiManager.updateMelodyDisplay(this.game.musicManager.getCurrentMelody());

        return true;
    }

    toggleSound() {
        // Always sync our state with the game's state and update SoundManager
        this.hasUserInteraction = this.game.hasUserInteraction;
        SoundManager.hasUserInteraction = this.hasUserInteraction;

        // Initialize audio on first toggle if interaction hasn't happened yet
        if (!this.hasUserInteraction) {
            console.warn("Cannot toggle sound before user interaction");
            return false;
        }

        this.initializeAudio();

        const soundEnabled = this.game.gameStateManager.toggleSound();
        this.game.uiManager.updateSoundToggleUI();
        if (soundEnabled && this.game.soundManager?.audioContext?.state === 'running') {
            this.game.soundManager.playSound('click'); // Play click sound if enabling
        }
        localStorage.setItem('snakeSoundEnabled', soundEnabled);
        return soundEnabled;
    }

    toggleMusic() {
        // Always sync our state with the game's state and update SoundManager
        this.hasUserInteraction = this.game.hasUserInteraction;
        SoundManager.hasUserInteraction = this.hasUserInteraction;

        // Initialize audio on first toggle if interaction hasn't happened yet
        if (!this.hasUserInteraction) {
            console.warn("Cannot toggle music before user interaction");
            return false;
        }

        this.initializeAudio();

        const musicEnabled = this.game.gameStateManager.toggleMusic();
        this.game.uiManager.updateMusicToggleUI();

        if (musicEnabled) {
            // Use the centralized method but don't force a new melody when simply toggling
            this.initializeGameMusic(false);
        } else {
            this.game.musicManager.stopMusic();
            this.game.uiManager.updateMelodyDisplay(null); // Clear display when music stops
        }

        localStorage.setItem('snakeMusicEnabled', musicEnabled);
        if (this.game.gameStateManager.getGameState().soundEnabled && this.game.soundManager?.audioContext?.state === 'running') {
            this.game.soundManager.playSound('click', 0.5); // Play click sound when toggling
        }
        return musicEnabled;
    }

    changeMusic() {
        // Always sync our state with the game's state and update SoundManager
        this.hasUserInteraction = this.game.hasUserInteraction;
        SoundManager.hasUserInteraction = this.hasUserInteraction;

        // Set interaction flag if not already set
        if (!this.hasUserInteraction) {
            console.warn("Cannot change music before user interaction");
            return false;
        }

        this.initializeAudio();

        if (this.game.musicManager && this.game.gameStateManager.getGameState().musicEnabled) {
            // changeToRandomMelody calls startMusic internally, which handles context
            this.game.musicManager.changeToRandomMelody();
            this.game.uiManager.updateMelodyDisplay(this.game.musicManager.getCurrentMelody());
            if (this.game.gameStateManager.getGameState().soundEnabled) {
                // playSound handles context check internally
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        } else if (!this.game.gameStateManager.getGameState().musicEnabled) {
            // If music is off, still select a new melody but don't play it
            this.game.musicManager?.selectRandomMelody(); // Selects without playing
            this.game.uiManager.updateMelodyDisplay(this.game.musicManager?.getCurrentMelody()); // Update display even if off
            if (this.game.gameStateManager.getGameState().soundEnabled && this.game.soundManager?.audioContext?.state === 'running') {
                this.game.soundManager?.playSound('click', 0.5);
            }
            return true;
        }
        return false;
    }

    handleGameOverAudio(isNewHighScore) {
        // Always sync our state with the game's state
        this.hasUserInteraction = this.game.hasUserInteraction;
        SoundManager.hasUserInteraction = this.hasUserInteraction;

        // Skip audio handling if no user interaction
        if (!this.hasUserInteraction) {
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

        // The high score fanfare takes approximately 1.3 seconds to complete
        const fanfareDuration = 1300;

        // Calculate total cleanup delay - add buffer time after all sounds finish
        const cleanupDelay = isNewHighScore
            ? highScoreFanfareDelay + fanfareDuration + 200  // After fanfare completes + buffer
            : 1000;                                          // Basic delay for crash sound

        // 1. Stop music but don't fully clean up (preserve the AudioContext)
        if (this.game.musicManager) {
            console.log("Game Over: Stopping music without AudioContext cleanup.");
            this.game.musicManager.stopMusic(false); // Use false to avoid full cleanup
        }

        // 2. Play crash sound immediately
        if (this.game.soundManager) {
            this.game.soundManager.playSound('crash');
        }

        // 3. Play high score fanfare if needed, after a delay
        if (isNewHighScore && this.game.soundManager) {
            console.log("Game Over: Scheduling high score fanfare.");
            setTimeout(() => {
                this.game.soundManager.playHighScoreFanfare();
            }, highScoreFanfareDelay);
        }

        // 4. Schedule final cleanup after all sounds have played
        console.log(`Game Over: Scheduling audio resources cleanup in ${cleanupDelay}ms`);
        setTimeout(() => {
            console.log("Game Over: Performing final audio cleanup");
            // Use the static method to clean up all audio resources
            MusicManager.cleanupAudioResources(this.game, 0); // Use 0 for immediate cleanup
        }, cleanupDelay);
    }
}
