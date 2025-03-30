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
        
        // Donation panel elements
        this.donateButton = document.getElementById('donateButton');
        this.donationPanel = document.getElementById('donationPanel');
        this.closeDonationButton = document.getElementById('closeDonationPanel');

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
                                // Show success message
                                this.showTemporaryMessage('Address copied to clipboard!', 1500);
                                
                                // Visual feedback on button
                                const originalText = button.querySelector('.copy-icon').textContent;
                                button.querySelector('.copy-icon').textContent = '✓';
                                
                                setTimeout(() => {
                                    button.querySelector('.copy-icon').textContent = originalText;
                                }, 1500);
                            })
                            .catch(err => {
                                console.error('Could not copy text: ', err);
                                this.showTemporaryMessage('Failed to copy. Try manually selecting the text.', 2000);
                            });
                    } catch (err) {
                        // Fallback for older browsers
                        document.execCommand('copy');
                        this.showTemporaryMessage('Address copied to clipboard!', 1500);
                        
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
                // Show message to user
                this.showTemporaryMessage('Game paused', 1500);
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
