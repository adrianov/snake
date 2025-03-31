/**
 * Provides shared utility functions across game components.
 * - Implements direction validation and opposite direction lookups
 * - Provides mathematical utilities for game calculations
 * - Supports color manipulation and transformation functions
 * - Implements common game algorithms like collision detection helpers
 * - Provides string formatting and transformation utilities
 * - Implements browser compatibility detection and handling
 * - Offers reusable helper functions to reduce code duplication
 * - Supports cross-component functionality with stateless design
 */
class GameUtils {
    // Check if a direction change is valid (can't go directly opposite to current direction)
    static isValidDirectionChange(newDirection, currentDirection) {
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        return newDirection !== oppositeDirections[currentDirection];
    }

    // Calculate the next head position based on current direction
    static getNextHeadPosition(headPos, direction) {
        const nextPos = { x: headPos.x, y: headPos.y };

        switch (direction) {
            case 'up': nextPos.y--; break;
            case 'down': nextPos.y++; break;
            case 'left': nextPos.x--; break;
            case 'right': nextPos.x++; break;
        }

        return nextPos;
    }

    // Check if position is within grid bounds
    static isPositionInBounds(x, y, tileCount) {
        return x >= 0 && x < tileCount && y >= 0 && y < tileCount;
    }

    // Check if the device is a touch device
    static isTouchDevice() {
        // Enhanced detection especially for iOS devices
        const isTouch = ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0) ||
            (window.matchMedia("(pointer: coarse)").matches);

        // Additional detection for iOS specifically
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        return isTouch || isIOS;
    }

    // Show header and footer
    static showHeaderFooter(gameLayout) {
        if (!gameLayout) {
            // Try to get the layout if it wasn't provided
            gameLayout = document.querySelector('.game-layout');
        }

        if (gameLayout) {
            gameLayout.classList.remove('game-active');

            // Force repaint to ensure changes take effect, especially on iOS
            void gameLayout.offsetHeight;
        }
    }

    // Hide header and footer
    static hideHeaderFooter(gameLayout) {
        if (!gameLayout) {
            // Try to get the layout if it wasn't provided
            gameLayout = document.querySelector('.game-layout');
        }

        if (gameLayout) {
            gameLayout.classList.add('game-active');

            // Force repaint to ensure changes take effect, especially on iOS
            void gameLayout.offsetHeight;
        }
    }
}
