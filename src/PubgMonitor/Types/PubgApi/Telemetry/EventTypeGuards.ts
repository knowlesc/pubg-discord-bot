const is = {
  Action: (e: ITelemetryEvent): e is IAction => !!(e as IAction).character,
  Attack: (e: ITelemetryEvent): e is IAttack => !!(e as IAttack).attacker,
  Victom: (e: ITelemetryEvent): e is IVictom => !!(e as IVictom).victim,

  ArmorDestroy: (e: ITelemetryEvent): e is IArmorDestroy => e._T === 'LogArmorDestroy',
  CarePackageLand: (e: ITelemetryEvent): e is ICarePackageLand => e._T === 'LogCarePackageLand',
  CarePackageSpawn: (e: ITelemetryEvent): e is ICarePackageSpawn => e._T === 'LogCarePackageSpawn',
  GameStatePeriodic: (e: ITelemetryEvent): e is IGameStatePeriodic => e._T === 'LogGameStatePeriodic',
  Heal: (e: ITelemetryEvent): e is IHeal => e._T === 'LogHeal',
  ItemAttach: (e: ITelemetryEvent): e is IItemAttach => e._T === 'LogItemAttach',
  ItemDetach: (e: ITelemetryEvent): e is IItemDetach => e._T === 'LogItemDetach',
  ItemDrop: (e: ITelemetryEvent): e is IItemDrop => e._T === 'LogItemDrop',
  ItemEquip: (e: ITelemetryEvent): e is IItemEquip => e._T === 'LogItemEquip',
  ItemPickup: (e: ITelemetryEvent): e is IItemPickup => e._T === 'LogItemPickup',
  ItemPickupFromCarepackage: (e: ITelemetryEvent): e is IItemPickupFromCarepackage => e._T === 'LogItemPickupFromCarepackage',
  ItemPickupFromLootbox: (e: ITelemetryEvent): e is IItemPickupFromLootbox => e._T === 'LogItemPickupFromLootbox',
  ItemUnequip: (e: ITelemetryEvent): e is IItemUnequip => e._T === 'LogItemUnequip',
  ItemUse: (e: ITelemetryEvent): e is IItemUse => e._T === 'LogItemUse',
  MatchDefinition: (e: ITelemetryEvent): e is IMatchDefinition => e._T === 'LogMatchDefinition',
  MatchEnd: (e: ITelemetryEvent): e is IMatchEnd => e._T === 'LogMatchEnd',
  MatchStart: (e: ITelemetryEvent): e is IMatchStart => e._T === 'LogMatchStart',
  ObjectDestroy: (e: ITelemetryEvent): e is IObjectDestroy => e._T === 'LogObjectDestroy',
  ParachuteLanding: (e: ITelemetryEvent): e is IParachuteLanding => e._T === 'LogParachuteLanding',
  PlayerAttack: (e: ITelemetryEvent): e is IPlayerAttack => e._T === 'LogPlayerAttack',
  PlayerCreate: (e: ITelemetryEvent): e is IPlayerCreate => e._T === 'LogPlayerCreate',
  PlayerKill: (e: ITelemetryEvent): e is IPlayerKill => e._T === 'LogPlayerKill',
  PlayerLogin: (e: ITelemetryEvent): e is IPlayerLogin => e._T === 'LogPlayerLogin',
  PlayerLogout: (e: ITelemetryEvent): e is IPlayerLogout => e._T === 'LogPlayerLogout',
  PlayerMakeGroggy: (e: ITelemetryEvent): e is IPlayerMakeGroggy => e._T === 'LogPlayerMakeGroggy',
  PlayerPosition: (e: ITelemetryEvent): e is IPlayerPosition => e._T === 'LogPlayerPosition',
  PlayerRevive: (e: ITelemetryEvent): e is IPlayerRevive => e._T === 'LogPlayerRevive',
  PlayerTakeDamage: (e: ITelemetryEvent): e is IPlayerTakeDamage => e._T === 'LogPlayerTakeDamage',
  RedZoneEnded: (e: ITelemetryEvent): e is IRedZoneEnded => e._T === 'LogRedZoneEnded',
  SwimEnd: (e: ITelemetryEvent): e is ISwimEnd => e._T === 'LogSwimEnd',
  SwimStart: (e: ITelemetryEvent): e is ISwimStart => e._T === 'LogSwimStart',
  VaultStart: (e: ITelemetryEvent): e is IVaultStart => e._T === 'LogVaultStart',
  VehicleDestroy: (e: ITelemetryEvent): e is IVehicleDestroy => e._T === 'LogVehicleDestroy',
  VehicleLeave: (e: ITelemetryEvent): e is IVehicleLeave => e._T === 'LogVehicleLeave',
  VehicleRide: (e: ITelemetryEvent): e is IVehicleRide => e._T === 'LogVehicleRide',
  WeaponFireCount: (e: ITelemetryEvent): e is IWeaponFireCount => e._T === 'LogWeaponFireCount',
  WheelDestroy: (e: ITelemetryEvent): e is IWheelDestroy => e._T === 'LogWheelDestroy'
};

export const TelemetryEvent = {
  is,
  isCausedBy(e: ITelemetryEvent, player: string) {
    return (TelemetryEvent.is.Action(e) && e.character.name === player)
      || (TelemetryEvent.is.Attack(e) && e.attacker.name === player)
      || (TelemetryEvent.is.PlayerKill(e) && e.killer.name === player);
  },
  happenedTo(e: ITelemetryEvent, player: string) {
    return (TelemetryEvent.is.Victom(e) && e.victim.name === player);
  }
};
