/**
 * js/NewMoonDrawer.js
 * A simplified moon renderer using overlaid shapes.
 * - Draws only the visible lit portion of the moon.
 * - Handles basic phases (crescent, gibbous, full).
 * - Includes a subtle glow.
 */
class NewMoonDrawer {
    constructor(pixelRatio = 1) {
        this.pixelRatio = pixelRatio;
        // Enhanced colors for more natural look
        this.moonColorLight = 'rgb(240, 240, 230)';
        this.glowColor = 'rgba(220, 235, 255, 0.15)';

        // Phase calculation properties from MoonDrawer
        this.referenceNewMoon = new Date('2000-01-06T18:14:00Z');
        this.synodicPeriod = 29.53059; // days
        this.currentDate = new Date(); // Start with today
    }

    updatePixelRatio(pixelRatio) {
        this.pixelRatio = pixelRatio;
    }

    // Calculate the current moon phase (0-1)
    calculatePhase(date) {
        const refTimestamp = this.referenceNewMoon.getTime();
        const currentTimestamp = date.getTime();
        const daysSinceRefNewMoon = (currentTimestamp - refTimestamp) / (1000 * 60 * 60 * 24);
        let phase = (daysSinceRefNewMoon % this.synodicPeriod) / this.synodicPeriod;
        phase = phase < 0 ? phase + 1 : phase;
        return phase;
    }

