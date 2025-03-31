/**
 * Handles layered UI overlays on top of the game canvas.
 * - Implements a specialized layer for rendering non-gameplay UI elements
 * - Manages overlay transparency to maintain gameplay visibility
 * - Renders informational and instructional UI elements
 * - Controls tooltip and hint systems with proper positioning and timing
 * - Implements responsive positioning based on screen size and orientation
 * - Manages overlay transitions with smooth animations
 * - Optimizes overlay rendering to minimize performance impact
 * - Provides visually distinct UI elements that don't interfere with gameplay
 */
class UIOverlayManager {
    constructor(gridSize, pixelRatio = 1) {
        this.gridSize = gridSize || 20;
        this.pixelRatio = pixelRatio; // Store pixel ratio for Retina display support
        this.tipsManager = new TipsManager();
    }

    // Update gridSize for responsive design
    updateGridSize(gridSize, pixelRatio = 1) {
        this.gridSize = gridSize;
        this.pixelRatio = pixelRatio; // Update pixel ratio
    }

    // Draw game over screen
    drawGameOver(ctx, visualWidth, visualHeight, score, highScore) {
        // Create a semi-transparent gradient overlay with a green-to-red tint
        const gradient = ctx.createLinearGradient(0, 0, 0, visualHeight);
        gradient.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
        gradient.addColorStop(1, 'rgba(153, 27, 27, 0.85)'); // Darker red that complements green
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, visualWidth, visualHeight);

        // Set common text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw "Game Over!" text with gradient and glow
        ctx.save();

        // Create gradient for game over text - using a red that complements green
        const gameOverGradient = ctx.createLinearGradient(
            visualWidth / 2 - 120,
            visualHeight / 2 - 60,
            visualWidth / 2 + 120,
            visualHeight / 2 - 20
        );
        gameOverGradient.addColorStop(0, '#e74c3c');
        gameOverGradient.addColorStop(1, '#c0392b');

        // Add glow effect
        ctx.shadowColor = 'rgba(231, 76, 60, 0.6)';
        ctx.shadowBlur = 15 * this.pixelRatio; // Adjust for pixel ratio

        ctx.font = `bold ${this.gridSize * 1.8}px 'Poppins', sans-serif`;
        ctx.fillStyle = gameOverGradient;
        ctx.fillText('GAME OVER', visualWidth / 2, visualHeight / 2 - this.gridSize * 4);

        ctx.restore();

        // Draw score panel with glass effect - moved down for better spacing
        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.roundRect(
            visualWidth / 2 - this.gridSize * 5,
            visualHeight / 2 - this.gridSize * 2,
            this.gridSize * 10,
            this.gridSize * 6, // Increased height to add more space
            this.gridSize / 3
        );
        ctx.fill();

        // Score border highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2 * this.pixelRatio; // Adjust for pixel ratio
        ctx.stroke();

        ctx.restore();

        // Draw score with green gradient matching snake
        ctx.save();

        const scoreGradient = ctx.createLinearGradient(
            visualWidth / 2 - 60,
            visualHeight / 2,
            visualWidth / 2 + 60,
            visualHeight / 2
        );
        scoreGradient.addColorStop(0, '#2ecc71');
        scoreGradient.addColorStop(1, '#27ae60');

        ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('SCORE', visualWidth / 2, visualHeight / 2 - this.gridSize * 1);

        ctx.font = `bold ${this.gridSize * 1.2}px 'Poppins', sans-serif`;
        ctx.fillStyle = scoreGradient;
        ctx.fillText(`${score}`, visualWidth / 2, visualHeight / 2);

        ctx.restore();

        // Draw high score with complementary blue gradient
        ctx.save();

        const highScoreGradient = ctx.createLinearGradient(
            visualWidth / 2 - 80,
            visualHeight / 2 + 60,
            visualWidth / 2 + 80,
            visualHeight / 2 + 60
        );
        highScoreGradient.addColorStop(0, '#3498db');
        highScoreGradient.addColorStop(1, '#2980b9');

        ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('HIGH SCORE', visualWidth / 2, visualHeight / 2 + this.gridSize * 1.8);

        ctx.font = `bold ${this.gridSize * 1.2}px 'Poppins', sans-serif`;
        ctx.fillStyle = highScoreGradient;
        ctx.fillText(`${highScore}`, visualWidth / 2, visualHeight / 2 + this.gridSize * 2.8);

        ctx.restore();

        // Draw new high score badge if it was beaten - using amber color that complements green
        if (score === highScore && score > 0) {
            ctx.save();

            // Draw badge background
            ctx.fillStyle = 'rgba(243, 156, 18, 0.2)';
            ctx.beginPath();
            ctx.roundRect(
                visualWidth / 2 - this.gridSize * 4,
                visualHeight / 2 + this.gridSize * 5.5,
                this.gridSize * 8,
                this.gridSize * 1,
                this.gridSize / 3
            );
            ctx.fill();

            // Add star icon and glow
            ctx.shadowColor = 'rgba(243, 156, 18, 0.6)';
            ctx.shadowBlur = 10 * this.pixelRatio; // Adjust for pixel ratio
            ctx.fillStyle = '#f39c12';
            ctx.font = `${this.gridSize * 0.65}px 'Poppins', sans-serif`;
            ctx.fillText('✨ NEW HIGH SCORE! ✨', visualWidth / 2, visualHeight / 2 + this.gridSize * 6);

            ctx.restore();
        }

        // Draw "Press SPACE to play again" message with animation
        ctx.save();
        ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Add subtle pulsing animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.1 + 0.9;
        ctx.globalAlpha = pulse;

        // Position based on whether there's a new high score badge
        const y = score === highScore && score > 0
            ? visualHeight / 2 + this.gridSize * 7.5 // After high score badge
            : visualHeight / 2 + this.gridSize * 6; // Directly after high score

