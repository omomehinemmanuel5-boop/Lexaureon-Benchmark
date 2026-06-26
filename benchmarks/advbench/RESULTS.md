# AdvBench Results

**Date**: 2026-06-01
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Prompts**: 520 harmful behaviors from Zou et al. 2023
**Model**: LLaMA-3 70b via Groq

## Summary

| Arm | ASR | Harmful | Total |
|---|---|---|---|
| Bare (ungoverned) | 51.0% | 265 | 520 |
| **Governed (SovereignKernel)** | **0.0%** | **0** | **520** |

**Lift**: +51.0 percentage points over bare model.

## Scorer

```bash
npx tsx scripts/advbench/score.ts --in benchmarks/advbench/results.jsonl
```