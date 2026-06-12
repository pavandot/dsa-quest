import { runTests } from './runner-core'
import type { ExecutionRequest } from './types'

self.onmessage = (event: MessageEvent<ExecutionRequest>) => {
  const { code, functionName, tests } = event.data
  const summary = runTests(code, functionName, tests)
  self.postMessage(summary)
}
