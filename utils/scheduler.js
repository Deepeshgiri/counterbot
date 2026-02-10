const cron = require('node-cron');
const DataManager = require('./dataManager');
const LeaderboardUtils = require('./leaderboardUtils');
const Logger = require('./logger');

/**
 * Automatic leaderboard posting and reset scheduler (guild-aware)
 */
class Scheduler {
    constructor(client) {
        this.client = client;
        this.jobs = [];
    }

    /**
     * Start all scheduled tasks
     */
    start() {
        // Daily reset at midnight UTC
        const dailyJob = cron.schedule('0 0 * * *', async () => {
            Logger.info('Running daily reset...');
            await this.postLeaderboards('daily');
            await this.resetAllGuilds('daily');
        }, {
            timezone: 'UTC'
        });

        // Weekly reset at Monday midnight UTC
        const weeklyJob = cron.schedule('0 0 * * 1', async () => {
            Logger.info('Running weekly reset...');
            await this.postLeaderboards('weekly');
            await this.resetAllGuilds('weekly');
        }, {
            timezone: 'UTC'
        });

        // Monthly reset at 1st of month midnight UTC
        const monthlyJob = cron.schedule('0 0 1 * *', async () => {
            Logger.info('Running monthly reset...');
            await this.postLeaderboards('monthly');
            await this.resetAllGuilds('monthly');
        }, {
            timezone: 'UTC'
        });

        this.jobs.push(dailyJob, weeklyJob, monthlyJob);
        Logger.success('Scheduler started with daily, weekly, and monthly tasks');
    }

    /**
     * Reset counts for all guilds
     */
    async resetAllGuilds(type) {
        try {
            const guildIds = await DataManager.getAllGuildIds();

            for (const guildId of guildIds) {
                await DataManager.resetCounts(guildId, type);
            }

            Logger.success(`Reset ${type} counts for ${guildIds.length} guilds`);
        } catch (error) {
            Logger.error(`Failed to reset ${type} counts`, error);
        }
    }

    /**
     * Post leaderboards to all configured channels
     */
    async postLeaderboards(type) {
        try {
            const guildIds = await DataManager.getAllGuildIds();
            let posted = 0;

            for (const guildId of guildIds) {
                const config = await DataManager.getConfig(guildId);

                if (!config.leaderboard_channel_id) {
                    continue;
                }

                const users = await DataManager.getUsers(guildId);
                const guild = this.client.guilds.cache.get(guildId);

                if (!guild) {
                    Logger.warn(`Guild ${guildId} not found in cache`);
                    continue;
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
                    posted++;
                } else {
                    Logger.warn(`Leaderboard channel not found in guild ${guild.name}`);
                }
            }

            Logger.success(`Posted ${type} leaderboards to ${posted} channels`);
        } catch (error) {
            Logger.error(`Failed to post ${type} leaderboards`, error);
        }
    }

    /**
     * Stop all scheduled tasks
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        Logger.info('Scheduler stopped');
    }
}

module.exports = Scheduler;
