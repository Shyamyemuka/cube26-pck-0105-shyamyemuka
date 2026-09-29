export function getOrgFromBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const rawConfig = process.env.EVIDENCE_API_TOKENS || 'tok_demo_alpha:org_demo_alpha,tok_demo_bravo:org_demo_bravo';
  const pairs = rawConfig.split(',').map((p) => p.trim());

  for (const pair of pairs) {
    const [cfgToken, cfgOrg] = pair.split(':').map((s) => s.trim());
    if (cfgToken && cfgOrg && cfgToken === token) {
      return cfgOrg;
    }
  }

  return null;
}
