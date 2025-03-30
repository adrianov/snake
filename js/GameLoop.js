class GameLoop {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.lastFrameTime = 0;
        this.animationFrame = null;
        this.boundGameLoop = this.gameLoop.bind(this);
        this.fruitLoop = null;
        this.baseSpeed = 100;
        this.speed = this.baseSpeed;
        this.speedMultiplier = 0.8;
        this.slowMultiplier = 1.2;
        this.frameInterval = this.baseSpeed;
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.boundGameLoop = this.gameLoop.bind(this);
        this.animationFrame = requestAnimationFrame(this.boundGameLoop);
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
        }, 100);
    }

    stopFruitLoop() {
        if (this.fruitLoop) {
            clearInterval(this.fruitLoop);
            this.fruitLoop = null;
        }
    }

    updateGameSpeed(keyDirection, currentDirection) {
        const isCurrentDirection = keyDirection === currentDirection;
        const isOppositeDirection = keyDirection === {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        }[currentDirection];

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

    // More gradual speed adjustment for touch controls
    updateTouchGameSpeed(touchDirection, currentDirection) {
        const isCurrentDirection = touchDirection === currentDirection;
        const isOppositeDirection = touchDirection === {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        }[currentDirection];
        
        // Touch speed multiplier - more gradual change than keyboard
        const touchSpeedMultiplier = 0.9; // Less aggressive than 0.8 for keyboard
        const touchSlowMultiplier = 1.15; // Less aggressive than 1.2 for keyboard
        
        if (isCurrentDirection) {
            this.speed *= touchSpeedMultiplier;
        } else if (isOppositeDirection) {
            this.speed *= touchSlowMultiplier;
        }
        
        // Ensure speed stays within reasonable bounds
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25);
        this.speed = Math.min(this.speed, this.baseSpeed * 3);
        this.frameInterval = this.speed;
    }

    resetSpeed() {
        this.speed = this.baseSpeed;
        this.frameInterval = this.baseSpeed;
    }

    adjustSpeedAfterFoodEaten() {
        this.speed *= 0.95;
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25);
        this.frameInterval = this.speed;
    }

    adjustSpeedAfterLuckEffect() {
        this.speed *= 1.3;
        this.speed = Math.min(this.speed, this.baseSpeed * 3);
        this.frameInterval = this.speed;
    }

    getSpeed() {
        return this.speed;
    }

    reduceSpeed() {
        // Reduce the speed when tapped on mobile (same as opposite direction)
        this.speed *= this.slowMultiplier;
        this.speed = Math.min(this.speed, this.baseSpeed * 3);
        this.frameInterval = this.speed;
    }

    speedUp(factor = 0.85) {
        // Multiply by a factor smaller than 1 to speed up (reduce the interval)
        this.speed *= factor;
        // Ensure speed doesn't get too fast
        this.speed = Math.max(this.speed, this.baseSpeed * 0.25);
        this.frameInterval = this.speed;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop };
}
