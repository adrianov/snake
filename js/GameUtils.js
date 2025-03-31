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
        return ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);
    }

    // Show header and footer on mobile
    static showHeaderFooterOnMobile(gameLayout) {
        if (gameLayout) {
            gameLayout.classList.remove('mobile-game-active');
        }
    }

    // Hide header and footer on mobile
    static hideHeaderFooterOnMobile(gameLayout) {
        if (gameLayout) {
            gameLayout.classList.add('mobile-game-active');
        }
    }
}
