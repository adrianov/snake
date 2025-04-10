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
 * - Relies on SoundManager for core audio context management
 * - Supports pausing and resuming when device audio is muted
 */
class MusicManager {
    // Static properties
    static currentMelodyId = null;
    static cleanupTimeouts = new Map();
    static noteFrequencies = MusicManager._generateNoteFrequencies();

    // Audio-related properties
    static audioContext = null; // Will be initialized from SoundManager
    static masterGain = null;
    static melodyGain = null;
    static isPlaying = false;
    static isPaused = false; // New property to track pause state
    static currentNoteIndex = 0;
    static nextNoteTime = 0;
    static melodyScheduler = null;
    static activeOscillators = new Set();
    static hasStateChangeListener = false;
    static pausedAtTime = 0; // Track when music was paused

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

    /**
     * Initializes the audio context for music if needed
     * @returns {boolean} Success status
     */
    static initAudioContextIfNeeded() {
        // Use SoundManager's shared context instead of creating our own
        if (SoundManager.audioContext) {
            MusicManager.audioContext = SoundManager.audioContext;

            // Setup gain nodes if needed
            if (!MusicManager.masterGain) {
                MusicManager.setupGainNodes();
            }

            return true;
        }

        return false;
    }

    // Setup gain nodes (Master and Melody)
    static setupGainNodes() {
        // Ensure context exists
        if (!MusicManager.audioContext) {
             console.warn("MusicManager: Cannot setup gain nodes: AudioContext not available.");
             return false; // Still return false if context is totally missing
        }
        // Log if context is not running, but attempt setup anyway
        if (MusicManager.audioContext.state !== 'running') {
             console.warn(`MusicManager: AudioContext state is '${MusicManager.audioContext.state}' during setupGainNodes. Attempting setup anyway.`);
        }

        // Always recreate gain nodes when called - this is important after context recreation
        // Disconnect existing nodes safely
        if (MusicManager.masterGain) { try { MusicManager.masterGain.disconnect(); } catch (e) {} }
        if (MusicManager.melodyGain) { try { MusicManager.melodyGain.disconnect(); } catch (e) {} }

        console.log("MusicManager: Setting up gain nodes...");
        try {
            MusicManager.masterGain = MusicManager.audioContext.createGain();
            MusicManager.melodyGain = MusicManager.audioContext.createGain();

            // Connect melody gain to master gain, and master gain to destination
            MusicManager.melodyGain.connect(MusicManager.masterGain);
            MusicManager.masterGain.connect(MusicManager.audioContext.destination);

            // Set initial volumes
            MusicManager.masterGain.gain.value = 0.5; // Default master volume
            MusicManager.melodyGain.gain.value = 1.0; // Melody at full volume relative to master

            console.log("MusicManager: Gain nodes set up successfully.");
            return true; // Indicate success
        } catch (e) {
            console.error("MusicManager: Error setting up gain nodes:", e);
            // Reset gain nodes on error to ensure clean state
            MusicManager.masterGain = null;
            MusicManager.melodyGain = null;
            return false; // Indicate failure
        }
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

    /**
     * Starts background music playback
     * @returns {boolean} Success status
     */
    static startMusic() {
        // Cancel any pending cleanups to prevent interference with music startup
        for (const [gameInstance, timeoutId] of MusicManager.cleanupTimeouts.entries()) {
            clearTimeout(timeoutId);
            MusicManager.cleanupTimeouts.delete(gameInstance);
            console.log("MusicManager: Cancelled pending cleanup for music start");
        }

        // Make sure we have a melody selected
        if (!MusicManager.currentMelodyId) {
            MusicManager.selectRandomMelody();
            if (!MusicManager.currentMelodyId) {
                console.warn("MusicManager: No melody available to play");
                return false;
            }
        }

        // Get melody data
        const melody = window.MusicData?.getMelody(MusicManager.currentMelodyId);
        if (!melody) {
            console.warn("MusicManager: Selected melody not found");
            return false;
        }

        // Use SoundManager's shared context
        MusicManager.audioContext = SoundManager.getAudioContext();
        if (!MusicManager.audioContext || MusicManager.audioContext.state !== 'running') {
            console.warn("MusicManager: AudioContext not available or not running");
            return false;
        }

        // Reset pause state
        MusicManager.isPaused = false;

        // Start playing the melody
        MusicManager.startMusicPlayback(melody);
        return true;
    }

    // Start actual music playback
    static startMusicPlayback(musicData) {
        // Use the shared context stored in audioContext
        const context = MusicManager.audioContext;
        // Check context state *first*
        if (!context || context.state !== 'running') {
            console.error(`Cannot start playback: Shared context not available or not running (State: ${context?.state}).`);
            MusicManager.isPlaying = false; // Ensure isPlaying is false if we bail early
            return;
        }

        // Attempt to setup or verify gain nodes *after* confirming context is running
        if (!MusicManager.masterGain || !MusicManager.melodyGain) {
             const setupSuccess = MusicManager.setupGainNodes();
             // If setup failed even with a running context, bail out
             if (!setupSuccess) {
                  console.error("Failed to setup gain nodes despite running context. Cannot start music.");
                  MusicManager.isPlaying = false; // Ensure isPlaying is false
                  return;
             }
        }

        // Make sure master gain is set to audible level (only if gain node exists)
        if (MusicManager.masterGain) {
            MusicManager.masterGain.gain.cancelScheduledValues(context.currentTime);
            MusicManager.masterGain.gain.setValueAtTime(0.5, context.currentTime);
        } else {
             console.error("Cannot set master gain: masterGain node is missing.");
             MusicManager.isPlaying = false; // Ensure isPlaying is false
             return; // Cannot proceed without masterGain
        }

        // Reset playback state
        MusicManager.isPlaying = true;
        MusicManager.isPaused = false; // Ensure isPaused is false when starting
        MusicManager.currentNoteIndex = 0;
        MusicManager.nextNoteTime = context.currentTime;

        // Mark that audio is working
        SoundManager.hasPlayedAudio = true;

        // Start scheduler
        MusicManager.scheduleNotes();

        // Setup context state change listener
        MusicManager.setupContextStateChangeListener();
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

    /**
     * Stops music playback
     * @param {boolean} fullCleanup - Whether to perform full cleanup of audio nodes
     */
    static stopMusic(fullCleanup = false) {
        // Check if we're already stopped to avoid duplicate cleanup
        if (!MusicManager.isPlaying && !fullCleanup) {
            console.log("MusicManager: Music already stopped, skipping basic stop");
            return;
        }

        // Immediately set playing state to false to prevent scheduled callbacks
        MusicManager.isPlaying = false;

        // Clear all schedulers
        if (MusicManager.melodyScheduler) {
            clearTimeout(MusicManager.melodyScheduler);
            MusicManager.melodyScheduler = null;
        }

        // Only continue if we have an audio context
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
            console.error("MusicManager: Error stopping music:", e);
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

    /**
     * Clean up audio resources after a delay
     * @param {Object} gameInstance - The game instance
     * @param {number} delay - Cleanup delay in milliseconds
     */
    static cleanupAudioResources(gameInstance, delay = 0) {
        // Cancel any existing cleanup for this game instance
        const existingTimeout = MusicManager.cleanupTimeouts.get(gameInstance);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Store the current melody ID to check later if it changed
        const currentMelodyId = MusicManager.currentMelodyId;

        // Schedule a new cleanup
        const timeoutId = setTimeout(() => {
            // Only clean up if we're not playing music or if the melody ID has changed
            // This prevents cleanup from interfering with active music
            if (!MusicManager.isPlaying || MusicManager.currentMelodyId !== currentMelodyId) {
                console.log("MusicManager: Cleaning up audio resources");
                MusicManager.stopMusic(true);
                MusicManager.cleanupTimeouts.delete(gameInstance);
            } else {
                console.log("MusicManager: Skipping cleanup because music is currently playing");
            }
        }, delay);

        // Store the timeout ID for possible cancellation
        MusicManager.cleanupTimeouts.set(gameInstance, timeoutId);
    }

    /**
     * Clear the current melody ID
     */
    static clearCurrentMelody() {
        // Only clear if we're not currently playing music
        if (!MusicManager.isPlaying) {
            MusicManager.currentMelodyId = null;
            console.log("MusicManager: Cleared melody ID for next game");
        } else {
            console.log("MusicManager: Skipped clearing melody ID because music is playing");
        }
    }

    /**
     * Set up a listener for audio context state changes
     * This helps handle iOS behavior when app switching
     */
    static setupContextStateChangeListener() {
        if (!MusicManager.audioContext) return;

        // Remove any existing listener to avoid duplicates
        if (MusicManager.hasStateChangeListener) {
            try {
                MusicManager.audioContext.removeEventListener('statechange', MusicManager.handleContextStateChange);
            } catch (e) {
                // Ignore errors from removal attempt
            }
        }

        // Set up the listener
        MusicManager.audioContext.addEventListener('statechange', MusicManager.handleContextStateChange);
        MusicManager.hasStateChangeListener = true;
    }

    /**
     * Handle audio context state changes
     * @param {Event} event - The state change event
     */
    static handleContextStateChange(event) {
        const context = MusicManager.audioContext;
        if (!context) return;

        console.log(`MusicManager: AudioContext state changed to ${context.state}`);

        // If context was suspended and now running, check if we need to restart music
        if (context.state === 'running' && MusicManager.isPlaying) {
            // If we think music is playing but scheduler isn't running, restart scheduler
            const now = context.currentTime;
            const schedulerGap = now - MusicManager.nextNoteTime;

            // If scheduler is more than 1 second behind, restart it
            if (schedulerGap > 1) {
                console.log("MusicManager: Restarting scheduler after context resume");
                // Reset scheduler timing
                MusicManager.currentNoteIndex = 0;
                MusicManager.nextNoteTime = now;

                // Clear any pending scheduler
                if (MusicManager.melodyScheduler) {
                    clearTimeout(MusicManager.melodyScheduler);
                }

                // Restart note scheduling
                MusicManager.scheduleNotes();
            }
        }
    }

    /**
     * Pauses music playback without stopping it completely
     * This allows for resuming from the same position later
     */
    static pauseMusic() {
        // Only pause if we're playing and not already paused
        if (!MusicManager.isPlaying || MusicManager.isPaused) {
            return;
        }
        
        console.log("MusicManager: Pausing music playback");
        
        // Set pause state
        MusicManager.isPaused = true;
        MusicManager.pausedAtTime = MusicManager.audioContext ? MusicManager.audioContext.currentTime : 0;
        
        // Clear the scheduler to stop scheduling new notes
        if (MusicManager.melodyScheduler) {
            clearTimeout(MusicManager.melodyScheduler);
            MusicManager.melodyScheduler = null;
        }
        
        // Fade out master gain over 100ms for smoother transition
        if (MusicManager.masterGain && MusicManager.audioContext) {
            const currentTime = MusicManager.audioContext.currentTime;
            MusicManager.masterGain.gain.cancelScheduledValues(currentTime);
            MusicManager.masterGain.gain.setValueAtTime(MusicManager.masterGain.gain.value || 0, currentTime);
            MusicManager.masterGain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
        }
        
        // Stop all active oscillators
        if (MusicManager.activeOscillators) {
            MusicManager.activeOscillators.forEach(osc => {
                try {
                    if (typeof osc.stop === 'function') {
                        osc.stop(MusicManager.audioContext ? MusicManager.audioContext.currentTime : 0);
                    }
                } catch (e) {
                    // Ignore errors if oscillator already stopped
                }
            });
            MusicManager.activeOscillators.clear();
        }
    }
    
    /**
     * Resumes music playback from where it was paused
     * @returns {boolean} Success status
     */
    static resumeMusic() {
        // Only resume if we're in a paused state
        if (!MusicManager.isPaused) {
            return false;
        }
        
        console.log("MusicManager: Resuming music playback");
        
        // Reset pause state
        MusicManager.isPaused = false;
        
        // Get melody data
        const melody = window.MusicData?.getMelody(MusicManager.currentMelodyId);
        if (!melody) {
            console.warn("MusicManager: Selected melody not found for resume");
            return false;
        }
        
        // Use SoundManager's shared context
        MusicManager.audioContext = SoundManager.getAudioContext();
        if (!MusicManager.audioContext || MusicManager.audioContext.state !== 'running') {
            console.warn("MusicManager: AudioContext not available or not running for resume");
            return false;
        }
        
        // Resume music playback
        MusicManager.resumeMusicPlayback(melody);
        return true;
    }
    
    /**
     * Resume music playback from where it was paused
     * @param {Object} musicData - The music data to resume
     */
    static resumeMusicPlayback(musicData) {
        // Use the shared context stored in audioContext
        const context = MusicManager.audioContext;
        if (!context || context.state !== 'running') {
            console.error("Cannot resume playback: Shared context not available or not running.");
            return;
        }
        
        // Bail if we're missing required components
        if (!MusicManager.masterGain || !MusicManager.melodyGain) {
            MusicManager.setupGainNodes();
            // Check again if setup failed
            if (!MusicManager.masterGain || !MusicManager.melodyGain) {
                console.error("Failed to setup gain nodes. Cannot resume music.");
                return;
            }
        }
        
        // Make sure master gain is set to audible level
        MusicManager.masterGain.gain.cancelScheduledValues(context.currentTime);
        MusicManager.masterGain.gain.setValueAtTime(0.5, context.currentTime);
        
        // Calculate how much time has passed since pause
        const timeSincePause = context.currentTime - MusicManager.pausedAtTime;
        
        // Adjust next note time to account for pause duration
        MusicManager.nextNoteTime = context.currentTime;
        
        // Set playing state to true
        MusicManager.isPlaying = true;
        
        // Mark that audio is working
        SoundManager.hasPlayedAudio = true;
        
        // Start scheduler
        MusicManager.scheduleNotes();
        
        // Setup context state change listener
        MusicManager.setupContextStateChangeListener();
    }

    /**
     * Reset internal playback state, typically after context closure.
     */
    static resetPlaybackState() {
        console.log("MusicManager: Resetting playback state.");
        MusicManager.isPlaying = false;
        MusicManager.isPaused = false;
        MusicManager.currentNoteIndex = 0;
        MusicManager.nextNoteTime = 0;
        MusicManager.pausedAtTime = 0;
        if (MusicManager.melodyScheduler) {
            clearTimeout(MusicManager.melodyScheduler);
            MusicManager.melodyScheduler = null;
        }
        MusicManager.activeOscillators.clear();
        // We keep currentMelodyId, but gain nodes (masterGain, melodyGain) 
        // are handled/nulled by AudioManager/SoundManager when context is closed.
    }
}

// Make MusicManager a global variable
window.MusicManager = MusicManager;
