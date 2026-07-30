# Domain Docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`** — read ADRs that touch the area being worked on. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files do not exist, proceed silently. The `/domain-modeling` skill creates them lazily when terms or decisions are resolved.

## File structure

This is a single-context repository:

```
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Use glossary vocabulary

When an issue, proposal, hypothesis, or test names a domain concept, use the term from `CONTEXT.md`. Do not drift to glossary synonyms marked `_Avoid_`.

If a needed concept is absent, reconsider whether it is needed or record the gap for `/domain-modeling`.

## Flag ADR conflicts

Surface any conflict with a relevant ADR explicitly rather than silently overriding it.
