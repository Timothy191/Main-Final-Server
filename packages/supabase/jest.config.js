/** @type {import('jest').Config} */
module.exports = {
  ...require('@repo/jest-config/node'),
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 50,
      functions: 50,
      statements: 60,
    },
  },
}
