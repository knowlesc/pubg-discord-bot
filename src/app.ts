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

  await imageBuilder.loadBaseImages();

  pubgMonitor.subscribe(async (stats) => {
    try {
      log.info(`Building message for ${stats.map}/${stats.gameMode}`);

      stats.players.forEach((p) => {
        const message = MessageBuilder.buildPlayerMessage(p);
        discordBot.postMessage(message, discordChannel);
      });

      const image = await imageBuilder.draw(stats);
      if (image) {
        const matchMessage = MessageBuilder.buildMatchMessage(
          stats.players[0].placement, stats.map, stats.gameMode, image);
        discordBot.postMessage(matchMessage, discordChannel);
      }
    } catch (e) {
      log.error(`Unable to create and post message.`);
      log.error(e);
    }
  });

  discordBot.onMessage(async (content, channelId) => {
    const splitContent = content.split(' ');
    if (splitContent.length === 2
      && splitContent[0].toLowerCase() === 'lastmatch') {
      const player = splitContent[1];
      const lastMatchId = pubgMonitor.getLastMatchId(player);
      if (!lastMatchId) {
        discordBot.postMessage(`Last match for ${player} is not available.`, channelId);
        return;
      }

      try {
        discordBot.postMessage(`Generating last match info for ${player}, one minute.`, channelId);
        const stats = await pubgDataReader.getPlayerMatchStats(lastMatchId, player);

        stats.players.forEach((p) => {
          const message = MessageBuilder.buildPlayerMessage(p);
          discordBot.postMessage(message, channelId);
        });

        const image = await imageBuilder.draw(stats);
        if (image) {
          const matchMessage = MessageBuilder.buildMatchMessage(
            stats.players[0].placement, stats.map, stats.gameMode, image);
          discordBot.postMessage(matchMessage, channelId);
        }
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
