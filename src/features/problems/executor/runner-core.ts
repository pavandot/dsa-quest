import type { RunSummary, TestCase, TestResult } from './types'

/** Structural equality: primitives, NaN, arrays, plain objects. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object)
    const kb = Object.keys(b as object)
    if (ka.length !== kb.length) return false
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    )
  }
  return false
}

/**
 * Compiles user code and runs every test case. Pure and environment-agnostic:
 * the Web Worker calls it in the browser, the test suite calls it in Node.
 * Time limits are enforced OUTSIDE (worker termination) — a synchronous
 * infinite loop cannot be interrupted from within its own thread.
 */
export function runTests(code: string, functionName: string, tests: TestCase[]): RunSummary {
  const t0 = globalThis.performance.now()
  let fn: unknown

  try {
    // strict-mode function scope: user code can't leak accidental globals
    fn = new Function(
      `"use strict";\n${code}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`
    )()
  } catch (e) {
    return setupFailure(tests, `Syntax error: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (typeof fn !== 'function') {
    return setupFailure(
      tests,
      `Function "${functionName}" was not found — keep the starter function name.`
    )
  }

  let sawError = false
  const results: TestResult[] = tests.map((t) => {
    const start = globalThis.performance.now()
    try {
      // clone inputs so a mutating solution can't corrupt later tests
      const output = (fn as (...args: unknown[]) => unknown)(...structuredClone(t.input))
      const timeMs = globalThis.performance.now() - start
      return {
        passed: deepEqual(output, t.expected),
        output,
        expected: t.expected,
        timeMs,
        hidden: t.hidden ?? false,
      }
    } catch (e) {
      sawError = true
      return {
        passed: false,
        expected: t.expected,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
        timeMs: globalThis.performance.now() - start,
        hidden: t.hidden ?? false,
      }
    }
  })

  const passedCount = results.filter((r) => r.passed).length
  return {
    verdict: passedCount === tests.length ? 'passed' : sawError ? 'error' : 'failed',
    results,
    passedCount,
    totalCount: tests.length,
    totalTimeMs: globalThis.performance.now() - t0,
  }
}

function setupFailure(tests: TestCase[], message: string): RunSummary {
  return {
    verdict: 'error',
    results: [],
    passedCount: 0,
    totalCount: tests.length,
    totalTimeMs: 0,
    setupError: message,
  }
}
