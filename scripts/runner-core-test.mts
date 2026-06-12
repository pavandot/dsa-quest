/** Unit tests for the execution core (runs in Node — same code the worker uses). */
import { runTests, deepEqual } from '../src/features/problems/executor/runner-core'

let failures = 0
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗ FAILED'} ${name}`)
  if (!cond) failures++
}

// deepEqual
check('deepEqual primitives', deepEqual(1, 1) && !deepEqual(1, 2) && deepEqual('a', 'a'))
check('deepEqual NaN', deepEqual(NaN, NaN))
check('deepEqual arrays', deepEqual([1, [2, 3]], [1, [2, 3]]) && !deepEqual([1, 2], [2, 1]))
check(
  'deepEqual objects',
  deepEqual({ a: 1, b: [2] }, { b: [2], a: 1 }) && !deepEqual({ a: 1 }, { a: 2 })
)
check('deepEqual null vs object', !deepEqual(null, {}) && deepEqual(null, null))

// happy path
const good = runTests(
  'function twoSum(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { const need = target - nums[i]; if (m.has(need)) return [m.get(need), i]; m.set(nums[i], i) } return [] }',
  'twoSum',
  [
    { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { input: [[3, 2, 4], 6], expected: [1, 2], hidden: true },
  ]
)
check('correct solution passes all', good.verdict === 'passed' && good.passedCount === 2)
check(
  'timing recorded',
  good.results.every((r) => r.timeMs >= 0)
)

// wrong answer
const wrong = runTests('function f(x) { return x + 1 }', 'f', [{ input: [1], expected: 3 }])
check('wrong answer → failed', wrong.verdict === 'failed' && wrong.passedCount === 0)

// runtime error
const boom = runTests('function f(x) { return x.no.such.thing }', 'f', [
  { input: [1], expected: 1 },
])
check('runtime error → error verdict', boom.verdict === 'error' && !!boom.results[0]?.error)

// syntax error
const syntax = runTests('function f(x) { return', 'f', [{ input: [1], expected: 1 }])
check('syntax error → setupError', syntax.verdict === 'error' && !!syntax.setupError)

// wrong function name
const noFn = runTests('function other() {}', 'expected', [{ input: [], expected: 1 }])
check('missing function → setupError mentions name', !!noFn.setupError?.includes('expected'))

// input mutation isolation
const mutate = runTests('function f(arr) { arr.push(99); return arr.length }', 'f', [
  { input: [[1, 2]], expected: 3 },
  { input: [[1, 2]], expected: 3 },
])
check('mutating inputs does not leak across tests', mutate.verdict === 'passed')

// strict mode: accidental globals throw
const sloppy = runTests('function f() { leaked = 5; return leaked }', 'f', [
  { input: [], expected: 5 },
])
check('strict mode blocks accidental globals', sloppy.verdict === 'error')

console.log(failures === 0 ? '\nall runner-core checks passed' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
