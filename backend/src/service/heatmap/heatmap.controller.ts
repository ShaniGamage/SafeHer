import { Controller, Post, Body, Get } from '@nestjs/common';
import { HeatMapService } from './heatmap.service';

@Controller('safe-route')
export class HeatMapController {
  constructor(private readonly safeRouteService: HeatMapService) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok', message: 'Safe Route API running' };
  }

  @Post('heatmap')
  async getHeatmap(@Body() bounds: {
    minLat: number; maxLat: number;
    minLng: number; maxLng: number;
  }) {
    return this.safeRouteService.getHeatmapZones(bounds);
  }

  @Post('calculate')
  async calculateRoute(@Body() dto: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  }) {
    return this.safeRouteService.getSafeRoute(dto.start, dto.end);
  }
}