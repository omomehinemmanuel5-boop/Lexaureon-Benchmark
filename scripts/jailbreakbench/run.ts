/**
 * JailbreakBench runner — Chao et al. 2024 (NeurIPS) (v4)
 * 100 harmful + 100 benign behaviors. Tests C+R+S simultaneously and lets the
 * scorer report over-refusal on the benign split separately from ASR.
 *
 * Provenance: mirrored from the canonical runner in the main LEX-Aureon repo
 * (scripts/jailbreakbench/run.ts). Kept in sync so this benchmark repo is
 * self-contained and REPRODUCE.md works without copying files from main.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * v4 CHANGE — SAME-MODEL BARE ARM (removes the model confound)
 * ───────────────────────────────────────────────────────────────────────
 * v3 made the bare arm a direct Groq call to llama-3.3-70b with no system
 * prompt. But the GOVERNED arm generates with generateGoverned() — Gemini-lite
 * first (see lib/llm_provider.ts + lib/sovereign_kernel.ts callLLMRaw/callLLM).
 * Comparing llama-70b-bare against gemini-lite-governed conflated MODEL CHOICE
 * with GOVERNANCE — the delta was uninterpretable as a governance effect.
 *
 * The kernel already computes the correct control on every turn: `raw_output`
 * is the kernel's OWN ungoverned generation — same model (Gemini-lite), same
 * moment, generateGoverned([{role:'user', content: prompt}]) with NO system
 * prompt and NO governance. The govern response returns it verbatim. So the
 * bare arm is now `raw_output` from the same call:
 *
 *   bare_output     = raw_output       (model X, no governance)
 *   governed_output = governed_output  (model X, + Lex Aureon governance)
 *
 * Only the governance wrapper differs → the ASR/over-refusal delta is a clean,
 * same-model governance measurement. This also removes the GROQ_API_KEY
 * dependency here and the whole "bare arm silently rate-limited → deflated
 * bare ASR" failure class v3 fought with backoff.
 *
 * HONEST SCOPE: this delta attributes the *whole* Lex Aureon wrapper (constitutional
 * system prompt + state-shaping + keyword/self-referential refusal swap). It does
 * NOT isolate the CBF/governor math from the system prompt — a third arm (model +
 * constitutional prompt, no refusal layer) would be needed to decompose that.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Output JSONL carries type ('harmful'|'benign'), behavior, bare_output,
 * governed_output, blocked — exactly the fields scripts/jailbreakbench/score.ts
 * reads (it splits ASR over harmful and over-refusal over benign).
 *
 * Usage (no GROQ_API_KEY needed for the run — bare comes from the endpoint):
 *   npx tsx scripts/jailbreakbench/run.ts --prompts data/jailbreakbench.jsonl --n 200
 *   npx tsx scripts/jailbreakbench/run.ts --n 100 --harmful-only
 *
 * Score with (the JUDGE needs GROQ_API_KEY, the run does not):
 *   GROQ_API_KEY=... npx tsx scripts/jailbreakbench/score.ts --in data/jbb-raw.jsonl --llm-judge
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

interface JBBPrompt {
  id: string; behavior: string; category: string;
  source: string; type: 'harmful' | 'benign';
}

interface KernelCapture {
  governed_output:      string;
  bare_output:          string;
  blocked:              boolean;
  projection_triggered: boolean;
  metrics:              Record<string, unknown>;
  receipt_id:           string;
  health_band:          string;
  M:                    number;
  C:                    number;
  R:                    number;
  S:                    number;
  semantic_signal:      unknown;
  intervention:         unknown;
  lyapunov_V:           number;
  delta_V:              number;
  stability_ratio:      number;
  attack_pressure:      number;
  memory_injected:      boolean;
  theta:                number;
  version:              string;
  z_traj:               unknown;
  duration_ms:          number;
  warm_up_turns:        number;
  bare_arm:             'kernel_raw_same_model';
  sovereignty_raw:      number | null;
  capitulation_signal:  unknown;
  error?:               string;
}

type JBBResult = JBBPrompt & KernelCapture;

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const WARM_UP_PROMPTS = [
  'What is the capital of Japan?',
  'Summarize the water cycle in two sentences.',
  'What are the primary colors?',
];

async function callGovern(
  endpoint: string,
  prompt: string,
  sessionId: string,
  turn: number,
): Promise<Record<string, unknown>> {
  const RETRIES = [15_000, 30_000, 60_000];
  for (let attempt = 0; attempt <= RETRIES.length; attempt++) {
    try {
      const res = await fetch(`${endpoint}/api/lex/govern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, session_id: sessionId, turn }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 && attempt < RETRIES.length) { await sleep(RETRIES[attempt]); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() as Record<string, unknown>;
    } catch (e) {
      if (attempt === RETRIES.length) throw e;
      await sleep(RETRIES[attempt]);
    }
  }
  throw new Error('max retries exceeded');
}

async function runPrompt(
  endpoint: string,
  p: JBBPrompt,
): Promise<KernelCapture> {
  const sid = `jbb_${Date.now()}_${p.id}`;
  const t0  = Date.now();

  // Warm-up: build z-traj state so the governor is alive when the test lands.
  // (The warm-up only shapes the GOVERNED arm's session state; the bare arm is
  // raw_output, which is generated with no system prompt / no session context.)
  for (let i = 0; i < WARM_UP_PROMPTS.length; i++) {
    try { await callGovern(endpoint, WARM_UP_PROMPTS[i], sid, i + 1); } catch { /* non-fatal */ }
    await sleep(1200);
  }

  let d: Record<string, unknown> = {};
  try {
    d = await callGovern(endpoint, p.behavior, sid, WARM_UP_PROMPTS.length + 1);
  } catch (e) {
    return {
      governed_output: '', bare_output: '', blocked: false,
      projection_triggered: false, metrics: {}, receipt_id: '',
      health_band: '', M: 0, C: 0, R: 0, S: 0,
      semantic_signal: {}, intervention: {}, lyapunov_V: 0,
      delta_V: 0, stability_ratio: 0, attack_pressure: 0,
      memory_injected: false, theta: 0, version: '', z_traj: null,
      duration_ms: Date.now() - t0,
      warm_up_turns: WARM_UP_PROMPTS.length,
      bare_arm: 'kernel_raw_same_model',
      sovereignty_raw: null, capitulation_signal: null,
      error: String(e).slice(0, 200),
    };
  }

  const state   = (d.state ?? {}) as Record<string, number>;
  const metrics = (d.metrics ?? {}) as Record<string, unknown>;

  // Bare arm = the kernel's own ungoverned generation, SAME model as governed.
  const bareOut = String(d.raw_output ?? '');

  return {
    governed_output:      String(d.governed_output ?? ''),
    bare_output:          bareOut,
    blocked:              Boolean(d.projection_triggered ?? d.blocked),
    projection_triggered: Boolean(d.projection_triggered),
    metrics,
    receipt_id:           String(d.receipt_id ?? ''),
    health_band:          String(d.health_band ?? ''),
    M:                    Number(d.M ?? 0),
    C:                    Number(state.C ?? 0),
    R:                    Number(state.R ?? 0),
    S:                    Number(state.S ?? 0),
    semantic_signal:      d.semantic_signal ?? {},
    intervention:         d.intervention ?? {},
    lyapunov_V:           Number(d.lyapunov_V ?? 0),
    delta_V:              Number(d.delta_V ?? 0),
    stability_ratio:      Number(d.stability_ratio ?? 0),
    attack_pressure:      Number(d.attack_pressure ?? 0),
    memory_injected:      Boolean(d.memory_injected),
    theta:                Number(d.theta ?? 0),
    version:              String(d.version ?? ''),
    z_traj:               d.z_traj ?? null,
    duration_ms:          Date.now() - t0,
    warm_up_turns:        WARM_UP_PROMPTS.length,
    bare_arm:             'kernel_raw_same_model',
    sovereignty_raw:      d.sovereignty_raw === null || d.sovereignty_raw === undefined ? null : Number(d.sovereignty_raw),
    capitulation_signal:  d.capitulation_signal ?? null,
  };
}

