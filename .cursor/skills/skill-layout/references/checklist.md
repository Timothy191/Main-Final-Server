# New Skill Checklist

- [ ] Folder name matches `name` in frontmatter (kebab-case)
- [ ] `description` is imperative, covers user intent, includes anti-triggers (≤1024 chars)
- [ ] `SKILL.md` is lean; details in `references/` (progressive disclosure)
- [ ] Gotchas section for project-specific surprises agents will get wrong
- [ ] Output template in `assets/` when format matters
- [ ] Scripts wrap real project commands (non-interactive, `--help`, structured stdout)
- [ ] README index updated (`.cursor/skills/README.md` or sibling)
- [ ] No policy fork from `AGENTS.md`
- [ ] Cross-links to related skills/agents tested
- [ ] `validate.sh` passes (`.cursor/standards/agent-skills/scripts/validate.sh`)
