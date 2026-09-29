import { z } from 'zod';

export const VisibilityEnum = z.enum(['clear', 'partial', 'occluded', 'not_seen']);
export type Visibility = z.infer<typeof VisibilityEnum>;

export const PhotoIssueEnum = z.enum([
  'blur',
  'dark',
  'glare',
  'box_cut_off',
  'items_stacked_hidden',
  'no_box_visible',
]);
export type PhotoIssue = z.infer<typeof PhotoIssueEnum>;

export const PhotoAssessmentSchema = z
  .object({
    usable: z.boolean(),
    whole_box_visible: z.boolean(),
    issues: z.array(PhotoIssueEnum),
    notes: z.string().max(200).default(''),
  })
  .strict();

export const LineObservationSchema = z
  .object({
    sku: z.string(),
    matched_item_visible: z.boolean(),
    observed_qty: z.number().int().nonnegative().nullable(),
    count_confidence: z.number().min(0).max(1),
    visibility: VisibilityEnum,
    photo_indexes: z.array(z.number().int().nonnegative()).default([]),
    evidence: z.string().max(160).default(''),
  })
  .strict();

export const UnlistedItemSchema = z
  .object({
    description: z.string().max(100),
    estimated_qty: z.number().int().positive().nullable(),
    closest_catalogue_sku: z.string().nullable().default(null),
    confidence: z.number().min(0).max(1),
    photo_indexes: z.array(z.number().int().nonnegative()).default([]),
    evidence: z.string().max(160).default(''),
  })
  .strict();

export const VlmObservationSchema = z
  .object({
    photo_assessment: PhotoAssessmentSchema,
    lines: z.array(LineObservationSchema),
    unlisted_items: z.array(UnlistedItemSchema).default([]),
    overall_notes: z.string().max(300).default(''),
  })
  .strict();

export type VlmObservation = z.infer<typeof VlmObservationSchema>;

// Gemini JSON schema definition for structured output
export const VLM_OBSERVATION_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    photo_assessment: {
      type: 'OBJECT',
      properties: {
        usable: { type: 'BOOLEAN' },
        whole_box_visible: { type: 'BOOLEAN' },
        issues: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            enum: ['blur', 'dark', 'glare', 'box_cut_off', 'items_stacked_hidden', 'no_box_visible'],
          },
        },
        notes: { type: 'STRING' },
      },
      required: ['usable', 'whole_box_visible', 'issues', 'notes'],
    },
    lines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          sku: { type: 'STRING' },
          matched_item_visible: { type: 'BOOLEAN' },
          observed_qty: { type: 'INTEGER', nullable: true },
          count_confidence: { type: 'NUMBER' },
          visibility: {
            type: 'STRING',
            enum: ['clear', 'partial', 'occluded', 'not_seen'],
          },
          photo_indexes: {
            type: 'ARRAY',
            items: { type: 'INTEGER' },
          },
          evidence: { type: 'STRING' },
        },
        required: [
          'sku',
          'matched_item_visible',
          'observed_qty',
          'count_confidence',
          'visibility',
          'photo_indexes',
          'evidence',
        ],
      },
    },
    unlisted_items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          description: { type: 'STRING' },
          estimated_qty: { type: 'INTEGER', nullable: true },
          closest_catalogue_sku: { type: 'STRING', nullable: true },
          confidence: { type: 'NUMBER' },
          photo_indexes: {
            type: 'ARRAY',
            items: { type: 'INTEGER' },
          },
          evidence: { type: 'STRING' },
        },
        required: [
          'description',
          'estimated_qty',
          'closest_catalogue_sku',
          'confidence',
          'photo_indexes',
          'evidence',
        ],
      },
    },
    overall_notes: { type: 'STRING' },
  },
  required: ['photo_assessment', 'lines', 'unlisted_items', 'overall_notes'],
};
