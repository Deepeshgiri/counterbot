const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

const TIMEZONES = [
    { name: 'UTC', value: 'UTC' },
    { name: 'America/New_York (EST/EDT)', value: 'America/New_York' },
    { name: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
    { name: 'America/Denver (MST/MDT)', value: 'America/Denver' },
    { name: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
    { name: 'America/Toronto (EST/EDT)', value: 'America/Toronto' },
    { name: 'America/Mexico_City (CST/CDT)', value: 'America/Mexico_City' },
    { name: 'America/Sao_Paulo (BRT/BRST)', value: 'America/Sao_Paulo' },
    { name: 'Europe/London (GMT/BST)', value: 'Europe/London' },
    { name: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
    { name: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
    { name: 'Europe/Moscow (MSK)', value: 'Europe/Moscow' },
    { name: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
    { name: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
    { name: 'Asia/Bangkok (ICT)', value: 'Asia/Bangkok' },
    { name: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
    { name: 'Asia/Hong_Kong (HKT)', value: 'Asia/Hong_Kong' },
    { name: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
    { name: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
    { name: 'Asia/Seoul (KST)', value: 'Asia/Seoul' },
    { name: 'Australia/Sydney (AEDT/AEST)', value: 'Australia/Sydney' },
    { name: 'Pacific/Auckland (NZDT/NZST)', value: 'Pacific/Auckland' },
    { name: 'Africa/Cairo (EET)', value: 'Africa/Cairo' },
    { name: 'Africa/Johannesburg (SAST)', value: 'Africa/Johannesburg' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-timezone')
        .setDescription('Configure timezone for automatic resets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option
                .setName('timezone')
                .setDescription('Select timezone for resets (default: UTC)')
                .setRequired(false)
                .addChoices(...TIMEZONES)
        ),

    async execute(interaction) {
        const timezone = interaction.options.getString('timezone');
        const guildId = interaction.guild.id;

        if (!timezone) {
            const config = await DataManager.getConfig(guildId);
            const currentTz = config.timezone || 'UTC';
            
            return interaction.reply({
                content: `⏰ Current timezone: **${currentTz}**\n\nResets occur at:\n• Daily: 00:00 (midnight)\n• Weekly: Monday 00:00\n• Monthly: 1st day 00:00`,
                ephemeral: true
            });
        }

        const config = await DataManager.getConfig(guildId);
        config.timezone = timezone;
        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Timezone set to **${timezone}**\n\nResets will occur at:\n• Daily: 00:00 (midnight)\n• Weekly: Monday 00:00\n• Monthly: 1st day 00:00\n\n⚠️ **Restart the bot** for timezone changes to take effect.`,
            ephemeral: true
        });
    }
};
