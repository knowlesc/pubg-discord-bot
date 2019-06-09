interface ICommon {
  isGame: number;
}

interface ICharacter {
  name: string;
  teamId: number;
  health: number;
  location: Location;
  ranking: number;
  accountId: string;
  isInBlueZone: number;
  isInRedZone: number;
  zone: string[];
}

interface IItem {
  itemId: string;
  stackCount: number;
  category: string;
  subCategory: string;
  attachedItems: string[];
}

interface IGameResult {
  rank: number;
  gameResult: string;
  teamId: number;
  stats: IStats;
  accountId: string;
}

interface IGameState {
  elapsedTime: number;
  numAliveTeams: number;
  numJoinPlayers: number;
  numStartPlayers: number;
  numAlivePlayers: number;
  safetyZonePosition: ILocation;
  safetyZoneRadius: number;
  poisonGasWarningPosition: ILocation;
  poisonGasWarningRadius: number;
  redZonePosition: ILocation;
  redZoneRadius: number;
}

interface IItemPackage {
  itemPackageId: string;
  location: ILocation;
  items: IItem[];
}

interface ILocation {
  x: number;
  y: number;
  z: number;
}

interface IStats {
  killCount: number;
  distanceOnFoot: number;
  distanceOnSwim: number;
  distanceOnVehicle: number;
  distanceOnParachute: number;
  distanceOnFreefall: number;
}

interface IVehicle {
  vehicleType: string;
  vehicleId: string;
  healthPercent: number;
  feulPercent: number;
}
