// Initialize global MusicData object if it doesn't exist
window.MusicData = window.MusicData || {};

// Define all melodies in a single object
window.MusicData.MELODIES = {
    'bomberman': {
        name: 'Bomberman Theme',
        tempo: 125,
        melody: `
            // Main theme with bass
            0.25:C5+C3 0.25:E5 0.25:G5 0.25:C6
            0.5:B5+G3 0.5:G5
            0.5:A5+F3 0.25:G5 0.25:F5
            0.5:E5+C3 0.5:C5

            0.25:C5+C3 0.25:E5 0.25:G5 0.25:C6
            0.5:B5+G3 0.5:G5
            0.5:A5+F3 0.25:G5 0.25:A5
            0.5:G5+C3 0.5:REST

            // Second section
            0.5:E5+C3 0.25:F5 0.25:G5
            0.5:A5+F3 0.25:G5 0.25:F5
            0.5:E5+G3 0.25:D5 0.25:C5
            0.5:D5+G3 0.5:G4

            0.5:E5+C3 0.25:F5 0.25:G5
            0.5:A5+F3 0.25:G5 0.25:F5
            0.5:E5+C3 0.5:D5
            0.5:C5+C3 0.5:REST

            // Fast-paced section
            0.25:C6+C4 0.25:B5 0.25:A5 0.25:G5
            0.25:F5+F3 0.25:E5 0.25:D5 0.25:C5
            0.25:B4+G3 0.25:C5 0.25:D5 0.25:E5
            0.5:C5+C3 0.5:REST

            0.25:G5+G3 0.25:F5 0.25:E5 0.25:D5
            0.25:C5+C3 0.25:B4 0.25:A4 0.25:G4
            0.25:F4+F3 0.25:G4 0.25:A4 0.25:B4
            0.5:G4+G3 0.5:REST

            // Final section with chords
            0.5:C5+E5+G5+C3 0.5:C4+E4+G4
            0.5:F4+A4+C5+F3 0.5:F3+A3+C4
            0.5:G4+B4+D5+G3 0.5:G3+B3+D4
            0.5:C5+E5+G5+C3 0.5:C4+E4+G4
            1.0:C3+G3+C4+E4+G4+C5
        `
    },
    'tetris': {
        name: 'Korobeiniki (Tetris Theme)',
        tempo: 120,
        melody: `
            // Main Theme with integrated bass - measure by measure from ABC notation
            0.5:E5+E3 0.25:B4 0.25:C5 // B2 FG - 1st measure
            0.5:D5+D3 0.25:C5 0.25:B4 // A2 GF - 2nd measure
            0.5:A4+A3 0.25:A4 0.25:C5 // E2 EG - 3rd measure
            0.5:E5+E3 0.25:D5 0.25:C5 // B2 AG - 4th measure
            0.75:B4+G#3 0.25:C5 // F3 G - 5th measure
            0.5:D5+D3 0.5:E5+E3 // A2 B2 - 6th measure
            0.5:C5+C3 0.5:A4+A3 // G2 E2 - 7th measure
            0.5:A4+A3 0.5:REST // E2 z2 - 8th measure

            // Second phrase with integrated bass - A2- Ac|e2 dc|B3 G|...
            0.5:D5+D3 0.25:D5 0.25:F5 // A2- Ac - 1st measure
            0.5:A5+A3 0.25:G5 0.25:F5 // e2 dc - 2nd measure
            0.75:E5+E3 0.25:C5 // B3 G - 3rd measure
            0.5:E5+E3 0.25:D5 0.25:C5 // B2 AG - 4th measure
            0.5:B4+B3 0.25:B4 0.25:C5 // F2 FG - 5th measure
            0.5:D5+D3 0.5:E5+E3 // A2 B2 - 6th measure
            0.5:C5+C3 0.5:A4+A3 // G2 E2 - 7th measure
            0.5:A4+A3 0.5:REST // E2 z2 - 8th measure

            // Middle low section - B4|G4|A4|F4|G4|E4|^D4 -|- ^D2 z2||
            1.0:E4+E2 // B4 - 1st measure
            1.0:C4+C3 // G4 - 2nd measure
            1.0:D4+D3 // A4 - 3rd measure
            1.0:B3+B2 // F4 - 4th measure
            1.0:C4+C3 // G4 - 5th measure
            1.0:A3+A2 // E4 - 6th measure
            1.0:G#3+G#2 // ^D4 - 7th measure
            0.5:G#3+G#2 0.5:REST // ^D2 z2 - 8th measure

            // Final section - B4|G4|A4|F4|G2 B2|ee^d2 -|- d2 z2||
            1.0:E5+E3 // B4 - 1st measure
            1.0:C5+C3 // G4 - 2nd measure
            1.0:D5+D3 // A4 - 3rd measure
            1.0:B4+B3 // F4 - 4th measure
            0.5:C5+C3 0.5:E5+E3 // G2 B2 - 5th measure
            0.5:A5+A3 0.5:G#5+G#3 // ee^d2 - 6th measure
            0.5:G#5+G#3 0.5:REST // d2 z2 - 7th measure

            // Final chord progression
            1.0:A4+C5+E5+A3 // A minor chord with bass
            1.0:E4+G#4+B4+E3 // E major chord with bass
            1.0:A4+C5+E5+A2 // A minor chord with bass
        `
    },
    'fur-elise': {
        name: 'Für Elise',
        tempo: 72,
        melody: `
            // Main theme with bass - Beethoven's original
            0.25:E5+E2 0.25:D#5 0.25:E5 0.25:D#5 0.25:E5+E2
            0.25:B4+G#2 0.25:D5+E3 0.25:C5+A2 0.5:A4+A2 0.5:REST
            0.25:C4+A2 0.25:E4+E2 0.25:A4+A2 0.5:B4+E2 0.5:REST
            0.25:E4+E2 0.25:G#4+B2 0.25:B4+E3 0.5:C5+A2 0.5:REST
            0.25:E4+E2 0.25:E5+E3 0.25:D#5 0.25:E5 0.25:D#5
            0.25:E5+E2 0.25:B4+G#2 0.25:D5+E3 0.25:C5+A2 0.5:A4+A2
            0.5:REST 0.25:C4+A2 0.25:E4+E2 0.25:A4+A2 0.5:B4+E2
            0.5:REST 0.25:E4+E2 0.25:C5+A2 0.25:B4+E2 0.5:A4+A2

            // Second section with bass harmony
            0.5:B4+E2 0.25:C5+A2 0.25:D5+F#2 0.5:E5+G#2 0.5:G4+E2
            0.25:F5+D2 0.25:E5+A2 0.5:D5+F#2 0.5:F4+D2 0.25:E5+A2
            0.25:D5+F#2 0.5:C5+A2 0.5:E4+E2 0.25:D5+F#2 0.25:C5+A2
            0.5:B4+E2 0.5:REST

            // Final chord
            1.0:E4+G#4+B4+E3 // E major chord with bass
        `
    },
    'dubinushka': {
        name: 'Dubinushka (Russian Folk Song)',
        tempo: 108,
        melody: `
            // Main theme with bass - authentic Russian folk pattern
            0.5:G4+G2 0.25:A4 0.25:B4 0.5:C5+C3 0.5:B4+G2
            0.5:A4+D3 0.25:G4 0.25:A4 0.5:B4+G3 0.5:A4+D3
            0.5:G4+G2 0.25:A4 0.25:B4 0.5:C5+C3 0.5:D5+D3
            0.5:E5+C3 0.25:D5 0.25:C5 0.5:B4+G3 0.5:A4+D3

            // Second phrase with call and response pattern
            0.25:G4+G2 0.25:G4 0.25:B4 0.25:D5 0.5:G5+G3 0.5:F5+D3
            0.25:E5+C3 0.25:E5 0.25:D5 0.25:C5 0.5:B4+G3 0.5:A4+D3
            0.25:G4+G2 0.25:G4 0.25:B4 0.25:D5 0.5:G5+G3 0.5:F5+D3
            0.25:E5+C3 0.25:D5 0.25:C5 0.25:B4 0.75:A4+D3 0.25:B4

            // Third part with harmonic richness
            0.5:C5+C3 0.25:C5 0.25:D5 0.5:E5+C3 0.5:G5+G3
            0.5:F5+D3 0.25:E5 0.25:D5 0.5:C5+C3 0.5:E5+C3
            0.5:D5+G2 0.25:C5 0.25:B4 0.5:A4+D3 0.5:C5+C3
            0.5:B4+G2 0.25:A4 0.25:G4 1.0:G4+B4+D5+G2 0.5:REST

            // Final section with traditional Russian cadence
            0.5:G4+B4+D5+G2 // G major chord
            0.5:A4+C5+E5+A2 // A minor chord
            0.5:B4+D5+G5+G2 // G/B chord
            0.5:C5+E5+G5+C3 // C major chord
            0.5:D5+F#5+A5+D3 // D major chord
            0.5:G4+B4+D5+G2 // G major chord
            1.0:G3+B3+D4+G4+B4+D5+G2 // Full G major chord
        `
    },
    'mario': {
        name: 'Super Mario Bros. Theme',
        tempo: 100,
        melody: `
            // Koji Kondo's iconic theme with bass accompaniment
            0.25:E5+C3 0.25:E5 0.25:REST 0.25:E5 0.25:REST
            0.25:C5 0.25:E5 0.5:G5+C3 0.5:REST 0.5:G4+G2
            0.5:REST 0.5:C5+C3 0.5:REST 0.5:G4+G2
            0.5:REST 0.5:E4+C3 0.5:REST 0.5:A4+A2
            0.25:B4+G2 0.25:A#4+G#2 0.25:A4+F#2 0.5:G4+G2 0.25:E5+C3
            0.25:G5+E3 0.25:A5+F3 0.5:F5+D3 0.25:G5+E3 0.5:E5+C3
            0.25:C5+A2 0.25:D5+B2 0.25:B4+G2 0.5:C5+C3 0.5:REST

            // Underwater section
            0.5:E5+C3 0.5:E5+G3 0.5:E5+C4 0.5:C5+E3
            0.5:G4+C3 0.5:G#4+C#3 0.5:A4+D3 0.5:F5+D3

            // Final chord
            1.0:C5+E5+G5+C4 // C major chord
            1.0:C3+G3+C4+E4+G4 // C major full orchestral chord
        `
    },
    'star-wars': {
        name: 'Star Wars Main Theme',
        tempo: 108,
        melody: `
            // John Williams' iconic theme with orchestral bass
            0.5:REST 0.5:C4+C3 0.5:G4+C3 0.5:F4+F3 0.25:E4 0.25:D4
            0.5:C5+C3 0.5:G4+G2 0.25:F4 0.25:E4 0.25:D4 0.5:C5+C3
            0.5:G4+G2 0.25:F4 0.25:E4 0.25:F4 0.5:D4+D3 0.5:REST
            0.5:C4+C3 0.5:G4+C3 0.5:F4+F3 0.25:E4 0.25:D4
            0.5:C5+C3 0.5:G4+G2 0.25:F4 0.25:E4 0.25:D4 0.5:C5+C3
            0.5:G4+G2 0.25:F4 0.25:E4 0.25:F4 0.5:D4+D3 0.5:REST

            // Counter melody with bass
            0.5:F4+F3 0.25:F4 0.5:F4+F3 0.5:E4+E3 0.25:D4
            0.5:C4+C3 0.5:C4+C3 0.5:D4+D3 0.5:F4+F3 0.5:C5+C4
            0.5:A4+A3 0.5:G4+G3 1.0:F4+F3 0.5:REST

            // Final chord
            1.0:C4+E4+G4+C5 // C major chord
            1.0:C3+G3+C4+E4+G4 // C major full orchestral chord
        `
    },
    'imperial-march': {
        name: 'Imperial March (Darth Vader\'s Theme)',
        tempo: 104,
        melody: `
            // John Williams' Imperial March with bass accompaniment
            0.5:G3+G2 0.5:G3+G2 0.5:G3+G2 0.375:Eb3+Eb2 0.125:Bb3+Bb2
            0.5:G3+G2 0.375:Eb3+Eb2 0.125:Bb3+Bb2 1.0:G3+G2 0.5:REST

            0.5:D4+D3 0.5:D4+D3 0.5:D4+D3 0.375:Eb4+Eb3 0.125:Bb3+Bb2
            0.5:Gb3+Gb2 0.375:Eb3+Eb2 0.125:Bb3+Bb2 1.0:G3+G2 0.5:REST

            // Second section with stronger bass
            0.5:G4+G3 0.375:G3+G2 0.125:G3+G2 0.5:G4+G3 0.375:F4+F3 0.125:E4+E3
            0.5:Eb4+Eb3 0.375:D4+D3 0.125:Eb4+Eb3 0.25:Bb3+Bb2 0.25:D4+D3 0.25:Bb3+Bb2 0.25:D4+D3
            0.5:G4+G3 0.375:Eb4+Eb3 0.125:G4+G3 0.5:Bb4+Bb3 0.375:G4+G3 0.125:D5+D4

            // Final section with full orchestration
            0.5:G4+G3 0.375:G3+G2 0.125:G3+G2 0.5:G4+G3 0.375:F4+F3 0.125:E4+E3
            0.5:Eb4+Eb3 0.375:D4+D3 0.125:Eb4+Eb3 0.25:Bb3+Bb2 0.25:D4+D3 0.25:Bb3+Bb2 0.25:D4+D3
            0.5:G4+G3 0.375:Eb4+Eb3 0.125:G4+G3 0.5:D4+D3 0.375:Bb3+Bb2 0.125:G3+G2

            // Final chord
            1.0:G3+Bb3+D4+G4 // G minor chord
            1.0:G2+D3+G3+Bb3+D4 // G minor full orchestral chord
        `
    },
    'rains-of-castamere': {
        name: 'The Rains of Castamere (Lannister Song)',
        tempo: 72,
        melody: `
            // Main theme with bass - somber and haunting
            0.75:D4+D3 0.25:E4 0.5:F4+F3 0.5:D4+D3
            0.75:C4+C3 0.25:D4 0.75:A3+A2 0.25:REST
            0.75:D4+D3 0.25:E4 0.5:F4+F3 0.5:D4+D3
            0.75:C4+C3 0.25:D4 1.0:A3+A2 0.5:REST

            // Second section - melody development
            0.5:F4+F3 0.5:G4+G3 0.5:A4+A3 0.5:G4+G3
            0.5:F4+F3 0.5:D4+D3 1.0:F4+F3 0.5:REST
            0.5:D4+D3 0.5:C4+C3 0.5:D4+D3 0.5:F4+F3
            0.5:D4+D3 0.5:C4+C3 1.0:A3+A2 0.5:REST

            // Refrain - "And so he spoke, and so he spoke"
            0.5:D4+D3 0.25:D4 0.25:D4 0.5:F4+F3 0.5:D4+D3
            0.5:C4+C3 0.5:A3+A2 1.0:C4+C3 0.5:REST
            0.5:D4+D3 0.25:D4 0.25:D4 0.5:F4+F3 0.5:D4+D3
            0.5:C4+C3 0.5:D4+D3 1.0:A3+A2 0.5:REST

            // Final section with rich harmonies
            0.5:D4+F4+A4+D3 // D minor chord
            0.5:C4+E4+G4+C3 // C major chord
            0.5:Bb3+D4+F4+Bb2 // Bb major chord
            0.5:A3+C4+E4+A2 // A minor chord
            0.5:D4+F4+A4+D3 // D minor chord
            0.5:A3+C4+E4+A2 // A minor chord
            0.5:D4+F4+A4+D3 // D minor chord
            1.0:D3+A3+D4+F4+A4 // Final D minor chord
        `
    },
    'siem-sorok': {
        name: 'Siem Sorok (7:40 Dance)',
        tempo: 120,
        melody: `
            // First section - lively klezmer melody in D minor
            0.25:D5+D3 0.25:E5 0.25:F5+F3 0.25:G5
            0.5:A5+D3 0.25:G5 0.25:F5
            0.5:E5+A3 0.25:D5 0.25:C#5
            0.5:D5+D3 0.5:REST

            0.25:D5+D3 0.25:E5 0.25:F5+F3 0.25:G5
            0.5:A5+D3 0.25:G5 0.25:F5
            0.5:E5+A3 0.25:D5 0.25:C#5
            0.5:D5+D3 0.5:REST

            // Second section - traditional Jewish progression
            0.25:A5+F3 0.25:A5 0.25:A5+F3 0.25:G5
            0.5:F5+Bb3 0.25:E5 0.25:D5
            0.5:E5+A3 0.25:F5 0.25:G5
            0.5:A5+D3 0.5:REST

            0.25:A5+F3 0.25:A5 0.25:A5+F3 0.25:G5
            0.5:F5+Bb3 0.25:E5 0.25:D5
            0.5:C#5+A3 0.25:D5 0.25:E5
            0.5:D5+D3 0.5:REST

            // Third section - rhythmic variation
            0.25:F5+Bb3 0.125:F5 0.125:F5 0.25:F5+Bb3 0.25:E5
            0.25:D5+F3 0.125:D5 0.125:D5 0.25:D5+F3 0.25:C5
            0.25:Bb4+Bb3 0.125:Bb4 0.125:Bb4 0.25:C5+A3 0.25:D5
            0.5:C#5+A3 0.5:D5+D3

            // Final section with traditional Jewish cadence
            0.5:D5+F5+A5+D3 // D minor chord
            0.5:A4+C#5+E5+A3 // A major chord
            0.5:Bb4+D5+F5+Bb3 // Bb major chord
            0.5:A4+C#5+E5+A3 // A major chord
            0.5:D5+F5+A5+D3 // D minor chord
            0.5:A4+C#5+E5+A3 // A major chord
            1.0:D4+A4+D5+F5+A5 // Final D minor chord
        `
    },
    'kirby-item-bounce': {
        name: 'Kirby Air Ride: Item Bounce',
        tempo: 140,
        melody: `
            // First section - bouncy main theme
            0.25:C5+C3 0.125:REST 0.125:C5 0.25:D5+G2 0.125:REST 0.125:D5
            0.25:E5+C3 0.125:REST 0.125:E5 0.25:G5+G2 0.125:REST 0.125:G5
            0.25:A5+F3 0.25:G5 0.25:F5+G3 0.25:E5
            0.5:D5+G2 0.25:C5 0.25:D5

            0.25:E5+C3 0.125:REST 0.125:E5 0.25:F5+F2 0.125:REST 0.125:F5
            0.25:G5+E3 0.125:REST 0.125:G5 0.25:C6+C3 0.125:REST 0.125:C6
            0.25:B5+G3 0.25:A5 0.25:G5+C3 0.25:F5
            0.5:E5+C3 0.5:REST

            // Second section - playful response
            0.125:G4+C3 0.125:A4 0.125:B4+G2 0.125:C5 0.125:D5+D3 0.125:E5 0.125:F5+G2 0.125:G5
            0.25:A5+F3 0.25:G5 0.25:F5+D3 0.25:E5
            0.125:D5+G2 0.125:E5 0.125:D5+G2 0.125:C5 0.25:B4+G2 0.25:A4
            0.5:G4+C3 0.5:REST

            0.125:E5+C3 0.125:F5 0.125:G5+G2 0.125:A5 0.125:B5+G3 0.125:C6 0.125:D6+G2 0.125:E6
            0.25:D6+G3 0.25:C6 0.25:B5+D3 0.25:A5
            0.125:G5+G2 0.125:A5 0.125:G5+G2 0.125:F5 0.25:E5+C3 0.25:D5

            // Final section with chords
            0.5:C5+E5+G5+C3 // C major chord
            0.5:G4+B4+D5+G2 // G major chord
            0.5:A4+C5+E5+A2 // A minor chord
            0.5:F4+A4+C5+F2 // F major chord
            0.5:C5+E5+G5+C3 // C major chord
            0.5:G4+C5+E5+G2 // C/G chord
            1.0:C4+E4+G4+C5+E5+G5 // Full C major chord
        `
    },
    'marseillaise': {
        name: 'La Marseillaise (French Anthem)',
        tempo: 84,
        melody: `
            // First section - bold and patriotic opening
            0.25:C5+C3 0.125:C5 0.125:C5 0.25:E5+C3 0.25:G5+E3
            0.25:C5+C3 0.125:C5 0.125:C5 0.25:E5+C3 0.25:G5+E3
            0.5:C6+C4 0.25:G5 0.25:E5 0.25:C5+C3 0.25:E5
            0.5:G5+G3 0.5:REST

            // Second section - "Allons enfants de la Patrie"
            0.25:G5+G3 0.25:G5 0.25:A5+F3 0.25:A5
            0.25:G5+C3 0.25:F5 0.25:E5+C3 0.25:D5
            0.25:C5+C3 0.25:C5 0.25:D5+G2 0.25:D5
            0.25:E5+C3 0.25:F5 0.25:G5+G3 0.25:G5

            // Third section - "Le jour de gloire est arrivé"
            0.25:C6+E3 0.125:B5 0.125:A5 0.25:G5+C3 0.25:F5
            0.25:E5+C3 0.25:D5 0.25:C5+C3 0.25:D5
            0.25:E5+C3 0.25:F5 0.25:G5+G3 0.25:A5
            0.25:G5+G3 0.25:F5 0.5:E5+C3 0.5:REST

            // Fourth section - "Contre nous de la tyrannie"
            0.25:G5+E3 0.25:G5 0.25:F5+F3 0.25:E5
            0.25:D5+G3 0.25:C5 0.5:D5+G3
            0.25:E5+C3 0.25:E5 0.25:D5+G3 0.25:C5
            0.25:B4+G3 0.25:A4 0.5:B4+G3

            // Fifth section - "Aux armes, citoyens!" - triumphant chorus
            0.5:C5+C3 0.25:G4 0.25:C5 0.5:E5+C3 0.5:G5+G3
            0.5:C6+C4 0.5:G5+G3 0.5:E5+C3 0.5:C5+C3

            // Final chords - rousing finish
            0.5:C5+E5+G5+C4 // C major chord
            0.5:G4+C5+E5+G3 // C/G chord
            0.5:C5+E5+G5+C4 // C major chord
            0.5:G4+C5+E5+G3 // C/G chord
            1.0:C5+E5+G5+C4 // Final C major chord
            1.0:C3+G3+C4+E4+G4 // Full orchestral C major chord
        `
    },
    'stranger-in-moscow': {
        name: 'Stranger in Moscow (Michael Jackson)',
        tempo: 66,
        melody: `
            // Introduction - haunting opening
            0.5:E4+A2 0.5:A4+A2 0.5:C5+A3 0.5:E5+E3
            1.0:D5+F3 0.5:C5+A3 0.5:A4+A2
            0.5:E4+E3 0.5:A4+A2 0.5:C5+A3 0.5:E5+E3
            0.5:D5+F3 0.5:C5+A3 1.0:A4+A2

            // First verse - "I was wandering in the rain"
            0.5:A4+A2 0.5:C5+C3 0.5:D5+D3 0.5:E5+E3
            0.5:D5+F3 0.5:C5+A3 1.0:A4+A2 0.5:REST
            0.5:A4+A2 0.5:C5+C3 0.5:D5+D3 0.5:F5+F3
            0.5:E5+E3 0.5:D5+F3 1.0:C5+C3 0.5:REST

            // Pre-chorus - "How does it feel"
            0.25:E5+C3 0.25:E5 0.5:E5+C3 0.25:D5+D3 0.25:D5 0.5:D5+D3
            0.25:C5+E3 0.25:C5 0.5:C5+E3 0.25:B4+G3 0.25:B4 0.5:B4+G3
            0.25:C5+A3 0.25:C5 0.5:C5+A3 0.25:D5+F3 0.25:D5 0.5:D5+F3
            0.5:C5+E3 0.5:B4+G3 1.0:A4+A2 0.5:REST

            // Chorus - "I'm livin' lonely"
            0.5:E5+A3 0.5:E5+A3 0.5:D5+F3 0.5:C5+A3
            1.0:D5+F3 1.0:C5+A3
            0.5:E5+A3 0.5:E5+A3 0.5:D5+F3 0.5:C5+A3
            0.5:D5+F3 0.5:C5+A3 1.0:A4+A2

            // Final bridge - "Stranger in Moscow"
            0.5:A4+A2 0.25:C5 0.25:D5 0.5:E5+E3 0.5:D5+F3
            0.5:C5+A3 0.5:A4+A2 1.0:B4+E3
            0.5:C5+A3 0.25:B4 0.25:A4 0.5:B4+E3 0.5:C5+A3
            0.5:D5+D3 0.5:E5+C3 1.0:A4+A2

            // Final chord progression
            0.75:A4+C5+E5+A3 // A minor chord
            0.75:D4+F4+A4+D3 // D minor chord
            0.75:E4+G4+B4+E3 // E minor chord
            0.75:A4+C5+E5+A3 // A minor chord
            0.75:F4+A4+C5+F3 // F major chord
            0.75:E4+G4+B4+E3 // E minor chord
            1.5:A3+E4+A4+C5+E5 // Final A minor chord with full harmonics
        `
    },
    'god-save-tsar': {
        name: 'God Save the Tsar',
        tempo: 76,
        melody: `
            // First section - solemn opening
            0.5:E4+C3 0.25:G4 0.25:C5 0.5:G4+C3 0.5:C5+E3
            0.5:D5+G3 0.5:E5+C3 1.0:C5+C3 0.5:REST
            0.5:E4+C3 0.25:G4 0.25:C5 0.5:G4+C3 0.5:C5+E3
            0.5:D5+G3 0.5:E5+C3 1.0:C5+C3 0.5:REST

            // Second section - "God Save the Tsar"
            0.5:G4+E3 0.5:C5+E3 0.5:B4+G3 0.5:C5+E3
            0.5:D5+G3 0.5:E5+C3 1.0:F5+F3 0.5:REST
            0.5:E5+C3 0.5:D5+G3 0.5:C5+E3 0.5:B4+G3
            0.5:C5+E3 0.5:D5+G3 1.0:C5+C3 0.5:REST

            // Third section - build to the climax
            0.5:E5+C3 0.5:E5+C3 0.5:F5+F3 0.5:G5+E3
            0.5:G5+E3 0.5:F5+F3 1.0:E5+C3 0.5:REST
            0.5:D5+G3 0.5:D5+G3 0.5:E5+C3 0.5:F5+F3
            0.5:F5+F3 0.5:E5+C3 1.0:D5+G3 0.5:REST

            // Final majestic section
            0.5:E5+C3 0.5:E5+C3 0.5:G5+E3 0.5:G5+E3
            0.5:G5+E3 0.5:F5+F3 0.5:E5+C3 0.5:D5+G3
            0.5:C5+C3 0.5:D5+G3 0.5:E5+C3 0.5:F5+F3
            0.5:D5+G3 0.5:E5+C3 1.0:C5+C3 0.5:REST

            // Final chord progression
            0.75:C5+E5+G5+C3 // C major chord
            0.75:G4+C5+E5+G3 // C/G chord
            0.75:C5+E5+G5+C4 // C major chord
            0.75:G4+D5+F5+G3 // G7 chord
            1.5:C4+E4+G4+C5+E5+G5 // Final C major chord with full harmonics
        `
    },
    'piggy-march': {
        name: 'Piggy March (NIN)',
        tempo: 110,
        melody: `
            // Opening industrial bass pattern
            0.5:D4+D3 0.5:D4+D3 0.5:D4+D3 0.5:F4+D3
            0.5:A4+D3 0.5:G4+D3 0.5:F4+D3 0.5:D4+D3
            0.5:D4+D3 0.5:D4+D3 0.5:D4+D3 0.5:F4+D3
            0.5:A4+D3 0.5:G4+D3 0.5:F4+D3 0.5:D4+D3

            // Main melodic phrase
            0.5:D4+D3 0.5:A4+F3 0.5:A4+A3 0.5:G4+G3
            0.5:F4+F3 0.5:D4+D3 1.0:F4+F3 0.5:REST
            0.5:A4+A3 0.5:A4+A3 0.5:C5+A3 0.5:A4+A3
            0.5:G4+G3 0.5:F4+F3 1.0:D4+D3 0.5:REST

            // Intensity build section - march feel
            0.5:D4+D3 0.25:F4 0.25:G4 0.5:A4+A3 0.5:A4+A3
            0.5:G4+G3 0.5:F4+F3 0.5:D4+D3 0.5:F4+F3
            0.5:A4+A3 0.25:G4 0.25:F4 0.5:G4+G3 0.5:F4+F3
            1.0:D4+D3 0.5:D4+D3 0.5:D4+D3

            // Bridge with industrial percussion feel
            0.25:D4+D3 0.25:REST 0.25:D4+D3 0.25:REST 0.25:D4+D3 0.25:REST 0.25:D4+D3 0.25:REST
            0.25:F4+F3 0.25:REST 0.25:F4+F3 0.25:REST 0.25:F4+F3 0.25:REST 0.25:F4+F3 0.25:REST
            0.25:A4+A3 0.25:REST 0.25:A4+A3 0.25:REST 0.25:G4+G3 0.25:REST 0.25:F4+F3 0.25:REST
            0.25:D4+D3 0.25:REST 0.5:D4+D3 0.5:F4+F3 0.5:A4+A3 0.5:REST

            // Final chorus with crescendo
            0.5:D4+D3 0.5:F4+F3 0.5:A4+A3 0.5:C5+A3
            0.5:D5+D3 0.5:C5+A3 0.5:A4+A3 0.5:F4+F3
            0.5:D5+D3 0.5:C5+A3 0.5:A4+A3 0.5:F4+F3
            0.5:D4+D3 0.5:F4+F3 1.0:D4+D3 0.5:REST

            // Final chord progression
            0.75:D4+F4+A4+D3 // D minor chord
            0.75:F4+A4+C5+F3 // F major chord
            0.75:G4+Bb4+D5+G3 // G minor chord
            0.75:A4+C5+E5+A3 // A minor chord
            1.5:D3+A3+D4+F4+A4 // Final D minor chord
        `
    },
    'personal-jesus': {
        name: 'Personal Jesus (Depeche Mode)',
        tempo: 120,
        melody: `
            // Intro - iconic guitar riff in E minor
            0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST
            0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST
            0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST
            0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST 0.25:A4+A2 0.25:REST 0.25:B4+E2 0.25:REST

            // Verse - "Reach out and touch faith"
            0.5:E4+E2 0.25:G4 0.25:A4 0.5:B4+E3 0.5:B4+E3
            0.5:D5+D3 0.25:B4 0.25:A4 0.5:G4+E3 0.5:G4+E3
            0.5:E4+E2 0.25:G4 0.25:A4 0.5:B4+E3 0.5:B4+E3
            0.5:G4+E3 0.25:E4 0.25:D4 1.0:E4+E2 0.5:REST

            // Chorus - "Your own personal Jesus"
            0.5:E4+E2 0.5:G4+E3 0.5:A4+C3 0.5:B4+G3
            0.5:E5+E3 0.5:D5+G3 1.0:B4+E3 0.5:REST
            0.5:E4+E2 0.5:G4+E3 0.5:A4+C3 0.5:B4+G3
            0.5:G4+E3 0.5:A4+A2 1.0:E4+E2 0.5:REST

            // Bridge - distinctive instrumental section
            0.25:E4+E2 0.25:REST 0.25:G4+E3 0.25:REST 0.25:A4+A2 0.25:REST 0.25:B4+E3 0.25:REST
            0.25:E4+E2 0.25:REST 0.25:G4+E3 0.25:REST 0.25:A4+A2 0.25:REST 0.25:B4+E3 0.25:REST
            0.25:E5+E3 0.25:D5 0.25:B4+E3 0.25:A4 0.25:G4+E3 0.25:A4 0.25:B4+E3 0.25:A4
            0.25:G4+E3 0.25:E4 0.25:G4+E3 0.25:A4 0.5:B4+E3 0.5:B4+E3

            // Second Verse - "Feeling unknown and you're all alone"
            0.5:E4+E2 0.25:G4 0.25:A4 0.5:B4+E3 0.5:B4+E3
            0.5:D5+D3 0.25:B4 0.25:A4 0.5:G4+E3 0.5:G4+E3
            0.5:E4+E2 0.25:G4 0.25:A4 0.5:B4+E3 0.5:B4+E3
            0.5:G4+E3 0.25:E4 0.25:D4 1.0:E4+E2 0.5:REST

            // Second Chorus - with stronger instrumentation
            0.5:E4+E2 0.5:G4+E3 0.5:A4+C3 0.5:B4+G3
            0.5:E5+E3 0.5:D5+G3 1.0:B4+E3 0.5:REST
            0.5:E4+E2 0.5:G4+E3 0.5:A4+C3 0.5:B4+G3
            0.5:G4+E3 0.5:A4+A2 1.0:E4+E2 0.5:REST

            // Outro - "Reach out, touch faith"
            0.25:B4+E3 0.25:A4 0.25:G4+E3 0.25:E4 0.5:G4+E3 0.5:A4+A2
            0.5:B4+E3 0.25:A4 0.25:G4 0.5:E4+E2 0.5:G4+E3
            0.5:A4+A2 0.25:G4 0.25:E4 0.5:G4+E3 0.5:A4+A2
            0.5:B4+E3 0.25:A4 0.25:G4 1.0:E4+E2 0.5:REST

            // Final chord progression - powerful resolution
            0.5:E4+G4+B4+E2 // E minor chord
            0.5:A4+C5+E5+A2 // A minor chord
            0.5:G4+B4+D5+G2 // G major chord
            0.5:B4+D5+F#5+B2 // B major chord
            0.5:E4+G4+B4+E2 // E minor chord
            0.5:D4+F#4+A4+D2 // D major chord
            1.0:E3+B3+E4+G4+B4+E5 // Final E minor chord with full harmonics
        `
    },
    'supaplex': {
        name: 'Supaplex Theme',
        tempo: 135,
        melody: `
            // Intro - iconic electronic theme in C minor (composed by David Whittaker)
            0.25:C5+C3 0.25:Eb5+C3 0.25:G5+C3 0.25:Eb5+C3
            0.25:C5+C3 0.25:Eb5+C3 0.25:G5+C3 0.25:Eb5+C3
            0.25:C5+G2 0.25:Eb5+G2 0.25:G5+G2 0.25:Eb5+G2
            0.25:C5+G2 0.25:Eb5+G2 0.25:G5+G2 0.25:Eb5+G2

            // Main theme - simplified for gameplay
            0.25:C5+C3 0.25:Eb5 0.25:G5+G2 0.25:Bb5
            0.25:C6+C3 0.25:Bb5 0.25:G5+G2 0.25:Eb5
            0.25:D5+G2 0.25:F5 0.25:G5+G2 0.25:Bb5
            0.25:C6+C3 0.25:Bb5 0.25:G5+G2 0.25:F5

            // Second section - rhythmic melody
            0.25:C5+C3 0.25:REST 0.25:G5+G2 0.25:REST
            0.25:Eb5+Eb3 0.25:Eb5 0.25:G5+G2 0.25:G5
            0.25:Ab5+Ab2 0.25:REST 0.25:Eb6+Eb3 0.25:REST
            0.25:C6+F3 0.25:Ab5 0.25:G5+G2 0.25:Eb5

            // Third section - simplified arpeggios
            0.25:C5+C3 0.25:Eb5 0.25:G5+C3 0.25:C6
            0.25:Bb4+G2 0.25:D5 0.25:G5+G2 0.25:Bb5
            0.25:Ab4+Ab2 0.25:C5 0.25:Eb5+Ab2 0.25:Ab5
            0.25:F4+F2 0.25:Ab4 0.25:C5+F2 0.25:F5

            // Bridge section - alternating between chords
            0.25:C5+C3 0.25:G4+C3 0.25:Eb5+C3 0.25:G4+C3
            0.25:C5+G2 0.25:G4+G2 0.25:D5+G2 0.25:G4+G2
            0.25:Ab4+Ab2 0.25:Eb4+Ab2 0.25:C5+Ab2 0.25:Eb4+Ab2
            0.25:Bb4+Bb2 0.25:F4+Bb2 0.25:D5+Bb2 0.25:F4+Bb2

            // Final section - simplified main theme reprise
            0.25:C5+C3 0.25:Eb5 0.25:G5+G2 0.25:Bb5
            0.25:C6+C3 0.25:Bb5 0.25:G5+G2 0.25:Eb5
            0.25:D5+G2 0.25:F5 0.25:G5+G2 0.25:Bb5
            0.25:C6+C3 0.25:Bb5 0.25:G5+G2 0.25:F5

            // Closing phrase - descending run at moderate pace
            0.25:C6+C3 0.25:Bb5 0.25:Ab5+Ab2 0.25:G5
            0.25:F5+F2 0.25:Eb5 0.25:D5+G2 0.25:C5
            0.5:C5+C3 0.5:C5+C3
            0.5:C5+Eb5+G5+C3 0.5:G4+C5+Eb5+G2 // C minor chords
            1.0:C3+G3+C4+Eb4+G4+C5 // Final C minor chord with full harmonics
        `
    }
};

// Add helper methods to MusicData
window.MusicData.getAllMelodyIds = function () {
    return Object.keys(this.MELODIES);
};

window.MusicData.getMelody = function (id) {
    return this.MELODIES[id];
};
