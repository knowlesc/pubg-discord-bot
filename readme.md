# pubg-discord-bot

A discord bot that sends post-match stats for PlayerUnknown's Battlegrounds to a discord server.

## Setup

The following environment variables are needed:
- `DISCORDTOKEN` - a valid [Discord API](https://discordapp.com/developers) token
- `DISCORDCHANNEL` - a valid Discord Channel ID (enable developer mode and right click a channel to get the ID)
- `PUBGTOKEN` - a valid [PUBG API](https://developer.pubg.com/) token
- `PLAYERS` - a comma-separated list of player names to track

## Individual Stats

Individual statistics for each tracked player in a given match are posted to the configured discord channel after each match is finished.

![](https://i.imgur.com/VBDrcP0.png)

## Team Stats

After individual stats are posted for each match, another message is posted containing a generated image that shows the following information:
- Plane path (grey dotted line)
- Tracked player parachute path(s) (blue dotted line)
- Tracked player movement path(s) (red solid line)
- Tracked player death location(s) (yellow X)
- Tracked player death location(s) (red X)
- All player landing locations (yellow dots)
- Circle locations

![](https://i.imgur.com/wipg1U3.png)
![](https://i.imgur.com/MbnBx1j.png)
