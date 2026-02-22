const DataManager = require('../utils/dataManager');
const Logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            const guildId = newMember.guild.id;
            const guild = await newMember.guild.fetch();
            const config = await DataManager.getConfig(guildId);

            if (!config.tag_role) {
                return;
            }

            // Get current guild's server tag
            const currentGuildTag = guild.clan?.tag ? `[${guild.clan.tag}]` : null;
            
            if (!currentGuildTag) {
                return;
            }

            const { roleId } = config.tag_role;
            const role = newMember.guild.roles.cache.get(roleId);

            if (!role) {
                return;
            }

            const oldNick = oldMember.nickname || oldMember.user.username;
            const newNick = newMember.nickname || newMember.user.username;

            const hadTag = oldNick.includes(currentGuildTag);
            const hasTag = newNick.includes(currentGuildTag);

            // Tag added - assign role
            if (!hadTag && hasTag && !newMember.roles.cache.has(roleId)) {
                await newMember.roles.add(role);
                Logger.success(`Assigned ${role.name} to ${newMember.user.tag} for wearing tag ${currentGuildTag}`);
            }

            // Tag removed - remove role
            if (hadTag && !hasTag && newMember.roles.cache.has(roleId)) {
                await newMember.roles.remove(role);
                Logger.success(`Removed ${role.name} from ${newMember.user.tag} for removing tag ${currentGuildTag}`);
            }
        } catch (error) {
            Logger.error('Error in guildMemberUpdate', error);
        }
    }
};
