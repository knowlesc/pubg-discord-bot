import { performance } from 'perf_hooks';
import { Logger } from '../Common/Logger';
import { PubgApiClient } from '../PubgApiClient/PubgApiClient';
import { MapName } from '../PubgMonitor/Types/PubgApi/Dictionaries/MapName';
import { TelemetryEvent } from '../PubgMonitor/Types/PubgApi/Telemetry/EventTypeGuards';
import { PlayerMatchStats } from '../PubgMonitor/Types/PubgApi/PlayerMatchStats';

export class PubgDataReader {
  private log: Logger;

  constructor(
    private pubgClient: PubgApiClient) {
    this.log = new Logger('PubgDataReader');
  }

  async getPlayerMatchStats(id: string, ...playerNames: string[]) {
    const match = await this.pubgClient.getMatch(id);
    const map = MapName[match.getValue<string>('data.attributes.mapName')];
    const gameMode = match.getValue<string>('data.attributes.gameMode');

    const included: any[] = match.getValue<any[]>('included', []);

    const participants = included.filter((item) => item.type === 'participant');
    const asset = included.find((item) => item.type === 'asset');

    if (!participants.length || !asset) {
      throw new Error('Invalid match data');
    }

    const telemetryEvents = await this.pubgClient.getTelemetry(asset.attributes.URL);
    this.log.debug(`Found ${telemetryEvents.length} telemetry events.`);

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
      .filter(({ attributes }) => playerNames.includes(attributes.stats.name))
      .map(({ attributes }) => {
        const stats = attributes.stats;
        const name = attributes.stats.name;
        const kills = killEvents.filter((e) => TelemetryEvent.isCausedBy(e, name));
        const killedBy = killEvents.find((e) => TelemetryEvent.happenedTo(e, name));
        const attacks = attackEvents.filter((e) => TelemetryEvent.isCausedBy(e, name));
        const movements = telemetryEvents
          .filter((e) => TelemetryEvent.is.PlayerPosition(e)
            && TelemetryEvent.isCausedBy(e, name)
            && e.common.isGame >= 1)
          .map((e: IPlayerPosition) => e.character.location);

        return new PlayerMatchStats(name, map, gameMode, stats, kills, killedBy, attacks, placements, movements)
      });

    const telemetryProcessingTime = (performance.now() - startTime).toFixed(1);
    this.log.info(`Processed telemetry in ${telemetryProcessingTime}ms`);

    return allStats;
  }
}
