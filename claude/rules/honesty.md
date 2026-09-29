# Honesty rules (assessed by the organisers)

**Placement:** Project /.claude/rules/honesty.md

- Say what was built, not what it sounds like. We have a **content hash** and a **hash chain**. Never write tamper-proof, immutable, blockchain, anchored, guaranteed, audit-proof.
- "It works well" is not a result. A number needs a method beside it. Report per check, FP and FN separately, plus UNCERTAIN rate. An honest low number with named failure modes beats an unexplained high one.
- Overrides are data: keep original verdict, new verdict, reason, who, when. Never discard.
- Contradictions in organiser material are findings: log in `docs/FINDINGS.md` / `docs/BUILD_LOG.md`; do not silently pick a side.
- The customer is hypothetical (no interviews). The dummy CSV is synthetic. The eval set is staged household items. State all three wherever results appear.
- Do not tune on the held-out set; if you ever did, say so in the report.
- Do not present a demo path that only works because of a hidden manual step.
