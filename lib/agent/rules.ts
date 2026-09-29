import { Thresholds } from './config';
import { VlmObservation } from './schema';

export type CheckStatus = 'PASS' | 'FAIL' | 'UNCERTAIN';
export type CheckScope = 'line' | 'global';

export interface CheckResult {
  id: string;
  scope: CheckScope;
  sku?: string;
  status: CheckStatus;
  reason: string;
  confidence?: number;
}

export type DiscrepancyType =
  | 'missing'
  | 'short_quantity'
  | 'over_quantity'
  | 'duplicate'
  | 'extra_item'
  | 'wrong_item';

export interface Discrepancy {
  type: DiscrepancyType;
  sku: string | null;
  found_sku?: string | null;
  expected_qty?: number;
  observed_qty?: number | null;
  detail: string;
}

export interface OrderSnapshotLine {
  sku: string;
  qty: number;
  name?: string;
  description?: string;
  attributes?: Record<string, unknown> | string;
}

export interface OrderSnapshot {
  order_id: string;
  unit_id: string;
  channel: string;
  lines: OrderSnapshotLine[];
  catalogue?: Array<{ sku: string; name: string; description?: string }>;
}

export type Verdict = 'SEAL' | 'STOP_AND_FIX' | 'UNCERTAIN';
export type Route = 'SEAL' | 'STOP_AND_FIX' | 'HOLD_RECAPTURE_OR_REVIEW' | 'PENDING';

export interface EvalOutput {
  checks: CheckResult[];
  discrepancies: Discrepancy[];
  verdict: Verdict;
  route: Route;
  reasons: string[];
}

