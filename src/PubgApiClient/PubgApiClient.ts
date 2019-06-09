import { PubgApiData } from './PubgApiData';
import { BaseApiClient } from '../Common/BaseApiClient';
import { Logger } from '../Common/Logger';

export class PubgApiClient extends BaseApiClient {
  log: Logger;

  constructor(
    private token: string) {
    super();
    this.log = new Logger('PubgClient');
  }

  async getPlayers(playerNames: string[]) {
    if (!playerNames || !playerNames.length) return null;

    const url = `https://api.pubg.com/shards/steam/players`;

    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.api+json'
    };

    const params = {
      'filter[playerNames]': playerNames.join(',')
    };

    this.log.info(`Requesting player info from ${url} for players ${playerNames.join(', ')}`);
    const data = await this.get<any>(url, params, headers);

    const playerData = data.data as any[];
    return playerData.map((d) => new PubgApiData(d));
  }

  async getMatch(matchId: string) {
    if (!matchId) return null;

    const url = `https://api.pubg.com/shards/steam/matches/${matchId}`;

    this.log.info(`Requesting match info from ${url}`);
    const data = await this.get<any>(url);

    return new PubgApiData(data);
  }

  async getTelemetry(url: string) {
    if (!url) return null;

    this.log.info(`Requesting telemetry info from ${url}`);
    return await this.get<ITelemetryEvent[]>(url);
  }
}
