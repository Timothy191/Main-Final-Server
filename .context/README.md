# .context/ — Agent Fast-Boot Context Bundle

This directory implements the [llmstxt.org](https://llmstxt.org) standard for AI agent
fast-boot context, adapted for a local monorepo rather than a website.

## Contents

| File            | Standard                           | Purpose                                                       |
| --------------- | ---------------------------------- | ------------------------------------------------------------- |
| `llms.txt`      | [llmstxt.org](https://llmstxt.org) | Compact index — links to all canonical docs                   |
| `llms-full.txt` | [llmstxt.org](https://llmstxt.org) | Full concatenated context corpus for zero-roundtrip ingestion |
| `ONBOARD.md`    | Internal                           | 1-page fast-start for any new agent                           |

## Why llms.txt?

The `llms.txt` format (proposed by Jeremy Howard, 2024) is a community-adopted standard
for giving AI agents a machine-readable map of a project's documentation.
It uses Markdown with:

- An `<h1>` title
- A blockquote description
- Sections of links grouped by purpose

The `llms-full.txt` variant concatenates all linked documents into a single file
for agents with large context windows that want zero roundtrips.

## Update Policy

- Update `llms.txt` when a new canonical doc is added.
- Regenerate `llms-full.txt` using `scripts/gen-context.sh` (if available) or manually
  by concatenating the linked docs.
- `ONBOARD.md` should be reviewed after any major architectural change.
