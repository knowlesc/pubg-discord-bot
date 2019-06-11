import { DamageReason } from './Dictionaries/DamageReason';
import { DamageCauserName } from './Dictionaries/DamageCauserName';

export class PlayerMatchStats {

  constructor(
    public name: string,
    public map: string,
    public gameMode: string,
    public stats: { [key: string]: string | number },
    private kills: IPlayerKill[],
    private death: IPlayerKill,
    private shotsFired: IPlayerAttack[],
    private placements: IDictionary) {
  }

  get damage() {
    return Math.round(Number(this.stats.damageDealt));
  }

  get timeSurvived() {
    const seconds = Number(this.stats.timeSurvived);
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.round(seconds - (minutes * 60));

    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  get deathReport() {
    if (this.stats.deathType === 'byplayer') {
      return this.death ? this.formatKillEvent(this.death, true) : 'Unknown';
    } else if (this.stats.deathType === 'suicide') {
      return 'Suicide';
    } else if (this.stats.deathType === 'logout') {
      return 'Disconnected';
    } else if (this.stats.deathType === 'alive') {
      return 'Nobody';
    }
  }

  get shotsFiredCount() {
    const bullets = this.shotsFired.filter((e) => e.weapon.category === 'Weapon');
    return bullets.length;
  }

  get killReport() {
    return this.kills.length ?
      this.kills
        .map((k) => this.formatKillEvent(k))
        .join('\n') :
      'None';
  }

  get distanceReport() {
    const { walkDistance, rideDistance, swimDistance } = this.stats;
    const total = Math.round(Number(walkDistance) + Number(rideDistance) + Number(swimDistance));

    const details = [];

    if (walkDistance) details.push(`${Math.round(Number(walkDistance))}m :walking:`);
    if (rideDistance) details.push(`${Math.round(Number(rideDistance))}m :red_car:`);
    if (swimDistance) details.push(`${Math.round(Number(swimDistance))}m :swimmer:`);

    if (details.length === 1) return details[0];

    return `${total}m (${details.join(',')})`;
  }

  private formatKillEvent(kill: IPlayerKill, death?: boolean) {
    const killer = death ? kill.killer.name : kill.victim.name;
    const distance = kill.distance ? Math.round(kill.distance / 100) : 0;
    const placement = this.placements[killer] || '?';

    let reason = DamageReason[kill.damageReason];
    reason = reason ? ` - ${reason}` : '';

    let weapon = DamageCauserName[kill.damageCauserName] || 'Unknown';
    if (weapon === 'Bluezone') return weapon;
    weapon = weapon === 'Player' ? 'Down and Out' : weapon;

    return `**${killer}** (#${placement}) from ${distance}m *(${weapon}${reason})*`;
  }
}
