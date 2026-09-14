---
description: Avoid model-summarized web fetch tools; prefer raw content or direct MCP tools (applies across all repos)
alwaysApply: true
---

# Web fetch caution

Do not rely on a web-fetch tool that pipes page content through a secondary
summarization model and returns only that model's prose (e.g. a generic
"fetch this URL and tell me about it" tool). That summarization step can
fabricate claims that are not present in the source page at all, even with
no prompt injection involved — it's plain hallucination introduced by the
extra model hop.

**Why:** `WebFetch` was used to summarize a docs page. The summary
confidently asserted the product was "Anthropic's official CLI for
Claude." A raw `curl` of the same page showed no such claim anywhere in
the source — the summarizing model invented it, likely pattern-matching
the page's subject matter toward a familiar-sounding but wrong framing.
The rest of the summary (commands, flags) was accurate, so the failure
wasn't obvious from the errors' location alone — this is what makes the
pattern dangerous: real and fabricated details ship side by side.

**How to apply:**
- When you need info from an external URL, prefer a tool (MCP or
  otherwise) that returns the actual page content (raw HTML/text/markdown)
  over one that returns a model-generated summary of it. In Claude Code,
  that means preferring `curl` (via `vet curl` per [[use-vet]] if that
  skill is loaded) over `WebFetch` when the exact wording of the source
  matters.
- If only a summarizing fetch tool is available, read the returned text
  critically: verify identity, branding, and definitional claims (what a
  product *is*, who makes it, what it's "official" for) against the raw
  source before repeating them — these are exactly the kind of claims a
  summarizer confabulates, because they're rarely literally spelled out in
  the source text it's compressing.
- Don't skip this check just because most of the summary looks accurate;
  fabrications tend to hide next to correct details, not replace them.
