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
        // Basic color, can be adjusted
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
    draw(ctx, x, y, radius, alpha = 1.0) { // Removed phase parameter
        // Calculate phase based on the internal current date
        const phase = this.calculatePhase(this.currentDate);

        // Don't draw new moon (very close to 0 or 1)
        if (phase < 0.02 || phase > 0.98 || alpha <= 0) {
            return;
        }

        ctx.save(); // Save original alpha setting etc.
        ctx.globalAlpha = alpha;

        // --- 1. Draw Subtle Glow ---
        const glowRadius = radius * 1.8;
        const glowGradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, glowRadius);
        glowGradient.addColorStop(0, this.glowColor);
        glowGradient.addColorStop(1, 'rgba(220, 235, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

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
        
        // Draw the full lit moon background - only the clipped area will be visible
        ctx.fillStyle = this.moonColorLight;
        ctx.beginPath(); // Start new path for the main moon fill
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

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
            // Restore visibility checks, but remove the explicit visibleSide check
            // Skip craters that aren't visible based on phase/side
            // if (visibleSide === 'right' && crater.x < -0.05) return; // Removed
            // if (visibleSide === 'left' && crater.x > 0.05) return;  // Removed

            // If there's a terminator line (day/night divider), check if crater is visible
            if (terminatorX !== null) {
                // For waxing moon (light on right), crater center must be > terminatorX
                if (phase < 0.5 && (x + crater.x * radius) < terminatorX) return; // Corrected: should be < for waxing?
                // For waning moon (light on left), crater center must be < terminatorX
                if (phase > 0.5 && (x + crater.x * radius) > terminatorX) return; // Corrected: should be > for waning?
                // Let's re-think this: terminatorX is calculated based on the SHADOW offset.
                // terminatorOffset = direction * (radius * (1 - phaseDistance));
                // direction = isWaxing ? -1 : 1;
                // Waxing (phase<0.5): direction=-1 => terminatorOffset is negative (to the left of center x)
                //                     Light is on the right. Terminator is the left edge of the light.
                //                     Crater X must be GREATER than terminatorX.
                // Waning (phase>0.5): direction=1 => terminatorOffset is positive (to the right of center x)
                //                     Light is on the left. Terminator is the right edge of the light.
                //                     Crater X must be LESS than terminatorX.
                
                const craterCenterX = x + crater.x * radius;
                if (phase < 0.5 && craterCenterX < terminatorX) return; // Keep crater if RIGHT of terminator
                if (phase > 0.5 && craterCenterX > terminatorX) return; // Keep crater if LEFT of terminator
            }
            

            // Convert relative coordinates to canvas coordinates
            const craterX = x + crater.x * radius;
            const craterY = y + crater.y * radius;
            const craterRadius = crater.r * radius;
            const craterDepth = crater.d;

            // Modify opacity based on global alpha
            const craterAlpha = alpha * 0.8; // Slightly more transparent than moon

            // Draw crater base
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);

            // Set crater color as a slightly darker shade than the moon
            const variation = pseudoRandom(i, 0.5) * 0.2 - 0.1; // -0.1 to 0.1 variation
            const colorValue = Math.max(150, Math.min(215, 180 + variation * 35));
            ctx.fillStyle = `rgba(${colorValue}, ${colorValue + 3}, ${colorValue + 10}, ${craterAlpha})`;
            ctx.fill(); // Fill the base first

            // Add subtle shadow for depth (drawn over the base)
            ctx.shadowColor = `rgba(0, 0, 0, ${0.25 * alpha})`;
            ctx.shadowBlur = shadowBlur; // Use pixel ratio scaled shadow
            // Adjust shadow offset based on phase direction (more realistic)
            const shadowDir = (phase < 0.5) ? 1 : -1; // Shadow opposite to light
            ctx.shadowOffsetX = craterRadius * craterDepth * 12 * shadowDir * -1;
            ctx.shadowOffsetY = craterRadius * craterDepth * 12 * 0.5; // Slight downward offset
            
            // Re-fill slightly offset to apply shadow
            ctx.fillStyle = `rgba(0,0,0,0)`; // Use transparent fill just to draw the shadow
            ctx.fill();

            // Add highlight on opposite side for 3D effect (drawn over the base)
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

            // Semi-transparent white for highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${0.08 * alpha})`;
            ctx.fill();
        });

        ctx.restore();
    }
}

// Export the class (assuming it's used via script tag or module system)
window.NewMoonDrawer = NewMoonDrawer; 