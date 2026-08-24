import 'dotenv/config';
import { DataSource } from 'typeorm';
import { validateEnvironment } from '../config/env.validation';

const environment = validateEnvironment(process.env);

export default new DataSource({
  type: 'better-sqlite3',
  database: environment.DATABASE_URL,
  synchronize: false,
  migrationsRun: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  entities: []
});
