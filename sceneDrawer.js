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

        // Create star field caching system
        this.starFieldCache = null;
        this.starFieldDarkness = -1; // Force initial render
        this.stars = []; // Pre-calculated star data
        this.starsGenerated = false;

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

        // Invalidate star cache when size changes
        this.starFieldCache = null;
        this.starsGenerated = false;
    }

    // Reset darkness level when starting a new game
    resetDarknessLevel() {
        this.darknessLevel = 0;
        // Reset moon animation cycle
        this.moonStartTime = Date.now();
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

        // Draw stars when darkness level increases (using cached system)
        if (this.darknessLevel > 30) {
            this.drawStars();
        }

        // Draw moon AFTER stars but BEFORE grid
        // Show moon earlier in the darkness transition for a more gradual appearance
        // Start at 25% darkness instead of 40%
        if (this.darknessLevel > 25) {
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
            const visibilityProgress = (this.darknessLevel - 25) / 40; // 0-1 scale over 40% range
            const moonAlpha = Math.min(1, Math.pow(visibilityProgress, 1.5) * 1.2); // Non-linear curve

            // Skip drawing if moon wouldn't be visible
            if (moonAlpha <= 0.01) return;

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

            // Calculate moon position using MoonDrawer's position calculator
            const moonPosition = this.moonDrawer.calculatePosition(this.canvas, moonAnimation);

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

    // Generate star data - only called once or when canvas size changes
    generateStars() {
        // Use a deterministic seed for consistent star pattern
        const seed = 12345;
        const pseudoRandom = (i, offset) => {
            const a = Math.sin(i * 12.9898 + offset * 78.233) * 43758.5453;
            return a - Math.floor(a);
        };

        // Reset stars array
        this.stars = [];

        // Enhanced star colors for a fantasy sky look
        const starColors = {
            // Warm colors (red to yellow with more saturation)
            warm: [
                { r: 255, g: 150, b: 150 }, // Bright pink
                { r: 255, g: 180, b: 130 }, // Vivid peach
                { r: 255, g: 190, b: 100 }, // Vibrant gold
                { r: 255, g: 170, b: 110 }, // Intense coral
                { r: 255, g: 120, b: 120 }, // Rich salmon
                { r: 255, g: 100, b: 80 }   // Deep orange-red
            ],
            // Cool colors (blue to purple with higher saturation)
            cool: [
                { r: 150, g: 190, b: 255 }, // Electric blue
                { r: 160, g: 160, b: 255 }, // Vibrant periwinkle
                { r: 190, g: 220, b: 255 }, // Glowing ice blue
                { r: 140, g: 180, b: 255 }, // Intense sky blue
                { r: 130, g: 130, b: 255 }  // Rich blue-purple
            ],
            // White to blue-white (for enchanted stars)
            neutral: [
                { r: 255, g: 255, b: 255 }, // Pure white
                { r: 240, g: 250, b: 255 }, // Enchanted white
                { r: 230, g: 240, b: 255 }, // Cool white with aura
                { r: 220, g: 235, b: 255 }  // Slight blue white glow
            ],
            // Fantasy distinctive colors
            fantasy: [
                { r: 255, g: 50, b: 220 },  // Magical pink
                { r: 180, g: 255, b: 180 }, // Ethereal green
                { r: 255, g: 150, b: 30 },  // Mystic amber
                { r: 30, g: 200, b: 255 },  // Arcane blue
                { r: 255, g: 255, b: 100 }, // Fairy gold
                { r: 200, g: 100, b: 255 }, // Wizard purple
                { r: 100, g: 255, b: 210 }, // Elven teal
                { r: 255, g: 130, b: 255 }  // Dragon rose
            ],
            // Legendary stars (ultra bright with unique colors)
            legendary: [
                { r: 255, g: 220, b: 50 },  // Phoenix gold
                { r: 50, g: 255, b: 120 },  // Emerald essence
                { r: 255, g: 50, b: 50 },   // Ruby heart
                { r: 50, g: 150, b: 255 },  // Sapphire soul
                { r: 255, g: 100, b: 255 }  // Amethyst spirit
            ]
        };

        // Create a starfield with different sizes and fantasy effects
        const numStars = Math.floor(this.canvas.width * this.canvas.height / 1200); // Fewer stars (was 900)

        // Pre-generate all star data with fantasy enhancements
        for (let i = 0; i < numStars; i++) {
            // Use multiple offsets to break any potential patterns
            const x = pseudoRandom(i, 1) * this.canvas.width;
            const y = pseudoRandom(i, 2) * this.canvas.height * 0.8; // Keep stars in upper 80% of sky

            // Create varied star sizes with more extremes for fantasy effect
            const sizeBase = pseudoRandom(i, 3);

            // Make some stars significantly larger for a fantasy feel
            let size;
            if (sizeBase > 0.97) {
                // Legendary stars (3%) - but smaller than before
                size = 2 + pseudoRandom(i, 4) * 1.5;
            } else if (sizeBase > 0.90) {
                // Large stars (7%) - reduced in size
                size = 1.5 + pseudoRandom(i, 4) * 1;
            } else {
                // Regular stars (90%) - smaller sizes
                size = 0.5 + pseudoRandom(i, 4) * 0.8;
            }

            // Create varied twinkle properties
            const twinkleSpeed = 500 + pseudoRandom(i, 5) * 1500;
            const twinklePhase = pseudoRandom(i, 6) * Math.PI * 2; // Random starting phase

            // Remove pulsing effect
            const hasPulsingEffect = false;
            const pulseSpeed = 0;
            const pulseIntensity = 0;

            // Determine star color with more realistic distribution
            const colorType = pseudoRandom(i, 7);
            let starColorObj;

            if (colorType > 0.98) {
                // Legendary stars (2% - was 4%) - rare special colors
                const legendaryIndex = Math.floor(pseudoRandom(i, 15) * starColors.legendary.length);
                starColorObj = starColors.legendary[legendaryIndex];
            } else if (colorType > 0.92) {
                // Fantasy colors (6% - was 11%) - fewer magical colors
                const fantasyIndex = Math.floor(pseudoRandom(i, 8) * starColors.fantasy.length);
                starColorObj = starColors.fantasy[fantasyIndex];
            } else if (colorType > 0.82) {
                // Warm colors (10% - was 15%)
                const warmIndex = Math.floor(pseudoRandom(i, 9) * starColors.warm.length);
                starColorObj = starColors.warm[warmIndex];
            } else if (colorType > 0.72) {
                // Cool colors (10% - was 15%)
                const coolIndex = Math.floor(pseudoRandom(i, 10) * starColors.cool.length);
                starColorObj = starColors.cool[coolIndex];
            } else {
                // Neutral colors (72% - was 55%) - more white/blue-white stars
                const neutralIndex = Math.floor(pseudoRandom(i, 11) * starColors.neutral.length);
                starColorObj = starColors.neutral[neutralIndex];
            }

            // Less brightness boost for more realistic stars
            const brightnessBoost = Math.min(70, size * 20);
            const finalR = Math.min(255, starColorObj.r + brightnessBoost);
            const finalG = Math.min(255, starColorObj.g + brightnessBoost);
            const finalB = Math.min(255, starColorObj.b + brightnessBoost);

            // Create core color - less intense
            const coreR = Math.min(255, finalR + 30);
            const coreG = Math.min(255, finalG + 30);
            const coreB = Math.min(255, finalB + 30);

            // Fewer halos, smaller size
            const hasHalo = size > 2.8 || colorType > 0.98;
            const haloSize = size * (1.5 + pseudoRandom(i, 16));
            const haloColor = {
                r: starColorObj.r,
                g: starColorObj.g,
                b: starColorObj.b
            };

            // Fewer diffraction spikes
            const hasDiffraction = size > 1.6 || pseudoRandom(i, 17) > 0.9;
            const spikeLength = size * (1.5 + pseudoRandom(i, 18) * 2);
            const hasOctoDiffraction = size > 2.2 || pseudoRandom(i, 19) > 0.95;

            // Store all star data with reduced fantasy elements
            this.stars.push({
                x,
                y,
                size,
                glowRadius: size * 1.5, // Smaller glow radius (was 1.8)
                twinkleSpeed,
                twinklePhase,
                hasPulsingEffect,
                pulseSpeed,
                pulseIntensity,
                finalR,
                finalG,
                finalB,
                coreR,
                coreG,
                coreB,
                hasHalo,
                haloSize,
                haloColor,
                hasDiffraction,
                spikeLength,
                hasOctoDiffraction
            });
        }

        // Mark stars as generated
        this.starsGenerated = true;
    }

    // Draw stars in the night sky - using caching for performance
    drawStars() {
        // Calculate opacity once
        const starsAlpha = Math.max(0, (this.darknessLevel - 30) / 70);

        // Skip if stars wouldn't be visible
        if (starsAlpha <= 0.01) return;

        // Generate stars data if needed
        if (!this.starsGenerated) {
            this.generateStars();
        }

        // Get the current moon position for more accurate caching
        const currentTime = Date.now();
        const moonTimePosition = ((currentTime - this.moonStartTime) % this.moonCycleDuration) / this.moonCycleDuration;

        // Create a key that represents both darkness level and moon position
        const moonPositionBand = Math.floor(moonTimePosition * 20); // 20 discrete positions
        const currentDarknessBand = Math.floor(this.darknessLevel / 5);
        const cacheKey = `${currentDarknessBand}_${moonPositionBand}`;

        // Check if we need to regenerate the star field cache
        if (this.lastCacheKey !== cacheKey || !this.starFieldCache) {
            // Cache needs updating
            this.updateStarFieldCache(starsAlpha);
            this.lastCacheKey = cacheKey;
        }

        // Draw cached star field
        if (this.starFieldCache) {
            this.ctx.drawImage(this.starFieldCache, 0, 0);
        }
    }

    // Update the star field cache with less fantasy-style stars
    updateStarFieldCache(starsAlpha) {
        // Initialize or resize cache canvas if needed
        if (!this.starFieldCache) {
            this.starFieldCache = document.createElement('canvas');
            this.starFieldCache.width = this.canvas.width;
            this.starFieldCache.height = this.canvas.height;
        }

        // Get context of the cache canvas
        const cacheCtx = this.starFieldCache.getContext('2d', { alpha: true });

        // Clear previous content
        cacheCtx.clearRect(0, 0, this.starFieldCache.width, this.starFieldCache.height);

        // Current timestamp for animation effects
        const now = Date.now();

        // Get current moon position to hide stars that are behind the moon
        let moonX, moonY, moonRadius;
        let hasMoon = false;

        if (this.darknessLevel > 25) {
            // Calculate time-based moon position
            const elapsedTime = now - this.moonStartTime;
            const cycleProgress = (elapsedTime % this.moonCycleDuration) / this.moonCycleDuration;

            // X coordinate moves from 0.1 to 0.9 across width
            moonX = this.canvas.width * (0.1 + (0.8 * cycleProgress));

            // Y coordinate follows a parabolic arc (higher in middle)
            const arcHeight = 0.25 - (0.15 * Math.sin(cycleProgress * Math.PI));
            moonY = this.canvas.height * arcHeight;

            // Moon size plus a small buffer
            moonRadius = this.gridSize * 3;

            // Only consider moon if it's visible
            const visibilityProgress = (this.darknessLevel - 25) / 40;
            const moonAlpha = Math.min(1, Math.pow(visibilityProgress, 1.5) * 1.2);

            hasMoon = moonAlpha > 0.01;
        }

        // Draw all stars onto the cache with reduced fantasy effects
        for (const star of this.stars) {
            // Skip stars that are currently behind the moon
            if (hasMoon) {
                const distToMoon = Math.sqrt(Math.pow(star.x - moonX, 2) + Math.pow(star.y - moonY, 2));
                if (distToMoon < moonRadius) {
                    continue; // Skip this star as it's behind the moon
                }
            }

            // Calculate twinkle effect (keep only twinkle, remove pulsing)
            let effectMultiplier = Math.sin(now / star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;

            const alphaWithEffect = starsAlpha * effectMultiplier;

            // Draw special halo for legendary stars (with reduced intensity)
            if (star.hasHalo) {
                const haloGradient = cacheCtx.createRadialGradient(
                    star.x, star.y, star.size * 0.5,
                    star.x, star.y, star.haloSize
                );

                // Create ethereal glow effect with reduced opacity
                haloGradient.addColorStop(0, `rgba(${star.haloColor.r}, ${star.haloColor.g}, ${star.haloColor.b}, ${alphaWithEffect * 0.4})`);
                haloGradient.addColorStop(0.7, `rgba(${star.haloColor.r}, ${star.haloColor.g}, ${star.haloColor.b}, ${alphaWithEffect * 0.15})`);
                haloGradient.addColorStop(1, `rgba(${star.haloColor.r}, ${star.haloColor.g}, ${star.haloColor.b}, 0)`);

                cacheCtx.fillStyle = haloGradient;
                cacheCtx.beginPath();
                cacheCtx.arc(star.x, star.y, star.haloSize, 0, Math.PI * 2);
                cacheCtx.fill();
            }

            // Draw basic star with gradient
            const gradient = cacheCtx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.glowRadius
            );

            gradient.addColorStop(0, `rgba(${star.coreR}, ${star.coreG}, ${star.coreB}, ${alphaWithEffect})`);
            gradient.addColorStop(0.5, `rgba(${star.finalR}, ${star.finalG}, ${star.finalB}, ${alphaWithEffect})`);
            gradient.addColorStop(1, `rgba(${star.finalR}, ${star.finalG}, ${star.finalB}, 0)`);

            cacheCtx.fillStyle = gradient;
            cacheCtx.beginPath();
            cacheCtx.arc(star.x, star.y, star.glowRadius, 0, Math.PI * 2);
            cacheCtx.fill();

            // Add diffraction spikes for brighter stars
            if (star.hasDiffraction) {
                cacheCtx.save();

                // Star color but more transparent for light rays
                cacheCtx.strokeStyle = `rgba(${star.finalR}, ${star.finalG}, ${star.finalB}, ${alphaWithEffect * 0.7})`;
                cacheCtx.lineWidth = 0.8;

                // Draw 4-point diffraction spike
                cacheCtx.beginPath();
                cacheCtx.moveTo(star.x - star.spikeLength, star.y);
                cacheCtx.lineTo(star.x + star.spikeLength, star.y);
                cacheCtx.stroke();

                cacheCtx.beginPath();
                cacheCtx.moveTo(star.x, star.y - star.spikeLength);
                cacheCtx.lineTo(star.x, star.y + star.spikeLength);
                cacheCtx.stroke();

                // Draw 8-point diffraction for larger stars
                if (star.hasOctoDiffraction) {
                    const diagonalLength = star.spikeLength * 0.7;
                    const offset = diagonalLength / Math.sqrt(2);

                    cacheCtx.lineWidth = 0.6;
                    cacheCtx.beginPath();
                    cacheCtx.moveTo(star.x - offset, star.y - offset);
                    cacheCtx.lineTo(star.x + offset, star.y + offset);
                    cacheCtx.stroke();

                    cacheCtx.beginPath();
                    cacheCtx.moveTo(star.x - offset, star.y + offset);
                    cacheCtx.lineTo(star.x + offset, star.y - offset);
                    cacheCtx.stroke();
                }

                cacheCtx.restore();
            }
        }
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
