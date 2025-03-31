class StarfieldManager {
    constructor(pixelRatio = 1) {
        this.starFieldCache = null;
        this.stars = [];
        this.pixelRatio = pixelRatio;
        this.lastRenderTime = 0;
        this.renderInterval = 2000; // Render stars every 2 seconds
        this.lastCanvasSize = null;

        // Default star color (white) in case a star doesn't have one
        this.defaultColor = { r: 255, g: 255, b: 255 };

        // Star movement properties
        this.movementStartTime = Date.now();
        this.movementCycleDuration = 1800000; // 30 minutes for a full star cycle (much slower than moon's 2 minutes)
    }

    updatePixelRatio(pixelRatio) {
        this.pixelRatio = pixelRatio;
        this.starFieldCache = null;
        this.stars = [];
        this.lastCanvasSize = null; // Reset canvas size tracking
    }

    generateStars(canvas) {
        try {
            this.stars = [];

            // Get visual dimensions
            const width = canvas.width / this.pixelRatio;
            const height = canvas.height / this.pixelRatio;

            // Use a constant 100 stars
            const count = 100;
            console.log(`Generating ${count} stars`);

            // Calculate base star size proportional to canvas size
            // Using width as reference since you mentioned width and height are equal
            const baseSizeMultiplier = width * 0.001; // 0.1% of width as base size unit

            // Generate stars with completely random positions across the canvas
            for (let i = 0; i < count; i++) {
                // Generate random position with padding from edges (5%)
                const padding = width * 0.05;
                const x = padding + Math.random() * (width - padding * 2);
                const y = padding + Math.random() * (height - padding * 2);

                // Additional random properties for movement
                const movementSpeed = 0.1 + Math.random() * 0.3; // Speed variation between 0.1-0.4
                const movementPhase = Math.random() * Math.PI * 2; // Different starting phases

                // Size distribution - with bigger stars
                const sizeBase = Math.random();
                let sizeMultiplier;
                let starType = 'regular';

                // Create variety in star sizes with some truly big ones
                if (sizeBase > 0.97) {
                    // Legendary stars (3%)
                    sizeMultiplier = 2.0 + sizeBase * 0.5; // 2.0-2.5 range
                    starType = 'legendary';
                } else if (sizeBase > 0.9) {
                    // Large stars (7%)
                    sizeMultiplier = 1.8 + sizeBase * 0.2; // 1.8-2.0 range
                    starType = 'large';
                } else if (sizeBase > 0.7) {
                    // Medium stars (20%)
                    sizeMultiplier = 1.5 + sizeBase * 0.3; // 1.5-1.8 range
                    starType = 'medium';
                } else {
                    // Small stars (70%)
                    sizeMultiplier = 1.2 + sizeBase * 0.3; // 1.2-1.5 range
                }

                // Calculate final size based on canvas dimensions
                const size = baseSizeMultiplier * sizeMultiplier;

                // Twinkle effect
                const twinkleSpeed = 500 + Math.random() * 1500;
                const twinklePhase = Math.random() * Math.PI * 2;

                // Create truly random star colors instead of using palettes
                // This provides much better color distribution
                let finalColor = {};

                // Generate random color based on star type
                if (starType === 'legendary') {
                    // For legendary stars: Create vibrant, saturated colors
                    // Emphasize one or two channels for more saturation
                    const primaryChannel = Math.floor(Math.random() * 3); // 0, 1, or 2 (R, G, or B)

                    // Generate base components with one dominant channel
                    finalColor.r = Math.floor(Math.random() * 100) + (primaryChannel === 0 ? 155 : 50);
                    finalColor.g = Math.floor(Math.random() * 100) + (primaryChannel === 1 ? 155 : 50);
                    finalColor.b = Math.floor(Math.random() * 100) + (primaryChannel === 2 ? 155 : 50);

                    // Add extra brightness to make legendary stars stand out
                    finalColor.r = Math.min(255, finalColor.r + 50);
                    finalColor.g = Math.min(255, finalColor.g + 50);
                    finalColor.b = Math.min(255, finalColor.b + 50);
                }
                else if (Math.random() > 0.6) {
                    // 40% of normal stars get interesting colors
                    // Create a range of saturated but softer colors
                    const baseValue = Math.floor(Math.random() * 100) + 100; // 100-199
                    const variance1 = Math.floor(Math.random() * 155); // 0-154
                    const variance2 = Math.floor(Math.random() * 155); // 0-154

                    // Randomly assign the base and variances to create color bias
                    const colorPattern = Math.floor(Math.random() * 6); // 0-5

                    switch (colorPattern) {
                        case 0: // Red-dominant
                            finalColor = { r: baseValue + variance1, g: baseValue - variance2, b: baseValue };
                            break;
                        case 1: // Green-dominant
                            finalColor = { r: baseValue, g: baseValue + variance1, b: baseValue - variance2 };
                            break;
                        case 2: // Blue-dominant
                            finalColor = { r: baseValue - variance2, g: baseValue, b: baseValue + variance1 };
                            break;
                        case 3: // Yellow-dominant (red+green)
                            finalColor = { r: baseValue + variance1, g: baseValue + variance1, b: baseValue - variance2 };
                            break;
                        case 4: // Cyan-dominant (green+blue)
                            finalColor = { r: baseValue - variance2, g: baseValue + variance1, b: baseValue + variance1 };
                            break;
                        case 5: // Magenta-dominant (red+blue)
                            finalColor = { r: baseValue + variance1, g: baseValue - variance2, b: baseValue + variance1 };
                            break;
                    }
                }
                else {
                    // 60% are white-ish stars with subtle tinting
                    const baseWhite = 180 + Math.floor(Math.random() * 75); // 180-255 base brightness
                    const tint = Math.floor(Math.random() * 30); // 0-29 tint amount

                    // Random tint direction
                    const tintType = Math.floor(Math.random() * 6);

                    // Create white with slight tint in different directions
                    switch (tintType) {
                        case 0: // Warm white (red tint)
                            finalColor = { r: Math.min(255, baseWhite + tint), g: baseWhite, b: Math.max(140, baseWhite - tint) };
                            break;
                        case 1: // Cool white (blue tint)
                            finalColor = { r: Math.max(140, baseWhite - tint), g: baseWhite, b: Math.min(255, baseWhite + tint) };
                            break;
                        case 2: // Green tint
                            finalColor = { r: Math.max(140, baseWhite - tint), g: Math.min(255, baseWhite + tint), b: Math.max(140, baseWhite - tint) };
                            break;
                        case 3: // Pure white
                            finalColor = { r: baseWhite, g: baseWhite, b: baseWhite };
                            break;
                        case 4: // Slight yellow
                            finalColor = { r: Math.min(255, baseWhite + tint), g: Math.min(255, baseWhite + tint), b: Math.max(140, baseWhite - tint) };
                            break;
                        case 5: // Slight purple
                            finalColor = { r: Math.min(255, baseWhite + tint), g: Math.max(140, baseWhite - tint), b: Math.min(255, baseWhite + tint) };
                            break;
                    }
                }

                // Ensure all color values are within valid range
                finalColor.r = Math.min(255, Math.max(0, Math.floor(finalColor.r)));
                finalColor.g = Math.min(255, Math.max(0, Math.floor(finalColor.g)));
                finalColor.b = Math.min(255, Math.max(0, Math.floor(finalColor.b)));

                // Make large stars brighter
                if (starType === 'large') {
                    finalColor.r = Math.min(255, finalColor.r + 30);
                    finalColor.g = Math.min(255, finalColor.g + 30);
                    finalColor.b = Math.min(255, finalColor.b + 30);
                }

                // Calculate effects based on star type
                const hasDiffraction = starType === 'legendary' || (starType === 'large' && Math.random() > 0.8);
                const hasOctoDiffraction = starType === 'legendary';
                const glowSize =
                    starType === 'legendary' ? size * 1.6 :
                        starType === 'large' ? size * 1.2 :
                            starType === 'medium' ? size * 1.0 :
                                size * 0.8;

                // Calculate maximum visual radius for boundary checking
                const maxVisualRadius = Math.max(
                    glowSize,
                    hasDiffraction ? size * 3 : 0
                );

                // Ensure the star is fully within the canvas boundaries with proper padding
                // Adjust x and y coordinates to keep effects within bounds
                const adjustedX = Math.min(Math.max(maxVisualRadius, x), width - maxVisualRadius);
                const adjustedY = Math.min(Math.max(maxVisualRadius, y), height - maxVisualRadius);

                // Store star data with complete properties
                this.stars.push({
                    x: adjustedX,
                    y: adjustedY,
                    size: size * this.pixelRatio, // Adjust for retina
                    twinkleSpeed,
                    twinklePhase,
                    color: finalColor,
                    starType,
                    glowSize: glowSize * this.pixelRatio,
                    hasDiffraction,
                    hasOctoDiffraction,
                    diffractionLength: size * (hasDiffraction ? 3 : 0) * this.pixelRatio,
                    movementSpeed,
                    movementPhase,
                    initialX: adjustedX,
                    initialY: adjustedY
                });
            }

            // Verify stars have proper colors
            this.stars = this.stars.map(star => {
                if (!star.color) {
                    star.color = this.defaultColor;
                }
                return star;
            });

            console.log(`Generated ${this.stars.length} stars for canvas ${width}x${height}`);
        } catch (error) {
            console.error("Error generating stars:", error);
        }
    }

    // Update star positions based on movement cycle
    updateStarPositions(canvas) {
        if (!canvas || !canvas.width || !canvas.height || this.stars.length === 0) return;

        try {
            const width = canvas.width / this.pixelRatio;
            const height = canvas.height / this.pixelRatio;
            const currentTime = Date.now();
            const elapsedTime = currentTime - this.movementStartTime;

            // Calculate overall cycle progress (0-1)
            const cycleProgress = (elapsedTime % this.movementCycleDuration) / this.movementCycleDuration;

            // Update each star's position
            this.stars.forEach((star, index) => {
                if (!star) return;

                // Calculate individual movement based on star's properties
                // Each star moves at a slightly different speed and phase
                const starProgress = (cycleProgress + (star.movementPhase || 0)) % 1;

                // X coordinate moves from left to right across width
                const moveX = width * (0.1 + (0.8 * starProgress)) * (star.movementSpeed || 0.1);

                // Y coordinate follows a simple sine wave arc (higher in middle)
                const amplitude = height * 0.08; // Reduced amplitude for more subtle movement
                const moveY = amplitude * Math.sin(starProgress * Math.PI);

                // Apply movement relative to initial position
                // For x, we want to wrap around when it goes off screen
                star.x = ((star.initialX || 0) + moveX) % width;

                // For y, we move up and down relative to initial position
                star.y = (star.initialY || 0) - moveY;

                // Regenerate stars that go off the right edge of the screen
                // This creates the illusion of continuous star movement
                if (star.x > width * 0.95 && starProgress > 0.9) {
                    // Move star to the left edge with a new random y position
                    star.initialX = width * 0.05;
                    star.initialY = Math.random() * height * 0.8;
                    star.x = star.initialX;
                    star.y = star.initialY;

                    // Also give it a new movement phase for variety
                    star.movementPhase = Math.random() * 0.2; // Small phase at the beginning
                }
            });
        } catch (error) {
            console.error("Error updating star positions:", error);
            // Silently recover - we don't want to break the game if star movement fails
        }
    }

    drawStars(ctx, canvas, darknessLevel, moonPosition = null) {
        try {
            // Validate inputs
            if (!ctx || !canvas || !canvas.width || !canvas.height) return;

            // Skip if too bright
            const alpha = Math.max(0, (darknessLevel - 30) / 70);
            if (alpha <= 0.01) return;

            // Only generate stars if needed (first time or after canvas resize)
            const canvasSize = `${canvas.width}x${canvas.height}`;
            if (!this.stars || this.stars.length === 0 || this.lastCanvasSize !== canvasSize) {
                console.log("Generating new stars due to empty array or canvas size change");
                this.lastCanvasSize = canvasSize;
                this.generateStars(canvas);
            }

            // Update star positions for movement
            this.updateStarPositions(canvas);

            // Check if we need to update the cache
            const now = Date.now();
            const cacheKey = `${Math.floor(darknessLevel / 5)}_${canvas.width}_${canvas.height}`;
            const needsUpdate =
                !this.starFieldCache ||
                this.starFieldCache.width !== canvas.width ||
                this.starFieldCache.height !== canvas.height ||
                now - this.lastRenderTime > this.renderInterval;

            // Update star cache if needed
            if (needsUpdate) {
                this.updateStarCache(ctx, canvas, alpha, moonPosition);
                this.lastRenderTime = now;
            }

            // Draw cached stars
            if (this.starFieldCache) {
                ctx.drawImage(this.starFieldCache, 0, 0);
            }
        } catch (error) {
            console.error("Error in drawStars:", error);
        }
    }

    updateStarCache(ctx, canvas, alpha, moonPosition) {
        try {
            // Input validation
            if (!ctx || !canvas || !canvas.width || !canvas.height) return;

            // Ensure we have stars to render
            if (!this.stars || this.stars.length === 0) {
                this.generateStars(canvas);
                if (this.stars.length === 0) return; // Give up if still empty
            }

            // Create or resize cache canvas
            if (!this.starFieldCache ||
                this.starFieldCache.width !== canvas.width ||
                this.starFieldCache.height !== canvas.height) {
                this.starFieldCache = document.createElement('canvas');
                this.starFieldCache.width = canvas.width;
                this.starFieldCache.height = canvas.height;
            }

            const cacheCtx = this.starFieldCache.getContext('2d');
            if (!cacheCtx) {
                console.error("Failed to get cache canvas context");
                return;
            }

            cacheCtx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate moon data for star occlusion
            let moonX, moonY, moonRadius;
            if (moonPosition && moonPosition.x && moonPosition.y && moonPosition.radius) {
                moonX = moonPosition.x;
                moonY = moonPosition.y;
                moonRadius = moonPosition.radius;
            }

            // Current time for twinkle animation
            const now = Date.now();

            // Get visual canvas dimensions
            const visualWidth = canvas.width / this.pixelRatio;
            const visualHeight = canvas.height / this.pixelRatio;

            // Draw all stars
            this.stars.forEach(star => {
                try {
                    // Skip invalid stars
                    if (!star || typeof star.x !== 'number' || typeof star.y !== 'number') return;

                    // Get the star's maximum visual radius including glow and diffraction
                    const maxStarRadius = Math.max(
                        star.glowSize || star.size * 2,
                        star.diffractionLength || 0
                    );

                    // Skip stars that would be drawn mostly outside the canvas
                    // Allow a small buffer outside for partial glow effects
                    if (star.x < -maxStarRadius ||
                        star.x > visualWidth + maxStarRadius ||
                        star.y < -maxStarRadius ||
                        star.y > visualHeight + maxStarRadius) {
                        return;
                    }

                    // Skip stars behind moon - now using the total visual radius of the star
                    if (moonPosition) {
                        const dx = star.x - moonX;
                        const dy = star.y - moonY;
                        // Use squared distance comparison for efficiency
                        // Add a small buffer (0.9) to ensure no visible artifacts at edges
                        const moonSquaredRadius = moonRadius * moonRadius * 0.9;

                        // Calculate the size of the star's core for occlusion testing
                        // For smaller stars we use a tighter occlusion boundary, for larger stars we need more space
                        let occlusionRadius = 0;

                        // For legendary stars with diffraction spikes, we need a larger occlusion radius
                        if (star.starType === 'legendary') {
                            occlusionRadius = moonRadius * 0.2; // Add buffer for legendary stars
                        } else if (star.starType === 'large') {
                            occlusionRadius = moonRadius * 0.1; // Add buffer for large stars
                        }

                        // Use adjusted squared distance to account for star's visual size
                        if (dx * dx + dy * dy < moonSquaredRadius + occlusionRadius) return;
                    }

                    // Calculate twinkle effect
                    const twinkleSpeed = star.twinkleSpeed || 1000;
                    const twinklePhase = star.twinklePhase || 0;
                    const twinkle = Math.sin(now / twinkleSpeed + twinklePhase) * 0.3 + 0.7;
                    const finalAlpha = alpha * twinkle;

                    // Get star color with fallback to default white
                    const starColor = star.color || this.defaultColor;
                    const r = starColor.r || 255;
                    const g = starColor.g || 255;
                    const b = starColor.b || 255;

                    // Draw star glow
                    const glowSize = star.glowSize || star.size * 2;
                    const gradient = cacheCtx.createRadialGradient(
                        star.x, star.y, 0,
                        star.x, star.y, glowSize
                    );

                    // Adjust gradient based on star type
                    if (star.starType === 'legendary') {
                        // Legendary stars get intense glow
                        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalAlpha})`);
                        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${finalAlpha * 0.8})`);
                        gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${finalAlpha * 0.3})`);
                        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                    } else {
                        // Normal glow for other stars
                        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalAlpha})`);
                        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${finalAlpha * 0.6})`);
                        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                    }

                    cacheCtx.fillStyle = gradient;
                    cacheCtx.beginPath();
                    cacheCtx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
                    cacheCtx.fill();

                    // Add bright core for all stars
                    cacheCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
                    cacheCtx.beginPath();
                    cacheCtx.arc(star.x, star.y, star.size * 0.7, 0, Math.PI * 2);
                    cacheCtx.fill();

                    // Draw diffraction spikes for large/legendary stars
                    if (star.hasDiffraction) {
                        cacheCtx.save();

                        // Star color but more transparent for light rays
                        cacheCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha * 0.7})`;
                        cacheCtx.lineWidth = star.starType === 'legendary' ? 1.5 : 0.8;

                        const spikeLength = star.diffractionLength || star.size * 3;

                        // Draw 4-point diffraction spike
                        cacheCtx.beginPath();
                        cacheCtx.moveTo(star.x - spikeLength, star.y);
                        cacheCtx.lineTo(star.x + spikeLength, star.y);
                        cacheCtx.stroke();

                        cacheCtx.beginPath();
                        cacheCtx.moveTo(star.x, star.y - spikeLength);
                        cacheCtx.lineTo(star.x, star.y + spikeLength);
                        cacheCtx.stroke();

                        // Draw 8-point diffraction for legendary stars
                        if (star.hasOctoDiffraction) {
                            const diagonalLength = spikeLength * 0.7;
                            const offset = diagonalLength / Math.sqrt(2);

                            cacheCtx.lineWidth = 0.8;
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
                } catch (starError) {
                    console.error("Error processing individual star:", starError);
                    // Continue with other stars
                }
            });
        } catch (error) {
            console.error("Error in updateStarCache:", error);
            // Prevent errors from breaking the game completely
        }
    }
}

window.StarfieldManager = StarfieldManager;
