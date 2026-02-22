const DataManager = require('../utils/dataManager');
const WordUtils = require('../utils/wordUtils');
const RoleManager = require('../utils/roleManager');
const Logger = require('../utils/logger');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages and DMs
        if (message.author.bot || !message.guild) return;

        try {
            const guildId = message.guild.id;
            const config = await DataManager.getConfig(guildId);

            // Check if channel is tracked
            if (!config.enabled_channels.includes(message.channel.id)) {
                return;
            }

            // Check if there are any tracked words
            if (!config.tracked_words || Object.keys(config.tracked_words).length === 0) {
                return;
            }

            // Extract words from message
            const words = WordUtils.extractWords(message.content);

            // Check each word
            for (const word of words) {
                const match = WordUtils.findTrackedWord(word, config.tracked_words);

                if (match) {
                    await this.handleTrackedWord(message, match.word, match.config, config, guildId);
                }
            }
        } catch (error) {
            Logger.error('Error processing message', error);
        }
    },

    async handleTrackedWord(message, word, wordConfig, config, guildId) {
        const userId = message.author.id;
        const user = await DataManager.getUser(guildId, userId);

        // Get cooldown (word-specific or global)
        const cooldown = wordConfig.cooldown || config.cooldown_seconds;

        // Check cooldown
        const lastCounted = user.last_counted[word];
        if (!WordUtils.isCooldownExpired(lastCounted, cooldown)) {
            const remaining = WordUtils.getRemainingCooldown(lastCounted, cooldown);
            Logger.debug(`User ${message.author.tag} on cooldown for "${word}" (${remaining}s remaining)`);
            return;
        }

        // Increment count
        const updatedUser = await DataManager.incrementUserCount(guildId, userId, word);
        Logger.info(`${message.author.tag} counted "${word}" in guild ${guildId} (total: ${updatedUser.total_count})`);

        // Check for role rewards
        if (config.role_mappings && config.role_mappings[word]) {
            await RoleManager.checkAndAssignRoles(
                message.guild,
                userId,
                updatedUser,
                word,
                config.role_mappings
            );
        }
    }
};
