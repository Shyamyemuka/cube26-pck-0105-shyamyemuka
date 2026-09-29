export const REASON_MESSAGES: Record<string, string> = {
  photo_unusable: 'Photo cannot be judged reliably. Whole box or contents not visible.',
  photo_quality: "Can't tell from this photo. Retake, or check by hand.",
  occluded: 'Item partially or fully occluded or hidden behind others.',
  cannot_count: 'Cannot count quantity reliably from this angle.',
  partial_view: 'Box cut off or not all contents are in frame.',
  low_confidence: 'Visual confidence too low to verify reliably.',
  catalogue_missing: 'Item is not recognized in seller catalogue.',
  items_stacked_hidden: 'Items appear stacked or hidden under packaging.',
};

export function formatReason(key: string, detail?: string): string {
  const base = REASON_MESSAGES[key] || key;
  return detail ? `${base} (${detail})` : base;
}
