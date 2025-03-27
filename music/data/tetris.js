// Tetris Theme (Korobeiniki) - public domain arrangement
// This is added as a global variable to window for non-ES module support
window.tetrisMelody = {
    name: "Tetris Theme",
    tempo: 120,
    melody: [
        // Main section A
        { note: 'E5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 0.5 },
        { note: 'A4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 },

        // Section B
        { note: 'REST', duration: 0.5 },
        { note: 'D5', duration: 0.75 }, { note: 'F5', duration: 0.25 }, { note: 'A5', duration: 0.5 },
        { note: 'G5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.75 },
        { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.75 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.75 },

        // Section D - Fast-paced variation
        { note: 'E5', duration: 0.125 }, { note: 'D5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'B4', duration: 0.125 },
        { note: 'A4', duration: 0.125 }, { note: 'B4', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'D5', duration: 0.125 },
        { note: 'E5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.125 }, { note: 'D5', duration: 0.125 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'C5', duration: 0.25 },
        { note: 'B4', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'A4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },

        // Finale
        { note: 'E5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'A4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'A4', duration: 0.75 }, { note: 'REST', duration: 0.25 },
        { note: 'E5', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 1.0 }
    ]
};

// Register the melody so it's available at page load
if (window.MusicData && window.MusicData.MELODIES) {
    window.MusicData.MELODIES.tetris = window.tetrisMelody;
}
