import * as path from 'path';
import { loadImage, Image } from 'canvas';

type PubgMap = 'Sanhok' | 'Erangel' | 'Vikendi' | 'Miramar';

export class PubgMapImage {
  private static readonly cmPerPx = 102000;

  width: number;
  height: number;
  pixelRatio: number;
  image: Image;
  private diameterKm: number;
  private name: PubgMap;

  constructor(mapName: string) {
    if (!this.isValid(mapName)) {
      throw new Error(`Cannot generate map image: map ${mapName} is not supported`);
    }

    this.name = mapName;
    this.diameterKm = { Sanhok: 4, Vikendi: 6, Miramar: 8, Erangel: 8 }[mapName];
  }

  async load() {
    const mapImagePath = path.join(path.dirname(require.main.filename), `../image/${this.name}.png`);
    this.image = await loadImage(mapImagePath);
    this.width = this.image.width;
    this.height = this.image.height;
    this.pixelRatio = this.width / (PubgMapImage.cmPerPx * this.diameterKm);
  }

  private isValid(map: string): map is PubgMap {
    return ['Sanhok', 'Erangel', 'Vikendi', 'Miramar'].includes(map);
  }
}
