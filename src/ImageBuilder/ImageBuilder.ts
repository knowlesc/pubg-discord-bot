import { PlayerMatchStats } from './../PubgMonitor/Types/PubgApi/PlayerMatchStats';
import { createCanvas, CanvasRenderingContext2D, Image } from 'canvas';
import { PubgMapImage } from './PubgMapImage';
import { IconLoader } from './IconLoader';

export class ImageBuilder {
  private icons: IconLoader;
  private defaultStyles: {
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    lineCap: CanvasLineCap;
    shadowBlur: number;
    shadowColor: string;
  };

  constructor() {
    this.icons = new IconLoader();
  }

  async draw(stats: PlayerMatchStats) {
    let coordinates = stats.coordinates;
    const mapName = stats.map;
    const playerName = stats.name;
    const kills = stats.kills;
    const death = stats.death;

    if (!coordinates || !coordinates.length) {
      return null;
    }

    const map = new PubgMapImage(mapName);
    await map.load();
    await this.icons.loadIcons();

    coordinates = this.convertCoords(map, coordinates);
    const canvas = createCanvas(map.width, map.height);
    const ctx = canvas.getContext('2d');
    this.setDefaultStyles(ctx);
    ctx.drawImage(map.image, 0, 0);

    this.drawPlayerPath(ctx, coordinates);

    kills.forEach((k) => {
      this.drawIcon(ctx, this.convertCoord(map, k.victim.location), this.icons.playerKill, 7);
    });

    if (death) {
      this.drawIcon(ctx, this.convertCoord(map, death.victim.location), this.icons.playerDeath, 16);
    }

    return canvas.toBuffer();
  }

  private drawPlayerPath(ctx: CanvasRenderingContext2D, coordinates: ILocation[]) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';

    const firstPoint = coordinates.shift();

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    coordinates.forEach(({ x, y }, i) => {
      if (i === coordinates.length - 1) return;
      const xc = (x + coordinates[i + 1].x) / 2;
      const yc = (y + coordinates[i + 1].y) / 2;
      ctx.quadraticCurveTo(x, y, xc, yc);
    });

    ctx.stroke();

    this.drawIcon(ctx, firstPoint, this.icons.parachute, 16);
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
      shadowColor: ctx.shadowColor
    };
  }

  private resetStyles(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.defaultStyles.strokeStyle;
    ctx.lineWidth = this.defaultStyles.lineWidth;
    ctx.lineCap = this.defaultStyles.lineCap;
    ctx.shadowBlur = this.defaultStyles.shadowBlur;
    ctx.shadowColor = this.defaultStyles.shadowColor;
  }

  private convertCoord(map: PubgMapImage, coordinate: ILocation) {
    return {
      x: Math.round(coordinate.x * map.pixelRatio),
      y: Math.round(coordinate.y * map.pixelRatio),
      z: coordinate.z
    } as ILocation;
  }

  private convertCoords(map: PubgMapImage, coordinates: ILocation[]) {
    return coordinates.map((c) => this.convertCoord(map, c));
  }
}
