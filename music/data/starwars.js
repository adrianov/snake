// Star Wars Main Theme Melody (public domain arrangement)
// This is added as a global variable to window for non-ES module support
window.starwarsThemeMelody = {
    name: "Star Wars Theme",
    tempo: 100,
    melody: [
        // Main Theme
        { note: 'REST', duration: 0.5 },
        { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'C5', duration: 0.75 }, { note: 'G5', duration: 0.75 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },

        // Second phrase
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'D5', duration: 0.75 },

        // Third phrase
        { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'C5', duration: 0.75 }, { note: 'G5', duration: 0.75 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },

        // Force Theme Intro
        { note: 'REST', duration: 0.5 },
        { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 0.5 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 },

        // Force Theme Cont.
        { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 1.0 }, { note: 'REST', duration: 0.5 },

        // Imperial March Section
        { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'E4', duration: 0.375 }, { note: 'B4', duration: 0.125 }, { note: 'G4', duration: 0.5 },
        { note: 'E4', duration: 0.375 }, { note: 'B4', duration: 0.125 }, { note: 'G4', duration: 0.5 },
        { note: 'D5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.375 }, { note: 'B4', duration: 0.125 }, { note: 'G4', duration: 0.5 },
        { note: 'E4', duration: 0.375 }, { note: 'B4', duration: 0.125 }, { note: 'G4', duration: 0.5 },

        // Return to Main Theme - Variation
        { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'C5', duration: 0.75 }, { note: 'G5', duration: 0.75 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'D5', duration: 0.75 },

        // Duel of Fates Section
        { note: 'G5', duration: 0.25 }, { note: 'G5', duration: 0.25 }, { note: 'G5', duration: 0.25 }, { note: 'A5', duration: 0.25 },
        { note: 'G5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 },
        { note: 'G5', duration: 0.25 }, { note: 'G5', duration: 0.25 }, { note: 'G5', duration: 0.25 }, { note: 'A5', duration: 0.25 },
        { note: 'B5', duration: 0.25 }, { note: 'C6', duration: 0.25 }, { note: 'B5', duration: 0.25 }, { note: 'A5', duration: 0.25 },
        { note: 'G5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
        { note: 'D5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 },

        // Final Main Theme Statement
        { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'C5', duration: 0.75 }, { note: 'G5', duration: 0.75 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C6', duration: 0.75 }, { note: 'G5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'D5', duration: 0.75 },

        // Final Chord Progression
        { note: 'C5', duration: 0.5 }, { note: 'G5', duration: 0.5 }, { note: 'C6', duration: 1.0 }
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
    window.MusicData.MELODIES.starwars = window.starwarsThemeMelody;
}
