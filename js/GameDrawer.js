/**
 * Handles core game element rendering with optimized asset usage.
 * - Implements an adapter between game state and visual representation
 * - Manages sprite-based rendering for game entities with proper scaling
 * - Coordinates responsive rendering across different device pixel ratios
 * - Optimizes rendering by using pre-loaded assets and caching where appropriate
 * - Implements proper layering of game elements (background, grid, snake, food, UI)
 * - Provides visual feedback for game events through rendering variations
 * - Delegates specialized rendering to component-specific drawers
 */
class GameDrawer {
    constructor(canvas, gridSize, fruitImages) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.fruitImages = fruitImages;
        this.glowDuration = 3000; // Duration of glow effect in milliseconds (3 seconds)
        this.pixelRatio = window.devicePixelRatio || 1; // Get device pixel ratio for Retina displays

        // Initialize specialized drawers
        this.snakeDrawer = new SnakeDrawer(gridSize, this.pixelRatio);
        this.sceneDrawer = new SceneDrawer(canvas, gridSize, this.pixelRatio);
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
        this.pixelRatio = window.devicePixelRatio || 1; // Update pixel ratio on resize
        this.snakeDrawer.updateGridSize(gridSize, this.pixelRatio);
        this.sceneDrawer.updateGridSize(gridSize, this.pixelRatio);
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
            this.glowDuration,
            gameState.isGameOver,
            gameState.shakeEnabled
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
