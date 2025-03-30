// Game Constants - Centralized configuration

// Speed constants
const GAME_CONSTANTS = {
    // Snake movement settings
    SNAKE: {
        BASE_SPEED: 200,                 // Base movement interval (higher = slower) - was 100, now 2x slower
        SPEED_INCREASE_AFTER_FOOD: 0.98, // Factor after eating food (was 0.97, now 2% increase)
        SPEED_INCREASE_LUCK: 1.3,        // Speed factor after luck effect (1.3 = 30% slower)
        MIN_SPEED_FACTOR: 0.25,          // Minimum speed as factor of base speed
        MAX_SPEED_FACTOR: 3,             // Maximum speed as factor of base speed
        
        // Direction change speed modifiers
        SPEED_MULTIPLIER: 0.8,           // Speed multiplier when continuing same direction
        SLOW_MULTIPLIER: 1.2,            // Speed multiplier when moving in opposite direction
        
        // Touch controls - more gradual
        TOUCH_SPEED_MULTIPLIER: 0.9,     // Touch movement speed multiplier
        TOUCH_SLOW_MULTIPLIER: 1.15      // Touch opposite direction multiplier
    },
    
    // Fruit loop refresh interval
    FRUIT_REFRESH_INTERVAL: 100          // Interval for fruit management loop
};

// Make constants available globally
if (typeof window !== 'undefined') {
    window.GAME_CONSTANTS = GAME_CONSTANTS;
} 