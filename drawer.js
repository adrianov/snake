class GameDrawer {
    constructor(canvas, gridSize, fruitImages) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.fruitImages = fruitImages;
        this.glowDuration = 3000; // Duration of glow effect in milliseconds (3 seconds)

        // Set default snake colors
        this.snakeColor = {
            primary: '#2ecc71',   // Vibrant green
            secondary: '#27ae60'  // Emerald green
        };

        // Track visual effects
        this.darknessLevel = 0;   // 0-100: How dark the snake is, 100 = completely black
        this.glowYellowLevel = 0; // 0-100: How yellow the glow is, 100 = bright yellow

        // Fixed grid colors for consistent visibility
        this.gridColor = {
            primary: 'rgba(46, 204, 113, 0.15)', // Subtle green for consistency
            glow: 'rgba(46, 204, 113, 0.3)'      // Subtle green glow for grid effects
        };

        // Define target colors for progression effects
        this.targetColors = {
            snakeBlack: { r: 0, g: 0, b: 0 },        // Target for snake darkness: pure black
            glowYellow: { r: 255, g: 255, b: 0 }     // Target for glow: bright yellow
        };

        // Initialize sprites
        this.snakeSprites = {
            head: this.createSnakeHead(),
            body: this.createSnakeBody(),
            tail: this.createSnakeTail()
        };
    }

    // Reset darkness and glow levels to initial values
    resetDarknessLevel() {
        this.darknessLevel = 0;
        this.glowYellowLevel = 0;
        // Regenerate sprites with reset values
        this.updateSnakeColors(this.snakeColor);
    }

    // Increment darkness level when snake eats food
    incrementDarknessLevel() {
        // Increase darkness by 1%
        this.darknessLevel += 1;
        // No cap, let it go to 100

        // Also increase glow yellowness level by 1%
        this.glowYellowLevel += 1;
        // Cap at 100
        this.glowYellowLevel = Math.min(this.glowYellowLevel, 100);

        // Regenerate sprites with new darkness level
        this.updateSnakeSprites();
    }

    // Update snake colors and regenerate sprites
    updateSnakeColors(colors) {
        this.snakeColor = colors;
        this.updateSnakeSprites();
    }

    // Update just the snake sprites
    updateSnakeSprites() {
        // Regenerate snake sprites with current colors and darkness levels
        this.snakeSprites = {
            head: this.createSnakeHead(),
            body: this.createSnakeBody(),
            tail: this.createSnakeTail()
        };
    }

    // Main draw function
    draw(gameState) {
        // Clear canvas with background
        this.drawBackground();

        // Draw background grid
        this.drawGrid();

        // Draw food
        this.drawFood(gameState.food);

        // Draw snake
        this.drawSnake(gameState.snake, gameState.direction, gameState.lastEatenTime);

        // Draw game state overlays
        if (gameState.isGameOver) {
            this.drawGameOver(gameState.score, gameState.highScore);
            return;
        }

        if (gameState.isPaused) {
            this.drawPauseMessage();
        }

        if (!gameState.isGameStarted) {
            this.drawStartMessage();
            return;
        }
    }

    drawBackground() {
        // Clear canvas with a light green gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#dff5e6'); // Light green tint
        gradient.addColorStop(1, '#e7f7f5'); // Light green-blue tint
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        // Draw a luminescent grid with subtle animation - using fixed colors for consistency
        const time = Date.now() / 4000; // Slow pulse
        const alpha = 0.15 + Math.sin(time) * 0.05; // Range from 0.1 to 0.2

        // Use consistent grid colors regardless of snake darkness
        this.ctx.strokeStyle = `rgba(46, 204, 113, ${alpha})`;
        this.ctx.lineWidth = 1.5;

        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw subtle glow regions with fixed color
        const regionSize = this.gridSize * 5;
        const numRegions = 3;

        this.ctx.save();
        this.ctx.globalAlpha = 0.05 + Math.sin(time * 1.5) * 0.02;

        for (let i = 0; i < numRegions; i++) {
            const x = Math.sin(time + i * Math.PI * 2 / numRegions) * this.canvas.width / 3 + this.canvas.width / 2;
            const y = Math.cos(time + i * Math.PI * 2 / numRegions) * this.canvas.height / 3 + this.canvas.height / 2;

            const gradient = this.ctx.createRadialGradient(
                x, y, 0,
                x, y, regionSize
            );
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)');
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, regionSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawFood(food) {
        if (!this.fruitImages || Object.keys(this.fruitImages).length === 0) {
            return; // Don't try to draw if images aren't loaded
        }

        food.forEach(food => {
            if (this.fruitImages[food.type]) {
                // Calculate fade out effect based on remaining lifetime
                const age = Date.now() - food.spawnTime;
                const remainingLifetime = food.lifetime - age;
                const fadeOutDuration = 5000; // 5 seconds fade out

                this.ctx.save();

                // Apply fade out effect if close to disappearing
                if (remainingLifetime < fadeOutDuration) {
                    // Calculate alpha value (1.0 to 0.0)
                    const alpha = Math.max(0, remainingLifetime / fadeOutDuration);
                    this.ctx.globalAlpha = alpha;
                } else {
                    // Ensure full opacity for non-fading fruits
                    this.ctx.globalAlpha = 1.0;
                }

                this.ctx.drawImage(
                    this.fruitImages[food.type],
                    food.x * this.gridSize,
                    food.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );

                this.ctx.restore();
            }
        });
    }

    drawSnake(snake, direction, lastEatenTime) {
        // Calculate glow effect with pulsing
        const timeSinceEaten = Date.now() - lastEatenTime;
        const glowIntensity = Math.max(0, 1 - (timeSinceEaten / this.glowDuration));

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
            this.ctx.save();
            this.ctx.translate(x + this.gridSize / 2, y + this.gridSize / 2);
            this.ctx.rotate(rotation);

            // Add glow effect if recently eaten
            if (finalGlowIntensity > 0) {
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 20 * finalGlowIntensity;
            }

            this.ctx.drawImage(sprite, -this.gridSize / 2, -this.gridSize / 2, this.gridSize, this.gridSize);
            this.ctx.restore();
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

    // Helper function to convert hex colors to rgb for alpha transparency
    hexToRgb(hex) {
        // Remove the hash at the start if it exists
        hex = hex.replace(/^#/, '');

        // Parse the hex values
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        // Return RGB values as string
        return `${r}, ${g}, ${b}`;
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

    drawGameOver(score, highScore) {
        // Create a semi-transparent gradient overlay with a green-to-red tint
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
        gradient.addColorStop(1, 'rgba(153, 27, 27, 0.85)'); // Darker red that complements green
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set common text properties
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw "Game Over!" text with gradient and glow
        this.ctx.save();

        // Create gradient for game over text - using a red that complements green
        const gameOverGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 120,
            this.canvas.height/2 - 60,
            this.canvas.width/2 + 120,
            this.canvas.height/2 - 20
        );
        gameOverGradient.addColorStop(0, '#e74c3c');
        gameOverGradient.addColorStop(1, '#c0392b');

        // Add glow effect
        this.ctx.shadowColor = 'rgba(231, 76, 60, 0.6)';
        this.ctx.shadowBlur = 15;

        this.ctx.font = `bold ${this.gridSize * 1.8}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = gameOverGradient;
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 4);

        this.ctx.restore();

        // Draw score panel with glass effect - moved down for better spacing
        this.ctx.save();

        // Panel background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 - this.gridSize * 5,
            this.canvas.height / 2 - this.gridSize * 2,
            this.gridSize * 10,
            this.gridSize * 6, // Increased height to add more space
            this.gridSize / 3
        );
        this.ctx.fill();

        // Score border highlight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();

        // Draw score with green gradient matching snake
        this.ctx.save();

        const scoreGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 60,
            this.canvas.height/2,
            this.canvas.width/2 + 60,
            this.canvas.height/2
        );
        scoreGradient.addColorStop(0, '#2ecc71');
        scoreGradient.addColorStop(1, '#27ae60');

        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('SCORE', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 1);

        this.ctx.font = `bold ${this.gridSize * 1.2}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = scoreGradient;
        this.ctx.fillText(`${score}`, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.restore();

        // Draw high score with complementary blue gradient
        this.ctx.save();

        const highScoreGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 80,
            this.canvas.height/2 + 60,
            this.canvas.width/2 + 80,
            this.canvas.height/2 + 60
        );
        highScoreGradient.addColorStop(0, '#3498db');
        highScoreGradient.addColorStop(1, '#2980b9');

        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('HIGH SCORE', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 1.8);

        this.ctx.font = `bold ${this.gridSize * 1.2}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = highScoreGradient;
        this.ctx.fillText(`${highScore}`, this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 2.8);

        this.ctx.restore();

        // Draw new high score badge if it was beaten - using amber color that complements green
        if (score === highScore && score > 0) {
            this.ctx.save();

            // Draw badge background
            this.ctx.fillStyle = 'rgba(243, 156, 18, 0.2)';
            this.ctx.beginPath();
            this.ctx.roundRect(
                this.canvas.width / 2 - this.gridSize * 4,
                this.canvas.height / 2 + this.gridSize * 5.5,
                this.gridSize * 8,
                this.gridSize * 1,
                this.gridSize / 3
            );
            this.ctx.fill();

            // Add star icon and glow
            this.ctx.shadowColor = 'rgba(243, 156, 18, 0.6)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#f39c12';
            this.ctx.font = `${this.gridSize * 0.65}px 'Poppins', sans-serif`;
            this.ctx.fillText('✨ NEW HIGH SCORE! ✨', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 6);

            this.ctx.restore();
        }

        // Draw "Press SPACE to play again" message with animation
        this.ctx.save();
        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Add subtle pulsing animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.1 + 0.9;
        this.ctx.globalAlpha = pulse;

        // Position based on whether there's a new high score badge
        const y = score === highScore && score > 0
            ? this.canvas.height / 2 + this.gridSize * 7.5 // After high score badge
            : this.canvas.height / 2 + this.gridSize * 6; // Directly after high score

        this.ctx.fillText('Press SPACE to play again', this.canvas.width / 2, y);
        this.ctx.restore();
    }

    drawPauseMessage() {
        // Create a semi-transparent gradient overlay
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set common text properties
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw pause icon (two vertical bars)
        this.ctx.save();

        // Draw rounded rectangle background
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 - this.gridSize * 2,
            this.canvas.height / 2 - this.gridSize * 3,
            this.gridSize * 4,
            this.gridSize * 2,
            this.gridSize / 2
        );
        this.ctx.fill();

        // Draw left pause bar
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 - this.gridSize * 0.8,
            this.canvas.height / 2 - this.gridSize * 2.5,
            this.gridSize * 0.6,
            this.gridSize * 1,
            this.gridSize / 8
        );
        this.ctx.fill();

        // Draw right pause bar
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.canvas.width / 2 + this.gridSize * 0.2,
            this.canvas.height / 2 - this.gridSize * 2.5,
            this.gridSize * 0.6,
            this.gridSize * 1,
            this.gridSize / 8
        );
        this.ctx.fill();

        this.ctx.restore();

        // Draw "Paused" text with gradient - moved down to avoid overlap with pause icon
        this.ctx.save();

        // Create gradient for text using snake colors
        const textGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 80,
            this.canvas.height/2,
            this.canvas.width/2 + 80,
            this.canvas.height/2
        );
        textGradient.addColorStop(0, '#2ecc71');
        textGradient.addColorStop(1, '#27ae60');

        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.font = `bold ${this.gridSize * 1.4}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = textGradient;
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 0.5); // Moved down by 1 grid unit

        this.ctx.restore();

        // Draw "Press SPACE to continue" text
        this.ctx.save();
        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        // Add subtle pulsing animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.1 + 0.9;
        this.ctx.globalAlpha = pulse;

        this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 2.5); // Also moved down to maintain spacing

        this.ctx.restore();
    }

    drawStartMessage() {
        // Create a semi-transparent gradient overlay
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set common text properties
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw title with gradients and glow
        this.ctx.save();

        // Create gradient for title - using snake greens
        const titleGradient = this.ctx.createLinearGradient(
            this.canvas.width/2 - 150,
            this.canvas.height/2 - 80,
            this.canvas.width/2 + 150,
            this.canvas.height/2 - 40
        );
        titleGradient.addColorStop(0, '#2ecc71');
        titleGradient.addColorStop(1, '#27ae60');

        // Add glow effect
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.shadowBlur = 15;

        this.ctx.font = `bold ${this.gridSize * 1.8}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = titleGradient;
        this.ctx.fillText('SNAKE GAME', this.canvas.width / 2, this.canvas.height / 2 - this.gridSize * 4);

        this.ctx.restore();

        // Draw arrow keys with animation and colors in the green/blue family
        const arrowSize = this.gridSize * 0.9;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const arrowSpacing = arrowSize * 1.4;
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 3) * 5;

        this.ctx.save();

        // Left arrow - teal blue
        this.ctx.fillStyle = '#3498db';
        this.ctx.shadowColor = 'rgba(52, 152, 219, 0.6)';
        this.ctx.shadowBlur = 8;
        this.ctx.font = `${arrowSize}px Arial`;
        this.ctx.fillText('←', centerX - arrowSpacing * 1.5, centerY + bounce);

        // Up arrow - green
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        this.ctx.fillText('↑', centerX - arrowSpacing/2, centerY + bounce);

        // Down arrow - darker blue
        this.ctx.fillStyle = '#2980b9';
        this.ctx.shadowColor = 'rgba(41, 128, 185, 0.6)';
        this.ctx.fillText('↓', centerX + arrowSpacing/2, centerY + bounce);

        // Right arrow - darker green
        this.ctx.fillStyle = '#27ae60';
        this.ctx.shadowColor = 'rgba(39, 174, 96, 0.6)';
        this.ctx.fillText('→', centerX + arrowSpacing * 1.5, centerY + bounce);

        this.ctx.restore();

        // Draw "to start" text
        this.ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('to start', this.canvas.width / 2, this.canvas.height / 2 + this.gridSize * 1.5);
    }
}

// Export the class
window.GameDrawer = GameDrawer;
