/**
 * Coordinates sound and music systems based on game state and browser events.
 * - Handles audio initialization upon first user interaction.
 * - Manages music playback lifecycle: starts on game start, pauses on pause/blur, stops on game over.
 * - Manages sound effect permissions based on game state and user settings.
 * - Ensures music resumes correctly after PWA app switching or device sleep.
 * - Provides methods for toggling sound/music preferences.
 * - Delegates actual sound/music playing to SoundManager and MusicManager.
 */
class AudioManager {
    /**
     * Create a new AudioManager instance
     * @param {SnakeGame} game - The game instance
     */
    constructor(game) {
        this.game = game;
        this.soundManager = SoundManager.getInstance();
        this.hasUserInteraction = false;
        this.audioInitialized = false;
        this.musicWasPlayingBeforePause = false;
        this.musicWasPlayingBeforeHidden = false;
        this.needsSoundRestoration = false;
        this._pendingMusicStart = false; // Flag for deferred music start

        // Store audio states internally
        this._soundEnabled = localStorage.getItem('snakeSoundEnabled') !== 'false';
        this._musicEnabled = localStorage.getItem('snakeMusicEnabled') !== 'false';

        // Event listeners
        document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
        // window.addEventListener('pageshow', this._handlePageShow.bind(this)); // Removed as _handlePageShow was removed
        // Game state is checked internally, no direct listener needed here
    }

    // --- Public Getters for State --- 
    isSoundEnabled() {
        return this._soundEnabled;
    }

    isMusicEnabled() {
        return this._musicEnabled;
    }

    /**
     * Called by Game on first user interaction.
     * Initializes the core audio context if not already done.
     * Immediately attempts to unlock the audio context for mobile compatibility.
     */
    init() {
        if (this.hasUserInteraction) return;
        // Set the flag within AudioManager instance
        this.hasUserInteraction = true; 
        console.log("AudioManager: Init called (interaction acknowledged). Interaction flag SET.");

        // REMOVED: Immediate unlock attempt moved to Game.js::handleFirstInteraction
        // console.log("AudioManager: Triggering initial async unlockAudio() attempt...");
        // this.soundManager.unlockAudio(false).then(success => {
        //     if (success) {
        //         console.log("AudioManager: Initial async unlock successful via init().");
        //         this.audioInitialized = true;
        //         this._setupDeviceAudioStateListener(); 
        //     } else {
        //         console.warn("AudioManager: Initial async unlock failed via init(). Will retry on first play.");
        //     }
        // });

        // Subsequent calls like _tryStartMusic will still call _ensureAudioContext
        // to handle cases where context might get suspended later or initial resume failed.
    }

    /**
     * Public method called by Game.js if the direct resume() attempt succeeds.
     */
    markAudioAsInitialized() {
        if (!this.audioInitialized) {
            console.log("AudioManager: Marking audio as initialized (externally triggered).");
            this.audioInitialized = true;
        }
    }

