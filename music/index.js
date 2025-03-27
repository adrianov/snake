// Initialize the MusicData object with an empty MELODIES object
// Individual melody files will add their melodies to this object
window.MusicData = {
    MELODIES: {},
    previousMelodyId: null,

    /**
     * Gets a melody by its ID
     * @param {string} id - The melody ID
     * @returns {Object} The melody data
     */
    getMelody: function(id) {
        return this.MELODIES[id] || null;
    },

    /**
     * Gets all available melody IDs
     * @returns {string[]} Array of melody IDs
     */
    getAllMelodyIds: function() {
        return Object.keys(this.MELODIES);
    },

    /**
     * Selects a random melody that is different from the previous one
     * @returns {string} The selected melody ID
     */
    getRandomMelodyId: function() {
        const melodyIds = this.getAllMelodyIds();

        // If there's only one melody, return it
        if (melodyIds.length === 1) {
            this.previousMelodyId = melodyIds[0];
            return this.previousMelodyId;
        }

        // Filter out the previous melody to ensure we get a different one
        const availableMelodies = melodyIds.filter(id => id !== this.previousMelodyId);

        // Get a random melody from the available ones
        const randomIndex = Math.floor(Math.random() * availableMelodies.length);
        this.previousMelodyId = availableMelodies[randomIndex];

        return this.previousMelodyId;
    },

    /**
     * Get all melodies
     * @returns {Object} All melody data
     */
    getAllMelodies: function() {
        return this.MELODIES;
    }
};
