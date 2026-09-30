import { GoogleGenAI } from '@google/genai';
import { VisionProvider, VisionPromptInput, VisionObservationResult } from './provider';
import { VlmObservation, VlmObservationSchema, VLM_OBSERVATION_JSON_SCHEMA } from './schema';

export class GeminiVisionProvider implements VisionProvider {
  private client: GoogleGenAI | null = null;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.modelName = modelName || process.env.VLM_MODEL || 'gemini-3.5-flash';
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  async observe(
    input: VisionPromptInput,
    signal?: AbortSignal
  ): Promise<VisionObservationResult> {
    if (!this.client) {
      this.apiKey = process.env.GEMINI_API_KEY || '';
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const startTime = Date.now();

    // Build contents array: images followed by user prompt
    const parts: Array<Record<string, unknown>> = [];

    // Add box photos
    input.boxPhotos.forEach((photo, idx) => {
      parts.push({
        text: `--- BOX PHOTO ${idx} ---`,
      });
      parts.push({
        inlineData: {
          mimeType: photo.mimeType || 'image/jpeg',
          data: photo.bytesBase64,
        },
      });
    });

    // Add reference images (max 1 per SKU, cap 6)
    if (input.referenceImages && input.referenceImages.length > 0) {
      input.referenceImages.slice(0, 6).forEach((ref) => {
        parts.push({
          text: `REFERENCE for ${ref.sku}`,
        });
        parts.push({
          inlineData: {
            mimeType: ref.image.mimeType || 'image/jpeg',
            data: ref.image.bytesBase64,
          },
        });
      });
    }

    // Add user prompt text
    parts.push({
      text: input.userPrompt,
    });

    const config: Record<string, unknown> = {
      systemInstruction: input.systemPrompt,
      temperature: 0,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
      responseSchema: VLM_OBSERVATION_JSON_SCHEMA,
    };

    if (signal) {
      config.abortSignal = signal;
    }

    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: parts,
      config,
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text || '';

    // Clean potential markdown blocks
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanText);
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(`invalid_output: JSON parse error - ${err.message}`);
    }

    const validationResult = VlmObservationSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      throw new Error(
        `invalid_output: Schema validation failed - ${validationResult.error.message}`
      );
    }

    const usage = response.usageMetadata
      ? {
          inputTokens: response.usageMetadata.promptTokenCount,
          outputTokens: response.usageMetadata.candidatesTokenCount,
        }
      : undefined;

    return {
      rawText,
      observation: validationResult.data,
      usage,
      model: this.modelName,
      latencyMs,
    };
  }
}
