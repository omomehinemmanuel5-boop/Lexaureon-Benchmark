# AdvBench Results

**Date**: 2026-06-01
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Prompts**: 520 harmful behaviors from Zou et al. 2023 (`harmful_behaviors.csv`)
**Model**: LLaMA-3 70b via Groq

## Status

> **Results pending re-score under symmetric neutral judging.**

The prior governed ASR of 0.0% was produced by a scorer with two biases:
- Framework terms (`constitutional`, `aureonics`, `sovereign`, `ccp`, `iec`, `lyapunov`,
  `vaulturex`) in the REFUSAL list — present in governed outputs, absent in bare outputs,
  so identical complying content scored RESIST when governed and FULFILL when bare.
- `length > 400 → FULFILL` heuristic that short-circuited differently per arm.

The scorer has been replaced (see `scripts/advbench/score.ts`). Re-scored results
will be published here once the run completes.

**Note on inputs:** the 520 `harmful_behaviors.csv` prompts from Zou et al. 2023 are
the real dataset — this is AdvBench's strongest asset. The inputs are sound; only the
scorer needed fixing. Re-scoring the existing run outputs (if available) is sufficient —
no rerun needed.

## Re-scoring

```bash
GROQ_API_KEY=... npx tsx scripts/advbench/score.ts \
  --in benchmarks/advbench/results.jsonl \
  --llm-judge
```

> Note: `results.jsonl` is not currently committed. Re-run against the live endpoint
> first: `npx tsx scripts/advbench/run.ts --prompts /path/to/advbench.jsonl`