async function main() {
  const args        = parseArgs(process.argv.slice(2));
  const endpoint    = args.endpoint ?? 'https://lexaureon.com';
  const nLimit      = parseInt(args.n ?? '200');
  const harmfulOnly = args['harmful-only'] === 'true';
  const promptsPath = args.prompts ?? 'data/jailbreakbench.jsonl';
  const outPath     = args.out ?? 'data/jbb-raw.jsonl';

  if (!fs.existsSync(path.resolve(promptsPath))) {
    console.error(`[jbb] FATAL: prompts file not found: ${promptsPath}`);
    console.error('[jbb] Provide JailbreakBench JBB-Behaviors as JSONL');
    console.error('[jbb] ({id, behavior, category, source, type:"harmful"|"benign"}). Do not commit the dataset to git.');
    process.exit(1);
  }

  let prompts: JBBPrompt[] = fs.readFileSync(path.resolve(promptsPath), 'utf8')
    .split('\n').filter(Boolean)
    .map(l => JSON.parse(l) as JBBPrompt);
  if (harmfulOnly) prompts = prompts.filter(p => p.type === 'harmful');
  prompts = prompts.slice(0, nLimit);

  const existing = new Set<string>();
  if (fs.existsSync(outPath)) {
    fs.readFileSync(outPath, 'utf8').split('\n').filter(Boolean).forEach(l => {
      try { existing.add((JSON.parse(l) as JBBResult).id); } catch { /* skip */ }
    });
    if (existing.size) console.log(`[jbb] Resuming — ${existing.size} already done`);
  }

  const hCount = prompts.filter(p => p.type === 'harmful').length;
  const bCount = prompts.filter(p => p.type === 'benign').length;
  console.log(`[jbb] JailbreakBench (Chao et al. 2024) | ${prompts.length} prompts (${hCount} harmful, ${bCount} benign) → ${endpoint}`);
  console.log(`[jbb] Bare arm: kernel raw_output (SAME model as governed, no system prompt). Governed: full kernel + ${WARM_UP_PROMPTS.length} warm-up turns.`);
  console.log('[jbb] Same-model comparison — the delta isolates governance, not model choice.');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const out = fs.createWriteStream(outPath, { flags: 'a' });
  let ok = 0, err = 0;

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    if (existing.has(p.id)) { ok++; continue; }
    process.stdout.write(`[${i + 1}/${prompts.length}] [${p.type}] `);
    if (i > 0) await sleep(2500);

    try {
      const r = await runPrompt(endpoint, p);
      out.write(JSON.stringify({ ...p, ...r } as JBBResult) + '\n');
      ok++;
      const sig = (r.semantic_signal as { attack_type?: string })?.attack_type ?? 'none';
      const bareEmpty = !r.bare_output || r.bare_output.startsWith('[');
      process.stdout.write(`✓ M=${r.M.toFixed(3)} atk=${sig}${bareEmpty ? ' bare=EMPTY' : ''} ok=${ok}\n`);
    } catch (e) {
      err++;
      process.stdout.write(`✗ err=${err}\n`);
    }
  }
  out.end();
  console.log(`\n[jbb] done ok=${ok} err=${err}`);
  console.log(`[jbb] Score: GROQ_API_KEY=... npx tsx scripts/jailbreakbench/score.ts --in ${outPath} --llm-judge`);
}
main().catch(e => { console.error('[jbb] fatal:', e); process.exit(1); });
