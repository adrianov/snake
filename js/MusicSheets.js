/**
 * Provides musical data structures for procedural music generation.
 * - Defines musical patterns organized as scale degrees for key-independent playback
 * - Implements a structured note system with configurable duration, articulation, and dynamics
 * - Supports multiple musical moods through different melodic and harmonic patterns
 * - Organizes musical content in a hierarchical structure (songs > sections > patterns)
 * - Provides base patterns that can be transformed by the MusicManager for variety
 * - Uses a compact representation format to minimize memory footprint
 * - Supports modular composition by combining independent musical segments
 */

// Initialize global MusicData object if it doesn't exist
window.MusicData = window.MusicData || {};

// Define all melodies in a single object
window.MusicData.MELODIES = {
    'tetris': {
        name: 'Korobeiniki',
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
            1.0:A4+C5+E5+A3 // A minor chord
            1.0:E4+G#4+B4+E3 // E major chord
            1.0:A4+C5+E5+A2 // A minor chord
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
        name: 'Dubinushka',
        tempo: 84,
        melody: `
            // Main theme - melodic focus for snake game background
            0.5:F2+F1 0.5:G2+G1 0.75:C3+C2 0.25:REST // F,G,C - opening pattern
            0.5:C3+C2 0.25:REST 0.25:C3 0.75:C3+C2 0.25:REST // C-C-C - sustained
            0.5:A2+A1 0.5:G2+G1 0.75:C3+C2 0.25:REST // A,G,C - response
            0.5:F2+F1 0.25:REST 0.25:F2 0.75:F2+F1 0.25:REST // F-F-F - bass line

            // Second section - more melodic development
            0.5:F2+F1 0.25:REST 0.25:F2 0.75:C#3+C#2 0.25:REST // F-F-C# - rise
            0.5:A2+A1 0.25:A2 0.25:C3 0.75:A2+A1 0.25:REST // A-A,C-A - melodic figure
            0.5:G2+G1 0.25:A2 0.25:C3 0.75:C3+C2 0.25:REST // G-A,C-C - ascending
            0.75:C3+C2 0.25:REST 0.5:C3+C2 0.5:REST // C- - sustained note

            // Harmonic section - simplified chords
            0.5:C3+F3+A3 0.5:C#3+F3+A3 0.75:A2+C#3+F3 0.25:REST // C-C#-A - chord motion
            0.5:A2+C3+F3 0.5:G2+C3+E3 0.75:G2+B2+D3 0.25:REST // A-G-G - descent
            0.5:G#2+B2+D3 0.5:A2+C3+E3 0.75:F2+A2+C3 0.25:REST // G#-A-F - modal shift

            // Final section - return to main theme with slight variation
            0.5:F2+F1 0.5:G2+G1 0.75:C3+C2 0.25:REST // F,G,C - return
            0.5:C3+C2 0.25:REST 0.25:C3 0.75:C3+C2 0.25:REST // C-C-C - echo
            0.5:A2+A1 0.5:G2+G1 0.75:C3+C2 0.25:C3 // A,G,C - closing

            // Ending with simple chord progression
            0.75:F2+A2+C3 // F minor
            0.75:C3+E3+G3 // C major
            1.0:F1+F2+A2+C3 // Final F minor
        `
    },
    'mario': {
        name: 'Mario',
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
        name: 'Star Wars',
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
        name: 'Darth',
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
        name: 'Siem Sorok (7:40)',
        tempo: 120,
        melody: `
            // First section - Freilakhs "Sem Sorok" (Seven Forty) in E minor
            0.125:G4+E3 0.125:A4 0.25:B4+E3 0.25:B4 0.125:A4 0.125:G4 // (ga)b2- b2ag - opening phrase
            0.125:B4+E3 0.125:E5 0.25:B4+B3 0.5:B4+B3 // (be')b2 b2b2 - characteristic leap
            0.125:G4+E3 0.125:A4 0.25:B4+E3 0.25:B4 0.125:A4 0.125:G4 // (ga)b2- b2ag - repeat of opening
            0.125:F4+E3 0.125:G4 0.25:E4+E3 0.5:E4+E3 // (fg)e2 e2e2 - cadential phrase
            0.125:G4+E3 0.125:A4 0.25:B4+E3 0.25:B4 0.125:A4 0.125:G4 // (ga)b2- b2ag - third repetition
            0.125:B4+E3 0.125:E5 0.25:B4+B3 0.5:B4+B3 // (be')b2 b2b2 - characteristic leap again
            0.125:G#4+E3 0.125:F4 0.125:E4 0.125:G4 0.125:F4 0.125:E4 0.125:D#4 0.125:F4 // (^gfeg fe^df - chromatic run
            0.5:E4+E3 0.25:REST 0.75:REST // e2)z2 z4 - end of section

            // Second section - modulation with characteristic klezmer ornaments
            0.125:D#4+B3 0.125:F4 0.25:E4+E3 0.25:B3+B2 0.25:E4+E3 // (^df)e2 B2e2 - modal shift
            0.25:B3+B2 0.25:E4+E3 0.25:B3+B2 0.25:E4+E3 // B2e2 B2e2 - repeated pattern
            0.125:F4+D3 0.125:A4 0.25:G4+G3 0.25:D4+D3 0.25:G4+G3 // (fa)g2 d2g2 - new motif
            0.25:D4+D3 0.25:G4+G3 0.25:D4+D3 0.25:G4+G3 // d2g2 d2g2 - repeated pattern
            0.5:B4+B3 0.25:G4 0.25:B4 // ~b4 g2b2 - ornamental trill
            0.5:A4+A3 0.25:F4 0.25:A4 // ~a4 f2a2 - descending sequence
            0.5:G4+G3 0.25:E4 0.25:G4 // ~g4 e2g2 - continuing pattern
            0.5:F4+F3 0.5:B4+B3 // f4 b4 - first ending

            // Third section - lyrical middle section
            0.25:REST 0.25:B3+B2 0.25:C4 0.25:D4 // z2B2c2d2 - gentle beginning
            0.25:C4+C3 0.25:B3 0.25:A3+A2 0.25:G3 // ~c2B2 A2G2 - descending line
            0.25:REST 0.25:B3+B2 0.25:C4 0.25:D4 // z2B2c2d2 - repeat of phrase
            0.25:C4+C3 0.25:B3 0.25:A3+A2 0.25:G3 // ~c2B2 A2G2 - descending line again
            0.25:REST 0.25:B3+B2 0.25:C4 0.25:D4 // z2B2c2d2 - third repetition
            0.25:E4+E3 0.25:D4 0.25:C4+C3 0.25:B3 // e2d2 c2B2 - extended descending line
            0.5:A3+A2 0.25:E3 0.25:A3 // A4 E2A2- - cadential figure
            1.0:A3+A2 // A8 - sustained note

            // Fourth section - virtuosic development
            0.25:A4+A3 0.25:G4 0.25:F4+F3 0.25:E4 // a2g2 ~f2e2 - descending pattern with ornament
            0.25:A4+A3 0.25:G4 0.25:F4+F3 0.25:E4 // a2g2 ~f2e2 - repetition for emphasis
            0.125:F4+F3 0.125:A4 0.25:G4+G3 0.5:G4+G3 // (fa)g2- g4- - sustained note with ornament
            0.25:G4+G3 0.25:E4 0.25:F4+F3 0.25:G4 // g2e2 f2g2 - ascending scale
            0.25:A4+A3 0.25:G4 0.25:F4+F3 0.25:E4 // a2g2 ~f2e2 - return to descending pattern
            0.25:A4+A3 0.25:G4 0.25:F4+F3 0.25:E4 // a2g2 ~f2e2 - repetition
            0.125:A#4+B3 0.125:C#5 0.25:B4+B3 0.5:B4+B3 // (^a^c')b2- b4- - chromatic approach
            0.25:B4+B3 0.25:E4 0.25:F4+F3 0.25:G4 // b2e2 f2g2 - ascending scale

            // Final section - climactic ending
            0.25:E4+E3 0.25:F4 0.25:G4+G3 0.25:A4 // e2f2g2a2 - ascending scale
            0.5:B4+B3 0.5:B4+B3 // b8- b8 - sustained note
            0.25:E4+E3 0.25:F4 0.25:G4+G3 0.25:F4 // e2f2 g2f2 - melodic turn
            0.25:E4+E3 0.25:D4 0.25:C4+C3 0.25:B3 // e2d2 c2B2 - descending line
            0.5:A3+A2 0.5:A3+A2 // A8- - sustained note
            0.25:A3+A2 0.25:A4 0.25:G#4 0.25:G4 // A2 a2^g2=g2 - chromatic descent

            // Final cadence with full harmonies
            0.5:B4+E4+G4+B3 // B minor chord
            0.5:E4+G4+B4+E3 // E minor chord
            0.5:A4+C5+E5+A3 // A minor chord
            0.5:B4+D5+F#5+B3 // B major chord
            1.0:E4+G4+B4+E3 // Final E minor chord
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
        name: 'La Marseillaise',
        tempo: 84,
        melody: `
            // First section - D>D|G2G>GA2A>A|d3B GGBG
            0.125:D4+D3 0.125:D4 0.25:G4+G2 0.125:G4 0.125:G4 0.25:A4+A2 0.125:A4 0.125:A4
            0.375:D5+D3 0.125:B4 0.25:G4+G2 0.25:G4 0.25:B4+G2 0.25:G4

            // E2c4AF|G2G>GG2G>A
            0.25:E4+E2 0.25:C5+C3 0.5:C5+C3 0.25:A4+A2 0.25:F4+F2
            0.25:G4+G2 0.125:G4 0.125:G4 0.25:G4+G2 0.125:G4 0.125:A4

            // B2B>B B2c>B|B2A>A A2A>B
            0.25:B4+G2 0.125:B4 0.125:B4 0.25:B4+G2 0.125:C5 0.125:B4
            0.25:B4+G2 0.125:A4 0.125:A4 0.25:A4+A2 0.125:A4 0.125:B4

            // c2c>c c2d>c|B2z2z2d>d
            0.25:C5+C3 0.125:C5 0.125:C5 0.25:C5+C3 0.125:D5 0.125:C5
            0.25:B4+G2 0.25:REST 0.5:REST 0.125:D5+D3 0.125:D5

            // d2B>G d2B>G|D2D>DD2D>D
            0.25:D5+D3 0.125:B4 0.125:G4 0.25:D5+D3 0.125:B4 0.125:G4
            0.25:D4+D2 0.125:D4 0.125:D4 0.25:D4+D2 0.125:D4 0.125:D4

            // A4c2A>F|G2G2=F2F2
            0.5:A4+A2 0.25:C5+C3 0.125:A4 0.125:F4
            0.25:G4+G2 0.25:G4 0.25:F4+F2 0.25:F4

            // E2G2G2^F>G|A4z2A>A
            0.25:E4+E2 0.25:G4+G2 0.25:G4+G2 0.125:F#4 0.125:G4
            0.5:A4+A2 0.25:REST 0.125:A4+A2 0.125:A4

            // _B4 Bcd"(1)"e|A2A4_BA
            0.5:Bb4+Bb2 0.25:B4+B2 0.25:C5+C3 0.25:D5+D3 0.25:E5+E3
            0.25:A4+A2 0.25:A4 0.5:A4+A2 0.25:Bb4 0.25:A4

            // G4 G_BAG|F2D>DD2d>d
            0.5:G4+G2 0.25:G4 0.25:Bb4 0.25:A4 0.25:G4
            0.25:F4+F2 0.125:D4 0.125:D4 0.25:D4+D2 0.125:D5 0.125:D5

            // d4 d_BAG|A2D>D D2d>d
            0.5:D5+D3 0.25:D5 0.25:Bb4 0.25:A4 0.25:G4
            0.25:A4+A2 0.125:D4 0.125:D4 0.25:D4+D2 0.125:D5 0.125:D5

            // d4 d_BAG|A2D>D D2D>D
            0.5:D5+D3 0.25:D5 0.25:Bb4 0.25:A4 0.25:G4
            0.25:A4+A2 0.125:D4 0.125:D4 0.25:D4+D2 0.125:D4 0.125:D4

            // G6GF/G/|B2B>BB2B2
            0.75:G4+G2 0.125:G4 0.0625:F4 0.0625:G4
            0.25:B4+G2 0.125:B4 0.125:B4 0.25:B4+G2 0.25:B4

            // c4d2e2|A6e2
            0.5:C5+C3 0.25:D5+D3 0.25:E5+E3
            0.75:A4+A2 0.25:E5+E3

            // d4 dBcA|G2G>G G2D>D
            0.5:D5+D3 0.25:D5 0.25:B4 0.25:C5 0.25:A4
            0.25:G4+G2 0.125:G4 0.125:G4 0.25:G4+G2 0.125:D4 0.125:D4

            // G6GF/G/|B2B>B B2B2
            0.75:G4+G2 0.125:G4 0.0625:F4 0.0625:G4
            0.25:B4+G2 0.125:B4 0.125:B4 0.25:B4+G2 0.25:B4

            // c4d2e2|A6e2
            0.5:C5+C3 0.25:D5+D3 0.25:E5+E3
            0.75:A4+A2 0.25:E5+E3

            // d4 dBcA|G2G>GG2
            0.5:D5+D3 0.25:D5 0.25:B4 0.25:C5 0.25:A4
            0.25:G4+G2 0.125:G4 0.125:G4 0.25:G4+G2

            // Final chord progression
            0.5:G4+B4+D5+G2 // G major chord
            0.5:D4+G4+B4+D3 // G/D chord
            0.5:G4+B4+D5+G2 // G major chord
            1.0:G3+D4+G4+B4+D5+G5 // Full G major chord
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
        name: 'Personal Jesus',
        tempo: 135,
        melody: `
            // Intro - iconic guitar riff with distinctive bass pattern from ABC
            0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST
            0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST
            0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST
            0.25:G4+E2 0.25:REST 0.25:G4+E2 0.25:REST 0.25:A4+A2 0.25:REST 0.25:B4+B2 0.25:REST

            // Main bass pattern with G-C-G chord from ABC voice 3
            0.5:G3+G2 0.5:A#3+A#2 0.5:G3+G2 0.5:A#3+A#2
            0.5:G3+G2 0.25:G3 0.25:A#3+A#2 0.5:G3+G2 0.5:A#3+A#2
            0.5:G3+G2 0.5:A#3+A#2 0.5:G3+G2 0.5:A#3+A#2
            0.5:G3+G2 0.25:G3 0.25:A#3+A#2 0.5:G3+G2 0.5:A#3+A#2

            // "Reach out and touch faith" - melody from ABC voice 5
            0.25:G4+G2 0.25:G4 0.5:F4+F2 0.5:G4+G2 0.5:REST
            0.5:REST 0.25:D4+D2 0.25:F4 0.25:G4+G2 0.5:G4
            0.5:REST 0.5:G4+G2 0.25:G4 0.5:G4+G2 0.5:REST
            0.5:G4+G2 0.5:G4+G2 0.5:F4+F2 0.5:A#3+A#2 0.5:REST

            // Chorus pattern with chord progression from ABC
            0.25:G4+G2 0.25:G4 0.25:G4 0.25:A#4+A#2 0.5:A4+A2 0.25:G4 0.25:G4
            0.5:A4+A2 0.5:G4+G2 0.5:D4+D2 0.5:REST
            0.25:G4+G2 0.25:F4 0.25:A#3+A#2 0.25:F4 0.25:F4 0.25:G4+G2
            0.5:G4+G2 0.5:F4+F2 0.5:A#3+A#2 0.5:REST

            // Instrumental bridge with distinctive rhythm
            0.5:G4+G2 0.5:G4+G2 0.5:A#4+A#2 0.5:G4+G2
            0.5:G4+G2 0.5:G4+G2 0.5:A#4+A#2 0.5:A4+A2
            0.5:E4+E2 0.5:REST 0.5:E4+E2 0.5:REST
            0.5:G4+G2 0.5:REST 0.5:D#4+D#2 0.5:REST

            // Main riff returns with Em-A-B sequence
            0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST 0.25:E4+E2 0.25:REST
            0.25:A4+A2 0.25:REST 0.25:A4+A2 0.25:REST 0.25:A4+A2 0.25:REST 0.25:A4+A2 0.25:REST
            0.25:D#4+D#2 0.25:REST 0.25:D#4+D#2 0.25:REST 0.25:D#4+D#2 0.25:REST 0.25:D#4+D#2 0.25:REST

            // "Your own personal Jesus" with triplet feel from ABC
            0.25:G4+G2 0.25:G4 0.25:G4 0.25:A#4+A#2 0.5:A4+A2 0.25:A4 0.25:G4+G2
            0.5:A4+A2 0.5:G4+G2 0.5:D4+D2 0.5:REST
            0.25:G4+G2 0.25:G4 0.25:G4 0.25:A#4+A#2 0.5:A4+A2 0.25:A4 0.25:G4+G2
            0.5:G4+G2 0.5:F4+F2 0.5:REST

            // Outro with descending pattern from ABC
            0.25:G4+G2 0.25:G4 0.5:F4+F2 0.5:G4+G2 0.5:REST
            0.5:G4+G2 0.25:G4 0.25:G4 0.5:A#4+A#2 0.5:A4+A2 0.5:G4+G2
            0.5:G4+G2 0.5:F4+F2 0.5:A#3+A#2 0.5:F4+F2
            0.5:G4+G2 0.5:G4+G2 0.5:A#4+A#2 0.5:G4+G2

            // Final chord progression based on ABC chord voicings
            0.5:E4+G4+B4+E2 // E minor chord
            0.5:A4+C5+E5+A2 // A minor chord
            0.5:G4+B4+D5+G2 // G major chord
            0.5:B4+D#5+F#5+B2 // B major chord
            0.5:E4+G4+B4+E2 // E minor chord
            0.5:A4+C5+E5+A2 // A minor chord
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
    },
    'moscow-evenings': {
        name: 'Podmoscow Evenings',
        tempo: 90,
        melody: `
            // First section - "Dm"DFAF|"Gm"G2FE|"A7"A2G2|"Dm"D3 z
            0.25:D4+D3 0.25:F4 0.25:A4 0.25:F4 // DFAF - Dm chord
            0.5:G4+G3 0.25:F4 0.25:E4 // G2FE - Gm chord
            0.5:A4+A3 0.5:G4 // A2G2 - A7 chord
            0.75:D4+D3 0.25:REST // D3 z - Dm chord

            // Second section - "F"FAcc|"Gm"d2"C7"cB|"F"A4
            0.25:F4+F3 0.25:A4 0.25:C5 0.25:C5 // FAcc - F chord
            0.5:D5+G3 0.25:C5 0.25:B4 // d2cB - Gm to C7 chord
            1.0:A4+F3 // A4 - F chord

            // Third section - "E7"=B2^c2|:"Dm"edA2
            0.5:B4+E3 0.5:C#5 // =B2^c2 - E7 chord
            0.25:E5+D3 0.25:D5 0.5:A4 // edA2 - Dm chord

            // Middle section - "Dm"z FED|"Gm"AGB2-|"Gm"B z cB
            0.25:REST 0.25:F4+D3 0.25:E4 0.25:D4 // z FED - Dm chord
            0.25:A4+G3 0.25:G4 0.5:B4 // AGB2- - Gm chord
            0.25:B4+G3 0.25:REST 0.25:C5 0.25:B4 // B z cB - Gm chord

            // Outro section - "Dm"A2GF|"Em7"A2 "A7"G2|"Dm"D4
            0.5:A4+D3 0.25:G4 0.25:F4 // A2GF - Dm chord
            0.5:A4+E3 0.5:G4+A3 // A2 G2 - Em7 to A7 chord
            1.0:D4+D3 // D4 - Dm chord (first ending)

            // Repeat to the E7 chord - "E7"=B2^c2
            0.5:B4+E3 0.5:C#5 // =B2^c2 - E7 chord

            // Alternative ending - "Dm"D4-|"Dm"D z z2|]
            1.0:D4+D3 // D4- - Dm chord (second ending)
            0.25:D4+D3 0.75:REST // D z z2 - Dm chord

            // Final chord
            1.0:D3+A3+D4+F4+A4 // Final Dm chord with full harmonics
        `
    },
    'agua-de-beber': {
        name: 'Agua de Beber',
        tempo: 70, // Slowed down for a more relaxed feel
        melody: `
            // Main theme - Bossa Nova rhythm in A minor with rich accompaniment
            0.25:C4+A2+E3 0.25:A3+C3+E3 0.25:G3+C3+E3 0.25:A3+C3+E3 0.5:A3+C3+E3 0.5:C4+A2+E3 // c/A/G/A/-A>c - Am7 chord with fuller voicing
            0.25:Eb4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.25:D4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.5:D4+B2+D3+F#3 0.5:C4+E2+G#2+B2 // _e/_e/d/_e/"E7"dc - B7 to E7 with richer harmony
            0.25:C4+A2+E3 0.25:A3+C3+E3 0.25:G3+C3+E3 0.25:A3+C3+E3 0.5:A3+C3+E3 0.5:C4+A2+E3 // c/A/G/A/-A>c - Am7 chord with fuller voicing
            0.25:Eb4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.25:D4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.5:D4+B2+D3+F#3 0.5:C4+E2+G#2+B2 // _e/_e/d/_e/"E7"dc - B7 to E7 with enhanced bass
            0.25:C4+A2+E3 0.25:A3+C3+E3 0.25:G3+C3+E3 0.25:A3+C3+E3 0.75:A3+C3+E3 // c/A/G/A/-A2 - Am7 chord with sustained voicing
            0.25:A3+F2+A2+C3 0.25:G3+F2+A2+C3 1.0:A3+F2+A2+C3 // A/G/A3 - Fmaj7 chord with fuller harmonization
            0.25:A3+A2+C3+E3 0.25:G3+A2+C3+E3 1.0:A3+A2+C3+E3 // A/G/A3- - Am7 chord with sustained accompaniment
            0.75:A3+E2+G#2+B2 0.75:REST // "E7"A2 z2 - E7 chord with fuller harmonics

            // Second section - gentler phrasing with enhanced accompaniment
            0.25:C4+A2+E3 0.25:A3+C3+E3 0.25:G3+C3+E3 0.25:A3+C3+E3 0.5:A3+C3+E3 0.5:C4+A2+E3 // c/A/G/A/-A>c - Am7 chord
            0.25:Eb4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.25:D4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.5:D4+B2+D3+F#3 0.5:C4+E2+G#2+B2 // _e/_e/d/_e/"E7"dc - B7 to E7
            0.25:C4+A2+E3 0.25:A3+C3+E3 0.25:G3+C3+E3 0.25:A3+C3+E3 0.5:A3+C3+E3 0.5:C4+A2+E3 // c/A/G/A/-A>c - Am7 chord
            0.25:Eb4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.25:D4+B2+D3+F#3 0.25:Eb4+D3+F#3 0.5:D4+B2+D3+F#3 0.5:C4+E2+G#2+B2 // _e/_e/d/_e/"E7"dc - B7 to E7
            0.25:C4+A2+E3 0.25:A3+C3+E3 0.25:G3+C3+E3 0.25:A3+C3+E3 0.75:A3+C3+E3 // c/A/G/A/-A2 - Am7 chord
            0.25:A3+F2+A2+C3 0.25:G3+F2+A2+C3 1.0:A3+F2+A2+C3 // A/G/A3 - Fmaj7 chord
            0.25:A3+A2+C3+E3 0.25:G3+A2+C3+E3 1.0:A3+A2+C3+E3 // A/G/A3 - Am7 chord
            0.5:A3+E2+G#2+B2 0.25:C4+A2+C3+E3 0.25:E4+A2+C3+E3 0.5:Eb4+B2+D3+F#3 // zA/ce\_e/- - transition to B section with harmonic support

            // B section - bridge with enriched accompaniment
            0.75:Eb4+B2+D3+F#3 0.5:Eb4+B2+D3+F#3 0.25:E4+B2+D3+F#3 0.25:C4+B2+D3+F#3 // \_e2-\_e/=ec/- - B7 chord with sustained harmonies
            0.75:C4+E2+G#2+B2 0.5:C4+E2+G#2+B2 0.25:A3+E2+G#2+B2 0.25:C4+E2+G#2+B2 // "E7"c2-c/Ac/- - E7 chord with fuller voicing
            0.25:C4+A2+C3+E3 0.25:A3+A2+C3+E3 1.0:A3+A2+C3+E3+G3 // c/A/-A3 - Am7 chord with extended 7th
            0.5:A3+D2+F#2+A2+C3 0.25:C4+D2+F#2+A2+C3 0.25:E4+D2+F#2+A2+C3 0.5:G4+D2+F#2+A2+C3 // "D7"zA/ceg/- - D7 chord with complete voicing
            0.75:G4+D2+F3+A3 0.5:G4+D2+F3+A3 0.25:A4+D2+F3+A3 0.25:E4+D2+F3+A3 // "Dm7"g2-g/ae/- - Dm7 chord with full accompaniment
            0.75:E4+G2+B2+D3+F3 0.5:E4+G2+B2+D3+F3 0.25:D4+G2+B2+D3+F3 0.25:E4+G2+B2+D3+F3 // "G7"e2-e/de/- - G7 chord with rich 9th voicing
            1.5:E4+C2+E2+G2+B2 // "Cmaj7"e4- - Cmaj7 chord with sustained maj7 harmony
            0.75:E4+C2+E2+G2+B2 0.25:A3+A2+C3+E3 0.25:C4+A2+C3+E3 0.5:Eb4+B2+D3+F#3 // eA/ce\_e/- - transition with smooth chord movement

            // Second B section - with richer harmonization
            0.75:Eb4+B2+D3+F#3 0.5:Eb4+B2+D3+F#3 0.25:E4+B2+D3+F#3 0.25:C4+B2+D3+F#3 // \_e2-\_e/=ec/- - B7 chord with extended voicing
            0.75:C4+E2+G#2+B2 0.5:C4+E2+G#2+B2 0.25:A3+E2+G#2+B2 0.25:C4+E2+G#2+B2 // "E7"c2-c/Ac/- - E7 chord with complete harmony
            0.25:C4+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 1.0:A3+A2+C3+E3+G3 // c/A/-A3- - Am7 chord with full voicing
            0.75:A3+C2+E2+G2+Bb2 0.5:A3+C2+E2+G2+Bb2 0.25:C4+C2+E2+G2+Bb2 0.25:C4+C2+E2+G2+Bb2 // "C7"A2-A/cc/- - C7 chord with rich dominant voicing
            0.25:C4+B2+D3+F#3 0.25:C4+B2+D3+F#3 0.25:C4+B2+D3+F#3 0.25:C4+B2+D3+F#3 0.5:D4+B2+D3+F#3 // "B7"c/ccc/d - B7 chord with sustained harmony
            0.75:B3+E2+G#2+B2+D3 0.5:F#3+E2+G#2+B2+D3 0.5:A3+E2+G#2+B2+D3 // "E7sus"B2^F>A - E7sus chord with 9th
            0.25:C4+A2+C3+E3+G3 0.25:B3+A2+C3+E3+G3 1.0:A3+A2+C3+E3+G3 // "Am7"c/B/A3- - Am7 chord with full voicing
            0.5:A3+A2+C#3+E3+G3 0.25:A3+A2+C#3+E3+G3 0.25:A3+A2+C#3+E3+G3 0.25:C4+A2+C#3+E3+G3 0.25:E4+A2+C#3+E3+G3 0.5:D4+A2+C#3+E3+G3 // "A7"AA/A/c/ed/- - A7 chord with extended dominant

            // Final section - outro with rich harmonization
            1.5:D4+D2+F#2+A2+C3 // "D7"d4- - D7 chord with full dominant 7th voicing
            0.5:D4+D2+F3+A3 0.25:E4+D2+F3+A3 0.25:D4+D2+F3+A3 0.25:C4+D2+F3+A3 0.25:A3+D2+F3+A3 0.5:C4+D2+F3+A3 // "Dm7"de/d/c/Ac/- - Dm7 chord with rich texture
            0.25:C4+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.75:A3+A2+C3+E3+G3 // "Am7"c/A/A/A/-A2 - Am7 chord with extended voicing
            0.5:A3+A2+C#3+E3+G3 0.25:A3+A2+C#3+E3+G3 0.25:A3+A2+C#3+E3+G3 0.25:C4+A2+C#3+E3+G3 0.25:E4+A2+C#3+E3+G3 0.5:D4+A2+C#3+E3+G3 // "A7"AA/A/c/ed/- - A7 chord with rich dominant texture
            1.5:D4+D2+F#2+A2+C3 // "D7"d4- - D7 chord with full dominant 7th
            0.5:D4+D2+F3+A3 0.25:E4+D2+F3+A3 0.25:D4+D2+F3+A3 0.25:C4+D2+F3+A3 0.25:A3+D2+F3+A3 0.5:C4+D2+F3+A3 // "Dm7"de/d/c/Ac/- - Dm7 chord with sustained voices
            0.25:C4+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.25:A3+A2+C3+E3+G3 0.5:A3+A2+C3+E3+G3 // "Am7"c/A/A/AA/A- - Am7 chord with full texture
            0.5:A3+E2+G#2+B2+D3 0.75:REST // "E7"Azz2 - E7 chord with 9th and space

            // Final chord progression with rich, full harmony
            0.75:A3+C4+E4+A2+E3 // A minor chord with doubled voices
            0.75:E3+G#3+B3+E2+B2 // E major chord with rich voicing
            0.75:A3+C4+E4+A2+E3 // A minor chord with fuller texture
            0.75:D3+F3+A3+D2+A2 // D minor chord with doubled bass
            1.5:A2+E3+A3+C4+E4+A4 // Final A minor chord with full range
        `
    }
}

// Add helper methods to MusicData
window.MusicData.getAllMelodyIds = function () {
    return Object.keys(this.MELODIES);
};

window.MusicData.getMelody = function (id) {
    return this.MELODIES[id];
};
