import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SosModule } from './service/sos/sos.module';
import { ReportsModule } from './reports/reports.module';
import { HarassmentReportModule } from './service/harassment-report/harassment-report.module';
import { PostModule } from './service/post/post.module';
import { HeatmapModule } from './service/heatmap/heatmap.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configuration for Railway PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/models/**/*.{ts,js}'], 
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      logging: process.env.NODE_ENV !== 'production',
    }),

    // Import your feature modules
    SosModule,
    ReportsModule,
    HarassmentReportModule,
    PostModule,
    HeatmapModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
