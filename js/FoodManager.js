/**
 * Manages the food system including spawning, lifecycle, and collision detection.
 * - Implements a time-based food spawning system with randomized intervals
 * - Ensures food spawns in valid positions not occupied by the snake
 * - Maintains a collection of active food items with their properties
 * - Implements food expiration with configurable lifetimes for each item
 * - Handles collision detection between snake head and food items
 * - Supports dynamic food spawning in the snake's direction as a power-up feature
 * - Provides food removal functionality when eaten or expired
 */
class FoodManager {
    constructor(tileCount) {
        this.tileCount = tileCount;
        this.food = [];
        this.lastRandomSpawnTime = Date.now();
        this.randomSpawnInterval = 1667 + Math.random() * 833; // 1.7-2.5 seconds
    }

    resetFood() {
        this.food = [];
        this.lastRandomSpawnTime = Date.now();
        this.randomSpawnInterval = 1667 + Math.random() * 833;
    }

    getAllFood() {
        return this.food;
    }

    generateFood(snake, getRandomFruit) {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: getRandomFruit(),
                spawnTime: Date.now(),
                lifetime: Math.random() * 15000 // Random lifetime between 0-15 seconds
            };
        } while (snake.isOccupyingPosition(newFood.x, newFood.y) ||
            this.food.some(f => f.x === newFood.x && f.y === newFood.y));

        this.food.push(newFood);
    }

    spawnRandomFood(snake, getRandomFruit) {
        const currentTime = Date.now();
        if (currentTime - this.lastRandomSpawnTime >= this.randomSpawnInterval) {
            this.generateFood(snake, getRandomFruit);
            this.lastRandomSpawnTime = currentTime;
            this.randomSpawnInterval = 1667 + Math.random() * 833;
        }
    }

    manageFruits(snake, getRandomFruit, isGameStarted, isPaused, isGameOver, soundManager) {
        // Remove expired fruits
        const currentTime = Date.now();
        this.food = this.food.filter(food => {
            const age = currentTime - food.spawnTime;
            if (age >= food.lifetime) {
                if (isGameStarted && !isPaused && !isGameOver) {
                    soundManager.playSound('disappear');
                }
                return false;
            }
            return true;
        });

        // Spawn new food
        this.spawnRandomFood(snake, getRandomFruit);
    }

    checkFoodCollision(snake) {
        return this.food.findIndex(f =>
            f.x === snake.head().x && f.y === snake.head().y
        );
    }

    removeFood(index) {
        if (index !== -1) {
            const eatenFood = this.food[index];
            this.food.splice(index, 1);
            return eatenFood;
        }
        return null;
    }

    spawnFruitInSnakeDirection(snake, direction, getRandomFruit, soundManager) {
        if (!snake) return;

        const head = snake.head();
        let newFruitPos = { x: head.x, y: head.y };

        const offsets = {
            'up': { x: 0, y: -2 },
            'down': { x: 0, y: 2 },
            'left': { x: -2, y: 0 },
            'right': { x: 2, y: 0 }
        };

        // Apply offset based on direction
        const offset = offsets[direction];
        newFruitPos.x += offset.x;
        newFruitPos.y += offset.y;

        // Clamp positions to game bounds
        newFruitPos.x = Math.max(0, Math.min(this.tileCount - 1, newFruitPos.x));
        newFruitPos.y = Math.max(0, Math.min(this.tileCount - 1, newFruitPos.y));

        // Check if position is occupied
        const positionOccupied =
            snake.isOccupyingPosition(newFruitPos.x, newFruitPos.y) ||
            this.food.some(f => f.x === newFruitPos.x && f.y === newFruitPos.y);

        if (!positionOccupied) {
            const specialFruit = {
                x: newFruitPos.x,
                y: newFruitPos.y,
                type: getRandomFruit(),
                spawnTime: Date.now(),
                lifetime: 10000 + Math.random() * 5000 // 10-15 seconds lifetime
            };

            this.food.push(specialFruit);
            soundManager.playSound('click');
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FoodManager };
}
