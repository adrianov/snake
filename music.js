class MusicManager {
    constructor() {
        // Audio context and nodes
        this.audioContext = null;
        this.masterGain = null;
        this.melodyGain = null;
        this.drumGain = null;

        // Playback state
        this.currentMelodyId = null;
        this.isPlaying = false;
        this.melodyScheduler = null;
        this.drumScheduler = null;
        this.activeOscillators = new Set();  // Track all active sound sources

        // Timing
        this.nextNoteTime = 0;
        this.currentNoteIndex = 0;
        this.currentBeatIndex = 0;

        // Define frequency map for notes
        this.noteFrequencies = {
            'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
            'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
            'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46,
            'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
            'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51,
            'REST': 0
        };

        // Drums/percussion sounds
        this.drumTypes = {
            kick: { freq: 60, type: 'sine', decay: 0.2 },
            snare: { freq: 150, type: 'triangle', decay: 0.15, noise: true },
            hihat: { freq: 300, type: 'highpass', decay: 0.1, noise: true }
        };
    }

    init(audioContext = null) {
        // Clean up any existing audio context
        this.stopMusic(true);

        // Create or use provided audio context
        if (!audioContext || (audioContext && audioContext.state === 'closed')) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } else {
            this.audioContext = audioContext;
        }

        // Create gain node structure
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);

        this.melodyGain = this.audioContext.createGain();
        this.melodyGain.gain.value = 0.7;  // Increased volume to compensate for removed chords
        this.melodyGain.connect(this.masterGain);

        this.drumGain = this.audioContext.createGain();
        this.drumGain.gain.value = 0.2;
        this.drumGain.connect(this.masterGain);

        // Reset playback state
        this.isPlaying = false;
        this.activeOscillators.clear();
    }

    selectRandomMelody() {
        // Select a random melody ID from the available melodies
        const melodyIds = window.MusicData.getAllMelodyIds();
        if (melodyIds.length > 0) {
            const randomIndex = Math.floor(Math.random() * melodyIds.length);
            this.currentMelodyId = melodyIds[randomIndex];
        }
        return this.currentMelodyId;
    }

    startMusic() {
        // Stop any existing music first
        this.stopMusic();

        // Select a melody if none is currently selected
        if (!this.currentMelodyId) {
            this.selectRandomMelody();
        }

        // Get the melody data from our new system
        const musicData = window.MusicData.getMelody(this.currentMelodyId);
        if (!musicData) return;

        // Ensure audio context is running
        if (this.audioContext && this.audioContext.state !== 'running') {
            try {
                // Modern browsers require user interaction to start AudioContext
                this.audioContext.resume().then(() => {
                    console.log('AudioContext successfully resumed');
                    this.startMusicPlayback(musicData);
                }).catch(err => {
                    console.error('Failed to resume AudioContext:', err);
                    // Reinitialize AudioContext if needed
                    this.init();
                    this.startMusicPlayback(musicData);
                });
            } catch (err) {
                console.error('Error resuming AudioContext:', err);
                // Reinitialize AudioContext if needed
                this.init();
                this.startMusicPlayback(musicData);
            }
        } else {
            // AudioContext is already running or doesn't exist
            this.startMusicPlayback(musicData);
        }
    }

    startMusicPlayback(musicData) {
        // Ensure we have a valid audio context and master gain
        if (!this.audioContext || !this.masterGain) {
            console.error('Cannot start music: AudioContext or MasterGain is null');
            return;
        }

        // Make sure master gain is set to audible level
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        // Reset playback state
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.currentBeatIndex = 0;
        this.nextNoteTime = this.audioContext.currentTime;

        // Start schedulers
        this.scheduleNotes();
        this.scheduleBeats();
    }

    scheduleNotes() {
        if (!this.isPlaying) return;

        const musicData = window.MusicData.getMelody(this.currentMelodyId);
        if (!musicData || !musicData.melody) return;

        const melody = musicData.melody;
        const secondsPerBeat = 60.0 / musicData.tempo;

        // Schedule 3 notes at a time
        const notesToSchedule = Math.min(3, melody.length - this.currentNoteIndex);
        let schedulingTime = 0;

        for (let i = 0; i < notesToSchedule; i++) {
            const noteIndex = (this.currentNoteIndex + i) % melody.length;
            const note = melody[noteIndex];
            const duration = note.duration * secondsPerBeat;

            if (note.note !== 'REST') {
                this.playNote(note.note, this.nextNoteTime + schedulingTime, duration);
            }

            schedulingTime += duration;
        }

        // Update current index and next time
        this.currentNoteIndex = (this.currentNoteIndex + notesToSchedule) % melody.length;
        const nextScheduleTime = schedulingTime * 1000 * 0.8; // Schedule next batch at 80% of current duration

        // Schedule next batch of notes
        this.melodyScheduler = setTimeout(() => {
            if (this.isPlaying) {
                this.nextNoteTime += schedulingTime;
                this.scheduleNotes();
            }
        }, Math.max(nextScheduleTime, 100)); // At least 100ms to avoid tight scheduling
    }

    scheduleBeats() {
        if (!this.isPlaying) return;

        const musicData = window.MusicData.getMelody(this.currentMelodyId);
        if (!musicData || !musicData.beats) return;

        const beats = musicData.beats;
        const secondsPerBeat = 60.0 / musicData.tempo;

        // Define one measure as one complete cycle through the beat pattern
        const measureLength = 1.0; // In beats
        const measureDuration = measureLength * secondsPerBeat;
        let currentTime = this.nextNoteTime;

        // Schedule all beats for one measure
        for (const beat of beats) {
            const time = currentTime + beat.time * secondsPerBeat;
            if (time >= this.audioContext.currentTime) { // Only schedule if in the future
                this.playDrum(beat.type, time);
            }
        }

        // Schedule next batch of beats
        this.drumScheduler = setTimeout(() => {
            if (this.isPlaying) {
                this.scheduleBeats();
            }
        }, measureDuration * 1000 * 0.75); // Schedule next batch at 75% through the measure
    }

    playNote(noteName, startTime, duration) {
        if (!this.audioContext || !this.isPlaying) return;

        // Skip if the note is a rest
        if (noteName === 'REST') return;

        // Create oscillator and gain for envelope
        const oscillator = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        // Use triangle wave for melody (clear, pure sound)
        oscillator.type = 'triangle';

        // Set note frequency
        const frequency = this.noteFrequencies[noteName];
        if (frequency) {
            oscillator.frequency.value = frequency;
        } else {
            console.warn(`Unknown note: ${noteName}, defaulting to A4`);
            oscillator.frequency.value = 440;
        }

        // ADSR envelope
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(0.7, startTime + 0.02); // Attack
        envelope.gain.linearRampToValueAtTime(0.5, startTime + 0.08); // Decay
        envelope.gain.setValueAtTime(0.5, startTime + duration * 0.75); // Sustain
        envelope.gain.linearRampToValueAtTime(0, startTime + duration); // Release

        // Connect audio nodes
        oscillator.connect(envelope);
        envelope.connect(this.melodyGain);

        // Track this oscillator for potential cleanup
        this.activeOscillators.add(oscillator);

        // Play the note
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.05);

        // Remove from tracking when finished
        oscillator.onended = () => {
            this.activeOscillators.delete(oscillator);
        };
    }

    playDrum(drumType, time) {
        if (!this.audioContext || !this.isPlaying) return;

        const drumConfig = this.drumTypes[drumType];
        if (!drumConfig) return;

        if (drumConfig.noise) {
            // Noise-based drum (hihat, snare)
            this.playNoiseDrum(drumConfig, time);
        } else {
            // Tonal drum (kick)
            this.playTonalDrum(drumConfig, time);
        }
    }

    playNoiseDrum(config, time) {
        // Create a buffer of white noise
        const bufferSize = this.audioContext.sampleRate * 0.1; // 100ms of noise
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Fill with random values (white noise)
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Create and configure noise source
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // Create envelope
        const envelope = this.audioContext.createGain();
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(0.3, time + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + config.decay);

        // Create filter based on the drum type
        const filter = this.audioContext.createBiquadFilter();
        if (config.type === 'highpass') {
            filter.type = 'highpass';
            filter.frequency.value = 5000; // Higher for hihat
        } else {
            filter.type = 'bandpass';
            filter.frequency.value = config.freq;
            filter.Q.value = 1;
        }

        // Connect components
        noise.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.drumGain);

        // Track this source
        this.activeOscillators.add(noise);

        // Play
        noise.start(time);
        noise.stop(time + config.decay + 0.05);

        // Clean up
        noise.onended = () => {
            this.activeOscillators.delete(noise);
        };
    }

    playTonalDrum(config, time) {
        // Create oscillator for tonal drums like kick
        const oscillator = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        // Configure
        oscillator.type = config.type || 'sine';
        oscillator.frequency.setValueAtTime(config.freq, time);
        oscillator.frequency.exponentialRampToValueAtTime(config.freq * 0.5, time + 0.15);

        // Envelope
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(0.5, time + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + config.decay);

        // Connect
        oscillator.connect(envelope);
        envelope.connect(this.drumGain);

        // Track
        this.activeOscillators.add(oscillator);

        // Play
        oscillator.start(time);
        oscillator.stop(time + config.decay + 0.05);

        // Clean up
        oscillator.onended = () => {
            this.activeOscillators.delete(oscillator);
        };
    }

    getNoteFrequency(noteName) {
        // Extract the note without octave
        const matches = noteName.match(/^([A-G][#b]?)(\d)$/);
        if (!matches) return 440; // Default to A4

        const note = matches[1];
        const octave = parseInt(matches[2]);

        // Calculate base frequency for the note
        const baseFreq = this.noteFrequencies[note + octave] || 440;
        return baseFreq;
    }

    stopMusic(fullCleanup = false) {
        // Immediately set playing state to false to prevent scheduled callbacks
        this.isPlaying = false;

        // Clear all schedulers
        if (this.melodyScheduler) {
            clearTimeout(this.melodyScheduler);
            this.melodyScheduler = null;
        }

        if (this.drumScheduler) {
            clearTimeout(this.drumScheduler);
            this.drumScheduler = null;
        }

        // Stop all active oscillators immediately
        if (this.audioContext) {
            // Immediately kill all playing sounds
            for (const source of this.activeOscillators) {
                try {
                    source.stop(0);
                    source.disconnect();
                } catch (e) {
                    // Ignore errors from already stopped oscillators
                }
            }

            // Clear the set
            this.activeOscillators.clear();

            // Silence all gain nodes immediately
            if (this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            }

            // Suspend the audio context to stop processing
            try {
                this.audioContext.suspend();
            } catch (e) {
                console.error('Error suspending audio context:', e);
            }

            // Full cleanup for when we're completely done with this audio context
            if (fullCleanup) {
                try {
                    // Disconnect all nodes
                    if (this.masterGain) this.masterGain.disconnect();
                    if (this.melodyGain) this.melodyGain.disconnect();
                    if (this.drumGain) this.drumGain.disconnect();

                    // Close the audio context if we created it
                    if (this.audioContext && this.audioContext.state !== 'closed') {
                        this.audioContext.close();
                    }

                    // Null out references
                    this.audioContext = null;
                    this.masterGain = null;
                    this.melodyGain = null;
                    this.drumGain = null;
                } catch (e) {
                    console.error('Error closing audio context:', e);
                }
            } else {
                // If not doing full cleanup, prepare for reuse
                setTimeout(() => {
                    if (this.audioContext && this.audioContext.state === 'suspended') {
                        try {
                            this.audioContext.resume();
                            if (this.masterGain) {
                                this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                            }
                        } catch (e) {
                            console.error('Error resuming audio context:', e);
                        }
                    }
                }, 200);
            }
        }

        // Reset playback state
        this.nextNoteTime = 0;
        this.currentNoteIndex = 0;
        this.currentBeatIndex = 0;
    }

    getCurrentMelody() {
        if (!this.currentMelodyId) {
            return null;
        }

        const melody = window.MusicData.getMelody(this.currentMelodyId);
        if (!melody) return null;

        return {
            id: this.currentMelodyId,
            name: melody.name
        };
    }
}

// Make MusicManager a global variable
window.MusicManager = MusicManager;
