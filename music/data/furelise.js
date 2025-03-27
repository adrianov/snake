// Für Elise by Ludwig van Beethoven - public domain arrangement
// This is added as a global variable to window for non-ES module support
window.furEliseMelody = {
    name: "Für Elise",
    tempo: 80,
    melody: [
        // Main Theme A - First statement
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'B4', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
        { note: 'A4', duration: 0.5 },

        // Bass arpeggios
        { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'A4', duration: 0.25 },
        { note: 'B4', duration: 0.5 },
        { note: 'E4', duration: 0.25 }, { note: 'G#4', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 0.5 },

        // Middle Section B - First part (more intense)
        { note: 'B4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'E5', duration: 0.5 },
        { note: 'G4', duration: 0.25 }, { note: 'F5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.5 },
        { note: 'F4', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.5 },
        { note: 'E4', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
        { note: 'B4', duration: 0.5 },

        // Transitional phrase
        { note: 'E4', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'E6', duration: 0.25 }, { note: 'D#5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'D#5', duration: 0.25 }, { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'B4', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
        { note: 'A4', duration: 0.5 },

        // Middle Section C - Flowing 16th notes
        { note: 'A4', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'A5', duration: 0.125 },
        { note: 'B5', duration: 0.125 }, { note: 'G#5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'G#5', duration: 0.125 },
        { note: 'C6', duration: 0.125 }, { note: 'A5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'A5', duration: 0.125 },
        { note: 'B5', duration: 0.125 }, { note: 'G#5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'C5', duration: 0.125 },
        { note: 'A4', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'A5', duration: 0.125 },
        { note: 'C6', duration: 0.125 }, { note: 'A5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'E5', duration: 0.125 },
        { note: 'A5', duration: 0.125 }, { note: 'C5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'A5', duration: 0.125 },
        { note: 'B5', duration: 0.125 }, { note: 'E5', duration: 0.125 }, { note: 'G#5', duration: 0.125 }, { note: 'B5', duration: 0.125 },

        // Dramatic chromatic descent
        { note: 'C6', duration: 0.5 }, { note: 'B5', duration: 0.5 },
        { note: 'A5', duration: 0.5 }, { note: 'G#5', duration: 0.5 },
        { note: 'A5', duration: 0.25 }, { note: 'B5', duration: 0.25 }, { note: 'A5', duration: 0.25 }, { note: 'G#5', duration: 0.25 },
        { note: 'A5', duration: 0.25 }, { note: 'B5', duration: 0.25 }, { note: 'C6', duration: 0.25 }, { note: 'D6', duration: 0.25 },

        // Return to Main Theme A - Final statement
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'B4', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
        { note: 'A4', duration: 0.5 },

        // Bass arpeggios conclusive
        { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'A4', duration: 0.25 },
        { note: 'B4', duration: 0.5 },
        { note: 'E4', duration: 0.25 }, { note: 'G#4', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'C5', duration: 0.5 },

        // Ending phrase
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 },
        { note: 'E5', duration: 0.25 }, { note: 'D#5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'B4', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
        { note: 'A4', duration: 0.75 }, { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
        { note: 'A5', duration: 1.0 }
    ]
};

// Register the melody so it's available at page load
if (window.MusicData && window.MusicData.MELODIES) {
    window.MusicData.MELODIES.furelise = window.furEliseMelody;
}
