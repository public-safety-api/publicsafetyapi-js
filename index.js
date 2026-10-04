/**
 * publicsafetyapi
 * Official Node.js SDK for publicsafetyapi.dev
 *
 * US public safety facility data — police stations, fire stations,
 * hospitals, and EMS locations — from HIFLD (DHS/CISA) and CMS.
 *
 * @example
 * const { PublicSafetyAPI } = require('publicsafetyapi');
 * const client = new PublicSafetyAPI({ apiKey: 'psk_live_...' });
 *
 * // Nearest fire stations to any US address
 * const { data } = await client.stations.nearby({
 *   address: '12865 Main St, Apple Valley, CA',
 *   type: 'fire',
 *   radiusMiles: 10
 * });
 * console.log(data[0].name, data[0].distanceMiles);
 *
 * // Jurisdiction lookup
 * const result = await client.jurisdiction({
 *   address: '12865 Main St, Apple Valley, CA',
 *   type: 'police'
 * });
 * console.log(result.data.likelyAgencies[0].name); // "Apple Valley Police Department"
 *
 * // State-level rollups
 * const states = await client.states.list();
 * const ca = await client.states.summary('CA');
 */

'use strict';

const VERSION = '0.2.1';
const BASE_URL = 'https://api.publicsafetyapi.dev';

// Identifiers are interpolated into the request path, and the URL parser
// collapses ".." segments, so an unvalidated id such as
// "../../v2/internal/admin" would send the request, with the caller's API
// key, to a different path on the API host; "?" and "#" would inject a query
// string or fragment. Allowlist rather than blocklist: every real identifier
// is alphanumeric with optional "-"/"_".
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Return the identifier as a string, or throw if it could escape the path. */
function safeId(value, field) {
  const id = typeof value === 'number' ? String(value) : value;
  if (typeof id !== 'string' || !SAFE_ID.test(id)) {
    const shown = typeof value === 'string' ? JSON.stringify(value) : typeof value;
    throw new TypeError(`${field} must contain only letters, digits, '-' or '_' (got ${shown})`);
  }
  return id;
}

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
    this.states = new StatesResource(this);
  }

  async _request(path, params = {}) {
    const url = new URL(`${this._baseUrl}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        'User-Agent': `publicsafetyapi-js/${VERSION}`,
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

  /** Service health. Does not require a valid API key and consumes no credits. */
  async health() {
    return this._request('/v1/health');
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
    const body = await this._client._request(`/v1/stations/${safeId(stationId, 'stationId')}`);
    return body.data;
  }

  async nearby({ address, lat, lng, type, radiusMiles, limit } = {}) {
    return this._client._request('/v1/stations/nearby', {
      address, lat, lng, type,
      radius_miles: radiusMiles,
      limit,
    });
  }
}

class StatesResource {
  constructor(client) {
    this._client = client;
  }

  /** List all states with facility counts. Returns the full envelope ({ data, meta }). */
  async list() {
    return this._client._request('/v1/states');
  }

  /** State-level facility + hospital rollup for a two-letter state code. */
  async summary(code) {
    const body = await this._client._request(`/v1/states/${safeId(code, 'code').toUpperCase()}/summary`);
    return body.data;
  }
}

module.exports = { PublicSafetyAPI, PublicSafetyAPIError, VERSION };
