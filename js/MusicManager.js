/**
 * Generates and manages procedural background music.
 * - Implements real-time procedural music generation based on game state
 * - Schedules musical notes with precise timing using Web Audio API
 * - Manages seamless transitions between different music sections and intensities
 * - Adapts musical parameters (tempo, volume, notes) based on gameplay events
 * - Provides memory-efficient music generation without pre-recorded assets
 * - Controls audio node lifecycle to prevent memory leaks during long gameplay sessions
 * - Synchronizes music state with game events (pause, resume, game over)
 * - Implements dynamic instrument and timbre selection for musical variety
 */
class MusicManager {
    // Static properties
    static currentMelodyId = null;
    static cleanupTimeouts = new Map();
    static noteFrequencies = MusicManager._generateNoteFrequencies();

    // Audio-related properties
    static audioContext = null;
    static masterGain = null;
    static melodyGain = null;
    static isPlaying = false;
    static currentNoteIndex = 0;
    static nextNoteTime = 0;
    static melodyScheduler = null;
    static activeOscillators = new Set();

    // Prevent instantiation - this is a static-only class
    constructor() {
        throw new Error("MusicManager is a static class and should not be instantiated.");
    }

    // Internal method to generate frequencies
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

    // Method called by AudioManager after user interaction
    static initAudioContextIfNeeded() {
        console.log("MusicManager initAudioContextIfNeeded called.");
        // Get the shared context from SoundManager
        MusicManager.audioContext = SoundManager.getAudioContext();

        if (MusicManager.audioContext) {
            console.log(`MusicManager: Acquired shared context. State: ${MusicManager.audioContext.state}`);
            // If context is running and gain nodes aren't set up, do it now
            if (MusicManager.audioContext.state === 'running' && !MusicManager.masterGain) {
                console.log("MusicManager context running, setting up gain nodes.");
                MusicManager.setupGainNodes();
            }
        } else {
            console.warn("MusicManager: Failed to acquire shared AudioContext.");
        }
    }

    // Setup gain nodes (Master and Melody)
    static setupGainNodes() {
        if (!MusicManager.audioContext || MusicManager.audioContext.state !== 'running') {
            console.warn("Cannot setup gain nodes: AudioContext not available or not running.");
            return;
        }
        if (MusicManager.masterGain) return; // Already setup

        console.log("Setting up MusicManager gain nodes...");
        MusicManager.masterGain = MusicManager.audioContext.createGain();
        MusicManager.melodyGain = MusicManager.audioContext.createGain();

        // Connect melody gain to master gain, and master gain to destination
        MusicManager.melodyGain.connect(MusicManager.masterGain);
        MusicManager.masterGain.connect(MusicManager.audioContext.destination);

        // Set initial volumes (master gain often controlled by user later)
        MusicManager.masterGain.gain.value = 0.5; // Default master volume
        MusicManager.melodyGain.gain.value = 1.0; // Melody at full volume relative to master
    }

    // Select a random melody
    static selectRandomMelody() {
        if (!window.MusicData) return null;

        // Select a random melody ID from the available melodies
        const melodyIds = window.MusicData.getAllMelodyIds();
        if (melodyIds.length > 0) {
            // If we have more than one melody and we're already playing one,
            // make sure we select a different one
            if (melodyIds.length > 1 && MusicManager.currentMelodyId) {
                // Filter out the current melody ID
                const availableMelodyIds = melodyIds.filter(id => id !== MusicManager.currentMelodyId);
                // Select a random melody from the filtered list
                const randomIndex = Math.floor(Math.random() * availableMelodyIds.length);
                MusicManager.currentMelodyId = availableMelodyIds[randomIndex];
            } else {
                // Either we're not playing anything yet or there's only one melody
                const randomIndex = Math.floor(Math.random() * melodyIds.length);
                MusicManager.currentMelodyId = melodyIds[randomIndex];
            }
        }
        return MusicManager.currentMelodyId;
    }

    // Start playing music
    static startMusic() {
        // Prevent starting if already playing
        if (MusicManager.isPlaying) {
            console.log("MusicManager: startMusic called but already playing.");
            return;
        }

        // 1. Ensure we have user interaction
        if (!SoundManager.hasUserInteraction) {
            console.log("MusicManager start deferred: No user interaction yet.");
            return;
        }

        // 2. Ensure shared context exists and is RUNNING
        MusicManager.initAudioContextIfNeeded();
        const context = MusicManager.audioContext;

        // Check if context is actually running
        if (!context) {
            console.warn("MusicManager: Cannot start music because shared context doesn't exist.");
            return;
        }

        // If context is suspended, try to resume it first
        if (context.state === 'suspended') {
            console.log("MusicManager: AudioContext is suspended, attempting to resume before starting music...");

            // Attempt to resume the context
            context.resume().then(() => {
                if (context.state === 'running') {
                    console.log("MusicManager: AudioContext resumed successfully, now starting music");
                    // Set up gain nodes and continue with music playback
                    MusicManager.setupGainNodes();
                    MusicManager._continueStartMusic();
                } else {
                    console.warn(`MusicManager: Failed to resume AudioContext. State: ${context.state}`);
                }
            }).catch(err => {
                console.error("MusicManager: Error resuming AudioContext:", err);
            });

            return; // Exit early, _continueStartMusic will be called after resume
        }

        if (context.state !== 'running') {
            console.warn(`MusicManager: Cannot start music because shared context is not running. State: ${context.state}.`);
            return;
        }

        // Set up gain nodes if needed
        MusicManager.setupGainNodes();
        if (!MusicManager.masterGain || !MusicManager.melodyGain) {
            console.error("MusicManager: Failed to setup gain nodes on shared context.");
            return;
        }

        // Continue with music start process
        MusicManager._continueStartMusic();
    }

