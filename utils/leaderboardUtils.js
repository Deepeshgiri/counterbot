const { EmbedBuilder } = require('discord.js');

/**
 * Leaderboard generation utilities
 */
class LeaderboardUtils {
    /**
     * Generate leaderboard embed
     */
    static async generateLeaderboard(client, users, type, scopeLabel, scope = 'guild') {
        let countField;

        if (scope === 'global') {
            // Global leaderboard only shows total_count_global
            countField = 'total_count_global';
        } else {
            // Guild leaderboard shows the requested type
            countField = `${type}_count`;
        }

        // Sort users by count
        const sorted = Object.entries(users)
            .map(([userId, data]) => ({
                userId,
                count: data[countField] || 0
            }))
            .filter(entry => entry.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        if (sorted.length === 0) {
            return new EmbedBuilder()
                .setTitle(`🏆 ${this.getTypeTitle(type, scope)} Leaderboard`)
                .setDescription('No data yet! Start counting to appear on the leaderboard.')
                .setColor(0x5865F2)
                .setFooter({ text: scopeLabel })
                .setTimestamp();
        }

        // Build leaderboard text
        const leaderboardText = await Promise.all(
            sorted.map(async (entry, index) => {
                const medal = this.getMedal(index);
                let username = 'Unknown User';

                try {
                    const user = await client.users.fetch(entry.userId);
                    username = user.tag;
                } catch {
                    username = `User ${entry.userId}`;
                }

                return `${medal} **${index + 1}.** ${username} - **${entry.count}** counts`;
            })
        );

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${this.getTypeTitle(type, scope)} Leaderboard`)
            .setDescription(leaderboardText.join('\n'))
            .setColor(0x5865F2)
            .setTimestamp()
            .setFooter({ text: `${scopeLabel} • Top ${sorted.length} users` });

        return embed;
    }

    /**
     * Get medal emoji for position
     */
    static getMedal(index) {
        const medals = ['🥇', '🥈', '🥉'];
        return medals[index] || '🏅';
    }

    /**
     * Get title for leaderboard type
     */
    static getTypeTitle(type, scope = 'guild') {
        if (scope === 'global') {
            return 'Global All-Time';
        }

        const titles = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            total: 'All-Time'
        };
        return titles[type] || 'Unknown';
    }
}

module.exports = LeaderboardUtils;
