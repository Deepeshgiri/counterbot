const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-channel')
        .setDescription('Configure tracked channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a channel to track')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to track')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a tracked channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to stop tracking')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all tracked channels')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            await this.addChannel(interaction);
        } else if (subcommand === 'remove') {
            await this.removeChannel(interaction);
        } else if (subcommand === 'list') {
            await this.listChannels(interaction);
        }
    },

    async addChannel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (config.enabled_channels.includes(channel.id)) {
            return interaction.reply({
                content: `❌ ${channel} is already being tracked.`,
                ephemeral: true
            });
        }

        config.enabled_channels.push(channel.id);
        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Now tracking ${channel}`,
            ephemeral: true
        });
    },

    async removeChannel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        const index = config.enabled_channels.indexOf(channel.id);
        if (index === -1) {
            return interaction.reply({
                content: `❌ ${channel} is not being tracked.`,
                ephemeral: true
            });
        }

        config.enabled_channels.splice(index, 1);
        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Stopped tracking ${channel}`,
            ephemeral: true
        });
    },

    async listChannels(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (config.enabled_channels.length === 0) {
            return interaction.reply({
                content: '📋 No channels are currently being tracked.',
                ephemeral: true
            });
        }

        const channelList = config.enabled_channels
            .map(id => `<#${id}>`)
            .join('\n');

        await interaction.reply({
            content: `📋 **Tracked Channels:**\n${channelList}`,
            ephemeral: true
        });
    }
};
