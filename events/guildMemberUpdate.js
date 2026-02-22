const DataManager = require('../utils/dataManager');
const Logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            const guildId = newMember.guild.id;
            const config = await DataManager.getConfig(guildId);

            if (!config.tag_role) {
                return;
            }

            const { tag, roleId } = config.tag_role;
            const role = newMember.guild.roles.cache.get(roleId);

            if (!role) {
                return;
            }

            const oldNick = oldMember.nickname || oldMember.user.username;
            const newNick = newMember.nickname || newMember.user.username;

            const hadTag = oldNick.includes(tag);
            const hasTag = newNick.includes(tag);

            // Tag added - assign role
            if (!hadTag && hasTag && !newMember.roles.cache.has(roleId)) {
                await newMember.roles.add(role);
                Logger.success(`Assigned ${role.name} to ${newMember.user.tag} for wearing tag ${tag}`);
            }

            // Tag removed - remove role
            if (hadTag && !hasTag && newMember.roles.cache.has(roleId)) {
                await newMember.roles.remove(role);
                Logger.success(`Removed ${role.name} from ${newMember.user.tag} for removing tag ${tag}`);
            }
        } catch (error) {
            Logger.error('Error in guildMemberUpdate', error);
        }
    }
};
