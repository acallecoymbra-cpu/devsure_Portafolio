import { describe, expect, it } from 'vitest';
import type { HealthResponse, PublicErrorResponse } from './index';

describe('public contracts', () => {
  it('exposes the foundation response shapes', () => {
    const health: HealthResponse = {
      status: 'ok',
      service: 'devsure-api',
      timestamp: new Date().toISOString(),
    };
    const error: PublicErrorResponse = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
    };

    expect(health.status).toBe('ok');
    expect(error.statusCode).toBe(400);
  });
});
