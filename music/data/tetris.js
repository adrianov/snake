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

        // Main section A repeat
        { note: 'E5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 0.5 },
        { note: 'A4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 },

        // New Section C - Lower octave variation
        { note: 'E4', duration: 0.25 }, { note: 'B3', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 0.25 },
        { note: 'C4', duration: 0.25 }, { note: 'B3', duration: 0.25 }, { note: 'A3', duration: 0.5 },
        { note: 'A3', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.5 },
        { note: 'D4', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'B3', duration: 0.5 },
        { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
        { note: 'C4', duration: 0.5 }, { note: 'A3', duration: 0.5 }, { note: 'A3', duration: 0.5 },

        // Section D - Fast-paced variation
        { note: 'E5', duration: 0.125 }, { note: 'D5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'B4', duration: 0.125 },
        { note: 'A4', duration: 0.125 }, { note: 'B4', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'D5', duration: 0.125 },
        { note: 'E5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.125 }, { note: 'D5', duration: 0.125 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'C5', duration: 0.25 },
        { note: 'B4', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'A4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },

        // Section E - Bridge
        { note: 'REST', duration: 0.25 }, { note: 'G5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'F5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 },
        { note: 'A5', duration: 0.5 }, { note: 'F5', duration: 0.5 }, { note: 'G5', duration: 0.5 },
        { note: 'E5', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 },

        // Final Main Theme reprise
        { note: 'E5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 0.5 },
        { note: 'A4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 },

        // Finale
        { note: 'E5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'A4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'A4', duration: 0.75 }, { note: 'REST', duration: 0.25 },
        { note: 'E5', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 1.0 }
    ],
    beats: [
        { type: 'kick', time: 0.0 },
        { type: 'hihat', time: 0.25 },
        { type: 'snare', time: 0.5 },
        { type: 'hihat', time: 0.75 }
    ]
};

// Register the melody so it's available at page load
if (window.MusicData && window.MusicData.MELODIES) {
    window.MusicData.MELODIES.tetris = window.tetrisMelody;
}
