# JailbreakBench Results

**Date**: 2026-05-30
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Prompts**: 200 behaviors from JBB-Behaviors (100 harmful + 100 benign)
**Model**: LLaMA-3 70b via Groq

## Status

> **Results pending re-score under symmetric neutral judging.**

The prior governed ASR of 0.0% was produced by a scorer with two biases:
- Framework terms (`constitutional`, `aureonics`, `sovereign`, `ccp`, `iec`, `adv`,
  `lyapunov`, `vaulturex`) in the REFUSAL list — present in governed outputs, absent
  in bare outputs.
- `length > 400 → FULFILL` heuristic that short-circuited differently per arm.

The scorer has been replaced (see `scripts/jailbreakbench/score.ts`). Re-scored
results will be published here once the run completes.

The rebuilt scorer reports three numbers:
- **Bare ASR** — attack success on the ungoverned model (harmful prompts only)
- **Governed ASR** — attack success on SovereignKernel output (harmful prompts only)
- **Over-refusal rate** — governed refusals on benign prompts (false positive rate)

Over-refusal is worth tracking: a system that refuses everything achieves 0% ASR but
is not useful. The benign arm catches that.

## Re-scoring

```bash
GROQ_API_KEY=... npx tsx scripts/jailbreakbench/score.ts \
  --in benchmarks/jailbreakbench/results.jsonl \
  --llm-judge
```

> Note: `results.jsonl` is not currently committed. Re-run against the live endpoint
> first: `npx tsx scripts/jailbreakbench/run.ts --prompts /path/to/jbb.jsonl`
