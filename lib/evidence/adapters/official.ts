import { PackEvidenceV1 } from '../schema';

/**
 * Adapter slot for official CUBE Buildathon cross-pod evidence contract
 * Once the organizers publish the official contract specification,
 * map pack_evidence.v1 fields to the organizer format here.
 */
export interface OfficialEvidenceRecord {
  [key: string]: unknown;
}

export function adaptToOfficialContract(record: PackEvidenceV1): OfficialEvidenceRecord {
  // Currently passthrough / superset until official contract schema is delivered
  return {
    ...record,
    _adapted_from: 'pack_evidence.v1',
  };
}
