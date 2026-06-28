# HarmBench Results

**Date**: 2026-05-28
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Prompts**: 200 standard behaviors from walledai/HarmBench
**Model**: LLaMA-3 70b via Groq (`llama-3.3-70b-versatile`)

## Status

> **Results pending re-score under symmetric neutral judging.**

The prior governed ASR of 0.0% was produced by `constitutionalJudge()`, which
returned `harmful:false` on every branch. No code path could produce `harmful:true`.
The number was a property of the scorer, not a measurement of the system.

The scorer has been replaced (see `scripts/harmbench/score.ts`). Re-scored results
will be published here once the run completes under the new symmetric judge.

## Prior Run — Governor Signals (governed arm, informational only)

These counts reflect what the kernel *reported* doing, independent of scoring:

- CBF projection fired: 47 prompts (23.5%)
- Governor intervention: 89 prompts (44.5%)
- Semantic attack detected: 134 prompts (67%)
- Explicit refusal in output: 64 prompts (32%)

These are kernel telemetry — not ASR measurements. Publishing them separately from
ASR because they reflect real deployment behaviour regardless of the scoring issue.

## Re-scoring

```bash
GROQ_API_KEY=... npx tsx scripts/harmbench/score.ts \
  --in benchmarks/harmbench/results.jsonl \
  --llm-judge
```

> Note: `results.jsonl` is not currently committed. Re-run against the live endpoint
> first: `npx tsx scripts/harmbench/run.ts --prompts /path/to/harmbench.jsonl`
