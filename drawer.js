class GameDrawer {
    constructor(canvas, gridSize, fruitImages) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.fruitImages = fruitImages;
        this.glowDuration = 3000; // Duration of glow effect in milliseconds (3 seconds)

        // Initialize specialized drawers
        this.snakeDrawer = new SnakeDrawer(gridSize);
        this.sceneDrawer = new SceneDrawer(canvas, gridSize);
    }

    // Reset darkness level when starting a new game
    resetDarknessLevel() {
        // Reset in both specialized drawers
        this.snakeDrawer.resetLevels();
        this.sceneDrawer.resetDarknessLevel();
    }

    // Increment darkness level when snake eats food
    incrementDarknessLevel() {
        // Increment in both specialized drawers
        this.snakeDrawer.incrementLevels();
        this.sceneDrawer.incrementDarknessLevel();
    }

    // Get a new random color for the snake - added to support restarting the game
    generateNewSnakeColor() {
        this.snakeDrawer.generateRandomColor();
    }

    // Update gridSize for responsive design
    updateGridSize(gridSize) {
        this.gridSize = gridSize;
        this.snakeDrawer.updateGridSize(gridSize);
        this.sceneDrawer.updateGridSize(gridSize);
    }

    // Main draw function that delegates to specialized drawers
    draw(gameState) {
        // Clear canvas with background
        this.sceneDrawer.drawBackground();

        // Draw background grid
        this.sceneDrawer.drawGrid();

        // Draw food
        this.sceneDrawer.drawFood(gameState.food, this.fruitImages);

        // Draw snake
        this.snakeDrawer.drawSnake(
            this.ctx,
            gameState.snake,
            gameState.direction,
            gameState.lastEatenTime,
            this.glowDuration
        );

        // Draw game state overlays
        if (gameState.isGameOver) {
            this.sceneDrawer.drawGameOver(gameState.score, gameState.highScore);
            return;
        }

        if (gameState.isPaused) {
            this.sceneDrawer.drawPauseMessage();
        }

        if (!gameState.isGameStarted) {
            this.sceneDrawer.drawStartMessage();
            return;
        }
    }
}

// Export the class
window.GameDrawer = GameDrawer;
