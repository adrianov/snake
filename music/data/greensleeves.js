// Greensleeves - Traditional English folk song (public domain)
// This is added as a global variable to window for non-ES module support
window.greensleevesMelody = {
    name: "Greensleeves",
    tempo: 70,
    melody: [
        // Verse 1 - First phrase
        { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'A4', duration: 1.0 },

        // Verse 1 - Second phrase
        { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'A4', duration: 1.0 },

        // Chorus - First phrase (Alas my love...)
        { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'F5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'C5', duration: 1.0 },

        // Chorus - Second phrase (You treat me so...)
        { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'F5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.5 },
        { note: 'B4', duration: 1.0 },

        // Verse 2 - First phrase (variation)
        { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.375 }, { note: 'G5', duration: 0.125 }, { note: 'F5', duration: 0.25 },
        { note: 'E5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'A4', duration: 1.0 },

        // Verse 2 - Second phrase (variation)
        { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.375 }, { note: 'C5', duration: 0.125 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'A4', duration: 1.0 },

        // Final Verse - First phrase
        { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'A4', duration: 1.0 },

        // Final Verse - Concluding phrase
        { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.25 }, { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
        { note: 'A4', duration: 1.5 }
    ]
};

// Register the melody so it's available at page load
if (window.MusicData && window.MusicData.MELODIES) {
    window.MusicData.MELODIES.greensleeves = window.greensleevesMelody;
}
