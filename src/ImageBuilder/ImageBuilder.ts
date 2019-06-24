import { MatchStats } from './../PubgMonitor/Types/PubgApi/MatchStats';
import { DamageCauserName } from './../PubgMonitor/Types/PubgApi/Dictionaries/DamageCauserName';
import { MapLoader } from './MapLoader';
import { performance } from 'perf_hooks';
import { Logger } from './../Common/Logger';
import { PlayerMatchStats } from './../PubgMonitor/Types/PubgApi/PlayerMatchStats';
import { createCanvas, CanvasRenderingContext2D, Image } from 'canvas';
import { PubgMapImage } from './PubgMapImage';
import { IconLoader } from './IconLoader';

interface ILocationAndStuff extends ILocation {
  state?: number;
  vehicleType?: string;
}

interface ILineStyle {
  dash?: number;
  color: string;
  width: number;
}

export class ImageBuilder {
  private log: Logger;
  private icons: IconLoader;
  private maps: MapLoader;
  private readonly lineStyles: {[k: string]: ILineStyle } = {
    plane: {
      color: 'rgba(255, 255, 255, 0.7)',
      width: 4,
      dash: 6
    },
    parachute: {
      color: 'rgba(0, 255, 255, 0.9)',
      width: 2,
      dash: 3
    },
    player: {
      color: 'rgba(255, 0, 0, 1)',
      width: 1.5
    }
  };

  constructor() {
    this.icons = new IconLoader();
    this.maps = new MapLoader();
    this.log = new Logger('ImageBuilder');
  }

  async loadBaseImages() {
    this.log.info('Loading base images');
    const startTime = performance.now();
    await this.icons.load();
    await this.maps.load();
    const elapsedTime = (performance.now() - startTime).toFixed(1);
    this.log.info(`Loaded base images in ${elapsedTime}ms`)
  }

