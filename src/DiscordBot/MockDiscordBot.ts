import { Logger } from '../Common/Logger';

export class MockDiscordBot implements IDiscordBot {
  log: Logger;

  constructor() {
    this.log = new Logger('MockDiscordBot');
  }

  connect() {
    this.log.info('Mock Discord Bot is "connected"');
    return Promise.resolve();
  }

  postMessage(message: any) {
    this.log.info(JSON.stringify(message, null, '  '));
  }

  onMessage(fn: (content: string) => void) {
    this.log.info('onMessage');
  }
}
