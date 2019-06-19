import { PlayerMatchStats } from './PlayerMatchStats';

export class MatchStats {
  constructor(
    readonly map: string,
    readonly gameMode: string,
    readonly placements: IDictionary<number>,
    readonly positions: IDictionary<IPlayerPosition[]>,
    readonly landings: IDictionary<IParachuteLanding>,
    readonly planeLeaves: IDictionary<IVehicleLeave>,
    readonly blueZones: IDictionary<{ position: ILocation, radius: number }>,
    readonly players: PlayerMatchStats[]) {
  }
}
