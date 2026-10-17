import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const statuses = ['passed', 'needs_adjustment', 'unverifiable'];
export function measure(rows) {
  const matrix = Object.fromEntries(statuses.map(s => [s, Object.fromEntries(statuses.map(t => [t, 0]))]));
  for (const row of rows) {
    if (!statuses.includes(row.expected) || !statuses.includes(row.predicted)) throw new Error('INVALID_STATUS');
    matrix[row.expected][row.predicted]++;
  }
  const errors = rows.filter(r => r.expected === 'needs_adjustment').length;
  const passedPredictions = rows.filter(r => r.predicted === 'passed').length;
  const falsePass = rows.filter(r => r.predicted === 'passed' && r.expected !== 'passed').length;
  const missed = errors - matrix.needs_adjustment.needs_adjustment;
  return { total: rows.length, confusion_matrix: matrix,
    exact_match_rate: rows.length ? rows.filter(r => r.expected === r.predicted).length / rows.length : null,
    false_pass_count: falsePass, false_pass_fraction_of_passes: passedPredictions ? falsePass / passedPredictions : null,
    missed_error_count: missed, missed_error_rate: errors ? missed / errors : null,
    error_to_pass_rate: errors ? matrix.needs_adjustment.passed / errors : null,
    abstention_rate: rows.length ? rows.filter(r => r.predicted === 'unverifiable').length / rows.length : null };
}

export function evaluate(manifest, predictions, catalog, directory) {
  if (!Array.isArray(manifest.samples) || !Array.isArray(predictions)) throw new Error('INVALID_MANIFEST');
  if (!manifest.samples.length) return { status: 'NOT_RUN_NO_REAL_LABELED_IMAGES', metrics: null, samples: 0, professionally_validated: false };
  const ids = new Set(), frames = new Map(), plantSplits = new Map(), evaluated = [];
  for (const s of manifest.samples) {
    if (!s.id || ids.has(s.id)) throw new Error('DUPLICATE_SAMPLE'); ids.add(s.id);
    if (s.origin !== 'real_photo' || !s.reviewer?.trim() || !s.labeled_at || !s.plant_session_id || !s.image_path) throw new Error('REAL_PHOTO_LABEL_REQUIRED');
    if (!['tuning', 'evaluation'].includes(s.split)) throw new Error('SPLIT_REQUIRED');
    if (plantSplits.has(s.plant_session_id) && plantSplits.get(s.plant_session_id) !== s.split) throw new Error('PLANT_SESSION_LEAKAGE');
    plantSplits.set(s.plant_session_id, s.split);
    const bytes = readFileSync(path.resolve(directory, s.image_path));
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== s.image_sha256) throw new Error('IMAGE_HASH_MISMATCH');
    const prior = frames.get(digest);
    if (prior && prior !== s.split) throw new Error('IMAGE_SPLIT_LEAKAGE');
    frames.set(digest, s.split);
    const sop = catalog.sops.find(p => p.id === s.sop_id && p.version === s.sop_version), step = sop?.steps.find(p => p.id === s.step_id);
    if (!step || step.mode !== 'visual') throw new Error('INVALID_VISUAL_STEP');
    const truth = s.criterion_labels;
    if (!truth || Object.keys(truth).length !== step.criteria.length || step.criteria.some(c => !statuses.includes(truth[c.id]))) throw new Error('INVALID_LABELS');
    if (s.split !== 'evaluation') continue;
    const matches = predictions.filter(p => p.sample_id === s.id);
    if (matches.length !== 1) throw new Error('MISSING_OR_DUPLICATE_PREDICTION');
    const p = matches[0];
    if (p.image_sha256 !== digest || p.sop_id !== s.sop_id || p.sop_version !== s.sop_version || p.result?.step_id !== step.id || !p.model?.trim() || !p.prompt_version?.trim()) throw new Error('PREDICTION_CONTEXT_MISMATCH');
    const result = p.result.criterion_results;
    if (!Array.isArray(result) || result.length !== step.criteria.length || new Set(result.map(c => c.criterion_id)).size !== result.length || step.criteria.some(c => !result.some(r => r.criterion_id === c.id && statuses.includes(r.status)))) throw new Error('INVALID_PREDICTION_CRITERIA');
    const aggregate = list => list.includes('needs_adjustment') ? 'needs_adjustment' : list.includes('unverifiable') ? 'unverifiable' : 'passed';
    evaluated.push({ id: s.id, plant: sop.plant, sop_id: sop.id, step_id: step.id, expected: aggregate(Object.values(truth)), predicted: aggregate(result.map(c => c.status)), criteria: result.map(c => ({ expected: truth[c.criterion_id], predicted: c.status })), latency_ms: p.latency_ms ?? null, cost: p.cost ?? null, model: p.model, prompt_version: p.prompt_version });
  }
  if (!evaluated.length) return { status: 'NOT_RUN_NO_EVALUATION_SPLIT', metrics: null, samples: 0, professionally_validated: false };
  const groups = key => Object.fromEntries([...new Set(evaluated.map(r => r[key]))].map(k => [k, measure(evaluated.filter(r => r[key] === k))]));
  const latency = evaluated.map(r => r.latency_ms).filter(n => Number.isFinite(n) && n >= 0).sort((a,b) => a-b);
  return { status: 'MEASURED_ON_USER_LABELED_REAL_PHOTOS', professionally_validated: false, samples: evaluated.length,
    metrics: measure(evaluated), per_criterion_metrics: measure(evaluated.flatMap(r => r.criteria)), by_plant: groups('plant'), by_sop: groups('sop_id'), by_step: groups('step_id'),
    model_prompt_pairs: [...new Set(evaluated.map(r => r.model + ' / ' + r.prompt_version))],
    latency_p95_ms: latency.length ? latency[Math.ceil(latency.length * .95)-1] : null,
    costs: evaluated.map(r => r.cost), note: 'Chi phí không biết giữ null; số liệu không tự cấp phê duyệt SOP. Kiểm riêng từng model/prompt trước nghiệm thu.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [manifestFile, predictionFile, outputFile] = process.argv.slice(2);
  if (!manifestFile || !predictionFile || !outputFile) throw new Error('Usage: node scripts/evaluate-live-sop.mjs manifest.json predictions.json report.json');
  const catalog = JSON.parse(readFileSync(new URL('../apps/web/src/data/live-sops.json', import.meta.url), 'utf8'));
  const report = evaluate(JSON.parse(readFileSync(manifestFile, 'utf8')), JSON.parse(readFileSync(predictionFile, 'utf8')), catalog, path.dirname(path.resolve(manifestFile)));
  writeFileSync(outputFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, samples: report.samples }));
}
