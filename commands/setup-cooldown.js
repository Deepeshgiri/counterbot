const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-cooldown')
        .setDescription('Configure global cooldown for word tracking')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option
                .setName('seconds')
                .setDescription('Cooldown duration in seconds')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(3600)
        ),

    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        config.cooldown_seconds = seconds;
        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Global cooldown set to **${seconds} seconds**.\n\n*Note: Individual words can have custom cooldowns set via /setup-word add.*`,
            ephemeral: true
        });
    }
};
