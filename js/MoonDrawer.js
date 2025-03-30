class MoonDrawer {
    constructor(pixelRatio = 1) {
        // Known new moon reference date (January 6, 2000 at 18:14 UTC)
        this.referenceNewMoon = new Date('2000-01-06T18:14:00Z');
        // The moon's synodic period (average time between new moons) in days
        this.synodicPeriod = 29.53059;
        // Default sky color in case no color is provided
        this.skyColor = 'rgb(10, 15, 40)';
        // Store pixel ratio for Retina display support
        this.pixelRatio = pixelRatio;

        // Reset animation properties
        this.resetDuration = 3000; // 3 seconds for reset animation
        this.spinsInReset = 5; // How many full phase spins during reset
    }

    // Update pixelRatio after resize
    updatePixelRatio(pixelRatio) {
        this.pixelRatio = pixelRatio;
    }

    // Calculate the current moon phase (0-1)
    // 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
    calculatePhase(date = new Date()) {
        // Convert both dates to UTC timestamps (in milliseconds)
        const refTimestamp = this.referenceNewMoon.getTime();
        const currentTimestamp = date.getTime();

        // Calculate days since the reference new moon
        const daysSinceRefNewMoon = (currentTimestamp - refTimestamp) / (1000 * 60 * 60 * 24);

        // Calculate the phase as a value from 0 to 1
        let phase = (daysSinceRefNewMoon % this.synodicPeriod) / this.synodicPeriod;

        // Ensure phase is in the range [0, 1)
        phase = phase < 0 ? phase + 1 : phase;

        return phase;
    }

    // Calculate moon position based on animation state
    calculatePosition(canvas, animation) {
        // Default values
        let x, y;

        if (animation && animation.isResetting) {
            // The moon is in reset animation
            const resetProgress = animation.progress; // 0-1
            const reverseProgress = 1 - resetProgress;

            // Start position is at the end of normal cycle (right side)
            const startX = canvas.width * 0.9;
            const startY = canvas.height * 0.25;

            // End position is at beginning of normal cycle (left side)
            const endX = canvas.width * 0.1;
            const endY = canvas.height * 0.25;

            // Transition with an exaggerated bouncy sine wave
            // For the X position, move faster at first then slow down (ease-out)
            const xEasing = 1 - Math.pow(reverseProgress, 3); // Cubic ease-out
            x = startX + (endX - startX) * xEasing;

            // For the Y position, add a wild sinusoidal path with decreasing amplitude
            // This creates a bouncy, wavy motion that settles down
            const baseY = startY + (endY - startY) * resetProgress;
            const amplitude = canvas.height * 0.4 * (1 - resetProgress); // Decreasing amplitude
            const oscillations = 3; // Complete 3 full oscillations
            const wave = Math.sin(resetProgress * Math.PI * 2 * oscillations);
            y = baseY + amplitude * wave;
        } else {
            // Normal moon cycle animation
            const cycleProgress = animation ? animation.cycleProgress : 0;

            // X coordinate moves from 0.1 to 0.9 across width
            x = canvas.width * (0.1 + (0.8 * cycleProgress));

            // Y coordinate follows a simple sine wave arc (higher in middle)
            y = canvas.height * (0.25 - (0.15 * Math.sin(cycleProgress * Math.PI)));
        }

        return { x, y };
    }

    // Draw the moon with accurate phase at specified position
    // resetAnimation parameter: object with {isResetting: boolean, progress: 0-1} for reset animation
    draw(ctx, x, y, radius, alpha = 1.0, skyColor = null, resetAnimation = null) {
        // Calculate current phase - normal calculation regardless of reset animation
        const phase = this.calculatePhase();

        // Don't draw very thin crescents or new moon
        if (phase < 0.03 || phase > 0.97) return;

        // Store the sky color for shadow parts - exact color is critical for crescent effect
        if (skyColor) {
            // Use the exact sky color provided - no alpha modification
            this.skyColor = skyColor;
        } else {
            // Try to extract the color from the top of the canvas if no color is provided
            try {
                const pixelData = ctx.getImageData(x, y - radius * 2, 1, 1).data;
                this.skyColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
            } catch (e) {
                // If we can't get the pixel data (e.g., due to CORS), use default
                this.skyColor = 'rgb(10, 15, 40)';
            }
        }

        // Parse the sky color to extract its components
        let skyR = 10, skyG = 15, skyB = 40;
        try {
            // Extract RGB from skyColor string
            const matches = this.skyColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            if (matches && matches.length >= 4) {
                skyR = parseInt(matches[1], 10);
                skyG = parseInt(matches[2], 10);
                skyB = parseInt(matches[3], 10);
            }
        } catch (e) {
            // Fallback to default values if parsing fails
        }

        ctx.save();

        // Critical: Preserve state of canvas background
        // Instead of trying to match the color exactly, we'll use compositing operations

        // Draw moon glow with enhanced visibility when it first appears (at lower alpha values)
        this.drawGlow(ctx, x, y, radius, phase, alpha, skyR, skyG, skyB);

        // Draw the moon with accurate phase representation using clipping technique
        this.drawPhase(ctx, x, y, radius, phase, alpha, skyR, skyG, skyB);

        ctx.restore();
    }

    // Draw the glow around the moon
    drawGlow(ctx, x, y, radius, phase, alpha, skyR, skyG, skyB) {
        // Calculate illumination ratio (0-1)
        const illuminationRatio = Math.sin(phase * Math.PI);

        // Enhance glow strength for lower alpha values to make the moon more visible
        // as it first appears in the sky
        let glowStrength;
        if (alpha < 0.3) {
            // Stronger initial glow when moon first appears
            glowStrength = 0.05 + Math.min(0.3, (0.3 - alpha) * 2) + illuminationRatio * 0.1;
        } else {
            // Normal glow for more visible moon
            glowStrength = 0.1 + illuminationRatio * 0.15;
        }

        // Create a graduated glow that's stronger when the moon is first appearing
        const glowSize = radius * (1.8 + illuminationRatio * 0.5 + (1 - Math.min(1, alpha * 2)) * 0.5);

        // Make the glow more visible against dark sky
        const glowAlpha = glowStrength * alpha;

        // Create radial gradient for glow
        const glowGradient = ctx.createRadialGradient(
            x, y, radius * 0.3,
            x, y, glowSize
        );

        // Start with a color that contrasts with the sky color for early visibility
        const innerGlowColor = `rgba(${Math.min(255, skyR + 150)}, ${Math.min(255, skyG + 150)}, ${Math.min(255, skyB + 150)}, ${glowAlpha})`;
        const outerGlowColor = 'rgba(220, 235, 255, 0)';

        glowGradient.addColorStop(0, innerGlowColor);
        glowGradient.addColorStop(1, outerGlowColor);

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw the moon with its current phase
    drawPhase(ctx, x, y, radius, phase, alpha, skyR, skyG, skyB) {
        ctx.save();

        // Create a gradient for the moon's surface that transitions smoothly from sky color
        // to moon color as alpha increases
        const moonGradient = ctx.createRadialGradient(
            x - radius * 0.2, y - radius * 0.2, 0,
            x, y, radius
        );

        // Calculate moon colors that smoothly transition from sky color when alpha is low
        // to full moon color when alpha is high
        const transitionFactor = Math.min(1, alpha * 3); // Faster transition to moon color

        // Calculate transitional colors between sky and moon
        const centerR = Math.round(skyR + (255 - skyR) * transitionFactor);
        const centerG = Math.round(skyG + (255 - skyG) * transitionFactor);
        const centerB = Math.round(skyB + (255 - skyB) * transitionFactor);

        const midR = Math.round(skyR + (230 - skyR) * transitionFactor);
        const midG = Math.round(skyG + (235 - skyG) * transitionFactor);
        const midB = Math.round(skyB + (255 - skyB) * transitionFactor);

        const edgeR = Math.round(skyR + (200 - skyR) * transitionFactor);
        const edgeG = Math.round(skyG + (215 - skyG) * transitionFactor);
        const edgeB = Math.round(skyB + (240 - skyB) * transitionFactor);

        // Gradually increase the opacity of the moon as it becomes more visible
        const centerAlpha = Math.min(1, alpha * 1.5);
        const edgeAlpha = Math.min(1, alpha * 1.2);

        moonGradient.addColorStop(0, `rgba(${centerR}, ${centerG}, ${centerB}, ${centerAlpha})`);   // Bright center
        moonGradient.addColorStop(0.8, `rgba(${midR}, ${midG}, ${midB}, ${edgeAlpha})`); // Slightly blue tint edge
        moonGradient.addColorStop(1, `rgba(${edgeR}, ${edgeG}, ${edgeB}, ${alpha})`);   // Darker edge

        // Determine if waxing (0-0.5) or waning (0.5-1)
        const isWaxing = phase <= 0.5;

        // This value represents how far from full/new we are (0-1)
        // 0 = full or new moon, 1 = quarter moon
        const phaseDistance = Math.abs(2 * phase - 1);

        if (phase === 0.5) {
            // Full moon - simple circle
            this.drawFullMoon(ctx, x, y, radius, moonGradient, alpha);
        }
        else if (phase < 0.05 || phase > 0.95) {
            // Very thin crescent - special case
            this.drawThinCrescent(ctx, x, y, radius, phase, moonGradient, alpha, isWaxing, skyR, skyG, skyB);
        }
        else if (phase < 0.25 || phase > 0.75) {
            // Crescent moon
            this.drawCrescent(ctx, x, y, radius, phase, moonGradient, alpha, isWaxing, skyR, skyG, skyB);
        }
        else {
            // Gibbous moon
            this.drawGibbous(ctx, x, y, radius, phase, moonGradient, alpha, isWaxing, skyR, skyG, skyB);
        }

        ctx.restore();
    }

    // Draw a full moon
    drawFullMoon(ctx, x, y, radius, gradient, alpha) {
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw craters
        this.drawCraters(ctx, x, y, radius, 0.5, alpha, 'both');
    }

    // Draw very thin crescent moon (special case)
    drawThinCrescent(ctx, x, y, radius, phase, gradient, alpha, isWaxing, skyR, skyG, skyB) {
        // For very thin crescents, we'll use clipping to ensure perfect blending with the sky
        const illuminationRatio = Math.sin(phase * Math.PI);
        const direction = isWaxing ? 1 : -1;
        const center = x;

        // Calculate parameters for the crescent
        const crescentWidth = radius * illuminationRatio * 4; // Exaggerate slightly for visibility
        const offset = direction * (radius - crescentWidth * 0.9);

        // Use a clipping approach to ensure perfect sky match
        ctx.save();

        // First define the visible crescent shape via clipping
        ctx.beginPath();
        // Start with the full moon circle
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        // Then subtract the shadow circle
        // Using "evenodd" fill rule to cut out the area covered by both circles
        ctx.arc(x + offset, y, radius * 1.05, 0, Math.PI * 2, true);

        // Create the clipping region
        ctx.clip("evenodd");

        // Now draw the illuminated part (only visible through the clipping mask)
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw craters on the visible crescent
        const visibleSide = isWaxing ? 'right' : 'left';
        this.drawCraters(ctx, x, y, radius, phase, alpha * 0.5, visibleSide, center + direction * radius * 0.8);

        ctx.restore();
    }

    // Draw a proper crescent moon
    drawCrescent(ctx, x, y, radius, phase, gradient, alpha, isWaxing, skyR, skyG, skyB) {
        // For crescent moons, use clipping to ensure perfect sky match
        const illuminationRatio = Math.sin(phase * Math.PI);
        const direction = isWaxing ? 1 : -1;
        const phaseDistance = Math.abs(2 * phase - 1);

        // Calculate mask parameters
        const maskRadius = radius / (0.5 - 0.4 * phaseDistance);
        const maskOffsetX = direction * (maskRadius - radius * (1 - phaseDistance * 0.7));

        // Use clipping to create the crescent shape
        ctx.save();

        // Define the crescent shape via clipping
        ctx.beginPath();
        // Start with the full moon circle
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        // Then subtract the shadow circle to create the crescent
        ctx.arc(x + maskOffsetX, y, maskRadius, 0, Math.PI * 2, true);

        // Create the clipping region
        ctx.clip("evenodd");

        // Now draw the illuminated part (only visible through the clipping mask)
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw craters on the visible portion
        const visibleSide = isWaxing ? 'right' : 'left';
        const terminatorX = x + direction * radius * phaseDistance * 0.8;
        this.drawCraters(ctx, x, y, radius, phase, alpha, visibleSide, terminatorX);

        ctx.restore();
    }

    // Draw a gibbous moon
    drawGibbous(ctx, x, y, radius, phase, gradient, alpha, isWaxing, skyR, skyG, skyB) {
        // For gibbous moons, use clipping to ensure perfect sky match
        const illuminationRatio = Math.sin(phase * Math.PI);
        const direction = isWaxing ? -1 : 1; // Shadow is on opposite side from crescent
        const phaseDistance = Math.abs(2 * phase - 1);

        // Shadow gets less curved as we approach full moon
        const shadowCurveRadius = radius * (1.5 + phaseDistance * 1.5);

        // Shadow terminator position
        const shadowOffset = direction * radius * phaseDistance * 0.9;

        // Use a different approach for gibbous - draw the whole moon first
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Then use compositing to restore the background for the shadow part
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        // Draw the shadow shape - this will "cut out" part of the moon,
        // perfectly revealing the background
        ctx.beginPath();

        // Draw the shadow arc along the edge of the moon
        ctx.arc(x, y, radius,
              direction > 0 ? -Math.PI/2 : Math.PI/2,
              direction > 0 ? Math.PI/2 : -Math.PI/2,
              false);

        // Draw the curved terminator line
        ctx.arc(
            x + shadowOffset,
            y,
            shadowCurveRadius,
            direction > 0 ? Math.PI/2 : -Math.PI/2,
            direction > 0 ? -Math.PI/2 : Math.PI/2,
            false
        );

        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw craters on the visible portion
        const illuminatedSide = isWaxing ? 'right' : 'left';
        const terminatorX = x + shadowOffset * 0.6;
        this.drawCraters(ctx, x, y, radius, phase, alpha, illuminatedSide, terminatorX);
    }

    // Draw craters on the visible portion of the moon
    drawCraters(ctx, x, y, radius, phase, alpha, visibleSide, terminatorX = null) {
        // Skip drawing craters if opacity is too low to see them
        if (alpha < 0.2) return;

        // Simplified crater drawing with shadow effects
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

        // Function to generate consistent "random" values based on inputs
        const pseudoRandom = (i, offset) => {
            return (Math.sin(i * 12.9898 + offset * 78.233) * 43758.5453) % 1;
        };

        // Loop through and draw each crater
        craters.forEach((crater, i) => {
            // Skip craters that aren't visible based on phase
            if (visibleSide === 'right' && crater.x < 0) return;
            if (visibleSide === 'left' && crater.x > 0) return;
            
            // If there's a terminator line (day/night divider), check if crater is visible
            if (terminatorX !== null) {
                // For waxing moon (terminator moves right to left)
                if (phase < 0.5 && crater.x > terminatorX) return;
                // For waning moon (terminator moves left to right)
                if (phase > 0.5 && crater.x < terminatorX) return;
            }

            // Convert relative coordinates to canvas coordinates
            const craterX = x + crater.x * radius;
            const craterY = y + crater.y * radius;
            const craterRadius = crater.r * radius;
            const craterDepth = crater.d;

            // Modify opacity based on global alpha
            const craterAlpha = alpha * 0.8; // Slightly more transparent than moon

            // Draw crater
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
            
            // Set crater color as a slightly darker shade than the moon
            // Calculate a pseudo-random variation for each crater
            const variation = pseudoRandom(i, 0.5) * 0.2 - 0.1; // -0.1 to 0.1 variation
            
            // Base crater color with a slight variation to avoid uniformity
            const colorValue = Math.max(150, Math.min(215, 180 + variation * 35));
            ctx.fillStyle = `rgba(${colorValue}, ${colorValue + 3}, ${colorValue + 10}, ${craterAlpha})`;
            
            // Add subtle shadow for depth
            ctx.shadowColor = `rgba(0, 0, 0, ${0.25 * alpha})`;
            ctx.shadowBlur = shadowBlur; // Use pixel ratio scaled shadow
            ctx.shadowOffsetX = craterRadius * craterDepth * 12;
            ctx.shadowOffsetY = craterRadius * craterDepth * 12;
            
            ctx.fill();
            
            // Add highlight on opposite side for 3D effect
            ctx.beginPath();
            ctx.arc(
                craterX - craterRadius * craterDepth * 18, 
                craterY - craterRadius * craterDepth * 18, 
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

// Export the class
window.MoonDrawer = MoonDrawer;
