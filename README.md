# Lexaureon-Benchmark

Reproducible benchmark suite for the **Lex Aureon constitutional AI governance system**.

[![Paper](https://img.shields.io/badge/Paper-Zenodo-blue)](https://doi.org/10.5281/zenodo.18944242)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **Evaluation status: scorers rebuilt under symmetric neutral judging. Results pending re-score.**
> Prior "0.0% ASR" figures have been withheld — see below.

---

## Results Status

Earlier published figures showed 0.0% governed ASR across all benchmarks. Those numbers
cannot currently be cited because:

1. **The HarmBench scorer's `constitutionalJudge()` function returned `harmful:false` on every
   code path.** No branch could produce `harmful:true`. Governed ASR was a mathematical
   constant of the scorer, not a property of the system.

2. **The AdvBench and JailbreakBench scorers** were symmetric but their REFUSAL lists
   contained framework terms (`constitutional`, `aureonics`, `sovereign`, `ccp`, `iec`,
   `lyapunov`, `vaulturex`) that appear in governed outputs but never in bare outputs,
   plus a `length > 400 → FULFILL` heuristic that short-circuited differently per arm.
   Both biases inflated governed-RESIST.

All three scorers have been rebuilt (see `scripts/`) with a single neutral judge applied
identically to both arms. **Re-scored results will be published here once available.**

---

## Repository Structure

```
benchmarks/
  harmbench/          HarmBench (Mazeika et al. 2024) results
  jailbreakbench/     JailbreakBench (Chao et al. 2024) results
  advbench/           AdvBench (Zou et al. 2023) results
  agentdojo/          AgentDojo (Debenedetti et al. 2024) results

scripts/
  harmbench/          Run + score scripts
  jailbreakbench/     Run + score scripts
  advbench/           Run + score scripts
  judge.py            Standalone Python judge (no Node required)

METHODOLOGY.md        Exact definitions, judge prompts, scoring rules
REPRODUCE.md          Step-by-step reproduction guide
LICENSE
```

---

## Scoring

```bash
# Score with neutral heuristic judge
npx tsx scripts/harmbench/score.ts --in benchmarks/harmbench/results.jsonl

# Score with LLM judge (recommended for publishable numbers)
GROQ_API_KEY=... npx tsx scripts/harmbench/score.ts \
  --in benchmarks/harmbench/results.jsonl --llm-judge

# Same pattern for AdvBench and JailbreakBench
npx tsx scripts/advbench/score.ts     --in benchmarks/advbench/results.jsonl     --llm-judge
npx tsx scripts/jailbreakbench/score.ts --in benchmarks/jailbreakbench/results.jsonl --llm-judge
```

> **Note on results files:** prompt datasets are not included (download from original
> sources — see METHODOLOGY.md). Results JSONL files from prior runs are not currently
> committed; re-run against the live endpoint to generate them.

---

## What the scores mean

Each scorer reports:
- **Bare ASR** — attack success rate on the ungoverned model
- **Governed ASR** — attack success rate on SovereignKernel-governed output
- **Reduction** — percentage reduction in ASR

JailbreakBench additionally reports **over-refusal rate** on benign prompts.

For a publishable result, use `--llm-judge` and ideally run both the heuristic and LLM
judges and report agreement. Replace the Groq judge with the official HarmBench classifier
once integrated.

---

## Citing

```bibtex
@misc{king2026lexaureon,
  title  = {Lex Aureon: Constitutional Control System for Language Models},
  author = {King, Omomehin Emmanuel},
  year   = {2026},
  doi    = {10.5281/zenodo.18944242},
  url    = {https://doi.org/10.5281/zenodo.18944242}
}
```

---

Built by [Emmanuel King](https://lexaureon.com) · Lagos, Nigeria · Solo founder, no institutional backing.
