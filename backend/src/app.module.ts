import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SosModule } from './service/sos/sos.module'; // Import the MODULE
import { ReportsModule } from './reports/reports.module';
import { HarassmentReportModule } from './service/harassment-report/harassment-report.module';
import { PostModule } from './service/post/post.module';
import { HeatmapModule } from './service/heatmap/heatmap.module';
// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/models/**/*.{ts,js}'],
      synchronize: true, // set false in production
    })
    ,
    SosModule,
    ReportsModule, HarassmentReportModule, PostModule, HeatmapModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }