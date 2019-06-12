import { Client, RichEmbed, TextChannel, Message } from 'discord.js';
import { Logger } from '../Common/Logger';

export class DiscordBot implements IDiscordBot {
  private name: string;
  private log: Logger;
  private client: Client;
  private listeners: Array<(content: string, channelId: string) => void> = [];

  constructor(private token: string, debug = false) {
    if (!token) throw new Error('No token provided to bot');

    this.log = new Logger('DiscordBot');

    this.client = new Client();
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

  postMessage(message: string | RichEmbed, channelId: string) {
    const channel = this.client.channels.get(channelId);

    if (!channel) {
      this.log.error(`Channel not found: ${channelId}`);
      return;
    }

    if (channel.type !== 'text') {
      this.log.error(`Channel ${channelId} type is not text: ${channel.type}`);
      return;
    }

    this.log.info(`Posting message to channel ${channelId}`);
    (channel as TextChannel).send(message);
  }

  onMessage(fn: (content: string, channelId: string) => void) {
    this.listeners.push(fn);
  }

  private handleMessage({ content, channel }: Message) {
    const commandRegex = new RegExp(`^!${this.name}(.*)`);
    const groups = commandRegex.exec(content);
    if (groups) this.listeners.forEach((fn) => fn(groups[1].trim(), channel.id));
  }
}
