class SnakeDrawer {
    constructor(gridSize, pixelRatio = 1) {
        this.gridSize = gridSize;
        this.pixelRatio = pixelRatio; // Store pixel ratio for Retina display support

        // Set default snake colors (will be overridden by random selection)
        this.snakeColor = {
            primary: '#2ecc71',   // Vibrant green
            secondary: '#27ae60'  // Emerald green
        };

        // Track visual effects
        this.darknessLevel = 0;   // 0-100: How dark the snake is, 100 = completely black
        this.glowYellowLevel = 0; // 0-100: How yellow the glow is, 100 = bright yellow
        this.shakeIntensity = 0.15; // Controls how much the snake segments shake (0-1)
        this.luckGlowTime = 0;    // Timestamp when luck was last triggered

        // Define target colors for progression effects
        this.targetColors = {
            snakeBlack: { r: 0, g: 0, b: 0 },        // Target for snake darkness: pure black
            glowYellow: { r: 255, g: 255, b: 0 }     // Target for glow: bright yellow
        };

        // Define color pairs
        this.colorPairs = [
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
        // Pick a random color pair
        const randomPair = this.colorPairs[Math.floor(Math.random() * this.colorPairs.length)];
        this.snakeColor = randomPair;

        // Reset darkness level when creating a new color
        this.resetLevels();
    }

    // Reset darkness and glow levels to initial values
    resetLevels() {
        this.darknessLevel = 0;
        this.glowYellowLevel = 0;
        this.shakeIntensity = 0.15; // Reset shake to default
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

        // Gradually increase shake intensity as snake grows
        this.shakeIntensity = Math.min(0.15 + this.darknessLevel * 0.0025, 0.4);

        // Regenerate sprites with new darkness level
        this.updateSprites();
    }

    // Set a specific shake intensity level
    setShakeIntensity(intensity) {
        this.shakeIntensity = Math.max(0, Math.min(1, intensity)); // Clamp between 0 and 1
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
    updateGridSize(gridSize, pixelRatio = 1) {
        this.gridSize = gridSize;
        this.pixelRatio = pixelRatio; // Update pixel ratio
        this.updateSprites();
    }

    // Set luck trigger time for red glow effect
    triggerLuckGlow() {
        this.luckGlowTime = Date.now();
    }

    // Draw snake on the canvas
    drawSnake(ctx, snake, direction, lastEatenTime, glowDuration, isGameOver) {
        // Apply high DPI scaling
        ctx.save();
        
        // Calculate glow effect with pulsing
        const timeSinceEaten = Date.now() - lastEatenTime;
        const glowIntensity = Math.max(0, 1 - (timeSinceEaten / glowDuration));

        // Create pulsing effect with 3 cycles
        const pulse = Math.sin((timeSinceEaten / 1000) * Math.PI * 3) * 0.5 + 0.5;
        const finalGlowIntensity = glowIntensity * pulse;

        // Get current glow color - interpolate between snake primary color and yellow
        const glowColor = this.getYellowishGlowColor();

        // Check for luck glow effect (flashing red glow)
        const timeSinceLuck = Date.now() - this.luckGlowTime;
        const luckGlowDuration = 1500; // 1.5 seconds total for 3 pulses
        let luckGlowIntensity = 0;
        let luckGlowColor = 'rgba(255, 30, 0, 0.9)'; // More intense flaming red with higher opacity

        if (timeSinceLuck < luckGlowDuration) {
            // Create 3 pulses over 1.5 seconds
            const luckPulse = Math.sin((timeSinceLuck / 1000) * Math.PI * 4) * 0.5 + 0.5;
            luckGlowIntensity = Math.max(0, 1 - (timeSinceLuck / luckGlowDuration)) * luckPulse * 2.5; // Increased multiplier from 1.5 to 2.5
        }

        // Generate persistent shake offsets for each segment (changes every 100ms)
        const shakeTime = Math.floor(Date.now() / 100);
        const shakeSeeds = [];
        for (let i = 0; i < snake.length; i++) {
            // Use segment index and current time to create consistent but changing shake
            const seed1 = Math.sin(shakeTime * 0.1 + i * 0.7) * 10000;
            const seed2 = Math.cos(shakeTime * 0.1 + i * 0.5) * 10000;
            shakeSeeds.push({
                x: (seed1 - Math.floor(seed1)) * 2 - 1,
                y: (seed2 - Math.floor(seed2)) * 2 - 1
            });
        }

        snake.forEach((segment, index) => {
            // Calculate shake offset
            // Make shake more intense for middle segments, less for head and tail
            // No shake if game is over, regardless of shake setting
            const shakeScale = isGameOver ? 0 :
                              (index === 0 ? 0.1 : // less shake for head
                              (index === snake.length - 1 ? 0.1 : this.shakeIntensity)); // less shake for tail

            // Apply shake - multiply by gridSize to scale it proportionally
            const shakeOffset = {
                x: shakeSeeds[index].x * shakeScale * this.gridSize * 0.2,
                y: shakeSeeds[index].y * shakeScale * this.gridSize * 0.2
            };

            const x = segment.x * this.gridSize + shakeOffset.x;
            const y = segment.y * this.gridSize + shakeOffset.y;

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

            // Priority 1: Apply luck glow effect (red) if active
            if (luckGlowIntensity > 0) {
                ctx.shadowColor = luckGlowColor;
                ctx.shadowBlur = 40 * luckGlowIntensity * this.pixelRatio; // Adjust blur for pixel ratio

                // Add a second shadow for even more intensity on lucky escapes
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            // Priority 2: Apply normal food glow effect if active
            else if (finalGlowIntensity > 0) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 25 * finalGlowIntensity * this.pixelRatio; // Adjust blur for pixel ratio
            }

            ctx.drawImage(sprite, -this.gridSize / 2, -this.gridSize / 2, this.gridSize, this.gridSize);

            // For luck glow, add an additional draw pass with composite operation for intense glow
            if (luckGlowIntensity > 0.4) {
                // Only add the extra intense effect at higher intensities
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = luckGlowIntensity * 0.4; // Semitransparent
                ctx.drawImage(sprite, -this.gridSize / 2, -this.gridSize / 2, this.gridSize, this.gridSize);
                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        });
        
        ctx.restore();
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
        
        // Round corner radius proportional to grid size
        const cornerRadius = Math.max(2, this.gridSize * 0.1);
        ctx.roundRect(1, 1, this.gridSize - 2, this.gridSize - 2, cornerRadius);
        ctx.fill();

        // Calculate proportional sizes for facial features
        const eyePositionX = this.gridSize * 0.2; // 20% from edge
        const eyePositionY = this.gridSize * 0.2; // 20% from top
        const eyeRadius = Math.max(1.5, this.gridSize * 0.075); // 7.5% of gridSize
        const irisRadius = Math.max(0.75, eyeRadius * 0.5); // 50% of eye size
        const smileRadius = Math.max(4, this.gridSize * 0.2); // 20% of gridSize
        const smileY = this.gridSize * 0.55; // Position smile at 55% down
        const smileWidth = Math.max(1, this.gridSize * 0.05); // Line width proportional to grid size

        // Draw eyes with white eyeballs
        // Left eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyePositionX, eyePositionY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyePositionX, eyePositionY, irisRadius, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.gridSize - eyePositionX, eyePositionY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.gridSize - eyePositionX, eyePositionY, irisRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw white smile - positioned proportionally
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = smileWidth;
        ctx.beginPath();
        ctx.arc(this.gridSize / 2, smileY, smileRadius, 0, Math.PI);
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

        // Calculate proportional corner radius
        const cornerRadius = Math.max(2, this.gridSize * 0.1);
        
        // Draw body segment
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(2, 2, this.gridSize - 4, this.gridSize - 4, cornerRadius);
        ctx.fill();

        // Add subtle pattern as a highlight (get more subtle as snake darkens)
        const highlightAlpha = Math.max(0.05, 0.15 * (1 - this.darknessLevel / 100));
        ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
        ctx.beginPath();
        ctx.roundRect(4, 4, this.gridSize - 8, this.gridSize - 8, Math.max(1, cornerRadius * 0.5));
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

        // Calculate proportional sizes
        const taperWidth = Math.max(6, this.gridSize * 0.15); // Proportional taper width
        const cornerRadius = Math.max(1, this.gridSize * 0.05); // Smaller corner radius for tail
        
        // Draw tail segment with tapered shape
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Start with full width on the left, taper on the right
        ctx.moveTo(2, 2);
        ctx.lineTo(this.gridSize - 2, 2);
        ctx.lineTo(this.gridSize - taperWidth, this.gridSize - 2);
        ctx.lineTo(2, this.gridSize - 2);
        ctx.closePath();
        ctx.fill();

        // Add pattern that fades out (subtle highlight)
        const highlightAlpha = Math.max(0.05, 0.15 * (1 - this.darknessLevel / 100));
        const highlightWidth = Math.max(8, this.gridSize * 0.2); // Proportional highlight width
        
        ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
        ctx.beginPath();
        ctx.roundRect(4, 4, this.gridSize - highlightWidth, this.gridSize - 8, cornerRadius);
        ctx.fill();

        return canvas;
    }
}

// Export the class
window.SnakeDrawer = SnakeDrawer;
