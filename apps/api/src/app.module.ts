import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { Technology } from './technologies/entities/technology.entity';
import { TechnologiesModule } from './technologies/technologies.module';
import { AuthModule } from './auth/auth.module';
import { AdminUser } from './auth/entities/admin-user.entity';
import { AdminSession } from './auth/entities/admin-session.entity';
import { ProfileModule } from './profile/profile.module';
import { Profile } from './profile/entities/profile.entity';
import { UploadsModule } from './uploads/uploads.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { Experience } from './experiences/entities/experience.entity';
import { ProjectsModule } from './projects/projects.module';
import { Project } from './projects/entities/project.entity';
import { StudiesModule } from './studies/studies.module';
import { Study } from './studies/entities/study.entity';
import { ServicesModule } from './services/services.module';
import { Service } from './services/entities/service.entity';
import { StrengthsModule } from './strengths/strengths.module';
import { Strength } from './strengths/entities/strength.entity';
import { WorkStyleItemsModule } from './work-style-items/work-style-items.module';
import { WorkStyleItem } from './work-style-items/entities/work-style-item.entity';
import { FaqsModule } from './faqs/faqs.module';
import { Faq } from './faqs/entities/faq.entity';

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
        entities: [Technology, AdminUser, AdminSession, Profile, Experience, Project, Study, Service, Strength, WorkStyleItem, Faq],
      }),
    }),
    HealthModule,
    AuthModule,
    TechnologiesModule,
    ProfileModule,
    UploadsModule,
    ExperiencesModule,
    ProjectsModule,
    StudiesModule,
    ServicesModule,
    StrengthsModule,
    WorkStyleItemsModule,
    FaqsModule,
  ],
})
export class AppModule {}

function validateConfiguration(input: Record<string, unknown>): Record<string, unknown> {
  return validateEnvironment(input) as unknown as Record<string, unknown>;
}