    // Advance the date used for phase calculation by one day
    advanceDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        console.log("Moon phase advanced to:", this.currentDate.toDateString()); // Log for debugging
    }

    /**
     * Draws the moon based on its internal date.
     * @param {CanvasRenderingContext2D} ctx - The drawing context.
     * @param {number} x - Center X coordinate.
     * @param {number} y - Center Y coordinate.
     * @param {number} radius - Moon radius.
     * @param {number} alpha - Global transparency (0-1).
     */
    draw(ctx, x, y, radius, alpha = 1.0) {
        // Calculate phase based on the internal current date
        const phase = this.calculatePhase(this.currentDate);

        // Don't draw new moon (very close to 0 or 1)
        if (phase < 0.02 || phase > 0.98 || alpha <= 0) {
            return;
        }

        ctx.save(); // Save original alpha setting etc.
        ctx.globalAlpha = alpha;

        // --- 1. Draw Enhanced Glow ---
        this.drawEnhancedGlow(ctx, x, y, radius, phase, alpha);

        // --- 2. Draw the moon using clipping ---
        ctx.save(); // Save context state before clipping

        // If not full moon, define the clipping path for the lit area
        if (Math.abs(phase - 0.5) > 0.02) {
            const isWaxing = phase < 0.5;
            const direction = isWaxing ? -1 : 1;
            const phaseDistance = Math.abs(phase - 0.5) * 2;
            const terminatorOffset = direction * (radius * (1 - phaseDistance));

            // Define the clipping path shape
            ctx.beginPath();
            if (isWaxing) {
                // Waxing (right side lit)
                ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2); // Right semi-circle
                ctx.arc(x + terminatorOffset, y, radius, Math.PI / 2, -Math.PI / 2, true); // Terminator arc (counter-clockwise)
            } else {
                // Waning (left side lit)
                ctx.arc(x, y, radius, Math.PI / 2, -Math.PI / 2); // Left semi-circle
                ctx.arc(x + terminatorOffset, y, radius, -Math.PI / 2, Math.PI / 2, true); // Terminator arc (counter-clockwise)
            }
            ctx.closePath();
            ctx.clip(); // Apply the clipping path
        }
        // Else: Full moon, no clipping needed, full circle is drawn
        
        // Draw the moon with natural gradient
        this.drawMoonGradient(ctx, x, y, radius, alpha);

        // --- Draw Realistic Craters (within the clip) ---
        // Calculate parameters needed for drawCraters
        let visibleSide = 'both';
        let terminatorX = null;
        if (Math.abs(phase - 0.5) > 0.02) {
            const isWaxing = phase < 0.5;
            const direction = isWaxing ? -1 : 1;
            const phaseDistance = Math.abs(phase - 0.5) * 2;
            const terminatorOffset = direction * (radius * (1 - phaseDistance));
            visibleSide = isWaxing ? 'right' : 'left';
            // Approximate terminator X for crater visibility check
            terminatorX = x + terminatorOffset * 0.9; // Use the calculated offset
        }
        // Call the detailed crater drawing method
        this.drawCraters(ctx, x, y, radius, phase, alpha, visibleSide, terminatorX);

        // Restore context to remove clipping path for subsequent drawing (glow etc.)
        ctx.restore();

        ctx.restore(); // Restore original alpha setting etc.
    }

    // Draw enhanced glow around the moon
    drawEnhancedGlow(ctx, x, y, radius, phase, alpha) {
        // Calculate illumination based on phase
        const illuminationRatio = Math.sin(phase * Math.PI);
        
        // Adjust glow strength based on phase and visibility
        let glowStrength;
        if (alpha < 0.3) {
            // Stronger initial glow when moon first appears
            glowStrength = 0.05 + Math.min(0.3, (0.3 - alpha) * 2) + illuminationRatio * 0.1;
        } else {
            // Normal glow for more visible moon
            glowStrength = 0.1 + illuminationRatio * 0.15;
        }
        
        // Create a graduated glow that varies with phase
        const glowSize = radius * (1.8 + illuminationRatio * 0.5);
        const glowAlpha = glowStrength * alpha;
        
        // Create radial gradient for natural glow
        const glowGradient = ctx.createRadialGradient(
            x, y, radius * 0.3,
            x, y, glowSize
        );
        
        // Brighter inner glow that transitions to transparent
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha * 0.8})`);
        glowGradient.addColorStop(0.4, `rgba(240, 245, 255, ${glowAlpha * 0.5})`);
        glowGradient.addColorStop(0.7, `rgba(220, 235, 255, ${glowAlpha * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(220, 235, 255, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw moon with natural gradient
    drawMoonGradient(ctx, x, y, radius, alpha) {
        // Create gradient for more natural moon surface
        const moonGradient = ctx.createRadialGradient(
            x - radius * 0.2, y - radius * 0.2, 0,
            x, y, radius
        );
        
        // More natural color gradient with subtle variations
        moonGradient.addColorStop(0, `rgba(255, 255, 252, ${alpha})`);   // Bright center
        moonGradient.addColorStop(0.4, `rgba(245, 245, 240, ${alpha})`); // Mid tone
        moonGradient.addColorStop(0.8, `rgba(230, 235, 240, ${alpha})`); // Slightly blue tint
        moonGradient.addColorStop(1, `rgba(215, 225, 235, ${alpha})`);   // Darker edge

        // Draw the moon circle with gradient
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw craters on the visible portion of the moon (copied from MoonDrawer.js)
    drawCraters(ctx, x, y, radius, phase, alpha, visibleSide, terminatorX = null) {
        // Skip drawing craters if opacity is too low to see them
        if (alpha < 0.2) return;

        // Helper function (defined inline)
        const pseudoRandom = (i, offset) => {
            return (Math.sin(i * 12.9898 + offset * 78.233) * 43758.5453) % 1;
        };

        ctx.save();

        // Retina display adjustment - increase shadow blur slightly
        const shadowBlur = 3 * this.pixelRatio;

        // Define a few preset craters with varying sizes
        const craters = [
            // Large craters
            { x: -0.2, y: 0.1, r: 0.18, d: 0.02 }, // Mare Imbrium
            { x: 0.12, y: 0.25, r: 0.15, d: 0.03 }, // Mare Serenitatis
            { x: 0.3, y: -0.15, r: 0.12, d: 0.01 }, // Oceanus Procellarum
            { x: -0.32, y: -0.3, r: 0.1, d: 0.03 }, // Mare Nubium

            // Medium craters
            { x: -0.05, y: -0.26, r: 0.07, d: 0.01 },
            { x: 0.26, y: 0.32, r: 0.06, d: 0.02 },
            { x: -0.27, y: 0.27, r: 0.08, d: 0.03 },

            // Small craters
            { x: 0.1, y: 0.05, r: 0.03, d: 0.005 },
            { x: -0.15, y: -0.1, r: 0.04, d: 0.005 },
            { x: 0.35, y: -0.35, r: 0.05, d: 0.01 },
            { x: -0.3, y: -0.05, r: 0.02, d: 0.003 },
            { x: 0.04, y: -0.36, r: 0.03, d: 0.002 },
            { x: 0.22, y: 0.1, r: 0.025, d: 0.004 }
        ];

        // Loop through and draw each crater
        craters.forEach((crater, i) => {
            // Skip craters that aren't visible based on phase/side
            if (visibleSide === 'right' && crater.x < 0) return;
            if (visibleSide === 'left' && crater.x > 0) return;

            // If there's a terminator line (day/night divider), check if crater is visible
            if (terminatorX !== null) {
                const craterCenterX = x + crater.x * radius;
                if (phase < 0.5 && craterCenterX < terminatorX) return;
                if (phase > 0.5 && craterCenterX > terminatorX) return;
            }

            // Convert relative coordinates to canvas coordinates
            const craterX = x + crater.x * radius;
            const craterY = y + crater.y * radius;
            const craterRadius = crater.r * radius;
            const craterDepth = crater.d;

            // Modify opacity based on global alpha
            const craterAlpha = alpha * 0.8; // Slightly more transparent than moon
            
            // Calculate shadow direction based on phase
            const shadowDir = (phase < 0.5) ? 1 : -1; // Shadow opposite to light

            // Draw crater base
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);

            // Create subtle gradient for crater base
            const craterGradient = ctx.createRadialGradient(
                craterX - craterRadius * 0.3 * shadowDir,
                craterY - craterRadius * 0.3,
                0,
                craterX,
                craterY,
                craterRadius
            );
            
            // Calculate a pseudo-random variation for crater color
            const variation = pseudoRandom(i, 0.5) * 0.2 - 0.1; // -0.1 to 0.1 variation
            const colorValue = Math.max(150, Math.min(215, 180 + variation * 35));
            
            // Create natural gradient for crater
            craterGradient.addColorStop(0, `rgba(${colorValue + 15}, ${colorValue + 18}, ${colorValue + 20}, ${craterAlpha})`);
            craterGradient.addColorStop(0.7, `rgba(${colorValue + 5}, ${colorValue + 8}, ${colorValue + 15}, ${craterAlpha})`);
            craterGradient.addColorStop(1, `rgba(${colorValue}, ${colorValue + 3}, ${colorValue + 10}, ${craterAlpha})`);
            
            ctx.fillStyle = craterGradient;
            ctx.fill(); // Fill the base with gradient

            // Add subtle shadow for depth (drawn over the base)
            ctx.shadowColor = `rgba(0, 0, 0, ${0.3 * alpha})`;
            ctx.shadowBlur = shadowBlur; // Use pixel ratio scaled shadow
            ctx.shadowOffsetX = craterRadius * craterDepth * 12 * shadowDir;
            ctx.shadowOffsetY = craterRadius * craterDepth * 12 * 0.5;
            
            // Re-fill with transparent color to apply shadow
            ctx.fillStyle = `rgba(0,0,0,0)`;
            ctx.fill();

            // Add highlight on opposite side for 3D effect
            ctx.beginPath();
            ctx.arc(
                craterX - craterRadius * craterDepth * 18 * shadowDir * -1,
                craterY - craterRadius * craterDepth * 18 * 0.5,
                craterRadius * 0.8,
                0, Math.PI * 2
            );

            // Clear shadow for highlight
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Semi-transparent white for highlight with gradient
            const highlightGradient = ctx.createRadialGradient(
                craterX - craterRadius * craterDepth * 18 * shadowDir * -1,
                craterY - craterRadius * craterDepth * 18 * 0.5,
                0,
                craterX - craterRadius * craterDepth * 18 * shadowDir * -1,
                craterY - craterRadius * craterDepth * 18 * 0.5,
                craterRadius * 0.8
            );
            
            highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.15 * alpha})`);
            highlightGradient.addColorStop(1, `rgba(255, 255, 255, ${0.05 * alpha})`);
            
            ctx.fillStyle = highlightGradient;
            ctx.fill();
        });

        ctx.restore();
    }
}

// Export the class (assuming it's used via script tag or module system)
window.NewMoonDrawer = NewMoonDrawer; 