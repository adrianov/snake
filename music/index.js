// Initialize the MusicData object with an empty MELODIES object
// Individual melody files will add their melodies to this object
window.MusicData = {
    MELODIES: {},
    previousMelodyId: null,
    currentMelodyId: null,

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
     * Selects a melody by ID or uses the currently selected one
     * @param {string} [id=null] - Optional melody ID to use
     * @returns {string} The selected melody ID
     */
    getSelectedMelodyId: function(id = null) {
        // If an ID is provided and it exists, use it
        if (id && this.MELODIES[id]) {
            this.currentMelodyId = id;
            return this.currentMelodyId;
        }

        // If we have a current melody, use it
        if (this.currentMelodyId && this.MELODIES[this.currentMelodyId]) {
            return this.currentMelodyId;
        }

        // Otherwise, select first available melody
        const melodyIds = this.getAllMelodyIds();
        if (melodyIds.length > 0) {
            this.currentMelodyId = melodyIds[0];
            return this.currentMelodyId;
        }

        return null;
    },

    /**
     * Set a specific melody to play consistently
     * @param {string} id - The melody ID to set as current
     * @returns {boolean} Whether the operation was successful
     */
    setCurrentMelody: function(id) {
        if (this.MELODIES[id]) {
            this.currentMelodyId = id;
            return true;
        }
        return false;
    },

    /**
     * Get all melodies
     * @returns {Object} All melody data
     */
    getAllMelodies: function() {
        return this.MELODIES;
    }
};
