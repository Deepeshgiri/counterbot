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
                        .setDescription('Total count threshold')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to assign')
                        .setRequired(true)
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

        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        // Check if word is tracked
        if (!config.tracked_words[word]) {
            return interaction.reply({
                content: `❌ Word "${word}" is not being tracked. Add it first with /setup-word add.`,
                ephemeral: true
            });
        }

        // Check bot can assign this role
        const botMember = interaction.guild.members.me;
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: `❌ Cannot assign role ${role} - it's higher than my highest role.\n\n**Role Hierarchy Issue:** Move my role above ${role} in Server Settings → Roles.`,
                ephemeral: true
            });
        }

        // Initialize role mappings if needed
        if (!config.role_mappings) {
            config.role_mappings = {};
        }
        if (!config.role_mappings[word]) {
            config.role_mappings[word] = {};
        }

        config.role_mappings[word][threshold] = role.id;
        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Role reward configured:\n**Word:** ${word}\n**Threshold:** ${threshold} total counts\n**Role:** ${role}`,
            ephemeral: true
        });
    },

    async removeRole(interaction) {
        const word = interaction.options.getString('word').toLowerCase();
        const threshold = interaction.options.getInteger('threshold');

        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config.role_mappings || !config.role_mappings[word] || !config.role_mappings[word][threshold]) {
            return interaction.reply({
                content: `❌ No role mapping found for word "${word}" at threshold ${threshold}.`,
                ephemeral: true
            });
        }

        delete config.role_mappings[word][threshold];

        // Clean up empty objects
        if (Object.keys(config.role_mappings[word]).length === 0) {
            delete config.role_mappings[word];
        }

        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Removed role mapping for **${word}** at threshold **${threshold}**.`,
            ephemeral: true
        });
    },

    async listRoles(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config.role_mappings || Object.keys(config.role_mappings).length === 0) {
            return interaction.reply({
                content: '📋 No role mappings configured.',
                ephemeral: true
            });
        }

        const mappingList = Object.entries(config.role_mappings)
            .map(([word, thresholds]) => {
                const thresholdList = Object.entries(thresholds)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([threshold, roleId]) => `  ${threshold} → <@&${roleId}>`)
                    .join('\n');
                return `**${word}:**\n${thresholdList}`;
            })
            .join('\n\n');

        await interaction.reply({
            content: `📋 **Role Reward Mappings:**\n\n${mappingList}`,
            ephemeral: true
        });
    }
};
