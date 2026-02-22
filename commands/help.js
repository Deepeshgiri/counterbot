const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Complete setup guide and command reference')
        .addStringOption(option =>
            option
                .setName('topic')
                .setDescription('Specific help topic')
                .setRequired(false)
                .addChoices(
                    { name: 'Quick Start Guide', value: 'quickstart' },
                    { name: 'Setup Commands', value: 'setup' },
                    { name: 'How It Works', value: 'how' },
                    { name: 'Troubleshooting', value: 'troubleshoot' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        
        const topic = interaction.options.getString('topic');

        if (!topic) {
            await this.showMainHelp(interaction);
        } else if (topic === 'quickstart') {
            await this.showQuickStart(interaction);
        } else if (topic === 'setup') {
            await this.showSetupCommands(interaction);
        } else if (topic === 'how') {
            await this.showHowItWorks(interaction);
        } else if (topic === 'troubleshoot') {
            await this.showTroubleshooting(interaction);
        }
    },

    async showMainHelp(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📚 Word Tracker Bot - Complete Guide')
            .setDescription('Track words, earn roles, and compete on leaderboards!')
            .setColor(0x5865F2)
            .addFields(
                {
                    name: '🚀 Quick Start',
                    value: 'Use `/help topic:Quick Start Guide` for step-by-step setup',
                    inline: false
                },
                {
                    name: '⚙️ Admin Commands',
                    value: '`/setup-channel` - Configure tracked channels\n' +
                        '`/setup-word` - Add/remove tracked words\n' +
                        '`/setup-role` - Configure role rewards\n' +
                        '`/setup-cooldown` - Set global cooldown\n' +
                        '`/setup-leaderboard` - Set auto-post channel',
                    inline: false
                },
                {
                    name: '👥 User Commands',
                    value: '`/leaderboard` - View rankings (daily/weekly/monthly/total)',
                    inline: false
                },
                {
                    name: '📖 More Help',
                    value: '`/help topic:Setup Commands` - Detailed command guide\n' +
                        '`/help topic:How It Works` - How tracking works\n' +
                        '`/help topic:Troubleshooting` - Common issues',
                    inline: false
                }
            )
            .setFooter({ text: 'All admin commands require Administrator permission • Data is tracked per server' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async showQuickStart(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🚀 Quick Start Guide')
            .setDescription('Follow these steps to set up your word tracker!')
            .setColor(0x57F287)
            .addFields(
                {
                    name: '**Step 1: Add a Tracked Channel**',
                    value: '```/setup-channel add channel:#general```\nThis tells the bot where to watch for words.',
                    inline: false
                },
                {
                    name: '**Step 2: Add a Word to Track**',
                    value: '```/setup-word add word:owo aliases:uwu,OwO cooldown:5```\n' +
                        '• Tracks "owo"\n' +
                        '• Also counts "uwu" and "OwO"\n' +
                        '• 5 second cooldown per user',
                    inline: false
                },
                {
                    name: '**Step 3: Create Reward Roles**',
                    value: '1. Go to **Server Settings** → **Roles**\n' +
                        '2. Create roles: `OwO Beginner`, `OwO Expert`, etc.\n' +
                        '3. **IMPORTANT:** Move bot role **ABOVE** reward roles!',
                    inline: false
                },
                {
                    name: '**Step 4: Configure Role Rewards**',
                    value: '```/setup-role add word:owo threshold:10 role:@OwO Beginner```\n' +
                        'Repeat for each threshold (e.g., 50, 100, 500)',
                    inline: false
                },
                {
                    name: '**Step 5: Set Leaderboard Channel**',
                    value: '```/setup-leaderboard channel:#leaderboards```\n' +
                        'Bot will auto-post daily/weekly/monthly leaderboards here.',
                    inline: false
                },
                {
                    name: '**Step 6: Test It!**',
                    value: '1. Type your tracked word in the tracked channel\n' +
                        '2. Check: `/leaderboard type:total`\n' +
                        '3. You should see your count!',
                    inline: false
                }
            )
            .setFooter({ text: 'Need more help? Use /help topic:Troubleshooting' });

        await interaction.editReply({ embeds: [embed] });
    },

    async showSetupCommands(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Setup Commands Reference')
            .setDescription('Detailed guide for all admin commands')
            .setColor(0xFEE75C)
            .addFields(
                {
                    name: '📺 /setup-channel',
                    value: '**Add:** `/setup-channel add channel:#general`\n' +
                        '**Remove:** `/setup-channel remove channel:#general`\n' +
                        '**List:** `/setup-channel list`',
                    inline: false
                },
                {
                    name: '📝 /setup-word',
                    value: '**Add:** `/setup-word add word:owo aliases:uwu cooldown:5`\n' +
                        '• `aliases` - Comma-separated alternatives (optional)\n' +
                        '• `cooldown` - Custom cooldown in seconds (optional)\n\n' +
                        '**Remove:** `/setup-word remove word:owo`\n' +
                        '**List:** `/setup-word list`',
                    inline: false
                },
                {
                    name: '🎭 /setup-role',
                    value: '**Add:** `/setup-role add word:owo threshold:10 role:@Beginner`\n' +
                        '• Users get the role when hitting exact threshold\n' +
                        '• Multiple thresholds allowed per word\n\n' +
                        '**Remove:** `/setup-role remove word:owo threshold:10`\n' +
                        '**List:** `/setup-role list`',
                    inline: false
                },
                {
                    name: '⏱️ /setup-cooldown',
                    value: '**Set:** `/setup-cooldown seconds:10`\n' +
                        'Global cooldown (1-3600 seconds)\n' +
                        'Individual words can override this.',
                    inline: false
                },
                {
                    name: '🏆 /setup-leaderboard',
                    value: '**Set:** `/setup-leaderboard channel:#leaderboards`\n' +
                        'Auto-posts at:\n' +
                        '• Daily: Midnight UTC\n' +
                        '• Weekly: Monday 00:00 UTC\n' +
                        '• Monthly: 1st 00:00 UTC',
                    inline: false
                },
                {
                    name: '📊 /leaderboard (Everyone)',
                    value: '**View:** `/leaderboard type:total scope:guild`\n' +
                        'Types: `daily`, `weekly`, `monthly`, `total`\n' +
                        'Scopes: `guild` (this server) or `global` (all servers)\n' +
                        'Shows top 10 users with counts.',
                    inline: false
                }
            );

        await interaction.editReply({ embeds: [embed] });
    },

    async showHowItWorks(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔍 How Word Tracking Works')
            .setDescription('Understanding the tracking system')
            .setColor(0xEB459E)
            .addFields(
                {
                    name: '1️⃣ Message Detection',
                    value: '• Bot monitors **only configured channels**\n' +
                        '• Ignores bot messages and DMs\n' +
                        '• Extracts words from each message',
                    inline: false
                },
                {
                    name: '2️⃣ Word Matching',
                    value: '• **Case insensitive** (OwO = owo = OWO)\n' +
                        '• **Punctuation stripped** (owo! = owo)\n' +
                        '• **Alias support** (uwu counts as owo)\n' +
                        '• **Exact match** after normalization',
                    inline: false
                },
                {
                    name: '3️⃣ Cooldown Check',
                    value: '• **Per-user, per-word** cooldown\n' +
                        '• Default: 10 seconds (configurable)\n' +
                        '• Each word can have custom cooldown\n' +
                        '• Prevents spam and farming',
                    inline: false
                },
                {
                    name: '4️⃣ Count Increment',
                    value: '• **Daily count** - Resets at midnight UTC\n' +
                        '• **Weekly count** - Resets Monday 00:00 UTC\n' +
                        '• **Monthly count** - Resets 1st 00:00 UTC\n' +
                        '• **Total count** - Never resets',
                    inline: false
                },
                {
                    name: '5️⃣ Role Rewards',
                    value: '• Checks if user hit any thresholds\n' +
                        '• Assigns role at **exact match** (e.g., count = 10)\n' +
                        '• **Roles stack** (keeps lower roles)\n' +
                        '• Handles permission errors gracefully',
                    inline: false
                },
                {
                    name: '📈 Example Flow',
                    value: '```User types "owo" in #general\n' +
                        '→ Bot checks: Is #general tracked in THIS server? ✓\n' +
                        '→ Bot checks: Is "owo" tracked in THIS server? ✓\n' +
                        '→ Bot checks: Cooldown expired? ✓\n' +
                        '→ Increment guild counts: daily +1, weekly +1, monthly +1, total +1\n' +
                        '→ Increment global count: total_global +1\n' +
                        '→ Check thresholds: total = 10? Assign role!\n' +
                        '→ Update cooldown timestamp```',
                    inline: false
                },
                {
                    name: '🌍 Guild vs Global',
                    value: '• **Guild Tracking:** Each server tracks words independently\n' +
                        '• **Global Stats:** Your total across ALL servers\n' +
                        '• **Leaderboards:** Use `scope:guild` or `scope:global`\n' +
                        '• **Role Rewards:** Based on guild-specific counts only',
                    inline: false
                }
            );

        await interaction.editReply({ embeds: [embed] });
    },

    async showTroubleshooting(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🆘 Troubleshooting Guide')
            .setDescription('Common issues and solutions')
            .setColor(0xED4245)
            .addFields(
                {
                    name: '❌ Commands don\'t appear in Discord',
                    value: '**Solution:**\n' +
                        '• Wait 5-10 minutes (global commands take time)\n' +
                        '• Check bot has "Use Application Commands" permission\n' +
                        '• Try kicking and re-inviting the bot',
                    inline: false
                },
                {
                    name: '❌ Bot can\'t assign roles',
                    value: '**Solution:**\n' +
                        '1. Go to **Server Settings** → **Roles**\n' +
                        '2. Drag bot\'s role **ABOVE** all reward roles\n' +
                        '3. Ensure bot has "Manage Roles" permission\n' +
                        '4. Check `/setup-role list` for correct role IDs',
                    inline: false
                },
                {
                    name: '❌ Words aren\'t being counted',
                    value: '**Check these:**\n' +
                        '• Is channel tracked? `/setup-channel list`\n' +
                        '• Is word tracked? `/setup-word list`\n' +
                        '• Are you on cooldown? (wait 10+ seconds)\n' +
                        '• Is bot online and has "Read Messages" permission?',
                    inline: false
                },
                {
                    name: '❌ Leaderboard shows "No data yet"',
                    value: '**Solution:**\n' +
                        '• Make sure words are being counted first\n' +
                        '• Type tracked words in tracked channels\n' +
                        '• Check `/leaderboard type:total` after counting',
                    inline: false
                },
                {
                    name: '❌ Automatic leaderboards not posting',
                    value: '**Solution:**\n' +
                        '• Set channel: `/setup-leaderboard channel:#leaderboards`\n' +
                        '• Ensure bot has "Send Messages" permission\n' +
                        '• Wait for scheduled time (midnight UTC)\n' +
                        '• Check bot is still running',
                    inline: false
                },
                {
                    name: '❌ Bot went offline',
                    value: '**Solution:**\n' +
                        '• Restart bot: `npm start` in terminal\n' +
                        '• Check `.env` file has correct `DISCORD_TOKEN`\n' +
                        '• Check console for error messages',
                    inline: false
                },
                {
                    name: '💡 Still need help?',
                    value: 'Check the **README.md** file in the bot folder for detailed documentation!',
                    inline: false
                }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};
