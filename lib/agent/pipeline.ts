import { Thresholds, getThresholds } from './config';
import { VisionProvider, VisionImage } from './provider';
import { GeminiVisionProvider } from './gemini';
import { SYSTEM_PROMPT, PROMPT_VERSION, buildUserPrompt, OrderLineItem, CatalogueItemSummary } from './prompt';
import { evaluate, OrderSnapshot, Discrepancy, CheckResult, Verdict, Route } from './rules';
import { VlmObservation } from './schema';

export type ErrorCode =
  | 'timeout'
  | 'provider_error'
  | 'rate_limited'
  | 'invalid_output'
  | 'photo_missing'
  | 'hash_mismatch'
  | 'unknown';

export interface AgentResult {
  status: 'decided' | 'pending';
  verdict: Verdict | null;
  route: Route;
  checks: CheckResult[];
  discrepancies: Discrepancy[];
  observation: VlmObservation | null;
  trace: {
    model: string;
    prompt_version: string;
    thresholds: Thresholds;
    latency_ms: number;
    input_tokens?: number;
    output_tokens?: number;
    reference_images_used: number;
    photo_count: number;
    error_code?: ErrorCode;
  };
}

export interface RunAgentInput {
  order: OrderSnapshot;
  photos: VisionImage[];
  referenceImages?: Array<{ sku: string; image: VisionImage }>;
  otherCatalogueItems?: CatalogueItemSummary[];
  provider?: VisionProvider;
  thresholds?: Thresholds;
  timeoutMs?: number;
}

export async function runAgentPipeline(input: RunAgentInput): Promise<AgentResult> {
  const startTime = Date.now();
  const cfg = input.thresholds || getThresholds();
  const timeoutMs = input.timeoutMs || parseInt(process.env.VLM_TIMEOUT_MS || '20000', 10);
  const photoCount = input.photos.length;
  const refCount = input.referenceImages?.length || 0;

  if (photoCount === 0) {
    return {
      status: 'pending',
      verdict: null,
      route: 'PENDING',
      checks: [],
      discrepancies: [],
      observation: null,
      trace: {
        model: 'unknown',
        prompt_version: PROMPT_VERSION,
        thresholds: cfg,
        latency_ms: 0,
        reference_images_used: 0,
        photo_count: 0,
        error_code: 'photo_missing',
      },
    };
  }

  const provider = input.provider || new GeminiVisionProvider();

  const orderLineItems: OrderLineItem[] = input.order.lines.map((l) => ({
    sku: l.sku,
    qty: l.qty,
    name: l.name || l.sku,
    description: l.description || '',
    attributes: l.attributes || {},
    hasReferenceImage: input.referenceImages?.some((r) => r.sku === l.sku),
  }));

  const userPrompt = buildUserPrompt({
    orderId: input.order.order_id,
    channel: input.order.channel,
    lines: orderLineItems,
    otherCatalogueItems: input.otherCatalogueItems || [],
    photoCount,
  });

  const abortController = new AbortController();
  const timer = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  try {
    const vlmResult = await provider.observe(
      {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        boxPhotos: input.photos,
        referenceImages: input.referenceImages,
      },
      abortController.signal
    );

    clearTimeout(timer);

    // Deterministic rules engine (pure function)
    const evalOutput = evaluate(input.order, vlmResult.observation, cfg);

    return {
      status: 'decided',
      verdict: evalOutput.verdict,
      route: evalOutput.route,
      checks: evalOutput.checks,
      discrepancies: evalOutput.discrepancies,
      observation: vlmResult.observation,
      trace: {
        model: vlmResult.model,
        prompt_version: PROMPT_VERSION,
        thresholds: cfg,
        latency_ms: Date.now() - startTime,
        input_tokens: vlmResult.usage?.inputTokens,
        output_tokens: vlmResult.usage?.outputTokens,
        reference_images_used: refCount,
        photo_count: photoCount,
      },
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const latency_ms = Date.now() - startTime;
    const error = err as Error;

    let errorCode: ErrorCode = 'provider_error';
    if (abortController.signal.aborted || error.name === 'AbortError' || error.message.includes('timeout')) {
      errorCode = 'timeout';
    } else if (error.message.includes('invalid_output')) {
      errorCode = 'invalid_output';
    } else if (
      error.message.includes('429') ||
      error.message.includes('RESOURCE_EXHAUSTED') ||
      error.message.includes('rate_limit')
    ) {
      errorCode = 'rate_limited';
    }

    return {
      status: 'pending',
      verdict: null,
      route: 'PENDING',
      checks: [],
      discrepancies: [],
      observation: null,
      trace: {
        model: process.env.VLM_MODEL || 'gemini-3.5-flash',
        prompt_version: PROMPT_VERSION,
        thresholds: cfg,
        latency_ms,
        reference_images_used: refCount,
        photo_count: photoCount,
        error_code: errorCode,
      },
    };
  }
}
