/**
 * Manages game user interface elements and game state communication.
 * - Implements score and high score display with proper formatting and animation
 * - Manages transient UI notifications with configurable timing and styling
 * - Renders game state messages (pause, game over, instructions)
 * - Controls UI element visibility based on current game state
 * - Implements feature toggle indicators (sound, music, vibration)
 * - Provides responsive UI positioning across different viewport sizes
 * - Manages UI animations for better visual feedback
 * - Implements fade-in/fade-out transitions for smoother UI experiences
 */
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
        this.tipAreaElement = document.getElementById('tipArea');
        this.initialTipText = this.tipAreaElement ? this.tipAreaElement.textContent : "← → ↑ ↓ / Swipe. Space / 2-finger tap Pause."; // Store initial text

        // Donation panel elements
        this.donateButton = document.getElementById('donateButton');
        this.donationPanel = document.getElementById('donationPanel');
        this.closeDonationButton = document.getElementById('closeDonationPanel');

        // Initialize the UI controls
        this.initializeControls();

        // Ensure initial tip is set (reading might happen after constructor in some cases)
        this.updateTipArea(this.initialTipText);
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

        // Set up music change on melody display click and N label click
        this.initializeMusicChangeControls();

        // Set up donation panel controls
        this.initializeDonationControls();
    }

    initializeMusicChangeControls() {
        // Add click handler to the melody display for changing music
        if (this.melodyElement) {
            this.melodyElement.addEventListener('click', () => {
                this.game.changeMusic();
            });

            // Make it clear this is clickable
            this.melodyElement.style.cursor = 'pointer';
            this.melodyElement.title = "Click to change melody (same as N key)";
        }

        // Find and add click handler to the N label that changes the music
        const nLabel = document.querySelector('.melody-display .control-label');
        if (nLabel) {
            nLabel.addEventListener('click', () => {
                this.game.changeMusic();
            });

            // Make it clear this is clickable
            nLabel.style.cursor = 'pointer';
            nLabel.title = "Click to change melody (N key)";
        }
    }

    initializeDonationControls() {
        // Set up donate button with multiple event handlers for better responsiveness
        if (this.donateButton) {
            // Use both click and pointerdown events for better mobile responsiveness
            const showDonationPanel = (e) => {
                e.preventDefault(); // Prevent any default actions
                e.stopPropagation(); // Stop event from propagating to document click handler
                this.toggleDonationPanel(true);
            };

            // Add multiple event listeners for better responsiveness
            this.donateButton.addEventListener('click', showDonationPanel);
            this.donateButton.addEventListener('pointerdown', showDonationPanel);

            // Add active state for visual feedback
            this.donateButton.addEventListener('pointerdown', () => {
                this.donateButton.classList.add('button-active');
            });

            this.donateButton.addEventListener('pointerup', () => {
                this.donateButton.classList.remove('button-active');
            });

            this.donateButton.addEventListener('pointerleave', () => {
                this.donateButton.classList.remove('button-active');
            });
        }

        // Set up close donation panel button
        if (this.closeDonationButton) {
            this.closeDonationButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDonationPanel(false);
            });
        }

        // Close donation panel when clicking outside
        document.addEventListener('click', (e) => {
            // If donation panel is open AND not just opened (to prevent immediate closing)
            if (this.donationPanel &&
                this.donationPanel.classList.contains('active') &&
                !this.donationPanelJustOpened) {

                // Check if click was outside the panel (and NOT on the donate button)
                if (!this.donationPanel.contains(e.target) && e.target !== this.donateButton) {
                    this.toggleDonationPanel(false);
                }
            }
        });

        // Add escape key listener to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.donationPanel && this.donationPanel.classList.contains('active')) {
                this.toggleDonationPanel(false);
            }
        });

        // Set up copy buttons for cryptocurrency addresses
        this.initializeCopyButtons();
    }

    initializeCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');

        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const addressId = button.getAttribute('data-address');
                const addressInput = document.getElementById(addressId);

                if (addressInput) {
                    // Select the text
                    addressInput.select();
                    addressInput.setSelectionRange(0, 99999); // For mobile devices

                    // Copy to clipboard
                    try {
                        navigator.clipboard.writeText(addressInput.value)
                            .then(() => {
                                // Show success message in tip area
                                this.updateTipArea('Address copied to clipboard!');

                                // Visual feedback on button
                                const originalText = button.querySelector('.copy-icon').textContent;
                                button.querySelector('.copy-icon').textContent = '✓';

                                setTimeout(() => {
                                    button.querySelector('.copy-icon').textContent = originalText;
                                }, 1500);
                            })
                            .catch(err => {
                                console.error('Could not copy text: ', err);
                                // Show failure message in tip area
                                this.updateTipArea('Failed to copy. Try manually selecting text.');
                            });
                    } catch (err) {
                        // Fallback for older browsers
                        document.execCommand('copy');
                         // Show success message in tip area
                        this.updateTipArea('Address copied to clipboard!');

                        // Visual feedback
                        const originalText = button.querySelector('.copy-icon').textContent;
                        button.querySelector('.copy-icon').textContent = '✓';

                        setTimeout(() => {
                            button.querySelector('.copy-icon').textContent = originalText;
                        }, 1500);
                    }
                }
            });
        });
    }

    toggleDonationPanel(show) {
        if (!this.donationPanel) return;

        if (show) {
            this.donationPanel.classList.add('active');
            // Set a flag to prevent immediate closing
            this.donationPanelJustOpened = true;

            // Clear the flag after animation completes
            setTimeout(() => {
                this.donationPanelJustOpened = false;
            }, 350); // Slightly longer than the CSS transition (300ms)

            // Pause the game if it's running
            if (this.game.gameStateManager.getGameState().isGameStarted &&
                !this.game.gameStateManager.getGameState().isPaused) {
                this.game.pauseGame();
                // Show message in tip area
                this.updateTipArea('Game paused');
            }
        } else {
            this.donationPanel.classList.remove('active');

            // Reset donate button state when panel is closed
            if (this.donateButton) {
                this.donateButton.classList.remove('button-active');
            }
        }
    }

    updateSoundToggleUI() {
        console.log("UIManager: Updating Sound Toggle UI");
        if (!this.soundToggle) {
            console.error("UIManager: Sound toggle element not found!");
            return;
        }
        const soundOnIcon = this.soundToggle.querySelector('.sound-on');
        const soundOffIcon = this.soundToggle.querySelector('.sound-off');
        if (!soundOnIcon || !soundOffIcon) {
             console.error("UIManager: Sound toggle icons not found!");
             // Don't return, maybe the main toggle class can still be updated
        }

        // Get state directly from AudioManager
        const isSoundEnabled = this.game.audioManager.isSoundEnabled();
        console.log(`UIManager: Sound state is: ${isSoundEnabled}`);

        if (isSoundEnabled) {
            console.log("UIManager: Setting sound UI to ON");
            this.soundToggle.classList.remove('disabled');
            this.soundToggle.title = "Sound ON (S key to toggle)";
            if (soundOnIcon) soundOnIcon.classList.remove('hidden');
            if (soundOffIcon) soundOffIcon.classList.add('hidden');
        } else {
            console.log("UIManager: Setting sound UI to OFF");
            this.soundToggle.classList.add('disabled');
            this.soundToggle.title = "Sound OFF (S key to toggle)";
            if (soundOnIcon) soundOnIcon.classList.add('hidden');
            if (soundOffIcon) soundOffIcon.classList.remove('hidden');
        }
        console.log("UIManager: Sound Toggle classes:", this.soundToggle.classList);
        if (soundOnIcon) console.log("UIManager: Sound ON Icon classes:", soundOnIcon.classList);
        if (soundOffIcon) console.log("UIManager: Sound OFF Icon classes:", soundOffIcon.classList);
    }

    updateMusicToggleUI() {
        console.log("UIManager: Updating Music Toggle UI");
        if (!this.musicToggle) {
            console.error("UIManager: Music toggle element not found!");
            return;
        }
        const musicOnIcon = this.musicToggle.querySelector('.music-on');
        const musicOffIcon = this.musicToggle.querySelector('.music-off');
         if (!musicOnIcon || !musicOffIcon) {
             console.error("UIManager: Music toggle icons not found!");
             // Don't return, maybe the main toggle class can still be updated
        }

         // Get state directly from AudioManager
        const isMusicEnabled = this.game.audioManager.isMusicEnabled();
        console.log(`UIManager: Music state is: ${isMusicEnabled}`); 

        if (isMusicEnabled) {
            console.log("UIManager: Setting music UI to ON");
            this.musicToggle.classList.remove('disabled');
            this.musicToggle.title = "Music ON (M key to toggle)";
            if (musicOnIcon) musicOnIcon.classList.remove('hidden');
            if (musicOffIcon) musicOffIcon.classList.add('hidden');
        } else {
            console.log("UIManager: Setting music UI to OFF");
            this.musicToggle.classList.add('disabled');
            this.musicToggle.title = "Music OFF (M key to toggle)";
            if (musicOnIcon) musicOnIcon.classList.add('hidden');
            if (musicOffIcon) musicOffIcon.classList.remove('hidden');
        }
        console.log("UIManager: Music Toggle classes:", this.musicToggle.classList);
        if (musicOnIcon) console.log("UIManager: Music ON Icon classes:", musicOnIcon.classList);
        if (musicOffIcon) console.log("UIManager: Music OFF Icon classes:", musicOffIcon.classList);
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
            if (this.game.soundManager && this.game.audioManager.isSoundEnabled()) {
                this.game.soundManager.playSound('crash');
            }
        }
    }

    clearMelodyDisplay() {
        if (this.melodyElement) {
            const melodyTextElement = this.melodyElement.querySelector('.melody-text');
            if (melodyTextElement) {
                melodyTextElement.textContent = '';
            }
        }

        if (this.musicInfoElement) {
            // Just remove the has-melody class, but the note icon will remain visible
            this.musicInfoElement.classList.remove('has-melody');
        }
    }

    updateMelodyDisplay() {
        if (!this.melodyElement || !this.musicInfoElement) return;
        // Get state directly from AudioManager
        const isMusicEnabled = this.game.audioManager.isMusicEnabled();
        const melodyTextElement = this.melodyElement.querySelector('.melody-text');
        if (!melodyTextElement) return;

        const currentMelody = MusicManager.getCurrentMelody(); // Still get melody info from MusicManager

        if (!isMusicEnabled || !currentMelody) {
            // Clear melody text if music off or no melody
            melodyTextElement.textContent = '';
            this.musicInfoElement.classList.remove('has-melody');
            return;
        }

        // Update display if music on and melody exists
        melodyTextElement.textContent = currentMelody.name;
        this.musicInfoElement.classList.add('has-melody');
    }

    /**
     * Updates the text content of the tip area.
     * If no message is provided, it resets to the initial tip text.
     * @param {string} [message] The message to display. Defaults to the initial tip text.
     */
    updateTipArea(message) {
        if (this.tipAreaElement) {
            // Use the provided message or fall back to the stored initial text
            const newText = message || this.initialTipText;
            this.tipAreaElement.textContent = newText;
            
            // Only add flash animation when displaying a non-default tip
            if (message && message !== this.initialTipText) {
                this.tipAreaElement.classList.remove('tip-flash');
                // Force reflow to restart animation
                void this.tipAreaElement.offsetWidth;
                this.tipAreaElement.classList.add('tip-flash');
            }
        }
    }
}

// Make UIManager globally accessible
window.UIManager = UIManager;
