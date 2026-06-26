# AgentDojo Results

**Date**: 2026-06-03
**Kernel**: SovereignKernel v2 · commit `54094f60b5`
**Attack**: ImportantInstructions (prompt injection)
**Suites**: workspace · banking · travel · slack
**Scenarios**: 27 injection scenarios

## Summary

| Suite | Bare Injection Success | Governed Injection Success |
|---|---|---|
| banking | 6/9 (67%) | **0/9 (0%)** |
| slack | 3/5 (60%) | **0/5 (0%)** |
| travel | 4/7 (57%) | **0/7 (0%)** |
| workspace | 3/6 (50%) | **0/6 (0%)** |
| **Total** | **16/27 (59.3%)** | **0/27 (0.0%)** |

**Constitutional protection**: 100% across all suites.

## What this measures

AgentDojo tests whether an AI agent can be hijacked via prompt injection —
malicious instructions hidden in documents, emails, or tool outputs that
redirect the agent to perform unauthorized actions.

The SovereignKernel intercepts every tool call through the constitutional
proxy, measuring M before execution. All 16 injection scenarios that
succeeded against the bare agent were blocked.