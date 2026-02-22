const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-role')
        .setDescription('Configure role rewards for word counts')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role reward threshold')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('Word to assign role for')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('threshold')
                        .setDescription('Count threshold')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to assign')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('period')
                        .setDescription('Count period (default: total)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Daily', value: 'daily' },
                            { name: 'Weekly', value: 'weekly' },
                            { name: 'Monthly', value: 'monthly' },
                            { name: 'Total (All-Time)', value: 'total' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role reward threshold')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('Word to remove role mapping from')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('threshold')
                        .setDescription('Threshold to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all role reward mappings')
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            await this.addRole(interaction);
        } else if (subcommand === 'remove') {
            await this.removeRole(interaction);
        } else if (subcommand === 'list') {
            await this.listRoles(interaction);
        }
    },

    async addRole(interaction) {
        const word = interaction.options.getString('word').toLowerCase();
        const threshold = interaction.options.getInteger('threshold');
        const role = interaction.options.getRole('role');
        const period = interaction.options.getString('period') || 'total';

        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        // Check if word is tracked
        if (!config.tracked_words[word]) {
            return interaction.editReply({
                content: `❌ Word "${word}" is not being tracked. Add it first with /setup-word add.`
            });
        }

        // Check bot can assign this role
        const botMember = interaction.guild.members.me;
        if (role.position >= botMember.roles.highest.position) {
            return interaction.editReply({
                content: `❌ Cannot assign role ${role} - it's higher than my highest role.\n\n**Role Hierarchy Issue:** Move my role above ${role} in Server Settings → Roles.`
            });
        }

        // Initialize role mappings if needed
        if (!config.role_mappings) {
            config.role_mappings = {};
        }
        if (!config.role_mappings[word]) {
            config.role_mappings[word] = {};
        }

        const key = `${period}_${threshold}`;
        config.role_mappings[word][key] = { roleId: role.id, period, threshold };
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Role reward configured:\n**Word:** ${word}\n**Period:** ${period}\n**Threshold:** ${threshold} counts\n**Role:** ${role}`
        });
    },

    async removeRole(interaction) {
        const word = interaction.options.getString('word').toLowerCase();
        const threshold = interaction.options.getInteger('threshold');

        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config.role_mappings || !config.role_mappings[word] || !config.role_mappings[word][threshold]) {
            return interaction.editReply({
                content: `❌ No role mapping found for word "${word}" at threshold ${threshold}.`,
                flags: 64
            });
        }

        delete config.role_mappings[word][threshold];

        // Clean up empty objects
        if (Object.keys(config.role_mappings[word]).length === 0) {
            delete config.role_mappings[word];
        }

        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Removed role mapping for **${word}** at threshold **${threshold}**.`,
            flags: 64
        });
    },

    async listRoles(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config.role_mappings || Object.keys(config.role_mappings).length === 0) {
            return interaction.editReply({
                content: '📋 No role mappings configured.'
            });
        }

        const mappingList = Object.entries(config.role_mappings)
            .map(([word, thresholds]) => {
                const thresholdList = Object.entries(thresholds)
                    .sort((a, b) => {
                        const aData = typeof b[1] === 'object' ? b[1].threshold : parseInt(a[0]);
                        const bData = typeof b[1] === 'object' ? b[1].threshold : parseInt(b[0]);
                        return aData - bData;
                    })
                    .map(([key, value]) => {
                        if (typeof value === 'object') {
                            return `  [${value.period}] ${value.threshold} → <@&${value.roleId}>`;
                        } else {
                            return `  [total] ${key} → <@&${value}>`;
                        }
                    })
                    .join('\n');
                return `**${word}:**\n${thresholdList}`;
            })
            .join('\n\n');

        await interaction.editReply({
            content: `📋 **Role Reward Mappings:**\n\n${mappingList}`
        });
    }
};

