const DataManager = require('../utils/dataManager');
const Logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            // Only run if nickname actually changed
            if (oldMember.nickname === newMember.nickname) return;

            const guildId = newMember.guild.id;
            const config = await DataManager.getConfig(guildId);

            if (!config?.tag_role) return;

            const { tag, roleId } = config.tag_role;
            if (!tag || !roleId) return;

            const role = newMember.guild.roles.cache.get(roleId);
            if (!role) return;

            const oldNick = oldMember.nickname || oldMember.user.username;
            const newNick = newMember.nickname || newMember.user.username;

            // Case insensitive check (safer)
            const hadTag = oldNick.toLowerCase().includes(tag.toLowerCase());
            const hasTag = newNick.toLowerCase().includes(tag.toLowerCase());

            // Tag added → assign role
            if (!hadTag && hasTag && !newMember.roles.cache.has(roleId)) {
                await newMember.roles.add(role);
                Logger.success(`Assigned ${role.name} to ${newMember.user.tag}`);
            }

            // Tag removed → remove role
            if (hadTag && !hasTag && newMember.roles.cache.has(roleId)) {
                await newMember.roles.remove(role);
                Logger.success(`Removed ${role.name} from ${newMember.user.tag}`);
            }

        } catch (error) {
            Logger.error('Error in guildMemberUpdate', error);
        }
    }
};