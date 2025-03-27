// Mario Theme Melody (Super Mario Bros theme - public domain arrangement)
// This is added as a global variable to window for non-ES module support
window.marioThemeMelody = {
    name: "Mario Theme",
    tempo: 120,
    melody: [
        // Main theme section 1
        { note: 'E4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 },
        { note: 'G4', duration: 0.5 }, { note: 'REST', duration: 0.5 }, { note: 'G3', duration: 0.5 },
        { note: 'REST', duration: 0.5 },

        // Main theme section 2
        { note: 'C4', duration: 0.5 }, { note: 'REST', duration: 0.25 }, { note: 'G3', duration: 0.25 },
        { note: 'REST', duration: 0.5 }, { note: 'E3', duration: 0.5 },
        { note: 'REST', duration: 0.25 }, { note: 'A3', duration: 0.25 }, { note: 'REST', duration: 0.25 }, { note: 'B3', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'A#3', duration: 0.25 }, { note: 'A3', duration: 0.25 }, { note: 'REST', duration: 0.25 },

        // Main theme section 3
        { note: 'G3', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 },
        { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'REST', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 0.25 }, { note: 'B3', duration: 0.25 },
        { note: 'REST', duration: 0.5 },

        // Repeat main theme with variation
        { note: 'E4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 },
        { note: 'G4', duration: 0.5 }, { note: 'REST', duration: 0.5 }, { note: 'G3', duration: 0.5 },
        { note: 'REST', duration: 0.5 },

        // Underground theme section
        { note: 'C4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A3', duration: 0.25 }, { note: 'A4', duration: 0.25 },
        { note: 'A#3', duration: 0.25 }, { note: 'A#4', duration: 0.25 }, { note: 'REST', duration: 0.5 },
        { note: 'C4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A3', duration: 0.25 }, { note: 'A4', duration: 0.25 },
        { note: 'A#3', duration: 0.25 }, { note: 'A#4', duration: 0.25 }, { note: 'REST', duration: 0.5 },

        { note: 'F3', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'D3', duration: 0.25 }, { note: 'D4', duration: 0.25 },
        { note: 'D#3', duration: 0.25 }, { note: 'D#4', duration: 0.25 }, { note: 'REST', duration: 0.5 },
        { note: 'F3', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'D3', duration: 0.25 }, { note: 'D4', duration: 0.25 },
        { note: 'D#3', duration: 0.25 }, { note: 'D#4', duration: 0.25 }, { note: 'REST', duration: 0.5 },

        // Return to main theme section 1
        { note: 'E4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 },
        { note: 'G4', duration: 0.5 }, { note: 'REST', duration: 0.5 }, { note: 'G3', duration: 0.5 },
        { note: 'REST', duration: 0.5 },

        // Underwater theme section
        { note: 'E5', duration: 0.5 }, { note: 'REST', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'G5', duration: 0.5 }, { note: 'REST', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'REST', duration: 0.5 },

        { note: 'C5', duration: 0.5 }, { note: 'REST', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'A4', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'A#4', duration: 0.25 }, { note: 'A4', duration: 0.25 },
        { note: 'G4', duration: 0.75 }, { note: 'E5', duration: 0.75 }, { note: 'G5', duration: 0.75 },
        { note: 'A5', duration: 0.5 }, { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 },

        // Star power theme
        { note: 'C5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'C5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'E5', duration: 0.5 }, { note: 'REST', duration: 0.5 },

        { note: 'C5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 },
        { note: 'G5', duration: 0.5 }, { note: 'REST', duration: 0.5 },

        // Main theme finale
        { note: 'E4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 }, { note: 'E4', duration: 0.25 },
        { note: 'REST', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'REST', duration: 0.25 },
        { note: 'G4', duration: 0.5 }, { note: 'REST', duration: 0.5 }, { note: 'G3', duration: 0.5 },
        { note: 'REST', duration: 0.5 }
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
    window.MusicData.MELODIES.mario = window.marioThemeMelody;
}
