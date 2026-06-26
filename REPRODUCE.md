# Reproduction Guide

Step-by-step instructions to reproduce Lex Aureon benchmark results from scratch.

---

## Prerequisites

```bash
node >= 20
npm >= 9
A Groq API key (free tier works for bare-arm judge)
```

---

## Step 1 — Clone this repo

```bash
git clone https://github.com/omomehinemmanuel5-boop/Lexaureon-Benchmark
cd Lexaureon-Benchmark
npm install
```

---

## Step 2 — Get the prompt datasets

**HarmBench**
```bash
pip install datasets
python3 -c "
from datasets import load_dataset
import json
ds = load_dataset('walledai/HarmBench', split='train')
with open('data/harmbench.jsonl', 'w') as f:
    for i, row in enumerate(ds):
        f.write(json.dumps({'id': str(i), 'behavior': row['behavior'], 'category': row.get('SemanticCategory','')}) + '\n')
print(f'Saved {len(ds)} behaviors')
"
```

**AdvBench**
```bash
curl -o data/advbench_raw.csv \
  https://raw.githubusercontent.com/llm-attacks/llm-attacks/main/data/advbench/harmful_behaviors.csv

python3 -c "
import csv, json
with open('data/advbench_raw.csv') as f, open('data/advbench.jsonl','w') as out:
    for i, row in enumerate(csv.DictReader(f)):
        out.write(json.dumps({'id': str(i), 'behavior': row['goal']}) + '\n')
"
```

**JailbreakBench**
```bash
pip install jailbreakbench
python3 -c "
import jailbreakbench as jbb, json
behaviors = jbb.read_dataset().behaviors
with open('data/jailbreakbench.jsonl','w') as f:
    for b in behaviors:
        f.write(json.dumps({'id': b.behavior_id, 'behavior': b.goal}) + '\n')
"
```

---

## Step 3 — Run benchmarks

```bash
export LEX_ENDPOINT=https://lexaureon.com   # or http://localhost:3000

# HarmBench (200 prompts, ~17 min)
npx tsx scripts/harmbench/run.ts --prompts data/harmbench.jsonl --n 200

# AdvBench (520 prompts, ~45 min)
npx tsx scripts/advbench/run.ts --prompts data/advbench.jsonl

# JailbreakBench (200 prompts, ~17 min)
npx tsx scripts/jailbreakbench/run.ts --prompts data/jailbreakbench.jsonl --n 200
```

Results are saved to `data/` as timestamped JSONL files.

---

## Step 4 — Score results

```bash
# Score without re-running (uses included results files)
npx tsx scripts/harmbench/score.ts --in benchmarks/harmbench/results.jsonl
npx tsx scripts/advbench/score.ts --in benchmarks/advbench/results.jsonl
npx tsx scripts/jailbreakbench/score.ts --in benchmarks/jailbreakbench/results.jsonl

# Or score your own fresh run
npx tsx scripts/harmbench/score.ts --in data/harmbench-results-*.jsonl
```

---

## Step 5 — Verify against published numbers

Expected output for HarmBench:
```
Attack Success Rate — Constitutional Scoring
bare (ungoverned Llama):      49.5%  (99/200)
anchored (sys-prompt only):   ~30%
governed (SovereignKernel):   0.0%   (0/200)
```

If your numbers differ significantly, check:
- Kernel version (commit hash in results JSONL metadata)
- Session isolation (each prompt needs a fresh session_id)
- Rate limiting (add --delay 5000 between prompts)

---

## Re-scoring Without Re-running

The included `benchmarks/*/results.jsonl` files contain constitutional metrics
(M, CBF trigger, intervention status, semantic signal) embedded per row.
The scorer reads these directly — no API calls needed to reproduce the ASR numbers.

```bash
# Full rescore of all benchmarks, no API key needed
for b in harmbench jailbreakbench advbench; do
  npx tsx scripts/$b/score.ts --in benchmarks/$b/results.jsonl
done
```