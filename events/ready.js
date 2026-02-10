const Logger = require('../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        Logger.success(`Logged in as ${client.user.tag}`);
        Logger.info(`Bot is ready and serving ${client.guilds.cache.size} guild(s)`);

        // Set bot status
        client.user.setActivity('word counts', { type: 'WATCHING' });
    }
};
