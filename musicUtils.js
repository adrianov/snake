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

        if (gameInstance.musicManager && gameInstance.musicEnabled) {
            gameInstance.musicManager.startMusic();
        }
    }

    /**
     * Clean up audio resources completely
     * @param {object} gameInstance - The snake game instance
     * @param {number} delay - Delay in milliseconds before cleanup
     */
    static cleanupAudioResources(gameInstance, delay = 0) {
        // Cancel any pending cleanup first
        MusicManagerUtils.cancelPendingCleanup(gameInstance);

        // Don't schedule cleanup if game is actively playing
        // This prevents accidentally stopping music during gameplay
        if (gameInstance.isGameStarted && !gameInstance.isPaused && !gameInstance.isGameOver) {
            console.debug('Cleanup skipped: game is active');
            return;
        }

        if (delay > 0) {
            // Store the timeout ID so it can be cancelled if needed
            const timeoutId = setTimeout(() => {
                // Double-check game state before cleanup in case it changed during the delay
                if (gameInstance.isGameStarted && !gameInstance.isPaused && !gameInstance.isGameOver) {
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
        if (gameInstance.musicManager && (gameInstance.isGameOver || gameInstance.isPaused)) {
            gameInstance.musicManager.stopMusic(true);
            gameInstance.musicManager = null;
        }

        // Only clean up sound manager if game is over or paused
        if (gameInstance.soundManager && (gameInstance.isGameOver || gameInstance.isPaused)) {
            gameInstance.soundManager.closeAudioContext();
        }
    }
}

// Make available globally
window.MusicManagerUtils = MusicManagerUtils;
