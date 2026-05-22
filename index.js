/**
 * publicsafetyapi-sdk
 * Official Node.js SDK for publicsafetyapi.dev
 *
 * US public safety facility data — police stations, fire stations,
 * hospitals, and EMS locations — from HIFLD (DHS/CISA) and CMS.
 *
 * Full SDK implementation ships with v0.2.0 alongside the API launch.
 * Sign up for early access at https://publicsafetyapi.dev
 *
 * @example
 * const { PublicSafetyAPI } = require('publicsafetyapi-sdk');
 * const client = new PublicSafetyAPI({ apiKey: 'psk_live_...' });
 *
 * // Nearest fire stations to any US address
 * const stations = await client.stations.nearby({
 *   address: '12865 Main St, Apple Valley, CA',
 *   type: 'fire',
 *   radiusMiles: 10
 * });
 * console.log(stations[0].name, stations[0].distanceMiles);
 *
 * // Jurisdiction lookup
 * const result = await client.jurisdiction({
 *   address: '12865 Main St, Apple Valley, CA',
 *   type: 'police'
 * });
 * console.log(result.likelyAgencies[0].name); // "Apple Valley Police Department"
 */

'use strict';

const VERSION = '0.1.0';
const BASE_URL = 'https://api.publicsafetyapi.dev';

class PublicSafetyAPIError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'PublicSafetyAPIError';
    this.code = code;
    this.status = status;
  }
}

class PublicSafetyAPI {
  constructor({ apiKey, baseUrl = BASE_URL } = {}) {
    if (!apiKey) throw new Error('PublicSafetyAPI: apiKey is required');
    this._apiKey = apiKey;
    this._baseUrl = baseUrl;
    this.stations = new StationsResource(this);
  }

  async _request(path, params = {}) {
    const url = new URL(`${this._baseUrl}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        'User-Agent': `publicsafetyapi-sdk-js/${VERSION}`,
      },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new PublicSafetyAPIError(
        body?.detail?.message ?? res.statusText,
        body?.detail?.code ?? 'UNKNOWN_ERROR',
        res.status
      );
    }
    return body;
  }

  async jurisdiction({ address, lat, lng, type } = {}) {
    return this._request('/v1/jurisdiction', { address, lat, lng, type });
  }
}

class StationsResource {
  constructor(client) {
    this._client = client;
  }

  async list({ type, state, zip, name, status, limit, offset } = {}) {
    return this._client._request('/v1/stations', { type, state, zip, name, status, limit, offset });
  }

  async get(stationId) {
    return this._client._request(`/v1/stations/${stationId}`);
  }

  async nearby({ address, lat, lng, type, radiusMiles, limit } = {}) {
    return this._client._request('/v1/stations/nearby', {
      address, lat, lng, type,
      radius_miles: radiusMiles,
      limit,
    });
  }
}

module.exports = { PublicSafetyAPI, PublicSafetyAPIError, VERSION };
