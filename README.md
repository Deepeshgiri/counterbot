# Discord Word Tracker Bot

A production-ready Discord bot built with discord.js v14+ that tracks configurable words per user with role rewards and multi-period leaderboards. All data is stored in JSON files with no database dependencies.

## ✨ Features

- **📊 Word Tracking**: Monitor specific words across configured channels
- **⏱️ Smart Cooldowns**: Per-user, per-word cooldown system with configurable durations
- **🏆 Role Rewards**: Automatically assign roles when users hit count thresholds
- **📈 Multi-Period Leaderboards**: Daily, weekly, monthly, and all-time rankings
- **🤖 Automatic Resets**: Scheduled leaderboard posting and count resets
- **💾 JSON Storage**: No database required - all data in simple JSON files
- **🛡️ Production Ready**: Error handling, graceful shutdown, file corruption recovery

## 📋 Requirements

- **Node.js** v16.9.0 or higher
- **Discord Bot Token** with proper intents enabled

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download this repository
cd discord-word-tracker-bot

# Install dependencies
npm install
```

### 2. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **Bot** section and create a bot
4. Enable these **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy your bot token

### 3. Bot Permissions

Your bot needs these permissions:

| Permission | Reason |
|------------|--------|
| **Read Messages/View Channels** | Monitor configured channels |
| **Send Messages** | Post leaderboards |
| **Manage Roles** | Assign reward roles |
| **Use Slash Commands** | All bot commands |

**Recommended Permission Integer**: `268445760`

**Invite URL Template**:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=268445760&scope=bot%20applications.commands
```

