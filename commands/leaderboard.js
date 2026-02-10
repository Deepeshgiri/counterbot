const { SlashCommandBuilder } = require('discord.js');
const DataManager = require('../utils/dataManager');
const LeaderboardUtils = require('../utils/leaderboardUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View word count leaderboards')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Leaderboard type')
                .setRequired(true)
                .addChoices(
                    { name: 'Daily', value: 'daily' },
                    { name: 'Weekly', value: 'weekly' },
                    { name: 'Monthly', value: 'monthly' },
                    { name: 'All-Time', value: 'total' }
                )
        )
        .addStringOption(option =>
            option
                .setName('scope')
                .setDescription('Leaderboard scope')
                .setRequired(false)
                .addChoices(
                    { name: 'This Server (Guild)', value: 'guild' },
                    { name: 'Global (All Servers)', value: 'global' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type');
        const scope = interaction.options.getString('scope') || 'guild';
        const guildId = interaction.guild.id;

        let users;
        let scopeLabel;

        if (scope === 'global') {
            // Get global statistics
            users = await DataManager.getGlobalUsers();
            scopeLabel = 'Global (All Servers)';
        } else {
            // Get guild-specific statistics
            users = await DataManager.getUsers(guildId);
            scopeLabel = interaction.guild.name;
        }

        const embed = await LeaderboardUtils.generateLeaderboard(
            interaction.client,
            users,
            type,
            scopeLabel,
            scope
        );

        await interaction.editReply({ embeds: [embed] });
    }
};
