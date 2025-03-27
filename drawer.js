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
        this.snakeDrawer.resetLevels();
    }

    // Increment darkness level when snake eats food
    incrementDarknessLevel() {
        this.snakeDrawer.incrementLevels();
    }

    // Update snake colors and regenerate sprites
    updateSnakeColors(colors) {
        this.snakeDrawer.updateColors(colors);
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
