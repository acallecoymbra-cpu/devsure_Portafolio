import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a healthy API response', () => {
    const response = new HealthController().getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('devsure-api');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
