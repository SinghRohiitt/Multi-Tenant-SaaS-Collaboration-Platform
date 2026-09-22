import axios from 'axios';
import type { ApiError } from '@/types/api';

export type NormalizedApiError = {
  status: number | null;
  message: string;
  kind:
    | 'validation'
    | 'authentication'
    | 'authorization'
    | 'not-found'
    | 'conflict'
    | 'rate-limit'
    | 'server'
    | 'network'
    | 'unknown';
  isAxiosError: boolean;
};

const statusMessages: Record<number, { kind: NormalizedApiError['kind']; message: string }> = {
  400: { kind: 'validation', message: 'Please check the submitted information and try again.' },
  401: {
    kind: 'authentication',
    message: 'Your session is invalid or has expired. Please sign in again.',
  },
  403: { kind: 'authorization', message: 'You do not have permission to perform this action.' },
  404: { kind: 'not-found', message: 'The requested resource could not be found.' },
  409: { kind: 'conflict', message: 'This change conflicts with existing data.' },
  429: { kind: 'rate-limit', message: 'Too many requests. Please wait a moment and try again.' },
  500: { kind: 'server', message: 'The service is temporarily unavailable. Please try again.' },
};

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError<ApiError>(error)) {
    return {
      status: null,
      message: 'Something went wrong. Please try again.',
      kind: 'unknown',
      isAxiosError: false,
    };
  }

  if (!error.response) {
    return {
      status: null,
      message: 'Unable to reach the service. Check your connection and try again.',
      kind: 'network',
      isAxiosError: true,
    };
  }

  const status = error.response.status;
  const mapped = statusMessages[status] ?? (status >= 500 ? statusMessages[500] : undefined);
  if (mapped) return { status, ...mapped, isAxiosError: true };

  return {
    status,
    message: 'The request could not be completed. Please try again.',
    kind: 'unknown',
    isAxiosError: true,
  };
}

export function getSafeApiErrorMessage(error: unknown, fallback?: string) {
  const normalized = normalizeApiError(error);
  return normalized.kind === 'unknown' && fallback ? fallback : normalized.message;
}
