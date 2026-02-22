const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tag-role')
        .setDescription('Configure auto-role for users wearing server tag')
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
        } catch (error) {
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
        const guild = await interaction.guild.fetch();
        
        const serverTag = guild.vanityURLCode ? `[${guild.vanityURLCode.toUpperCase()}]` : null;
        
        if (!serverTag) {
            return interaction.editReply({
                content: '❌ This server does not have a vanity URL. Server tags require a vanity URL to be set.'
            });
        }

        const botMember = interaction.guild.members.me;
        if (role.position >= botMember.roles.highest.position) {
            return interaction.editReply({
                content: `❌ Cannot assign role ${role} - it's higher than my highest role.\n\n**Role Hierarchy Issue:** Move my role above ${role} in Server Settings → Roles.`
            });
        }

        const config = await DataManager.getConfig(guildId);
        config.tag_role = {
            tag: serverTag,
            roleId: role.id
        };
        await DataManager.saveConfig(guildId, config);

        await interaction.editReply({
            content: `✅ Tag-role configured!\n**Server Tag:** ${serverTag}\n**Role:** ${role}\n\nUsers with "${serverTag}" in their nickname will automatically get this role.`
        });
    },

    async removeTagRole(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config.tag_role) {
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

        if (!config.tag_role) {
            return interaction.editReply({
                content: '📋 No tag-role configuration set.'
            });
        }

        await interaction.editReply({
            content: `📋 **Tag-Role Configuration:**\n**Tag:** ${config.tag_role.tag}\n**Role:** <@&${config.tag_role.roleId}>`
        });
    }
};
