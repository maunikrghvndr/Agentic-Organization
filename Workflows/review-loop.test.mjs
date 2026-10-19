// Stub runtime for Workflows/review-loop.js: strips the meta export, wraps the body in an AsyncFunction with
// fake agent/parallel/pipeline/phase/log/args, and runs four scenarios. Deterministic glue only; no model calls.
import fs from 'node:fs'
const src = fs.readFileSync(process.argv[2], 'utf8')
const body = src.replace(/export const meta = \{[\s\S]*?\n\}\n/, '')
const AsyncFunction = (async () => {}).constructor

function run(args, script) {
  const calls = []
  const agent = async (prompt, opts = {}) => { calls.push(opts.label); return script(opts.label, prompt, opts) }
  const parallel = async thunks => Promise.all(thunks.map(t => t().catch(() => null)))
  const pipeline = async () => { throw new Error('unused') }
  const phase = () => {}
  const log = () => {}
  const fn = new AsyncFunction('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', body)
  return fn(agent, parallel, pipeline, phase, log, args).then(r => ({ r, calls }), e => ({ e: e.message, calls }))
}
const base = { taskFile: '.ai-memory/TASKS/x.md', baseline: 'abc123', engineerRole: 'backend-engineer', reviewers: ['backend-reviewer'], securitySensitive: true }
const f = (file, summary, verification) => ({ file, line: 1, summary, verification, ac: 'AC-1' })
let fail = 0
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`); if (!ok) fail++ }

// A: round 1 has one Confirmed + one Unverified blocking (demoted); fix resolves; round 2 clean.
{
  const { r, calls, e } = await run(base, label => {
    if (label.endsWith('r1') && !label.includes('fix')) return { blocking: [f('a.cs', 'Missing null check', 'Confirmed'), f('b.cs', 'Maybe slow', 'Unverified')], nonBlocking: [] }
    if (label.includes('fix')) return { fixed: [{ key: 'a.cs::missing null check', summary: 'added guard', evidence: 'dotnet test | scope | 0 | sha' }], disagreed: [] }
    return { blocking: [], nonBlocking: [] }
  })
  check('A no error', !e, e)
  check('A rounds=2', r && r.rounds === 2)
  check('A security-engineer included', calls.includes('security-engineer r1'))
  check('A demoted unverified flagged', r && r.flagged.some(x => /demoted/.test(x.issue)))
  check('A complete && !exhausted', r && r.complete && !r.exhausted && r.blocking.length === 0)
  check('A debugger not called', !calls.some(c => c.startsWith('debugger')))
}
// B: same Confirmed finding every round -> 3 rounds, exhausted, debugger opens Fix 2, two fixes.
{
  const { r, calls, e } = await run({ ...base, securitySensitive: false, qa: true }, label => {
    if (label.includes('fix')) return { fixed: [], disagreed: [{ key: 'a.cs::missing null check', reason: 'by design' }] }
    if (label.startsWith('debugger')) return 'root cause: guard is in the wrong layer'
    return { blocking: [f('a.cs', 'Missing null check', 'Confirmed')], nonBlocking: [] }
  })
  check('B no error', !e, e)
  check('B rounds=3 exhausted', r && r.rounds === 3 && r.exhausted)
  check('B qa-engineer included', calls.includes('qa-engineer r1'))
  check('B debugger called once before fix 2', calls.filter(c => c.startsWith('debugger')).length === 1 && calls.indexOf('debugger r2') < calls.indexOf('backend-engineer fix r2'))
  check('B two fixes with diagnosis on second', r && r.fixes.length === 2 && r.fixes[1].diagnosis && !r.fixes[0].diagnosis)
  check('B dedup reportedBy both reviewers', r && r.blocking[0].reportedBy.length === 2)
}
// C: one reviewer returns null (stopped/failed) -> flagged, complete=false, never silently dropped.
{
  const { r, e } = await run({ ...base, reviewers: ['backend-reviewer', 'frontend-reviewer'], securitySensitive: false }, label => {
    if (label.startsWith('frontend')) return null
    return { blocking: [], nonBlocking: [] }
  })
  check('C no error', !e, e)
  check('C null reviewer flagged and incomplete', r && !r.complete && r.flagged.some(x => x.role === 'frontend-reviewer' && /no result/.test(x.issue)))
  check('C history records missing reviewer', r && r.history[0].reviewersWithoutResult.includes('frontend-reviewer'))
}
// D: missing args and unknown reviewer throw before any agent runs.
{
  const d1 = await run({ taskFile: 'x' }, () => ({}))
  check('D missing args throws, no agents', /missing args/.test(d1.e || '') && d1.calls.length === 0, d1.e)
  const d2 = await run({ ...base, reviewers: ['analyst'] }, () => ({}))
  check('D unknown reviewer throws', /unknown reviewer/.test(d2.e || ''), d2.e)
}
console.log(fail ? `${fail} FAILED` : 'ALL PASS')
process.exit(fail ? 1 : 0)
