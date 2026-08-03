---
allowed-tools: Bash(gh pr checkout:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr review:*), Bash(git diff:*), Bash(git log:*), Task, Read, Glob, Grep, AskUserQuestion
description: Review an open pull request against Arch-System's project rules and optionally post the review to GitHub
---

## Arguments

- `$ARGUMENTS`: The PR number or URL to review

## Your task

Review the specified pull request against **Arch-System's project rules** (not
generic style). The review is performed by the project-tuned `code-reviewer`
subagent, which encodes the design-system R2 rule, ACL single-source-of-truth,
`@repo/errors` contract, turbo-cache-masking verification, and the
doc/AGENT_TRACER change-index rules.

### Step 1: Checkout the PR

```
gh pr checkout $ARGUMENTS
```

### Step 2: Gather PR context

```
gh pr view $ARGUMENTS
gh pr diff $ARGUMENTS
```

Note the base branch and the files touched. The reviewer should focus on the
diff, but read surrounding context where the change is non-obvious.

### Step 3: Run the project code review

Use the Task tool with `subagent_type: "code-reviewer"` to perform the review.
Pass the PR diff, the list of changed files, and the base branch. The
`code-reviewer` agent will run `git diff` itself and return findings grouped by
severity (Critical / Important / Suggestions / Positive) with `file:line`
references and the specific project rule each violation breaks.

### Step 4: Present the review

Present the review to the user in this format:

```
## PR Review

**Recommendation**: APPROVE | REQUEST_CHANGES | COMMENT

### Summary
[1-2 sentence overview of what this PR does]

### Actionable Feedback (N items)
- [ ] `apps/portal/src/...:42` — [rule violated] + fix
- [ ] `packages/acl/src/index.ts:18` — [rule violated] + fix

### Detailed Review
[The code-reviewer agent's full findings, by severity]
```

Guidelines:
- Use checkboxes for actionable items so the author can track progress.
- Be specific with `file_path:line_number` references.
- Map every Important/Critical finding to the project rule it breaks
  (design-system R2, ACL single-source, errors contract, change-index, etc.) —
  not a generic "code quality" concern.

### Step 5: Ask about posting the review

Use AskUserQuestion to ask:
- Whether to post the review to GitHub
- Which review action: APPROVE, REQUEST_CHANGES, or COMMENT

### Step 6: Post the review (if approved)

Post with `gh pr review`, wrapping the Detailed Review in a collapsible
`<details>` tag to reduce noise:

```markdown
## PR Review

**Recommendation**: APPROVE | REQUEST_CHANGES | COMMENT

### Summary
[summary]

<details>
<summary>Actionable Feedback (N items)</summary>

- [ ] items...

</details>

<details>
<summary>Detailed Review</summary>

[full review content]

</details>
```

Flags: `--approve` | `--request-changes` | `--comment`.

**Important:** `gh pr review` produces no output on success. Run it exactly
once — do not retry on empty output; empty output means success.