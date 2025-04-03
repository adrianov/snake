/**
 * Manages persistent game state and feature toggles.
 * - Implements a state machine for tracking game states (menu, playing, paused, game over)
 * - Maintains and updates the scoring system with persistent high score tracking
 * - Handles local storage operations for preserving game settings and scores
 * - Manages feature toggles like luck mode (collision avoidance) and snake vibration
 * - Provides a uniform interface for state queries by other game components
 * - Controls state transitions with appropriate validation rules
 * - Implements reset functionality to return to initial state
 */
class GameStateManager {
    constructor() {
        this.isGameStarted = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;

        // Feature toggles (Audio state removed)
        this.luckEnabled = true;
        this.shakeEnabled = true;
        // this.musicEnabled = localStorage.getItem('snakeMusicEnabled') !== 'false'; // Removed
    }

    resetGameState() {
        this.score = 0;
        this.isGameStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;
        this.luckEnabled = true;
        this.shakeEnabled = true;
    }

    startGame() {
        this.isGameStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
    }

    pauseGame(snake, direction, nextDirection, food, score, speed) {
        this.isPaused = true;
        this.lastGameState = {
            snake: JSON.parse(JSON.stringify(snake.getSegments())),
            direction: direction,
            nextDirection: nextDirection,
            food: JSON.parse(JSON.stringify(food)),
            score: score,
            speed: speed
        };
    }

    unpauseGame() {
        this.isPaused = false;
        return this.lastGameState;
    }

    gameOver() {
        this.isGameOver = true;
        this.isGameStarted = false;

        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }

        return isNewHighScore;
    }

    resetGame() {
        this.isGameOver = false;
        this.isGameStarted = true;
        this.score = 0;
    }

    updateScore(points) {
        this.score += points;
        return this.score;
    }

    setScore(newScore) {
        this.score = Math.max(0, newScore); // Ensure score doesn't go negative
    }

    getScore() {
        return this.score;
    }

    getHighScore() {
        return this.highScore;
    }

    toggleLuck() {
        this.luckEnabled = !this.luckEnabled;
        return this.luckEnabled;
    }

    toggleShake() {
        this.shakeEnabled = !this.shakeEnabled;
        return this.shakeEnabled;
    }

    // Removed toggleSound and toggleMusic
    /*
    toggleSound() {
        const soundManager = SoundManager.getInstance();
        return soundManager.toggleSound();
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('snakeMusicEnabled', this.musicEnabled.toString());
        return this.musicEnabled;
    }
    */

    getGameState() {
        // Get audio states directly from AudioManager
        // Assumes audioManager is accessible, e.g., via the game instance if needed,
        // but since UIManager already uses this, let's call it directly for now.
        // A better approach might be dependency injection.
        const audioManager = window.SnakeGame?.audioManager; // Access via global game instance

        return {
            isGameStarted: this.isGameStarted,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver,
            score: this.score,
            highScore: this.highScore,
            luckEnabled: this.luckEnabled,
            shakeEnabled: this.shakeEnabled,
            soundEnabled: audioManager ? audioManager.isSoundEnabled() : false, // Use AudioManager getter
            musicEnabled: audioManager ? audioManager.isMusicEnabled() : false  // Use AudioManager getter
        };
    }
}

// Make GameStateManager globally accessible
window.GameStateManager = GameStateManager;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameStateManager };
}
