const Logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            Logger.warn(`Unknown command: ${interaction.commandName}`);
            return;
        }

        try {
            Logger.command(interaction.commandName, interaction.user.tag);
            await command.execute(interaction);
        } catch (error) {
            Logger.error(`Error executing command ${interaction.commandName}`, error);
        }
    }
};
