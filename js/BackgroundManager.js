class BackgroundManager {
    constructor() {
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
    }

    // Reset darkness level when starting a new game
    resetDarknessLevel() {
        this.darknessLevel = 0;
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

    // Get the current background top and bottom colors based on darkness level
    getCurrentSkyColors() {
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

        return { topColor, bottomColor };
    }

    // Get current top RGB color values for moon calculations
    getCurrentTopColorRgb() {
        const dayColor = this.backgroundColors.day.top;
        const nightColor = this.backgroundColors.night.top;

        // Calculate exact RGB values at the top of the sky
        const r = Math.round(dayColor.r + (nightColor.r - dayColor.r) * this.darknessLevel / 100);
        const g = Math.round(dayColor.g + (nightColor.g - dayColor.g) * this.darknessLevel / 100);
        const b = Math.round(dayColor.b + (nightColor.b - dayColor.b) * this.darknessLevel / 100);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Draw background gradient
    drawBackground(ctx, canvas) {
        const { topColor, bottomColor } = this.getCurrentSkyColors();

        // Create gradient from interpolated colors
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw grid lines
    drawGrid(ctx, canvas, gridSize) {
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

        ctx.strokeStyle = `rgba(${gridColorRGB.r}, ${gridColorRGB.g}, ${gridColorRGB.b}, ${gridAlpha})`;
        ctx.lineWidth = 1.5;

        // Calculate the number of grid cells that fit perfectly in the canvas
        const horizontalCells = Math.floor(canvas.width / gridSize);
        const verticalCells = Math.floor(canvas.height / gridSize);

        // Draw vertical lines up to the last full cell
        for (let i = 0; i <= horizontalCells; i++) {
            const x = i * gridSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Draw horizontal lines up to the last full cell
        for (let i = 0; i <= verticalCells; i++) {
            const y = i * gridSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}

// Export the class
window.BackgroundManager = BackgroundManager; 