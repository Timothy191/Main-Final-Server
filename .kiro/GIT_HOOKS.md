# Git Hooks & Spec-Driven Workflow Integration

## Current Setup

The repository uses:

- **Husky 9.1.7** (git hooks manager)
- **lint-staged** (pre-commit formatting/linting)
- **commitlint** (commit message validation)

## Recommended Hook Enhancements

### Pre-Commit Hook (check-specs.js)

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = process.cwd()

// Get staged files
const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file))

// If multi-file change, check for specs
if (stagedFiles.length > 1) {
  const specsDir = path.join(root, '.kiro', 'specs')
  const specDirs = fs.existsSync(specsDir)
    ? fs.readdirSync(specsDir).filter((dir) => fs.statSync(path.join(specsDir, dir)).isDirectory())
    : []

  if (specDirs.length === 0) {
    console.error('\n❌ ERROR: Multi-file change requires spec-driven workflow.')
    console.error('   Create spec directory first: .kiro/specs/{feature-slug}/')
    console.error('   Follow AGENTS.md §1: Requirements → Design → Tasks')
    console.error('   See .kiro/templates/ for template files')
    process.exit(1)
  }
}

console.log('✅ Spec check passed (or single-file change)')
```

### Commit Message Hook (validate-spec-reference.js)

```javascript
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const commitMsgFile = process.argv[2]
const commitMsg = fs.readFileSync(commitMsgFile, 'utf8')

// Check if commit message references a spec
const specReference = commitMsg.match(/spec:([a-z0-9-]+)/i)
if (specReference) {
  const specSlug = specReference[1]
  const specDir = path.join(process.cwd(), '.kiro', 'specs', specSlug)

  if (!fs.existsSync(specDir)) {
    console.error(`\n❌ ERROR: Commit references non-existent spec: ${specSlug}`)
    console.error(`   Create .kiro/specs/${specSlug}/ first`)
    process.exit(1)
  }
}

console.log('✅ Spec reference check passed')
```

## Commit Message Format

Recommended format for spec-driven work:

```
type(scope): description

spec:feature-slug
task:1.2.3

- Reference spec directory .kiro/specs/feature-slug/
- Reference specific task from tasks.md
- Include link to design/requirements if helpful
```

Example:

```
feat(portal): add user profile editing

spec:user-profile
task:2.1.4

- Add profile form component with validation
- Implement Server Action for profile updates
- Add unit tests for form validation
```

## Quality Gates

### Before Commit

1. `pnpm quality` passes (lint + type-check + test + format)
2. Multi-file changes have specs in `.kiro/specs/`
3. Commit message follows conventional format

### After Commit

1. Spec directory updated with implementation notes
2. Tasks.md marked complete for implemented tasks
3. Documentation updated if needed

## Setup Instructions

1. Create hooks directory (if needed):

   ```bash
   mkdir -p .husky
   ```

2. Add pre-commit hook:

   ```bash
   echo '#!/usr/bin/env node\n' > .husky/pre-commit
   echo 'require("./.kiro/scripts/check-specs.js")' >> .husky/pre-commit
   chmod +x .husky/pre-commit
   ```

3. Add commit-msg hook:
   ```bash
   echo '#!/usr/bin/env node\n' > .husky/commit-msg
   echo 'require("./.kiro/scripts/validate-spec-reference.js") "$1"' >> .husky/commit-msg
   chmod +x .husky/commit-msg
   ```

## Notes

- Husky 9.1.7+ uses different configuration than older versions
- The `lint-staged` config in `package.json` handles formatting/linting
- `commitlint` handles commit message format validation
- Spec validation is an additional layer for quality assurance

## Integration Points

1. **Pre-commit**: Check if multi-file changes have specs
2. **Commit-msg**: Validate spec references in commit messages
3. **CI/CD**: Run `pnpm quality` and spec validation in pipeline
4. **Agent workflow**: Use `.kiro/templates/` and follow AGENTS.md §1-3
