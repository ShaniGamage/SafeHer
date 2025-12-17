
import { Injectable, Logger } from '@nestjs/common'; import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as turf from '@turf/turf';
import axios from 'axios';
import { Sos } from 'src/models/sos';
import { HarassmentReport } from 'src/models/harassment-report';

@Injectable()
export class HeatMapService {
  private readonly logger = new Logger(HeatMapService.name);

  constructor(
    @InjectRepository(Sos) // Replace with your actual entity
    private sosRepo: Repository<any>,
    @InjectRepository(HarassmentReport) // Replace with your actual entity
    private harassmentRepo: Repository<any>,
  ) { }

  /**
   * Step 1: When user opens map - Show risk zones
   * Returns colored hexagonal zones based on incident density
   */
  async getHeatmapZones(bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) {
    try {
      this.logger.log(`Heatmap request for bounds: ${JSON.stringify(bounds)}`);

      // Prevent huge areas that cause memory issues
      const latDiff = bounds.maxLat - bounds.minLat;
      const lngDiff = bounds.maxLng - bounds.minLng;

      if (latDiff > 0.5 || lngDiff > 0.5) {
        this.logger.warn('Area too large, zoom in');
        return {
          type: 'FeatureCollection',
          features: [],
          message: 'Zoom in to see safety zones',
        };
      }

      // Get incidents from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Query SOS reports 
      const sosIncidents = await this.sosRepo
        .createQueryBuilder('sos')
        .select(['sos.id', 'sos.latitude', 'sos.longitude', 'sos.createdAt'])
        .where('sos.latitude BETWEEN :minLat AND :maxLat', {
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
        })
        .andWhere('sos.longitude BETWEEN :minLng AND :maxLng', {
          minLng: bounds.minLng,
          maxLng: bounds.maxLng,
        })
        .andWhere('sos.createdAt >= :date', { date: ninetyDaysAgo })
        .limit(500)
        .getRawMany();

      // Query Harassment reports
      const harassmentIncidents = await this.harassmentRepo
        .createQueryBuilder('harassment')
        .select(['harassment.id', 'harassment.latitude', 'harassment.longitude', 'harassment.createdAt'])
        .where('harassment.latitude BETWEEN :minLat AND :maxLat', {
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
        })
        .andWhere('harassment.longitude BETWEEN :minLng AND :maxLng', {
          minLng: bounds.minLng,
          maxLng: bounds.maxLng,
        })
        .andWhere('harassment.createdAt >= :date', { date: ninetyDaysAgo })
        .limit(500)
        .getRawMany();

      this.logger.log(
        `Found ${sosIncidents.length} SOS + ${harassmentIncidents.length} harassment incidents`,
      );

      // Combine all incidents
      const allIncidents = [
        ...sosIncidents.map(i => ({
          lat: parseFloat(i.sos_latitude),
          lng: parseFloat(i.sos_longitude),
          date: i.sos_createdAt,
          type: 'sos',
        })),
        ...harassmentIncidents.map(i => ({
          lat: parseFloat(i.harassment_latitude),
          lng: parseFloat(i.harassment_longitude),
          date: i.harassment_createdAt,
          type: 'harassment',
        })),
      ];

      // If no incidents, return empty (all safe)
      if (allIncidents.length === 0) {
        this.logger.log('No incidents - area is safe');
        return {
          type: 'FeatureCollection',
          features: [],
          message: 'No incidents reported in this area - Safe zone',
        };
      }

      this.logger.log(`Processing ${allIncidents.length} total incidents`);

      // Create hexagonal grid 
      const bbox: [number, number, number, number] = [
        bounds.minLng,
        bounds.minLat,
        bounds.maxLng,
        bounds.maxLat,
      ];

      const cellSide = 0.4; // 400 meters
      const hexGrid = turf.hexGrid(bbox, cellSide, { units: 'kilometers' });

      this.logger.log(`Generated ${hexGrid.features.length} hexagonal zones`);

      // Calculate risk level for each hex
      const zones = hexGrid.features.map(hex => {
        // Find incidents inside this hex
        const incidentsInHex = allIncidents.filter(incident => {
          try {
            const point = turf.point([incident.lng, incident.lat]);
            return turf.booleanPointInPolygon(point, hex);
          } catch {
            return false;
          }
        });

        // Weight recent incidents higher 
        const now = new Date();
        const weightedCount = incidentsInHex.reduce((sum, incident) => {
          const daysAgo =
            (now.getTime() - new Date(incident.date).getTime()) / (1000 * 60 * 60 * 24);

          // Recent incidents are more relevant
          if (daysAgo <= 30) return sum + 1.5; // Last month
          if (daysAgo <= 60) return sum + 1.0; // Last 2 months
          return sum + 0.5; // Older incidents
        }, 0);

        // Determine risk level based on weighted count
        let riskLevel: 'high' | 'medium' | 'low' | 'safe';
        let color: string;
        let priority: number;

        if (weightedCount >= 5) {
          riskLevel = 'high';
          color = '#FF4444';
          priority = 4;
        } else if (weightedCount >= 2) {
          riskLevel = 'medium';
          color = '#FF9800'; 
          priority = 3;
        } else if (weightedCount >= 0.5) {
          riskLevel = 'low';
          color = '#FFC107'; 
          priority = 2;
        } else {
          riskLevel = 'safe';
          color = '#4CAF50';
          priority = 1;
        }

        return {
          type: 'Feature',
          properties: {
            riskLevel,
            color,
            priority,
            incidentCount: incidentsInHex.length,
            sosCount:sosIncidents.length,
            harassmentCount:harassmentIncidents.length,
            weightedScore: Math.round(weightedCount * 10) / 10,
          },
          geometry: hex.geometry,
        };
      });

      // Only return zones with some risk
      const filteredZones = zones.filter(
        zone => zone.properties.incidentCount > 0 || zones.length < 30
      );

      this.logger.log(`Returning ${filteredZones.length} risk zones`);

      return {
        type: 'FeatureCollection',
        features: filteredZones,
        stats: {
          totalIncidents: allIncidents.length,
          highRisk: filteredZones.filter(z => z.properties.riskLevel === 'high').length,
          mediumRisk: filteredZones.filter(z => z.properties.riskLevel === 'medium').length,
          lowRisk: filteredZones.filter(z => z.properties.riskLevel === 'low').length,
        },
      };
    } catch (error) {
      this.logger.error('Error in getHeatmapZones:', error);
      throw error;
    }
  }

