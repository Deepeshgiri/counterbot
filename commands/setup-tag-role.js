const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tag-role')
        .setDescription('Configure auto-role for users wearing a specific tag')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set role for users with server tag')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to assign to users with tag')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove tag-role auto-assignment')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current tag-role configuration')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });
        } catch {
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            await this.setTagRole(interaction);
        } else if (subcommand === 'remove') {
            await this.removeTagRole(interaction);
        } else if (subcommand === 'view') {
            await this.viewTagRole(interaction);
        }
    },

    async setTagRole(interaction) {
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        const botMember = interaction.guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply({
                content: '❌ I need the **Manage Roles** permission.'
            });
        }

        if (role.comparePositionTo(botMember.roles.highest) >= 0) {
            return interaction.editReply({
                content: `❌ My role must be higher than ${role}.`
            });
        }

        const config = await DataManager.getConfig(guildId);

        config.tag_role = {
            roleId: role.id
        };

        await DataManager.saveConfig(guildId, config);

        // Auto-assign role to all members with server tag
        const members = await interaction.guild.members.fetch();
        let assigned = 0;
        
        for (const [, member] of members) {
            const primaryGuild = member.user.primaryGuild;
            const hasTag = primaryGuild?.identityGuildId === guildId && primaryGuild?.identityEnabled;
            
            if (hasTag && !member.roles.cache.has(role.id)) {
                await member.roles.add(role).catch(() => {});
                assigned++;
            }
        }
        
        await interaction.editReply({
            content: `✅ Tag-role configured!\n**Role:** ${role}\n**Auto-assigned:** ${assigned} members\n\nUsers with this server as their primary guild will automatically get this role.`
        });
    },

    async removeTagRole(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config?.tag_role) {
            return interaction.editReply({
                content: '❌ No tag-role configuration found.'
            });
        }

        delete config.tag_role;
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: '✅ Tag-role auto-assignment removed.'
        });
    },

    async viewTagRole(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config?.tag_role) {
            return interaction.editReply({
                content: '📋 No tag-role configuration set.'
            });
        }

        await interaction.editReply({
            content: `📋 **Tag-Role Configuration:**\n**Role:** <@&${config.tag_role.roleId}>\n\nUsers with this server as their primary guild get this role.`
        });
    }
};