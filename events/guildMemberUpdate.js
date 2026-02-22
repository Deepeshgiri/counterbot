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

            // Fetch user with primary_guild field
            const oldUser = await oldMember.user.fetch();
            const newUser = await newMember.user.fetch();
console.log('Old user primary guild:', oldUser.primaryGuild?.id);
console.log('New user primary guild:', newUser.primaryGuild?.id);
console.log('Guild ID:', guildId);
console.log('Role ID:', roleId);
console.log('User tags:', oldUser.tag, newUser.tag);

            const hadTag = oldUser.primaryGuild?.id === guildId;
            const hasTag = newUser.primaryGuild?.id === guildId;

            // Tag added → assign role
            if (!hadTag && hasTag && !newMember.roles.cache.has(roleId)) {
                await newMember.roles.add(role);
                Logger.success(`Assigned ${role.name} to ${newMember.user.tag} for wearing server tag`);
            }

            // Tag removed → remove role
            if (hadTag && !hasTag && newMember.roles.cache.has(roleId)) {
                await newMember.roles.remove(role);
                Logger.success(`Removed ${role.name} from ${newMember.user.tag} for removing server tag`);
            }

        } catch (error) {
            Logger.error('Error in guildMemberUpdate', error);
        }
    }
};