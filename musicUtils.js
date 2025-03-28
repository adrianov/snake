/**
 * Music management utility functions for the Snake game
 * Extracted to reduce code duplication in the game class
 */

class MusicManagerUtils {
    // Store cleanup timeouts by game instance
    static cleanupTimeouts = new Map();

    /**
     * Cancel any pending cleanup tasks for a game instance
     * @param {object} gameInstance - The snake game instance
     */
    static cancelPendingCleanup(gameInstance) {
        const timeoutId = MusicManagerUtils.cleanupTimeouts.get(gameInstance);
        if (timeoutId) {
            clearTimeout(timeoutId);
            MusicManagerUtils.cleanupTimeouts.delete(gameInstance);
        }
    }

    /**
     * Initialize or reinitialize a music manager instance
     * @param {object} gameInstance - The snake game instance
     * @param {boolean} selectRandom - Whether to select a random melody or use saved one
     * @returns {object} The initialized MusicManager instance
     */
    static initializeMusicManager(gameInstance, selectRandom = false) {
        // Cancel any pending cleanup to prevent destroying the new manager
        MusicManagerUtils.cancelPendingCleanup(gameInstance);

        // If there was a previous music manager, stop it completely
        if (gameInstance.musicManager) {
            // Save melody ID before stopping if we want to preserve it
            if (!selectRandom) {
                gameInstance.musicManager.saveMelodyId();
            }
            gameInstance.musicManager.stopMusic(true);
        }

        // Create a fresh music manager with its own audio context
        const musicManager = new MusicManager();
        musicManager.init();

        // Either select random melody or keep the current one from static storage
        if (selectRandom || !musicManager.currentMelodyId) {
            musicManager.selectRandomMelody();
        }

        return musicManager;
    }

    /**
     * Start music if enabled in game settings
     * @param {object} gameInstance - The snake game instance
     */
    static startMusicIfEnabled(gameInstance) {
        // Cancel any pending cleanup if we're about to start music
        MusicManagerUtils.cancelPendingCleanup(gameInstance);
        const gameState = gameInstance.gameStateManager.getGameState();

        if (gameInstance.musicManager && gameState.musicEnabled) {
            gameInstance.musicManager.startMusic();
        }
    }

    /**
     * Change to a different random melody
     * @param {object} gameInstance - The snake game instance
     * @returns {object|null} The new melody info or null if changing failed
     */
    static changeToRandomMelody(gameInstance) {
        // Make sure music is enabled and the game is active
        const gameState = gameInstance.gameStateManager.getGameState();
        if (!gameState.musicEnabled ||
            !gameState.isGameStarted ||
            gameState.isPaused ||
            gameState.isGameOver) {
            return null;
        }

        // Cancel any pending cleanup
        MusicManagerUtils.cancelPendingCleanup(gameInstance);

        // Change to a new random melody
        if (gameInstance.musicManager) {
            const newMelodyInfo = gameInstance.musicManager.changeToRandomMelody();

            // Update UI if needed
            if (gameInstance.uiManager) {
                gameInstance.uiManager.updateMelodyDisplay();
            }

            return newMelodyInfo;
        }

        return null;
    }

    /**
     * Clean up audio resources completely
     * @param {object} gameInstance - The snake game instance
     * @param {number} delay - Delay in milliseconds before cleanup
     */
    static cleanupAudioResources(gameInstance, delay = 0) {
        // Cancel any pending cleanup first
        MusicManagerUtils.cancelPendingCleanup(gameInstance);
        const gameState = gameInstance.gameStateManager.getGameState();

        // Don't schedule cleanup if game is actively playing
        // This prevents accidentally stopping music during gameplay
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            console.debug('Cleanup skipped: game is active');
            return;
        }

        if (delay > 0) {
            // Store the timeout ID so it can be cancelled if needed
            const timeoutId = setTimeout(() => {
                // Double-check game state before cleanup in case it changed during the delay
                const currentGameState = gameInstance.gameStateManager.getGameState();
                if (currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                    console.debug('Delayed cleanup aborted: game is now active');
                    MusicManagerUtils.cleanupTimeouts.delete(gameInstance);
                    return;
                }

                MusicManagerUtils.performCleanup(gameInstance);
                // Remove from tracking map once completed
                MusicManagerUtils.cleanupTimeouts.delete(gameInstance);
            }, delay);

            // Store the timeout ID for possible cancellation
            MusicManagerUtils.cleanupTimeouts.set(gameInstance, timeoutId);
        } else {
            MusicManagerUtils.performCleanup(gameInstance);
        }
    }

    /**
     * Actually perform the cleanup (internal helper)
     * @param {object} gameInstance - The snake game instance
     */
    static performCleanup(gameInstance) {
        // Only clean up music manager if game is over or paused
        // This prevents destroying a music manager that might be in use
        const gameState = gameInstance.gameStateManager.getGameState();
        if (gameInstance.musicManager && (gameState.isGameOver || gameState.isPaused)) {
            gameInstance.musicManager.stopMusic(true);
            gameInstance.musicManager = null;
        }

        // Only clean up sound manager if game is over or paused
        if (gameInstance.soundManager && (gameState.isGameOver || gameState.isPaused)) {
            gameInstance.soundManager.closeAudioContext();
        }
    }
}

// Make available globally
window.MusicManagerUtils = MusicManagerUtils;
