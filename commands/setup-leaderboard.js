const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-leaderboard')
        .setDescription('Configure automatic leaderboard posting channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel for automatic leaderboard posts')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        config.leaderboard_channel_id = channel.id;
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Automatic leaderboards will be posted to ${channel}.\n\n**Schedule:**\n• Daily: Midnight UTC\n• Weekly: Start of week (Monday)\n• Monthly: 1st of month`,
            flags: 64
        });
    }
};

