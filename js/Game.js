class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize game layout reference - make sure we get it correctly
        this.gameLayout = document.querySelector('.game-layout');

        // Ensure we have a valid gameLayout reference
        if (!this.gameLayout) {
            console.error('Game layout element not found! Some mobile features may not work correctly.');
            // Try to create a fallback reference to the body as last resort
            this.gameLayout = document.body;
        }

        this.imagesLoaded = false;
        this.hasUserInteraction = false;
        this.startRequested = false;

        this.initializeGameSettings();
        this.setupManagers();
        this.loadImages();

        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.resizeCanvas();
    }

    initializeGameSettings() {
        // Canvas and grid settings
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
        // Create managers
        this.soundManager = SoundManager.getInstance();
        this.musicManager = new MusicManager();
        this.uiManager = new UIManager(this);

        // Create new managers for refactored functionality
        this.audioManager = new AudioManager(this);
        this.inputManager = new InputManager(this);

        // Add listener for first interaction
        this.addInteractionListeners();
    }

    addInteractionListeners() {
        // Use { once: true } so these listeners automatically remove themselves after firing
        document.addEventListener('click', this.handleFirstInteraction.bind(this), { once: true, passive: true });
        document.addEventListener('keydown', this.handleFirstInteraction.bind(this), { once: true, passive: true });
        this.canvas.addEventListener('touchstart', this.handleFirstInteraction.bind(this), { once: true, passive: true });
    }

    handleFirstInteraction() {
        if (this.hasUserInteraction) return; // Ensure it only runs once
        this.hasUserInteraction = true;
        console.log("First user interaction detected. Initializing audio...");

        // Initialize audio contexts immediately
        this.audioManager.init();

        // If a game start was requested by the interaction, start the game now
        if (this.startRequested) {
            console.log("Starting game now after interaction and audio initialization.");
            this.startGame();
            this.startRequested = false; // Reset the flag
        }
    }

    loadImages() {
        this.fruitImages = {};
        this.loadFruitImages().then(() => {
            this.imagesLoaded = true;
            this.drawer = new GameDrawer(this.canvas, this.gridSize, this.fruitImages);
            this.init();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;

        // Get the container's current dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate square size based on the smallest dimension
        const size = Math.min(containerWidth, containerHeight);

        // Calculate grid size based on container
        this.gridSize = Math.min(40, Math.floor(size / 20));

        // Ensure tileCount is an integer
        this.tileCount = Math.floor(size / this.gridSize);

        // Adjust canvas size to be exactly a multiple of gridSize
        const adjustedSize = this.tileCount * this.gridSize;

        // Get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;

        // Set canvas dimensions for Retina display (internal resolution)
        this.canvas.width = adjustedSize * dpr;
        this.canvas.height = adjustedSize * dpr;

        // Set CSS dimensions to maintain the square aspect ratio
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        // Let CSS handle container dimensions through aspect-ratio property
        container.style.width = '';
        container.style.height = '';
        container.style.paddingBottom = '';
        container.style.minHeight = '';
        container.style.display = '';

        // Ensure the canvas container maintains its border-radius
        container.style.borderRadius = 'var(--radius-md)';

        if (this.foodManager) {
            this.foodManager.tileCount = this.tileCount;
        }

        if (this.drawer) {
            this.drawer.updateGridSize(this.gridSize);
        }

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

        if (this.musicManager) {
            this.musicManager.saveMelodyId();
            this.musicManager.stopMusic(true);
        }

        MusicManager.cleanupAudioResources(this, 200);

        // Show header and footer when game is paused on mobile
        if (GameUtils.isTouchDevice()) {
            GameUtils.showHeaderFooterOnMobile(this.gameLayout);
        }
    }

    unpauseGame() {
        // Get the sound manager instance
        this.soundManager = SoundManager.getInstance();

        // Create a fresh music manager
        this.musicManager = new MusicManager();

        // Initialize music using the AudioManager, don't force a new melody when unpausing
        this.audioManager.initializeGameMusic(false);

        // Hide header and footer when game is unpaused on mobile
        if (GameUtils.isTouchDevice()) {
            GameUtils.hideHeaderFooterOnMobile(this.gameLayout);
        }

        // Restart the game loop
        this.gameLoop.startGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            console.warn('[startGame] Attempted to start game before images loaded.');
            return;
        }

        // Ensure audio is initialized if interaction happened
        if (this.hasUserInteraction) {
            this.audioManager.initializeAudio();
        }

        // Check if the game is over
        const isGameOver = this.gameStateManager.getGameState().isGameOver;
        const isFirstStart = !this.gameStateManager.getGameState().isGameStarted && !isGameOver;

        if (isGameOver) {
            // Don't force a new melody when restarting after game over
            this.resetGame(false);
        } else {
            // Reset game elements only if we didn't already reset via resetGame
            this.resetGameState();
        }

        // THEN set the game state to started
        this.gameStateManager.startGame();

        // Start loops
        this.gameLoop.startGameLoop();
        this.gameLoop.startFruitLoop(this.manageFruits.bind(this));

        // Initialize music
        // Force new melody ONLY on the first game start, not on restart after game over
        this.audioManager.initializeGameMusic(isFirstStart);

        // Hide header and footer on mobile devices
        if (GameUtils.isTouchDevice()) {
            GameUtils.hideHeaderFooterOnMobile(this.gameLayout);
        }

        this.draw(); // Initial draw after starting
    }

    resetGameState() {
        this.drawer.generateNewSnakeColor();
        this.gameStateManager.resetGameState();
        this.uiManager.updateScore(this.gameStateManager.getScore());
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop.resetSpeed();
        this.snake = new Snake(5, 5);
        this.foodManager.resetFood();
        this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));

        // Reset shake intensity to default value
        if (this.drawer && this.drawer.snakeDrawer) {
            this.drawer.snakeDrawer.resetLevels();
        }
    }

    manageFruits() {
        const gameState = this.gameStateManager.getGameState();
        this.foodManager.manageFruits(
            this.snake,
            this.getRandomFruit.bind(this),
            gameState.isGameStarted,
            gameState.isPaused,
            gameState.isGameOver,
            this.soundManager
        );
        this.draw();
    }

    update() {
        const gameState = this.gameStateManager.getGameState();
        if (gameState.isPaused) {
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
            const newScore = currentScore - scoreReduction;

            // Update the score in the game state and UI
            this.gameStateManager.score = newScore;
            this.uiManager.updateScore(newScore);

            // Cut the tail by removing segments from collisionIndex to the end
            this.snake.cutTailAt(collisionIndex);

            // Play a sound to indicate tail cutting
            if (gameState.soundEnabled && this.audioManager.isAudioReady()) {
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
        const gameState = this.gameStateManager.getGameState();

        if (gameState.soundEnabled && this.audioManager.isAudioReady()) {
            this.soundManager.playSound('click', 0.3);
        }

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

        const score = this.gameStateManager.updateScore(fruitConfig.score);
        this.uiManager.updateScore(score);
        this.lastEatenTime = Date.now();

        // Ensure the game loop continues smoothly after eating
        this.gameLoop.adjustSpeedAfterFoodEaten();

        // Force an immediate frame update to avoid pauses
        this.gameLoop.lastFrameTime = performance.now() - this.gameLoop.frameInterval;

        if (this.drawer) {
            this.drawer.incrementDarknessLevel();
        }

        // Only play sound if we have user interaction and sound is enabled
        if (gameState.soundEnabled && this.audioManager.isAudioReady()) {
            this.soundManager.playSound(eatenFood.type);
        }

        this.snake.grow();

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
        const isNewHighScore = this.gameStateManager.gameOver();
        if (isNewHighScore) {
            this.uiManager.updateHighScore(this.gameStateManager.getHighScore());
        }

        this.gameLoop.stopGameLoop();
        this.draw();

        // Show header and footer when game is over on mobile
        if (GameUtils.isTouchDevice()) {
            GameUtils.showHeaderFooterOnMobile(this.gameLayout);
        }

        this.audioManager.handleGameOverAudio(isNewHighScore);
    }

    resetGame(forceNewMelody = false) {
        this.gameStateManager.resetGame();

        // Generate a new color for the snake
        if (this.drawer) {
            this.drawer.generateNewSnakeColor();
        }

        // Get sound manager instance
        this.soundManager = SoundManager.getInstance();

        // Always create a fresh MusicManager instance for the new game
        this.musicManager = new MusicManager();

        // Ensure audio context is initialized if user interaction has occurred
        if (this.hasUserInteraction && SoundManager.getAudioContext()) {
            this.musicManager.initAudioContextIfNeeded();
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

        // We don't need to show header and footer here as we're resetting for a new game
        // which will be followed by startGame() that will hide them

        // Initialize music - this ensures music plays after game reset
        if (this.hasUserInteraction) {
            this.audioManager.initializeGameMusic(forceNewMelody);
        }

        // Force a redraw to show the new state
        this.draw();
    }

    draw() {
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
            isGameOver: currentState.isGameOver,
            isPaused: currentState.isPaused,
            isGameStarted: currentState.isGameStarted,
            lastEatenTime: this.lastEatenTime,
            shakeEnabled: currentState.shakeEnabled
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

