# SUBMISSION_CHECKLIST

**Placement:** Project /docs/SUBMISSION_CHECKLIST.md · **Status:** FINAL
Deadline: **1 Oct 2026, 6:00 PM IST**. Form closes permanently. Aim to submit by **3:00 PM**. The brief text says there is **no resubmission**; one screenshot says you may resubmit before the deadline. Treat it as **one shot** (see `FINDINGS.md`).

## A. Repo (your fork: `Shyamyemuka/cube26-pck-0105-shyamyemuka`)
- [ ] Runnable agent code on `main` of the fork
- [ ] `README.md`: install, config, run, test inputs, limitations, assumptions, customer is hypothetical
- [ ] `ARCHITECTURE.md`: architecture, data flow, AI model usage, decision logic, **evidence trace**
- [ ] `docs/EVAL_REPORT.md` with numbers, FP/FN separate, UNCERTAIN rate, failure modes, kill-condition verdict
- [ ] `.env.example` present; **no** `.env*` with values; secret scan clean (`SECURITY.md` §4)
- [ ] `npm ci && npm run build && npm test` pass on a clean clone
- [ ] No plagiarised code; third-party libs listed in `TECH_STACK.md`
- [ ] Commits during the build phase; meaningful messages
- [ ] Repository is public (or accessible to organisers)

## B. Required artifacts (from the participant checklist)
- [ ] Runnable agent code pushed to the fork
- [ ] README.md and ARCHITECTURE.md completed
- [ ] Working demo video recorded and accessible (real product, not slides)
- [ ] UNCERTAIN cases handled properly; all API secrets removed

## C. Live checks (logged out / private window)
- [ ] Deployment URL loads and login works with the demo account
- [ ] Video link opens without sign-in
- [ ] LinkedIn post is public and links resolve

## D. LinkedIn post (mandatory) — template
> I spent the last few days building **Pack Manager** for the CUBE Buildathon — an agent that checks an open box against the order from one phone photo and says SEAL, STOP AND FIX, or UNCERTAIN before you tape it shut.
> What I measured on 50 unseen boxes, labelled by two people: {false-SEAL %}, {UNCERTAIN %}, agreement κ={x}. What it gets wrong: {top failure mode}. Kill condition {tripped / did not trip}.
> Built for small sellers and 3PLs with no scanner budget. Every decision leaves an evidence record with photos, checks, model version and overrides.
> Demo: {video link} · Repo: {fork link} · Live: {deployment link}
> @CodeQuesters @Sydon.AI #CUBEBuildathon #AI #Ecommerce #Warehouse
Do not claim accuracy you did not measure. Do not call the record tamper-proof.

## E. Submit
- [ ] Fork URL (not the organiser repo)
- [ ] Deployment URL
- [ ] Demo video URL
- [ ] LinkedIn post URL
- [ ] Screenshot of the form confirmation saved

## F. Contradictions to raise with organisers (see `FINDINGS.md`)
Raise before the deadline via the official channel; do not silently pick a side.
