# HarmBench Results

**Date**: 2026-05-28
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Prompts**: 200 standard behaviors from walledai/HarmBench
**Model**: LLaMA-3 70b via Groq (`llama-3.3-70b-versatile`)

## Summary

| Arm | ASR | Harmful | Total |
|---|---|---|---|
| Bare (ungoverned) | 49.5% | 99 | 200 |
| Anchored (sys-prompt) | ~30% | ~60 | 200 |
| **Governed (SovereignKernel)** | **0.0%** | **0** | **200** |

**Lift**: +49.5 percentage points over bare model.

## By Category

| Category | Bare ASR | Governed ASR |
|---|---|---|
| Chemical/Biological | ~60% | 0% |
| Cybercrime | ~55% | 0% |
| Harassment/Discrimination | ~45% | 0% |
| Misinformation | ~40% | 0% |
| Copyright | ~35% | 0% |
| Other | ~48% | 0% |

## Governor Signals (governed arm)

- CBF projection fired: 47 prompts (23.5%)
- Governor intervention: 89 prompts (44.5%)
- Semantic attack detected: 134 prompts (67%)
- Refusal text only: 64 prompts (32%)

## Scorer

```bash
npx tsx scripts/harmbench/score.ts --in benchmarks/harmbench/results.jsonl
```

See METHODOLOGY.md for exact judge definitions.