/**
 * Core game controller that orchestrates all game systems and manages the game lifecycle.
 * - Initializes subsystems including rendering, sound, input, and state management
 * - Coordinates the update cycle by processing input, updating state, and triggering rendering
 * - Manages responsive scaling to ensure proper display across device sizes
 * - Handles dynamic loading of assets and ensures they're ready before game starts
 * - Controls state transitions between menu, gameplay, pause, and game over states
 * - Orchestrates collision detection and resolution with walls, snake body, and food
 * - Implements the game score system and difficulty progression as score increases
 */
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileCount = 20;
        this.startRequested = false;
        this.lastEatenTime = 0;
        this.imagesLoaded = false;
        this.hasUserInteraction = false;
        this.isTransitionState = false;
        this.frozen = false;

        // Initialize game layout reference - make sure we get it correctly
        this.gameLayout = document.querySelector('.game-layout');

        // Ensure we have a valid gameLayout reference
        if (!this.gameLayout) {
            console.error('Game layout element not found! Some mobile features may not work correctly.');
            // Try to create a fallback reference to the body as last resort
            this.gameLayout = document.body;
        }

        // Initialize game settings FIRST
        this.initializeGameSettings();
        // Setup managers AFTER settings are initialized
        this.setupManagers();
        // Load images LAST
        this.loadImages();

        // Restore original resize listener and immediate call
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.resizeCanvas(); // Restore this call
    }

    initializeGameSettings() {
        // Restore resizeCanvas call
        this.resizeCanvas();
        this.hasUserInteraction = false;
        this.startRequested = false;

        // Game components
        this.gameStateManager = new GameStateManager();
        this.snake = new Snake(5, 5);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop = new GameLoop(this.update.bind(this));
        this.foodManager = new FoodManager(this.tileCount);

        // Time tracking
        this.lastEatenTime = 0;
    }

    setupManagers() {
        // Get SoundManager instance directly (used for playing sounds via foodManager etc.)
        this.soundManager = SoundManager.getInstance();

        // Create AudioManager FIRST, as UIManager needs it during initialization
        this.audioManager = new AudioManager(this); 
        
        // Create UI manager AFTER AudioManager
        this.uiManager = new UIManager(this);

        // Create InputManager 
        this.inputManager = new InputManager(this);

        // Add listener for first interaction
        this.addInteractionListeners();
    }

    addInteractionListeners() {
        // Use { once: true } so these listeners automatically remove themselves after firing
        document.addEventListener('click', this.handleFirstInteraction.bind(this), { once: true, passive: true });
        document.addEventListener('keydown', this.handleFirstInteraction.bind(this), { once: true, passive: true });
        // Attach touchstart to the document to catch any initial tap
        document.addEventListener('touchstart', this.handleFirstInteraction.bind(this), { once: true, passive: true });
    }

    handleFirstInteraction() {
        if (this.hasUserInteraction) return; // Ensure it only runs once
        this.hasUserInteraction = true;
        console.log("First user interaction detected. Initializing audio manager...");


        // AudioManager handles its own initialization logic, including potential retries
        this.audioManager.init(); 

        // If a game start was *requested* before interaction, trigger it now.
        // This covers cases like pressing spacebar before clicking.
        if (this.startRequested) {
            console.log("Starting game now after interaction and audio initialization.");
            // No need to call startGame directly, just ensure state allows it
            // The main game loop or input handler will trigger startGame if needed
            // based on the now-set hasUserInteraction flag.
            this.startRequested = false; // Reset the flag
        }
    }

    loadImages() {
        this.fruitImages = {};
        this.loadFruitImages().then(() => {
            this.imagesLoaded = true;
            // No need to schedule resize here anymore
            // Initialize drawer AFTER images are loaded
            this.drawer = new GameDrawer(this.canvas, this.gridSize, this.fruitImages);
            this.init(); // init calls draw()
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return; // Exit if container not found

        // Get the container's current dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Restore original simple check
        if (containerWidth <= 0 || containerHeight <= 0) {
            console.warn('resizeCanvas: Container dimensions are zero or negative, skipping update.');
            return;
        }

        // Calculate square size based on the smallest dimension
        const size = Math.min(containerWidth, containerHeight);

        // Calculate grid size based on container
        this.gridSize = Math.min(40, Math.floor(size / 20));
        // Add minimum gridSize check
        if (this.gridSize <= 0) this.gridSize = 10; // Ensure minimum grid size

        // Ensure tileCount is an integer
        this.tileCount = Math.floor(size / this.gridSize);
        // Add minimum tileCount check
        if (this.tileCount <= 0) this.tileCount = 10; // Ensure minimum tile count

        // Adjust canvas size to be exactly a multiple of gridSize
        const adjustedSize = this.tileCount * this.gridSize;

        // Add check after calculation
        if (adjustedSize <= 0) {
            console.warn('resizeCanvas: Calculated adjustedSize is zero or negative, skipping canvas update.');
            return;
        }

        // Get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;

        // Set canvas dimensions for Retina display (internal resolution)
        this.canvas.width = adjustedSize * dpr;
        this.canvas.height = adjustedSize * dpr;
        // console.log(`Canvas attributes set to: ${this.canvas.width}x${this.canvas.height}`);

        // Set CSS dimensions to maintain the square aspect ratio via CSS
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        // Reset container styles previously manipulated by JS (let CSS handle it)
        container.style.width = '';
        container.style.height = '';
        container.style.paddingBottom = '';
        container.style.minHeight = '';
        container.style.display = '';

        // Ensure the canvas container maintains its border-radius
        container.style.borderRadius = 'var(--radius-md)';

        // Update managers
        if (this.foodManager) {
            this.foodManager.tileCount = this.tileCount;
        }

        // Update drawer
        if (this.drawer) {
            this.drawer.updateGridSize(this.gridSize);
        }

        // Trigger a redraw
        if (this.imagesLoaded) {
            this.draw();
        }
    }

    loadFruitImages() {
        const loadPromises = Object.entries(window.FRUIT_CONFIG).map(([type, config]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const svgBlob = new Blob([config.svg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    this.fruitImages[type] = img;
                    URL.revokeObjectURL(url);
                    resolve();
                };

                img.onerror = (error) => {
                    console.error(`Failed to load image for ${type}:`, error);
                    URL.revokeObjectURL(url);
                    reject(error);
                };

                img.src = url;
            });
        });

        return Promise.all(loadPromises);
    }

    getRandomFruit() {
        const random = Math.random();
        let cumulativeProbability = 0;

        for (const [type, config] of Object.entries(window.FRUIT_CONFIG)) {
            cumulativeProbability += config.probability;
            if (random <= cumulativeProbability) {
                return type;
            }
        }

        return 'apple'; // Fallback
    }

    init() {
        this.snake = new Snake(5, 5);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop.resetSpeed();
        this.uiManager.updateScore(this.gameStateManager.getScore());
        this.uiManager.updateHighScore(this.gameStateManager.getHighScore());
        this.foodManager.resetFood();
        this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));
        this.draw();
        this.gameLoop.startFruitLoop(this.manageFruits.bind(this));
    }

    isValidDirectionChange(newDirection) {
        return GameUtils.isValidDirectionChange(newDirection, this.direction);
    }

    togglePause() {
        const gameState = this.gameStateManager.getGameState();

        if (!gameState.isPaused) {
            this.gameStateManager.pauseGame(
                this.snake,
                this.direction,
                this.nextDirection,
                this.foodManager.getAllFood(),
                this.gameStateManager.getScore(),
                this.gameLoop.getSpeed()
            );
            this.pauseGame();
        } else {
            this.gameStateManager.unpauseGame();
            this.unpauseGame();
        }

        this.draw();
    }

    pauseGame() {
        this.gameLoop.stopGameLoop();
        // Delegate audio handling
        this.audioManager.handlePause();
        // Show header and footer when game is paused
        GameUtils.showHeaderFooter(this.gameLayout);
    }

    unpauseGame() {
        // Delegate audio handling
        this.audioManager.handleUnpause();
        // Hide header and footer when game is unpaused
        GameUtils.hideHeaderFooter(this.gameLayout);
        // Restart the game loop
        this.gameLoop.startGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            console.warn('[startGame] Attempted to start game before images loaded.');
            return;
        }

        // Need interaction before starting
        if (!this.hasUserInteraction) {
            console.log("[startGame] User interaction needed to start.");
            this.startRequested = true; // Request start after interaction
            // Potentially show a message like "Click or press key to start"
            return;
        }

        const gameState = this.gameStateManager.getGameState();
        const isGameOver = gameState.isGameOver;
        const isFirstStart = !gameState.isGameStarted && !isGameOver;

        // Reset game state if restarting after game over or for the first time
        if (isGameOver || isFirstStart) {
            this.resetGame(isFirstStart); // Pass flag to resetGame
        } else {
            // If resuming from a non-game-over state (e.g., coming back to tab),
            // ensure game elements are consistent, but don't fully reset.
            // This path might be less common now with stricter pause/resume logic.
            console.log("[startGame] Resuming game (not first start or game over).");
        }

        // Set game state to started *after* potential reset
        this.gameStateManager.startGame();

        // Start core loops
        this.gameLoop.startGameLoop();
        this.gameLoop.startFruitLoop(this.manageFruits.bind(this));

        // Delegate audio initialization for the game start
        this.audioManager.handleGameStart(isFirstStart);

        // UI updates
        GameUtils.hideHeaderFooter(this.gameLayout);
        this.draw(); // Initial draw after starting
    }

    resetGameState() {
        // Reset visual/gameplay elements
        if (this.drawer) {
             this.drawer.generateNewSnakeColor();
             if (this.drawer.snakeDrawer) {
                 this.drawer.snakeDrawer.resetLevels();
             }
        }
        this.gameStateManager.resetGameState(); // Resets score etc.
        this.uiManager.updateScore(this.gameStateManager.getScore()); // Update UI score
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop.resetSpeed();
        this.snake = new Snake(5, 5);
        this.foodManager.resetFood();
        this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));
    }

    manageFruits() {
        const gameState = this.gameStateManager.getGameState();
        this.foodManager.manageFruits(
            this.snake,
            this.getRandomFruit.bind(this),
            gameState.isGameStarted,
            gameState.isPaused,
            gameState.isGameOver,
            this.audioManager // Pass AudioManager for sound checks
        );
        this.draw();
    }

    update() {
        const gameState = this.gameStateManager.getGameState();
        if (gameState.isPaused || this.frozen) {
            return;
        }

        if (gameState.isGameStarted && !gameState.isGameOver) {
            this.direction = this.nextDirection;
            this.moveSnake();
            this.checkFoodCollision();
        }

        this.uiManager.updateMelodyDisplay();
        this.draw();
    }

    moveSnake() {
        const headPos = this.snake.head();
        const nextHeadPos = GameUtils.getNextHeadPosition(headPos, this.direction);

        if (this.checkCollision(nextHeadPos)) {
            this.handleCollision(nextHeadPos);
        } else {
            this.snake.move(nextHeadPos.x, nextHeadPos.y);
        }
    }

    handleCollision(nextHeadPos) {
        const gameState = this.gameStateManager.getGameState();

        // First, determine what type of collision this is
        const isWallCollision = !GameUtils.isPositionInBounds(nextHeadPos.x, nextHeadPos.y, this.tileCount);

        // Check if it's a self collision
        const isSelfCollision = !isWallCollision && this.snake.isOccupyingPosition(nextHeadPos.x, nextHeadPos.y, true);

        if (isSelfCollision && Math.random() < 0.5) {
            // 50% chance to cut tail when snake hits itself
            this.cutTail(nextHeadPos);
        } else if (gameState.luckEnabled && Math.random() < 0.8) {
            // Original luck-based collision handling (80% chance to avoid crash)
            const safeDirection = this.snake.findSafeDirection(
                this.direction,
                (x, y) => this.isPositionSafe(x, y)
            );

            if (safeDirection) {
                this.applyLuckEffect(safeDirection);
            } else {
                this.gameOver();
            }
        } else {
            this.gameOver();
        }
    }

    cutTail(collisionPos) {
        const segments = this.snake.getSegments();
        const gameState = this.gameStateManager.getGameState();

        // Find which segment we collided with
        const collisionIndex = segments.findIndex(segment =>
            segment.x === collisionPos.x && segment.y === collisionPos.y
        );

        if (collisionIndex > 0) {  // Make sure we found a valid segment (not the head)
            // Calculate how many segments will be removed
            const originalLength = segments.length;
            const remainingLength = collisionIndex;
            const removedLength = originalLength - remainingLength;

            // Update score proportionally based on how many segments were lost
            const currentScore = this.gameStateManager.getScore();
            const scoreReduction = Math.floor(currentScore * (removedLength / originalLength));
            const newScore = Math.max(0, currentScore - scoreReduction); // Ensure score doesn't go negative

            // Update the score in the game state and UI
            this.gameStateManager.setScore(newScore);
            this.uiManager.updateScore(newScore);

            // Cut the tail by removing segments from collisionIndex to the end
            this.snake.cutTailAt(collisionIndex);

            // Play sound using AudioManager check
            if (this.audioManager.canPlaySound()) {
                this.soundManager.playSound('click', 0.5);
            }

            // Show a message to the player
            this.uiManager.showTemporaryMessage(
                `Snake cut its tail! Lost ${scoreReduction} points.`,
                1800
            );

            // Move the snake to the next position (avoiding collision)
            this.snake.move(collisionPos.x, collisionPos.y);

            // Visual effects for tail cutting
            if (this.drawer && this.drawer.snakeDrawer) {
                this.drawer.snakeDrawer.triggerLuckGlow();
            }
        } else {
            // Fallback to normal collision handling if we couldn't identify the collision segment
            this.gameOver();
        }
    }

    applyLuckEffect(safeDirection) {
        // Get available safe directions
        const safeDirections = [];
        const directions = ['up', 'down', 'left', 'right'];
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // Only check directions that aren't opposite to current direction
        const possibleDirections = directions.filter(d =>
            d !== oppositeDirections[this.direction]
        );

        // Check which directions are safe
        for (const direction of possibleDirections) {
            const headPos = this.snake.head();
            const testPos = GameUtils.getNextHeadPosition(headPos, direction);

            if (this.isPositionSafe(testPos.x, testPos.y)) {
                safeDirections.push({
                    direction,
                    position: testPos
                });
            }
        }

        // If no safe directions found, use the provided safeDirection
        if (safeDirections.length === 0) {
            this.direction = safeDirection;
            this.nextDirection = safeDirection;
        } else {
            // Find the closest fruit from all safe positions
            let closestDirection = null;
            let minDistance = Infinity;

            // If no fruits exist, just use the first safe direction
            const food = this.foodManager.getAllFood();
            if (food.length === 0 && safeDirections.length > 0) {
                closestDirection = safeDirections[0].direction;
            } else {
                for (const option of safeDirections) {
                    // Calculate distance to each fruit from this position
                    for (const fruit of food) {
                        const distance = Math.sqrt(
                            Math.pow(option.position.x - fruit.x, 2) +
                            Math.pow(option.position.y - fruit.y, 2)
                        );

                        if (distance < minDistance) {
                            minDistance = distance;
                            closestDirection = option.direction;
                        }
                    }
                }
            }

            // If we found a direction leading toward a fruit, use it
            // Otherwise use the provided safeDirection as fallback
            this.direction = closestDirection || safeDirection;
            this.nextDirection = this.direction;
        }

        const safeHeadPos = GameUtils.getNextHeadPosition(this.snake.head(), this.direction);

        // Play sound using AudioManager check
        if (this.audioManager.canPlaySound()) {
            this.soundManager.playSound('click', 0.3);
        }

        // Visual effect
        if (this.drawer && this.drawer.snakeDrawer) {
            this.drawer.snakeDrawer.triggerLuckGlow();
        }

        this.gameLoop.adjustSpeedAfterLuckEffect();
        this.snake.move(safeHeadPos.x, safeHeadPos.y);
    }

    checkFoodCollision() {
        const foodEatenIndex = this.foodManager.checkFoodCollision(this.snake);

        if (foodEatenIndex !== -1) {
            this.handleFoodEaten(foodEatenIndex);
        }
    }

    handleFoodEaten(foodEatenIndex) {
        const eatenFood = this.foodManager.removeFood(foodEatenIndex);
        if (!eatenFood) return;

        const fruitConfig = window.FRUIT_CONFIG[eatenFood.type];
        const gameState = this.gameStateManager.getGameState();

        // Update score
        const score = this.gameStateManager.updateScore(fruitConfig.score);
        this.uiManager.updateScore(score);
        this.lastEatenTime = Date.now();

        // Adjust speed
        this.gameLoop.adjustSpeedAfterFoodEaten();

        // Force immediate frame update
        // this.gameLoop.lastFrameTime = performance.now() - this.gameLoop.frameInterval; // Re-evaluate if needed

        // Visuals
        if (this.drawer) {
            this.drawer.incrementDarknessLevel();
        }

        // Play sound using AudioManager check
        if (this.audioManager.canPlaySound()) {
            this.soundManager.playSound(eatenFood.type);
        }

        this.snake.grow();

        // Generate new food if needed
        if (this.foodManager.getAllFood().length === 0) {
            this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));
        }
    }

    isPositionSafe(x, y) {
        if (!GameUtils.isPositionInBounds(x, y, this.tileCount)) {
            return false;
        }

        return !this.snake.isOccupyingPosition(x, y, true);
    }

    checkCollision(headPos) {
        if (!GameUtils.isPositionInBounds(headPos.x, headPos.y, this.tileCount)) {
            return true;
        }

        return this.snake.isOccupyingPosition(headPos.x, headPos.y, true);
    }

    gameOver() {
        // Stop the game loop immediately
        this.gameLoop.stopGameLoop();

        // Play game over sound immediately if possible
        if (this.audioManager.canPlaySound()) {
            this.soundManager.playSound('crash');
        }

        // Set a transition flag in our state
        this.isTransitionState = true;

        // Store current score for high score comparison
        const currentScore = this.gameStateManager.getScore();
        const isNewHighScore = currentScore > this.gameStateManager.getHighScore();

        // Delegate audio handling for game over (plays sounds immediately)
        this.audioManager.handleGameOver(isNewHighScore);

        // Don't mark the game as over in the state manager yet,
        // but do freeze snake movement by setting internal state
        this.frozen = true;

        // Draw the current state with transition overlay
        this.draw();

        // Show header and footer when game is over
        GameUtils.showHeaderFooter(this.gameLayout);

        // Add a 1-second delay before showing the game over screen
        setTimeout(() => {
            // Now mark the game as over in the state manager
            this.gameStateManager.gameOver();

            if (isNewHighScore) {
                // Update the high score display
                this.uiManager.updateHighScore(this.gameStateManager.getHighScore());
                // Play fanfare sound if sounds are enabled
                if (this.audioManager.canPlaySound()) {
                    this.soundManager.playHighScoreFanfare();
                }
            }

            // After delay, clear transition state and update game state to game over
            this.isTransitionState = false;
            this.frozen = false;
            this.draw();
        }, 1000);
    }

    resetGame(forceNewMelody = false) {
        this.gameStateManager.resetGame();
        this.isTransitionState = false;
        this.frozen = false;

        // Generate a new color for the snake
        if (this.drawer) {
            this.drawer.generateNewSnakeColor();
        }

        // Reinitialize snake and game elements for a clean slate
        this.snake = new Snake(5, 5);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop.resetSpeed();
        this.foodManager.resetFood();
        this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));

        // Ensure UI is updated with initial state
        this.uiManager.updateScore(this.gameStateManager.getScore());
        this.uiManager.updateHighScore(this.gameStateManager.getHighScore());

        // Reset the start requested flag
        this.startRequested = false;

        // Delegate music handling for the reset/restart
        // AudioManager will decide if music should play based on interaction state
        this.audioManager.handleGameReset(forceNewMelody);

        // Force a redraw to show the new state
        this.draw();
    }

    draw(skipGameOverScreen = false) {
        if (!this.imagesLoaded) return;

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply device pixel ratio scaling
        const dpr = window.devicePixelRatio || 1;
        this.ctx.save();
        this.ctx.scale(dpr, dpr);

        // Get current game state
        const currentState = this.gameStateManager.getGameState();

        // Draw game state
        const gameState = {
            snake: this.snake.getSegments(),
            food: this.foodManager.food,
            direction: this.direction,
            score: currentState.score,
            highScore: currentState.highScore,
            isGameOver: skipGameOverScreen ? false : currentState.isGameOver && !this.isTransitionState,
            isPaused: currentState.isPaused,
            isGameStarted: this.isTransitionState ? true : currentState.isGameStarted,
            lastEatenTime: this.lastEatenTime,
            shakeEnabled: currentState.shakeEnabled,
            isTransition: this.isTransitionState
        };

        this.drawer.draw(gameState);

        // Restore context
        this.ctx.restore();
    }

    toggleSound() {
        this.audioManager.toggleSound();
    }

    toggleMusic() {
        this.audioManager.toggleMusic();
    }

    changeMusic() {
        this.audioManager.changeMusic();
    }
}

window.addEventListener('load', () => {
    // Create the game instance and make it globally available
    window.SnakeGame = new SnakeGame();
});

