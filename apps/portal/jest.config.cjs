// Jest requires NODE_ENV=test so React resolves its development build
// (which exports `act`). Without this, an inherited NODE_ENV=production
// causes `React.act is not a function` across all component tests.
process.env.NODE_ENV = "test";

module.exports = {
  testEnvironment: "jsdom",
  clearMocks: false,
  forceExit: true,
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@repo/contract$": "<rootDir>/../../packages/contract/index.ts",
    "^@repo/supabase/(.*)$": "<rootDir>/../../packages/supabase/src/$1",
    "^@repo/supabase$": "<rootDir>/../../packages/supabase/src/index.ts",
    "^@repo/redis$": "<rootDir>/../../packages/redis/src/index.ts",
    "^@repo/redis/(.*)$": "<rootDir>/../../packages/redis/src/$1",
    "^@repo/theme$": "<rootDir>/../../packages/theme/src/index.ts",
    "^@repo/theme/(.*)$": "<rootDir>/../../packages/theme/src/$1",
    "^@repo/ui/lib/(.*)$": "<rootDir>/../../packages/ui/lib/$1",
    "^@repo/ui/GlassCard$": "<rootDir>/../../packages/ui/src/components/GlassCard.tsx",
    "^@repo/ui/Pagination$": "<rootDir>/../../packages/ui/src/components/ui/pagination.tsx",
    "^@repo/ui/SecondaryButton$": "<rootDir>/../../packages/ui/src/components/SecondaryButton.tsx",
    "^@repo/ui/AcknowledgeButton$":
      "<rootDir>/../../packages/ui/src/components/AcknowledgeButton.tsx",
    "^@repo/ui/ShiftToggle$": "<rootDir>/../../packages/ui/src/components/ShiftToggle.tsx",
    "^@repo/ui/Checkbox$": "<rootDir>/../../packages/ui/src/components/Checkbox.tsx",
    "^@repo/ui/Input$": "<rootDir>/../../packages/ui/src/components/Input.tsx",
    "^@repo/ui/FormFields$": "<rootDir>/../../packages/ui/src/components/FormFields.tsx",
    "^@repo/ui/DepartmentLayout$":
      "<rootDir>/../../packages/ui/src/components/DepartmentLayout.tsx",
    "^@repo/ui/KPI$": "<rootDir>/../../packages/ui/src/components/KPI.tsx",
    "^@repo/ui/PageHeader$": "<rootDir>/../../packages/ui/src/components/PageHeader.tsx",
    "^@repo/ui/MacMenuBar$": "<rootDir>/../../packages/ui/src/components/MacMenuBar.tsx",
    "^@repo/ui/MacTitleBar$": "<rootDir>/../../packages/ui/src/components/MacTitleBar.tsx",
    "^@repo/ui/Logo$": "<rootDir>/../../packages/ui/src/components/Logo.tsx",
    "^@repo/utils$": "<rootDir>/../../packages/utils/src/index.ts",
    "^@repo/utils/(.*)$": "<rootDir>/../../packages/utils/src/$1",
    "^@repo/auth/ui$": "<rootDir>/../../packages/auth/ui/index.tsx",
    "^@repo/auth/data-access$": "<rootDir>/../../packages/auth/data-access/index.ts",
    "^@repo/auth/utils$": "<rootDir>/../../packages/auth/utils/index.ts",
    "^@repo/shared/data-access$": "<rootDir>/../../packages/shared/data-access/index.ts",
    "^@repo/shared/utils$": "<rootDir>/../../packages/shared/utils/index.ts",
    "^@repo/shared/hooks$": "<rootDir>/../../packages/shared/hooks/index.ts",
    "^@repo/ui/DataGrid$": "<rootDir>/../../packages/ui/src/components/ui/data-grid.tsx",
    "^@repo/ui/AnimatedList$": "<rootDir>/../../packages/ui/src/components/ui/animated-list.tsx",
    "^@repo/ui/EmptyState$": "<rootDir>/../../packages/ui/src/components/EmptyState.tsx",
    "^@repo/ui/Marquee$": "<rootDir>/../../packages/ui/src/components/Marquee.tsx",

    "^@repo/ui/AnimatedButton$": "<rootDir>/../../packages/ui/src/components/AnimatedButton.tsx",
    "^@repo/ui/(.*)$": "<rootDir>/../../packages/ui/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "proxy.ts",
    "!**/*.test.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/src.backup/**",
    "!**/src.backup/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      lines: 40,
      branches: 30,
      functions: 35,
      statements: 40,
    },
  },
};
