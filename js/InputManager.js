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

        // Prevent page scrolling when touching the canvas
        canvas.style.overscrollBehavior = 'none';
        canvas.style.touchAction = 'none';

        // Document click handler
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }

    handleKeyDown(event) {
        // Feature toggles
        if (this.handleFeatureToggleKeys(event)) {
            return;
        }

        // Prevent default for game control keys
        if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
            event.preventDefault();
        }

        // Game state controls
        if (this.handleGameStateKeys(event)) {
            return;
        }

        // Direction controls (only if game is running)
        const gameState = this.game.gameStateManager.getGameState();
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
                this.game.resetGame();
                this.game.startRequested = true;
                this.game.handleFirstInteraction();

                this.game.gameLoop.startGameLoop();
                this.game.gameLoop.startFruitLoop(this.game.manageFruits.bind(this.game));
            } else if (gameState.isGameStarted) {
                this.game.togglePause();
            } else {
                this.game.startRequested = true;
                this.game.handleFirstInteraction();
            }
            return true;
        }

        // Start game with arrow keys if not started
        if (!gameState.isGameStarted && !gameState.isGameOver && [37, 38, 39, 40].includes(event.keyCode)) {
            event.preventDefault();
            this.game.startRequested = true;
            this.game.handleFirstInteraction();
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
            const validDirectionChange = this.game.isValidDirectionChange(keyDirection);
            if (validDirectionChange) {
                this.game.nextDirection = keyDirection;
            }
            this.game.gameLoop.updateGameSpeed(keyDirection, this.game.direction);
        }
    }

    handleTouchStart(event) {
        // Prevent default for multi-touch to avoid zooming
        if (event.touches.length > 1) {
            event.preventDefault();
        }

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

            this.game.resetGame();
            this.game.gameLoop.startGameLoop();
            this.game.gameLoop.startFruitLoop(this.game.manageFruits.bind(this.game));

            if (!this.game.hasUserInteraction) {
                this.game.handleFirstInteraction();
            } else {
                // Make sure SoundManager knows we have user interaction
                SoundManager.hasUserInteraction = true;
                this.game.audioManager.initializeAudio();
                this.game.audioManager.initializeGameMusic(true);
            }

            return;
        }

        // Start game if not started yet
        if (!gameState.isGameStarted) {
            event.preventDefault();

            if (!this.game.hasUserInteraction) {
                this.game.startRequested = true;
                this.game.handleFirstInteraction();
            } else {
                // Make sure SoundManager knows we have user interaction
                SoundManager.hasUserInteraction = true;
                this.game.audioManager.initializeAudio();
                this.game.startGame();
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

            if (this.game.isValidDirectionChange(newDirection)) {
                // Apply the direction change
                this.game.nextDirection = newDirection;

                // Check if we haven't already adjusted speed for this touch or direction
                if (!this.hasAdjustedSpeed) {
                    this.game.gameLoop.updateTouchGameSpeed(newDirection, this.game.direction);

                    // If it's a wide swipe in the same direction, apply one additional boost
                    if ((newDirection === this.game.direction) &&
                        (primaryDelta > wideSwipeThreshold || this.accumulatedSwipeDistance > accumulatedThreshold)) {
                        this.game.gameLoop.updateTouchGameSpeed(newDirection, this.game.direction);
                    }

                    this.hasAdjustedSpeed = true;
                }
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
        const nonPausingElements = [
            '.canvas-wrapper',
            '#gameCanvas',
            '.controls',
            '.donation-panel',
            '.music-info',
            '#soundToggle',
            '#musicToggle',
            '.mobile-arrow-controls',
            '.arrow-button',
            '.game-controls',
            '.mobile-only-tip',
            '.desktop-only-tip',
            '.tip-item',
            '.score-container',
            '.score-item',
            '.reset-button',
            '.control-toggle',
            '.melody-display'
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
                this.game.startGame();
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

        if (!upButton || !downButton || !leftButton || !rightButton) return;

        // Function to trigger haptic feedback if available
        const triggerHapticFeedback = () => {
            if (navigator.vibrate) {
                navigator.vibrate(15); // 15ms short vibration
            }
        };

        // Helper function to handle button press
        const handleArrowButtonPress = (direction) => {
            const gameState = this.game.gameStateManager.getGameState();

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
                    this.game.audioManager.initializeAudio();

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

            // Call updateGameSpeed regardless of validity
            // The function itself handles opposite direction logic for slowing down.
            this.game.gameLoop.updateGameSpeed(direction, this.game.direction);

            // Only update the nextDirection if the change is valid
            const isValid = this.game.isValidDirectionChange(direction);
            if (isValid) {
                this.game.nextDirection = direction;
            }
        };

        // Add event listeners for buttons
        upButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }

            // Ensure audio is initialized directly from touch event
            if (!this.game.hasUserInteraction) {
                this.game.hasUserInteraction = true;
                SoundManager.hasUserInteraction = true;
                this.game.audioManager.initializeAudio();
            }

            handleArrowButtonPress('up');
        });

        downButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }

            // Ensure audio is initialized directly from touch event
            if (!this.game.hasUserInteraction) {
                this.game.hasUserInteraction = true;
                SoundManager.hasUserInteraction = true;
                this.game.audioManager.initializeAudio();
            }

            handleArrowButtonPress('down');
        });

        leftButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }

            // Ensure audio is initialized directly from touch event
            if (!this.game.hasUserInteraction) {
                this.game.hasUserInteraction = true;
                SoundManager.hasUserInteraction = true;
                this.game.audioManager.initializeAudio();
            }

            handleArrowButtonPress('left');
        });

        rightButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }

            // Ensure audio is initialized directly from touch event
            if (!this.game.hasUserInteraction) {
                this.game.hasUserInteraction = true;
                SoundManager.hasUserInteraction = true;
                this.game.audioManager.initializeAudio();
            }

            handleArrowButtonPress('right');
        });

        // Add mouse event listeners as fallback for hybrid devices
        upButton.addEventListener('mousedown', () => handleArrowButtonPress('up'));
        downButton.addEventListener('mousedown', () => handleArrowButtonPress('down'));
        leftButton.addEventListener('mousedown', () => handleArrowButtonPress('left'));
        rightButton.addEventListener('mousedown', () => handleArrowButtonPress('right'));
    }

    // Check if the device is a touch device
    isTouchDevice() {
        return ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);
    }
}
