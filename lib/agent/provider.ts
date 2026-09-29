import { VlmObservation } from './schema';

export interface VisionImage {
  path?: string;
  sha256?: string;
  bytesBase64: string;
  mimeType: string;
}

export interface VisionPromptInput {
  systemPrompt: string;
  userPrompt: string;
  boxPhotos: VisionImage[];
  referenceImages?: Array<{ sku: string; image: VisionImage }>;
}

export interface VisionObservationResult {
  rawText: string;
  observation: VlmObservation;
  usage?: { inputTokens?: number; outputTokens?: number };
  model: string;
  latencyMs: number;
}

export interface VisionProvider {
  observe(input: VisionPromptInput, signal?: AbortSignal): Promise<VisionObservationResult>;
}
