/**
 * Processes and translates user input into game actions.
 * - Captures keyboard, touch, and click events from multiple device types
 * - Implements swipe detection with configurable thresholds and sensitivity
 * - Provides adaptive control schemes optimized for different input methods
 * - Translates raw input events into game commands based on current game state
 * - Manages feature toggle controls (sound, music, vibration, luck mode)
 * - Implements mobile-specific controls including virtual buttons and touch gestures
 * - Prevents default browser behaviors that would interfere with gameplay
 * - Ensures first-interaction detection for proper audio initialization
 */
class InputManager {
    constructor(game) {
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.touchMoved = false;
        this.accumulatedSwipeDistance = 0;
        this.lastSwipeDirection = null;
        this.hasAdjustedSpeed = false;

        this.setupEventListeners();
        this.initMobileArrowButtons();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Touch events for mobile controls
        const canvas = this.game.canvas;
        const touchStartHandler = (e) => this.handleTouchStart(e);
        const touchMoveHandler = (e) => this.handleTouchMove(e);
        const touchEndHandler = (e) => this.handleTouchEnd(e);

        // We must use non-passive listeners to allow preventDefault for active gameplay
        canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        canvas.addEventListener('touchend', touchEndHandler, { passive: true });

        // Canvas-specific styles - prevent text selection during gameplay
        canvas.style.webkitUserSelect = 'none';
        canvas.style.userSelect = 'none';

        // Add touchmove handler to window to prevent scrolling game container
        // during gameplay
        window.addEventListener('touchmove', (e) => {
            const gameState = this.game.gameStateManager.getGameState();
            // Only prevent default when actively playing and the touch is on or started on canvas
            if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver &&
                (e.target.id === 'gameCanvas' || e.target.closest('.canvas-wrapper'))) {
                e.preventDefault();
            }
        }, { passive: false });

        // Document click handler
        document.addEventListener('click', this.handleDocumentClick.bind(this));

