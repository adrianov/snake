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
        this.gameLoop = null;
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
        this.snakeColor = {
            primary: '#2ecc71',   // Default vibrant green
            secondary: '#27ae60'  // Default emerald green
        };
        this.oldDrawer = null;  // Keep track of previous drawer for preserving darkness level

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

            // Set initial snake colors
            this.drawer.updateSnakeColors(this.snakeColor);

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
            this.drawer = new GameDrawer(this.canvas, this.gridSize, this.fruitImages);

            // Pass current snake colors to the new drawer and preserve darkness level
            if (this.oldDrawer) {
                this.drawer.updateSnakeColors(this.snakeColor);
                this.drawer.darknessLevel = this.oldDrawer.darknessLevel;
            } else {
                this.drawer.updateSnakeColors(this.snakeColor);
            }

            // Store reference to current drawer before it gets replaced
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
        this.uiManager.updateScore(this.score);
        this.uiManager.updateHighScore(this.highScore);
        this.generateFood();
        this.draw();

        // Add event listeners
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Start the fruit loop immediately
        this.startFruitLoop();

        // Wake up audio context with a silent sound to prevent initial delay
        this.soundManager.playSound('click', 0);
    }

    handleKeyPress(e) {
        // Handle sound toggle with 'S' key
        if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            this.toggleSound();
            return;
        }

        // Handle music toggle with 'M' key
        if (e.key.toLowerCase() === 'm') {
            e.preventDefault();
            this.toggleMusic();
            return;
        }

        // If game is over and space key is pressed, restart the game
        if (this.isGameOver && e.key === ' ') {
            e.preventDefault();
            this.startGame();
            return;
        }

        // Handle space key for pause/unpause/start
        if (e.key === ' ') {
            e.preventDefault();
            if (!this.isGameStarted) {
                this.startGame();
            } else if (!this.isGameOver) {
                this.togglePause();
            }
            return;
        }

        // Prevent default scrolling behavior for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        // If game hasn't started and arrow key is pressed, start the game
        // BUT only if the game is not in game over state
        if (!this.isGameStarted && !this.isGameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            this.startGame();
            return;
        }

        // If game is paused and arrow key is pressed, unpause
        if (this.isPaused && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            this.togglePause(); // Unpause first
            return;
        }

        // Only handle arrow keys if game is running and not paused
        if (!this.isGameStarted || this.isPaused || this.isGameOver) return;

        // Determine the key direction
        let keyDirection = null;
        switch (e.key) {
            case 'ArrowUp': keyDirection = 'up'; break;
            case 'ArrowDown': keyDirection = 'down'; break;
            case 'ArrowLeft': keyDirection = 'left'; break;
            case 'ArrowRight': keyDirection = 'right'; break;
        }

        if (keyDirection) {
            // Check if this is a valid direction change
            let validDirectionChange = false;
            if (
                (keyDirection === 'up' && this.direction !== 'down') ||
                (keyDirection === 'down' && this.direction !== 'up') ||
                (keyDirection === 'left' && this.direction !== 'right') ||
                (keyDirection === 'right' && this.direction !== 'left')
            ) {
                this.nextDirection = keyDirection;
                validDirectionChange = true;
            }

            // Update game speed based on key direction - this happens even if we can't change direction
            this.updateGameSpeed(keyDirection, validDirectionChange);
        }
    }

    updateGameSpeed(keyDirection, validDirectionChange) {
        // Store previous speed to check if it changed
        const previousSpeed = this.speed;

        // Apply speed changes cumulatively
        if (keyDirection === this.direction) {
            // Speed up when pressing same direction
            this.speed *= this.speedMultiplier;
        } else if (
            (keyDirection === 'up' && this.direction === 'down') ||
            (keyDirection === 'down' && this.direction === 'up') ||
            (keyDirection === 'left' && this.direction === 'right') ||
            (keyDirection === 'right' && this.direction === 'left')
        ) {
            // Slow down when pressing opposite direction
            this.speed *= this.slowMultiplier;
        }

        // Ensure speed doesn't get too extreme
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25); // No faster than 4x base speed
        this.speed = Math.min(this.speed, this.baseSpeed * 3);    // No slower than 1/3 base speed

        // Only restart the game loop if speed changed and game is running
        if (previousSpeed !== this.speed && this.isGameStarted && !this.isPaused) {
            this.restartGameLoop();
        }
    }

    restartGameLoop() {
        // Clear any existing game loop
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        // Start a new game loop with the current speed
        this.gameLoop = setInterval(() => this.update(), this.speed);
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
            speed: this.speed
        };

        // Stop the game loop
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
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
        this.restartGameLoop();
    }

    startGame() {
        if (!this.imagesLoaded) {
            alert('Please wait for the game to load completely.');
            return;
        }

        // Generate new random snake color
        this.generateRandomSnakeColor();

        // Reset game state first
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = this.baseSpeed;
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

        // Start the game loop
        this.restartGameLoop();
    }

    generateRandomSnakeColor() {
        // Array of bright, visually appealing color pairs (primary, secondary)
        const colorPairs = [
            // Greens
            { primary: '#2ecc71', secondary: '#27ae60' }, // Default emerald
            // Blues
            { primary: '#3498db', secondary: '#2980b9' }, // Bright blue
            // Purples
            { primary: '#9b59b6', secondary: '#8e44ad' }, // Amethyst
            // Reds
            { primary: '#e74c3c', secondary: '#c0392b' }, // Alizarin
            // Oranges
            { primary: '#e67e22', secondary: '#d35400' }, // Carrot
            // Yellows
            { primary: '#f1c40f', secondary: '#f39c12' }, // Sunflower
            // Teals
            { primary: '#1abc9c', secondary: '#16a085' }, // Turquoise
            // Pinks
            { primary: '#e84393', secondary: '#d81b60' }, // Pink
            // Gradients with better contrast
            { primary: '#6a11cb', secondary: '#2575fc' }, // Purple to blue
            { primary: '#ff0844', secondary: '#ffb199' }, // Red to pink
            { primary: '#09c6f9', secondary: '#045de9' }, // Light blue to blue
            { primary: '#13547a', secondary: '#80d0c7' }, // Dark blue to teal
            { primary: '#ff9a9e', secondary: '#fad0c4' }, // Light pink
            { primary: '#ffecd2', secondary: '#fcb69f' }, // Light orange
        ];

        // Pick a random color pair
        const randomPair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
        this.snakeColor = randomPair;

        // Recreate snake sprites with new colors if the drawer exists
        if (this.drawer) {
            // Reset darkness level when starting a new game with a new color
            this.drawer.resetDarknessLevel();
            this.drawer.updateSnakeColors(this.snakeColor);
        }
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

                // Increase the darkness level in the drawer
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

        // Stop the game loop
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
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
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new SnakeGame();
});

