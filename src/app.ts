import * as dotenv from 'dotenv';
import { Logger } from './Common/Logger';
import { PubgDataReader } from './PubgDataReader/PubgDataReader';
import { PubgApiClient } from './PubgApiClient/PubgApiClient';
import { PubgMonitor } from './PubgMonitor/PubgMonitor';
import { DiscordBot } from './DiscordBot/DiscordBot';
import { MockDiscordBot } from './DiscordBot/MockDiscordBot';
import { MessageBuilder } from './Common/MessageBuilder';
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

  const pubgApiClient = new PubgApiClient(pubgToken);
  const pubgDataReader = new PubgDataReader(pubgApiClient);
  const pubgMonitor = new PubgMonitor(pubgApiClient, pubgDataReader, playerNames, pollTimeMs);
  const imageBuilder = new ImageBuilder();

  pubgMonitor.subscribe((stats) => {
    stats.forEach(async (s) => {
      try {
        const message = MessageBuilder.buildMatchMessage(s);
        const image = await imageBuilder.draw(s);
        if (image) MessageBuilder.attachImage(message, image);
        discordBot.postMessage(message, discordChannel);
      } catch (e) {
        log.error(`Unable to create and post message for ${s ? s.name : 'Unknown player'}.`);
        log.error(e);
      }
    });
  });

  discordBot.onMessage(async (content, channelId) => {
    const splitContent = content.split(' ');
    if (splitContent.length === 2
      && splitContent[0] === 'lastMatch') {
      const player = splitContent[1];
      const lastMatchId = pubgMonitor.getLastMatchId(player);
      if (!lastMatchId) {
        discordBot.postMessage(`Last match for ${player} is not available.`, channelId);
        return;
      }

      try {
        discordBot.postMessage(`Generating last match info for ${player}, one minute.`, channelId);
        const stats = await pubgDataReader.getPlayerMatchStats(lastMatchId, player);
        const message = MessageBuilder.buildMatchMessage(stats[0]);
        const image = await imageBuilder.draw(stats[0]);
        if (image) MessageBuilder.attachImage(message, image);
        discordBot.postMessage(message, channelId);
      } catch (e) {
        log.error(`Unable to create and post message for ${player}.`);
        log.error(e);
      }
    }
  });

  const success = await pubgMonitor.init();
  if (success) {
    pubgMonitor.start();
  } else {
    process.exit(1);
  }
})();