  /**
   * Step 2: When user selects destination - Calculate safest route
   * Avoids high-risk zones and finds the safest path
   */
  async getSafeRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
  ) {
    try {
      this.logger.log(`Route request: ${JSON.stringify({ start, end })}`);

      // Get danger zones in the route corridor
      const buffer = 2; // 2km buffer around straight line
      const line = turf.lineString([
        [start.lng, start.lat],
        [end.lng, end.lat],
      ]);
      const buffered = turf.buffer(line, buffer, { units: 'kilometers' });

      if (!buffered) {
        throw new Error('Failed to create buffer around route');
      }

      const bbox = turf.bbox(buffered);

      // Get heatmap zones for this corridor
      const zones = await this.getHeatmapZones({
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2],
      });

      // Extract high-risk zones as obstacles
      const dangerZones = zones.features
        .filter(f => f.properties.riskLevel === 'high')
        .map(f => f.geometry);

      this.logger.log(`Found ${dangerZones.length} danger zones to avoid`);

      // Use OpenRouteService for real routing
      const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY;

      if (ORS_API_KEY) {
        try {
          this.logger.log('Calling OpenRouteService API...');

          const response = await axios.post(
            'https://api.openrouteservice.org/v2/directions/foot-walking',
            {
              coordinates: [
                [start.lng, start.lat],
                [end.lng, end.lat],
              ],
              alternative_routes: {
                target_count: 3,
              },
              // Don't specify format, use default JSON
            },
            {
              headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json; charset=utf-8',
              },
              timeout: 10000,
            },
          );

          this.logger.log(`API Response status: ${response.status}`);

          // Check response structure - API returns 'routes' array in default JSON format
          const routes = response.data.routes || [];

          if (routes.length === 0) {
            this.logger.warn('API returned no routes');
            this.logger.warn(`Response keys: ${Object.keys(response.data).join(', ')}`);
            throw new Error('No routes returned from API');
          }

          this.logger.log(`Got ${routes.length} route(s) from API`);

          // Process and score routes based on danger zone intersections
          const processedRoutes = routes.map((route, index) => {
            this.logger.log(`Processing route ${index + 1}...`);

            // Extract coordinates - they're in an encoded format, need to decode
            const geometry = route.geometry;

            if (!geometry) {
              this.logger.warn(`Route ${index + 1} has no geometry`);
              return null;
            }

            // Decode the polyline geometry to get coordinates
            let coordinates;
            if (typeof geometry === 'string') {
              // Geometry is encoded polyline string - decode it
              this.logger.log(`Decoding polyline for route ${index + 1}...`);
              coordinates = this.decodePolyline(geometry);
            } else if (geometry.coordinates) {
              // Geometry already has coordinates array
              coordinates = geometry.coordinates;
            } else {
              this.logger.warn(`Route ${index + 1} has unknown geometry format`);
              return null;
            }

            if (!coordinates || coordinates.length === 0) {
              this.logger.warn(`Route ${index + 1} has no valid coordinates`);
              return null;
            }

            this.logger.log(`Route ${index + 1} has ${coordinates.length} coordinate points`);

            const routeLine = turf.lineString(coordinates);

            let dangerScore = 0;
            dangerZones.forEach(zone => {
              try {
                const intersection = turf.lineIntersect(routeLine, zone);
                dangerScore += intersection.features.length;
              } catch { }
            });

            return {
              coordinates: coordinates,
              distance: Math.round(route.summary.distance), // in meters
              duration: Math.round(route.summary.duration), // in seconds
              dangerScore,
              safetyRating: this.calculateSafetyRating(dangerScore),
            };
          }).filter(route => route !== null); // Remove any null routes

          if (routes.length === 0) {
            this.logger.error('No valid routes after processing');
            throw new Error('All routes were invalid');
          }

          // Sort by safety (lowest danger score first)
          processedRoutes.sort((a, b) => a.dangerScore - b.dangerScore);

          return {
            recommendedRoute: processedRoutes[0],
            alternativeRoutes: processedRoutes.slice(1),
            dangerZones: zones.features.filter(f => f.properties.riskLevel === 'high'),
          };

        } catch (apiError) {
          this.logger.warn('OpenRouteService failed, using fallback:');
          this.logger.error(`Error: ${apiError.message}`);

          if (apiError.response) {
            this.logger.error(`API Status: ${apiError.response.status}`);
            this.logger.error(`API Error: ${JSON.stringify(apiError.response.data)}`);
          }
        }
      } else {
        this.logger.warn('No OpenRouteService API key configured');
      }

      // Option 2: Fallback - Simple straight line with danger warnings
      const from = turf.point([start.lng, start.lat]);
      const to = turf.point([end.lng, end.lat]);
      const distance = turf.distance(from, to, { units: 'meters' });
      const duration = (distance / 1000) * 12 * 60; // 5 km/h walking

      // Check if straight line crosses danger zones
      let dangerScore = 0;
      dangerZones.forEach(zone => {
        try {
          const intersection = turf.lineIntersect(line, zone);
          dangerScore += intersection.features.length;
        } catch { }
      });

      this.logger.log(`Fallback route with danger score: ${dangerScore}`);

      return {
        recommendedRoute: {
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
          distance: Math.round(distance),
          duration: Math.round(duration),
          dangerScore,
          safetyRating: this.calculateSafetyRating(dangerScore),
        },
        alternativeRoutes: [],
        dangerZones: zones.features.filter(f => f.properties.riskLevel === 'high'),
      };
    } catch (error) {
      this.logger.error('Error in getSafeRoute:', error);
      throw error;
    }
  }

  private calculateSafetyRating(dangerScore: number): string {
    if (dangerScore === 0) return 'Very Safe ';
    if (dangerScore <= 2) return 'Safe ';
    if (dangerScore <= 5) return 'Caution ';
    return 'High Risk ';
  }

  /**
   * Decode Google/OpenRouteService encoded polyline to coordinates
   * Format: [[lng, lat], [lng, lat], ...]
   */
  private decodePolyline(encoded: string): number[][] {
    const coordinates: number[][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      // Decode longitude
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      // Convert to decimal degrees and push as [lng, lat]
      coordinates.push([lng / 1e5, lat / 1e5]);
    }

    return coordinates;
  }

  
}