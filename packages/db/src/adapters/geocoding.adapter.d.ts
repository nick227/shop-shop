export interface GeocodingResult {
    latitude: number;
    longitude: number;
    confidence: 'high' | 'medium' | 'low';
    formattedAddress: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}
export interface GeocodingConfig {
    apiKey: string;
    baseUrl?: string;
}
declare class GeocodingAdapter {
    private apiKey;
    private baseUrl;
    constructor(config: GeocodingConfig);
    /**
     * Geocode a full address string
     */
    geocodeAddress(address: string): Promise<GeocodingResult | null>;
    /**
     * Geocode a zip code with explicit country parameter
     */
    geocodeZipCode(zip: string, country?: string): Promise<GeocodingResult | null>;
    /**
     * Geocode city and state with explicit country parameter
     */
    geocodeCityState(city: string, state: string, country?: string): Promise<GeocodingResult | null>;
    /**
     * Reverse geocode coordinates to address
     */
    reverseGeocode(latitude: number, longitude: number): Promise<string | null>;
    /**
     * Map Positionstack confidence to our simplified scale
     */
    private mapConfidence;
    /**
     * Map country code to ISO-3 format (what Positionstack returns)
     */
    private mapCountryCode;
}
export declare function createGeocodingAdapter(config: GeocodingConfig): GeocodingAdapter;
export declare function getGeocodingAdapter(): GeocodingAdapter;
export {};
//# sourceMappingURL=geocoding.adapter.d.ts.map