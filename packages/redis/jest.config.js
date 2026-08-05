/** @type {import('jest').Config} */
module.exports = {
  ...require('@repo/jest-config/node'),
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  coverageThreshold: {
    global: {
      lines: 45,
      branches: 40,
      functions: 35,
      statements: 45,
    },
  },
}
