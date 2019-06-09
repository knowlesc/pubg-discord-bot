import { get } from 'lodash';

export class PubgApiData {
  constructor(private data: any) {

  }

  get(path: string, defaultValue?: any) {
    return new PubgApiData(get(this.data, path, defaultValue));
  }

  getValue<T>(path: string, defaultValue?: any) {
    return get(this.data, path, defaultValue) as T;
  }
}
