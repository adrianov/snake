/**
 * Defines the fruit system configuration with visual and gameplay properties.
 * - Implements SVG-based fruit definitions for memory-efficient rendering
 * - Configures probability distribution for each fruit type's appearance
 * - Sets scoring values for each fruit type to create varied rewards
 * - Defines visual properties including colors for UI feedback
 * - Provides a complete self-contained asset system without external dependencies
 * - Organizes fruits in a structured format for easy extension and modification
 * - Uses weighted probabilities to balance gameplay difficulty and rewards
 */

// Make FRUIT_CONFIG a global variable
window.FRUIT_CONFIG = {
    apple: {
        svg: `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <!-- Main apple body -->
            <path fill="#e74c3c" d="M12 1c-5 0-9 4-9 9 0 5 4 9 9 9s9-4 9-9c0-5-4-9-9-9z"/>
            <!-- Apple shine -->
            <path fill="#ff6b6b" d="M12 3c-3 0-6 2-6 6 0 4 3 6 6 6s6-2 6-6c0-4-3-6-6-6z"/>
            <!-- Leaf -->
            <path fill="#2ecc71" d="M12 1c-1.5 0-3 0.5-3 2v1.5c0 1.5 1.5 2 3 2s3-0.5 3-2V3C15 1.5 13.5 1 12 1z"/>
            <!-- Stem -->
            <path fill="#8b4513" d="M12 1c-0.8 0-1.5 0.3-1.5 0.8v0.8c0 0.5 0.7 0.8 1.5 0.8s1.5-0.3 1.5-0.8v-0.8C13.5 1.3 12.8 1 12 1z"/>
        </svg>`,
        probability: 0.4,
        score: 10,
        color: '#e74c3c'
    },
    banana: {
        svg: `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <!-- Main banana body -->
            <path fill="#f1c40f" d="M12 1c-4 0-7 3-7 7 0 4 3 7 7 7s7-3 7-7c0-4-3-7-7-7z"/>
            <!-- Banana peel -->
            <path fill="#f39c12" d="M12 1c-3 0-5 2-5 5 0 3 2 5 5 5s5-2 5-5c0-3-2-5-5-5z"/>
            <!-- Banana texture -->
            <path fill="#f39c12" d="M12 3c-1.5 0-3 0.5-3 2v1.5c0 1.5 1.5 2 3 2s3-0.5 3-2V5C15 3.5 13.5 3 12 3z"/>
        </svg>`,
        probability: 0.3,
        score: 15,
        color: '#f1c40f'
    },
    orange: {
        svg: `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <!-- Main orange body -->
            <circle cx="12" cy="12" r="8" fill="#e67e22"/>
            <!-- Orange segments -->
            <path fill="#d35400" d="M12 4c-4 0-8 4-8 8s4 8 8 8 8-4 8-8-4-8-8-8z"/>
            <!-- Orange shine -->
            <circle cx="10" cy="10" r="3" fill="#f39c12"/>
        </svg>`,
        probability: 0.2,
        score: 20,
        color: '#e67e22'
    },
    strawberry: {
        svg: `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <!-- Main strawberry body -->
            <path fill="#e74c3c" d="M12 1c-5 0-9 4-9 9 0 5 4 9 9 9s9-4 9-9c0-5-4-9-9-9z"/>
            <!-- Strawberry seeds -->
            <circle cx="7" cy="7" r="1.5" fill="#c0392b"/>
            <circle cx="12" cy="7" r="1.5" fill="#c0392b"/>
            <circle cx="17" cy="7" r="1.5" fill="#c0392b"/>
            <circle cx="7" cy="12" r="1.5" fill="#c0392b"/>
            <circle cx="12" cy="12" r="1.5" fill="#c0392b"/>
            <circle cx="17" cy="12" r="1.5" fill="#c0392b"/>
            <!-- Strawberry shine -->
            <path fill="#ff6b6b" d="M12 3c-3 0-6 2-6 6 0 4 3 6 6 6s6-2 6-6c0-4-3-6-6-6z"/>
            <!-- Leaf -->
            <path fill="#2ecc71" d="M12 1c-1.5 0-3 0.5-3 2v1.5c0 1.5 1.5 2 3 2s3-0.5 3-2V3C15 1.5 13.5 1 12 1z"/>
        </svg>`,
        probability: 0.1,
        score: 25,
        color: '#e74c3c'
    }
};