export function evaluate(
  order: OrderSnapshot,
  obs: VlmObservation | null,
  cfg: Thresholds
): EvalOutput {
  const checks: CheckResult[] = [];
  const discrepancies: Discrepancy[] = [];
  const reasons: string[] = [];

  // Rule 0: Photo gate
  if (
    !obs ||
    !obs.photo_assessment ||
    obs.photo_assessment.usable === false ||
    obs.photo_assessment.issues?.includes('no_box_visible')
  ) {
    const photoReason =
      obs?.photo_assessment?.notes || 'Photo unusable or box not visible';
    checks.push({
      id: 'photo_quality',
      scope: 'global',
      status: 'FAIL',
      reason: photoReason,
    });
    reasons.push(`Photo unusable: ${photoReason}`);

    for (const line of order.lines) {
      checks.push({
        id: `line.presence.${line.sku}`,
        scope: 'line',
        sku: line.sku,
        status: 'UNCERTAIN',
        reason: 'photo_unusable',
      });
      checks.push({
        id: `line.quantity.${line.sku}`,
        scope: 'line',
        sku: line.sku,
        status: 'UNCERTAIN',
        reason: 'photo_unusable',
      });
    }

    checks.push({
      id: 'no_extra_items',
      scope: 'global',
      status: 'UNCERTAIN',
      reason: 'photo_unusable',
    });

    checks.push({
      id: 'no_wrong_items',
      scope: 'global',
      status: 'UNCERTAIN',
      reason: 'photo_unusable',
    });

    return {
      checks,
      discrepancies,
      verdict: 'UNCERTAIN',
      route: 'HOLD_RECAPTURE_OR_REVIEW',
      reasons,
    };
  }

  const { photo_assessment, lines: obsLines, unlisted_items: unlistedItems } = obs;
  const issues = photo_assessment.issues || [];
  const isWholeBoxVisible = photo_assessment.whole_box_visible;

  // Evaluate photo quality check
  const hasQualityIssues =
    !isWholeBoxVisible ||
    issues.some((issue) =>
      ['blur', 'dark', 'glare', 'box_cut_off', 'items_stacked_hidden'].includes(issue)
    );

  if (hasQualityIssues) {
    const issueList = issues.join(', ') || 'partial_view';
    checks.push({
      id: 'photo_quality',
      scope: 'global',
      status: 'UNCERTAIN',
      reason: `Photo quality issue: ${issueList}`,
    });
    reasons.push(`Photo quality issue: ${issueList}`);
  } else {
    checks.push({
      id: 'photo_quality',
      scope: 'global',
      status: 'PASS',
      reason: 'Box clearly visible, no major photo issues',
    });
  }

  // Map of observed lines by SKU
  const obsMap = new Map<string, (typeof obsLines)[number]>();
  for (const line of obsLines || []) {
    obsMap.set(line.sku, line);
  }

  // 5.2 Per order line checks
  for (const line of order.lines) {
    const obsLine = obsMap.get(line.sku);

    if (!obsLine) {
      // Line missing from observation completely
      checks.push({
        id: `line.presence.${line.sku}`,
        scope: 'line',
        sku: line.sku,
        status: 'UNCERTAIN',
        reason: 'Missing from observation output',
      });
      checks.push({
        id: `line.quantity.${line.sku}`,
        scope: 'line',
        sku: line.sku,
        status: 'UNCERTAIN',
        reason: 'Missing from observation output',
      });
      reasons.push(`Unverified line ${line.sku}`);
      continue;
    }

    const {
      matched_item_visible,
      observed_qty,
      count_confidence,
      visibility,
      evidence,
    } = obsLine;

    // Presence check
    let presenceStatus: CheckStatus = 'UNCERTAIN';
    let presenceReason = '';

    if (
      matched_item_visible &&
      count_confidence >= cfg.T_PRESENT &&
      ['clear', 'partial'].includes(visibility)
    ) {
      presenceStatus = 'PASS';
      presenceReason = `Present (${visibility}, conf ${count_confidence.toFixed(2)})`;
    } else if (
      !matched_item_visible &&
      count_confidence >= cfg.T_PRESENT &&
      isWholeBoxVisible &&
      !issues.includes('items_stacked_hidden') &&
      visibility === 'not_seen'
    ) {
      presenceStatus = 'FAIL';
      presenceReason = `Missing: ${line.sku} ×${line.qty} (clear full view, not seen, conf ${count_confidence.toFixed(2)})`;
      discrepancies.push({
        type: 'missing',
        sku: line.sku,
        expected_qty: line.qty,
        observed_qty: 0,
        detail: presenceReason,
      });
      reasons.push(presenceReason);
    } else {
      presenceStatus = 'UNCERTAIN';
      if (!isWholeBoxVisible || issues.includes('box_cut_off')) {
        presenceReason = `Uncertain presence for ${line.sku}: box cut off / partial view`;
      } else if (issues.includes('items_stacked_hidden') || visibility === 'occluded') {
        presenceReason = `Uncertain presence for ${line.sku}: occluded / items stacked`;
      } else {
        presenceReason = `Uncertain presence for ${line.sku}: low confidence (${count_confidence.toFixed(2)})`;
      }
      reasons.push(presenceReason);
    }

    checks.push({
      id: `line.presence.${line.sku}`,
      scope: 'line',
      sku: line.sku,
      status: presenceStatus,
      reason: presenceReason,
      confidence: count_confidence,
    });

    // Quantity check (evaluated only when presence = PASS)
    let qtyStatus: CheckStatus = 'UNCERTAIN';
    let qtyReason = '';

    if (presenceStatus !== 'PASS') {
      qtyStatus = presenceStatus;
      qtyReason = `Inherited from presence (${presenceStatus.toLowerCase()})`;
    } else {
      if (observed_qty === null || count_confidence < cfg.T_COUNT) {
        qtyStatus = 'UNCERTAIN';
        qtyReason = `Cannot count quantity reliably for ${line.sku} (conf ${count_confidence.toFixed(2)})`;
        reasons.push(qtyReason);
      } else if (observed_qty === line.qty) {
        qtyStatus = 'PASS';
        qtyReason = `Qty match: ${observed_qty}/${line.qty}`;
      } else if (observed_qty < line.qty) {
        qtyStatus = 'FAIL';
        qtyReason = `Short quantity: ${line.sku} expected ${line.qty}, observed ${observed_qty}`;
        discrepancies.push({
          type: 'short_quantity',
          sku: line.sku,
          expected_qty: line.qty,
          observed_qty,
          detail: qtyReason,
        });
        reasons.push(qtyReason);
      } else {
        // observed_qty > line.qty
        const discType: DiscrepancyType =
          line.qty === 1 ? 'duplicate' : 'over_quantity';
        qtyStatus = 'FAIL';
        qtyReason = `${discType === 'duplicate' ? 'Duplicate' : 'Over quantity'}: ${line.sku} expected ${line.qty}, observed ${observed_qty}`;
        discrepancies.push({
          type: discType,
          sku: line.sku,
          expected_qty: line.qty,
          observed_qty,
          detail: qtyReason,
        });
        reasons.push(qtyReason);
      }
    }

    checks.push({
      id: `line.quantity.${line.sku}`,
      scope: 'line',
      sku: line.sku,
      status: qtyStatus,
      reason: qtyReason,
      confidence: count_confidence,
    });
  }

  // 5.3 Global checks: no_extra_items
  const items = unlistedItems || [];
  const confidentExtras = items.filter((item) => item.confidence >= cfg.T_EXTRA);
  const unsureExtras = items.filter(
    (item) => item.confidence >= cfg.T_EXTRA_UNSURE && item.confidence < cfg.T_EXTRA
  );

  let extraStatus: CheckStatus = 'PASS';
  let extraReason = 'No extra items detected';

  if (confidentExtras.length > 0) {
    extraStatus = 'FAIL';
    extraReason = `${confidentExtras.length} extra unlisted item(s) detected`;
    for (const extra of confidentExtras) {
      discrepancies.push({
        type: 'extra_item',
        sku: null,
        found_sku: extra.closest_catalogue_sku || null,
        expected_qty: 0,
        observed_qty: extra.estimated_qty || 1,
        detail: `Extra item: ${extra.description} (conf ${extra.confidence.toFixed(2)})`,
      });
      reasons.push(`Extra item: ${extra.description} (conf ${extra.confidence.toFixed(2)})`);
    }
  } else if (unsureExtras.length > 0) {
    extraStatus = 'UNCERTAIN';
    extraReason = `Possible unlisted item(s) seen with moderate confidence: ${unsureExtras.map((e) => e.description).join(', ')}`;
    reasons.push(extraReason);
  } else if (!isWholeBoxVisible) {
    extraStatus = 'UNCERTAIN';
    extraReason = 'Cannot verify absence of extra items: box is not fully visible';
    reasons.push(extraReason);
  }

  checks.push({
    id: 'no_extra_items',
    scope: 'global',
    status: extraStatus,
    reason: extraReason,
  });

  // 5.3 Global checks: no_wrong_items (substitution detector)
  const orderSkus = new Set(order.lines.map((l) => l.sku));
  const missingDiscrepancies = discrepancies.filter((d) => d.type === 'missing');
  const extraDiscrepancies = discrepancies.filter((d) => d.type === 'extra_item');

  let hasSubstitution = false;

  // Check if missing line + extra item with closest_catalogue_sku not in order
  for (const missing of missingDiscrepancies) {
    const matchingExtraIdx = extraDiscrepancies.findIndex(
      (extra) => extra.found_sku && !orderSkus.has(extra.found_sku)
    );

    if (matchingExtraIdx !== -1) {
      const extra = extraDiscrepancies[matchingExtraIdx];
      // Relabel both as one wrong_item
      const wrongReason = `Wrong item: expected ${missing.sku}, found ${extra.found_sku}`;

      // Remove the separate missing and extra discrepancies
      const mIdx = discrepancies.indexOf(missing);
      if (mIdx !== -1) discrepancies.splice(mIdx, 1);
      const eIdx = discrepancies.indexOf(extra);
      if (eIdx !== -1) discrepancies.splice(eIdx, 1);
      extraDiscrepancies.splice(matchingExtraIdx, 1);

      discrepancies.push({
        type: 'wrong_item',
        sku: missing.sku,
        found_sku: extra.found_sku,
        expected_qty: missing.expected_qty,
        observed_qty: extra.observed_qty,
        detail: wrongReason,
      });

      reasons.push(wrongReason);
      hasSubstitution = true;
      break;
    }
  }

  let wrongItemsStatus: CheckStatus = 'PASS';
  let wrongItemsReason = 'No wrong item substitutions detected';

  if (hasSubstitution) {
    wrongItemsStatus = 'FAIL';
    wrongItemsReason = 'Substitution detected (expected item missing and unlisted catalogue item found)';
  } else if (extraStatus === 'UNCERTAIN') {
    wrongItemsStatus = 'UNCERTAIN';
    wrongItemsReason = 'Uncertain extra items may conceal wrong items';
  }

  checks.push({
    id: 'no_wrong_items',
    scope: 'global',
    status: wrongItemsStatus,
    reason: wrongItemsReason,
  });

  // 5.4 Verdict Precedence
  // 1. Any content check FAIL => STOP_AND_FIX
  const contentChecks = checks.filter((c) => c.id !== 'photo_quality');
  const hasContentFail = contentChecks.some((c) => c.status === 'FAIL');

  let verdict: Verdict;
  let route: Route;

  if (hasContentFail) {
    verdict = 'STOP_AND_FIX';
    route = 'STOP_AND_FIX';
  } else if (checks.some((c) => c.status !== 'PASS')) {
    // 2. Any non-PASS (including photo_quality) => UNCERTAIN
    verdict = 'UNCERTAIN';
    route = 'HOLD_RECAPTURE_OR_REVIEW';
  } else {
    // 3. All PASS => SEAL
    verdict = 'SEAL';
    route = 'SEAL';
  }

  return {
    checks,
    discrepancies,
    verdict,
    route,
    reasons,
  };
}