    /**
     * Attempts to initialize/unlock the audio context if it's not already running.
     * Called from input handlers to retry initialization on subsequent user actions.
     */
    tryInitializeAudio() {
        // Always mark that we've had user interaction
        this.hasUserInteraction = true;

        // Check for sound restoration flag first
        if (this.needsSoundRestoration) {
            console.log("AudioManager: Attempting to restore sound/music after PWA switch/visibility change (via user interaction)");

            // Attempt synchronous unlock/resume directly within the user gesture
            const unlockAttempted = SoundManager.tryUnlockAudioSync();
            const currentContext = SoundManager.getAudioContext(); // Check state *after* attempt

            if (currentContext && currentContext.state === 'running') {
                console.log("AudioManager: Sync unlock/resume SUCCEEDED via interaction. Context is running.");
                this.audioInitialized = true; // Mark as initialized

                // Check if music needs resuming specifically due to visibility change
                if (this.musicWasPlayingBeforeHidden) {
                    console.log("AudioManager: Attempting to resume music after successful interaction resume.");
                    // Only try if music is enabled AND device not detected as muted *now*
                    if (this._musicEnabled) {
                         // Check game state AFTER context is confirmed ready
                         const currentGameState = this.game.gameStateManager.getGameState();
                         if (currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                            this._tryStartMusic(false); // Attempt to resume music
                         } else {
                            console.log("AudioManager: Conditions not met to resume music (wrong game state).");
                         }
                    } else {
                        console.log(`AudioManager: Conditions not met to resume music (enabled: ${this._musicEnabled}).`);
                    }
                    // Reset the flag after attempting resumption
                    this.musicWasPlayingBeforeHidden = false;
                }

                // Reset the restoration flag only if context is confirmed running
                this.needsSoundRestoration = false;
            } else {
                // Synchronous unlock/resume failed or context still not running.
                console.warn(`AudioManager: Sync unlock/resume via interaction FAILED or context not running. Attempted: ${unlockAttempted}, State: ${currentContext?.state}. Audio might resume via async methods if needed.`);
                // Reset flag as interaction occurred, even if it failed.
                this.needsSoundRestoration = false; 
                this.audioInitialized = false; // Ensure we know audio isn't ready
            }

            return; // Exit after handling restoration attempt
        }

        // --- Regular initialization path (not restoration) ---

        // Don't continue if already initialized
        if (this.audioInitialized) {
            return;
        }

        // If it's not a restoration attempt, use the standard async unlock
        console.log("AudioManager: tryInitializeAudio called (standard initialization path).");
        this._ensureAudioContext(false); // Attempt async unlock/resume
    }

    /**
     * Checks if sound effects can be played based on current state.
     * @returns {boolean}
     */
    canPlaySound() {
        const gameState = this.game.gameStateManager.getGameState();
        return this.audioInitialized &&
               this._soundEnabled;
               // Game state (started, not paused, not game over) is implicitly handled by caller
               // or checked directly where needed (e.g., food eating sound)
    }

    /**
     * Handles the start of the game.
     * Ensures a fresh AudioContext is created and ready.
     * Starts music if enabled and conditions are met.
     * @param {boolean} isFirstStart - Whether this is the very first game start.
     */
    handleGameStart(isFirstStart) {
        console.log(`AudioManager: Handling game start. Is first start? ${isFirstStart}`);

        // --- Context Handling (Only close on first start) ---
        if (isFirstStart) {
            console.log("AudioManager: First game start detected. Recreating AudioContext.");
            const existingContext = SoundManager.getAudioContext();
            if (existingContext) {
                console.log("AudioManager: Closing existing audio context before first start.");
                this.soundManager.closeAudioContext(); 
                this.audioInitialized = false; // Mark as uninitialized after closing
                MusicManager.resetPlaybackState(); // Reset music state as context is gone
                MusicManager.masterGain = null;
                MusicManager.melodyGain = null;
                console.log("AudioManager: Cleared MusicManager gain node references.");
            }
        }

        // --- Attempt Synchronous Unlock/Resume & Reset Mute State ---
        console.log("AudioManager: Attempting synchronous audio unlock/init...");
        const contextReadyAttempt = SoundManager.tryUnlockAudioSync();

        if (contextReadyAttempt) {
            // Assume audio is initialized if sync attempt was made
            this.audioInitialized = true;

            // Check context state AFTER the sync attempt
            const context = SoundManager.getAudioContext();
            if (context && context.state === 'running') {
                console.log("AudioManager: Context is running after sync unlock. Starting music & mute detection.");
                // Attempt music start (checks enabled/mute state internally again)
                this._tryStartMusic(false);
                this._pendingMusicStart = false; // Ensure flag is clear
                SoundManager.removeContextRunningListener(this._handleContextRunning); // Remove standard listener if added previously
                SoundManager.removeContextRunningListener(this._handleContextRunningAfterVisibility); // Also remove visibility listener if pending
            } else if (context && (context.state === 'suspended' || context.state === 'interrupted')) {
                console.log(`AudioManager: Context state is ${context.state} after sync unlock. Deferring music start.`);
                this._pendingMusicStart = true;
                 // Use the standard listener for deferred start
                SoundManager.removeContextRunningListener(this._handleContextRunning);
                SoundManager.addContextRunningListener(this._handleContextRunning);    // Use arrow fn directly
            } else {
                console.warn(`AudioManager: Context in unexpected state (${context?.state}) after sync unlock. Music not started.`);
                this._pendingMusicStart = false; // Clear flag
                this.audioInitialized = false; // Mark as not initialized if context state is bad
            }
        } else {
            console.warn("AudioManager: Failed to initialize/unlock audio context synchronously. Music not started.");
            this.audioInitialized = false;
            this._pendingMusicStart = false; // Clear flag
        }
    }

