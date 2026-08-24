import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('applies safe defaults', () => {
    expect(validateEnvironment({})).toMatchObject({
      NODE_ENV: 'development',
      API_PORT: 3001,
      API_PREFIX: 'api/v1',
      CORS_ORIGINS: 'http://localhost:3000',
      DATABASE_TYPE: 'sqlite',
      DATABASE_URL: './.data/devsure.sqlite',
      DATABASE_LOGGING: false,
      SWAGGER_ENABLED: true,
      BODY_LIMIT: '1mb',
    });
  });

  it('rejects invalid values', () => {
    expect(() =>
      validateEnvironment({
        API_PORT: 'not-a-port',
        BODY_LIMIT: 'unbounded',
      }),
    ).toThrow('Invalid environment configuration');
  });
});
