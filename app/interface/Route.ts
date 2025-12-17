export interface Route {
  recommendedRoute: {
    coordinates: [number, number][];
    safetyRating: string;
    distance: number;
    duration: number;
  };
  alternativeRoutes?: {
    coordinates: [number, number][];
  }[];
  dangerZones?: unknown[];
}



export interface HeatmapZone {
  properties: {
    riskLevel: 'high' | 'medium' | 'low';
  };
  geometry: {
    coordinates: [number, number][][];
  };
}
