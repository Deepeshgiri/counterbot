const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataManager = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-word')
        .setDescription('Configure tracked words')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a word to track')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('Word to track')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('aliases')
                        .setDescription('Comma-separated aliases (optional)')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('cooldown')
                        .setDescription('Custom cooldown in seconds (optional)')
                        .setRequired(false)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a tracked word')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('Word to stop tracking')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all tracked words')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            await this.addWord(interaction);
        } else if (subcommand === 'remove') {
            await this.removeWord(interaction);
        } else if (subcommand === 'list') {
            await this.listWords(interaction);
        }
    },

    async addWord(interaction) {
        const word = interaction.options.getString('word').toLowerCase();
        const aliasesStr = interaction.options.getString('aliases');
        const cooldown = interaction.options.getInteger('cooldown');

        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (config.tracked_words[word]) {
            return interaction.reply({
                content: `❌ Word "${word}" is already being tracked.`,
                ephemeral: true
            });
        }

        // Parse aliases
        const aliases = aliasesStr
            ? aliasesStr.split(',').map(a => a.trim().toLowerCase()).filter(a => a)
            : [];

        // Check for alias conflicts
        for (const [existingWord, existingConfig] of Object.entries(config.tracked_words)) {
            if (aliases.includes(existingWord)) {
                return interaction.reply({
                    content: `❌ Alias "${existingWord}" conflicts with an existing tracked word.`,
                    ephemeral: true
                });
            }

            if (existingConfig.aliases) {
                for (const alias of aliases) {
                    if (existingConfig.aliases.includes(alias)) {
                        return interaction.reply({
                            content: `❌ Alias "${alias}" is already used by word "${existingWord}".`,
                            ephemeral: true
                        });
                    }
                }
            }
        }

        config.tracked_words[word] = {
            aliases: aliases,
            cooldown: cooldown || null
        };

        await DataManager.saveConfig(guildId, config);

        let response = `✅ Now tracking word: **${word}**`;
        if (aliases.length > 0) {
            response += `\nAliases: ${aliases.join(', ')}`;
        }
        if (cooldown) {
            response += `\nCooldown: ${cooldown}s`;
        }

        await interaction.reply({
            content: response,
            ephemeral: true
        });
    },

    async removeWord(interaction) {
        const word = interaction.options.getString('word').toLowerCase();
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (!config.tracked_words[word]) {
            return interaction.reply({
                content: `❌ Word "${word}" is not being tracked.`,
                ephemeral: true
            });
        }

        delete config.tracked_words[word];

        // Also remove from role mappings
        if (config.role_mappings[word]) {
            delete config.role_mappings[word];
        }

        await DataManager.saveConfig(guildId, config);

        await interaction.reply({
            content: `✅ Stopped tracking word: **${word}**`,
            ephemeral: true
        });
    },

    async listWords(interaction) {
        const guildId = interaction.guild.id;
        const config = await DataManager.getConfig(guildId);

        if (Object.keys(config.tracked_words).length === 0) {
            return interaction.reply({
                content: '📋 No words are currently being tracked.',
                ephemeral: true
            });
        }

        const wordList = Object.entries(config.tracked_words)
            .map(([word, wordConfig]) => {
                let line = `• **${word}**`;
                if (wordConfig.aliases && wordConfig.aliases.length > 0) {
                    line += ` (aliases: ${wordConfig.aliases.join(', ')})`;
                }
                if (wordConfig.cooldown) {
                    line += ` [${wordConfig.cooldown}s cooldown]`;
                }
                return line;
            })
            .join('\n');

        await interaction.reply({
            content: `📋 **Tracked Words:**\n${wordList}`,
            ephemeral: true
        });
    }
};
