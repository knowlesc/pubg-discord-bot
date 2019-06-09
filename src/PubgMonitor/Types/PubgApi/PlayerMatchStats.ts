import { DamageReason } from './Dictionaries/DamageReason';
import { DamageCauserName } from './Dictionaries/DamageCauserName';

export class PlayerMatchStats {

  constructor(
    public name: string,
    public map: string,
    public gameMode: string,
    public stats: { [key: string]: string | number },
    private kills: IPlayerKill[],
    private death: IPlayerKill) {
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

  get killReport() {
    if (this.kills && this.kills.length) return this.fullKillReport;

    const { kills, headshotKills, roadKills } = this.stats;

    const details: string[] = [];

    if (headshotKills) details.push(`${headshotKills} by headshot`);
    if (roadKills) details.push(`${roadKills} by vehicle`);

    return this.buildReport(kills as string, details);
  }

  get fullKillReport() {
    return this.kills
      .map((k) => this.formatKillEvent(k))
      .join('\n');
  }

  get distanceReport() {
    const { walkDistance, rideDistance, swimDistance } = this.stats;
    const total = Math.round(Number(walkDistance) + Number(rideDistance) + Number(swimDistance));

    const details = [];

    if (walkDistance) details.push(`${Math.round(Number(walkDistance))}m on foot`);
    if (rideDistance) details.push(`${Math.round(Number(rideDistance))}m by vehicle`);
    if (swimDistance) details.push(`${Math.round(Number(swimDistance))}m in water`);

    return this.buildReport(`${total}m`, details);
  }

  private formatKillEvent(kill: IPlayerKill, death?: boolean) {
    const killer = death ? kill.killer.name : kill.victim.name;
    const distance = kill.distance ? Math.round(kill.distance / 100) : 0;

    let reason = DamageReason[kill.damageReason];
    reason = reason ? ` - ${reason}` : '';

    let weapon = DamageCauserName[kill.damageCauserName] || 'Unknown';
    if (weapon === 'Bluezone') return weapon;
    weapon = weapon === 'Player' ? 'Down and Out' : weapon;

    return `${killer} from ${distance}m (${weapon}${reason})`;
  }

  private buildReport(baseMessage: string, details: string[]) {
    let message = baseMessage;
    const detailsString = details.join(', ');
    if (detailsString) message += ` (${detailsString})`;
    return message;
  }
}
