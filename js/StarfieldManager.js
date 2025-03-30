class StarfieldManager {
    constructor() {
        // Cache system
        this.starFieldCache = null;
        this.lastCacheKey = null;
        this.stars = []; // Pre-calculated star data
        this.starsGenerated = false;
    }

    // Generate star data - only called once or when canvas size changes
    generateStars(canvas) {
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
        const numStars = Math.floor(canvas.width * canvas.height / 1200); // Fewer stars

        // Pre-generate all star data with fantasy enhancements
        for (let i = 0; i < numStars; i++) {
            // Use multiple offsets to break any potential patterns
            const x = pseudoRandom(i, 1) * canvas.width;
            const y = pseudoRandom(i, 2) * canvas.height * 0.8; // Keep stars in upper 80% of sky

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
                // Legendary stars (2%) - rare special colors
                const legendaryIndex = Math.floor(pseudoRandom(i, 15) * starColors.legendary.length);
                starColorObj = starColors.legendary[legendaryIndex];
            } else if (colorType > 0.92) {
                // Fantasy colors (6%) - fewer magical colors
                const fantasyIndex = Math.floor(pseudoRandom(i, 8) * starColors.fantasy.length);
                starColorObj = starColors.fantasy[fantasyIndex];
            } else if (colorType > 0.82) {
                // Warm colors (10%)
                const warmIndex = Math.floor(pseudoRandom(i, 9) * starColors.warm.length);
                starColorObj = starColors.warm[warmIndex];
            } else if (colorType > 0.72) {
                // Cool colors (10%)
                const coolIndex = Math.floor(pseudoRandom(i, 10) * starColors.cool.length);
                starColorObj = starColors.cool[coolIndex];
            } else {
                // Neutral colors (72%) - more white/blue-white stars
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
                glowRadius: size * 1.5, // Smaller glow radius
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
    drawStars(ctx, canvas, darknessLevel, moonPosition = null) {
        // Calculate opacity once
        const starsAlpha = Math.max(0, (darknessLevel - 30) / 70);

        // Skip if stars wouldn't be visible
        if (starsAlpha <= 0.01) return;

        // Generate stars data if needed
        if (!this.starsGenerated) {
            this.generateStars(canvas);
        }

        // Get the current moon time position for more accurate caching
        let moonPositionBand = 0;
        if (moonPosition) {
            // 20 discrete positions for smoother animation
            moonPositionBand = Math.floor((moonPosition.progress || 0) * 20);
        }

        // Create a key that represents both darkness level and moon position
        const currentDarknessBand = Math.floor(darknessLevel / 5);
        const cacheKey = `${currentDarknessBand}_${moonPositionBand}`;

        // Check if we need to regenerate the star field cache
        if (this.lastCacheKey !== cacheKey || !this.starFieldCache || 
            this.starFieldCache.width !== canvas.width || 
            this.starFieldCache.height !== canvas.height) {
            // Cache needs updating
            this.updateStarFieldCache(ctx, canvas, starsAlpha, moonPosition);
            this.lastCacheKey = cacheKey;
        }

        // Draw cached star field
        if (this.starFieldCache) {
            ctx.drawImage(this.starFieldCache, 0, 0);
        }
    }

    // Update the star field cache with less fantasy-style stars
    updateStarFieldCache(ctx, canvas, starsAlpha, moonPosition) {
        // Initialize or resize cache canvas if needed
        if (!this.starFieldCache || 
            this.starFieldCache.width !== canvas.width || 
            this.starFieldCache.height !== canvas.height) {
            this.starFieldCache = document.createElement('canvas');
            this.starFieldCache.width = canvas.width;
            this.starFieldCache.height = canvas.height;
        }

        // Get context of the cache canvas
        const cacheCtx = this.starFieldCache.getContext('2d', { alpha: true });

        // Clear previous content
        cacheCtx.clearRect(0, 0, this.starFieldCache.width, this.starFieldCache.height);

        // Current timestamp for animation effects
        const now = Date.now();

        // Extract moon position if provided
        let moonX, moonY, moonRadius;
        let hasMoon = false;

        if (moonPosition && moonPosition.x && moonPosition.y && moonPosition.radius) {
            moonX = moonPosition.x;
            moonY = moonPosition.y;
            moonRadius = moonPosition.radius;
            hasMoon = true;
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
}

// Export the class
window.StarfieldManager = StarfieldManager; 