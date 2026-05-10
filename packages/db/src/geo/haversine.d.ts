/** Two points on Earth's surface (WGS84 degrees). */
export type GeoPoint = Readonly<{
    latitude: number;
    longitude: number;
}>;
/** Great-circle distance in statute miles. */
export declare function haversineMiles(a: GeoPoint, b: GeoPoint): number;
//# sourceMappingURL=haversine.d.ts.map