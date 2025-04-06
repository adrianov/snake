/**
 * Manages the game information panel functionality.
 * - Works with UIManager to avoid code duplication
 * - Handles showing and hiding the about panel
 * - Implements panel transition animations
 * - Manages click outside detection and keyboard shortcuts
 * - Connects about panel with existing game systems
 */
class PanelManager {
    constructor() {
        // Wait for UIManager to be available
        this.waitForUIManager(() => {
            this.initialize();
        });
    }

    waitForUIManager(callback) {
        // Check if game instance and UIManager exist
        if (window.SnakeGame && window.SnakeGame.uiManager) {
            callback();
        } else {
            // Retry after a short delay
            setTimeout(() => this.waitForUIManager(callback), 100);
        }
    }

    initialize() {
        // Get reference to the game's UIManager
        this.uiManager = window.SnakeGame.uiManager;

        // Initialize panel references
        this.helpPanel = document.getElementById('aboutPanel');

        // Initialize button references
        this.helpButton = document.getElementById('aboutButton');
        this.closeHelpButton = document.getElementById('closeAboutPanel');
        this.helpDonateButton = document.getElementById('aboutDonateButton');
        this.playNowButton = document.getElementById('playNowButton');

        // Set up event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Only initialize if we have required elements
        if (!this.helpPanel || !this.uiManager) return;

        // About panel controls
        if (this.helpButton) {
            this.helpButton.addEventListener('click', () => this.openHelpPanel());
        }

        if (this.closeHelpButton) {
            this.closeHelpButton.addEventListener('click', () => this.closeHelpPanel());
        }

        if (this.playNowButton) {
            this.playNowButton.addEventListener('click', () => this.closeHelpPanel());
        }

        // About panel's donate button - connect to existing donation panel
        if (this.helpDonateButton && this.uiManager.donationPanel) {
            this.helpDonateButton.addEventListener('click', () => {
                this.closeHelpPanel();
                setTimeout(() => {
                    this.uiManager.toggleDonationPanel(true);
                }, 300);
            });
        }

        // Close panels when clicking outside
        document.addEventListener('click', (event) => this.handleOutsideClick(event));

        // Close panels with Escape key
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    openHelpPanel() {
        if (this.helpPanel) {
            this.helpPanel.classList.add('active');

            // Pause the game if it's running
            const game = window.SnakeGame;
            if (game && game.gameStateManager) {
                const gameState = game.gameStateManager.getGameState();
                if (gameState.isGameStarted && !gameState.isPaused) {
                    game.pauseGame();
                    // Show message in tip area
                    this.uiManager.updateTipArea('Game paused');
                }
            }
        }
    }

    closeHelpPanel() {
        if (this.helpPanel) {
            this.helpPanel.classList.remove('active');
        }
    }

    handleOutsideClick(event) {
        // Check if about panel is open and click is outside
        if (this.helpPanel && this.helpPanel.classList.contains('active')) {
            if (!this.helpPanel.contains(event.target) &&
                this.helpButton !== event.target &&
                !this.helpButton.contains(event.target)) {
                this.closeHelpPanel();
            }
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            if (this.helpPanel && this.helpPanel.classList.contains('active')) {
                this.closeHelpPanel();
            }
        }
    }
}

// Initialize the panel manager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.panelManager = new PanelManager();
});
