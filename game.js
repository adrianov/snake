class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Remove start button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.remove();
        }

        // Set initial canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game settings
        this.gridSize = Math.min(40, Math.floor(this.canvas.width / 20)); // Larger cells, max 40px
        this.tileCount = Math.floor(this.canvas.width / this.gridSize);
        this.snake = [];
        this.food = []; // Change to array of foods
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.fruitLoop = null; // Add new loop for fruit spawning
        this.baseSpeed = 100; // Base speed in milliseconds
        this.speed = this.baseSpeed;
        this.speedMultiplier = 0.8; // Speed up by 20% when pressing same direction
        this.slowMultiplier = 1.2; // Slow down by 20% when pressing opposite direction
        this.imagesLoaded = false;
        this.isGameStarted = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null; // Store the state of the game before pausing
        this.lastRandomSpawnTime = Date.now();
        this.randomSpawnInterval = 1667 + Math.random() * 833; // 1.7-2.5 seconds
        this.lastEatenTime = 0; // Track when snake last ate
        this.glowDuration = 3000; // Duration of glow effect in milliseconds (3 seconds)
        this.oldDrawer = null;  // Keep track of previous drawer for preserving darkness level
        this.lastFrameTime = 0; // Track time of last frame
        this.frameInterval = this.baseSpeed; // Current interval between frames
        this.animationFrame = null; // Handle for requestAnimationFrame
        this.boundGameLoop = null; // Bound game loop function

        // Audio settings
        this.soundEnabled = localStorage.getItem('snakeSoundEnabled') !== 'false'; // Default to enabled
        this.musicEnabled = localStorage.getItem('snakeMusicEnabled') !== 'false'; // Default to enabled

        // Initialize audio managers immediately to prevent delay on first sound
        this.soundManager = new SoundManager();
        // Initialize audio context immediately
        this.musicManager = new MusicManager();
        this.musicManager.init(); // Initialize audio context immediately

        // Initialize UI Manager
        this.uiManager = new UIManager(this);

        // Load fruit images
        this.fruitImages = {};
        this.loadFruitImages().then(() => {
            this.imagesLoaded = true;

            // Initialize the drawer after images are loaded
            this.drawer = new GameDrawer(this.canvas, this.gridSize, this.fruitImages);

            // Store reference to current drawer
            this.oldDrawer = this.drawer;

            this.init();
        });
    }

    resizeCanvas() {
        // Make canvas fill available space while maintaining square aspect ratio
        const container = this.canvas.parentElement;

        // Use the container dimensions to maintain square aspect
        const size = Math.min(container.clientWidth, container.clientHeight);

        this.canvas.width = size;
        this.canvas.height = size;

        // Update grid size and tile count
        this.gridSize = Math.min(40, Math.floor(size / 20));
        this.tileCount = Math.floor(size / this.gridSize);

        // Update drawer if it exists
        if (this.drawer) {
            // Store old drawer for reference
            const oldDrawer = this.drawer;

            // Create new drawer with updated canvas size
            this.drawer = new GameDrawer(this.canvas, this.gridSize, this.fruitImages);

            // The new drawer will have its own SnakeDrawer with default colors and levels
            // We don't need to manually copy properties since each specialized drawer
            // handles its own internal state

            // Store reference to current drawer
            this.oldDrawer = this.drawer;
        }

        // Redraw if game is initialized
        if (this.imagesLoaded) {
            this.draw();
        }
    }

    loadFruitImages() {
        const loadPromises = Object.entries(window.FRUIT_CONFIG).map(([type, config]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();

                // Create a data URL from the SVG
                const svgBlob = new Blob([config.svg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    this.fruitImages[type] = img;
                    URL.revokeObjectURL(url); // Clean up the URL after loading
                    resolve();
                };

                img.onerror = (error) => {
                    console.error(`Failed to load image for ${type}:`, error);
                    URL.revokeObjectURL(url); // Clean up the URL even if loading fails
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

        return 'apple'; // Fallback to apple if something goes wrong
    }

    init() {
        // Initialize game state
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.speed = this.baseSpeed;
        this.frameInterval = this.baseSpeed;
        this.uiManager.updateScore(this.score);
        this.uiManager.updateHighScore(this.highScore);
        this.generateFood();
        this.draw();

        // Add event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Start the fruit loop immediately
        this.startFruitLoop();
    }

    handleKeyDown(event) {
        // Handle sound toggle with 'S' key
        if (event.key && event.key.toLowerCase() === 's') {
            event.preventDefault();
            this.toggleSound();
            return;
        }

        // Handle music toggle with 'M' key
        if (event.key && event.key.toLowerCase() === 'm') {
            event.preventDefault();
            this.toggleMusic();
            return;
        }

        // CHEAT CODE: Spawn fruit in front of snake when 'A' key is pressed
        if (event.key && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
                this.spawnFruitInSnakeDirection();
            }
            return;
        }

        // Prevent default behavior for arrow keys to avoid page scrolling
        if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
            event.preventDefault();
        }

        // Handle game pause/resume with spacebar
        if (event.keyCode === 32) { // Spacebar
            if (this.isGameOver) {
                // If game is over, reset and start a new game directly
                this.resetGame();
                this.startGame();
                return;
            } else if (this.isGameStarted) {
                this.togglePause();
                return;
            } else {
                // If game isn't started yet, start it
                this.startGame();
                return;
            }
        }

        // If game is over, paused, or not started, don't process direction changes
        if (!this.isGameStarted || this.isPaused || this.isGameOver) {
            // Special case: allow any arrow key to start the game if not started yet
            if (!this.isGameStarted && !this.isGameOver && [37, 38, 39, 40].includes(event.keyCode)) {
                this.startGame();
            }
            return;
        }

        // Process directional input
        let keyDirection = null;
        if (event.keyCode === 37) keyDirection = 'left';
        else if (event.keyCode === 38) keyDirection = 'up';
        else if (event.keyCode === 39) keyDirection = 'right';
        else if (event.keyCode === 40) keyDirection = 'down';

        // Only proceed if a direction key was pressed
        if (keyDirection) {
            // Check if the requested direction change is valid
            const validDirectionChange = this.isValidDirectionChange(keyDirection);

            // Update next direction only if the change is valid
            if (validDirectionChange) {
                this.nextDirection = keyDirection;
            }

            // Always update speed regardless of whether direction change is valid
            // This allows slowing down by pressing opposite direction
            this.updateGameSpeed(keyDirection, validDirectionChange);
        }
    }

    // Add helper method to determine if a direction change is valid
    isValidDirectionChange(newDirection) {
        // Can't move in the opposite direction of current movement
        if (
            (this.direction === 'up' && newDirection === 'down') ||
            (this.direction === 'down' && newDirection === 'up') ||
            (this.direction === 'left' && newDirection === 'right') ||
            (this.direction === 'right' && newDirection === 'left')
        ) {
            return false;
        }
        return true;
    }

    updateGameSpeed(keyDirection, validDirectionChange) {
        // Store previous speed for comparison
        const previousSpeed = this.speed;

        // Check if key is in the same or opposite direction, regardless of validity
        const isCurrentDirection = keyDirection === this.direction;
        const isOppositeDirection =
            (keyDirection === 'up' && this.direction === 'down') ||
            (keyDirection === 'down' && this.direction === 'up') ||
            (keyDirection === 'left' && this.direction === 'right') ||
            (keyDirection === 'right' && this.direction === 'left');

        // Calculate speed change based on key direction
        if (isCurrentDirection) {
            // Speed up by 20% when pressing in current direction
            this.speed *= 0.8; // 0.8 = 80% of current speed (20% faster)
        } else if (isOppositeDirection) {
            // Slow down by 20% when pressing opposite direction
            this.speed *= 1.2; // 1.2 = 120% of current speed (20% slower)
        }

        // Ensure speed doesn't get too extreme
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25); // No faster than 4x base speed
        this.speed = Math.min(this.speed, this.baseSpeed * 3);    // No slower than 1/3 base speed

        // Update frame interval based on new speed - no need to restart the loop
        this.frameInterval = this.speed;
    }

    startGameLoop() {
        // Use requestAnimationFrame for smoother animation
        this.lastFrameTime = performance.now();
        // Bind this context properly for the gameLoop method
        this.boundGameLoop = this.gameLoop.bind(this);
        this.animationFrame = requestAnimationFrame(this.boundGameLoop);
    }

    gameLoop(timestamp) {
        // Calculate elapsed time since last frame
        const elapsed = timestamp - this.lastFrameTime;

        // Only update game state if enough time has passed based on current speed
        if (elapsed >= this.frameInterval) {
            this.update();
            // Adjust lastFrameTime (add exact frame interval to avoid drift)
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
        }

        // Continue loop if game is running
        if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
            this.animationFrame = requestAnimationFrame(this.boundGameLoop);
        }
    }

    startFruitLoop() {
        // Clear any existing fruit loop
        if (this.fruitLoop) {
            clearInterval(this.fruitLoop);
            this.fruitLoop = null;
        }

        // Start a new fruit loop with fixed interval
        this.fruitLoop = setInterval(() => {
            // Check for expired fruits and remove them
            const currentTime = Date.now();
            this.food = this.food.filter(food => {
                const age = currentTime - food.spawnTime;
                if (age >= food.lifetime) {
                    // Only play sound if game is active (not game over or not started)
                    if (this.soundEnabled && this.isGameStarted && !this.isGameOver) {
                        this.soundManager.playSound('disappear');
                    }
                    return false;
                }
                return true;
            });

            // Try to spawn random food
            this.spawnRandomFood();

            // Update the display
            this.draw();
        }, 100); // Fixed interval for smooth updates
    }

    togglePause() {
        // Toggle the pause state
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pause the game
            this.pauseGame();
        } else {
            // Unpause the game
            this.unpauseGame();
        }

        // Draw the current state (with or without pause screen)
        this.draw();
    }

    pauseGame() {
        // Store the game state before pausing
        this.lastGameState = {
            snake: JSON.parse(JSON.stringify(this.snake)), // Deep copy snake
            direction: this.direction,
            nextDirection: this.nextDirection,
            food: JSON.parse(JSON.stringify(this.food)), // Deep copy food
            score: this.score,
            speed: this.speed,
            frameInterval: this.frameInterval
        };

        // Stop the animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Stop background music without full cleanup
        if (this.musicManager) {
            this.musicManager.stopMusic(false);
        }
    }

    unpauseGame() {
        // Restart music from where it was, but only if music is enabled
        if (this.musicManager && this.musicEnabled) {
            this.musicManager.startMusic();
        }

        // Restart the game loop
        this.startGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            alert('Please wait for the game to load completely.');
            return;
        }

        // Generate new random snake color through the drawer
        this.drawer.generateNewSnakeColor();

        // Reset game state first
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = this.baseSpeed;
        this.frameInterval = this.baseSpeed;
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        this.food = []; // Clear all food
        this.lastRandomSpawnTime = Date.now();
        this.randomSpawnInterval = 1667 + Math.random() * 833; // 1.7-2.5 seconds
        this.generateFood(); // Generate initial food
        this.isGameStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;

        // Ensure sound manager is ready - don't recreate it to avoid audio context limitations
        if (!this.soundManager) {
            this.soundManager = new SoundManager();
        }

        // Clear melody display initially
        this.uiManager.clearMelodyDisplay();

        // If there was a previous music manager, stop it completely
        if (this.musicManager) {
            this.musicManager.stopMusic(true);
        }

        // Create a fresh music manager with its own audio context (no sharing)
        this.musicManager = new MusicManager();
        this.musicManager.init(); // Use its own audio context, don't share

        // Select a random melody and start music if enabled
        this.musicManager.selectRandomMelody();
        if (this.musicEnabled) {
            this.musicManager.startMusic();
        }

        // Update the melody display
        this.uiManager.updateMelodyDisplay();

        // Start the game loop using requestAnimationFrame
        this.startGameLoop();
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
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
                this.food.some(f => f.x === newFood.x && f.y === newFood.y));

        this.food.push(newFood);
    }

    spawnRandomFood() {
        const currentTime = Date.now();
        if (currentTime - this.lastRandomSpawnTime >= this.randomSpawnInterval) {
            this.generateFood();
            this.lastRandomSpawnTime = currentTime;
            // Set new random interval for next spawn
            this.randomSpawnInterval = 1667 + Math.random() * 833; // 1.7-2.5 seconds
        }
    }

    update() {
        // Don't update if game is paused
        if (this.isPaused) {
            return;
        }

        // Update direction and snake movement only if game is running
        if (this.isGameStarted && !this.isGameOver) {
            // Update direction
            this.direction = this.nextDirection;

            // Calculate new head position
            const head = { ...this.snake[0] };
            switch (this.direction) {
                case 'up': head.y--; break;
                case 'down': head.y++; break;
                case 'left': head.x--; break;
                case 'right': head.x++; break;
            }

            // Check for collisions
            if (this.checkCollision(head)) {
                this.gameOver();
                return;
            }

            // Add new head
            this.snake.unshift(head);

            // Check if any food is eaten
            const foodEatenIndex = this.food.findIndex(f => f.x === head.x && f.y === head.y);
            if (foodEatenIndex !== -1) {
                const eatenFood = this.food[foodEatenIndex];
                const fruitConfig = window.FRUIT_CONFIG[eatenFood.type];
                this.score += fruitConfig.score;
                this.uiManager.updateScore(this.score);
                this.lastEatenTime = Date.now(); // Update last eaten time

                // Increase speed by 5% when food is eaten
                this.speed *= 0.95; // 0.95 means 95% of current speed (5% faster)

                // Ensure speed doesn't get too fast
                this.speed = Math.max(this.speed, this.baseSpeed * 0.25); // No faster than 4x base speed

                // Update frame interval to match new speed
                this.frameInterval = this.speed;

                // Notify drawer that snake has grown - it will handle darkness progression internally
                if (this.drawer) {
                    this.drawer.incrementDarknessLevel();
                }

                // Play sound for the eaten fruit if sound is enabled
                if (this.soundEnabled) {
                    // Play immediately without any dependencies on the music system
                    this.soundManager.playSound(eatenFood.type);
                }

                // Remove eaten food
                this.food.splice(foodEatenIndex, 1);

                // Only generate new food if there are no fruits left
                if (this.food.length === 0) {
                    this.generateFood();
                }
            } else {
                // Remove tail if no food was eaten
                this.snake.pop();
            }
        }

        // Make sure melody name is always updated
        this.uiManager.updateMelodyDisplay();

        this.draw();
    }

    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }

        // Self collision (skip the head since it's the same position)
        return this.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
    }

    gameOver() {
        // Set game over state immediately
        this.isGameOver = true;
        this.isGameStarted = false;

        // Check if we have a new high score
        const isNewHighScore = this.score > this.highScore;

        // Update high score immediately if needed
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.uiManager.updateHighScore(this.highScore);
        }

        // Stop the animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Draw game over screen immediately to prevent flashing
        this.draw();

        // Handle audio in sequence - use setTimeout with 0ms to prevent audio blocking
        if (this.soundEnabled && this.soundManager) {
            // Play crash sound first - directly but in next event loop cycle
            setTimeout(() => {
                this.soundManager.playSound('crash');
            }, 0);
        }

        // Handle music separately from sound effects
        if (this.musicManager) {
            // Stop background music smoothly
            setTimeout(() => {
                this.musicManager.stopMusic(false);
            }, 100);
        }

        // Play high score fanfare after a delay if applicable
        if (this.soundEnabled && this.soundManager && isNewHighScore) {
            setTimeout(() => {
                this.soundManager.playHighScoreFanfare();
            }, 800);
        }
    }

    resetGame() {
        // Reset game state for a new game
        this.isGameOver = false;
    }

    draw() {
        // Skip if drawer or canvas context isn't ready
        if (!this.drawer || !this.ctx) {
            return;
        }

        // Create a game state object to pass to the drawer
        const gameState = {
            snake: this.snake,
            food: this.food,
            direction: this.direction,
            score: this.score,
            highScore: this.highScore,
            isGameOver: this.isGameOver,
            isPaused: this.isPaused,
            isGameStarted: this.isGameStarted,
            lastEatenTime: this.lastEatenTime
        };

        // Use the drawer to render the game
        this.drawer.draw(gameState);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('snakeSoundEnabled', this.soundEnabled.toString());
        this.uiManager.updateSoundToggleUI();

        // Play a test sound to wake up the audio context
        if (this.soundEnabled) {
            this.soundManager.playSound('click', 0.2); // Play at low volume
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('snakeMusicEnabled', this.musicEnabled.toString());
        this.uiManager.updateMusicToggleUI();

        // Update music playback immediately
        if (this.musicEnabled) {
            if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
                this.musicManager.startMusic();
            }
        } else {
            this.musicManager.stopMusic(false);
        }
    }

    // Add new method to spawn fruit in snake's direction
    spawnFruitInSnakeDirection() {
        if (this.snake.length === 0) return;

        const head = this.snake[0];
        let newFruitPos = { x: head.x, y: head.y };

        // Calculate position in front of snake head based on current direction
        switch (this.direction) {
            case 'up':
                newFruitPos.y = head.y - 2; // 2 spaces ahead
                break;
            case 'down':
                newFruitPos.y = head.y + 2;
                break;
            case 'left':
                newFruitPos.x = head.x - 2;
                break;
            case 'right':
                newFruitPos.x = head.x + 2;
                break;
        }

        // Ensure the new position is within the game bounds
        if (newFruitPos.x < 0) newFruitPos.x = 0;
        if (newFruitPos.x >= this.tileCount) newFruitPos.x = this.tileCount - 1;
        if (newFruitPos.y < 0) newFruitPos.y = 0;
        if (newFruitPos.y >= this.tileCount) newFruitPos.y = this.tileCount - 1;

        // Check if the position is already occupied by snake or another food
        const positionOccupied =
            this.snake.some(segment => segment.x === newFruitPos.x && segment.y === newFruitPos.y) ||
            this.food.some(f => f.x === newFruitPos.x && f.y === newFruitPos.y);

        // Only spawn if position is free
        if (!positionOccupied) {
            // Create a special fruit that lasts longer and gives bonus points
            const specialFruit = {
                x: newFruitPos.x,
                y: newFruitPos.y,
                type: this.getRandomFruit(), // Random fruit type
                spawnTime: Date.now(),
                lifetime: 10000 + Math.random() * 5000 // 10-15 seconds lifetime
            };

            this.food.push(specialFruit);

            // Play a sound for the cheat if sound is enabled
            if (this.soundEnabled) {
                this.soundManager.playSound('click');
            }
        }
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new SnakeGame();
});

