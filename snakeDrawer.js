class SnakeDrawer {
    constructor(gridSize) {
        this.gridSize = gridSize;

        // Set default snake colors (will be overridden by random selection)
        this.snakeColor = {
            primary: '#2ecc71',   // Vibrant green
            secondary: '#27ae60'  // Emerald green
        };

        // Track visual effects
        this.darknessLevel = 0;   // 0-100: How dark the snake is, 100 = completely black
        this.glowYellowLevel = 0; // 0-100: How yellow the glow is, 100 = bright yellow

        // Define target colors for progression effects
        this.targetColors = {
            snakeBlack: { r: 0, g: 0, b: 0 },        // Target for snake darkness: pure black
            glowYellow: { r: 255, g: 255, b: 0 }     // Target for glow: bright yellow
        };

        // Generate a random color for the snake on creation
        this.generateRandomColor();

        // Initialize sprites
        this.snakeSprites = {
            head: this.createSnakeHead(),
            body: this.createSnakeBody(),
            tail: this.createSnakeTail()
        };
    }

    // Generate a random color for the snake
    generateRandomColor() {
        // Array of bright, visually appealing color pairs (primary, secondary)
        const colorPairs = [
            // Greens
            { primary: '#2ecc71', secondary: '#27ae60' }, // Default emerald
            // Blues
            { primary: '#3498db', secondary: '#2980b9' }, // Bright blue
            // Purples
            { primary: '#9b59b6', secondary: '#8e44ad' }, // Amethyst
            // Reds
            { primary: '#e74c3c', secondary: '#c0392b' }, // Alizarin
            // Oranges
            { primary: '#e67e22', secondary: '#d35400' }, // Carrot
            // Yellows
            { primary: '#f1c40f', secondary: '#f39c12' }, // Sunflower
            // Teals
            { primary: '#1abc9c', secondary: '#16a085' }, // Turquoise
            // Pinks
            { primary: '#e84393', secondary: '#d81b60' }, // Pink
            // Gradients with better contrast
            { primary: '#6a11cb', secondary: '#2575fc' }, // Purple to blue
            { primary: '#ff0844', secondary: '#ffb199' }, // Red to pink
            { primary: '#09c6f9', secondary: '#045de9' }, // Light blue to blue
            { primary: '#13547a', secondary: '#80d0c7' }, // Dark blue to teal
            { primary: '#ff9a9e', secondary: '#fad0c4' }, // Light pink
            { primary: '#ffecd2', secondary: '#fcb69f' }, // Light orange
        ];

        // Pick a random color pair
        const randomPair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
        this.snakeColor = randomPair;

        // Reset darkness level when creating a new color
        this.resetLevels();
    }

    // Reset darkness and glow levels to initial values
    resetLevels() {
        this.darknessLevel = 0;
        this.glowYellowLevel = 0;
        this.updateSprites();
    }

    // Increment darkness level when snake eats food
    incrementLevels() {
        // Increase darkness by 1%
        this.darknessLevel += 1;
        // No cap, let it go to 100

        // Also increase glow yellowness level by 1%
        this.glowYellowLevel += 1;
        // Cap at 100
        this.glowYellowLevel = Math.min(this.glowYellowLevel, 100);

        // Regenerate sprites with new darkness level
        this.updateSprites();
    }

    // Update snake colors and regenerate sprites
    updateColors(colors) {
        this.snakeColor = colors;
        this.updateSprites();
    }

    // Update the sprites
    updateSprites() {
        // Regenerate snake sprites with current colors and darkness levels
        this.snakeSprites = {
            head: this.createSnakeHead(),
            body: this.createSnakeBody(),
            tail: this.createSnakeTail()
        };
    }

    // Update gridSize (for responsive design)
    updateGridSize(gridSize) {
        this.gridSize = gridSize;
        this.updateSprites();
    }

    // Draw snake on the canvas
    drawSnake(ctx, snake, direction, lastEatenTime, glowDuration) {
        // Calculate glow effect with pulsing
        const timeSinceEaten = Date.now() - lastEatenTime;
        const glowIntensity = Math.max(0, 1 - (timeSinceEaten / glowDuration));

        // Create pulsing effect with 3 cycles
        const pulse = Math.sin((timeSinceEaten / 1000) * Math.PI * 3) * 0.5 + 0.5;
        const finalGlowIntensity = glowIntensity * pulse;

        // Get current glow color - interpolate between snake primary color and yellow
        const glowColor = this.getYellowishGlowColor();

        snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            // Determine which sprite to use
            let sprite;
            if (index === 0) {
                sprite = this.snakeSprites.head;
            } else if (index === snake.length - 1) {
                sprite = this.snakeSprites.tail;
            } else {
                sprite = this.snakeSprites.body;
            }

            // Calculate rotation based on direction
            let rotation = 0;
            if (index > 0) {
                const prev = snake[index - 1];
                const next = snake[index + 1] || segment;

                if (prev.x === next.x) {
                    // Vertical movement
                    rotation = prev.y < segment.y ? Math.PI / 2 : -Math.PI / 2;
                } else {
                    // Horizontal movement
                    rotation = prev.x < segment.x ? 0 : Math.PI;
                }
            } else {
                // Head rotation
                switch (direction) {
                    case 'up': rotation = -Math.PI / 2; break;
                    case 'down': rotation = Math.PI / 2; break;
                    case 'left': rotation = Math.PI; break;
                    case 'right': rotation = 0; break;
                }
            }

            // Save context, rotate, draw, and restore
            ctx.save();
            ctx.translate(x + this.gridSize / 2, y + this.gridSize / 2);
            ctx.rotate(rotation);

            // Add glow effect if recently eaten
            if (finalGlowIntensity > 0) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 20 * finalGlowIntensity;
            }

            ctx.drawImage(sprite, -this.gridSize / 2, -this.gridSize / 2, this.gridSize, this.gridSize);
            ctx.restore();
        });
    }

    // Helper method to get glow color based on yellowness level
    getYellowishGlowColor() {
        // Get RGB values of snake primary color
        const primaryRGB = this.hexToRgbObj(this.snakeColor.primary);

        // Interpolate between current snake color and bright yellow
        const r = this.interpolateValue(primaryRGB.r, this.targetColors.glowYellow.r, this.glowYellowLevel);
        const g = this.interpolateValue(primaryRGB.g, this.targetColors.glowYellow.g, this.glowYellowLevel);
        const b = this.interpolateValue(primaryRGB.b, this.targetColors.glowYellow.b, this.glowYellowLevel);

        return `rgba(${r}, ${g}, ${b}, 0.8)`;
    }

    // Helper method to interpolate between two values based on percentage
    interpolateValue(start, end, percentage) {
        return Math.round(start + (end - start) * (percentage / 100));
    }

    // Helper function to convert hex colors to rgb object
    hexToRgbObj(hex) {
        // Remove the hash at the start if it exists
        hex = hex.replace(/^#/, '');

        // Parse the hex values
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    // Helper method to darken a hex color by a percentage towards black
    darkenColor(hex) {
        // Get RGB values of the color
        const rgb = this.hexToRgbObj(hex);

        // Get RGB values for target black color
        const target = this.targetColors.snakeBlack;

        // Interpolate towards black based on darkness level
        const r = this.interpolateValue(rgb.r, target.r, this.darknessLevel);
        const g = this.interpolateValue(rgb.g, target.g, this.darknessLevel);
        const b = this.interpolateValue(rgb.b, target.b, this.darknessLevel);

        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    createSnakeHead() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Apply darkness to the colors
        const primaryColor = this.darkenColor(this.snakeColor.primary);
        const secondaryColor = this.darkenColor(this.snakeColor.secondary);

        // Draw head body with gradient
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, this.gridSize);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(1, 1, this.gridSize - 2, this.gridSize - 2, 4);
        ctx.fill();

        // Draw eyes with white eyeballs
        // Left eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(8, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.gridSize - 8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.gridSize - 8, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw white smile - lower and wider
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.gridSize / 2, this.gridSize / 2 + 2, 8, 0, Math.PI);
        ctx.stroke();

        return canvas;
    }

    createSnakeBody() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Apply darkness to the colors
        const primaryColor = this.darkenColor(this.snakeColor.primary);
        const secondaryColor = this.darkenColor(this.snakeColor.secondary);

        // Create gradient for body with current snake colors
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, this.gridSize);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);

        // Draw body segment
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(2, 2, this.gridSize - 4, this.gridSize - 4, 4);
        ctx.fill();

        // Add subtle pattern as a highlight (get more subtle as snake darkens)
        const highlightAlpha = Math.max(0.05, 0.15 * (1 - this.darknessLevel / 100));
        ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
        ctx.beginPath();
        ctx.roundRect(4, 4, this.gridSize - 8, this.gridSize - 8, 2);
        ctx.fill();

        return canvas;
    }

    createSnakeTail() {
        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        const ctx = canvas.getContext('2d');

        // Apply darkness to the colors
        const primaryColor = this.darkenColor(this.snakeColor.primary);
        const secondaryColor = this.darkenColor(this.snakeColor.secondary);

        // Create a gradient for the tail that makes it thinner
        const gradient = ctx.createLinearGradient(0, 0, this.gridSize, 0);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(0.7, secondaryColor);
        gradient.addColorStop(1, secondaryColor);

        // Draw tail segment with tapered shape
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Start with full width on the left, taper to 60% on the right
        ctx.moveTo(2, 2);
        ctx.lineTo(this.gridSize - 2, 2);
        ctx.lineTo(this.gridSize - 8, this.gridSize - 2);
        ctx.lineTo(2, this.gridSize - 2);
        ctx.closePath();
        ctx.fill();

        // Add pattern that fades out (subtle highlight)
        const highlightAlpha = Math.max(0.05, 0.15 * (1 - this.darknessLevel / 100));
        ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
        ctx.beginPath();
        ctx.roundRect(4, 4, this.gridSize - 12, this.gridSize - 8, 2);
        ctx.fill();

        return canvas;
    }
}

// Export the class
window.SnakeDrawer = SnakeDrawer;
