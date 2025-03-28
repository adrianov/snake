class UIManager {
    constructor(game) {
        this.game = game;

        // Cache DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.soundToggle = document.getElementById('soundToggle');
        this.musicToggle = document.getElementById('musicToggle');
        this.resetButton = document.getElementById('resetHighScore');
        this.melodyElement = document.getElementById('currentMelody');
        this.musicInfoElement = document.querySelector('.music-info');

        // Element for temporary messages
        this.tempMessageElement = document.createElement('div');
        this.tempMessageElement.className = 'temp-message';
        document.body.appendChild(this.tempMessageElement);

        // Message timeout
        this.messageTimeout = null;

        // Initialize the UI controls
        this.initializeControls();
    }

    initializeControls() {
        // Set up sound toggle
        if (this.soundToggle) {
            // Update initial state
            this.updateSoundToggleUI();

            // Add click event listener
            this.soundToggle.addEventListener('click', () => {
                this.game.toggleSound();
            });
        }

        // Set up music toggle
        if (this.musicToggle) {
            // Update initial state
            this.updateMusicToggleUI();

            // Add click event listener
            this.musicToggle.addEventListener('click', () => {
                this.game.toggleMusic();
            });
        }

        // Set up high score reset button
        if (this.resetButton) {
            this.resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetHighScore();
            });
        }
    }

    updateSoundToggleUI() {
        if (!this.soundToggle) return;

        const soundOnIcon = this.soundToggle.querySelector('.sound-on');
        const soundOffIcon = this.soundToggle.querySelector('.sound-off');
        const gameState = this.game.gameStateManager.getGameState();

        if (gameState.soundEnabled) {
            this.soundToggle.classList.remove('disabled');
            this.soundToggle.title = "Sound ON (S key to toggle)";
            soundOnIcon.classList.remove('hidden');
            soundOffIcon.classList.add('hidden');
        } else {
            this.soundToggle.classList.add('disabled');
            this.soundToggle.title = "Sound OFF (S key to toggle)";
            soundOnIcon.classList.add('hidden');
            soundOffIcon.classList.remove('hidden');
        }
    }

    updateMusicToggleUI() {
        if (!this.musicToggle) return;

        const musicOnIcon = this.musicToggle.querySelector('.music-on');
        const musicOffIcon = this.musicToggle.querySelector('.music-off');
        const gameState = this.game.gameStateManager.getGameState();

        if (gameState.musicEnabled) {
            this.musicToggle.classList.remove('disabled');
            this.musicToggle.title = "Music ON (M key to toggle)";
            musicOnIcon.classList.remove('hidden');
            musicOffIcon.classList.add('hidden');
        } else {
            this.musicToggle.classList.add('disabled');
            this.musicToggle.title = "Music OFF (M key to toggle)";
            musicOnIcon.classList.add('hidden');
            musicOffIcon.classList.remove('hidden');
        }
    }

    updateScore(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
        }
    }

    updateHighScore(highScore) {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = highScore;
        }
    }

    resetHighScore() {
        // Show confirmation dialog to confirm reset
        if (confirm('Are you sure you want to reset your high score?')) {
            // Reset high score to 0
            this.game.gameStateManager.highScore = 0;
            localStorage.setItem('snakeHighScore', 0);
            this.updateHighScore(0);

            // Play sound if sound is enabled
            if (this.game.soundManager) {
                this.game.soundManager.playSound('crash');
            }
        }
    }

    clearMelodyDisplay() {
        if (this.melodyElement) {
            this.melodyElement.textContent = '';
        }

        if (this.musicInfoElement) {
            this.musicInfoElement.classList.remove('has-melody');
        }
    }

    updateMelodyDisplay() {
        if (!this.melodyElement || !this.musicInfoElement) return;
        const gameState = this.game.gameStateManager.getGameState();

        if (!gameState.musicEnabled || !this.game.musicManager || !this.game.musicManager.getCurrentMelody()) {
            // Clear the melody display when no melody is playing or music is disabled
            this.melodyElement.textContent = '';

            // If music is enabled but no melody is playing yet, show "Loading..."
            if (gameState.musicEnabled && gameState.isGameStarted && !gameState.isPaused) {
                this.melodyElement.textContent = 'Loading...';
                this.musicInfoElement.classList.add('has-melody');
            } else {
                this.musicInfoElement.classList.remove('has-melody');
            }
            return;
        }

        const melodyInfo = this.game.musicManager.getCurrentMelody();
        if (!melodyInfo) {
            // This is a redundant check but ensures we always handle the case
            this.melodyElement.textContent = '';
            this.musicInfoElement.classList.remove('has-melody');
            return;
        }

        const displayName = melodyInfo.name;

        // Update the melody display
        this.melodyElement.textContent = displayName;

        // Show the melody name
        this.musicInfoElement.classList.add('has-melody');
    }

    showTemporaryMessage(message, duration = 2000) {
        // Clear any existing message and timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }

        // Update and show the message
        this.tempMessageElement.textContent = message;
        this.tempMessageElement.classList.add('visible');

        // Hide the message after duration
        this.messageTimeout = setTimeout(() => {
            this.tempMessageElement.classList.remove('visible');
            this.messageTimeout = null;
        }, duration);
    }
}

// Make UIManager globally accessible
window.UIManager = UIManager;