    /**
     * Handles game pause.
     */
    handlePause() {
        const gameState = this.game.gameStateManager.getGameState();
        // Pause music only if the game is actually running and music is playing
        if (gameState.isGameStarted && !gameState.isGameOver && MusicManager.isPlaying) {
            console.log("AudioManager: Pausing music due to game pause.");
            this.musicWasPlayingBeforePause = true;
            MusicManager.pauseMusic();
        } else {
            this.musicWasPlayingBeforePause = false;
        }
    }

    /**
     * Handles game unpause.
     */
    handleUnpause() {
        const gameState = this.game.gameStateManager.getGameState();
        
        // Resume music only if game is running, music is enabled, 
        // and music was playing before the pause.
        if (gameState.isGameStarted && !gameState.isGameOver && this._musicEnabled && this.musicWasPlayingBeforePause) {
            console.log("AudioManager: Resuming music after game unpause.");
            // Use _tryStartMusic which handles both starting and resuming
             this._tryStartMusic(false); 
        }
        this.musicWasPlayingBeforePause = false; // Reset flag
    }

    /**
     * Handles game over.
     * Stops music but leaves the audio context open for game over sounds.
     */
    handleGameOver() {
        console.log("AudioManager: Handling game over - stopping music.");
        // Stop music playback
        if (MusicManager.isPlaying || MusicManager.isPaused) {
            MusicManager.stopMusic(false); // Use partial cleanup, context remains
        }
        
        // Reset flags including pending start
        this.musicWasPlayingBeforePause = false;
        this.musicWasPlayingBeforeHidden = false;
        this.needsSoundRestoration = false;
        if (this._pendingMusicStart) {
            console.log("AudioManager: Cancelling pending music start due to game over.");
            this._pendingMusicStart = false;
            SoundManager.removeContextRunningListener(this._handleContextRunning); // Use arrow fn directly
        }

        // Game over sounds (like 'die' or fanfare) will be triggered by Game.js 
        // using the still-existing audio context. The context will be closed 
        // on the *next* handleGameStart call.
    }

    /**
     * Handles resetting the game (e.g., after game over).
     * Prepares music state for potential restart.
     * @param {boolean} forceNewMelody - If a new melody should be selected.
     */
    handleGameReset(forceNewMelody) {
         if (!this.audioInitialized && !this._pendingMusicStart) { // Allow reset if music start is pending
            console.warn("AudioManager: Cannot handle game reset, audio not initialized and no start pending.");
            return;
        }
        console.log("AudioManager: Handling game reset.");
        // Stop any lingering music from previous game over state
        MusicManager.stopMusic();
        this.musicWasPlayingBeforePause = false;
        this.musicWasPlayingBeforeHidden = false;

        // Cancel any pending music start
        if (this._pendingMusicStart) {
            console.log("AudioManager: Cancelling pending music start due to game reset.");
            this._pendingMusicStart = false;
            SoundManager.removeContextRunningListener(this._handleContextRunning); // Use arrow fn directly
        }

        // Always select a new random melody on game reset (ensures variety)
        // Removed the check for || !MusicManager.currentMelodyId
        console.log("AudioManager: Selecting new random melody for reset.");
        MusicManager.selectRandomMelody();
        this.game.uiManager.updateMelodyDisplay();

        // Music will start via handleGameStart when the new game begins
    }

