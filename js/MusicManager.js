class MusicManager {
    // Static property to store melody ID across instances
    static currentMelodyId = null;
    // Store cleanup timeouts
    static cleanupTimeouts = new Map();
    // Static property to store note frequencies computed once
    static noteFrequencies = MusicManager._generateNoteFrequencies();

    constructor() {
        // Don't create context here, get it from SoundManager later
        this.audioContext = null;

        this.masterGain = null;
        this.melodyGain = null;
        this.isPlaying = false;
        this.currentMelodyId = null;
        this.currentNoteIndex = 0;
        this.nextNoteTime = 0;
        this.melodyScheduler = null;
        this.activeOscillators = new Set();

        // Use the static note frequencies instead of generating them per instance
        this.noteFrequencies = MusicManager.noteFrequencies;

        // Note: We don't start music here, only on explicit user action or game start
    }

    // Internal method to generate frequencies (moved from constructor and made static)
    static _generateNoteFrequencies() {
        // Using a base frequency (A4 = 440 Hz)
        const A4 = 440;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const frequencies = {};

        for (let octave = 0; octave < 9; octave++) {
            for (let i = 0; i < notes.length; i++) {
                const noteName = notes[i] + octave;
                // Calculate frequency relative to A4
                // Formula: freq = A4 * 2^((noteIndex - A4Index) / 12)
                // A4 is the 9th note (index 9) in the 4th octave
                const noteIndex = octave * 12 + i;
                const a4Index = 4 * 12 + 9;
                const frequency = A4 * Math.pow(2, (noteIndex - a4Index) / 12);
                frequencies[noteName] = frequency;

                // Add common flat aliases (more robust)
                if (notes[i].includes('#')) {
                    const flatNote = notes[(i + 1) % 12].replace('#', '') + 'b' + octave;
                    // Basic check, overwrite if Cb or Fb which are less common
                    if (flatNote.startsWith('Cb') || flatNote.startsWith('Fb')) {
                        frequencies[flatNote] = frequency;
                    } else {
                        const baseFlatNote = notes[(i + 1) % 12] + 'b' + octave;
                        frequencies[baseFlatNote] = frequency;
                    }
                }
            }
        }
        frequencies['REST'] = 0;
        return frequencies;
    }

    // Helper to get a valid AudioContext (NOW USES SHARED CONTEXT)
    getValidAudioContext() {
        // Always try to get the shared context from SoundManager
        const context = SoundManager.getAudioContext();

        if (context && context.state === 'running') {
            // console.log("MusicManager: Using running shared AudioContext."); // Reduce noise
            return context;
        }

        if (context && context.state === 'suspended') {
            console.log("MusicManager: Shared context is suspended. Attempting resume...");
            // Try to resume the shared context (SoundManager handles the promise)
            SoundManager.instance?.resumeAudioContext();
            // Return the suspended context for now, resume is async
            return context;
        }

        if (context && context.state === 'closed') {
            console.warn("MusicManager: Shared context is closed. Cannot use.");
            return null;
        }

        // If context doesn't exist yet and we have interaction, SoundManager should create it.
        // We might need to trigger SoundManager's init if it hasn't happened.
        if (!context && SoundManager.hasUserInteraction) {
            console.log("MusicManager: Shared context not found, requesting SoundManager init...");
            SoundManager.instance?.initAudioContext(true); // Request SoundManager to create it
            return SoundManager.getAudioContext(); // Return the newly created context (might be suspended)
        }

        // If no interaction yet, or init failed, return null
        console.log(`MusicManager: Cannot get valid AudioContext. Shared context state: ${context?.state}, Interaction: ${SoundManager.hasUserInteraction}`);
        return null;
    }

    // Method called by Game.js after user interaction
    initAudioContextIfNeeded() {
        console.log("MusicManager initAudioContextIfNeeded called.");
        // Try to get the shared context
        this.audioContext = this.getValidAudioContext();

        if (this.audioContext) {
            console.log(`MusicManager: Acquired shared context. State: ${this.audioContext.state}`);
            // If context is running and gain nodes aren't set up, do it now
            if (this.audioContext.state === 'running' && !this.masterGain) {
                console.log("MusicManager context running, setting up gain nodes.");
                this.setupGainNodes();
            }
            // No need to explicitly resume here, getValidAudioContext or startMusic will handle it
        } else {
            console.warn("MusicManager: Failed to acquire shared AudioContext.");
        }
    }

    // Setup gain nodes (Master and Melody)
    setupGainNodes() {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.warn("Cannot setup gain nodes: AudioContext not available or not running.");
            return;
        }
        if (this.masterGain) return; // Already setup

        console.log("Setting up MusicManager gain nodes...");
        this.masterGain = this.audioContext.createGain();
        this.melodyGain = this.audioContext.createGain();

        // Connect melody gain to master gain, and master gain to destination
        this.melodyGain.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        // Set initial volumes (master gain often controlled by user later)
        this.masterGain.gain.value = 0.5; // Default master volume
        this.melodyGain.gain.value = 1.0; // Melody at full volume relative to master
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

    // Start playing music
    startMusic() {
        // Prevent starting if already playing
        if (this.isPlaying) {
            console.log("MusicManager: startMusic called but already playing.");
            return;
        }

        // 1. Ensure we have user interaction (checked by SoundManager now)
        if (!SoundManager.hasUserInteraction) {
            console.log("MusicManager start deferred: No user interaction yet.");
            return;
        }

        // 2. Ensure shared context exists and is RUNNING
        // initAudioContextIfNeeded gets the context but doesn't guarantee it's running
        this.initAudioContextIfNeeded();
        const context = this.audioContext;

        // *** Check if context is actually running now ***
        if (!context || context.state !== 'running') {
            console.warn(`MusicManager: Cannot start music because shared context is not running. State: ${context?.state}. Will wait for SoundManager to trigger start upon resume.`);
            return;
        }

        // 3. Remove the explicit resume call here - SoundManager handles triggering startMusic after resume
        // SoundManager.instance?.resumeAudioContext().then(resumed => { ... });

        // --- Context is running, proceed with setup and playback ---
        console.log("MusicManager: Shared context is running. Proceeding with music setup.");

        // 4. Ensure gain nodes are set up (using the running shared context)
        this.setupGainNodes(); // setupGainNodes uses this.audioContext which is now the shared one
        if (!this.masterGain || !this.melodyGain) {
            console.error("MusicManager: Failed to setup gain nodes on shared context.");
            return;
        }

        // 5. If already playing, don't restart
        if (this.isPlaying) {
            console.log("Music is already playing.");
            return;
        }

        // 6. Select a melody if needed
        if (!this.currentMelodyId) {
            // If no melody ID is restored, then select a new random one
            // This specifically handles the case after game over when MusicManager.currentMelodyId was cleared
            if (!this.restoreMelodyId()) {
                console.log("No saved melody found, selecting a new random melody");
                this.selectRandomMelody();
            }
        }

        // 7. Get melody data
        const musicData = window.MusicData?.getMelody(this.currentMelodyId);
        if (!musicData) {
            console.error(`Melody data not found for ID: ${this.currentMelodyId}`);
            return;
        }

        console.log(`Starting music playback on shared context: ${this.currentMelodyId}`);
        // 8. Start actual playback
        this.startMusicPlayback(musicData);
    }

    // Start actual music playback
    startMusicPlayback(musicData) {
        // Use the shared context stored in this.audioContext
        const context = this.audioContext;
        if (!context || context.state !== 'running') {
            console.error("Cannot start playback: Shared context not available or not running.");
            return;
        }

        // Bail if we're missing required components
        if (!this.masterGain || !this.melodyGain) {
            this.setupGainNodes();
            // Check again if setup failed
            if (!this.masterGain || !this.melodyGain) {
                console.error("Failed to setup gain nodes. Cannot start music.");
                return;
            }
        }

        // Make sure master gain is set to audible level
        this.masterGain.gain.cancelScheduledValues(context.currentTime);
        this.masterGain.gain.setValueAtTime(0.5, context.currentTime);

        // Reset playback state
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.nextNoteTime = context.currentTime;

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

        // Only continue if we have the shared audio context
        const context = this.audioContext; // Use shared context
        if (!context) return;

        try {
            const currentTime = context.currentTime;

            // Fade out master gain over 100ms for smoother transition
            if (this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(currentTime);
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 0, currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
            }

            // Stop all active oscillators
            if (this.activeOscillators) {
                this.activeOscillators.forEach(osc => {
                    try {
                        // Check if stop method exists before calling
                        if (typeof osc.stop === 'function') {
                            osc.stop(currentTime);
                        }
                        // Disconnect after stopping
                        osc.disconnect();
                    } catch (e) {
                        // Ignore errors if oscillator already stopped or disconnected
                    }
                });
                this.activeOscillators.clear();
            }

            // If full cleanup, disconnect nodes
            if (fullCleanup) {
                console.log("MusicManager: Full cleanup. Disconnecting all nodes.");
                if (this.melodyGain) this.melodyGain.disconnect();
                if (this.masterGain) this.masterGain.disconnect();
                this.melodyGain = null;
                this.masterGain = null;

                // We DO NOT close or nullify the AudioContext anymore
                // Just null our reference to the shared context
                // this.audioContext = null; // This was causing issues with restart
            } else {
                console.log("MusicManager: Partial cleanup. Preserving nodes and context.");
                // Keep references to gain nodes, just set their gains to 0
                if (this.masterGain) {
                    this.masterGain.gain.value = 0;
                }
            }

        } catch (e) {
            console.error("Error stopping music:", e);
        }
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

    // Clean up audio resources completely
    static cleanupAudioResources(gameInstance, delay = 0) {
        // Cancel any pending cleanup first
        const timeoutId = MusicManager.cleanupTimeouts.get(gameInstance);
        if (timeoutId) {
            clearTimeout(timeoutId);
            MusicManager.cleanupTimeouts.delete(gameInstance);
        }

        const gameState = gameInstance.gameStateManager.getGameState();

        // Don't schedule cleanup if game is actively playing
        // This prevents accidentally stopping music during gameplay
        if (gameState.isGameStarted && !gameState.isPaused && !gameState.isGameOver) {
            return;
        }

        if (delay > 0) {
            // Store the timeout ID so it can be cancelled if needed
            const newTimeoutId = setTimeout(() => {
                // Double-check game state before cleanup in case it changed during the delay
                const currentGameState = gameInstance.gameStateManager.getGameState();
                if (currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                    MusicManager.cleanupTimeouts.delete(gameInstance);
                    return;
                }

                // Perform cleanup
                if (gameInstance.musicManager && (currentGameState.isGameOver || currentGameState.isPaused)) {
                    gameInstance.musicManager.stopMusic(true);
                    gameInstance.musicManager = null;
                }

                // Only clean up sound manager if game is over or paused
                if (gameInstance.soundManager && (currentGameState.isGameOver || currentGameState.isPaused)) {
                    gameInstance.soundManager.closeAudioContext();
                }

                // Remove from tracking map once completed
                MusicManager.cleanupTimeouts.delete(gameInstance);
            }, delay);

            // Store the timeout ID for possible cancellation
            MusicManager.cleanupTimeouts.set(gameInstance, newTimeoutId);
        } else {
            // Perform immediate cleanup
            if (gameInstance.musicManager && (gameState.isGameOver || gameState.isPaused)) {
                gameInstance.musicManager.stopMusic(true);
                gameInstance.musicManager = null;
            }

            // Only clean up sound manager if game is over or paused
            if (gameInstance.soundManager && (gameState.isGameOver || gameState.isPaused)) {
                gameInstance.soundManager.closeAudioContext();
            }
        }
    }

    // Static method to clear the melody ID, used after game over
    static clearCurrentMelody() {
        MusicManager.currentMelodyId = null;
        console.log("MusicManager: Cleared static melody ID for next game");
    }
}

// Make MusicManager a global variable
window.MusicManager = MusicManager;
