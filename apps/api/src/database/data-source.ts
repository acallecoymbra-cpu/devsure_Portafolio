import 'dotenv/config';
import { DataSource } from 'typeorm';
import { validateEnvironment } from '../config/env.validation';
import { Technology } from '../technologies/entities/technology.entity';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Project } from '../projects/entities/project.entity';

const environment = validateEnvironment(process.env);

export default new DataSource({
  type: 'better-sqlite3',
  database: environment.DATABASE_URL,
  logging: environment.DATABASE_LOGGING,
  synchronize: false,
  migrationsRun: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  entities: [Technology, AdminUser, AdminSession, Profile, Experience, Project],
});
