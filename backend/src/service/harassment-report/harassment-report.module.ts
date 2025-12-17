import { Module } from '@nestjs/common';
import { HarassmentReportService } from './harassment-report.service';
import { HarassmentReportController } from './harassment-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HarassmentReport } from 'src/models/harassment-report';

@Module({
  imports:[TypeOrmModule.forFeature([HarassmentReport])],
  providers: [HarassmentReportService],
  controllers: [HarassmentReportController],
  exports:[HarassmentReportService]
})
export class HarassmentReportModule {}
