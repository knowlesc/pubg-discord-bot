import { RichEmbed } from 'discord.js';
import { PlayerMatchStats } from '../PubgMonitor/Types/PubgApi/PlayerMatchStats';

export class MessageBuilder {
  static buildMatchMessage(data: PlayerMatchStats) {
    const message = new RichEmbed();
    const { map, gameMode, name, shotsCount, damage, killReport, deathReport, distanceReport, timeSurvived } = data;
    const { winPlace, heals, boosts, revives, DBNOs, assists } = data.stats;

    const win = winPlace === 1;
    const emoji = win ? ':trophy:' : ':skull_crossbones:';

    message.setColor(win ? [216, 173, 17] : [179, 39, 79]);
    message.setTitle(`${emoji} Match Stats for ${name}`);
    message.setDescription(`Placed #${winPlace} on ${map} (${gameMode})`);

    if (!win) {
      message.addField('Time Survived', timeSurvived, true);
    }

    message.addField('Distance Travelled', distanceReport, true);

    if (deathReport) {
      message.addField('Killed By', deathReport, true);
    }

    if (killReport) {
      message.addField('Kills', killReport);
    }

    if (damage) {
      message.addField('Damage', this.codeBlock(damage), true);
    }

    if (assists) {
      message.addField('Assists', this.codeBlock(assists), true);
    }

    if (shotsCount) {
      message.addField('Shots Fired', this.codeBlock(shotsCount), true);
    }

    if (DBNOs) {
      message.addField('Times Knocked Out', this.codeBlock(DBNOs), true);
    }

    if (revives) {
      message.addField('Revives', this.codeBlock(revives), true);
    }

    if (heals || boosts) {
      message.addField('Heals/Boosts', this.codeBlock(`${heals}/${boosts}`), true);
    }

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
