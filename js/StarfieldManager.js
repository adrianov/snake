class StarfieldManager {
    constructor(pixelRatio = 1) {
        this.starFieldCache = null;
        this.stars = [];
        this.pixelRatio = pixelRatio;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.lastRenderTime = 0;
        this.renderInterval = 2000; // Render stars every 2 seconds
        
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
    }

    generateStars(canvas) {
        try {
            this.stars = [];
            
            // Get visual dimensions
            const width = canvas.width / this.pixelRatio;
            const height = canvas.height / this.pixelRatio;
            
            // Generate deterministic random stars
            const seed = 12345;
            const random = (i, offset) => Math.sin(i * 12.9898 + offset * 78.233) * 43758.5453 % 1;
            
            // Limit total number of stars to 100
            const count = Math.min(100, Math.floor(width * height / (this.isMobile ? 700 : 400)));
            console.log(`Generating ${count} stars`);
            
            // Distribute stars more evenly using grid sectors
            // Divide canvas into a grid of cells for more even distribution
            const gridCols = 10;
            const gridRows = 10;
            const cellWidth = width / gridCols;
            const cellHeight = height / gridRows;
            
            // Calculate stars per cell (approximately)
            const starsPerCell = Math.ceil(count / (gridCols * gridRows));
            const cells = [];
            
            // Initialize grid cells
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    cells.push({
                        row,
                        col,
                        starsAssigned: 0,
                        maxStars: starsPerCell
                    });
                }
            }
            
            // Shuffle cells for random assignment
            for (let i = cells.length - 1; i > 0; i--) {
                const j = Math.floor(random(i, 0) * (i + 1));
                [cells[i], cells[j]] = [cells[j], cells[i]];
            }
            
            // Generate stars
            let starIndex = 0;
            let totalStars = 0;
            
            while (totalStars < count && starIndex < cells.length) {
                const cell = cells[starIndex % cells.length];
                
                // Skip cells that already have their maximum stars
                if (cell.starsAssigned >= cell.maxStars) {
                    starIndex++;
                    continue;
                }
                
                // Position within this cell with padding
                const padding = 0.1; // 10% padding from cell edges
                const xMin = cell.col * cellWidth + cellWidth * padding;
                const xMax = (cell.col + 1) * cellWidth - cellWidth * padding;
                const yMin = cell.row * cellHeight + cellHeight * padding;
                const yMax = (cell.row + 1) * cellHeight - cellHeight * padding;
                
                // Generate position with jitter within the cell
                const x = xMin + random(totalStars, 1) * (xMax - xMin);
                const y = yMin + random(totalStars, 2) * (yMax - yMin);
                
                // Additional random properties for movement
                const movementSpeed = 0.1 + random(totalStars, 9) * 0.3; // Speed variation between 0.1-0.4 (much slower)
                const movementPhase = random(totalStars, 9.5) * Math.PI * 2; // Different starting phases
                
                // Size distribution - with bigger stars
                const sizeBase = random(totalStars, 3);
                let size;
                let starType = 'regular';
                
                // Create variety in star sizes with some truly big ones
                if (sizeBase > 0.97) {
                    // Legendary stars (3%)
                    size = 2.0 + sizeBase * 0.5; // 2.0-2.5 range (reduced from 2.5-3.0)
                    starType = 'legendary';
                } else if (sizeBase > 0.9) {
                    // Large stars (7%)
                    size = 1.8 + sizeBase * 0.2; // 1.8-2.0 range (reduced from 2.2-2.5)
                    starType = 'large';
                } else if (sizeBase > 0.7) {
                    // Medium stars (20%)
                    size = 1.5 + sizeBase * 0.3; // 1.5-1.8 range (reduced from 2.0-2.2)
                    starType = 'medium';
                } else {
                    // Small stars (70%)
                    size = 1.2 + sizeBase * 0.3; // 1.2-1.5 range (reduced from fixed 2.0)
                }
                
                // Twinkle effect
                const twinkleSpeed = 500 + random(totalStars, 4) * 1500;
                const twinklePhase = random(totalStars, 5) * Math.PI * 2;
                
                // Create truly random star colors instead of using palettes
                // This provides much better color distribution
                let finalColor = {};
                
                // Generate random color based on star type
                if (starType === 'legendary') {
                    // For legendary stars: Create vibrant, saturated colors
                    // Emphasize one or two channels for more saturation
                    const primaryChannel = Math.floor(random(totalStars, 6.1) * 3); // 0, 1, or 2 (R, G, or B)
                    
                    // Generate base components with one dominant channel
                    finalColor.r = Math.floor(random(totalStars, 6.2) * 100) + (primaryChannel === 0 ? 155 : 50);
                    finalColor.g = Math.floor(random(totalStars, 6.3) * 100) + (primaryChannel === 1 ? 155 : 50);
                    finalColor.b = Math.floor(random(totalStars, 6.4) * 100) + (primaryChannel === 2 ? 155 : 50);
                    
                    // Add extra brightness to make legendary stars stand out
                    finalColor.r = Math.min(255, finalColor.r + 50);
                    finalColor.g = Math.min(255, finalColor.g + 50);
                    finalColor.b = Math.min(255, finalColor.b + 50);
                } 
                else if (random(totalStars, 6.5) > 0.6) {
                    // 40% of normal stars get interesting colors
                    // Create a range of saturated but softer colors
                    const baseValue = Math.floor(random(totalStars, 6.6) * 100) + 100; // 100-199
                    const variance1 = Math.floor(random(totalStars, 6.7) * 155); // 0-154
                    const variance2 = Math.floor(random(totalStars, 6.8) * 155); // 0-154
                    
                    // Randomly assign the base and variances to create color bias
                    const colorPattern = Math.floor(random(totalStars, 6.9) * 6); // 0-5
                    
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
                    const baseWhite = 180 + Math.floor(random(totalStars, 6.91) * 75); // 180-255 base brightness
                    const tint = Math.floor(random(totalStars, 6.92) * 30); // 0-29 tint amount
                    
                    // Random tint direction
                    const tintType = Math.floor(random(totalStars, 6.93) * 6);
                    
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
                const hasDiffraction = starType === 'legendary' || (starType === 'large' && random(totalStars, 8) > 0.8); // Further reduced chance
                const hasOctoDiffraction = starType === 'legendary';
                const glowSize = 
                    starType === 'legendary' ? size * 1.6 : // Reduced from 2.0
                    starType === 'large' ? size * 1.2 : // Reduced from 1.5
                    starType === 'medium' ? size * 1.0 : // Reduced from 1.2
                    size * 0.8; // Reduced from 1.0
                    
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
                
                // Update cell stats
                cell.starsAssigned++;
                totalStars++;
                starIndex++;
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
            // Create a minimal set of stars as fallback
            this.createFallbackStars(canvas);
        }
    }
    
    // Create a minimal set of stars if normal generation fails
    createFallbackStars(canvas) {
        const width = canvas.width / this.pixelRatio;
        const height = canvas.height / this.pixelRatio;
        const count = 50; // Just a few stars for fallback
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * (height * 0.8);
            
            this.stars.push({
                x,
                y,
                size: 1.5 * this.pixelRatio,
                twinkleSpeed: 1000,
                twinklePhase: Math.random() * Math.PI * 2,
                color: this.defaultColor,
                starType: 'regular',
                glowSize: 3 * this.pixelRatio,
                initialX: x,
                initialY: y,
                movementSpeed: 0.1 + Math.random() * 0.3, // Slower speed for fallback stars too
                movementPhase: Math.random() * Math.PI * 2
            });
        }
    }

    // Update star positions based on movement cycle
    updateStarPositions(canvas) {
        if (this.stars.length === 0) return;
        
        const width = canvas.width / this.pixelRatio;
        const height = canvas.height / this.pixelRatio;
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.movementStartTime;
        
        // Calculate overall cycle progress (0-1)
        const cycleProgress = (elapsedTime % this.movementCycleDuration) / this.movementCycleDuration;
        
        // Update each star's position
        this.stars.forEach((star, index) => {
            // Calculate individual movement based on star's properties
            // Each star moves at a slightly different speed and phase
            const starProgress = (cycleProgress + star.movementPhase) % 1;
            
            // X coordinate moves from left to right across width
            const moveX = width * (0.1 + (0.8 * starProgress)) * star.movementSpeed;
            
            // Y coordinate follows a simple sine wave arc (higher in middle)
            const amplitude = height * 0.08; // Reduced amplitude for more subtle movement
            const moveY = amplitude * Math.sin(starProgress * Math.PI);
            
            // Apply movement relative to initial position
            // For x, we want to wrap around when it goes off screen
            star.x = (star.initialX + moveX) % width;
            
            // For y, we move up and down relative to initial position
            star.y = star.initialY - moveY;
            
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
    }

    drawStars(ctx, canvas, darknessLevel, moonPosition = null) {
        try {
            // Skip if too bright
            const alpha = Math.max(0, (darknessLevel - 30) / 70);
            if (alpha <= 0.01) return;
            
            // Generate stars if needed
            if (this.stars.length === 0) {
                this.generateStars(canvas);
            }
            
            // Update star positions for movement
            this.updateStarPositions(canvas);
            
            // Check if we need to update the cache
            const now = Date.now();
            const cacheKey = `${Math.floor(darknessLevel/5)}_${canvas.width}_${canvas.height}`;
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
            // Silently recover - don't let star errors crash the game
        }
    }
    
    updateStarCache(ctx, canvas, alpha, moonPosition) {
        try {
            // Create or resize cache canvas
            if (!this.starFieldCache || 
                this.starFieldCache.width !== canvas.width || 
                this.starFieldCache.height !== canvas.height) {
                this.starFieldCache = document.createElement('canvas');
                this.starFieldCache.width = canvas.width;
                this.starFieldCache.height = canvas.height;
            }
            
            const cacheCtx = this.starFieldCache.getContext('2d');
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
                        if (dx*dx + dy*dy < moonSquaredRadius + occlusionRadius) return;
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