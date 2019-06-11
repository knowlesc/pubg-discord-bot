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

  postMessage(message: RichEmbed) {
    this.log.info(`${message.title} ${JSON.stringify(message.image)}`);
  }

  onMessage(fn: (content: string) => void) {
    this.log.info('onMessage');
  }
}
