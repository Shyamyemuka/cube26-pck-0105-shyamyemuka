import fs from 'fs';
import path from 'path';
import { runAgentPipeline } from '../lib/agent/pipeline';
import { parseOrderLines } from '../lib/ingest/parse-lines';
import { OrderSnapshot } from '../lib/agent/rules';
import { VisionImage } from '../lib/agent/provider';
import { GeminiVisionProvider } from '../lib/agent/gemini';

function parseArgs(): {
  unitId: string;
  orderStr: string;
  photoPaths: string[];
  channel: string;
} {
  const args = process.argv.slice(2);
  let unitId = 'UNIT-CLI';
  let orderStr = '';
  let photoPaths: string[] = [];
  let channel = 'shopify';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--unit' && i + 1 < args.length) {
      unitId = args[++i];
    } else if (args[i] === '--order' && i + 1 < args.length) {
      orderStr = args[++i];
    } else if (args[i] === '--photos' && i + 1 < args.length) {
      photoPaths = args[++i].split(',').map((p) => p.trim());
    } else if (args[i] === '--channel' && i + 1 < args.length) {
      channel = args[++i];
    }
  }

  if (!orderStr) {
    console.error('Usage: npm run agent -- --unit <unitId> --photos <a.jpg,b.jpg> --order "SKU-A:1;SKU-B:2"');
    process.exit(1);
  }

  return { unitId, orderStr, photoPaths, channel };
}

export async function runAgentCli() {
  const { unitId, orderStr, photoPaths, channel } = parseArgs();
  const parsedLines = parseOrderLines(orderStr);

  const order: OrderSnapshot = {
    order_id: `ORD-${unitId}`,
    unit_id: unitId,
    channel,
    lines: parsedLines.map((l) => ({ sku: l.sku, qty: l.qty })),
  };

  const photos: VisionImage[] = [];

  for (const p of photoPaths) {
    const resolved = path.resolve(process.cwd(), p);
    if (fs.existsSync(resolved)) {
      const buffer = fs.readFileSync(resolved);
      const ext = path.extname(resolved).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      photos.push({
        path: resolved,
        bytesBase64: buffer.toString('base64'),
        mimeType,
      });
    } else {
      console.warn(`Warning: Photo file not found at ${resolved}. Using placeholder test image.`);
      photos.push({
        bytesBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        mimeType: 'image/png',
      });
    }
  }

  if (photos.length === 0) {
    console.warn('No photo paths passed. Using 1 placeholder photo.');
    photos.push({
      bytesBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      mimeType: 'image/png',
    });
  }

  // If no GEMINI_API_KEY, use mock provider for CLI testing
  let provider;
  if (!process.env.GEMINI_API_KEY) {
    console.log('[agent-cli] GEMINI_API_KEY not set; running with mock provider for headless CLI demo');
    provider = {
      observe: async () => ({
        rawText: '{}',
        observation: {
          photo_assessment: {
            usable: true,
            whole_box_visible: true,
            issues: [],
            notes: 'Clear CLI test box',
          },
          lines: parsedLines.map((l) => ({
            sku: l.sku,
            matched_item_visible: true,
            observed_qty: l.qty,
            count_confidence: 0.95,
            visibility: 'clear' as const,
            photo_indexes: [0],
            evidence: `CLI mock observed ${l.qty} of ${l.sku}`,
          })),
          unlisted_items: [],
          overall_notes: 'CLI mock observation',
        },
        model: 'cli-mock-model',
        latencyMs: 120,
      }),
    };
  } else {
    provider = new GeminiVisionProvider();
  }

  const result = await runAgentPipeline({
    order,
    photos,
    provider,
  });

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith('agent-cli.ts')) {
  runAgentCli().catch((err) => {
    console.error('Agent CLI failed:', err);
    process.exit(1);
  });
}
