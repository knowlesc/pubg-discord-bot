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
    const killEvents: { [player: string]: IPlayerKill[] } = {};
    const deathEvents: { [player: string]: IPlayerKill } = {};
    const attackEvents: { [player: string]: IPlayerAttack[] } = {};
    const movements: { [player: string]: IPlayerPosition[] } = {};
    const planeLeaves: { [player: string]: IVehicleLeave } = {};
    const landings: { [player: string]: IParachuteLanding } = {};
    let placements: IDictionary;

    const includedParticipants = participants
      .filter((p) => playerNames.includes(p.attributes.stats.name));

    includedParticipants.forEach((p) => {
      killEvents[p.attributes.stats.name] = [];
      attackEvents[p.attributes.stats.name] = [];
      movements[p.attributes.stats.name] = [];
    });

    telemetryEvents.forEach((event: ITelemetryEvent) => {
      if (event._T === 'LogPlayerPosition'
        && movements[(event as IPlayerPosition).character.name]) {
        movements[(event as IPlayerPosition).character.name]
          .push(event as IPlayerPosition);
      } else if (event._T === 'LogPlayerAttack'
        && attackEvents[(event as IPlayerAttack).attacker.name]) {
        attackEvents[(event as IPlayerAttack).attacker.name]
          .push(event as IPlayerAttack);
      } else if (event._T === 'LogPlayerKill') {
        if (killEvents[(event as IPlayerKill).killer.name]) {
          killEvents[(event as IPlayerKill).killer.name]
            .push(event as IPlayerKill);
        }
        if (killEvents[(event as IPlayerKill).victim.name]) {
          deathEvents[(event as IPlayerKill).victim.name] = event as IPlayerKill;
        }
      } else if (event._T === 'LogMatchEnd') {
        placements = (event as IMatchEnd).characters
          .reduce((dict: IDictionary, c: any) => {
            dict[c.name] = c.ranking.toString();
            return dict;
          }, {});
      } else if (event._T === 'LogParachuteLanding') {
        landings[(event as IParachuteLanding).character.name] = event as IParachuteLanding;
      } else if (event._T === 'LogVehicleLeave'
        && (event as IVehicleLeave).vehicle.vehicleType === 'TransportAircraft') {
        planeLeaves[(event as IVehicleLeave).character.name] = event as IVehicleLeave;
      }
    });

    const allStats = includedParticipants.map(({ attributes }) => {
      const name = attributes.stats.name;
      return new PlayerMatchStats(
        name,
        map,
        gameMode,
        attributes.stats,
        killEvents[name],
        deathEvents[name],
        attackEvents[name],
        placements,
        movements[name],
        landings[name],
        planeLeaves[name]);
    });

    const telemetryProcessingTime = (performance.now() - startTime).toFixed(1);
    this.log.info(`Processed telemetry in ${telemetryProcessingTime}ms`);

    return allStats;
  }
}
