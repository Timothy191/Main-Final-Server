# Extended Alignment metrics

Not part of the /100 total. Required on every non-trivial score block.

## Code quality (0–10)

Separate from Quality gate (/15). Score smell/maintainability of the change:

| Score | Meaning                             |
| ----: | ----------------------------------- |
|  9–10 | Clean, minimal, matches conventions |
|   7–8 | Solid; minor nits                   |
|   5–6 | Works; duplication or unclear names |
|    ≤4 | Needs rework before merge           |

## Pro bar %

Map Alignment total → professional shipping band:

| Alignment | Pro bar % | Band                       |
| --------: | --------: | -------------------------- |
|    95–100 |   95–100% | Staff+ shipping bar        |
|     90–94 |    90–94% | Senior clean merge         |
|     80–89 |    80–89% | Senior mergeable with nits |
|     70–79 |    70–79% | Mid — needs rework         |
|       <70 |      <70% | Below bar                  |

Pro bar % equals Alignment total when using this table (1:1 mapping for honesty).

## Tokens saved

Progressive disclosure heuristic ([agentskills.io](https://agentskills.io/home)):

```
eager       ≈ catalog_count × 3000
progressive ≈ catalog_count × 75 + activated_count × 3000
saved       = eager - progressive
pct         = saved / eager × 100
```

Defaults if unknown: `catalog=12`, `activated=2` → ~91% savings. Cite specialist routing when unused agent collateral was not loaded.

## Recommended actions

Exactly **three** lines, highest ROI first. Prefer gap-ledger closes that raise Spec/Security/Verify.

## Adaptive next

One of: `observe` | `distill` | `patch` | `reuse` — plus target skill/rule path. Triggers `skill-self-improve` when criteria in that skill match.