    // Helper method to continue music startup after context is confirmed running
    static _continueStartMusic() {
        // Select a melody if needed
        if (!MusicManager.currentMelodyId) {
            console.log("No melody selected, selecting a new random melody");
            MusicManager.selectRandomMelody();
        }

        // Get melody data
        const musicData = window.MusicData?.getMelody(MusicManager.currentMelodyId);
        if (!musicData) {
            console.error(`Melody data not found for ID: ${MusicManager.currentMelodyId}`);
            return;
        }

        console.log(`Starting music playback on shared context: ${MusicManager.currentMelodyId}`);
        // Start actual playback
        MusicManager.startMusicPlayback(musicData);
    }

    // Start actual music playback
    static startMusicPlayback(musicData) {
        // Use the shared context stored in audioContext
        const context = MusicManager.audioContext;
        if (!context || context.state !== 'running') {
            console.error("Cannot start playback: Shared context not available or not running.");
            return;
        }

        // Bail if we're missing required components
        if (!MusicManager.masterGain || !MusicManager.melodyGain) {
            MusicManager.setupGainNodes();
            // Check again if setup failed
            if (!MusicManager.masterGain || !MusicManager.melodyGain) {
                console.error("Failed to setup gain nodes. Cannot start music.");
                return;
            }
        }

        // Make sure master gain is set to audible level
        MusicManager.masterGain.gain.cancelScheduledValues(context.currentTime);
        MusicManager.masterGain.gain.setValueAtTime(0.5, context.currentTime);

        // Reset playback state
        MusicManager.isPlaying = true;
        MusicManager.currentNoteIndex = 0;
        MusicManager.nextNoteTime = context.currentTime;

        // Mark that audio is working
        SoundManager.hasPlayedAudio = true;

        // Start scheduler
        MusicManager.scheduleNotes();
    }

