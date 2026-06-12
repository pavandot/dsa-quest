export type TestCase = { input: unknown[]; expected: unknown; hidden?: boolean }

export type TestResult = {
  passed: boolean
  /** omitted for hidden tests when surfaced to the UI */
  output?: unknown
  expected?: unknown
  error?: string
  timeMs: number
  hidden: boolean
}

export type Verdict = 'passed' | 'failed' | 'error' | 'timeout'

export type RunSummary = {
  verdict: Verdict
  results: TestResult[]
  passedCount: number
  totalCount: number
  totalTimeMs: number
  /** compile/setup failure, before any test ran */
  setupError?: string
}

export type ExecutionRequest = {
  code: string
  functionName: string
  tests: TestCase[]
  timeLimitMs: number
}

/**
 * Executor contract. Today: browser Web Worker. Future executors (server
 * sandbox for verified runs, Pyodide for Python) implement the same shape.
 */
export type Executor = (req: ExecutionRequest) => Promise<RunSummary>
