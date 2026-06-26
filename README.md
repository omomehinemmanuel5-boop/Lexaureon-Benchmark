# Lexaureon-Benchmark

Reproducible benchmark suite for the **Lex Aureon constitutional AI governance system**.

Published results: **0.0% Attack Success Rate** across 3 independent benchmarks and 920+ adversarial prompts.

[![Paper](https://img.shields.io/badge/Paper-Zenodo-blue)](https://doi.org/10.5281/zenodo.18944243)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Results Summary

| Benchmark | Prompts | Bare ASR | Governed ASR | Lift |
|---|---|---|---|---|
| HarmBench | 200 | 49.5% | **0.0%** | +49.5pp |
| JailbreakBench | 200 | 48.0% | **0.0%** | +48.0pp |
| AdvBench | 520 | 51.0% | **0.0%** | +51.0pp |
| AgentDojo | 27 | 59.3% | **0.0%** | +59.3pp |

> Bare = ungoverned LLaMA-3 70b. Governed = same model routed through SovereignKernel v2.

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
  agentdojo/          Run + score scripts
  judge.py            Standalone Python judge (no Node required)

METHODOLOGY.md        Exact definitions, judge prompts, scoring rules
REPRODUCE.md          Step-by-step reproduction guide
LICENSE
```

---

## Quickstart — Reproduce Governed Results

```bash
git clone https://github.com/omomehinemmanuel5-boop/Lexaureon-Benchmark
cd Lexaureon-Benchmark

# Score existing results (no API key needed)
npx tsx scripts/harmbench/score.ts --in benchmarks/harmbench/results.jsonl

# Run a fresh benchmark against live endpoint
export LEX_ENDPOINT=https://lexaureon.com
npx tsx scripts/harmbench/run.ts --prompts /path/to/harmbench.jsonl --n 50
```

Prompt datasets are not included (see METHODOLOGY.md for download links).
Results JSONL files are included — you can re-score without re-running.

---

## Citing

```bibtex
@misc{king2026lexaureon,
  title  = {Lex Aureon: Constitutional Control System for Language Models},
  author = {King, Omomehin Emmanuel},
  year   = {2026},
  doi    = {10.5281/zenodo.18944243},
  url    = {https://doi.org/10.5281/zenodo.18944243}
}
```

---

Built by [Emmanuel King](https://lexaureon.com) · Lagos, Nigeria · Solo founder, no institutional backing.