### 4. Configuration

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_optional
DEFAULT_COOLDOWN=10
```

**Environment Variables**:
- `DISCORD_TOKEN` (required): Your Discord bot token
- `GUILD_ID` (optional): For faster command registration during development
- `DEFAULT_COOLDOWN` (optional): Default cooldown in seconds (default: 10)

### 5. Run the Bot

```bash
npm start
```

You should see:
```
[SUCCESS] Data directory initialized
[SUCCESS] Logged in as YourBot#1234
[SUCCESS] Bot is fully operational!
```

## 📚 Commands

All commands require **Administrator** permission except `/leaderboard`.

### Setup Commands

#### `/setup-channel`
Configure which channels to monitor for word tracking.

**Subcommands**:
- `/setup-channel add <channel>` - Start tracking a channel
- `/setup-channel remove <channel>` - Stop tracking a channel
- `/setup-channel list` - Show all tracked channels

**Example**:
```
/setup-channel add #general
```

#### `/setup-word`
Configure which words to track.

**Subcommands**:
- `/setup-word add <word> [aliases] [cooldown]` - Add a tracked word
  - `word`: The main word to track
  - `aliases`: Comma-separated alternative spellings (optional)
  - `cooldown`: Custom cooldown override in seconds (optional)
- `/setup-word remove <word>` - Remove a tracked word
- `/setup-word list` - Show all tracked words

**Examples**:
```
/setup-word add owo aliases:uwu,OwO cooldown:5
/setup-word add hello
/setup-word list
```

#### `/setup-role`
Configure role rewards for reaching count thresholds.

**Subcommands**:
- `/setup-role add <word> <threshold> <role>` - Add a role reward
  - `word`: The tracked word
  - `threshold`: Total count needed
  - `role`: Role to assign
- `/setup-role remove <word> <threshold>` - Remove a role reward
- `/setup-role list` - Show all role mappings

**Examples**:
```
/setup-role add owo threshold:10 role:@OwO Novice
/setup-role add owo threshold:100 role:@OwO Expert
/setup-role list
```

> **⚠️ Role Hierarchy Warning**: The bot's role must be **higher** than any role it assigns. If you get hierarchy errors, move the bot's role up in Server Settings → Roles.

#### `/setup-cooldown`
Set the global cooldown duration.

**Usage**:
```
/setup-cooldown seconds:15
```

Individual words can override this with their own cooldown.

#### `/setup-leaderboard`
Set the channel for automatic leaderboard posts.

**Usage**:
```
/setup-leaderboard channel:#leaderboards
```

**Posting Schedule**:
- **Daily**: Midnight UTC
- **Weekly**: Monday midnight UTC
- **Monthly**: 1st of month midnight UTC

### User Commands

#### `/leaderboard`
View word count rankings.

**Usage**:
```
/leaderboard type:daily
/leaderboard type:weekly
/leaderboard type:monthly
/leaderboard type:total
```

Shows top 10 users with their counts.

## 🗂️ Project Structure

```
discord-word-tracker-bot/
├── commands/              # Slash command handlers
│   ├── setup-channel.js
│   ├── setup-word.js
│   ├── setup-role.js
│   ├── setup-cooldown.js
│   ├── setup-leaderboard.js
│   └── leaderboard.js
├── events/                # Discord event handlers
│   ├── ready.js
│   ├── messageCreate.js
│   └── interactionCreate.js
├── utils/                 # Utility modules
│   ├── dataManager.js     # JSON file management
│   ├── logger.js          # Colored logging
│   ├── wordUtils.js       # Word normalization
│   ├── roleManager.js     # Role assignment
│   ├── leaderboardUtils.js # Leaderboard generation
│   └── scheduler.js       # Automatic resets
├── data/                  # Auto-generated data files
│   ├── users.json
│   └── config.json
├── index.js               # Main entry point
├── package.json
├── .env                   # Your configuration
└── .env.example           # Template
```

## 📊 Data Structure

### users.json
```json
{
  "USER_ID": {
    "discord_id": "USER_ID",
    "daily_count": 5,
    "weekly_count": 23,
    "monthly_count": 87,
    "total_count": 342,
    "last_counted": {
      "owo": 1707584234567
    }
  }
}
```

### config.json
```json
{
  "enabled_channels": ["CHANNEL_ID_1", "CHANNEL_ID_2"],
  "tracked_words": {
    "owo": {
      "aliases": ["uwu", "OwO"],
      "cooldown": 5
    }
  },
  "role_mappings": {
    "owo": {
      "10": "ROLE_ID_1",
      "100": "ROLE_ID_2"
    }
  },
  "cooldown_seconds": 10,
  "leaderboard_channel_id": "CHANNEL_ID"
}
```

## 🔧 How It Works

### Word Tracking Flow

1. User sends a message in a tracked channel
2. Bot extracts and normalizes words
3. Checks if any word matches tracked words/aliases
4. Verifies user's cooldown has expired
5. Increments all count types (daily/weekly/monthly/total)
6. Updates last counted timestamp
7. Checks if user hit any role reward thresholds
8. Assigns roles if thresholds reached

### Cooldown System

- **Per-user, per-word**: Each user has independent cooldowns for each word
- **Configurable**: Global default + per-word overrides
- **Prevents spam**: Users can't farm counts by repeating words

### Role Assignment

- **Progressive stacking**: Users keep lower-tier roles when earning higher ones
- **Exact threshold**: Roles assigned only when count equals threshold exactly
- **Error handling**: Gracefully handles missing roles, permission issues, hierarchy problems

### Automatic Resets

The scheduler runs three cron jobs:

| Period | Schedule | Action |
|--------|----------|--------|
| Daily | `0 0 * * *` (Midnight UTC) | Post daily leaderboard, reset `daily_count` |
| Weekly | `0 0 * * 1` (Monday midnight UTC) | Post weekly leaderboard, reset `weekly_count` |
| Monthly | `0 0 1 * *` (1st midnight UTC) | Post monthly leaderboard, reset `monthly_count` |

`total_count` is **never** reset.

## 🛡️ Production Features

### Error Recovery

- **File corruption detection**: Automatically backs up corrupted JSON files
- **Graceful degradation**: Returns empty data if files are unreadable
- **Atomic writes**: Uses temp files + rename to prevent partial writes

### File Locking

Simple in-memory lock system prevents simultaneous writes to the same file.

### Graceful Shutdown

On `SIGINT` or `SIGTERM`:
1. Stop scheduler
2. Save all cached data
3. Destroy Discord client
4. Exit cleanly

### Logging

Color-coded console logs for easy monitoring:
- 🔵 **INFO**: General information
- 🟢 **SUCCESS**: Successful operations
- 🟡 **WARN**: Warnings
- 🔴 **ERROR**: Errors with stack traces
- 🟣 **COMMAND**: Command usage tracking

## 🐛 Troubleshooting

### Bot doesn't respond to commands

1. Check bot has **Use Application Commands** permission
2. Verify commands are registered (check bot startup logs)
3. If using `GUILD_ID`, commands only work in that server
4. Try removing `GUILD_ID` for global commands (takes up to 1 hour)

### "Missing Permissions" when assigning roles

1. Ensure bot has **Manage Roles** permission
2. **Move bot's role above reward roles** in Server Settings → Roles
3. Check role hierarchy in `/setup-role list`

### Words not being counted

1. Verify channel is tracked: `/setup-channel list`
2. Verify word is tracked: `/setup-word list`
3. Check user isn't on cooldown (check console logs)
4. Ensure **Message Content Intent** is enabled in Discord Developer Portal

### Leaderboards not posting automatically

1. Verify channel is set: `/setup-leaderboard`
2. Check bot has **Send Messages** permission in that channel
3. Wait for next scheduled time (check console for scheduler start message)

### Data file corruption

The bot automatically detects and backs up corrupted files. Check the `data/` directory for `.corrupted.*` backup files.

## 📝 Example Setup Workflow

```bash
# 1. Add tracked channel
/setup-channel add #general

# 2. Add tracked word with aliases
/setup-word add owo aliases:uwu,OwO cooldown:5

# 3. Set up role rewards
/setup-role add owo threshold:10 role:@OwO Beginner
/setup-role add owo threshold:50 role:@OwO Intermediate
/setup-role add owo threshold:100 role:@OwO Expert

# 4. Configure leaderboard channel
/setup-leaderboard channel:#leaderboards

# 5. Set global cooldown
/setup-cooldown seconds:10

# 6. View current leaderboard
/leaderboard type:total
```

## 🔒 Security Notes

- **Never commit `.env`** - It contains your bot token
- Keep `DISCORD_TOKEN` secret
- Use `.gitignore` to exclude sensitive files
- Regularly update dependencies: `npm update`

## 📄 License

MIT License - feel free to modify and use for your own servers!

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for error messages
3. Verify bot permissions and role hierarchy
4. Check Discord Developer Portal for intent settings

---

**Built with discord.js v14+ | Production-ready | No database required**
