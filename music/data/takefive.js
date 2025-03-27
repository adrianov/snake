// Take Five by Dave Brubeck - public domain arrangement
// This is added as a global variable to window for non-ES module support
window.takeFiveMelody = {
    name: "Take Five",
    tempo: 174,
    melody: [
        // Main Theme
        { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
        { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
        { note: 'E4', duration: 0.5 }, { note: 'REST', duration: 0.5 },

        { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
        { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
        { note: 'E4', duration: 0.5 }, { note: 'REST', duration: 0.5 },

        // Bridge
        { note: 'G4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'G4', duration: 0.5 }, { note: 'REST', duration: 0.5 },

        { note: 'G4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'G4', duration: 0.5 }, { note: 'REST', duration: 0.5 },

        // Return to Main Theme
        { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
        { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
        { note: 'E4', duration: 0.5 }, { note: 'REST', duration: 0.5 }
    ]
};

// Register the melody so it's available at page load
if (window.MusicData && window.MusicData.MELODIES) {
    window.MusicData.MELODIES.takefive = window.takeFiveMelody;
}
