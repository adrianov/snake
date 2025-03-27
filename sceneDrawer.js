class SceneDrawer {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;

        // Track background darkness level (0-100)
        this.darknessLevel = 0;

        // Define start and end colors for day-to-night transition
        this.backgroundColors = {
            day: {
                top: { r: 223, g: 245, b: 230 },     // #dff5e6 - Light green tint
                bottom: { r: 231, g: 247, b: 245 }   // #e7f7f5 - Light green-blue tint
            },
            night: {
                top: { r: 10, g: 15, b: 50 },        // #0a0f32 - Deep blue night sky
                bottom: { r: 30, g: 40, b: 80 }      // #1e2850 - Dark blue-purple horizon
            }
        };

        // Initialize the moon drawer
        this.moonDrawer = new MoonDrawer();
    }

    // Update gridSize (for responsive design)
    updateGridSize(gridSize) {
        this.gridSize = gridSize;
    }

    // Reset darkness level when starting a new game
    resetDarknessLevel() {
        this.darknessLevel = 0;
    }

    // Increment darkness level when snake eats food
    incrementDarknessLevel() {
        // Increase darkness by 1%
        this.darknessLevel += 1;
        // Cap at 100%
        this.darknessLevel = Math.min(this.darknessLevel, 100);
    }

    // Helper method to interpolate between two values based on percentage
    interpolateValue(start, end, percentage) {
        return Math.round(start + (end - start) * (percentage / 100));
    }

    // Helper method to interpolate between two colors
    interpolateColor(startColor, endColor, percentage) {
        const r = this.interpolateValue(startColor.r, endColor.r, percentage);
        const g = this.interpolateValue(startColor.g, endColor.g, percentage);
        const b = this.interpolateValue(startColor.b, endColor.b, percentage);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Draw background elements
    drawBackground() {
        // Interpolate between day and night colors based on darkness level
        const topColor = this.interpolateColor(
            this.backgroundColors.day.top,
            this.backgroundColors.night.top,
            this.darknessLevel
        );

        const bottomColor = this.interpolateColor(
            this.backgroundColors.day.bottom,
            this.backgroundColors.night.bottom,
            this.darknessLevel
        );

        // Create gradient from interpolated colors
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars when darkness level increases
        if (this.darknessLevel > 30) {
            this.drawStars();
        }

        // Draw moon AFTER stars but BEFORE grid
        // Show moon earlier in the darkness transition for a more gradual appearance
        // Start at 25% darkness instead of 40%
        if (this.darknessLevel > 25) {
            // Position moon in the upper right quadrant
            const moonX = this.canvas.width * 0.8;
            const moonY = this.canvas.height * 0.2;
            const moonSize = this.gridSize * 2.5;

            // Calculate moon visibility with a more gradual curve
            // Use a curve that starts very faint and gradually increases
            // Spread the transition over a wider range (25-65 instead of 40-60)
            const moonProgress = (this.darknessLevel - 25) / 40; // 0-1 scale over 40% range
            const moonAlpha = Math.min(1, Math.pow(moonProgress, 1.5) * 1.2); // Non-linear curve

            // Get the current sky color at the moon's position for proper shadow blending
            // Calculate the exact RGB values of the top of the sky
            const topBgColor = this.backgroundColors.day.top;
            const nightBgColor = this.backgroundColors.night.top;

            // Calculate exact RGB values at the moon's position in the sky
            // Sample the exact top color that was just rendered
            const r = Math.round(topBgColor.r + (nightBgColor.r - topBgColor.r) * this.darknessLevel / 100);
            const g = Math.round(topBgColor.g + (nightBgColor.g - topBgColor.g) * this.darknessLevel / 100);
            const b = Math.round(topBgColor.b + (nightBgColor.b - topBgColor.b) * this.darknessLevel / 100);

            // Create an exact RGB color string - no alpha channel to ensure perfect match with the background
            const skyColor = `rgb(${r}, ${g}, ${b})`;

            // Use the MoonDrawer to draw the moon with the current context, position and exact sky color
            this.moonDrawer.draw(this.ctx, moonX, moonY, moonSize, moonAlpha, skyColor);
        }
    }

    // Draw stars in the night sky
    drawStars() {
        // Only show stars as it gets darker
        const starsAlpha = Math.max(0, (this.darknessLevel - 30) / 70);

        this.ctx.save();

        // Create a starfield with different sizes
        const numStars = Math.floor(this.canvas.width * this.canvas.height / 800); // More stars

        // Use a better pseudo-random number generator for star positions
        // Using a combination of different prime numbers and offsets to avoid patterns
        const pseudoRandom = (i, offset) => {
            const a = Math.sin(i * 12.9898 + offset * 78.233) * 43758.5453;
            return a - Math.floor(a);
        };

        // Calculate moon position and radius
        // Only calculate when moon would be visible
        let moonX = 0, moonY = 0, moonRadius = 0;
        let moonVisible = false;

        if (this.darknessLevel > 25) {
            moonVisible = true;
            moonX = this.canvas.width * 0.8;
            moonY = this.canvas.height * 0.2;
            moonRadius = this.gridSize * 2.5; // Actual moon radius
        }

        // Pre-compute star positions based on canvas size to keep them consistent
        for (let i = 0; i < numStars; i++) {
            // Use multiple offsets to break any potential patterns
            const x = pseudoRandom(i, 1) * this.canvas.width;
            const y = pseudoRandom(i, 2) * this.canvas.height * 0.8; // Keep stars in upper 80% of sky

            // Skip stars that would be inside the moon's circle regardless of phase
            if (moonVisible) {
                // Calculate distance from star to moon center
                const distToMoon = Math.sqrt(Math.pow(x - moonX, 2) + Math.pow(y - moonY, 2));

                // Skip ALL stars inside the moon's circle, regardless of phase
                if (distToMoon < moonRadius) {
                    continue; // Skip this star entirely
                }
            }

            // Create varied star sizes with small bias toward smaller stars
            const size = pseudoRandom(i, 3) * pseudoRandom(i, 4) * 2 + 0.5;

            // Create varied twinkle speeds for more natural look
            const twinkleSpeed = 500 + pseudoRandom(i, 5) * 1500;
            const twinklePhase = pseudoRandom(i, 6) * Math.PI * 2; // Random starting phase
            const twinkle = Math.sin(Date.now() / twinkleSpeed + twinklePhase) * 0.3 + 0.7;

            // Add slight color variation to stars
            let starColor;
            const colorRand = pseudoRandom(i, 7);

            if (colorRand > 0.94) {
                // Reddish stars (5%)
                starColor = `rgba(255, ${Math.floor(220 + pseudoRandom(i, 8) * 35)}, ${Math.floor(200 + pseudoRandom(i, 9) * 30)}, ${starsAlpha * twinkle})`;
            } else if (colorRand > 0.88) {
                // Bluish stars (6%)
                starColor = `rgba(${Math.floor(220 + pseudoRandom(i, 10) * 35)}, ${Math.floor(220 + pseudoRandom(i, 11) * 35)}, 255, ${starsAlpha * twinkle})`;
            } else {
                // White stars (89%)
                starColor = `rgba(255, 255, 255, ${starsAlpha * twinkle})`;
            }

            // Draw star
            this.ctx.fillStyle = starColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Add occasional sparkle effect to brightest stars
            if (size > 1.7 && pseudoRandom(i, 12) > 0.7) {
                this.ctx.save();
                this.ctx.globalAlpha = starsAlpha * twinkle * 0.7;

                // Draw simple cross-shaped sparkle
                this.ctx.strokeStyle = starColor;
                this.ctx.lineWidth = 0.5;
                const sparkleSize = size * 2;

                this.ctx.beginPath();
                this.ctx.moveTo(x - sparkleSize, y);
                this.ctx.lineTo(x + sparkleSize, y);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(x, y - sparkleSize);
                this.ctx.lineTo(x, y + sparkleSize);
                this.ctx.stroke();

                this.ctx.restore();
            }
        }

        this.ctx.restore();
    }

    // Draw grid lines
    drawGrid() {
        // Draw a luminescent grid with subtle animation
        const time = Date.now() / 4000; // Slow pulse
        const alpha = 0.15 + Math.sin(time) * 0.05; // Range from 0.1 to 0.2

        // Adjust grid color based on darkness level - use more contrasting colors at night
        let gridColorRGB;

        if (this.darknessLevel < 50) {
            // Day phase: Green grid
            gridColorRGB = {
                r: 46, g: 204, b: 113, // #2ecc71 - Green
                glow: { r: 46, g: 204, b: 113 } // Same green for glow
            };
        } else {
            // Night phase: Cyan/blue grid that stands out against dark blue sky
            gridColorRGB = {
                r: 52, g: 235, b: 229, // #34ebe5 - Cyan
                glow: { r: 65, g: 179, b: 255 } // #41b3ff - Light blue for glow
            };
        }

        // Adjust grid brightness based on darkness
        const gridAlpha = alpha * (1 + this.darknessLevel / 200); // Increase contrast as it gets darker

        this.ctx.strokeStyle = `rgba(${gridColorRGB.r}, ${gridColorRGB.g}, ${gridColorRGB.b}, ${gridAlpha})`;
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

        // Draw subtle glow regions
        const regionSize = this.gridSize * 5;
        const numRegions = 3;

        this.ctx.save();

        // Adjust glow intensity based on darkness level - make it more visible at night
        const glowAlpha = (0.05 + Math.sin(time * 1.5) * 0.02) * (1 + this.darknessLevel / 150);
        this.ctx.globalAlpha = glowAlpha;

        for (let i = 0; i < numRegions; i++) {
            const x = Math.sin(time + i * Math.PI * 2 / numRegions) * this.canvas.width / 3 + this.canvas.width / 2;
            const y = Math.cos(time + i * Math.PI * 2 / numRegions) * this.canvas.height / 3 + this.canvas.height / 2;

            const gradient = this.ctx.createRadialGradient(
                x, y, 0,
                x, y, regionSize
            );

            // Use adjusted glow color
            gradient.addColorStop(0, `rgba(${gridColorRGB.glow.r}, ${gridColorRGB.glow.g}, ${gridColorRGB.glow.b}, 0.3)`);
            gradient.addColorStop(1, `rgba(${gridColorRGB.glow.r}, ${gridColorRGB.glow.g}, ${gridColorRGB.glow.b}, 0)`);

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

    // Draw food items with appropriate effects
    drawFood(food, fruitImages) {
        if (!fruitImages || Object.keys(fruitImages).length === 0) {
            return; // Don't try to draw if images aren't loaded
        }

        // Moon drawing has been moved to drawBackground() so it appears behind grid lines

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

                // Add glow effect to food at night
                if (this.darknessLevel > 50) {
                    const glowIntensity = Math.min(10, this.darknessLevel / 10);
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
                    this.ctx.shadowBlur = glowIntensity;
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
