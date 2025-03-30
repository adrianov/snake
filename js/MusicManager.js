class MusicManager {
    // Static property to store melody ID across instances
    static currentMelodyId = null;

    constructor(audioContext = null) {
        // Audio context and nodes
        this.audioContext = audioContext;
        this.masterGain = null;
        this.melodyGain = null;

        // Playback state
        this.currentMelodyId = MusicManager.currentMelodyId; // Initialize from static property
        this.isPlaying = false;
        this.melodyScheduler = null;
        this.activeOscillators = new Set();  // Track all active sound sources

        // Timing
        this.nextNoteTime = 0;
        this.currentNoteIndex = 0;

        // Define frequency map for notes (only includes notes actually used in melodies)
        this.noteFrequencies = {
            // Octave 1-2 (low bass notes)
            'F1': 43.65, 'G1': 49.00, 'A1': 55.00, 'B1': 61.74,
            'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31,
            'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,

            // Octave 3 (bass notes)
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61,
            'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,

            // Octave 4 (middle range)
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,

            // Octave 5 (treble range)
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25, 'E5': 659.26, 'F5': 698.46,
            'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,

            // Octave 6 (high treble range)
            'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'Eb6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
            'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'B6': 1975.53,

            // Special case
            'REST': 0
        };

        // If AudioContext is provided, setup audio nodes immediately
        if (this.audioContext) {
            this.setupGainNodes();
        }
    }

    // Setup gain nodes for volume control
    setupGainNodes() {
        if (!this.audioContext) return;
        
        // Clean up old nodes if they exist
        if (this.masterGain) {
            try {
                this.masterGain.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
        }
        if (this.melodyGain) {
            try {
                this.melodyGain.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
        }
        
        // Create gain nodes
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.audioContext.destination);

        this.melodyGain = this.audioContext.createGain();
        this.melodyGain.gain.value = 0.9;
        this.melodyGain.connect(this.masterGain);
    }

    // Save melody ID to static property
    saveMelodyId() {
        if (this.currentMelodyId) {
            MusicManager.currentMelodyId = this.currentMelodyId;
        }
    }

    // Restore melody ID from static property
    restoreMelodyId() {
        if (MusicManager.currentMelodyId) {
            this.currentMelodyId = MusicManager.currentMelodyId;
            return true;
        }
        return false;
    }

    // Select a random melody
    selectRandomMelody() {
        if (!window.MusicData) return null;
        
        // Select a random melody ID from the available melodies
        const melodyIds = window.MusicData.getAllMelodyIds();
        if (melodyIds.length > 0) {
            // If we have more than one melody and we're already playing one,
            // make sure we select a different one
            if (melodyIds.length > 1 && this.currentMelodyId) {
                // Filter out the current melody ID
                const availableMelodyIds = melodyIds.filter(id => id !== this.currentMelodyId);
                // Select a random melody from the filtered list
                const randomIndex = Math.floor(Math.random() * availableMelodyIds.length);
                this.currentMelodyId = availableMelodyIds[randomIndex];
            } else {
                // Either we're not playing anything yet or there's only one melody
                const randomIndex = Math.floor(Math.random() * melodyIds.length);
                this.currentMelodyId = melodyIds[randomIndex];
            }
            // Save to static property
            MusicManager.currentMelodyId = this.currentMelodyId;
        }
        return this.currentMelodyId;
    }

    // Start music
    startMusic() {
        // Always stop any existing music first
        this.stopMusic();

        // Check if music is enabled in game settings
        if (window.SnakeGame && window.SnakeGame.gameStateManager) {
            const gameState = window.SnakeGame.gameStateManager.getGameState();
            if (!gameState.musicEnabled) {
                return; // Don't play music if it's disabled
            }
        }

        // We need a valid AudioContext to play music
        if (!this.audioContext) {
            return;
        }
        
        // If AudioContext is suspended, try to resume it
        if (this.audioContext.state === 'suspended') {
            try {
                // Resume and continue with playback
                this.audioContext.resume().then(() => {
                    if (this.audioContext && this.audioContext.state === 'running') {
                        this._continueStartMusic();
                    }
                }).catch(() => {});
                return; // Wait for resume to complete
            } catch (e) {
                return; // Failed to resume
            }
        }
        
        // Continue with starting music if context is already running
        this._continueStartMusic();
    }
    
    // Helper method to continue starting music after audio context checks
    _continueStartMusic() {
        // Make sure we have the necessary audio nodes
        if (!this.masterGain || !this.melodyGain) {
            this.setupGainNodes();
        }
        
        // Select a melody if we don't have one
        if (!this.currentMelodyId) {
            this.selectRandomMelody();
        }
        
        // Get melody data
        const musicData = window.MusicData?.getMelody(this.currentMelodyId);
        if (!musicData) {
            return;
        }
        
        // Start playback
        this.startMusicPlayback(musicData);
    }

    // Start actual music playback
    startMusicPlayback(musicData) {
        // Bail if we're missing required components
        if (!this.audioContext || !this.masterGain || !this.melodyGain) {
            return;
        }

        // Make sure master gain is set to audible level
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.masterGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);

        // Reset playback state
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.nextNoteTime = this.audioContext.currentTime;

        // Start scheduler
        this.scheduleNotes();
    }

    scheduleNotes() {
        if (!this.isPlaying) return;

        const musicData = window.MusicData?.getMelody(this.currentMelodyId);
        if (!musicData || !musicData.melody) return;

        const melody = this.parseMelody(musicData.melody);
        const secondsPerBeat = 60.0 / musicData.tempo;

        // Schedule 4 notes at a time for smoother scheduling
        const notesToSchedule = Math.min(4, melody.length - this.currentNoteIndex);
        let schedulingTime = 0;

        for (let i = 0; i < notesToSchedule; i++) {
            const noteIndex = (this.currentNoteIndex + i) % melody.length;
            const note = melody[noteIndex];

            const duration = note[0] * secondsPerBeat;
            const noteData = note[1];

            // Handle both single notes and chords (arrays of notes)
            if (noteData !== 'REST') {
                // Calculate legato overlap with next note - notes overlap by 10% of their duration
                const overlapDuration = duration * 0.1;

                if (Array.isArray(noteData)) {
                    // This is a chord - play all notes in the chord
                    const isChord = true;
                    for (const chordNote of noteData) {
                        if (chordNote !== 'REST') {
                            this.playNote(chordNote, this.nextNoteTime + schedulingTime, duration + overlapDuration, isChord);
                        }
                    }
                } else {
                    // This is a single note
                    this.playNote(noteData, this.nextNoteTime + schedulingTime, duration + overlapDuration, false);
                }
            }

            schedulingTime += duration;
        }

        // Update current index and next time
        this.currentNoteIndex = (this.currentNoteIndex + notesToSchedule) % melody.length;
        const nextScheduleTime = schedulingTime * 1000 * 0.7; // Schedule next batch at 70% of current duration for smoother transitions

        // Schedule next batch of notes
        this.melodyScheduler = setTimeout(() => {
            if (this.isPlaying) {
                this.nextNoteTime += schedulingTime;
                this.scheduleNotes();
            }
        }, Math.max(nextScheduleTime, 100));
    }

    parseMelody(melodyData) {
        // If it's already an array, it's the old format so just return it
        if (Array.isArray(melodyData)) {
            return melodyData;
        }

        // If it's a string, parse it to the array format
        if (typeof melodyData === 'string') {
            const parsedMelody = [];
            // Remove comments and split by whitespace
            const tokens = melodyData
                .replace(/\/\/.*$/gm, '') // Remove comments
                .trim()
                .split(/\s+/); // Split by whitespace

            for (const token of tokens) {
                if (!token || token.length === 0) continue;

                // Parse duration:notes format
                const parts = token.split(':');
                if (parts.length !== 2) continue;

                const duration = parseFloat(parts[0]);

                if (parts[1] === 'REST') {
                    // Handle REST case
                    parsedMelody.push([duration, 'REST']);
                } else if (parts[1].includes('+')) {
                    // Handle chord (notes separated by +)
                    const notes = parts[1].split('+');
                    parsedMelody.push([duration, notes]);
                } else {
                    // Handle single note
                    parsedMelody.push([duration, parts[1]]);
                }
            }
            return parsedMelody;
        }

        return [];
    }

    playNote(noteName, startTime, duration, isPartOfChord = false) {
        if (!this.audioContext || !this.isPlaying) return;

        // Skip if the note is a rest
        if (noteName === 'REST') return;

        // Create oscillators for richer sound
        const sineOsc = this.audioContext.createOscillator();
        const squareOsc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        // Set waveforms for different timbres
        sineOsc.type = 'sine';
        squareOsc.type = 'square';

        // Set note frequency
        const frequency = this.noteFrequencies[noteName];
        if (frequency) {
            sineOsc.frequency.value = frequency;
            squareOsc.frequency.value = frequency;
        } else {
            console.warn(`Unknown note: ${noteName}, defaulting to A4`);
            sineOsc.frequency.value = 440;
            squareOsc.frequency.value = 440;
        }

        // Create a mixer for the oscillators
        const mixer = this.audioContext.createGain();

        // For chords, reduce the gain to avoid clipping
        const gainMultiplier = isPartOfChord ? 0.5 : 1.0;

        mixer.gain.setValueAtTime(0.7 * gainMultiplier, startTime); // Sine wave at 70%
        mixer.gain.setValueAtTime(0.3 * gainMultiplier, startTime); // Square wave at 30%

        // Crisper envelope with stronger attack
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(0.9, startTime + 0.02); // Faster, stronger attack
        envelope.gain.setValueAtTime(0.8, startTime + duration * 0.3); // Higher sustain
        envelope.gain.linearRampToValueAtTime(0, startTime + duration); // Release

        // Connect audio nodes
        sineOsc.connect(mixer);
        squareOsc.connect(mixer);
        mixer.connect(envelope);
        envelope.connect(this.melodyGain);

        // Track oscillators for cleanup
        this.activeOscillators.add(sineOsc);
        this.activeOscillators.add(squareOsc);

        // Play the notes
        sineOsc.start(startTime);
        squareOsc.start(startTime);
        sineOsc.stop(startTime + duration + 0.05);
        squareOsc.stop(startTime + duration + 0.05);

        // Remove from tracking when finished
        sineOsc.onended = () => {
            this.activeOscillators.delete(sineOsc);
        };
        squareOsc.onended = () => {
            this.activeOscillators.delete(squareOsc);
        };
    }

    stopMusic(fullCleanup = false) {
        // Immediately set playing state to false to prevent scheduled callbacks
        this.isPlaying = false;

        // Clear all schedulers
        if (this.melodyScheduler) {
            clearTimeout(this.melodyScheduler);
            this.melodyScheduler = null;
        }

        // Only continue if we have an audio context
        if (!this.audioContext) return;

        try {
            const currentTime = this.audioContext.currentTime;

            // Fade out master gain over 100ms for smoother transition
            if (this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(currentTime);
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 0, currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
            }

            // Stop all active oscillators with a smoother fade
            for (const source of this.activeOscillators) {
                try {
                    source.stop(currentTime + 0.1);
                    source.disconnect();
                } catch (e) {
                    // Ignore errors from already stopped oscillators
                }
            }

            // Clear the set
            this.activeOscillators.clear();

            // Full cleanup if requested
            if (fullCleanup) {
                try {
                    // Disconnect all nodes but don't close the context
                    // (it might be shared with SoundManager)
                    if (this.masterGain) {
                        this.masterGain.disconnect();
                        this.masterGain = null;
                    }
                    if (this.melodyGain) {
                        this.melodyGain.disconnect();
                        this.melodyGain = null;
                    }

                    // We don't want to close the AudioContext since it's shared
                    // Just null our reference to it
                    this.audioContext = null;
                    
                } catch (e) {
                    console.warn('Error cleaning up audio resources:', e);
                }
            }
        } catch (e) {
            console.warn('Error stopping music:', e);
        }

        // Reset playback state
        this.nextNoteTime = 0;
        this.currentNoteIndex = 0;
    }

    getCurrentMelody() {
        if (!this.currentMelodyId) {
            return null;
        }

        const melody = window.MusicData?.getMelody(this.currentMelodyId);
        if (!melody) return null;

        return {
            id: this.currentMelodyId,
            name: melody.name
        };
    }

    // Change to a random melody and restart the music
    changeToRandomMelody() {
        // If music is playing, need to restart with new melody
        const wasPlaying = this.isPlaying;

        // Stop the current melody
        if (wasPlaying) {
            this.stopMusic(false);
        }

        // Select a new random melody
        this.selectRandomMelody();

        // Restart the music if it was playing
        if (wasPlaying) {
            this.startMusic();
        }

        return this.getCurrentMelody();
    }
}

// Make MusicManager a global variable
window.MusicManager = MusicManager;
