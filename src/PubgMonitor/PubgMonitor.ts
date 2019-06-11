import { performance } from 'perf_hooks';
import { PlayerMatchStats } from './Types/PubgApi/PlayerMatchStats';
import { TelemetryEvent } from './Types/PubgApi/Telemetry/EventTypeGuards';
import { PubgApiClient } from '../PubgApiClient/PubgApiClient';
import { Logger } from '../Common/Logger';
import { RequestError } from '../Common/RequestError';
import { MapName } from './Types/PubgApi/Dictionaries/MapName';

export class PubgMonitor {
  private static readonly backOffTimeSeconds = 60;
  private log: Logger;
  private pubgClient: PubgApiClient;
  private interval: NodeJS.Timeout;
  private lastMatches: IDictionary = {};
  private listeners: Array<(...args: any[]) => void> = [];

  constructor(
    private pubgToken: string,
    private playerNames: string[],
    private pollTimeMs: number) {
    this.log = new Logger('PubgMonitor');
    this.pubgClient = new PubgApiClient(this.pubgToken);
  }

  subscribe(listener: (playerMatchStats: PlayerMatchStats[]) => void) {
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

  private async poll() {
    try {
      const latestMatches = await this.getLatestMatches();
      const newPlayerMatches = this.getNewPlayerMatches(latestMatches);
      Object.entries(newPlayerMatches)
        .forEach(async ([matchId, players]) => this.handleNewMatch(matchId, players));
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

      this.log.debug(`Last match for player ${name} = ${lastMatchId}`);
      lastMatches[name] = lastMatchId;

      return lastMatches;
    }, {});
  }

  private getNewPlayerMatches(latestMatches: IDictionary) {
      return Object.entries(latestMatches)
        .reduce((newPlayerMatches, [player, matchId]) => {
          if (this.lastMatches[player] === matchId) {
            newPlayerMatches[matchId] = newPlayerMatches[matchId] || new Set();
            newPlayerMatches[matchId].add(player);
          }
          return newPlayerMatches;
        }, {} as { [k: string]: Set<string> });
  }

  private async handleNewMatch(matchId: string, players: Set<string>) {
      this.log.info(`New match found: ${matchId}`);

      try {
        const stats = await this.getPlayerMatchStats(matchId);
        this.listeners.forEach((fn) => fn(stats));
        players.forEach((player) => this.lastMatches[player] = matchId);
      } catch (e) {
        this.log.error(e);
      }
  }

  private async getPlayerMatchStats(id: string) {
      const match = await this.pubgClient.getMatch(id);
      const map = MapName[match.getValue<string>('data.attributes.mapName')];
      const gameMode = match.getValue<string>('data.attributes.gameMode');

      const included: any[] = match.getValue<any[]>('included', []);

      const participants = included.filter((item) => item.type !== 'participant');
      const asset = included.find((item) => item.type === 'asset');

      if (!participants.length || !asset) {
        throw new Error('Invalid match data');
      }

      const telemetryEvents = await this.pubgClient.getTelemetry(asset.attributes.URL);

      const startTime = performance.now();
      const killEvents = telemetryEvents.filter(TelemetryEvent.is.PlayerKill);
      const attackEvents = telemetryEvents.filter(TelemetryEvent.is.PlayerAttack);
      const end = telemetryEvents.find(TelemetryEvent.is.MatchEnd);
      const placements = end.characters
        .reduce((dict: IDictionary, c) => {
          dict[c.name] = c.ranking.toString();
          return dict;
        }, {});

      const allStats = participants
        .filter(({ attributes }) => this.playerNames.includes(attributes.stats.name))
        .map(({ attributes }) => {
          const stats = attributes.stats;
          const name = attributes.stats.name;
          const kills = killEvents.filter((e) => TelemetryEvent.isCausedBy(e, name));
          const killedBy = killEvents.find((e) => TelemetryEvent.happenedTo(e, name));
          const attacks = attackEvents.filter((e) => TelemetryEvent.isCausedBy(e, name));
          return new PlayerMatchStats(name, map, gameMode, stats, kills, killedBy, attacks, placements);
        });

      const telemetryProcessingTime = (performance.now() - startTime).toFixed(1);
      this.log.debug(`Processed telemetry in ${telemetryProcessingTime}ms`);

      return allStats;
  }
}
