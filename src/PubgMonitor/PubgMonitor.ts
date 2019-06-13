import { PubgDataReader } from './../PubgDataReader/PubgDataReader';
import { PlayerMatchStats } from './Types/PubgApi/PlayerMatchStats';
import { PubgApiClient } from '../PubgApiClient/PubgApiClient';
import { Logger } from '../Common/Logger';
import { RequestError } from '../Common/RequestError';

export class PubgMonitor {
  private static readonly backOffTimeSeconds = 60;
  private log: Logger;
  private interval: NodeJS.Timeout;
  private lastMatches: IDictionary = {};
  private listeners: Array<(stats: PlayerMatchStats[]) => void> = [];

  constructor(
    private pubgClient: PubgApiClient,
    private pubgDataReader: PubgDataReader,
    private playerNames: string[],
    private pollTimeMs: number) {
    this.log = new Logger('PubgMonitor');
  }

  subscribe(listener: (stats: PlayerMatchStats[]) => void) {
    this.listeners.push(listener);
  }

  async init() {
    this.log.info('Initializing monitor');

    try {
      this.lastMatches = await this.getLatestMatches();
      return true;
    } catch (e) {
      this.log.error(e);
      return false;
    }
  }

  async start() {
    this.log.info('Starting polling');
    this.interval = setInterval(() => this.poll(), this.pollTimeMs);
  }

  stop() {
    this.log.info('Stopping polling');
    clearInterval(this.interval);
  }

  getLastMatchId(playerName: string) {
    return this.lastMatches[playerName];
  }

  private async poll() {
    try {
      const latestMatches = await this.getLatestMatches();
      const newPlayerMatches = this.getNewPlayerMatches(latestMatches);
      Object.entries(newPlayerMatches)
        .forEach(async ([matchId, players]) => this.handleNewMatch(matchId, Array.from(players)));
    } catch (e) {
      if (e instanceof RequestError && e.status === 429) {
        this.log.info(`Rate limit detected, backing off for ${PubgMonitor.backOffTimeSeconds} seconds`);
        this.stop();
        setTimeout(() => this.start(), PubgMonitor.backOffTimeSeconds * 1000);
      } else {
        this.log.error(e);
      }
    }
  }

  private async getLatestMatches() {
    const players = await this.pubgClient.getPlayers(this.playerNames);

    return players.reduce((lastMatches: IDictionary, data) => {
      const name = data.getValue<string>('attributes.name');
      const lastMatchId = data.getValue<string>('relationships.matches.data[0].id');
      lastMatches[name] = lastMatchId;
      return lastMatches;
    }, {});
  }

  private getNewPlayerMatches(latestMatches: IDictionary) {
      return Object.entries(latestMatches)
        .reduce((newPlayerMatches, [player, matchId]) => {
          if (this.lastMatches[player] !== matchId) {
            newPlayerMatches[matchId] = newPlayerMatches[matchId] || new Set();
            newPlayerMatches[matchId].add(player);
          }
          return newPlayerMatches;
        }, {} as { [k: string]: Set<string> });
  }

  private async handleNewMatch(matchId: string, players: string[]) {
      this.log.info(`New match found for players: ${players.join(',')}`);

      try {
        const stats = await this.pubgDataReader.getPlayerMatchStats(matchId, ...players);
        this.listeners.forEach((fn) => fn(stats));
        players.forEach((player) => this.lastMatches[player] = matchId);
      } catch (e) {
        this.log.error(e);
      }
  }
}
