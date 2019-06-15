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

export class ImageBuilder {
  private log: Logger;
  private icons: IconLoader;
  private maps: MapLoader;
  private defaultStyles: {
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    lineCap: CanvasLineCap;
    shadowBlur: number;
    shadowColor: string;
    lineDash: number[]
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
    this.setDefaultStyles(ctx);
    ctx.drawImage(map.image, 0, 0);

    this.drawPlanePath(ctx, planeCoordinates);

    if (stats.planeLeave && playerCoordinates[0]) {
      this.drawParachutePath(ctx, [
        this.convertCoord(map, stats.planeLeave.character.location),
        ...parachuteCoordinates,
        playerCoordinates[0]
      ]);
    }

    this.drawPlayerPath(ctx, playerCoordinates);

    if (stats.landing) {
      this.drawIcon(ctx, this.convertCoord(map, stats.landing.character.location), this.icons.land, 16);
    }

    if (stats.planeLeave) {
      this.drawIcon(ctx, this.convertCoord(map, stats.planeLeave.character.location), this.icons.parachute, 24);
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

  drawParachutePath(ctx: CanvasRenderingContext2D, coordinates: ILocation[]) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.setLineDash([2.5]);

    ctx.beginPath();

    coordinates.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      if (i === coordinates.length - 1) return;
      const xc = (x + coordinates[i + 1].x) / 2;
      const yc = (y + coordinates[i + 1].y) / 2;
      ctx.quadraticCurveTo(x, y, xc, yc);
    });

    ctx.lineTo(coordinates[coordinates.length - 1].x, coordinates[coordinates.length - 1].y);

    ctx.stroke();

    this.resetStyles(ctx);
  }

  private drawPlanePath(ctx: CanvasRenderingContext2D, coordinates: ILocation[]) {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';

    ctx.beginPath();

    coordinates.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      if (i === coordinates.length - 1) return;
      ctx.lineTo(x, y);
    });

    const lastCoord = coordinates[coordinates.length - 1];
    const yDiff = (lastCoord.y - coordinates[0].y);
    const xDiff = (lastCoord.x - coordinates[0].x);
    ctx.lineTo(lastCoord.x + xDiff, lastCoord.y + yDiff);

    ctx.stroke();

    this.resetStyles(ctx);
  }

  private drawPlayerPath(ctx: CanvasRenderingContext2D, coordinates: ILocation[]) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';

    ctx.beginPath();

    coordinates.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      if (i === coordinates.length - 1) return;
      const xc = (x + coordinates[i + 1].x) / 2;
      const yc = (y + coordinates[i + 1].y) / 2;
      ctx.quadraticCurveTo(x, y, xc, yc);
    });

    ctx.stroke();

    this.resetStyles(ctx);
  }

  private drawIcon(
    ctx: CanvasRenderingContext2D, location: ILocation, icon: Image, size: number) {
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'black';
    const width = size;
    const height = size * icon.height / icon.width;
    const x = Math.max(0, location.x - Math.round(width / 2));
    const y = Math.max(0, location.y - Math.round(height / 2));

    ctx.drawImage(icon, x, y, width, height );
    this.resetStyles(ctx);
  }

  private setDefaultStyles(ctx: CanvasRenderingContext2D) {
    this.defaultStyles = {
      strokeStyle: ctx.strokeStyle,
      lineWidth: ctx.lineWidth,
      lineCap: ctx.lineCap,
      shadowBlur: ctx.shadowBlur,
      shadowColor: ctx.shadowColor,
      lineDash: []
    };
  }

  private resetStyles(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.defaultStyles.strokeStyle;
    ctx.lineWidth = this.defaultStyles.lineWidth;
    ctx.lineCap = this.defaultStyles.lineCap;
    ctx.shadowBlur = this.defaultStyles.shadowBlur;
    ctx.shadowColor = this.defaultStyles.shadowColor;
    ctx.setLineDash(this.defaultStyles.lineDash);
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
