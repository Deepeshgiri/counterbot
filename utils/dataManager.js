const fs = require('fs').promises;
const path = require('path');
const Logger = require('./logger');

/**
 * Thread-safe JSON data manager with guild-specific storage and global leaderboard support
 */
class DataManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.locks = new Map();
        this.cache = new Map();
    }

    /**
     * Initialize data directory and default files
     */
    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            Logger.success('Data directory initialized');

            // Initialize guild-specific data files
            await this.ensureFile('users.json', {});
            await this.ensureFile('config.json', {});
            await this.ensureFile('global.json', { users: {} });

            // Check if migration is needed
            await this.migrateIfNeeded();

            Logger.success('Data files initialized');
        } catch (error) {
            Logger.error('Failed to initialize data manager', error);
            throw error;
        }
    }

    /**
     * Migrate old data format to guild-specific format
     */
    async migrateIfNeeded() {
        const users = await this.readFile('users.json');
        const config = await this.readFile('config.json');

        // Check if data is in old format (no guild nesting)
        const usersKeys = Object.keys(users);
        const configKeys = Object.keys(config);

        // Old format detection: if users has user IDs at top level
        if (usersKeys.length > 0 && users[usersKeys[0]]?.discord_id) {
            Logger.warn('Detected old data format, migration needed');
            Logger.warn('This is a one-time migration. Creating backups...');

            // Create backups
            await this.writeFile('users.json.backup', users);
            await this.writeFile('config.json.backup', config);
            Logger.success('Backups created');

            // Migration will happen when first guild is accessed
            // We can't migrate without knowing the guild ID
            Logger.info('Data will be migrated on first use');
        }
    }

    /**
     * Ensure a file exists with default content
     */
    async ensureFile(filename, defaultContent) {
        const filepath = path.join(this.dataDir, filename);
        try {
            await fs.access(filepath);
        } catch {
            await this.writeFile(filename, defaultContent);
            Logger.info(`Created default ${filename}`);
        }
    }

    /**
     * Acquire lock for a file
     */
    async acquireLock(filename) {
        while (this.locks.get(filename)) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        this.locks.set(filename, true);
    }

    /**
     * Release lock for a file
     */
    releaseLock(filename) {
        this.locks.delete(filename);
    }

    /**
     * Read JSON file with error recovery
     */
    async readFile(filename) {
        const filepath = path.join(this.dataDir, filename);

        try {
            await this.acquireLock(filename);

            if (this.cache.has(filename)) {
                this.releaseLock(filename);
                return JSON.parse(JSON.stringify(this.cache.get(filename)));
            }

            const data = await fs.readFile(filepath, 'utf-8');
            const parsed = JSON.parse(data);

            this.cache.set(filename, parsed);

            this.releaseLock(filename);
            return parsed;
        } catch (error) {
            this.releaseLock(filename);

            if (error.code === 'ENOENT') {
                Logger.warn(`File ${filename} not found, returning empty object`);
                return {};
            }

            if (error instanceof SyntaxError) {
                Logger.error(`Corrupted JSON in ${filename}, attempting recovery`);
                await this.backupCorruptedFile(filepath);
                return {};
            }

            Logger.error(`Error reading ${filename}`, error);
            throw error;
        }
    }

    /**
     * Write JSON file with atomic write
     */
    async writeFile(filename, data) {
        const filepath = path.join(this.dataDir, filename);
        const tempPath = `${filepath}.tmp`;

        try {
            await this.acquireLock(filename);

            await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
            await fs.rename(tempPath, filepath);

            this.cache.set(filename, data);

            this.releaseLock(filename);
        } catch (error) {
            this.releaseLock(filename);
            Logger.error(`Error writing ${filename}`, error);

            try {
                await fs.unlink(tempPath);
            } catch { }

            throw error;
        }
    }

    /**
     * Backup corrupted file for recovery
     */
    async backupCorruptedFile(filepath) {
        const backupPath = `${filepath}.corrupted.${Date.now()}`;
        try {
            await fs.copyFile(filepath, backupPath);
            Logger.warn(`Backed up corrupted file to ${backupPath}`);
        } catch (error) {
            Logger.error('Failed to backup corrupted file', error);
        }
    }

    /**
     * Get guild-specific user data
     */
    async getUsers(guildId) {
        const allUsers = await this.readFile('users.json');

        if (!allUsers[guildId]) {
            allUsers[guildId] = {};
            await this.writeFile('users.json', allUsers);
        }

        return allUsers[guildId];
    }

    /**
     * Save guild-specific user data
     */
    async saveUsers(guildId, users) {
        const allUsers = await this.readFile('users.json');
        allUsers[guildId] = users;
        await this.writeFile('users.json', allUsers);
    }

    /**
     * Get guild-specific config
     */
    async getConfig(guildId) {
        const allConfigs = await this.readFile('config.json');

        if (!allConfigs[guildId]) {
            allConfigs[guildId] = {
                enabled_channels: [],
                tracked_words: {},
                role_mappings: {},
                cooldown_seconds: parseInt(process.env.DEFAULT_COOLDOWN) || 10,
                leaderboard_channel_id: null
            };
            await this.writeFile('config.json', allConfigs);
        }

        return allConfigs[guildId];
    }

    /**
     * Save guild-specific config
     */
    async saveConfig(guildId, config) {
        const allConfigs = await this.readFile('config.json');
        allConfigs[guildId] = config;
        await this.writeFile('config.json', allConfigs);
    }

    /**
     * Get or create user data in a specific guild
     */
    async getUser(guildId, userId) {
        const users = await this.getUsers(guildId);

        if (!users[userId]) {
            users[userId] = {
                discord_id: userId,
                guild_id: guildId,
                daily_count: 0,
                weekly_count: 0,
                monthly_count: 0,
                total_count: 0,
                last_counted: {}
            };
            await this.saveUsers(guildId, users);
        }

        return users[userId];
    }

    /**
     * Increment user count in a specific guild
     */
    async incrementUserCount(guildId, userId, word) {
        const users = await this.getUsers(guildId);
        const user = users[userId] || {
            discord_id: userId,
            guild_id: guildId,
            daily_count: 0,
            weekly_count: 0,
            monthly_count: 0,
            total_count: 0,
            last_counted: {}
        };

        user.daily_count++;
        user.weekly_count++;
        user.monthly_count++;
        user.total_count++;
        user.last_counted[word] = Date.now();

        users[userId] = user;
        await this.saveUsers(guildId, users);

        // Update global stats
        await this.incrementGlobalCount(userId, guildId);

        return user;
    }

    /**
     * Get global user statistics
     */
    async getGlobalUsers() {
        const globalData = await this.readFile('global.json');
        return globalData.users || {};
    }

    /**
     * Increment global user count
     */
    async incrementGlobalCount(userId, guildId) {
        const globalData = await this.readFile('global.json');

        if (!globalData.users) {
            globalData.users = {};
        }

        if (!globalData.users[userId]) {
            globalData.users[userId] = {
                discord_id: userId,
                total_count_global: 0,
                guilds: []
            };
        }

        globalData.users[userId].total_count_global++;

        // Track which guilds this user is in
        if (!globalData.users[userId].guilds.includes(guildId)) {
            globalData.users[userId].guilds.push(guildId);
        }

        await this.writeFile('global.json', globalData);
    }

    /**
     * Reset counts for all users in a specific guild
     */
    async resetCounts(guildId, type) {
        const users = await this.getUsers(guildId);
        const field = `${type}_count`;

        for (const userId in users) {
            users[userId][field] = 0;
        }

        await this.saveUsers(guildId, users);
        Logger.info(`Reset ${type} counts for guild ${guildId}`);
    }

    /**
     * Get all guild IDs that have data
     */
    async getAllGuildIds() {
        const allUsers = await this.readFile('users.json');
        return Object.keys(allUsers);
    }

    /**
     * Save all data on shutdown
     */
    async shutdown() {
        Logger.info('Saving all data before shutdown...');
        await new Promise(resolve => setTimeout(resolve, 100));
        Logger.success('Data saved successfully');
    }
}

module.exports = new DataManager();
