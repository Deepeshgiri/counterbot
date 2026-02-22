const cron = require('node-cron');
const DataManager = require('./dataManager');
const LeaderboardUtils = require('./leaderboardUtils');
const RoleManager = require('./roleManager');
const Logger = require('./logger');

/**
 * Automatic leaderboard posting and reset scheduler (guild-aware with timezone support)
 */
class Scheduler {
    constructor(client) {
        this.client = client;
        this.jobs = new Map();
    }

    /**
     * Start all scheduled tasks
     */
    start() {
        // Run every minute to check if any guild needs reset
        const checkJob = cron.schedule('* * * * *', async () => {
            await this.checkGuildResets();
        });

        this.jobs.set('check', checkJob);
        Logger.success('Scheduler started with per-guild timezone support');
    }

    /**
     * Check if any guild needs reset based on their timezone
     */
    async checkGuildResets() {
        try {
            const guildIds = await DataManager.getAllGuildIds();
            const now = new Date();

            for (const guildId of guildIds) {
                const config = await DataManager.getConfig(guildId);
                const timezone = config.timezone || 'UTC';

                const guildTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
                const hour = guildTime.getHours();
                const minute = guildTime.getMinutes();
                const day = guildTime.getDate();
                const dayOfWeek = guildTime.getDay();

                // Check if it's midnight (00:00)
                if (hour === 0 && minute === 0) {
                    // Daily reset
                    await this.resetGuild(guildId, 'daily');

                    // Weekly reset (Monday)
                    if (dayOfWeek === 1) {
                        await this.resetGuild(guildId, 'weekly');
                    }

                    // Monthly reset (1st day)
                    if (day === 1) {
                        await this.resetGuild(guildId, 'monthly');
                    }
                }
            }
        } catch (error) {
            Logger.error('Failed to check guild resets', error);
        }
    }

    /**
     * Reset a specific guild
     */
    async resetGuild(guildId, type) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            Logger.info(`Running ${type} reset for guild ${guild.name}...`);

            await this.postLeaderboard(guildId, type);
            await this.removeRolesForReset(guildId, type);
            await DataManager.resetCounts(guildId, type);

            Logger.success(`Completed ${type} reset for guild ${guild.name}`);
        } catch (error) {
            Logger.error(`Failed to reset guild ${guildId}`, error);
        }
    }

    /**
     * Remove roles from users when period resets
     */
    async removeRolesForReset(guildId, type) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const config = await DataManager.getConfig(guildId);
            const users = await DataManager.getUsers(guildId);

            for (const user of Object.values(users)) {
                for (const word of Object.keys(config.tracked_words)) {
                    if (config.role_mappings && config.role_mappings[word]) {
                        await RoleManager.removeUnqualifiedRoles(
                            guild,
                            user.discord_id,
                            0,
                            word,
                            config.role_mappings
                        );
                    }
                }
            }
        } catch (error) {
            Logger.error(`Failed to remove roles for guild ${guildId}`, error);
        }
    }

    /**
     * Post leaderboard to a specific guild
     */
    async postLeaderboard(guildId, type) {
        try {
            const config = await DataManager.getConfig(guildId);

            if (!config.leaderboard_channel_id) {
                return;
            }

            const users = await DataManager.getUsers(guildId);
            const guild = this.client.guilds.cache.get(guildId);

            if (!guild) {
                return;
            }

            const embed = await LeaderboardUtils.generateLeaderboard(
                this.client,
                users,
                type,
                guild.name,
                'guild'
            );

            const channel = guild.channels.cache.get(config.leaderboard_channel_id);

            if (channel) {
                await channel.send({ embeds: [embed] });
                Logger.success(`Posted ${type} leaderboard to ${guild.name}/#${channel.name}`);
            }
        } catch (error) {
            Logger.error(`Failed to post ${type} leaderboard for guild ${guildId}`, error);
        }
    }

    /**
     * Stop all scheduled tasks
     */
    stop() {
        for (const [name, job] of this.jobs) {
            job.stop();
        }
        Logger.info('Scheduler stopped');
    }
}

module.exports = Scheduler;
