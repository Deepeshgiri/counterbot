const DataManager = require('../utils/dataManager');
const Logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            const guildId = newMember.guild.id;
            const config = await DataManager.getConfig(guildId);

            if (!config?.tag_role) return;

            const { roleId } = config.tag_role;
            if (!roleId) return;

            const role = newMember.guild.roles.cache.get(roleId);
            if (!role) return;

            // Get guild's clan tag
            const guild = await newMember.guild.fetch();
            const guildTag = guild.clan?.tag;
            
            if (!guildTag) return;

            const oldNick = oldMember.nickname || oldMember.user.displayName;
            const newNick = newMember.nickname || newMember.user.displayName;

            // Check if nickname contains guild's tag in [TAG] format
            const tagPattern = `[${guildTag}]`;
            const hadTag = oldNick.includes(tagPattern);
            const hasTag = newNick.includes(tagPattern);

            // Tag added → assign role
            if (!hadTag && hasTag && !newMember.roles.cache.has(roleId)) {
                await newMember.roles.add(role);
                Logger.success(`Assigned ${role.name} to ${newMember.user.tag} for wearing server tag ${tagPattern}`);
            }

            // Tag removed → remove role
            if (hadTag && !hasTag && newMember.roles.cache.has(roleId)) {
                await newMember.roles.remove(role);
                Logger.success(`Removed ${role.name} from ${newMember.user.tag} for removing server tag ${tagPattern}`);
            }

        } catch (error) {
            Logger.error('Error in guildMemberUpdate', error);
        }
    }
};