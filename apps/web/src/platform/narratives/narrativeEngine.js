const computeNarrativeConfidence = (cityRow) => {
  const counts = cityRow?.audit?.counts;
  if (!counts) {
    return 0.55;
  }

  const total = (counts.verified ?? 0) + (counts.mixed ?? 0) + (counts.modeled ?? 0);
  if (total <= 0) {
    return 0.55;
  }

  const raw = ((counts.verified ?? 0) + (counts.mixed ?? 0) * 0.6 + (counts.modeled ?? 0) * 0.25) / total;
  return Number(Math.max(0.2, Math.min(0.98, raw)).toFixed(2));
};

const toCitationMap = (cityRow) => {
  const details = cityRow?.verifiedDetails ?? [];

  return details
    .map((detail, index) => ({
      claimId: detail.key ?? `claim-${index + 1}`,
      sourceRefs: Array.isArray(detail.sources) ? detail.sources : [],
    }))
    .filter((entry) => entry.sourceRefs.length > 0);
};

export const buildNarrativeBrief = (cityRow, positioning) => {
  const strengths = positioning?.strengths ?? [];
  const tradeoffs = positioning?.tradeoffs ?? [];

  const leadingStrength = strengths[0] ?? 'balanced strategic fundamentals';
  const leadingTradeoff = tradeoffs[0] ?? 'evidence gaps in select indicators';
  const confidence = computeNarrativeConfidence(cityRow);

  return {
    cityId: cityRow.key,
    summary:
      `${cityRow.city} currently shows strength in ${leadingStrength}. `
      + `Primary friction appears in ${leadingTradeoff}. `
      + 'This narrative is generated from deterministic scoring and verification inputs.',
    confidence,
    citationMap: toCitationMap(cityRow),
  };
};
