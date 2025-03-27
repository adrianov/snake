// Zelda Main Theme Melody (public domain arrangement)
// This is added as a global variable to window for non-ES module support
window.zeldaThemeMelody = {
    name: "Zelda Theme",
    tempo: 88,
    melody: [
        // Main Overworld Theme
        { note: 'REST', duration: 0.5 },
        { note: 'A3', duration: 0.5 }, { note: 'D4', duration: 0.75 }, { note: 'E4', duration: 0.25 },
        { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'D5', duration: 0.5 },
        { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.5 }, { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'E4', duration: 0.5 },

        // Second phrase
        { note: 'D4', duration: 0.75 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'G4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
        { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 0.25 }, { note: 'C4', duration: 0.25 }, { note: 'A3', duration: 0.25 },
        { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
        { note: 'A3', duration: 0.75 }, { note: 'REST', duration: 0.5 },

        // Lost Woods / Saria's Song Section
        { note: 'F4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'F4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'F4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.5 },

        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'F4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'F4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.5 },

        // Zelda's Lullaby Section
        { note: 'REST', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'A4', duration: 1.0 },
        { note: 'B4', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'A5', duration: 1.0 },
        { note: 'G5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 }, { note: 'F5', duration: 0.5 },
        { note: 'E5', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 1.0 },

        // Song of Storms Section
        { note: 'D4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'D4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.5 },

        { note: 'A4', duration: 0.25 }, { note: 'D4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'A4', duration: 0.25 }, { note: 'D4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'E4', duration: 1.0 },

        // End section
        { note: 'D5', duration: 0.75 }, { note: 'F5', duration: 0.25 }, { note: 'A5', duration: 0.5 }, { note: 'G5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.5 },
        { note: 'D5', duration: 0.5 }, { note: 'A4', duration: 1.0 }
    ]
};

// Register the melody so it's available at page load
if (window.MusicData && window.MusicData.MELODIES) {
    window.MusicData.MELODIES.zelda = window.zeldaThemeMelody;
}
