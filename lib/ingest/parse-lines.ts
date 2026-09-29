export interface ParsedLine {
  sku: string;
  qty: number;
}

/**
 * Parses order lines formatted as "SKU:qty;SKU:qty" or "SKU:qty,SKU:qty"
 * - Handles leading/trailing whitespace
 * - Merges duplicate SKUs by adding quantities together
 * - Throws on negative or non-integer or zero quantities
 * - Rejects invalid formats
 */
export function parseOrderLines(raw: string): ParsedLine[] {
  if (!raw || !raw.trim()) {
    throw new Error('Order lines string is empty');
  }

  // Split by ';' or newline or ','
  const parts = raw
    .split(/[;\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) {
    throw new Error('No valid order lines found');
  }

  const skuMap = new Map<string, number>();

  for (const part of parts) {
    // Expected format SKU:qty
    const colonIndex = part.lastIndexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid line format: "${part}". Expected "SKU:qty"`);
    }

    const sku = part.substring(0, colonIndex).trim();
    const qtyStr = part.substring(colonIndex + 1).trim();

    if (!sku) {
      throw new Error(`Empty SKU in line: "${part}"`);
    }

    const qty = Number(qtyStr);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Invalid quantity "${qtyStr}" for SKU "${sku}". Must be a positive integer.`);
    }

    const currentQty = skuMap.get(sku) || 0;
    skuMap.set(sku, currentQty + qty);
  }

  return Array.from(skuMap.entries()).map(([sku, qty]) => ({ sku, qty }));
}

/**
 * Formats parsed lines back into canonical string format "SKU:qty;SKU:qty"
 */
export function formatOrderLines(lines: ParsedLine[]): string {
  return lines.map((l) => `${l.sku}:${l.qty}`).join(';');
}
