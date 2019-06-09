import fetch from 'node-fetch';
import { RequestError } from './RequestError';

export class BaseApiClient {
  private static readonly defaultHeaders = { Accept: 'application/vnd.api+json'};

  protected async get<T>(
    url: string,
    params: IDictionary = {},
    headers: IDictionary = BaseApiClient.defaultHeaders) {
    const paramsSerialized = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    if (paramsSerialized) url = `${url}?${paramsSerialized}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new RequestError(response.status, `GET ${url}: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  }
}
