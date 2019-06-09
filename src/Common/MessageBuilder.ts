import { RichEmbed } from 'discord.js';
import { PlayerMatchStats } from '../PubgMonitor/Types/PubgApi/PlayerMatchStats';

export class MessageBuilder {
  static buildMatchMessage(data: PlayerMatchStats) {
    const message = new RichEmbed();

    message.setColor(data.stats.winPlace === 1 ? [216, 173, 17] : [179, 39, 79]);
    message.setTitle(`Match Stats for ${data.name}`);
    message.setDescription(`Map: ${data.map} (${data.gameMode})`);

    message.addField('Rank', data.stats.winPlace, true);
    message.addField('Time Survived', data.timeSurvived, true);

    message.addField('Kills', data.killReport);
    message.addField('Killed By', data.deathReport);

    message.addField('Times Knocked Out', data.stats.DBNOs, true);
    message.addField('Assists', data.stats.assists, true);

    message.addField('Damage', data.damage, true);
    message.addField('Revives', data.stats.revives, true);
    message.addField('Heals/Boosts', `${data.stats.heals}/${data.stats.boosts}`, true);

    message.addField('Distance Travelled', data.distanceReport);

    return message;
  }
}