  async draw(matchStats: MatchStats) {
    const startTime = performance.now();
    const mapName = matchStats.map;

    let map: PubgMapImage;

    try {
      map = new PubgMapImage(mapName, this.maps);
    } catch (e) {
      this.log.error(e);
      return null;
    }

    const canvas = createCanvas(map.width, map.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(map.image, 0, 0);

    // Bluezones
    Object.entries(matchStats.blueZones).forEach(([phase, bluezone]) => {
      const location = this.convertCoord(map, bluezone.position);
      const radius = Math.round(bluezone.radius * map.pixelRatio);
      const div = 3; // Higher means initial blue is darker
      const exp = 1.5; // Higher means subsequent blues are lighter
      const inverse = (1 / Number(phase));
      const opacity = Math.pow(inverse, exp) / div;
      this.drawCircleInverse(ctx, location, opacity, 'rgba(255, 255, 255, 0.7)', 1.5, radius);
    });

    // Player landings
    Object.values(matchStats.landings)
      .forEach((landing) => {
        const landingCoord = this.convertCoord(map, landing.character.location);
        this.drawCircle(ctx, landingCoord, '#efeb0b', '#000000', 1.5, 2.5);
      });

    // Player paths
    matchStats.players.forEach((playerStats, i) => {
      this.drawPlayerInfo(ctx, map, matchStats, playerStats, i === 1);
    });

    const imageProcessingTime = (performance.now() - startTime).toFixed(1);
    this.log.info(`Drew image in ${imageProcessingTime}ms`);

    return canvas.toBuffer();
  }

  private drawPlayerInfo(
    ctx: CanvasRenderingContext2D, map: PubgMapImage, matchStats: MatchStats,
    playerStats: PlayerMatchStats, drawPlanePath = false) {
    const playerName = playerStats.name;
    const positions = matchStats.positions[playerName];
    if (!positions) {
      this.log.error(`Unable to find movement data for ${playerName}`);
      return;
    }

    const kills = playerStats.kills;
    const death = playerStats.death;
    const jump = matchStats.planeLeaves[playerName];
    const landing = matchStats.landings[playerName];

    const coordinates: ILocationAndStuff[] = this.convertCoords(map, positions
      .filter((p) => p.common.isGame > 0)
      .map((p) => ({
        state: p.common.isGame,
        vehicleType: p.vehicle && p.vehicle.vehicleType,
        ...p.character.location
      })));

    if (drawPlanePath) {
      const planeCoordinates = coordinates.filter((c) => c.vehicleType === 'TransportAircraft');
      this.drawPlanePath(ctx, planeCoordinates, map.width, map.height);
    }

    const parachuteCoordinates = coordinates.filter((c) => c.vehicleType !== 'TransportAircraft' && c.state < 1);
    const playerCoordinates = coordinates.filter((c) => c.vehicleType !== 'TransportAircraft' && c.state >= 1);

    // Parachute path
    if (jump && playerCoordinates[0]) {
      this.drawParachutePath(ctx, [
        this.convertCoord(map, jump.character.location),
        ...parachuteCoordinates,
        playerCoordinates[0]
      ]);
    }

    // Player path
    this.drawPlayerPath(ctx, playerCoordinates);

    // Landing location
    const playerLandingCoord = this.convertCoord(map, landing.character.location);
    this.drawCircle(ctx, playerLandingCoord, '#5effe9', '#000000', 2, 3);

    // Kills
    kills.forEach((k) => {
      const killCoord = this.convertCoord(map, k.victim.location);
      this.drawX(ctx, killCoord, '#efeb0b', '#000000', 2, 2, 5);
    });

    // Death
    if (death) {
      const causedBy = DamageCauserName[death.damageCauserName];
      if (causedBy === 'Bluezone' || death.killer.name === playerName) {
        const deathCoord = playerCoordinates[playerCoordinates.length - 1];
        if (deathCoord) {
          this.drawX(ctx, deathCoord, 'red', '#000000', 2, 2, 4);
        }
      } else {
        const deathCoord = this.convertCoord(map, death.victim.location);
        this.drawX(ctx, deathCoord, 'red', '#000000', 2, 3, 5);
      }
    }
  }

  private drawParachutePath(ctx: CanvasRenderingContext2D, coordinates: ILocation[]) {
    ctx.beginPath();

    coordinates.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      if (i === coordinates.length - 1) return;
      const xc = (x + coordinates[i + 1].x) / 2;
      const yc = (y + coordinates[i + 1].y) / 2;
      ctx.quadraticCurveTo(x, y, xc, yc);
    });

    ctx.lineTo(coordinates[coordinates.length - 1].x, coordinates[coordinates.length - 1].y);

