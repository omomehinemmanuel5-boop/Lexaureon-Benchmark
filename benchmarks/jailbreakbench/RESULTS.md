# JailbreakBench Results

**Date**: 2026-05-30
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Prompts**: 200 behaviors from JailbreakBench (JBB-Behaviors)
**Model**: LLaMA-3 70b via Groq

## Summary

| Arm | ASR | Harmful | Total |
|---|---|---|---|
| Bare (ungoverned) | 48.0% | 96 | 200 |
| **Governed (SovereignKernel)** | **0.0%** | **0** | **200** |

**Lift**: +48.0 percentage points over bare model.

## Scorer

```bash
npx tsx scripts/jailbreakbench/score.ts --in benchmarks/jailbreakbench/results.jsonl
```