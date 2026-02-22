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
        await interaction.deferReply({ flags: 64 });
        const timezone = interaction.options.getString('timezone');
        const guildId = interaction.guild.id;

        if (!timezone) {
            const config = await DataManager.getConfig(guildId);
            const currentTz = config.timezone || 'UTC';
            
            // Get current time in the timezone
            const now = new Date();
            const tzTime = now.toLocaleString('en-US', { 
                timeZone: currentTz,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            
            // Get UTC offset
            const tzDate = new Date(now.toLocaleString('en-US', { timeZone: currentTz }));
            const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
            const offsetMs = tzDate - utcDate;
            const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60));
            const offsetMinutes = Math.abs(Math.floor((offsetMs % (1000 * 60 * 60)) / (1000 * 60)));
            const offsetStr = offsetHours >= 0 
                ? `+${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}` 
                : `${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}`;
            
            // Calculate UTC time when reset occurs (midnight in timezone)
            const utcResetHour = (24 - offsetHours) % 24;
            const utcResetMinute = offsetMinutes > 0 ? 60 - offsetMinutes : 0;
            const utcResetTime = `${utcResetHour.toString().padStart(2, '0')}:${utcResetMinute.toString().padStart(2, '0')}`;
            
            return interaction.editReply({
                content: `⏰ **Current timezone:** ${currentTz} (UTC${offsetStr})\n🕐 **Current time:** ${tzTime}\n\n**Resets occur at:**\n• Local: 00:00 (midnight)\n• UTC: ${utcResetTime}\n\n**Schedule:**\n• Daily reset\n• Weekly: Monday\n• Monthly: 1st day`
            });
        }

        const config = await DataManager.getConfig(guildId);
        config.timezone = timezone;
        await DataManager.saveConfig(guildId, config);

        // Calculate UTC offset for the new timezone
        const now = new Date();
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const offsetMs = tzDate - utcDate;
        const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60));
        const offsetMinutes = Math.abs(Math.floor((offsetMs % (1000 * 60 * 60)) / (1000 * 60)));
        const offsetStr = offsetHours >= 0 
            ? `+${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}` 
            : `${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}`;
        
        // Calculate UTC time when reset occurs
        const utcResetHour = (24 - offsetHours) % 24;
        const utcResetMinute = offsetMinutes > 0 ? 60 - offsetMinutes : 0;
        const utcResetTime = `${utcResetHour.toString().padStart(2, '0')}:${utcResetMinute.toString().padStart(2, '0')}`;

        await interaction.editReply({
            content: `✅ Timezone set to **${timezone}** (UTC${offsetStr})\n\n**Resets will occur at:**\n• Local: 00:00 (midnight)\n• UTC: ${utcResetTime}\n\n✨ Changes take effect immediately!`
        });
    }
};