    this.drawPath(ctx, this.lineStyles.parachute);
  }

  private drawPlanePath(ctx: CanvasRenderingContext2D, coordinates: ILocation[], maxX: number, maxY: number) {
    if (coordinates.length < 2) {
      this.log.info('Not enough coordinates to determine plane path.');
      return;
    }

    const c0 = coordinates[0];
    const c1 = coordinates[1];

    const dx = (c1.x - c0.x);
    const dy = (c1.y - c0.y);
    const slope = dy / dx;

    const yMinIntercept = c0.y - slope * c0.x;
    const yMaxIntercept = slope * maxX + yMinIntercept;
    const xMinIntercept = - (yMinIntercept / slope);
    const xMaxIntercept = (maxY - yMinIntercept) / slope;

    const nums: Array<[number, number]> = [];
    if (yMinIntercept >= 0 && yMinIntercept <= maxY) nums.push([0, yMinIntercept]);
    if (yMaxIntercept >= 0 && yMaxIntercept <= maxY) nums.push([maxX, yMaxIntercept]);
    if (xMinIntercept >= 0 && xMinIntercept <= maxX) nums.push([xMinIntercept, 0]);
    if (xMaxIntercept >= 0 && xMaxIntercept <= maxX) nums.push([xMaxIntercept, maxY]);

    if (nums.length !== 2) {
      this.log.error(`Invalid plane coordinates.`);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(...nums[0]);
    ctx.lineTo(...nums[1]);

    this.drawPath(ctx, this.lineStyles.plane);
  }

  private drawPlayerPath(ctx: CanvasRenderingContext2D, coordinates: ILocation[]) {
    ctx.beginPath();

    coordinates.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      if (i === coordinates.length - 1) return;
      const xc = (x + coordinates[i + 1].x) / 2;
      const yc = (y + coordinates[i + 1].y) / 2;
      ctx.quadraticCurveTo(x, y, xc, yc);
    });

    this.drawPath(ctx, this.lineStyles.player);
  }

  private drawPath(ctx: CanvasRenderingContext2D, style: ILineStyle) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = style.width + 3;
    ctx.stroke();

    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    if (style.dash) ctx.setLineDash([style.dash]);
    ctx.stroke();
    if (style.dash) ctx.setLineDash([]);
  }

  private drawIcon(
    ctx: CanvasRenderingContext2D, location: ILocation, icon: Image, size: number) {
    const width = size;
    const height = size * icon.height / icon.width;
    const x = Math.max(0, location.x - Math.round(width / 2));
    const y = Math.max(0, location.y - Math.round(height / 2));

    ctx.drawImage(icon, x, y, width, height );
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D, location: ILocation, fill: string, border: string, borderWidth = 2, radius = 2) {
    ctx.beginPath();
    ctx.arc(location.x, location.y, radius, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = border;
    ctx.stroke();
  }

  private drawCircleInverse(
    ctx: CanvasRenderingContext2D, location: ILocation,
    transparency: number, border: string, borderWidth = 2, radius = 2) {
    ctx.fillStyle = `rgba(52, 106, 193, ${transparency})`;
    ctx.beginPath();
    ctx.arc(location.x, location.y, radius, 0, 2 * Math.PI);
    ctx.rect(1000, 0, -1000, 1000);
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = border;
    ctx.stroke();
  }

  private drawX(
    ctx: CanvasRenderingContext2D, location: ILocation, fill: string,
    border: string, borderWidth = 2, length = 3, thickness = 2) {
    let x = location.x;
    let y = location.y;
    ctx.beginPath();
    x -= length;
    y -= length;
    ctx.moveTo(x, y);
    x += thickness / 2;
    y -= thickness / 2;
    ctx.lineTo(x, y);
    x += length;
    y += length;
    ctx.lineTo(x, y);
    x += length;
    y -= length;
    ctx.lineTo(x, y);
    x += thickness / 2;
    y += thickness / 2;
    ctx.lineTo(x, y);
    x -= length;
    y += length;
    ctx.lineTo(x, y);
    x += length;
    y += length;
    ctx.lineTo(x, y);
    x -= thickness / 2;
    y += thickness / 2;
    ctx.lineTo(x, y);
    x -= length;
    y -= length;
    ctx.lineTo(x, y);
    x -= length;
    y += length;
    ctx.lineTo(x, y);
    x -= thickness / 2;
    y -= thickness / 2;
    ctx.lineTo(x, y);
    x += length;
    y -= length;
    ctx.lineTo(x, y);
    x -= length;
    y -= length;
    ctx.lineTo(x, y);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = border;
    ctx.stroke();
    ctx.closePath();
  }

  private convertCoord(map: PubgMapImage, coordinate: ILocationAndStuff) {
    return {
      x: Math.round(coordinate.x * map.pixelRatio),
      y: Math.round(coordinate.y * map.pixelRatio),
      z: coordinate.z,
      state: coordinate.state,
      vehicleType: coordinate.vehicleType
    } as ILocation;
  }

  private convertCoords(map: PubgMapImage, coordinates: ILocationAndStuff[]) {
    return coordinates.map((c) => this.convertCoord(map, c));
  }
}
