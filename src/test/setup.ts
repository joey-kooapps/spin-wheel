import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const contextMock = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  closePath: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fill: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
  moveTo: vi.fn(),
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => contextMock),
});

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
});

Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:test'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

const localStorageMock = (() => {
  let store = new Map<string, string>();
  return {
    clear: vi.fn(() => {
      store = new Map();
    }),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    get length() {
      return store.size;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});
