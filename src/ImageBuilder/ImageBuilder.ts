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

interface LineStyle {
  dash?: number;
  color: string;
  width: number;
}

export class ImageBuilder {
  private log: Logger;
  private icons: IconLoader;
  private maps: MapLoader;
  private readonly lineStyles: {[k: string]: LineStyle } = {
    plane: {
      color: 'rgba(255, 255, 255, 0.7)',
      width: 4
    },
    parachute: {
      color: 'rgba(0, 255, 255, 0.9)',
      width: 3,
      dash: 3
    },
    player: {
      color: 'rgba(255, 0, 0, 0.9)',
      width: 2.5
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

  async draw(stats: PlayerMatchStats) {
    if (!stats.position || !stats.position.length) return null;

    const startTime = performance.now();
    const mapName = stats.map;
    const kills = stats.kills;
    const death = stats.death;
    const map = new PubgMapImage(mapName, this.maps);

    const coordinates: ILocationAndStuff[] = this.convertCoords(map, stats.position
      .filter((p) => p.common.isGame > 0)
      .map((p) => ({
        state: p.common.isGame,
        vehicleType: p.vehicle.vehicleType,
        ...p.character.location
      })));

    const planeCoordinates = coordinates.filter((c) => c.vehicleType === 'TransportAircraft');
    const parachuteCoordinates = coordinates.filter((c) => c.vehicleType !== 'TransportAircraft' && c.state < 1);
    const playerCoordinates = coordinates.filter((c) => c.vehicleType !== 'TransportAircraft' && c.state >= 1);

    const canvas = createCanvas(map.width, map.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(map.image, 0, 0);

    if (stats.planeLeave && playerCoordinates[0]) {
      this.drawParachutePath(ctx, [
        this.convertCoord(map, stats.planeLeave.character.location),
        ...parachuteCoordinates,
        playerCoordinates[0]
      ]);
    }

    this.drawPlayerPath(ctx, playerCoordinates);
    this.drawPlanePath(ctx, planeCoordinates, map.width, map.height);

    if (stats.landing) {
      this.drawIcon(ctx, this.convertCoord(map, stats.landing.character.location), this.icons.land, 18);
    }

    kills.forEach((k) => {
      this.drawIcon(ctx, this.convertCoord(map, k.victim.location), this.icons.playerKill, 7);
    });

    if (death) {
      const location = DamageCauserName[death.damageCauserName] !== 'Bluezone' ?
        this.convertCoord(map, death.victim.location) :
        playerCoordinates[playerCoordinates.length - 1];
      this.drawIcon(ctx, location, this.icons.playerDeath, 16);
    }

    const imageProcessingTime = (performance.now() - startTime).toFixed(1);
    this.log.info(`Drew image in ${imageProcessingTime}ms`);

    return canvas.toBuffer();
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

  private drawPath(ctx: CanvasRenderingContext2D, style: LineStyle) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = style.width + 3;
    ctx.stroke();

    ctx.strokeStyle = style.color;
    ctx.lineWidth = 2.5;
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