    /**
     * Toggles the user's sound preference.
     */
    toggleSound() {
        // Update internal state and localStorage
        this._soundEnabled = !this._soundEnabled;
        localStorage.setItem('snakeSoundEnabled', this._soundEnabled);
        console.log(`AudioManager: Sound toggled ${this._soundEnabled ? 'ON' : 'OFF'}.`);

        // Play feedback sound if enabling and possible
        // Use the updated internal state directly
        if (this._soundEnabled && this.audioInitialized) {
             this.soundManager.playSound('click', 0.5);
        }

        // Update UI 
        this.game.uiManager.updateSoundToggleUI(); 
    }

    /**
     * Toggles the user's music preference.
     */
    toggleMusic() {
        // Update internal state and localStorage
        this._musicEnabled = !this._musicEnabled;
        localStorage.setItem('snakeMusicEnabled', this._musicEnabled);
        console.log(`AudioManager: Music toggled ${this._musicEnabled ? 'ON' : 'OFF'}.`);

        if (this._musicEnabled) {
            // If enabling, try to start music only if game is running
            const currentGameState = this.game.gameStateManager.getGameState(); // Need game state here
            if (currentGameState.isGameStarted &&
                !currentGameState.isPaused &&
                !currentGameState.isGameOver) {
                console.log("AudioManager: Music enabled during active game, attempting start.");
                this._tryStartMusic(false); 
            }
        } else {
            // If disabling, stop music immediately
            console.log("AudioManager: Music disabled, stopping playback.");
            MusicManager.stopMusic();
        }
        
        // Update UI
        this.game.uiManager.updateMusicToggleUI();
    }

    /**
     * Changes the current background melody.
     * Selects a new melody. Plays it only if music is enabled and game is active.
     */
    changeMusic() {
        if (!this.audioInitialized) {
            console.warn("AudioManager: Cannot change music, audio not initialized.");
            return;
        }
        console.log("AudioManager: Changing music melody.");

        MusicManager.selectRandomMelody();
        this.game.uiManager.updateMelodyDisplay();

        if (this.canPlaySound()) {
             this.soundManager.playSound('click', 0.5);
        }

        // Check internal state if music should play now
        const currentGameState = this.game.gameStateManager.getGameState();
        if (this._musicEnabled &&
            currentGameState.isGameStarted &&
            !currentGameState.isPaused &&
            !currentGameState.isGameOver) {
            console.log("AudioManager: Playing newly selected melody.");
            MusicManager.stopMusic(); 
            this._tryStartMusic(false); 
        }
    }

    // --- Private Helpers --- 

    /**
     * Ensures the AudioContext is running. Called after user interaction.
     * Sets the audioInitialized flag upon success.
     * @param {boolean} playUnlockSound - Play a silent sound to help unlock on mobile.
     */
    async _ensureAudioContext(playUnlockSound = false) {
        // If already initialized by the init() call, return true
        if (this.audioInitialized) return true;
        
        // If init() hasn't run yet (no interaction), return false
        if (!this.hasUserInteraction) {
            console.warn("AudioManager: Cannot ensure audio context without user interaction.");
            return false;
        }

        // If init() interaction happened but initial unlock/resume failed, try again.
        console.log("AudioManager: Retrying unlock/resume via _ensureAudioContext (initial attempt likely failed or context suspended later).");
        try {
            // Use unlockAudio which handles init & resume
            const success = await this.soundManager.unlockAudio(playUnlockSound); 
            if (success) {
                console.log("AudioManager: Audio context is active (via retry).");
                this.audioInitialized = true;
                return true;
            } else {
                console.error("AudioManager: Failed to activate audio context (on retry).");
                this.audioInitialized = false;
                return false;
            }
        } catch (error) {
            console.error("AudioManager: Error ensuring audio context (on retry):", error);
            this.audioInitialized = false;
            return false;
        }
    }

    /**
     * Handles the page becoming visible (tab focus, PWA resume).
     * This logic might need refinement with the new context lifecycle.
     * For now, it sets a flag, assuming context recreation happens on next game start/interaction.
     */
    _handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log("AudioManager: Page became visible.");
            const initialContext = SoundManager.getAudioContext(); // Context state before attempt
            const gameState = this.game.gameStateManager.getGameState();

