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

        canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        canvas.addEventListener('touchend', touchEndHandler, { passive: true });

        // Prevent page scrolling when touching the canvas and text selection
        canvas.style.overscrollBehavior = 'none';
        canvas.style.touchAction = 'none';

        // Prevent text selection on the game canvas
        canvas.style.webkitUserSelect = 'none';
        canvas.style.userSelect = 'none';

        // Document click handler
        document.addEventListener('click', this.handleDocumentClick.bind(this));

        // Prevent default on touch events that might trigger selection
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('arrow-button') ||
                e.target.closest('.arrow-button') ||
                e.target.classList.contains('mobile-arrow-controls') ||
                e.target.closest('.mobile-arrow-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    handleKeyDown(event) {
        const gameState = this.game.gameStateManager.getGameState();

        // Special arrow key handling to start the game
        // Always check this first, regardless of other key handling
        if (!gameState.isGameStarted && !gameState.isGameOver &&
            [37, 38, 39, 40].includes(event.keyCode)) {
            event.preventDefault();

            // Set direction based on which arrow key was pressed
            let initialDirection = null;
            if (event.keyCode === 37) initialDirection = 'left';
            else if (event.keyCode === 38) initialDirection = 'up';
            else if (event.keyCode === 39) initialDirection = 'right';
            else if (event.keyCode === 40) initialDirection = 'down';

            // Start the game with the appropriate direction
            this.startGameWithInitialDirection(initialDirection);
            return;
        }

        // Prevent default for game control keys
        if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
            event.preventDefault();
        }

        // Feature toggles
        if (this.handleFeatureToggleKeys(event)) {
            return;
        }

        // Game state controls
        if (this.handleGameStateKeys(event)) {
            return;
        }

        // Direction controls (only if game is running)
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            this.handleDirectionKeys(event);
        }
    }

    handleFeatureToggleKeys(event) {
        const key = event.key && event.key.toLowerCase();
        const gameState = this.game.gameStateManager.getGameState();

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
            if (gameState.soundEnabled) {
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

            if (gameState.soundEnabled) {
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
            if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
                this.game.foodManager.spawnFruitInSnakeDirection(
                    this.game.snake,
                    this.game.direction,
                    this.game.getRandomFruit.bind(this.game),
                    this.game.soundManager
                );
            }
            return true;
        }

        return false;
    }

    handleGameStateKeys(event) {
        const gameState = this.game.gameStateManager.getGameState();

        if (event.keyCode === 32) { // Spacebar
            event.preventDefault(); // Prevent space scrolling
            if (gameState.isGameOver) {
                // Start game with no specific direction
                this.startGameWithInitialDirection();
            } else if (gameState.isGameStarted) {
                this.game.togglePause();
            } else {
                // Start the game with spacebar
                this.startGameWithInitialDirection();
            }
            return true;
        }

        return false;
    }

    handleDirectionKeys(event) {
        let keyDirection = null;
        if (event.keyCode === 37) keyDirection = 'left';
        else if (event.keyCode === 38) keyDirection = 'up';
        else if (event.keyCode === 39) keyDirection = 'right';
        else if (event.keyCode === 40) keyDirection = 'down';

        if (keyDirection) {
            this.handleDirectionAndSpeed(keyDirection, false);
        }
    }

    handleTouchStart(event) {
        // Prevent default for multi-touch to avoid zooming
        if (event.touches.length > 1) {
            event.preventDefault();
        }

        // Always try to initialize audio on any touch
        this.ensureAudioInitialized();

        const gameState = this.game.gameStateManager.getGameState();

        // Store initial touch details
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = new Date().getTime();
        this.touchMoved = false;
        this.accumulatedSwipeDistance = 0;
        this.lastSwipeDirection = null;
        this.hasAdjustedSpeed = false;

        // Handle two-finger tap for pause
        if (event.touches.length === 2 && gameState.isGameStarted && !gameState.isPaused) {
            event.preventDefault();
            this.game.togglePause();
            return;
        }

        // Unpause game with a single touch if paused
        if (gameState.isGameStarted && gameState.isPaused && event.touches.length === 1) {
            event.preventDefault();
            this.game.togglePause();
            return;
        }

        // Handle game over state - reset and start a new game
        if (gameState.isGameOver) {
            event.preventDefault();

            // Calculate swipe direction from initial touch coordinates for the new game
            const centerX = this.game.canvas.width / 2;
            const centerY = this.game.canvas.height / 2;
            const touchX = this.touchStartX;
            const touchY = this.touchStartY;

            // Determine main direction from touch position relative to center
            const deltaX = touchX - centerX;
            const deltaY = touchY - centerY;

            let initialDirection;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                initialDirection = deltaX > 0 ? 'right' : 'left';
            } else {
                initialDirection = deltaY > 0 ? 'down' : 'up';
            }

            // Use extracted method to start game with calculated direction
            this.startGameWithInitialDirection(initialDirection);
            return;
        }

        // Start game if not started yet
        if (!gameState.isGameStarted) {
            event.preventDefault();

            if (!this.game.hasUserInteraction) {
                this.game.startRequested = true;
                this.game.handleFirstInteraction();
            } else {
                // This is a fresh game start, let the startGame method handle melody selection
                this.startGameWithInitialDirection();
            }
            return;
        }
    }

    handleTouchMove(event) {
        const gameState = this.game.gameStateManager.getGameState();
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            event.preventDefault();
        }

        if (event.touches.length !== 1) return;

        if (!gameState.isGameStarted || gameState.isPaused || gameState.isGameOver) return;

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
            if (!this.hasAdjustedSpeed) {
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
        const gameState = this.game.gameStateManager.getGameState();

        // Reset speed adjustment flag when finger is lifted
        this.hasAdjustedSpeed = false;

        // Handle single tap to reduce speed - only if no movement occurred
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
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
        // Skip if no user interaction yet
        if (!this.game.hasUserInteraction) {
            return;
        }

        const gameState = this.game.gameStateManager.getGameState();

        // Get all elements that should NOT pause the game when clicked
        // Only active functionality elements should be here, not containers
        const nonPausingElements = [
            // Game canvas - clicking should not pause
            '#gameCanvas',
            '.canvas-wrapper',

            // Active controls - these should work normally during gameplay
            '#mobileArrowControls', // Contains all mobile arrow controls
            '.arrow-button', // For any individually placed arrow buttons
            '.spacer', // For any individual spacers
            '#soundToggle', // Sound on/off button
            '#musicToggle', // Music on/off button
            '.control-toggle', // Any toggle buttons
            '.melody-display', // Current melody display
            '.reset-button', // Reset high score button

            // Donation panel elements - should not pause when interacted with
            '.donation-panel', // Contains all donation panel elements
            '.copy-btn', // For any standalone copy buttons
            '.qr-code-link' // For any standalone QR links
        ];

        // Pause logic: Click outside when running & not paused
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            // Check if the clicked element (or any of its parents) is in the non-pausing list
            const shouldNotPause = nonPausingElements.some(selector => {
                return event.target.closest(selector) !== null;
            });

            if (!shouldNotPause) {
                this.game.togglePause();
                this.game.uiManager.showTemporaryMessage('Game paused', 1500);
                return;
            }
        }

        // Start logic: Click inside canvas when not started
        if (!gameState.isGameStarted && !gameState.isGameOver) {
            if (this.game.canvas.contains(event.target)) {
                this.game.startRequested = true;
                this.startGameWithInitialDirection();
                return;
            }
        }

        // Allow canvas clicks to restart game after game over
        if (gameState.isGameOver) {
            if (this.game.canvas.contains(event.target)) {
                // Get click position relative to canvas center for direction
                const rect = this.game.canvas.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const clickX = event.clientX - rect.left;
                const clickY = event.clientY - rect.top;

                // Determine initial direction from click position
                const deltaX = clickX - centerX;
                const deltaY = clickY - centerY;

                let initialDirection;
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    initialDirection = deltaX > 0 ? 'right' : 'left';
                } else {
                    initialDirection = deltaY > 0 ? 'down' : 'up';
                }

                this.startGameWithInitialDirection(initialDirection);
                return;
            }
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
            const gameState = this.game.gameStateManager.getGameState();

            // Always ensure audio is initialized on button press
            this.ensureAudioInitialized();

            // Trigger haptic feedback
            triggerHapticFeedback();

            // If game over, ignore arrow presses to prevent accidental restarts
            if (gameState.isGameOver) {
                return;
            }

            // If game hasn't started, handle game start
            if (!gameState.isGameStarted) {
                this.game.startRequested = true;

                // Check if this is the first interaction
                const isFirstInteraction = !this.game.hasUserInteraction;

                // Ensure interaction flag is set and audio is initialized
                this.game.handleFirstInteraction();

                // If this was the first interaction, startGame was already called by handleFirstInteraction
                if (!isFirstInteraction) {
                    // Explicitly initialize audio contexts - redundant but ensures audio works
                    SoundManager.hasUserInteraction = true;
                    this.game.audioManager.initializeAudio(true);

                    // Start game and loops
                    this.game.startGame();
                    this.game.gameLoop.startGameLoop();
                    this.game.gameLoop.startFruitLoop(this.game.manageFruits.bind(this.game));
                }

                // Also set initial direction based on the button pressed
                if (this.game.isValidDirectionChange(direction)) {
                    this.game.direction = direction;
                    this.game.nextDirection = direction;
                }

                return;
            }

            if (gameState.isPaused) {
                return;
            }

            // Use the shared method for handling direction changes and speed adjustments
            this.handleDirectionAndSpeed(direction, false);
        };

        // Add event listeners for buttons with proper event handling
        const createArrowButtonHandler = (direction) => {
            return (e) => {
                // Always prevent default behavior for all types of events
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling

                // Ensure audio is initialized directly from touch event
                if (!this.game.hasUserInteraction) {
                    this.game.hasUserInteraction = true;
                    SoundManager.hasUserInteraction = true;
                    this.game.audioManager.initializeAudio();
                }

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
