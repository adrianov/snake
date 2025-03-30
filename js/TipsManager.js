class TipsManager {
    constructor() {
        // Current tip and its displayed lines
        this.currentTip = null;
        this.tipLines = [];
        this.tipFontSize = 16; // Default font size
    }

    // Get the list of game tips
    static getTips() {
        return [
            "Snakes love fruit! Each one gobbled makes them happier and faster.",
            "Need to slow down? Press the opposite direction arrow to hit the brakes.",
            "As your snake grows, it sheds its cheerful attitude - and its skin gets darker.",
            "The moon's phase reflects the real astronomical day. Accurate astronomy in a snake game!",
            "Scientists confirm: No one has ever seen the dark side of this moon either!",
            "Your snake is quite clever - it can avoid collisions 8 out of 10 times on its own.",
            "Different fruits have different scores: Apple (10), Banana (15), Orange (20), Strawberry (25).",
            "Press 'L' to toggle luck mode, 'V' for vibration, 'S' for sound, and 'M' for music.",
            "Tired of the current music? Press 'N' during gameplay to switch to a different melody!"
        ];
    }

    // Get a random tip
    getRandomTip() {
        const tips = TipsManager.getTips();
        const tipIndex = Math.floor(Math.random() * tips.length);
        return tips[tipIndex];
    }

    // Reset the current tip
    resetTip() {
        this.currentTip = null;
        this.tipLines = [];
    }

    // Make sure we have a current tip, generating one if needed
    ensureCurrentTip() {
        if (this.currentTip === null) {
            this.currentTip = this.getRandomTip();
        }
        return this.currentTip;
    }

    // Recalculate tip lines based on current screen dimensions
    recalculateTipLines(ctx, maxWidth) {
        // Get current tip, generate if needed
        const tip = this.ensureCurrentTip();

        // For long tips, break them into multiple lines
        const words = tip.split(' ');
        this.tipLines = [];
        let currentLine = words[0];

        // Build lines by measuring text width
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > maxWidth) {
                this.tipLines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        this.tipLines.push(currentLine);
        
        return this.tipLines;
    }

    // Draw the tip on the screen
    drawTip(ctx, canvasWidth, canvasHeight, gridSize) {
        // Ensure we have a tip
        this.ensureCurrentTip();
        
        // Set the font for text measurement
        this.tipFontSize = gridSize * 0.6;
        ctx.font = `${this.tipFontSize}px 'Poppins', sans-serif`;
        
        // Calculate maximum width to maintain whitespace on sides
        const maxWidth = canvasWidth * 0.8; // 80% of canvas width
        
        // Make sure lines are calculated with current dimensions
        this.recalculateTipLines(ctx, maxWidth);
        
        // Draw the tip text with nice styling but no background
        ctx.save();
        ctx.font = `${this.tipFontSize}px 'Poppins', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw each line - positioned on lower part of screen
        const lineHeight = gridSize * 0.8;
        const startY = canvasHeight / 2 + gridSize * 3.5 - ((this.tipLines.length - 1) * lineHeight / 2);

        for (let i = 0; i < this.tipLines.length; i++) {
            ctx.fillText(this.tipLines[i], canvasWidth / 2, startY + (i * lineHeight));
        }
        
        ctx.restore();
    }
}

// Export the class
window.TipsManager = TipsManager; 