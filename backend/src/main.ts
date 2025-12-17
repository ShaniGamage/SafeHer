import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(3001, '0.0.0.0');
  console.log('Backend running on http://localhost:3001');
  console.log('Mobile access: http://172.16.253.11:3001');
}

bootstrap();