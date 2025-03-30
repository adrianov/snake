class Snake {
    constructor(startX, startY) {
        // Initialize snake with 3 segments
        this.segments = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.growing = false;
    }

    getSegments() {
        return this.segments;
    }

    head() {
        return this.segments[0];
    }

    move(x, y) {
        this.segments.unshift({ x, y });

        if (!this.growing) {
            this.segments.pop();
        } else {
            this.growing = false;
        }
    }

    grow() {
        this.growing = true;
    }

    isOccupyingPosition(x, y, skipHead = false) {
        const startIndex = skipHead ? 1 : 0;
        return this.segments.slice(startIndex).some(segment =>
            segment.x === x && segment.y === y
        );
    }

    findSafeDirection(currentDirection, isPositionSafeCallback) {
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // Get all directions except the opposite of current
        const possibleDirections = ['up', 'down', 'left', 'right'].filter(d =>
            d !== oppositeDirections[currentDirection]
        );

        // Check each direction
        for (const direction of possibleDirections) {
            const newHead = { x: this.head().x, y: this.head().y };

            const directionOffsets = {
                'up': { x: 0, y: -1 },
                'down': { x: 0, y: 1 },
                'left': { x: -1, y: 0 },
                'right': { x: 1, y: 0 }
            };

            const offset = directionOffsets[direction];
            newHead.x += offset.x;
            newHead.y += offset.y;

            if (isPositionSafeCallback(newHead.x, newHead.y)) {
                return direction;
            }
        }

        return null;
    }

    cutTailAt(index) {
        // Ensure the index is valid
        if (index > 0 && index < this.segments.length) {
            // Keep only segments from 0 to index (inclusive)
            this.segments = this.segments.slice(0, index);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Snake };
}
