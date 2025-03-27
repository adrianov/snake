class MoonDrawer {
    constructor() {
        // Known new moon reference date (January 6, 2000 at 18:14 UTC)
        this.referenceNewMoon = new Date('2000-01-06T18:14:00Z');
        // The moon's synodic period (average time between new moons) in days
        this.synodicPeriod = 29.53059;
        // Default sky color in case no color is provided
        this.skyColor = 'rgb(10, 15, 40)';
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

    // Draw the moon with accurate phase at specified position
    draw(ctx, x, y, radius, alpha = 1.0, skyColor = null) {
        // Calculate current phase
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
        ctx.save();

        // Use a semi-transparent fill for craters that scales with the moon's alpha
        // Craters should be subtle when the moon first appears
        ctx.globalAlpha = 0.06 * alpha * alpha; // Square alpha to keep craters faint at low visibility

        // Use deterministic positions for craters
        const seed = 12345;
        const pseudoRandom = (i, offset) => {
            return ((seed * 9301 + 49297) * (i * 10 + offset)) % 233280 / 233280;
        };

        // Draw several craters
        for (let i = 0; i < 8; i++) {
            // Generate crater position using polar coordinates
            const angle = pseudoRandom(i, 1) * Math.PI * 2;
            const distance = pseudoRandom(i, 2) * radius * 0.85;

            const craterX = x + Math.cos(angle) * distance;
            const craterY = y + Math.sin(angle) * distance;

            // Only draw craters on the visible portion
            let shouldDraw = false;

            if (visibleSide === 'both') {
                shouldDraw = true;
            } else if (visibleSide === 'right' && craterX > x) {
                shouldDraw = true;
            } else if (visibleSide === 'left' && craterX < x) {
                shouldDraw = true;
            }

            // Don't draw craters beyond the terminator line if provided
            if (terminatorX !== null) {
                if ((visibleSide === 'right' && craterX < terminatorX) ||
                    (visibleSide === 'left' && craterX > terminatorX)) {
                    shouldDraw = false;
                }
            }

            if (shouldDraw) {
                // Vary crater size
                const craterSize = pseudoRandom(i, 3) * radius * 0.18 + radius * 0.04;

                // Create gradient for realistic crater
                const craterGradient = ctx.createRadialGradient(
                    craterX, craterY, 0,
                    craterX, craterY, craterSize
                );

                // Darker center, lighter edges
                craterGradient.addColorStop(0, 'rgba(70, 70, 90, 0.9)');
                craterGradient.addColorStop(0.6, 'rgba(90, 100, 120, 0.7)');
                craterGradient.addColorStop(1, 'rgba(120, 130, 160, 0.4)');

                ctx.fillStyle = craterGradient;
                ctx.beginPath();
                ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// Export the class
window.MoonDrawer = MoonDrawer;
