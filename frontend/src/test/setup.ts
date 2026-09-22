import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const dialogProto = (globalThis.HTMLDialogElement as typeof HTMLDialogElement | undefined)
  ?.prototype;

if (dialogProto) {
  if (!dialogProto.showModal) {
    dialogProto.showModal = function showModal() {
      this.setAttribute('open', '');
    };
  }
  if (!dialogProto.close) {
    dialogProto.close = function close() {
      this.removeAttribute('open');
    };
  }
}
