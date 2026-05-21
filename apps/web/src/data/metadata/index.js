/**
 * src/data/metadata/index.js
 *
 * Re-export shim for the "metadata" tier.
 *
 * Metadata files contain descriptive, human-authored text:
 * city360 long-form briefs, audit records, source citations,
 * comparison narratives. They contain no scoring or computation.
 *
 * Migration path:
 *   Old: import { cityAuditMeta } from '../cityAuditMeta.js';
 *   New: import { cityAuditMeta } from '../metadata/index.js';
 *
 * Current status: shim only — source files still live at src/data/*.
 * Move them here when the next expansion wave is authored.
 */
export { cityAuditMeta }      from '../cityAuditMeta.js';
export { city360Meta }        from '../city360Meta.js';
export { citySourceMeta }     from '../citySourceMeta.js';
export { cityComparisonMeta } from '../cityComparisonMeta.js';
export { benchmarkSources }   from '../benchmarkSources.js';
