class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.initializeGameSettings();
        this.setupEventListeners();
        this.addInteractionListeners();
    }

    initializeGameSettings() {
        // Canvas and grid settings
        this.resizeCanvas();
        this.hasUserInteraction = false;
        this.startRequested = false; // Add flag to track if start was requested before interaction

        // Game components and managers
        this.gameStateManager = new GameStateManager();
        this.snake = new Snake(5, 5);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoop = new GameLoop(this.update.bind(this));
        this.foodManager = new FoodManager(this.tileCount);

        // Time tracking
        this.lastEatenTime = 0;

        // Managers initialization
        this.soundManager = SoundManager.getInstance();
        this.musicManager = new MusicManager();
        this.uiManager = new UIManager(this);

        // Drawing
        this.imagesLoaded = false;
        this.loadImages();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Add touch event listeners for mobile controls
        // We can't use passive listeners because we need preventDefault() to block scrolling
        // But we can handle scrolling prevention differently to avoid the console warnings
        
        // Create a touchStartHandler that properly handles the event
        const touchStartHandler = (e) => this.handleTouchStart(e);
        const touchMoveHandler = (e) => this.handleTouchMove(e);
        const touchEndHandler = (e) => this.handleTouchEnd(e);
        
        // Add non-passive event listeners with proper options
        this.canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', touchEndHandler, { passive: true });
        
        // Prevent page scrolling when touching the canvas using CSS overscroll behavior
        this.canvas.style.overscrollBehavior = 'none';
        this.canvas.style.touchAction = 'none';
        
        // Add click listener to document to pause the game when clicking outside the game field
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        // Initialize mobile arrow buttons if on a touch device
        this.initMobileArrowButtons();
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
        this.initializeAudio();

        // If a game start was requested by the interaction, start the game now
        if (this.startRequested) {
            console.log("Starting game now after interaction and audio initialization.");
            this.startGame();
            this.startRequested = false; // Reset the flag
        }
    }

    initializeAudio() {
        if (!this.hasUserInteraction) {
            console.warn("Attempted to initialize audio before user interaction.");
            return;
        }

        console.log("Initializing SoundManager and MusicManager contexts...");

        // Tell SoundManager to initialize its context now that interaction has happened
        // Passing 'true' indicates it's called due to user gesture
        if (this.soundManager) {
            SoundManager.hasUserInteraction = true; // Inform SoundManager directly
            this.soundManager.initAudioContext(true); // Force initialization/resume
        } else {
            console.warn("SoundManager not available during audio initialization.");
        }

        // Tell MusicManager to initialize/resume its context
        if (this.musicManager) {
            this.musicManager.initAudioContextIfNeeded(); // Create/resume context
        } else {
            console.warn("MusicManager not available during audio initialization.");
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
        
        // Calculate square size based on available width/height in container
        const size = Math.min(container.clientWidth, container.clientHeight);
        
        // Calculate grid size based on container 
        this.gridSize = Math.min(40, Math.floor(size / 20));

        // Ensure tileCount is an integer
        this.tileCount = Math.floor(size / this.gridSize);

        // Adjust canvas size to be exactly a multiple of gridSize
        // This eliminates partial cells at the edges
        const adjustedSize = this.tileCount * this.gridSize;

        // Get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas dimensions for Retina display
        this.canvas.width = adjustedSize * dpr;
        this.canvas.height = adjustedSize * dpr;
        
        // Set CSS dimensions for proper sizing on screen
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Clear inline styles from container to allow CSS to control dimensions
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
        const gameState = this.gameStateManager.getGameState();
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            this.handleDirectionKeys(event);
        }
    }

    handleFeatureToggleKeys(event) {
        const key = event.key && event.key.toLowerCase();
        const gameState = this.gameStateManager.getGameState();

        if (key === 's') {
            event.preventDefault();
            this.toggleSound();
            return true;
        }

        if (key === 'm') {
            event.preventDefault();
            this.toggleMusic();
            return true;
        }

        if (key === 'n') {
            event.preventDefault();
            this.changeMusic();
            return true;
        }

        if (key === 'l') {
            event.preventDefault();
            const luckEnabled = this.gameStateManager.toggleLuck();
            if (gameState.soundEnabled) {
                this.soundManager.playSound('click', 0.3);
            }
            this.uiManager.showTemporaryMessage(
                luckEnabled ? "Luck ON (80% chance to avoid crashes)" : "Luck OFF",
                1500
            );
            return true;
        }

        if (key === 'v') {
            event.preventDefault();
            const shakeEnabled = this.gameStateManager.toggleShake();

            // No need to modify the intensity here
            // The draw method will set it to 0 if disabled, or leave it as is if enabled

            if (gameState.soundEnabled) {
                this.soundManager.playSound('click', 0.3);
            }
            this.uiManager.showTemporaryMessage(
                shakeEnabled ? "Snake Vibration ON" : "Snake Vibration OFF",
                1500
            );
            return true;
        }

        if (key === 'a') {
            event.preventDefault();
            if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
                this.foodManager.spawnFruitInSnakeDirection(
                    this.snake,
                    this.direction,
                    this.getRandomFruit.bind(this),
                    this.soundManager
                );
            }
            return true;
        }

        return false;
    }

    handleGameStateKeys(event) {
        const gameState = this.gameStateManager.getGameState();

        if (event.keyCode === 32) { // Spacebar
            event.preventDefault(); // Prevent space scrolling
            if (gameState.isGameOver) {
                this.resetGame();
                // Set request flag BEFORE calling interaction handler
                this.startRequested = true;
                this.handleFirstInteraction(); // Ensure interaction flag is set & potentially start game
                
                // Start game loops 
                this.gameLoop.startGameLoop();
                this.gameLoop.startFruitLoop(this.manageFruits.bind(this));
                
                // Select a NEW random melody for the new game
                if (this.musicManager) {
                    console.log("Selecting new random melody for new game after game over (spacebar)");
                    this.musicManager.selectRandomMelody();
                }
                
                // EXPLICITLY START MUSIC if it should be enabled
                // This is needed because the reset MusicManager won't automatically start
                const currentGameState = this.gameStateManager.getGameState();
                if (currentGameState.musicEnabled && this.musicManager) {
                    console.log("Starting music for new game after game over (spacebar)");
                    this.musicManager.startMusic();
                }
                
            } else if (gameState.isGameStarted) {
                this.togglePause();
            } else {
                // Set request flag BEFORE calling interaction handler
                this.startRequested = true;
                this.handleFirstInteraction(); // Ensure interaction flag is set & potentially start game
            }
            return true; // Handled
        }

        // Start game with arrow keys if not started
        if (!gameState.isGameStarted && !gameState.isGameOver && [37, 38, 39, 40].includes(event.keyCode)) {
             event.preventDefault(); // Prevent arrow key scrolling
             // Set request flag BEFORE calling interaction handler
             this.startRequested = true;
             this.handleFirstInteraction(); // Ensure interaction flag is set & potentially start game
             
             // Start game loops explicitly (similar to what's done with spacebar)
             this.gameLoop.startGameLoop();
             this.gameLoop.startFruitLoop(this.manageFruits.bind(this));
             
             // EXPLICITLY START MUSIC if it's enabled
             const currentGameState = this.gameStateManager.getGameState();
             if (currentGameState.musicEnabled && this.musicManager) {
                 console.log("Starting music for new game (arrow keys)");
                 // Select a new random melody for each game
                 this.musicManager.selectRandomMelody();
                 // Start the music
                 this.musicManager.startMusic();
             }
             
             return true; // Handled
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
            const validDirectionChange = this.isValidDirectionChange(keyDirection);
            if (validDirectionChange) {
                this.nextDirection = keyDirection;
            }
            this.gameLoop.updateGameSpeed(keyDirection, this.direction);
        }
    }

    isValidDirectionChange(newDirection) {
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        return newDirection !== oppositeDirections[this.direction];
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
    }

    unpauseGame() {
        // Get the sound manager instance (don't force initialization since we already did that in startGame)
        this.soundManager = SoundManager.getInstance();
        
        // Create a fresh music manager (it will get the shared context automatically)
        this.musicManager = new MusicManager();
        
        // Start music if enabled
        const gameState = this.gameStateManager.getGameState();
        if (gameState.musicEnabled) {
            // Start music using the existing AudioContext
            this.musicManager.startMusic();
        }
        
        // Restart the game loop
        this.gameLoop.startGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            console.warn('[startGame] Attempted to start game before images loaded.');
            return;
        }
        
        // Ensure audio is initialized if interaction happened (redundant check, but safe)
        if (this.hasUserInteraction) {
             this.initializeAudio(); 
        }

        // Check if the game is over - shouldn't reach here if resetGame() was called properly
        if (this.gameStateManager.getGameState().isGameOver) {
             console.log("[startGame] StartGame called when game is already over. This shouldn't happen if resetGame() was called.");
             this.resetGame(); // Should ideally be handled before calling startGame
        }

        console.log("[startGame] Starting game process...");
        console.log("[startGame] State BEFORE resetGameState:", JSON.stringify(this.gameStateManager.getGameState()));

        // Reset game elements FIRST 
        this.resetGameState(); 
        console.log("[startGame] State AFTER resetGameState:", JSON.stringify(this.gameStateManager.getGameState()));
        
        // THEN set the game state to started
        this.gameStateManager.startGame();
        console.log("[startGame] State AFTER gameStateManager.startGame():", JSON.stringify(this.gameStateManager.getGameState()));

        // Start loops
        this.gameLoop.startGameLoop();
        this.gameLoop.startFruitLoop(this.manageFruits.bind(this)); 
        console.log("[startGame] Game loops started.");

        this.draw(); // Initial draw after starting
        console.log("[startGame] Initial draw completed.");
    }

    resetGameState() {
        console.log("Resetting game elements (snake, food, score, etc.)..."); // Added log for clarity
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
        const nextHeadPos = this.getNextHeadPosition();

        if (this.checkCollision(nextHeadPos)) {
            this.handleCollision(nextHeadPos);
        } else {
            this.snake.move(nextHeadPos.x, nextHeadPos.y);
        }
    }

    handleCollision(nextHeadPos) {
        const gameState = this.gameStateManager.getGameState();

        // First, determine what type of collision this is
        const isWallCollision = nextHeadPos.x < 0 || nextHeadPos.x >= this.tileCount ||
            nextHeadPos.y < 0 || nextHeadPos.y >= this.tileCount;

        // Check if it's a self collision by finding which segment we're colliding with
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
            this.gameStateManager.score = newScore; // Direct assignment as there's no "updateScoreAbsolute" method
            this.uiManager.updateScore(newScore);

            // Cut the tail by removing segments from collisionIndex to the end
            this.snake.cutTailAt(collisionIndex);

            // Play a sound to indicate tail cutting
            if (this.gameStateManager.getGameState().soundEnabled) {
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
            const testPos = { x: headPos.x, y: headPos.y };

            switch (direction) {
                case 'up': testPos.y--; break;
                case 'down': testPos.y++; break;
                case 'left': testPos.x--; break;
                case 'right': testPos.x++; break;
            }

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

        const safeHeadPos = this.getNextHeadPosition();
        const gameState = this.gameStateManager.getGameState();

        if (gameState.soundEnabled) {
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

        if (gameState.soundEnabled) {
            this.soundManager.playSound(eatenFood.type);
        }

        this.snake.grow();

        if (this.foodManager.getAllFood().length === 0) {
            this.foodManager.generateFood(this.snake, this.getRandomFruit.bind(this));
        }
    }

    getNextHeadPosition() {
        const headPos = this.snake.head();
        const nextPos = { x: headPos.x, y: headPos.y };

        switch (this.direction) {
            case 'up': nextPos.y--; break;
            case 'down': nextPos.y++; break;
            case 'left': nextPos.x--; break;
            case 'right': nextPos.x++; break;
        }

        return nextPos;
    }

    isPositionSafe(x, y) {
        if (x < 0 || x >= this.tileCount || y < 0 || y >= this.tileCount) {
            return false;
        }

        return !this.snake.isOccupyingPosition(x, y, true);
    }

    checkCollision(headPos) {
        if (headPos.x < 0 || headPos.x >= this.tileCount ||
            headPos.y < 0 || headPos.y >= this.tileCount) {
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

        this.handleGameOverAudio(isNewHighScore);
    }

    handleGameOverAudio(isNewHighScore) {
        // Skip audio handling if we don't have a valid audio context
        const sharedContext = SoundManager.getAudioContext();
        if (!this.soundManager || !sharedContext) {
            console.warn("Cannot handle game over audio: SoundManager or shared context unavailable.");
            return;
        }
        
        // Calculate delay for potential high score sound
        const highScoreFanfareDelay = 800;

        // 1. Stop music but don't fully clean up (preserve the AudioContext)
        if (this.musicManager) {
            console.log("Game Over: Stopping music without AudioContext cleanup.");
            this.musicManager.stopMusic(false); // Use false to avoid full cleanup
        }

        // 2. Play crash sound immediately
        this.soundManager.playSound('crash');

        // 3. Play high score fanfare if needed, after a delay
        if (isNewHighScore) {
            console.log("Game Over: Scheduling high score fanfare.");
            setTimeout(() => {
                this.soundManager.playHighScoreFanfare();
            }, highScoreFanfareDelay);
        }
    }

    resetGame() {
        console.log("Resetting game state...");
        this.gameStateManager.resetGame();
        console.log("Game State after reset:", 
            JSON.stringify({
                isGameStarted: this.gameStateManager.isGameStarted,
                isGameOver: this.gameStateManager.isGameOver,
                isPaused: this.gameStateManager.isPaused
            })
        );
        
        // Generate a new color for the snake
        if (this.drawer) {
            this.drawer.generateNewSnakeColor();
        }

        // Get sound manager instance
        this.soundManager = SoundManager.getInstance();
        
        // Handle music manager - reuse if possible
        if (!this.musicManager) {
            console.log("Creating new MusicManager instance for reset game.");
            this.musicManager = new MusicManager();
        } else {
            console.log("Reusing existing MusicManager instance for reset game.");
            // Reset the music manager state without creating a new instance
            this.musicManager.isPlaying = false;
            this.musicManager.currentNoteIndex = 0;
            this.musicManager.nextNoteTime = 0;
            
            // Clear any scheduled notes
            if (this.musicManager.melodyScheduler) {
                clearTimeout(this.musicManager.melodyScheduler);
                this.musicManager.melodyScheduler = null;
            }
        }
        
        // If the shared context is already running, ensure the music manager is ready
        if (SoundManager.getAudioContext()?.state === 'running') {
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
            lastEatenTime: this.lastEatenTime
        };
        
        this.drawer.draw(gameState);
        
        // Restore context
        this.ctx.restore();
    }

    toggleSound() {
        // Initialize audio on first toggle if interaction hasn't happened yet
        if (!this.hasUserInteraction) {
            this.handleFirstInteraction(); // Just set the flag
            // Audio will be fully initialized when startGame or playSound is called
        }

        const soundEnabled = this.gameStateManager.toggleSound();
        this.uiManager.updateSoundToggleUI();
        if (soundEnabled && this.soundManager?.audioContext?.state === 'running') {
            this.soundManager.playSound('click'); // Play click sound if enabling
        }
        localStorage.setItem('snakeSoundEnabled', soundEnabled);
    }

    toggleMusic() {
        // Initialize audio on first toggle if interaction hasn't happened yet
        if (!this.hasUserInteraction) {
            this.handleFirstInteraction(); // Just set the flag
            // Audio will be fully initialized when startGame or startMusic is called
        }

        const musicEnabled = this.gameStateManager.toggleMusic();
        this.uiManager.updateMusicToggleUI();

        if (musicEnabled) {
            // Attempt to start music - it will handle context checks internally
            this.musicManager.startMusic(); 
            this.uiManager.updateMelodyDisplay(this.musicManager.getCurrentMelody());
        } else {
            this.musicManager.stopMusic();
            this.uiManager.updateMelodyDisplay(null); // Clear display when music stops
        }
        localStorage.setItem('snakeMusicEnabled', musicEnabled);
        if (this.gameStateManager.getGameState().soundEnabled && this.soundManager?.audioContext?.state === 'running') {
            this.soundManager.playSound('click', 0.5); // Play click sound when toggling
        }
    }

    changeMusic() {
        // Set interaction flag if not already set
        if (!this.hasUserInteraction) {
            this.handleFirstInteraction(); 
        }

        if (this.musicManager && this.gameStateManager.getGameState().musicEnabled) {
             // changeToRandomMelody calls startMusic internally, which handles context
             this.musicManager.changeToRandomMelody();
             this.uiManager.updateMelodyDisplay(this.musicManager.getCurrentMelody());
             if (this.gameStateManager.getGameState().soundEnabled) {
                 // playSound handles context check internally
                 this.soundManager?.playSound('click', 0.5);
             }
        } else if (!this.gameStateManager.getGameState().musicEnabled) {
            // If music is off, still select a new melody but don't play it
            this.musicManager?.selectRandomMelody(); // Selects without playing
            this.uiManager.updateMelodyDisplay(this.musicManager?.getCurrentMelody()); // Update display even if off
            if (this.gameStateManager.getGameState().soundEnabled && this.soundManager?.audioContext?.state === 'running') {
                this.soundManager?.playSound('click', 0.5);
            }
        }
    }

    handleTouchStart(event) {
        // Prevent default for multi-touch to avoid zooming, allow single touch default for now
        if (event.touches.length > 1) {
            event.preventDefault(); 
        }
        
        const gameState = this.gameStateManager.getGameState();
        
        // Store initial touch details
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = new Date().getTime();
        // Reset the movement flag on touch start
        this.touchMoved = false;
        // Reset accumulated swipe distance on new touch
        this.accumulatedSwipeDistance = 0;
        this.lastSwipeDirection = null;
        // Reset speed adjustment flag - allow adjustment on new touch
        this.hasAdjustedSpeed = false;
        
        // Handle two-finger tap for pause
        if (event.touches.length === 2 && gameState.isGameStarted && !gameState.isPaused) {
            event.preventDefault(); // Prevent default for the pause gesture
            this.togglePause();
            return; // Don't process further for pause gesture
        }
        
        // Unpause game with a single touch if paused
        if (gameState.isGameStarted && gameState.isPaused && event.touches.length === 1) {
             event.preventDefault(); // Prevent default for unpause
             this.togglePause();
             return; // Don't process further for unpause
        }
        
        // Handle game over state - reset and start a new game
        if (gameState.isGameOver) {
             console.log("[handleTouchStart] Touch detected on game over screen - resetting and starting new game");
             event.preventDefault(); // Prevent default for game restart touch
             
             // Reset game state first
             this.resetGame(); 
             
             // Since resetGame now sets isGameStarted = true via GameStateManager.resetGame(),
             // we can start the game loop immediately
             this.gameLoop.startGameLoop();
             this.gameLoop.startFruitLoop(this.manageFruits.bind(this));
             
             // Ensure interaction has happened (should be true if clicking game over screen)
             if (!this.hasUserInteraction) {
                 this.handleFirstInteraction(); // Should ideally not be needed here
             }
             
             // Select a NEW random melody for the new game
             if (this.musicManager) {
                 console.log("Selecting new random melody for new game after game over (touch)");
                 this.musicManager.selectRandomMelody();
             }
             
             // EXPLICITLY START MUSIC if it should be enabled
             const currentGameState = this.gameStateManager.getGameState();
             if (currentGameState.musicEnabled && this.musicManager) {
                 console.log("Starting music for new game after game over (touch)");
                 this.musicManager.startMusic();
             }
             
             return; // Handled game over restart
        }
        
        // Start game if not started yet
        if (!gameState.isGameStarted) {
             console.log("[handleTouchStart] Touch detected on start screen.");
             event.preventDefault(); // Prevent default for game start touch
             
             // Check if this is the *first* interaction
             if (!this.hasUserInteraction) {
                 console.log("[handleTouchStart] First interaction via touch, setting startRequested.");
                 // Set request flag BEFORE calling interaction handler
                 this.startRequested = true;
                 this.handleFirstInteraction(); // Ensure interaction flag is set & potentially start game
             } else {
                 // Interaction already happened (e.g., clicked outside), start game directly
                 console.log("[handleTouchStart] Interaction already occurred, starting game directly.");
                 this.startGame();
             }
             return; // Handled start request
        }

        // If game is running and it's a single touch, prevent default if needed later in move/end
        if(event.touches.length === 1) {
            // We might prevent default in handleTouchMove if actual swipe occurs
        }
    }
    
    handleTouchMove(event) {
        // Only prevent default when we're handling a gameplay-related gesture
        // This allows the browser to optimize scrolling when not playing
        const gameState = this.gameStateManager.getGameState();
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            event.preventDefault();
        }
        
        if (event.touches.length !== 1) return;
        
        if (!gameState.isGameStarted || gameState.isPaused || gameState.isGameOver) return;
        
        // Calculate thresholds based on canvas size
        const canvasSize = this.canvas.width;
        const smallSwipeThreshold = canvasSize * 0.02; // 2% of canvas size for direction change
        const wideSwipeThreshold = canvasSize * 0.33; // 33% of canvas size for speed change
        const accumulatedThreshold = canvasSize * 0.33; // 33% of canvas size for accumulated swipes
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only change direction if the drag distance is significant
        if (Math.abs(deltaX) > smallSwipeThreshold || Math.abs(deltaY) > smallSwipeThreshold) {
            // Mark that movement has occurred during this touch
            this.touchMoved = true;
            
            // Determine the primary direction of the swipe
            let newDirection;
            let primaryDelta;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                newDirection = deltaX > 0 ? 'right' : 'left';
                primaryDelta = Math.abs(deltaX);
            } else {
                // Vertical swipe
                newDirection = deltaY > 0 ? 'down' : 'up';
                primaryDelta = Math.abs(deltaY);
            }
            
            // Reset accumulated distance if direction changes
            if (this.lastSwipeDirection !== newDirection) {
                this.accumulatedSwipeDistance = 0;
                this.lastSwipeDirection = newDirection;
                // Allow speed adjustment when direction changes
                this.hasAdjustedSpeed = false;
            }
            
            // Accumulate the swipe distance in the current direction
            this.accumulatedSwipeDistance += primaryDelta;
            
            if (this.isValidDirectionChange(newDirection)) {
                // Apply the direction change
                this.nextDirection = newDirection;
                
                // Check if we haven't already adjusted speed for this touch or direction
                if (!this.hasAdjustedSpeed) {
                    // Apply speed adjustment only once per touch event
                    this.gameLoop.updateTouchGameSpeed(newDirection, this.direction);
                    
                    // If it's a wide swipe in the same direction, apply one additional boost
                    if ((newDirection === this.direction) && 
                       (primaryDelta > wideSwipeThreshold || this.accumulatedSwipeDistance > accumulatedThreshold)) {
                        this.gameLoop.updateTouchGameSpeed(newDirection, this.direction);
                    }
                    
                    // Mark that we've adjusted speed for this touch
                    this.hasAdjustedSpeed = true;
                }
            }
            
            // Reset starting position to allow continuous dragging
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }
    
    handleTouchEnd(event) {
        // For touchend, we don't need preventDefault as often since it won't affect scrolling
        // We can make this passive for better performance
        const gameState = this.gameStateManager.getGameState();
        
        // Reset speed adjustment flag when finger is lifted
        this.hasAdjustedSpeed = false;
        
        // Handle single tap to reduce speed - only if no movement occurred
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            const touchEndTime = new Date().getTime();
            const touchDuration = touchEndTime - this.touchStartTime;
            
            // If it's a quick tap (less than 250ms) AND no significant movement occurred
            if (touchDuration < 250 && !this.touchMoved && event.changedTouches.length === 1) {
                // Slow down the snake temporarily
                this.gameLoop.reduceSpeed();
            }
        }
    }

    handleDocumentClick(event) {
        console.log("[handleDocumentClick] Click detected.");
        // Prerequisite: User must have interacted at least once for clicks to matter for game state
        if (!this.hasUserInteraction) {
            // If the first interaction is a click, the 'once' listener in
            // addInteractionListeners should handle it. This function shouldn't
            // need to do anything until interaction has occurred.
            console.log("[handleDocumentClick] Ignored: No user interaction yet.");
            return;
        }

        console.log(`[handleDocumentClick] User interaction detected (hasUserInteraction: ${this.hasUserInteraction}).`);
        const gameState = this.gameStateManager.getGameState();
        console.log("[handleDocumentClick] Current Game State:", JSON.stringify(gameState));

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
            console.log("[handleDocumentClick] Checking pause condition...");
            
            // Check if the clicked element (or any of its parents) is in the non-pausing list
            const shouldNotPause = nonPausingElements.some(selector => {
                return event.target.closest(selector) !== null;
            });
            
            if (!shouldNotPause) {
                console.log("[handleDocumentClick] Pausing game via outside click.");
                this.togglePause();
                this.uiManager.showTemporaryMessage('Game paused', 1500);
                return; // Handled
            }
            console.log("[handleDocumentClick] Pause condition not met (click was inside UI element).");
        }

        // Start logic: Click inside canvas when not started
        if (!gameState.isGameStarted && !gameState.isGameOver) {
            console.log("[handleDocumentClick] Checking start condition...");
            if (this.canvas.contains(event.target)) {
                console.log("[handleDocumentClick] Starting game via canvas click.");
                // Ensure startRequested is set (potentially redundant, but safe)
                this.startRequested = true;
                // Call startGame directly. Audio is ready because hasUserInteraction is true.
                this.startGame();
                return; // Handled
            }
            console.log("[handleDocumentClick] Start condition not met (click was outside canvas).");
        }
        
        console.log("[handleDocumentClick] Click did not trigger pause or start.");
    }

    // Check if the device is a touch device
    isTouchDevice() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
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
            // Check if vibration API is available
            if (navigator.vibrate) {
                navigator.vibrate(15); // 15ms short vibration
            }
        };
        
        // Helper function to handle button press
        const handleArrowButtonPress = (direction) => {
            const gameState = this.gameStateManager.getGameState();
            
            // Trigger haptic feedback
            triggerHapticFeedback();
            
            // If game over, ignore arrow presses to prevent accidental restarts
            if (gameState.isGameOver) {
                console.log("Game is over, arrow buttons are disabled until manual restart");
                return;
            }
            
            // If game hasn't started, handle game start
            if (!gameState.isGameStarted) {
                // Set request flag for user interaction
                this.startRequested = true;
                
                // Ensure interaction flag is set and audio is initialized
                this.handleFirstInteraction();
                
                // Explicitly initialize audio contexts - redundant but ensures audio works
                this.initializeAudio();
                
                // Start game and loops
                this.startGame();
                this.gameLoop.startGameLoop();
                this.gameLoop.startFruitLoop(this.manageFruits.bind(this));
                
                // Force a delay to ensure game state is fully updated
                setTimeout(() => {
                    // Get FRESH game state after initialization
                    const updatedGameState = this.gameStateManager.getGameState();
                    
                    // Explicitly start music if enabled
                    if (updatedGameState.musicEnabled && this.musicManager) {
                        console.log("Starting music for new game (mobile arrows)");
                        // Select a new random melody for the game
                        this.musicManager.selectRandomMelody();
                        // Start the music with force flag
                        this.musicManager.startMusic();
                        // Update melody display
                        this.uiManager.updateMelodyDisplay(this.musicManager.getCurrentMelody());
                    }
                }, 100);
                
                return;
            }
            
            if (gameState.isPaused) return;
            
            // IMPORTANT: Call updateGameSpeed regardless of validity
            // The function itself handles opposite direction logic for slowing down.
            this.gameLoop.updateGameSpeed(direction, this.direction);

            // Only update the nextDirection if the change is valid
            if (this.isValidDirectionChange(direction)) {
                console.log(`Arrow button press: changing direction to ${direction}`);
                this.nextDirection = direction;
            } else {
                console.log(`Arrow button press: ${direction} is invalid from current direction ${this.direction}`);
                // No need to do anything else here, updateGameSpeed handled the potential slow down
            }
        };
        
        // Add event listeners for buttons - use both touchstart and mousedown for better compatibility
        upButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            
            // Ensure audio is initialized directly from touch event
            if (!this.hasUserInteraction) {
                this.hasUserInteraction = true;
                this.initializeAudio();
            }
            
            handleArrowButtonPress('up');
        });
        
        downButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            
            // Ensure audio is initialized directly from touch event
            if (!this.hasUserInteraction) {
                this.hasUserInteraction = true;
                this.initializeAudio();
            }
            
            handleArrowButtonPress('down');
        });
        
        leftButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            
            // Ensure audio is initialized directly from touch event
            if (!this.hasUserInteraction) {
                this.hasUserInteraction = true;
                this.initializeAudio();
            }
            
            handleArrowButtonPress('left');
        });
        
        rightButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            
            // Ensure audio is initialized directly from touch event
            if (!this.hasUserInteraction) {
                this.hasUserInteraction = true;
                this.initializeAudio();
            }
            
            handleArrowButtonPress('right');
        });
        
        // Add mouse event listeners as fallback for hybrid devices
        upButton.addEventListener('mousedown', () => handleArrowButtonPress('up'));
        downButton.addEventListener('mousedown', () => handleArrowButtonPress('down'));
        leftButton.addEventListener('mousedown', () => handleArrowButtonPress('left'));
        rightButton.addEventListener('mousedown', () => handleArrowButtonPress('right'));
    }
}

window.addEventListener('load', () => {
    // Create the game instance and make it globally available
    window.SnakeGame = new SnakeGame();
});

