/** @type {import('jest').Config} */
module.exports = {
  ...require('@repo/jest-config/node'),
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
}
