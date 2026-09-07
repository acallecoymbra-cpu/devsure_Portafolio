import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, static as serveStatic, urlencoded, type NextFunction, type Request, type Response } from 'express';
import { resolve } from 'node:path';
import { SafeExceptionFilter } from './common/filters/safe-exception.filter';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const corsOrigins = configService.getOrThrow<string[]>('http.corsOrigins');
  const bodyLimit = configService.getOrThrow<string>('http.bodyLimit');
  const apiPrefix = configService.getOrThrow<string>('http.prefix');
  const uploadsDir = resolve(configService.getOrThrow<string>('storage.uploadsDir'));

  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix);
  app.use(helmet());
  // Uploaded media must render on the public site's origin, so relax the
  // Cross-Origin-Resource-Policy helmet sets by default (same-origin) for
  // this path only; the rest of the API keeps helmet's stricter default.
  app.use(
    '/storage',
    (_request: Request, response: Response, next: NextFunction) => {
      response.header('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    serveStatic(uploadsDir),
  );
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());

  if (configService.getOrThrow<boolean>('swagger.enabled')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DevSure API')
      .setDescription('Versioned REST API for DevSure')
      .setVersion('0.1.0')
      .addCookieAuth('devsure_session')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }
}
