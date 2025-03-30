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
            
            // Enhanced color palette with vibrant and legendary colors
            const colors = {
                // Standard whites (60% chance)
                standard: [
                    { r: 255, g: 255, b: 255 }, // Pure white
                    { r: 255, g: 255, b: 240 }, // Warm white
                    { r: 240, g: 250, b: 255 }, // Cool white
                    { r: 220, g: 235, b: 255 }  // Slight blue white
                ],
                // Colorful stars (30% chance)
                colorful: [
                    { r: 255, g: 220, b: 180 }, // Gold
                    { r: 255, g: 200, b: 200 }, // Pink
                    { r: 200, g: 220, b: 255 }, // Light blue
                    { r: 220, g: 255, b: 220 }, // Light green
                    { r: 255, g: 220, b: 160 }, // Yellow
                    { r: 230, g: 200, b: 255 }  // Lavender
                ],
                // Legendary stars (10% chance) - more vibrant colors
                legendary: [
                    { r: 255, g: 150, b: 150 }, // Bright red
                    { r: 150, g: 255, b: 150 }, // Bright green
                    { r: 150, g: 150, b: 255 }, // Bright blue
                    { r: 255, g: 200, b: 100 }, // Orange
                    { r: 255, g: 100, b: 255 }, // Magenta
                    { r: 100, g: 255, b: 255 }  // Cyan
                ]
            };
            
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
                
                // Size distribution - with bigger stars
                const sizeBase = random(totalStars, 3);
                let size;
                let starType = 'regular';
                
                // Create variety in star sizes with some truly big ones
                if (sizeBase > 0.97) {
                    // Legendary stars (3%)
                    size = 3.0 + sizeBase * 1.0; // 3.0-4.0 range
                    starType = 'legendary';
                } else if (sizeBase > 0.9) {
                    // Large stars (7%)
                    size = 2.5 + sizeBase * 0.5; // 2.5-3.0 range
                    starType = 'large';
                } else if (sizeBase > 0.7) {
                    // Medium stars (20%)
                    size = 2.0 + sizeBase * 0.3; // 2.0-2.3 range
                    starType = 'medium';
                } else {
                    // Small stars (70%)
                    size = 2.0; // All small stars exactly 2.0 pixels
                }
                
                // Twinkle effect
                const twinkleSpeed = 500 + random(totalStars, 4) * 1500;
                const twinklePhase = random(totalStars, 5) * Math.PI * 2;
                
                // Color selection with more variety
                const colorType = random(totalStars, 6);
                let colorPalette, baseColor;
                
                // Select from different color palettes based on probability
                if (colorType > 0.9 || starType === 'legendary') {
                    // Legendary colors (10% chance, or always for legendary stars)
                    colorPalette = colors.legendary;
                } else if (colorType > 0.6) {
                    // Colorful stars (30% chance)
                    colorPalette = colors.colorful;
                } else {
                    // Standard white-ish stars (60% chance)
                    colorPalette = colors.standard;
                }
                
                // Pick a color from the selected palette
                const colorIndex = Math.floor(random(totalStars, 7) * colorPalette.length);
                baseColor = colorPalette[colorIndex];
                
                // For larger stars, make them brighter
                let finalColor = { ...baseColor };
                if (starType === 'legendary' || starType === 'large') {
                    // Boost brightness for large/legendary stars
                    finalColor.r = Math.min(255, finalColor.r + 30);
                    finalColor.g = Math.min(255, finalColor.g + 30);
                    finalColor.b = Math.min(255, finalColor.b + 30);
                }
                
                // Calculate effects based on star type
                const hasDiffraction = starType === 'legendary' || (starType === 'large' && random(totalStars, 8) > 0.7);
                const hasOctoDiffraction = starType === 'legendary';
                const glowSize = 
                    starType === 'legendary' ? size * 3 : 
                    starType === 'large' ? size * 2 : 
                    starType === 'medium' ? size * 1.5 : 
                    size * 1.2;
                    
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
                    diffractionLength: size * (hasDiffraction ? 3 : 0) * this.pixelRatio
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
                glowSize: 3 * this.pixelRatio
            });
        }
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