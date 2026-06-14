export declare const VERSION: string;

export type EntityType = 'police' | 'fire' | 'ems' | 'hospital';

export interface Address {
  street?: string;
  city?: string;
  state: string;
  zip?: string;
  county?: string;
  countyFips?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Station {
  stationId: string;
  entityType: EntityType;
  facilityType?: string;
  facilityTypeLabel?: string;
  name: string;
  address: Address;
  phone?: string;
  website?: string;
  geo?: GeoPoint;
  /** Licensed bed count — hospitals only */
  beds?: number;
  /** Trauma center level — hospitals only */
  traumaLevel?: string;
  /** CMS Certification Number — hospitals only */
  cmsCcn?: string;
  hasHelipad?: boolean;
  ownershipType?: string;
  accreditation?: string;
  /** Populated only in nearby() responses */
  distanceMiles?: number;
  status: string;
}

export interface ResponseMeta {
  requestId: string;
  count?: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface StationsResponse {
  data: Station[];
  meta: ResponseMeta;
}

export interface Agency {
  stationId: string;
  name: string;
  entityType: EntityType;
  facilityTypeLabel?: string;
  phone?: string;
  website?: string;
}

export interface JurisdictionResult {
  data: {
    jurisdictionId: string;
    boundaryType: 'incorporated_place' | 'county' | 'tribal';
    boundarySource: 'approximate' | 'exact';
    placeName: string;
    state: string;
    likelyAgencies: Agency[];
  };
  meta: ResponseMeta;
  jurisdictionNote: string;
}

export interface StateListItem {
  state: string;
  policeStations?: number;
  fireStations?: number;
  emsStations?: number;
  hospitals?: number;
  totalFacilities?: number;
}

export interface StatesListResponse {
  data: StateListItem[];
  meta: ResponseMeta;
}

export interface StateFacilities {
  policeStations?: number;
  fireStations?: number;
  emsStations?: number;
  hospitals?: number;
  total?: number;
}

export interface StateHospitals {
  totalLicensedBeds?: number;
  traumaCenters?: number;
}

export interface StateSummary {
  state: string;
  dataVersion?: string;
  facilities?: StateFacilities;
  hospitals?: StateHospitals;
}

export interface HealthResponse {
  status: string;
  db?: boolean;
  source?: { dataVersion?: string; updatedAt?: string; freshnessDays?: number };
}

export interface ListOptions {
  type?: EntityType | EntityType[];
  state?: string;
  zip?: string;
  name?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface NearbyOptions {
  address?: string;
  lat?: number;
  lng?: number;
  type?: EntityType;
  radiusMiles?: number;
  limit?: number;
}

export interface JurisdictionOptions {
  address?: string;
  lat?: number;
  lng?: number;
  type: 'police' | 'fire';
}

export declare class PublicSafetyAPIError extends Error {
  code: string;
  status: number;
}

export declare class StationsResource {
  list(options?: ListOptions): Promise<StationsResponse>;
  get(stationId: string): Promise<Station>;
  nearby(options: NearbyOptions): Promise<StationsResponse>;
}

export declare class StatesResource {
  list(): Promise<StatesListResponse>;
  summary(code: string): Promise<StateSummary>;
}

export declare class PublicSafetyAPI {
  stations: StationsResource;
  states: StatesResource;
  constructor(options: { apiKey: string; baseUrl?: string });
  jurisdiction(options: JurisdictionOptions): Promise<JurisdictionResult>;
  health(): Promise<HealthResponse>;
}
