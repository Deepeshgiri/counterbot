/**
 * Word normalization and matching utilities
 */
class WordUtils {
    /**
     * Normalize a word for matching (lowercase, strip punctuation)
     */
    static normalize(word) {
        return word
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .trim();
    }

    /**
     * Extract words from a message
     */
    static extractWords(message) {
        return message
            .split(/\s+/)
            .map(word => this.normalize(word))
            .filter(word => word.length > 0);
    }

    /**
     * Check if a word matches any tracked word or alias
     */
    static findTrackedWord(word, trackedWords) {
        const normalized = this.normalize(word);

        for (const [mainWord, config] of Object.entries(trackedWords)) {
            // Check main word
            if (this.normalize(mainWord) === normalized) {
                return { word: mainWord, config };
            }

            // Check aliases
            if (config.aliases && Array.isArray(config.aliases)) {
                for (const alias of config.aliases) {
                    if (this.normalize(alias) === normalized) {
                        return { word: mainWord, config };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Check if cooldown has expired for a user and word
     */
    static isCooldownExpired(lastCounted, cooldownSeconds) {
        if (!lastCounted) return true;

        const now = Date.now();
        const elapsed = (now - lastCounted) / 1000; // Convert to seconds

        return elapsed >= cooldownSeconds;
    }

    /**
     * Get remaining cooldown time in seconds
     */
    static getRemainingCooldown(lastCounted, cooldownSeconds) {
        if (!lastCounted) return 0;

        const now = Date.now();
        const elapsed = (now - lastCounted) / 1000;
        const remaining = cooldownSeconds - elapsed;

        return Math.max(0, Math.ceil(remaining));
    }
}

module.exports = WordUtils;
