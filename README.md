# Lexaureon-Benchmark

Reproducible benchmark suite and methodology reference for the **Lex Aureon constitutional AI governance system**.

[![Paper](https://img.shields.io/badge/Paper-Zenodo-blue)](https://doi.org/10.5281/zenodo.18944242)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Live Results](https://img.shields.io/badge/live%20results-lexaureon.com%2Fbenchmarks-gold)](https://lexaureon.com/benchmarks)

> **Status update (2026-07-11): real, published, full-scale results now exist.**
> The "0.0% ASR withheld" status below describes real history — those old scorers
> genuinely were broken, in the specific ways documented — but that status is no
> longer current. Live, current numbers across seven benchmarks are published at
> **[lexaureon.com/benchmarks](https://lexaureon.com/benchmarks)** and via
> `GET https://www.lexaureon.com/api/benchmarks`, and are kept current automatically —
> that endpoint is the single source of truth, not this README.

---

## Where the active evaluation pipeline actually lives

As of 2026-07, the actively maintained runner, judges, aggregator, and publisher live in
the main **[LEX-Aureon](https://github.com/omomehinemmanuel5-boop/LEX-Aureon)** repository,
under `scripts/lexbench/` — not in this repo's own `scripts/` directory below. That pipeline:

- Runs the same underlying model bare vs. governed (same-model comparison, isolating what
  governance itself changes)
- Uses grounded, benchmark-specific LLM judges (`grounded_judge.ts`, `xstest_judge.ts`,
  `strong_reject_judge.ts`) — not the heuristic/keyword scorers described later in this README
- Publishes directly to the live `benchmark_results` table via an authenticated endpoint, so
  results appear on the live site automatically with no manual step
- Has a documented incident history (a keyword-fallback contamination, a mass provider-outage
  contamination, an undersampled-publish bug) each found, retired, and fixed with a paired
  migration script and a `RETIRED_METRICS` entry — see that repo's README, *Evaluation* section,
  for the full honest account

If you're looking to **reproduce current numbers**, start there:
`git clone https://github.com/omomehinemmanuel5-boop/LEX-Aureon`, then see its README's
*Benchmarks* section for exact commands.

This repository remains useful for: dataset source references, the original methodology
write-up below, and the historical record of what the earlier scorer architecture got wrong
and why — kept deliberately, not deleted, in the same spirit the main repo keeps its own
retired benchmark rows rather than erasing them.

---

## Original Results Status (historical — kept for the record)

Earlier published figures showed 0.0% governed ASR across all benchmarks. Those numbers
could not be cited because:

1. **The HarmBench scorer's `constitutionalJudge()` function returned `harmful:false` on every
   code path.** No branch could produce `harmful:true`. Governed ASR was a mathematical
   constant of the scorer, not a property of the system.

2. **The AdvBench and JailbreakBench scorers** were symmetric but their REFUSAL lists
   contained framework terms (`constitutional`, `aureonics`, `sovereign`, `ccp`, `iec`,
   `lyapunov`, `vaulturex`) that appear in governed outputs but never in bare outputs,
   plus a `length > 400 → FULFILL` heuristic that short-circuited differently per arm.
   Both biases inflated governed-RESIST.

This is genuine project history, not a currently-open problem — the replacement judges in
the active LEX-Aureon pipeline (see above) don't share this architecture. Kept here as an
honest record of what was wrong and why, matching the standard the rest of this project
holds itself to.

---

## Repository Structure

```
benchmarks/
  harmbench/          HarmBench (Mazeika et al. 2024) results
  jailbreakbench/     JailbreakBench (Chao et al. 2024) results
  advbench/           AdvBench (Zou et al. 2023) results
  agentdojo/          AgentDojo (Debenedetti et al. 2024) results

scripts/
  harmbench/          Run + score scripts (earlier architecture -- see note above)
  jailbreakbench/     Run + score scripts (earlier architecture -- see note above)
  advbench/           Run + score scripts (earlier architecture -- see note above)
  judge.py            Standalone Python judge (no Node required)

METHODOLOGY.md        Exact definitions, judge prompts, scoring rules
REPRODUCE.md          Step-by-step reproduction guide
LICENSE
```

> **Note:** the scripts under `scripts/` in this repo reflect the earlier scorer
> architecture described above, kept for historical reference and dataset-source
> documentation. For current, actively-maintained scoring, use the LEX-Aureon
> repository's `scripts/lexbench/` pipeline linked above.

---

## Datasets

Prompt datasets are not included in either repository (harmful-content datasets are
intentionally excluded from version control — see each repo's `.gitignore`). Download from
original sources:

- **AdvBench** (Zou et al. 2023) — `harmful_behaviors.csv`, 520 behaviors
- **HarmBench** (Mazeika et al. 2024) — official `walledai/HarmBench` dataset
- **JailbreakBench** (Chao et al. 2024) — JBB-Behaviors dataset
- **AgentDojo** (Debenedetti et al. 2024) — injection scenario dataset
- **TruthfulQA** — full dataset with `correct_answers`/`incorrect_answers`/`best_answer` fields
- **XSTest** (Röttger et al., NAACL 2024) — benign-prompt over-refusal set
- **StrongREJECT** (Souly et al. 2024) — refusal-severity behavior set

See `METHODOLOGY.md` for exact source links and licensing notes.

---

## What the current live scores mean

Each metric on [lexaureon.com/benchmarks](https://lexaureon.com/benchmarks) reports a
**within-system delta**: the same underlying model, bare (no system prompt) vs. governed
(same call, governed) — isolating what governance itself changes, not model choice. These
are **not** cross-system leaderboard claims; different judges and base models make
comparison to other papers' published scores on the same benchmark names invalid without
controlling for both.

Attack-success-rate metrics (AdvBench, HarmBench, JailbreakBench) are better **lower**.
Every other metric (TruthfulQA, AgentDojo-proxy, XSTest, StrongREJECT) is better **higher**.
The live dashboard tags each metric with its direction explicitly.

AgentDojo's live number is an explicit proxy, not the official dual utility+security
methodology — see the main repo's README for the full caveat before citing it.

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
