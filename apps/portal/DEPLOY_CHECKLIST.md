# Deployment Checklist

## Pre-deployment

- [ ] Ensure you have the latest code (pull from git)
- [ ] Verify `.env` file exists and contains required variables
- [ ] Check that Node.js and pnpm are installed (use versions from `engines` in package.json if specified)
- [ ] Ensure any required services (database, Redis, etc.) are running and accessible

## Deployment Steps (handled by deploy.sh)

- [ ] Install dependencies (`pnpm install --frozen-lockfile`)
- [ ] Build the application (`pnpm build`)
- [ ] Start the server (`pnpm start` in background)
- [ ] Wait for server to be ready on port 3000
- [ ] Open login page in default browser (`http://localhost:3000/login`)

## Post-deployment Verification

- [ ] Confirm server process is running (check PID from script output)
- [ ] Verify login page opened automatically in browser
- [ ] Test login flow with valid credentials
- [ ] Navigate to a few key pages to ensure they load without errors
- [ ] Check browser console for JavaScript errors
- [ ] Review server logs for warnings or errors
- [ ] Run test suite (`pnpm test`) to ensure nothing is broken
- [ ] Validate environment-specific features (e.g., feature flags, external APIs)

## Rollback Plan (if needed)

- [ ] Stop the server (`kill <PID>`)
- [ ] Revert to previous commit or backup
- [ ] Repeat deployment steps with previous version

## Sign-off

- [ ] All checks passed
- [ ] Deployment approved by: ______________________
- [ ] Date: ______________________