        // Be very specific about when to prevent default - only for arrow buttons and game controls
        document.addEventListener('touchstart', (e) => {
            const gameState = this.game.gameStateManager.getGameState();

            // Prevent default for game controls during gameplay
            if ((e.target.classList.contains('arrow-button') ||
                e.target.closest('.arrow-button') ||
                (e.target.closest('svg') && e.target.closest('.arrow-button'))) ||
                (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver &&
                    e.target.id === 'gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Check and attempt to resume suspended audio context if necessary.
     * Should be called within a user gesture handler.
     * @private
     */
    _ensureAudioResumed() {
        const audioManager = this.game.audioManager;
        // Only check if audio *should* be playing (either sounds or music enabled)
        if (audioManager && (audioManager.isMusicEnabled() || audioManager.isSoundEnabled())) {
            const context = SoundManager.getAudioContext();
            if (context && context.state === 'suspended') {
                console.log("InputManager: Detected suspended context during interaction, attempting sync resume.");
                const resumed = SoundManager.tryUnlockAudioSync(); // Attempt resume within the user gesture
                if (resumed) {
                    console.log("InputManager: Sync resume successful or context was already running.");
                    // If successful, ensure AudioManager knows the context is likely ready now
                    // This might trigger music resume if needed
                    audioManager.markAudioAsInitialized();
                } else {
                    console.warn("InputManager: Sync resume attempt failed.");
                }
            }
        }
    }

    handleKeyDown(event) {
        this._ensureAudioResumed(); // Check/Resume audio context first
        this.game.handleFirstInteraction();
        if (!this.game.hasUserInteraction) return;

        // --- Audio Init Retry ---
        // Attempt to initialize audio on any keydown if not already initialized
        this.game.audioManager.tryInitializeAudio();
        // ----------------------

        const initialGameState = this.game.gameStateManager.getGameState();
        const isArrowKey = [37, 38, 39, 40].includes(event.keyCode);
        const isSpacebar = event.keyCode === 32;
        const canStartGame = !initialGameState.isGameStarted && !initialGameState.isGameOver;
        let gameWasJustStarted = false; // Flag to track if start happened in this handler

        // --- Interaction and Start --- 
        if ((isArrowKey || isSpacebar) && canStartGame) {
            event.preventDefault(); 
            this.game.handleFirstInteraction();
            if (this.game.hasUserInteraction) {
                console.log(`InputManager: Starting game via ${isArrowKey ? 'arrow key' : 'spacebar'}.`);
                this.game.startGame(); 
                gameWasJustStarted = true; // Set the flag
            } else {
                this.game.startRequested = true;
                return; // Exit if interaction needed but failed
            }
        }

        // --- Prevent Default --- 
        // Re-check state as it might have changed
        const currentGameState = this.game.gameStateManager.getGameState(); 
        // Prevent default if game is active OR if it *could* start (even if start failed above)
        if ((isArrowKey || isSpacebar) && (currentGameState.isGameStarted || canStartGame)) {
             event.preventDefault();
        }

        // --- Feature Toggles --- 
        if (!gameWasJustStarted && this.handleFeatureToggleKeys(event)) {
             // Don't process toggles if game was just started by this key press
             // (e.g., prevent 'S' starting game AND toggling sound immediately)
            return; 
        }

        // --- State Handling (Spacebar) & Direction (Arrows) --- 
        // Get the absolute latest game state again
        const latestGameState = this.game.gameStateManager.getGameState();

        // Use else-if structure and check the flag to prevent double actions
        if (isSpacebar && !gameWasJustStarted) {
            // Spacebar Action (only if game wasn't just started by *this* press)
            if (latestGameState.isGameStarted && !latestGameState.isGameOver) {
                console.log("InputManager: Toggling pause/unpause via spacebar.");
                this.game.togglePause();
            } else if (latestGameState.isGameOver) {
                 console.log("InputManager: Attempting restart via spacebar.");
                 this.game.handleFirstInteraction(); // Ensure interaction
                 if (this.game.hasUserInteraction) {
                     this.game.startGame(); // startGame handles reset logic
                 }
            }
            return; // Spacebar action handled
        } 
        
        // Arrow keys should only affect direction if game is running
        // No 'else if' needed here as arrows don't have the same state-change conflict
        if (isArrowKey && latestGameState.isGameStarted && !latestGameState.isPaused && !latestGameState.isGameOver) {
            this.handleDirectionKeys(event); 
            return; // Arrow key direction handled
        }
    }

    handleFeatureToggleKeys(event) {
        const key = event.key && event.key.toLowerCase();
        // const gameState = this.game.gameStateManager.getGameState(); // Not needed directly

        if (key === 's') {
            event.preventDefault();
            this.game.toggleSound();
            return true;
        }

        if (key === 'm') {
            event.preventDefault();
            this.game.toggleMusic();
            return true;
        }

        if (key === 'n') {
            event.preventDefault();
            this.game.changeMusic();
            return true;
        }

        if (key === 'l') {
            event.preventDefault();
            const luckEnabled = this.game.gameStateManager.toggleLuck();
            // Use AudioManager to check if sound can be played
            if (this.game.audioManager.canPlaySound()) {
                this.game.soundManager.playSound('click', 0.3);
            }
            this.game.uiManager.showTemporaryMessage(
                luckEnabled ? "Luck ON (80% chance to avoid crashes)" : "Luck OFF",
                1500
            );
            return true;
        }

        if (key === 'v') {
            event.preventDefault();
            const shakeEnabled = this.game.gameStateManager.toggleShake();
            // Use AudioManager to check if sound can be played
            if (this.game.audioManager.canPlaySound()) {
                this.game.soundManager.playSound('click', 0.3);
            }
            this.game.uiManager.showTemporaryMessage(
                shakeEnabled ? "Snake Vibration ON" : "Snake Vibration OFF",
                1500
            );
            return true;
        }

        if (key === 'a') {
            event.preventDefault();
            const currentGameState = this.game.gameStateManager.getGameState(); // Get current state
            if (currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                this.game.foodManager.spawnFruitInSnakeDirection(
                    this.game.snake,
                    this.game.direction,
                    this.game.getRandomFruit.bind(this.game),
                    this.game.soundManager // Pass the SoundManager instance
                );
            }
            return true;
        }

        return false;
    }

    handleDirectionKeys(event) {
        // This method now ONLY handles direction changes when the game is running
        let keyDirection = null;
        if (event.keyCode === 37) keyDirection = 'left';
        else if (event.keyCode === 38) keyDirection = 'up';
        else if (event.keyCode === 39) keyDirection = 'right';
        else if (event.keyCode === 40) keyDirection = 'down';

        if (keyDirection) {
            // Use the centralized method for applying direction and speed changes
            this.handleDirectionAndSpeed(keyDirection, false);
        }
    }

    handleTouchStart(event) {
        this._ensureAudioResumed(); // Check/Resume audio context first
        this.game.handleFirstInteraction();
        if (!this.game.hasUserInteraction) return;

        // --- Audio Init Retry ---
        // Attempt to initialize audio on any touchstart if not already initialized
        // Note: handleFirstInteraction ALSO attempts init, but this covers subsequent touches
        this.game.audioManager.tryInitializeAudio();
        // ----------------------
        
        const gameState = this.game.gameStateManager.getGameState();

        // Prevent default if needed
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver &&
            event.target.id === 'gameCanvas') {
            event.preventDefault();
        }

        // Cache touch info
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = new Date().getTime();
        this.touchMoved = false;
        this.accumulatedSwipeDistance = 0;
        this.lastSwipeDirection = null;
        this.hasAdjustedSpeed = false;

        // Two-finger pause
        if (event.touches.length === 2 && gameState.isGameStarted && !gameState.isPaused) {
            event.preventDefault();
            this.game.togglePause();
            return;
        }

        // Single touch unpause
        if (gameState.isGameStarted && gameState.isPaused && event.touches.length === 1) {
            if (event.target.id === 'gameCanvas') event.preventDefault();
            this.game.togglePause();
            return;
        }

        // Single touch restart (if game over)
        if (gameState.isGameOver) {
            if (event.target.id === 'gameCanvas') event.preventDefault();
            if (this.game.hasUserInteraction) {
                 console.log("InputManager: Restarting game via touch.");
                 this.game.startGame(); // Handles reset
            } else {
                 this.game.startRequested = true;
            }
            return;
        }

        // Single touch start (if not started)
        if (!gameState.isGameStarted) {
            if (event.target.id === 'gameCanvas') event.preventDefault();
            if (this.game.hasUserInteraction) {
                 console.log("InputManager: Starting game via touch.");
                 this.game.startGame();
            } else {
                 this.game.startRequested = true;
            }
            return;
        }
    }

    handleTouchMove(event) {
        if (!this.game.hasUserInteraction) return;
        // --- Audio Init Retry ---
        // Attempt to initialize audio on any touchmove if not already initialized
        // Important for cases where the first touch was on a UI element, not canvas
        this.game.audioManager.tryInitializeAudio();
        // ----------------------
        
        const gameState = this.game.gameStateManager.getGameState();

        // Prevent default for ALL touch move events on canvas during active gameplay
        if (event.target.id === 'gameCanvas' && gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            event.preventDefault();
        } else {
            // Allow scrolling when not in active gameplay
            return;
        }

        if (event.touches.length !== 1) return;

        // Calculate thresholds based on canvas size
        const canvasSize = this.game.canvas.width;
        const smallSwipeThreshold = canvasSize * 0.02;
        const wideSwipeThreshold = canvasSize * 0.33;
        const accumulatedThreshold = canvasSize * 0.33;

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        // Only change direction if the drag distance is significant
        if (Math.abs(deltaX) > smallSwipeThreshold || Math.abs(deltaY) > smallSwipeThreshold) {
            this.touchMoved = true;

            // Determine the primary direction of the swipe
            let newDirection;
            let primaryDelta;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newDirection = deltaX > 0 ? 'right' : 'left';
                primaryDelta = Math.abs(deltaX);
            } else {
                newDirection = deltaY > 0 ? 'down' : 'up';
                primaryDelta = Math.abs(deltaY);
            }

            // Reset accumulated distance if direction changes
            if (this.lastSwipeDirection !== newDirection) {
                this.accumulatedSwipeDistance = 0;
                this.lastSwipeDirection = newDirection;
                this.hasAdjustedSpeed = false;
            }

            // Accumulate the swipe distance in the current direction
            this.accumulatedSwipeDistance += primaryDelta;

            // Check if we haven't already adjusted speed for this touch or direction
            // AND that the game is actually running
            const currentGameState = this.game.gameStateManager.getGameState(); // Check latest state
            if (!this.hasAdjustedSpeed && currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                this.handleDirectionAndSpeed(newDirection, true, {
                    primaryDelta,
                    isWideSwipe: primaryDelta > wideSwipeThreshold,
                    accumulatedDistance: this.accumulatedSwipeDistance,
                    accumulatedThreshold
                });
                this.hasAdjustedSpeed = true;
            }

            // Reset starting position to allow continuous dragging
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }

    handleTouchEnd(event) {
        if (!this.game.hasUserInteraction) return;
        // Reset speed adjustment flag when finger is lifted
        this.hasAdjustedSpeed = false;

        // Handle single tap to reduce speed - only if no movement occurred
        if (this.game.gameStateManager.getGameState().isGameStarted && !this.game.gameStateManager.getGameState().isPaused && !this.game.gameStateManager.getGameState().isGameOver) {
            const touchEndTime = new Date().getTime();
            const touchDuration = touchEndTime - this.touchStartTime;

            // If it's a quick tap (less than 250ms) AND no significant movement occurred
            if (touchDuration < 250 && !this.touchMoved && event.changedTouches.length === 1) {
                // Slow down the snake temporarily
                this.game.gameLoop.reduceSpeed();
            }
        }
    }

    handleDocumentClick(event) {
        this._ensureAudioResumed(); // Check/Resume audio context first

        // Moved the original audioManager.tryInitializeAudio() call earlier
        // because _ensureAudioResumed might handle the suspended state.
        // tryInitializeAudio will still handle the initial unlock and restoration path.
        this.game.audioManager.tryInitializeAudio(); 

        this.game.handleFirstInteraction();
        if (!this.game.hasUserInteraction) {
            this.game.startRequested = true;
            return;
        }

        const gameState = this.game.gameStateManager.getGameState();
        const interactiveSelectors = [
            '#gameCanvas',
            '.canvas-wrapper',
            '#mobileArrowControls',
            '.arrow-button',
            '#soundToggle',
            '#musicToggle',
            '.control-toggle',
            '.melody-display',
            '.reset-button',
            '.donation-panel',
            '#aboutPanel',
            '.panel-close-button',
            '.panel-header',
            '.github-button',
            '#aboutButton',
            '#donateButton',
            '.header-buttons'
        ];
        const isInteractiveClick = interactiveSelectors.some(selector => event.target.closest(selector));
        const isCanvasClick = event.target.closest('#gameCanvas') !== null;

        // Pause if running and click outside interactive
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver && !isInteractiveClick) {
            this.game.togglePause();
            this.game.uiManager.showTemporaryMessage('Game paused', 1500);
            return;
        }

        // Start/Restart on canvas click
        if (isCanvasClick) {
            if (!gameState.isGameStarted && !gameState.isGameOver) {
                console.log("InputManager: Starting game via canvas click.");
                this.game.startGame();
            } else if (gameState.isGameOver) {
                console.log("InputManager: Restarting game via canvas click.");
                this.game.startGame(); // Handles reset
            }
            return;
        }
    }

    // Initialize mobile arrow button controls
    initMobileArrowButtons() {
        // Only initialize on touch devices
        if (!this.isTouchDevice()) return;

        // Get button references
        const upButton = document.getElementById('upArrow');
        const downButton = document.getElementById('downArrow');
        const leftButton = document.getElementById('leftArrow');
        const rightButton = document.getElementById('rightArrow');

        // Verify that all required buttons exist in the DOM
        if (!upButton || !downButton || !leftButton || !rightButton) {
            console.error('Mobile arrow buttons not found in the DOM');
            return;
        }

        // Function to trigger haptic feedback if available
        const triggerHapticFeedback = () => {
            if (navigator.vibrate) {
                navigator.vibrate(15); // 15ms short vibration
            }
        };

        /**
         * Mobile arrow buttons behavior:
         * These buttons act as proxies for keyboard arrow keys in touch environments.
         * When pressed, they:
         * 1. Trigger haptic feedback when available (short vibration)
         * 2. Start the game if not already started
         * 3. Change snake direction according to the pressed button (if valid)
         * 4. Adjust game speed based on the direction change, simulating keyboard inputs
         * 5. Initialize audio on first interaction to comply with browser autoplay policies
         */

        // Helper function to handle button press
        const handleArrowButtonPress = (direction) => {
             // --- Audio Init Retry ---
             // Attempt to initialize audio on any arrow button press if not already initialized
             this.game.audioManager.tryInitializeAudio();
             // ----------------------

             // Ensure interaction is handled (idempotent)
             this.game.handleFirstInteraction();

             // Only proceed if interaction is successful
             if (!this.game.hasUserInteraction) {
                console.log("InputManager: Arrow button pressed, interaction pending.");
                this.game.startRequested = true;
                return;
            }

            triggerHapticFeedback();
            const gameState = this.game.gameStateManager.getGameState();

            if (gameState.isGameOver) return; // Ignore presses on game over

            if (!gameState.isGameStarted) {
                // Start the game if not started
                 console.log("InputManager: Starting game via arrow button.");
                 this.game.startGame();
                 // Set initial direction *after* starting
                 if (this.game.isValidDirectionChange(direction)) {
                     // Use a small delay to ensure game loop has processed the start
                     setTimeout(() => {
                         this.game.direction = direction;
                         this.game.nextDirection = direction;
                     }, 0); // Minimal delay
                 }
            } else if (!gameState.isPaused) {
                 // If running, handle direction change
                 this.handleDirectionAndSpeed(direction, false); // Treat button like keyboard
             }
             // If paused, do nothing
        };

        // Add event listeners for buttons with proper event handling
        const createArrowButtonHandler = (direction) => {
            return (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleArrowButtonPress(direction);
            };
        };

        // Add touch event listeners with the common handler and passive: false to ensure preventDefault works
        upButton.addEventListener('touchstart', createArrowButtonHandler('up'), { passive: false });
        downButton.addEventListener('touchstart', createArrowButtonHandler('down'), { passive: false });
        leftButton.addEventListener('touchstart', createArrowButtonHandler('left'), { passive: false });
        rightButton.addEventListener('touchstart', createArrowButtonHandler('right'), { passive: false });

        // Add mouse event listeners as fallback for hybrid devices
        upButton.addEventListener('mousedown', createArrowButtonHandler('up'));
        downButton.addEventListener('mousedown', createArrowButtonHandler('down'));
        leftButton.addEventListener('mousedown', createArrowButtonHandler('left'));
        rightButton.addEventListener('mousedown', createArrowButtonHandler('right'));

        // Add active state styling for visual feedback
        const buttons = [upButton, downButton, leftButton, rightButton];
        buttons.forEach(button => {
            ['touchstart', 'mousedown'].forEach(eventType => {
                button.addEventListener(eventType, () => button.classList.add('active'));
            });

            ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(eventType => {
                button.addEventListener(eventType, () => button.classList.remove('active'));
            });
        });
    }

    // Check if the device is a touch device
    isTouchDevice() {
        return ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);
    }

    // Add helper method to ensure audio is initialized on touch devices
    ensureAudioInitialized() {
        // Set interaction flag
        if (!this.game.hasUserInteraction) {
            this.game.hasUserInteraction = true;

            // Use the centralized audio manager method to initialize audio context
            if (this.game.audioManager) {
                console.log("InputManager: Ensuring audio is initialized from touch event");
                this.game.audioManager.ensureAudioContext(true, true);
            }
        }
    }

    // Add this new method to handle common game starting logic
    startGameWithInitialDirection(direction = null) {
        // Ensure user interaction flag is set and audio is initialized
        if (!this.game.hasUserInteraction) {
            this.game.handleFirstInteraction();
        }

        // Always ensure audio is properly initialized on game start
        SoundManager.hasUserInteraction = true;
        this.game.audioManager.initializeAudio(true);

        // Use the centralized method to ensure audio context is ready
        // and play a click sound to help unlock audio
        this.game.audioManager.ensureAudioContext(true, true);

        // Start the game
        this.game.startGame();

        // Set initial direction if specified
        if (direction && this.game.isValidDirectionChange(direction)) {
            setTimeout(() => {
                this.game.direction = direction;
                this.game.nextDirection = direction;
            }, 50);
        }
    }

    // Centralized method to handle direction changes and speed adjustments
    handleDirectionAndSpeed(newDirection, isTouch = false, options = {}) {
        const {
            primaryDelta = 0,
            isWideSwipe = false,
            accumulatedDistance = 0,
            accumulatedThreshold = 0
        } = options;

        // Always adjust speed based on direction, regardless of whether direction change is valid
        if (isTouch) {
            // Touch controls use different speed multipliers
            this.game.gameLoop.updateTouchGameSpeed(newDirection, this.game.direction);

            // Apply an extra boost for wide or accumulated swipes in the same direction
            if (newDirection === this.game.direction &&
                (isWideSwipe || accumulatedDistance > accumulatedThreshold)) {
                this.game.gameLoop.updateTouchGameSpeed(newDirection, this.game.direction);
            }
        } else {
            // Keyboard and arrow button controls
            this.game.gameLoop.updateGameSpeed(newDirection, this.game.direction);
        }

        // Only update the direction if the change is valid
        if (this.game.isValidDirectionChange(newDirection)) {
            this.game.nextDirection = newDirection;
            return true;
        }
        return false;
    }
}

// Make InputManager globally accessible
window.InputManager = InputManager;
