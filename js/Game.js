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
        // Get SoundManager instance directly
        this.soundManager = SoundManager.getInstance();

        // Create AudioManager FIRST
        this.audioManager = new AudioManager(this); 
        
        // Create UI manager AFTER AudioManager
        this.uiManager = new UIManager(this);

        // Create InputManager 
        this.inputManager = new InputManager(this);

        // Set up the speed threshold callback to update the tip area
        this.gameLoop.onSpeedThresholdReached = () => {
            this.uiManager.updateTipArea("Press opposite arrow to slow down");
        };

        // Set up callback for when snake returns to normal speed
        this.gameLoop.onReturnToNormalSpeed = () => {
            // Show a calm message when speed returns to normal
            this.showCalmSpeedMessage();
        };

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
        // Reset tip area to default game instructions
        this.uiManager.updateTipArea(); // Use default initial text
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
        this.audioManager.handlePause();
        GameUtils.showHeaderFooter(this.gameLayout);
        // Update tip area when pausing
        this.uiManager.updateTipArea("Game Paused. Press Space / Tap to resume.");
    }

    unpauseGame() {
        this.audioManager.handleUnpause();
        GameUtils.hideHeaderFooter(this.gameLayout);
        this.gameLoop.startGameLoop();
        // Update tip area when unpausing - use default
        this.uiManager.updateTipArea(); // Use default initial text
    }

    startGame() {
        if (!this.imagesLoaded) {
            console.warn('[startGame] Attempted to start game before images loaded.');
            return;
        }

        if (!this.hasUserInteraction) {
            console.log("[startGame] User interaction needed to start.");
            this.startRequested = true; 
            // Update tip area to prompt for interaction
            this.uiManager.updateTipArea("Click or press any key to start.");
            return;
        }

        const gameState = this.gameStateManager.getGameState();
        const isGameOver = gameState.isGameOver;
        const isFirstStart = !gameState.isGameStarted && !isGameOver;

        if (isGameOver || isFirstStart) {
            this.resetGame(isFirstStart); 
        } else {
            console.log("[startGame] Resuming game (not first start or game over).");
        }

        this.gameStateManager.startGame();
        this.gameLoop.startGameLoop();
        this.gameLoop.startFruitLoop(this.manageFruits.bind(this));
        this.audioManager.handleGameStart(isFirstStart);
        GameUtils.hideHeaderFooter(this.gameLayout);
        // Set initial game tip - use default
        this.uiManager.updateTipArea(); // Use default initial text
        this.draw(); 
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
        const isWallCollision = !GameUtils.isPositionInBounds(nextHeadPos.x, nextHeadPos.y, this.tileCount);
        const isSelfCollision = !isWallCollision && this.snake.isOccupyingPosition(nextHeadPos.x, nextHeadPos.y, true);

        if (isSelfCollision && Math.random() < 0.5) {
            this.cutTail(nextHeadPos);
        } else if (gameState.luckEnabled && Math.random() < 0.8) {
            const safeDirection = this.snake.findSafeDirection(this.direction, (x, y) => this.isPositionSafe(x, y));
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
        const collisionIndex = segments.findIndex(segment => segment.x === collisionPos.x && segment.y === collisionPos.y);

        if (collisionIndex > 0) {
            const originalLength = segments.length;
            const remainingLength = collisionIndex;
            const removedLength = originalLength - remainingLength;
            const currentScore = this.gameStateManager.getScore();
            const scoreReduction = Math.floor(currentScore * (removedLength / originalLength));
            const newScore = Math.max(0, currentScore - scoreReduction);

            this.gameStateManager.setScore(newScore);
            this.uiManager.updateScore(newScore);
            this.snake.cutTailAt(collisionIndex);

            if (this.audioManager.canPlaySound()) {
                this.soundManager.playSound('click', 0.5);
            }

            // Update tip area with tail cut message
            this.uiManager.updateTipArea(`Snake trimmed its tail. A fresh start with ${scoreReduction} fewer points.`);
            // Reset tip after a delay - use default
            setTimeout(() => {
                this.uiManager.updateTipArea(); // Use default initial text
            }, 2500);

            this.snake.move(collisionPos.x, collisionPos.y);
            if (this.drawer && this.drawer.snakeDrawer) {
                this.drawer.snakeDrawer.triggerLuckGlow();
            }
        } else {
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

        // Show a luck feature tip when luck is activated
        this.showLuckTip();

        this.gameLoop.adjustSpeedAfterLuckEffect();
        this.snake.move(safeHeadPos.x, safeHeadPos.y);
    }

    // New method to show luck-related tips
    showLuckTip() {
        const luckTips = [
            "Lucky escape. Your snake just borrowed some rabbit's luck.",
            "Phew. Your snake's lucky charm quietly did its job.",
            "Fortune smiles upon the slithery today.",
            "Narrow miss. The snake gods must like your style.",
            "Your snake just used one of its nine lives. Eight to go.",
            "Smooth moves. Your snake deftly avoided that collision.",
            "A dance with destiny. Your snake knows the steps.",
            "The universe decided your snake journey isn't over yet."
        ];
        
        const randomTip = luckTips[Math.floor(Math.random() * luckTips.length)];
        this.uiManager.updateTipArea(randomTip);
        
        // Reset tip after 3 seconds
        setTimeout(() => {
            // Only reset if we're still playing (not game over or paused)
            if (this.gameStateManager.getGameState().isGameStarted && 
                !this.gameStateManager.getGameState().isGameOver && 
                !this.gameStateManager.getGameState().isPaused) {
                this.uiManager.updateTipArea();
            }
        }, 3000);
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
        this.gameLoop.stopGameLoop();
        if (this.audioManager.canPlaySound()) {
            this.soundManager.playSound('crash');
        }
        this.isTransitionState = true;
        const currentScore = this.gameStateManager.getScore();
        const isNewHighScore = currentScore > this.gameStateManager.getHighScore();
        this.audioManager.handleGameOver(isNewHighScore);
        this.frozen = true;
        this.draw();
        GameUtils.showHeaderFooter(this.gameLayout);
        
        // Update tip area for game over
        this.uiManager.updateTipArea("Space or tap to restart.");

        setTimeout(() => {
            this.gameStateManager.gameOver();
            if (isNewHighScore) {
                this.uiManager.updateHighScore(this.gameStateManager.getHighScore());
                if (this.audioManager.canPlaySound()) {
                    this.soundManager.playHighScoreFanfare();
                }
            }
            this.isTransitionState = false;
            this.frozen = false;
            this.draw();
        }, 1000);
    }

    resetGame(forceNewMelody = false) {
        this.gameStateManager.resetGame();
        this.isTransitionState = false;
        this.frozen = false;

        if (this.drawer) {
            this.drawer.generateNewSnakeColor();
        }

        this.snake = new Snake(5, 5);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop.resetSpeed(); // This also resets speedTipShown
        this.foodManager.resetFood();
        this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));

        // Reset the tip area to initial instructions - use default
        this.uiManager.updateTipArea(); // Use default initial text

        this.uiManager.updateScore(this.gameStateManager.getScore());
        this.uiManager.updateHighScore(this.gameStateManager.getHighScore());
        this.startRequested = false;
        this.audioManager.handleGameReset(forceNewMelody);
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

    // New method to show calm messages when speed returns to normal
    showCalmSpeedMessage() {
        const calmMessages = [
            "Much better. A calm snake is a happy snake.",
            "Ah, back to a gentle pace. Your snake appreciates that.",
            "Cruising speed achieved. Enjoy the scenery.",
            "Perfect pace for thoughtful fruit gathering.",
            "Slow and steady wins the race, as they say."
        ];
        
        const randomMessage = calmMessages[Math.floor(Math.random() * calmMessages.length)];
        this.uiManager.updateTipArea(randomMessage);
        
        // Reset tip after 3 seconds
        setTimeout(() => {
            // Only reset if we're still playing (not game over or paused)
            if (this.gameStateManager.getGameState().isGameStarted && 
                !this.gameStateManager.getGameState().isGameOver && 
                !this.gameStateManager.getGameState().isPaused) {
                this.uiManager.updateTipArea();
            }
        }, 3000);
    }
}

window.addEventListener('load', () => {
    // Create the game instance and make it globally available
    window.SnakeGame = new SnakeGame();
});

