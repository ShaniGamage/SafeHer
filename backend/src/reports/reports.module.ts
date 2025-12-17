import { forwardRef, Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ClerkModule } from 'src/shared/clerk.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  
})
export class ReportsModule {}
