import * as path from 'path';
import { loadImage, Image } from 'canvas';

export class MapLoader {
  Erangel: Image;
  Sanhok: Image;
  Vikendi: Image;
  Miramar: Image;

  async load() {
    this.Erangel = await this.getIconImage('Erangel');
    this.Sanhok = await this.getIconImage('Sanhok');
    this.Vikendi = await this.getIconImage('Vikendi');
    this.Miramar = await this.getIconImage('Miramar');
  }

  getImage(mapName: string) {
    return ['Sanhok', 'Erangel', 'Vikendi', 'Miramar'].includes(mapName);
  }

  private async getIconImage(mapName: string) {
    const mapImagePath = path.join(path.dirname(require.main.filename), `../image/${mapName}.png`);
    return await loadImage(mapImagePath);
  }
}
