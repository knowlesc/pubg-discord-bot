import { Logger } from '../Common/Logger';
import { RichEmbed } from 'discord.js';

export class MockDiscordBot implements IDiscordBot {
  log: Logger;

  constructor() {
    this.log = new Logger('MockDiscordBot');
  }

  connect() {
    this.log.info('Mock Discord Bot is "connected"');
    return Promise.resolve();
  }

  postMessage(message: string | RichEmbed, channelId: string) {
    if (typeof message === 'string') {
      this.log.info(`${message}`);
    } else {
      this.log.info(`${message.title} ${JSON.stringify(message.image)}`);
    }
  }

  onMessage(fn: (content: string, channel: any) => void) {
    this.log.info('onMessage');
  }
}
