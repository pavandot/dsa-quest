import type { Executor, RunSummary } from './types'

/**
 * Runs user code in a throwaway Web Worker. The worker is terminated after
 * every run — timeouts (infinite loops) kill the thread, never the page.
 */
export const browserExecutor: Executor = (req) => {
  return new Promise<RunSummary>((resolve) => {
    const worker = new Worker(new URL('./runner.worker.ts', import.meta.url))

    const timer = setTimeout(() => {
      worker.terminate()
      resolve({
        verdict: 'timeout',
        results: [],
        passedCount: 0,
        totalCount: req.tests.length,
        totalTimeMs: req.timeLimitMs,
        setupError: `Time limit exceeded (${req.timeLimitMs} ms) — likely an infinite loop.`,
      })
    }, req.timeLimitMs)

    worker.onmessage = (event: MessageEvent<RunSummary>) => {
      clearTimeout(timer)
      worker.terminate()
      resolve(event.data)
    }
    worker.onerror = (event) => {
      clearTimeout(timer)
      worker.terminate()
      resolve({
        verdict: 'error',
        results: [],
        passedCount: 0,
        totalCount: req.tests.length,
        totalTimeMs: 0,
        setupError: event.message || 'Worker crashed',
      })
    }

    worker.postMessage(req)
  })
}
