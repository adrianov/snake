class GameStateManager {
    constructor() {
        this.isGameStarted = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;

        // Feature toggles
        this.luckEnabled = true;
        this.shakeEnabled = true;
        this.musicEnabled = localStorage.getItem('snakeMusicEnabled') !== 'false';
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
    }

    updateScore(points) {
        this.score += points;
        return this.score;
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

    toggleSound() {
        const soundManager = SoundManager.getInstance();
        return soundManager.toggleSound();
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('snakeMusicEnabled', this.musicEnabled.toString());
        return this.musicEnabled;
    }

    getGameState() {
        const soundManager = SoundManager.getInstance();
        return {
            isGameStarted: this.isGameStarted,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver,
            score: this.score,
            highScore: this.highScore,
            luckEnabled: this.luckEnabled,
            shakeEnabled: this.shakeEnabled,
            soundEnabled: soundManager.isSoundEnabled(),
            musicEnabled: this.musicEnabled
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameStateManager };
}
