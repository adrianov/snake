/**
 * Controls game timing and update cycles with adaptive speed management.
 * - Implements frame-based animation using requestAnimationFrame for smooth rendering
 * - Manages update intervals to control game speed independent of frame rate
 * - Dynamically adjusts game speed based on player actions and game events
 * - Implements direction-based speed modifiers for more engaging gameplay
 * - Provides separate fruit management timing loop for consistent food mechanics
 * - Enforces minimum and maximum speed boundaries to maintain playability
 * - Supports specialized speed adjustments for different input methods (keyboard vs. touch)
 */
class GameLoop {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.lastFrameTime = 0;
        this.animationFrame = null;
        this.boundGameLoop = this.gameLoop.bind(this);
        this.fruitLoop = null;
        this.baseSpeed = window.GAME_CONSTANTS.SNAKE.BASE_SPEED;
        this.speed = this.baseSpeed;
        this.speedMultiplier = window.GAME_CONSTANTS.SNAKE.SPEED_MULTIPLIER;
        this.slowMultiplier = window.GAME_CONSTANTS.SNAKE.SLOW_MULTIPLIER;
        this.frameInterval = this.baseSpeed;
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.boundGameLoop = this.gameLoop.bind(this);
        this.animationFrame = requestAnimationFrame(this.boundGameLoop);
        this.frameInterval = this.speed;
    }

    gameLoop(timestamp) {
        const elapsed = timestamp - this.lastFrameTime;

        if (elapsed >= this.frameInterval) {
            this.updateCallback();
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
        }

        this.animationFrame = requestAnimationFrame(this.boundGameLoop);
    }

    stopGameLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    startFruitLoop(manageFruitsCallback) {
        if (this.fruitLoop) {
            clearInterval(this.fruitLoop);
            this.fruitLoop = null;
        }

        this.fruitLoop = setInterval(() => {
            manageFruitsCallback();
        }, window.GAME_CONSTANTS.FRUIT_REFRESH_INTERVAL);
    }

    stopFruitLoop() {
        if (this.fruitLoop) {
            clearInterval(this.fruitLoop);
            this.fruitLoop = null;
        }
    }

    // Internal helper function for common speed update logic
    _updateSpeedBasedOnDirection(inputDirection, currentDirection, speedMult, slowMult) {
        const isCurrentDirection = inputDirection === currentDirection;
        const isOppositeDirection = inputDirection === {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        }[currentDirection];

        if (isCurrentDirection) {
            this.speed *= speedMult;
        } else if (isOppositeDirection) {
            this.speed *= slowMult;
        }

        // Ensure speed stays within reasonable bounds
        this.speed = Math.max(this.speed, this.baseSpeed * window.GAME_CONSTANTS.SNAKE.MIN_SPEED_FACTOR);
        this.speed = Math.min(this.speed, this.baseSpeed * window.GAME_CONSTANTS.SNAKE.MAX_SPEED_FACTOR);
        this.frameInterval = this.speed;
    }

    updateGameSpeed(keyDirection, currentDirection) {
        this._updateSpeedBasedOnDirection(
            keyDirection,
            currentDirection,
            window.GAME_CONSTANTS.SNAKE.SPEED_MULTIPLIER,
            window.GAME_CONSTANTS.SNAKE.SLOW_MULTIPLIER
        );
    }

    // More gradual speed adjustment for touch controls
    updateTouchGameSpeed(touchDirection, currentDirection) {
        this._updateSpeedBasedOnDirection(
            touchDirection,
            currentDirection,
            window.GAME_CONSTANTS.SNAKE.TOUCH_SPEED_MULTIPLIER,
            window.GAME_CONSTANTS.SNAKE.TOUCH_SLOW_MULTIPLIER
        );
    }

    resetSpeed() {
        this.speed = this.baseSpeed;
        this.frameInterval = this.baseSpeed;
    }

    adjustSpeedAfterFoodEaten() {
        this.speed *= window.GAME_CONSTANTS.SNAKE.SPEED_INCREASE_AFTER_FOOD;
        this.speed = Math.max(this.speed, this.baseSpeed * window.GAME_CONSTANTS.SNAKE.MIN_SPEED_FACTOR);
        this.frameInterval = this.speed;
    }

    adjustSpeedAfterLuckEffect() {
        this.speed *= window.GAME_CONSTANTS.SNAKE.SPEED_INCREASE_LUCK;
        // Use Math.max since higher value = slower (we need to allow it to increase for slowdown)
        this.speed = Math.max(this.speed, this.baseSpeed * 0.7); // Ensure at least 30% slowdown
        this.frameInterval = this.speed;
    }

    getSpeed() {
        return this.speed;
    }

    reduceSpeed() {
        // Reduce the speed when tapped on mobile (same as opposite direction)
        this.speed *= this.slowMultiplier;
        this.speed = Math.min(this.speed, this.baseSpeed * window.GAME_CONSTANTS.SNAKE.MAX_SPEED_FACTOR);
        this.frameInterval = this.speed;
    }

    speedUp(factor = 0.85) {
        // Multiply by a factor smaller than 1 to speed up (reduce the interval)
        this.speed *= factor;
        // Ensure speed doesn't get too fast
        this.speed = Math.max(this.speed, this.baseSpeed * window.GAME_CONSTANTS.SNAKE.MIN_SPEED_FACTOR);
        this.frameInterval = this.speed;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop };
}

// Make GameLoop globally accessible
window.GameLoop = GameLoop;
