import * as Discord from 'discord.js';
import { Logger } from '../Common/Logger';

export class DiscordBot implements IDiscordBot {
  private name: string;
  private log: Logger;
  private client: Discord.Client;
  private listeners: Array<(content: string) => void> = [];

  constructor(private token: string, debug = false) {
    if (!token) throw new Error('No token provided to bot');

    this.log = new Logger('DiscordBot');

    this.client = new Discord.Client();
    this.client.on('disconnect', () => this.log.info('Disconnected from Discord'));
    this.client.on('reconnecting', () => this.log.info('Reconnecting to Discord'));
    this.client.on('message', (message) => this.handleMessage(message));
    this.client.on('error', (error) => this.log.error(error, 'client'));

    if (debug) {
      this.client.on('debug', (message) => this.log.debug(message, 'client'));
    }
  }

  async connect() {
    return new Promise((resolve) => {
      this.log.info('Connecting to Discord');

      this.client.on('ready', () => {
        this.name = this.client.user.username;
        this.log.info(`Connected to Discord as ${this.name}.`);
        resolve();
      });

      return this.client.login(this.token)
        .catch((e) => this.log.error(e));
    });
  }

  postMessage(message: Discord.RichEmbed, channelName: string) {
    const channel = this.client.channels
      .find((c: Discord.TextChannel) => c.name === channelName);

    if (!channel) {
      this.log.error(`Channel not found: ${channelName}`);
      return;
    }

    if (channel.type !== 'text') {
      this.log.error(`Channel ${channelName} type is not text: ${channel.type}`);
      return;
    }

    this.log.info(`Posting message to channel ${channelName}`);
    (channel as Discord.TextChannel).send(message);
  }

  onMessage(fn: (content: string) => void) {
    this.listeners.push(fn);
  }

  private handleMessage({ content }: Discord.Message) {
    const commandRegex = new RegExp(`^!${this.name}(.*)`);
    const groups = commandRegex.exec(content);
    if (groups) this.listeners.forEach((fn) => fn(groups[1].trim()));
  }
}
