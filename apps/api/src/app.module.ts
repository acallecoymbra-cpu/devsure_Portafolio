import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (input) => validateConfiguration(input),
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3' as const,
        database: configService.getOrThrow<string>('database.path'),
        logging: configService.getOrThrow<boolean>('database.logging'),
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        entities: [],
      }),
    }),
    HealthModule,
  ],
})
export class AppModule {}

function validateConfiguration(input: Record<string, unknown>): Record<string, unknown> {
  return validateEnvironment(input) as unknown as Record<string, unknown>;
}