        ctx.fillText('Press SPACE to play again', visualWidth / 2, y);
        ctx.restore();
    }

    // Draw pause message overlay
    drawPauseMessage(ctx, visualWidth, visualHeight) {
        // Create a semi-transparent gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, 0, visualHeight);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, visualWidth, visualHeight);

        // Set common text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw pause icon (two vertical bars)
        ctx.save();

        // Draw rounded rectangle background
        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        ctx.beginPath();
        ctx.roundRect(
            visualWidth / 2 - this.gridSize * 2,
            visualHeight / 2 - this.gridSize * 3,
            this.gridSize * 4,
            this.gridSize * 2,
            this.gridSize / 2
        );
        ctx.fill();

        // Draw left pause bar
        ctx.fillStyle = '#2ecc71';
        ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        ctx.shadowBlur = 10 * this.pixelRatio; // Adjust for pixel ratio
        ctx.beginPath();
        ctx.roundRect(
            visualWidth / 2 - this.gridSize * 0.8,
            visualHeight / 2 - this.gridSize * 2.5,
            this.gridSize * 0.6,
            this.gridSize * 1,
            this.gridSize / 8
        );
        ctx.fill();

        // Draw right pause bar
        ctx.beginPath();
        ctx.roundRect(
            visualWidth / 2 + this.gridSize * 0.2,
            visualHeight / 2 - this.gridSize * 2.5,
            this.gridSize * 0.6,
            this.gridSize * 1,
            this.gridSize / 8
        );
        ctx.fill();

        ctx.restore();

        // Draw "Paused" text with gradient - moved down to avoid overlap with pause icon
        ctx.save();

        // Create gradient for text using snake colors
        const textGradient = ctx.createLinearGradient(
            visualWidth / 2 - 80,
            visualHeight / 2,
            visualWidth / 2 + 80,
            visualHeight / 2
        );
        textGradient.addColorStop(0, '#2ecc71');
        textGradient.addColorStop(1, '#27ae60');

        ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
        ctx.shadowBlur = 10 * this.pixelRatio; // Adjust for pixel ratio
        ctx.font = `bold ${this.gridSize * 1.4}px 'Poppins', sans-serif`;
        ctx.fillStyle = textGradient;
        ctx.fillText('PAUSED', visualWidth / 2, visualHeight / 2 + this.gridSize * 0.5); // Moved down by 1 grid unit

        ctx.restore();

        // Draw "Press SPACE to continue" text
        ctx.save();
        ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        // Add subtle pulsing animation
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 2) * 0.1 + 0.9;
        ctx.globalAlpha = pulse;

        ctx.fillText('Press SPACE to continue', visualWidth / 2, visualHeight / 2 + this.gridSize * 2.5); // Also moved down to maintain spacing

        ctx.restore();
    }

    // Draw start message overlay
    drawStartMessage(ctx, visualWidth, visualHeight) {
        // Set common text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw title with gradients and glow
        ctx.save();

        // Create gradient for title - using snake greens
        const titleGradient = ctx.createLinearGradient(
            visualWidth / 2 - 150,
            visualHeight / 2 - 80,
            visualWidth / 2 + 150,
            visualHeight / 2 - 40
        );
        titleGradient.addColorStop(0, '#2ecc71');
        titleGradient.addColorStop(1, '#27ae60');

        // Add glow effect
        ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        ctx.shadowBlur = 15 * this.pixelRatio;

        ctx.font = `bold ${this.gridSize * 1.8}px 'Poppins', sans-serif`;
        ctx.fillStyle = titleGradient;
        ctx.fillText('SNAKE GAME', visualWidth / 2, visualHeight / 2 - this.gridSize * 4);

        ctx.restore();

        // Draw arrow keys with animation and colors in the green/blue family
        const arrowSize = this.gridSize * 0.9;
        const centerX = visualWidth / 2;
        const centerY = visualHeight / 2 - this.gridSize * 0.4; // Move arrows up
        const arrowSpacing = arrowSize * 1.4;
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 3) * 5;

        ctx.save();

        // Left arrow - teal blue
        ctx.fillStyle = '#3498db';
        ctx.shadowColor = 'rgba(52, 152, 219, 0.6)';
        ctx.shadowBlur = 8 * this.pixelRatio;
        ctx.font = `${arrowSize}px Arial`;
        ctx.fillText('←', centerX - arrowSpacing * 1.5, centerY + bounce);

        // Up arrow - green
        ctx.fillStyle = '#2ecc71';
        ctx.shadowColor = 'rgba(46, 204, 113, 0.6)';
        ctx.fillText('↑', centerX - arrowSpacing / 2, centerY + bounce);

        // Down arrow - darker blue
        ctx.fillStyle = '#2980b9';
        ctx.shadowColor = 'rgba(41, 128, 185, 0.6)';
        ctx.fillText('↓', centerX + arrowSpacing / 2, centerY + bounce);

        // Right arrow - darker green
        ctx.fillStyle = '#27ae60';
        ctx.shadowColor = 'rgba(39, 174, 96, 0.6)';
        ctx.fillText('→', centerX + arrowSpacing * 1.5, centerY + bounce);

        ctx.restore();

        // Draw "to start" text
        ctx.font = `${this.gridSize * 0.7}px 'Poppins', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('to start', visualWidth / 2, visualHeight / 2 + this.gridSize * 0.8);

        // Draw a game tip
        this.tipsManager.drawTip(ctx, visualWidth, visualHeight, this.gridSize, this.pixelRatio);
    }

    // Reset the current tip
    resetTip() {
        this.tipsManager.resetTip();
    }
}

// Export the class
window.UIOverlayManager = UIOverlayManager;
