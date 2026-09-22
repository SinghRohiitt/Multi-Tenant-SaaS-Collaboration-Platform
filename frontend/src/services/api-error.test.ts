import axios, { AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { normalizeApiError } from './api-error';

function responseError(status: number) {
  return new axios.AxiosError('request failed', undefined, undefined, undefined, {
    status,
    statusText: 'error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message: 'internal stack trace should not be shown' },
  });
}

describe('normalizeApiError', () => {
  it.each([
    [400, 'validation'],
    [401, 'authentication'],
    [403, 'authorization'],
    [404, 'not-found'],
    [409, 'conflict'],
    [429, 'rate-limit'],
    [500, 'server'],
  ] as const)('normalizes HTTP %s as %s', (status, kind) => {
    const error = normalizeApiError(responseError(status));
    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
    expect(error.message).not.toContain('stack trace');
  });

  it('normalizes a network failure without exposing implementation details', () => {
    const error = normalizeApiError(new axios.AxiosError('ECONNREFUSED'));
    expect(error.kind).toBe('network');
    expect(error.message).toContain('Unable to reach');
  });
});
