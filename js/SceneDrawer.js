class SceneDrawer {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;

        // Initialize manager classes
        this.backgroundManager = new BackgroundManager();
        this.starfieldManager = new StarfieldManager();
        this.moonDrawer = new MoonDrawer();
        this.uiOverlayManager = new UIOverlayManager(gridSize);
        
        // Moon animation properties
        this.moonStartTime = Date.now();
        this.moonCycleDuration = 120000; // 2 minutes for a full moon cycle across the sky
        this.moonResetStartTime = 0; // When the moon reset animation started
        this.moonResetDuration = 3000; // 3 seconds for the reset animation
        this.isMoonResetting = false; // Is the moon currently in reset animation

        // Performance tracking
        this.lastFrameTime = 0;
    }

    // Update gridSize (for responsive design)
    updateGridSize(gridSize) {
        this.gridSize = gridSize;
        this.uiOverlayManager.updateGridSize(gridSize);
    }

    // Reset darkness level when starting a new game
    resetDarknessLevel() {
        this.backgroundManager.resetDarknessLevel();
        
        // Reset moon animation cycle
        this.moonStartTime = Date.now();
        
        // Reset the current tip
        this.uiOverlayManager.resetTip();
    }

    // Increment darkness level when snake eats food
    incrementDarknessLevel() {
        this.backgroundManager.incrementDarknessLevel();
    }

    // Draw background elements
    drawBackground() {
        // Draw background gradient
        this.backgroundManager.drawBackground(this.ctx, this.canvas);

        // Draw stars when darkness level increases
        if (this.backgroundManager.darknessLevel > 30) {
            this.starfieldManager.drawStars(this.ctx, this.canvas, this.backgroundManager.darknessLevel);
        }

        // Draw moon AFTER stars but BEFORE grid
        // Show moon earlier in the darkness transition for a more gradual appearance
        if (this.backgroundManager.darknessLevel > 25) {
            // Get current time for animation calculations
            const currentTime = Date.now();

            // Calculate normal cycle progress
            const elapsedTime = currentTime - this.moonStartTime;
            let cycleProgress = (elapsedTime % this.moonCycleDuration) / this.moonCycleDuration;

            // Create animation state object for MoonDrawer
            let moonAnimation = {
                cycleProgress: cycleProgress,
                isResetting: this.isMoonResetting,
                progress: 0
            };

            // Check if we need to start reset animation at end of cycle
            if (!this.isMoonResetting && cycleProgress > 0.99) {
                // Start the reset animation
                this.isMoonResetting = true;
                this.moonResetStartTime = currentTime;
                moonAnimation.isResetting = true;
            }

            // Update reset animation progress if active
            if (this.isMoonResetting) {
                const resetElapsedTime = currentTime - this.moonResetStartTime;
                moonAnimation.progress = Math.min(1, resetElapsedTime / this.moonResetDuration);

                // If reset animation is complete, go back to normal cycle
                if (resetElapsedTime >= this.moonResetDuration) {
                    this.isMoonResetting = false;
                    this.moonStartTime = currentTime - 100; // Small offset to ensure we start at beginning
                    moonAnimation = {
                        cycleProgress: 0,
                        isResetting: false
                    };
                }
            }

            // Calculate moon size
            const moonSize = this.gridSize * 2.5;

            // Calculate moon visibility with a more gradual curve based on darkness
            // This ensures the moon is only visible when dark enough
            const visibilityProgress = (this.backgroundManager.darknessLevel - 25) / 40; // 0-1 scale over 40% range
            const moonAlpha = Math.min(1, Math.pow(visibilityProgress, 1.5) * 1.2); // Non-linear curve

            // Skip drawing if moon wouldn't be visible
            if (moonAlpha > 0.01) {
                // Get the current sky color for proper shadow blending
                const skyColor = this.backgroundManager.getCurrentTopColorRgb();

                // Calculate moon position using MoonDrawer's position calculator
                const moonPosition = this.moonDrawer.calculatePosition(this.canvas, moonAnimation);

                // Update starfield with moon position for hiding stars behind moon
                if (this.backgroundManager.darknessLevel > 30) {
                    const moonPositionData = {
                        x: moonPosition.x,
                        y: moonPosition.y,
                        radius: moonSize,
                        progress: cycleProgress
                    };
                    
                    // Re-render stars with moon position information
                    this.starfieldManager.drawStars(
                        this.ctx, 
                        this.canvas, 
                        this.backgroundManager.darknessLevel, 
                        moonPositionData
                    );
                }

                // Use the MoonDrawer to draw the moon with the current context, position and exact sky color
                this.moonDrawer.draw(
                    this.ctx,
                    moonPosition.x,
                    moonPosition.y,
                    moonSize,
                    moonAlpha,
                    skyColor,
                    this.isMoonResetting ? moonAnimation : null
                );
            }
        }

        // FPS counter for debugging (uncomment if needed)
        /*
        const now = performance.now();
        const fps = Math.round(1000 / (now - this.lastFrameTime));
        this.lastFrameTime = now;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);
        */
    }

    // Draw grid lines
    drawGrid() {
        this.backgroundManager.drawGrid(this.ctx, this.canvas, this.gridSize);
    }

    // Draw game over screen
    drawGameOver(score, highScore) {
        this.uiOverlayManager.drawGameOver(this.ctx, this.canvas, score, highScore);
    }

    // Draw pause message overlay
    drawPauseMessage() {
        this.uiOverlayManager.drawPauseMessage(this.ctx, this.canvas);
    }

    // Draw start message overlay
    drawStartMessage() {
        this.uiOverlayManager.drawStartMessage(this.ctx, this.canvas);
    }

    // Draw food items with appropriate effects
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

                // Add glow effect to food at night
                if (this.backgroundManager.darknessLevel > 50) {
                    const glowIntensity = Math.min(10, this.backgroundManager.darknessLevel / 10);
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
