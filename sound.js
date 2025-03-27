class SoundManager {
    constructor() {
        try {
            // Create audio context with options to keep it running if possible
            const contextOptions = {
                latencyHint: 'interactive',
                sampleRate: 44100
            };

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);

            // Force resume the context immediately
            if (this.audioContext.state !== 'running') {
                this.audioContext.resume();

                // Add user interaction listeners to ensure the context stays active
                const resumeAudioContext = () => {
                    if (this.audioContext.state !== 'running') {
                        this.audioContext.resume();
                    }
                };

                // These will auto-trigger on first user interaction with the page
                window.addEventListener('click', resumeAudioContext, { once: true });
                window.addEventListener('touchstart', resumeAudioContext, { once: true });
                window.addEventListener('keydown', resumeAudioContext, { once: true });
            }

            // Create sound templates
            this.initSoundTemplates();

            // Keep the context alive with a silent audio node if needed
            this.keepContextAlive();

        } catch (e) {
            console.error('Error creating AudioContext:', e);
            this.audioContext = null;
        }
    }

    // Keep audio context alive with a silent node
    keepContextAlive() {
        if (!this.audioContext) return;

        // Create a silent oscillator that runs continuously
        this.silentNode = this.audioContext.createGain();
        this.silentNode.gain.value = 0; // Completely silent
        this.silentNode.connect(this.audioContext.destination);
    }

    // Initialize all sound templates
    initSoundTemplates() {
        this.soundTemplates = {
            'apple': {
                type: 'sine',
                frequency: 880,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 440, duration: 0.1 },
                duration: 0.2
            },
            'banana': {
                type: 'triangle',
                frequency: 660,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 330, duration: 0.15 },
                duration: 0.2
            },
            'orange': {
                type: 'square',
                frequency: 550,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 275, duration: 0.2 },
                duration: 0.25
            },
            'strawberry': {
                type: 'sine',
                frequency: 1100,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 550, duration: 0.25 },
                duration: 0.3
            },
            'cherry': {
                type: 'sine',
                frequency: 784,
                gainValue: 0.25,
                frequencyEnvelope: { targetFreq: 392, duration: 0.15 },
                duration: 0.2
            },
            'crash': {
                type: 'sawtooth',
                frequency: 440,
                gainValue: 0.3,
                frequencyEnvelope: { targetFreq: 55, duration: 0.6 },
                duration: 0.8
            },
            'highscore': {
                type: 'triangle',
                frequency: 523.25,
                gainValue: 0.4,
                frequencyEnvelope: { targetFreq: 1046.50, duration: 0.3 },
                duration: 0.3
            },
            'disappear': {
                type: 'sine',
                frequency: 440,
                gainValue: 0.08,
                frequencyEnvelope: { targetFreq: 220, duration: 0.15 },
                duration: 0.2
            },
            'click': {
                type: 'sine',
                frequency: 800,
                gainValue: 0.1,
                duration: 0.1
            }
        };
    }

    // Play sound from template - always force resume context
    playSound(soundType) {
        if (!this.audioContext || !this.soundTemplates[soundType]) return;

        // Always force resume before playing
        if (this.audioContext.state !== 'running') {
            this.audioContext.resume();
        }

        // Get template and create sound
        const template = this.soundTemplates[soundType];
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Apply template values
        oscillator.type = template.type;
        oscillator.frequency.value = template.frequency;
        gainNode.gain.value = template.gainValue;

        const soundDuration = template.duration || 0.3;

        // Apply frequency envelope
        if (template.frequencyEnvelope) {
            oscillator.frequency.exponentialRampToValueAtTime(
                template.frequencyEnvelope.targetFreq,
                now + template.frequencyEnvelope.duration
            );
        }

        // Apply gain envelope
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + soundDuration);

        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + soundDuration + 0.05);
    }

    playHighScoreFanfare() {
        if (!this.audioContext) return;

        // Always force resume before playing
        if (this.audioContext.state !== 'running') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Define notes
        const notes = [
            { freq: 392.00, time: 0.00, duration: 0.15, volume: 0.5 },  // G4
            { freq: 523.25, time: 0.15, duration: 0.15, volume: 0.5 },  // C5
            { freq: 659.25, time: 0.30, duration: 0.15, volume: 0.5 },  // E5
            { freq: 783.99, time: 0.45, duration: 0.30, volume: 0.6 },  // G5
            // Final chord
            { freq: 783.99, time: 0.80, duration: 0.50, volume: 0.4 },  // G5
            { freq: 987.77, time: 0.80, duration: 0.50, volume: 0.4 },  // B5
            { freq: 1174.66, time: 0.80, duration: 0.50, volume: 0.4 }  // D6
        ];

        // Schedule all notes
        for (const note of notes) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(note.volume, now + note.time + 0.05);
            gain.gain.setValueAtTime(note.volume, now + note.time + note.duration - 0.05);
            gain.gain.linearRampToValueAtTime(0, now + note.time + note.duration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now + note.time);
            osc.stop(now + note.time + note.duration);
        }
    }
}

// Make SoundManager a global variable
window.SoundManager = SoundManager;

