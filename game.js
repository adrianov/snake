class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.removeStartButton();
        this.initializeGameSettings();
        this.setupEventListeners();
    }

    removeStartButton() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.remove();
        }
    }

    initializeGameSettings() {
        // Canvas and grid settings
        this.resizeCanvas();

        // Game state
        this.snake = new Snake(5, 5);
        this.food = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.isGameStarted = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;

        // Speed settings
        this.baseSpeed = 100;
        this.speed = this.baseSpeed;
        this.speedMultiplier = 0.8;
        this.slowMultiplier = 1.2;
        this.frameInterval = this.baseSpeed;

        // Time tracking
        this.lastFrameTime = 0;
        this.lastRandomSpawnTime = Date.now();
        this.randomSpawnInterval = 1667 + Math.random() * 833; // 1.7-2.5 seconds
        this.lastEatenTime = 0;
        this.glowDuration = 3000;

        // Animation and loop handles
        this.fruitLoop = null;
        this.animationFrame = null;
        this.boundGameLoop = null;

        // Feature toggles
        this.luckEnabled = true;
        this.shakeEnabled = true;
        this.soundEnabled = localStorage.getItem('snakeSoundEnabled') !== 'false';
        this.musicEnabled = localStorage.getItem('snakeMusicEnabled') !== 'false';

        // Managers initialization
        this.soundManager = SoundManager.getInstance();
        this.musicManager = new MusicManager();
        this.musicManager.init();
        this.uiManager = new UIManager(this);

        // Drawing
        this.imagesLoaded = false;
        this.oldDrawer = null;
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
            this.oldDrawer = this.drawer;
            this.init();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);

        this.canvas.width = size;
        this.canvas.height = size;

        this.gridSize = Math.min(40, Math.floor(size / 20));
        this.tileCount = Math.floor(size / this.gridSize);

        this.updateDrawerAfterResize();
    }

    updateDrawerAfterResize() {
        if (this.drawer) {
            const oldDrawer = this.drawer;
            this.drawer = new GameDrawer(this.canvas, this.gridSize, this.fruitImages);
            this.oldDrawer = this.drawer;
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
        this.score = 0;
        this.speed = this.baseSpeed;
        this.frameInterval = this.baseSpeed;
        this.uiManager.updateScore(this.score);
        this.uiManager.updateHighScore(this.highScore);
        this.generateFood();
        this.draw();
        this.startFruitLoop();
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
        if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
            this.handleDirectionKeys(event);
        }
    }

    handleFeatureToggleKeys(event) {
        const key = event.key && event.key.toLowerCase();

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
            this.toggleLuck();
            return true;
        }

        if (key === 'v') {
            event.preventDefault();
            this.toggleShake();
            return true;
        }

        if (key === 'a') {
            event.preventDefault();
            if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
                this.spawnFruitInSnakeDirection();
            }
            return true;
        }

        return false;
    }

    handleGameStateKeys(event) {
        if (event.keyCode === 32) { // Spacebar
            if (this.isGameOver) {
                this.resetGame();
                this.startGame();
                return true;
            } else if (this.isGameStarted) {
                this.togglePause();
                return true;
            } else {
                this.startGame();
                return true;
            }
        }

        // Start game with arrow keys if not started
        if (!this.isGameStarted && !this.isGameOver && [37, 38, 39, 40].includes(event.keyCode)) {
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
            this.updateGameSpeed(keyDirection, validDirectionChange);
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

    updateGameSpeed(keyDirection, validDirectionChange) {
        const previousSpeed = this.speed;
        const isCurrentDirection = keyDirection === this.direction;
        const isOppositeDirection = keyDirection === {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        }[this.direction];

        if (isCurrentDirection) {
            this.speed *= this.speedMultiplier;
        } else if (isOppositeDirection) {
            this.speed *= this.slowMultiplier;
        }

        // Ensure speed stays within reasonable bounds
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25);
        this.speed = Math.min(this.speed, this.baseSpeed * 3);
        this.frameInterval = this.speed;
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.boundGameLoop = this.gameLoop.bind(this);
        this.animationFrame = requestAnimationFrame(this.boundGameLoop);
    }

    gameLoop(timestamp) {
        const elapsed = timestamp - this.lastFrameTime;

        if (elapsed >= this.frameInterval) {
            this.update();
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
        }

        if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
            this.animationFrame = requestAnimationFrame(this.boundGameLoop);
        }
    }

    startFruitLoop() {
        if (this.fruitLoop) {
            clearInterval(this.fruitLoop);
            this.fruitLoop = null;
        }

        this.fruitLoop = setInterval(() => {
            this.manageFruits();
            this.draw();
        }, 100);
    }

    manageFruits() {
        // Remove expired fruits
        const currentTime = Date.now();
        this.food = this.food.filter(food => {
            const age = currentTime - food.spawnTime;
            if (age >= food.lifetime) {
                if (this.soundEnabled && this.isGameStarted && !this.isPaused && !this.isGameOver) {
                    this.soundManager.playSound('disappear');
                }
                return false;
            }
            return true;
        });

        // Spawn new food
        this.spawnRandomFood();
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.pauseGame();
        } else {
            this.unpauseGame();
        }

        this.draw();
    }

    pauseGame() {
        this.lastGameState = {
            snake: JSON.parse(JSON.stringify(this.snake.getSegments())),
            direction: this.direction,
            nextDirection: this.nextDirection,
            food: JSON.parse(JSON.stringify(this.food)),
            score: this.score,
            speed: this.speed,
            frameInterval: this.frameInterval
        };

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

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
        this.startGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            alert('Please wait for the game to load completely.');
            return;
        }

        this.resetGameState();
        this.setupAudio();
        this.startGameLoop();
    }

    resetGameState() {
        this.drawer.generateNewSnakeColor();
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = this.baseSpeed;
        this.frameInterval = this.baseSpeed;
        this.snake = new Snake(5, 5);
        this.food = [];
        this.lastRandomSpawnTime = Date.now();
        this.randomSpawnInterval = 1667 + Math.random() * 833;
        this.generateFood();
        this.isGameStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;
        this.luckEnabled = true;
        this.shakeEnabled = true;
    }

    setupAudio() {
        this.soundManager = SoundManager.getInstance();
        this.uiManager.clearMelodyDisplay();
        this.musicManager = MusicManagerUtils.initializeMusicManager(this, true);
        MusicManagerUtils.startMusicIfEnabled(this);
        this.uiManager.updateMelodyDisplay();
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: this.getRandomFruit(),
                spawnTime: Date.now(),
                lifetime: Math.random() * 15000 // Random lifetime between 0-15 seconds
            };
        } while (this.snake.isOccupyingPosition(newFood.x, newFood.y) ||
                this.food.some(f => f.x === newFood.x && f.y === newFood.y));

        this.food.push(newFood);
    }

    spawnRandomFood() {
        const currentTime = Date.now();
        if (currentTime - this.lastRandomSpawnTime >= this.randomSpawnInterval) {
            this.generateFood();
            this.lastRandomSpawnTime = currentTime;
            this.randomSpawnInterval = 1667 + Math.random() * 833;
        }
    }

    update() {
        if (this.isPaused) {
            return;
        }

        if (this.isGameStarted && !this.isGameOver) {
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
        if (this.luckEnabled && Math.random() < 0.8) {
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
            if (this.food.length === 0 && safeDirections.length > 0) {
                closestDirection = safeDirections[0].direction;
            } else {
                for (const option of safeDirections) {
                    // Calculate distance to each fruit from this position
                    for (const fruit of this.food) {
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

        if (this.soundEnabled) {
            this.soundManager.playSound('click', 0.3);
        }

        if (this.drawer && this.drawer.snakeDrawer) {
            this.drawer.snakeDrawer.triggerLuckGlow();
        }

        this.speed *= 1.3;
        this.speed = Math.min(this.speed, this.baseSpeed * 3);
        this.frameInterval = this.speed;

        this.snake.move(safeHeadPos.x, safeHeadPos.y);
    }

    checkFoodCollision() {
        const foodEatenIndex = this.food.findIndex(f =>
            f.x === this.snake.head().x && f.y === this.snake.head().y
        );

        if (foodEatenIndex !== -1) {
            this.handleFoodEaten(foodEatenIndex);
        }
    }

    handleFoodEaten(foodEatenIndex) {
        const eatenFood = this.food[foodEatenIndex];
        const fruitConfig = window.FRUIT_CONFIG[eatenFood.type];

        this.score += fruitConfig.score;
        this.uiManager.updateScore(this.score);
        this.lastEatenTime = Date.now();

        this.speed *= 0.95;
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25);
        this.frameInterval = this.speed;

        if (this.drawer) {
            this.drawer.incrementDarknessLevel();
        }

        if (this.soundEnabled) {
            this.soundManager.playSound(eatenFood.type);
        }

        this.snake.grow();
        this.food.splice(foodEatenIndex, 1);

        if (this.food.length === 0) {
            this.generateFood();
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
        this.isGameOver = true;
        this.isGameStarted = false;

        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.uiManager.updateHighScore(this.highScore);
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.draw();

        this.handleGameOverAudio(isNewHighScore);
    }

    handleGameOverAudio(isNewHighScore) {
        let cleanupDelayTime = 100;

        if (this.soundEnabled && isNewHighScore) {
            cleanupDelayTime = 2500;
        } else if (this.soundEnabled) {
            cleanupDelayTime = 900;
        }

        if (this.soundEnabled && this.soundManager) {
            setTimeout(() => {
                this.soundManager.playSound('crash');
            }, 0);
        }

        if (this.musicManager) {
            setTimeout(() => {
                this.musicManager.stopMusic(false);
            }, 100);
        }

        if (this.soundEnabled && this.soundManager && isNewHighScore) {
            setTimeout(() => {
                this.soundManager.playHighScoreFanfare();
            }, 800);
        }

        MusicManagerUtils.cleanupAudioResources(this, cleanupDelayTime);
    }

    resetGame() {
        this.isGameOver = false;
        this.soundManager = SoundManager.getInstance();
    }

    draw() {
        if (!this.drawer || !this.ctx) {
            return;
        }

        const gameState = {
            snake: this.snake.getSegments(),
            food: this.food,
            direction: this.direction,
            score: this.score,
            highScore: this.highScore,
            isGameOver: this.isGameOver,
            isPaused: this.isPaused,
            isGameStarted: this.isGameStarted,
            lastEatenTime: this.lastEatenTime,
            luckEnabled: this.luckEnabled,
            shakeEnabled: this.shakeEnabled
        };

        this.drawer.draw(gameState);

        if (this.drawer && this.drawer.snakeDrawer) {
            this.drawer.snakeDrawer.setShakeIntensity(
                this.shakeEnabled ? this.drawer.snakeDrawer.shakeIntensity : 0
            );
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('snakeSoundEnabled', this.soundEnabled.toString());
        this.uiManager.updateSoundToggleUI();

        if (this.soundEnabled) {
            this.soundManager.playSound('click', 0.2);
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('snakeMusicEnabled', this.musicEnabled.toString());
        this.uiManager.updateMusicToggleUI();

        if (this.musicEnabled) {
            if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
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
            if (this.soundEnabled) {
                this.soundManager.playSound('click', 0.3);
            }

            // Show a brief message with the new melody name
            this.uiManager.showTemporaryMessage(
                `Music: ${newMelody.name}`,
                2000
            );
        }
    }

    toggleLuck() {
        this.luckEnabled = !this.luckEnabled;

        if (this.soundEnabled) {
            this.soundManager.playSound('click', 0.3);
        }

        this.uiManager.showTemporaryMessage(
            this.luckEnabled ? "Luck ON (80% chance to avoid crashes)" : "Luck OFF",
            1500
        );
    }

    toggleShake() {
        this.shakeEnabled = !this.shakeEnabled;

        if (this.drawer && this.drawer.snakeDrawer) {
            this.drawer.snakeDrawer.setShakeIntensity(this.shakeEnabled ? 0.15 : 0);
        }

        if (this.soundEnabled) {
            this.soundManager.playSound('click', 0.3);
        }

        this.uiManager.showTemporaryMessage(
            this.shakeEnabled ? "Snake Vibration ON" : "Snake Vibration OFF",
            1500
        );
    }

    spawnFruitInSnakeDirection() {
        if (!this.snake) return;

        const head = this.snake.head();
        let newFruitPos = { x: head.x, y: head.y };

        const offsets = {
            'up': { x: 0, y: -2 },
            'down': { x: 0, y: 2 },
            'left': { x: -2, y: 0 },
            'right': { x: 2, y: 0 }
        };

        // Apply offset based on direction
        const offset = offsets[this.direction];
        newFruitPos.x += offset.x;
        newFruitPos.y += offset.y;

        // Clamp positions to game bounds
        newFruitPos.x = Math.max(0, Math.min(this.tileCount - 1, newFruitPos.x));
        newFruitPos.y = Math.max(0, Math.min(this.tileCount - 1, newFruitPos.y));

        // Check if position is occupied
        const positionOccupied =
            this.snake.isOccupyingPosition(newFruitPos.x, newFruitPos.y) ||
            this.food.some(f => f.x === newFruitPos.x && f.y === newFruitPos.y);

        if (!positionOccupied) {
            const specialFruit = {
                x: newFruitPos.x,
                y: newFruitPos.y,
                type: this.getRandomFruit(),
                spawnTime: Date.now(),
                lifetime: 10000 + Math.random() * 5000 // 10-15 seconds lifetime
            };

            this.food.push(specialFruit);

            if (this.soundEnabled) {
                this.soundManager.playSound('click');
            }
        }
    }
}

class Snake {
    constructor(startX, startY) {
        // Initialize snake with 3 segments
        this.segments = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.growing = false;
    }

    getSegments() {
        return this.segments;
    }

    head() {
        return this.segments[0];
    }

    move(x, y) {
        this.segments.unshift({ x, y });

        if (!this.growing) {
            this.segments.pop();
        } else {
            this.growing = false;
        }
    }

    grow() {
        this.growing = true;
    }

    isOccupyingPosition(x, y, skipHead = false) {
        const startIndex = skipHead ? 1 : 0;
        return this.segments.slice(startIndex).some(segment =>
            segment.x === x && segment.y === y
        );
    }

    findSafeDirection(currentDirection, boardSize, isPositionSafeCallback) {
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // Get all directions except the opposite of current
        const possibleDirections = ['up', 'down', 'left', 'right'].filter(d =>
            d !== oppositeDirections[currentDirection]
        );

        // Shuffle for randomness
        possibleDirections.sort(() => Math.random() - 0.5);

        // Check each direction
        for (const direction of possibleDirections) {
            const newHead = { x: this.head().x, y: this.head().y };

            const directionOffsets = {
                'up': { x: 0, y: -1 },
                'down': { x: 0, y: 1 },
                'left': { x: -1, y: 0 },
                'right': { x: 1, y: 0 }
            };

            const offset = directionOffsets[direction];
            newHead.x += offset.x;
            newHead.y += offset.y;

            if (isPositionSafeCallback(newHead.x, newHead.y)) {
                return direction;
            }
        }

        return null;
    }
}

window.addEventListener('load', () => {
    new SnakeGame();
});

