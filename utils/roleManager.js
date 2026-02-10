const Logger = require('./logger');

/**
 * Role assignment manager with error handling
 */
class RoleManager {
    /**
     * Check and assign roles based on user count
     */
    static async checkAndAssignRoles(guild, userId, totalCount, word, roleMappings) {
        try {
            const member = await guild.members.fetch(userId);

            if (!roleMappings[word]) {
                return; // No role mappings for this word
            }

            const mappings = roleMappings[word];

            // Find the highest threshold the user has reached
            for (const [threshold, roleId] of Object.entries(mappings)) {
                const thresholdNum = parseInt(threshold);

                if (totalCount === thresholdNum) {
                    // User just hit this threshold exactly
                    await this.assignRole(member, roleId, thresholdNum);
                }
            }
        } catch (error) {
            Logger.error(`Failed to check/assign roles for user ${userId}`, error);
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
}

module.exports = RoleManager;
