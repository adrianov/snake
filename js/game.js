class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.initializeGameSettings();
        this.setupEventListeners();
    }

    initializeGameSettings() {
        // Canvas and grid settings
        this.resizeCanvas();

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
        this.musicManager.init();
        this.uiManager = new UIManager(this);

        // Drawing
        this.imagesLoaded = false;
        this.loadImages();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
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
        const size = Math.min(container.clientWidth, container.clientHeight);

        // Calculate grid size based on container
        this.gridSize = Math.min(40, Math.floor(size / 20));

        // Ensure tileCount is an integer
        this.tileCount = Math.floor(size / this.gridSize);

        // Adjust canvas size to be exactly a multiple of gridSize
        // This eliminates partial cells at the edges
        const adjustedSize = this.tileCount * this.gridSize;

        this.canvas.width = adjustedSize;
        this.canvas.height = adjustedSize;

        // Ensure the canvas container maintains its border-radius after resize
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
                    gameState.soundEnabled,
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
            if (gameState.isGameOver) {
                this.resetGame();
                this.startGame();
                return true;
            } else if (gameState.isGameStarted) {
                this.togglePause();
                return true;
            } else {
                this.startGame();
                return true;
            }
        }

        // Start game with arrow keys if not started
        if (!gameState.isGameStarted && !gameState.isGameOver && [37, 38, 39, 40].includes(event.keyCode)) {
            this.startGame();
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
            const validDirectionChange = this.isValidDirectionChange(keyDirection);
            if (validDirectionChange) {
                this.nextDirection = keyDirection;
            }
            this.gameLoop.updateGameSpeed(keyDirection, this.direction, validDirectionChange);
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
                this.gameLoop.getSpeed(),
                this.gameLoop.getFrameInterval()
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

        MusicManagerUtils.cleanupAudioResources(this, 200);
    }

    unpauseGame() {
        this.soundManager = SoundManager.getInstance();
        this.musicManager = MusicManagerUtils.initializeMusicManager(this);
        MusicManagerUtils.startMusicIfEnabled(this);
        this.gameLoop.startGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            alert('Please wait for the game to load completely.');
            return;
        }

        this.resetGameState();
        this.setupAudio();
        this.gameLoop.startGameLoop();
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

    setupAudio() {
        this.soundManager = SoundManager.getInstance();
        this.uiManager.clearMelodyDisplay();
        this.musicManager = MusicManagerUtils.initializeMusicManager(this, true);
        MusicManagerUtils.startMusicIfEnabled(this);
        this.uiManager.updateMelodyDisplay();
    }

    manageFruits() {
        const gameState = this.gameStateManager.getGameState();
        this.foodManager.manageFruits(
            this.snake,
            this.getRandomFruit.bind(this),
            gameState.soundEnabled,
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
                this.tileCount,
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
        const gameState = this.gameStateManager.getGameState();
        let cleanupDelayTime = 100;

        if (isNewHighScore) {
            cleanupDelayTime = 2500;
        } else {
            cleanupDelayTime = 900;
        }

        if (this.soundManager) {
            setTimeout(() => {
                this.soundManager.playSound('crash');
            }, 0);
        }

        if (this.musicManager) {
            setTimeout(() => {
                this.musicManager.stopMusic(false);
            }, 100);
        }

        if (this.soundManager && isNewHighScore) {
            setTimeout(() => {
                this.soundManager.playHighScoreFanfare();
            }, 800);
        }

        MusicManagerUtils.cleanupAudioResources(this, cleanupDelayTime);
    }

    resetGame() {
        this.gameStateManager.resetGame();
        this.soundManager = SoundManager.getInstance();
    }

    draw() {
        if (!this.drawer || !this.ctx) {
            return;
        }

        const gameState = this.gameStateManager.getGameState();
        const drawState = {
            snake: this.snake.getSegments(),
            food: this.foodManager.getAllFood(),
            direction: this.direction,
            score: gameState.score,
            highScore: gameState.highScore,
            isGameOver: gameState.isGameOver,
            isPaused: gameState.isPaused,
            isGameStarted: gameState.isGameStarted,
            lastEatenTime: this.lastEatenTime,
            luckEnabled: gameState.luckEnabled,
            shakeEnabled: gameState.shakeEnabled
        };

        this.drawer.draw(drawState);

        // Only turn off shaking if shakeEnabled is false
        // Don't override the intensity value when it's enabled - let the SnakeDrawer handle it
        if (this.drawer && this.drawer.snakeDrawer && !gameState.shakeEnabled) {
            this.drawer.snakeDrawer.setShakeIntensity(0);
        }
    }

    toggleSound() {
        const soundEnabled = this.soundManager.toggleSound();
        this.uiManager.updateSoundToggleUI();

        if (soundEnabled) {
            this.soundManager.playSound('click');
        }
    }

    toggleMusic() {
        const musicEnabled = this.gameStateManager.toggleMusic();
        this.uiManager.updateMusicToggleUI();

        if (musicEnabled) {
            const gameState = this.gameStateManager.getGameState();
            if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
                this.musicManager.startMusic();
            }
        } else {
            this.musicManager.stopMusic(false);
        }
    }

    changeMusic() {
        // Use the utility function to handle music change
        const newMelody = MusicManagerUtils.changeToRandomMelody(this);

        if (newMelody) {
            // Play a sound to indicate music change
            this.soundManager.playSound('click');
        }
    }
}

window.addEventListener('load', () => {
    new SnakeGame();
});

