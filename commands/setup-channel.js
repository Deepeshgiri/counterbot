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
                .setName('add-all')
                .setDescription('Track all text channels in the server')
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
                .setName('remove-all')
                .setDescription('Stop tracking all channels')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all tracked channels')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });
        } catch (error) {
            // Interaction already expired, can't respond
            return;
        }
        
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            await this.addChannel(interaction);
        } else if (subcommand === 'add-all') {
            await this.addAllChannels(interaction);
        } else if (subcommand === 'remove') {
            await this.removeChannel(interaction);
        } else if (subcommand === 'remove-all') {
            await this.removeAllChannels(interaction);
        } else if (subcommand === 'list') {
            await this.listChannels(interaction);
        }
    },

    async addChannel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (config.enabled_channels.includes(channel.id)) {
            return interaction.editReply({
                content: `❌ ${channel} is already being tracked.`
            });
        }

        config.enabled_channels.push(channel.id);
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Now tracking ${channel}`
        });
    },

    async addAllChannels(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);
        
        const textChannels = interaction.guild.channels.cache
            .filter(ch => ch.isTextBased() && ch.type === 0)
            .map(ch => ch.id);
        
        config.enabled_channels = [...new Set([...config.enabled_channels, ...textChannels])];
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Now tracking all ${textChannels.length} text channels in this server.`
        });
    },

    async removeChannel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        const index = config.enabled_channels.indexOf(channel.id);
        if (index === -1) {
            return interaction.editReply({
                content: `❌ ${channel} is not being tracked.`
            });
        }

        config.enabled_channels.splice(index, 1);
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Stopped tracking ${channel}`
        });
    },

    async removeAllChannels(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);
        
        const count = config.enabled_channels.length;
        config.enabled_channels = [];
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Stopped tracking all ${count} channels.`
        });
    },

    async listChannels(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (config.enabled_channels.length === 0) {
            return interaction.editReply({
                content: '📋 No channels are currently being tracked.'
            });
        }

        const channelList = config.enabled_channels
            .map(id => `<#${id}>`)
            .join('\n');

        await interaction.editReply({
            content: `📋 **Tracked Channels:**\n${channelList}`
        });
    }
};
