# publicsafetyapi

**Official Node.js SDK for [publicsafetyapi.dev](https://publicsafetyapi.dev)** — the developer API for US public safety facility data.

Every police station, fire station, hospital, and EMS location in the United States — sourced from HIFLD (DHS/CISA) and CMS federal datasets.

---

## Installation

```bash
npm install publicsafetyapi
```

## Quick Start

```js
const { PublicSafetyAPI } = require('publicsafetyapi');

const client = new PublicSafetyAPI({ apiKey: 'psk_live_...' });

// Nearest fire stations to any US address
const result = await client.stations.nearby({
  address: '12865 Main St, Apple Valley, CA',
  type: 'fire',
  radiusMiles: 10
});
result.data.forEach(s => console.log(`${s.name} — ${s.distanceMiles.toFixed(1)} mi`));

// Which police department covers this address?
const jurisdiction = await client.jurisdiction({
  address: '12865 Main St, Apple Valley, CA',
  type: 'police'
});
console.log(jurisdiction.data.likelyAgencies[0].name);
// → "Apple Valley Police Department"

// Look up any facility by ID
const hospital = await client.stations.get('hospital-hifld-112233');
console.log(hospital.traumaLevel);  // "Level II"
console.log(hospital.beds);         // 212
console.log(hospital.cmsCcn);       // "050317"

// State-level rollups
const { data: states } = await client.states.list();
const ca = await client.states.summary('CA');
console.log(ca.facilities.total, ca.hospitals.totalLicensedBeds);

// Service health (no API key required, no credits used)
const health = await client.health();
console.log(health.status, health.source.dataVersion);
```

## TypeScript

Full typings included:

```ts
import { PublicSafetyAPI, Station, JurisdictionResult, StateSummary } from 'publicsafetyapi';
```

## What's Covered

| Entity Type | Source | Records |
|-------------|--------|---------|
| Police stations | HIFLD (DHS/CISA) | 23,000+ |
| Fire stations | HIFLD (DHS/CISA) + USFA | 52,000+ |
| EMS stations | HIFLD (DHS/CISA) | 42,000+ |
| Hospitals | HIFLD + CMS | 7,500+ |

## API Key

Get a free API key (500 calls/month) at **[publicsafetyapi.dev](https://publicsafetyapi.dev)**.

## Related

- [districtapi-sdk](https://www.npmjs.com/package/districtapi-sdk) — US school districts
- [libraryapi-sdk](https://www.npmjs.com/package/libraryapi-sdk) — US public libraries

## License

MIT