    static scheduleNotes() {
        if (!MusicManager.isPlaying) return;

        const musicData = window.MusicData?.getMelody(MusicManager.currentMelodyId);
        if (!musicData || !musicData.melody) return;

        const melody = MusicManager.parseMelody(musicData.melody);
        const secondsPerBeat = 60.0 / musicData.tempo;

        // Schedule 4 notes at a time for smoother scheduling
        const notesToSchedule = Math.min(4, melody.length - MusicManager.currentNoteIndex);
        let schedulingTime = 0;

        for (let i = 0; i < notesToSchedule; i++) {
            const noteIndex = (MusicManager.currentNoteIndex + i) % melody.length;
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
                            MusicManager.playNote(chordNote, MusicManager.nextNoteTime + schedulingTime, duration + overlapDuration, isChord);
                        }
                    }
                } else {
                    // This is a single note
                    MusicManager.playNote(noteData, MusicManager.nextNoteTime + schedulingTime, duration + overlapDuration, false);
                }
            }

            schedulingTime += duration;
        }

        // Update current index and next time
        MusicManager.currentNoteIndex = (MusicManager.currentNoteIndex + notesToSchedule) % melody.length;
        const nextScheduleTime = schedulingTime * 1000 * 0.7; // Schedule next batch at 70% of current duration for smoother transitions

        // Schedule next batch of notes
        MusicManager.melodyScheduler = setTimeout(() => {
            if (MusicManager.isPlaying) {
                MusicManager.nextNoteTime += schedulingTime;
                MusicManager.scheduleNotes();
            }
        }, Math.max(nextScheduleTime, 100));
    }

    static parseMelody(melodyData) {
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

    static playNote(noteName, startTime, duration, isPartOfChord = false) {
        if (!MusicManager.audioContext || !MusicManager.isPlaying) return;

        // Skip if the note is a rest
        if (noteName === 'REST') return;

        // Create oscillators for richer sound
        const sineOsc = MusicManager.audioContext.createOscillator();
        const squareOsc = MusicManager.audioContext.createOscillator();
        const envelope = MusicManager.audioContext.createGain();

        // Set waveforms for different timbres
        sineOsc.type = 'sine';
        squareOsc.type = 'square';

        // Set note frequency
        const frequency = MusicManager.noteFrequencies[noteName];
        if (frequency) {
            sineOsc.frequency.value = frequency;
            squareOsc.frequency.value = frequency;
        } else {
            console.warn(`Unknown note: ${noteName}, defaulting to A4`);
            sineOsc.frequency.value = 440;
            squareOsc.frequency.value = 440;
        }

        // Create a mixer for the oscillators
        const mixer = MusicManager.audioContext.createGain();

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
        envelope.connect(MusicManager.melodyGain);

        // Track oscillators for cleanup
        MusicManager.activeOscillators.add(sineOsc);
        MusicManager.activeOscillators.add(squareOsc);

        // Play the notes
        sineOsc.start(startTime);
        squareOsc.start(startTime);
        sineOsc.stop(startTime + duration + 0.05);
        squareOsc.stop(startTime + duration + 0.05);

        // Remove from tracking when finished
        sineOsc.onended = () => {
            MusicManager.activeOscillators.delete(sineOsc);
        };
        squareOsc.onended = () => {
            MusicManager.activeOscillators.delete(squareOsc);
        };
    }

    static stopMusic(fullCleanup = false) {
        // Immediately set playing state to false to prevent scheduled callbacks
        MusicManager.isPlaying = false;

        // Clear all schedulers
        if (MusicManager.melodyScheduler) {
            clearTimeout(MusicManager.melodyScheduler);
            MusicManager.melodyScheduler = null;
        }

        // Only continue if we have the shared audio context
        const context = MusicManager.audioContext;
        if (!context) return;

        try {
            const currentTime = context.currentTime;

            // Fade out master gain over 100ms for smoother transition
            if (MusicManager.masterGain) {
                MusicManager.masterGain.gain.cancelScheduledValues(currentTime);
                MusicManager.masterGain.gain.setValueAtTime(MusicManager.masterGain.gain.value || 0, currentTime);
                MusicManager.masterGain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
            }

            // Stop all active oscillators
            if (MusicManager.activeOscillators) {
                MusicManager.activeOscillators.forEach(osc => {
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
                MusicManager.activeOscillators.clear();
            }

            // If full cleanup, disconnect nodes
            if (fullCleanup) {
                console.log("MusicManager: Full cleanup. Disconnecting all nodes.");
                if (MusicManager.melodyGain) MusicManager.melodyGain.disconnect();
                if (MusicManager.masterGain) MusicManager.masterGain.disconnect();
                MusicManager.melodyGain = null;
                MusicManager.masterGain = null;
            } else {
                console.log("MusicManager: Partial cleanup. Preserving nodes and context.");
                // Keep references to gain nodes, just set their gains to 0
                if (MusicManager.masterGain) {
                    MusicManager.masterGain.gain.value = 0;
                }
            }

        } catch (e) {
            console.error("Error stopping music:", e);
        }
    }

    static getCurrentMelody() {
        if (!MusicManager.currentMelodyId) {
            return null;
        }

        const melody = window.MusicData?.getMelody(MusicManager.currentMelodyId);
        if (!melody) return null;

        return {
            id: MusicManager.currentMelodyId,
            name: melody.name
        };
    }

    // Change to a random melody and restart the music
    static changeToRandomMelody() {
        // If music is playing, need to restart with new melody
        const wasPlaying = MusicManager.isPlaying;

        // Stop the current melody
        if (wasPlaying) {
            MusicManager.stopMusic(false);
        }

        // Select a new random melody
        MusicManager.selectRandomMelody();

        // Restart the music if it was playing
        if (wasPlaying) {
            MusicManager.startMusic();
        }

        return MusicManager.getCurrentMelody();
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

                // Critical fix: Don't perform cleanup if game is now active again
                // This prevents the cleanup from stopping music after a quick restart
                if (currentGameState.isGameStarted && !currentGameState.isPaused && !currentGameState.isGameOver) {
                    console.log("MusicManager: Cancelling scheduled cleanup because game is now active");
                    MusicManager.cleanupTimeouts.delete(gameInstance);
                    return;
                }

                // Perform cleanup only if game is still over or paused
                if ((currentGameState.isGameOver || currentGameState.isPaused)) {
                    MusicManager.stopMusic(true);

                    // Only clean up sound manager if game is over or paused
                    if (gameInstance.soundManager) {
                        gameInstance.soundManager.closeAudioContext();
                    }
                }

                // Remove from tracking map once completed
                MusicManager.cleanupTimeouts.delete(gameInstance);
            }, delay);

            // Store the timeout ID for possible cancellation
            MusicManager.cleanupTimeouts.set(gameInstance, newTimeoutId);
        } else {
            // Perform immediate cleanup
            if ((gameState.isGameOver || gameState.isPaused)) {
                MusicManager.stopMusic(true);

                // Only clean up sound manager if game is over or paused
                if (gameInstance.soundManager) {
                    gameInstance.soundManager.closeAudioContext();
                }
            }
        }
    }

    // Clear the melody ID, used after game over
    static clearCurrentMelody() {
        MusicManager.currentMelodyId = null;
        console.log("MusicManager: Cleared melody ID for next game");
    }
}

// Make MusicManager a global variable
window.MusicManager = MusicManager;
