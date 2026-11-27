import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { installApiMock } from './apiMock.js';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  installApiMock();
});

afterEach(() => {
  cleanup();
});
