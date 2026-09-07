import * as Joi from 'joi';

export interface AppEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  API_PORT: number;
  API_PREFIX: string;
  CORS_ORIGINS: string;
  DATABASE_TYPE: 'sqlite';
  DATABASE_URL: string;
  DATABASE_LOGGING: boolean;
  SWAGGER_ENABLED: boolean;
  BODY_LIMIT: string;
  AUTH_SESSION_TTL_SECONDS: number;
  AUTH_LOGIN_WINDOW_SECONDS: number;
  AUTH_LOGIN_MAX_ATTEMPTS: number;
}

const environmentSchema = Joi.object<AppEnvironment>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  API_PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string()
    .pattern(/^[a-zA-Z0-9/_-]+$/)
    .default('api/v1'),
  CORS_ORIGINS: Joi.string().allow('').default('http://localhost:3000'),
  DATABASE_TYPE: Joi.string().valid('sqlite').default('sqlite'),
  DATABASE_URL: Joi.string().min(1).default('./.data/devsure.sqlite'),
  DATABASE_LOGGING: Joi.boolean().default(false),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  BODY_LIMIT: Joi.string()
    .pattern(/^\d+(b|kb|mb|gb)$/i)
    .default('1mb'),
  AUTH_SESSION_TTL_SECONDS: Joi.number().integer().min(300).max(2592000).default(28800),
  AUTH_LOGIN_WINDOW_SECONDS: Joi.number().integer().min(1).max(3600).default(60),
  AUTH_LOGIN_MAX_ATTEMPTS: Joi.number().integer().min(1).max(100).default(5),
}).unknown(false);

export function validateEnvironment(input: Record<string, unknown>): AppEnvironment {
  const values = {
    NODE_ENV: input.NODE_ENV,
    API_PORT: input.API_PORT,
    API_PREFIX: input.API_PREFIX,
    CORS_ORIGINS: input.CORS_ORIGINS,
    DATABASE_TYPE: input.DATABASE_TYPE,
    DATABASE_URL: input.DATABASE_URL,
    DATABASE_LOGGING: input.DATABASE_LOGGING,
    SWAGGER_ENABLED: input.SWAGGER_ENABLED,
    BODY_LIMIT: input.BODY_LIMIT,
    AUTH_SESSION_TTL_SECONDS: input.AUTH_SESSION_TTL_SECONDS,
    AUTH_LOGIN_WINDOW_SECONDS: input.AUTH_LOGIN_WINDOW_SECONDS,
    AUTH_LOGIN_MAX_ATTEMPTS: input.AUTH_LOGIN_MAX_ATTEMPTS,
  };
  const { error, value } = environmentSchema.validate(values, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  return value as AppEnvironment;
}
