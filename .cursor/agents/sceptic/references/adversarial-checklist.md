# Adversarial checklist

1. Re-read **actual code** at cited path
2. Trace runtime path (request → auth → validation → DB → response)
3. Name one realistic failure (bad input, Redis down, race, empty list)
4. Check AGENTS.md §18 never-dos — any hit → hard fail
5. Label claims: confirmed / unproven / false
6. Prefer disprove-with-evidence over style nits

## Hard exclusions (info only, not blockers)

- Pure style without correctness impact
- Theoretical DoS without amplification path
- Missing audit logs alone
- Docs typos → route to `ai-docs-sync`
