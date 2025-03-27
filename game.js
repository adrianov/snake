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
        this.food = { x: 0, y: 0, type: 'apple' };
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameLoop = null;
        this.baseSpeed = 100; // Base speed in milliseconds
        this.speed = this.baseSpeed;
        this.speedMultiplier = 0.8; // Speed up by 20% when pressing same direction
        this.slowMultiplier = 1.2; // Slow down by 20% when pressing opposite direction
        this.imagesLoaded = false;
        this.isGameStarted = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null; // Store the state of the game before pausing

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
    }

    resizeCanvas() {
        // Make canvas fill available space while maintaining square aspect ratio
        const container = this.canvas.parentElement;

        // Take into account the score container height to calculate available space
        // Subtract additional 10px to account for potential margin/padding
        const scoreContainerHeight = container.querySelector('.score-container')?.offsetHeight || 0;
        const availableHeight = container.clientHeight - scoreContainerHeight - 10;

        // Use the smaller dimension to maintain square aspect
        const size = Math.min(container.clientWidth, availableHeight);

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
    }

    handleKeyPress(e) {
        // If game is over and arrow key is pressed, restart the game
        if (this.isGameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();

            // No need to try resuming the audio context here since we create a fresh one in startGame
            // The old code trying to resume the audio context won't work because it was fully closed in gameOver

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

        // If game hasn't started and an arrow key is pressed, start the game
        if (!this.isGameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
        } else if (!validDirectionChange) {
            // If we couldn't change direction and it's not the same or opposite,
            // reset to base speed (happens when trying to go backwards)
            this.speed = this.baseSpeed;
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
            food: {...this.food},
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
        // Restart music from where it was
        if (this.musicManager) {
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
        this.generateFood();
        this.isGameStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastGameState = null;

        // If there was a previous music manager, ensure it's fully stopped
        if (this.musicManager) {
            this.musicManager.stopMusic(true);
        }

        // Make sure we have a clean sound manager with a fresh audio context
        this.soundManager = new SoundManager();
        this.soundManager.init(true);

        // Create a fresh music manager with the new audio context
        this.musicManager = new MusicManager();
        this.musicManager.init(this.soundManager.getAudioContext());

        // Start music with a short delay to ensure initialization is complete
        setTimeout(() => {
            // Select a random melody and start music
            this.musicManager.selectRandomMelody();
            this.musicManager.startMusic();
        }, 50);

        // Start the game loop
        this.restartGameLoop();
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: this.getRandomFruit()
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

        this.food = newFood;
    }

    update() {
        // Don't update if game is paused
        if (this.isPaused) {
            return;
        }

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

        // Check if food is eaten
        const foodEaten = head.x === this.food.x && head.y === this.food.y;
        if (foodEaten) {
            const fruitConfig = window.FRUIT_CONFIG[this.food.type];
            this.score += fruitConfig.score;
            this.scoreElement.textContent = this.score;

            // Play sound for the eaten fruit
            this.soundManager.playSound(this.food.type);

            // Generate new food
            this.generateFood();
        } else {
            // Remove tail if no food was eaten
            this.snake.pop();
        }

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
        // First stop the game loop
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        // Set game over state immediately
        this.isGameOver = true;
        this.isGameStarted = false;

        // Play crash sound first before stopping music
        if (this.soundManager) {
            this.soundManager.playSound('crash');
        }

        // Delay the stopping of music to ensure crash sound is played
        setTimeout(() => {
            // Stop music after crash sound has started
            if (this.musicManager) {
                // Force complete stop of all audio, passing true for full cleanup
                this.musicManager.stopMusic(true);
            }

            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                this.highScoreElement.textContent = this.highScore;
            }

            // Draw game over screen
            this.drawGameOver();
        }, 300); // Longer delay to ensure crash sound completes
    }

    drawGameOver() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set text style
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw "Game Over" text (biggest)
        this.ctx.font = `${this.gridSize * 1.2}px Arial`;
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 2);

        // Draw score
        this.ctx.font = `${this.gridSize * 0.8}px Arial`;
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 0.5);

        // Draw high score
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 0.5);

        // Draw new high score badge if it was beaten
        if (this.score === this.highScore) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = `${this.gridSize * 0.6}px Arial`;
            this.ctx.fillText('✨ New High Score! ✨', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 1.2);
            this.ctx.fillStyle = '#fff';
        }

        // Draw "Press any arrow to play again" message
        this.ctx.font = `${this.gridSize * 0.6}px Arial`;
        this.ctx.fillText('Press any arrow to play again', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 2);
    }

    createSnakeHead() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Draw head body (slightly bigger than other segments)
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(1, 1, this.gridSize - 2, this.gridSize - 2, 10);
        ctx.fill();

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

        return canvas;
    }

    createSnakeBody() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Draw body segment
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(2, 2, this.gridSize - 4, this.gridSize - 4, 4);
        ctx.fill();

        // Add subtle pattern
        ctx.fillStyle = '#27ae60';
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

        // Create a gradient for the tail that makes it thinner
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, 0);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(0.7, '#27ae60');
        gradient.addColorStop(1, '#27ae60');

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

        // Add pattern that fades out
        ctx.fillStyle = '#27ae60';
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
        // Clear canvas
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid
        this.drawGrid();

        // Draw food
        this.drawFood();

        // Draw snake
        this.drawSnake();

        // If paused, show paused message
        if (this.isPaused) {
            this.drawPauseMessage();
        }

        // If game is not started, show start message
        if (!this.isGameStarted) {
            this.drawStartMessage();
            return;
        }

        // If game is over, show game over message
        if (this.isGameOver) {
            this.drawGameOver();
            return;
        }

        // Draw current melody name when game is running
        if (this.isGameStarted && !this.isGameOver && !this.isPaused) {
            this.drawMelodyName();
        }
    }

    drawGrid() {
        // Draw a subtle grid on the background
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
        this.ctx.lineWidth = 1;

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
    }

    drawFood() {
        if (this.imagesLoaded && this.fruitImages[this.food.type]) {
            this.ctx.drawImage(
                this.fruitImages[this.food.type],
                this.food.x * this.gridSize,
                this.food.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
        }

    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            this.drawSnakeSegment(segment, index, index === this.snake.length - 1);
        });
    }

    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw "Press" text (biggest)
        this.ctx.font = `${this.gridSize * 1.2}px Arial`;
        this.ctx.fillText('Press', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 1.5);

        // Draw arrow emojis
        const arrowSize = this.gridSize * 0.8; // Match score text size
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const arrowSpacing = arrowSize * 1.2;

        // Set font for emojis
        this.ctx.font = `${arrowSize}px Arial`;

        // Draw arrows in a row
        this.ctx.fillText('←', centerX - arrowSpacing * 1.5, centerY);
        this.ctx.fillText('↑', centerX - arrowSpacing/2, centerY);
        this.ctx.fillText('↓', centerX + arrowSpacing/2, centerY);
        this.ctx.fillText('→', centerX + arrowSpacing * 1.5, centerY);

        // Draw "to start" text (slightly smaller)
        this.ctx.font = `${this.gridSize * 0.6}px Arial`;
        this.ctx.fillText('to start', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 1.5);
    }

    drawPauseMessage() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set text style
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw "Paused" text (biggest)
        this.ctx.font = `${this.gridSize * 1.2}px Arial`;
        this.ctx.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize);

        // Draw "Press SPACE to continue" text (smaller)
        this.ctx.font = `${this.gridSize * 0.6}px Arial`;
        this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize);
    }

    drawMelodyName() {
        if (!this.musicManager || !this.musicManager.getCurrentMelody()) return;

        const melodyInfo = this.musicManager.getCurrentMelody();
        const displayName = melodyInfo.name;

        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.font = `${this.gridSize * 0.5}px Arial`;
        this.ctx.textAlign = "right";
        this.ctx.textBaseline = "top";
        this.ctx.fillText(`♫ ${displayName}`, this.canvas.width - 10, 10);
        this.ctx.textAlign = "left"; // Reset text alignment
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new SnakeGame();
});
