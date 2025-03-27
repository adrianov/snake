class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');

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
        this.randomSpawnInterval = 3333 + Math.random() * 1667; // 3.3-5 seconds

        // Audio settings
        this.soundEnabled = localStorage.getItem('snakeSoundEnabled') !== 'false'; // Default to enabled
        this.musicEnabled = localStorage.getItem('snakeMusicEnabled') !== 'false'; // Default to enabled

        // Initialize audio managers
        this.soundManager = new SoundManager();
        this.musicManager = new MusicManager();

        // Load fruit images
        this.fruitImages = {};
        this.loadFruitImages().then(() => {
            this.imagesLoaded = true;
            this.init();
        });

        // Snake sprite settings
        this.snakeSprites = {
            head: this.createSnakeHead(),
            body: this.createSnakeBody(),
            tail: this.createSnakeTail()
        };

        // Set up sound and music toggle controls
        this.initializeControls();
    }

    initializeControls() {
        // Set up sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            // Update initial state
            this.updateSoundToggleUI();

            // Add click event listener
            soundToggle.addEventListener('click', () => {
                this.toggleSound();
            });
        }

        // Set up music toggle
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
            // Update initial state
            this.updateMusicToggleUI();

            // Add click event listener
            musicToggle.addEventListener('click', () => {
                this.toggleMusic();
            });
        }

        // Set up high score reset button
        const resetButton = document.getElementById('resetHighScore');
        if (resetButton) {
            resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetHighScore();
            });
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('snakeSoundEnabled', this.soundEnabled.toString());
        this.updateSoundToggleUI();
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('snakeMusicEnabled', this.musicEnabled.toString());
        this.updateMusicToggleUI();

        // Update music playback immediately
        if (this.musicEnabled) {
            if (this.isGameStarted && !this.isPaused && !this.isGameOver) {
                this.musicManager.startMusic();
            }
        } else {
            this.musicManager.stopMusic(false);
        }
    }

    updateSoundToggleUI() {
        const soundToggle = document.getElementById('soundToggle');
        if (!soundToggle) return;

        const soundOnIcon = soundToggle.querySelector('.sound-on');
        const soundOffIcon = soundToggle.querySelector('.sound-off');

        if (this.soundEnabled) {
            soundToggle.classList.remove('disabled');
            soundToggle.title = "Sound ON (S key to toggle)";
            soundOnIcon.classList.remove('hidden');
            soundOffIcon.classList.add('hidden');
        } else {
            soundToggle.classList.add('disabled');
            soundToggle.title = "Sound OFF (S key to toggle)";
            soundOnIcon.classList.add('hidden');
            soundOffIcon.classList.remove('hidden');
        }
    }

    updateMusicToggleUI() {
        const musicToggle = document.getElementById('musicToggle');
        if (!musicToggle) return;

        const musicOnIcon = musicToggle.querySelector('.music-on');
        const musicOffIcon = musicToggle.querySelector('.music-off');

        if (this.musicEnabled) {
            musicToggle.classList.remove('disabled');
            musicToggle.title = "Music ON (M key to toggle)";
            musicOnIcon.classList.remove('hidden');
            musicOffIcon.classList.add('hidden');
        } else {
            musicToggle.classList.add('disabled');
            musicToggle.title = "Music OFF (M key to toggle)";
            musicOnIcon.classList.add('hidden');
            musicOffIcon.classList.remove('hidden');
        }
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
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.generateFood();
        this.draw();

        // Add event listeners
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Start the fruit loop immediately
        this.startFruitLoop();
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

        // Reset game state first
        this.score = 0;
        this.scoreElement.textContent = this.score;
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
        this.randomSpawnInterval = 3333 + Math.random() * 1667; // 3.3-5 seconds
        this.generateFood(); // Generate initial food
        this.isGameStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;

        // If there was a previous music manager, ensure it's fully stopped
        if (this.musicManager) {
            this.musicManager.stopMusic(true);
        }

        // Create a fresh sound manager with a new audio context
        this.soundManager = new SoundManager();
        this.soundManager.init(true);

        // Clear melody display initially
        const melodyElement = document.getElementById('currentMelody');
        if (melodyElement) {
            melodyElement.textContent = '';
        }

        // Wait a short time to ensure the audio context is properly initialized
        setTimeout(() => {
            // Create a fresh music manager with the new audio context
            this.musicManager = new MusicManager();
            this.musicManager.init(this.soundManager.getAudioContext());

            // Select a random melody and start music if enabled
            this.musicManager.selectRandomMelody();
            if (this.musicEnabled) {
                this.musicManager.startMusic();
            }

            // Update the melody display
            this.drawMelodyName();
        }, 100);

        // Start the game loop
        this.restartGameLoop();
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
            this.randomSpawnInterval = 3333 + Math.random() * 1667; // 3.3-5 seconds
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
                this.scoreElement.textContent = this.score;

                // Increase speed by 5% when food is eaten
                this.speed *= 0.95; // 0.95 means 95% of current speed (5% faster)

                // Ensure speed doesn't get too fast
                this.speed = Math.max(this.speed, this.baseSpeed * 0.25); // No faster than 4x base speed

                // Play sound for the eaten fruit if sound is enabled
                if (this.soundEnabled) {
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
        this.drawMelodyName();

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
            this.highScoreElement.textContent = this.highScore;
        }

        // Stop the game loop
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        // Draw game over screen immediately to prevent flashing
        this.drawGameOver();

        // Handle audio in sequence
        if (this.soundEnabled && this.soundManager) {
            // Play crash sound first
            this.soundManager.playSound('crash');

            // Stop background music smoothly after crash sound
            if (this.musicManager) {
                setTimeout(() => {
                    this.musicManager.stopMusic(false); // false = don't do full cleanup
                }, 500); // Wait for crash sound to play
            }

            // Play high score fanfare after a delay if applicable
            if (isNewHighScore) {
                setTimeout(() => {
                    this.soundManager.playHighScoreFanfare();
                }, 1000); // Wait 1 second after crash sound
            }
        } else {
            // If sound is disabled, just stop the music
            if (this.musicManager) {
                this.musicManager.stopMusic(false); // false = don't do full cleanup
            }
        }
    }

    drawGameOver() {
        // Create a semi-transparent gradient overlay with a green-to-red tint
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
        gradient.addColorStop(1, 'rgba(153, 27, 27, 0.85)'); // Darker red that complements green
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set common text properties
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw "Game Over!" text with gradient and glow
        this.ctx.save();

        // Create gradient for game over text - using a red that complements green
        const gameOverGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 120,
            this.canvas.height/2 - 60,
            this.canvas.width/2 + 120,
            this.canvas.height/2 - 20
        );
        gameOverGradient.addColorStop(0, '#e74c3c');
        gameOverGradient.addColorStop(1, '#c0392b');

        // Add glow effect
        this.ctx.shadowColor = 'rgba(231, 76, 60, 0.6)';
        this.ctx.shadowBlur = 15;

        this.ctx.font = `bold ${this.gridSize * 1.8}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = gameOverGradient;
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 4);

        this.ctx.restore();

        // Draw score panel with glass effect - moved down for better spacing
        this.ctx.save();

        // Panel background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 - this.gridSize * 5,
            this.canvas.height / 2 - this.gridSize * 2,
            this.gridSize * 10,
            this.gridSize * 6, // Increased height to add more space
            this.gridSize / 3
        );
        this.ctx.fill();

        // Score border highlight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();

        // Draw score with green gradient matching snake
        this.ctx.save();

        const scoreGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 60,
            this.canvas.height/2,
            this.canvas.width/2 + 60,
            this.canvas.height/2
        );
        scoreGradient.addColorStop(0, '#2ecc71');
        scoreGradient.addColorStop(1, '#27ae60');

        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('SCORE', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 1);

        this.ctx.font = `bold ${this.gridSize * 1.2}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = scoreGradient;
        this.ctx.fillText(`${this.score}`, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.restore();

        // Draw high score with complementary blue gradient
        this.ctx.save();

        const highScoreGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 80,
            this.canvas.height/2 + 60,
            this.canvas.width/2 + 80,
            this.canvas.height/2 + 60
        );
        highScoreGradient.addColorStop(0, '#3498db');
        highScoreGradient.addColorStop(1, '#2980b9');

        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('HIGH SCORE', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 1.8);

        this.ctx.font = `bold ${this.gridSize * 1.2}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = highScoreGradient;
        this.ctx.fillText(`${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 2.8);

        this.ctx.restore();

        // Draw new high score badge if it was beaten - using amber color that complements green
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.save();

            // Draw badge background
            this.ctx.fillStyle = 'rgba(243, 156, 18, 0.2)';
            this.ctx.beginPath();
            this.ctx.roundRect(
                this.canvas.width / 2 - this.gridSize * 4,
                this.canvas.height / 2 + this.gridSize * 5.5,
                this.gridSize * 8,
                this.gridSize * 1,
                this.gridSize / 3
            );
            this.ctx.fill();

            // Add star icon and glow
            this.ctx.shadowColor = 'rgba(243, 156, 18, 0.6)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#f39c12';
            this.ctx.font = `${this.gridSize * 0.65}px 'Poppins', sans-serif`;
            this.ctx.fillText('✨ NEW HIGH SCORE! ✨', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 6);

            this.ctx.restore();
        }

        // Draw "Press SPACE to play again" message with animation
        this.ctx.save();
        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Add subtle pulsing animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.1 + 0.9;
        this.ctx.globalAlpha = pulse;

        // Position based on whether there's a new high score badge
        const y = this.score === this.highScore && this.score > 0
            ? this.canvas.height / 2 + this.gridSize * 7.5 // After high score badge
            : this.canvas.height / 2 + this.gridSize * 6; // Directly after high score

        this.ctx.fillText('Press SPACE to play again', this.canvas.width / 2, y);
        this.ctx.restore();
    }

    createSnakeHead() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Draw head body with gradient - using healthier, more vibrant colors
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, this.gridSize);
        gradient.addColorStop(0, '#2ecc71'); // Vibrant green
        gradient.addColorStop(1, '#27ae60'); // Emerald green

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(1, 1, this.gridSize - 2, this.gridSize - 2, 10);
        ctx.fill();

        // Add a subtle glow/inner shadow effect
        ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw eyes with white eyeballs
        // Left eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(8, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.gridSize - 8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.gridSize - 8, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw white smile
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.gridSize / 2, this.gridSize / 2, 5, 0, Math.PI);
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        return canvas;
    }

    createSnakeBody() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Create gradient for body with healthier green colors
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, this.gridSize);
        gradient.addColorStop(0, '#2ecc71'); // Vibrant green
        gradient.addColorStop(1, '#27ae60'); // Emerald green

        // Draw body segment
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(2, 2, this.gridSize - 4, this.gridSize - 4, 4);
        ctx.fill();

        // Add subtle pattern as a highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(4, 4, this.gridSize - 8, this.gridSize - 8, 2);
        ctx.fill();

        return canvas;
    }

    createSnakeTail() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Create a gradient for the tail that makes it thinner, using healthier greens
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, 0);
        gradient.addColorStop(0, '#2ecc71'); // Vibrant green
        gradient.addColorStop(0.7, '#27ae60'); // Emerald green
        gradient.addColorStop(1, '#27ae60'); // Emerald green

        // Draw tail segment with tapered shape
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Start with full width on the left, taper to 60% on the right
        ctx.moveTo(2, 2);
        ctx.lineTo(this.gridSize - 2, 2);
        ctx.lineTo(this.gridSize - 8, this.gridSize - 2);
        ctx.lineTo(2, this.gridSize - 2);
        ctx.closePath();
        ctx.fill();

        // Add pattern that fades out (subtle highlight)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(4, 4, this.gridSize - 12, this.gridSize - 8, 2);
        ctx.fill();

        return canvas;
    }

    drawSnakeSegment(segment, index, isLast) {
        const x = segment.x * this.gridSize;
        const y = segment.y * this.gridSize;

        // Determine which sprite to use
        let sprite;
        if (index === 0) {
            sprite = this.snakeSprites.head;
        } else if (isLast) {
            sprite = this.snakeSprites.tail;
        } else {
            sprite = this.snakeSprites.body;
        }

        // Calculate rotation based on direction
        let rotation = 0;
        if (index > 0) {
            const prev = this.snake[index - 1];
            const next = this.snake[index + 1] || segment;

            if (prev.x === next.x) {
                // Vertical movement
                rotation = prev.y < segment.y ? Math.PI / 2 : -Math.PI / 2;
            } else {
                // Horizontal movement
                rotation = prev.x < segment.x ? 0 : Math.PI;
            }
        } else {
            // Head rotation
            switch (this.direction) {
                case 'up': rotation = -Math.PI / 2; break;
                case 'down': rotation = Math.PI / 2; break;
                case 'left': rotation = Math.PI; break;
                case 'right': rotation = 0; break;
            }
        }

        // Save context, rotate, draw, and restore
        this.ctx.save();
        this.ctx.translate(x + this.gridSize / 2, y + this.gridSize / 2);
        this.ctx.rotate(rotation);
        this.ctx.drawImage(sprite, -this.gridSize / 2, -this.gridSize / 2, this.gridSize, this.gridSize);
        this.ctx.restore();
    }

    draw() {
        // Clear canvas with a light green gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#dff5e6'); // Light green tint
        gradient.addColorStop(1, '#e7f7f5'); // Light green-blue tint
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid with luminescent effect
        this.drawGrid();

        // Draw food
        this.drawFood();

        // Draw snake
        this.drawSnake();

        // If game is over, show game over message
        if (this.isGameOver) {
            this.drawGameOver();
            return;
        }

        // If paused, show paused message
        if (this.isPaused) {
            this.drawPauseMessage();
        }

        // If game is not started, show start message
        if (!this.isGameStarted) {
            this.drawStartMessage();
            return;
        }

        // Always check and update melody name display
        this.drawMelodyName();
    }

    drawGrid() {
        // Draw a luminescent grid with subtle animation
        const time = Date.now() / 4000; // Slow pulse
        const alpha = 0.15 + Math.sin(time) * 0.05; // Range from 0.1 to 0.2

        this.ctx.strokeStyle = `rgba(46, 204, 113, ${alpha})`; // Green grid lines matching snake
        this.ctx.lineWidth = 1.5;

        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw subtle glow regions
        const regionSize = this.gridSize * 5;
        const numRegions = 3;

        this.ctx.save();
        this.ctx.globalAlpha = 0.05 + Math.sin(time * 1.5) * 0.02;
        this.ctx.fillStyle = '#2ecc71'; // Green glow matching snake

        for (let i = 0; i < numRegions; i++) {
            const x = Math.sin(time + i * Math.PI * 2 / numRegions) * this.canvas.width / 3 + this.canvas.width / 2;
            const y = Math.cos(time + i * Math.PI * 2 / numRegions) * this.canvas.height / 3 + this.canvas.height / 2;

            const gradient = this.ctx.createRadialGradient(
                x, y, 0,
                x, y, regionSize
            );
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)');
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, regionSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawFood() {
        if (this.imagesLoaded) {
            this.food.forEach(food => {
                if (this.fruitImages[food.type]) {
                    // Calculate fade out effect based on remaining lifetime
                    const age = Date.now() - food.spawnTime;
                    const remainingLifetime = food.lifetime - age;
                    const fadeOutDuration = 5000; // 5 seconds fade out

                    this.ctx.save();

                    // Apply fade out effect if close to disappearing
                    if (remainingLifetime < fadeOutDuration) {
                        this.ctx.globalAlpha = remainingLifetime / fadeOutDuration;
                    }

                    this.ctx.drawImage(
                        this.fruitImages[food.type],
                        food.x * this.gridSize,
                        food.y * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );

                    this.ctx.restore();
                }
            });
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            this.drawSnakeSegment(segment, index, index === this.snake.length - 1);
        });
    }

    drawStartMessage() {
        // Create a semi-transparent gradient overlay
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set common text properties
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw title with gradients and glow
        this.ctx.save();

        // Create gradient for title - using snake greens
        const titleGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 150,
            this.canvas.height/2 - 80,
            this.canvas.width/2 + 150,
            this.canvas.height/2 - 40
        );
        titleGradient.addColorStop(0, '#2ecc71');
        titleGradient.addColorStop(1, '#27ae60');

        // Add glow effect
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.shadowBlur = 15;

        this.ctx.font = `bold ${this.gridSize * 1.8}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = titleGradient;
        this.ctx.fillText('SNAKE GAME', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 4);

        this.ctx.restore();

        // Draw arrow keys with animation and colors in the green/blue family
        const arrowSize = this.gridSize * 0.9;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const arrowSpacing = arrowSize * 1.4;
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 3) * 5;

        this.ctx.save();

        // Left arrow - teal blue
        this.ctx.fillStyle = '#3498db';
        this.ctx.shadowColor = 'rgba(52, 152, 219, 0.6)';
        this.ctx.shadowBlur = 8;
        this.ctx.font = `${arrowSize}px Arial`;
        this.ctx.fillText('←', centerX - arrowSpacing * 1.5, centerY + bounce);

        // Up arrow - green
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.fillText('↑', centerX - arrowSpacing/2, centerY + bounce);

        // Down arrow - darker blue
        this.ctx.fillStyle = '#2980b9';
        this.ctx.shadowColor = 'rgba(41, 128, 185, 0.6)';
        this.ctx.fillText('↓', centerX + arrowSpacing/2, centerY + bounce);

        // Right arrow - darker green
        this.ctx.fillStyle = '#27ae60';
        this.ctx.shadowColor = 'rgba(39, 174, 96, 0.6)';
        this.ctx.fillText('→', centerX + arrowSpacing * 1.5, centerY + bounce);

        this.ctx.restore();

        // Draw "to start" text
        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('to start', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 1.5);
    }

    drawPauseMessage() {
        // Create a semi-transparent gradient overlay
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set common text properties
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw pause icon (two vertical bars)
        this.ctx.save();

        // Draw rounded rectangle background
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 - this.gridSize * 2,
            this.canvas.height / 2 - this.gridSize * 3,
            this.gridSize * 4,
            this.gridSize * 2,
            this.gridSize / 2
        );
        this.ctx.fill();

        // Draw left pause bar
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 - this.gridSize * 0.8,
            this.canvas.height / 2 - this.gridSize * 2.5,
            this.gridSize * 0.6,
            this.gridSize * 1,
            this.gridSize / 8
        );
        this.ctx.fill();

        // Draw right pause bar
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 + this.gridSize * 0.2,
            this.canvas.height / 2 - this.gridSize * 2.5,
            this.gridSize * 0.6,
            this.gridSize * 1,
            this.gridSize / 8
        );
        this.ctx.fill();

        this.ctx.restore();

        // Draw "Paused" text with gradient - moved down to avoid overlap with pause icon
        this.ctx.save();

        // Create gradient for text using snake colors
        const textGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 80,
            this.canvas.height/2,
            this.canvas.width/2 + 80,
            this.canvas.height/2
        );
        textGradient.addColorStop(0, '#2ecc71');
        textGradient.addColorStop(1, '#27ae60');

        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.font = `bold ${this.gridSize * 1.4}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = textGradient;
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 0.5); // Moved down by 1 grid unit

        this.ctx.restore();

        // Draw "Press SPACE to continue" text
        this.ctx.save();
        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        // Add subtle pulsing animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.1 + 0.9;
        this.ctx.globalAlpha = pulse;

        this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 2.5); // Also moved down to maintain spacing

        this.ctx.restore();
    }

    drawMelodyName() {
        const melodyElement = document.getElementById('currentMelody');
        const musicInfoElement = document.querySelector('.music-info');

        if (!melodyElement || !musicInfoElement) return;

        if (!this.musicEnabled || !this.musicManager || !this.musicManager.getCurrentMelody()) {
            // Clear the melody display when no melody is playing or music is disabled
            melodyElement.textContent = '';

            // If music is enabled but no melody is playing yet, show "Loading..."
            if (this.musicEnabled && this.isGameStarted && !this.isPaused) {
                melodyElement.textContent = 'Loading...';
                musicInfoElement.classList.add('has-melody');
            } else {
                musicInfoElement.classList.remove('has-melody');
            }
            return;
        }

        const melodyInfo = this.musicManager.getCurrentMelody();
        if (!melodyInfo) {
            // This is a redundant check but ensures we always handle the case
            melodyElement.textContent = '';
            musicInfoElement.classList.remove('has-melody');
            return;
        }

        const displayName = melodyInfo.name;

        // Update the melody display
        melodyElement.textContent = displayName;

        // Show the melody name
        musicInfoElement.classList.add('has-melody');
    }

    resetHighScore() {
        // Show confirmation dialog to confirm reset
        if (confirm('Are you sure you want to reset your high score?')) {
            // Reset high score to 0
            this.highScore = 0;
            localStorage.setItem('snakeHighScore', 0);
            this.highScoreElement.textContent = 0;

            // Play sound if sound is enabled
            if (this.soundEnabled && this.soundManager) {
                this.soundManager.playSound('crash');
            }

        }
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new SnakeGame();
});

