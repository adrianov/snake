class SceneDrawer {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
    }

    // Update gridSize (for responsive design)
    updateGridSize(gridSize) {
        this.gridSize = gridSize;
    }

    // Draw background elements
    drawBackground() {
        // Clear canvas with a light green gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#dff5e6'); // Light green tint
        gradient.addColorStop(1, '#e7f7f5'); // Light green-blue tint
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw grid lines
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

    // Draw game over screen
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

    // Draw pause message overlay
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

    // Draw start message overlay
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

    // Draw food items on the grid
    drawFood(food, fruitImages) {
        if (!fruitImages || Object.keys(fruitImages).length === 0) {
            return; // Don't try to draw if images aren't loaded
        }

        food.forEach(food => {
            if (fruitImages[food.type]) {
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
                    fruitImages[food.type],
                    food.x * this.gridSize,
                    food.y * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );

                this.ctx.restore();
            }
        });
    }
}

// Export the class
window.SceneDrawer = SceneDrawer;
