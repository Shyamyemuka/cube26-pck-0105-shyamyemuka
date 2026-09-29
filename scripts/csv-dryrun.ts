import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { parseOrderLines } from '../lib/ingest/parse-lines';
import { evaluate, OrderSnapshot } from '../lib/agent/rules';
import { VlmObservation } from '../lib/agent/schema';
import { DEFAULT_THRESHOLDS } from '../lib/agent/config';

interface CsvRow {
  record_id: string;
  unit_id: string;
  org_id: string;
  photo_refs: string;
  operator_id: string;
  captured_at: string;
  order_id: string;
  channel: string;
  order_lines: string;
  observed_in_box: string;
  operator_verdict: string;
}

export function runCsvDryrun(csvPath?: string) {
  const filePath = csvPath || path.resolve(process.cwd(), 'data/pack_sample.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`CSV file not found at ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  console.log(`\n========================================`);
  console.log(`CSV DRY RUN: ${records.length} records from ${path.basename(filePath)}`);
  console.log(`========================================\n`);

  let engineSealCount = 0;
  let engineStopCount = 0;
  let engineUncertainCount = 0;
  let operatorSealCount = 0;
  let operatorStopCount = 0;

  const operatorWrongRows: Array<{
    unit_id: string;
    order_id: string;
    order_lines: string;
    observed_in_box: string;
    engine_verdict: string;
    operator_verdict: string;
    discrepancies: string;
  }> = [];

  for (const row of records) {
    const orderLines = parseOrderLines(row.order_lines);
    const observedLines = parseOrderLines(row.observed_in_box);

    const observedMap = new Map<string, number>();
    for (const obs of observedLines) {
      observedMap.set(obs.sku, obs.qty);
    }

    const orderSkuSet = new Set(orderLines.map((l) => l.sku));

    // Construct synthetic observation
    const obsLines = orderLines.map((l) => {
      const observedQty = observedMap.get(l.sku) ?? 0;
      return {
        sku: l.sku,
        matched_item_visible: observedQty > 0,
        observed_qty: observedQty,
        count_confidence: 1.0,
        visibility: observedQty > 0 ? ('clear' as const) : ('not_seen' as const),
        photo_indexes: [0],
        evidence: `Observed ${observedQty} of ${l.sku}`,
      };
    });

    const unlistedItems = observedLines
      .filter((obs) => !orderSkuSet.has(obs.sku))
      .map((obs) => ({
        description: obs.sku,
        estimated_qty: obs.qty,
        closest_catalogue_sku: obs.sku,
        confidence: 1.0,
        photo_indexes: [0],
        evidence: `Unlisted item ${obs.sku} found in box`,
      }));

    const observation: VlmObservation = {
      photo_assessment: {
        usable: true,
        whole_box_visible: true,
        issues: [],
        notes: 'Dry-run synthetic observation from observed_in_box',
      },
      lines: obsLines,
      unlisted_items: unlistedItems,
      overall_notes: 'Dry-run observation',
    };

    const orderSnapshot: OrderSnapshot = {
      order_id: row.order_id,
      unit_id: row.unit_id,
      channel: row.channel,
      lines: orderLines.map((l) => ({ sku: l.sku, qty: l.qty })),
    };

    const result = evaluate(orderSnapshot, observation, DEFAULT_THRESHOLDS);

    // Track counts
    if (result.verdict === 'SEAL') engineSealCount++;
    else if (result.verdict === 'STOP_AND_FIX') engineStopCount++;
    else engineUncertainCount++;

    const normOpVerdict = row.operator_verdict.toLowerCase().trim();
    if (normOpVerdict === 'seal') operatorSealCount++;
    else operatorStopCount++;

    // Did operator differ from the deterministic truth?
    // In pack verification, if the engine determined defects (e.g. short qty or extra item),
    // and operator marked SEAL, that's an operator mistake (false seal by human).
    const engineNorm = result.verdict.toLowerCase();
    if (engineNorm !== normOpVerdict) {
      operatorWrongRows.push({
        unit_id: row.unit_id,
        order_id: row.order_id,
        order_lines: row.order_lines,
        observed_in_box: row.observed_in_box,
        engine_verdict: result.verdict,
        operator_verdict: row.operator_verdict,
        discrepancies: result.discrepancies.map((d) => `${d.type}(${d.sku || d.found_sku})`).join(', '),
      });
    }
  }

  console.log(`Engine Verdicts:   SEAL: ${engineSealCount} | STOP_AND_FIX: ${engineStopCount} | UNCERTAIN: ${engineUncertainCount}`);
  console.log(`Operator Verdicts: SEAL: ${operatorSealCount} | STOP_AND_FIX: ${operatorStopCount}`);
  console.log(`\nDiscrepant / Operator-Wrong Rows (${operatorWrongRows.length}):`);
  console.table(operatorWrongRows);

  const humanErrorRate = (operatorWrongRows.length / records.length) * 100;
  console.log(`\nHuman operator error rate on sample: ${humanErrorRate.toFixed(1)}%`);
  console.log(`Note: Dummy CSV data is synthetic. Proves rules engine and taxonomy format.\n`);

  return {
    engineSealCount,
    engineStopCount,
    engineUncertainCount,
    operatorSealCount,
    operatorStopCount,
    operatorWrongRows,
  };
}

if (process.argv[1]?.endsWith('csv-dryrun.ts')) {
  runCsvDryrun();
}
