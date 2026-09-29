import { describe, it, expect, vi } from 'vitest';
import { runAgentPipeline } from '../lib/agent/pipeline';
import { VisionProvider, VisionPromptInput, VisionObservationResult } from '../lib/agent/provider';
import { OrderSnapshot } from '../lib/agent/rules';

describe('Pipeline & Fail-Open Behavior', () => {
  const dummyOrder: OrderSnapshot = {
    order_id: 'ORD-100',
    unit_id: 'UNIT-100',
    channel: 'amazon_mfn',
    lines: [{ sku: 'SKU-A', qty: 1 }],
  };

  const dummyPhotos = [
    {
      bytesBase64: 'dGVzdA==',
      mimeType: 'image/jpeg',
    },
  ];

  it('succeeds with a valid observation from mock provider', async () => {
    const mockProvider: VisionProvider = {
      observe: vi.fn().mockResolvedValue({
        rawText: '{}',
        observation: {
          photo_assessment: {
            usable: true,
            whole_box_visible: true,
            issues: [],
            notes: 'Clear photo',
          },
          lines: [
            {
              sku: 'SKU-A',
              matched_item_visible: true,
              observed_qty: 1,
              count_confidence: 0.95,
              visibility: 'clear',
              photo_indexes: [0],
              evidence: 'Clearly seen',
            },
          ],
          unlisted_items: [],
          overall_notes: '',
        },
        model: 'test-mock-model',
        latencyMs: 150,
      } as VisionObservationResult),
    };

    const result = await runAgentPipeline({
      order: dummyOrder,
      photos: dummyPhotos,
      provider: mockProvider,
    });

    expect(result.status).toBe('decided');
    expect(result.verdict).toBe('SEAL');
    expect(result.route).toBe('SEAL');
    expect(result.trace.error_code).toBeUndefined();
    expect(mockProvider.observe).toHaveBeenCalledTimes(1);
  });

  it('fails open to status=pending when provider times out', async () => {
    const timeoutProvider: VisionProvider = {
      observe: vi.fn().mockImplementation((_input, signal?: AbortSignal) => {
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      }),
    };

    const result = await runAgentPipeline({
      order: dummyOrder,
      photos: dummyPhotos,
      provider: timeoutProvider,
      timeoutMs: 50, // 50ms quick timeout
    });

    expect(result.status).toBe('pending');
    expect(result.verdict).toBeNull();
    expect(result.route).toBe('PENDING');
    expect(result.trace.error_code).toBe('timeout');
  });

  it('fails open with invalid_output when provider returns invalid schema', async () => {
    const invalidProvider: VisionProvider = {
      observe: vi.fn().mockRejectedValue(new Error('invalid_output: Schema validation failed')),
    };

    const result = await runAgentPipeline({
      order: dummyOrder,
      photos: dummyPhotos,
      provider: invalidProvider,
    });

    expect(result.status).toBe('pending');
    expect(result.verdict).toBeNull();
    expect(result.route).toBe('PENDING');
    expect(result.trace.error_code).toBe('invalid_output');
  });

  it('fails open with provider_error when provider throws unexpected error', async () => {
    const errorProvider: VisionProvider = {
      observe: vi.fn().mockRejectedValue(new Error('Internal server error 500')),
    };

    const result = await runAgentPipeline({
      order: dummyOrder,
      photos: dummyPhotos,
      provider: errorProvider,
    });

    expect(result.status).toBe('pending');
    expect(result.verdict).toBeNull();
    expect(result.route).toBe('PENDING');
    expect(result.trace.error_code).toBe('provider_error');
  });

  it('handles empty photos by returning pending with photo_missing', async () => {
    const result = await runAgentPipeline({
      order: dummyOrder,
      photos: [],
    });

    expect(result.status).toBe('pending');
    expect(result.verdict).toBeNull();
    expect(result.trace.error_code).toBe('photo_missing');
  });
});
