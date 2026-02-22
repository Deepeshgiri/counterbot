const Logger = require('./logger');

/**
 * Role assignment manager with error handling
 */
class RoleManager {
    /**
     * Check and assign roles based on user count
     */
    static async checkAndAssignRoles(guild, userId, user, word, roleMappings) {
        try {
            const member = await guild.members.fetch(userId);

            if (!roleMappings[word]) {
                return;
            }

            const mappings = roleMappings[word];

            for (const [key, value] of Object.entries(mappings)) {
                let roleData, count;
                
                if (typeof value === 'object') {
                    roleData = value;
                    count = user[`${roleData.period}_count`];
                } else {
                    roleData = { roleId: value, period: 'total', threshold: parseInt(key) };
                    count = user.total_count;
                }

                if (count >= roleData.threshold && !member.roles.cache.has(roleData.roleId)) {
                    await this.assignRole(member, roleData.roleId, roleData.threshold);
                }
            }
        } catch (error) {
            Logger.error(`Failed to check/assign roles for user ${userId}`, error);
        }
    }

    /**
     * Remove roles from user when they no longer qualify
     */
    static async removeUnqualifiedRoles(guild, userId, totalCount, word, roleMappings) {
        try {
            const member = await guild.members.fetch(userId);

            if (!roleMappings[word]) {
                return;
            }

            const mappings = roleMappings[word];

            for (const [threshold, roleId] of Object.entries(mappings)) {
                const thresholdNum = parseInt(threshold);

                if (totalCount < thresholdNum && member.roles.cache.has(roleId)) {
                    await this.removeRole(member, roleId, thresholdNum);
                }
            }
        } catch (error) {
            Logger.error(`Failed to remove roles for user ${userId}`, error);
        }
    }

    /**
     * Remove all word-related roles from all users in guild
     */
    static async removeAllWordRoles(guild, word, roleMappings) {
        try {
            if (!roleMappings[word]) {
                return;
            }

            const mappings = roleMappings[word];
            const members = await guild.members.fetch();

            for (const [, member] of members) {
                for (const roleId of Object.values(mappings)) {
                    if (member.roles.cache.has(roleId)) {
                        await this.removeRole(member, roleId, 0);
                    }
                }
            }
        } catch (error) {
            Logger.error(`Failed to remove all roles for word ${word}`, error);
        }
    }

    /**
     * Assign a role to a member with error handling
     */
    static async assignRole(member, roleId, threshold) {
        try {
            const role = member.guild.roles.cache.get(roleId);

            if (!role) {
                Logger.error(`Role ${roleId} not found in guild`);
                return;
            }

            // Check if member already has the role
            if (member.roles.cache.has(roleId)) {
                Logger.debug(`User ${member.user.tag} already has role ${role.name}`);
                return;
            }

            // Check bot permissions
            const botMember = member.guild.members.me;
            if (!botMember.permissions.has('ManageRoles')) {
                Logger.error('Bot lacks MANAGE_ROLES permission');
                return;
            }

            // Check role hierarchy
            if (role.position >= botMember.roles.highest.position) {
                Logger.error(`Cannot assign role ${role.name} - role is higher than bot's highest role`);
                return;
            }

            await member.roles.add(role);
            Logger.success(`Assigned role ${role.name} to ${member.user.tag} (threshold: ${threshold})`);
        } catch (error) {
            Logger.error(`Failed to assign role ${roleId}`, error);
        }
    }

    /**
     * Remove a role from a member
     */
    static async removeRole(member, roleId, threshold) {
        try {
            const role = member.guild.roles.cache.get(roleId);

            if (!role) {
                return;
            }

            if (!member.roles.cache.has(roleId)) {
                return;
            }

            await member.roles.remove(role);
            Logger.success(`Removed role ${role.name} from ${member.user.tag}`);
        } catch (error) {
            Logger.error(`Failed to remove role ${roleId}`, error);
        }
    }
}

module.exports = RoleManager;
