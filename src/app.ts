import * as dotenv from 'dotenv';
import { Logger } from './Common/Logger';
import { MockDiscordBot } from './DiscordBot/MockDiscordBot';
import { DiscordBot as DiscordBot } from './DiscordBot/DiscordBot';
import { MessageBuilder } from './Common/MessageBuilder';
import { PubgMonitor } from './PubgMonitor/PubgMonitor';
import { ImageBuilder } from './ImageBuilder/ImageBuilder';

(async () => {
  dotenv.config();

  const requiredEnvironmentVariables = ['DISCORDTOKEN', 'DISCORDCHANNEL', 'PUBGTOKEN', 'PLAYERS'];
  requiredEnvironmentVariables.forEach((v) => {
    if (!process.env[v]) throw new Error(`Missing environment variable: ${v}`);
  });

  const test = process.env.TEST === 'true';
  const discordToken = process.env.DISCORDTOKEN;
  const discordChannel = process.env.DISCORDCHANNEL;
  const discordDebug = process.env.DISCORDDEBUG === 'true';
  const pubgToken = process.env.PUBGTOKEN;
  const playerNames = process.env.PLAYERS.split(',');
  const pollTimeMs = (Number(process.env.POLLTIMESECONDS) || 60) * 1000;

  const log = new Logger('app');
  log.info('Starting application.');

  const discordBot =  test ?
    new MockDiscordBot() :
    new DiscordBot(discordToken, discordDebug);

  await discordBot.connect();

  const pubgMonitor = new PubgMonitor(pubgToken, playerNames, pollTimeMs);
  const imageBuilder = new ImageBuilder();

  pubgMonitor.subscribe((stats) => {
    stats.forEach(async (s) => {
      try {
        const message = MessageBuilder.buildMatchMessage(s);
        const image = await imageBuilder.draw(s);
        if (image) {
          message
            .attachFile({ name: 'image.png', attachment: image })
            .setImage('attachment://image.png');
        }

        discordBot.postMessage(message, discordChannel);
      } catch (e) {
        log.error(`Unable to create and post message for ${s ? s.name : 'Unknown player'}.`);
        log.error(e);
      }
    });
  });

  const success = await pubgMonitor.init();
  if (success) {
    pubgMonitor.start();
  } else {
    process.exit(1);
  }
})();
