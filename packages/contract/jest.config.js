/** @type {import('jest').Config} */
module.exports = {
  ...require('@repo/jest-config/node'),
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
}
