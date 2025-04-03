/**
 * Sound Templates Definition
 * - Defines the sound effect templates for the game's audio system
 * - Each template contains oscillator type, frequency, gain, and envelope settings
 * - Templates are organized by sound type for easy management
 * - Used by SoundManager to generate in-game sound effects
 */

// Make SOUND_TEMPLATES a global variable
window.SOUND_TEMPLATES = {
    // Fruit pickup sounds
    'apple': {
        type: 'sine',
        frequency: 880,
        gainValue: 0.3,
        frequencyEnvelope: { targetFreq: 440, duration: 0.1 },
        duration: 0.2
    },
    'banana': {
        type: 'triangle',
        frequency: 660,
        gainValue: 0.3,
        frequencyEnvelope: { targetFreq: 330, duration: 0.15 },
        duration: 0.2
    },
    'orange': {
        type: 'square',
        frequency: 550,
        gainValue: 0.3,
        frequencyEnvelope: { targetFreq: 275, duration: 0.2 },
        duration: 0.25
    },
    'strawberry': {
        type: 'sine',
        frequency: 1100,
        gainValue: 0.3,
        frequencyEnvelope: { targetFreq: 550, duration: 0.25 },
        duration: 0.3
    },
    'cherry': {
        type: 'sine',
        frequency: 784,
        gainValue: 0.25,
        frequencyEnvelope: { targetFreq: 392, duration: 0.15 },
        duration: 0.2
    },
    
    // Game events sounds
    'crash': {
        type: 'sawtooth',
        frequency: 440,
        gainValue: 0.3,
        frequencyEnvelope: { targetFreq: 55, duration: 0.6 },
        duration: 0.8
    },
    'highscore': {
        type: 'triangle',
        frequency: 523.25,
        gainValue: 0.4,
        frequencyEnvelope: { targetFreq: 1046.50, duration: 0.3 },
        duration: 0.3
    },
    'disappear': {
        type: 'sine',
        frequency: 440,
        gainValue: 0.08,
        frequencyEnvelope: { targetFreq: 220, duration: 0.15 },
        duration: 0.2
    },
    'click': {
        type: 'sine',
        frequency: 800,
        gainValue: 0.1,
        duration: 0.1
    },
    'fade': {
        type: 'sine',
        frequency: 440,
        gainValue: 0.15,
        frequencyEnvelope: { targetFreq: 110, duration: 0.3 },
        duration: 0.4
    },
    
    // Sound sequences for complex effects
    sequences: {
        'highscoreFanfare': {
            type: 'triangle', // Default oscillator type
            notes: [
                { freq: 392.00, time: 0.00, duration: 0.15, volume: 0.5 },  // G4
                { freq: 523.25, time: 0.15, duration: 0.15, volume: 0.5 },  // C5
                { freq: 659.25, time: 0.30, duration: 0.15, volume: 0.5 },  // E5
                { freq: 783.99, time: 0.45, duration: 0.30, volume: 0.6 },  // G5
                { freq: 783.99, time: 0.80, duration: 0.50, volume: 0.4 },  // G5
                { freq: 987.77, time: 0.80, duration: 0.50, volume: 0.4 },  // B5
                { freq: 1174.66, time: 0.80, duration: 0.50, volume: 0.4 }  // D6
            ]
        }
    }
}; 