            // Check if restoration is needed (context suspended/interrupted or music was playing)
            // Use 'interrupted' as well for iOS state when backgrounded
            const needsRestoration = (initialContext && (initialContext.state === 'suspended' || initialContext.state === 'interrupted')) || this.musicWasPlayingBeforeHidden;

            if (needsRestoration) {
                console.log(`AudioManager: Restoration needed on visibility change. Reason: ${this.musicWasPlayingBeforeHidden ? 'Music needs resume' : `Context state ${initialContext?.state}`}. Attempting sync resume and adding listener...`);

                // Attempt synchronous unlock/resume - primarily for browser gesture requirements
                SoundManager.tryUnlockAudioSync();

                // --- IMPORTANT: Set flag and add listener --- 
                // Set flag indicating we are waiting for the context to become running after visibility change
                this.needsSoundRestoration = true; 
                this.audioInitialized = false; // Mark as not initialized until confirmed
                
                // Remove previous listener (if any) and add the visibility-specific one-time listener
                SoundManager.removeContextRunningListener(this._handleContextRunningAfterVisibility); // Use arrow fn directly
                SoundManager.addContextRunningListener(this._handleContextRunningAfterVisibility);    // Use arrow fn directly
                console.log("AudioManager: Added one-time contextRunning listener for visibility change.");
                // We DON'T check state here. _handleContextRunningAfterVisibility will do the work.

            } else {
                // No restoration needed (context already running and music wasn't playing)
                console.log(`AudioManager: No immediate restoration needed on visibility. Context state: ${initialContext?.state}, MusicBeforeHidden: ${this.musicWasPlayingBeforeHidden}`);
                this.needsSoundRestoration = false; // Clear flag if context is already okay
                // If context is running, ensure audio is marked as initialized
                if (initialContext && initialContext.state === 'running') {
                    this.audioInitialized = true;
                }
            }

        } else if (document.visibilityState === 'hidden') {
            console.log("AudioManager: Page became hidden.");
            const gameState = this.game.gameStateManager.getGameState();
            // Set flag if music is currently playing OR paused (implying it should resume)
            // and the game is in a state where music would normally play.
            const shouldBePlaying = gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver;
            if (shouldBePlaying && (MusicManager.isPlaying || MusicManager.isPaused)) {
                this.musicWasPlayingBeforeHidden = true; // Set flag *before* pausing
                // Only pause if actually playing
                if (MusicManager.isPlaying) {
                     MusicManager.pauseMusic();
                     console.log("AudioManager: Music paused due to page becoming hidden.");
                } else {
                     console.log("AudioManager: Music already paused, but marking musicWasPlayingBeforeHidden=true for resume on visibility change.");
                }
            } else {
                // Ensure flag is false otherwise
                this.musicWasPlayingBeforeHidden = false;
                 console.log(`AudioManager: Not setting musicWasPlayingBeforeHidden. shouldBePlaying=${shouldBePlaying}, isPlaying=${MusicManager.isPlaying}, isPaused=${MusicManager.isPaused}`);
            }
        }
    }

    /**
     * Callback function for when the audio context transitions to the 'running' state.
     * Used for deferred music start during initial game load.
     * @private
     */
    _handleContextRunning = () => {
        console.log("AudioManager: Received context running notification (standard).");

        if (this._pendingMusicStart) {
            console.log("AudioManager: Context is now running, starting deferred music (standard).");
            this._pendingMusicStart = false;
            SoundManager.removeContextRunningListener(this._handleContextRunning); // Clean up standard listener
            // Now attempt to start music
            this._tryStartMusic(false);
        } else {
             console.log("AudioManager: Context running notification received (standard), but no music start was pending.");
             // Remove listener just in case it was somehow added without flag being set
              SoundManager.removeContextRunningListener(this._handleContextRunning); // Use arrow fn directly
        }
        this.needsSoundRestoration = false; // Clear restoration flag
    }

    /**
     * Callback function specifically for when the audio context becomes 'running' 
     * after the page becomes visible.
     * @private
     */
    _handleContextRunningAfterVisibility = () => {
        console.log("AudioManager: Received context running notification (AFTER VISIBILITY CHANGE).");
        // Remove this specific listener immediately as it's one-time
        SoundManager.removeContextRunningListener(this._handleContextRunningAfterVisibility); // Use arrow fn directly

        const context = SoundManager.getAudioContext();
        if (!context || context.state !== 'running') {
            console.warn("AudioManager: _handleContextRunningAfterVisibility called, but context not running? Aborting.");
            this.needsSoundRestoration = true; // Keep flag set if something went wrong
            this.audioInitialized = false;
            return;
        }

        console.log("AudioManager: Context confirmed running after visibility change.");
        this.audioInitialized = true; // Mark as initialized
        this.needsSoundRestoration = false; // Clear restoration flag
        
        // Check if music needs resuming
        if (this.musicWasPlayingBeforeHidden) {
            console.log("AudioManager: Attempting to resume music via visibility listener.");
            // Check enabled/muted state *now*
            if (this._musicEnabled) {
                 const currentGameState = this.game.gameStateManager.getGameState();
                 if (currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                    this._tryStartMusic(false);
                 } else {
                    console.log("AudioManager: Conditions not met to resume music post-visibility (wrong game state).");
                 }
            } else {
                console.log(`AudioManager: Conditions not met to resume music post-visibility (enabled: ${this._musicEnabled}).`);
            }
        }

        // Reset the hidden flag regardless of whether music was resumed
        this.musicWasPlayingBeforeHidden = false;
    }

    /**
     * Attempts to start or resume music playback if conditions are met.
     * Assumes the caller has ensured the audio context is potentially ready (e.g., via user interaction).
     * @param {boolean} forceNewMelody - Select a new melody before playing.
     * @private // Make this an arrow function property
     */
    _tryStartMusic = (forceNewMelody) => {
        const gameState = this.game.gameStateManager.getGameState();
        if (!gameState.isGameStarted || gameState.isPaused || gameState.isGameOver) {
            console.log("AudioManager: Conditions not met to start music (wrong game state). Music stopped.");
            if (MusicManager.isPlaying || MusicManager.isPaused) {
                MusicManager.stopMusic();
            }
            return;
        }

        // Get the current context directly
        const context = SoundManager.getAudioContext();

        // Check if context exists and is running
        if (!context || context.state !== 'running') {
            console.warn(`AudioManager: Cannot start music, audio context not ready. State: ${context?.state}`);
            // We might want to queue a start attempt for the next interaction if context is suspended
            return;
        }

        // Check music enabled state
        if (!this._musicEnabled) {
            console.log("AudioManager: Conditions not met to start music (disabled). Music stopped.");
            if (MusicManager.isPlaying || MusicManager.isPaused) {
                MusicManager.stopMusic(); // Stop if it somehow started
            }
            return;
        }

        // If we are here, context is OK, music is enabled, game state OK
        console.log("AudioManager: All conditions met, proceeding with music playback.");

        // Ensure MusicManager is using the correct context (might have been recreated)
        MusicManager.audioContext = context;

        // Select new melody if needed
        if (forceNewMelody || !MusicManager.currentMelodyId) {
            console.log("AudioManager: Selecting new melody before starting.");
            MusicManager.selectRandomMelody();
            this.game.uiManager.updateMelodyDisplay();
        }

        // Start/Resume the music
        if (MusicManager.isPaused) {
            console.log("AudioManager: Resuming paused music.");
            MusicManager.resumeMusic(); // resumeMusic internally checks context state again
        } else if (!MusicManager.isPlaying) {
            console.log("AudioManager: Starting music playback.");
            MusicManager.startMusic(); // startMusic internally checks context state again
        }
        this.game.uiManager.updateMelodyDisplay(); // Ensure display is up-to-date
    }
}

// Make AudioManager globally accessible if needed, though dependency injection is preferred
window.AudioManager = AudioManager; 
