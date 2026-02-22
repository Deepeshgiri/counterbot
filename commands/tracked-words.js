const { SlashCommandBuilder } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tracked-words')
        .setDescription('View all words being tracked in this server')
        .setDefaultMemberPermissions(null),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (Object.keys(config.tracked_words).length === 0) {
            return interaction.editReply({
                content: '📋 No words are currently being tracked in this server.',
                flags: 64
            });
        }

        const wordList = Object.entries(config.tracked_words)
            .map(([word, wordConfig]) => {
                let line = `• **${word}**`;
                if (wordConfig.aliases && wordConfig.aliases.length > 0) {
                    line += ` (aliases: ${wordConfig.aliases.join(', ')})`;
                }
                if (wordConfig.cooldown) {
                    line += ` [${wordConfig.cooldown}s cooldown]`;
                }
                return line;
            })
            .join('\n');

        await interaction.editReply({
            content: `📋 **Tracked Words:**\n${wordList}`,
            flags: 64
        });
    }
};

