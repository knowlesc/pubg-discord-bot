import { RichEmbed } from 'discord.js';
import { PlayerMatchStats } from '../PubgMonitor/Types/PubgApi/PlayerMatchStats';

export class MessageBuilder {
  static buildMatchMessage(data: PlayerMatchStats) {
    const message = new RichEmbed();

    const win = data.stats.winPlace === 1;
    const emoji = win ? ':trophy:' : ':skull_crossbones:';

    message.setColor(win ? [216, 173, 17] : [179, 39, 79]);
    message.setTitle(`${emoji} Match Stats for ${data.name}`);
    message.setDescription(`Map: ${data.map} (${data.gameMode})`);

    message.addField('Rank', data.stats.winPlace, true);
    message.addField('Time Survived', data.timeSurvived, true);
    message.addField('Distance Travelled', data.distanceReport, true);

    message.addField('Kills', data.killReport);
    message.addField('Killed By', data.deathReport);

    message.addField('Damage', this.codeBlock(data.damage), true);
    message.addField('Assists', this.codeBlock(data.stats.assists), true);
    message.addField('Shots Fired', this.codeBlock(data.shotsFiredCount), true);

    message.addField('Times Knocked Out', this.codeBlock(data.stats.DBNOs), true);
    message.addField('Revives', this.codeBlock(data.stats.revives), true);
    message.addField('Heals/Boosts', this.codeBlock(`${data.stats.heals}/${data.stats.boosts}`), true);

    return message;
  }

  static attachImage(message: RichEmbed, imageBuffer: Buffer) {
    return message
      .attachFile({ name: 'image.png', attachment: imageBuffer })
      .setImage('attachment://image.png');
  }

  private static codeBlock(message: string | number) {
    return `\`${message}\``;
  }
}
