interface ITelemetryEvent {
  _D: string;
  _T: string;
  common: ICommon;
}

interface IAttack extends ITelemetryEvent {
  attacker: ICharacter;
}

interface IVictom extends ITelemetryEvent {
  victim: ICharacter;
}

interface IAction extends ITelemetryEvent {
  character: ICharacter;
}

interface IArmorDestroy extends ITelemetryEvent, IAttack, IVictom {
  attackId: number;
  damageTypeCategory: string;
  damageReason: string;
  damageCauserName: string;
  item: IItem;
  distance: number;
}

interface ICarePackageLand extends ITelemetryEvent {
  itemPackage: IItemPackage;
}

interface ICarePackageSpawn extends ITelemetryEvent {
  itemPackage: IItemPackage;
}

interface IGameStatePeriodic extends ITelemetryEvent {
  gameState: IGameState;
}

interface IHeal extends ITelemetryEvent, IAction {
  item: IItem;
  healAmount: number;
}

interface IItemAttach extends ITelemetryEvent, IAction {
  parentItem: IItem;
  childItem: IItem;
}

interface IItemDetach extends ITelemetryEvent, IAction {
  parentItem: IItem;
  childItem: IItem;
}

interface IItemDrop extends ITelemetryEvent, IAction {
  item: IItem;
}

interface IItemEquip extends ITelemetryEvent, IAction {
  item: IItem;
}

interface IItemPickup extends ITelemetryEvent, IAction {
  item: IItem;
}

interface IItemPickupFromCarepackage extends ITelemetryEvent, IAction {
  item: IItem;
}

interface IItemPickupFromLootbox extends ITelemetryEvent, IAction {
  item: IItem;
  ownerTeamId: number;
}

interface IItemUnequip extends ITelemetryEvent, IAction {
  item: IItem;
}

interface IItemUse extends ITelemetryEvent, IAction {
  item: IItem;
}

interface IMatchDefinition extends ITelemetryEvent {
  MatchId: string;
  PingQuality: string;
  SeasonState: string;
}

interface IMatchEnd extends ITelemetryEvent {
  characters: ICharacter[];
}

interface IMatchStart extends ITelemetryEvent {
  mapName: string;
  weatherId: string;
  characters: ICharacter[];
  cameraViewBehaviour: string;
  teamSize: number;
  isCustomGame: boolean;
  isEventMode: boolean;
  blueZoneCustomOptions: string;
}

interface IObjectDestroy extends ITelemetryEvent, IAction {
  objectType: string;
  objectLocation: ILocation;
}

interface IParachuteLanding extends ITelemetryEvent, IAction {
  distance: number;
}

interface IPlayerAttack extends ITelemetryEvent, IAttack {
  attackId: number;
  fireWeaponStackCount: number;
  attackType: string;
  weapon: IItem;
  vehicle: IVehicle;
}

interface IPlayerCreate extends ITelemetryEvent, IAction {
}

interface IPlayerKill extends ITelemetryEvent, IVictom {
  attackId: number;
  killer: ICharacter;
  assistant: ICharacter;
  dBNOId: number;
  damageTypeCategory: string;
  damageCauserName: string;
  damageCauserAdditionalInfo: [string];
  damageReason: string;
  distance: number;
  victimGameResult: IGameResult;
}

interface IPlayerLogin extends ITelemetryEvent {
  accountId: string;
}

interface IPlayerLogout extends ITelemetryEvent {
  accountId: string;
}

interface IPlayerMakeGroggy extends ITelemetryEvent, IAttack, IVictom {
  attackId: number;
  damageReason: string;
  damageTypeCategory: string;
  damageCauserName: string;
  damageCauserAdditionalInfo: [string];
  distance: number;
  isAttackerInVehicle: boolean;
  dBNOId: number;
}

interface IPlayerPosition extends ITelemetryEvent, IAction {
  vehicle: IVehicle;
  elapsedTime: number;
  numAlivePlayers: number;
}

interface IPlayerRevive extends ITelemetryEvent, IVictom {
  reviver: ICharacter;
  dBNOId: number;
}

interface IPlayerTakeDamage extends ITelemetryEvent, IAttack, IVictom {
  attackId: number;
  damageTypeCategory: string;
  damageReason: string;
  damage: number;
  damageCauserName: string;
}

interface IRedZoneEnded extends ITelemetryEvent {
  drivers: ICharacter[];
}

interface ISwimEnd extends ITelemetryEvent, IAction {
  swimDistance: number;
  maxSwimDepthOfWater: number;
}

interface ISwimStart extends ITelemetryEvent, IAction {
}

interface IVaultStart extends ITelemetryEvent, IAction {
}

interface IVehicleDestroy extends ITelemetryEvent, IAttack {
  atackId: number;
  vehicle: IVehicle;
  damageTypeCategory: string;
  damageCauserName: string;
  distance: number;
}

interface IVehicleLeave extends ITelemetryEvent, IAction {
  vehicle: IVehicle;
  rideDistance: number;
  seatIndex: number;
  maxSpeed: number;
}

interface IVehicleRide extends ITelemetryEvent, IAction {
  vehicle: IVehicle;
  seatIndex: number;
}

interface IWeaponFireCount extends ITelemetryEvent, IAction {
  weaponId: string;
  fireCount: number;
}

interface IWheelDestroy extends ITelemetryEvent, IAttack {
  attackId: number;
  vehicle: IVehicle;
  damageTypeCategory: string;
  damageCauserName: string;
}
