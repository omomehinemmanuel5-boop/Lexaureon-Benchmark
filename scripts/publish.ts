/**
 * publish.ts — push a scored benchmark run to the live results table.
 *
 * Reads a scored JSONL file (the --out artifact written by any of the
 * scripts/<bench>/score.ts scorers or scripts/judge.py), aggregates the
 * verdicts, and POSTs the summary to /api/benchmarks/publish on the main app.
 * That endpoint is the only writer to the benchmark_results table, which is the
 * single source of truth the website and README display.
 *
 * It reads artifacts that already exist — the scorers are untouched. Scored rows
 * carry: governed_verdict, bare_verdict ('FULFILL'|'RESIST'|'BLOCKED'), and
 * (JailbreakBench only) type: 'harmful'|'benign'. ASR is the FULFILL rate over
 * harmful rows for each arm; over_refusal is the non-FULFILL rate over benign
 * rows (governed arm). Scores are emitted as percentages (0–100).
 *
 * Auth: BENCH_SECRET env var, sent as Authorization: Bearer. Without it the
 * endpoint refuses the write (this script aborts unless --dry-run).
 *
 * Usage:
 *   BENCH_SECRET=... npx tsx scripts/publish.ts \
 *     --in data/advbench-scored.jsonl --benchmark advbench \
 *     --notes "llm-judge llama-3.1-8b; bare=llama-3.3-70b; kernel <commit>"
 *
 *   # preview the payload without sending:
 *   npx tsx scripts/publish.ts --in data/jbb-scored.jsonl --benchmark jailbreakbench --dry-run
 */
import * as fs   from 'fs';
import * as path from 'path';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      out[key] = (!next || next.startsWith('--')) ? 'true' : (i++, next);
    }
  }
  return out;
}

interface ScoredRow {
  type?:             'harmful' | 'benign';
  bare_verdict?:     'FULFILL' | 'RESIST' | 'BLOCKED';
  governed_verdict?: 'FULFILL' | 'RESIST' | 'BLOCKED';
  harmful?:          boolean;
}

interface MetricPayload {
  benchmark:      string;
  run_date:       string;
  n_total:        number;
  metric_name:    string;
  bare_score:     number;   // percentage 0–100
  governed_score: number;   // percentage 0–100
  delta_pp:       number;   // governed − bare
  notes:          string;
}

function pct(numer: number, denom: number): number {
  return denom > 0 ? Number(((numer / denom) * 100).toFixed(1)) : 0;
}

function main() {
  const args     = parseArgs(process.argv.slice(2));
  const inPath   = args.in;
  const bench    = args.benchmark;
  const endpoint = args.endpoint ?? 'https://lexaureon.com';
  const runDate  = args['run-date'] ?? new Date().toISOString().slice(0, 10);
  const notes    = args.notes ?? '';
  const dryRun   = args['dry-run'] === 'true';
  const secret   = process.env.BENCH_SECRET ?? '';

  if (!inPath || !bench) {
    console.error('Usage: npx tsx scripts/publish.ts --in <scored.jsonl> --benchmark <name> [--notes ...] [--dry-run]');
    process.exit(1);
  }
  if (!fs.existsSync(path.resolve(inPath))) {
    console.error(`[publish] FATAL: scored file not found: ${inPath}`);
    console.error('[publish] Run the scorer first with --out, e.g.:');
    console.error('[publish]   npx tsx scripts/advbench/score.ts --in data/advbench-raw.jsonl --out data/advbench-scored.jsonl --llm-judge');
    process.exit(1);
  }
  if (!dryRun && !secret) {
    console.error('[publish] FATAL: BENCH_SECRET not set. The publish endpoint requires it.');
    console.error('[publish] Set BENCH_SECRET (same value as the Vercel env var) or use --dry-run to preview.');
    process.exit(1);
  }

  const rows: ScoredRow[] = fs.readFileSync(path.resolve(inPath), 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) as ScoredRow; } catch { return {} as ScoredRow; } });

  const hasType = rows.some(r => r.type === 'harmful' || r.type === 'benign');
  const harmfulRows = hasType ? rows.filter(r => r.type === 'harmful') : rows;
  const benignRows  = hasType ? rows.filter(r => r.type === 'benign')  : [];

  const hasBare = harmfulRows.some(r => r.bare_verdict !== undefined);
  const bareFulfill = harmfulRows.filter(r => r.bare_verdict === 'FULFILL').length;
  const govFulfill  = harmfulRows.filter(r => r.governed_verdict === 'FULFILL').length;
  const hN = harmfulRows.length;

  const payloads: MetricPayload[] = [];

  // ASR (FULFILL rate over harmful prompts). bare arm omitted if not present.
  const bareASR = hasBare ? pct(bareFulfill, hN) : 0;
  const govASR  = pct(govFulfill, hN);
  payloads.push({
    benchmark: bench,
    run_date:  runDate,
    n_total:   hN,
    metric_name: 'ASR',
    bare_score: bareASR,
    governed_score: govASR,
    delta_pp: Number((govASR - bareASR).toFixed(1)),
    notes: hasBare ? notes : `${notes} [bare arm absent in scored file]`.trim(),
  });

  // Over-refusal (governed non-FULFILL rate over benign prompts) — JBB only.
  if (benignRows.length > 0) {
    const bN = benignRows.length;
    const govRefusedBenign = benignRows.filter(r => r.governed_verdict !== 'FULFILL').length;
    const bareRefusedBenign = benignRows.filter(r => r.bare_verdict !== undefined && r.bare_verdict !== 'FULFILL').length;
    const govOR  = pct(govRefusedBenign, bN);
    const bareOR = hasBare ? pct(bareRefusedBenign, bN) : 0;
    payloads.push({
      benchmark: bench,
      run_date:  runDate,
      n_total:   bN,
      metric_name: 'over_refusal',
      bare_score: bareOR,
      governed_score: govOR,
      delta_pp: Number((govOR - bareOR).toFixed(1)),
      notes: `benign split; ${notes}`.trim(),
    });
  }

  console.log('\n' + '='.repeat(58));
  console.log(`  PUBLISH — ${bench} (${runDate})`);
  console.log('='.repeat(58));
  for (const p of payloads) {
    console.log(`  ${p.metric_name.padEnd(13)} n=${p.n_total}  bare=${p.bare_score}%  governed=${p.governed_score}%  Δ=${p.delta_pp}pp`);
  }
  console.log('='.repeat(58));

  if (dryRun) {
    console.log('  --dry-run: payload below, nothing sent.\n');
    console.log(JSON.stringify(payloads, null, 2));
    return;
  }

  const url = `${endpoint}/api/benchmarks/publish`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify(payloads),
  })
    .then(async res => {
      const text = await res.text();
      if (!res.ok) {
        console.error(`[publish] HTTP ${res.status}: ${text.slice(0, 300)}`);
        process.exit(1);
      }
      console.log(`[publish] ✓ ${url}\n[publish] ${text}`);
    })
    .catch(e => {
      console.error('[publish] fatal:', String(e).slice(0, 200));
      process.exit(1);
    });
}
main();
