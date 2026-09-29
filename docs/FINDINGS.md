# FINDINGS — contradictions and gaps in the organiser material

**Placement:** Project /docs/FINDINGS.md · **Status:** FINAL (append new findings in `BUILD_LOG.md`)
The brief says: "A contradiction is a finding." Raise these with the organisers through the official channel. Do not silently choose one side.

| # | Finding | Evidence | Working assumption until answered |
|---|---------|----------|-----------------------------------|
| F1 | **Two different Round 2 workflows.** The upstream README (as fetched) describes a two-week build, a branch named after your GitHub username, work only inside `submissions/<username>/`, and PRs merged by organisers. The fork's README and `GITHUB-GUIDE.md` describe an individual build in your own fork, no PR-to-main, no participant folder. | upstream `README.md` vs fork `README.md`, `GITHUB-GUIDE.md` | Follow the **fork guide** (your fork, organise freely). Keep a copy of the customer/PR-FAQ docs under `docs/` and mirror in `submissions/Shyamyemuka/` only if organisers say the submission-guard applies. |
| F2 | **Resubmission.** The submission-rules screenshot says multiple resubmissions are allowed before the deadline; the README and `GITHUB-GUIDE.md` say "There is no resubmission" and the form closes permanently. | screenshot "7. Minimum Submission Requirements"; fork README; GITHUB-GUIDE §6 | **One shot.** Submit only when final. |
| F3 | **Scoring scale.** Fork README says Round 2 is scored out of 100 in five criteria; the screenshot shows Round 2 (100, seven criteria) + Round 3 (100, pod integration) = 200. The criteria counts differ (five vs seven). | fork README "Evaluation"; screenshot "8. Evaluation & Scoring Rubric" | Optimise for all five listed criteria and treat the seven-criterion rubric as a finer split of the same 100. Ask for the seven criteria. |
| F4 | **Evidence contract not available.** README says "use the official evidence contract provided by the organisers" but it is not in the repo. | fork README "Evidence and decision traceability" | Use `pack_evidence.v1` from `EVIDENCE_CONTRACT.md`, adapt when the official one arrives. |
| F5 | **Engineering rules vs new rubric.** `RULES.md` still lists PR-based repository rules (R1–R8) and engineering rules (tenancy, batching, fail-open, uncertain, look-up-rules), while the fork's rubric never names them. | `RULES.md` | Follow engineering rules 1–5 anyway (cheap, and "assessed" per RULES.md); ignore R1–R6 (PR mechanics) for the fork flow. |
| F6 | **Deliverables list differs.** Upstream README lists customer letter, PR/FAQ, one-pager, CLAUDE.md, build brief, build log, eval report; the fork README omits most of them. | both READMEs | Produce them anyway (already in this kit); they support "Problem Understanding" points. |
| F7 | **Build phase end unknown.** Guide says do not change code after the build phase ends, without giving the end time. | GITHUB-GUIDE §4 | Stop code commits by 1 Oct 12:00 IST; confirm with organisers. |
| F8 | **`submissions/_TEMPLATE` not inspected.** The folder exists in the fork but could not be opened during research. | fork file tree | Open it locally on Day 1; if it contains required templates, follow them and note here. |
| F9 | **Dummy CSV oddities to test for.** `operator_verdict` is "sometimes wrong on purpose"; `photo_refs` are placeholders; requirement flags and amounts are invented. | `data/README.md` | Use only for schema and rules-engine tests; never as vision ground truth. |

Log any more contradictions found during the build here as `F10+`, with date and how it was resolved.
