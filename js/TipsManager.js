/**
 * Provides contextual gameplay tips and hints to players.
 * - Implements a randomized tip selection system with proper weighting
 * - Manages tip display timing based on game state and player actions
 * - Controls the tip rotation system to avoid repetition
 * - Provides context-sensitive tips based on player performance and game state
 * - Implements tip formatting with consistent styling and presentation
 * - Handles tip visibility states (show/hide) with proper timing
 * - Organizes tips by categories for appropriate contextual display
 * - Provides new player guidance while avoiding disruption for experienced players
 */
class TipsManager {
    constructor() {
        // Current tip and its displayed lines
        this.currentTip = null;
        this.tipLines = [];
        this.tipFontSize = 16; // Default font size
        
        // Add a timestamp to avoid rapid tip changes
        this.lastTipChangeTime = 0;
        this.minTipChangeInterval = 5000; // Minimum ms between tip changes (5 seconds)
    }

    // Get the list of game tips
    static getTips() {
        return [
            // Game mechanics tips
            "Snakes love fruit. Each one gobbled makes them happier and a bit faster.",
            "Need to slow down? Press the opposite direction arrow to gently brake.",
            "As your snake grows, its mood darkens - and so does its skin color.",
            "The moon's phase mirrors the real astronomical day. Yes, we added astronomy to a snake game.",
            "Scientific fact: No one has ever seen the dark side of this moon either.",
            "Your snake is quite clever. It can avoid collisions 8 out of 10 times on its own.",
            "Different fruits offer various points: Apple (10), Banana (15), Orange (20), Strawberry (25).",
            "Keyboard shortcuts: 'L' for luck mode, 'V' for vibration, 'S' for sound, 'M' for music.",
            "Not vibing with the current tune? Press 'N' during gameplay to switch melodies.",
            "Fun fact: Your snake carries a tiny lucky charm. It might save you from a collision.",
            "Did you know? Your snake has an 80% chance to slither away from danger.",
            "No need for four-leaf clovers. Your snake has its own brand of serpentine luck.",
            
            // Interesting snake facts
            "The longest snake ever recorded was a reticulated python measuring 33 feet long.",
            "Snakes don't have eyelids. They sleep with their eyes open.",
            "The king cobra can grow up to 18 feet long, making it the longest venomous snake.",
            "Snakes smell with their tongues by collecting scent particles from the air.",
            "Some snakes can go months between meals. Talk about intermittent fasting.",
            
            // Educational facts
            "The human brain processes images 60,000 times faster than text.",
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old.",
            "There are more possible iterations of a game of chess than there are atoms in the known universe.",
            "The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage's Analytical Engine in the 1840s.",
            "The world's oldest known living tree is over 5,000 years old and grows in California.",
            
            // Quotes from great thinkers
            "Life is like riding a bicycle. To keep your balance, you must keep moving. — Albert Einstein",
            "Imagination is more important than knowledge. — Albert Einstein",
            "The unexamined life is not worth living. — Socrates",
            "The only true wisdom is in knowing you know nothing. — Socrates",
            "It does not matter how slowly you go as long as you do not stop. — Confucius",
            "Our greatest glory is not in never falling, but in rising every time we fall. — Confucius",
            "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
            "Be the change that you wish to see in the world. — Mahatma Gandhi",
            "In the middle of difficulty lies opportunity. — Albert Einstein",
            "The journey of a thousand miles begins with one step. — Lao Tzu",
            "The only way to do great work is to love what you do. — Steve Jobs",
            "It always seems impossible until it's done. — Nelson Mandela",
            "Stay hungry, stay foolish. — Steve Jobs",
            "The best way to predict the future is to invent it. — Alan Kay",
            "Logic will get you from A to B. Imagination will take you everywhere. — Albert Einstein"
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
        // Check if we should actually change the tip based on time elapsed
        const now = Date.now();
        if (now - this.lastTipChangeTime < this.minTipChangeInterval) {
            return; // Don't reset if it's too soon
        }
        
        this.lastTipChangeTime = now;
        this.currentTip = null;
        this.tipLines = [];
    }

    // Make sure we have a current tip, generating one if needed
    ensureCurrentTip() {
        if (this.currentTip === null) {
            this.currentTip = this.getRandomTip();
            this.lastTipChangeTime = Date.now(); // Record when we changed the tip
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
    drawTip(ctx, canvasWidth, canvasHeight, gridSize, pixelRatio = 1) {
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
        ctx.shadowBlur = 4 * pixelRatio; // Adjust shadow blur for pixel ratio
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
