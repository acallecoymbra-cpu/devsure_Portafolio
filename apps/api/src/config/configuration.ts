import { validateEnvironment } from './env.validation';

export default () => {
  const environment = validateEnvironment(process.env);

  return {
    nodeEnv: environment.NODE_ENV,
    http: {
      port: environment.API_PORT,
      prefix: environment.API_PREFIX,
      corsOrigins: environment.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      bodyLimit: environment.BODY_LIMIT
    },
    database: {
      type: environment.DATABASE_TYPE,
      path: environment.DATABASE_URL,
      logging: environment.DATABASE_LOGGING
    },
    swagger: {
      enabled: environment.SWAGGER_ENABLED
    }
  };
};
