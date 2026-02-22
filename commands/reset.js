const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');
const RoleManager = require('../utils/roleManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Manually reset counts')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of reset')
                .setRequired(true)
                .addChoices(
                    { name: 'Daily', value: 'daily' },
                    { name: 'Weekly', value: 'weekly' },
                    { name: 'Monthly', value: 'monthly' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const type = interaction.options.getString('type');
        const guildId = interaction.guild.id;

        try {
            const config = await DataManager.getConfig(guildId);
            const users = await DataManager.getUsers(guildId);

            // Remove roles before reset
            for (const user of Object.values(users)) {
                for (const word of Object.keys(config.tracked_words)) {
                    if (config.role_mappings && config.role_mappings[word]) {
                        await RoleManager.removeUnqualifiedRoles(
                            interaction.guild,
                            user.discord_id,
                            0,
                            word,
                            config.role_mappings
                        );
                    }
                }
            }

            await DataManager.resetCounts(guildId, type);

            await interaction.editReply({
                content: `✅ Successfully reset **${type}** counts for all users in this server.`
            });
        } catch (error) {
            await interaction.editReply({
                content: `❌ Failed to reset counts: ${error.message}`
            });
        }
    }
};
