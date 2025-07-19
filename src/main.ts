import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const allowedOrigins = configService
    .get<string>('FRONTEND_ORIGIN')
    ?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,POST,PATCH,PUT,DELETE',
    credentials: true,
  });

  await app.listen(port);
}
bootstrap();
