---
name: route53-domain-check
description: Check domain availability with AWS Route 53 Domains. Use when the user wants available domain-name ideas, especially for shortlists of candidate names and TLDs.
---

# Route 53 Domain Check

Use this skill when a user wants domain ideas brainstormed and then verified with AWS Route 53.

## Workflow

1. Brainstorm a compact shortlist of clean, brandable names.
2. Verify them with:

```bash
aws route53domains check-domain-availability --region us-east-1 --domain-name example.com
```

3. For batches, loop over candidates and report the exact `Availability` result for each domain.

## Notes

- Route 53 domain checks run in `us-east-1`.
- Unless otherwise specified, try to come up with 3-10 strong domain options.
- If AWS network access fails due to sandbox, rerun with escalation. (Codex only)
