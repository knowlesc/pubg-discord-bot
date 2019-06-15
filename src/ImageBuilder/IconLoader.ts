import * as path from 'path';
import * as fs from 'fs';
import { loadImage, Image } from 'canvas';

export class IconLoader {
  playerDeath?: Image;
  playerKill?: Image;
  land?: Image;
  plane?: Image;
  parachute?: Image;

  async load() {
    const playerKill = await this.getIconSvg('times');
    const playerDeath = await this.getIconSvg('skull-crossbones');
    const land = await this.getIconSvg('shoe-prints');
    const parachute = await this.getIconSvg('parachute-box');
    const plane = await this.getIconSvg('plane');
    this.playerKill = await this.getIconImage(playerKill, 'yellow');
    this.playerDeath = await this.getIconImage(playerDeath, 'yellow');
    this.land = await this.getIconImage(land, 'yellow');
    this.plane = await this.getIconImage(plane, 'yellow');
    this.parachute = await this.getIconImage(parachute, 'yellow');
  }

  private async getIconImage(svgData: string, color: string) {
    svgData = svgData.replace(`<path d`, `<path fill="${color}" d`);
    return await loadImage(Buffer.from(svgData));
  }

  private async getIconSvg(iconName: string) {
    const svgPath = path.join(path.dirname(require.main.filename),
      `../node_modules/@fortawesome/fontawesome-free/svgs/solid/${iconName}.svg`);

    if (!fs.existsSync(svgPath)) {
      throw new Error(`Can't find icon ${svgPath}`);
    }

    const buffer = await this.readFile(svgPath);
    const svgData = buffer.toString();

    return svgData;
  }

  private readFile(filePath: string) {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }
}
