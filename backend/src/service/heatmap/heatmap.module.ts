import { Module } from '@nestjs/common';
import { HeatMapService } from './heatmap.service';
import { HeatMapController } from './heatmap.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sos } from 'src/models/sos';
import { HarassmentReport } from 'src/models/harassment-report';

@Module({
  imports: [TypeOrmModule.forFeature([Sos,HarassmentReport])],
  providers: [HeatMapService],
  controllers: [HeatMapController],
  exports: [HeatMapService],
})
export class HeatmapModule {}
