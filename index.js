require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const Logger = require('./utils/logger');
const DataManager = require('./utils/dataManager');
const Scheduler = require('./utils/scheduler');

// Validate environment variables
if (!process.env.DISCORD_TOKEN) {
    Logger.error('DISCORD_TOKEN is required in .env file');
    process.exit(1);
}

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Command collection
client.commands = new Collection();

/**
 * Load commands from commands directory
 */
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            Logger.info(`Loaded command: ${command.data.name}`);
        } else {
            Logger.warn(`Command ${file} is missing required "data" or "execute" property`);
        }
    }
}

/**
 * Load events from events directory
 */
function loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }

        Logger.info(`Loaded event: ${event.name}`);
    }
}

/**
 * Register slash commands with Discord
 */
async function registerCommands() {
    const commands = [];

    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        Logger.info(`Registering ${commands.length} slash commands...`);

        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
            );
            Logger.success('Guild commands registered successfully');
        } else {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            Logger.success('Global commands registered successfully');
        }
    } catch (error) {
        Logger.error('Failed to register commands', error);
    }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
    Logger.warn(`Received ${signal}, shutting down gracefully...`);

    try {
        if (client.scheduler) {
            client.scheduler.stop();
        }

        await DataManager.shutdown();
        client.destroy();

        Logger.success('Shutdown complete');
        process.exit(0);
    } catch (error) {
        Logger.error('Error during shutdown', error);
        process.exit(1);
    }
}

/**
 * Main initialization
 */
async function main() {
    try {
        Logger.info('Starting Discord Word Tracker Bot...');

        await DataManager.initialize();
        loadCommands();
        loadEvents();

        await client.login(process.env.DISCORD_TOKEN);

        await new Promise(resolve => {
            client.once('ready', resolve);
        });

        await registerCommands();

        client.scheduler = new Scheduler(client);
        client.scheduler.start();

        Logger.success('Bot is fully operational!');
    } catch (error) {
        Logger.error('Failed to start bot', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
    Logger.error('Unhandled promise rejection', error);
});

process.on('uncaughtException', (error) => {
    Logger.error('Uncaught exception', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

main();
