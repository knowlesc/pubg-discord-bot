interface IDiscordBot {
  connect(): Promise<any>;
  postMessage(message: any, channelName: string): void;
  onMessage(fn: (content: string) => void): void;
}
