// Minimal type shim for bun:test so tsc doesn't error.
// Bun's test runner resolves bun:test natively at runtime.
declare module "bun:test" {
  export function describe(label: string, fn: () => void): void
  export function it(label: string, fn: () => void | Promise<void>): void
  export function test(label: string, fn: () => void | Promise<void>): void
  export function expect(val: unknown): {
    toBe(expected: unknown): void
    toEqual(expected: unknown): void
    toBeTruthy(): void
    toBeFalsy(): void
    toThrow(): void
    not: {
      toBe(expected: unknown): void
      toThrow(): void
    }
  }
  export function beforeEach(fn: () => void | Promise<void>): void
  export function afterEach(fn: () => void | Promise<void>): void
  export function beforeAll(fn: () => void | Promise<void>): void
  export function afterAll(fn: () => void | Promise<void>): void
}
