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
  // Real bug (user report: an uploaded culture-story image saved fine and
  // rendered in every plain `<img>`, but never appeared as a texture in the
  // 3D column): `THREE.TextureLoader` requests images with
  // `crossOrigin: 'anonymous'`, which the browser only honors if the
  // response carries `Access-Control-Allow-Origin` — but `enableCors()` used
  // to run *after* `/storage` was already mounted with `app.use()`, and
  // Express/Nest middleware runs in registration order, so every `/storage/*`
  // response skipped the CORS middleware entirely and never got that header.
  // A plain `<img>` doesn't need CORS to display, so this only ever broke
  // WebGL texture loads, silently (`spine-cards.ts`'s `onError` just keeps
  // the fallback color) — never seeded static `/public` images, which are
  // same-origin on the web app and never cross to the API origin at all.
  // Registering CORS first makes it apply to every route, `/storage`
  // included.
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
